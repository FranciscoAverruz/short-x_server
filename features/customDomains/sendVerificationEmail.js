const nodemailer = require("nodemailer");
const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_USER } = require("../../config/env.js")

const sendVerificationEmail = async (userEmail, domain, verificationToken, verificationLink) => {
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST, 
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // const verificationLink = `https://st-x.netlify.app/verify-domain?token=${verificationToken}&domain=${domain}`;

  const emailHtml = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Dominio</title>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 8px; }
      .header { text-align: center; background-color: #4CAF50; color: white; padding: 10px; border-radius: 5px; }
      .content { margin-top: 20px; }
      .content p { font-size: 16px; line-height: 1.6; margin-bottom: 10px; }
      .button { display: inline-block; padding: 12px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; }
      .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h2>Verificación de Dominio</h2></div>
      <div class="content">
        <p>Hola,</p>
        <p>Para verificar tu dominio <strong>${domain}</strong>, usa el siguiente token:</p>
        <h3>${verificationToken}</h3>
        <p>O haz clic en el siguiente botón:</p>
        <a href="${verificationLink}" class="button">Verificar dominio</a>
      </div>
      <div class="footer"><p>&copy; 2024 Short-x. Todos los derechos reservados.</p></div>
    </div>
  </body>
  </html>`;

  const mailOptions = {
    from: `"Short-X Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Verifica tu dominio en Short-X",
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de verificación enviado a ${userEmail}`);
  } catch (error) {
    console.error("Error al enviar el correo de verificación:", error);
  }
};

module.exports = sendVerificationEmail;
