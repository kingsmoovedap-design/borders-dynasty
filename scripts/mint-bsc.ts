import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const to = process.env.MINT_TO;
  const amount = ethers.utils.parseUnits(process.env.MINT_AMOUNT || "0", 18);

  const BSC = await ethers.getContractAt("BSC", process.env.CONTRACT_ADDRESS!);
  const tx = await BSC.mint(to, amount);
  console.log("Minting transaction sent:", tx.hash);
  await tx.wait();
  console.log("Minted", amount.toString(), "tokens to", to);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
