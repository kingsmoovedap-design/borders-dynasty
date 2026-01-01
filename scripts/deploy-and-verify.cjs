require('dotenv').config();
const hre = require('hardhat');
const fs = require('fs');

async function main() {
  const BordersSovereignCoin = await hre.ethers.getContractFactory('BordersSovereignCoin');
  const contract = await BordersSovereignCoin.deploy();

  console.log('Deploying contract...');
  await contract.deployed();
  console.log('✅ Contract deployed to:', contract.address);

  const path = './deployed.json';
  const deployments = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
  deployments['sepolia'] = { BordersSovereignCoin: contract.address };
  fs.writeFileSync(path, JSON.stringify(deployments, null, 2));
  console.log('📦 Address saved to deployed.json');

  console.log('⏳ Waiting for Etherscan to index...');
  await new Promise((resolve) => setTimeout(resolve, 60000));

  try {
    await hre.run('verify:verify', {
      address: contract.address,
      constructorArguments: [],
    });
    console.log('🔍 Contract verified on Etherscan!');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  }
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});
