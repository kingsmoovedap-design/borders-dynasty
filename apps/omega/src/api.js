const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchLoads() {
  const res = await fetch(`${API_BASE}/loads`);
  return res.json();
}

export async function fetchOpsStatus() {
  const res = await fetch(`${API_BASE}/ops/status`);
  return res.json();
}

export async function fetchTreasury() {
  const res = await fetch(`${API_BASE}/treasury/balance`);
  return res.json();
}

export async function fetchCreditLines() {
  const res = await fetch(`${API_BASE}/credit/lines`);
  return res.json();
}

export async function fetchOmegaView() {
  const res = await fetch(`${API_BASE}/loadboard/omega`);
  return res.json();
}

export async function fetchOpsView() {
  const res = await fetch(`${API_BASE}/loadboard/ops`);
  return res.json();
}

export async function fetchDispatchHistory() {
  const res = await fetch(`${API_BASE}/dispatch/history`);
  return res.json();
}

export async function fetchContracts() {
  const res = await fetch(`${API_BASE}/contracts`);
  return res.json();
}

export async function fetchDrivers() {
  const res = await fetch(`${API_BASE}/drivers`);
  if (!res.ok) return [];
  return res.json();
}

export async function activateMode(mode) {
  const res = await fetch(`${API_BASE}/ops/activate-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  return res.json();
}

export async function deactivateMode(mode) {
  const res = await fetch(`${API_BASE}/ops/deactivate-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  return res.json();
}

export async function activateRegion(region) {
  const res = await fetch(`${API_BASE}/ops/activate-region`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region })
  });
  return res.json();
}

export async function globalLaunch() {
  const res = await fetch(`${API_BASE}/ops/global-launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function stagedLaunch(stage) {
  const res = await fetch(`${API_BASE}/ops/staged-launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage })
  });
  return res.json();
}

export async function fetchDispatchSuggestions(loadId) {
  const res = await fetch(`${API_BASE}/dispatch/suggest/${loadId}`);
  return res.json();
}

export async function assignDriver(loadId, driverId, method = 'OMEGA_MANUAL') {
  const res = await fetch(`${API_BASE}/dispatch/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loadId, driverId, method })
  });
  return res.json();
}

export async function createLoad(data) {
  const res = await fetch(`${API_BASE}/loads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function registerDriver(data) {
  const res = await fetch(`${API_BASE}/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function markDelivered(loadId) {
  const res = await fetch(`${API_BASE}/loads/${loadId}/delivered`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function fetchSecurityStatus() {
  const res = await fetch(`${API_BASE}/security/status`);
  return res.json();
}

export async function fetchSecurityEvents(limit = 50) {
  const res = await fetch(`${API_BASE}/security/events?limit=${limit}`);
  return res.json();
}

export async function blockIP(ip, reason) {
  const res = await fetch(`${API_BASE}/security/block-ip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, reason })
  });
  return res.json();
}

export async function unblockIP(ip) {
  const res = await fetch(`${API_BASE}/security/unblock-ip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip })
  });
  return res.json();
}

export async function fetchDispatchPartners() {
  const res = await fetch(`${API_BASE}/devine-dispatch/partners`);
  return res.json();
}

export async function gatherExternalContracts(partnerId = null) {
  const res = await fetch(`${API_BASE}/devine-dispatch/gather`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partnerId ? { partnerId } : {})
  });
  return res.json();
}

export async function fetchGatheredContracts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.mode) params.set('mode', filters.mode);
  if (filters.redirected !== undefined) params.set('redirected', filters.redirected);
  if (filters.minScore) params.set('minScore', filters.minScore);
  const res = await fetch(`${API_BASE}/devine-dispatch/contracts?${params}`);
  return res.json();
}

export async function fetchQualifiedContracts() {
  const res = await fetch(`${API_BASE}/devine-dispatch/qualified`);
  return res.json();
}

export async function convertExternalContract(contractId) {
  const res = await fetch(`${API_BASE}/devine-dispatch/convert/${contractId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function fetchDispatchStats() {
  const res = await fetch(`${API_BASE}/devine-dispatch/stats`);
  return res.json();
}

export async function fetchTokenTreasuryStats() {
  const res = await fetch(`${API_BASE}/token/treasury/stats`);
  return res.json();
}

export async function fetchTokenTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.loadId) params.set('loadId', filters.loadId);
  if (filters.limit) params.set('limit', filters.limit);
  const res = await fetch(`${API_BASE}/token/transactions?${params}`);
  return res.json();
}

export async function depositEscrow(loadId, amount, depositorAddress) {
  const res = await fetch(`${API_BASE}/token/escrow/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loadId, amount, depositorAddress })
  });
  return res.json();
}

export async function processTokenPayout(loadId, driverWallet) {
  const res = await fetch(`${API_BASE}/token/payout/${loadId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverWallet })
  });
  return res.json();
}

export async function fetchIntelStatus() {
  const res = await fetch(`${API_BASE}/intel/status`);
  return res.json();
}

export async function fetchAllIntel() {
  const res = await fetch(`${API_BASE}/intel/all`);
  return res.json();
}

export async function fetchMarketIntel() {
  const res = await fetch(`${API_BASE}/intel/market`);
  return res.json();
}

export async function fetchOperationalIntel() {
  const res = await fetch(`${API_BASE}/intel/operational`);
  return res.json();
}

export async function fetchPartnerIntel() {
  const res = await fetch(`${API_BASE}/intel/partners`);
  return res.json();
}

export async function fetchIntelAlerts(limit = 50) {
  const res = await fetch(`${API_BASE}/intel/alerts?limit=${limit}`);
  return res.json();
}

export async function fetchDispatchAdjustments(region, mode) {
  const res = await fetch(`${API_BASE}/intel/dispatch/${region}/${mode}`);
  return res.json();
}

export async function fetchTreasuryIntel() {
  const res = await fetch(`${API_BASE}/intel/treasury`);
  return res.json();
}

export async function fetchGovernance() {
  const res = await fetch(`${API_BASE}/governance/constitution`);
  return res.json();
}
