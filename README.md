# 👑 Borders Sovereign Coin (BSC)

Borders Sovereign Coin (BSC) is a tokenized logistics and sovereignty protocol built on Ethereum. It enables minting, burning, and tracking of digital assets representing sovereign cargo, territory, or identity.

---

## 🚀 Live Deployment

- **Frontend (GitHub Pages)**: [borders-dynasty dApp](https://kingsmoovedap-design.github.io/borders-dynasty/)
- **Smart Contract (Sepolia)**: `0xYourContractAddress` *(replace with actual address)*
- **Alchemy Webhooks**: Real-time tracking of mint/burn events
- **Backend Webhook Server**: Receives and logs contract events
- **GitHub Actions**: CI/CD for testing, publishing, and frontend deployment

---

## 🧱 Smart Contract

- **Name**: `BordersSovereignCoin`
- **Standard**: ERC-20
- **Functions**:
  - `mint(address to, uint256 amount)`
  - `burn(uint256 amount)`
  - `balanceOf(address account)`

### 📄 Contract Deployment

```bash
npx hardhat run scripts/deploy-and-verify.js --network sepolia
