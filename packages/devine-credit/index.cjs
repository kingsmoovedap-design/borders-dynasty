class DevineCredit {
  constructor() {
    this.creditLines = new Map();
    this.transactions = [];
  }

  openCreditLine(driverId, initialLimit = 500) {
    const creditLine = {
      driverId,
      limit: initialLimit,
      balance: 0,
      available: initialLimit,
      status: "ACTIVE",
      tier: "STANDARD",
      createdAt: new Date().toISOString(),
      history: []
    };
    this.creditLines.set(driverId, creditLine);
    return creditLine;
  }

  getCreditLine(driverId) {
    return this.creditLines.get(driverId) || null;
  }

  issueAdvance(driverId, amount, loadId) {
    const creditLine = this.creditLines.get(driverId);
    if (!creditLine) {
      throw new Error(`No credit line for driver ${driverId}`);
    }
    if (amount > creditLine.available) {
      throw new Error(`Insufficient credit: requested ${amount}, available ${creditLine.available}`);
    }

    creditLine.balance += amount;
    creditLine.available -= amount;

    const tx = {
      id: `ADV-${Date.now()}`,
      driverId,
      loadId,
      type: "ADVANCE",
      amount,
      balanceAfter: creditLine.balance,
      createdAt: new Date().toISOString()
    };

    creditLine.history.push(tx);
    this.transactions.push(tx);

    return tx;
  }

  repayFromPayout(driverId, payoutAmount, loadId) {
    const creditLine = this.creditLines.get(driverId);
    if (!creditLine || creditLine.balance === 0) {
      return { repaid: 0, netPayout: payoutAmount };
    }

    const repayAmount = Math.min(creditLine.balance, payoutAmount);
    const netPayout = payoutAmount - repayAmount;

    creditLine.balance -= repayAmount;
    creditLine.available += repayAmount;

    const tx = {
      id: `REP-${Date.now()}`,
      driverId,
      loadId,
      type: "REPAYMENT",
      amount: repayAmount,
      balanceAfter: creditLine.balance,
      createdAt: new Date().toISOString()
    };

    creditLine.history.push(tx);
    this.transactions.push(tx);

    return { repaid: repayAmount, netPayout, transaction: tx };
  }

  upgradeTier(driverId, newTier, newLimit) {
    const creditLine = this.creditLines.get(driverId);
    if (!creditLine) {
      throw new Error(`No credit line for driver ${driverId}`);
    }

    const limitIncrease = newLimit - creditLine.limit;
    creditLine.tier = newTier;
    creditLine.limit = newLimit;
    creditLine.available += limitIncrease;

    return creditLine;
  }

  getAllCreditLines() {
    return Array.from(this.creditLines.values());
  }

  getTransactions(driverId = null) {
    if (driverId) {
      return this.transactions.filter(t => t.driverId === driverId);
    }
    return this.transactions;
  }

  processRepayment(driverId, amount) {
    const creditLine = this.creditLines.get(driverId);
    if (!creditLine) {
      throw new Error(`No credit line for driver ${driverId}`);
    }
    
    const repayAmount = Math.min(creditLine.balance, amount);
    
    creditLine.balance -= repayAmount;
    creditLine.available += repayAmount;

    const tx = {
      id: `REP-${Date.now()}`,
      driverId,
      type: "REPAYMENT",
      amount: repayAmount,
      balanceAfter: creditLine.balance,
      createdAt: new Date().toISOString()
    };

    creditLine.history.push(tx);
    this.transactions.push(tx);

    return { repaid: repayAmount, creditLine, transaction: tx };
  }
}

const CREDIT_TIERS = {
  STANDARD: { limit: 500, description: "New driver, basic credit" },
  SILVER: { limit: 1500, description: "Proven driver, 10+ loads" },
  GOLD: { limit: 5000, description: "Trusted driver, 50+ loads" },
  PLATINUM: { limit: 15000, description: "Elite driver, dynasty partner" }
};

module.exports = {
  DevineCredit,
  CREDIT_TIERS
};
