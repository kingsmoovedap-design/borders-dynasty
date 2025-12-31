require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("BordersSovereignCoin", process.env.CONTRACT_ADDRESS);

  const amount = ethers.utils.parseUnits("500", 18); // Burn 500 BSC

  const tx = await contract.burn(amount);
  console.log("Burning transaction sent:", tx.hash);
  await tx.wait();
  console.log(`🔥 Successfully burned 500 BSC from ${signer.address}`);
}

main().catch((error) => {
  console.error("❌ Burn failed:", error);
  process.exitCode = 1;
});
