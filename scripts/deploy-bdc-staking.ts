import { ethers } from "hardhat";

async function main() {
  const bdcAddress = process.env.BDC_TOKEN_ADDRESS;
  if (!bdcAddress) {
    throw new Error("BDC_TOKEN_ADDRESS not set");
  }

  const Staking = await ethers.getContractFactory("BDCStaking");
  const staking = await Staking.deploy(bdcAddress);

  await staking.waitForDeployment();

  const stakingAddress = await staking.getAddress();
  console.log("BDCStaking deployed at:", stakingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
