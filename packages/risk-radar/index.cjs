const crypto = require('crypto');

const RISK_CATEGORIES = {
  WEATHER: 'WEATHER',
  LANE: 'LANE',
  DRIVER: 'DRIVER',
  COMPLIANCE: 'COMPLIANCE',
  MARKET: 'MARKET',
  OPERATIONAL: 'OPERATIONAL'
};

const RISK_LEVELS = {
  LOW: { level: 1, color: 'green', multiplier: 1.0 },
  MODERATE: { level: 2, color: 'yellow', multiplier: 1.15 },
  ELEVATED: { level: 3, color: 'orange', multiplier: 1.3 },
  HIGH: { level: 4, color: 'red', multiplier: 1.5 },
  CRITICAL: { level: 5, color: 'purple', multiplier: 2.0 }
};

const LANE_VOLATILITY = {
  'NORTH_AMERICA:GROUND': { baseVolatility: 0.15, seasonality: 0.1 },
  'NORTH_AMERICA:AIR': { baseVolatility: 0.20, seasonality: 0.15 },
  'NORTH_AMERICA:COURIER': { baseVolatility: 0.10, seasonality: 0.05 },
  'EUROPE:GROUND': { baseVolatility: 0.18, seasonality: 0.12 },
  'EUROPE:AIR': { baseVolatility: 0.22, seasonality: 0.18 },
  'EUROPE:OCEAN': { baseVolatility: 0.25, seasonality: 0.20 },
  'ASIA_PACIFIC:OCEAN': { baseVolatility: 0.30, seasonality: 0.25 },
  'ASIA_PACIFIC:AIR': { baseVolatility: 0.25, seasonality: 0.20 },
  'LATAM:GROUND': { baseVolatility: 0.22, seasonality: 0.15 }
};

const riskCache = new Map();
const riskHistory = [];

function generateId(prefix = 'RSK') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function calculateWeatherRisk(region, conditions = {}) {
  let score = 0;
  const factors = [];
  
  if (conditions.severeWeather) {
    score += 40;
    factors.push({ factor: 'Severe weather alert', impact: 40 });
  }
  
  if (conditions.temperature < 20 || conditions.temperature > 100) {
    score += 15;
    factors.push({ factor: 'Extreme temperature', impact: 15 });
  }
  
  if (conditions.precipitation > 0.5) {
    score += 20;
    factors.push({ factor: 'Heavy precipitation', impact: 20 });
  }
  
  if (conditions.visibility < 0.25) {
    score += 25;
    factors.push({ factor: 'Low visibility', impact: 25 });
  }
  
  if (conditions.windSpeed > 40) {
    score += 20;
    factors.push({ factor: 'High winds', impact: 20 });
  }
  
  return {
    category: RISK_CATEGORIES.WEATHER,
    score: Math.min(score, 100),
    factors,
    level: getRiskLevel(score)
  };
}

function calculateLaneRisk(origin, destination, mode) {
  const laneKey = `${origin}:${mode}`;
  const volatility = LANE_VOLATILITY[laneKey] || { baseVolatility: 0.20, seasonality: 0.10 };
  
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const seasonalFactor = Math.sin(dayOfYear * 2 * Math.PI / 365) * volatility.seasonality;
  const randomFactor = (Math.random() - 0.5) * 0.1;
  
  const totalVolatility = volatility.baseVolatility + seasonalFactor + randomFactor;
  const score = Math.min(Math.max(totalVolatility * 100, 0), 100);
  
  const factors = [
    { factor: `Base lane volatility: ${(volatility.baseVolatility * 100).toFixed(0)}%`, impact: volatility.baseVolatility * 100 },
    { factor: `Seasonal adjustment: ${(seasonalFactor * 100).toFixed(1)}%`, impact: Math.abs(seasonalFactor) * 100 }
  ];
  
  return {
    category: RISK_CATEGORIES.LANE,
    score: Math.round(score),
    factors,
    level: getRiskLevel(score),
    volatility: totalVolatility
  };
}

