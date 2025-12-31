require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// 🔗 Load ABI from file
const abiPath = path.join(__dirname, "abi", "bsc-abi.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

// 🔐 Connect to Ethereum
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🚚 Mint token when a new load is created
app.post("/loads", async (req, res) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ error: "Missing origin or destination" });
  }

  try {
    const tx = await contract.mint(wallet.address, ethers.parseUnits("1", 18));
    await tx.wait();

    res.status(201).json({
      id: Date.now(),
      status: "CREATED",
      mintedTo: wallet.address,
      txHash: tx.hash,
    });
  } catch (err) {
    console.error("Minting failed:", err);
    res.status(500).json({ error: "Minting failed", details: err.message });
  }
});
require("dotenv").config({ path: "/etc/secrets/.env" });

// 🔥 Optional: Burn endpoint
app.post("/burn", async (req, res) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ error: "Missing amount" });

  try {
    const tx = await contract.burn(ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    res.json({ status: "BURNED", txHash: tx.hash });
  } catch (err) {
    console.error("Burn failed:", err);
    res.status(500).json({ error: "Burn failed", details: err.message });
  }
});

// 🧾 Optional: Get token metadata
app.get("/codex-uri", async (req, res) => {
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const decimals = await contract.decimals();

    res.json({
      name,
      symbol,
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      decimals,
    });
  } catch (err) {
    console.error("Codex fetch failed:", err);
    res.status(500).json({ error: "Codex fetch failed", details: err.message });
  }
});

module.exports = app;
