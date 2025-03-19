const express = require("express");
const { getSubscriptionInfo, updateSubscription, cancelSubscription, suspendCancelSubscription, getPaymentHistory, getUpcomingpay } = require("./subscription.controller.js");
const verifyAuth = require("../../middlewares/verifyAuth.js");

const router = express.Router();

router.get("/:id/info", verifyAuth, getSubscriptionInfo);
router.put("/:id/update", verifyAuth, updateSubscription);
router.delete("/:id/cancel", verifyAuth, cancelSubscription);
router.put('/:id/suspend-cancellation', suspendCancelSubscription);
router.get("/:id/payment-history", verifyAuth, getPaymentHistory);
router.get("/upcomingpay/:userId/:newPlan", verifyAuth, getUpcomingpay)

module.exports = router;