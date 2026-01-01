const {
  createLoad,
  getAllLoads,
  getLoadById,
  markDelivered
} = require("../services/loads.service");

const { codexLog } = require("../codex/codexClient");

async function createLoadHandler(req, res) {
  const { origin, destination } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: "origin and destination are required" });
  }

  const load = createLoad({ origin, destination });

  await codexLog("LOAD_CREATED", "LOGISTICS", {
    loadId: load.id,
    origin,
    destination
  }, "omega");

  res.status(201).json(load);
}

async function getLoadsHandler(req, res) {
  const list = getAllLoads();
  res.json(list);
}

async function getLoadByIdHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  const load = getLoadById(id);

  if (!load) {
    return res.status(404).json({ error: "Load not found" });
  }

  res.json(load);
}

async function markDeliveredHandler(req, res) {
  const id = parseInt(req.params.id, 10);
  const load = markDelivered(id);

  if (!load) {
    return res.status(404).json({ error: "Load not found" });
  }

  await codexLog("LOAD_DELIVERED", "LOGISTICS", { loadId: load.id }, "omega");

  res.json(load);
}

module.exports = {
  createLoadHandler,
  getLoadsHandler,
  getLoadByIdHandler,
  markDeliveredHandler
};
