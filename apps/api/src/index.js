const express = require("express");
const { FreightEngine } = require("../../../packages/freight-logic");
const { codexLog } = require("../../../packages/codex/codexClient");

const app = express();
app.use(express.json());

const freightEngine = new FreightEngine();

const loads = [];

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Borders Dynasty Logistics API" });
});

app.post("/loads", async (req, res) => {
  const { shipperId, origin, destination, mode, budgetAmount } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: "origin and destination are required" });
  }

  const load = freightEngine.createLoad({
    shipperId: shipperId || "DEFAULT",
    origin,
    destination,
    mode: mode || "GROUND",
    budgetAmount: budgetAmount || 0
  });

  loads.push(load);

  await codexLog("LOAD_CREATED", "LOGISTICS", {
    loadId: load.id,
    shipperId: load.shipperId,
    origin,
    destination,
    mode: load.mode,
    budgetAmount: load.budgetAmount
  }, "shipper");

  res.status(201).json(load);
});

app.get("/loads", (req, res) => {
  res.json(loads);
});

app.get("/loads/:id", (req, res) => {
  const { id } = req.params;
  const load = loads.find(l => l.id === id || l.id === parseInt(id));
  
  if (!load) {
    return res.status(404).json({ error: "Load not found" });
  }
  
  res.json(load);
});

app.post("/loads/:id/delivered", async (req, res) => {
  const { id } = req.params;
  const loadIndex = loads.findIndex(l => l.id === id || l.id === parseInt(id));

  if (loadIndex === -1) {
    return res.status(404).json({ error: "Load not found" });
  }

  const delivered = freightEngine.markDelivered(loads[loadIndex]);
  loads[loadIndex] = delivered;

  await codexLog("LOAD_DELIVERED", "LOGISTICS", {
    loadId: delivered.id
  }, "operator");

  res.json(delivered);
});

const port = process.env.API_PORT || 3000;
app.listen(port, () => {
  console.log(`Logistics API running on port ${port}`);
});
