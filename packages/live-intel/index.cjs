const crypto = require('crypto');
const axios = require('axios');

const INTEL_CATEGORIES = {
  MARKET: 'MARKET',
  OPERATIONAL: 'OPERATIONAL',
  COMPLIANCE: 'COMPLIANCE',
  PARTNER: 'PARTNER'
};

const INTEL_SOURCES = {
  FREIGHT_RATES: { id: 'freight-rates', name: 'Freight Rate Index', category: INTEL_CATEGORIES.MARKET, provider: 'DYNASTY_INTEL' },
  FUEL_PRICES: { id: 'fuel-prices', name: 'Fuel Price Monitor', category: INTEL_CATEGORIES.MARKET, provider: 'DYNASTY_INTEL' },
  WEATHER: { id: 'weather', name: 'Weather Conditions', category: INTEL_CATEGORIES.OPERATIONAL, provider: 'DYNASTY_INTEL' },
  TRAFFIC: { id: 'traffic', name: 'Traffic & Delays', category: INTEL_CATEGORIES.OPERATIONAL, provider: 'DYNASTY_INTEL' },
  PORT_STATUS: { id: 'port-status', name: 'Port Operations', category: INTEL_CATEGORIES.OPERATIONAL, provider: 'DYNASTY_INTEL' },
  AIRPORT_STATUS: { id: 'airport-status', name: 'Airport Operations', category: INTEL_CATEGORIES.OPERATIONAL, provider: 'DYNASTY_INTEL' },
  REGULATORY: { id: 'regulatory', name: 'Regulatory Updates', category: INTEL_CATEGORIES.COMPLIANCE, provider: 'DYNASTY_INTEL' },
  PARTNER_BOARDS: { id: 'partner-boards', name: 'Partner Loadboard Status', category: INTEL_CATEGORIES.PARTNER, provider: 'DYNASTY_INTEL' },
  DEMAND_SIGNALS: { id: 'demand-signals', name: 'Market Demand', category: INTEL_CATEGORIES.MARKET, provider: 'DYNASTY_INTEL' }
};

const intelCache = new Map();
const alertsCache = [];
const MAX_ALERTS = 100;
const CACHE_TTL = 60000;
const ALERT_TTL = 3600000;

const sourceHealth = new Map();

function generateId(prefix = 'INTEL') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function codexLog(type, moduleName, data, actor = 'live-intel') {
  const codexUrl = process.env.CODEX_URL || 'http://localhost:3001';
  try {
    const response = await axios.post(`${codexUrl}/codex/records`, {
      type,
      module: moduleName,
      data,
      actor
    });
    console.log('[CODEX] New record:', response.data);
    return response.data;
  } catch (err) {
    console.error('[LIVE_INTEL] Codex log failed:', err.message);
    return null;
  }
}

class FreightRateCollector {
  static async collect() {
    const regions = ['NORTH_AMERICA', 'EUROPE', 'ASIA_PACIFIC', 'LATAM'];
    const modes = ['GROUND', 'AIR', 'OCEAN', 'COURIER'];
    
    const rates = {};
    const baseRates = { GROUND: 2.15, AIR: 4.50, OCEAN: 0.85, COURIER: 8.25 };
    const regionMultipliers = { NORTH_AMERICA: 1.0, EUROPE: 1.15, ASIA_PACIFIC: 0.90, LATAM: 0.85 };
    
    const volatility = (Math.random() - 0.5) * 0.1;
    const trend = Math.sin(Date.now() / 3600000) * 0.05;
    
    for (const region of regions) {
      rates[region] = {};
      for (const mode of modes) {
        const base = baseRates[mode] * regionMultipliers[region];
        const current = base * (1 + volatility + trend);
        const change24h = (Math.random() - 0.5) * 0.08;
        
        rates[region][mode] = {
          current: parseFloat(current.toFixed(3)),
          change24h: parseFloat((change24h * 100).toFixed(2)),
          trend: change24h > 0.02 ? 'UP' : change24h < -0.02 ? 'DOWN' : 'STABLE',
          unit: mode === 'OCEAN' ? 'per_teu' : 'per_mile'
        };
      }
    }
    
    return {
      sourceId: INTEL_SOURCES.FREIGHT_RATES.id,
      category: INTEL_CATEGORIES.MARKET,
      obtainedAt: new Date().toISOString(),
      metrics: {
        rates,
        marketHealth: volatility > 0 ? 'STRONG' : 'MODERATE',
        lastUpdate: new Date().toISOString()
      },
      advisories: Math.abs(volatility) > 0.04 ? [{
        level: 'INFO',
        message: 'Elevated rate volatility detected across markets'
      }] : []
    };
  }
}

