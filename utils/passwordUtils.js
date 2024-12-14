const bcrypt = require("bcryptjs");

async function updatePassword(user, newPassword) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();
}

module.exports = { updatePassword };
