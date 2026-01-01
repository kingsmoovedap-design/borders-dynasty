const EXTERNAL_LOADBOARDS = {
  DAT: {
    id: "DAT",
    name: "DAT Power",
    type: "FREIGHT_BOARD",
    coverage: ["NORTH_AMERICA"],
    modes: ["GROUND"],
    avgDailyLoads: 500000,
    integrationStatus: "READY"
  },
  TRUCKSTOP: {
    id: "TRUCKSTOP",
    name: "Truckstop.com",
    type: "FREIGHT_BOARD",
    coverage: ["NORTH_AMERICA"],
    modes: ["GROUND"],
    avgDailyLoads: 350000,
    integrationStatus: "READY"
  },
  FREIGHTWAVES: {
    id: "FREIGHTWAVES",
    name: "FreightWaves SONAR",
    type: "MARKET_DATA",
    coverage: ["NORTH_AMERICA", "EUROPE"],
    modes: ["GROUND", "OCEAN"],
    dataTypes: ["RATES", "CAPACITY", "DEMAND"],
    integrationStatus: "READY"
  },
  FLEXPORT: {
    id: "FLEXPORT",
    name: "Flexport",
    type: "FREIGHT_FORWARDER",
    coverage: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC"],
    modes: ["OCEAN", "AIR"],
    avgDailyLoads: 50000,
    integrationStatus: "PLANNED"
  },
  FREIGHTOS: {
    id: "FREIGHTOS",
    name: "Freightos",
    type: "OCEAN_FREIGHT",
    coverage: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC", "LATAM"],
    modes: ["OCEAN"],
    avgDailyLoads: 25000,
    integrationStatus: "PLANNED"
  },
  CARGOAI: {
    id: "CARGOAI",
    name: "CargoAI",
    type: "AIR_CARGO",
    coverage: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC"],
    modes: ["AIR"],
    avgDailyLoads: 15000,
    integrationStatus: "PLANNED"
  }
};

const SCORING_WEIGHTS = {
  profitability: 0.25,
  routeEfficiency: 0.15,
  complianceFit: 0.15,
  equipmentMatch: 0.10,
  timelineFeasibility: 0.10,
  customerRating: 0.10,
  laneHistory: 0.10,
  marketDemand: 0.05
};

const capturedContracts = [];
const conversionQueue = [];

