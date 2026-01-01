const express = require("express");
const loadsRoutes = require("./routes/loads.routes");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Borders Dynasty API" });
});

app.use("/loads", loadsRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Borders Dynasty API running on port ${port}`);
});
