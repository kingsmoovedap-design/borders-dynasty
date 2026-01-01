const crypto = require('crypto');

const LOGISTICS_SYSTEMS = {
  DAT_POWER: { id: 'DAT_POWER', name: 'DAT Power', type: 'FREIGHT_BOARD', modes: ['GROUND'], avgDailyContracts: 500000, status: 'CONNECTED' },
  TRUCKSTOP: { id: 'TRUCKSTOP', name: 'Truckstop.com', type: 'FREIGHT_BOARD', modes: ['GROUND'], avgDailyContracts: 350000, status: 'CONNECTED' },
  FREIGHTWAVES_SONAR: { id: 'FREIGHTWAVES_SONAR', name: 'FreightWaves SONAR', type: 'MARKET_DATA', modes: ['GROUND', 'OCEAN', 'AIR'], avgDailyContracts: 100000, status: 'CONNECTED' },
  ITS_DISPATCH: { id: 'ITS_DISPATCH', name: 'ITS Dispatch', type: 'TMS', modes: ['GROUND'], avgDailyContracts: 75000, status: 'CONNECTED' },
  MACROPOINT: { id: 'MACROPOINT', name: 'MacroPoint', type: 'VISIBILITY', modes: ['GROUND'], avgDailyContracts: 200000, status: 'CONNECTED' },
  CARGOWISE: { id: 'CARGOWISE', name: 'CargoWise', type: 'TMS', modes: ['OCEAN', 'AIR', 'GROUND'], avgDailyContracts: 150000, status: 'CONNECTED' },
  FLEXPORT: { id: 'FLEXPORT', name: 'Flexport', type: 'FORWARDER', modes: ['OCEAN', 'AIR'], avgDailyContracts: 50000, status: 'CONNECTED' },
  UBER_FREIGHT: { id: 'UBER_FREIGHT', name: 'Uber Freight', type: 'DIGITAL_BROKER', modes: ['GROUND'], avgDailyContracts: 100000, status: 'CONNECTED' },
  CONVOY: { id: 'CONVOY', name: 'Convoy', type: 'DIGITAL_BROKER', modes: ['GROUND'], avgDailyContracts: 80000, status: 'CONNECTED' },
  CH_ROBINSON: { id: 'CH_ROBINSON', name: 'C.H. Robinson Navisphere', type: 'BROKER_TMS', modes: ['GROUND', 'OCEAN', 'AIR'], avgDailyContracts: 300000, status: 'CONNECTED' },
  XPO_CONNECT: { id: 'XPO_CONNECT', name: 'XPO Connect', type: 'DIGITAL_BROKER', modes: ['GROUND'], avgDailyContracts: 120000, status: 'CONNECTED' },
  ECHO_GLOBAL: { id: 'ECHO_GLOBAL', name: 'Echo Global', type: 'BROKER_TMS', modes: ['GROUND'], avgDailyContracts: 90000, status: 'CONNECTED' },
  AMAZON_RELAY: { id: 'AMAZON_RELAY', name: 'Amazon Relay', type: 'SHIPPER_PORTAL', modes: ['GROUND'], avgDailyContracts: 250000, status: 'CONNECTED' },
  FEDEX_CUSTOM_CRITICAL: { id: 'FEDEX_CUSTOM_CRITICAL', name: 'FedEx Custom Critical', type: 'COURIER', modes: ['COURIER', 'AIR'], avgDailyContracts: 50000, status: 'CONNECTED' },
  DHL_EXPRESS: { id: 'DHL_EXPRESS', name: 'DHL Express', type: 'COURIER', modes: ['COURIER', 'AIR'], avgDailyContracts: 80000, status: 'CONNECTED' },
  UPS_FREIGHT: { id: 'UPS_FREIGHT', name: 'UPS Freight', type: 'COURIER', modes: ['COURIER', 'GROUND'], avgDailyContracts: 100000, status: 'CONNECTED' },
  MAERSK_SPOT: { id: 'MAERSK_SPOT', name: 'Maersk Spot', type: 'OCEAN_CARRIER', modes: ['OCEAN'], avgDailyContracts: 30000, status: 'CONNECTED' },
  MSC_ONLINE: { id: 'MSC_ONLINE', name: 'MSC Online', type: 'OCEAN_CARRIER', modes: ['OCEAN'], avgDailyContracts: 25000, status: 'CONNECTED' },
  AIR_CARGO_NEWS: { id: 'AIR_CARGO_NEWS', name: 'Air Cargo News Exchange', type: 'AIR_FREIGHT', modes: ['AIR'], avgDailyContracts: 20000, status: 'CONNECTED' },
  FREIGHTOS: { id: 'FREIGHTOS', name: 'Freightos', type: 'MARKETPLACE', modes: ['OCEAN', 'AIR'], avgDailyContracts: 40000, status: 'CONNECTED' }
};

