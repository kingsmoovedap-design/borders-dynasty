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

const loyalty = require("../../../packages/loyalty/index.cjs");
const compliance = require("../../../packages/compliance/index.cjs");
const riskRadar = require("../../../packages/risk-radar/index.cjs");
const rewards = require("../../../packages/rewards/index.cjs");
const { GovernanceClient, GOVERNANCE_CORPUS, TREASURY_CONSTITUTION, DRIVER_CHARTER, CODEX_EVENT_TAXONOMY } = require("../../../packages/ecclesia-client/governance.cjs");
const { SingleOperatorPortal, OPERATOR_MODES, AI_ACTIONS } = require("../../../packages/single-operator/index.cjs");
const securityLayer = require("../../../packages/security-layer/index.cjs");
const logisticsModes = require("../../../packages/logistics-modes/index.cjs");
const tokenTrading = require("../../../packages/token-trading/index.cjs");
const contractCapture = require("../../../packages/ai-contract-capture/index.cjs");
const knowledgeCorpus = require("../../../packages/knowledge-corpus/index.cjs");
const aiDispatchBrain = require("../../../packages/ai-dispatch-brain/index.cjs");
const enhancedLoadboard = require("../../../packages/enhanced-loadboard/index.cjs");
const crossChain = require("../../../packages/cross-chain-evolution/index.cjs");
const reverseLogistics = require("../../../packages/reverse-logistics/index.cjs");
const courierHub = require("../../../packages/courier-hub/index.cjs");
const universalCapture = require("../../../packages/universal-capture/index.cjs");
const multimodalDist = require("../../../packages/multimodal-distribution/index.cjs");
const mobileOperator = require("../../../packages/mobile-operator/index.cjs");
const bscBridge = require("../../../packages/bsc-bridge/index.cjs");
const ecclesiaIntegration = require("../../../packages/ecclesia-integration/index.cjs");

const governanceClient = new GovernanceClient();
const operatorPortal = new SingleOperatorPortal();

startOrchestrator(60000);

const app = express();

app.set('trust proxy', 1);

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

app.get("/loyalty/tiers", (req, res) => {
  res.json({
    tiers: loyalty.LOYALTY_TIERS,
    actions: loyalty.POINT_ACTIONS
  });
});

app.get("/loyalty/driver/:driverId", (req, res) => {
  const driverId = req.params.driverId;
  let driverLoyalty = loyalty.getDriverLoyalty(driverId);
  
  if (!driverLoyalty) {
    driverLoyalty = loyalty.initializeDriver(driverId);
  }
  
  res.json({
    loyalty: driverLoyalty,
    benefits: loyalty.getTierBenefits(driverLoyalty.tier),
    dispatchBonus: loyalty.calculateDispatchBonus(driverId)
  });
});

app.post("/loyalty/award", async (req, res) => {
  const { driverId, action, multiplier, metadata } = req.body;
  
  if (!driverId || !action) {
    return res.status(400).json({ error: "driverId and action required" });
  }
  
  try {
    const result = loyalty.awardPoints(driverId, action, multiplier || 1, metadata || {});
    
    await codexLog("LOYALTY_POINTS_AWARDED", "LOYALTY", {
      driverId,
      action,
      points: result.pointsAwarded,
      newTotal: result.newTotal,
      tier: result.tier,
      tierUpgrade: result.tierUpgrade
    }, "loyalty-system");
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/loyalty/leaderboard", (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json(loyalty.getLeaderboard(limit));
});

app.get("/loyalty/stats", (req, res) => {
  res.json(loyalty.getTierStats());
});

app.get("/loyalty/history/:driverId", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(loyalty.getPointsHistory(req.params.driverId, limit));
});

app.get("/compliance/rules", (req, res) => {
  res.json({
    modes: compliance.MODE_RULES,
    regions: compliance.REGION_RULES,
    cargo: compliance.CARGO_RULES,
    categories: compliance.COMPLIANCE_CATEGORIES
  });
});

app.post("/compliance/check", async (req, res) => {
  const { loadId, driverData, loadData } = req.body;
  
  if (!loadId || !driverData || !loadData) {
    return res.status(400).json({ error: "loadId, driverData, and loadData required" });
  }
  
  const result = compliance.runFullComplianceCheck(loadId, loadData, driverData);
  
  await codexLog("COMPLIANCE_CHECKED", "COMPLIANCE", {
    loadId,
    driverId: driverData.driverId,
    compliant: result.compliant,
    errorCount: result.errors.length,
    warningCount: result.warnings.length
  }, "compliance-engine");
  
  res.json(result);
});

app.post("/compliance/exception", async (req, res) => {
  const { loadId, driverId, exceptionType, reason, overrideBy } = req.body;
  
  if (!loadId || !exceptionType || !reason) {
    return res.status(400).json({ error: "loadId, exceptionType, and reason required" });
  }
  
  const exception = compliance.logException(loadId, driverId, exceptionType, reason, overrideBy);
  
  await codexLog("COMPLIANCE_EXCEPTION", "COMPLIANCE", {
    exceptionId: exception.id,
    loadId,
    driverId,
    exceptionType,
    overridden: exception.overridden
  }, "compliance-engine");
  
  res.json(exception);
});

app.get("/compliance/exceptions", (req, res) => {
  const filters = {
    loadId: req.query.loadId,
    driverId: req.query.driverId,
    exceptionType: req.query.type,
    limit: parseInt(req.query.limit) || 100
  };
  res.json(compliance.getExceptions(filters));
});

app.get("/compliance/stats", (req, res) => {
  res.json(compliance.getComplianceStats());
});

app.get("/risk/overview", (req, res) => {
  res.json({
    regional: riskRadar.getRegionalRiskOverview(),
    stats: riskRadar.getRiskStats(),
    levels: riskRadar.RISK_LEVELS,
    categories: riskRadar.RISK_CATEGORIES
  });
});

app.post("/risk/assess", async (req, res) => {
  const { loadId, loadData, driverData, complianceResult } = req.body;
  
  if (!loadId || !loadData || !driverData) {
    return res.status(400).json({ error: "loadId, loadData, and driverData required" });
  }
  
  const compResult = complianceResult || compliance.runFullComplianceCheck(loadId, loadData, driverData);
  const intel = getLatestIntel();
  
  const riskAssessment = riskRadar.calculateCompositeRisk(
    loadId, 
    loadData, 
    driverData, 
    compResult, 
    intel
  );
  
  await codexLog("RISK_ASSESSED", "RISK_RADAR", {
    loadId,
    driverId: driverData.driverId,
    compositeScore: riskAssessment.compositeScore,
    level: riskAssessment.compositeLevel
  }, "risk-radar");
  
  res.json(riskAssessment);
});

app.get("/risk/load/:loadId", (req, res) => {
  const load = loads.find(l => l.id === req.params.loadId);
  if (!load) return res.status(404).json({ error: "Load not found" });
  
  const driver = drivers.get(load.driverId);
  if (!driver) {
    return res.json({ error: "No driver assigned", loadId: req.params.loadId });
  }
  
  const driverData = {
    driverId: driver.driverId,
    safetyScore: 95,
    cancellationRate: 2,
    onTimeRate: 96,
    loadsCompleted: driver.loadsCompleted,
    tenureMonths: 6
  };
  
  const loadData = {
    mode: load.mode,
    region: load.region,
    origin: load.origin,
    destination: load.destination,
    cargoType: load.cargoType || 'GENERAL'
  };
  
  const compResult = compliance.runFullComplianceCheck(load.id, loadData, driverData);
  const intel = getLatestIntel();
  const riskAssessment = riskRadar.calculateCompositeRisk(load.id, loadData, driverData, compResult, intel);
  
  res.json(riskAssessment);
});

