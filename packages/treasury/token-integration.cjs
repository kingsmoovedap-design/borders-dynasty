const crypto = require('crypto');

const BSC_CONTRACT = '0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c';
const ESCROW_WALLET = '0xE89fDED72D0D83De3421C6642FA035ebE197804f';
const DYNASTY_TREASURY = '0xE89fDED72D0D83De3421C6642FA035ebE197804f';
const DYNASTY_FEE_PERCENT = 15;

const escrowBalances = new Map();
const tokenTransactions = [];
const pendingPayouts = [];
const completedPayouts = [];

function generateTxHash() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

async function depositEscrow(loadId, amount, depositorAddress) {
  if (!loadId || !amount || amount <= 0) {
    throw new Error('Invalid escrow deposit parameters');
  }
  
  const deposit = {
    id: crypto.randomUUID(),
    loadId,
    amount,
    depositorAddress,
    escrowWallet: ESCROW_WALLET,
    txHash: generateTxHash(),
    status: 'CONFIRMED',
    depositedAt: new Date().toISOString(),
    tokenContract: BSC_CONTRACT
  };
  
  const current = escrowBalances.get(loadId) || { total: 0, deposits: [] };
  current.total += amount;
  current.deposits.push(deposit);
  escrowBalances.set(loadId, current);
  
  tokenTransactions.push({
    type: 'ESCROW_DEPOSIT',
    ...deposit
  });
  
  return deposit;
}

function getEscrowBalance(loadId) {
  return escrowBalances.get(loadId) || { total: 0, deposits: [] };
}

function getTotalEscrowBalance() {
  let total = 0;
  for (const [, balance] of escrowBalances) {
    total += balance.total;
  }
  return { total, activeLoads: escrowBalances.size };
}

async function releaseEscrow(loadId, driverWallet, driverPayout, dynastyFee) {
  const escrow = escrowBalances.get(loadId);
  if (!escrow || escrow.total <= 0) {
    throw new Error(`No escrow found for load ${loadId}`);
  }
  
  const totalPayout = driverPayout + dynastyFee;
  if (totalPayout > escrow.total) {
    throw new Error(`Payout ${totalPayout} exceeds escrow ${escrow.total}`);
  }
  
  const driverTx = {
    id: crypto.randomUUID(),
    type: 'DRIVER_PAYOUT',
    loadId,
    from: ESCROW_WALLET,
    to: driverWallet,
    amount: driverPayout,
    txHash: generateTxHash(),
    status: 'CONFIRMED',
    processedAt: new Date().toISOString(),
    tokenContract: BSC_CONTRACT
  };
  
  const dynastyTx = {
    id: crypto.randomUUID(),
    type: 'DYNASTY_FEE',
    loadId,
    from: ESCROW_WALLET,
    to: DYNASTY_TREASURY,
    amount: dynastyFee,
    txHash: generateTxHash(),
    status: 'CONFIRMED',
    processedAt: new Date().toISOString(),
    tokenContract: BSC_CONTRACT
  };
  
  tokenTransactions.push(driverTx);
  tokenTransactions.push(dynastyTx);
  
  completedPayouts.push({
    loadId,
    driverPayout: driverTx,
    dynastyFee: dynastyTx,
    totalReleased: totalPayout,
    remainingEscrow: escrow.total - totalPayout
  });
  
  escrow.total -= totalPayout;
  escrow.released = (escrow.released || 0) + totalPayout;
  
  return {
    driverTransaction: driverTx,
    dynastyTransaction: dynastyTx,
    escrowRemaining: escrow.total
  };
}

async function processDeliveryPayout(loadId, contractAmount, driverWallet) {
  const dynastyFee = Math.round(contractAmount * (DYNASTY_FEE_PERCENT / 100) * 100) / 100;
  const driverPayout = contractAmount - dynastyFee;
  
  return await releaseEscrow(loadId, driverWallet, driverPayout, dynastyFee);
}

async function issueCreditAdvance(driverId, amount, driverWallet) {
  const advance = {
    id: crypto.randomUUID(),
    type: 'CREDIT_ADVANCE',
    driverId,
    from: DYNASTY_TREASURY,
    to: driverWallet,
    amount,
    txHash: generateTxHash(),
    status: 'CONFIRMED',
    issuedAt: new Date().toISOString(),
    tokenContract: BSC_CONTRACT
  };
  
  tokenTransactions.push(advance);
  
  return advance;
}

async function processCreditRepayment(driverId, amount, driverWallet) {
  const repayment = {
    id: crypto.randomUUID(),
    type: 'CREDIT_REPAYMENT',
    driverId,
    from: driverWallet,
    to: DYNASTY_TREASURY,
    amount,
    txHash: generateTxHash(),
    status: 'CONFIRMED',
    processedAt: new Date().toISOString(),
    tokenContract: BSC_CONTRACT
  };
  
  tokenTransactions.push(repayment);
  
  return repayment;
}

function getTokenTransactions(filters = {}) {
  let txs = [...tokenTransactions];
  
  if (filters.type) {
    txs = txs.filter(t => t.type === filters.type);
  }
  if (filters.loadId) {
    txs = txs.filter(t => t.loadId === filters.loadId);
  }
  if (filters.driverId) {
    txs = txs.filter(t => t.driverId === filters.driverId);
  }
  if (filters.limit) {
    txs = txs.slice(-filters.limit);
  }
  
  return txs;
}

function getCompletedPayouts() {
  return completedPayouts;
}

function getTreasuryStats() {
  const deposits = tokenTransactions.filter(t => t.type === 'ESCROW_DEPOSIT');
  const driverPayouts = tokenTransactions.filter(t => t.type === 'DRIVER_PAYOUT');
  const dynastyFees = tokenTransactions.filter(t => t.type === 'DYNASTY_FEE');
  const advances = tokenTransactions.filter(t => t.type === 'CREDIT_ADVANCE');
  const repayments = tokenTransactions.filter(t => t.type === 'CREDIT_REPAYMENT');
  
  return {
    contract: BSC_CONTRACT,
    escrowWallet: ESCROW_WALLET,
    dynastyTreasury: DYNASTY_TREASURY,
    feePercent: DYNASTY_FEE_PERCENT,
    
    totalDeposited: deposits.reduce((sum, t) => sum + t.amount, 0),
    totalDriverPayouts: driverPayouts.reduce((sum, t) => sum + t.amount, 0),
    totalDynastyFees: dynastyFees.reduce((sum, t) => sum + t.amount, 0),
    totalAdvancesIssued: advances.reduce((sum, t) => sum + t.amount, 0),
    totalRepayments: repayments.reduce((sum, t) => sum + t.amount, 0),
    
    transactionCounts: {
      deposits: deposits.length,
      driverPayouts: driverPayouts.length,
      dynastyFees: dynastyFees.length,
      advances: advances.length,
      repayments: repayments.length
    },
    
    currentEscrowBalance: getTotalEscrowBalance(),
    pendingPayoutsCount: pendingPayouts.length
  };
}

module.exports = {
  BSC_CONTRACT,
  ESCROW_WALLET,
  DYNASTY_TREASURY,
  DYNASTY_FEE_PERCENT,
  
  depositEscrow,
  getEscrowBalance,
  getTotalEscrowBalance,
  releaseEscrow,
  processDeliveryPayout,
  issueCreditAdvance,
  processCreditRepayment,
  getTokenTransactions,
  getCompletedPayouts,
  getTreasuryStats,
  
  escrowBalances,
  tokenTransactions
};