class FuelPriceCollector {
  static async collect() {
    const basePrices = {
      DIESEL: 3.85,
      GASOLINE: 3.45,
      JET_FUEL: 4.20,
      BUNKER: 0.65
    };
    
    const volatility = (Math.random() - 0.5) * 0.15;
    
    const prices = {};
    for (const [fuel, base] of Object.entries(basePrices)) {
      const current = base * (1 + volatility);
      prices[fuel] = {
        current: parseFloat(current.toFixed(3)),
        change24h: parseFloat((volatility * 100).toFixed(2)),
        trend: volatility > 0.03 ? 'UP' : volatility < -0.03 ? 'DOWN' : 'STABLE',
        unit: fuel === 'BUNKER' ? 'per_mt' : 'per_gallon'
      };
    }
    
    return {
      sourceId: INTEL_SOURCES.FUEL_PRICES.id,
      category: INTEL_CATEGORIES.MARKET,
      obtainedAt: new Date().toISOString(),
      metrics: {
        prices,
        averageChange: parseFloat((volatility * 100).toFixed(2)),
        lastUpdate: new Date().toISOString()
      },
      advisories: volatility > 0.08 ? [{
        level: 'WARNING',
        message: 'Significant fuel price increase detected - review margin calculations'
      }] : []
    };
  }
}

class WeatherCollector {
  static async collect() {
    const regions = {
      NORTH_AMERICA: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
      EUROPE: ['London', 'Frankfurt', 'Rotterdam', 'Paris', 'Madrid'],
      ASIA_PACIFIC: ['Shanghai', 'Singapore', 'Tokyo', 'Hong Kong', 'Sydney'],
      LATAM: ['Sao Paulo', 'Mexico City', 'Buenos Aires', 'Bogota', 'Lima']
    };
    
    const conditions = ['CLEAR', 'CLOUDY', 'RAIN', 'STORM', 'SNOW', 'FOG'];
    const severity = { CLEAR: 0, CLOUDY: 1, RAIN: 2, FOG: 3, SNOW: 4, STORM: 5 };
    
    const weather = {};
    const alerts = [];
    
    for (const [region, cities] of Object.entries(regions)) {
      weather[region] = {};
      for (const city of cities) {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const temp = Math.floor(Math.random() * 40) - 5;
        const wind = Math.floor(Math.random() * 50);
        
        weather[region][city] = {
          condition,
          temperature: temp,
          windSpeed: wind,
          visibility: condition === 'FOG' ? 'LOW' : condition === 'STORM' ? 'POOR' : 'GOOD',
          impactScore: severity[condition]
        };
        
        if (severity[condition] >= 4) {
          alerts.push({
            region,
            city,
            condition,
            level: 'WARNING',
            message: `${condition} conditions affecting ${city} - expect delays`
          });
        }
      }
    }
    
    return {
      sourceId: INTEL_SOURCES.WEATHER.id,
      category: INTEL_CATEGORIES.OPERATIONAL,
      obtainedAt: new Date().toISOString(),
      metrics: {
        conditions: weather,
        alertCount: alerts.length,
        lastUpdate: new Date().toISOString()
      },
      advisories: alerts
    };
  }
}

