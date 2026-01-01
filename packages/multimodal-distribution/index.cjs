const crypto = require('crypto');

const DISTRIBUTION_MODES = {
  GROUND: { id: 'GROUND', name: 'Ground Freight', icon: 'truck', avgTransitDays: { min: 1, max: 7 }, costFactor: 1.0 },
  OCEAN: { id: 'OCEAN', name: 'Ocean Freight', icon: 'ship', avgTransitDays: { min: 14, max: 45 }, costFactor: 0.3 },
  AIR: { id: 'AIR', name: 'Air Freight', icon: 'plane', avgTransitDays: { min: 1, max: 3 }, costFactor: 5.0 },
  COURIER: { id: 'COURIER', name: 'Courier/Express', icon: 'package', avgTransitDays: { min: 0, max: 2 }, costFactor: 8.0 },
  RAIL: { id: 'RAIL', name: 'Rail Freight', icon: 'train', avgTransitDays: { min: 3, max: 10 }, costFactor: 0.6 },
  INTERMODAL: { id: 'INTERMODAL', name: 'Intermodal', icon: 'layers', avgTransitDays: { min: 5, max: 14 }, costFactor: 0.8 }
};

const PARTNER_TYPES = {
  CARRIER: { id: 'CARRIER', name: 'Asset Carrier', canExecute: true, modes: ['GROUND', 'RAIL'] },
  BROKER: { id: 'BROKER', name: 'Freight Broker', canExecute: false, modes: ['GROUND', 'OCEAN', 'AIR'] },
  FORWARDER: { id: 'FORWARDER', name: 'Freight Forwarder', canExecute: false, modes: ['OCEAN', 'AIR'] },
  COURIER_SERVICE: { id: 'COURIER_SERVICE', name: 'Courier Service', canExecute: true, modes: ['COURIER'] },
  FLEET_OWNER: { id: 'FLEET_OWNER', name: 'Fleet Owner', canExecute: true, modes: ['GROUND'] },
  OWNER_OPERATOR: { id: 'OWNER_OPERATOR', name: 'Owner Operator', canExecute: true, modes: ['GROUND'] },
  DRAYAGE: { id: 'DRAYAGE', name: 'Drayage Provider', canExecute: true, modes: ['GROUND', 'INTERMODAL'] },
  AIRLINE: { id: 'AIRLINE', name: 'Air Cargo Carrier', canExecute: true, modes: ['AIR'] },
  OCEAN_LINE: { id: 'OCEAN_LINE', name: 'Ocean Carrier', canExecute: true, modes: ['OCEAN'] }
};

const DISTRIBUTION_STRATEGIES = {
  COST_OPTIMIZED: { id: 'COST_OPTIMIZED', name: 'Cost Optimized', prioritize: 'cost', description: 'Minimize total shipping cost' },
  TIME_OPTIMIZED: { id: 'TIME_OPTIMIZED', name: 'Time Optimized', prioritize: 'speed', description: 'Fastest delivery possible' },
  BALANCED: { id: 'BALANCED', name: 'Balanced', prioritize: 'balanced', description: 'Balance cost and time' },
  PARTNER_FIRST: { id: 'PARTNER_FIRST', name: 'Partner First', prioritize: 'partners', description: 'Prioritize partner network' },
  CAPACITY_FILL: { id: 'CAPACITY_FILL', name: 'Capacity Fill', prioritize: 'utilization', description: 'Maximize capacity utilization' },
  SUSTAINABILITY: { id: 'SUSTAINABILITY', name: 'Sustainability', prioritize: 'eco', description: 'Minimize carbon footprint' }
};

const partners = new Map();
const distributedLoads = new Map();
const routingQueue = [];

function registerPartner(partnerData) {
  const partnerId = `PTR-${crypto.randomBytes(6).toString('hex')}`;
  
  const partner = {
    id: partnerId,
    type: PARTNER_TYPES[partnerData.type] || PARTNER_TYPES.CARRIER,
    name: partnerData.name,
    contact: partnerData.contact,
    capabilities: {
      modes: partnerData.modes || [],
      equipment: partnerData.equipment || [],
      regions: partnerData.regions || [],
      maxWeight: partnerData.maxWeight || 45000,
      hazmat: partnerData.hazmat || false,
      temperature: partnerData.temperature || false
    },
    capacity: {
      daily: partnerData.dailyCapacity || 10,
      available: partnerData.dailyCapacity || 10,
      reserved: 0
    },
    performance: {
      onTimePercent: 95,
      acceptanceRate: 85,
      claimsRate: 0.5,
      rating: 4.5,
      totalLoads: 0
    },
    pricing: {
      baseRate: partnerData.baseRate || 2.50,
      fuelSurcharge: partnerData.fuelSurcharge || 0.25,
      accessorialRates: partnerData.accessorialRates || {}
    },
    status: 'ACTIVE',
    onboardedAt: new Date().toISOString()
  };
  
  partners.set(partnerId, partner);
  return { success: true, partner };
}

