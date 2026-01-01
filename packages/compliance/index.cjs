const crypto = require('crypto');

const COMPLIANCE_CATEGORIES = {
  EQUIPMENT: 'EQUIPMENT',
  DOCUMENTATION: 'DOCUMENTATION',
  SAFETY: 'SAFETY',
  LICENSING: 'LICENSING',
  CARGO: 'CARGO',
  CUSTOMS: 'CUSTOMS',
  DRIVER: 'DRIVER'
};

const MODE_RULES = {
  GROUND: {
    equipment: ['DRY_VAN', 'FLATBED', 'REEFER', 'BOX_TRUCK', 'TANKER'],
    documentation: ['BOL', 'MANIFEST', 'INSURANCE_CERT'],
    certifications: ['CDL', 'DOT_NUMBER'],
    maxWeightLbs: 80000,
    hoursOfService: { maxDrive: 11, maxDuty: 14, restRequired: 10 },
    hazmatRequires: ['HAZMAT_ENDORSEMENT', 'PLACARDS', 'SAFETY_KIT']
  },
  AIR: {
    equipment: ['AIR_CARGO', 'AIR_FREIGHT_CONTAINER'],
    documentation: ['AWB', 'MANIFEST', 'SECURITY_DECLARATION', 'DANGEROUS_GOODS_FORM'],
    certifications: ['TSA_CERTIFIED', 'KNOWN_SHIPPER'],
    restrictions: ['NO_LITHIUM_BULK', 'SCREEN_ALL_CARGO'],
    maxWeightLbs: 150000
  },
  OCEAN: {
    equipment: ['CONTAINER_20FT', 'CONTAINER_40FT', 'CONTAINER_40FT_HC', 'REEFER_CONTAINER'],
    documentation: ['BOL', 'MANIFEST', 'CUSTOMS_DECLARATION', 'PACKING_LIST', 'CERTIFICATE_OF_ORIGIN'],
    certifications: ['ISPS_CODE', 'AMS_CERTIFIED'],
    containerSealing: true,
    customsClearance: true
  },
  COURIER: {
    equipment: ['VAN', 'CAR', 'MOTORCYCLE', 'BIKE'],
    documentation: ['POD', 'CHAIN_OF_CUSTODY'],
    certifications: ['VALID_LICENSE', 'BACKGROUND_CHECK'],
    signatureCapture: true,
    photoProof: true,
    maxWeightLbs: 150
  }
};

const REGION_RULES = {
  NORTH_AMERICA: {
    documentation: ['CUSTOMS_FORM_7501', 'FDA_PRIOR_NOTICE'],
    standards: ['FMCSA', 'DOT', 'TSA'],
    crossBorder: { requires: ['FAST_CARD', 'C-TPAT'] }
  },
  EUROPE: {
    documentation: ['EUR1', 'T1_DOCUMENT', 'CMR'],
    standards: ['GDPR_COMPLIANT', 'ISO_28000'],
    crossBorder: { requires: ['AEO_CERTIFICATION'] }
  },
  ASIA_PACIFIC: {
    documentation: ['FORM_E', 'CERTIFICATE_OF_ORIGIN'],
    standards: ['LOCAL_CUSTOMS', 'AEO_MUTUAL'],
    crossBorder: { requires: ['REGIONAL_TRADE_CERT'] }
  },
  LATAM: {
    documentation: ['MERCOSUR_FORM', 'TRANSIT_PERMIT'],
    standards: ['LOCAL_TRANSIT', 'CUSTOMS_BROKER'],
    crossBorder: { requires: ['TRADE_FACILITATION_CERT'] }
  }
};

const CARGO_RULES = {
  GENERAL: {
    handling: 'STANDARD',
    documentation: ['BOL', 'MANIFEST'],
    restrictions: []
  },
  HAZMAT: {
    handling: 'SPECIALIZED',
    documentation: ['HAZMAT_MANIFEST', 'SAFETY_DATA_SHEET', 'EMERGENCY_RESPONSE_GUIDE'],
    certifications: ['HAZMAT_CERTIFIED'],
    restrictions: ['NO_PASSENGER_VEHICLES', 'PLACARDING_REQUIRED'],
    riskMultiplier: 2.0
  },
  TEMPERATURE_CONTROLLED: {
    handling: 'COLD_CHAIN',
    documentation: ['TEMP_LOG', 'REEFER_CERT'],
    equipment: ['REEFER', 'REEFER_CONTAINER'],
    monitoring: 'CONTINUOUS',
    riskMultiplier: 1.5
  },
  HIGH_VALUE: {
    handling: 'SECURE',
    documentation: ['DECLARED_VALUE', 'INSURANCE_CERT'],
    security: ['GPS_TRACKING', 'SEALED_CONTAINER'],
    riskMultiplier: 1.8
  },
  BONDED: {
    handling: 'CUSTOMS_BONDED',
    documentation: ['BOND_CERTIFICATE', 'CUSTOMS_SEAL'],
    certifications: ['BONDED_CARRIER'],
    riskMultiplier: 1.3
  }
};

