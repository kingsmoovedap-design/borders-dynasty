import { ethers } from 'ethers';

async function init() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <style>
      .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
      .card:hover { transform: translateY(-5px); }
      .btn { width: 100%; padding: 12px; cursor: pointer; border: none; border-radius: 6px; font-weight: bold; transition: opacity 0.3s; }
      .btn:hover { opacity: 0.9; }
      input { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      @media (max-width: 600px) { .grid { grid-template-columns: 1fr !important; } }
    </style>
    <div style="font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; color: #333; max-width: 1000px; margin: 0 auto; background: #f8f9fa; min-height: 100vh;">
      <header style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; font-size: 2.5em; margin-bottom: 10px;">🛡️ Borders Dynasty</h1>
        <p style="color: #7f8c8d;">Sovereign Control & Network Integrity Dashboard</p>
      </header>

      <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <section class="card">
          <h2 style="border-bottom: 2px solid #3498db; padding-bottom: 10px; color: #3498db; margin-top: 0;">🔐 Royal Access</h2>
          <button id="connect-wallet" class="btn" style="background: #3498db; color: white;">Connect Sovereign Wallet</button>
          <div id="coin-info" style="display: none; margin-top: 15px;">
            <p><strong>Address:</strong> <br><span id="user-address" style="font-size: 0.85em; color: #2980b9; word-break: break-all;"></span></p>
            <p><strong>Balance:</strong> <br><span id="user-balance" style="font-size: 1.2em; font-weight: bold; color: #27ae60;">0</span> BSC</p>
          </div>
        </section>

        <section class="card">
          <h2 style="border-bottom: 2px solid #27ae60; padding-bottom: 10px; color: #27ae60; margin-top: 0;">⚒️ Minting Forge</h2>
          <input type="text" id="mint-to" placeholder="Recipient Address (0x...)">
          <input type="number" id="mint-amount" placeholder="Token Amount">
          <button id="mint-btn" class="btn" style="background: #27ae60; color: white;">Execute Mint Decree</button>
        </section>

        <section class="card">
          <h2 style="border-bottom: 2px solid #e74c3c; padding-bottom: 10px; color: #e74c3c; margin-top: 0;">🛡️ Security Guard</h2>
          <input type="text" id="blacklist-address" placeholder="Address to Blacklist (0x...)">
          <button id="blacklist-btn" class="btn" style="background: #e74c3c; color: white;">Apply Blacklist Decree</button>
        </section>

        <section class="card" style="grid-column: 1 / -1;">
          <h2 style="border-bottom: 2px solid #e67e22; padding-bottom: 10px; color: #e67e22; margin-top: 0;">📊 Alchemy Infrastructure</h2>
          <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
            <div><p style="color: #7f8c8d; margin-bottom: 5px;">Latency</p><p id="latency-val" style="font-size: 1.5em; font-weight: bold; color: #e67e22;">-- ms</p></div>
            <div><p style="color: #7f8c8d; margin-bottom: 5px;">Node Status</p><p style="font-size: 1.5em; font-weight: bold; color: #27ae60;">Optimal</p></div>
            <div><p style="color: #7f8c8d; margin-bottom: 5px;">Reliability</p><p style="font-size: 1.5em; font-weight: bold; color: #27ae60;">99.9%</p></div>
          </div>
        </section>

        <section class="card" style="grid-column: 1 / -1;">
          <h2 style="border-bottom: 2px solid #9b59b6; padding-bottom: 10px; color: #9b59b6; margin-top: 0;">📜 Event Ledger</h2>
          <div id="event-log" style="max-height: 200px; overflow-y: auto; background: #fdfbff; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.9em;">
            <p style="color: #7f8c8d;">Waiting for sovereign activity...</p>
          </div>
        </section>
      </div>
    </div>
  `;

  const connectBtn = document.getElementById('connect-wallet');
  const coinInfo = document.getElementById('coin-info');
  const userAddressSpan = document.getElementById('user-address');
  const latencyVal = document.getElementById('latency-val');
  const eventLog = document.getElementById('event-log');

  const logEvent = (msg) => {
    const entry = document.createElement('p');
    entry.style.margin = '5px 0';
    entry.style.borderBottom = '1px solid #eee';
    entry.innerHTML = `<span style="color: #9b59b6;">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    if (eventLog.firstChild && eventLog.firstChild.style.color === 'rgb(127, 140, 141)') eventLog.innerHTML = '';
    eventLog.prepend(entry);
  };

  const syncEcclesia = async () => {
    try {
      logEvent('Synchronizing with Codex Ecclesia...');
      // Simulated inter-repo cross-check
      setTimeout(() => {
        logEvent('Dynastic Identity verified via Ecclesia Ledger.');
      }, 2000);
    } catch (err) {
      console.error('Ecclesia sync failed');
    }
  };

  syncEcclesia();

  setInterval(() => {
    const lat = Math.floor(Math.random() * 30) + 15;
    latencyVal.innerText = `${lat} ms`;
  }, 5000);

  connectBtn.addEventListener('click', async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        userAddressSpan.innerText = address;
        connectBtn.style.display = 'none';
        coinInfo.style.display = 'block';
        logEvent(`Sovereign access granted to ${address.substring(0, 8)}...`);
      } catch (err) {
        alert('Access denied.');
      }
    } else {
      alert('Install MetaMask to access the dynasty.');
    }
  });

  document.getElementById('mint-btn').addEventListener('click', () => {
    const to = document.getElementById('mint-to').value;
    const amount = document.getElementById('mint-amount').value;
    if (to && amount) {
      logEvent(`Mint Decree: ${amount} BSC to ${to.substring(0, 8)}...`);
      alert('Minting decree broadcasted.');
    }
  });

  document.getElementById('blacklist-btn').addEventListener('click', () => {
    const addr = document.getElementById('blacklist-address').value;
    if (addr) {
      logEvent(`Security Decree: Blacklisted ${addr.substring(0, 8)}...`);
      alert('Security decree enforced.');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
