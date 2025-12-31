# Borders Dynasty — CodexChain 👑

![Build](https://github.com/kingsmoovedap-design/borders-dynasty/actions/workflows/deploy-codexchain.yml/badge.svg)
![Release](https://img.shields.io/github/v/release/kingsmoovedap-design/borders-dynasty)
![License](https://img.shields.io/github/license/kingsmoovedap-design/borders-dynasty)
![Issues](https://img.shields.io/github/issues/kingsmoovedap-design/borders-dynasty)
![Node](https://img.shields.io/badge/node-18.x%20%7C%2020.x%20%7C%2022.x-brightgreen)
---

## 🧪 API Endpoints

| Method | Endpoint       | Description                     |
|--------|----------------|---------------------------------|
| GET    | `/health`      | Health check                    |
| POST   | `/loads`       | Mint 1 BSC token                |
| POST   | `/burn`        | Burn specified BSC amount       |
| GET    | `/codex-uri`   | Fetch token metadata            |

---

## 🔐 Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=0xYourDeployedContractAddress
