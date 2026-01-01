const { v4: uuid } = require("uuid");

class FreightEngine {
  createLoad(input) {
    const { shipperId, origin, destination, mode, budgetAmount } = input;
    const now = new Date().toISOString();

    return {
      id: uuid(),
      shipperId,
      origin,
      destination,
      mode,
      budgetAmount,
      status: "CREATED",
      createdAt: now,
      updatedAt: now
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

module.exports = { FreightEngine };
