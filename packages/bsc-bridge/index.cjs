"use strict";

const { v4: uuidv4 } = require("uuid");
const dbPersistence = require("./db-persistence.cjs");

const SUPPORTED_CHAINS = [
  { id: "ETHEREUM", name: "Ethereum Mainnet", chainId: 1, symbol: "ETH", status: "PLANNED", bridgeFee: 0.003 },
  { id: "SEPOLIA", name: "Sepolia Testnet", chainId: 11155111, symbol: "ETH", status: "ACTIVE", bridgeFee: 0, isHome: true },
  { id: "POLYGON", name: "Polygon", chainId: 137, symbol: "MATIC", status: "PLANNED", bridgeFee: 0.001 },
  { id: "ARBITRUM", name: "Arbitrum One", chainId: 42161, symbol: "ETH", status: "PLANNED", bridgeFee: 0.002 },
  { id: "BASE", name: "Base", chainId: 8453, symbol: "ETH", status: "PLANNED", bridgeFee: 0.001 },
  { id: "BSC_CHAIN", name: "BNB Smart Chain", chainId: 56, symbol: "BNB", status: "PLANNED", bridgeFee: 0.002 },
  { id: "AVALANCHE", name: "Avalanche C-Chain", chainId: 43114, symbol: "AVAX", status: "PLANNED", bridgeFee: 0.002 },
  { id: "OPTIMISM", name: "Optimism", chainId: 10, symbol: "ETH", status: "PLANNED", bridgeFee: 0.002 },
];

const BSC_TOKEN = {
  symbol: "BSC",
  name: "Borders Sovereign Coin",
  decimals: 18,
  totalSupply: 1000000,
  homeChain: "SEPOLIA",
  wrappedVersions: {
    POLYGON: "wBSC",
    ARBITRUM: "arbBSC",
    BASE: "baseBSC",
    BSC_CHAIN: "bscBSC",
    AVALANCHE: "avaxBSC",
    OPTIMISM: "opBSC",
  },
};

const DYNASTY_BRIDGE_TOKEN = {
  symbol: "DBT",
  name: "Dynasty Bridge Token",
  decimals: 18,
  purpose: "Cross-chain liquidity and bridging",
  features: [
    "1:1 backed by BSC on Sepolia",
    "Deployed on all supported chains",
    "Gas-optimized for bridging",
    "Automatic fee burning",
  ],
  deployedOn: ["SEPOLIA"],
  plannedDeployments: ["POLYGON", "ARBITRUM", "BASE", "BSC_CHAIN"],
};

const FIAT_PROVIDERS = [
  { id: "MOONPAY", name: "MoonPay", currencies: ["USD", "EUR", "GBP"], minAmount: 30, maxAmount: 50000, feePercent: 3.5 },
  { id: "TRANSAK", name: "Transak", currencies: ["USD", "EUR", "GBP", "CAD", "AUD"], minAmount: 25, maxAmount: 25000, feePercent: 2.9 },
  { id: "RAMP", name: "Ramp Network", currencies: ["USD", "EUR", "GBP"], minAmount: 50, maxAmount: 50000, feePercent: 2.5 },
  { id: "WYRE", name: "Wyre", currencies: ["USD"], minAmount: 25, maxAmount: 100000, feePercent: 2.9 },
  { id: "DYNASTY_ACH", name: "Dynasty Direct (ACH)", currencies: ["USD"], minAmount: 100, maxAmount: 250000, feePercent: 1.0 },
  { id: "DYNASTY_WIRE", name: "Dynasty Wire", currencies: ["USD"], minAmount: 1000, maxAmount: 1000000, feePercent: 0.5 },
];

const BUYBACK_TIERS = [
  { id: "STANDARD", minBSC: 0, maxBSC: 10000, discountPercent: 0, processingDays: 5 },
  { id: "SILVER", minBSC: 10001, maxBSC: 50000, discountPercent: 1, processingDays: 3 },
  { id: "GOLD", minBSC: 50001, maxBSC: 250000, discountPercent: 2, processingDays: 2 },
  { id: "PLATINUM", minBSC: 250001, maxBSC: 1000000, discountPercent: 3, processingDays: 1 },
  { id: "DYNASTY", minBSC: 1000001, maxBSC: null, discountPercent: 5, processingDays: 0.5 },
];

