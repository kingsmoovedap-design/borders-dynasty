const http = require("http");
const assert = require("assert");

const options = {
  hostname: "localhost",
  port: process.env.PORT || 3000,
  path: "/health",
  method: "GET",
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(data, "OK");
    console.log("✅ /health endpoint passed");
  });
});

req.on("error", (error) => {
  console.error("❌ Test failed:", error.message);
});

req.end();
