const messages = require("../config/messages.js");
const { API_PASSWORD } = require("../config/env");

const verifyDeleteAuth = (req, res, next) => {
  const authorizationHeader = req.header("Authorization");
  const password = authorizationHeader
    ? authorizationHeader.split(" ")[1]
    : null;

  if (!password || password !== API_PASSWORD) {
    return res.status(401).json({ message: messages.Unauthorized });
  }

  return next();
};

module.exports = verifyDeleteAuth;
