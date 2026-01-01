const LAUNCH_STAGES = {
  LOCAL: {
    name: "Local Launch",
    description: "Single city/market testing",
    modes: ["GROUND", "COURIER"],
    regions: ["NORTH_AMERICA"],
    requirements: ["Basic ops team", "Initial drivers", "Test shippers"]
  },
  NATIONWIDE: {
    name: "Nationwide Launch",
    description: "Full domestic operations",
    modes: ["GROUND", "COURIER", "AIR"],
    regions: ["NORTH_AMERICA"],
    requirements: ["Regional ops coverage", "Carrier partnerships", "Credit system active"]
  },
  GLOBAL: {
    name: "Global Launch",
    description: "International operations across continents",
    modes: ["GROUND", "COURIER", "AIR", "OCEAN"],
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC", "LATAM"],
    requirements: ["International partnerships", "Multi-currency treasury", "Global compliance"]
  }
};

function generateLaunchPlan(stage) {
  const config = LAUNCH_STAGES[stage];
  if (!config) {
    throw new Error(`Unknown launch stage: ${stage}`);
  }

  return {
    stage,
    ...config,
    activationOrder: [
      { step: 1, action: "Verify ops readiness", items: config.requirements },
      { step: 2, action: "Activate modes", items: config.modes },
      { step: 3, action: "Activate regions", items: config.regions },
      { step: 4, action: "Initialize treasury escrow", items: ["BSC contract connection"] },
      { step: 5, action: "Open driver credit lines", items: ["DevineCredit system"] },
      { step: 6, action: "Anchor launch event to Codex", items: ["LAUNCH_EXECUTED record"] }
    ],
    estimatedDuration: stage === "LOCAL" ? "1 week" : stage === "NATIONWIDE" ? "1 month" : "3 months"
  };
}

function getLaunchChecklist(stage) {
  const plan = generateLaunchPlan(stage);
  return {
    stage: plan.stage,
    name: plan.name,
    checklist: [
      { item: "Ops config modes ready", required: true },
      { item: "Ops config regions ready", required: true },
      { item: "TreasuryEngine initialized", required: true },
      { item: "DevineCredit system online", required: true },
      { item: "Codex Ecclesia connected", required: true },
      { item: "BSC contract verified", required: true },
      { item: "Test load created successfully", required: true },
      { item: "Test payout executed", required: true },
      { item: "Anchor created", required: true }
    ]
  };
}

module.exports = {
  LAUNCH_STAGES,
  generateLaunchPlan,
  getLaunchChecklist
};