const CONTRACT_TYPES = {
  SPOT: { id: 'SPOT', name: 'Spot Market', duration: 'single', priority: 1 },
  SHORT_TERM: { id: 'SHORT_TERM', name: 'Short-Term Contract', duration: '1-30 days', priority: 2 },
  DEDICATED: { id: 'DEDICATED', name: 'Dedicated Lane', duration: '30-90 days', priority: 3 },
  ANNUAL: { id: 'ANNUAL', name: 'Annual Contract', duration: '1 year', priority: 4 },
  MULTI_YEAR: { id: 'MULTI_YEAR', name: 'Multi-Year Agreement', duration: '2-5 years', priority: 5 }
};

const CAPTURE_PRIORITIES = {
  CRITICAL: { id: 'CRITICAL', name: 'Critical - Auto Capture', score: 90, autoCapture: true },
  HIGH: { id: 'HIGH', name: 'High Priority', score: 75, autoCapture: false },
  MEDIUM: { id: 'MEDIUM', name: 'Medium Priority', score: 50, autoCapture: false },
  LOW: { id: 'LOW', name: 'Low Priority', score: 25, autoCapture: false },
  IGNORE: { id: 'IGNORE', name: 'Do Not Capture', score: 0, autoCapture: false }
};

const capturedContracts = new Map();
const captureRules = new Map();
const partnerAllocations = new Map();
const captureStats = {
  totalScanned: 0,
  totalCaptured: 0,
  bySource: {},
  byMode: {},
  byRegion: {}
};

const SCORING_FACTORS = {
  profitability: { weight: 0.25, description: 'Revenue vs cost analysis' },
  routeEfficiency: { weight: 0.15, description: 'Deadhead and backhaul optimization' },
  capacityMatch: { weight: 0.15, description: 'Equipment and capacity alignment' },
  partnerFit: { weight: 0.15, description: 'Match to partner network capabilities' },
  marketRate: { weight: 0.10, description: 'Rate vs market benchmark' },
  compliance: { weight: 0.10, description: 'Regulatory and documentation requirements' },
  shipper: { weight: 0.05, description: 'Shipper relationship and payment history' },
  urgency: { weight: 0.05, description: 'Time sensitivity and deadline proximity' }
};

function initializeCaptureRules() {
  captureRules.set('HIGH_VALUE_GROUND', {
    id: 'HIGH_VALUE_GROUND',
    name: 'High Value Ground Freight',
    conditions: { mode: 'GROUND', minRate: 3.00, minMiles: 100 },
    priority: 'HIGH',
    autoCapture: true
  });
  
  captureRules.set('EXPRESS_COURIER', {
    id: 'EXPRESS_COURIER',
    name: 'Express Courier Opportunities',
    conditions: { mode: 'COURIER', serviceLevel: ['RUSH', 'SAME_DAY'] },
    priority: 'CRITICAL',
    autoCapture: true
  });
  
  captureRules.set('OCEAN_CONTAINER', {
    id: 'OCEAN_CONTAINER',
    name: 'Ocean Container Contracts',
    conditions: { mode: 'OCEAN', minTEU: 1 },
    priority: 'MEDIUM',
    autoCapture: false
  });
  
  captureRules.set('AIR_PRIORITY', {
    id: 'AIR_PRIORITY',
    name: 'Air Priority Shipments',
    conditions: { mode: 'AIR', minWeight: 100 },
    priority: 'HIGH',
    autoCapture: true
  });
}

