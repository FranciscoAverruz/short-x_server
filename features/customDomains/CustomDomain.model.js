const mongoose = require("mongoose");

const CustomDomainSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  domain: { type: String, required: true, unique: true },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CustomDomain", CustomDomainSchema);
