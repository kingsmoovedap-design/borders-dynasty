// PSEUDO-CODE – DO NOT USE IN PRODUCTION WITHOUT REVIEW

import { ethers, upgrades } from "hardhat";

async function main() {
  const name = "Borders Dynasty Coin";
  const symbol = "BDC";

  const supplyRaw = "10000000"; // 10M
  const decimals = 18;
  const initialSupply = ethers.parseUnits(supplyRaw, decimals);

  const treasury = process.env.BDC_TREASURY_ADDRESS;
  if (!treasury) {
    throw new Error("BDC_TREASURY_ADDRESS not set");
  }

  console.log("Deploying BordersDynastyCoin implementation to Arbitrum...");

  const BDC = await ethers.getContractFactory("BordersDynastyCoin");

  const bdc = await upgrades.deployProxy(
    BDC,
    [name, symbol, initialSupply, treasury],
    {
      initializer: "initialize",
      kind: "transparent", // or "uups" if you implement UUPS
    }
  );

  await bdc.waitForDeployment();

  const proxyAddress = await bdc.getAddress();
  console.log("BDC proxy deployed at:", proxyAddress);

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);

  console.log("Implementation address:", implAddress);
  console.log("Proxy admin address:", adminAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
