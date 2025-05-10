// const cron = require("node-cron");
// const Node = require("../models/Node.js");
// const DailyReport = require("../models/DailyReport.js");

// const { generateDailyReportPDFBuffer } = require("../utils/pdfGenerator.js");
// const { sendDailyReportEmailBuffer } = require("../utils/mailer.js");

// const pad = (n) => String(n).padStart(2, "0");

// const formatDate = (date) => {
//   return (
//     `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
//       date.getDate()
//     )} ` +
//     `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
//       date.getSeconds()
//     )}`
//   );
// };

// // Dominant pollutant logic (unchanged)
// function getDominantPollutant(dataArray) {
//   const lookupTable = {
//     pm10: [
//       [-1, 50],
//       [51, 100],
//       [101, 250],
//       [251, 350],
//       [351, 430],
//       [430, Infinity],
//     ],
//     pm2_5: [
//       [-1, 30],
//       [31, 60],
//       [61, 90],
//       [91, 120],
//       [121, 250],
//       [250, Infinity],
//     ],
//     co: [
//       [-1, 1.0],
//       [1.0, 2.0],
//       [2.0, 10],
//       [10, 17],
//       [17, 34],
//       [34, Infinity],
//     ],
//     voc: [
//       [-1, 0.3],
//       [0.3, 0.5],
//       [0.5, 0.8],
//       [0.8, 1.0],
//       [1.0, 3.0],
//       [3.0, Infinity],
//     ],
//     co2: [
//       [-1, 400],
//       [400, 1000],
//       [1000, 1500],
//       [1500, 2000],
//       [2000, 5000],
//       [5000, Infinity],
//     ],
//     no2: [
//       [-1, 100],
//       [100, 200],
//       [200, 400],
//       [400, 600],
//       [600, 800],
//       [800, Infinity],
//     ],
//   };

//   const priorityOrder = ["pm2_5", "pm10", "co", "no2", "voc", "co2"];
//   const avgValues = {};

//   for (const pollutant of Object.keys(lookupTable)) {
//     let sum = 0,
//       count = 0;
//     dataArray.forEach((entry) => {
//       const val = entry.data[pollutant];
//       if (typeof val === "number") {
//         sum += val;
//         count++;
//       }
//     });
//     avgValues[pollutant] = count ? sum / count : -1;
//   }

//   const levels = {};
//   for (const [pollutant, avg] of Object.entries(avgValues)) {
//     const ranges = lookupTable[pollutant];
//     let level = -1;
//     for (let i = 0; i < ranges.length; i++) {
//       const [min, max] = ranges[i];
//       if (avg > min && avg <= max) {
//         level = i + 1;
//         break;
//       }
//     }
//     levels[pollutant] = level;
//   }

//   const maxLevel = Math.max(...Object.values(levels));
//   const tied = Object.entries(levels)
//     .filter(([_, lvl]) => lvl === maxLevel)
//     .map(([k]) => k);

//   for (const p of priorityOrder) {
//     if (tied.includes(p)) return p.toUpperCase();
//   }
//   return tied[0]?.toUpperCase() || "UNKNOWN";
// }

// // ⏰ Schedule: run daily at 00:10 AM
// cron.schedule("*/1 * * * *", async () => {
//   // cron.schedule("10 0 * * *", async () => {
//   try {
//     const now = new Date();
//     const reportDate = new Date(now);
//     reportDate.setDate(reportDate.getDate() - 1);
//     reportDate.setHours(0, 0, 0, 0);

//     const startTime = new Date(reportDate);
//     const endTime = new Date(reportDate.getTime() + 24 * 60 * 60 * 1000 - 1);

//     const formattedStart = formatDate(startTime);
//     const formattedEnd = formatDate(endTime);

//     const deviceData = await Node.find({
//       "activityData.timestamp": {
//         $gte: formattedStart,
//         $lte: formattedEnd,
//       },
//       isDeleted: { $ne: true },
//     });

//     console.log(
//       "📆 Querying full day data between:",
//       formattedStart,
//       "→",
//       formattedEnd,
//       "->",
//       deviceData.length
//     );

//     if (!deviceData.length) {
//       return console.log("❌ No data found for daily report.");
//     }

//     const deviceGroups = {};
//     deviceData.forEach((doc) => {
//       const id = doc.nodeValue;
//       if (!deviceGroups[id]) deviceGroups[id] = [];
//       deviceGroups[id].push(doc.activityData);
//     });

//     for (const nodeValue in deviceGroups) {
//       const records = deviceGroups[nodeValue].flat();

//       const quarters = [
//         [0, 6],
//         [6, 12],
//         [12, 18],
//         [18, 24],
//       ];

