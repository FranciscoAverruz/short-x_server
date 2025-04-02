const User = require("../features/users/User.model");

const createValidatedUser = async ({
  username,
  email,
  password,
  confirmPassword,
  urls,
  isAdmin,
  plan,
}) => {
  if (
    !password ||
    password.length < 5 ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[!@#$%^&*]/.test(password)
  ) {
    throw new Error(
      "The password must be at least 5 characters long, include an uppercase letter, a number, and a special symbol"
    );
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("This email is already registered.");
  }

  return {
    username,
    email,
    isAdmin,
    urls,
    password,
    plan,
  };
};

module.exports = createValidatedUser;
