const express = require("express");
const router = express.Router();
const {
  getReports,
  getDailyReports,
} = require("../controllers/ReportController.js");

router.get("/", getReports);
router.get("/dailyReport", getDailyReports);

module.exports = router; // ✅ CommonJS export
