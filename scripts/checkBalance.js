require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("BordersSovereignCoin", process.env.CONTRACT_ADDRESS);

  const balance = await contract.balanceOf(signer.address);
  console.log(`💰 ${signer.address} holds ${ethers.utils.formatUnits(balance, 18)} BSC`);
}

main().catch((error) => {
  console.error("❌ Balance check failed:", error);
  process.exitCode = 1;
});
