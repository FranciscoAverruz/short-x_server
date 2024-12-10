const BlacklistedToken = require("../features/auth/BlacklistedToken.js");

const checkBlacklist = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const blacklistedToken = await BlacklistedToken.findOne({ token });

    if (blacklistedToken) {
      return res.status(401).json({ error: "Token has been invalidated (logged out)" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Error checking token blacklist" });
  }
};

module.exports = { checkBlacklist };