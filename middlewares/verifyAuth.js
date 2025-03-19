const jwt = require('jsonwebtoken');
const messages = require('../config/messages.js');
const { JWT_SECRET } = require("../config/env")

const verifyAuth = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    console.log('Token recibido:', token);
    if (!token) {
      return res.status(401).json({ message: messages.Unauthorized });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("User from token:", decoded);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(400).json({ message: messages.BadRequest });
    }
  };
  
  module.exports = verifyAuth;