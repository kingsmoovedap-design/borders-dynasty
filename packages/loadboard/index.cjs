class Loadboard {
  constructor() {
    this.views = {
      SHIPPER: this.getShipperView.bind(this),
      DRIVER: this.getDriverView.bind(this),
      OPS: this.getOpsView.bind(this),
      OMEGA: this.getOmegaView.bind(this)
    };
  }

  getShipperView(loads, shipperId) {
    const shipperLoads = loads.filter(l => l.shipperId === shipperId);
    
    return {
      viewType: 'SHIPPER',
      shipperId,
      summary: {
        total: shipperLoads.length,
        created: shipperLoads.filter(l => l.status === 'CREATED').length,
        inTransit: shipperLoads.filter(l => l.status === 'IN_TRANSIT').length,
        delivered: shipperLoads.filter(l => l.status === 'DELIVERED').length
      },
      loads: shipperLoads.map(l => ({
        id: l.id,
        origin: l.origin,
        destination: l.destination,
        mode: l.mode,
        status: l.status,
        budgetAmount: l.budgetAmount,
        createdAt: l.createdAt
      }))
    };
  }

  getDriverView(loads, driverId, creditLine) {
    const assignedLoads = loads.filter(l => l.driverId === driverId);
    const availableLoads = loads.filter(l => !l.driverId && l.status === 'CREATED');

    return {
      viewType: 'DRIVER',
      driverId,
      credit: creditLine ? {
        available: creditLine.available,
        balance: creditLine.balance,
        tier: creditLine.tier
      } : null,
      assigned: {
        count: assignedLoads.length,
        loads: assignedLoads.map(l => ({
          id: l.id,
          origin: l.origin,
          destination: l.destination,
          mode: l.mode,
          status: l.status,
          payout: l.budgetAmount * 0.95
        }))
      },
      available: {
        count: availableLoads.length,
        preview: availableLoads.slice(0, 10).map(l => ({
          id: l.id,
          origin: l.origin.split(',')[0],
          destination: l.destination.split(',')[0],
          mode: l.mode,
          estimatedPay: l.budgetAmount * 0.95
        }))
      }
    };
  }

  getOpsView(loads, opsStatus) {
    const byMode = {};
    const byRegion = {};
    const byStatus = {};

    loads.forEach(l => {
      byMode[l.mode] = (byMode[l.mode] || 0) + 1;
      byRegion[l.region] = (byRegion[l.region] || 0) + 1;
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });

    const unassigned = loads.filter(l => !l.driverId && l.status === 'CREATED');
    const inTransit = loads.filter(l => l.status === 'IN_TRANSIT');

    return {
      viewType: 'OPS',
      timestamp: new Date().toISOString(),
      totals: {
        allLoads: loads.length,
        unassigned: unassigned.length,
        inTransit: inTransit.length
      },
      breakdown: {
        byMode,
        byRegion,
        byStatus
      },
      opsStatus,
      alerts: this.generateAlerts(loads, opsStatus),
      urgent: unassigned.filter(l => {
        const age = Date.now() - new Date(l.createdAt).getTime();
        return age > 3600000;
      }).map(l => ({
        id: l.id,
        origin: l.origin,
        destination: l.destination,
        mode: l.mode,
        ageMinutes: Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 60000)
      }))
    };
  }

  getOmegaView(loads, opsStatus, treasury, creditLines, codexRecords) {
    const opsView = this.getOpsView(loads, opsStatus);
    
    const totalRevenue = loads
      .filter(l => l.status === 'DELIVERED')
      .reduce((sum, l) => sum + (l.budgetAmount * 0.05), 0);

    const creditOutstanding = creditLines.reduce((sum, c) => sum + c.balance, 0);

    return {
      viewType: 'OMEGA',
      timestamp: new Date().toISOString(),
      operations: opsView,
      treasury: {
        escrowBalance: treasury.escrowBalance,
        totalPayouts: treasury.payoutCount,
        dynastyRevenue: totalRevenue
      },
      credit: {
        activeLines: creditLines.length,
        totalOutstanding: creditOutstanding,
        averageUtilization: creditLines.length > 0 
          ? creditLines.reduce((sum, c) => sum + (c.balance / c.limit), 0) / creditLines.length * 100
          : 0
      },
      codex: {
        totalRecords: codexRecords,
        lastAnchor: null
      },
      systemHealth: 'OPERATIONAL'
    };
  }

  generateAlerts(loads, opsStatus) {
    const alerts = [];

    const unassigned = loads.filter(l => !l.driverId && l.status === 'CREATED');
    if (unassigned.length > 10) {
      alerts.push({
        level: 'WARNING',
        message: `${unassigned.length} loads unassigned - driver capacity needed`
      });
    }

    Object.entries(opsStatus.modes).forEach(([mode, cfg]) => {
      if (cfg.ready && !cfg.active) {
        alerts.push({
          level: 'INFO',
          message: `${mode} mode ready but not activated`
        });
      }
    });

    Object.entries(opsStatus.regions).forEach(([region, cfg]) => {
      if (cfg.ready && !cfg.active) {
        alerts.push({
          level: 'INFO',
          message: `${region} region ready for activation`
        });
      }
    });

    return alerts;
  }
}

module.exports = { Loadboard };
