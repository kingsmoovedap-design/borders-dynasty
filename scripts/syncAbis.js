const fs = require('fs');
const path = require('path');

const contracts = ['BordersSovereignCoin', 'ScrollHashRegistry', 'DynasticIdentity'];
const srcDir = path.join(__dirname, '../artifacts/contracts');
const destDir = path.join(__dirname, '../src/abis');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

contracts.forEach(name => {
  const abiPath = path.join(srcDir, `${name}.sol/${name}.json`);
  const destPath = path.join(destDir, `${name}.json`);
  
  if (fs.existsSync(abiPath)) {
    fs.copyFileSync(abiPath, destPath);
    console.log(`Synced ${name}.json`);
  } else {
    console.error(`Not found: ${abiPath}`);
  }
});

console.log('\nABI sync complete!');
