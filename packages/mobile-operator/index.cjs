"use strict";

const { v4: uuidv4 } = require("uuid");
const dbPersistence = require("./db-persistence.cjs");

const OPERATOR_TYPES = [
  { id: "OWNER_OPERATOR", name: "Owner Operator", description: "Single truck owner-operator", equipment: ["DRY_VAN", "REEFER", "FLATBED", "STEP_DECK"] },
  { id: "SMALL_FLEET", name: "Small Fleet", description: "2-10 trucks", equipment: ["DRY_VAN", "REEFER", "FLATBED", "STEP_DECK", "BOX_TRUCK"] },
  { id: "COURIER", name: "Courier Driver", description: "Last-mile delivery courier", equipment: ["CAR", "VAN", "BIKE", "CARGO_BIKE"] },
  { id: "HOT_SHOT", name: "Hot Shot Driver", description: "Expedited partial load specialist", equipment: ["PICKUP", "GOOSENECK", "FLATBED"] },
  { id: "INTERMODAL", name: "Intermodal Operator", description: "Port/rail container hauler", equipment: ["CONTAINER_CHASSIS", "FLATBED"] },
  { id: "TANKER", name: "Tanker Operator", description: "Liquid freight specialist", equipment: ["TANKER", "FOOD_GRADE_TANKER"] },
];

const NOTIFICATION_TYPES = [
  { id: "LOAD_AVAILABLE", name: "Load Available", priority: "NORMAL", icon: "📦", sound: "default" },
  { id: "HOT_LOAD", name: "Hot Load", priority: "HIGH", icon: "🔥", sound: "urgent", expiresInMinutes: 15 },
  { id: "PREMIUM_RATE", name: "Premium Rate Load", priority: "HIGH", icon: "💰", sound: "cash" },
  { id: "HOME_DIRECTION", name: "Heading Home", priority: "NORMAL", icon: "🏠", sound: "default" },
  { id: "RELAY_OPPORTUNITY", name: "Relay Opportunity", priority: "NORMAL", icon: "🔄", sound: "default" },
  { id: "BACKHAUL", name: "Backhaul Available", priority: "NORMAL", icon: "↩️", sound: "default" },
  { id: "DEDICATED_LANE", name: "Dedicated Lane Match", priority: "HIGH", icon: "⭐", sound: "success" },
  { id: "SURGE_PRICING", name: "Surge Pricing", priority: "HIGH", icon: "📈", sound: "cash" },
];

const HOME_DIRECTION_THRESHOLDS = {
  EXCELLENT: { minScore: 85, description: "Directly toward home", color: "#22c55e" },
  GOOD: { minScore: 65, description: "Generally home direction", color: "#84cc16" },
  NEUTRAL: { minScore: 35, description: "Lateral to home", color: "#eab308" },
  AWAY: { minScore: 0, description: "Away from home", color: "#ef4444" },
};

