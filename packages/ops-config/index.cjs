const opsState = {
  modes: {
    GROUND: { ready: true, active: true },
    AIR: { ready: true, active: false },
    OCEAN: { ready: true, active: false },
    COURIER: { ready: true, active: false }
  },
  regions: {
    NORTH_AMERICA: { ready: true, active: true },
    EUROPE: { ready: true, active: false },
    ASIA_PACIFIC: { ready: false, active: false },
    LATAM: { ready: false, active: false }
  }
};

function getOpsStatus() {
  return opsState;
}

function activateMode(mode) {
  if (!opsState.modes[mode]) return false;
  opsState.modes[mode].active = true;
  return true;
}

function deactivateMode(mode) {
  if (!opsState.modes[mode]) return false;
  opsState.modes[mode].active = false;
  return true;
}

function activateRegion(region) {
  if (!opsState.regions[region]) return false;
  if (!opsState.regions[region].ready) return false;
  opsState.regions[region].active = true;
  return true;
}

module.exports = {
  getOpsStatus,
  activateMode,
  deactivateMode,
  activateRegion
};
