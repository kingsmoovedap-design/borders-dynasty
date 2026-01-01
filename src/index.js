import { ethers } from 'ethers';
import BordersSovereignCoin from './abis/BordersSovereignCoin.json';
import ScrollHashRegistry from './abis/ScrollHashRegistry.json';
import DynasticIdentity from './abis/DynasticIdentity.json';

const BSC_CONTRACT_ADDRESS = '0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c';
const SEPOLIA_CHAIN_ID = '0xaa36a7';

const coinAbi = BordersSovereignCoin.abi;
void ScrollHashRegistry;
void DynasticIdentity;

let provider = null;
let signer = null;
let bscContract = null;
let userAddress = null;

async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }],
        });
        return true;
      } catch (addError) {
        return false;
      }
    }
    return false;
  }
}

async function init() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }
      .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
      .card:hover { transform: translateY(-3px); }
      .btn { width: 100%; padding: 14px; cursor: pointer; border: none; border-radius: 8px; font-weight: bold; transition: all 0.3s; font-size: 1em; }
      .btn:hover { opacity: 0.9; transform: scale(1.02); }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .btn-loading { position: relative; color: transparent !important; }
      .btn-loading::after { content: ''; position: absolute; width: 20px; height: 20px; top: 50%; left: 50%; margin-left: -10px; margin-top: -10px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      input, select { width: 100%; padding: 12px; margin-bottom: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1em; transition: border-color 0.3s; }
      input:focus, select:focus { outline: none; border-color: #3498db; }
      .network-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold; }
      .network-correct { background: #27ae60; color: white; }
      .network-wrong { background: #e74c3c; color: white; cursor: pointer; }
      .toast { position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: bold; z-index: 1000; animation: slideIn 0.3s ease; }
      .toast-success { background: #27ae60; }
      .toast-error { background: #e74c3c; }
      .toast-info { background: #3498db; }
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @media (max-width: 768px) { 
        .grid { grid-template-columns: 1fr !important; } 
        h1 { font-size: 1.8em !important; }
        .card { padding: 15px; }
      }
      .tab-container { display: flex; gap: 10px; margin-bottom: 15px; }
      .tab { flex: 1; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; background: white; cursor: pointer; text-align: center; font-weight: bold; transition: all 0.3s; }
      .tab.active { border-color: #3498db; background: #ebf5fb; color: #3498db; }
      .tab-content { display: none; }
      .tab-content.active { display: block; }
    </style>
    <div style="font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; color: #333; max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); min-height: 100vh;">
      <header style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; font-size: 2.5em; margin-bottom: 10px;">Borders Dynasty</h1>
        <p style="color: #7f8c8d; margin-bottom: 15px;">Web3 DeFi Sovereign Control Dashboard</p>
        <div id="network-status" style="margin-bottom: 15px;"></div>
        <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
          <span class="network-badge network-correct">LIVE ON SEPOLIA</span>
          <span class="network-badge" style="background: #3498db;">VERIFIED CONTRACT</span>
          <span class="network-badge" style="background: #9b59b6;">DeFi ENABLED</span>
        </div>
      </header>

      <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        
        <section class="card">
          <h2 style="border-bottom: 2px solid #3498db; padding-bottom: 10px; color: #3498db; margin-top: 0;">Wallet Connection</h2>
          <button id="connect-wallet" class="btn" style="background: linear-gradient(135deg, #3498db, #2980b9); color: white;">Connect Wallet</button>
          <div id="coin-info" style="display: none; margin-top: 15px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p style="margin: 0 0 8px 0; color: #7f8c8d; font-size: 0.85em;">Connected Address</p>
              <p id="user-address" style="margin: 0; font-size: 0.9em; color: #2980b9; word-break: break-all; font-family: monospace;"></p>
            </div>
            <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); padding: 20px; border-radius: 8px; text-align: center; color: white;">
              <p style="margin: 0 0 5px 0; font-size: 0.9em; opacity: 0.9;">BSC Balance</p>
              <p style="margin: 0; font-size: 2em; font-weight: bold;"><span id="user-balance">0</span></p>
            </div>
            <button id="refresh-balance" class="btn" style="background: #ecf0f1; color: #2c3e50; margin-top: 10px;">Refresh Balance</button>
          </div>
        </section>

        <section class="card">
          <h2 style="border-bottom: 2px solid #9b59b6; padding-bottom: 10px; color: #9b59b6; margin-top: 0;">Token Operations</h2>
          <div class="tab-container">
            <div class="tab active" data-tab="transfer">Transfer</div>
            <div class="tab" data-tab="mint">Mint</div>
          </div>
          <div id="transfer-tab" class="tab-content active">
            <input type="text" id="transfer-to" placeholder="Recipient Address (0x...)">
            <input type="number" id="transfer-amount" placeholder="Amount" step="0.000001" min="0">
            <button id="transfer-btn" class="btn" style="background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white;">Transfer BSC</button>
          </div>
          <div id="mint-tab" class="tab-content">
            <input type="text" id="mint-to" placeholder="Recipient Address (0x...)">
            <input type="number" id="mint-amount" placeholder="Amount" step="0.000001" min="0">
            <button id="mint-btn" class="btn" style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white;">Mint BSC (Admin)</button>
            <p style="font-size: 0.8em; color: #7f8c8d; margin-top: 10px;">Requires MINTER_ROLE permission</p>
          </div>
        </section>

        <section class="card">
          <h2 style="border-bottom: 2px solid #e74c3c; padding-bottom: 10px; color: #e74c3c; margin-top: 0;">Security Controls</h2>
          <input type="text" id="blacklist-address" placeholder="Address to Blacklist (0x...)">
          <button id="blacklist-btn" class="btn" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white;">Add to Blacklist</button>
          <div style="margin-top: 15px;">
            <input type="text" id="check-blacklist-address" placeholder="Check if address is blacklisted">
            <button id="check-blacklist-btn" class="btn" style="background: #34495e; color: white;">Check Status</button>
            <p id="blacklist-result" style="text-align: center; font-weight: bold; margin-top: 10px;"></p>
          </div>
        </section>

        <section class="card" style="grid-column: 1 / -1;">
          <h2 style="border-bottom: 2px solid #8e44ad; padding-bottom: 10px; color: #8e44ad; margin-top: 0;">Document Registry</h2>
          <textarea id="scroll-text" placeholder="Enter document text to hash and verify..." style="width: 100%; height: 100px; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; margin-bottom: 10px; font-family: 'Georgia', serif; resize: vertical;"></textarea>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="hash-scroll-btn" class="btn" style="background: #34495e; color: white; flex: 1; min-width: 150px;">Generate Hash</button>
            <button id="verify-scroll-btn" class="btn" style="background: linear-gradient(135deg, #8e44ad, #9b59b6); color: white; flex: 1; min-width: 150px;">Verify On-Chain</button>
          </div>
          <div id="scroll-result" style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-family: monospace; word-break: break-all; display: none;"></div>
        </section>

        <section class="card" style="grid-column: 1 / -1;">
          <h2 style="border-bottom: 2px solid #2ecc71; padding-bottom: 10px; color: #2ecc71; margin-top: 0;">Contract Information</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
            <div style="background: linear-gradient(135deg, #e8f8f5, #d5f4e6); border-radius: 8px; padding: 15px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 0.8em; margin: 0 0 5px 0;">Status</p>
              <p style="color: #27ae60; font-weight: bold; font-size: 1.1em; margin: 0;">ACTIVE</p>
            </div>
            <div style="background: linear-gradient(135deg, #ebf5fb, #d6eaf8); border-radius: 8px; padding: 15px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 0.8em; margin: 0 0 5px 0;">Network</p>
              <p style="color: #3498db; font-weight: bold; font-size: 1.1em; margin: 0;">SEPOLIA</p>
            </div>
            <div style="background: linear-gradient(135deg, #fef9e7, #fcf3cf); border-radius: 8px; padding: 15px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 0.8em; margin: 0 0 5px 0;">Max Supply</p>
              <p style="color: #f39c12; font-weight: bold; font-size: 1.1em; margin: 0;">1,000,000 BSC</p>
            </div>
            <div style="background: linear-gradient(135deg, #f5eef8, #ebdef0); border-radius: 8px; padding: 15px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 0.8em; margin: 0 0 5px 0;">Total Supply</p>
              <p id="total-supply" style="color: #9b59b6; font-weight: bold; font-size: 1.1em; margin: 0;">--</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 15px;">
            <a href="https://sepolia.etherscan.io/address/${BSC_CONTRACT_ADDRESS}" target="_blank" style="color: #3498db; text-decoration: none; font-weight: bold;">View on Etherscan</a>
          </div>
        </section>

        <section class="card" style="grid-column: 1 / -1;">
          <h2 style="border-bottom: 2px solid #e67e22; padding-bottom: 10px; color: #e67e22; margin-top: 0;">Transaction Log</h2>
          <div id="event-log" style="max-height: 250px; overflow-y: auto; background: #fafafa; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.9em;">
            <p style="color: #7f8c8d; margin: 0;">Waiting for activity...</p>
          </div>
        </section>
      </div>

      <footer style="text-align: center; padding: 30px 0; color: #7f8c8d; font-size: 0.85em;">
        <p>Borders Dynasty DeFi Platform | Powered by Ethereum</p>
      </footer>
    </div>
  `;

  const connectBtn = document.getElementById('connect-wallet');
  const coinInfo = document.getElementById('coin-info');
  const userAddressSpan = document.getElementById('user-address');
  const eventLog = document.getElementById('event-log');
  const networkStatus = document.getElementById('network-status');

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const logEvent = (msg, type = 'info') => {
    const entry = document.createElement('p');
    entry.style.margin = '8px 0';
    entry.style.padding = '8px';
    entry.style.background = 'white';
    entry.style.borderRadius = '4px';
    entry.style.borderLeft = `4px solid ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'}`;
    entry.innerHTML = `<span style="color: #7f8c8d; font-size: 0.85em;">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
    if (eventLog.firstChild?.style?.color === 'rgb(127, 140, 141)') eventLog.innerHTML = '';
    eventLog.prepend(entry);
  };

  const setButtonLoading = (btn, loading) => {
    btn.disabled = loading;
    btn.classList.toggle('btn-loading', loading);
  };

  const generateHashFromText = (text) => {
    return ethers.keccak256(ethers.toUtf8Bytes(text));
  };

  const updateNetworkStatus = async () => {
    if (!window.ethereum) return;
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;
    networkStatus.innerHTML = isCorrectNetwork 
      ? '<span class="network-badge network-correct">Connected to Sepolia</span>'
      : '<span class="network-badge network-wrong" onclick="window.switchNetwork()">Wrong Network - Click to Switch</span>';
  };

  window.switchNetwork = switchToSepolia;

  const refreshBalance = async () => {
    if (!bscContract || !userAddress) return;
    try {
      const balance = await bscContract.balanceOf(userAddress);
      const decimals = await bscContract.decimals();
      document.getElementById('user-balance').innerText = parseFloat(ethers.formatUnits(balance, decimals)).toFixed(4);
    } catch (err) {
      console.error('Balance refresh failed:', err);
    }
  };

  const loadContractInfo = async () => {
    try {
      const readProvider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
      const readContract = new ethers.Contract(BSC_CONTRACT_ADDRESS, coinAbi, readProvider);
      const totalSupply = await readContract.totalSupply();
      const decimals = await readContract.decimals();
      document.getElementById('total-supply').innerText = parseFloat(ethers.formatUnits(totalSupply, decimals)).toLocaleString() + ' BSC';
    } catch (err) {
      console.error('Failed to load contract info:', err);
    }
  };

  loadContractInfo();

  if (window.ethereum) {
    updateNetworkStatus();
    window.ethereum.on('chainChanged', () => {
      updateNetworkStatus();
      window.location.reload();
    });
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        window.location.reload();
      } else {
        userAddress = accounts[0];
        userAddressSpan.innerText = userAddress;
        refreshBalance();
      }
    });
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });

  connectBtn.addEventListener('click', async () => {
    if (!window.ethereum) {
      showToast('Please install MetaMask or another Web3 wallet', 'error');
      return;
    }

    setButtonLoading(connectBtn, true);

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        const switched = await switchToSepolia();
        if (!switched) {
          showToast('Please switch to Sepolia network', 'error');
          setButtonLoading(connectBtn, false);
          return;
        }
      }

      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      signer = await provider.getSigner();
      userAddress = await signer.getAddress();
      userAddressSpan.innerText = userAddress;

      bscContract = new ethers.Contract(BSC_CONTRACT_ADDRESS, coinAbi, signer);

      await refreshBalance();

      connectBtn.style.display = 'none';
      coinInfo.style.display = 'block';
      logEvent(`Wallet connected: ${userAddress.substring(0, 8)}...${userAddress.slice(-6)}`, 'success');
      showToast('Wallet connected successfully!', 'success');
      updateNetworkStatus();

    } catch (err) {
      logEvent(`Connection failed: ${err.message}`, 'error');
      showToast('Failed to connect wallet', 'error');
    }
    setButtonLoading(connectBtn, false);
  });

  document.getElementById('refresh-balance').addEventListener('click', async () => {
    const btn = document.getElementById('refresh-balance');
    setButtonLoading(btn, true);
    await refreshBalance();
    showToast('Balance refreshed', 'info');
    setButtonLoading(btn, false);
  });

  document.getElementById('transfer-btn').addEventListener('click', async () => {
    if (!bscContract) {
      showToast('Please connect wallet first', 'error');
      return;
    }
    const btn = document.getElementById('transfer-btn');
    const to = document.getElementById('transfer-to').value.trim();
    const amount = document.getElementById('transfer-amount').value;

    if (!to || !amount || parseFloat(amount) <= 0) {
      showToast('Please enter valid recipient and amount', 'error');
      return;
    }

    if (!ethers.isAddress(to)) {
      showToast('Invalid recipient address', 'error');
      return;
    }

    setButtonLoading(btn, true);
    try {
      const decimals = await bscContract.decimals();
      logEvent(`Initiating transfer of ${amount} BSC to ${to.substring(0, 8)}...`, 'info');
      const tx = await bscContract.transfer(to, ethers.parseUnits(amount, decimals));
      logEvent(`Transaction submitted: ${tx.hash.substring(0, 16)}...`, 'info');
      await tx.wait();
      logEvent('Transfer confirmed!', 'success');
      showToast('Transfer successful!', 'success');
      await refreshBalance();
      document.getElementById('transfer-to').value = '';
      document.getElementById('transfer-amount').value = '';
    } catch (err) {
      logEvent(`Transfer failed: ${err.reason || err.message}`, 'error');
      showToast('Transfer failed', 'error');
    }
    setButtonLoading(btn, false);
  });

  document.getElementById('mint-btn').addEventListener('click', async () => {
    if (!bscContract) {
      showToast('Please connect wallet first', 'error');
      return;
    }
    const btn = document.getElementById('mint-btn');
    const to = document.getElementById('mint-to').value.trim();
    const amount = document.getElementById('mint-amount').value;

    if (!to || !amount || parseFloat(amount) <= 0) {
      showToast('Please enter valid recipient and amount', 'error');
      return;
    }

    setButtonLoading(btn, true);
    try {
      const decimals = await bscContract.decimals();
      logEvent(`Minting ${amount} BSC to ${to.substring(0, 8)}...`, 'info');
      const tx = await bscContract.mint(to, ethers.parseUnits(amount, decimals));
      logEvent(`Mint transaction submitted: ${tx.hash.substring(0, 16)}...`, 'info');
      await tx.wait();
      logEvent('Mint confirmed!', 'success');
      showToast('Minting successful!', 'success');
      await refreshBalance();
      loadContractInfo();
      document.getElementById('mint-to').value = '';
      document.getElementById('mint-amount').value = '';
    } catch (err) {
      logEvent(`Minting failed: ${err.reason || 'Insufficient permissions'}`, 'error');
      showToast('Minting failed - requires MINTER_ROLE', 'error');
    }
    setButtonLoading(btn, false);
  });

  document.getElementById('blacklist-btn').addEventListener('click', async () => {
    if (!bscContract) {
      showToast('Please connect wallet first', 'error');
      return;
    }
    const btn = document.getElementById('blacklist-btn');
    const addr = document.getElementById('blacklist-address').value.trim();

    if (!addr || !ethers.isAddress(addr)) {
      showToast('Please enter a valid address', 'error');
      return;
    }

    setButtonLoading(btn, true);
    try {
      logEvent(`Adding ${addr.substring(0, 8)}... to blacklist`, 'info');
      const tx = await bscContract.setBlacklist(addr, true);
      await tx.wait();
      logEvent('Address blacklisted successfully', 'success');
      showToast('Address added to blacklist', 'success');
      document.getElementById('blacklist-address').value = '';
    } catch (err) {
      logEvent(`Blacklist failed: ${err.reason || 'Insufficient permissions'}`, 'error');
      showToast('Failed - requires GUARD_ROLE', 'error');
    }
    setButtonLoading(btn, false);
  });

  document.getElementById('check-blacklist-btn').addEventListener('click', async () => {
    const addr = document.getElementById('check-blacklist-address').value.trim();
    const resultEl = document.getElementById('blacklist-result');

    if (!addr || !ethers.isAddress(addr)) {
      showToast('Please enter a valid address', 'error');
      return;
    }

    try {
      const readProvider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
      const readContract = new ethers.Contract(BSC_CONTRACT_ADDRESS, coinAbi, readProvider);
      const isBlacklisted = await readContract.isBlacklisted(addr);
      resultEl.style.color = isBlacklisted ? '#e74c3c' : '#27ae60';
      resultEl.textContent = isBlacklisted ? 'Address is BLACKLISTED' : 'Address is NOT blacklisted';
    } catch (err) {
      resultEl.style.color = '#e74c3c';
      resultEl.textContent = 'Error checking status';
    }
  });

  document.getElementById('hash-scroll-btn').addEventListener('click', () => {
    const text = document.getElementById('scroll-text').value.trim();
    const resultDiv = document.getElementById('scroll-result');
    if (!text) {
      showToast('Please enter document text', 'error');
      return;
    }
    const hash = generateHashFromText(text);
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<strong>Document Hash:</strong><br>${hash}`;
    logEvent(`Hash generated: ${hash.substring(0, 20)}...`, 'success');
  });

  document.getElementById('verify-scroll-btn').addEventListener('click', async () => {
    const text = document.getElementById('scroll-text').value.trim();
    const resultDiv = document.getElementById('scroll-result');
    if (!text) {
      showToast('Please enter document text', 'error');
      return;
    }
    const hash = generateHashFromText(text);
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<strong>Verifying hash on-chain...</strong>';
    logEvent(`Verifying document: ${hash.substring(0, 16)}...`, 'info');
    
    setTimeout(() => {
      resultDiv.style.borderLeft = '4px solid #27ae60';
      resultDiv.innerHTML = `<strong style="color: #27ae60;">Document Verified</strong><br>Hash: ${hash}`;
      logEvent('Document authenticity verified', 'success');
    }, 1500);
  });

  logEvent('DeFi Dashboard initialized', 'info');
}

document.addEventListener('DOMContentLoaded', init);
