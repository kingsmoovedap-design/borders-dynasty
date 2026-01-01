const crypto = require('crypto');

const COURIER_TYPES = {
  INDEPENDENT: { id: 'INDEPENDENT', name: 'Independent Owner-Operator', minCapacity: 1, maxCapacity: 1 },
  SMALL_FLEET: { id: 'SMALL_FLEET', name: 'Small Fleet (2-10 vehicles)', minCapacity: 2, maxCapacity: 10 },
  MEDIUM_FLEET: { id: 'MEDIUM_FLEET', name: 'Medium Fleet (11-50 vehicles)', minCapacity: 11, maxCapacity: 50 },
  LARGE_FLEET: { id: 'LARGE_FLEET', name: 'Large Fleet (50+ vehicles)', minCapacity: 51, maxCapacity: 500 },
  BIKE_MESSENGER: { id: 'BIKE_MESSENGER', name: 'Bike/E-Bike Courier', minCapacity: 1, maxCapacity: 1 },
  DRONE_OPERATOR: { id: 'DRONE_OPERATOR', name: 'Drone Delivery Operator', minCapacity: 1, maxCapacity: 20 }
};

const VEHICLE_TYPES = {
  BIKE: { id: 'BIKE', name: 'Bicycle/E-Bike', maxWeight: 20, maxVolume: 2, speedFactor: 0.8, costPerMile: 0.15 },
  MOTORCYCLE: { id: 'MOTORCYCLE', name: 'Motorcycle', maxWeight: 50, maxVolume: 5, speedFactor: 1.0, costPerMile: 0.35 },
  CAR: { id: 'CAR', name: 'Sedan/Hatchback', maxWeight: 200, maxVolume: 15, speedFactor: 1.0, costPerMile: 0.55 },
  SUV: { id: 'SUV', name: 'SUV/Crossover', maxWeight: 400, maxVolume: 30, speedFactor: 1.0, costPerMile: 0.65 },
  CARGO_VAN: { id: 'CARGO_VAN', name: 'Cargo Van', maxWeight: 2000, maxVolume: 300, speedFactor: 0.9, costPerMile: 0.85 },
  SPRINTER: { id: 'SPRINTER', name: 'Sprinter Van', maxWeight: 3500, maxVolume: 500, speedFactor: 0.9, costPerMile: 1.10 },
  BOX_TRUCK: { id: 'BOX_TRUCK', name: 'Box Truck (14-26ft)', maxWeight: 10000, maxVolume: 1500, speedFactor: 0.8, costPerMile: 1.50 },
  DRONE: { id: 'DRONE', name: 'Delivery Drone', maxWeight: 5, maxVolume: 1, speedFactor: 1.5, costPerMile: 0.25 }
};

const SERVICE_LEVELS = {
  SAME_DAY: { id: 'SAME_DAY', name: 'Same Day Delivery', cutoffHours: 4, premiumPercent: 50 },
  RUSH: { id: 'RUSH', name: 'Rush (2-4 Hours)', cutoffHours: 2, premiumPercent: 100 },
  EXPRESS: { id: 'EXPRESS', name: 'Express (Next Day AM)', cutoffHours: 18, premiumPercent: 25 },
  STANDARD: { id: 'STANDARD', name: 'Standard (1-3 Days)', cutoffHours: 48, premiumPercent: 0 },
  ECONOMY: { id: 'ECONOMY', name: 'Economy (3-5 Days)', cutoffHours: 96, premiumPercent: -15 },
  SCHEDULED: { id: 'SCHEDULED', name: 'Scheduled Delivery', cutoffHours: null, premiumPercent: 10 }
};

