const bcrypt = require("bcryptjs");
const User = require("../users/User.model.js");

// Creates an administrator (firt register) when the BD is empty
async function createAdmin() {
  try {
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (adminExists) {
      console.log("An admin already exists in the database.");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin", 10);
    const admin = new User({
      username: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      isAdmin: true,
    });

    await admin.save();
    console.log("Admin created successfully.");
  } catch (err) {
    console.error("Error creating the admin account", err);
  }
}

module.exports = createAdmin;