const PAYOUT_METHODS = [
  { id: "ACH", name: "ACH Transfer", minAmount: 100, maxAmount: 250000, fee: 0, processingDays: 3 },
  { id: "WIRE", name: "Wire Transfer", minAmount: 1000, maxAmount: 1000000, fee: 25, processingDays: 1 },
  { id: "DEBIT_CARD", name: "Debit Card", minAmount: 10, maxAmount: 10000, fee: 0.5, feeType: "percent", processingDays: 0 },
  { id: "CRYPTO_SWAP", name: "Crypto Swap", minAmount: 0, maxAmount: null, fee: 0.3, feeType: "percent", processingDays: 0 },
  { id: "STABLECOIN", name: "Stablecoin (USDC/USDT)", minAmount: 0, maxAmount: null, fee: 0.1, feeType: "percent", processingDays: 0 },
];

const buybacks = new Map();
const bridgeTransactions = new Map();
const fiatTransactions = new Map();

let currentBSCPrice = 1.00;
let priceHistory = [];

function updateBSCPrice() {
  const volatility = 0.02;
  const change = (Math.random() - 0.5) * volatility;
  currentBSCPrice = Math.max(0.50, Math.min(5.00, currentBSCPrice * (1 + change)));
  priceHistory.push({ price: currentBSCPrice, timestamp: new Date() });
  if (priceHistory.length > 1000) priceHistory.shift();
  return currentBSCPrice;
}

function getBSCPrice() {
  return {
    price: currentBSCPrice,
    currency: "USD",
    lastUpdated: new Date(),
    change24h: priceHistory.length > 24 
      ? ((currentBSCPrice - priceHistory[priceHistory.length - 24].price) / priceHistory[priceHistory.length - 24].price) * 100
      : 0,
  };
}

function calculateBuybackQuote(bscAmount, payoutMethod = "ACH") {
  const tier = BUYBACK_TIERS.find(t => bscAmount >= t.minBSC && (t.maxBSC === null || bscAmount <= t.maxBSC)) || BUYBACK_TIERS[0];
  const method = PAYOUT_METHODS.find(m => m.id === payoutMethod) || PAYOUT_METHODS[0];
  
  const grossFiat = bscAmount * currentBSCPrice;
  const tierDiscount = grossFiat * (tier.discountPercent / 100);
  const methodFee = method.feeType === "percent" ? grossFiat * (method.fee / 100) : method.fee;
  const netFiat = grossFiat + tierDiscount - methodFee;
  
  return {
    bscAmount,
    bscPrice: currentBSCPrice,
    grossFiat,
    tier: tier.id,
    tierDiscount,
    payoutMethod: method.id,
    payoutFee: methodFee,
    netFiat: Math.round(netFiat * 100) / 100,
    currency: "USD",
    processingDays: Math.max(tier.processingDays, method.processingDays),
    validUntil: new Date(Date.now() + 5 * 60 * 1000),
  };
}

async function initiateBuyback(partnerId, partnerType, bscAmount, payoutMethod, payoutDetails) {
  const quote = calculateBuybackQuote(bscAmount, payoutMethod);
  
  const buyback = {
    id: `BUY-${uuidv4().slice(0, 8).toUpperCase()}`,
    partnerId,
    partnerType,
    bscAmount,
    fiatAmount: quote.netFiat,
    fiatCurrency: "USD",
    exchangeRate: currentBSCPrice,
    tier: quote.tier,
    payoutMethod,
    payoutDetails,
    payoutFee: quote.payoutFee,
    status: "PENDING",
    txHash: null,
    processedAt: null,
    createdAt: new Date(),
  };
  
  buybacks.set(buyback.id, buyback);
  try {
    await dbPersistence.persistBuyback(buyback);
  } catch (err) {
    console.error("Failed to persist buyback:", err.message);
  }
  return { success: true, buyback, quote };
}

async function confirmBuybackTransaction(buybackId, txHash) {
  let buyback = buybacks.get(buybackId);
  if (!buyback) {
    buyback = await dbPersistence.loadBuyback(buybackId);
    if (buyback) buybacks.set(buybackId, buyback);
  }
  if (!buyback) return { success: false, error: "Buyback not found" };
  
  buyback.txHash = txHash;
  buyback.status = "CONFIRMED";
  buybacks.set(buybackId, buyback);
  try {
    await dbPersistence.persistBuyback(buyback);
  } catch (err) {
    console.error("Failed to persist buyback:", err.message);
  }
  
  return { success: true, buyback };
}

