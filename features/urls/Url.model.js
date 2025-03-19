const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true },
    shortId: { type: String, required: true },
    customDomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomDomain",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.user !== null;
      },
      default: null,
      index: true,
    },
    expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

UrlSchema.index({ shortId: 1, customDomain: 1 }, { unique: true });

module.exports = mongoose.model("Url", UrlSchema);
