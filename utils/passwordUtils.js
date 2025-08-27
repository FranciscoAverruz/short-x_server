const bcrypt = require("bcryptjs");

async function updatePassword(user, newPassword) {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{5,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new Error("The new password does not meet the security requirements.");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new Error("The new password cannot be the same as the previous one.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();
}

module.exports = { updatePassword };