//       const quarterSummaries = quarters.map(([startHour, endHour]) => {
//         const qStart = new Date(reportDate);
//         qStart.setHours(startHour, 0, 0, 0);
//         const qEnd = new Date(reportDate);
//         qEnd.setHours(endHour, 0, 0, 0);

//         const quarterData = records.filter((entry) => {
//           const t = new Date(entry.timestamp);
//           return t >= qStart && t < qEnd;
//         });

//         const avg = (arr, key) =>
//           arr.reduce((sum, val) => sum + (val.data[key] || 0), 0) /
//           (arr.length || 1);

//         const avgAQI =
//           quarterData.reduce((sum, val) => {
//             const c = val.calculated || {};
//             return (
//               sum +
//               ((c.aqi_dust || 0) +
//                 (c.aqi_co || 0) +
//                 (c.aqi_voc || 0) +
//                 (c.aqi_co2 || 0)) /
//                 4
//             );
//           }, 0) / (quarterData.length || 1);

//         return {
//           quarter: `${startHour}-${endHour}`,
//           startTime: qStart,
//           endTime: qEnd,
//           avgAQI,
//           avgTemperature: avg(quarterData, "temperature"),
//           avgHumidity: avg(quarterData, "humidity"),
//           dominantPollutant: getDominantPollutant(quarterData),
//           powerConsumption: (Math.random() * 10 + 5).toFixed(2),
//           summary:
//             avgAQI <= 1
//               ? "Good"
//               : avgAQI === 2
//               ? "Moderate"
//               : avgAQI === 3
//               ? "Satisfactory"
//               : avgAQI === 4
//               ? "Poor"
//               : avgAQI === 5
//               ? "Very Poor"
//               : "Severe",
//         };
//       });

//       const formattedDate = formatDate(reportDate);
//       const report = new DailyReport({
//         nodeValue,
//         date: formattedDate,
//         quarterSummaries,
//       });

//       await report.save();

//       const pdfBuffer = await generateDailyReportPDFBuffer(report);
//       await sendDailyReportEmailBuffer(
//         pdfBuffer,
//         `Daily Report - ${nodeValue}`,
//         nodeValue
//       );
//       console.log(`✅ Report emailed for ${nodeValue}`);
//     }
//   } catch (err) {
//     console.error("❌ Error generating/sending daily report:", err.message);
//   }
// });

// const cron = require("node-cron");
// const Node = require("../models/Node.js");
// const DailyReport = require("../models/DailyReport.js");
// const { generateDailyReportPDFBuffer } = require("../utils/pdfGenerator.js");
// const { sendDailyReportEmailBuffer } = require("../utils/mailer.js");

// const pad = (n) => String(n).padStart(2, "0");

// const formatDate = (date) => {
//   return (
//     `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
//       date.getDate()
//     )} ` +
//     `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
//       date.getSeconds()
//     )}`
//   );
// };

// function getDominantPollutant(dataArray) {
//   const lookupTable = {
//     pm10: [
//       [-1, 50],
//       [51, 100],
//       [101, 250],
//       [251, 350],
//       [351, 430],
//       [430, Infinity],
//     ],
//     pm2_5: [
//       [-1, 30],
//       [31, 60],
//       [61, 90],
//       [91, 120],
//       [121, 250],
//       [250, Infinity],
//     ],
//     co: [
//       [-1, 1.0],
//       [1.0, 2.0],
//       [2.0, 10],
//       [10, 17],
//       [17, 34],
//       [34, Infinity],
//     ],
//     voc: [
//       [-1, 0.3],
//       [0.3, 0.5],
//       [0.5, 0.8],
//       [0.8, 1.0],
//       [1.0, 3.0],
//       [3.0, Infinity],
//     ],
//     co2: [
//       [-1, 400],
//       [400, 1000],
//       [1000, 1500],
//       [1500, 2000],
//       [2000, 5000],
//       [5000, Infinity],
//     ],
//     no2: [
//       [-1, 100],
//       [100, 200],
//       [200, 400],
//       [400, 600],
//       [600, 800],
//       [800, Infinity],
//     ],
//   };

//   const priorityOrder = ["pm2_5", "pm10", "co", "no2", "voc", "co2"];
//   const avgValues = {};

//   for (const pollutant of Object.keys(lookupTable)) {
//     let sum = 0,
//       count = 0;
//     dataArray.forEach((entry) => {
//       const val = entry.data[pollutant];
//       if (typeof val === "number") {
//         sum += val;
//         count++;
//       }
//     });
//     avgValues[pollutant] = count ? sum / count : -1;
//   }