class TrafficCollector {
  static async collect() {
    const corridors = {
      NORTH_AMERICA: [
        { name: 'I-95 Corridor', from: 'Boston', to: 'Miami' },
        { name: 'I-10 Corridor', from: 'Los Angeles', to: 'Houston' },
        { name: 'I-80 Corridor', from: 'San Francisco', to: 'Chicago' }
      ],
      EUROPE: [
        { name: 'A1/E45', from: 'Milan', to: 'Hamburg' },
        { name: 'A4/E40', from: 'Lisbon', to: 'Kyiv' }
      ],
      ASIA_PACIFIC: [
        { name: 'China-Japan Route', from: 'Shanghai', to: 'Tokyo' },
        { name: 'ASEAN Corridor', from: 'Singapore', to: 'Bangkok' }
      ]
    };
    
    const traffic = {};
    const delays = [];
    
    for (const [region, routes] of Object.entries(corridors)) {
      traffic[region] = routes.map(route => {
        const congestion = Math.random();
        const delayMinutes = Math.floor(congestion * 120);
        
        const status = {
          ...route,
          congestionLevel: congestion > 0.7 ? 'HIGH' : congestion > 0.4 ? 'MODERATE' : 'LOW',
          estimatedDelay: delayMinutes,
          incidents: Math.floor(Math.random() * 3)
        };
        
        if (congestion > 0.7) {
          delays.push({
            region,
            corridor: route.name,
            level: 'WARNING',
            message: `Heavy congestion on ${route.name} - ${delayMinutes} min delay`
          });
        }
        
        return status;
      });
    }
    
    return {
      sourceId: INTEL_SOURCES.TRAFFIC.id,
      category: INTEL_CATEGORIES.OPERATIONAL,
      obtainedAt: new Date().toISOString(),
      metrics: {
        corridors: traffic,
        totalDelays: delays.length,
        lastUpdate: new Date().toISOString()
      },
      advisories: delays
    };
  }
}

class PortStatusCollector {
  static async collect() {
    const ports = {
      NORTH_AMERICA: ['Los Angeles', 'Long Beach', 'New York', 'Savannah', 'Houston'],
      EUROPE: ['Rotterdam', 'Hamburg', 'Antwerp', 'Valencia', 'Felixstowe'],
      ASIA_PACIFIC: ['Shanghai', 'Singapore', 'Shenzhen', 'Busan', 'Hong Kong'],
      LATAM: ['Santos', 'Manzanillo', 'Callao', 'Cartagena', 'Buenos Aires']
    };
    
    const portStatus = {};
    const alerts = [];
    
    for (const [region, portList] of Object.entries(ports)) {
      portStatus[region] = portList.map(port => {
        const congestion = Math.random();
        const waitDays = Math.floor(congestion * 7);
        const status = congestion > 0.8 ? 'CONGESTED' : congestion > 0.5 ? 'BUSY' : 'NORMAL';
        
        if (status === 'CONGESTED') {
          alerts.push({
            region,
            port,
            level: 'WARNING',
            message: `Port ${port} experiencing ${waitDays}-day wait times`
          });
        }
        
        return {
          name: port,
          status,
          waitTime: waitDays,
          berthAvailability: Math.floor((1 - congestion) * 100),
          vesselQueue: Math.floor(congestion * 30)
        };
      });
    }
    
    return {
      sourceId: INTEL_SOURCES.PORT_STATUS.id,
      category: INTEL_CATEGORIES.OPERATIONAL,
      obtainedAt: new Date().toISOString(),
      metrics: {
        ports: portStatus,
        globalCongestion: Object.values(portStatus).flat().filter(p => p.status === 'CONGESTED').length,
        lastUpdate: new Date().toISOString()
      },
      advisories: alerts
    };
  }
}

class DemandSignalCollector {
  static async collect() {
    const regions = ['NORTH_AMERICA', 'EUROPE', 'ASIA_PACIFIC', 'LATAM'];
    const modes = ['GROUND', 'AIR', 'OCEAN', 'COURIER'];
    
    const demand = {};
    const opportunities = [];
    
    for (const region of regions) {
      demand[region] = {};
      for (const mode of modes) {
        const level = Math.random();
        const score = Math.floor(level * 100);
        
        demand[region][mode] = {
          demandScore: score,
          trend: level > 0.6 ? 'INCREASING' : level < 0.4 ? 'DECREASING' : 'STABLE',
          capacityUtilization: Math.floor(level * 95),
          projectedGrowth: parseFloat(((level - 0.5) * 20).toFixed(1))
        };
        
        if (score > 80) {
          opportunities.push({
            region,
            mode,
            level: 'INFO',
            message: `High demand in ${region} ${mode} - expansion opportunity`
          });
        }
      }
    }
    
    return {
      sourceId: INTEL_SOURCES.DEMAND_SIGNALS.id,
      category: INTEL_CATEGORIES.MARKET,
      obtainedAt: new Date().toISOString(),
      metrics: {
        demand,
        hotspots: opportunities.length,
        lastUpdate: new Date().toISOString()
      },
      advisories: opportunities
    };
  }
}

