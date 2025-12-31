require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const app = express();
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const abi = require("./abi/bsc-abi.json");
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/loads", async (req, res) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) return res.status(400).json({ error: "Missing fields" });

  // Mint 1 BSC to the deployer for each load
  const tx = await contract.mint(wallet.address, ethers.parseUnits("1", 18));
  await tx.wait();

  res.status(201).json({ id: Date.now(), status: "CREATED" });
});

module.exports = app;
