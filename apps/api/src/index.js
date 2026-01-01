const express = require("express");
const { FreightEngine, VALID_MODES } = require("../../../packages/freight-logic");
const { codexLog } = require("../../../packages/codex/codexClient");
const {
  getOpsStatus,
  activateMode,
  deactivateMode,
  activateRegion,
  setRegionReady
} = require("../../../packages/ops-config/index.cjs");
const { TreasuryEngine, DYNASTY_FEE_PERCENT, BSC_CONTRACT } = require("../../../packages/treasury/index.cjs");
const { DevineCredit, CREDIT_TIERS } = require("../../../packages/devine-credit/index.cjs");
const { generateLaunchPlan, getLaunchChecklist, LAUNCH_STAGES } = require("../../../packages/ops-config/launchConfig.cjs");
const { AIDispatchEngine } = require("../../../packages/ai-dispatch/index.cjs");
const { Loadboard } = require("../../../packages/loadboard/index.cjs");

const app = express();
app.use(express.json());

const freightEngine = new FreightEngine();
const treasuryEngine = new TreasuryEngine();
const devineCredit = new DevineCredit();
const aiDispatch = new AIDispatchEngine();
const loadboard = new Loadboard();
const loads = [];
const drivers = new Map();
const contracts = [];

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Borders Dynasty Global Logistics API",
    modes: VALID_MODES,
    bscContract: BSC_CONTRACT,
    dynastyFee: `${DYNASTY_FEE_PERCENT}%`
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

app.post("/ops/set-region-ready", async (req, res) => {
  const { region } = req.body;
  if (!region) return res.status(400).json({ error: "region required" });

  const ok = setRegionReady(region);
  if (!ok) return res.status(400).json({ error: "invalid region" });

  await codexLog("REGION_READY", "GLOBAL_OPS", { region }, "omega");

  res.json({ success: true, region });
});

