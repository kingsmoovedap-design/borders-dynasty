const crypto = require('crypto');

const LOYALTY_TIERS = {
  BRONZE: {
    name: 'Bronze',
    level: 1,
    minPoints: 0,
    benefits: {
      dispatchPriority: 0,
      payoutSpeed: 'STANDARD',
      creditMultiplier: 1.0,
      rewardMultiplier: 1.0,
      maxCreditLimit: 5000,
      feeDiscount: 0
    }
  },
  SILVER: {
    name: 'Silver',
    level: 2,
    minPoints: 1000,
    benefits: {
      dispatchPriority: 5,
      payoutSpeed: 'STANDARD',
      creditMultiplier: 1.1,
      rewardMultiplier: 1.1,
      maxCreditLimit: 10000,
      feeDiscount: 0.05
    }
  },
  GOLD: {
    name: 'Gold',
    level: 3,
    minPoints: 5000,
    benefits: {
      dispatchPriority: 10,
      payoutSpeed: 'FAST',
      creditMultiplier: 1.25,
      rewardMultiplier: 1.25,
      maxCreditLimit: 25000,
      feeDiscount: 0.10
    }
  },
  PLATINUM: {
    name: 'Platinum',
    level: 4,
    minPoints: 15000,
    benefits: {
      dispatchPriority: 20,
      payoutSpeed: 'INSTANT',
      creditMultiplier: 1.5,
      rewardMultiplier: 1.5,
      maxCreditLimit: 50000,
      feeDiscount: 0.15
    }
  },
  DYNASTY_ELITE: {
    name: 'Dynasty Elite',
    level: 5,
    minPoints: 50000,
    benefits: {
      dispatchPriority: 30,
      payoutSpeed: 'INSTANT',
      creditMultiplier: 2.0,
      rewardMultiplier: 2.0,
      maxCreditLimit: 100000,
      feeDiscount: 0.20,
      ambassadorStatus: true,
      governanceRights: true
    }
  }
};

const POINT_ACTIONS = {
  LOAD_COMPLETED: { base: 100, description: 'Load delivered successfully' },
  ON_TIME_DELIVERY: { base: 50, description: 'On-time delivery bonus' },
  PERFECT_RATING: { base: 75, description: '5-star rating received' },
  DIFFICULT_LANE: { base: 150, description: 'Completed difficult lane' },
  HAZMAT_LOAD: { base: 200, description: 'Hazmat load completed safely' },
  REFERRAL: { base: 500, description: 'Driver referral accepted' },
  STREAK_7_DAYS: { base: 300, description: '7-day completion streak' },
  STREAK_30_DAYS: { base: 1500, description: '30-day completion streak' },
  SAFETY_MILESTONE: { base: 250, description: 'Safety milestone achieved' },
  TENURE_ANNIVERSARY: { base: 1000, description: 'Annual tenure bonus' },
  ZERO_CANCELLATION_MONTH: { base: 200, description: 'Zero cancellations this month' }
};

const driverLoyalty = new Map();
const pointsHistory = new Map();

function generateId(prefix = 'LYL') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function initializeDriver(driverId, initialData = {}) {
  const loyalty = {
    driverId,
    tier: 'BRONZE',
    totalPoints: 0,
    lifetimePoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    loadsCompleted: initialData.loadsCompleted || 0,
    onTimeRate: initialData.onTimeRate || 100,
    safetyScore: initialData.safetyScore || 100,
    cancellationRate: initialData.cancellationRate || 0,
    joinedAt: initialData.joinedAt || new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    streakStartDate: null,
    achievements: [],
    metadata: {}
  };
  
  driverLoyalty.set(driverId, loyalty);
  pointsHistory.set(driverId, []);
  
  return loyalty;
}

function getDriverLoyalty(driverId) {
  return driverLoyalty.get(driverId) || null;
}

function calculateTier(totalPoints) {
  if (totalPoints >= LOYALTY_TIERS.DYNASTY_ELITE.minPoints) return 'DYNASTY_ELITE';
  if (totalPoints >= LOYALTY_TIERS.PLATINUM.minPoints) return 'PLATINUM';
  if (totalPoints >= LOYALTY_TIERS.GOLD.minPoints) return 'GOLD';
  if (totalPoints >= LOYALTY_TIERS.SILVER.minPoints) return 'SILVER';
  return 'BRONZE';
}

function getTierBenefits(tier) {
  return LOYALTY_TIERS[tier]?.benefits || LOYALTY_TIERS.BRONZE.benefits;
}

