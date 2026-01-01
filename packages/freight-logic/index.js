const { v4: uuid } = require("uuid");

const VALID_MODES = ["GROUND", "AIR", "OCEAN", "COURIER"];

class FreightEngine {
  createLoad(input) {
    const { shipperId, origin, destination, mode, budgetAmount, region } = input;

    if (!VALID_MODES.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    const now = new Date().toISOString();

    return {
      id: uuid(),
      shipperId,
      origin,
      destination,
      mode,
      region,
      budgetAmount,
      status: "CREATED",
      createdAt: now,
      updatedAt: now
    };
  }

  markInTransit(load) {
    return {
      ...load,
      status: "IN_TRANSIT",
      updatedAt: new Date().toISOString()
    };
  }

  markDelivered(load) {
    return {
      ...load,
      status: "DELIVERED",
      updatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  FreightEngine,
  VALID_MODES
};
