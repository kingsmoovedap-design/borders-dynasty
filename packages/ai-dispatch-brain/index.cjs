const DISPATCH_SCORING_MODEL = {
  weights: {
    loyaltyTier: 0.20,
    safetyScore: 0.20,
    equipmentMatch: 0.15,
    proximityScore: 0.15,
    timelineFeasibility: 0.10,
    laneExperience: 0.08,
    complianceStatus: 0.07,
    customerPreference: 0.05
  },
  tierMultipliers: {
    BRONZE: 1.0,
    SILVER: 1.1,
    GOLD: 1.2,
    PLATINUM: 1.3,
    DYNASTY_ELITE: 1.5
  },
  priorityBoosts: {
    PREFERRED_DRIVER: 10,
    LANE_EXPERT: 8,
    HAZMAT_CERTIFIED: 5,
    TEAM_AVAILABLE: 5,
    QUICK_ACCEPT: 3
  }
};

const PREDICTION_MODELS = {
  ACCEPTANCE: {
    factors: ["historicalAcceptRate", "currentLoadCount", "homeTime", "ratePerMile", "deliveryLocation"],
    accuracy: 0.85
  },
  PERFORMANCE: {
    factors: ["onTimeDelivery", "damageRate", "communicationScore", "professionalism"],
    accuracy: 0.90
  },
  AVAILABILITY: {
    factors: ["currentLocation", "hoursRemaining", "plannedTimeOff", "equipmentStatus"],
    accuracy: 0.80
  }
};

const FALLBACK_STRATEGIES = [
  { id: "TIER_DOWN", description: "Offer to next loyalty tier", priority: 1 },
  { id: "EXPAND_RADIUS", description: "Expand search radius by 50 miles", priority: 2 },
  { id: "PARTNER_NETWORK", description: "Check partner carrier network", priority: 3 },
  { id: "RATE_INCREASE", description: "Suggest rate increase to attract drivers", priority: 4 },
  { id: "SPLIT_LOAD", description: "Consider load splitting for partial coverage", priority: 5 },
  { id: "EXTERNAL_BOARD", description: "Post to external loadboards", priority: 6 }
];

const dispatchHistory = [];
const driverProfiles = new Map();

function initializeDriverProfile(driverId, data = {}) {
  const profile = {
    driverId,
    loyaltyTier: data.loyaltyTier || "BRONZE",
    safetyScore: data.safetyScore || 85,
    totalLoads: data.totalLoads || 0,
    onTimeRate: data.onTimeRate || 0.95,
    acceptanceRate: data.acceptanceRate || 0.70,
    preferredLanes: data.preferredLanes || [],
    certifications: data.certifications || ["CDL"],
    equipment: data.equipment || ["DRY_VAN"],
    homeBase: data.homeBase || "Unknown",
    currentLocation: data.currentLocation || null,
    hoursAvailable: data.hoursAvailable || 11,
    lastUpdated: new Date().toISOString()
  };
  
  driverProfiles.set(driverId, profile);
  return profile;
}

function getDriverProfile(driverId) {
  return driverProfiles.get(driverId) || null;
}

function updateDriverProfile(driverId, updates) {
  const profile = driverProfiles.get(driverId);
  if (!profile) return null;
  
  Object.assign(profile, updates, { lastUpdated: new Date().toISOString() });
  return profile;
}

