const { ethers, upgrades } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const BordersSovereignCoin = await ethers.getContractFactory('BordersSovereignCoin');
  const bsc = await upgrades.deployProxy(BordersSovereignCoin, [deployer.address], { initializer: 'initialize' });

  await bsc.waitForDeployment();
  const address = await bsc.getAddress();
  console.log('BordersSovereignCoin proxy deployed to:', address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
