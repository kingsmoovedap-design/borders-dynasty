# **BACKEND_SETUP.md**
### **Borders Dynasty – Backend Setup & Plug‑and‑Play Deployment Guide**

This document describes how to install, run, and deploy the **complete backend stack** for the Borders Dynasty system, including:

- Commerce API (events + apparel + BSC payments)  
- Logistics API  
- Codex Bridge API  
- Shared packages (web3-core, loyalty-engine, treasury-engine)  
- Environment configuration  
- Docker plug‑and‑play deployment  
- External‑drive portability  

This backend is designed to run **anywhere**, on any machine, with minimal setup.

---

# **1. Requirements**

Install these on a new computer:

- **Node.js (LTS)**  
- **Git**  
- **VS Code**  
- **MetaMask** (for Web3 testing)  
- **Docker Desktop** (optional but recommended)  

Clone the repo:

```bash
git clone https://github.com/kingsmoovedap-design/borders-dynasty.git
```

---

# **2. Monorepo Structure**

```
borders-dynasty/
  apps/
    api-commerce/        # Events + apparel + BSC payments
    api-logistics/       # Dispatch + delivery logic
    api-codex-bridge/    # Fetches scrolls from Codex Ecclesia Public
  packages/
    web3-core/           # Shared BSC client
    loyalty-engine/      # Shared loyalty logic
    treasury-engine/     # Shared treasury logging
```

---

# **3. Root package.json**

```json
{
  "name": "borders-dynasty",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:commerce": "node apps/api-commerce/src/server.js",
    "dev:logistics": "node apps/api-logistics/src/server.js",
    "dev:codex": "node apps/api-codex-bridge/src/server.js"
  },
  "dependencies": {
    "express": "^4.19.0",
    "body-parser": "^1.20.2",
    "axios": "^1.7.0",
    "ethers": "^6.11.0",
    "pg": "^8.11.0",
    "cors": "^2.8.5"
  }
}
```

Install dependencies:

```bash
npm install
```

---

# **4. Shared Packages**

### **packages/web3-core/index.js**

```js
const { ethers } = require("ethers");

function createWeb3Client({ rpcUrl, contractAddress, abi }) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, abi, provider);
  return { provider, contract };
}

module.exports = { createWeb3Client };
```

---

### **packages/loyalty-engine/index.js**

```js
async function awardLoyalty({ userId, amount, reason, context }) {
  console.log("LOYALTY_AWARD", { userId, amount, reason, context });
}

async function getUserTier({ userId }) {
  return { tier: "DYNASTY_BRONZE", points: 0 };
}

module.exports = { awardLoyalty, getUserTier };
```

---

### **packages/treasury-engine/index.js**

```js
async function recordTreasuryInflow({ source, amount, txHash, meta }) {
  console.log("TREASURY_INFLOW", { source, amount, txHash, meta });
}

module.exports = { recordTreasuryInflow };
```

---

# **5. Commerce API**

`apps/api-commerce/src/server.js`

```js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createWeb3Client } = require("../../../packages/web3-core");
const { awardLoyalty } = require("../../../packages/loyalty-engine");
const { recordTreasuryInflow } = require("../../../packages/treasury-engine");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const BSC_CONFIG = {
  rpcUrl: process.env.BSC_RPC_URL,
  contractAddress: process.env.BSC_TOKEN_ADDRESS,
  abi: require("./abi/BordersSovereignCoin.json")
};

const { provider } = createWeb3Client(BSC_CONFIG);

app.get("/events", (_req, res) => {
  res.json([{ id: "evt_1", name: "Dynasty Launch Gala", priceBSC: "100" }]);
});

app.get("/apparel", (_req, res) => {
  res.json([{ id: "app_1", name: "Dynasty Hoodie", priceBSC: "50" }]);
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { txHash, userId, context, amountBSC } = req.body;
    const tx = await provider.getTransaction(txHash);
    if (!tx) return res.status(400).json({ ok: false, error: "TX_NOT_FOUND" });

    await recordTreasuryInflow({
      source: context?.type || "UNKNOWN",
      amount: amountBSC,
      txHash,
      meta: context
    });

    await awardLoyalty({
      userId,
      amount: 10,
      reason: "BSC_PURCHASE",
      context
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
});

const PORT = process.env.COMMERCE_PORT || 4100;
app.listen(PORT, () => console.log(`Commerce API on ${PORT}`));
```

---

# **6. Logistics API**

`apps/api-logistics/src/server.js`

```js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/dispatch", (req, res) => {
  const { orderId, type } = req.body;
  console.log("DISPATCH_REQUEST", { orderId, type });
  res.json({ ok: true, status: "QUEUED" });
});

const PORT = process.env.LOGISTICS_PORT || 4200;
app.listen(PORT, () => console.log(`Logistics API on ${PORT}`));
```

---

# **7. Codex Bridge API**

`apps/api-codex-bridge/src/server.js`

```js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const CODEX_BASE =
  process.env.CODEX_BASE ||
  "https://kingsmoovedap-design.github.io/codex-ecclesia-public";

app.get("/anchors/:scroll", async (req, res) => {
  try {
    const { scroll } = req.params;
    const url = `${CODEX_BASE}/scrolls/${scroll}.html`;
    const html = await axios.get(url).then(r => r.data);
    res.send(html);
  } catch (e) {
    console.error(e);
    res.status(500).send("ERROR_LOADING_SCROLL");
  }
});

const PORT = process.env.CODEX_PORT || 4300;
app.listen(PORT, () => console.log(`Codex Bridge API on ${PORT}`));
```

---

# **8. Environment Variables**

Create `.env` in repo root:

```
BSC_RPC_URL=https://your-bsc-rpc
BSC_TOKEN_ADDRESS=0xYourToken
COMMERCE_PORT=4100
LOGISTICS_PORT=4200
CODEX_PORT=4300
CODEX_BASE=https://kingsmoovedap-design.github.io/codex-ecclesia-public
```

---

# **9. Docker Plug‑and‑Play**

`docker-compose.yml`:

```yaml
version: "3.9"
services:
  api-commerce:
    build: ./apps/api-commerce
    environment:
      - BSC_RPC_URL=${BSC_RPC_URL}
      - BSC_TOKEN_ADDRESS=${BSC_TOKEN_ADDRESS}
      - COMMERCE_PORT=4100
    ports:
      - "4100:4100"

  api-logistics:
    build: ./apps/api-logistics
    environment:
      - LOGISTICS_PORT=4200
    ports:
      - "4200:4200"

  api-codex-bridge:
    build: ./apps/api-codex-bridge
    environment:
      - CODEX_BASE=${CODEX_BASE}
      - CODEX_PORT=4300
    ports:
      - "4300:4300"
```

---

# **10. Plug‑and‑Play External Drive Deployment**

1. Copy the entire `borders-dynasty/` folder to your external drive.  
2. On any new machine:

```bash
cd borders-dynasty
npm install
npm run dev:commerce
npm run dev:logistics
npm run dev:codex
```

Or run all via Docker:

```bash
docker compose up --build
```

Your backend is now fully portable, self‑contained, and deployable anywhere.