//   const levels = {};
//   for (const [pollutant, avg] of Object.entries(avgValues)) {
//     const ranges = lookupTable[pollutant];
//     let level = -1;
//     for (let i = 0; i < ranges.length; i++) {
//       const [min, max] = ranges[i];
//       if (avg > min && avg <= max) {
//         level = i + 1;
//         break;
//       }
//     }
//     levels[pollutant] = level;
//   }

//   const maxLevel = Math.max(...Object.values(levels));
//   const tied = Object.entries(levels)
//     .filter(([_, lvl]) => lvl === maxLevel)
//     .map(([k]) => k);

//   for (const p of priorityOrder) {
//     if (tied.includes(p)) return p.toUpperCase();
//   }
//   return tied[0]?.toUpperCase() || "UNKNOWN";
// }

// // ⏰ Schedule: run daily at 00:10 AM
// cron.schedule("*/1 * * * *", async () => {
//   // cron.schedule("10 0 * * *", async () => {
//   try {
//     const now = new Date();
//     const reportDate = new Date(now);
//     reportDate.setDate(reportDate.getDate() - 1);
//     reportDate.setHours(0, 0, 0, 0);

//     const startTime = new Date(reportDate);
//     const endTime = new Date(reportDate.getTime() + 24 * 60 * 60 * 1000 - 1);

//     const formattedStart = formatDate(startTime);
//     const formattedEnd = formatDate(endTime);

//     const deviceData = await Node.find({
//       "activityData.timestamp": {
//         $gte: formattedStart,
//         $lte: formattedEnd,
//       },
//       isDeleted: { $ne: true },
//     });

//     console.log(
//       "📆 Querying full day data between:",
//       formattedStart,
//       "→",
//       formattedEnd,
//       "->",
//       deviceData.length,
//       "->",
//       deviceData[0]
//     );

//     if (!deviceData.length) {
//       return console.log("❌ No data found for daily report.");
//     }

//     const deviceGroups = {};
//     // deviceData.forEach((doc) => {
//     //   const id = doc.nodeValue;
//     //   if (!deviceGroups[id]) deviceGroups[id] = [];
//     //   doc.activityData.forEach((entry) => {
//     //     const timestamp = new Date(entry.timestamp);
//     //     if (timestamp >= startTime && timestamp <= endTime) {
//     //       deviceGroups[id].push(entry);
//     //     }
//     //   });
//     // });

//     deviceData.forEach((doc) => {
//       const id = doc.nodeValue;
//       if (!deviceGroups[id]) deviceGroups[id] = [];

//       // ✅ Fix here
//       if (Array.isArray(doc.activityData)) {
//         doc.activityData.forEach((entry) => {
//           const timestamp = new Date(entry.timestamp);
//           if (timestamp >= startTime && timestamp <= endTime) {
//             deviceGroups[id].push(entry);
//           }
//         });
//       }
//     });

//     console.log("Device groups ", deviceGroups.length);

//     for (const nodeValue in deviceGroups) {
//       const records = deviceGroups[nodeValue];

//       const quarters = [
//         [0, 6],
//         [6, 12],
//         [12, 18],
//         [18, 24],
//       ];

//       const quarterSummaries = quarters.map(([startHour, endHour]) => {
//         const qStart = new Date(reportDate);
//         qStart.setHours(startHour, 0, 0, 0);
//         const qEnd = new Date(reportDate);
//         qEnd.setHours(endHour, 0, 0, 0);

//         const quarterData = records.filter((entry) => {
//           const t = new Date(entry.timestamp);
//           return t >= qStart && t < qEnd;
//         });

//         const avg = (arr, key) =>
//           arr.reduce((sum, val) => sum + (val.data[key] || 0), 0) /
//           (arr.length || 1);

//         const avgAQI =
//           quarterData.reduce((sum, val) => {
//             const c = val.calculated || {};
//             return (
//               sum +
//               ((c.aqi_dust || 0) +
//                 (c.aqi_co || 0) +
//                 (c.aqi_voc || 0) +
//                 (c.aqi_co2 || 0)) /
//                 4
//             );
//           }, 0) / (quarterData.length || 1);

//         return {
//           quarter: `${startHour}-${endHour}`,
//           startTime: qStart,
//           endTime: qEnd,
//           avgAQI,
//           avgTemperature: avg(quarterData, "temperature"),
//           avgHumidity: avg(quarterData, "humidity"),
//           dominantPollutant: getDominantPollutant(quarterData),
//           powerConsumption: (Math.random() * 10 + 5).toFixed(2),
//           summary:
//             avgAQI <= 1
//               ? "Good"
//               : avgAQI === 2
//               ? "Moderate"
//               : avgAQI === 3
//               ? "Satisfactory"
//               : avgAQI === 4
//               ? "Poor"
//               : avgAQI === 5
//               ? "Very Poor"
//               : "Severe",
//         };
//       });