app.get("/risk/history", (req, res) => {
  const filters = {
    loadId: req.query.loadId,
    driverId: req.query.driverId,
    minScore: req.query.minScore ? parseInt(req.query.minScore) : undefined,
    level: req.query.level,
    limit: parseInt(req.query.limit) || 100
  };
  res.json(riskRadar.getRiskHistory(filters));
});

app.get("/risk/stats", (req, res) => {
  res.json(riskRadar.getRiskStats());
});

app.get("/rewards/options", (req, res) => {
  res.json({
    badges: rewards.BADGES,
    streaks: rewards.STREAKS,
    redemptionOptions: rewards.REDEMPTION_OPTIONS
  });
});

app.get("/rewards/driver/:driverId", (req, res) => {
  const driverId = req.params.driverId;
  let driverRewards = rewards.getDriverRewards(driverId);
  
  if (!driverRewards) {
    driverRewards = rewards.initializeDriverRewards(driverId);
  }
  
  res.json({
    rewards: driverRewards,
    activeBoosts: rewards.getActiveBoosts(driverId)
  });
});

app.post("/rewards/award", async (req, res) => {
  const { driverId, rewardType, value, reason, metadata } = req.body;
  
  if (!driverId || !rewardType || value === undefined || !reason) {
    return res.status(400).json({ error: "driverId, rewardType, value, and reason required" });
  }
  
  const result = rewards.awardReward(driverId, rewardType, value, reason, metadata || {});
  
  await codexLog("REWARD_GRANTED", "REWARDS", {
    driverId,
    rewardType,
    value,
    reason
  }, "reward-system");
  
  res.json(result);
});

