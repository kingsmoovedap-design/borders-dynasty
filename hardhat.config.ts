import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL || "";
const ARBITRUM_DEPLOYER_KEY = process.env.ARBITRUM_DEPLOYER_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    arbitrum: {
      url: ARBITRUM_RPC_URL,
      accounts: ARBITRUM_DEPLOYER_KEY ? [ARBITRUM_DEPLOYER_KEY] : [],
    },
    // add testnets if desired, e.g. arbitrumGoerli
  },
  etherscan: {
    // Arbiscan API key if you want verification
    apiKey: process.env.ARBISCAN_API_KEY || "",
  },
};

export default config;
