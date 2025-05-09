const cron = require("node-cron");
const Node = require("../models/Node");
const Report = require("../models/Report");

// Format a JS Date into "YYYY-MM-DD HH:mm:ss"
const pad = (n) => String(n).padStart(2, "0");

const formatDate = (date) => {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`
  );
};

// AQI Dominant Pollutant Helper
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

// ⏰ Every 2 hours on even hours (00:00, 02:00, ..., 22:00)
cron.schedule("0 */2 * * *", async () => {
  // cron.schedule("*/1 * * * *", async () => {
  try {
    // const now = new Date();
    // now.setUTCMinutes(0, 0, 0); // Round to top of hour
    // const endTime = new Date(
    //   Math.floor(now.getUTCHours() / 2) * 2 * 60 * 60 * 1000 +
    //     now.setUTCHours(0)
    // );
    // const startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000); // minus 2 hours

    // const formattedStart = formatDate(startTime);
    // const formattedEnd = formatDate(endTime);

    const now = new Date();
    now.setMinutes(0, 0, 0); // Round to top of hour

    const hour = now.getHours();
    const evenHour = Math.floor(hour / 2) * 2;

    const endTime = new Date(now);
    endTime.setHours(evenHour);

    const startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000);

    const formattedStart = formatDate(startTime);
    const formattedEnd = formatDate(endTime);
    console.log("Checking data between:", formattedStart, "→", formattedEnd);

    const rawData = await Node.find({
      "activityData.timestamp": {
        $gte: formattedStart,
        $lt: formattedEnd,
      },
      isDeleted: { $ne: true },
    });

    if (!rawData.length) {
      console.log("No data found in this window.");
      return;
    }

    console.log("Data found:", rawData.length, "records.");

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

      const avgTemp = avg(records, "temperature");
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
        nodeValue,
        startTime: formattedStart,
        endTime: formattedEnd,
        avgAQI,
        avgTemperature: avgTemp,
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
      console.log(`✅ Saved report for device ${nodeValue} , ${report}`);
    }
  } catch (err) {
    console.error("❌ Error generating report:", err.message);
  }
});
