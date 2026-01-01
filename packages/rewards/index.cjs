const crypto = require('crypto');

const REWARD_TYPES = {
  POINTS: 'POINTS',
  CREDIT_BONUS: 'CREDIT_BONUS',
  FEE_WAIVER: 'FEE_WAIVER',
  PRIORITY_DISPATCH: 'PRIORITY_DISPATCH',
  PAYOUT_BOOST: 'PAYOUT_BOOST',
  BADGE: 'BADGE'
};

const BADGES = {
  FIRST_DELIVERY: { id: 'FIRST_DELIVERY', name: 'First Mile', description: 'Completed first delivery', icon: '🚚', points: 100 },
  PERFECT_WEEK: { id: 'PERFECT_WEEK', name: 'Perfect Week', description: '7 on-time deliveries in a row', icon: '⭐', points: 300 },
  SAFETY_CHAMPION: { id: 'SAFETY_CHAMPION', name: 'Safety Champion', description: 'Maintained 100% safety score for 30 days', icon: '🛡️', points: 500 },
  REVENUE_KING: { id: 'REVENUE_KING', name: 'Revenue King', description: 'Generated $10,000+ in monthly revenue', icon: '👑', points: 750 },
  LOYALTY_LEGEND: { id: 'LOYALTY_LEGEND', name: 'Loyalty Legend', description: 'Active for 12+ months', icon: '🏆', points: 1000 },
  HAZMAT_HERO: { id: 'HAZMAT_HERO', name: 'Hazmat Hero', description: 'Completed 10 hazmat loads safely', icon: '☣️', points: 400 },
  LONG_HAUL_MASTER: { id: 'LONG_HAUL_MASTER', name: 'Long Haul Master', description: 'Completed 50 loads over 500 miles', icon: '🛣️', points: 600 },
  FIVE_STAR_DRIVER: { id: 'FIVE_STAR_DRIVER', name: 'Five Star Driver', description: 'Received 50 five-star ratings', icon: '🌟', points: 500 },
  EARLY_BIRD: { id: 'EARLY_BIRD', name: 'Early Bird', description: '20 deliveries ahead of schedule', icon: '🐦', points: 350 },
  NIGHT_OWL: { id: 'NIGHT_OWL', name: 'Night Owl', description: 'Completed 25 overnight deliveries', icon: '🦉', points: 400 },
  REFERRAL_CHAMPION: { id: 'REFERRAL_CHAMPION', name: 'Referral Champion', description: 'Referred 5 active drivers', icon: '🤝', points: 1500 },
  DYNASTY_FOUNDER: { id: 'DYNASTY_FOUNDER', name: 'Dynasty Founder', description: 'Joined during founding period', icon: '🏛️', points: 2000 }
};

const STREAKS = {
  DAILY_ACTIVE: { days: 7, reward: { type: REWARD_TYPES.POINTS, value: 300 } },
  WEEKLY_PERFECT: { days: 7, reward: { type: REWARD_TYPES.PAYOUT_BOOST, value: 0.02 } },
  MONTHLY_CHAMPION: { days: 30, reward: { type: REWARD_TYPES.CREDIT_BONUS, value: 500 } }
};

const driverRewards = new Map();
const rewardHistory = [];
const redemptionHistory = [];

function generateId(prefix = 'RWD') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function initializeDriverRewards(driverId) {
  const rewards = {
    driverId,
    rewardPoints: 0,
    lifetimePoints: 0,
    badges: [],
    activeBoosts: [],
    streaks: {
      currentDaily: 0,
      currentWeekly: 0,
      currentMonthly: 0
    },
    referralCount: 0,
    redemptions: [],
    lastActivity: new Date().toISOString()
  };
  
  driverRewards.set(driverId, rewards);
  return rewards;
}

function getDriverRewards(driverId) {
  return driverRewards.get(driverId) || null;
}

