const mongoose = require("mongoose");

const blacklistedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  dateAdded: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlacklistedToken", blacklistedTokenSchema);
