export const CHAINS = {
  BSC: {
    id: 56, // or testnet id if you're using testnet
    hexId: "0x38", // example mainnet
    name: "BNB Smart Chain",
    rpcUrl: process.env.REACT_APP_BSC_RPC_URL,
    explorer: "https://bscscan.com",
    tokenSymbol: "BSC",
  },
  ARBITRUM: {
    id: 42161,
    hexId: "0xa4b1",
    name: "Arbitrum One",
    rpcUrl: process.env.REACT_APP_ARBITRUM_RPC_URL,
    explorer: "https://arbiscan.io",
    tokenSymbol: "BDC",
  },
};

export const CONTRACTS = {
  BSC: {
    sovereignCoin: {
      address: "0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c",
      abi: require("../abis/BordersSovereignCoin.json").abi,
    },
  },
  ARBITRUM: {
    dynastyCoin: {
      address: process.env.REACT_APP_BDC_ADDRESS, // to fill later
      abi: require("../abis/BordersDynastyCoin.json").abi,
    },
    staking: {
      address: process.env.REACT_APP_BDC_STAKING_ADDRESS,
      abi: require("../abis/BDCStaking.json").abi,
    },
  },
};
