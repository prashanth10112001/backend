// const puppeteer = require("puppeteer");

// const generateDailyReportPDFBuffer = async (report) => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Construct HTML content for the PDF
//   let htmlContent = `
//     <html>
//       <head>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             margin: 20px;
//             font-size: 12px;
//             line-height: 1.6;
//           }
//           h1, h2 {
//             text-align: center;
//             color: #2c3e50;
//           }
//           .section {
//             margin-bottom: 20px;
//           }
//           .table {
//             width: 100%;
//             border-collapse: collapse;
//           }
//           .table th, .table td {
//             padding: 8px;
//             border: 1px solid #ccc;
//             text-align: left;
//           }
//           .table th {
//             background-color: #f2f2f2;
//           }
//         </style>
//       </head>
//       <body>
//         <h1>Daily Air Quality Report</h1>
//         <h2>Device: ${report.nodeValue}</h2>
//         <h3>Date: ${report.date}</h3>
//         <div class="section">
//           <table class="table">
//             <thead>
//               <tr>
//                 <th>Quarter</th>
//                 <th>Time Range</th>
//                 <th>Avg AQI</th>
//                 <th>Avg Temperature (°C)</th>
//                 <th>Avg Humidity (%)</th>
//                 <th>Dominant Pollutant</th>
//                 <th>Power Consumption (kWh)</th>
//                 <th>Summary</th>
//               </tr>
//             </thead>
//             <tbody>`;

//   // Loop through quarters to add rows to the table
//   report.quarters.forEach((quarter, index) => {
//     const startTime = new Date(quarter.startTime).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//     const endTime = new Date(quarter.endTime).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//     htmlContent += `
//       <tr>
//         <td>Quarter ${index + 1}</td>
//         <td>${startTime} - ${endTime}</td>
//         <td>${quarter.avgAQI.toFixed(2)}</td>
//         <td>${quarter.avgTemperature.toFixed(1)}</td>
//         <td>${quarter.avgHumidity.toFixed(1)}</td>
//         <td>${quarter.dominantPollutant}</td>
//         <td>${quarter.powerConsumption}</td>
//         <td>${quarter.summary}</td>
//       </tr>`;
//   });

//   htmlContent += `
//             </tbody>
//           </table>
//         </div>
//       </body>
//     </html>`;

//   // Set the page content and generate the PDF
//   await page.setContent(htmlContent);
//   const pdfBuffer = await page.pdf({ format: "A4" });

//   await browser.close();

//   return pdfBuffer;
// };

// module.exports = { generateDailyReportPDFBuffer };

{
  /* <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 40px;
            font-size: 12px;
            line-height: 1.6;
            background-color: #f4f4f9;
            color: #333;
          }
          h1 {
            font-size: 26px;
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
            font-weight: bold;
          }
          h2 {
            font-size: 20px;
            text-align: center;
            color: #34495e;
            margin-bottom: 10px;
            font-weight: bold;
          }
          h3 {
            font-size: 18px;
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
            font-weight: normal;
          }
          .section {
            margin-bottom: 30px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .table th, .table td {
            padding: 12px 15px;
            border: 1px solid #ddd;
            text-align: left;
          }
          .table th {
            background-color: #2980b9;
            color: white;
            font-weight: bold;
          }
          .table td {
            background-color: #ecf0f1;
          }
          .table tr:nth-child(even) td {
            background-color: #f9f9f9;
          }
          .table tr:hover td {
            background-color: #f1f1f1;
          }
          .summary {
            font-size: 14px;
            margin-top: 15px;
            color: #2c3e50;
            font-weight: normal;
          }
          .footer {
            margin-top: 40px;
            font-size: 10px;
            text-align: center;
            color: #95a5a6;
          }
        </style> */
}

const puppeteer = require("puppeteer");

const generateDailyReportPDFBuffer = async (report) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Construct HTML content for the PDF
  let htmlContent = `
    <html>
      <head>
        <style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 40px;
    font-size: 13px;
    line-height: 1.6;
    background-color: #ffffff;
    color: #2c3e50;
  }
  h1 {
    font-size: 28px;
    color: #1e3d59;
    text-align: center;
    margin-bottom: 8px;
    font-weight: 600;
  }
  h2 {
    font-size: 22px;
    text-align: center;
    color: #2e5984;
    margin-bottom: 6px;
    font-weight: 500;
  }
  h3 {
    font-size: 16px;
    text-align: center;
    color: #6c757d;
    margin-bottom: 30px;
    font-weight: 400;
  }
  .section {
    margin-bottom: 30px;
  }
  .table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .table th, .table td {
    padding: 14px 12px;
    border: 1px solid #dee2e6;
    text-align: left;
  }
  .table th {
    background-color: #2980b9;
    color: #ffffff;
    font-weight: bold;
    font-size: 13px;
    text-align: center;
  }
  .table td {
    background-color: #f8f9fa;
    font-size: 13px;
    text-align: center;
  }
  .table tr:nth-child(even) td {
    background-color: #eef2f7;
  }
  .table tr:hover td {
    background-color: #e2ebf3;
  }
  .summary {
    font-size: 14px;
    margin-top: 15px;
    color: #34495e;
  }
  .footer {
    margin-top: 50px;
    font-size: 11px;
    text-align: center;
    color: #a4a4a4;
  }
    .table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 20px;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

</style>

      </head>
      <body>
        <h1>Daily Air Quality Report</h1>
        <h2>Device: ${report.nodeValue}</h2>
        <h3>Date: ${report.date}</h3>

        <div class="section">
          <table class="table">
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Time Range</th>
                <th>Avg AQI</th>
                <th>Avg Temperature (°C)</th>
                <th>Avg Humidity (%)</th>
                <th>Dominant Pollutant</th>
                <th>Power Consumption (kWh)</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>`;

  // Loop through quarters to add rows to the table
  report.quarters.forEach((quarter, index) => {
    const startTime = new Date(quarter.startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = new Date(quarter.endTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    htmlContent += `
      <tr>
        <td><strong>Quarter ${index + 1}</strong></td>
       <td>
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <span>${startTime}</span>
    <span style="font-weight: bold;">&ndash;</span>
    <span>${endTime}</span>
  </div>
</td>

        <td>${quarter.avgAQI.toFixed(2)}</td>
        <td>${quarter.avgTemperature.toFixed(1)}</td>
        <td>${quarter.avgHumidity.toFixed(1)}</td>
        <td>${quarter.dominantPollutant}</td>
        <td>${quarter.powerConsumption}</td>
        <td><em>${quarter.summary}</em></td>
      </tr>`;
  });

  htmlContent += `
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>`;

  // Set the page content and generate the PDF
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();

  return pdfBuffer;
};

module.exports = { generateDailyReportPDFBuffer };
