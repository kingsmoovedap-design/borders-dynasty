const LOADBOARD_VIEWS = {
  SHIPPER: {
    id: "SHIPPER",
    name: "Shipper View",
    description: "Post loads, track shipments, manage carriers",
    features: ["POST_LOADS", "TRACK_SHIPMENTS", "RATE_CARRIERS", "VIEW_HISTORY", "MANAGE_DOCUMENTS"],
    columns: ["loadId", "origin", "destination", "pickupDate", "status", "carrier", "rate", "tracking"]
  },
  DRIVER: {
    id: "DRIVER",
    name: "Driver View",
    description: "Find loads, view earnings, manage availability",
    features: ["SEARCH_LOADS", "VIEW_MATCH_SCORE", "ACCEPT_LOADS", "VIEW_EARNINGS", "SET_AVAILABILITY"],
    columns: ["loadId", "origin", "destination", "miles", "rate", "ratePerMile", "matchScore", "deadline"]
  },
  OPS: {
    id: "OPS",
    name: "Operations View",
    description: "Manage dispatch, monitor capacity, handle exceptions",
    features: ["DISPATCH_LOADS", "MONITOR_CAPACITY", "HANDLE_EXCEPTIONS", "VIEW_METRICS", "MANAGE_DRIVERS"],
    columns: ["loadId", "status", "driver", "eta", "exceptions", "compliance", "risk", "priority"]
  },
  OMEGA: {
    id: "OMEGA",
    name: "Omega View",
    description: "Strategic overview, revenue analysis, market penetration",
    features: ["REVENUE_ANALYTICS", "MARKET_SHARE", "MODE_PERFORMANCE", "REGION_ANALYSIS", "STRATEGIC_ALERTS"],
    columns: ["metric", "value", "trend", "target", "variance", "action"]
  }
};

const LOAD_STATUSES = {
  POSTED: { label: "Posted", color: "blue", nextActions: ["ASSIGN", "CANCEL"] },
  ASSIGNED: { label: "Assigned", color: "yellow", nextActions: ["PICKUP", "REASSIGN", "CANCEL"] },
  IN_TRANSIT: { label: "In Transit", color: "orange", nextActions: ["UPDATE_ETA", "REPORT_EXCEPTION", "DELIVER"] },
  DELIVERED: { label: "Delivered", color: "green", nextActions: ["CONFIRM_POD", "INITIATE_PAYOUT"] },
  COMPLETED: { label: "Completed", color: "gray", nextActions: ["VIEW_HISTORY"] },
  CANCELLED: { label: "Cancelled", color: "red", nextActions: ["REPOST"] },
  EXCEPTION: { label: "Exception", color: "purple", nextActions: ["RESOLVE", "ESCALATE"] }
};

const loadboardData = {
  loads: [],
  capacity: new Map(),
  laneAnalysis: new Map()
};