const ONBOARDING_STEPS = [
  { id: 'REGISTRATION', name: 'Account Registration', required: true, order: 1 },
  { id: 'IDENTITY_VERIFICATION', name: 'Identity Verification', required: true, order: 2 },
  { id: 'BACKGROUND_CHECK', name: 'Background Check', required: true, order: 3 },
  { id: 'VEHICLE_REGISTRATION', name: 'Vehicle Registration', required: true, order: 4 },
  { id: 'INSURANCE_VERIFICATION', name: 'Insurance Verification', required: true, order: 5 },
  { id: 'TRAINING_COMPLETION', name: 'Training Module Completion', required: true, order: 6 },
  { id: 'APP_DOWNLOAD', name: 'Dynasty Courier App Setup', required: true, order: 7 },
  { id: 'TEST_DELIVERY', name: 'Test Delivery Completion', required: false, order: 8 },
  { id: 'BANK_SETUP', name: 'Payment Account Setup', required: true, order: 9 },
  { id: 'ACTIVATION', name: 'Account Activation', required: true, order: 10 }
];

const couriers = new Map();
const courierVehicles = new Map();
const deliveries = new Map();
const zones = new Map();

const DELIVERY_ZONES = [
  { id: 'NYC_MANHATTAN', name: 'New York - Manhattan', region: 'NORTH_AMERICA', baseRate: 8.50, perMileRate: 1.75 },
  { id: 'NYC_BROOKLYN', name: 'New York - Brooklyn', region: 'NORTH_AMERICA', baseRate: 7.50, perMileRate: 1.50 },
  { id: 'LA_CENTRAL', name: 'Los Angeles - Central', region: 'NORTH_AMERICA', baseRate: 7.00, perMileRate: 1.40 },
  { id: 'LA_VALLEY', name: 'Los Angeles - Valley', region: 'NORTH_AMERICA', baseRate: 6.50, perMileRate: 1.35 },
  { id: 'CHI_DOWNTOWN', name: 'Chicago - Downtown', region: 'NORTH_AMERICA', baseRate: 6.00, perMileRate: 1.25 },
  { id: 'DAL_METRO', name: 'Dallas - Metro', region: 'NORTH_AMERICA', baseRate: 5.50, perMileRate: 1.15 },
  { id: 'LON_CENTRAL', name: 'London - Central', region: 'EUROPE', baseRate: 9.00, perMileRate: 2.00 },
  { id: 'PAR_CENTRAL', name: 'Paris - Central', region: 'EUROPE', baseRate: 8.00, perMileRate: 1.80 },
  { id: 'SIN_CENTRAL', name: 'Singapore - Central', region: 'ASIA_PACIFIC', baseRate: 6.00, perMileRate: 1.50 },
  { id: 'SYD_METRO', name: 'Sydney - Metro', region: 'ASIA_PACIFIC', baseRate: 7.00, perMileRate: 1.60 }
];

DELIVERY_ZONES.forEach(z => zones.set(z.id, z));

function registerCourier(courierData) {
  const courierId = `COU-${crypto.randomBytes(6).toString('hex')}`;
  
  const courier = {
    id: courierId,
    type: COURIER_TYPES[courierData.type] || COURIER_TYPES.INDEPENDENT,
    company: courierData.companyName || null,
    contact: {
      name: courierData.name,
      email: courierData.email,
      phone: courierData.phone,
      address: courierData.address
    },
    status: 'ONBOARDING',
    onboarding: {
      startedAt: new Date().toISOString(),
      steps: ONBOARDING_STEPS.map(step => ({
        ...step,
        status: 'PENDING',
        completedAt: null
      })),
      currentStep: 1
    },
    zones: courierData.zones || [],
    serviceCapabilities: courierData.services || ['STANDARD'],
    rating: { score: 0, totalDeliveries: 0, onTimePercent: 100 },
    earnings: { total: 0, pending: 0, lastPayout: null },
    createdAt: new Date().toISOString()
  };
  
  couriers.set(courierId, courier);
  return { success: true, courier, nextStep: ONBOARDING_STEPS[0] };
}

