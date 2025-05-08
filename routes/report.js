const express = require("express");
const router = express.Router();
const { getReports } = require("../controllers/ReportController");

router.get("/", getReports);

module.exports = router; // ✅ CommonJS export
