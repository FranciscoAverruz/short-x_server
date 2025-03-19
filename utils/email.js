const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { EMAIL_USER, EMAIL_PASS, NODE_ENV } = require("../config/env.js");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: NODE_ENV === "production",
  },
});

async function sendEmail(to, subject, templatePath, replacements) {
  try {
    let template = fs.readFileSync(path.resolve(templatePath), "utf-8");
    console.log("Template path ///////// ", path.resolve(templatePath));

    for (const key in replacements) {
      template = template.replace(`{{${key}}}`, replacements[key]);
    }

    const mailOptions = {
      from: EMAIL_USER,
      to,
      subject,
      html: template,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error.response || error.message);
    throw new Error("Could not send email.");
  }
}

module.exports = { sendEmail };