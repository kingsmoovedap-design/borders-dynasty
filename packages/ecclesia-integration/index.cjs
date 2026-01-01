"use strict";

const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const dbPersistence = require("./db-persistence.cjs");

const ECCLESIA_CONFIG = {
  baseUrl: "https://codex-ecclesia-public.com",
  endpoints: {
    scrolls: "/api/scrolls",
    verify: "/verify-scroll.html",
    constitution: "/codex-constitution.html",
    omega: "/omega-portal.html",
    trustees: "/trustees-portal.html",
    heirs: "/heirs-portal.html",
    logistics: "/logistics-dynasty.html",
    bsc: "/borders-sovereign-coin.html",
    codexchain: "/codexchain-console.html",
    mintingAltar: "/minting-altar.html",
  },
  portals: [
    { id: "OMEGA", name: "Omega Portal", url: "/omega-portal.html", icon: "☩", purpose: "Document Drafting & Governance" },
    { id: "TRUSTEES", name: "Trustees Portal", url: "/trustees-portal.html", icon: "⚖️", purpose: "Trust Administration" },
    { id: "HEIRS", name: "Heirs Portal", url: "/heirs-portal.html", icon: "👑", purpose: "Nation Claiming & Inheritance" },
    { id: "LOGISTICS", name: "Logistics Dynasty", url: "/logistics-dynasty.html", icon: "🚚", purpose: "Supply Chain Platform" },
    { id: "BSC", name: "BSC Treasury", url: "/borders-sovereign-coin.html", icon: "🪙", purpose: "Sovereign Coin & Wallet" },
    { id: "CODEXCHAIN", name: "CodexChain", url: "/codexchain-console.html", icon: "🔗", purpose: "Blockchain Console" },
  ],
  compliance: {
    qfsCompatible: true,
    iso20022Ready: true,
    goldBackedSync: true,
  },
};

const SCROLL_TYPES = [
  { id: "DECREE", name: "Decree", authority: "MONARCH", requiresWitness: true },
  { id: "CONTRACT", name: "Contract", authority: "MINISTRY", requiresWitness: true },
  { id: "CHARTER", name: "Charter", authority: "ECCLESIA", requiresWitness: true },
  { id: "AMENDMENT", name: "Amendment", authority: "COUNCIL", requiresWitness: true },
  { id: "RECORD", name: "Record", authority: "SCRIBE", requiresWitness: false },
  { id: "VERIFICATION", name: "Verification", authority: "SYSTEM", requiresWitness: false },
  { id: "TRANSACTION", name: "Transaction", authority: "TREASURY", requiresWitness: false },
  { id: "DISPATCH", name: "Dispatch", authority: "LOGISTICS", requiresWitness: false },
];

const MINISTRIES = [
  { id: "TREASURY", name: "Ministry of Treasury", jurisdiction: ["BSC", "PAYMENTS", "ESCROW", "BUYBACKS"] },
  { id: "LOGISTICS", name: "Ministry of Logistics", jurisdiction: ["FREIGHT", "DISPATCH", "COURIER", "RETURNS"] },
  { id: "COMMERCE", name: "Ministry of Commerce", jurisdiction: ["CONTRACTS", "PARTNERS", "RATES"] },
  { id: "JUSTICE", name: "Ministry of Justice", jurisdiction: ["COMPLIANCE", "DISPUTES", "BLACKLIST"] },
  { id: "INTELLIGENCE", name: "Ministry of Intelligence", jurisdiction: ["AI", "ANALYTICS", "RISK"] },
  { id: "TECHNOLOGY", name: "Ministry of Technology", jurisdiction: ["BLOCKCHAIN", "BRIDGE", "INTEGRATIONS"] },
];

const ANCHOR_CATEGORIES = [
  { id: "GOVERNANCE", events: ["DECREE_ISSUED", "CHARTER_AMENDED", "ROLE_ASSIGNED"] },
  { id: "TREASURY", events: ["TOKEN_MINTED", "BUYBACK_COMPLETED", "PAYOUT_PROCESSED", "ESCROW_RELEASED"] },
  { id: "LOGISTICS", events: ["LOAD_CREATED", "DISPATCH_ASSIGNED", "DELIVERY_COMPLETED", "RETURN_PROCESSED"] },
  { id: "COMPLIANCE", events: ["COMPLIANCE_CHECK", "EXCEPTION_GRANTED", "BLACKLIST_ADDED"] },
  { id: "BRIDGE", events: ["BRIDGE_INITIATED", "BRIDGE_COMPLETED", "FIAT_TRANSACTION"] },
  { id: "PARTNER", events: ["PARTNER_REGISTERED", "CONTRACT_CAPTURED", "ALLOCATION_MADE"] },
];

const pendingAnchors = new Map();
const anchoredScrolls = new Map();