const complianceCache = new Map();
const exceptionLog = [];

function generateId(prefix = 'CMP') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function checkModeCompliance(mode, driverData, loadData) {
  const rules = MODE_RULES[mode];
  if (!rules) {
    return { compliant: false, errors: [`Unknown mode: ${mode}`], warnings: [] };
  }
  
  const errors = [];
  const warnings = [];
  const checks = [];
  
  if (rules.equipment && !rules.equipment.includes(driverData.equipment)) {
    errors.push(`Equipment ${driverData.equipment} not allowed for ${mode} mode`);
  }
  checks.push({ rule: 'EQUIPMENT_CHECK', passed: errors.length === 0 });
  
  if (rules.certifications) {
    const driverCerts = driverData.certifications || [];
    for (const cert of rules.certifications) {
      if (!driverCerts.includes(cert)) {
        errors.push(`Missing required certification: ${cert}`);
      }
    }
  }
  checks.push({ rule: 'CERTIFICATION_CHECK', passed: !errors.some(e => e.includes('certification')) });
  
  if (rules.maxWeightLbs && loadData.weightLbs > rules.maxWeightLbs) {
    errors.push(`Load weight ${loadData.weightLbs}lbs exceeds maximum ${rules.maxWeightLbs}lbs for ${mode}`);
  }
  checks.push({ rule: 'WEIGHT_CHECK', passed: !errors.some(e => e.includes('weight')) });
  
  if (loadData.cargoType === 'HAZMAT' && rules.hazmatRequires) {
    const driverCerts = driverData.certifications || [];
    for (const req of rules.hazmatRequires) {
      if (!driverCerts.includes(req)) {
        errors.push(`Hazmat load requires: ${req}`);
      }
    }
  }
  checks.push({ rule: 'HAZMAT_CHECK', passed: !errors.some(e => e.includes('Hazmat')) });
  
  return {
    compliant: errors.length === 0,
    errors,
    warnings,
    checks,
    mode,
    timestamp: new Date().toISOString()
  };
}

function checkRegionCompliance(region, driverData, loadData) {
  const rules = REGION_RULES[region];
  if (!rules) {
    return { compliant: false, errors: [`Unknown region: ${region}`], warnings: [] };
  }
  
  const errors = [];
  const warnings = [];
  const checks = [];
  
  if (loadData.crossBorder && rules.crossBorder) {
    const driverCerts = driverData.certifications || [];
    for (const req of rules.crossBorder.requires) {
      if (!driverCerts.includes(req)) {
        warnings.push(`Cross-border load may require: ${req}`);
      }
    }
  }
  checks.push({ rule: 'CROSS_BORDER_CHECK', passed: true });
  
  if (loadData.documents) {
    for (const doc of rules.documentation || []) {
      if (!loadData.documents.includes(doc)) {
        warnings.push(`Region ${region} typically requires: ${doc}`);
      }
    }
  }
  checks.push({ rule: 'DOCUMENTATION_CHECK', passed: true });
  
  return {
    compliant: errors.length === 0,
    errors,
    warnings,
    checks,
    region,
    timestamp: new Date().toISOString()
  };
}

function checkCargoCompliance(cargoType, driverData, loadData) {
  const rules = CARGO_RULES[cargoType] || CARGO_RULES.GENERAL;
  
  const errors = [];
  const warnings = [];
  const checks = [];
  
  if (rules.certifications) {
    const driverCerts = driverData.certifications || [];
    for (const cert of rules.certifications) {
      if (!driverCerts.includes(cert)) {
        errors.push(`Cargo type ${cargoType} requires certification: ${cert}`);
      }
    }
  }
  checks.push({ rule: 'CARGO_CERTIFICATION', passed: !errors.some(e => e.includes('certification')) });
  
  if (rules.equipment) {
    if (!rules.equipment.includes(driverData.equipment)) {
      errors.push(`Cargo type ${cargoType} requires equipment: ${rules.equipment.join(' or ')}`);
    }
  }
  checks.push({ rule: 'CARGO_EQUIPMENT', passed: !errors.some(e => e.includes('equipment')) });
  
  if (rules.security) {
    for (const sec of rules.security) {
      if (!driverData.securityFeatures?.includes(sec)) {
        warnings.push(`High-value cargo recommends: ${sec}`);
      }
    }
  }
  
  return {
    compliant: errors.length === 0,
    errors,
    warnings,
    checks,
    cargoType,
    riskMultiplier: rules.riskMultiplier || 1.0,
    timestamp: new Date().toISOString()
  };
}