async function processBuybackPayout(buybackId) {
  let buyback = buybacks.get(buybackId);
  if (!buyback) {
    buyback = await dbPersistence.loadBuyback(buybackId);
    if (buyback) buybacks.set(buybackId, buyback);
  }
  if (!buyback) return { success: false, error: "Buyback not found" };
  if (buyback.status !== "CONFIRMED") return { success: false, error: "Buyback not confirmed" };
  
  buyback.status = "PROCESSING";
  buyback.processedAt = new Date();
  buybacks.set(buybackId, buyback);
  try {
    await dbPersistence.persistBuyback(buyback);
  } catch (err) {
    console.error("Failed to persist buyback:", err.message);
  }
  
  setTimeout(async () => {
    buyback.status = "COMPLETED";
    buybacks.set(buybackId, buyback);
    try {
      await dbPersistence.persistBuyback(buyback);
    } catch (err) {
      console.error("Failed to persist completed buyback:", err.message);
    }
  }, 2000);
  
  return { success: true, buyback };
}

async function initiateBridgeTransfer(userId, sourceChain, destChain, amount) {
  const source = SUPPORTED_CHAINS.find(c => c.id === sourceChain);
  const dest = SUPPORTED_CHAINS.find(c => c.id === destChain);
  
  if (!source || !dest) return { success: false, error: "Invalid chain" };
  if (dest.status !== "ACTIVE" && dest.status !== "PLANNED") {
    return { success: false, error: "Destination chain not supported" };
  }
  
  const bridgeFee = amount * (source.bridgeFee + dest.bridgeFee);
  const netAmount = amount - bridgeFee;
  
  const transaction = {
    id: `BRIDGE-${uuidv4().slice(0, 8).toUpperCase()}`,
    userId,
    direction: "OUTBOUND",
    sourceChain: source.id,
    destChain: dest.id,
    sourceToken: source.isHome ? "BSC" : BSC_TOKEN.wrappedVersions[source.id] || "wBSC",
    destToken: dest.isHome ? "BSC" : BSC_TOKEN.wrappedVersions[dest.id] || "wBSC",
    amount,
    bridgeFee,
    netAmount,
    sourceTxHash: null,
    destTxHash: null,
    status: "INITIATED",
    estimatedTime: "5-15 minutes",
    createdAt: new Date(),
    completedAt: null,
  };
  
  bridgeTransactions.set(transaction.id, transaction);
  try {
    await dbPersistence.persistBridgeTransaction(transaction);
  } catch (err) {
    console.error("Failed to persist bridge transaction:", err.message);
  }
  return { success: true, transaction };
}

function confirmBridgeSource(bridgeId, txHash) {
  const tx = bridgeTransactions.get(bridgeId);
  if (!tx) return { success: false, error: "Bridge transaction not found" };
  
  tx.sourceTxHash = txHash;
  tx.status = "SOURCE_CONFIRMED";
  bridgeTransactions.set(bridgeId, tx);
  
  return { success: true, transaction: tx };
}

async function completeBridgeTransfer(bridgeId, destTxHash) {
  let tx = bridgeTransactions.get(bridgeId);
  if (!tx) {
    tx = await dbPersistence.loadBridgeTransaction(bridgeId);
    if (tx) bridgeTransactions.set(bridgeId, tx);
  }
  if (!tx) return { success: false, error: "Bridge transaction not found" };
  
  tx.destTxHash = destTxHash;
  tx.status = "COMPLETED";
  tx.completedAt = new Date();
  bridgeTransactions.set(bridgeId, tx);
  try {
    await dbPersistence.persistBridgeTransaction(tx);
  } catch (err) {
    console.error("Failed to persist bridge transaction:", err.message);
  }
  
  return { success: true, transaction: tx };
}

async function initiateFiatTransaction(userId, type, cryptoAmount, fiatCurrency, provider) {
  const providerConfig = FIAT_PROVIDERS.find(p => p.id === provider);
  if (!providerConfig) return { success: false, error: "Invalid provider" };
  
  if (!providerConfig.currencies.includes(fiatCurrency)) {
    return { success: false, error: `Provider does not support ${fiatCurrency}` };
  }
  
  const fiatAmount = cryptoAmount * currentBSCPrice;
  const fee = fiatAmount * (providerConfig.feePercent / 100);
  const netAmount = type === "BUY" ? cryptoAmount : fiatAmount - fee;
  
  const transaction = {
    id: `FIAT-${uuidv4().slice(0, 8).toUpperCase()}`,
    userId,
    type,
    cryptoAmount,
    cryptoToken: "BSC",
    fiatAmount: type === "BUY" ? fiatAmount + fee : fiatAmount,
    netFiatAmount: type === "SELL" ? fiatAmount - fee : null,
    fiatCurrency,
    exchangeRate: currentBSCPrice,
    provider,
    providerFee: fee,
    providerTxId: null,
    status: "PENDING",
    metadata: {},
    createdAt: new Date(),
    completedAt: null,
  };
  
  fiatTransactions.set(transaction.id, transaction);
  try {
    await dbPersistence.persistFiatTransaction(transaction);
  } catch (err) {
    console.error("Failed to persist fiat transaction:", err.message);
  }
  return { success: true, transaction, providerConfig };
}

