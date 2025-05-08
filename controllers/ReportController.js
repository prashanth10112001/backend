const Report = require("../models/Report");

const getReports = async (req, res) => {
  try {
    const { nodeValue } = req.query;
    console.log("nodeavlue in reports", nodeValue);

    const filter = nodeValue ? { nodeValue } : {};

    const reports = await Report.find(filter).sort({ startTime: -1 });

    res.status(200).json({ data: reports });
  } catch (err) {
    res.status(500).json({ message: "Error fetching reports", error: err });
  }
};

module.exports = { getReports };
