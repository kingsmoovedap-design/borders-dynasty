const crypto = require('crypto');

const externalContracts = new Map();
const normalizedLoads = [];
const dispatchQueue = [];
const routingRules = new Map();
const partnerStatus = new Map();

const PARTNER_BOARDS = [
  { id: 'DAT_FREIGHT', name: 'DAT Freight', type: 'API', priority: 1, modes: ['GROUND'] },
  { id: 'TRUCKER_PATH', name: 'Trucker Path', type: 'API', priority: 2, modes: ['GROUND'] },
  { id: 'LOADLINK', name: 'LoadLink', type: 'API', priority: 3, modes: ['GROUND', 'LTL'] },
  { id: 'UBER_FREIGHT', name: 'Uber Freight', type: 'API', priority: 4, modes: ['GROUND'] },
  { id: 'CONVOY', name: 'Convoy', type: 'API', priority: 5, modes: ['GROUND'] },
  { id: 'FREIGHTOS', name: 'Freightos', type: 'API', priority: 1, modes: ['OCEAN', 'AIR'] },
  { id: 'FLEXPORT', name: 'Flexport', type: 'API', priority: 2, modes: ['OCEAN', 'AIR'] },
  { id: 'POSTMATES_FLEET', name: 'Postmates Fleet', type: 'API', priority: 1, modes: ['COURIER'] },
  { id: 'DOORDASH_DRIVE', name: 'DoorDash Drive', type: 'API', priority: 2, modes: ['COURIER'] }
];

PARTNER_BOARDS.forEach(p => {
  partnerStatus.set(p.id, { 
    connected: false, 
    lastSync: null, 
    contractsGathered: 0,
    errors: 0,
    circuitOpen: false
  });
});

function initRoutingRules() {
  routingRules.set('GROUND', {
    minMargin: 0.15,
    maxDistance: 3000,
    requiredEquipment: ['DRY_VAN', 'FLATBED', 'REEFER'],
    redirectToApp: true,
    dynastyPriority: true
  });
  
  routingRules.set('COURIER', {
    minMargin: 0.20,
    maxDistance: 50,
    requiredEquipment: ['CARGO_VAN', 'SPRINTER', 'BOX_TRUCK'],
    redirectToApp: true,
    dynastyPriority: true
  });
  
  routingRules.set('AIR', {
    minMargin: 0.12,
    maxWeight: 50000,
    requiredCerts: ['IATA', 'TSA_APPROVED'],
    redirectToApp: false,
    dynastyPriority: false
  });
  
  routingRules.set('OCEAN', {
    minMargin: 0.10,
    maxContainers: 100,
    requiredCerts: ['NVOCC', 'FMC_LICENSED'],
    redirectToApp: false,
    dynastyPriority: false
  });
}

initRoutingRules();