function findEligiblePartners(load, strategy = 'BALANCED') {
  const eligible = [];
  
  for (const [partnerId, partner] of partners) {
    if (partner.status !== 'ACTIVE') continue;
    if (!partner.capabilities.modes.includes(load.mode)) continue;
    if (partner.capacity.available <= 0) continue;
    
    if (load.weight && load.weight > partner.capabilities.maxWeight) continue;
    if (load.hazmat && !partner.capabilities.hazmat) continue;
    if (load.temperature && !partner.capabilities.temperature) continue;
    
    const score = calculatePartnerScore(partner, load, strategy);
    
    eligible.push({
      partner,
      score,
      estimatedRate: calculatePartnerRate(partner, load),
      estimatedTransit: estimateTransitTime(partner, load)
    });
  }
  
  return eligible.sort((a, b) => b.score - a.score);
}

function calculatePartnerScore(partner, load, strategy) {
  let score = 50;
  
  score += partner.performance.onTimePercent * 0.3;
  score += partner.performance.rating * 5;
  score -= partner.performance.claimsRate * 10;
  
  const strategyConfig = DISTRIBUTION_STRATEGIES[strategy];
  if (strategyConfig) {
    if (strategyConfig.prioritize === 'cost') {
      score -= partner.pricing.baseRate * 5;
    } else if (strategyConfig.prioritize === 'speed') {
      score += partner.performance.acceptanceRate * 0.2;
    } else if (strategyConfig.prioritize === 'partners') {
      score += 20;
    }
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculatePartnerRate(partner, load) {
  let rate = partner.pricing.baseRate * (load.distance || 500);
  rate += partner.pricing.fuelSurcharge * (load.distance || 500);
  
  if (load.hazmat) rate *= 1.25;
  if (load.temperature) rate *= 1.15;
  
  return parseFloat(rate.toFixed(2));
}

function estimateTransitTime(partner, load) {
  const mode = DISTRIBUTION_MODES[load.mode] || DISTRIBUTION_MODES.GROUND;
  const baseDays = (mode.avgTransitDays.min + mode.avgTransitDays.max) / 2;
  
  const adjustment = partner.performance.onTimePercent >= 95 ? -0.5 : 0.5;
  
  return Math.max(1, Math.round(baseDays + adjustment));
}

function distributeLoad(load, partnerId, metadata = {}) {
  const partner = partners.get(partnerId);
  if (!partner) return { success: false, error: 'Partner not found' };
  if (partner.capacity.available <= 0) return { success: false, error: 'No capacity available' };
  
  const distributionId = `DIST-${crypto.randomBytes(6).toString('hex')}`;
  
  const distribution = {
    id: distributionId,
    load,
    partnerId,
    partnerName: partner.name,
    partnerType: partner.type.id,
    rate: calculatePartnerRate(partner, load),
    estimatedTransit: estimateTransitTime(partner, load),
    status: 'DISTRIBUTED',
    timeline: [{
      status: 'DISTRIBUTED',
      timestamp: new Date().toISOString()
    }],
    metadata,
    distributedAt: new Date().toISOString()
  };
  
  partner.capacity.available--;
  partner.capacity.reserved++;
  partner.performance.totalLoads++;
  
  distributedLoads.set(distributionId, distribution);
  
  return { success: true, distribution };
}

function autoDistribute(loads, strategy = 'BALANCED') {
  const results = {
    distributed: [],
    unassigned: [],
    strategy,
    processedAt: new Date().toISOString()
  };
  
  for (const load of loads) {
    const eligible = findEligiblePartners(load, strategy);
    
    if (eligible.length > 0) {
      const bestMatch = eligible[0];
      const result = distributeLoad(load, bestMatch.partner.id, { strategy, autoAssigned: true });
      
      if (result.success) {
        results.distributed.push({
          load,
          distribution: result.distribution,
          partner: bestMatch.partner.name
        });
      } else {
        results.unassigned.push({ load, reason: result.error });
      }
    } else {
      results.unassigned.push({ load, reason: 'No eligible partners found' });
    }
  }
  
  return results;
}

function routeThroughLoadboard(capturedContracts, targetViews = ['DRIVER', 'OPS']) {
  const routed = [];
  
  for (const captured of capturedContracts) {
    const mode = captured.contract?.mode || captured.mode;
    let primaryView = 'DRIVER';
    
    if (mode === 'COURIER') primaryView = 'DRIVER';
    else if (mode === 'OCEAN' || mode === 'AIR') primaryView = 'OPS';
    else primaryView = 'DRIVER';
    
    const routedLoad = {
      id: `ROUTE-${crypto.randomBytes(4).toString('hex')}`,
      sourceContract: captured,
      view: primaryView,
      additionalViews: targetViews.filter(v => v !== primaryView),
      mode,
      status: 'POSTED',
      postedAt: new Date().toISOString()
    };
    
    routed.push(routedLoad);
    routingQueue.push(routedLoad);
  }
  
  return {
    success: true,
    routed,
    count: routed.length
  };
}

function getDistributionByMode() {
  const allDistributions = Array.from(distributedLoads.values());
  const byMode = {};
  
  for (const mode of Object.keys(DISTRIBUTION_MODES)) {
    byMode[mode] = {
      count: allDistributions.filter(d => d.load.mode === mode).length,
      totalRevenue: allDistributions
        .filter(d => d.load.mode === mode)
        .reduce((sum, d) => sum + d.rate, 0)
    };
  }
  
  return byMode;
}

function getPartnerUtilization() {
  const utilization = [];
  
  for (const [partnerId, partner] of partners) {
    utilization.push({
      partnerId,
      name: partner.name,
      type: partner.type.name,
      capacity: partner.capacity,
      utilizationPercent: ((partner.capacity.reserved / partner.capacity.daily) * 100).toFixed(1),
      performance: partner.performance
    });
  }
  
  return utilization.sort((a, b) => parseFloat(b.utilizationPercent) - parseFloat(a.utilizationPercent));
}

function getDistributionAnalytics() {
  const allDistributions = Array.from(distributedLoads.values());
  const allPartners = Array.from(partners.values());
  
  return {
    summary: {
      totalDistributed: allDistributions.length,
      totalRevenue: allDistributions.reduce((sum, d) => sum + d.rate, 0),
      avgRate: allDistributions.length > 0 
        ? (allDistributions.reduce((sum, d) => sum + d.rate, 0) / allDistributions.length).toFixed(2)
        : 0,
      activePartners: allPartners.filter(p => p.status === 'ACTIVE').length,
      totalCapacity: allPartners.reduce((sum, p) => sum + p.capacity.daily, 0),
      utilizedCapacity: allPartners.reduce((sum, p) => sum + p.capacity.reserved, 0)
    },
    byMode: getDistributionByMode(),
    byPartnerType: Object.fromEntries(
      Object.keys(PARTNER_TYPES).map(type => [
        type,
        allDistributions.filter(d => {
          const partner = partners.get(d.partnerId);
          return partner?.type.id === type;
        }).length
      ])
    ),
    routingQueue: {
      pending: routingQueue.filter(r => r.status === 'POSTED').length,
      total: routingQueue.length
    }
  };
}

function getPartner(partnerId) {
  return partners.get(partnerId) || null;
}

function getPartners(filters = {}) {
  let result = Array.from(partners.values());
  
  if (filters.type) result = result.filter(p => p.type.id === filters.type);
  if (filters.mode) result = result.filter(p => p.capabilities.modes.includes(filters.mode));
  if (filters.status) result = result.filter(p => p.status === filters.status);
  if (filters.hasCapacity) result = result.filter(p => p.capacity.available > 0);
  
  return result.slice(0, filters.limit || 100);
}

function getDistributedLoads(filters = {}) {
  let result = Array.from(distributedLoads.values());
  
  if (filters.partnerId) result = result.filter(d => d.partnerId === filters.partnerId);
  if (filters.mode) result = result.filter(d => d.load.mode === filters.mode);
  if (filters.status) result = result.filter(d => d.status === filters.status);
  
  return result.slice(0, filters.limit || 100);
}

function getDistributionModes() {
  return Object.values(DISTRIBUTION_MODES);
}

function getPartnerTypes() {
  return Object.values(PARTNER_TYPES);
}

function getDistributionStrategies() {
  return Object.values(DISTRIBUTION_STRATEGIES);
}

function getRoutingQueue(filters = {}) {
  let result = [...routingQueue];
  
  if (filters.view) result = result.filter(r => r.view === filters.view || r.additionalViews?.includes(filters.view));
  if (filters.mode) result = result.filter(r => r.mode === filters.mode);
  if (filters.status) result = result.filter(r => r.status === filters.status);
  
  return result.slice(0, filters.limit || 100);
}

module.exports = {
  DISTRIBUTION_MODES,
  PARTNER_TYPES,
  DISTRIBUTION_STRATEGIES,
  registerPartner,
  findEligiblePartners,
  distributeLoad,
  autoDistribute,
  routeThroughLoadboard,
  getDistributionByMode,
  getPartnerUtilization,
  getDistributionAnalytics,
  getPartner,
  getPartners,
  getDistributedLoads,
  getDistributionModes,
  getPartnerTypes,
  getDistributionStrategies,
  getRoutingQueue
};
