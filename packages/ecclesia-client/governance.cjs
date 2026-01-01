const axios = require("axios");

const ECCLESIA_PUBLIC_URL = process.env.ECCLESIA_URL || "https://codex-ecclesia-public.com";
const DYNASTY_ID = "DYNASTY-BORDERS-001";

const GOVERNANCE_CORPUS = {
  constitution: {
    preamble: "The Borders Dynasty stands as a sovereign operating system for global logistics, bound by transparency, fairness, and operational excellence.",
    articles: [
      { id: "I", title: "Sovereignty", text: "All IP, governance rights, and operational protocols are held by the Private Ecclesia Trust." },
      { id: "II", title: "Transparency", text: "All treasury flows, dispatch decisions, and compliance checks are logged in the Codex." },
      { id: "III", title: "Fairness", text: "Drivers, partners, and the Dynasty receive predetermined, immutable shares of all transactions." },
      { id: "IV", title: "Excellence", text: "Performance is measured, rewarded, and continuously improved through data-driven systems." },
      { id: "V", title: "Security", text: "All operations are secured through cryptographic verification and role-based access." },
      { id: "VI", title: "Continuity", text: "The Codex ensures operational history survives any single point of failure." }
    ]
  },
  ministries: {
    OPERATIONS: { name: "Ministry of Operations", responsibilities: ["logistics", "dispatch", "driver network", "courier network", "exception management"] },
    TREASURY: { name: "Ministry of Treasury", responsibilities: ["payouts", "rewards", "credit", "treasury flows", "financial reporting"] },
    COMPLIANCE: { name: "Ministry of Compliance", responsibilities: ["regulatory alignment", "safety", "documentation", "audit", "chain-of-custody"] },
    TECHNOLOGY: { name: "Ministry of Technology", responsibilities: ["backend services", "frontend consoles", "driver app", "routing engine", "risk radar"] },
    CODEX: { name: "Ministry of Codex", responsibilities: ["event logging", "anchoring", "taxonomy", "archival integrity"] },
    PARTNERSHIPS: { name: "Ministry of Partnerships", responsibilities: ["fleets", "couriers", "shippers", "service providers", "marketplace ecosystem"] },
    IDENTITY: { name: "Ministry of Identity & Culture", responsibilities: ["scrolls", "symbols", "ceremonies", "heritage", "narrative cohesion"] }
  },
  roles: {
    OMEGA: { title: "Omega Sovereign", authority: "Full system authority, governance decisions, strategic direction" },
    OPS_DIRECTOR: { title: "Operations Director", authority: "Mode activation, region control, dispatch oversight" },
    TREASURY_KEEPER: { title: "Treasury Keeper", authority: "Payout approval, credit management, reserve allocation" },
    COMPLIANCE_OFFICER: { title: "Compliance Officer", authority: "Rule enforcement, exception approval, audit initiation" },
    CODEX_GUARDIAN: { title: "Codex Guardian", authority: "Event validation, anchor verification, archive maintenance" },
    PARTNER_LIAISON: { title: "Partner Liaison", authority: "Partner onboarding, performance review, marketplace curation" },
    DRIVER_AMBASSADOR: { title: "Driver Ambassador", authority: "Driver advocacy, loyalty program management, training coordination" }
  }
};

const TREASURY_CONSTITUTION = {
  articles: [
    { id: "I", title: "Transparency", text: "All treasury flows must be visible and auditable in the Codex." },
    { id: "II", title: "Predictability", text: "Payout rules are deterministic and immutable per contract terms." },
    { id: "III", title: "Fairness", text: "Dynasty fee is capped at 5%. Drivers receive minimum 95% of load value." },
    { id: "IV", title: "Stability", text: "Treasury maintains minimum 10% operational reserve at all times." },
    { id: "V", title: "Rewards", text: "Performance and loyalty are rewarded through tiered bonus structures." },
    { id: "VI", title: "Integration", text: "Treasury integrates with dispatch, compliance, Codex, credit, and partner marketplace." },
    { id: "VII", title: "Accountability", text: "All treasury actions are logged as Codex events with full audit trail." }
  ],
  payoutRules: {
    DYNASTY_FEE: 0.05,
    DRIVER_SHARE: 0.95,
    RESERVE_MINIMUM: 0.10,
    PAYOUT_CYCLE: "IMMEDIATE_ON_DELIVERY",
    ESCROW_REQUIRED: true
  }
};

