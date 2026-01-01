const loads = [];

function createLoad(data) {
  const { origin, destination } = data;

  const load = {
    id: loads.length + 1,
    origin,
    destination,
    status: "CREATED",
    createdAt: new Date().toISOString()
  };

  loads.push(load);
  return load;
}

function getAllLoads() {
  return loads;
}

function getLoadById(id) {
  return loads.find(l => l.id === id);
}

function markDelivered(id) {
  const load = getLoadById(id);
  if (!load) return null;

  load.status = "DELIVERED";
  load.deliveredAt = new Date().toISOString();
  return load;
}

module.exports = {
  createLoad,
  getAllLoads,
  getLoadById,
  markDelivered
};