//       const formattedDate = formatDate(reportDate);
//       const report = new DailyReport({
//         nodeValue,
//         date: formattedDate,
//         quarterSummaries,
//       });

//       await report.save();

//       const pdfBuffer = await generateDailyReportPDFBuffer(report);
//       await sendDailyReportEmailBuffer(
//         pdfBuffer,
//         `Daily Report - ${nodeValue}`,
//         nodeValue
//       );
//       console.log(`✅ Report emailed for ${nodeValue}`);
//     }
//   } catch (err) {
//     console.error("❌ Error generating/sending daily report:", err.message);
//   }
// });

const cron = require("node-cron");
const Node = require("../models/Node.js");
const DailyReport = require("../models/DailyReport.js");
const { generateDailyReportPDFBuffer } = require("../utils/pdfGenerator.js");
const { sendDailyReportEmailBuffer } = require("../utils/mailer.js");

// Utility to format for console logging
const pad = (n) => String(n).padStart(2, "0");
const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;

// Dominant pollutant logic
function getDominantPollutant(dataArray) {
  const lookupTable = {
    pm10: [
      [-1, 50],
      [51, 100],
      [101, 250],
      [251, 350],
      [351, 430],
      [430, Infinity],
    ],
    pm2_5: [
      [-1, 30],
      [31, 60],
      [61, 90],
      [91, 120],
      [121, 250],
      [250, Infinity],
    ],
    co: [
      [-1, 1.0],
      [1.0, 2.0],
      [2.0, 10],
      [10, 17],
      [17, 34],
      [34, Infinity],
    ],
    voc: [
      [-1, 0.3],
      [0.3, 0.5],
      [0.5, 0.8],
      [0.8, 1.0],
      [1.0, 3.0],
      [3.0, Infinity],
    ],
    co2: [
      [-1, 400],
      [400, 1000],
      [1000, 1500],
      [1500, 2000],
      [2000, 5000],
      [5000, Infinity],
    ],
    no2: [
      [-1, 100],
      [100, 200],
      [200, 400],
      [400, 600],
      [600, 800],
      [800, Infinity],
    ],
  };

  const priorityOrder = ["pm2_5", "pm10", "co", "no2", "voc", "co2"];
  const avgValues = {};

  for (const pollutant of Object.keys(lookupTable)) {
    let sum = 0,
      count = 0;
    dataArray.forEach((entry) => {
      const val = entry.data[pollutant];
      if (typeof val === "number") {
        sum += val;
        count++;
      }
    });
    avgValues[pollutant] = count ? sum / count : -1;
  }

  const levels = {};
  for (const [pollutant, avg] of Object.entries(avgValues)) {
    const ranges = lookupTable[pollutant];
    let level = -1;
    for (let i = 0; i < ranges.length; i++) {
      const [min, max] = ranges[i];
      if (avg > min && avg <= max) {
        level = i + 1;
        break;
      }
    }
    levels[pollutant] = level;
  }

  const maxLevel = Math.max(...Object.values(levels));
  const tied = Object.entries(levels)
    .filter(([_, lvl]) => lvl === maxLevel)
    .map(([k]) => k);
  for (const p of priorityOrder) {
    if (tied.includes(p)) return p.toUpperCase();
  }
  return tied[0]?.toUpperCase() || "UNKNOWN";
}

