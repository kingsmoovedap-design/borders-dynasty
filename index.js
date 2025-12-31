let contractAddress = "Not deployed";
try {
  const deployed = JSON.parse(fs.readFileSync("deployed.json"));
  contractAddress = deployed.address || "Unknown";
} catch (err) {
  console.warn("⚠️ Could not load deployed.json — using fallback");
}
require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");

const app = express();
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Load deployed contract address
let contractAddress = "Not deployed";
try {
  const deployed = JSON.parse(fs.readFileSync("deployed.json"));
  contractAddress = deployed.address || "Unknown";
} catch (err) {
  console.warn("⚠️ Could not load deployed.json");
}

app.get("/royal", async (req, res) => {
  try {
    const block = await provider.getBlockNumber();
    const king = process.env.KING || "Unknown Monarch";

    res.json({
      king: `👑 King ${king}`,
      codexChain: {
        currentBlock: block,
        contractAddress,
        webhookStatus: "🟢 Listening (mocked)",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in /royal:", err);
    res.status(500).json({ error: "Failed to fetch royal status" });
  }
});