initializeCaptureRules();

async function scanAllSystems(filters = {}) {
  const results = {
    scannedAt: new Date().toISOString(),
    systemsScanned: 0,
    contractsFound: 0,
    contracts: [],
    bySystem: {}
  };
  
  for (const [systemId, system] of Object.entries(LOGISTICS_SYSTEMS)) {
    if (system.status !== 'CONNECTED') continue;
    if (filters.mode && !system.modes.includes(filters.mode)) continue;
    if (filters.type && system.type !== filters.type) continue;
    
    const mockContracts = generateMockContracts(system, filters);
    
    results.systemsScanned++;
    results.contractsFound += mockContracts.length;
    results.bySystem[systemId] = mockContracts.length;
    results.contracts.push(...mockContracts);
    
    captureStats.totalScanned += mockContracts.length;
    captureStats.bySource[systemId] = (captureStats.bySource[systemId] || 0) + mockContracts.length;
  }
  
  return results;
}

function generateMockContracts(system, filters) {
  const count = Math.floor(Math.random() * 10) + 5;
  const contracts = [];
  
  for (let i = 0; i < count; i++) {
    const mode = system.modes[Math.floor(Math.random() * system.modes.length)];
    if (filters.mode && mode !== filters.mode) continue;
    
    contracts.push({
      id: `${system.id}-${crypto.randomBytes(4).toString('hex')}`,
      source: system.id,
      sourceName: system.name,
      mode,
      type: Object.keys(CONTRACT_TYPES)[Math.floor(Math.random() * 3)],
      origin: generateLocation(),
      destination: generateLocation(),
      rate: generateRate(mode),
      distance: Math.floor(Math.random() * 2000) + 100,
      weight: Math.floor(Math.random() * 40000) + 1000,
      equipment: generateEquipment(mode),
      pickupDate: generateFutureDate(1, 7),
      deliveryDate: generateFutureDate(2, 14),
      shipper: { name: `Shipper ${Math.floor(Math.random() * 1000)}`, rating: Math.random() * 2 + 3 },
      scannedAt: new Date().toISOString(),
      expiresAt: generateFutureDate(0, 2)
    });
  }
  
  return contracts;
}

function generateLocation() {
  const cities = ['Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Miami, FL', 'Seattle, WA', 'New York, NY', 'Atlanta, GA', 'Denver, CO'];
  return cities[Math.floor(Math.random() * cities.length)];
}

function generateRate(mode) {
  const baseRates = { GROUND: 2.50, COURIER: 5.00, AIR: 8.00, OCEAN: 1500 };
  const base = baseRates[mode] || 2.50;
  return parseFloat((base + Math.random() * base).toFixed(2));
}

function generateEquipment(mode) {
  const equipment = {
    GROUND: ['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK'],
    COURIER: ['VAN', 'BOX_TRUCK', 'SPRINTER'],
    AIR: ['STANDARD', 'TEMPERATURE_CONTROLLED', 'HAZMAT'],
    OCEAN: ['20FT_CONTAINER', '40FT_CONTAINER', '40FT_HC', 'REEFER_CONTAINER']
  };
  const options = equipment[mode] || equipment.GROUND;
  return options[Math.floor(Math.random() * options.length)];
}

function generateFutureDate(minDays, maxDays) {
  const date = new Date();
  date.setDate(date.getDate() + minDays + Math.floor(Math.random() * (maxDays - minDays)));
  return date.toISOString();
}