class PartnerBoardCollector {
  static async collect() {
    const partners = [
      { id: 'dat-freight', name: 'DAT Freight', type: 'LOADBOARD' },
      { id: 'uber-freight', name: 'Uber Freight', type: 'LOADBOARD' },
      { id: 'freightos', name: 'Freightos', type: 'MARKETPLACE' },
      { id: 'convoy', name: 'Convoy', type: 'LOADBOARD' },
      { id: 'flexport', name: 'Flexport', type: 'FORWARDER' },
      { id: 'shiprocket', name: 'ShipRocket', type: 'COURIER' },
      { id: 'sendle', name: 'Sendle', type: 'COURIER' },
      { id: 'freightview', name: 'FreightView', type: 'LOADBOARD' },
      { id: 'loadsmith', name: 'Loadsmith', type: 'LOADBOARD' }
    ];
    
    const status = partners.map(partner => {
      const uptime = 0.95 + Math.random() * 0.05;
      const responseTime = Math.floor(100 + Math.random() * 400);
      const isOnline = Math.random() > 0.05;
      
      return {
        ...partner,
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        uptime: parseFloat((uptime * 100).toFixed(2)),
        avgResponseTime: responseTime,
        contractsAvailable: isOnline ? Math.floor(Math.random() * 50) + 10 : 0,
        lastHeartbeat: new Date().toISOString()
      };
    });
    
    const offline = status.filter(p => p.status === 'OFFLINE');
    
    return {
      sourceId: INTEL_SOURCES.PARTNER_BOARDS.id,
      category: INTEL_CATEGORIES.PARTNER,
      obtainedAt: new Date().toISOString(),
      metrics: {
        partners: status,
        onlineCount: status.filter(p => p.status === 'ONLINE').length,
        totalContracts: status.reduce((sum, p) => sum + p.contractsAvailable, 0),
        lastUpdate: new Date().toISOString()
      },
      advisories: offline.map(p => ({
        level: 'WARNING',
        message: `Partner ${p.name} is currently offline`
      }))
    };
  }
}

const collectors = {
  [INTEL_SOURCES.FREIGHT_RATES.id]: FreightRateCollector,
  [INTEL_SOURCES.FUEL_PRICES.id]: FuelPriceCollector,
  [INTEL_SOURCES.WEATHER.id]: WeatherCollector,
  [INTEL_SOURCES.TRAFFIC.id]: TrafficCollector,
  [INTEL_SOURCES.PORT_STATUS.id]: PortStatusCollector,
  [INTEL_SOURCES.DEMAND_SIGNALS.id]: DemandSignalCollector,
  [INTEL_SOURCES.PARTNER_BOARDS.id]: PartnerBoardCollector
};

async function runCollector(sourceId) {
  const collector = collectors[sourceId];
  if (!collector) {
    console.error(`[LIVE_INTEL] Unknown collector: ${sourceId}`);
    return null;
  }
  
  const startTime = Date.now();
  
  try {
    const data = await collector.collect();
    const duration = Date.now() - startTime;
    
    sourceHealth.set(sourceId, {
      status: 'HEALTHY',
      lastSuccess: new Date().toISOString(),
      duration,
      failureCount: 0
    });
    
    intelCache.set(sourceId, {
      data,
      expiresAt: Date.now() + CACHE_TTL
    });
    
    await persistSnapshot(data);
    
    return data;
  } catch (error) {
    const health = sourceHealth.get(sourceId) || { failureCount: 0 };
    sourceHealth.set(sourceId, {
      status: 'DEGRADED',
      lastError: error.message,
      lastAttempt: new Date().toISOString(),
      failureCount: health.failureCount + 1
    });
    
    console.error(`[LIVE_INTEL] Collector ${sourceId} failed:`, error.message);
    
    const cached = intelCache.get(sourceId);
    if (cached) {
      console.log(`[LIVE_INTEL] Using cached data for ${sourceId}`);
      return cached.data;
    }
    
    return null;
  }
}

async function persistSnapshot(data) {
}

async function persistAlert(alert, sourceId, category) {
}

let orchestratorInterval = null;
let isRunning = false;
let lastRunAt = null;
let runCount = 0;

