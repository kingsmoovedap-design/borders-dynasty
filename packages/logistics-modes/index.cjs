const LOGISTICS_MODES = {
  GROUND: {
    id: "GROUND",
    name: "Ground Freight",
    description: "Over-the-road trucking and rail transport",
    equipmentTypes: ["DRY_VAN", "REEFER", "FLATBED", "TANKER", "CONTAINER", "BOX_TRUCK", "SPRINTER"],
    certifications: ["CDL", "DOT_NUMBER", "MC_NUMBER", "TWIC"],
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC", "LATAM"],
    features: {
      realTimeTracking: true,
      electronicLogging: true,
      temperatureMonitoring: true,
      geoFencing: true,
      routeOptimization: true
    },
    requirements: {
      minInsurance: 1000000,
      minSafetyScore: 80,
      maxAge: 10,
      inspectionFrequency: "ANNUAL"
    },
    pricing: {
      baseMileRate: 2.50,
      fuelSurcharge: true,
      accessorials: ["DETENTION", "LAYOVER", "LUMPER", "STOP_OFF"],
      minimumCharge: 350
    }
  },
  
  AIR: {
    id: "AIR",
    name: "Air Cargo",
    description: "Commercial and charter air freight",
    equipmentTypes: ["CARGO_AIRCRAFT", "FREIGHTER", "BELLY_CARGO", "CHARTER"],
    certifications: ["IATA_CERTIFIED", "TSA_APPROVED", "CUSTOMS_BOND", "HAZMAT_AIR"],
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC", "LATAM"],
    features: {
      realTimeTracking: true,
      securityScreening: true,
      temperatureMonitoring: true,
      customsClearance: true,
      priorityHandling: true
    },
    requirements: {
      minInsurance: 5000000,
      minSafetyScore: 95,
      securityClearance: "TSA_APPROVED",
      documentationLevel: "HIGH"
    },
    pricing: {
      baseKgRate: 3.50,
      fuelSurcharge: true,
      accessorials: ["HANDLING", "SCREENING", "CUSTOMS", "DANGEROUS_GOODS"],
      minimumCharge: 150
    }
  },
  
  OCEAN: {
    id: "OCEAN",
    name: "Ocean Freight",
    description: "Container shipping and bulk cargo",
    equipmentTypes: ["20FT_CONTAINER", "40FT_CONTAINER", "40FT_HC", "REEFER_CONTAINER", "FLAT_RACK", "OPEN_TOP", "BULK"],
    certifications: ["NVOCC", "FMC_BOND", "CUSTOMS_BROKER", "ISF_CERTIFIED"],
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC", "LATAM"],
    features: {
      containerTracking: true,
      portStatus: true,
      customsClearance: true,
      demurrageManagement: true,
      bookingConfirmation: true
    },
    requirements: {
      minInsurance: 2000000,
      bondRequired: true,
      documentationLevel: "VERY_HIGH",
      leadTime: 14
    },
    pricing: {
      baseContainerRate: 2500,
      bafSurcharge: true,
      accessorials: ["THC", "DEMURRAGE", "DETENTION", "DOCUMENTATION", "CUSTOMS"],
      minimumCharge: 500
    }
  },
  
  COURIER: {
    id: "COURIER",
    name: "Courier & Express",
    description: "Same-day and next-day parcel delivery",
    equipmentTypes: ["CARGO_VAN", "SPRINTER", "BOX_TRUCK", "MOTORCYCLE", "BICYCLE"],
    certifications: ["COURIER_LICENSE", "BACKGROUND_CHECK", "INSURANCE_VERIFIED"],
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC", "LATAM"],
    features: {
      realTimeTracking: true,
      proofOfDelivery: true,
      signatureCapture: true,
      photoConfirmation: true,
      instantNotifications: true
    },
    requirements: {
      minInsurance: 100000,
      minSafetyScore: 85,
      backgroundCheck: true,
      deliveryWindow: "SAME_DAY"
    },
    pricing: {
      baseDeliveryRate: 15,
      distanceSurcharge: true,
      accessorials: ["SIGNATURE", "WHITE_GLOVE", "INSIDE_DELIVERY", "WAIT_TIME"],
      minimumCharge: 15
    }
  }
};