async function completeFiatTransaction(transactionId, providerTxId) {
  let tx = fiatTransactions.get(transactionId);
  if (!tx) {
    tx = await dbPersistence.loadFiatTransaction(transactionId);
    if (tx) fiatTransactions.set(transactionId, tx);
  }
  if (!tx) return { success: false, error: "Transaction not found" };
  
  tx.providerTxId = providerTxId;
  tx.status = "COMPLETED";
  tx.completedAt = new Date();
  fiatTransactions.set(transactionId, tx);
  try {
    await dbPersistence.persistFiatTransaction(tx);
  } catch (err) {
    console.error("Failed to persist fiat transaction:", err.message);
  }
  
  return { success: true, transaction: tx };
}

function getSupportedChains() {
  return SUPPORTED_CHAINS;
}

function getActiveChains() {
  return SUPPORTED_CHAINS.filter(c => c.status === "ACTIVE");
}

function getPlannedChains() {
  return SUPPORTED_CHAINS.filter(c => c.status === "PLANNED");
}

function getBSCToken() {
  return BSC_TOKEN;
}

function getDynastyBridgeToken() {
  return DYNASTY_BRIDGE_TOKEN;
}

function getFiatProviders() {
  return FIAT_PROVIDERS;
}

function getBuybackTiers() {
  return BUYBACK_TIERS;
}

function getPayoutMethods() {
  return PAYOUT_METHODS;
}

function getBuyback(buybackId) {
  return buybacks.get(buybackId) || null;
}

function getPartnerBuybacks(partnerId) {
  return Array.from(buybacks.values())
    .filter(b => b.partnerId === partnerId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getBridgeTransaction(bridgeId) {
  return bridgeTransactions.get(bridgeId) || null;
}

function getUserBridgeTransactions(userId) {
  return Array.from(bridgeTransactions.values())
    .filter(t => t.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getFiatTransaction(transactionId) {
  return fiatTransactions.get(transactionId) || null;
}

function getUserFiatTransactions(userId) {
  return Array.from(fiatTransactions.values())
    .filter(t => t.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getBridgeStats() {
  const allBridgeTx = Array.from(bridgeTransactions.values());
  const allBuybacks = Array.from(buybacks.values());
  const allFiatTx = Array.from(fiatTransactions.values());
  
  return {
    bridgeTransactions: {
      total: allBridgeTx.length,
      completed: allBridgeTx.filter(t => t.status === "COMPLETED").length,
      pending: allBridgeTx.filter(t => t.status !== "COMPLETED" && t.status !== "FAILED").length,
      totalVolume: allBridgeTx.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    },
    buybacks: {
      total: allBuybacks.length,
      completed: allBuybacks.filter(b => b.status === "COMPLETED").length,
      pending: allBuybacks.filter(b => b.status === "PENDING" || b.status === "PROCESSING").length,
      totalBSC: allBuybacks.reduce((sum, b) => sum + parseFloat(b.bscAmount), 0),
      totalFiat: allBuybacks.filter(b => b.status === "COMPLETED").reduce((sum, b) => sum + parseFloat(b.fiatAmount), 0),
    },
    fiatTransactions: {
      total: allFiatTx.length,
      buys: allFiatTx.filter(t => t.type === "BUY").length,
      sells: allFiatTx.filter(t => t.type === "SELL").length,
      totalVolume: allFiatTx.reduce((sum, t) => sum + parseFloat(t.fiatAmount), 0),
    },
    bscPrice: getBSCPrice(),
  };
}

module.exports = {
  getSupportedChains,
  getActiveChains,
  getPlannedChains,
  getBSCToken,
  getDynastyBridgeToken,
  getFiatProviders,
  getBuybackTiers,
  getPayoutMethods,
  getBSCPrice,
  updateBSCPrice,
  calculateBuybackQuote,
  initiateBuyback,
  confirmBuybackTransaction,
  processBuybackPayout,
  initiateBridgeTransfer,
  confirmBridgeSource,
  completeBridgeTransfer,
  initiateFiatTransaction,
  completeFiatTransaction,
  getBuyback,
  getPartnerBuybacks,
  getBridgeTransaction,
  getUserBridgeTransactions,
  getFiatTransaction,
  getUserFiatTransactions,
  getBridgeStats,
};
