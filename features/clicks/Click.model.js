const mongoose = require("mongoose");

const ClickSchema = new mongoose.Schema({
  url: { type: mongoose.Schema.Types.ObjectId, ref: "Url", index: true },
  ip: { type: String },
  userAgent: String,
  date: { type: Date, default: Date.now, index: true },
  location: { type: String },
  deviceType: {
    type: String,
    enum: ["mobile", "desktop", "tablet"],
    default: "desktop",
  },
});

ClickSchema.index({ url: 1, date: -1 });

module.exports = mongoose.model("Click", ClickSchema);
