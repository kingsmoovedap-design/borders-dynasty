const BSC_CONTRACT = "0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c";
const SOVEREIGN_WALLET = "0xE89fDED72D0D83De3421C6642FA035ebE197804f";

const SUPPORTED_TOKENS = {
  BSC: {
    symbol: "BSC",
    name: "Borders Sovereign Coin",
    address: BSC_CONTRACT,
    decimals: 18,
    chain: "SEPOLIA",
    type: "ERC20_UPGRADEABLE",
    tradeable: true
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    address: "NATIVE",
    decimals: 18,
    chain: "SEPOLIA",
    type: "NATIVE",
    tradeable: true
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    chain: "SEPOLIA",
    type: "ERC20",
    tradeable: true
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
    decimals: 6,
    chain: "SEPOLIA",
    type: "ERC20",
    tradeable: true
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    decimals: 18,
    chain: "SEPOLIA",
    type: "ERC20",
    tradeable: true
  },
  DAI: {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574",
    decimals: 18,
    chain: "SEPOLIA",
    type: "ERC20",
    tradeable: true
  }
};

const TRADING_PAIRS = [
  { base: "BSC", quote: "ETH", enabled: true },
  { base: "BSC", quote: "USDC", enabled: true },
  { base: "BSC", quote: "USDT", enabled: true },
  { base: "BSC", quote: "WETH", enabled: true },
  { base: "BSC", quote: "DAI", enabled: true }
];

const LIQUIDITY_POOLS = {
  "BSC/ETH": {
    pair: "BSC/ETH",
    bscReserve: 100000,
    ethReserve: 50,
    fee: 0.003,
    provider: "DYNASTY_TREASURY"
  },
  "BSC/USDC": {
    pair: "BSC/USDC",
    bscReserve: 100000,
    usdcReserve: 10000,
    fee: 0.003,
    provider: "DYNASTY_TREASURY"
  }
};

const tradeHistory = [];
const pendingSwaps = new Map();

function getSupportedTokens() {
  return Object.values(SUPPORTED_TOKENS);
}

function getToken(symbol) {
  return SUPPORTED_TOKENS[symbol] || null;
}

function getTradingPairs() {
  return TRADING_PAIRS.filter(p => p.enabled);
}

function getExchangeRate(fromToken, toToken, amount) {
  const from = SUPPORTED_TOKENS[fromToken];
  const to = SUPPORTED_TOKENS[toToken];
  
  if (!from || !to) {
    return { error: "Invalid token pair" };
  }
  
  const pair = TRADING_PAIRS.find(
    p => (p.base === fromToken && p.quote === toToken) || (p.base === toToken && p.quote === fromToken)
  );
  
  if (!pair || !pair.enabled) {
    return { error: "Trading pair not available" };
  }
  
  let rate = 1;
  if (fromToken === "BSC") {
    if (toToken === "ETH") rate = 0.0005;
    else if (toToken === "USDC" || toToken === "USDT") rate = 0.10;
    else if (toToken === "DAI") rate = 0.10;
    else if (toToken === "WETH") rate = 0.0005;
  } else if (toToken === "BSC") {
    if (fromToken === "ETH") rate = 2000;
    else if (fromToken === "USDC" || fromToken === "USDT") rate = 10;
    else if (fromToken === "DAI") rate = 10;
    else if (fromToken === "WETH") rate = 2000;
  }
  
  const outputAmount = amount * rate;
  const fee = outputAmount * 0.003;
  const slippage = 0.005;
  
  return {
    fromToken,
    toToken,
    inputAmount: amount,
    outputAmount: outputAmount - fee,
    rate,
    fee,
    slippage,
    minimumReceived: (outputAmount - fee) * (1 - slippage),
    priceImpact: amount > 10000 ? 0.01 : 0.001,
    validFor: 30
  };
}

