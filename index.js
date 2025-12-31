require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");
const axios = require("axios");

const app = express();
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load deployed contract address
let contractAddress = "Not deployed";
try {
  const deployed = JSON.parse(fs.readFileSync("deployed.json"));
  contractAddress = deployed.address || "Unknown";
} catch (err) {
  console.warn("⚠️ Could not load deployed.json — using fallback");
}

// Load ABI
let abi = [];
try {
  abi = JSON.parse(fs.readFileSync("artifacts/contracts/Borders.sol/Borders.json")).abi;
} catch (err) {
  console.warn("⚠️ Could not load ABI — contract interaction may fail");
}

const contract = new ethers.Contract(contractAddress, abi, wallet);

// 🩺 Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// 👑 Royal status
async function getWebhookStatus() {
  try {
    const response = await axios.get("https://dashboard.alchemy.com/api/team-webhooks", {
      headers: {
        "X-Alchemy-Token": process.env.ALCHEMY_AUTH_TOKEN,
      },
    });
    const webhooks = response.data?.data || [];
    const webhook = webhooks.find(w => w.id === process.env.WEBHOOK_ID);
    return webhook?.is_active ? "🟢 Active" : "🔴 Inactive";
  } catch (err) {
    console.error("Error fetching webhook status:", err.message);
    return "⚠️ Unknown (error)";
  }
}

app.get("/royal", async (req, res) => {
  try {
    const block = await provider.getBlockNumber();
    const king = process.env.KING || "Unknown Monarch";
    const webhookStatus = await getWebhookStatus();

    res.json({
      king: `👑 King ${king}`,
      codexChain: {
        currentBlock: block,
        contractAddress,
        webhookStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in /royal:", err);
    res.status(500).json({ error: "Failed to fetch royal status" });
  }
});

// 🧪 Simulate webhook
app.post("/simulate", (req, res) => {
  console.log("🧪 Simulated webhook payload:", req.body);
  res.send("Simulated event received");
});

// 🪙 Mint tokens
app.post("/mint", async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount) {
    return res.status(400).json({ error: "Missing 'to' or 'amount'" });
  }

  try {
    const tx = await contract.mint(to, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    res.json({ message: `Minted ${amount} BSC to ${to}`, txHash: tx.hash });
  } catch (err) {
    console.error("Mint error:", err);
    res.status(500).json({ error: "Mint failed", details: err.message });
  }
});

// 🛡️ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`👑 Borders Dynasty listening on port ${PORT}`);
});
