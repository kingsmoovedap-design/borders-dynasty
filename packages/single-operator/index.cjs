const { GovernanceClient, GOVERNANCE_CORPUS, TREASURY_CONSTITUTION, DRIVER_CHARTER } = require("../ecclesia-client/governance.cjs");

const OPERATOR_MODES = {
  DASHBOARD: { name: "Command Dashboard", icon: "dashboard", description: "Overview of all Dynasty operations" },
  DISPATCH: { name: "Dispatch Console", icon: "dispatch", description: "AI-powered load assignment and driver management" },
  TREASURY: { name: "Treasury Control", icon: "treasury", description: "Financial flows, payouts, and credit management" },
  COMPLIANCE: { name: "Compliance Center", icon: "compliance", description: "Rules, checks, and exception handling" },
  INTEL: { name: "Live Intelligence", icon: "intel", description: "Real-time market and operational data" },
  CODEX: { name: "Codex Archive", icon: "codex", description: "Event history and governance records" },
  GOVERNANCE: { name: "Governance Library", icon: "governance", description: "Constitution, charters, and policies" }
};

const AI_GUIDANCE_PROMPTS = {
  WELCOME: "Welcome, Sovereign. I am your Dynasty AI Advisor. I can help you navigate operations, analyze data, make dispatch decisions, and provide strategic guidance. What would you like to accomplish?",
  DISPATCH: "I can analyze available loads and suggest optimal driver assignments based on performance, compliance, risk, and loyalty factors. Would you like me to review unassigned loads?",
  TREASURY: "I can provide insights on treasury health, payout trends, and credit utilization. Current escrow balance and driver payouts are available for review.",
  COMPLIANCE: "I can run compliance checks on loads and drivers, identify potential issues, and help manage exceptions. Would you like a compliance overview?",
  INTEL: "Live intelligence feeds are active. I can summarize market conditions, fuel prices, weather impacts, and partner status across all regions and modes.",
  CODEX: "The Codex contains your complete operational history. I can search events, generate reports, and verify chain integrity.",
  GOVERNANCE: "I can explain any aspect of the Dynasty Constitution, Ministry Framework, Treasury Constitution, or Driver Charter."
};

const AI_ACTIONS = [
  { id: "analyze_loads", label: "Analyze Unassigned Loads", mode: "DISPATCH", description: "Review all pending loads and generate AI recommendations" },
  { id: "driver_suggestions", label: "Get Driver Suggestions", mode: "DISPATCH", description: "AI-powered driver matching for selected load" },
  { id: "treasury_health", label: "Treasury Health Check", mode: "TREASURY", description: "Analyze escrow, payouts, and credit status" },
  { id: "compliance_scan", label: "Run Compliance Scan", mode: "COMPLIANCE", description: "Check all active loads for compliance issues" },
  { id: "risk_overview", label: "Risk Overview", mode: "INTEL", description: "Aggregate risk assessment across regions and modes" },
  { id: "market_brief", label: "Market Brief", mode: "INTEL", description: "Summary of freight rates, fuel prices, and demand" },
  { id: "codex_summary", label: "Codex Summary", mode: "CODEX", description: "Recent events and system activity" },
  { id: "launch_status", label: "Launch Status", mode: "DASHBOARD", description: "Current activation status of modes and regions" },
  { id: "driver_fleet", label: "Fleet Overview", mode: "DISPATCH", description: "Driver performance, loyalty tiers, and availability" },
  { id: "governance_brief", label: "Governance Brief", mode: "GOVERNANCE", description: "Summary of constitution and active policies" }
];

class SingleOperatorPortal {
  constructor() {
    this.governance = new GovernanceClient();
    this.currentMode = "DASHBOARD";
    this.sessionContext = {
      startedAt: new Date().toISOString(),
      actionsPerformed: 0,
      lastAction: null
    };
  }

  getModes() {
    return OPERATOR_MODES;
  }

  setMode(mode) {
    if (OPERATOR_MODES[mode]) {
      this.currentMode = mode;
      return { success: true, mode: OPERATOR_MODES[mode], guidance: AI_GUIDANCE_PROMPTS[mode] || AI_GUIDANCE_PROMPTS.WELCOME };
    }
    return { success: false, error: "Invalid mode" };
  }