function calculateDriverRisk(driverData) {
  let score = 0;
  const factors = [];
  
  if (driverData.safetyScore < 80) {
    const impact = (80 - driverData.safetyScore) * 1.5;
    score += impact;
    factors.push({ factor: `Safety score: ${driverData.safetyScore}`, impact });
  }
  
  if (driverData.cancellationRate > 5) {
    const impact = driverData.cancellationRate * 2;
    score += impact;
    factors.push({ factor: `Cancellation rate: ${driverData.cancellationRate}%`, impact });
  }
  
  if (driverData.onTimeRate < 90) {
    const impact = (90 - driverData.onTimeRate) * 1.2;
    score += impact;
    factors.push({ factor: `On-time rate: ${driverData.onTimeRate}%`, impact });
  }
  
  if (driverData.loadsCompleted < 10) {
    score += 15;
    factors.push({ factor: 'New driver (low experience)', impact: 15 });
  }
  
  const tenureMonths = driverData.tenureMonths || 0;
  if (tenureMonths < 3) {
    score += 10;
    factors.push({ factor: 'Short tenure', impact: 10 });
  } else if (tenureMonths > 24) {
    score -= 10;
    factors.push({ factor: 'Experienced driver bonus', impact: -10 });
  }
  
  return {
    category: RISK_CATEGORIES.DRIVER,
    score: Math.min(Math.max(score, 0), 100),
    factors,
    level: getRiskLevel(Math.max(score, 0))
  };
}

function calculateComplianceRisk(complianceResult) {
  let score = 0;
  const factors = [];
  
  if (!complianceResult.compliant) {
    score += 50;
    factors.push({ factor: 'Compliance check failed', impact: 50 });
  }
  
  score += complianceResult.errors.length * 15;
  if (complianceResult.errors.length > 0) {
    factors.push({ factor: `${complianceResult.errors.length} compliance errors`, impact: complianceResult.errors.length * 15 });
  }
  
  score += complianceResult.warnings.length * 5;
  if (complianceResult.warnings.length > 0) {
    factors.push({ factor: `${complianceResult.warnings.length} compliance warnings`, impact: complianceResult.warnings.length * 5 });
  }
  
  if (complianceResult.riskMultiplier > 1) {
    const impact = (complianceResult.riskMultiplier - 1) * 30;
    score += impact;
    factors.push({ factor: 'Cargo risk multiplier', impact });
  }
  
  return {
    category: RISK_CATEGORIES.COMPLIANCE,
    score: Math.min(score, 100),
    factors,
    level: getRiskLevel(score)
  };
}

function calculateMarketRisk(region, mode, intelData = {}) {
  let score = 0;
  const factors = [];
  
  const rateData = intelData?.rates?.[region]?.[mode];
  if (rateData) {
    if (rateData.trend === 'UP') {
      score += 15;
      factors.push({ factor: 'Rising rates', impact: 15 });
    }
    if (Math.abs(rateData.change24h) > 5) {
      score += 20;
      factors.push({ factor: 'High rate volatility', impact: 20 });
    }
  }
  
  const demandData = intelData?.demand?.[region]?.[mode];
  if (demandData) {
    if (demandData.demandScore > 80) {
      score -= 10;
      factors.push({ factor: 'High demand (favorable)', impact: -10 });
    } else if (demandData.demandScore < 30) {
      score += 15;
      factors.push({ factor: 'Low demand', impact: 15 });
    }
  }
  
  return {
    category: RISK_CATEGORIES.MARKET,
    score: Math.min(Math.max(score, 0), 100),
    factors,
    level: getRiskLevel(Math.max(score, 0))
  };
}

function calculateOperationalRisk(loadData, operationalIntel = {}) {
  let score = 0;
  const factors = [];
  
  if (operationalIntel.portCongestion && loadData.mode === 'OCEAN') {
    score += 25;
    factors.push({ factor: 'Port congestion detected', impact: 25 });
  }
  
  if (operationalIntel.trafficDelay > 30) {
    score += 15;
    factors.push({ factor: `Traffic delay: ${operationalIntel.trafficDelay} min`, impact: 15 });
  }
  
  if (loadData.isExpedited) {
    score += 10;
    factors.push({ factor: 'Expedited shipment', impact: 10 });
  }
  
  if (loadData.isHazmat) {
    score += 20;
    factors.push({ factor: 'Hazmat cargo', impact: 20 });
  }
  
  if (loadData.isHighValue) {
    score += 15;
    factors.push({ factor: 'High-value cargo', impact: 15 });
  }
  
  return {
    category: RISK_CATEGORIES.OPERATIONAL,
    score: Math.min(score, 100),
    factors,
    level: getRiskLevel(score)
  };
}

function getRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'ELEVATED';
  if (score >= 20) return 'MODERATE';
  return 'LOW';
}