app.get("/ops/launch-plan/:stage", (req, res) => {
  const { stage } = req.params;
  try {
    const plan = generateLaunchPlan(stage.toUpperCase());
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/ops/launch-checklist/:stage", (req, res) => {
  const { stage } = req.params;
  try {
    const checklist = getLaunchChecklist(stage.toUpperCase());
    res.json(checklist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/ops/staged-launch", async (req, res) => {
  const { stage } = req.body;
  if (!stage) return res.status(400).json({ error: "stage required (LOCAL, NATIONWIDE, GLOBAL)" });

  const config = LAUNCH_STAGES[stage.toUpperCase()];
  if (!config) return res.status(400).json({ error: "invalid stage" });

  for (const mode of config.modes) {
    activateMode(mode);
  }

  for (const region of config.regions) {
    activateRegion(region);
  }

  await codexLog("STAGED_LAUNCH_EXECUTED", "GLOBAL_OPS", {
    stage: stage.toUpperCase(),
    modes: config.modes,
    regions: config.regions
  }, "omega");

  res.json({
    message: `${config.name} executed`,
    stage: stage.toUpperCase(),
    activatedModes: config.modes,
    activatedRegions: config.regions,
    opsStatus: getOpsStatus()
  });
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

app.get("/drivers", (req, res) => {
  const allDrivers = Array.from(drivers.values());
  res.json(allDrivers);
});

app.post("/drivers", async (req, res) => {
  const { driverId, name, homeBase, equipment } = req.body;
  if (!driverId || !name) {
    return res.status(400).json({ error: "driverId and name required" });
  }

  const driver = {
    driverId,
    name,
    homeBase: homeBase || "Unknown",
    equipment: equipment || "Standard",
    loadsCompleted: 0,
    createdAt: new Date().toISOString()
  };

  drivers.set(driverId, driver);

  const creditLine = devineCredit.openCreditLine(driverId, CREDIT_TIERS.STANDARD.limit);

  await codexLog("DRIVER_REGISTERED", "FLEET", {
    driverId,
    name,
    creditLimit: creditLine.limit
  }, "operator");

  res.status(201).json({ driver, creditLine });
});

app.get("/drivers/:id", (req, res) => {
  const driver = drivers.get(req.params.id);
  if (!driver) return res.status(404).json({ error: "Driver not found" });
  
  const creditLine = devineCredit.getCreditLine(req.params.id);
  res.json({ driver, creditLine });
});

app.get("/drivers/:id/credit", (req, res) => {
  const creditLine = devineCredit.getCreditLine(req.params.id);
  if (!creditLine) return res.status(404).json({ error: "No credit line found" });
  res.json(creditLine);
});

app.post("/drivers/:id/advance", async (req, res) => {
  const { amount, loadId } = req.body;
  const driverId = req.params.id;

  if (!amount || !loadId) {
    return res.status(400).json({ error: "amount and loadId required" });
  }

  try {
    const advance = devineCredit.issueAdvance(driverId, amount, loadId);

    await codexLog("CREDIT_ADVANCE_ISSUED", "CREDIT", {
      driverId,
      loadId,
      amount,
      advanceId: advance.id
    }, "credit-system");

    res.status(201).json(advance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/loads", async (req, res) => {
  const { shipperId, origin, destination, mode, budgetAmount, region, driverId } = req.body;

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

  if (driverId) {
    load.driverId = driverId;
  }

  const deposit = treasuryEngine.depositToEscrow(load.id, budgetAmount, shipperId);
  load.escrowDeposit = deposit;

  loads.push(load);

  await codexLog("LOAD_CREATED", "LOGISTICS", {
    loadId: load.id,
    shipperId,
    origin,
    destination,
    mode,
    budgetAmount,
    region,
    escrowId: deposit.id
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

app.post("/loads/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  const index = loads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Load not found" });

  if (!drivers.has(driverId)) {
    return res.status(400).json({ error: "Driver not found" });
  }

  loads[index].driverId = driverId;
  loads[index].status = "ASSIGNED";
  loads[index].updatedAt = new Date().toISOString();

  await codexLog("LOAD_ASSIGNED", "DISPATCH", {
    loadId: id,
    driverId
  }, "dispatch");

  res.json(loads[index]);
});

app.post("/loads/:id/in-transit", async (req, res) => {
  const { id } = req.params;
  const index = loads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Load not found" });

  const updated = freightEngine.markInTransit(loads[index]);
  loads[index] = { ...loads[index], ...updated };

  await codexLog("LOAD_IN_TRANSIT", "LOGISTICS", {
    loadId: updated.id,
    mode: updated.mode,
    region: updated.region
  }, "operator");

  res.json(loads[index]);
});

app.post("/loads/:id/delivered", async (req, res) => {
  const { id } = req.params;
  const index = loads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Load not found" });

  const load = loads[index];
  const updated = freightEngine.markDelivered(load);
  
  const driverId = load.driverId;
  const amount = load.budgetAmount;

  let payoutResult = null;
  let creditRepayment = null;

  if (driverId && amount) {
    payoutResult = treasuryEngine.releasePayouts(id, driverId, amount);
    
    const creditLine = devineCredit.getCreditLine(driverId);
    if (creditLine && creditLine.balance > 0) {
      creditRepayment = devineCredit.repayFromPayout(driverId, payoutResult.split.driverShare, id);
      payoutResult.driverPayout.netAmount = creditRepayment.netPayout;
      payoutResult.creditRepaid = creditRepayment.repaid;
    }

    const driver = drivers.get(driverId);
    if (driver) {
      driver.loadsCompleted++;
    }
  }

  loads[index] = { ...load, ...updated, payoutResult };

  await codexLog("LOAD_DELIVERED", "LOGISTICS", {
    loadId: id,
    mode: updated.mode,
    region: updated.region
  }, "operator");

  if (payoutResult) {
    await codexLog("PAYOUT_ISSUED", "TREASURY", {
      loadId: id,
      driverId,
      driverAmount: payoutResult.split.driverShare,
      dynastyAmount: payoutResult.split.dynastyShare,
      creditRepaid: creditRepayment?.repaid || 0
    }, "treasury");
  }

  res.json(loads[index]);
});

app.get("/treasury/balance", (req, res) => {
  res.json({
    escrowBalance: treasuryEngine.getEscrowBalance(),
    totalPayouts: treasuryEngine.getAllPayouts().length
  });
});

app.get("/treasury/payouts", (req, res) => {
  res.json(treasuryEngine.getAllPayouts());
});

app.get("/credit/lines", (req, res) => {
  res.json(devineCredit.getAllCreditLines());
});

app.get("/credit/transactions", (req, res) => {
  res.json(devineCredit.getTransactions());
});

app.get("/loadboard/shipper/:shipperId", (req, res) => {
  const view = loadboard.getShipperView(loads, req.params.shipperId);
  res.json(view);
});

app.get("/loadboard/driver/:driverId", (req, res) => {
  const creditLine = devineCredit.getCreditLine(req.params.driverId);
  const view = loadboard.getDriverView(loads, req.params.driverId, creditLine);
  res.json(view);
});

app.get("/loadboard/ops", (req, res) => {
  const view = loadboard.getOpsView(loads, getOpsStatus());
  res.json(view);
});

app.get("/loadboard/omega", async (req, res) => {
  const creditLines = devineCredit.getAllCreditLines();
  const treasury = {
    escrowBalance: treasuryEngine.getEscrowBalance(),
    payoutCount: treasuryEngine.getAllPayouts().length
  };
  
  const view = loadboard.getOmegaView(loads, getOpsStatus(), treasury, creditLines, 0);
  res.json(view);
});

app.get("/dispatch/suggest/:loadId", (req, res) => {
  const load = loads.find(l => l.id === req.params.loadId);
  if (!load) return res.status(404).json({ error: "Load not found" });

  const allDrivers = Array.from(drivers.values());
  const creditLines = devineCredit.getAllCreditLines();
  
  const suggestions = aiDispatch.suggestDrivers(allDrivers, load, creditLines);
  res.json(suggestions);
});

app.get("/dispatch/evaluate/:loadId", (req, res) => {
  const load = loads.find(l => l.id === req.params.loadId);
  if (!load) return res.status(404).json({ error: "Load not found" });

  const analysis = aiDispatch.evaluateLoad(load);
  res.json(analysis);
});

app.post("/dispatch/assign", async (req, res) => {
  const { loadId, driverId, method, overrideReason } = req.body;

  if (!loadId || !driverId) {
    return res.status(400).json({ error: "loadId and driverId required" });
  }

  const loadIndex = loads.findIndex(l => l.id === loadId);
  if (loadIndex === -1) return res.status(404).json({ error: "Load not found" });

  if (!drivers.has(driverId)) {
    return res.status(400).json({ error: "Driver not found" });
  }

  loads[loadIndex].driverId = driverId;
  loads[loadIndex].status = "ASSIGNED";
  loads[loadIndex].updatedAt = new Date().toISOString();

  const dispatchRecord = aiDispatch.recordDispatch(
    loadId, 
    driverId, 
    method || "MANUAL",
    overrideReason
  );

  await codexLog("LOAD_DISPATCHED", "DISPATCH", {
    loadId,
    driverId,
    method: dispatchRecord.method,
    overrideReason: dispatchRecord.overrideReason
  }, "dispatch");

  res.json({
    load: loads[loadIndex],
    dispatchRecord
  });
});

app.get("/dispatch/history", (req, res) => {
  res.json(aiDispatch.getDispatchHistory());
});

app.post("/contract/accept", async (req, res) => {
  const { loadId, driverId, terms } = req.body;

  if (!loadId || !driverId) {
    return res.status(400).json({ error: "loadId and driverId required" });
  }

  const load = loads.find(l => l.id === loadId);
  if (!load) return res.status(404).json({ error: "Load not found" });

  const contract = {
    id: `CONTRACT-${Date.now()}`,
    loadId,
    driverId,
    shipperId: load.shipperId,
    amount: load.budgetAmount,
    dynastyFee: load.budgetAmount * 0.05,
    driverPayout: load.budgetAmount * 0.95,
    terms: terms || {
      paymentTerms: "ON_DELIVERY",
      creditAdvanceAllowed: true,
      maxAdvance: 200
    },
    status: "ACTIVE",
    acceptedAt: new Date().toISOString()
  };

  contracts.push(contract);

  const loadIndex = loads.findIndex(l => l.id === loadId);
  if (loadIndex !== -1) {
    loads[loadIndex].contractId = contract.id;
  }

  await codexLog("CONTRACT_ACCEPTED", "CONTRACTS", {
    contractId: contract.id,
    loadId,
    driverId,
    amount: contract.amount
  }, "contract-system");

  res.status(201).json(contract);
});

app.get("/contracts", (req, res) => {
  res.json(contracts);
});

app.get("/contracts/:id", (req, res) => {
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) return res.status(404).json({ error: "Contract not found" });
  res.json(contract);
});

app.get("/contracts/load/:loadId", (req, res) => {
  const contract = contracts.find(c => c.loadId === req.params.loadId);
  if (!contract) return res.status(404).json({ error: "No contract for this load" });
  res.json(contract);
});

const port = process.env.API_PORT || 3000;
app.listen(port, () => {
  console.log(`Borders Dynasty Global Logistics API running on port ${port}`);
});
