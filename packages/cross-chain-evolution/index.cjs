const BSC_CONTRACT = "0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c";
const SOVEREIGN_WALLET = "0xE89fDED72D0D83De3421C6642FA035ebE197804f";

const SUPPORTED_CHAINS = {
  ETHEREUM: {
    id: "ETHEREUM",
    chainId: 1,
    name: "Ethereum Mainnet",
    symbol: "ETH",
    explorer: "https://etherscan.io",
    rpc: "https://eth-mainnet.alchemyapi.io",
    status: "PLANNED",
    bridgeContract: null,
    gasToken: "ETH",
    avgBlockTime: 12
  },
  SEPOLIA: {
    id: "SEPOLIA",
    chainId: 11155111,
    name: "Sepolia Testnet",
    symbol: "ETH",
    explorer: "https://sepolia.etherscan.io",
    rpc: "https://sepolia.infura.io",
    status: "ACTIVE",
    bscContract: BSC_CONTRACT,
    gasToken: "ETH",
    avgBlockTime: 12
  },
  POLYGON: {
    id: "POLYGON",
    chainId: 137,
    name: "Polygon Mainnet",
    symbol: "MATIC",
    explorer: "https://polygonscan.com",
    rpc: "https://polygon-rpc.com",
    status: "PLANNED",
    bridgeContract: null,
    gasToken: "MATIC",
    avgBlockTime: 2,
    benefits: ["Low gas fees", "High throughput", "EVM compatible"]
  },
  ARBITRUM: {
    id: "ARBITRUM",
    chainId: 42161,
    name: "Arbitrum One",
    symbol: "ETH",
    explorer: "https://arbiscan.io",
    rpc: "https://arb1.arbitrum.io/rpc",
    status: "PLANNED",
    bridgeContract: null,
    gasToken: "ETH",
    avgBlockTime: 0.25,
    benefits: ["L2 scaling", "Low fees", "Ethereum security"]
  },
  BASE: {
    id: "BASE",
    chainId: 8453,
    name: "Base",
    symbol: "ETH",
    explorer: "https://basescan.org",
    rpc: "https://mainnet.base.org",
    status: "PLANNED",
    bridgeContract: null,
    gasToken: "ETH",
    avgBlockTime: 2,
    benefits: ["Coinbase ecosystem", "Low fees", "Growing adoption"]
  },
  OPTIMISM: {
    id: "OPTIMISM",
    chainId: 10,
    name: "Optimism",
    symbol: "ETH",
    explorer: "https://optimistic.etherscan.io",
    rpc: "https://mainnet.optimism.io",
    status: "PLANNED",
    bridgeContract: null,
    gasToken: "ETH",
    avgBlockTime: 2,
    benefits: ["L2 scaling", "Retroactive funding", "OP ecosystem"]
  },
  BSC_CHAIN: {
    id: "BSC_CHAIN",
    chainId: 56,
    name: "BNB Smart Chain",
    symbol: "BNB",
    explorer: "https://bscscan.com",
    rpc: "https://bsc-dataseed.binance.org",
    status: "PLANNED",
    bridgeContract: null,
    gasToken: "BNB",
    avgBlockTime: 3,
    benefits: ["Large user base", "Low fees", "Binance ecosystem"]
  }
};

const DEX_INTEGRATIONS = {
  UNISWAP: {
    id: "UNISWAP",
    name: "Uniswap",
    version: "V3",
    chains: ["ETHEREUM", "POLYGON", "ARBITRUM", "BASE", "OPTIMISM"],
    type: "AMM",
    status: "PLANNED",
    features: ["Concentrated liquidity", "Multiple fee tiers", "NFT positions"]
  },
  SUSHISWAP: {
    id: "SUSHISWAP",
    name: "SushiSwap",
    version: "V2",
    chains: ["ETHEREUM", "POLYGON", "ARBITRUM"],
    type: "AMM",
    status: "PLANNED",
    features: ["Cross-chain swaps", "Yield farming", "Governance"]
  },
  PANCAKESWAP: {
    id: "PANCAKESWAP",
    name: "PancakeSwap",
    version: "V3",
    chains: ["BSC_CHAIN", "ETHEREUM", "ARBITRUM"],
    type: "AMM",
    status: "PLANNED",
    features: ["High liquidity", "Low fees", "Lottery & NFTs"]
  },
  CURVE: {
    id: "CURVE",
    name: "Curve Finance",
    version: "V2",
    chains: ["ETHEREUM", "POLYGON", "ARBITRUM", "OPTIMISM"],
    type: "STABLE_AMM",
    status: "PLANNED",
    features: ["Stablecoin focus", "Low slippage", "CRV rewards"]
  }
};

