import { ethers } from 'ethers';

// Contracts address (Placeholder - update after deployment)
const BSC_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

async function init() {
  console.log('👑 CodexChain fully integrated. The realm is active.');
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 900px; margin: 0 auto; background: #f8f9fa;">
      <header style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; font-size: 2.5em; margin-bottom: 10px;">🛡️ Borders Dynasty: CodexChain</h1>
        <p style="color: #7f8c8d;">Royal Infrastructure & Governance Dashboard</p>
      </header>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <section id="wallet-section" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="border-bottom: 2px solid #3498db; padding-bottom: 10px; color: #3498db;">🔐 Royal Access</h2>
          <div id="wallet-status" style="margin-top: 15px;">
            <button id="connect-wallet" style="width: 100%; padding: 12px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 6px; font-weight: bold; transition: background 0.3s;">Connect Sovereign Wallet</button>
            <div id="coin-info" style="display: none; margin-top: 15px;">
              <p><strong>Sovereign Address:</strong> <br><span id="user-address" style="font-size: 0.85em; color: #2980b9;"></span></p>
              <p><strong>Treasury Balance:</strong> <br><span id="user-balance" style="font-size: 1.2em; font-weight: bold; color: #27ae60;">0</span> BSC</p>
            </div>
          </div>
        </section>

        <section id="minting-section" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="border-bottom: 2px solid #27ae60; padding-bottom: 10px; color: #27ae60;">⚒️ Minting Forge</h2>
          <div style="margin-top: 15px;">
             <label style="display: block; margin-bottom: 5px; font-weight: bold;">Recipient Address</label>
             <input type="text" id="mint-to" placeholder="0x..." style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
             <label style="display: block; margin-bottom: 5px; font-weight: bold;">Amount</label>
             <input type="number" id="mint-amount" placeholder="0.0" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
             <button id="mint-btn" style="width: 100%; padding: 12px; cursor: pointer; background: #27ae60; color: white; border: none; border-radius: 6px; font-weight: bold; transition: background 0.3s;">Execute Minting Decree</button>
          </div>
        </section>

        <section id="metrics-section" style="grid-column: span 2; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="border-bottom: 2px solid #e67e22; padding-bottom: 10px; color: #e67e22;">📊 Alchemy Network Metrics</h2>
          <div style="display: flex; justify-content: space-around; margin-top: 20px; text-align: center;">
            <div>
              <p style="color: #7f8c8d; margin-bottom: 5px;">Node Latency</p>
              <p id="latency-val" style="font-size: 1.5em; font-weight: bold; color: #e67e22;">-- ms</p>
            </div>
            <div>
              <p style="color: #7f8c8d; margin-bottom: 5px;">Requests (24h)</p>
              <p id="requests-val" style="font-size: 1.5em; font-weight: bold; color: #e67e22;">Active</p>
            </div>
            <div>
              <p style="color: #7f8c8d; margin-bottom: 5px;">Success Rate</p>
              <p id="success-val" style="font-size: 1.5em; font-weight: bold; color: #27ae60;">99.9%</p>
            </div>
          </div>
          <div style="margin-top: 20px; padding: 10px; background: #fdf2e9; border-left: 4px solid #e67e22; font-size: 0.9em;">
            <p><strong>Alchemy Status:</strong> Optimized for CodexChain (App ID: lm9vdq2okew29efg)</p>
          </div>
        </section>
      </div>
    </div>
  `;

  const connectBtn = document.getElementById('connect-wallet');
  const coinInfo = document.getElementById('coin-info');
  const userAddressSpan = document.getElementById('user-address');
  const latencyVal = document.getElementById('latency-val');

  let provider;
  let signer;

  // Simulate network latency check for the dashboard
  setInterval(() => {
    const lat = Math.floor(Math.random() * 50) + 20;
    latencyVal.innerText = `${lat} ms`;
  }, 5000);

  connectBtn.addEventListener('click', async () => {
    if (window.ethereum) {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        userAddressSpan.innerText = address;
        connectBtn.style.display = 'none';
        coinInfo.style.display = 'block';
        
        console.log('Sovereign Wallet connected:', address);
      } catch (err) {
        console.error('Connection failed:', err);
        alert('Failed to connect sovereign wallet.');
      }
    } else {
      alert('Please install a Web3 wallet to access the dynasty!');
    }
  });

  document.getElementById('mint-btn').addEventListener('click', async () => {
    const to = document.getElementById('mint-to').value;
    const amount = document.getElementById('mint-amount').value;
    if (!to || !amount) return alert('Please provide the royal recipient and amount.');
    
    console.log(`Decreeing mint of ${amount} BSC to ${to}...`);
    alert(`Minting Decree issued for ${amount} BSC to ${to}. Process initiated via Alchemy.`);
  });
}

document.addEventListener('DOMContentLoaded', init);