function completeOnboardingStep(courierId, stepId, data = {}) {
  const courier = couriers.get(courierId);
  if (!courier) return { success: false, error: 'Courier not found' };
  
  const step = courier.onboarding.steps.find(s => s.id === stepId);
  if (!step) return { success: false, error: 'Step not found' };
  
  step.status = 'COMPLETED';
  step.completedAt = new Date().toISOString();
  step.data = data;
  
  const nextPending = courier.onboarding.steps.find(s => s.status === 'PENDING');
  courier.onboarding.currentStep = nextPending ? nextPending.order : null;
  
  const allRequiredComplete = courier.onboarding.steps
    .filter(s => s.required)
    .every(s => s.status === 'COMPLETED');
  
  if (allRequiredComplete && stepId === 'ACTIVATION') {
    courier.status = 'ACTIVE';
    courier.activatedAt = new Date().toISOString();
  }
  
  return {
    success: true,
    courier,
    nextStep: nextPending,
    isComplete: allRequiredComplete
  };
}

function registerVehicle(courierId, vehicleData) {
  const courier = couriers.get(courierId);
  if (!courier) return { success: false, error: 'Courier not found' };
  
  const vehicleId = `VEH-${crypto.randomBytes(4).toString('hex')}`;
  const vehicleType = VEHICLE_TYPES[vehicleData.type] || VEHICLE_TYPES.CAR;
  
  const vehicle = {
    id: vehicleId,
    courierId,
    type: vehicleType,
    make: vehicleData.make,
    model: vehicleData.model,
    year: vehicleData.year,
    licensePlate: vehicleData.licensePlate,
    color: vehicleData.color,
    insurance: {
      provider: vehicleData.insuranceProvider,
      policyNumber: vehicleData.policyNumber,
      expiresAt: vehicleData.insuranceExpiry
    },
    status: 'ACTIVE',
    currentLocation: null,
    isAvailable: false,
    registeredAt: new Date().toISOString()
  };
  
  if (!courierVehicles.has(courierId)) {
    courierVehicles.set(courierId, []);
  }
  courierVehicles.get(courierId).push(vehicle);
  
  return { success: true, vehicle };
}

function updateCourierLocation(courierId, vehicleId, location) {
  const vehicles = courierVehicles.get(courierId);
  if (!vehicles) return { success: false, error: 'Courier not found' };
  
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return { success: false, error: 'Vehicle not found' };
  
  vehicle.currentLocation = {
    lat: location.lat,
    lng: location.lng,
    updatedAt: new Date().toISOString()
  };
  
  return { success: true, vehicle };
}

function setAvailability(courierId, vehicleId, isAvailable, zones = []) {
  const vehicles = courierVehicles.get(courierId);
  if (!vehicles) return { success: false, error: 'Courier not found' };
  
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return { success: false, error: 'Vehicle not found' };
  
  vehicle.isAvailable = isAvailable;
  vehicle.activeZones = zones;
  vehicle.availabilityUpdatedAt = new Date().toISOString();
  
  return { success: true, vehicle };
}

function calculateDeliveryRate(pickup, delivery, serviceLevel, vehicleType) {
  const pickupZone = zones.get(pickup.zoneId) || { baseRate: 5, perMileRate: 1 };
  const distance = pickup.distanceMiles || 5;
  const service = SERVICE_LEVELS[serviceLevel] || SERVICE_LEVELS.STANDARD;
  const vehicle = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES.CAR;
  
  const baseAmount = pickupZone.baseRate + (distance * pickupZone.perMileRate);
  const vehicleAdjustment = baseAmount * (vehicle.costPerMile / 0.55);
  const servicePremium = vehicleAdjustment * (service.premiumPercent / 100);
  
  const totalRate = vehicleAdjustment + servicePremium;
  const dynastyFee = totalRate * 0.10;
  const courierPayout = totalRate - dynastyFee;
  
  return {
    baseRate: pickupZone.baseRate,
    distanceRate: distance * pickupZone.perMileRate,
    vehicleAdjustment: vehicleAdjustment - baseAmount - (distance * pickupZone.perMileRate),
    servicePremium,
    totalRate: parseFloat(totalRate.toFixed(2)),
    dynastyFee: parseFloat(dynastyFee.toFixed(2)),
    courierPayout: parseFloat(courierPayout.toFixed(2)),
    estimatedMinutes: Math.round((distance / 25) * 60 * (1 / vehicle.speedFactor))
  };
}