function calculateCompositeRisk(loadId, loadData, driverData, complianceResult, intelData = {}) {
  const riskId = generateId('RSK');
  
  const weatherRisk = calculateWeatherRisk(loadData.region, intelData.weather || {});
  const laneRisk = calculateLaneRisk(loadData.origin, loadData.destination, loadData.mode);
  const driverRisk = calculateDriverRisk(driverData);
  const complianceRisk = calculateComplianceRisk(complianceResult);
  const marketRisk = calculateMarketRisk(loadData.region, loadData.mode, intelData);
  const operationalRisk = calculateOperationalRisk(loadData, intelData.operational || {});
  
  const weights = {
    weather: 0.15,
    lane: 0.15,
    driver: 0.25,
    compliance: 0.20,
    market: 0.10,
    operational: 0.15
  };
  
  const compositeScore = Math.round(
    weatherRisk.score * weights.weather +
    laneRisk.score * weights.lane +
    driverRisk.score * weights.driver +
    complianceRisk.score * weights.compliance +
    marketRisk.score * weights.market +
    operationalRisk.score * weights.operational
  );
  
  const result = {
    riskId,
    loadId,
    driverId: driverData.driverId,
    compositeScore,
    compositeLevel: getRiskLevel(compositeScore),
    riskMultiplier: RISK_LEVELS[getRiskLevel(compositeScore)].multiplier,
    breakdown: {
      weather: weatherRisk,
      lane: laneRisk,
      driver: driverRisk,
      compliance: complianceRisk,
      market: marketRisk,
      operational: operationalRisk
    },
    recommendations: generateRecommendations(compositeScore, { weather: weatherRisk, driver: driverRisk, compliance: complianceRisk }),
    timestamp: new Date().toISOString()
  };
  
  riskCache.set(`${loadId}:${driverData.driverId}`, result);
  riskHistory.push({ id: riskId, loadId, driverId: driverData.driverId, score: compositeScore, level: result.compositeLevel, timestamp: result.timestamp });
  
  return result;
}

function generateRecommendations(score, breakdown) {
  const recommendations = [];
  
  if (score >= 60) {
    recommendations.push('Consider assigning backup driver');
    recommendations.push('Increase monitoring frequency');
  }
  
  if (breakdown.weather?.score >= 40) {
    recommendations.push('Monitor weather conditions closely');
    recommendations.push('Prepare contingency routing');
  }
  
  if (breakdown.driver?.score >= 40) {
    recommendations.push('Review driver performance history');
    recommendations.push('Consider additional check-ins');
  }
  
  if (breakdown.compliance?.score >= 30) {
    recommendations.push('Verify all documentation before dispatch');
    recommendations.push('Confirm driver certifications');
  }
  
  if (score >= 80) {
    recommendations.push('ESCALATE: Review with operations management');
    recommendations.push('Consider delaying dispatch until risk factors improve');
  }
  
  return recommendations;
}

function getCachedRisk(loadId, driverId) {
  return riskCache.get(`${loadId}:${driverId}`) || null;
}

function getRiskHistory(filters = {}) {
  let history = [...riskHistory];
  
  if (filters.loadId) {
    history = history.filter(r => r.loadId === filters.loadId);
  }
  if (filters.driverId) {
    history = history.filter(r => r.driverId === filters.driverId);
  }
  if (filters.minScore) {
    history = history.filter(r => r.score >= filters.minScore);
  }
  if (filters.level) {
    history = history.filter(r => r.level === filters.level);
  }
  
  return history.slice(-(filters.limit || 100)).reverse();
}

function getRiskStats() {
  const stats = {
    totalAssessments: riskHistory.length,
    byLevel: { LOW: 0, MODERATE: 0, ELEVATED: 0, HIGH: 0, CRITICAL: 0 },
    averageScore: 0,
    highRiskCount: 0
  };
  
  if (riskHistory.length === 0) return stats;
  
  let totalScore = 0;
  for (const risk of riskHistory) {
    stats.byLevel[risk.level]++;
    totalScore += risk.score;
    if (risk.score >= 60) stats.highRiskCount++;
  }
  
  stats.averageScore = Math.round(totalScore / riskHistory.length);
  
  return stats;
}

function getRegionalRiskOverview() {
  const regions = ['NORTH_AMERICA', 'EUROPE', 'ASIA_PACIFIC', 'LATAM'];
  const modes = ['GROUND', 'AIR', 'OCEAN', 'COURIER'];
  
  const overview = {};
  
  for (const region of regions) {
    overview[region] = {};
    for (const mode of modes) {
      const laneRisk = calculateLaneRisk(region, region, mode);
      overview[region][mode] = {
        volatility: laneRisk.volatility,
        score: laneRisk.score,
        level: laneRisk.level
      };
    }
  }
  
  return overview;
}

module.exports = {
  RISK_CATEGORIES,
  RISK_LEVELS,
  calculateWeatherRisk,
  calculateLaneRisk,
  calculateDriverRisk,
  calculateComplianceRisk,
  calculateMarketRisk,
  calculateOperationalRisk,
  calculateCompositeRisk,
  getRiskLevel,
  getCachedRisk,
  getRiskHistory,
  getRiskStats,
  getRegionalRiskOverview
};
