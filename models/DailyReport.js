const mongoose = require("mongoose");

const quarterSchema = new mongoose.Schema({
  startTime: String,
  endTime: String,
  avgAQI: Number,
  avgTemperature: Number,
  avgHumidity: Number,
  dominantPollutant: String,
  summary: String,
  powerConsumption: String,
});

const dailyReportSchema = new mongoose.Schema({
  nodeValue: { type: String, required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  quarters: [quarterSchema],
});

module.exports = mongoose.model("DailyReport", dailyReportSchema);