function createDelivery(deliveryData) {
  const deliveryId = `DEL-${crypto.randomBytes(6).toString('hex')}`;
  
  const rate = calculateDeliveryRate(
    deliveryData.pickup,
    deliveryData.delivery,
    deliveryData.serviceLevel,
    deliveryData.vehicleType
  );
  
  const delivery = {
    id: deliveryId,
    pickup: {
      address: deliveryData.pickup.address,
      contact: deliveryData.pickup.contact,
      zoneId: deliveryData.pickup.zoneId,
      instructions: deliveryData.pickup.instructions,
      windowStart: deliveryData.pickup.windowStart,
      windowEnd: deliveryData.pickup.windowEnd
    },
    delivery: {
      address: deliveryData.delivery.address,
      contact: deliveryData.delivery.contact,
      zoneId: deliveryData.delivery.zoneId,
      instructions: deliveryData.delivery.instructions,
      requireSignature: deliveryData.delivery.requireSignature || false,
      requirePhoto: deliveryData.delivery.requirePhoto || true
    },
    package: {
      weight: deliveryData.package.weight,
      dimensions: deliveryData.package.dimensions,
      description: deliveryData.package.description,
      value: deliveryData.package.value,
      fragile: deliveryData.package.fragile || false
    },
    serviceLevel: SERVICE_LEVELS[deliveryData.serviceLevel] || SERVICE_LEVELS.STANDARD,
    vehicleTypeRequired: VEHICLE_TYPES[deliveryData.vehicleType] || null,
    rate,
    status: 'PENDING',
    assignedCourier: null,
    timeline: [{
      status: 'PENDING',
      timestamp: new Date().toISOString()
    }],
    createdAt: new Date().toISOString()
  };
  
  deliveries.set(deliveryId, delivery);
  return { success: true, delivery };
}

function assignDelivery(deliveryId, courierId, vehicleId) {
  const delivery = deliveries.get(deliveryId);
  if (!delivery) return { success: false, error: 'Delivery not found' };
  
  const courier = couriers.get(courierId);
  if (!courier) return { success: false, error: 'Courier not found' };
  if (courier.status !== 'ACTIVE') return { success: false, error: 'Courier not active' };
  
  delivery.assignedCourier = { courierId, vehicleId };
  delivery.status = 'ASSIGNED';
  delivery.assignedAt = new Date().toISOString();
  delivery.timeline.push({
    status: 'ASSIGNED',
    timestamp: new Date().toISOString(),
    courierId
  });
  
  return { success: true, delivery };
}

