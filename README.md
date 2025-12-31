# 🏰 Borders Dynasty — Borders Sovereign Coin (BSC)

Borders Dynasty is a decentralized logistics protocol powered by **Borders Sovereign Coin (BSC)** — a custom ERC-20 token deployed on the Ethereum Sepolia testnet. This project combines **smart contracts** with a **Node.js + Express API**, enabling minting and burning of tokens tied to real-world logistics events.

---

## ⚙️ Tech Stack

- **Solidity** (Smart Contracts)
- **Hardhat** (Development & Deployment)
- **Ethers.js** (Blockchain Interaction)
- **Express.js** (REST API)
- **Render** (Cloud Deployment)
- **Infura** (Ethereum RPC Provider)

---

## 🚀 Features

- 🔨 Mint BSC tokens when a new load is created
- 🔥 Burn BSC tokens on demand
- 📜 Fetch token metadata (name, symbol, supply)
- 
---

## 🧪 API Endpoints

| Method | Endpoint       | Description                     |
|--------|----------------|---------------------------------|
| GET    | `/health`      | Health check                    |
| POST   | `/loads`       | Mint 1 BSC token                |
| POST   | `/burn`        | Burn specified BSC amount       |
| GET    | `/codex-uri`   | Fetch token metadata            |

