const User = require("../users/User.model.js");
const { updatePassword } = require("../../utils/passwordUtils.js");
const { sendEmail } = require("../../utils/email.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const { JWT_SECRET, FRONTEND_URL } = require("../../config/env.js");

// sets up Password *******************************************************************
async function setupPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "PasswordMismatch", message: "Passwords do not match." });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "UserNotFound", message: "User not found." });
    }

    await updatePassword(user, newPassword);

    console.log("Password setup successfully");
    res.status(200).json({ message: "Password setup successfully." });
  } catch (err) {
    console.error("Error setting up the password:", err);
    res.status(500).json({ error: "ServerError", message: "An error occurred while setting up the password." });
  }
}

// changes Password ******************************************************************
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "PasswordMismatch", message: "Passwords do not match." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "UserNotFound", message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "InvalidCurrentPassword", message: "Current password is incorrect." });
    }

    await updatePassword(user, newPassword);

    console.log("Password changed successfully");
    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Error changing the password:", err);
    res.status(500).json({ error: "ServerError", message: "An error occurred while changing the password." });
  }
}

// requests Password Reset ************************************************************
async function requestPasswordReset(req, res) {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "UserNotFound", message: "User not found." });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    const templatePath = path.join(__dirname, '..', 'templates', 'passwordResetTemplate.html');

    const replacements = { resetLink };

    await sendEmail(user.email, "Reset Your Password", templatePath, replacements);

    return res.status(200).json({ message: "Email sent. Please check your inbox." });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ error: "ServerError", message: "An error occurred while sending the email." });
  }
}

module.exports = { 
  setupPassword, 
  changePassword, 
  requestPasswordReset 
};