  getCurrentMode() {
    return {
      id: this.currentMode,
      ...OPERATOR_MODES[this.currentMode],
      guidance: AI_GUIDANCE_PROMPTS[this.currentMode] || AI_GUIDANCE_PROMPTS.WELCOME
    };
  }

  getAvailableActions(mode = null) {
    const targetMode = mode || this.currentMode;
    return AI_ACTIONS.filter(a => a.mode === targetMode || a.mode === "DASHBOARD");
  }

  getAllActions() {
    return AI_ACTIONS;
  }

  async processAIQuery(query, context = {}) {
    this.sessionContext.actionsPerformed++;
    this.sessionContext.lastAction = new Date().toISOString();

    const queryLower = query.toLowerCase();
    let response = { type: "text", content: "" };

    if (queryLower.includes("status") || queryLower.includes("overview")) {
      response = await this.generateStatusBrief();
    } else if (queryLower.includes("load") && (queryLower.includes("unassigned") || queryLower.includes("pending"))) {
      response = await this.analyzeUnassignedLoads(context);
    } else if (queryLower.includes("driver") && queryLower.includes("suggest")) {
      response = await this.suggestDrivers(context);
    } else if (queryLower.includes("treasury") || queryLower.includes("payout")) {
      response = await this.getTreasuryBrief();
    } else if (queryLower.includes("compliance") || queryLower.includes("check")) {
      response = await this.getComplianceBrief();
    } else if (queryLower.includes("risk") || queryLower.includes("radar")) {
      response = await this.getRiskBrief();
    } else if (queryLower.includes("market") || queryLower.includes("rate") || queryLower.includes("fuel")) {
      response = await this.getMarketBrief();
    } else if (queryLower.includes("constitution") || queryLower.includes("governance")) {
      response = this.getGovernanceBrief();
    } else if (queryLower.includes("charter") || queryLower.includes("driver right")) {
      response = this.getDriverCharterBrief();
    } else if (queryLower.includes("ministry") || queryLower.includes("ministries")) {
      response = this.getMinistriesBrief();
    } else if (queryLower.includes("launch") || queryLower.includes("activate")) {
      response = this.getLaunchGuidance();
    } else if (queryLower.includes("credit") || queryLower.includes("advance")) {
      response = this.getCreditGuidance();
    } else if (queryLower.includes("loyalty") || queryLower.includes("tier")) {
      response = this.getLoyaltyGuidance();
    } else if (queryLower.includes("help") || queryLower.includes("what can")) {
      response = this.getHelpResponse();
    } else {
      response = {
        type: "guidance",
        content: "I understand you're asking about: " + query + ". I can help with status overviews, load analysis, driver suggestions, treasury, compliance, risk assessment, market intelligence, and governance. Could you be more specific about what you'd like to explore?"
      };
    }

    return response;
  }

  async generateStatusBrief() {
    const governanceStatus = await this.governance.getGovernanceStatus();
    return {
      type: "status",
      content: "Dynasty OS Status Brief",
      data: {
        governance: governanceStatus,
        systemHealth: "OPERATIONAL",
        recommendation: "All systems nominal. Consider reviewing unassigned loads for dispatch optimization."
      }
    };
  }

  async analyzeUnassignedLoads(context) {
    return {
      type: "analysis",
      content: "Load Analysis",
      data: {
        recommendation: "Use the Dispatch Console to view AI-powered driver suggestions for each load. I can score drivers based on loyalty tier, compliance status, risk factors, and performance history."
      }
    };
  }

  async suggestDrivers(context) {
    return {
      type: "suggestions",
      content: "Driver Suggestions",
      data: {
        recommendation: "Select a load from the Dispatch Console. I will analyze available drivers and provide ranked suggestions with integrated scoring from loyalty, compliance, risk, and reward systems."
      }
    };
  }

  async getTreasuryBrief() {
    return {
      type: "treasury",
      content: "Treasury Brief",
      data: {
        constitution: TREASURY_CONSTITUTION.articles.map(a => a.title),
        payoutRules: TREASURY_CONSTITUTION.payoutRules,
        recommendation: "Treasury operates under constitutional guidelines ensuring transparency, fairness, and stability."
      }
    };
  }

  async getComplianceBrief() {
    return {
      type: "compliance",
      content: "Compliance Brief",
      data: {
        scope: "Mode-specific, region-specific, and cargo-specific rules are actively enforced.",
        recommendation: "Run compliance checks before dispatch to identify potential issues early."
      }
    };
  }

