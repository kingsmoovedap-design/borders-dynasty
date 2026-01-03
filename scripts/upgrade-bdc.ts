import { ethers, upgrades } from "hardhat";

async function main() {
  const proxyAddress = process.env.BDC_PROXY_ADDRESS;
  if (!proxyAddress) {
    throw new Error("BDC_PROXY_ADDRESS not set");
  }

  console.log("Upgrading BDC at proxy:", proxyAddress);

  const BDCv2 = await ethers.getContractFactory("BordersDynastyCoin");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, BDCv2);

  await upgraded.waitForDeployment();

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("BDC upgraded. New implementation address:", implAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
