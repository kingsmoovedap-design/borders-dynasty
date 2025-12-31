
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