app.post("/rewards/badge", async (req, res) => {
  const { driverId, badgeId } = req.body;
  
  if (!driverId || !badgeId) {
    return res.status(400).json({ error: "driverId and badgeId required" });
  }
  
  try {
    const result = rewards.awardBadge(driverId, badgeId);
    
    if (result.success) {
      await codexLog("BADGE_AWARDED", "REWARDS", {
        driverId,
        badgeId,
        badgeName: result.badge.name,
        points: result.pointsAwarded
      }, "reward-system");
    }
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/rewards/redeem", async (req, res) => {
  const { driverId, option } = req.body;
  
  if (!driverId || !option) {
    return res.status(400).json({ error: "driverId and option required" });
  }
  
  const result = rewards.redeemReward(driverId, option);
  
  if (result.success) {
    await codexLog("REWARD_REDEEMED", "REWARDS", {
      driverId,
      option,
      cost: result.redemption.cost,
      description: result.redemption.description
    }, "reward-system");
  }
  
  res.json(result);
});

app.get("/rewards/history", (req, res) => {
  const filters = {
    driverId: req.query.driverId,
    type: req.query.type,
    limit: parseInt(req.query.limit) || 100
  };
  res.json(rewards.getRewardHistory(filters));
});

app.get("/rewards/stats", (req, res) => {
  res.json(rewards.getRewardStats());
});

app.get("/dispatch/integrated/:loadId", async (req, res) => {
  const load = loads.find(l => l.id === req.params.loadId);
  if (!load) return res.status(404).json({ error: "Load not found" });

  const allDrivers = Array.from(drivers.values());
  const creditLines = devineCredit.getAllCreditLines();
  const intel = getLatestIntel();
  
  const enrichedDrivers = allDrivers.map(driver => {
    const driverLoyalty = loyalty.getDriverLoyalty(driver.driverId) || loyalty.initializeDriver(driver.driverId);
    const driverRewards = rewards.getDriverRewards(driver.driverId) || rewards.initializeDriverRewards(driver.driverId);
    
    const driverData = {
      ...driver,
      driverId: driver.driverId,
      safetyScore: 95,
      cancellationRate: 2,
      onTimeRate: 96,
      loadsCompleted: driver.loadsCompleted || 0,
      tenureMonths: 6,
      licenseValid: true,
      insuranceValid: true,
      certifications: ['CDL', 'DOT_NUMBER'],
      equipment: driver.equipment || 'DRY_VAN'
    };
    
    const loadData = {
      mode: load.mode,
      region: load.region,
      origin: load.origin,
      destination: load.destination,
      cargoType: load.cargoType || 'GENERAL',
      weightLbs: load.weightLbs || 20000
    };
    
    const compResult = compliance.runFullComplianceCheck(load.id, loadData, driverData);
    const riskAssessment = riskRadar.calculateCompositeRisk(load.id, loadData, driverData, compResult, intel);
    
    return {
      driver: driverData,
      loyalty: {
        tier: driverLoyalty.tier,
        totalPoints: driverLoyalty.totalPoints,
        dispatchBonus: loyalty.calculateDispatchBonus(driver.driverId)
      },
      rewards: {
        badges: driverRewards.badges.length,
        activeBoosts: rewards.getActiveBoosts(driver.driverId)
      },
      compliance: {
        compliant: compResult.compliant,
        errors: compResult.errors.length,
        warnings: compResult.warnings.length
      },
      risk: {
        score: riskAssessment.compositeScore,
        level: riskAssessment.compositeLevel,
        multiplier: riskAssessment.riskMultiplier
      }
    };
  });
  
  const suggestions = aiDispatch.suggestDrivers(allDrivers, load, creditLines);
  
  const integratedSuggestions = suggestions.suggestions.map(suggestion => {
    const enriched = enrichedDrivers.find(e => e.driver.driverId === suggestion.driverId);
    return {
      ...suggestion,
      score: suggestion.totalScore + (enriched?.loyalty?.dispatchBonus || 0),
      loyalty: enriched?.loyalty,
      rewards: enriched?.rewards,
      compliance: enriched?.compliance,
      risk: enriched?.risk
    };
  }).sort((a, b) => b.score - a.score);
  
  res.json({
    load: {
      id: load.id,
      origin: load.origin,
      destination: load.destination,
      mode: load.mode,
      region: load.region,
      budget: load.budgetAmount,
      status: load.status
    },
    suggestions: integratedSuggestions,
    drivers: enrichedDrivers,
    marketConditions: {
      rates: intel['freight-rates']?.[load.region]?.[load.mode],
      demand: intel['demand-signals']?.[load.region]?.[load.mode]
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/governance/constitution", (req, res) => {
  res.json({
    owner: "Private Ecclesia Trust",
    version: "1.0.0",
    ...governanceClient.getConstitution(),
    ipOwnership: {
      sourceCode: "Private Ecclesia Trust",
      brand: "Private Ecclesia Trust",
      algorithms: "Private Ecclesia Trust",
      tokenLogic: "Private Ecclesia Trust",
      likeness: "Private Ecclesia Trust"
    }
  });
});

app.get("/governance/ministries", (req, res) => {
  res.json(governanceClient.getMinistries());
});

app.get("/governance/roles", (req, res) => {
  res.json(governanceClient.getRoles());
});

app.get("/governance/treasury-constitution", (req, res) => {
  res.json(governanceClient.getTreasuryConstitution());
});

app.get("/governance/driver-charter", (req, res) => {
  res.json(governanceClient.getDriverCharter());
});

app.get("/governance/codex-taxonomy", (req, res) => {
  res.json(governanceClient.getCodexTaxonomy());
});

app.get("/governance/status", async (req, res) => {
  res.json(await governanceClient.getGovernanceStatus());
});

app.get("/operator/modes", (req, res) => {
  res.json(operatorPortal.getModes());
});

app.get("/operator/current", (req, res) => {
  res.json(operatorPortal.getCurrentMode());
});

app.post("/operator/mode", authMiddleware(), (req, res) => {
  const { mode } = req.body;
  if (!mode) return res.status(400).json({ error: "mode required" });
  res.json(operatorPortal.setMode(mode));
});

app.get("/operator/actions", authMiddleware(), (req, res) => {
  const mode = req.query.mode;
  res.json(mode ? operatorPortal.getAvailableActions(mode) : operatorPortal.getAllActions());
});

app.post("/operator/ai-query", authMiddleware(), async (req, res) => {
  const { query, context } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });
  
  const response = await operatorPortal.processAIQuery(query, context || {});
  res.json(response);
});

app.get("/operator/session", (req, res) => {
  res.json(operatorPortal.getSessionContext());
});

app.get("/logistics/modes", (req, res) => {
  res.json({
    modes: logisticsModes.LOGISTICS_MODES,
    readiness: logisticsModes.getModeReadiness()
  });
});

app.get("/logistics/modes/:modeId", (req, res) => {
  const mode = logisticsModes.getModeConfig(req.params.modeId);
  if (!mode) return res.status(404).json({ error: "Mode not found" });
  res.json(mode);
});

app.get("/logistics/regions", (req, res) => {
  res.json({
    regions: logisticsModes.REGION_CONFIGS,
    readiness: logisticsModes.getRegionReadiness()
  });
});

app.get("/logistics/regions/:regionId", (req, res) => {
  const region = logisticsModes.getRegionConfig(req.params.regionId);
  if (!region) return res.status(404).json({ error: "Region not found" });
  res.json(region);
});

app.get("/logistics/cargo-types", (req, res) => {
  res.json(logisticsModes.CARGO_TYPES);
});

app.get("/logistics/matrix", (req, res) => {
  res.json(logisticsModes.getFullOperationalMatrix());
});

app.post("/logistics/quote", (req, res) => {
  const { mode, distance, weight, cargoType } = req.body;
  if (!mode || !distance) return res.status(400).json({ error: "mode and distance required" });
  
  const quote = logisticsModes.calculateBaseRate(mode, distance, weight || 0, cargoType || "GENERAL");
  if (!quote) return res.status(400).json({ error: "Invalid mode" });
  
  res.json(quote);
});

app.get("/logistics/certifications/:modeId", (req, res) => {
  const cargoType = req.query.cargoType || "GENERAL";
  const certs = logisticsModes.getRequiredCertifications(req.params.modeId, cargoType);
  res.json({ mode: req.params.modeId, cargoType, certifications: certs });
});

app.get("/trading/tokens", (req, res) => {
  res.json(tokenTrading.getSupportedTokens());
});

app.get("/trading/pairs", (req, res) => {
  res.json(tokenTrading.getTradingPairs());
});

app.get("/trading/quote", (req, res) => {
  const { from, to, amount } = req.query;
  if (!from || !to || !amount) return res.status(400).json({ error: "from, to, and amount required" });
  
  const quote = tokenTrading.getExchangeRate(from, to, parseFloat(amount));
  res.json(quote);
});

app.post("/trading/swap", authMiddleware(), async (req, res) => {
  const { fromToken, toToken, amount, walletAddress } = req.body;
  if (!fromToken || !toToken || !amount || !walletAddress) {
    return res.status(400).json({ error: "fromToken, toToken, amount, and walletAddress required" });
  }
  
  const order = tokenTrading.createSwapOrder(fromToken, toToken, amount, walletAddress);
  
  if (order.success) {
    await codexLog("SWAP_ORDER_CREATED", "TOKEN_TRADING", {
      orderId: order.order.id,
      fromToken,
      toToken,
      amount,
      walletAddress,
      actor: req.user?.role || "authenticated"
    }, "trading-system");
  }
  
  res.json(order);
});

app.post("/trading/execute/:orderId", authMiddleware(), async (req, res) => {
  const { txHash } = req.body;
  if (!txHash) return res.status(400).json({ error: "txHash required" });
  
  const result = tokenTrading.executeSwap(req.params.orderId, txHash);
  
  if (result.success) {
    await codexLog("SWAP_EXECUTED", "TOKEN_TRADING", {
      orderId: req.params.orderId,
      txHash,
      actor: req.user?.role || "authenticated"
    }, "trading-system");
  }
  
  res.json(result);
});

app.delete("/trading/swap/:orderId", authMiddleware(), (req, res) => {
  res.json(tokenTrading.cancelSwap(req.params.orderId));
});

app.get("/trading/history", (req, res) => {
  const filters = {
    walletAddress: req.query.wallet,
    fromToken: req.query.from,
    toToken: req.query.to,
    status: req.query.status,
    limit: parseInt(req.query.limit) || 100
  };
  res.json(tokenTrading.getTradeHistory(filters));
});

app.get("/trading/liquidity", (req, res) => {
  res.json(tokenTrading.getLiquidityInfo());
});

app.get("/trading/market", (req, res) => {
  res.json(tokenTrading.getMarketData());
});

app.get("/trading/stats", (req, res) => {
  res.json(tokenTrading.getTradingStats());
});

app.get("/trading/upgrade-specs", (req, res) => {
  res.json(tokenTrading.getUpgradeSpecs());
});

app.get("/security/advanced-status", authMiddleware('*'), (req, res) => {
  res.json(securityLayer.getSecurityStatus());
});

app.post("/security/check-rate-limit", authMiddleware('*'), (req, res) => {
  const { ip, endpoint } = req.body;
  if (!ip) return res.status(400).json({ error: "ip required" });
  res.json(securityLayer.checkRateLimit(ip, endpoint || "default"));
});

app.post("/security/detect-anomaly", authMiddleware('*'), (req, res) => {
  const { ip, requestPattern } = req.body;
  if (!ip || !requestPattern) return res.status(400).json({ error: "ip and requestPattern required" });
  res.json(securityLayer.detectAnomaly(ip, requestPattern));
});

app.post("/security/generate-api-key", authMiddleware('*'), (req, res) => {
  const { partnerId } = req.body;
  if (!partnerId) return res.status(400).json({ error: "partnerId required" });
  const apiKeyResult = securityLayer.generateAPIKey(partnerId);
  res.json({
    keyPrefix: apiKeyResult.keyPrefix,
    partnerId: apiKeyResult.partnerId,
    createdAt: apiKeyResult.createdAt,
    message: "Full key returned once - store securely",
    key: apiKeyResult.key
  });
});

app.get("/capture/loadboards", (req, res) => {
  res.json(contractCapture.getExternalLoadboards());
});

app.post("/capture/scan", authMiddleware(), async (req, res) => {
  const filters = req.body.filters || {};
  const results = await contractCapture.scanExternalLoadboards(filters);
  res.json(results);
});

app.post("/capture/score", (req, res) => {
  const { contract, capabilities } = req.body;
  if (!contract) return res.status(400).json({ error: "contract required" });
  res.json(contractCapture.scoreContract(contract, capabilities || {}));
});

app.post("/capture/capture", authMiddleware(), async (req, res) => {
  const { contract, score } = req.body;
  if (!contract || !score) return res.status(400).json({ error: "contract and score required" });
  
  const result = contractCapture.captureContract(contract, score);
  if (result.success) {
    await codexLog("CONTRACT_CAPTURED", "AI_CAPTURE", {
      contractId: contract.id,
      source: contract.source,
      score: score.totalScore
    }, "contract-capture");
  }
  res.json(result);
});

app.post("/capture/convert/:contractId", authMiddleware(), async (req, res) => {
  const overrides = req.body.overrides || {};
  const result = contractCapture.convertToDynastyLoad(req.params.contractId, overrides);
  
  if (result.success) {
    await codexLog("CONTRACT_CONVERTED", "AI_CAPTURE", {
      contractId: req.params.contractId,
      dynastyLoadId: result.load.id
    }, "contract-capture");
  }
  res.json(result);
});

app.get("/capture/captured", (req, res) => {
  const filters = {
    status: req.query.status,
    minScore: req.query.minScore ? parseFloat(req.query.minScore) : undefined,
    source: req.query.source,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(contractCapture.getCapturedContracts(filters));
});

app.get("/capture/qualified", (req, res) => {
  const minScore = req.query.minScore ? parseFloat(req.query.minScore) : 60;
  res.json(contractCapture.getQualifiedContracts(minScore));
});

app.get("/capture/stats", (req, res) => {
  res.json(contractCapture.getCaptureStats());
});

app.get("/knowledge/domains", (req, res) => {
  res.json(knowledgeCorpus.getDomains());
});

app.get("/knowledge/domains/:domainId", (req, res) => {
  const domain = knowledgeCorpus.getDomain(req.params.domainId);
  if (!domain) return res.status(404).json({ error: "Domain not found" });
  res.json(domain);
});

app.get("/knowledge/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "query parameter q required" });
  res.json(knowledgeCorpus.searchKnowledge(query));
});

app.post("/knowledge/query", (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });
  res.json(knowledgeCorpus.processKnowledgeQuery(query));
});

