const express = require("express");
const cors = require("cors");
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

const {
  createSecurityMiddleware,
  validateInput,
  blockIP,
  unblockIP,
  getBlockedIPs,
  logSecurityEvent,
  getSecurityEvents,
  strictRateLimiter,
  corsConfig
} = require("../../../packages/security/index.cjs");

const {
  gatherAllContracts,
  gatherFromPartner,
  getGatheredContracts,
  getDynastyQualified,
  convertToDynastyLoad,
  getPartnerStatus,
  getDispatchStats,
  PARTNER_BOARDS
} = require("../../../packages/devine-dispatch/index.cjs");

const tokenIntegration = require("../../../packages/treasury/token-integration.cjs");

const {
  authenticateOmega,
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
  getAccessLogs,
  refreshSession,
  revokeSession,
  authMiddleware,
  ROLES
} = require("../../../packages/auth/index.cjs");

const {
  createAuditEntry,
  queryAuditLog,
  generateComplianceReport,
  verifyChainIntegrity,
  getAuditStats
} = require("../../../packages/audit/index.cjs");

const {
  startOrchestrator,
  getOrchestratorStatus,
  getLatestIntel,
  getMarketIntel,
  getOperationalIntel,
  getPartnerIntel,
  getActiveAlerts,
  getDispatchAdjustments,
  getTreasuryInsights
} = require("../../../packages/live-intel/index.cjs");

startOrchestrator(60000);

const app = express();

app.use(cors(corsConfig));
app.use(express.json({ limit: '1mb' }));

const securityMiddleware = createSecurityMiddleware();
securityMiddleware.forEach(mw => app.use(mw));

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

app.get("/security/status", strictRateLimiter, (req, res) => {
  res.json({
    blockedIPs: getBlockedIPs(),
    recentEvents: getSecurityEvents(50),
    protection: {
      rateLimit: "60 req/min",
      anomalyThreshold: "100 req/min",
      blockDuration: "15 min"
    }
  });
});

app.get("/security/events", strictRateLimiter, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(getSecurityEvents(limit));
});

app.post("/security/block-ip", strictRateLimiter, async (req, res) => {
  const { ip, reason, duration } = req.body;
  if (!ip) return res.status(400).json({ error: "ip required" });
  
  blockIP(ip, reason || "MANUAL_BLOCK", duration);
  await codexLog("IP_BLOCKED_MANUAL", "SECURITY", { ip, reason }, "omega");
  
  res.json({ success: true, ip, blocked: true });
});

app.post("/security/unblock-ip", strictRateLimiter, async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "ip required" });
  
  unblockIP(ip);
  await codexLog("IP_UNBLOCKED_MANUAL", "SECURITY", { ip }, "omega");
  
  res.json({ success: true, ip, unblocked: true });
});

app.get("/devine-dispatch/partners", (req, res) => {
  res.json({
    partners: PARTNER_BOARDS,
    status: getPartnerStatus()
  });
});

