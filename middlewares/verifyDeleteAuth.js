const jwt = require('jsonwebtoken');
const messages = require('../config/messages.js');

// Middleware to verify if the token or password is valid.
// The password is used by the GitHub workflow task.

const verifyDeleteAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  const password = req.header('Authorization');

  if (!token && !password) {
    return res.status(401).json({ message: messages.Unauthorized });
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(400).json({ message: messages.BadRequest });
    }
  }

  if (password && password === process.env.API_PASSWORD) {
    return next();
  }

  return res.status(401).json({ message: messages.Unauthorized });
};

module.exports = verifyDeleteAuth;
