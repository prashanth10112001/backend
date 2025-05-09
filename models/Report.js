const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    nodeValue: { type: String, default: "" },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    avgAQI: { type: Number, default: 0 },
    avgTemperature: { type: Number, default: 0 },
    avgHumidity: { type: Number, default: 0 },
    dominantPollutant: { type: String, default: "" },
    powerConsumption: { type: Number, default: 0 },
    summary: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
