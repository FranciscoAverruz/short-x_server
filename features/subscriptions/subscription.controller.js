const Subscription = require("../subscriptions/Subscription.model");
const User = require("../users/User.model");
const stripe = require("../../config/stripe.js")
const { getUserPaymentHistory, updateStripeSubscription, getUpcomingInvoice, cancelStripeSubscription, suspendStripeCancellation } = require("./stripe.service.js");

// Gets subscription info ***********************************************************
const getSubscriptionInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ success: false, message: "Suscripción no encontrada." });
    }

    res.status(200).json({ success: true, subscription: user.subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Udates sbscription ***************************************************************
const updateSubscription = async (req, res) => {
  const userId = req.user.id;
  const { newPlan } = req.body;

  if (!newPlan) {
    return res.status(400).json({ success: false, message: "No se ha especificado un plan válido." });
  }

  try {
    const subscription = await Subscription.findOne({ user: userId });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ message: "No se encontró la suscripción..." });
    }

    const updatedSubscription = await updateStripeSubscription(userId, newPlan);

    if (updatedSubscription.requiresCheckout) {
      return res.status(402).json({ 
        success: false, 
        message: "Se requiere un pago adicional para completar el cambio de plan.",
        checkoutUrl: updatedSubscription.checkoutUrl 
      });
    }

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error('Error al actualizar la suscripción:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancels Subscription *************************************************************
const cancelSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await cancelStripeSubscription(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Suspends subscription cancelation ************************************************
const suspendCancelSubscription = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await suspendStripeCancellation(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gets payment history *************************************************************
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ user: userId });
    if (!subscription || !subscription.stripeCustomerId) {
      return res.status(404).json({ message: "No se encontró el stripeCustomerId para este usuario." });
    }

    const stripeCustomerId = subscription.stripeCustomerId;

    const paymentHistory = await getUserPaymentHistory(stripeCustomerId);

    return res.status(200).json({ payments: paymentHistory });
  } catch (error) {
    console.error('Error al obtener el historial de pagos:', error);
    return res.status(500).json({ message: 'No se pudo obtener el historial de pagos.' });
  }
};

// Gets upcomig payment *************************************************************
const getUpcomingpay = async (req, res) => {
  try {
    const { userId, newPlan } = req.params;
    const invoice = await getUpcomingInvoice(userId, newPlan);
    res.json(invoice);
  } catch (error) {
    console.error("Error obteniendo factura futura:", error);
    res.status(500).json({ error: error.message });
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