const REGION_CONFIGS = {
  NORTH_AMERICA: {
    id: "NORTH_AMERICA",
    name: "North America",
    countries: ["USA", "CAN", "MEX"],
    currencies: ["USD", "CAD", "MXN"],
    primaryCurrency: "USD",
    timezone: "America/New_York",
    regulations: ["DOT", "FMCSA", "CUSTOMS_US", "USMCA"],
    languages: ["en", "es", "fr"],
    features: {
      crossBorder: true,
      electronicLogging: true,
      realTimeTracking: true
    },
    activeModes: ["GROUND", "AIR", "OCEAN", "COURIER"]
  },
  
  EUROPE: {
    id: "EUROPE",
    name: "Europe",
    countries: ["GBR", "DEU", "FRA", "NLD", "BEL", "ESP", "ITA", "POL"],
    currencies: ["EUR", "GBP", "PLN", "CHF"],
    primaryCurrency: "EUR",
    timezone: "Europe/London",
    regulations: ["EU_TRANSPORT", "TACHOGRAPH", "ADR", "CUSTOMS_EU"],
    languages: ["en", "de", "fr", "es", "it", "pl"],
    features: {
      crossBorder: true,
      electronicLogging: true,
      realTimeTracking: true,
      cabotageRules: true
    },
    activeModes: ["GROUND", "AIR", "OCEAN", "COURIER"]
  },
  
  ASIA_PACIFIC: {
    id: "ASIA_PACIFIC",
    name: "Asia Pacific",
    countries: ["CHN", "JPN", "KOR", "AUS", "SGP", "HKG", "TWN", "THA", "VNM", "IND"],
    currencies: ["CNY", "JPY", "KRW", "AUD", "SGD", "HKD", "INR"],
    primaryCurrency: "USD",
    timezone: "Asia/Singapore",
    regulations: ["LOCAL_CUSTOMS", "IMPORT_PERMITS", "TRADE_AGREEMENTS"],
    languages: ["en", "zh", "ja", "ko", "hi"],
    features: {
      crossBorder: true,
      customsIntegration: true,
      portConnectivity: true
    },
    activeModes: ["AIR", "OCEAN", "COURIER"]
  },
  
  LATAM: {
    id: "LATAM",
    name: "Latin America",
    countries: ["BRA", "ARG", "CHL", "COL", "PER", "MEX"],
    currencies: ["BRL", "ARS", "CLP", "COP", "PEN", "MXN"],
    primaryCurrency: "USD",
    timezone: "America/Sao_Paulo",
    regulations: ["MERCOSUR", "LOCAL_CUSTOMS", "IMPORT_PERMITS"],
    languages: ["es", "pt"],
    features: {
      crossBorder: true,
      customsClearance: true,
      securityProtocols: true
    },
    activeModes: ["GROUND", "AIR", "OCEAN", "COURIER"]
  }
};

