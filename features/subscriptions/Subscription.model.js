const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["free_monthly", "free_annual", "pro_monthly", "pro_annual", "premium_monthly", "premium_annual"], default: "free_monthly" },
  status: { type: String, enum: ["active", "pending", "cancelled", "pendingToFree"], default: "pending" },
  billingCycle: { type: String, enum: ["monthly", "annual"], default: "monthly" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },

  stripeSubscriptionId: { type: String },
  stripeCustomerId: { type: String },

  paymentHistory: [
    {
      amount: { type:Number },
      currency: { type: String },
      paymentMethod: { type: String },
      status: { type: String, enum: ["success", "pending", "failed"], default: "pending" },
      invoiceNumber: { type: String },
      transactionId: { type: String },
      invoiceNumber: { type: String },
      timestamp: { type: Date, default: Date.now },
      startDate: { type: Date }
    }
  ],

  renewalDate: { type: Date },
  cancellationDate: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model("Subscription", SubscriptionSchema);