function generateLoadId() {
  return `LD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function postLoad(loadData, shipperId) {
  const load = {
    id: generateLoadId(),
    shipperId,
    origin: loadData.origin,
    destination: loadData.destination,
    originRegion: loadData.originRegion || "NORTH_AMERICA",
    destinationRegion: loadData.destinationRegion || "NORTH_AMERICA",
    mode: loadData.mode || "GROUND",
    equipment: loadData.equipment || "DRY_VAN",
    weight: loadData.weight || 0,
    distance: loadData.distance || 0,
    rate: loadData.rate || 0,
    ratePerMile: loadData.distance > 0 ? loadData.rate / loadData.distance : 0,
    pickupDate: loadData.pickupDate || new Date().toISOString(),
    deliveryDeadline: loadData.deliveryDeadline,
    specialRequirements: loadData.specialRequirements || [],
    status: "POSTED",
    postedAt: new Date().toISOString(),
    aiPricingSuggestion: generatePricingSuggestion(loadData),
    matchScore: null,
    assignedDriver: null
  };
  
  loadboardData.loads.push(load);
  updateLaneAnalysis(load);
  
  return {
    success: true,
    load,
    message: `Load ${load.id} posted successfully`
  };
}

function generatePricingSuggestion(loadData) {
  const baseRate = (loadData.distance || 500) * 2.50;
  const marketCondition = Math.random() > 0.5 ? "HIGH_DEMAND" : "NORMAL";
  const adjustment = marketCondition === "HIGH_DEMAND" ? 1.15 : 1.0;
  
  return {
    suggestedRate: Math.round(baseRate * adjustment * 100) / 100,
    marketCondition,
    confidence: 85,
    factors: ["distance", "equipment", "market_demand", "seasonal_trend"]
  };
}

function updateLaneAnalysis(load) {
  const laneKey = `${load.originRegion}-${load.destinationRegion}`;
  const current = loadboardData.laneAnalysis.get(laneKey) || { 
    totalLoads: 0, 
    avgRate: 0, 
    volume: [] 
  };
  
  current.totalLoads++;
  current.avgRate = ((current.avgRate * (current.totalLoads - 1)) + (load.ratePerMile || 0)) / current.totalLoads;
  current.volume.push({ date: new Date().toISOString(), rate: load.rate });
  
  loadboardData.laneAnalysis.set(laneKey, current);
}

function getLoadsForView(viewType, userId, filters = {}) {
  let loads = [...loadboardData.loads];
  
  if (filters.status) {
    loads = loads.filter(l => l.status === filters.status);
  }
  if (filters.mode) {
    loads = loads.filter(l => l.mode === filters.mode);
  }
  if (filters.region) {
    loads = loads.filter(l => l.originRegion === filters.region || l.destinationRegion === filters.region);
  }
  
  switch (viewType) {
    case "SHIPPER":
      loads = loads.filter(l => l.shipperId === userId);
      break;
    case "DRIVER":
      loads = loads.filter(l => l.status === "POSTED" || l.assignedDriver === userId);
      loads = loads.map(l => ({
        ...l,
        matchScore: calculateDriverMatchScore(l, userId)
      }));
      loads.sort((a, b) => (b.matchScore?.score || 0) - (a.matchScore?.score || 0));
      break;
    case "OPS":
      break;
    case "OMEGA":
      break;
  }
  
  return {
    view: LOADBOARD_VIEWS[viewType],
    loads: loads.slice(0, filters.limit || 50),
    totalCount: loads.length,
    filters
  };
}

function calculateDriverMatchScore(load, driverId) {
  const baseScore = 70;
  const equipmentBonus = 10;
  const proximityBonus = Math.floor(Math.random() * 15);
  const laneBonus = Math.floor(Math.random() * 10);
  
  const score = Math.min(100, baseScore + equipmentBonus + proximityBonus + laneBonus);
  
  return {
    score,
    factors: {
      equipment: equipmentBonus,
      proximity: proximityBonus,
      laneExperience: laneBonus
    },
    recommendation: score >= 85 ? "EXCELLENT_MATCH" : score >= 70 ? "GOOD_MATCH" : "CONSIDER"
  };
}

function assignLoad(loadId, driverId, assignedBy) {
  const load = loadboardData.loads.find(l => l.id === loadId);
  if (!load) return { success: false, error: "Load not found" };
  if (load.status !== "POSTED") return { success: false, error: "Load not available for assignment" };
  
  load.status = "ASSIGNED";
  load.assignedDriver = driverId;
  load.assignedAt = new Date().toISOString();
  load.assignedBy = assignedBy;
  
  return {
    success: true,
    load,
    message: `Load ${loadId} assigned to driver ${driverId}`
  };
}

function updateLoadStatus(loadId, newStatus, metadata = {}) {
  const load = loadboardData.loads.find(l => l.id === loadId);
  if (!load) return { success: false, error: "Load not found" };
  
  const statusConfig = LOAD_STATUSES[load.status];
  if (!statusConfig.nextActions.includes(newStatus) && !["IN_TRANSIT", "DELIVERED", "COMPLETED", "EXCEPTION"].includes(newStatus)) {
    return { success: false, error: `Invalid status transition from ${load.status} to ${newStatus}` };
  }
  
  load.status = newStatus;
  load.statusHistory = load.statusHistory || [];
  load.statusHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  
  return {
    success: true,
    load,
    message: `Load ${loadId} status updated to ${newStatus}`
  };
}

function getCapacityOverview(region = null, mode = null) {
  const loads = loadboardData.loads.filter(l => {
    if (region && l.originRegion !== region) return false;
    if (mode && l.mode !== mode) return false;
    return true;
  });
  
  const posted = loads.filter(l => l.status === "POSTED").length;
  const assigned = loads.filter(l => l.status === "ASSIGNED").length;
  const inTransit = loads.filter(l => l.status === "IN_TRANSIT").length;
  
  return {
    region: region || "ALL",
    mode: mode || "ALL",
    metrics: {
      posted,
      assigned,
      inTransit,
      utilizationRate: loads.length > 0 ? Math.round(((assigned + inTransit) / loads.length) * 100) : 0
    },
    gaps: identifyCapacityGaps(loads)
  };
}

function identifyCapacityGaps(loads) {
  const gaps = [];
  const postedByLane = {};
  
  for (const load of loads.filter(l => l.status === "POSTED")) {
    const lane = `${load.originRegion}-${load.destinationRegion}`;
    postedByLane[lane] = (postedByLane[lane] || 0) + 1;
  }
  
  for (const [lane, count] of Object.entries(postedByLane)) {
    if (count >= 5) {
      gaps.push({
        lane,
        unassignedLoads: count,
        severity: count >= 10 ? "HIGH" : "MEDIUM",
        recommendation: "Recruit drivers or activate partner network"
      });
    }
  }
  
  return gaps;
}

function getRevenueAnalytics(filters = {}) {
  const loads = loadboardData.loads.filter(l => 
    l.status === "COMPLETED" || l.status === "DELIVERED"
  );
  
  const totalRevenue = loads.reduce((sum, l) => sum + (l.rate || 0), 0);
  const avgRate = loads.length > 0 ? totalRevenue / loads.length : 0;
  const totalMiles = loads.reduce((sum, l) => sum + (l.distance || 0), 0);
  
  const byMode = {};
  for (const load of loads) {
    byMode[load.mode] = byMode[load.mode] || { revenue: 0, loads: 0 };
    byMode[load.mode].revenue += load.rate || 0;
    byMode[load.mode].loads++;
  }
  
  const byRegion = {};
  for (const load of loads) {
    byRegion[load.originRegion] = byRegion[load.originRegion] || { revenue: 0, loads: 0 };
    byRegion[load.originRegion].revenue += load.rate || 0;
    byRegion[load.originRegion].loads++;
  }
  
  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalLoads: loads.length,
    avgRatePerLoad: Math.round(avgRate * 100) / 100,
    totalMiles,
    revenuePerMile: totalMiles > 0 ? Math.round((totalRevenue / totalMiles) * 100) / 100 : 0,
    byMode,
    byRegion,
    period: filters.period || "ALL_TIME"
  };
}

function getLaneAnalytics() {
  const lanes = [];
  for (const [lane, data] of loadboardData.laneAnalysis.entries()) {
    lanes.push({
      lane,
      ...data,
      avgRate: Math.round(data.avgRate * 100) / 100
    });
  }
  return lanes.sort((a, b) => b.totalLoads - a.totalLoads);
}

function getMarketPenetration() {
  const loads = loadboardData.loads;
  const totalMarket = 1000000;
  
  return {
    dynastyLoads: loads.length,
    estimatedMarketShare: Math.round((loads.length / totalMarket) * 10000) / 100,
    growthRate: 15.5,
    topLanes: getLaneAnalytics().slice(0, 5),
    expansionOpportunities: [
      { region: "ASIA_PACIFIC", mode: "OCEAN", potential: "HIGH" },
      { region: "EUROPE", mode: "GROUND", potential: "MEDIUM" },
      { region: "LATAM", mode: "AIR", potential: "MEDIUM" }
    ]
  };
}

function getLoadboardViews() {
  return LOADBOARD_VIEWS;
}

function getLoadStatuses() {
  return LOAD_STATUSES;
}

module.exports = {
  LOADBOARD_VIEWS,
  LOAD_STATUSES,
  postLoad,
  getLoadsForView,
  assignLoad,
  updateLoadStatus,
  getCapacityOverview,
  getRevenueAnalytics,
  getLaneAnalytics,
  getMarketPenetration,
  getLoadboardViews,
  getLoadStatuses
};
