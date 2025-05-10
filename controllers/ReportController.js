const Report = require("../models/Report.js");
const DailyReport = require("../models/DailyReport.js");

const getReports = async (req, res) => {
  try {
    const { nodeValue } = req.query;

    const filter = nodeValue ? { nodeValue } : {};

    const reports = await Report.find(filter).sort({ startTime: -1 });

    res.status(200).json({ data: reports });
  } catch (err) {
    res.status(500).json({ message: "Error fetching reports", error: err });
  }
};

const getDailyReports = async (req, res) => {
  try {
    const { nodeValue } = req.query;

    const filter = {};
    if (nodeValue) filter.nodeValue = nodeValue;

    const reports = await DailyReport.find(filter).sort({ date: -1 });

    res.status(200).json({ data: reports });
  } catch (err) {
    console.error("Error fetching daily reports:", err);
    res
      .status(500)
      .json({ message: "Error fetching daily reports", error: err });
  }
};

module.exports = { getReports, getDailyReports };