app.post("/devine-dispatch/gather", async (req, res) => {
  const { partnerId } = req.body;
  
  try {
    let result;
    if (partnerId) {
      result = await gatherFromPartner(partnerId);
    } else {
      result = await gatherAllContracts();
    }
    
    await codexLog("CONTRACTS_GATHERED", "DEVINE_DISPATCH", result, "ai-dispatch");
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/devine-dispatch/contracts", (req, res) => {
  const filters = {
    mode: req.query.mode,
    redirected: req.query.redirected === 'true' ? true : (req.query.redirected === 'false' ? false : undefined),
    minScore: req.query.minScore ? parseInt(req.query.minScore) : undefined,
    source: req.query.source
  };
  
  res.json(getGatheredContracts(filters));
});

app.get("/devine-dispatch/qualified", (req, res) => {
  res.json(getDynastyQualified());
});

app.post("/devine-dispatch/convert/:contractId", async (req, res) => {
  const { contractId } = req.params;
  
  try {
    const dynastyLoad = convertToDynastyLoad(contractId);
    
    const load = freightEngine.createLoad(dynastyLoad);
    loads.push(load);
    
    await codexLog("EXTERNAL_CONTRACT_CONVERTED", "DEVINE_DISPATCH", {
      externalContractId: contractId,
      dynastyLoadId: load.id,
      source: dynastyLoad.source,
      dynastyScore: dynastyLoad.dynastyScore
    }, "ai-dispatch");
    
    res.json({ convertedLoad: load, originalContract: contractId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/devine-dispatch/stats", (req, res) => {
  res.json(getDispatchStats());
});

app.post("/token/escrow/deposit", validateInput('escrowDeposit'), async (req, res) => {
  const { loadId, amount, depositorAddress } = req.body;
  
  try {
    const deposit = await tokenIntegration.depositEscrow(loadId, amount, depositorAddress);
    
    await codexLog("ESCROW_DEPOSITED", "TOKEN_TREASURY", {
      loadId,
      amount,
      txHash: deposit.txHash
    }, "treasury");
    
    res.json(deposit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/token/escrow/:loadId", (req, res) => {
  const balance = tokenIntegration.getEscrowBalance(req.params.loadId);
  res.json(balance);
});

app.post("/token/payout/:loadId", async (req, res) => {
  const { loadId } = req.params;
  const { driverWallet } = req.body;
  
  const load = loads.find(l => l.id === loadId);
  if (!load) return res.status(404).json({ error: "Load not found" });
  
  const contract = contracts.find(c => c.loadId === loadId);
  if (!contract) return res.status(404).json({ error: "No contract for this load" });
  
  if (!driverWallet) return res.status(400).json({ error: "driverWallet required" });
  
  try {
    const result = await tokenIntegration.processDeliveryPayout(loadId, contract.amount, driverWallet);
    
    await codexLog("PAYOUT_PROCESSED", "TOKEN_TREASURY", {
      loadId,
      driverPayout: contract.driverPayout,
      dynastyFee: contract.dynastyFee,
      driverTxHash: result.driverTransaction.txHash,
      dynastyTxHash: result.dynastyTransaction.txHash
    }, "treasury");
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/token/credit/advance", async (req, res) => {
  const { driverId, amount, driverWallet } = req.body;
  
  if (!driverId || !amount || !driverWallet) {
    return res.status(400).json({ error: "driverId, amount, and driverWallet required" });
  }
  
  try {
    const creditResult = devineCredit.issueAdvance(driverId, amount);
    
    const tokenTx = await tokenIntegration.issueCreditAdvance(driverId, amount, driverWallet);
    
    await codexLog("CREDIT_ADVANCE_ISSUED", "TOKEN_TREASURY", {
      driverId,
      amount,
      txHash: tokenTx.txHash
    }, "credit-system");
    
    res.json({
      credit: creditResult,
      tokenTransaction: tokenTx
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/token/credit/repay", async (req, res) => {
  const { driverId, amount, driverWallet } = req.body;
  
  if (!driverId || !amount || !driverWallet) {
    return res.status(400).json({ error: "driverId, amount, and driverWallet required" });
  }
  
  try {
    const creditResult = devineCredit.processRepayment(driverId, amount);
    
    const tokenTx = await tokenIntegration.processCreditRepayment(driverId, amount, driverWallet);
    
    await codexLog("CREDIT_REPAYMENT_PROCESSED", "TOKEN_TREASURY", {
      driverId,
      amount,
      txHash: tokenTx.txHash
    }, "credit-system");
    
    res.json({
      credit: creditResult,
      tokenTransaction: tokenTx
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/token/transactions", (req, res) => {
  const filters = {
    type: req.query.type,
    loadId: req.query.loadId,
    driverId: req.query.driverId,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  
  res.json(tokenIntegration.getTokenTransactions(filters));
});

app.get("/token/treasury/stats", (req, res) => {
  res.json(tokenIntegration.getTreasuryStats());
});

app.post("/auth/omega/login", async (req, res) => {
  const { accessCode } = req.body;
  
  if (!accessCode) {
    return res.status(400).json({ error: "accessCode required" });
  }
  
  const result = authenticateOmega(accessCode);
  
  if (result.error) {
    createAuditEntry('OMEGA_AUTH_FAILED', { reason: result.error }, 'anonymous', { ip: req.ip });
    return res.status(401).json({ error: result.error });
  }
  
  createAuditEntry('OMEGA_AUTH_SUCCESS', { sessionId: result.sessionId }, 'omega-leadership', { ip: req.ip });
  await codexLog("OMEGA_SESSION_CREATED", "AUTH", { sessionId: result.sessionId }, "omega");
  
  res.json(result);
});

app.post("/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken required" });
  }
  
  const result = refreshSession(refreshToken);
  
  if (!result) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
  
  res.json(result);
});

app.post("/auth/logout", authMiddleware(), (req, res) => {
  const { sessionId } = req.auth;
  
  revokeSession(sessionId);
  createAuditEntry('SESSION_LOGOUT', { sessionId }, req.auth.userId, { ip: req.ip });
  
  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/auth/me", authMiddleware(), (req, res) => {
  res.json({
    userId: req.auth.userId,
    role: req.auth.role,
    permissions: req.auth.permissions,
    authType: req.auth.authType
  });
});

app.post("/auth/api-keys", strictRateLimiter, authMiddleware('*'), async (req, res) => {
  const { partnerId, partnerName, permissions } = req.body;
  
  if (!partnerId || !partnerName) {
    return res.status(400).json({ error: "partnerId and partnerName required" });
  }
  
  const apiKey = generateApiKey(partnerId, partnerName, permissions);
  
  createAuditEntry('API_KEY_CREATED', { 
    keyId: apiKey.keyId, 
    partnerId, 
    permissions: apiKey.permissions 
  }, req.auth.userId, { ip: req.ip });
  
  await codexLog("API_KEY_ISSUED", "AUTH", { 
    keyId: apiKey.keyId, 
    partnerId 
  }, "omega");
  
  res.json(apiKey);
});

app.get("/auth/api-keys", authMiddleware('*'), (req, res) => {
  const partnerId = req.query.partnerId || null;
  res.json(listApiKeys(partnerId));
});

app.delete("/auth/api-keys/:keyId", authMiddleware('*'), async (req, res) => {
  const { keyId } = req.params;
  
  const revoked = revokeApiKey(keyId);
  
  if (!revoked) {
    return res.status(404).json({ error: "API key not found" });
  }
  
  createAuditEntry('API_KEY_REVOKED', { keyId }, req.auth.userId, { ip: req.ip });
  await codexLog("API_KEY_REVOKED", "AUTH", { keyId }, "omega");
  
  res.json({ success: true, keyId });
});

app.get("/auth/access-logs", authMiddleware('*'), (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const filters = {
    type: req.query.type,
    userId: req.query.userId
  };
  
  res.json(getAccessLogs(limit, filters));
});

app.get("/audit/stats", authMiddleware('*'), (req, res) => {
  res.json(getAuditStats());
});

app.get("/audit/entries", authMiddleware('*'), (req, res) => {
  const filters = {
    category: req.query.category,
    severity: req.query.severity,
    eventType: req.query.eventType,
    actor: req.query.actor,
    startTime: req.query.startTime,
    endTime: req.query.endTime
  };
  
  const options = {
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0
  };
  
  res.json(queryAuditLog(filters, options));
});

app.post("/audit/report", authMiddleware('*'), async (req, res) => {
  const { reportType, startDate, endDate } = req.body;
  
  const report = generateComplianceReport(reportType || 'STANDARD', {
    start: startDate,
    end: endDate
  });
  
  createAuditEntry('COMPLIANCE_REPORT_GENERATED', { 
    reportId: report.id, 
    reportType 
  }, req.auth.userId, { ip: req.ip });
  
  await codexLog("COMPLIANCE_REPORT", "AUDIT", { 
    reportId: report.id,
    period: report.period
  }, "omega");
  
  res.json(report);
});

app.get("/audit/verify", authMiddleware('*'), (req, res) => {
  const startIndex = parseInt(req.query.startIndex) || 0;
  const endIndex = req.query.endIndex ? parseInt(req.query.endIndex) : null;
  
  const result = verifyChainIntegrity(startIndex, endIndex);
  
  res.json(result);
});

app.get("/intel/status", (req, res) => {
  res.json(getOrchestratorStatus());
});

app.get("/intel/all", (req, res) => {
  res.json({
    intel: getLatestIntel(),
    status: getOrchestratorStatus(),
    timestamp: new Date().toISOString()
  });
});

app.get("/intel/market", (req, res) => {
  res.json({
    intel: getMarketIntel(),
    treasuryInsights: getTreasuryInsights(),
    timestamp: new Date().toISOString()
  });
});

app.get("/intel/operational", (req, res) => {
  res.json({
    intel: getOperationalIntel(),
    timestamp: new Date().toISOString()
  });
});

app.get("/intel/partners", (req, res) => {
  res.json({
    intel: getPartnerIntel(),
    timestamp: new Date().toISOString()
  });
});

app.get("/intel/alerts", async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const alerts = await getActiveAlerts(limit);
  res.json({
    alerts,
    count: alerts.length,
    timestamp: new Date().toISOString()
  });
});

app.get("/intel/dispatch/:region/:mode", (req, res) => {
  const { region, mode } = req.params;
  const adjustments = getDispatchAdjustments(region.toUpperCase(), mode.toUpperCase());
  res.json({
    region: region.toUpperCase(),
    mode: mode.toUpperCase(),
    adjustments,
    timestamp: new Date().toISOString()
  });
});

app.get("/intel/treasury", (req, res) => {
  res.json({
    insights: getTreasuryInsights(),
    marketIntel: getMarketIntel(),
    timestamp: new Date().toISOString()
  });
});

app.get("/governance/constitution", (req, res) => {
  res.json({
    owner: "Private Ecclesia Trust",
    version: "1.0.0",
    articles: [
      { id: 1, name: "Sovereignty of the Codex", principle: "Codex is the supreme ledger. Every action becomes a Codex event." },
      { id: 2, name: "Separation of Powers", principle: "Four branches: Operational, Treasury, Compliance, Governance (Omega)" },
      { id: 3, name: "Activation Authority", principle: "Only Omega may activate modes, regions, and nodes" },
      { id: 4, name: "Dispatch Integrity", principle: "Dispatch decisions must be explainable, auditable, reversible" },
      { id: 5, name: "Driver & Courier Rights", principle: "Transparent payouts, credit access, token rewards, safety protections" },
      { id: 6, name: "Treasury Transparency", principle: "All treasury flows must be deterministic and anchored in Codex" },
      { id: 7, name: "Continuous Improvement", principle: "The Dynasty OS evolves through Codex insights and AI learning" }
    ],
    ipOwnership: {
      sourceCode: "Private Ecclesia Trust",
      brand: "Private Ecclesia Trust",
      algorithms: "Private Ecclesia Trust",
      tokenLogic: "Private Ecclesia Trust",
      likeness: "Private Ecclesia Trust"
    }
  });
});

const port = process.env.API_PORT || 3000;
app.listen(port, () => {
  console.log(`Borders Dynasty Global Logistics API running on port ${port}`);
});