function checkDriverEligibility(driverId, driverData, loadData) {
  const errors = [];
  const warnings = [];
  
  if (!driverData.licenseValid) {
    errors.push('Driver license expired or invalid');
  }
  
  if (!driverData.insuranceValid) {
    errors.push('Driver insurance expired or invalid');
  }
  
  if (driverData.safetyScore < 70) {
    errors.push(`Safety score ${driverData.safetyScore} below minimum 70`);
  } else if (driverData.safetyScore < 80) {
    warnings.push(`Safety score ${driverData.safetyScore} is marginal`);
  }
  
  if (driverData.cancellationRate > 10) {
    warnings.push(`High cancellation rate: ${driverData.cancellationRate}%`);
  }
  
  if (driverData.onTimeRate < 85) {
    warnings.push(`On-time rate ${driverData.onTimeRate}% below target`);
  }
  
  if (driverData.hoursWorkedToday > 11) {
    errors.push('Driver exceeds hours of service limit');
  }
  
  return {
    eligible: errors.length === 0,
    errors,
    warnings,
    driverId,
    timestamp: new Date().toISOString()
  };
}

function runFullComplianceCheck(loadId, loadData, driverData) {
  const checkId = generateId('CHK');
  
  const modeCheck = checkModeCompliance(loadData.mode, driverData, loadData);
  const regionCheck = checkRegionCompliance(loadData.region, driverData, loadData);
  const cargoCheck = checkCargoCompliance(loadData.cargoType || 'GENERAL', driverData, loadData);
  const eligibilityCheck = checkDriverEligibility(driverData.driverId, driverData, loadData);
  
  const allErrors = [
    ...modeCheck.errors,
    ...regionCheck.errors,
    ...cargoCheck.errors,
    ...eligibilityCheck.errors
  ];
  
  const allWarnings = [
    ...modeCheck.warnings,
    ...regionCheck.warnings,
    ...cargoCheck.warnings,
    ...eligibilityCheck.warnings
  ];
  
  const result = {
    checkId,
    loadId,
    driverId: driverData.driverId,
    compliant: allErrors.length === 0,
    eligible: eligibilityCheck.eligible,
    errors: allErrors,
    warnings: allWarnings,
    riskMultiplier: cargoCheck.riskMultiplier,
    checks: {
      mode: modeCheck,
      region: regionCheck,
      cargo: cargoCheck,
      eligibility: eligibilityCheck
    },
    timestamp: new Date().toISOString()
  };
  
  complianceCache.set(`${loadId}:${driverData.driverId}`, result);
  
  return result;
}

function logException(loadId, driverId, exceptionType, reason, overrideBy = null) {
  const exception = {
    id: generateId('EXC'),
    loadId,
    driverId,
    exceptionType,
    reason,
    overrideBy,
    overridden: !!overrideBy,
    timestamp: new Date().toISOString()
  };
  
  exceptionLog.push(exception);
  return exception;
}

function getExceptions(filters = {}) {
  let exceptions = [...exceptionLog];
  
  if (filters.loadId) {
    exceptions = exceptions.filter(e => e.loadId === filters.loadId);
  }
  if (filters.driverId) {
    exceptions = exceptions.filter(e => e.driverId === filters.driverId);
  }
  if (filters.exceptionType) {
    exceptions = exceptions.filter(e => e.exceptionType === filters.exceptionType);
  }
  
  return exceptions.slice(-(filters.limit || 100)).reverse();
}

function getCachedCompliance(loadId, driverId) {
  return complianceCache.get(`${loadId}:${driverId}`) || null;
}

function getComplianceStats() {
  let totalChecks = 0;
  let compliantCount = 0;
  let exceptionCount = exceptionLog.length;
  let overrideCount = exceptionLog.filter(e => e.overridden).length;
  
  for (const check of complianceCache.values()) {
    totalChecks++;
    if (check.compliant) compliantCount++;
  }
  
  return {
    totalChecks,
    compliantCount,
    complianceRate: totalChecks > 0 ? Math.round(compliantCount / totalChecks * 100) : 100,
    exceptionCount,
    overrideCount,
    overrideRate: exceptionCount > 0 ? Math.round(overrideCount / exceptionCount * 100) : 0
  };
}

module.exports = {
  COMPLIANCE_CATEGORIES,
  MODE_RULES,
  REGION_RULES,
  CARGO_RULES,
  checkModeCompliance,
  checkRegionCompliance,
  checkCargoCompliance,
  checkDriverEligibility,
  runFullComplianceCheck,
  logException,
  getExceptions,
  getCachedCompliance,
  getComplianceStats
};