function updateDeliveryStatus(deliveryId, status, metadata = {}) {
  const delivery = deliveries.get(deliveryId);
  if (!delivery) return { success: false, error: 'Delivery not found' };
  
  delivery.status = status;
  delivery.timeline.push({
    status,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  
  if (status === 'PICKED_UP') {
    delivery.pickedUpAt = new Date().toISOString();
  } else if (status === 'DELIVERED') {
    delivery.deliveredAt = new Date().toISOString();
    if (delivery.assignedCourier) {
      const courier = couriers.get(delivery.assignedCourier.courierId);
      if (courier) {
        courier.earnings.pending += delivery.rate.courierPayout;
        courier.rating.totalDeliveries++;
      }
    }
  }
  
  return { success: true, delivery };
}

function findAvailableCouriers(zoneId, vehicleType, serviceLevel) {
  const available = [];
  
  for (const [courierId, courier] of couriers) {
    if (courier.status !== 'ACTIVE') continue;
    
    const vehicles = courierVehicles.get(courierId) || [];
    const suitableVehicles = vehicles.filter(v => {
      if (!v.isAvailable) return false;
      if (vehicleType && v.type.id !== vehicleType) return false;
      if (zoneId && v.activeZones && !v.activeZones.includes(zoneId)) return false;
      return true;
    });
    
    if (suitableVehicles.length > 0) {
      available.push({
        courier,
        vehicles: suitableVehicles,
        rating: courier.rating.score,
        onTimePercent: courier.rating.onTimePercent
      });
    }
  }
  
  return available.sort((a, b) => b.rating - a.rating);
}

function getCourier(courierId) {
  return couriers.get(courierId) || null;
}

function getCouriers(filters = {}) {
  let result = Array.from(couriers.values());
  
  if (filters.status) result = result.filter(c => c.status === filters.status);
  if (filters.type) result = result.filter(c => c.type.id === filters.type);
  if (filters.zone) result = result.filter(c => c.zones.includes(filters.zone));
  
  return result.slice(0, filters.limit || 100);
}

function getCourierVehicles(courierId) {
  return courierVehicles.get(courierId) || [];
}

function getDelivery(deliveryId) {
  return deliveries.get(deliveryId) || null;
}

function getDeliveries(filters = {}) {
  let result = Array.from(deliveries.values());
  
  if (filters.status) result = result.filter(d => d.status === filters.status);
  if (filters.courierId) result = result.filter(d => d.assignedCourier?.courierId === filters.courierId);
  if (filters.zoneId) result = result.filter(d => d.pickup.zoneId === filters.zoneId || d.delivery.zoneId === filters.zoneId);
  
  return result.slice(0, filters.limit || 100);
}

function getCourierAnalytics() {
  const allCouriers = Array.from(couriers.values());
  const allDeliveries = Array.from(deliveries.values());
  
  return {
    couriers: {
      total: allCouriers.length,
      active: allCouriers.filter(c => c.status === 'ACTIVE').length,
      onboarding: allCouriers.filter(c => c.status === 'ONBOARDING').length,
      byType: Object.fromEntries(
        Object.keys(COURIER_TYPES).map(t => [t, allCouriers.filter(c => c.type.id === t).length])
      )
    },
    deliveries: {
      total: allDeliveries.length,
      pending: allDeliveries.filter(d => d.status === 'PENDING').length,
      inProgress: allDeliveries.filter(d => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
      completed: allDeliveries.filter(d => d.status === 'DELIVERED').length,
      totalRevenue: allDeliveries.filter(d => d.status === 'DELIVERED').reduce((sum, d) => sum + d.rate.totalRate, 0)
    },
    zones: DELIVERY_ZONES.map(z => ({
      id: z.id,
      name: z.name,
      activeDeliveries: allDeliveries.filter(d => d.pickup.zoneId === z.id || d.delivery.zoneId === z.id).length
    }))
  };
}

function getCourierTypes() {
  return Object.values(COURIER_TYPES);
}

function getVehicleTypes() {
  return Object.values(VEHICLE_TYPES);
}

function getServiceLevels() {
  return Object.values(SERVICE_LEVELS);
}

function getDeliveryZones() {
  return DELIVERY_ZONES;
}

function getOnboardingSteps() {
  return ONBOARDING_STEPS;
}

module.exports = {
  COURIER_TYPES,
  VEHICLE_TYPES,
  SERVICE_LEVELS,
  ONBOARDING_STEPS,
  DELIVERY_ZONES,
  registerCourier,
  completeOnboardingStep,
  registerVehicle,
  updateCourierLocation,
  setAvailability,
  calculateDeliveryRate,
  createDelivery,
  assignDelivery,
  updateDeliveryStatus,
  findAvailableCouriers,
  getCourier,
  getCouriers,
  getCourierVehicles,
  getDelivery,
  getDeliveries,
  getCourierAnalytics,
  getCourierTypes,
  getVehicleTypes,
  getServiceLevels,
  getDeliveryZones,
  getOnboardingSteps
};
