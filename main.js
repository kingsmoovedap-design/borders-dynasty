console.log('Borders Dynasty root portal loaded.');

const cfg = window.DYNASTY_CONFIG || {};
const coinInfoEl = document.getElementById('coinInfo');

if (cfg.sovereignCoinAddress && coinInfoEl) {
  const link = document.createElement('a');
  link.href = `https://bscscan.com/token/${cfg.sovereignCoinAddress}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'View Borders Sovereign Coin on BscScan';

  const br = document.createElement('br');
  coinInfoEl.appendChild(br);
  coinInfoEl.appendChild(link);
}
