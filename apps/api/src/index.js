const express = require("express");
const { FreightEngine, VALID_MODES } = require("../../../packages/freight-logic");
const { codexLog } = require("../../../packages/codex/codexClient");
const {
  getOpsStatus,
  activateMode,
  deactivateMode,
  activateRegion
} = require("../../../packages/ops-config/index.cjs");

const app = express();
app.use(express.json());

const freightEngine = new FreightEngine();
const loads = [];

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Borders Dynasty Global Logistics API",
    modes: VALID_MODES
  });
});

app.get("/ops/status", (req, res) => {
  res.json(getOpsStatus());
});

app.post("/ops/activate-mode", async (req, res) => {
  const { mode } = req.body;
  if (!mode) return res.status(400).json({ error: "mode required" });

  const ok = activateMode(mode);
  if (!ok) return res.status(400).json({ error: "invalid mode" });

  await codexLog("MODE_ACTIVATED", "GLOBAL_OPS", { mode }, "omega");

  res.json({ success: true, mode });
});

app.post("/ops/deactivate-mode", async (req, res) => {
  const { mode } = req.body;
  if (!mode) return res.status(400).json({ error: "mode required" });

  const ok = deactivateMode(mode);
  if (!ok) return res.status(400).json({ error: "invalid mode" });

  await codexLog("MODE_DEACTIVATED", "GLOBAL_OPS", { mode }, "omega");

  res.json({ success: true, mode });
});

app.post("/ops/activate-region", async (req, res) => {
  const { region } = req.body;
  if (!region) return res.status(400).json({ error: "region required" });

  const ok = activateRegion(region);
  if (!ok) {
    return res.status(400).json({ error: "invalid or not-ready region" });
  }

  await codexLog("REGION_ACTIVATED", "GLOBAL_OPS", { region }, "omega");

  res.json({ success: true, region });
});

app.post("/loads", async (req, res) => {
  const { shipperId, origin, destination, mode, budgetAmount, region } = req.body;

  if (!shipperId || !origin || !destination || !mode || !budgetAmount || !region) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const ops = getOpsStatus();
  const modeCfg = ops.modes[mode];
  const regionCfg = ops.regions[region];

  if (!modeCfg || !modeCfg.active) {
    return res.status(400).json({ error: `Mode ${mode} not active` });
  }

  if (!regionCfg || !regionCfg.active) {
    return res.status(400).json({ error: `Region ${region} not active` });
  }

  let load;
  try {
    load = freightEngine.createLoad({
      shipperId,
      origin,
      destination,
      mode,
      budgetAmount,
      region
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  loads.push(load);

  await codexLog("LOAD_CREATED", "LOGISTICS", {
    loadId: load.id,
    shipperId,
    origin,
    destination,
    mode,
    budgetAmount,
    region
  }, "shipper");

  res.status(201).json(load);
});

app.get("/loads", (req, res) => {
  res.json(loads);
});

app.get("/loads/:id", (req, res) => {
  const { id } = req.params;
  const load = loads.find(l => l.id === id);
  
  if (!load) {
    return res.status(404).json({ error: "Load not found" });
  }
  
  res.json(load);
});

app.post("/loads/:id/in-transit", async (req, res) => {
  const { id } = req.params;
  const index = loads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Load not found" });

  const updated = freightEngine.markInTransit(loads[index]);
  loads[index] = updated;

  await codexLog("LOAD_IN_TRANSIT", "LOGISTICS", {
    loadId: updated.id,
    mode: updated.mode,
    region: updated.region
  }, "operator");

  res.json(updated);
});

app.post("/loads/:id/delivered", async (req, res) => {
  const { id } = req.params;
  const index = loads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Load not found" });

  const updated = freightEngine.markDelivered(loads[index]);
  loads[index] = updated;

  await codexLog("LOAD_DELIVERED", "LOGISTICS", {
    loadId: updated.id,
    mode: updated.mode,
    region: updated.region
  }, "operator");

  res.json(updated);
});

app.post("/ops/global-launch", async (req, res) => {
  const targets = {
    modes: ["GROUND", "AIR", "OCEAN", "COURIER"],
    regions: ["NORTH_AMERICA", "EUROPE"]
  };

  for (const mode of targets.modes) {
    activateMode(mode);
    await codexLog("MODE_ACTIVATED", "GLOBAL_OPS", { mode, via: "GLOBAL_LAUNCH" }, "omega");
  }

  for (const region of targets.regions) {
    activateRegion(region);
    await codexLog("REGION_ACTIVATED", "GLOBAL_OPS", { region, via: "GLOBAL_LAUNCH" }, "omega");
  }

  res.json({
    message: "Global launch wave triggered",
    opsStatus: getOpsStatus()
  });
});

const port = process.env.API_PORT || 3000;
app.listen(port, () => {
  console.log(`Borders Dynasty Global Logistics API running on port ${port}`);
});