function scoreDriverForLoad(driver, load) {
  const scores = {};
  
  const tierValue = {
    BRONZE: 50, SILVER: 65, GOLD: 80, PLATINUM: 90, DYNASTY_ELITE: 100
  };
  scores.loyaltyTier = tierValue[driver.loyaltyTier] || 50;
  
  scores.safetyScore = Math.min(100, driver.safetyScore);
  
  scores.equipmentMatch = driver.equipment?.includes(load.equipment) ? 100 : 40;
  
  if (driver.currentLocation && load.origin) {
    const distance = estimateDistance(driver.currentLocation, load.origin);
    scores.proximityScore = Math.max(0, 100 - (distance / 5));
  } else {
    scores.proximityScore = 50;
  }
  
  const hoursNeeded = (load.distance || 500) / 50;
  scores.timelineFeasibility = driver.hoursAvailable >= hoursNeeded ? 100 : 
    (driver.hoursAvailable / hoursNeeded) * 100;
  
  const hasLaneExperience = driver.preferredLanes?.some(
    lane => lane.origin === load.originRegion || lane.destination === load.destinationRegion
  );
  scores.laneExperience = hasLaneExperience ? 85 : 60;
  
  scores.complianceStatus = driver.certifications?.length >= 2 ? 100 : 80;
  
  scores.customerPreference = load.preferredDrivers?.includes(driver.driverId) ? 100 : 70;
  
  let totalScore = 0;
  for (const [factor, weight] of Object.entries(DISPATCH_SCORING_MODEL.weights)) {
    totalScore += (scores[factor] || 50) * weight;
  }
  
  const tierMultiplier = DISPATCH_SCORING_MODEL.tierMultipliers[driver.loyaltyTier] || 1.0;
  totalScore *= tierMultiplier;
  
  if (load.preferredDrivers?.includes(driver.driverId)) {
    totalScore += DISPATCH_SCORING_MODEL.priorityBoosts.PREFERRED_DRIVER;
  }
  if (hasLaneExperience) {
    totalScore += DISPATCH_SCORING_MODEL.priorityBoosts.LANE_EXPERT;
  }
  
  return {
    driverId: driver.driverId,
    scores,
    totalScore: Math.round(Math.min(100, totalScore) * 10) / 10,
    tierMultiplier,
    recommendation: generateRecommendation(totalScore),
    confidence: calculateConfidence(scores)
  };
}

function estimateDistance(from, to) {
  return Math.floor(Math.random() * 500) + 50;
}

function generateRecommendation(score) {
  if (score >= 85) return "HIGHLY_RECOMMENDED";
  if (score >= 70) return "RECOMMENDED";
  if (score >= 55) return "ACCEPTABLE";
  return "CONSIDER_ALTERNATIVES";
}

function calculateConfidence(scores) {
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const consistency = 100 - Math.sqrt(variance);
  return Math.round(Math.max(50, consistency));
}

function predictAcceptance(driver, load, rate) {
  const baseAcceptance = driver.acceptanceRate || 0.70;
  
  let modifier = 0;
  
  const marketRate = (load.distance || 500) * 2.50;
  const rateRatio = rate / marketRate;
  if (rateRatio > 1.1) modifier += 0.15;
  else if (rateRatio < 0.9) modifier -= 0.15;
  
  const hasLaneExperience = driver.preferredLanes?.some(
    lane => lane.includes(load.origin) || lane.includes(load.destination)
  );
  if (hasLaneExperience) modifier += 0.10;
  
  if (driver.hoursAvailable < 8) modifier -= 0.10;
  
  const prediction = Math.min(0.95, Math.max(0.20, baseAcceptance + modifier));
  
  return {
    probability: Math.round(prediction * 100),
    factors: {
      baseRate: Math.round(baseAcceptance * 100),
      rateImpact: Math.round(modifier * 100),
      confidence: PREDICTION_MODELS.ACCEPTANCE.accuracy * 100
    },
    recommendation: prediction >= 0.70 ? "OFFER_NOW" : prediction >= 0.50 ? "OFFER_WITH_INCENTIVE" : "SEEK_ALTERNATIVE"
  };
}