function awardPoints(driverId, action, multiplier = 1, metadata = {}) {
  let loyalty = driverLoyalty.get(driverId);
  if (!loyalty) {
    loyalty = initializeDriver(driverId);
  }
  
  const pointAction = POINT_ACTIONS[action];
  if (!pointAction) {
    throw new Error(`Unknown point action: ${action}`);
  }
  
  const tierMultiplier = LOYALTY_TIERS[loyalty.tier]?.benefits?.rewardMultiplier || 1;
  const points = Math.floor(pointAction.base * multiplier * tierMultiplier);
  
  const previousTier = loyalty.tier;
  loyalty.totalPoints += points;
  loyalty.lifetimePoints += points;
  loyalty.lastActivityAt = new Date().toISOString();
  
  const newTier = calculateTier(loyalty.totalPoints);
  const tierUpgrade = newTier !== previousTier && LOYALTY_TIERS[newTier].level > LOYALTY_TIERS[previousTier].level;
  
  if (tierUpgrade) {
    loyalty.tier = newTier;
    loyalty.achievements.push({
      type: 'TIER_UPGRADE',
      from: previousTier,
      to: newTier,
      timestamp: new Date().toISOString()
    });
  }
  
  const historyEntry = {
    id: generateId('PTS'),
    action,
    description: pointAction.description,
    basePoints: pointAction.base,
    multiplier: multiplier * tierMultiplier,
    pointsAwarded: points,
    newTotal: loyalty.totalPoints,
    tier: loyalty.tier,
    tierUpgrade,
    timestamp: new Date().toISOString(),
    metadata
  };
  
  const history = pointsHistory.get(driverId) || [];
  history.push(historyEntry);
  pointsHistory.set(driverId, history);
  driverLoyalty.set(driverId, loyalty);
  
  return {
    success: true,
    pointsAwarded: points,
    newTotal: loyalty.totalPoints,
    tier: loyalty.tier,
    tierUpgrade,
    previousTier: tierUpgrade ? previousTier : null,
    benefits: getTierBenefits(loyalty.tier)
  };
}

function updateStreak(driverId, completed = true) {
  let loyalty = driverLoyalty.get(driverId);
  if (!loyalty) {
    loyalty = initializeDriver(driverId);
  }
  
  if (completed) {
    loyalty.currentStreak++;
    loyalty.loadsCompleted++;
    
    if (loyalty.currentStreak > loyalty.longestStreak) {
      loyalty.longestStreak = loyalty.currentStreak;
    }
    
    if (!loyalty.streakStartDate) {
      loyalty.streakStartDate = new Date().toISOString();
    }
    
    if (loyalty.currentStreak === 7) {
      awardPoints(driverId, 'STREAK_7_DAYS', 1, { streak: 7 });
    } else if (loyalty.currentStreak === 30) {
      awardPoints(driverId, 'STREAK_30_DAYS', 1, { streak: 30 });
    }
  } else {
    loyalty.currentStreak = 0;
    loyalty.streakStartDate = null;
  }
  
  loyalty.lastActivityAt = new Date().toISOString();
  driverLoyalty.set(driverId, loyalty);
  
  return loyalty;
}

function getPointsHistory(driverId, limit = 50) {
  const history = pointsHistory.get(driverId) || [];
  return history.slice(-limit).reverse();
}

function getLeaderboard(limit = 20) {
  const drivers = Array.from(driverLoyalty.values());
  return drivers
    .sort((a, b) => b.lifetimePoints - a.lifetimePoints)
    .slice(0, limit)
    .map((d, index) => ({
      rank: index + 1,
      driverId: d.driverId,
      tier: d.tier,
      totalPoints: d.totalPoints,
      lifetimePoints: d.lifetimePoints,
      loadsCompleted: d.loadsCompleted,
      currentStreak: d.currentStreak
    }));
}

function getTierStats() {
  const stats = {
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0,
    DYNASTY_ELITE: 0,
    totalDrivers: 0,
    totalPointsCirculating: 0
  };
  
  for (const loyalty of driverLoyalty.values()) {
    stats[loyalty.tier]++;
    stats.totalDrivers++;
    stats.totalPointsCirculating += loyalty.totalPoints;
  }
  
  return stats;
}

function calculateDispatchBonus(driverId) {
  const loyalty = driverLoyalty.get(driverId);
  if (!loyalty) return 0;
  
  return LOYALTY_TIERS[loyalty.tier]?.benefits?.dispatchPriority || 0;
}

function calculateCreditLimit(driverId, baseLimit) {
  const loyalty = driverLoyalty.get(driverId);
  if (!loyalty) return baseLimit;
  
  const multiplier = LOYALTY_TIERS[loyalty.tier]?.benefits?.creditMultiplier || 1;
  const maxLimit = LOYALTY_TIERS[loyalty.tier]?.benefits?.maxCreditLimit || 5000;
  
  return Math.min(baseLimit * multiplier, maxLimit);
}

function calculateFeeDiscount(driverId) {
  const loyalty = driverLoyalty.get(driverId);
  if (!loyalty) return 0;
  
  return LOYALTY_TIERS[loyalty.tier]?.benefits?.feeDiscount || 0;
}

function getAllDriverLoyalty() {
  return Array.from(driverLoyalty.values());
}

module.exports = {
  LOYALTY_TIERS,
  POINT_ACTIONS,
  initializeDriver,
  getDriverLoyalty,
  awardPoints,
  updateStreak,
  getPointsHistory,
  calculateTier,
  getTierBenefits,
  getLeaderboard,
  getTierStats,
  calculateDispatchBonus,
  calculateCreditLimit,
  calculateFeeDiscount,
  getAllDriverLoyalty
};
