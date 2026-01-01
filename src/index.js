import { ethers } from 'ethers';

// Contracts address (Placeholder - update after deployment)
const BSC_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

async function init() {
  console.log('👑 CodexChain fully integrated. The realm is active.');
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #2c3e50;">🛡️ Borders Dynasty: CodexChain</h1>
      <div id="wallet-status" style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <button id="connect-wallet" style="padding: 10px 20px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px;">Connect Wallet</button>
      </div>
      <div id="coin-info" style="display: none;">
        <h3>💰 Borders Sovereign Coin (BSC)</h3>
        <p><strong>Address:</strong> <span id="user-address"></span></p>
        <p><strong>Balance:</strong> <span id="user-balance">0</span> BSC</p>
        <div style="margin-top: 15px;">
           <input type="text" id="mint-to" placeholder="Address to mint to" style="padding: 8px; width: 300px;">
           <input type="number" id="mint-amount" placeholder="Amount" style="padding: 8px; width: 100px;">
           <button id="mint-btn" style="padding: 8px 15px; cursor: pointer; background: #27ae60; color: white; border: none; border-radius: 4px;">Mint BSC</button>
        </div>
      </div>
    </div>
  `;

  const connectBtn = document.getElementById('connect-wallet');
  const coinInfo = document.getElementById('coin-info');
  const userAddressSpan = document.getElementById('user-address');
  const userBalanceSpan = document.getElementById('user-balance');

  let provider;
  let signer;

  connectBtn.addEventListener('click', async () => {
    if (window.ethereum) {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        userAddressSpan.innerText = address;
        connectBtn.style.display = 'none';
        coinInfo.style.display = 'block';
        
        console.log('Wallet connected:', address);
      } catch (err) {
        console.error('Connection failed:', err);
        alert('Failed to connect wallet.');
      }
    } else {
      alert('Please install MetaMask!');
    }
  });

  document.getElementById('mint-btn').addEventListener('click', async () => {
    const to = document.getElementById('mint-to').value;
    const amount = document.getElementById('mint-amount').value;
    if (!to || !amount) return alert('Please provide address and amount');
    
    console.log(`Requesting mint of ${amount} BSC to ${to}...`);
    // Logic for contract interaction would go here
  });
}

document.addEventListener('DOMContentLoaded', init);