function awardReward(driverId, rewardType, value, reason, metadata = {}) {
  let rewards = driverRewards.get(driverId);
  if (!rewards) {
    rewards = initializeDriverRewards(driverId);
  }
  
  const rewardId = generateId('RWD');
  
  const rewardEntry = {
    id: rewardId,
    driverId,
    type: rewardType,
    value,
    reason,
    metadata,
    timestamp: new Date().toISOString()
  };
  
  switch (rewardType) {
    case REWARD_TYPES.POINTS:
      rewards.rewardPoints += value;
      rewards.lifetimePoints += value;
      break;
      
    case REWARD_TYPES.CREDIT_BONUS:
      rewards.activeBoosts.push({
        type: 'CREDIT',
        value,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      break;
      
    case REWARD_TYPES.FEE_WAIVER:
      rewards.activeBoosts.push({
        type: 'FEE_WAIVER',
        value,
        usesRemaining: metadata.uses || 1,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
      break;
      
    case REWARD_TYPES.PRIORITY_DISPATCH:
      rewards.activeBoosts.push({
        type: 'PRIORITY',
        value,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      break;
      
    case REWARD_TYPES.PAYOUT_BOOST:
      rewards.activeBoosts.push({
        type: 'PAYOUT',
        value,
        loadsRemaining: metadata.loads || 5,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      break;
  }
  
  rewards.lastActivity = new Date().toISOString();
  driverRewards.set(driverId, rewards);
  rewardHistory.push(rewardEntry);
  
  return rewardEntry;
}

function awardBadge(driverId, badgeId) {
  let rewards = driverRewards.get(driverId);
  if (!rewards) {
    rewards = initializeDriverRewards(driverId);
  }
  
  const badge = BADGES[badgeId];
  if (!badge) {
    throw new Error(`Unknown badge: ${badgeId}`);
  }
  
  if (rewards.badges.some(b => b.id === badgeId)) {
    return { success: false, message: 'Badge already earned' };
  }
  
  const badgeEntry = {
    ...badge,
    earnedAt: new Date().toISOString()
  };
  
  rewards.badges.push(badgeEntry);
  rewards.rewardPoints += badge.points;
  rewards.lifetimePoints += badge.points;
  rewards.lastActivity = new Date().toISOString();
  
  driverRewards.set(driverId, rewards);
  
  rewardHistory.push({
    id: generateId('BDG'),
    driverId,
    type: REWARD_TYPES.BADGE,
    value: badge.points,
    reason: `Earned badge: ${badge.name}`,
    metadata: { badgeId, badgeName: badge.name },
    timestamp: new Date().toISOString()
  });
  
  return { success: true, badge: badgeEntry, pointsAwarded: badge.points };
}

function updateStreak(driverId, streakType, increment = true) {
  let rewards = driverRewards.get(driverId);
  if (!rewards) {
    rewards = initializeDriverRewards(driverId);
  }
  
  const streakKey = `current${streakType.charAt(0).toUpperCase() + streakType.slice(1)}`;
  
  if (increment) {
    rewards.streaks[streakKey]++;
    
    for (const [name, config] of Object.entries(STREAKS)) {
      if (rewards.streaks[streakKey] >= config.days) {
        awardReward(driverId, config.reward.type, config.reward.value, `${name} streak bonus`, { streakDays: rewards.streaks[streakKey] });
      }
    }
  } else {
    rewards.streaks[streakKey] = 0;
  }
  
  rewards.lastActivity = new Date().toISOString();
  driverRewards.set(driverId, rewards);
  
  return rewards.streaks;
}

const REDEMPTION_OPTIONS = {
  PRIORITY_7_DAYS: { cost: 500, type: REWARD_TYPES.PRIORITY_DISPATCH, value: 10, description: '7-day priority dispatch boost' },
  PAYOUT_BOOST_5: { cost: 300, type: REWARD_TYPES.PAYOUT_BOOST, value: 0.02, description: '2% payout boost for 5 loads' },
  FEE_WAIVER_3: { cost: 400, type: REWARD_TYPES.FEE_WAIVER, value: 1, description: 'Fee waiver for 3 transactions' },
  CREDIT_BOOST_500: { cost: 750, type: REWARD_TYPES.CREDIT_BONUS, value: 500, description: '$500 credit limit increase' },
  CREDIT_BOOST_1000: { cost: 1200, type: REWARD_TYPES.CREDIT_BONUS, value: 1000, description: '$1,000 credit limit increase' }
};

function redeemReward(driverId, redemptionOption) {
  let rewards = driverRewards.get(driverId);
  if (!rewards) {
    return { success: false, error: 'Driver not found' };
  }
  
  const option = REDEMPTION_OPTIONS[redemptionOption];
  if (!option) {
    return { success: false, error: 'Unknown redemption option' };
  }
  
  if (rewards.rewardPoints < option.cost) {
    return { success: false, error: `Insufficient points. Need ${option.cost}, have ${rewards.rewardPoints}` };
  }
  
  rewards.rewardPoints -= option.cost;
  
  const redemption = {
    id: generateId('RDM'),
    driverId,
    option: redemptionOption,
    cost: option.cost,
    description: option.description,
    timestamp: new Date().toISOString()
  };
  
  rewards.redemptions.push(redemption);
  redemptionHistory.push(redemption);
  
  awardReward(driverId, option.type, option.value, `Redeemed: ${option.description}`, { redemptionId: redemption.id, uses: option.type === REWARD_TYPES.FEE_WAIVER ? 3 : undefined, loads: option.type === REWARD_TYPES.PAYOUT_BOOST ? 5 : undefined });
  
  rewards.lastActivity = new Date().toISOString();
  driverRewards.set(driverId, rewards);
  
  return { success: true, redemption, newBalance: rewards.rewardPoints };
}

function getActiveBoosts(driverId) {
  const rewards = driverRewards.get(driverId);
  if (!rewards) return [];
  
  const now = new Date();
  return rewards.activeBoosts.filter(boost => {
    if (new Date(boost.expiresAt) < now) return false;
    if (boost.usesRemaining !== undefined && boost.usesRemaining <= 0) return false;
    if (boost.loadsRemaining !== undefined && boost.loadsRemaining <= 0) return false;
    return true;
  });
}

function consumeBoost(driverId, boostType) {
  let rewards = driverRewards.get(driverId);
  if (!rewards) return null;
  
  const boostIndex = rewards.activeBoosts.findIndex(b => b.type === boostType);
  if (boostIndex === -1) return null;
  
  const boost = rewards.activeBoosts[boostIndex];
  
  if (boost.usesRemaining !== undefined) {
    boost.usesRemaining--;
    if (boost.usesRemaining <= 0) {
      rewards.activeBoosts.splice(boostIndex, 1);
    }
  } else if (boost.loadsRemaining !== undefined) {
    boost.loadsRemaining--;
    if (boost.loadsRemaining <= 0) {
      rewards.activeBoosts.splice(boostIndex, 1);
    }
  }
  
  driverRewards.set(driverId, rewards);
  return boost;
}

function getRewardHistory(filters = {}) {
  let history = [...rewardHistory];
  
  if (filters.driverId) {
    history = history.filter(r => r.driverId === filters.driverId);
  }
  if (filters.type) {
    history = history.filter(r => r.type === filters.type);
  }
  
  return history.slice(-(filters.limit || 100)).reverse();
}

function getRewardStats() {
  let totalPointsAwarded = 0;
  let totalBadgesAwarded = 0;
  let totalRedemptions = 0;
  let totalRedemptionValue = 0;
  
  for (const rewards of driverRewards.values()) {
    totalPointsAwarded += rewards.lifetimePoints;
    totalBadgesAwarded += rewards.badges.length;
    totalRedemptions += rewards.redemptions.length;
    totalRedemptionValue += rewards.redemptions.reduce((sum, r) => sum + r.cost, 0);
  }
  
  return {
    totalDrivers: driverRewards.size,
    totalPointsAwarded,
    totalPointsInCirculation: Array.from(driverRewards.values()).reduce((sum, r) => sum + r.rewardPoints, 0),
    totalBadgesAwarded,
    totalRedemptions,
    totalRedemptionValue,
    uniqueBadgeTypes: Object.keys(BADGES).length
  };
}

function checkBadgeEligibility(driverId, driverData) {
  const eligibleBadges = [];
  const rewards = driverRewards.get(driverId);
  const earnedBadges = rewards?.badges?.map(b => b.id) || [];
  
  if (!earnedBadges.includes('FIRST_DELIVERY') && driverData.loadsCompleted >= 1) {
    eligibleBadges.push('FIRST_DELIVERY');
  }
  
  if (!earnedBadges.includes('FIVE_STAR_DRIVER') && driverData.fiveStarRatings >= 50) {
    eligibleBadges.push('FIVE_STAR_DRIVER');
  }
  
  if (!earnedBadges.includes('SAFETY_CHAMPION') && driverData.safetyScore === 100 && driverData.safeDays >= 30) {
    eligibleBadges.push('SAFETY_CHAMPION');
  }
  
  if (!earnedBadges.includes('LOYALTY_LEGEND') && driverData.tenureMonths >= 12) {
    eligibleBadges.push('LOYALTY_LEGEND');
  }
  
  if (!earnedBadges.includes('HAZMAT_HERO') && driverData.hazmatLoads >= 10) {
    eligibleBadges.push('HAZMAT_HERO');
  }
  
  if (!earnedBadges.includes('REFERRAL_CHAMPION') && driverData.referrals >= 5) {
    eligibleBadges.push('REFERRAL_CHAMPION');
  }
  
  return eligibleBadges;
}

module.exports = {
  REWARD_TYPES,
  BADGES,
  STREAKS,
  REDEMPTION_OPTIONS,
  initializeDriverRewards,
  getDriverRewards,
  awardReward,
  awardBadge,
  updateStreak,
  redeemReward,
  getActiveBoosts,
  consumeBoost,
  getRewardHistory,
  getRewardStats,
  checkBadgeEligibility
};