const EVOLUTION_PHASES = {
  PHASE_1: {
    id: "PHASE_1",
    name: "Foundation",
    status: "COMPLETED",
    description: "Deploy BSC on Sepolia testnet with core functionality",
    milestones: [
      { id: "1.1", name: "ERC20 Upgradeable Deployment", status: "COMPLETED" },
      { id: "1.2", name: "Role-based Access Control", status: "COMPLETED" },
      { id: "1.3", name: "Blacklist & Pause Functions", status: "COMPLETED" },
      { id: "1.4", name: "Document Hash Registry", status: "COMPLETED" }
    ]
  },
  PHASE_2: {
    id: "PHASE_2",
    name: "Trading Infrastructure",
    status: "IN_PROGRESS",
    description: "Enable token trading with multiple assets",
    milestones: [
      { id: "2.1", name: "Multi-token Swap System", status: "COMPLETED" },
      { id: "2.2", name: "Liquidity Pool Design", status: "IN_PROGRESS" },
      { id: "2.3", name: "Price Oracle Integration", status: "PLANNED" },
      { id: "2.4", name: "Trading API Endpoints", status: "COMPLETED" }
    ]
  },
  PHASE_3: {
    id: "PHASE_3",
    name: "Cross-Chain Bridge",
    status: "PLANNED",
    description: "Enable BSC transfers across multiple chains",
    milestones: [
      { id: "3.1", name: "Bridge Contract Development", status: "PLANNED" },
      { id: "3.2", name: "Polygon Deployment", status: "PLANNED" },
      { id: "3.3", name: "Arbitrum Deployment", status: "PLANNED" },
      { id: "3.4", name: "Base Deployment", status: "PLANNED" }
    ]
  },
  PHASE_4: {
    id: "PHASE_4",
    name: "DEX Integration",
    status: "PLANNED",
    description: "List BSC on major decentralized exchanges",
    milestones: [
      { id: "4.1", name: "Uniswap V3 Pool Creation", status: "PLANNED" },
      { id: "4.2", name: "SushiSwap Integration", status: "PLANNED" },
      { id: "4.3", name: "Liquidity Mining Program", status: "PLANNED" },
      { id: "4.4", name: "Trading Volume Growth", status: "PLANNED" }
    ]
  },
  PHASE_5: {
    id: "PHASE_5",
    name: "Ecosystem Expansion",
    status: "PLANNED",
    description: "Full ecosystem with staking, governance, and utilities",
    milestones: [
      { id: "5.1", name: "Staking Contract Deployment", status: "PLANNED" },
      { id: "5.2", name: "Governance DAO Launch", status: "PLANNED" },
      { id: "5.3", name: "Utility Token Features", status: "PLANNED" },
      { id: "5.4", name: "Partner Integrations", status: "PLANNED" }
    ]
  }
};

const STAKING_TIERS = {
  BRONZE_STAKE: { minStake: 1000, apy: 5, lockPeriod: 30, benefits: ["Basic rewards", "Community access"] },
  SILVER_STAKE: { minStake: 10000, apy: 8, lockPeriod: 90, benefits: ["Enhanced rewards", "Priority dispatch", "Fee discount 5%"] },
  GOLD_STAKE: { minStake: 50000, apy: 12, lockPeriod: 180, benefits: ["Premium rewards", "Governance voting", "Fee discount 10%"] },
  PLATINUM_STAKE: { minStake: 100000, apy: 15, lockPeriod: 365, benefits: ["Maximum rewards", "Proposal rights", "Fee discount 15%", "Partner perks"] },
  DYNASTY_STAKE: { minStake: 500000, apy: 20, lockPeriod: 730, benefits: ["Elite rewards", "Ministry access", "Fee discount 20%", "Revenue share"] }
};

function getChains() {
  return Object.values(SUPPORTED_CHAINS);
}

function getChain(chainId) {
  return Object.values(SUPPORTED_CHAINS).find(c => c.chainId === chainId || c.id === chainId);
}

function getActiveChains() {
  return Object.values(SUPPORTED_CHAINS).filter(c => c.status === "ACTIVE");
}

