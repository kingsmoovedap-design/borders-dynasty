const express = require("express");
const {
  createLoadHandler,
  getLoadsHandler,
  getLoadByIdHandler,
  markDeliveredHandler
} = require("../controllers/loads.controller");

const router = express.Router();

router.post("/", createLoadHandler);
router.get("/", getLoadsHandler);
router.get("/:id", getLoadByIdHandler);
router.post("/:id/delivered", markDeliveredHandler);

module.exports = router;