// ⏰ Schedule: daily at 00:10 AM
// cron.schedule("*/1 * * * *", async () => {
cron.schedule("10 0 * * *", async () => {
  try {
    const now = new Date();
    const reportDate = new Date(now);
    reportDate.setDate(reportDate.getDate() - 1); // Go to previous day
    reportDate.setHours(0, 0, 0, 0);

    const startTime = new Date(reportDate);
    const endTime = new Date(reportDate.getTime() + 24 * 60 * 60 * 1000 - 1);
    const formattedStart = formatDate(startTime);
    const formattedEnd = formatDate(endTime);

    const deviceData = await Node.find({
      "activityData.timestamp": { $gte: formattedStart, $lte: formattedEnd },
      isDeleted: { $ne: true },
    });

    console.log(
      "📆Daily Report 24hrs Querying data between:",
      formattedStart,
      "→",
      formattedEnd,
      "Total:",
      deviceData.length
    );

    if (!deviceData.length)
      return console.log("❌ No data found for daily report.");

    // Group data by nodeValue
    const deviceGroups = {};
    // deviceData.forEach((doc) => {
    //   const id = doc.nodeValue;
    //   const activity = doc.activityData;

    //   if (!deviceGroups[id]) deviceGroups[id] = [];

    //   const ts = new Date(activity.timestamp);
    //   if (ts >= startTime && ts <= endTime) {
    //     deviceGroups[id].push(activity);
    //   }
    // });

    deviceData.forEach((doc) => {
      const id = doc.nodeValue;
      const activity = doc.activityData;

      if (!deviceGroups[id]) deviceGroups[id] = [];

      const ts = activity.timestamp; // No need to convert, as both are strings
      if (ts >= formattedStart && ts <= formattedEnd) {
        deviceGroups[id].push(activity);
      }
    });

    // Generate report for each node
    for (const nodeValue in deviceGroups) {
      const records = deviceGroups[nodeValue];

      //   console.log(
      //     "Records:",
      //     records.length,
      //     records[0],
      //     records[records.length - 1]
      //   );

      const quarters = [
        [0, 6],
        [6, 12],
        [12, 18],
        [18, 24],
      ];

      const quarterSummaries = quarters.map(([startHour, endHour]) => {
        // const qStart = new Date(reportDate);
        // qStart.setHours(startHour, 0, 0, 0);
        // const qEnd = new Date(reportDate);
        // qEnd.setHours(endHour, 0, 0, 0);

        // const quarterData = records.filter((entry) => {
        //   const t = new Date(entry.timestamp);
        //   return t >= qStart && t < qEnd;
        // });

        // Set the start and end time for the quarter in string format
        // const qStart = `${formattedStart.slice(0, 10)} ${pad(startHour)}:00:00`;
        // if (endHour === 24) {
        //   const qEnd = `${formattedEnd.slice(0, 10)} 23:59:59`;
        // } else {
        //   const qEnd = `${formattedEnd.slice(0, 10)} ${pad(endHour)}:00:00`;
        // }

        const qStart = `${formattedStart.slice(0, 10)} ${pad(startHour)}:00:00`;
        let qEnd; // use let so we can assign conditionally

        if (endHour === 24) {
          qEnd = `${formattedEnd.slice(0, 10)} 23:59:59`;
        } else {
          qEnd = `${formattedEnd.slice(0, 10)} ${pad(endHour)}:00:00`;
        }

        // console.log("📆 Quarter:", qStart, "→", qEnd, "->", records?.length);

        const quarterData = records.filter((entry) => {
          const t = entry.timestamp; // No conversion to Date, we will directly compare as strings
          return t >= qStart && t < qEnd;
        });

        // console.log("📆 QuarterData length:", quarterData?.length);

        const avg = (arr, key) =>
          arr.reduce((sum, val) => sum + (val.data[key] || 0), 0) /
          (arr.length || 1);

        const avgAQI =
          quarterData.reduce((sum, val) => {
            const c = val.calculated || {};
            return (
              sum +
              ((c.aqi_dust || 0) +
                (c.aqi_co || 0) +
                (c.aqi_voc || 0) +
                (c.aqi_co2 || 0)) /
                4
            );
          }, 0) / (quarterData.length || 1);

        return {
          quarter: `${startHour}-${endHour}`,
          startTime: qStart,
          endTime: qEnd,
          avgAQI,
          avgTemperature: avg(quarterData, "temperature"),
          avgHumidity: avg(quarterData, "humidity"),
          dominantPollutant: getDominantPollutant(quarterData),
          powerConsumption: (Math.random() * 10 + 5).toFixed(2),
          summary:
            avgAQI <= 1
              ? "Good"
              : avgAQI > 1 && avgAQI <= 2
              ? "Moderate"
              : avgAQI > 2 && avgAQI <= 3
              ? "Satisfactory"
              : avgAQI > 3 && avgAQI <= 4
              ? "Poor"
              : avgAQI > 4 && avgAQI <= 5
              ? "Very Poor"
              : "Severe",
        };
      });

      const report = new DailyReport({
        nodeValue,
        date: formattedStart.slice(0, 10), // ✅ Save as actual Date
        quarters: quarterSummaries,
      });

      //   console.log("📆 Report:", report);

      await report.save();

      const pdfBuffer = await generateDailyReportPDFBuffer(report);
      await sendDailyReportEmailBuffer(
        pdfBuffer,
        `Daily Air Quality Report - ${nodeValue}`,
        nodeValue
      );

      console.log(`✅ Report sent for node ${nodeValue}`);
    }
  } catch (err) {
    console.error("❌ Error generating/sending daily report:", err.message);
  }
});
