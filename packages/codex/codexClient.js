const axios = require("axios");

const CODEX_BASE = process.env.CODEX_URL || "http://localhost:3001";

async function codexLog(type, moduleName, data = {}, actor = "system") {
  try {
    const url = `${CODEX_BASE}/codex/records`;
    const res = await axios.post(url, {
      type,
      module: moduleName,
      actor,
      data
    });

    console.log("[CODEX_LOG_SUCCESS]", {
      type,
      module: moduleName,
      id: res.data.id,
      hash: res.data.hash
    });

    return res.data;
  } catch (err) {
    console.error("[CODEX_LOG_ERROR]", {
      message: err.message,
      type,
      module: moduleName
    });
    return null;
  }
}

module.exports = { codexLog };
