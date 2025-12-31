const crypto = require("crypto");

function verifySignature(req, secret) {
  const signature = req.headers["x-alchemy-signature"]; // Adjust header name per provider
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature === expected;
}

app.post("/webhook", (req, res) => {
  if (!verifySignature(req, process.env.WEBHOOK_SECRET)) {
    console.warn("❌ Invalid webhook signature");
    return res.sendStatus(401);
  }

  console.log("📡 Verified webhook received:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});