const US_REGIONS = {
  NORTHEAST: { states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"], majorCities: ["New York", "Boston", "Philadelphia", "Newark"] },
  SOUTHEAST: { states: ["DE", "MD", "VA", "WV", "KY", "TN", "NC", "SC", "GA", "FL", "AL", "MS", "LA", "AR"], majorCities: ["Atlanta", "Miami", "Charlotte", "Nashville"] },
  MIDWEST: { states: ["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"], majorCities: ["Chicago", "Detroit", "Minneapolis", "Indianapolis"] },
  SOUTHWEST: { states: ["TX", "OK", "NM", "AZ"], majorCities: ["Dallas", "Houston", "Phoenix", "San Antonio"] },
  WEST: { states: ["CO", "WY", "MT", "ID", "UT", "NV", "CA", "OR", "WA", "AK", "HI"], majorCities: ["Los Angeles", "San Francisco", "Seattle", "Denver"] },
};

const operators = new Map();
const notifications = new Map();
const routePlans = new Map();

async function registerOperator(operatorData) {
  const id = `OP-${uuidv4().slice(0, 8).toUpperCase()}`;
  const operatorType = OPERATOR_TYPES.find(t => t.id === operatorData.type) || OPERATOR_TYPES[0];
  
  const operator = {
    id,
    userId: operatorData.userId || `USR-${uuidv4().slice(0, 8)}`,
    name: operatorData.name,
    email: operatorData.email,
    phone: operatorData.phone,
    homeBase: operatorData.homeBase,
    homeCoords: operatorData.homeCoords || estimateCoords(operatorData.homeBase),
    equipment: operatorData.equipment || operatorType.equipment[0],
    operatorType: operatorType,
    status: "ACTIVE",
    notificationPrefs: {
      pushEnabled: true,
      smsEnabled: operatorData.phone ? true : false,
      emailEnabled: true,
      minRate: operatorData.minRate || 0,
      maxDeadhead: operatorData.maxDeadhead || 100,
      homeDirectionOnly: false,
      preferredModes: ["GROUND"],
      quietHoursStart: null,
      quietHoursEnd: null,
    },
    currentLocation: operatorData.currentLocation || operatorData.homeCoords || estimateCoords(operatorData.homeBase),
    routeToHome: null,
    activeLoadId: null,
    walletAddress: operatorData.walletAddress,
    bscBalance: 0,
    pushToken: operatorData.pushToken,
    stats: {
      totalLoads: 0,
      acceptedLoads: 0,
      declinedLoads: 0,
      acceptRate: 0,
      avgResponseTime: 0,
      milesThisMonth: 0,
      earningsThisMonth: 0,
    },
    lastSeen: new Date(),
    createdAt: new Date(),
  };
  
  operators.set(id, operator);
  try {
    await dbPersistence.persistOperator(operator);
  } catch (err) {
    console.error("Failed to persist operator to DB:", err.message);
  }
  return { success: true, operator };
}

function estimateCoords(location) {
  const cityCoords = {
    "Dallas, TX": { lat: 32.7767, lng: -96.7970 },
    "Houston, TX": { lat: 29.7604, lng: -95.3698 },
    "Los Angeles, CA": { lat: 34.0522, lng: -118.2437 },
    "Chicago, IL": { lat: 41.8781, lng: -87.6298 },
    "Atlanta, GA": { lat: 33.7490, lng: -84.3880 },
    "New York, NY": { lat: 40.7128, lng: -74.0060 },
    "Phoenix, AZ": { lat: 33.4484, lng: -112.0740 },
    "Denver, CO": { lat: 39.7392, lng: -104.9903 },
    "Seattle, WA": { lat: 47.6062, lng: -122.3321 },
    "Miami, FL": { lat: 25.7617, lng: -80.1918 },
  };
  
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (location && location.toLowerCase().includes(city.split(",")[0].toLowerCase())) {
      return coords;
    }
  }
  return { lat: 39.8283, lng: -98.5795 };
}

async function updateOperatorLocation(operatorId, location) {
  let operator = operators.get(operatorId);
  if (!operator) {
    operator = await dbPersistence.loadOperator(operatorId);
    if (operator) operators.set(operatorId, operator);
  }
  if (!operator) return { success: false, error: "Operator not found" };
  
  operator.currentLocation = location;
  operator.lastSeen = new Date();
  
  if (operator.homeCoords) {
    operator.routeToHome = calculateRouteToHome(location, operator.homeCoords);
  }
  
  operators.set(operatorId, operator);
  try {
    await dbPersistence.persistOperator(operator);
  } catch (err) {
    console.error("Failed to persist operator location:", err.message);
  }
  return { success: true, operator, routeToHome: operator.routeToHome };
}

