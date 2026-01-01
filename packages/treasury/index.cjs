const DYNASTY_FEE_PERCENT = 5;
const ESCROW_ADDRESS = "0xE89fDED72D0D83De3421C6642FA035ebE197804f";
const BSC_CONTRACT = "0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c";

class TreasuryEngine {
  constructor() {
    this.payouts = [];
    this.escrowBalance = 0;
  }

  calculateSplit(loadAmount) {
    const dynastyShare = (loadAmount * DYNASTY_FEE_PERCENT) / 100;
    const driverShare = loadAmount - dynastyShare;
    return {
      total: loadAmount,
      dynastyShare,
      driverShare,
      dynastyPercent: DYNASTY_FEE_PERCENT
    };
  }

  depositToEscrow(loadId, amount, shipperId) {
    const deposit = {
      id: `DEP-${Date.now()}`,
      loadId,
      shipperId,
      amount,
      escrowAddress: ESCROW_ADDRESS,
      status: "HELD",
      createdAt: new Date().toISOString()
    };
    this.escrowBalance += amount;
    return deposit;
  }

  releasePayouts(loadId, driverId, amount) {
    const split = this.calculateSplit(amount);
    
    const driverPayout = {
      id: `PAY-${Date.now()}-D`,
      loadId,
      recipientType: "DRIVER",
      recipientId: driverId,
      amount: split.driverShare,
      token: "BSC",
      contract: BSC_CONTRACT,
      status: "ISSUED",
      createdAt: new Date().toISOString()
    };

    const dynastyPayout = {
      id: `PAY-${Date.now()}-DY`,
      loadId,
      recipientType: "DYNASTY",
      recipientId: "DYNASTY_TREASURY",
      amount: split.dynastyShare,
      token: "BSC",
      contract: BSC_CONTRACT,
      status: "ISSUED",
      createdAt: new Date().toISOString()
    };

    this.payouts.push(driverPayout, dynastyPayout);
    this.escrowBalance -= amount;

    return {
      driverPayout,
      dynastyPayout,
      split
    };
  }

  getPayoutsByLoad(loadId) {
    return this.payouts.filter(p => p.loadId === loadId);
  }

  getEscrowBalance() {
    return this.escrowBalance;
  }

  getAllPayouts() {
    return this.payouts;
  }
}

module.exports = {
  TreasuryEngine,
  DYNASTY_FEE_PERCENT,
  ESCROW_ADDRESS,
  BSC_CONTRACT
};
