const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Subscription = require("../models/Subscription.model");
const User = require("../models/User.model");

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log('Datos de la sesión:', session);

  console.log("ESTOY EN EL WEBHOOK")
  console.log("Webhook recibido en el servidor");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body.toString());
  
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Error verificando webhook:", err);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  console.log("Evento recibido:", event);

  try {
    const data = event.data.object;

    switch (event.type) {
      case "invoice.payment_succeeded":
        await handlePaymentSuccess(data);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdate(data);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(data);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error manejando webhook:", error);
    res.status(500).send("Error interno del servidor");
  }
});

async function handlePaymentSuccess(data) {
  const subscriptionId = data.subscription;

  const updatedSubscription = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscriptionId },
    {
      status: "active",
      endDate: new Date(data.lines.data[0].period.end * 1000),
      renewalDate: new Date(data.lines.data[0].period.end * 1000),
      $push: {
        paymentHistory: {
          amount: data.amount_paid / 100,
          currency: data.currency,
          status: "success",
          paymentMethodId: data.payment_method_types[0],
          transactionId: data.payment_intent,
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!updatedSubscription) {
    console.error("Suscripción no encontrada para actualizar.");
    return;
  }

  console.log(`Pago exitoso registrado para la suscripción: ${subscriptionId}`);
}

async function handleSubscriptionUpdate(data) {
  const subscriptionId = data.id;

  const updatedSubscription = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscriptionId },
    {
      status: data.status === "active" ? "active" : "pending",
      endDate: new Date(data.current_period_end * 1000),
    },
    { new: true }
  );

  if (!updatedSubscription) {
    console.error("No se encontró la suscripción para actualizar.");
    return;
  }

  console.log(`Suscripción actualizada: ${subscriptionId}`);
}

async function handleSubscriptionDeleted(data) {
  const subscriptionId = data.id;

  const deletedSubscription = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: subscriptionId },
    {
      status: "cancelled",
      cancellationDate: new Date(),
    },
    { new: true }
  );

  if (!deletedSubscription) {
    console.error(" No se encontró la suscripción para cancelar.");
    return;
  }

  await User.findOneAndUpdate(
    { subscription: deletedSubscription._id },
    { subscription: null }
  );

  console.log(`Suscripción cancelada: ${subscriptionId}`);
}

module.exports = router;