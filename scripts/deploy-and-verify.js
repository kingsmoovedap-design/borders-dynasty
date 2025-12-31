require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const BordersSovereignCoin = await hre.ethers.getContractFactory("BordersSovereignCoin");
  const contract = await BordersSovereignCoin.deploy();

  console.log("Deploying contract...");
  await contract.deployed();
  console.log("✅ Contract deployed to:", contract.address);

  // Wait for Etherscan to index the contract
  console.log("⏳ Waiting for Etherscan to index...");
  await new Promise((resolve) => setTimeout(resolve, 60000)); // wait 60 seconds

  // Verify the contract
  try {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: [], // Add args here if your constructor takes any
    });
    console.log("🔍 Contract verified on Etherscan!");
  } catch (err) {
    console.error("❌ Verification failed:", err.message);
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