function generateHash(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

function createAnchorPayload(eventType, module, data, category) {
  const timestamp = new Date().toISOString();
  const payload = {
    eventType,
    module,
    category,
    data,
    timestamp,
    nonce: uuidv4(),
  };
  
  return {
    ...payload,
    hash: generateHash(payload),
  };
}

async function anchorToEcclesia(eventType, module, data, category) {
  const payload = createAnchorPayload(eventType, module, data, category);
  
  const anchor = {
    id: `ANCHOR-${uuidv4().slice(0, 8).toUpperCase()}`,
    eventType,
    module,
    category,
    localHash: payload.hash,
    ecclesiaScrollId: null,
    ecclesiaHash: null,
    anchorStatus: "PENDING",
    retryCount: 0,
    payload,
    createdAt: new Date(),
    anchoredAt: null,
  };
  
  pendingAnchors.set(anchor.id, anchor);
  
  try {
    const scrollId = `SCROLL-${uuidv4().slice(0, 12).toUpperCase()}`;
    const ecclesiaHash = generateHash({ scrollId, ...payload });
    
    anchor.ecclesiaScrollId = scrollId;
    anchor.ecclesiaHash = ecclesiaHash;
    anchor.anchorStatus = "ANCHORED";
    anchor.anchoredAt = new Date();
    
    pendingAnchors.delete(anchor.id);
    anchoredScrolls.set(anchor.id, anchor);
    
    try {
      await dbPersistence.persistAnchor(anchor);
    } catch (err) {
      console.error("Failed to persist anchor:", err.message);
    }
    
    return { success: true, anchor };
  } catch (error) {
    anchor.anchorStatus = "FAILED";
    anchor.retryCount++;
    pendingAnchors.set(anchor.id, anchor);
    return { success: false, error: error.message, anchor };
  }
}

async function verifyScroll(scrollId, hash) {
  const anchor = Array.from(anchoredScrolls.values())
    .find(a => a.ecclesiaScrollId === scrollId);
  
  if (!anchor) {
    return { success: false, error: "Scroll not found", verified: false };
  }
  
  const isValid = anchor.ecclesiaHash === hash || anchor.localHash === hash;
  
  return {
    success: true,
    verified: isValid,
    scroll: {
      id: anchor.ecclesiaScrollId,
      hash: anchor.ecclesiaHash,
      eventType: anchor.eventType,
      module: anchor.module,
      anchoredAt: anchor.anchoredAt,
    },
    verificationUrl: `${ECCLESIA_CONFIG.baseUrl}${ECCLESIA_CONFIG.endpoints.verify}?id=${scrollId}`,
  };
}

function getEcclesiaConfig() {
  return ECCLESIA_CONFIG;
}

function getScrollTypes() {
  return SCROLL_TYPES;
}

function getMinistries() {
  return MINISTRIES;
}

function getAnchorCategories() {
  return ANCHOR_CATEGORIES;
}

function getPortals() {
  return ECCLESIA_CONFIG.portals;
}

function getPortalUrl(portalId) {
  const portal = ECCLESIA_CONFIG.portals.find(p => p.id === portalId);
  if (!portal) return null;
  return `${ECCLESIA_CONFIG.baseUrl}${portal.url}`;
}

function getPendingAnchors() {
  return Array.from(pendingAnchors.values());
}

function getAnchoredScrolls(filters = {}) {
  let result = Array.from(anchoredScrolls.values());
  
  if (filters.category) {
    result = result.filter(a => a.category === filters.category);
  }
  if (filters.module) {
    result = result.filter(a => a.module === filters.module);
  }
  if (filters.eventType) {
    result = result.filter(a => a.eventType === filters.eventType);
  }
  
  return result.sort((a, b) => b.anchoredAt - a.anchoredAt).slice(0, filters.limit || 100);
}

function getAnchor(anchorId) {
  return anchoredScrolls.get(anchorId) || pendingAnchors.get(anchorId) || null;
}

async function retryFailedAnchors() {
  const failed = Array.from(pendingAnchors.values())
    .filter(a => a.anchorStatus === "FAILED" && a.retryCount < 5);
  
  const results = [];
  for (const anchor of failed) {
    const result = await anchorToEcclesia(
      anchor.eventType, 
      anchor.module, 
      anchor.payload.data, 
      anchor.category
    );
    results.push(result);
  }
  
  return { retried: failed.length, results };
}

function getEcclesiaStats() {
  const anchored = Array.from(anchoredScrolls.values());
  const pending = Array.from(pendingAnchors.values());
  
  const byCategory = {};
  for (const cat of ANCHOR_CATEGORIES) {
    byCategory[cat.id] = anchored.filter(a => a.category === cat.id).length;
  }
  
  const byModule = {};
  for (const a of anchored) {
    byModule[a.module] = (byModule[a.module] || 0) + 1;
  }
  
  return {
    totalAnchored: anchored.length,
    pendingAnchors: pending.filter(a => a.anchorStatus === "PENDING").length,
    failedAnchors: pending.filter(a => a.anchorStatus === "FAILED").length,
    byCategory,
    byModule,
    lastAnchor: anchored.length > 0 ? anchored.sort((a, b) => b.anchoredAt - a.anchoredAt)[0].anchoredAt : null,
    ecclesiaUrl: ECCLESIA_CONFIG.baseUrl,
    compliance: ECCLESIA_CONFIG.compliance,
  };
}

function buildGovernanceLink(action, params = {}) {
  const portal = ECCLESIA_CONFIG.portals.find(p => p.id === "OMEGA");
  if (!portal) return null;
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  
  return `${ECCLESIA_CONFIG.baseUrl}${portal.url}${queryString ? "?" + queryString : ""}`;
}

function buildBSCLink(action = "transfer", params = {}) {
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  
  return `${ECCLESIA_CONFIG.baseUrl}${ECCLESIA_CONFIG.endpoints.bsc}${queryString ? "?" + queryString : ""}`;
}

module.exports = {
  getEcclesiaConfig,
  getScrollTypes,
  getMinistries,
  getAnchorCategories,
  getPortals,
  getPortalUrl,
  anchorToEcclesia,
  verifyScroll,
  getPendingAnchors,
  getAnchoredScrolls,
  getAnchor,
  retryFailedAnchors,
  getEcclesiaStats,
  buildGovernanceLink,
  buildBSCLink,
  generateHash,
};