function generateContractId() {
  return `EXT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

async function scanExternalLoadboards(filters = {}) {
  const results = [];
  const activeSources = Object.values(EXTERNAL_LOADBOARDS).filter(
    lb => lb.integrationStatus === "READY"
  );
  
  for (const source of activeSources) {
    const contracts = generateSimulatedContracts(source, filters);
    results.push(...contracts);
  }
  
  return {
    scannedAt: new Date().toISOString(),
    sources: activeSources.length,
    totalContracts: results.length,
    contracts: results
  };
}

function generateSimulatedContracts(source, filters) {
  const count = Math.floor(Math.random() * 10) + 5;
  const contracts = [];
  
  const origins = ["Chicago, IL", "Los Angeles, CA", "Houston, TX", "Atlanta, GA", "Dallas, TX", "Phoenix, AZ", "New York, NY", "Seattle, WA"];
  const destinations = ["Miami, FL", "Denver, CO", "Minneapolis, MN", "Detroit, MI", "Boston, MA", "Portland, OR", "San Diego, CA", "Nashville, TN"];
  const equipment = ["DRY_VAN", "REEFER", "FLATBED", "CONTAINER"];
  
  for (let i = 0; i < count; i++) {
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    const distance = Math.floor(Math.random() * 2000) + 200;
    const rate = distance * (2.0 + Math.random() * 1.5);
    
    contracts.push({
      id: generateContractId(),
      source: source.id,
      sourceName: source.name,
      origin,
      destination,
      distance,
      rate: Math.round(rate * 100) / 100,
      ratePerMile: Math.round((rate / distance) * 100) / 100,
      equipment: equipment[Math.floor(Math.random() * equipment.length)],
      weight: Math.floor(Math.random() * 40000) + 5000,
      pickupDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      deliveryDeadline: new Date(Date.now() + (Math.random() * 7 + 3) * 24 * 60 * 60 * 1000).toISOString(),
      shipperRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      quickPay: Math.random() > 0.5,
      hazmat: Math.random() > 0.9,
      teamRequired: Math.random() > 0.85,
      scannedAt: new Date().toISOString()
    });
  }
  
  return contracts;
}

function scoreContract(contract, dynastyCapabilities = {}) {
  const scores = {};
  
  const marketRate = contract.distance * 2.50;
  const profitMargin = (contract.rate - marketRate) / marketRate;
  scores.profitability = Math.min(100, Math.max(0, 50 + profitMargin * 200));
  
  const directDistance = contract.distance;
  const efficiency = Math.random() * 0.3 + 0.7;
  scores.routeEfficiency = efficiency * 100;
  
  scores.complianceFit = contract.hazmat ? 60 : 95;
  if (contract.teamRequired) scores.complianceFit -= 10;
  
  scores.equipmentMatch = dynastyCapabilities.equipment?.includes(contract.equipment) ? 100 : 70;
  
  const daysToPickup = (new Date(contract.pickupDate) - new Date()) / (24 * 60 * 60 * 1000);
  scores.timelineFeasibility = daysToPickup > 1 ? 90 : daysToPickup > 0.5 ? 70 : 50;
  
  scores.customerRating = contract.shipperRating * 20;
  
  scores.laneHistory = Math.random() * 40 + 60;
  
  scores.marketDemand = Math.random() * 30 + 70;
  
  let totalScore = 0;
  for (const [key, weight] of Object.entries(SCORING_WEIGHTS)) {
    totalScore += (scores[key] || 0) * weight;
  }
  
  return {
    contractId: contract.id,
    scores,
    totalScore: Math.round(totalScore * 10) / 10,
    qualified: totalScore >= 60,
    recommendation: totalScore >= 80 ? "STRONG_CAPTURE" : totalScore >= 60 ? "CAPTURE" : "PASS",
    reasoning: generateReasoningText(scores, totalScore)
  };
}

function generateReasoningText(scores, totalScore) {
  const reasons = [];
  
  if (scores.profitability >= 70) reasons.push("Above-market rate offers strong profitability");
  else if (scores.profitability < 50) reasons.push("Rate below market average");
  
  if (scores.routeEfficiency >= 85) reasons.push("Efficient routing with minimal deadhead");
  
  if (scores.complianceFit >= 90) reasons.push("Clean compliance profile");
  else if (scores.complianceFit < 70) reasons.push("Additional compliance requirements needed");
  
  if (scores.customerRating >= 80) reasons.push("Highly rated shipper");
  
  if (reasons.length === 0) reasons.push("Standard contract opportunity");
  
  return reasons.join(". ") + ".";
}

function captureContract(contract, score) {
  const captured = {
    ...contract,
    capturedAt: new Date().toISOString(),
    status: "CAPTURED",
    score,
    conversionStatus: "PENDING"
  };
  
  capturedContracts.push(captured);
  
  return {
    success: true,
    contract: captured,
    message: `Contract ${contract.id} captured with score ${score.totalScore}`
  };
}

function convertToDynastyLoad(contractId, overrides = {}) {
  const contract = capturedContracts.find(c => c.id === contractId);
  if (!contract) {
    return { success: false, error: "Contract not found" };
  }
  
  const dynastyLoad = {
    id: `DYN-${Date.now()}`,
    sourceContract: contractId,
    origin: contract.origin,
    destination: contract.destination,
    mode: "GROUND",
    region: "NORTH_AMERICA",
    equipment: contract.equipment,
    weight: contract.weight,
    distance: contract.distance,
    budgetAmount: contract.rate,
    pickupDate: contract.pickupDate,
    deliveryDeadline: contract.deliveryDeadline,
    status: "PENDING",
    convertedAt: new Date().toISOString(),
    originalSource: contract.source,
    captureScore: contract.score.totalScore,
    ...overrides
  };
  
  contract.conversionStatus = "CONVERTED";
  contract.dynastyLoadId = dynastyLoad.id;
  
  return {
    success: true,
    load: dynastyLoad,
    message: `Contract converted to Dynasty load ${dynastyLoad.id}`
  };
}

function getCapturedContracts(filters = {}) {
  let results = [...capturedContracts];
  
  if (filters.status) {
    results = results.filter(c => c.conversionStatus === filters.status);
  }
  if (filters.minScore) {
    results = results.filter(c => c.score.totalScore >= filters.minScore);
  }
  if (filters.source) {
    results = results.filter(c => c.source === filters.source);
  }
  
  return results.slice(-(filters.limit || 100)).reverse();
}

function getQualifiedContracts(minScore = 60) {
  return capturedContracts.filter(
    c => c.score.totalScore >= minScore && c.conversionStatus === "PENDING"
  );
}

function getCaptureStats() {
  const total = capturedContracts.length;
  const converted = capturedContracts.filter(c => c.conversionStatus === "CONVERTED").length;
  const pending = capturedContracts.filter(c => c.conversionStatus === "PENDING").length;
  const avgScore = total > 0 
    ? capturedContracts.reduce((sum, c) => sum + c.score.totalScore, 0) / total 
    : 0;
  
  const bySource = {};
  for (const contract of capturedContracts) {
    bySource[contract.source] = (bySource[contract.source] || 0) + 1;
  }
  
  return {
    total,
    converted,
    pending,
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    avgScore: Math.round(avgScore * 10) / 10,
    bySource,
    lastCaptureAt: capturedContracts.length > 0 
      ? capturedContracts[capturedContracts.length - 1].capturedAt 
      : null
  };
}

function getScoringWeights() {
  return SCORING_WEIGHTS;
}

function getExternalLoadboards() {
  return Object.values(EXTERNAL_LOADBOARDS);
}

module.exports = {
  EXTERNAL_LOADBOARDS,
  SCORING_WEIGHTS,
  scanExternalLoadboards,
  scoreContract,
  captureContract,
  convertToDynastyLoad,
  getCapturedContracts,
  getQualifiedContracts,
  getCaptureStats,
  getScoringWeights,
  getExternalLoadboards
};
