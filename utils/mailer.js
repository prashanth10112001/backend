const nodemailer = require("nodemailer");

async function sendDailyReportEmailBuffer(buffer, subject, nodeValue) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.REPORT_RECIPIENT_EMAIL,
    subject,
    text: `Attached is the daily air quality report for node ${nodeValue}.`,
    attachments: [
      {
        filename: `${nodeValue}-DailyReport.pdf`,
        content: buffer,
        contentType: "application/pdf",
      },
    ],
  });
}

module.exports = { sendDailyReportEmailBuffer };