const CARGO_TYPES = {
  GENERAL: { id: "GENERAL", name: "General Freight", hazmat: false, temperature: false, highValue: false },
  HAZMAT: { id: "HAZMAT", name: "Hazardous Materials", hazmat: true, temperature: false, highValue: false, classes: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  TEMPERATURE_CONTROLLED: { id: "TEMPERATURE_CONTROLLED", name: "Temperature Controlled", hazmat: false, temperature: true, highValue: false, ranges: ["FROZEN", "CHILLED", "AMBIENT"] },
  HIGH_VALUE: { id: "HIGH_VALUE", name: "High Value Goods", hazmat: false, temperature: false, highValue: true, minInsurance: 500000 },
  PERISHABLE: { id: "PERISHABLE", name: "Perishable Goods", hazmat: false, temperature: true, highValue: false, maxTransitDays: 3 },
  OVERSIZED: { id: "OVERSIZED", name: "Oversized/Heavy Haul", hazmat: false, temperature: false, highValue: false, permitRequired: true },
  LIVESTOCK: { id: "LIVESTOCK", name: "Live Animals", hazmat: false, temperature: true, highValue: false, specialHandling: true },
  PHARMACEUTICALS: { id: "PHARMACEUTICALS", name: "Pharmaceuticals", hazmat: false, temperature: true, highValue: true, gdpCompliant: true }
};

function getModeConfig(modeId) {
  return LOGISTICS_MODES[modeId] || null;
}

function getRegionConfig(regionId) {
  return REGION_CONFIGS[regionId] || null;
}

function getCargoType(cargoId) {
  return CARGO_TYPES[cargoId] || CARGO_TYPES.GENERAL;
}

function validateModeForRegion(modeId, regionId) {
  const region = REGION_CONFIGS[regionId];
  if (!region) return { valid: false, reason: "Unknown region" };
  if (!region.activeModes.includes(modeId)) {
    return { valid: false, reason: `Mode ${modeId} not active in ${regionId}` };
  }
  return { valid: true };
}

function validateEquipmentForMode(equipment, modeId) {
  const mode = LOGISTICS_MODES[modeId];
  if (!mode) return { valid: false, reason: "Unknown mode" };
  if (!mode.equipmentTypes.includes(equipment)) {
    return { valid: false, reason: `Equipment ${equipment} not valid for ${modeId}` };
  }
  return { valid: true };
}

function calculateBaseRate(modeId, distance, weight, cargoType = "GENERAL") {
  const mode = LOGISTICS_MODES[modeId];
  if (!mode) return null;
  
  let baseRate = 0;
  const cargo = CARGO_TYPES[cargoType] || CARGO_TYPES.GENERAL;
  
  switch (modeId) {
    case "GROUND":
      baseRate = Math.max(distance * mode.pricing.baseMileRate, mode.pricing.minimumCharge);
      break;
    case "AIR":
      baseRate = Math.max(weight * mode.pricing.baseKgRate, mode.pricing.minimumCharge);
      break;
    case "OCEAN":
      baseRate = Math.max(mode.pricing.baseContainerRate, mode.pricing.minimumCharge);
      break;
    case "COURIER":
      baseRate = Math.max(mode.pricing.baseDeliveryRate + (distance * 0.5), mode.pricing.minimumCharge);
      break;
  }
  
  if (cargo.hazmat) baseRate *= 1.5;
  if (cargo.temperature) baseRate *= 1.25;
  if (cargo.highValue) baseRate *= 1.3;
  
  return {
    baseRate: Math.round(baseRate * 100) / 100,
    mode: modeId,
    distance,
    weight,
    cargoType,
    multipliers: {
      hazmat: cargo.hazmat ? 1.5 : 1,
      temperature: cargo.temperature ? 1.25 : 1,
      highValue: cargo.highValue ? 1.3 : 1
    }
  };
}

function getRequiredCertifications(modeId, cargoType = "GENERAL") {
  const mode = LOGISTICS_MODES[modeId];
  if (!mode) return [];
  
  const certs = [...mode.certifications];
  const cargo = CARGO_TYPES[cargoType];
  
  if (cargo?.hazmat) {
    certs.push("HAZMAT_CERTIFIED");
  }
  if (cargo?.temperature) {
    certs.push("TEMP_MONITORING_CERTIFIED");
  }
  if (cargo?.highValue) {
    certs.push("HIGH_VALUE_CERTIFIED");
  }
  
  return [...new Set(certs)];
}

function getModeReadiness() {
  return Object.entries(LOGISTICS_MODES).map(([id, mode]) => ({
    id,
    name: mode.name,
    regions: mode.regions.length,
    equipmentTypes: mode.equipmentTypes.length,
    certifications: mode.certifications.length,
    features: Object.keys(mode.features).length,
    ready: true
  }));
}

function getRegionReadiness() {
  return Object.entries(REGION_CONFIGS).map(([id, region]) => ({
    id,
    name: region.name,
    countries: region.countries.length,
    activeModes: region.activeModes.length,
    currencies: region.currencies.length,
    ready: true
  }));
}

function getFullOperationalMatrix() {
  const matrix = {};
  
  for (const [regionId, region] of Object.entries(REGION_CONFIGS)) {
    matrix[regionId] = {
      region: region.name,
      modes: {}
    };
    
    for (const modeId of region.activeModes) {
      const mode = LOGISTICS_MODES[modeId];
      matrix[regionId].modes[modeId] = {
        name: mode.name,
        equipmentTypes: mode.equipmentTypes.length,
        certifications: mode.certifications.length,
        baseRate: mode.pricing.baseMileRate || mode.pricing.baseKgRate || mode.pricing.baseContainerRate || mode.pricing.baseDeliveryRate,
        ready: true
      };
    }
  }
  
  return matrix;
}

module.exports = {
  LOGISTICS_MODES,
  REGION_CONFIGS,
  CARGO_TYPES,
  getModeConfig,
  getRegionConfig,
  getCargoType,
  validateModeForRegion,
  validateEquipmentForMode,
  calculateBaseRate,
  getRequiredCertifications,
  getModeReadiness,
  getRegionReadiness,
  getFullOperationalMatrix
};
