const Report = require("../models/Report.js");
const DailyReport = require("../models/DailyReport.js");

// const getReports = async (req, res) => {
//   try {
//     const { nodeValue } = req.query;

//     const filter = nodeValue ? { nodeValue } : {};

//     const reports = await Report.find(filter).sort({ startTime: -1 });

//     res.status(200).json({ data: reports });
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching reports", error: err });
//   }
// };

// const getDailyReports = async (req, res) => {
//   try {
//     const { nodeValue } = req.query;

//     const filter = {};
//     if (nodeValue) filter.nodeValue = nodeValue;

//     const reports = await DailyReport.find(filter).sort({ date: -1 });

//     res.status(200).json({ data: reports });
//   } catch (err) {
//     console.error("Error fetching daily reports:", err);
//     res
//       .status(500)
//       .json({ message: "Error fetching daily reports", error: err });
//   }
// };

// module.exports = { getReports, getDailyReports };

const getReports = async (req, res) => {
  try {
    const { nodeValue, page = 1, limit = 10 } = req.query;
    const filter = nodeValue ? { nodeValue } : {};

    const totalCount = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      data: reports,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching reports", error: err });
  }
};

const getDailyReports = async (req, res) => {
  try {
    const { nodeValue, page = 1, limit = 10 } = req.query;
    const filter = nodeValue ? { nodeValue } : {};

    const totalCount = await DailyReport.countDocuments(filter);
    const reports = await DailyReport.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      data: reports,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching daily reports", error: err });
  }
};

module.exports = { getReports, getDailyReports };
