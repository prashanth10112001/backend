const cron = require("node-cron");
const Node = require("../models/Node.js");
const Report = require("../models/Report.js");

function getISTTime(date = new Date()) {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
}

function roundToPreviousEvenHour(date) {
  const newDate = new Date(date);
  newDate.setMinutes(0, 0, 0);
  newDate.setHours(Math.floor(newDate.getHours() / 2) * 2);
  return newDate;
}

// function getDominantPollutant(dataArray) {
//   const pollutantKeys = ["pm1", "pm2_5", "pm10", "co", "voc", "co2"];
//   const totals = {};

//   pollutantKeys.forEach((key) => (totals[key] = 0));

//   dataArray.forEach((entry) => {
//     pollutantKeys.forEach((key) => {
//       totals[key] += entry.data[key] || 0;
//     });
//   });

//   let dominant = "pm2_5";
//   let max = -Infinity;
//   for (const [key, value] of Object.entries(totals)) {
//     if (value > max) {
//       max = value;
//       dominant = key;
//     }
//   }
//   return dominant.toUpperCase();
// }

// cron.schedule("0 */2 * * *", async () => {

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
  const pollutants = Object.keys(lookupTable);
  const avgValues = {};

  // Calculate averages
  for (const pollutant of pollutants) {
    let sum = 0,
      count = 0;
    dataArray.forEach((entry) => {
      const value = entry.data[pollutant];
      if (typeof value === "number") {
        sum += value;
        count++;
      }
    });
    avgValues[pollutant] = count > 0 ? sum / count : -1;
  }

  // Determine AQI level for each
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

  // Find max level and handle tie-breaking
  const maxLevel = Math.max(...Object.values(levels));
  const tiedPollutants = Object.entries(levels)
    .filter(([_, level]) => level === maxLevel)
    .map(([pollutant]) => pollutant);

  // Use priority list to break ties
  for (const pollutant of priorityOrder) {
    if (tiedPollutants.includes(pollutant)) {
      return pollutant.toUpperCase();
    }
  }

  return tiedPollutants[0]?.toUpperCase() || "UNKNOWN";
}

// cron.schedule("*/2 * * * *", async () => {
cron.schedule("0 */2 * * *", async () => {
  try {
    const now = getISTTime();
    const endTime = roundToPreviousEvenHour(now);
    const startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000); // 2 hrs back

    const rawData = await Node.find({
      "activityData.timestamp": {
        $gte: startTime.toISOString().replace("T", " ").substring(0, 19),
        $lt: endTime.toISOString().replace("T", " ").substring(0, 19),
      },
      isDeleted: { $ne: true },
    });

    if (!rawData.length) return;

    const deviceGroups = {};

    rawData.forEach((doc) => {
      const id = doc.nodeValue;
      if (!deviceGroups[id]) deviceGroups[id] = [];
      deviceGroups[id].push(doc.activityData);
    });

    for (const nodeValue in deviceGroups) {
      const records = deviceGroups[nodeValue];

      const avg = (arr, key) =>
        arr.reduce((sum, val) => sum + (val.data[key] || 0), 0) / arr.length;

      const avgTemperature = avg(records, "temperature");
      const avgHumidity = avg(records, "humidity");
      const avgAQI =
        records.reduce(
          (sum, val) =>
            sum +
            ((val.calculated?.aqi_dust || 0) +
              (val.calculated?.aqi_co || 0) +
              (val.calculated?.aqi_voc || 0) +
              (val.calculated?.aqi_co2 || 0)) /
              4,
          0
        ) / records.length;

      const report = new Report({
        nodeValue: nodeValue,
        startTime,
        endTime,
        avgAQI,
        avgTemperature,
        avgHumidity,
        dominantPollutant: getDominantPollutant(records),
        powerConsumption: (Math.random() * 10 + 5).toFixed(2),
        summary:
          avgAQI <= 1
            ? "Good air quality"
            : avgAQI === 2
            ? "Moderate air quality"
            : avgAQI === 3
            ? "Satisfactory air quality"
            : avgAQI === 4
            ? "Poor air quality"
            : avgAQI === 5
            ? "Very poor air quality"
            : "Severe pollution",
      });

      await report.save();
      console.log(`Saved report for device ${nodeValue}`);
    }
  } catch (error) {
    console.error("Error generating report:", error.message);
  }
});