app.get("/knowledge/stats", (req, res) => {
  res.json(knowledgeCorpus.getKnowledgeStats());
});

app.get("/brain/model", (req, res) => {
  res.json(aiDispatchBrain.getScoringModel());
});

app.get("/brain/fallbacks", (req, res) => {
  res.json(aiDispatchBrain.getFallbackStrategies());
});

app.post("/brain/profile", authMiddleware(), (req, res) => {
  const { driverId, data } = req.body;
  if (!driverId) return res.status(400).json({ error: "driverId required" });
  res.json(aiDispatchBrain.initializeDriverProfile(driverId, data || {}));
});

app.get("/brain/profile/:driverId", (req, res) => {
  const profile = aiDispatchBrain.getDriverProfile(req.params.driverId);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json(profile);
});

app.put("/brain/profile/:driverId", authMiddleware(), (req, res) => {
  const updates = req.body;
  const profile = aiDispatchBrain.updateDriverProfile(req.params.driverId, updates);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json(profile);
});

app.post("/brain/score", (req, res) => {
  const { driver, load } = req.body;
  if (!driver || !load) return res.status(400).json({ error: "driver and load required" });
  res.json(aiDispatchBrain.scoreDriverForLoad(driver, load));
});

app.post("/brain/predict-acceptance", (req, res) => {
  const { driver, load, rate } = req.body;
  if (!driver || !load) return res.status(400).json({ error: "driver and load required" });
  res.json(aiDispatchBrain.predictAcceptance(driver, load, rate || load.budgetAmount));
});

app.post("/brain/suggestions", (req, res) => {
  const { load, drivers, options } = req.body;
  if (!load || !drivers) return res.status(400).json({ error: "load and drivers required" });
  res.json(aiDispatchBrain.generateDispatchSuggestions(load, drivers, options || {}));
});

app.post("/brain/outcome", authMiddleware(), async (req, res) => {
  const { loadId, driverId, outcome } = req.body;
  if (!loadId || !driverId || !outcome) return res.status(400).json({ error: "loadId, driverId, and outcome required" });
  
  const record = aiDispatchBrain.recordDispatchOutcome(loadId, driverId, outcome);
  await codexLog("DISPATCH_OUTCOME", "AI_DISPATCH", { loadId, driverId, outcome }, "dispatch-brain");
  res.json(record);
});

app.get("/brain/analytics", (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  res.json(aiDispatchBrain.getDispatchAnalytics(filters));
});

app.get("/loadboard/views", (req, res) => {
  res.json(enhancedLoadboard.getLoadboardViews());
});

app.get("/loadboard/statuses", (req, res) => {
  res.json(enhancedLoadboard.getLoadStatuses());
});

app.post("/loadboard/post", authMiddleware(), async (req, res) => {
  const { loadData, shipperId } = req.body;
  if (!loadData) return res.status(400).json({ error: "loadData required" });
  
  const result = enhancedLoadboard.postLoad(loadData, shipperId || req.user?.id);
  if (result.success) {
    await codexLog("LOAD_POSTED", "LOADBOARD", { loadId: result.load.id, shipperId }, "loadboard");
  }
  res.json(result);
});

app.get("/loadboard/:view", (req, res) => {
  const view = req.params.view.toUpperCase();
  const userId = req.query.userId;
  const filters = {
    status: req.query.status,
    mode: req.query.mode,
    region: req.query.region,
    limit: req.query.limit ? parseInt(req.query.limit) : 50
  };
  res.json(enhancedLoadboard.getLoadsForView(view, userId, filters));
});

app.post("/loadboard/assign", authMiddleware(), async (req, res) => {
  const { loadId, driverId } = req.body;
  if (!loadId || !driverId) return res.status(400).json({ error: "loadId and driverId required" });
  
  const result = enhancedLoadboard.assignLoad(loadId, driverId, req.user?.id || "system");
  if (result.success) {
    await codexLog("LOAD_ASSIGNED", "LOADBOARD", { loadId, driverId }, "loadboard");
  }
  res.json(result);
});

app.put("/loadboard/status/:loadId", authMiddleware(), async (req, res) => {
  const { status, metadata } = req.body;
  if (!status) return res.status(400).json({ error: "status required" });
  
  const result = enhancedLoadboard.updateLoadStatus(req.params.loadId, status, metadata || {});
  if (result.success) {
    await codexLog("LOAD_STATUS_UPDATED", "LOADBOARD", { loadId: req.params.loadId, status }, "loadboard");
  }
  res.json(result);
});

app.get("/loadboard/capacity", (req, res) => {
  res.json(enhancedLoadboard.getCapacityOverview(req.query.region, req.query.mode));
});

app.get("/loadboard/revenue", (req, res) => {
  const filters = { period: req.query.period };
  res.json(enhancedLoadboard.getRevenueAnalytics(filters));
});

app.get("/loadboard/lanes", (req, res) => {
  res.json(enhancedLoadboard.getLaneAnalytics());
});

app.get("/loadboard/penetration", (req, res) => {
  res.json(enhancedLoadboard.getMarketPenetration());
});

app.get("/crosschain/chains", (req, res) => {
  res.json(crossChain.getChains());
});

app.get("/crosschain/active", (req, res) => {
  res.json(crossChain.getActiveChains());
});

app.get("/crosschain/planned", (req, res) => {
  res.json(crossChain.getPlannedChains());
});

app.get("/crosschain/dex", (req, res) => {
  res.json(crossChain.getDEXIntegrations());
});

app.get("/crosschain/phases", (req, res) => {
  res.json(crossChain.getEvolutionPhases());
});

app.get("/crosschain/progress", (req, res) => {
  res.json(crossChain.getPhaseProgress());
});

app.get("/crosschain/staking", (req, res) => {
  res.json(crossChain.getStakingTiers());
});

app.post("/crosschain/staking/calculate", (req, res) => {
  const { amount, tier, daysStaked } = req.body;
  if (!amount || !tier) return res.status(400).json({ error: "amount and tier required" });
  res.json(crossChain.calculateStakingRewards(amount, tier, daysStaked || 30));
});

app.get("/crosschain/bridge", (req, res) => {
  res.json(crossChain.getBridgeStatus());
});

app.get("/crosschain/tokenomics", (req, res) => {
  res.json(crossChain.getTokenomics());
});

app.get("/crosschain/roadmap", (req, res) => {
  res.json(crossChain.getCrossChainRoadmap());
});

app.get("/returns/reasons", (req, res) => {
  res.json(reverseLogistics.getReturnReasons());
});

app.get("/returns/statuses", (req, res) => {
  res.json(reverseLogistics.getReturnStatuses());
});

app.get("/returns/dispositions", (req, res) => {
  res.json(reverseLogistics.getDispositionTypes());
});

app.get("/returns/centers", (req, res) => {
  res.json(reverseLogistics.getReturnCenters());
});

