const Subscription = require("../subscriptions/Subscription.model");
const User = require("../users/User.model");
const stripe = require("../../config/stripe.js")
const { getUserPaymentHistory, updateStripeSubscription, getUpcomingInvoice, cancelStripeSubscription, suspendStripeCancellation } = require("./stripe.service.js");

// Gets subscription info ***********************************************************
const getSubscriptionInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("subscription");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const subscriptionData = user?.subscription || null;

    res.status(200).json({ success: true, subscription: subscriptionData });
  } catch (error) {
    res.status(500).json({ success: false, error: "Unable to retrieve subscription information"});
  }
};

// Udates sbscription ***************************************************************
const updateSubscription = async (req, res) => {
  const userId = req.user.id;
  const { newPlan } = req.body;

  if (!newPlan) {
    return res.status(400).json({ success: false, message: "A valid plan is needed" });
  }

  try {
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: "Subscription not found." });
    }

    const updatedSubscription = await updateStripeSubscription(userId, newPlan);

    if (updatedSubscription.requiresCheckout) {
      return res.status(402).json({ 
        success: false, 
        message: "An additional payment is required to complete the plan change",
        checkoutUrl: updatedSubscription.checkoutUrl 
      });
    }

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error('Error updating the subscription');
    res.status(500).json({ success: false, error: "Error updating the subscription" });
  }
};

// Cancels Subscription *************************************************************
const cancelSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await cancelStripeSubscription(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Error Cancelling the subscripción"});
  }
};

// Suspends subscription cancelation ************************************************
const suspendCancelSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await suspendStripeCancellation(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Error processing the suspension" });
  }
};

// Gets payment history *************************************************************
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const subscription = await Subscription.findOne({ user: userId });
    
    if (!subscription || !subscription.stripeCustomerId) {
      // return res.status(404).json({ message: "user stripeCustomerId not found" });
      return res.status(200).json({ payments: [] });
    }

    const stripeCustomerId = subscription.stripeCustomerId;

    const paymentHistory = await getUserPaymentHistory(stripeCustomerId);

    return res.status(200).json({ payments: paymentHistory });
  } catch (error) {
    console.error('Error retrieving payment history');
    return res.status(500).json({ message: 'Unable to retrieve payment history' });
  }
};

// Gets upcomig payment *************************************************************
const getUpcomingpay = async (req, res) => {
  try {
    const { userId, newPlan } = req.params;
    const invoice = await getUpcomingInvoice(userId, newPlan);
    res.json(invoice);
  } catch (error) {
    console.error("Error retrieving invoice");
    res.status(500).json({ error: "Unable to retrieve next payment information"});
  }
};


module.exports = {
  getSubscriptionInfo,
  updateSubscription,
  cancelSubscription,
  suspendCancelSubscription,
  getPaymentHistory,
  getUpcomingpay
};