function generateContractId() {
  return `DC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function normalizeExternalContract(rawContract, sourceBoard) {
  const normalized = {
    id: generateContractId(),
    externalId: rawContract.id || rawContract.loadId || crypto.randomUUID(),
    source: sourceBoard,
    gatheredAt: new Date().toISOString(),
    
    origin: {
      city: rawContract.origin?.city || rawContract.pickupCity || 'Unknown',
      state: rawContract.origin?.state || rawContract.pickupState || '',
      country: rawContract.origin?.country || 'USA',
      zip: rawContract.origin?.zip || rawContract.pickupZip || ''
    },
    destination: {
      city: rawContract.destination?.city || rawContract.deliveryCity || 'Unknown',
      state: rawContract.destination?.state || rawContract.deliveryState || '',
      country: rawContract.destination?.country || 'USA',
      zip: rawContract.destination?.zip || rawContract.deliveryZip || ''
    },
    
    mode: detectMode(rawContract),
    
    pickupDate: rawContract.pickupDate || rawContract.pickup_date || null,
    deliveryDate: rawContract.deliveryDate || rawContract.delivery_date || null,
    
    rate: parseFloat(rawContract.rate || rawContract.price || rawContract.amount || 0),
    rateType: rawContract.rateType || 'FLAT',
    currency: rawContract.currency || 'USD',
    
    weight: parseFloat(rawContract.weight || 0),
    distance: parseFloat(rawContract.distance || rawContract.miles || 0),
    equipment: rawContract.equipment || rawContract.trailerType || 'DRY_VAN',
    
    shipper: {
      id: rawContract.shipperId || rawContract.shipper?.id || 'EXT-SHIPPER',
      name: rawContract.shipperName || rawContract.shipper?.name || 'External Shipper',
      rating: rawContract.shipperRating || 4.0
    },
    
    requirements: rawContract.requirements || rawContract.specialInstructions || [],
    hazmat: rawContract.hazmat || false,
    teamRequired: rawContract.teamRequired || false,
    
    status: 'GATHERED',
    dynastyScore: 0,
    redirectDecision: null
  };
  
  normalized.dynastyScore = calculateDynastyScore(normalized);
  normalized.redirectDecision = determineRedirect(normalized);
  
  return normalized;
}

function detectMode(contract) {
  if (contract.mode) {
    const mode = contract.mode.toUpperCase();
    if (['GROUND', 'AIR', 'OCEAN', 'COURIER', 'LTL', 'FTL'].includes(mode)) {
      if (mode === 'LTL' || mode === 'FTL') return 'GROUND';
      return mode;
    }
  }
  
  if (contract.distance && parseFloat(contract.distance) < 50) {
    return 'COURIER';
  }
  if (contract.trailerType?.includes('AIR') || contract.shipmentType === 'AIR') {
    return 'AIR';
  }
  if (contract.containerType || contract.shipmentType === 'OCEAN') {
    return 'OCEAN';
  }
  
  return 'GROUND';
}

function calculateDynastyScore(contract) {
  let score = 50;
  
  const rules = routingRules.get(contract.mode) || {};
  
  if (contract.rate > 0 && contract.distance > 0) {
    const ratePerMile = contract.rate / contract.distance;
    if (ratePerMile > 3.5) score += 20;
    else if (ratePerMile > 2.5) score += 10;
    else if (ratePerMile < 1.5) score -= 15;
  }
  
  if (contract.shipper.rating >= 4.5) score += 15;
  else if (contract.shipper.rating >= 4.0) score += 10;
  else if (contract.shipper.rating < 3.0) score -= 20;
  
  if (!contract.hazmat) score += 5;
  if (!contract.teamRequired) score += 5;
  
  if (contract.mode === 'GROUND' || contract.mode === 'COURIER') {
    score += 10;
  }
  
  if (rules.dynastyPriority) score += 15;
  
  return Math.max(0, Math.min(100, score));
}

function determineRedirect(contract) {
  const rules = routingRules.get(contract.mode);
  
  if (!rules) {
    return { redirect: false, reason: 'NO_ROUTING_RULES', target: 'EXTERNAL' };
  }
  
  if (contract.dynastyScore < 40) {
    return { redirect: false, reason: 'LOW_DYNASTY_SCORE', target: 'EXTERNAL' };
  }
  
  if (rules.redirectToApp && (contract.mode === 'GROUND' || contract.mode === 'COURIER')) {
    return { 
      redirect: true, 
      reason: 'DYNASTY_PRIORITY_MODE', 
      target: 'DYNASTY_APP',
      routing: contract.mode === 'COURIER' ? 'COURIER_APP' : 'DRIVER_APP'
    };
  }
  
  if (rules.redirectToApp) {
    return { redirect: true, reason: 'MEETS_CRITERIA', target: 'DYNASTY_LOADBOARD' };
  }
  
  return { redirect: false, reason: 'EXTERNAL_MODE', target: 'PARTNER_NETWORK' };
}

async function gatherFromPartner(partnerId) {
  const partner = PARTNER_BOARDS.find(p => p.id === partnerId);
  if (!partner) {
    throw new Error(`Unknown partner: ${partnerId}`);
  }
  
  const status = partnerStatus.get(partnerId);
  if (status.circuitOpen) {
    const cooldown = 5 * 60 * 1000;
    if (Date.now() - new Date(status.lastError).getTime() < cooldown) {
      throw new Error(`Circuit breaker open for ${partnerId}`);
    }
    status.circuitOpen = false;
  }
  
  try {
    const mockContracts = generateMockExternalContracts(partner);
    
    const normalized = mockContracts.map(c => normalizeExternalContract(c, partnerId));
    
    normalized.forEach(contract => {
      externalContracts.set(contract.id, contract);
      normalizedLoads.push(contract);
    });
    
    status.connected = true;
    status.lastSync = new Date().toISOString();
    status.contractsGathered += normalized.length;
    status.errors = 0;
    
    return {
      partnerId,
      contractsGathered: normalized.length,
      redirected: normalized.filter(c => c.redirectDecision.redirect).length
    };
    
  } catch (error) {
    status.errors++;
    status.lastError = new Date().toISOString();
    
    if (status.errors >= 3) {
      status.circuitOpen = true;
    }
    
    throw error;
  }
}

function generateMockExternalContracts(partner) {
  const count = Math.floor(Math.random() * 5) + 1;
  const contracts = [];
  
  const cities = [
    { city: 'Los Angeles', state: 'CA' },
    { city: 'Chicago', state: 'IL' },
    { city: 'Houston', state: 'TX' },
    { city: 'Phoenix', state: 'AZ' },
    { city: 'Philadelphia', state: 'PA' },
    { city: 'San Antonio', state: 'TX' },
    { city: 'San Diego', state: 'CA' },
    { city: 'Dallas', state: 'TX' },
    { city: 'Atlanta', state: 'GA' },
    { city: 'Miami', state: 'FL' }
  ];
  
  for (let i = 0; i < count; i++) {
    const origin = cities[Math.floor(Math.random() * cities.length)];
    let dest = cities[Math.floor(Math.random() * cities.length)];
    while (dest.city === origin.city) {
      dest = cities[Math.floor(Math.random() * cities.length)];
    }
    
    const mode = partner.modes[Math.floor(Math.random() * partner.modes.length)];
    const distance = mode === 'COURIER' ? Math.floor(Math.random() * 40) + 5 : Math.floor(Math.random() * 2000) + 100;
    const ratePerMile = mode === 'COURIER' ? 4 + Math.random() * 2 : 2 + Math.random() * 2;
    
    contracts.push({
      id: `${partner.id}-${Date.now()}-${i}`,
      pickupCity: origin.city,
      pickupState: origin.state,
      deliveryCity: dest.city,
      deliveryState: dest.state,
      mode: mode,
      rate: Math.round(distance * ratePerMile),
      distance: distance,
      weight: Math.floor(Math.random() * 40000) + 5000,
      equipment: ['DRY_VAN', 'FLATBED', 'REEFER'][Math.floor(Math.random() * 3)],
      pickupDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      shipperName: `${partner.name} Shipper ${i + 1}`,
      shipperRating: 3.5 + Math.random() * 1.5
    });
  }
  
  return contracts;
}

async function gatherAllContracts() {
  const results = [];
  
  for (const partner of PARTNER_BOARDS) {
    try {
      const result = await gatherFromPartner(partner.id);
      results.push(result);
    } catch (error) {
      results.push({
        partnerId: partner.id,
        error: error.message,
        contractsGathered: 0
      });
    }
  }
  
  const totalGathered = results.reduce((sum, r) => sum + (r.contractsGathered || 0), 0);
  const totalRedirected = results.reduce((sum, r) => sum + (r.redirected || 0), 0);
  
  return {
    timestamp: new Date().toISOString(),
    partners: results,
    summary: {
      totalGathered,
      totalRedirected,
      dynastyCapture: totalGathered > 0 ? (totalRedirected / totalGathered * 100).toFixed(1) : 0
    }
  };
}

function getGatheredContracts(filters = {}) {
  let contracts = Array.from(externalContracts.values());
  
  if (filters.mode) {
    contracts = contracts.filter(c => c.mode === filters.mode);
  }
  if (filters.redirected !== undefined) {
    contracts = contracts.filter(c => c.redirectDecision.redirect === filters.redirected);
  }
  if (filters.minScore) {
    contracts = contracts.filter(c => c.dynastyScore >= filters.minScore);
  }
  if (filters.source) {
    contracts = contracts.filter(c => c.source === filters.source);
  }
  
  return contracts.sort((a, b) => b.dynastyScore - a.dynastyScore);
}

function getDynastyQualified() {
  return getGatheredContracts({ redirected: true, minScore: 60 });
}

function getPartnerStatus() {
  const status = [];
  for (const [id, data] of partnerStatus.entries()) {
    const partner = PARTNER_BOARDS.find(p => p.id === id);
    status.push({
      ...partner,
      ...data
    });
  }
  return status;
}

function convertToDynastyLoad(contractId, dynastyApi) {
  const contract = externalContracts.get(contractId);
  if (!contract) {
    throw new Error(`Contract not found: ${contractId}`);
  }
  
  if (!contract.redirectDecision.redirect) {
    throw new Error(`Contract ${contractId} not marked for redirect`);
  }
  
  const dynastyLoad = {
    externalContractId: contract.id,
    shipperId: contract.shipper.id,
    origin: `${contract.origin.city}, ${contract.origin.state}`,
    destination: `${contract.destination.city}, ${contract.destination.state}`,
    mode: contract.mode,
    budgetAmount: contract.rate,
    region: 'NORTH_AMERICA',
    serviceLevel: 'STANDARD',
    source: 'DEVINE_DISPATCH',
    dynastyScore: contract.dynastyScore
  };
  
  contract.status = 'CONVERTED';
  contract.convertedAt = new Date().toISOString();
  
  return dynastyLoad;
}

function getDispatchStats() {
  const contracts = Array.from(externalContracts.values());
  
  return {
    totalGathered: contracts.length,
    byMode: {
      GROUND: contracts.filter(c => c.mode === 'GROUND').length,
      COURIER: contracts.filter(c => c.mode === 'COURIER').length,
      AIR: contracts.filter(c => c.mode === 'AIR').length,
      OCEAN: contracts.filter(c => c.mode === 'OCEAN').length
    },
    redirected: contracts.filter(c => c.redirectDecision.redirect).length,
    converted: contracts.filter(c => c.status === 'CONVERTED').length,
    avgDynastyScore: contracts.length > 0 
      ? (contracts.reduce((sum, c) => sum + c.dynastyScore, 0) / contracts.length).toFixed(1)
      : 0,
    partnerStats: getPartnerStatus()
  };
}

module.exports = {
  PARTNER_BOARDS,
  gatherFromPartner,
  gatherAllContracts,
  getGatheredContracts,
  getDynastyQualified,
  convertToDynastyLoad,
  getPartnerStatus,
  getDispatchStats,
  normalizeExternalContract,
  calculateDynastyScore,
  determineRedirect,
  routingRules,
  externalContracts
};