function scoreContract(contract, partnerCapabilities = {}) {
  const scores = {};
  let totalScore = 0;
  
  scores.profitability = calculateProfitabilityScore(contract);
  scores.routeEfficiency = calculateRouteScore(contract);
  scores.capacityMatch = calculateCapacityScore(contract, partnerCapabilities);
  scores.partnerFit = calculatePartnerFitScore(contract, partnerCapabilities);
  scores.marketRate = calculateMarketRateScore(contract);
  scores.compliance = calculateComplianceScore(contract);
  scores.shipper = calculateShipperScore(contract);
  scores.urgency = calculateUrgencyScore(contract);
  
  for (const [factor, config] of Object.entries(SCORING_FACTORS)) {
    totalScore += scores[factor] * config.weight;
  }
  
  const priority = determinePriority(totalScore);
  
  return {
    contractId: contract.id,
    totalScore: Math.round(totalScore),
    scores,
    priority,
    recommendation: priority.autoCapture ? 'AUTO_CAPTURE' : (totalScore >= 50 ? 'RECOMMEND' : 'REVIEW'),
    scoredAt: new Date().toISOString()
  };
}

function calculateProfitabilityScore(contract) {
  const ratePerMile = contract.rate / (contract.distance || 1);
  if (ratePerMile >= 4) return 100;
  if (ratePerMile >= 3) return 80;
  if (ratePerMile >= 2.5) return 60;
  if (ratePerMile >= 2) return 40;
  return 20;
}

function calculateRouteScore(contract) {
  return Math.min(100, Math.floor(Math.random() * 40) + 60);
}

function calculateCapacityScore(contract, capabilities) {
  if (!capabilities.equipment) return 70;
  return capabilities.equipment.includes(contract.equipment) ? 100 : 40;
}

function calculatePartnerFitScore(contract, capabilities) {
  if (!capabilities.modes) return 70;
  return capabilities.modes.includes(contract.mode) ? 90 : 30;
}

function calculateMarketRateScore(contract) {
  return Math.min(100, Math.floor(Math.random() * 30) + 60);
}

function calculateComplianceScore(contract) {
  return Math.min(100, Math.floor(Math.random() * 20) + 80);
}

function calculateShipperScore(contract) {
  return Math.min(100, (contract.shipper?.rating || 3) * 20);
}