const DRIVER_CHARTER = {
  rights: [
    "Transparent and predictable payouts within 24 hours of delivery confirmation",
    "Access to credit advances up to 40% of earned revenue",
    "Fair and performance-based reward distribution",
    "Clear expectations and scoring transparency",
    "Safety protections and compliance support",
    "Dispute resolution within 48 hours"
  ],
  responsibilities: [
    "Maintain safe driving practices and valid certifications",
    "Meet on-time delivery performance standards (minimum 90%)",
    "Accurate and timely documentation (POD, manifests, customs)",
    "Compliance with mode-specific and regional requirements",
    "Professional communication with shippers and recipients",
    "Participation in training and continuous improvement"
  ],
  privileges: [
    "Loyalty tier progression with increased benefits",
    "Priority dispatch access based on performance score",
    "Training access and skill development programs",
    "Ambassador roles and leadership opportunities",
    "Credit limit increases based on track record",
    "Fee discount progression (up to 15% at Dynasty Elite tier)"
  ]
};

const CODEX_EVENT_TAXONOMY = {
  categories: {
    DISPATCH: ["LOAD_CREATED", "DRIVER_ASSIGNED", "LOAD_IN_TRANSIT", "LOAD_DELIVERED", "DISPATCH_OVERRIDE"],
    TREASURY: ["ESCROW_DEPOSIT", "PAYOUT_ISSUED", "CREDIT_ADVANCE", "CREDIT_REPAYMENT", "REWARD_REDEEMED"],
    COMPLIANCE: ["COMPLIANCE_CHECK", "COMPLIANCE_EXCEPTION", "CERTIFICATION_VERIFIED", "DOCUMENTATION_UPLOADED"],
    GOVERNANCE: ["MODE_ACTIVATED", "REGION_ACTIVATED", "POLICY_UPDATED", "ROLE_ASSIGNED"],
    LOYALTY: ["POINTS_AWARDED", "TIER_UPGRADE", "BADGE_EARNED", "STREAK_MILESTONE"],
    SECURITY: ["ACCESS_GRANTED", "ACCESS_DENIED", "IP_BLOCKED", "ANOMALY_DETECTED"],
    ANCHOR: ["MERKLE_ROOT_ANCHORED", "BATCH_VERIFIED", "CHAIN_INTEGRITY_CHECK"]
  },
  severity: ["INFO", "NOTICE", "WARNING", "CRITICAL"],
  modules: ["DISPATCH", "TREASURY", "COMPLIANCE", "GOVERNANCE", "LOYALTY", "SECURITY", "CODEX", "LIVE_INTEL"]
};

class GovernanceClient {
  constructor(baseUrl = ECCLESIA_PUBLIC_URL) {
    this.baseUrl = baseUrl;
    this.dynastyId = DYNASTY_ID;
  }

  getConstitution() {
    return GOVERNANCE_CORPUS.constitution;
  }

  getMinistries() {
    return GOVERNANCE_CORPUS.ministries;
  }

  getMinistry(ministryId) {
    return GOVERNANCE_CORPUS.ministries[ministryId] || null;
  }

  getRoles() {
    return GOVERNANCE_CORPUS.roles;
  }

  getRole(roleId) {
    return GOVERNANCE_CORPUS.roles[roleId] || null;
  }

  getTreasuryConstitution() {
    return TREASURY_CONSTITUTION;
  }

  getDriverCharter() {
    return DRIVER_CHARTER;
  }

  getCodexTaxonomy() {
    return CODEX_EVENT_TAXONOMY;
  }

  async postGovernanceEvent(eventType, data, actor = "SYSTEM") {
    try {
      const event = {
        dynastyId: this.dynastyId,
        type: eventType,
        category: "GOVERNANCE",
        data,
        actor,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(`${this.baseUrl}/api/governance/events`, event, {
        timeout: 5000,
        headers: { "Content-Type": "application/json" }
      });

      console.log("[GOVERNANCE] Event posted:", { type: eventType, id: response.data?.id });
      return response.data;
    } catch (err) {
      console.log("[GOVERNANCE] Event logged locally:", { type: eventType });
      return { local: true, type: eventType, data, timestamp: new Date().toISOString() };
    }
  }

  async getGovernanceStatus() {
    return {
      dynastyId: this.dynastyId,
      constitution: "ACTIVE",
      ministries: Object.keys(GOVERNANCE_CORPUS.ministries).length,
      roles: Object.keys(GOVERNANCE_CORPUS.roles).length,
      treasuryArticles: TREASURY_CONSTITUTION.articles.length,
      driverRights: DRIVER_CHARTER.rights.length,
      codexCategories: Object.keys(CODEX_EVENT_TAXONOMY.categories).length,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = {
  GovernanceClient,
  GOVERNANCE_CORPUS,
  TREASURY_CONSTITUTION,
  DRIVER_CHARTER,
  CODEX_EVENT_TAXONOMY
};