function getPlannedChains() {
  return Object.values(SUPPORTED_CHAINS).filter(c => c.status === "PLANNED");
}

function getDEXIntegrations() {
  return Object.values(DEX_INTEGRATIONS);
}

function getDEX(dexId) {
  return DEX_INTEGRATIONS[dexId] || null;
}

function getEvolutionPhases() {
  return Object.values(EVOLUTION_PHASES);
}

function getCurrentPhase() {
  return Object.values(EVOLUTION_PHASES).find(p => p.status === "IN_PROGRESS") || EVOLUTION_PHASES.PHASE_2;
}

function getPhaseProgress() {
  const phases = Object.values(EVOLUTION_PHASES);
  const completed = phases.filter(p => p.status === "COMPLETED").length;
  const inProgress = phases.filter(p => p.status === "IN_PROGRESS").length;
  
  const totalMilestones = phases.reduce((sum, p) => sum + p.milestones.length, 0);
  const completedMilestones = phases.reduce(
    (sum, p) => sum + p.milestones.filter(m => m.status === "COMPLETED").length, 0
  );
  
  return {
    phasesCompleted: completed,
    phasesInProgress: inProgress,
    phasesPlanned: phases.length - completed - inProgress,
    totalPhases: phases.length,
    milestonesCompleted: completedMilestones,
    totalMilestones,
    overallProgress: Math.round((completedMilestones / totalMilestones) * 100)
  };
}

function getStakingTiers() {
  return STAKING_TIERS;
}

function calculateStakingRewards(amount, tier, daysStaked) {
  const tierConfig = STAKING_TIERS[tier];
  if (!tierConfig || amount < tierConfig.minStake) {
    return { error: "Invalid tier or insufficient stake amount" };
  }
  
  const annualReward = amount * (tierConfig.apy / 100);
  const dailyReward = annualReward / 365;
  const totalReward = dailyReward * daysStaked;
  
  return {
    tier,
    stakeAmount: amount,
    apy: tierConfig.apy,
    daysStaked,
    earnedRewards: Math.round(totalReward * 100) / 100,
    projectedAnnual: Math.round(annualReward * 100) / 100,
    lockPeriodDays: tierConfig.lockPeriod,
    benefits: tierConfig.benefits
  };
}

function getBridgeStatus() {
  const plannedChains = getPlannedChains();
  
  return {
    currentChain: "SEPOLIA",
    bridgesPlanned: plannedChains.length,
    plannedChains: plannedChains.map(c => ({
      id: c.id,
      name: c.name,
      chainId: c.chainId,
      benefits: c.benefits || []
    })),
    estimatedLaunch: "Q2 2026",
    bridgeTechnology: "Lock & Mint",
    securityModel: "Multi-sig validator network"
  };
}

function getTokenomics() {
  return {
    symbol: "BSC",
    name: "Borders Sovereign Coin",
    totalSupply: 1000000,
    circulatingSupply: 100000,
    treasuryHoldings: 500000,
    stakingReserve: 200000,
    ecosystemFund: 100000,
    teamAllocation: 100000,
    vestingSchedule: {
      team: "4 years linear, 1 year cliff",
      ecosystem: "5 years linear",
      treasury: "Governed by DAO"
    },
    burnMechanism: "1% of trading fees burned",
    inflationRate: 0,
    deflationary: true
  };
}

function getCrossChainRoadmap() {
  return {
    phases: getEvolutionPhases(),
    progress: getPhaseProgress(),
    bridges: getBridgeStatus(),
    dexIntegrations: getDEXIntegrations(),
    stakingTiers: getStakingTiers(),
    tokenomics: getTokenomics(),
    vision: "Enable BSC trading on all major chains and DEXs, creating a fully decentralized logistics token economy"
  };
}

module.exports = {
  SUPPORTED_CHAINS,
  DEX_INTEGRATIONS,
  EVOLUTION_PHASES,
  STAKING_TIERS,
  BSC_CONTRACT,
  SOVEREIGN_WALLET,
  getChains,
  getChain,
  getActiveChains,
  getPlannedChains,
  getDEXIntegrations,
  getDEX,
  getEvolutionPhases,
  getCurrentPhase,
  getPhaseProgress,
  getStakingTiers,
  calculateStakingRewards,
  getBridgeStatus,
  getTokenomics,
  getCrossChainRoadmap
};
