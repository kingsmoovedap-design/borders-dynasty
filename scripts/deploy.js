const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const BSC = await hre.ethers.getContractFactory("BordersSovereignCoin");
  const bsc = await BSC.deploy(deployer.address);
  await bsc.deployed();
  console.log("Borders Sovereign Coin deployed to:", bsc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