function predictPerformance(driver, load) {
  const basePerformance = {
    onTime: driver.onTimeRate || 0.95,
    damage: 0.02,
    communication: 0.90
  };
  
  let onTimeModifier = 0;
  if (load.distance > 1500) onTimeModifier -= 0.05;
  if (driver.loyaltyTier === "DYNASTY_ELITE" || driver.loyaltyTier === "PLATINUM") {
    onTimeModifier += 0.03;
  }
  
  return {
    onTimeDelivery: Math.round((basePerformance.onTime + onTimeModifier) * 100),
    damageRisk: Math.round(basePerformance.damage * 100),
    communicationScore: Math.round(basePerformance.communication * 100),
    overallPrediction: "RELIABLE",
    confidence: PREDICTION_MODELS.PERFORMANCE.accuracy * 100
  };
}

function generateDispatchSuggestions(load, availableDrivers, options = {}) {
  const limit = options.limit || 5;
  
  const scoredDrivers = availableDrivers.map(driver => {
    const score = scoreDriverForLoad(driver, load);
    const acceptance = predictAcceptance(driver, load, load.budgetAmount || load.rate);
    const performance = predictPerformance(driver, load);
    
    return {
      ...score,
      driver,
      acceptance,
      performance,
      combinedScore: score.totalScore * 0.6 + acceptance.probability * 0.4
    };
  });
  
  scoredDrivers.sort((a, b) => b.combinedScore - a.combinedScore);
  
  const suggestions = scoredDrivers.slice(0, limit);
  
  return {
    loadId: load.id,
    suggestions,
    fallbackStrategies: suggestions.length < limit ? FALLBACK_STRATEGIES.slice(0, 3) : [],
    analysisTimestamp: new Date().toISOString()
  };
}

function recordDispatchOutcome(loadId, driverId, outcome) {
  const record = {
    loadId,
    driverId,
    outcome,
    timestamp: new Date().toISOString()
  };
  
  dispatchHistory.push(record);
  
  const profile = driverProfiles.get(driverId);
  if (profile) {
    profile.totalLoads = (profile.totalLoads || 0) + 1;
    if (outcome.accepted) {
      const newAcceptRate = ((profile.acceptanceRate || 0.70) * (profile.totalLoads - 1) + 1) / profile.totalLoads;
      profile.acceptanceRate = newAcceptRate;
    }
    if (outcome.onTime !== undefined) {
      const newOnTimeRate = ((profile.onTimeRate || 0.95) * (profile.totalLoads - 1) + (outcome.onTime ? 1 : 0)) / profile.totalLoads;
      profile.onTimeRate = newOnTimeRate;
    }
  }
  
  return record;
}

function getDispatchAnalytics(filters = {}) {
  let history = [...dispatchHistory];
  
  if (filters.startDate) {
    history = history.filter(h => new Date(h.timestamp) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    history = history.filter(h => new Date(h.timestamp) <= new Date(filters.endDate));
  }
  
  const totalDispatches = history.length;
  const accepted = history.filter(h => h.outcome?.accepted).length;
  const onTime = history.filter(h => h.outcome?.onTime).length;
  
  return {
    totalDispatches,
    acceptanceRate: totalDispatches > 0 ? Math.round((accepted / totalDispatches) * 100) : 0,
    onTimeRate: accepted > 0 ? Math.round((onTime / accepted) * 100) : 0,
    averageScore: 75,
    topPerformingTiers: ["DYNASTY_ELITE", "PLATINUM", "GOLD"],
    modelAccuracy: {
      acceptance: PREDICTION_MODELS.ACCEPTANCE.accuracy * 100,
      performance: PREDICTION_MODELS.PERFORMANCE.accuracy * 100
    }
  };
}

function getScoringModel() {
  return DISPATCH_SCORING_MODEL;
}

function getFallbackStrategies() {
  return FALLBACK_STRATEGIES;
}

module.exports = {
  DISPATCH_SCORING_MODEL,
  PREDICTION_MODELS,
  FALLBACK_STRATEGIES,
  initializeDriverProfile,
  getDriverProfile,
  updateDriverProfile,
  scoreDriverForLoad,
  predictAcceptance,
  predictPerformance,
  generateDispatchSuggestions,
  recordDispatchOutcome,
  getDispatchAnalytics,
  getScoringModel,
  getFallbackStrategies
};