function createSwapOrder(fromToken, toToken, amount, walletAddress) {
  const quote = getExchangeRate(fromToken, toToken, amount);
  
  if (quote.error) {
    return { success: false, error: quote.error };
  }
  
  const orderId = `SWAP-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const order = {
    id: orderId,
    type: "SWAP",
    fromToken,
    toToken,
    inputAmount: amount,
    expectedOutput: quote.outputAmount,
    minimumOutput: quote.minimumReceived,
    rate: quote.rate,
    fee: quote.fee,
    walletAddress,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30000).toISOString()
  };
  
  pendingSwaps.set(orderId, order);
  
  return {
    success: true,
    order,
    message: "Swap order created. Execute within 30 seconds."
  };
}

function executeSwap(orderId, txHash) {
  const order = pendingSwaps.get(orderId);
  
  if (!order) {
    return { success: false, error: "Order not found or expired" };
  }
  
  if (new Date(order.expiresAt) < new Date()) {
    pendingSwaps.delete(orderId);
    return { success: false, error: "Order expired" };
  }
  
  order.status = "EXECUTED";
  order.txHash = txHash;
  order.executedAt = new Date().toISOString();
  
  tradeHistory.push(order);
  pendingSwaps.delete(orderId);
  
  return {
    success: true,
    order,
    message: "Swap executed successfully"
  };
}

function cancelSwap(orderId) {
  const order = pendingSwaps.get(orderId);
  
  if (!order) {
    return { success: false, error: "Order not found" };
  }
  
  order.status = "CANCELLED";
  order.cancelledAt = new Date().toISOString();
  
  tradeHistory.push(order);
  pendingSwaps.delete(orderId);
  
  return { success: true, order };
}

function getTradeHistory(filters = {}) {
  let history = [...tradeHistory];
  
  if (filters.walletAddress) {
    history = history.filter(t => t.walletAddress === filters.walletAddress);
  }
  if (filters.fromToken) {
    history = history.filter(t => t.fromToken === filters.fromToken);
  }
  if (filters.toToken) {
    history = history.filter(t => t.toToken === filters.toToken);
  }
  if (filters.status) {
    history = history.filter(t => t.status === filters.status);
  }
  
  return history.slice(-(filters.limit || 100)).reverse();
}

function getLiquidityInfo() {
  return Object.values(LIQUIDITY_POOLS);
}

function getMarketData() {
  return {
    bscPrice: 0.10,
    bscPriceChange24h: 2.5,
    marketCap: 100000,
    volume24h: 5000,
    circulatingSupply: 1000000,
    maxSupply: 1000000,
    holders: 150,
    tradingPairs: TRADING_PAIRS.filter(p => p.enabled).length,
    lastUpdated: new Date().toISOString()
  };
}

function getTradingStats() {
  const executed = tradeHistory.filter(t => t.status === "EXECUTED");
  const totalVolume = executed.reduce((sum, t) => sum + t.inputAmount, 0);
  
  return {
    totalTrades: executed.length,
    totalVolume,
    pendingOrders: pendingSwaps.size,
    averageTradeSize: executed.length > 0 ? totalVolume / executed.length : 0,
    mostTradedPair: "BSC/USDC",
    lastTradeAt: executed.length > 0 ? executed[executed.length - 1].executedAt : null
  };
}

const UPGRADE_SPECS = {
  currentVersion: "1.0.0",
  proposedVersion: "2.0.0",
  features: {
    multiTokenSwap: {
      status: "READY",
      description: "Swap BSC with any supported ERC20 token"
    },
    liquidityPools: {
      status: "READY",
      description: "AMM-style liquidity pools for trading"
    },
    crossChainBridge: {
      status: "PLANNED",
      description: "Bridge BSC to other chains (Polygon, Arbitrum, Base)"
    },
    stakingRewards: {
      status: "PLANNED",
      description: "Stake BSC to earn rewards"
    },
    governanceVoting: {
      status: "PLANNED",
      description: "Token-weighted governance voting"
    }
  },
  deploymentSteps: [
    "1. Deploy upgraded implementation contract with swap functionality",
    "2. Upgrade proxy to new implementation via UPGRADER_ROLE",
    "3. Deploy liquidity pool contracts",
    "4. Add initial liquidity from treasury",
    "5. Enable trading pairs",
    "6. Monitor and adjust fees/parameters"
  ]
};

function getUpgradeSpecs() {
  return UPGRADE_SPECS;
}

module.exports = {
  BSC_CONTRACT,
  SOVEREIGN_WALLET,
  SUPPORTED_TOKENS,
  TRADING_PAIRS,
  getSupportedTokens,
  getToken,
  getTradingPairs,
  getExchangeRate,
  createSwapOrder,
  executeSwap,
  cancelSwap,
  getTradeHistory,
  getLiquidityInfo,
  getMarketData,
  getTradingStats,
  getUpgradeSpecs
};