async function runOrchestrator() {
  if (isRunning) {
    console.log('[LIVE_INTEL] Orchestrator already running, skipping...');
    return;
  }
  
  isRunning = true;
  const startTime = Date.now();
  runCount++;
  
  console.log(`[LIVE_INTEL] === Orchestrator Run #${runCount} ===`);
  
  const results = {
    success: [],
    failed: [],
    cached: []
  };
  
  const allAlerts = [];
  
  for (const sourceId of Object.keys(collectors)) {
    try {
      const data = await runCollector(sourceId);
      if (data) {
        results.success.push(sourceId);
        if (data.advisories && data.advisories.length > 0) {
          allAlerts.push(...data.advisories.map(a => ({ ...a, sourceId })));
        }
      } else {
        results.failed.push(sourceId);
      }
    } catch (err) {
      results.failed.push(sourceId);
    }
  }
  
  const now = Date.now();
  for (const alert of allAlerts) {
    alertsCache.push({
      id: generateId('ALERT'),
      sourceId: alert.sourceId,
      category: alert.category || INTEL_CATEGORIES.OPERATIONAL,
      severity: alert.level || 'INFO',
      message: alert.message,
      createdAt: new Date().toISOString(),
      expiresAt: now + ALERT_TTL
    });
  }
  
  while (alertsCache.length > MAX_ALERTS) {
    alertsCache.shift();
  }
  
  const expiredThreshold = now;
  let i = 0;
  while (i < alertsCache.length) {
    if (alertsCache[i].expiresAt < expiredThreshold) {
      alertsCache.splice(i, 1);
    } else {
      i++;
    }
  }
  
  const duration = Date.now() - startTime;
  lastRunAt = new Date().toISOString();
  
  await codexLog('LIVE_INTEL_UPDATE', 'LIVE_INTEL', {
    runNumber: runCount,
    duration,
    success: results.success.length,
    failed: results.failed.length,
    alertsGenerated: allAlerts.length
  });
  
  console.log(`[LIVE_INTEL] Run #${runCount} complete: ${results.success.length} success, ${results.failed.length} failed, ${allAlerts.length} alerts (${duration}ms)`);
  
  isRunning = false;
}

function startOrchestrator(intervalMs = 60000) {
  if (orchestratorInterval) {
    console.log('[LIVE_INTEL] Orchestrator already started');
    return;
  }
  
  console.log(`[LIVE_INTEL] Starting orchestrator with ${intervalMs}ms interval`);
  
  runOrchestrator();
  
  orchestratorInterval = setInterval(runOrchestrator, intervalMs);
  
  return {
    stop: stopOrchestrator,
    getStatus: getOrchestratorStatus
  };
}

function stopOrchestrator() {
  if (orchestratorInterval) {
    clearInterval(orchestratorInterval);
    orchestratorInterval = null;
    console.log('[LIVE_INTEL] Orchestrator stopped');
  }
}

function getOrchestratorStatus() {
  return {
    running: !!orchestratorInterval,
    lastRunAt,
    runCount,
    sourceHealth: Object.fromEntries(sourceHealth),
    cacheStatus: Object.fromEntries(
      Array.from(intelCache.entries()).map(([k, v]) => [k, {
        cached: true,
        expiresAt: new Date(v.expiresAt).toISOString(),
        expired: Date.now() > v.expiresAt
      }])
    )
  };
}

function getLatestIntel(category = null) {
  const result = {};
  
  for (const [sourceId, cached] of intelCache.entries()) {
    if (!category || cached.data.category === category) {
      result[sourceId] = {
        ...cached.data,
        fromCache: Date.now() > cached.expiresAt,
        cacheAge: Math.floor((Date.now() - new Date(cached.data.obtainedAt).getTime()) / 1000)
      };
    }
  }
  
  return result;
}

function getMarketIntel() {
  return getLatestIntel(INTEL_CATEGORIES.MARKET);
}

function getOperationalIntel() {
  return getLatestIntel(INTEL_CATEGORIES.OPERATIONAL);
}

function getComplianceIntel() {
  return getLatestIntel(INTEL_CATEGORIES.COMPLIANCE);
}

function getPartnerIntel() {
  return getLatestIntel(INTEL_CATEGORIES.PARTNER);
}

function getActiveAlerts(limit = 50) {
  const now = Date.now();
  return alertsCache
    .filter(alert => alert.expiresAt > now)
    .slice(-limit)
    .reverse();
}