  async getRiskBrief() {
    return {
      type: "risk",
      content: "Risk Radar Brief",
      data: {
        categories: ["Weather", "Lane", "Driver", "Compliance", "Market", "Operational"],
        recommendation: "Risk assessments are integrated into dispatch suggestions. High-risk scenarios trigger warnings and adjusted pricing recommendations."
      }
    };
  }

  async getMarketBrief() {
    return {
      type: "market",
      content: "Market Intelligence Brief",
      data: {
        sources: ["Freight rates", "Fuel prices", "Demand signals", "Weather", "Traffic", "Port status", "Partner boards"],
        recommendation: "Live intelligence feeds update every 60 seconds. Market conditions affect dispatch pricing and driver recommendations."
      }
    };
  }

  getGovernanceBrief() {
    const constitution = this.governance.getConstitution();
    return {
      type: "governance",
      content: "Governance Brief",
      data: {
        preamble: constitution.preamble,
        articles: constitution.articles.map(a => `${a.id}. ${a.title}`),
        recommendation: "The Constitution establishes sovereignty, transparency, fairness, excellence, security, and continuity as core principles."
      }
    };
  }

  getDriverCharterBrief() {
    const charter = this.governance.getDriverCharter();
    return {
      type: "charter",
      content: "Driver Charter Brief",
      data: {
        rights: charter.rights,
        responsibilities: charter.responsibilities,
        privileges: charter.privileges,
        recommendation: "The Driver Charter establishes citizenship rights within the Dynasty ecosystem."
      }
    };
  }

  getMinistriesBrief() {
    const ministries = this.governance.getMinistries();
    return {
      type: "ministries",
      content: "Ministry Framework",
      data: {
        ministries: Object.entries(ministries).map(([id, m]) => ({
          id,
          name: m.name,
          responsibilities: m.responsibilities.length
        })),
        recommendation: "Seven ministries organize Dynasty operations: Operations, Treasury, Compliance, Technology, Codex, Partnerships, and Identity."
      }
    };
  }

  getLaunchGuidance() {
    return {
      type: "guidance",
      content: "Launch Guidance",
      data: {
        stages: ["LOCAL (Home Base)", "NATIONWIDE (NA + EU)", "GLOBAL (All Regions)"],
        modes: ["GROUND", "AIR", "OCEAN", "COURIER"],
        regions: ["NORTH_AMERICA", "EUROPE", "ASIA_PACIFIC", "LATAM"],
        recommendation: "Activate modes first, then regions. Use staged launch for controlled expansion."
      }
    };
  }

  getCreditGuidance() {
    return {
      type: "guidance",
      content: "Credit System Guidance",
      data: {
        features: ["Driver credit lines", "40% advance limit", "Auto-repayment from payouts", "Tier-based limits"],
        recommendation: "Credit advances support driver cash flow. Higher loyalty tiers unlock increased credit limits."
      }
    };
  }

  getLoyaltyGuidance() {
    return {
      type: "guidance",
      content: "Loyalty System Guidance",
      data: {
        tiers: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DYNASTY_ELITE"],
        benefits: ["Dispatch priority", "Credit multipliers", "Fee discounts", "Exclusive rewards"],
        recommendation: "Drivers progress through tiers by completing loads, maintaining safety, and earning performance bonuses."
      }
    };
  }

  getHelpResponse() {
    return {
      type: "help",
      content: "Available Commands",
      data: {
        commands: [
          "status / overview - System status brief",
          "unassigned loads - Analyze pending loads",
          "driver suggestions - Get AI driver recommendations",
          "treasury / payouts - Treasury status",
          "compliance check - Compliance overview",
          "risk radar - Risk assessment",
          "market rates - Market intelligence",
          "constitution / governance - Governance framework",
          "driver charter - Driver rights and responsibilities",
          "ministries - Ministry framework",
          "launch status - Activation guidance",
          "credit / advance - Credit system",
          "loyalty / tiers - Loyalty program"
        ],
        recommendation: "I'm here to help you navigate the Dynasty OS. Ask me anything about operations, governance, or strategy."
      }
    };
  }

  getSessionContext() {
    return this.sessionContext;
  }
}

module.exports = {
  SingleOperatorPortal,
  OPERATOR_MODES,
  AI_GUIDANCE_PROMPTS,
  AI_ACTIONS
};
