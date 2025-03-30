const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { EMAIL_USER, EMAIL_PASS, NODE_ENV } = require("../../config/env.js");

const sendEmail = async (req, res) => {
  const { name, phone, email, message, countryName } = req.body;

  try {
    const templatePath = path.resolve(
      __dirname,
      "./templates/contactEmailFromWeb.html"
    );
    let template = fs.readFileSync(templatePath, "utf8");

    template = template
      .replace("{{name}}", name)
      .replace("{{phone}}", phone)
      .replace("{{email}}", email)
      .replace("{{message}}", message)
      .replace("{{countryName}}", countryName);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: NODE_ENV === "production",
      },
    });

    const mailOptions = {
      from: EMAIL_USER,
      to: EMAIL_USER,
      subject: `Nuevo mensaje de ${name}`,
      html: template,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

module.exports = sendEmail;
