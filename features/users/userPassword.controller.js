const User = require("../users/User.model.js");
const { updatePassword } = require("../../utils/passwordUtils.js");
const { sendEmail } = require("../../utils/email.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

// setupPassword _________________________________________________________________
async function setupPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mismatching password" });
    }

    // Aquí ya no necesitamos verificar el token, ya está en req.user gracias al middleware
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Actualizar la contraseña usando la función utilitaria
    await updatePassword(user, newPassword);

    console.log("Password set up successfully");
    res.status(200).json({ message: "Password set up successfully" });
  } catch (err) {
    console.log("Error setting up the password", err);
    res.status(400).json({ error: err.message });
  }
}

// changePassword _________________________________________________________________
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mismatching password" });
    }

    // Usamos req.user para acceder al usuario autenticado
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong current password" });
    }

    // Actualizar la contraseña usando la función utilitaria
    await updatePassword(user, newPassword);

    console.log("Password changed successfully");
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.log("Error changing the password", err);
    res.status(400).json({ error: err.message });
  }
}

// requestPasswordReset ____________________________________________________________
async function requestPasswordReset(req, res) {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Ruta a la plantilla HTML
    const templatePath = path.join(__dirname, '..', 'templates', 'passwordResetTemplate.html');

    // Reemplazos para la plantilla
    const replacements = { resetLink };

    // Enviar el correo
    await sendEmail(user.email, "Restablecer tu contraseña", templatePath, replacements);

    return res.status(200).json({ message: "Correo enviado. Revisa tu bandeja de entrada." });
  } catch (error) {
    console.error("Error al solicitar restablecimiento de contraseña:", error);
    return res.status(500).json({ error: "Hubo un problema al enviar el correo" });
  }
}

module.exports = { setupPassword, changePassword, requestPasswordReset };
