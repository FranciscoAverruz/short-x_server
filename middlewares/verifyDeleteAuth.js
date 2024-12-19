const messages = require('../config/messages.js');

// Middleware to verify if the password is valid for account deletion access
const verifyDeleteAuth = (req, res, next) => {
  const authorizationHeader = req.header('Authorization');
  const password = authorizationHeader ? authorizationHeader.split(' ')[1] : null;

  if (!password || password !== process.env.API_PASSWORD) {
    return res.status(401).json({ message: messages.Unauthorized });
  }

  return next();
};

module.exports = verifyDeleteAuth;