function getDispatchAdjustments(region, mode) {
  const intel = getLatestIntel();
  const adjustments = {
    rateMultiplier: 1.0,
    delayFactor: 0,
    riskScore: 0,
    advisories: []
  };
  
  const freightRates = intel['freight-rates']?.metrics?.rates?.[region]?.[mode];
  if (freightRates) {
    if (freightRates.trend === 'UP') adjustments.rateMultiplier = 1.05;
    if (freightRates.trend === 'DOWN') adjustments.rateMultiplier = 0.95;
  }
  
  const fuelPrices = intel['fuel-prices']?.metrics?.prices;
  if (fuelPrices) {
    const fuelType = mode === 'AIR' ? 'JET_FUEL' : mode === 'OCEAN' ? 'BUNKER' : 'DIESEL';
    const fuel = fuelPrices[fuelType];
    if (fuel && fuel.change24h > 5) {
      adjustments.rateMultiplier *= 1.02;
      adjustments.advisories.push('Fuel price surge affecting costs');
    }
  }
  
  const weather = intel['weather']?.metrics?.conditions?.[region];
  if (weather) {
    const severeWeather = Object.values(weather).filter(w => w.impactScore >= 4);
    if (severeWeather.length > 0) {
      adjustments.delayFactor += severeWeather.length * 30;
      adjustments.riskScore += 15;
      adjustments.advisories.push(`Severe weather in ${severeWeather.length} cities`);
    }
  }
  
  const traffic = intel['traffic']?.metrics?.corridors?.[region];
  if (traffic) {
    const congested = traffic.filter(c => c.congestionLevel === 'HIGH');
    if (congested.length > 0) {
      adjustments.delayFactor += congested.reduce((sum, c) => sum + c.estimatedDelay, 0);
      adjustments.riskScore += 10;
    }
  }
  
  if (mode === 'OCEAN') {
    const ports = intel['port-status']?.metrics?.ports?.[region];
    if (ports) {
      const congested = ports.filter(p => p.status === 'CONGESTED');
      if (congested.length > 0) {
        adjustments.delayFactor += congested.reduce((sum, p) => sum + p.waitTime * 24 * 60, 0);
        adjustments.riskScore += 20;
        adjustments.advisories.push(`${congested.length} ports congested`);
      }
    }
  }
  
  return adjustments;
}

function getTreasuryInsights() {
  const intel = getLatestIntel();
  
  const insights = {
    fuelCostTrend: 'STABLE',
    rateEnvironment: 'NORMAL',
    demandOutlook: 'MODERATE',
    recommendations: []
  };
  
  const fuel = intel['fuel-prices']?.metrics;
  if (fuel) {
    if (fuel.averageChange > 3) insights.fuelCostTrend = 'RISING';
    else if (fuel.averageChange < -3) insights.fuelCostTrend = 'FALLING';
  }
  
  const rates = intel['freight-rates']?.metrics;
  if (rates) {
    if (rates.marketHealth === 'STRONG') insights.rateEnvironment = 'FAVORABLE';
    else if (rates.marketHealth === 'WEAK') insights.rateEnvironment = 'CHALLENGED';
  }
  
  const demand = intel['demand-signals']?.metrics;
  if (demand) {
    if (demand.hotspots > 5) insights.demandOutlook = 'STRONG';
    else if (demand.hotspots < 2) insights.demandOutlook = 'WEAK';
  }
  
  if (insights.fuelCostTrend === 'RISING') {
    insights.recommendations.push('Consider fuel surcharge adjustments');
  }
  if (insights.rateEnvironment === 'FAVORABLE') {
    insights.recommendations.push('Market conditions support rate increases');
  }
  if (insights.demandOutlook === 'STRONG') {
    insights.recommendations.push('Expand capacity in high-demand regions');
  }
  
  return insights;
}

module.exports = {
  INTEL_CATEGORIES,
  INTEL_SOURCES,
  startOrchestrator,
  stopOrchestrator,
  getOrchestratorStatus,
  runOrchestrator,
  getLatestIntel,
  getMarketIntel,
  getOperationalIntel,
  getComplianceIntel,
  getPartnerIntel,
  getActiveAlerts,
  getDispatchAdjustments,
  getTreasuryInsights
};