app.post("/returns/initiate", authMiddleware(), async (req, res) => {
  const { orderId, items, reason, customer } = req.body;
  if (!orderId || !items || !reason) return res.status(400).json({ error: "orderId, items, and reason required" });
  
  const result = reverseLogistics.initiateReturn(orderId, items, reason, customer);
  if (result.success) {
    await codexLog("RETURN_INITIATED", "REVERSE_LOGISTICS", { returnId: result.return.id, orderId, reason }, "returns");
  }
  res.json(result);
});

app.post("/returns/:returnId/rma", authMiddleware(), async (req, res) => {
  const { approvedItems } = req.body;
  const result = reverseLogistics.issueRMA(req.params.returnId, approvedItems);
  if (result.success) {
    await codexLog("RMA_ISSUED", "REVERSE_LOGISTICS", { returnId: req.params.returnId, rma: result.return.rmaNumber }, "returns");
  }
  res.json(result);
});

app.post("/returns/:returnId/label", authMiddleware(), (req, res) => {
  const { courierService } = req.body;
  res.json(reverseLogistics.generateReturnLabel(req.params.returnId, courierService || 'DYNASTY_COURIER'));
});

app.post("/returns/:returnId/pickup", authMiddleware(), (req, res) => {
  const pickupDetails = req.body;
  res.json(reverseLogistics.schedulePickup(req.params.returnId, pickupDetails));
});

app.put("/returns/:returnId/status", authMiddleware(), async (req, res) => {
  const { status, metadata } = req.body;
  if (!status) return res.status(400).json({ error: "status required" });
  
  const result = reverseLogistics.updateReturnStatus(req.params.returnId, status, metadata);
  if (result.success) {
    await codexLog("RETURN_STATUS_UPDATE", "REVERSE_LOGISTICS", { returnId: req.params.returnId, status }, "returns");
  }
  res.json(result);
});

app.post("/returns/:returnId/inspect", authMiddleware(), (req, res) => {
  const inspectionResults = req.body;
  res.json(reverseLogistics.inspectReturn(req.params.returnId, inspectionResults));
});

app.post("/returns/:returnId/approve", authMiddleware(), async (req, res) => {
  const { refundAmount } = req.body;
  const result = reverseLogistics.approveReturn(req.params.returnId, refundAmount);
  if (result.success) {
    await codexLog("RETURN_APPROVED", "REVERSE_LOGISTICS", { returnId: req.params.returnId, refund: result.return.approvedRefund }, "returns");
  }
  res.json(result);
});

app.post("/returns/:returnId/refund", authMiddleware(), async (req, res) => {
  const { refundMethod } = req.body;
  const result = reverseLogistics.processRefund(req.params.returnId, refundMethod || 'ORIGINAL_PAYMENT');
  if (result.success) {
    await codexLog("REFUND_PROCESSED", "REVERSE_LOGISTICS", { returnId: req.params.returnId, transactionId: result.refund.transactionId }, "returns");
  }
  res.json(result);
});

app.post("/returns/:returnId/dispose", authMiddleware(), (req, res) => {
  res.json(reverseLogistics.processDisposition(req.params.returnId));
});

app.get("/returns/:returnId", (req, res) => {
  const returnData = reverseLogistics.getReturn(req.params.returnId);
  if (!returnData) return res.status(404).json({ error: "Return not found" });
  res.json(returnData);
});

app.get("/returns/rma/:rmaNumber", (req, res) => {
  const returnData = reverseLogistics.getReturnByRMA(req.params.rmaNumber);
  if (!returnData) return res.status(404).json({ error: "RMA not found" });
  res.json(returnData);
});

