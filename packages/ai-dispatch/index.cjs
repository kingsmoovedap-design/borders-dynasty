class AIDispatchEngine {
  constructor() {
    this.dispatchHistory = [];
  }

  scoreDriverForLoad(driver, load, creditLine) {
    let score = 50;
    const factors = [];

    if (driver.homeBase && load.origin) {
      const homeMatch = driver.homeBase.toLowerCase().includes(load.origin.split(',')[0].toLowerCase());
      if (homeMatch) {
        score += 20;
        factors.push({ factor: 'HOME_BASE_MATCH', impact: +20 });
      }
    }

    if (driver.equipment) {
      const equipMatch = this.matchEquipment(driver.equipment, load.mode);
      score += equipMatch;
      if (equipMatch > 0) {
        factors.push({ factor: 'EQUIPMENT_MATCH', impact: +equipMatch });
      }
    }

    if (creditLine) {
      if (creditLine.tier === 'GOLD' || creditLine.tier === 'PLATINUM') {
        score += 15;
        factors.push({ factor: 'HIGH_CREDIT_TIER', impact: +15 });
      }
      if (creditLine.balance > 0) {
        score -= 10;
        factors.push({ factor: 'OUTSTANDING_BALANCE', impact: -10 });
      }
    }

    if (driver.loadsCompleted > 10) {
      score += 10;
      factors.push({ factor: 'EXPERIENCED_DRIVER', impact: +10 });
    }

    return {
      driverId: driver.driverId,
      driverName: driver.name,
      score: Math.min(100, Math.max(0, score)),
      factors,
      recommendation: score >= 70 ? 'STRONG' : score >= 50 ? 'ACCEPTABLE' : 'WEAK'
    };
  }

  matchEquipment(equipment, mode) {
    const equipMap = {
      'GROUND': ['Box Truck', 'Flatbed', 'Dry Van', 'Reefer', 'Standard'],
      'COURIER': ['Van', 'Sprinter', 'Sedan', 'Motorcycle', 'Standard'],
      'AIR': ['Air Certified', 'TSA Approved'],
      'OCEAN': ['Container', 'Intermodal']
    };

    const validEquip = equipMap[mode] || [];
    return validEquip.some(e => equipment.toLowerCase().includes(e.toLowerCase())) ? 15 : 0;
  }

  suggestDrivers(drivers, load, creditLines) {
    const suggestions = [];

    for (const driver of drivers) {
      const creditLine = creditLines.find(c => c.driverId === driver.driverId);
      const scored = this.scoreDriverForLoad(driver, load, creditLine);
      suggestions.push(scored);
    }

    suggestions.sort((a, b) => b.score - a.score);

    return {
      loadId: load.id,
      loadSummary: `${load.origin} → ${load.destination} (${load.mode})`,
      suggestions: suggestions.slice(0, 5),
      topPick: suggestions[0] || null,
      generatedAt: new Date().toISOString()
    };
  }

  evaluateLoad(load) {
    const analysis = {
      loadId: load.id,
      mode: load.mode,
      region: load.region,
      budgetAmount: load.budgetAmount,
      riskFlags: [],
      profitScore: 0,
      recommendation: 'ACCEPT'
    };

    if (load.budgetAmount < 100) {
      analysis.riskFlags.push('LOW_MARGIN');
      analysis.profitScore -= 20;
    } else if (load.budgetAmount > 5000) {
      analysis.profitScore += 20;
    }

    if (load.mode === 'OCEAN') {
      analysis.riskFlags.push('LONG_TRANSIT');
    }

    if (load.mode === 'AIR' && load.budgetAmount < 1000) {
      analysis.riskFlags.push('UNDERPRICED_AIR');
      analysis.profitScore -= 15;
    }

    analysis.profitScore = Math.max(0, 50 + analysis.profitScore);

    if (analysis.profitScore < 30) {
      analysis.recommendation = 'DECLINE';
    } else if (analysis.profitScore < 50) {
      analysis.recommendation = 'REVIEW';
    }

    return analysis;
  }

  recordDispatch(loadId, driverId, method, overrideReason = null) {
    const record = {
      id: `DISP-${Date.now()}`,
      loadId,
      driverId,
      method,
      overrideReason,
      timestamp: new Date().toISOString()
    };
    this.dispatchHistory.push(record);
    return record;
  }

  getDispatchHistory() {
    return this.dispatchHistory;
  }
}

module.exports = { AIDispatchEngine };
