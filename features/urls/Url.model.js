const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UrlSchema = new Schema(
  {
    originalUrl: { type: String, required: true },
    shortId: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.user !== null;
      },
      default: null,
      index: true
    },
    expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Url", UrlSchema);
