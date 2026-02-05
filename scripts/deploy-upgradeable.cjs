#!/usr/bin/env node

const { ethers, upgrades, run } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`🚀 Deploying with account: ${deployer.address}`);

  const BordersSovereignCoin = await ethers.getContractFactory("BordersSovereignCoin");

  console.log("🔧 Deploying upgradeable proxy...");
  const bsc = await upgrades.deployProxy(BordersSovereignCoin, [deployer.address], {
    initializer: "initialize",
  });

  await bsc.waitForDeployment();
  const address = await bsc.getAddress();
  console.log(`✅ BordersSovereignCoin proxy deployed to: ${address}`);

  if (process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 Initiating Etherscan verification...");
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("✅ Verification successful");
    } catch (e) {
      console.warn("⚠️ Verification failed:", e.message);
    }
  } else {
    console.warn("⚠️ ETHERSCAN_API_KEY not set. Skipping verification.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("🛑 Deployment failed:", error);
    process.exit(1);
  });
