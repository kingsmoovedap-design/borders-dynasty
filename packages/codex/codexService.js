const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const codexRecords = [];
const anchors = [];

function computeHash(obj) {
  const str = JSON.stringify(obj);
  return crypto.createHash("sha256").update(str).digest("hex");
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Codex Ecclesia" });
});

app.get("/codex/health", (req, res) => {
  res.json({ status: "ok", service: "Codex Ecclesia" });
});

app.post("/codex/records", (req, res) => {
  const { type, module, actor, data } = req.body;

  if (!type || !module) {
    return res.status(400).json({ error: "type and module are required" });
  }

  const timestamp = new Date().toISOString();
  const prev = codexRecords[codexRecords.length - 1];

  const record = {
    id: codexRecords.length + 1,
    type,
    module,
    actor: actor || "system",
    timestamp,
    data: data || {},
    prevHash: prev ? prev.hash : null
  };

  record.hash = computeHash(record);
  codexRecords.push(record);

  console.log("[CODEX] New record:", record);

  res.status(201).json(record);
});

app.get("/codex/records", (req, res) => {
  res.json(codexRecords);
});

app.post("/codex/anchors", (req, res) => {
  if (codexRecords.length === 0) {
    return res.status(400).json({ error: "No records to anchor" });
  }

  const rootHash = computeHash(codexRecords);
  const anchor = {
    id: anchors.length + 1,
    rootHash,
    timestamp: new Date().toISOString()
  };

  anchors.push(anchor);
  console.log("[ANCHOR] New anchor:", anchor);

  res.status(201).json(anchor);
});

app.get("/codex/anchors", (req, res) => {
  res.json(anchors);
});

const port = 3001;
app.listen(port, () => {
  console.log(`Codex Ecclesia running on port ${port}`);
});