app.get("/returns", (req, res) => {
  const filters = {
    status: req.query.status,
    reason: req.query.reason,
    centerId: req.query.centerId,
    customerId: req.query.customerId,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(reverseLogistics.getReturns(filters));
});

app.get("/returns/analytics/summary", (req, res) => {
  res.json(reverseLogistics.getReturnAnalytics(req.query.period || 'month'));
});

app.get("/courier/types", (req, res) => {
  res.json(courierHub.getCourierTypes());
});

app.get("/courier/vehicles", (req, res) => {
  res.json(courierHub.getVehicleTypes());
});

app.get("/courier/services", (req, res) => {
  res.json(courierHub.getServiceLevels());
});

app.get("/courier/zones", (req, res) => {
  res.json(courierHub.getDeliveryZones());
});

app.get("/courier/onboarding/steps", (req, res) => {
  res.json(courierHub.getOnboardingSteps());
});

app.post("/courier/register", async (req, res) => {
  const courierData = req.body;
  if (!courierData.name || !courierData.email) return res.status(400).json({ error: "name and email required" });
  
  const result = courierHub.registerCourier(courierData);
  if (result.success) {
    await codexLog("COURIER_REGISTERED", "COURIER_HUB", { courierId: result.courier.id, type: result.courier.type.id }, "courier");
  }
  res.json(result);
});

app.post("/courier/:courierId/onboarding/:stepId", authMiddleware(), async (req, res) => {
  const data = req.body;
  const result = courierHub.completeOnboardingStep(req.params.courierId, req.params.stepId, data);
  if (result.success && result.isComplete) {
    await codexLog("COURIER_ACTIVATED", "COURIER_HUB", { courierId: req.params.courierId }, "courier");
  }
  res.json(result);
});

app.post("/courier/:courierId/vehicle", authMiddleware(), (req, res) => {
  const vehicleData = req.body;
  res.json(courierHub.registerVehicle(req.params.courierId, vehicleData));
});

app.put("/courier/:courierId/vehicle/:vehicleId/location", authMiddleware(), (req, res) => {
  const location = req.body;
  res.json(courierHub.updateCourierLocation(req.params.courierId, req.params.vehicleId, location));
});

app.put("/courier/:courierId/vehicle/:vehicleId/availability", authMiddleware(), (req, res) => {
  const { isAvailable, zones } = req.body;
  res.json(courierHub.setAvailability(req.params.courierId, req.params.vehicleId, isAvailable, zones));
});

app.post("/courier/rate/calculate", (req, res) => {
  const { pickup, delivery, serviceLevel, vehicleType } = req.body;
  if (!pickup || !delivery) return res.status(400).json({ error: "pickup and delivery required" });
  res.json(courierHub.calculateDeliveryRate(pickup, delivery, serviceLevel, vehicleType));
});

app.post("/courier/delivery", authMiddleware(), async (req, res) => {
  const deliveryData = req.body;
  const result = courierHub.createDelivery(deliveryData);
  if (result.success) {
    await codexLog("DELIVERY_CREATED", "COURIER_HUB", { deliveryId: result.delivery.id }, "courier");
  }
  res.json(result);
});

app.post("/courier/delivery/:deliveryId/assign", authMiddleware(), async (req, res) => {
  const { courierId, vehicleId } = req.body;
  if (!courierId) return res.status(400).json({ error: "courierId required" });
  
  const result = courierHub.assignDelivery(req.params.deliveryId, courierId, vehicleId);
  if (result.success) {
    await codexLog("DELIVERY_ASSIGNED", "COURIER_HUB", { deliveryId: req.params.deliveryId, courierId }, "courier");
  }
  res.json(result);
});

app.put("/courier/delivery/:deliveryId/status", authMiddleware(), async (req, res) => {
  const { status, metadata } = req.body;
  if (!status) return res.status(400).json({ error: "status required" });
  
  const result = courierHub.updateDeliveryStatus(req.params.deliveryId, status, metadata);
  if (result.success) {
    await codexLog("DELIVERY_STATUS_UPDATE", "COURIER_HUB", { deliveryId: req.params.deliveryId, status }, "courier");
  }
  res.json(result);
});

app.get("/courier/available", (req, res) => {
  const { zoneId, vehicleType, serviceLevel } = req.query;
  res.json(courierHub.findAvailableCouriers(zoneId, vehicleType, serviceLevel));
});

app.get("/courier/:courierId", (req, res) => {
  const courier = courierHub.getCourier(req.params.courierId);
  if (!courier) return res.status(404).json({ error: "Courier not found" });
  res.json(courier);
});

app.get("/courier/:courierId/vehicles", (req, res) => {
  res.json(courierHub.getCourierVehicles(req.params.courierId));
});

app.get("/courier", (req, res) => {
  const filters = {
    status: req.query.status,
    type: req.query.type,
    zone: req.query.zone,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(courierHub.getCouriers(filters));
});

app.get("/courier/delivery/:deliveryId", (req, res) => {
  const delivery = courierHub.getDelivery(req.params.deliveryId);
  if (!delivery) return res.status(404).json({ error: "Delivery not found" });
  res.json(delivery);
});

app.get("/courier/deliveries", (req, res) => {
  const filters = {
    status: req.query.status,
    courierId: req.query.courierId,
    zoneId: req.query.zoneId,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(courierHub.getDeliveries(filters));
});

app.get("/courier/analytics", (req, res) => {
  res.json(courierHub.getCourierAnalytics());
});

app.get("/universal/systems", (req, res) => {
  res.json(universalCapture.getLogisticsSystems());
});

app.get("/universal/contract-types", (req, res) => {
  res.json(universalCapture.getContractTypes());
});

app.get("/universal/priorities", (req, res) => {
  res.json(universalCapture.getCapturePriorities());
});

app.get("/universal/scoring", (req, res) => {
  res.json(universalCapture.getScoringFactors());
});

app.get("/universal/rules", (req, res) => {
  res.json(universalCapture.getCaptureRules());
});

app.post("/universal/rules", authMiddleware(), (req, res) => {
  const rule = req.body;
  if (!rule.id || !rule.name) return res.status(400).json({ error: "id and name required" });
  res.json(universalCapture.addCaptureRule(rule));
});

app.post("/universal/scan", authMiddleware(), async (req, res) => {
  const filters = req.body.filters || {};
  const results = await universalCapture.scanAllSystems(filters);
  await codexLog("UNIVERSAL_SCAN", "UNIVERSAL_CAPTURE", { systemsScanned: results.systemsScanned, contractsFound: results.contractsFound }, "universal-capture");
  res.json(results);
});

app.post("/universal/score", (req, res) => {
  const { contract, capabilities } = req.body;
  if (!contract) return res.status(400).json({ error: "contract required" });
  res.json(universalCapture.scoreContract(contract, capabilities || {}));
});

app.post("/universal/capture", authMiddleware(), async (req, res) => {
  const { contract, score, reason } = req.body;
  if (!contract || !score) return res.status(400).json({ error: "contract and score required" });
  
  const result = universalCapture.captureContract(contract, score, reason || 'MANUAL');
  if (result.success) {
    await codexLog("UNIVERSAL_CAPTURED", "UNIVERSAL_CAPTURE", { captureId: result.captured.id, source: contract.source }, "universal-capture");
  }
  res.json(result);
});

app.post("/universal/:captureId/allocate", authMiddleware(), async (req, res) => {
  const { partnerId, partnerType } = req.body;
  if (!partnerId || !partnerType) return res.status(400).json({ error: "partnerId and partnerType required" });
  
  const result = universalCapture.allocateToPartner(req.params.captureId, partnerId, partnerType);
  if (result.success) {
    await codexLog("CONTRACT_ALLOCATED", "UNIVERSAL_CAPTURE", { captureId: req.params.captureId, partnerId }, "universal-capture");
  }
  res.json(result);
});

app.post("/universal/:captureId/route", authMiddleware(), async (req, res) => {
  const { loadboardView } = req.body;
  const result = universalCapture.routeToLoadboard(req.params.captureId, loadboardView || 'DRIVER');
  if (result.success) {
    await codexLog("CONTRACT_ROUTED", "UNIVERSAL_CAPTURE", { captureId: req.params.captureId, dynastyLoadId: result.dynastyLoad.id }, "universal-capture");
  }
  res.json(result);
});

app.get("/universal/captured", (req, res) => {
  const filters = {
    status: req.query.status,
    mode: req.query.mode,
    minScore: req.query.minScore ? parseFloat(req.query.minScore) : undefined,
    source: req.query.source,
    partnerId: req.query.partnerId,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(universalCapture.getCapturedContracts(filters));
});

app.get("/universal/partner/:partnerId/allocations", (req, res) => {
  res.json(universalCapture.getPartnerAllocations(req.params.partnerId));
});

app.get("/universal/stats", (req, res) => {
  res.json(universalCapture.getCaptureStats());
});

app.get("/distribution/modes", (req, res) => {
  res.json(multimodalDist.getDistributionModes());
});

app.get("/distribution/partner-types", (req, res) => {
  res.json(multimodalDist.getPartnerTypes());
});

app.get("/distribution/strategies", (req, res) => {
  res.json(multimodalDist.getDistributionStrategies());
});

app.post("/distribution/partner", authMiddleware(), async (req, res) => {
  const partnerData = req.body;
  if (!partnerData.name || !partnerData.type) return res.status(400).json({ error: "name and type required" });
  
  const result = multimodalDist.registerPartner(partnerData);
  if (result.success) {
    await codexLog("PARTNER_REGISTERED", "DISTRIBUTION", { partnerId: result.partner.id, type: result.partner.type.id }, "distribution");
  }
  res.json(result);
});

app.get("/distribution/partner/:partnerId", (req, res) => {
  const partner = multimodalDist.getPartner(req.params.partnerId);
  if (!partner) return res.status(404).json({ error: "Partner not found" });
  res.json(partner);
});

app.get("/distribution/partners", (req, res) => {
  const filters = {
    type: req.query.type,
    mode: req.query.mode,
    status: req.query.status,
    hasCapacity: req.query.hasCapacity === 'true',
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(multimodalDist.getPartners(filters));
});

app.post("/distribution/find-partners", (req, res) => {
  const { load, strategy } = req.body;
  if (!load) return res.status(400).json({ error: "load required" });
  res.json(multimodalDist.findEligiblePartners(load, strategy || 'BALANCED'));
});

app.post("/distribution/distribute", authMiddleware(), async (req, res) => {
  const { load, partnerId, metadata } = req.body;
  if (!load || !partnerId) return res.status(400).json({ error: "load and partnerId required" });
  
  const result = multimodalDist.distributeLoad(load, partnerId, metadata);
  if (result.success) {
    await codexLog("LOAD_DISTRIBUTED", "DISTRIBUTION", { distributionId: result.distribution.id, partnerId }, "distribution");
  }
  res.json(result);
});

app.post("/distribution/auto-distribute", authMiddleware(), async (req, res) => {
  const { loads, strategy } = req.body;
  if (!loads || !Array.isArray(loads)) return res.status(400).json({ error: "loads array required" });
  
  const result = multimodalDist.autoDistribute(loads, strategy || 'BALANCED');
  await codexLog("AUTO_DISTRIBUTION", "DISTRIBUTION", { distributed: result.distributed.length, unassigned: result.unassigned.length }, "distribution");
  res.json(result);
});

app.post("/distribution/route-to-loadboard", authMiddleware(), async (req, res) => {
  const { contracts, views } = req.body;
  if (!contracts || !Array.isArray(contracts)) return res.status(400).json({ error: "contracts array required" });
  
  const result = multimodalDist.routeThroughLoadboard(contracts, views);
  res.json(result);
});

app.get("/distribution/loads", (req, res) => {
  const filters = {
    partnerId: req.query.partnerId,
    mode: req.query.mode,
    status: req.query.status,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(multimodalDist.getDistributedLoads(filters));
});

app.get("/distribution/utilization", (req, res) => {
  res.json(multimodalDist.getPartnerUtilization());
});

app.get("/distribution/analytics", (req, res) => {
  res.json(multimodalDist.getDistributionAnalytics());
});

app.get("/distribution/queue", (req, res) => {
  const filters = {
    view: req.query.view,
    mode: req.query.mode,
    status: req.query.status,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(multimodalDist.getRoutingQueue(filters));
});

app.get("/mobile/operator-types", (req, res) => {
  res.json(mobileOperator.getOperatorTypes());
});

app.get("/mobile/notification-types", (req, res) => {
  res.json(mobileOperator.getNotificationTypes());
});

app.get("/mobile/home-direction-thresholds", (req, res) => {
  res.json(mobileOperator.getHomeDirectionThresholds());
});

app.get("/mobile/regions", (req, res) => {
  res.json(mobileOperator.getUSRegions());
});

app.post("/mobile/register", async (req, res) => {
  const operatorData = req.body;
  if (!operatorData.name || !operatorData.email || !operatorData.homeBase) {
    return res.status(400).json({ error: "name, email, and homeBase required" });
  }
  
  const result = await mobileOperator.registerOperator(operatorData);
  if (result.success) {
    await codexLog("OPERATOR_REGISTERED", "MOBILE_APP", { operatorId: result.operator.id, type: result.operator.operatorType.id }, "mobile");
    await ecclesiaIntegration.anchorToEcclesia("OPERATOR_REGISTERED", "MOBILE_APP", { operatorId: result.operator.id }, "PARTNER");
  }
  res.json(result);
});

app.put("/mobile/:operatorId/location", authMiddleware(), async (req, res) => {
  const location = req.body;
  if (!location.lat || !location.lng) return res.status(400).json({ error: "lat and lng required" });
  res.json(await mobileOperator.updateOperatorLocation(req.params.operatorId, location));
});

app.get("/mobile/:operatorId/dashboard", authMiddleware(), (req, res) => {
  const result = mobileOperator.getOperatorDashboard(req.params.operatorId);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

app.get("/mobile/:operatorId/notifications", authMiddleware(), (req, res) => {
  const filters = {
    status: req.query.status,
    pending: req.query.pending === 'true',
    limit: req.query.limit ? parseInt(req.query.limit) : 50
  };
  res.json(mobileOperator.getOperatorNotifications(req.params.operatorId, filters));
});

app.post("/mobile/:operatorId/notification/:notificationId/respond", authMiddleware(), async (req, res) => {
  const { response } = req.body;
  if (!response || !["ACCEPT", "DECLINE"].includes(response)) {
    return res.status(400).json({ error: "response must be ACCEPT or DECLINE" });
  }
  
  const result = await mobileOperator.respondToNotification(req.params.notificationId, response);
  if (result.success) {
    await codexLog(`LOAD_${response}ED`, "MOBILE_APP", { notificationId: req.params.notificationId, operatorId: req.params.operatorId }, "mobile");
  }
  res.json(result);
});

app.get("/mobile/:operatorId/nearby-loads", authMiddleware(), (req, res) => {
  const filters = {
    maxRadius: req.query.maxRadius ? parseInt(req.query.maxRadius) : undefined
  };
  res.json(mobileOperator.findNearbyLoads(req.params.operatorId, filters));
});

app.post("/mobile/:operatorId/route-home", authMiddleware(), (req, res) => {
  const preferences = req.body;
  res.json(mobileOperator.planRouteHome(req.params.operatorId, preferences));
});

app.post("/mobile/broadcast-load", authMiddleware(), async (req, res) => {
  const { load, radius } = req.body;
  if (!load || !load.id) return res.status(400).json({ error: "load with id required" });
  
  const result = mobileOperator.broadcastLoadToNearbyOperators(load, radius || 100);
  await codexLog("LOAD_BROADCAST", "MOBILE_APP", { loadId: load.id, notificationsSent: result.notificationsSent }, "mobile");
  res.json(result);
});

app.get("/mobile/operator/:operatorId", (req, res) => {
  const operator = mobileOperator.getOperator(req.params.operatorId);
  if (!operator) return res.status(404).json({ error: "Operator not found" });
  res.json(operator);
});

app.get("/mobile/operators", (req, res) => {
  const filters = {
    type: req.query.type,
    status: req.query.status,
    equipment: req.query.equipment,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(mobileOperator.getOperators(filters));
});

app.get("/mobile/stats", (req, res) => {
  res.json(mobileOperator.getMobileAppStats());
});

app.post("/mobile/score-home-direction", (req, res) => {
  const { origin, destination, homeBase } = req.body;
  if (!origin || !destination || !homeBase) {
    return res.status(400).json({ error: "origin, destination, and homeBase required" });
  }
  
  const score = mobileOperator.calculateHomeDirectionScore(origin, destination, homeBase);
  const category = mobileOperator.getHomeDirectionCategory(score);
  res.json({ score, category });
});

app.get("/bridge/chains", (req, res) => {
  res.json(bscBridge.getSupportedChains());
});

app.get("/bridge/chains/active", (req, res) => {
  res.json(bscBridge.getActiveChains());
});

app.get("/bridge/chains/planned", (req, res) => {
  res.json(bscBridge.getPlannedChains());
});

app.get("/bridge/token/bsc", (req, res) => {
  res.json(bscBridge.getBSCToken());
});

app.get("/bridge/token/dbt", (req, res) => {
  res.json(bscBridge.getDynastyBridgeToken());
});

app.get("/bridge/fiat-providers", (req, res) => {
  res.json(bscBridge.getFiatProviders());
});

app.get("/bridge/buyback-tiers", (req, res) => {
  res.json(bscBridge.getBuybackTiers());
});

app.get("/bridge/payout-methods", (req, res) => {
  res.json(bscBridge.getPayoutMethods());
});

app.get("/bridge/bsc-price", (req, res) => {
  res.json(bscBridge.getBSCPrice());
});

app.post("/bridge/buyback/quote", (req, res) => {
  const { bscAmount, payoutMethod } = req.body;
  if (!bscAmount) return res.status(400).json({ error: "bscAmount required" });
  res.json(bscBridge.calculateBuybackQuote(bscAmount, payoutMethod));
});

app.post("/bridge/buyback/initiate", authMiddleware(), async (req, res) => {
  const { partnerId, partnerType, bscAmount, payoutMethod, payoutDetails } = req.body;
  if (!partnerId || !bscAmount) return res.status(400).json({ error: "partnerId and bscAmount required" });
  
  const result = await bscBridge.initiateBuyback(partnerId, partnerType || 'PARTNER', bscAmount, payoutMethod || 'ACH', payoutDetails);
  if (result.success) {
    await codexLog("BUYBACK_INITIATED", "BSC_BRIDGE", { buybackId: result.buyback.id, bscAmount }, "treasury");
    await ecclesiaIntegration.anchorToEcclesia("BUYBACK_INITIATED", "BSC_BRIDGE", { buybackId: result.buyback.id, bscAmount }, "TREASURY");
  }
  res.json(result);
});

app.post("/bridge/buyback/:buybackId/confirm", authMiddleware(), async (req, res) => {
  const { txHash } = req.body;
  if (!txHash) return res.status(400).json({ error: "txHash required" });
  
  const result = await bscBridge.confirmBuybackTransaction(req.params.buybackId, txHash);
  if (result.success) {
    await codexLog("BUYBACK_CONFIRMED", "BSC_BRIDGE", { buybackId: req.params.buybackId, txHash }, "treasury");
  }
  res.json(result);
});

app.post("/bridge/buyback/:buybackId/process", authMiddleware(), async (req, res) => {
  const result = await bscBridge.processBuybackPayout(req.params.buybackId);
  if (result.success) {
    await codexLog("BUYBACK_PROCESSING", "BSC_BRIDGE", { buybackId: req.params.buybackId }, "treasury");
    await ecclesiaIntegration.anchorToEcclesia("BUYBACK_COMPLETED", "BSC_BRIDGE", { buybackId: req.params.buybackId }, "TREASURY");
  }
  res.json(result);
});

app.get("/bridge/buyback/:buybackId", (req, res) => {
  const buyback = bscBridge.getBuyback(req.params.buybackId);
  if (!buyback) return res.status(404).json({ error: "Buyback not found" });
  res.json(buyback);
});

app.get("/bridge/partner/:partnerId/buybacks", (req, res) => {
  res.json(bscBridge.getPartnerBuybacks(req.params.partnerId));
});

app.post("/bridge/transfer/initiate", authMiddleware(), async (req, res) => {
  const { userId, sourceChain, destChain, amount } = req.body;
  if (!userId || !sourceChain || !destChain || !amount) {
    return res.status(400).json({ error: "userId, sourceChain, destChain, and amount required" });
  }
  
  const result = await bscBridge.initiateBridgeTransfer(userId, sourceChain, destChain, amount);
  if (result.success) {
    await codexLog("BRIDGE_INITIATED", "BSC_BRIDGE", { bridgeId: result.transaction.id, sourceChain, destChain, amount }, "bridge");
    await ecclesiaIntegration.anchorToEcclesia("BRIDGE_INITIATED", "BSC_BRIDGE", { bridgeId: result.transaction.id }, "BRIDGE");
  }
  res.json(result);
});

app.post("/bridge/transfer/:bridgeId/confirm-source", authMiddleware(), (req, res) => {
  const { txHash } = req.body;
  if (!txHash) return res.status(400).json({ error: "txHash required" });
  res.json(bscBridge.confirmBridgeSource(req.params.bridgeId, txHash));
});

app.post("/bridge/transfer/:bridgeId/complete", authMiddleware(), async (req, res) => {
  const { destTxHash } = req.body;
  if (!destTxHash) return res.status(400).json({ error: "destTxHash required" });
  
  const result = await bscBridge.completeBridgeTransfer(req.params.bridgeId, destTxHash);
  if (result.success) {
    await codexLog("BRIDGE_COMPLETED", "BSC_BRIDGE", { bridgeId: req.params.bridgeId }, "bridge");
    await ecclesiaIntegration.anchorToEcclesia("BRIDGE_COMPLETED", "BSC_BRIDGE", { bridgeId: req.params.bridgeId }, "BRIDGE");
  }
  res.json(result);
});

app.get("/bridge/transfer/:bridgeId", (req, res) => {
  const tx = bscBridge.getBridgeTransaction(req.params.bridgeId);
  if (!tx) return res.status(404).json({ error: "Bridge transaction not found" });
  res.json(tx);
});

app.get("/bridge/user/:userId/transfers", (req, res) => {
  res.json(bscBridge.getUserBridgeTransactions(req.params.userId));
});

app.post("/bridge/fiat/initiate", authMiddleware(), async (req, res) => {
  const { userId, type, cryptoAmount, fiatCurrency, provider } = req.body;
  if (!userId || !type || !cryptoAmount || !fiatCurrency || !provider) {
    return res.status(400).json({ error: "userId, type, cryptoAmount, fiatCurrency, and provider required" });
  }
  
  const result = await bscBridge.initiateFiatTransaction(userId, type, cryptoAmount, fiatCurrency, provider);
  if (result.success) {
    await codexLog("FIAT_INITIATED", "BSC_BRIDGE", { transactionId: result.transaction.id, type, cryptoAmount }, "treasury");
  }
  res.json(result);
});

app.post("/bridge/fiat/:transactionId/complete", authMiddleware(), async (req, res) => {
  const { providerTxId } = req.body;
  if (!providerTxId) return res.status(400).json({ error: "providerTxId required" });
  
  const result = await bscBridge.completeFiatTransaction(req.params.transactionId, providerTxId);
  if (result.success) {
    await codexLog("FIAT_COMPLETED", "BSC_BRIDGE", { transactionId: req.params.transactionId }, "treasury");
    await ecclesiaIntegration.anchorToEcclesia("FIAT_TRANSACTION", "BSC_BRIDGE", { transactionId: req.params.transactionId }, "TREASURY");
  }
  res.json(result);
});

app.get("/bridge/fiat/:transactionId", (req, res) => {
  const tx = bscBridge.getFiatTransaction(req.params.transactionId);
  if (!tx) return res.status(404).json({ error: "Fiat transaction not found" });
  res.json(tx);
});

app.get("/bridge/user/:userId/fiat", (req, res) => {
  res.json(bscBridge.getUserFiatTransactions(req.params.userId));
});

app.get("/bridge/stats", (req, res) => {
  res.json(bscBridge.getBridgeStats());
});

app.get("/ecclesia/config", (req, res) => {
  res.json(ecclesiaIntegration.getEcclesiaConfig());
});

app.get("/ecclesia/scroll-types", (req, res) => {
  res.json(ecclesiaIntegration.getScrollTypes());
});

app.get("/ecclesia/ministries", (req, res) => {
  res.json(ecclesiaIntegration.getMinistries());
});

app.get("/ecclesia/anchor-categories", (req, res) => {
  res.json(ecclesiaIntegration.getAnchorCategories());
});

app.get("/ecclesia/portals", (req, res) => {
  res.json(ecclesiaIntegration.getPortals());
});

app.get("/ecclesia/portal/:portalId/url", (req, res) => {
  const url = ecclesiaIntegration.getPortalUrl(req.params.portalId);
  if (!url) return res.status(404).json({ error: "Portal not found" });
  res.json({ portalId: req.params.portalId, url });
});

app.post("/ecclesia/anchor", authMiddleware(), async (req, res) => {
  const { eventType, module, data, category } = req.body;
  if (!eventType || !module || !data) {
    return res.status(400).json({ error: "eventType, module, and data required" });
  }
  
  const result = await ecclesiaIntegration.anchorToEcclesia(eventType, module, data, category || "GOVERNANCE");
  res.json(result);
});

app.post("/ecclesia/verify", (req, res) => {
  const { scrollId, hash } = req.body;
  if (!scrollId || !hash) return res.status(400).json({ error: "scrollId and hash required" });
  
  ecclesiaIntegration.verifyScroll(scrollId, hash).then(result => res.json(result));
});

app.get("/ecclesia/anchors/pending", (req, res) => {
  res.json(ecclesiaIntegration.getPendingAnchors());
});

app.get("/ecclesia/anchors", (req, res) => {
  const filters = {
    category: req.query.category,
    module: req.query.module,
    eventType: req.query.eventType,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  res.json(ecclesiaIntegration.getAnchoredScrolls(filters));
});

app.get("/ecclesia/anchor/:anchorId", (req, res) => {
  const anchor = ecclesiaIntegration.getAnchor(req.params.anchorId);
  if (!anchor) return res.status(404).json({ error: "Anchor not found" });
  res.json(anchor);
});

app.post("/ecclesia/retry-failed", authMiddleware(), async (req, res) => {
  const result = await ecclesiaIntegration.retryFailedAnchors();
  res.json(result);
});

app.get("/ecclesia/stats", (req, res) => {
  res.json(ecclesiaIntegration.getEcclesiaStats());
});

app.get("/ecclesia/link/governance", (req, res) => {
  const params = req.query;
  res.json({ url: ecclesiaIntegration.buildGovernanceLink("view", params) });
});

app.get("/ecclesia/link/bsc", (req, res) => {
  const params = req.query;
  res.json({ url: ecclesiaIntegration.buildBSCLink("transfer", params) });
});

const port = process.env.API_PORT || 3000;
app.listen(port, () => {
  console.log(`Borders Dynasty Global Logistics API running on port ${port}`);
});
