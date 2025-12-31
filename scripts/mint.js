require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const contractAddress = process.env.CONTRACT_ADDRESS;

  const Token = await ethers.getContractAt("BordersSovereignCoin", contractAddress);

  const recipient = signer.address; // or replace with another address
  const amount = ethers.utils.parseUnits("1000", 18); // Mint 1000 BSC

  const tx = await Token.mint(recipient, amount);
  console.log("Minting in progress...");
  await tx.wait();
  console.log(`✅ Minted ${amount} BSC to ${recipient}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
