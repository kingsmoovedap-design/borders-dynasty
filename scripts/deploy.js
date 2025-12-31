async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with:", deployer.address);

  const Token = await ethers.getContractFactory("BordersSovereignCoin");
  const token = await Token.deploy();
  await token.deployed();

  console.log("Borders Sovereign Coin deployed to:", token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