function calculateUrgencyScore(contract) {
  const daysUntilPickup = Math.floor((new Date(contract.pickupDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntilPickup <= 1) return 100;
  if (daysUntilPickup <= 3) return 75;
  if (daysUntilPickup <= 7) return 50;
  return 25;
}

function determinePriority(score) {
  if (score >= 90) return CAPTURE_PRIORITIES.CRITICAL;
  if (score >= 75) return CAPTURE_PRIORITIES.HIGH;
  if (score >= 50) return CAPTURE_PRIORITIES.MEDIUM;
  if (score >= 25) return CAPTURE_PRIORITIES.LOW;
  return CAPTURE_PRIORITIES.IGNORE;
}

function captureContract(contract, score, captureReason = 'MANUAL') {
  const captureId = `CAP-${crypto.randomBytes(6).toString('hex')}`;
  
  const captured = {
    id: captureId,
    contract,
    score,
    captureReason,
    status: 'CAPTURED',
    allocatedTo: null,
    dynastyLoadId: null,
    capturedAt: new Date().toISOString(),
    timeline: [{
      status: 'CAPTURED',
      timestamp: new Date().toISOString(),
      reason: captureReason
    }]
  };
  
  capturedContracts.set(captureId, captured);
  captureStats.totalCaptured++;
  captureStats.byMode[contract.mode] = (captureStats.byMode[contract.mode] || 0) + 1;
  
  return { success: true, captured };
}

function allocateToPartner(captureId, partnerId, partnerType) {
  const captured = capturedContracts.get(captureId);
  if (!captured) return { success: false, error: 'Captured contract not found' };
  
  captured.allocatedTo = {
    partnerId,
    partnerType,
    allocatedAt: new Date().toISOString()
  };
  captured.status = 'ALLOCATED';
  captured.timeline.push({
    status: 'ALLOCATED',
    timestamp: new Date().toISOString(),
    partnerId,
    partnerType
  });
  
  if (!partnerAllocations.has(partnerId)) {
    partnerAllocations.set(partnerId, []);
  }
  partnerAllocations.get(partnerId).push(captureId);
  
  return { success: true, captured };
}

function routeToLoadboard(captureId, loadboardView) {
  const captured = capturedContracts.get(captureId);
  if (!captured) return { success: false, error: 'Captured contract not found' };
  
  const dynastyLoadId = `DYN-${crypto.randomBytes(6).toString('hex')}`;
  
  captured.dynastyLoadId = dynastyLoadId;
  captured.loadboardView = loadboardView;
  captured.status = 'ROUTED';
  captured.routedAt = new Date().toISOString();
  captured.timeline.push({
    status: 'ROUTED',
    timestamp: new Date().toISOString(),
    dynastyLoadId,
    loadboardView
  });
  
  return {
    success: true,
    captured,
    dynastyLoad: {
      id: dynastyLoadId,
      sourceContract: captured.contract,
      score: captured.score,
      view: loadboardView,
      status: 'POSTED'
    }
  };
}

function getCapturedContracts(filters = {}) {
  let result = Array.from(capturedContracts.values());
  
  if (filters.status) result = result.filter(c => c.status === filters.status);
  if (filters.mode) result = result.filter(c => c.contract.mode === filters.mode);
  if (filters.minScore) result = result.filter(c => c.score.totalScore >= filters.minScore);
  if (filters.source) result = result.filter(c => c.contract.source === filters.source);
  if (filters.partnerId) result = result.filter(c => c.allocatedTo?.partnerId === filters.partnerId);
  
  return result.slice(0, filters.limit || 100);
}

function getPartnerAllocations(partnerId) {
  const captureIds = partnerAllocations.get(partnerId) || [];
  return captureIds.map(id => capturedContracts.get(id)).filter(Boolean);
}

function getCaptureStats() {
  return {
    ...captureStats,
    captureRate: captureStats.totalScanned > 0 
      ? ((captureStats.totalCaptured / captureStats.totalScanned) * 100).toFixed(2) + '%'
      : '0%',
    connectedSystems: Object.values(LOGISTICS_SYSTEMS).filter(s => s.status === 'CONNECTED').length,
    totalSystemContracts: Object.values(LOGISTICS_SYSTEMS).reduce((sum, s) => sum + s.avgDailyContracts, 0)
  };
}

function getLogisticsSystems() {
  return Object.values(LOGISTICS_SYSTEMS);
}

function getContractTypes() {
  return Object.values(CONTRACT_TYPES);
}

function getCapturePriorities() {
  return Object.values(CAPTURE_PRIORITIES);
}

function getScoringFactors() {
  return SCORING_FACTORS;
}

function getCaptureRules() {
  return Array.from(captureRules.values());
}

function addCaptureRule(rule) {
  captureRules.set(rule.id, rule);
  return { success: true, rule };
}

module.exports = {
  LOGISTICS_SYSTEMS,
  CONTRACT_TYPES,
  CAPTURE_PRIORITIES,
  SCORING_FACTORS,
  scanAllSystems,
  scoreContract,
  captureContract,
  allocateToPartner,
  routeToLoadboard,
  getCapturedContracts,
  getPartnerAllocations,
  getCaptureStats,
  getLogisticsSystems,
  getContractTypes,
  getCapturePriorities,
  getScoringFactors,
  getCaptureRules,
  addCaptureRule
};
