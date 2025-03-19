const stripe = require("../../config/stripe.js")
const User = require("../users/User.model");
const { createStripeSubscription } = require("./stripe.service.js");
const { createUser }  = require("../auth/auth.controller.js")
const createValidatedUser = require("../../utils/createValidatedUser.js");
const { STPRICE_PRO_MONTHLY, STPRICE_PRO_ANNUAL, STPRICE_PREMIUM_MONTHLY, STPRICE_PREMIUM_ANNUAL, FRONTEND_URL, STRIPE_ENDPOINT_SECRET } = require("../../config/env.js")

// creates Checkout Session *********************************************************
const createCheckoutSession = async (req, res) => {
  const { email, plan } = req.body;
  try {
    let productId;
    switch (plan) {
      case 'premium_annual': productId = STPRICE_PREMIUM_ANNUAL; break;
      case 'premium_monthly': productId = STPRICE_PREMIUM_MONTHLY; break;
      case 'pro_annual': productId = STPRICE_PRO_ANNUAL; break;
      case 'pro_monthly': productId = STPRICE_PRO_MONTHLY; break;
      default: 
        throw new Error('Plan no válido');
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: productId,
          quantity: 1,
        },
      ],
      mode: 'subscription', 
      success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cancel`,
      metadata: { email: email, plan: plan },
    });

    res.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error("Error al crear la sesión de checkout: ", error);
    res.status(500).json({ error: `No se pudo crear la sesión de pago. ${error.message}` });
  }
};

// Stripe events Webhook ************************************************************
const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const payload = req.body;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, STRIPE_ENDPOINT_SECRET);
  } catch (err) {
    console.error("Error de webhook: ", err);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const customerEmail = session.customer_email;

    try {
      const user = await handleUserSubscription(session, customerEmail);
      const subscription = await handleSubscription(customerEmail, session.metadata.plan, session.subscription);

      console.log("Usuario y suscripción procesados correctamente");
    } catch (err) {
      console.error("Error al procesar el usuario o suscripción: ", err);
      return res.status(500).send("Error al procesar el usuario y la suscripción.");
    }
  }

  res.status(200).send("Webhook recibido");
};


// Manually verifies the payment ****************************************************
  // fuction to convert Payment Status from stripe
  const mapPaymentStatus = (stripeStatus) => {
    const statusMap = {
      succeeded: "success",
      processing: "pending",
      requires_payment_method: "failed",
      requires_action: "pending",
      canceled: "failed",
    };

    return statusMap[stripeStatus] || "pending";
  };

  // Verifies Payment ***************************************************************
  const verifyPayment = async (req, res) => {
    const { sessionId, userData, selectedPlan } = req.body;

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return res
          .status(400)
          .json({ success: false, message: "Pago no completado" });
      }

      const invoice = await stripe.invoices.retrieve(session.invoice);
      const paymentIntentId = invoice.payment_intent;
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      const sessionToSend = {
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        status: mapPaymentStatus(paymentIntent.status),
        invoiceNumber: invoice.number,
        transactionId: invoice.payment_intent,
        startDate: invoice.period_start * 1000,
      };

    try {
      await createValidatedUser({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        urls: userData.urls,
        isAdmin: false,
        plan: selectedPlan,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await createUser({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          isAdmin: false,
          urls: userData.urls,
          plan: selectedPlan,
        });
      }

      const subscription = await createStripeSubscription(
        user._id,
        selectedPlan,
        session.subscription,
        sessionToSend
      );

      return res.status(200).json({
        success: true,
        message: "Pago confirmado y suscripción creada.",
        subscription: subscription,
      });
    } catch (error) {
      console.error("Error al verificar el pago:", error);
      return res.status(500).json({
        success: false,
        message: `Error al verificar el pago: ${error.message}`,
      });
    }
  };

module.exports = {
  createCheckoutSession,
  stripeWebhook,
  verifyPayment
};