function calculateRouteToHome(current, home) {
  const distance = calculateDistance(current.lat, current.lng, home.lat, home.lng);
  const estimatedHours = distance / 55;
  
  return {
    distanceMiles: Math.round(distance),
    estimatedHours: Math.round(estimatedHours * 10) / 10,
    estimatedArrival: new Date(Date.now() + estimatedHours * 60 * 60 * 1000),
    suggestedStops: generateSuggestedStops(current, home, distance),
  };
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateSuggestedStops(current, home, totalDistance) {
  const stops = [];
  const numStops = Math.floor(totalDistance / 300);
  
  for (let i = 1; i <= Math.min(numStops, 5); i++) {
    const fraction = i / (numStops + 1);
    stops.push({
      order: i,
      type: "REST_STOP",
      estimatedMile: Math.round(totalDistance * fraction),
      estimatedTime: new Date(Date.now() + (totalDistance * fraction / 55) * 60 * 60 * 1000),
      hasLoadOpportunity: Math.random() > 0.3,
    });
  }
  
  return stops;
}

function calculateHomeDirectionScore(loadOrigin, loadDest, operatorHome) {
  const originCoords = estimateCoords(loadOrigin);
  const destCoords = estimateCoords(loadDest);
  const homeCoords = estimateCoords(operatorHome);
  
  const distanceBeforeLoad = calculateDistance(originCoords.lat, originCoords.lng, homeCoords.lat, homeCoords.lng);
  const distanceAfterLoad = calculateDistance(destCoords.lat, destCoords.lng, homeCoords.lat, homeCoords.lng);
  
  const improvement = distanceBeforeLoad - distanceAfterLoad;
  const loadDistance = calculateDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
  
  let score = 50;
  if (improvement > 0) {
    score = 50 + (improvement / loadDistance) * 50;
  } else {
    score = 50 + (improvement / loadDistance) * 50;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHomeDirectionCategory(score) {
  for (const [category, config] of Object.entries(HOME_DIRECTION_THRESHOLDS)) {
    if (score >= config.minScore) {
      return { category, ...config };
    }
  }
  return { category: "AWAY", ...HOME_DIRECTION_THRESHOLDS.AWAY };
}

async function createLoadNotification(operatorId, load) {
  let operator = operators.get(operatorId);
  if (!operator) {
    operator = await dbPersistence.loadOperator(operatorId);
    if (operator) operators.set(operatorId, operator);
  }
  if (!operator) return { success: false, error: "Operator not found" };
  
  const originCoords = estimateCoords(load.origin);
  const deadheadMiles = operator.currentLocation
    ? calculateDistance(operator.currentLocation.lat, operator.currentLocation.lng, originCoords.lat, originCoords.lng)
    : 50;
  
  const prefs = operator.notificationPrefs || { maxDeadhead: 100 };
  if (deadheadMiles > (prefs.maxDeadhead || 100)) {
    return { success: false, error: "Exceeds max deadhead preference" };
  }
  
  const homeDirectionScore = calculateHomeDirectionScore(load.origin, load.destination, operator.homeBase);
  
  if (prefs.homeDirectionOnly && homeDirectionScore < 50) {
    return { success: false, error: "Not in home direction" };
  }
  
  const ratePerMile = load.rate && load.distance ? load.rate / load.distance : 0;
  
  let notificationType = NOTIFICATION_TYPES.find(t => t.id === "LOAD_AVAILABLE");
  if (ratePerMile > 3.5) {
    notificationType = NOTIFICATION_TYPES.find(t => t.id === "PREMIUM_RATE");
  } else if (homeDirectionScore > 75) {
    notificationType = NOTIFICATION_TYPES.find(t => t.id === "HOME_DIRECTION");
  } else if (load.isHotLoad || load.expiresInMinutes < 30) {
    notificationType = NOTIFICATION_TYPES.find(t => t.id === "HOT_LOAD");
  }
  
  const notification = {
    id: `NOTIF-${uuidv4().slice(0, 8).toUpperCase()}`,
    operatorId,
    loadId: load.id,
    type: notificationType,
    title: `${notificationType.icon} ${notificationType.name}`,
    message: buildNotificationMessage(load, deadheadMiles, homeDirectionScore, ratePerMile),
    load: {
      id: load.id,
      origin: load.origin,
      destination: load.destination,
      rate: load.rate,
      distance: load.distance,
      equipment: load.equipment,
      pickupTime: load.pickupTime,
    },
    metrics: {
      rate: load.rate,
      distance: load.distance,
      ratePerMile: Math.round(ratePerMile * 100) / 100,
      deadheadMiles: Math.round(deadheadMiles),
      homeDirectionScore,
      homeDirectionCategory: getHomeDirectionCategory(homeDirectionScore),
      estimatedEarnings: load.rate ? load.rate * 0.85 : null,
    },
    expiresAt: new Date(Date.now() + (notificationType.expiresInMinutes || 60) * 60 * 1000),
    status: "PENDING",
    viewedAt: null,
    respondedAt: null,
    response: null,
    createdAt: new Date(),
  };
  
  notifications.set(notification.id, notification);
  try {
    await dbPersistence.persistNotification(notification);
  } catch (err) {
    console.error("Failed to persist notification:", err.message);
  }
  return { success: true, notification };
}

function buildNotificationMessage(load, deadhead, homeScore, ratePerMile) {
  const homeDir = getHomeDirectionCategory(homeScore);
  let msg = `${load.origin} → ${load.destination}\n`;
  msg += `💵 $${load.rate?.toLocaleString() || "TBD"} (${ratePerMile > 0 ? `$${ratePerMile.toFixed(2)}/mi` : "Rate TBD"})\n`;
  msg += `📏 ${load.distance || "?"} mi load | ${Math.round(deadhead)} mi deadhead\n`;
  msg += `🏠 ${homeDir.description}`;
  return msg;
}

async function respondToNotification(notificationId, response) {
  let notification = notifications.get(notificationId);
  if (!notification) {
    notification = await dbPersistence.loadNotification(notificationId);
    if (notification) notifications.set(notificationId, notification);
  }
  if (!notification) return { success: false, error: "Notification not found" };
  
  if (notification.expiresAt < new Date()) {
    notification.status = "EXPIRED";
    notifications.set(notificationId, notification);
    await dbPersistence.persistNotification(notification);
    return { success: false, error: "Notification expired" };
  }
  
  notification.respondedAt = new Date();
  notification.response = response;
  notification.status = response === "ACCEPT" ? "ACCEPTED" : "DECLINED";
  
  let operator = operators.get(notification.operatorId);
  if (!operator) {
    operator = await dbPersistence.loadOperator(notification.operatorId);
    if (operator) operators.set(notification.operatorId, operator);
  }
  if (operator) {
    operator.stats = operator.stats || { totalLoads: 0, acceptedLoads: 0, declinedLoads: 0, acceptRate: 0, avgResponseTime: 0 };
    if (response === "ACCEPT") {
      operator.stats.acceptedLoads++;
      operator.activeLoadId = notification.loadId;
    } else {
      operator.stats.declinedLoads++;
    }
    operator.stats.totalLoads++;
    operator.stats.acceptRate = operator.stats.acceptedLoads / operator.stats.totalLoads;
    operator.stats.avgResponseTime = (operator.stats.avgResponseTime * (operator.stats.totalLoads - 1) + 
      (notification.respondedAt - notification.createdAt) / 1000) / operator.stats.totalLoads;
    operators.set(operator.id, operator);
    try {
      await dbPersistence.persistOperator(operator);
    } catch (err) {
      console.error("Failed to persist operator:", err.message);
    }
  }
  
  notifications.set(notificationId, notification);
  try {
    await dbPersistence.persistNotification(notification);
  } catch (err) {
    console.error("Failed to persist notification:", err.message);
  }
  return { success: true, notification, operator };
}

function findNearbyLoads(operatorId, filters = {}) {
  const operator = operators.get(operatorId);
  if (!operator) return { success: false, error: "Operator not found" };
  
  const nearbyLoads = [];
  const maxRadius = filters.maxRadius || operator.notificationPrefs.maxDeadhead || 100;
  
  return {
    success: true,
    operatorLocation: operator.currentLocation,
    searchRadius: maxRadius,
    loads: nearbyLoads,
    routeToHome: operator.routeToHome,
    hint: "Integrate with enhanced-loadboard to populate real loads",
  };
}

function planRouteHome(operatorId, preferences = {}) {
  const operator = operators.get(operatorId);
  if (!operator) return { success: false, error: "Operator not found" };
  
  const route = calculateRouteToHome(operator.currentLocation, operator.homeCoords);
  
  const plan = {
    id: `ROUTE-${uuidv4().slice(0, 8).toUpperCase()}`,
    operatorId,
    startLocation: operator.currentLocation,
    endLocation: operator.homeCoords,
    homeBase: operator.homeBase,
    directRoute: route,
    strategy: preferences.strategy || "BALANCED",
    maxDaysToHome: preferences.maxDays || 5,
    minRatePerMile: preferences.minRate || 2.0,
    loadOpportunities: [],
    estimatedEarningsOnRoute: 0,
    createdAt: new Date(),
  };
  
  routePlans.set(plan.id, plan);
  return { success: true, plan };
}

function broadcastLoadToNearbyOperators(load, radius = 100) {
  const notifications = [];
  
  for (const [operatorId, operator] of operators) {
    if (operator.status !== "ACTIVE") continue;
    if (operator.activeLoadId) continue;
    
    const result = createLoadNotification(operatorId, load);
    if (result.success) {
      notifications.push(result.notification);
    }
  }
  
  return {
    success: true,
    loadId: load.id,
    notificationsSent: notifications.length,
    notifications,
  };
}

function getOperatorDashboard(operatorId) {
  const operator = operators.get(operatorId);
  if (!operator) return { success: false, error: "Operator not found" };
  
  const pendingNotifications = Array.from(notifications.values())
    .filter(n => n.operatorId === operatorId && n.status === "PENDING" && n.expiresAt > new Date())
    .sort((a, b) => b.createdAt - a.createdAt);
  
  return {
    success: true,
    operator: {
      id: operator.id,
      name: operator.name,
      type: operator.operatorType,
      equipment: operator.equipment,
      status: operator.status,
      currentLocation: operator.currentLocation,
      homeBase: operator.homeBase,
      bscBalance: operator.bscBalance,
    },
    stats: operator.stats,
    routeToHome: operator.routeToHome,
    pendingNotifications,
    pendingCount: pendingNotifications.length,
  };
}

function getOperatorTypes() {
  return OPERATOR_TYPES;
}

function getNotificationTypes() {
  return NOTIFICATION_TYPES;
}

function getHomeDirectionThresholds() {
  return HOME_DIRECTION_THRESHOLDS;
}

function getUSRegions() {
  return US_REGIONS;
}

function getOperator(operatorId) {
  return operators.get(operatorId) || null;
}

function getOperators(filters = {}) {
  let result = Array.from(operators.values());
  
  if (filters.type) {
    result = result.filter(o => o.operatorType.id === filters.type);
  }
  if (filters.status) {
    result = result.filter(o => o.status === filters.status);
  }
  if (filters.equipment) {
    result = result.filter(o => o.equipment === filters.equipment);
  }
  
  return result.slice(0, filters.limit || 100);
}

function getNotification(notificationId) {
  return notifications.get(notificationId) || null;
}

function getOperatorNotifications(operatorId, filters = {}) {
  let result = Array.from(notifications.values())
    .filter(n => n.operatorId === operatorId);
  
  if (filters.status) {
    result = result.filter(n => n.status === filters.status);
  }
  if (filters.pending) {
    result = result.filter(n => n.status === "PENDING" && n.expiresAt > new Date());
  }
  
  return result.sort((a, b) => b.createdAt - a.createdAt).slice(0, filters.limit || 50);
}

function getRoutePlan(planId) {
  return routePlans.get(planId) || null;
}

function getMobileAppStats() {
  const allNotifications = Array.from(notifications.values());
  const accepted = allNotifications.filter(n => n.status === "ACCEPTED").length;
  const declined = allNotifications.filter(n => n.status === "DECLINED").length;
  const expired = allNotifications.filter(n => n.status === "EXPIRED").length;
  const pending = allNotifications.filter(n => n.status === "PENDING" && n.expiresAt > new Date()).length;
  
  return {
    totalOperators: operators.size,
    activeOperators: Array.from(operators.values()).filter(o => o.status === "ACTIVE").length,
    totalNotifications: allNotifications.length,
    pendingNotifications: pending,
    acceptedNotifications: accepted,
    declinedNotifications: declined,
    expiredNotifications: expired,
    acceptRate: allNotifications.length > 0 ? accepted / allNotifications.length : 0,
    avgResponseTime: allNotifications.filter(n => n.respondedAt)
      .reduce((sum, n) => sum + (n.respondedAt - n.createdAt) / 1000, 0) / 
      (allNotifications.filter(n => n.respondedAt).length || 1),
  };
}

module.exports = {
  getOperatorTypes,
  getNotificationTypes,
  getHomeDirectionThresholds,
  getUSRegions,
  registerOperator,
  updateOperatorLocation,
  createLoadNotification,
  respondToNotification,
  findNearbyLoads,
  planRouteHome,
  broadcastLoadToNearbyOperators,
  getOperatorDashboard,
  getOperator,
  getOperators,
  getNotification,
  getOperatorNotifications,
  getRoutePlan,
  getMobileAppStats,
  calculateHomeDirectionScore,
  getHomeDirectionCategory,
};
