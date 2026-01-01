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
