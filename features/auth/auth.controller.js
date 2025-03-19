const User = require("../users/User.model.js");
const BlacklistedToken = require("./BlacklistedToken.js");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../../utils/email");
const path = require("path");
const createValidatedUser = require('../../utils/createValidatedUser.js');

// function for creating a user  ****************************************************
async function createUser({ username, email, isAdmin, urls, password, plan }) {
  return await User.signup(username, email, isAdmin, urls, password, plan);
}

// Login  ***************************************************************************
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "User not found, please sign up"
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        error: "INVALID_PASSWORD",
        message: "Incorrect password"
      });
    }

    const token = await user.generateJWT();

    return res.status(200).json({ token });

  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Server error, please try again later"
    });
  }
};

// Signup  **************************************************************************
const signupUser = async (req, res) => {
  console.log(" req.body en signupUser >> ",  req.body)

  const { username, email, password, confirmPassword, urls, isAdmin, plan } = req.body;

  try {
    await createValidatedUser({ username, email, password, confirmPassword, urls, isAdmin, plan });

    // 1. Check if the user is an admin
    if (req.user && req.user.isAdmin) {
      const provisionalPassword = Math.random().toString(36).slice(-8);
      const newUserIsAdmin = isAdmin !== undefined ? isAdmin : false;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: "EMAIL_ALREADY_EXISTS",
          message: "This email is already registered."
        });
      }

      const user = await createUser({ username, email, urls, password: provisionalPassword, isAdmin: newUserIsAdmin });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
      const templatePath = path.join(__dirname, "../templates/passwordSetupTemplate.html");
      const setupLink = `${process.env.CLIENT_URL}/setup-password?token=${token}`;
      await sendEmail(email, "Set up your password", templatePath, { username, setupLink });

      return res.status(201).json({
        message: "User created successfully. An email has been sent to set up your password.",
        user,
      });
    }

    // 2. when user is not an admin
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: "EMAIL_ALREADY_EXISTS",
        message: "This email is already registered."
      });
    }

    const newUserIsAdmin = isAdmin !== undefined ? isAdmin : false;
    const user = await createUser({ username, email, urls, password, isAdmin: newUserIsAdmin, plan });
    console.log(" usuario creado === ", user)

    const templatePath = path.join(__dirname, "./templates/userRegistrationTemplate.html");
    await sendEmail(email, "Successful Registration!", templatePath, { username });

    return res.status(201).json({
      message: "User successfully registered. A confirmation email has been sent.",
      user
    });

  } catch (error) {
    console.error("Error during registration:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later."
    });
  }
};

// Logout ***************************************************************************
const logoutUser = async (req, res) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(400).json({
      error: "NO_TOKEN_PROVIDED",
      message: "No token provided"
    });
  }

  try {
    await BlacklistedToken.create({ token });

    return res.status(200).json({
      message: "User logged out successfully"
    });
  } catch (err) {
    return res.status(500).json({
      error: "LOGOUT_ERROR",
      message: "Error during logout"
    });
  }
};

module.exports = {
  loginUser,
  signupUser,
  logoutUser,
  createUser
};