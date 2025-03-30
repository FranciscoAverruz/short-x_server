const stripe = require("../../config/stripe.js");
const User = require("../users/User.model");
const Subscription = require("../subscriptions/Subscription.model");
const {
  STPRICE_PRO_MONTHLY,
  STPRICE_PRO_ANNUAL,
  STPRICE_PREMIUM_MONTHLY,
  STPRICE_PREMIUM_ANNUAL,
  FRONTEND_URL,
} = require("../../config/env");
const mongoose = require("mongoose");

// function to create or updates user's subscription ********************************
const handleSubscription = async (
  email,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  sessionToSend,
  renewalDate
) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Usuario no encontrado al crear la suscripción");

  const newSubscription = new Subscription({
    user: user._id,
    plan,
    status: "active",
    stripeSubscriptionId,
    stripeCustomerId: stripeCustomerId,
    billingCycle: plan.includes("monthly") ? "monthly" : "annual",
    startDate: new Date(),
    renewalDate: renewalDate,
    paymentHistory: [sessionToSend],
  });

  await newSubscription.save();
  return newSubscription;
};

// creates suscripcion **************************************************************
const createStripeSubscription = async (
  userId,
  plan,
  suscriptionId,
  sessionToSend
) => {
  const subscription = await stripe.subscriptions.retrieve(suscriptionId);
  const paymentMethodId = subscription.default_payment_method;
  const stripeCustomerId = subscription.customer;
  const latest_invoice = subscription.latest_invoice;

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    let productId;
    switch (plan) {
      case "premium_annual":
        productId = STPRICE_PREMIUM_ANNUAL;
        break;
      case "premium_monthly":
        productId = STPRICE_PREMIUM_MONTHLY;
        break;
      case "pro_annual":
        productId = STPRICE_PRO_ANNUAL;
        break;
      case "pro_monthly":
        productId = STPRICE_PRO_MONTHLY;
        break;
      default:
        throw new Error("Plan no válido");
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Creates a subscription on Stripe.
    if (subscription.status !== "active") {
      subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: productId }],
        expand: [latest_invoice.payment_intent],
      });
    }

    // Creates a subscription in the database
    const newSubscription = await handleSubscription(
      user.email,
      plan,
      stripeCustomerId,
      subscription.id,
      { ...sessionToSend },
      subscription.current_period_end * 1000
    );

    // updates users's plan
    user.subscription = newSubscription._id;
    user.plan = plan;
    await user.save();

    return newSubscription;
  } catch (error) {
    console.error("Error en createStripeSubscription:");
    throw new Error("Error guardando la suscripción en la base de datos");
  }
};

// Updates subscription with proration handling and database update. ****************
const updateStripeSubscription = async (userId, newPlan) => {
  if (!newPlan) {
    throw new Error("Plan no válido");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("ID de usuario no válido");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("ID de usuario no válido");
  }

  const subscriptionBD = await Subscription.findOne({ user: userId });

  if (!subscriptionBD || !subscriptionBD.stripeSubscriptionId) {
    throw new Error("Usuario o suscripción no encontrados");
  }

  if (newPlan === "free_monthly" || newPlan === "free_annual") {
    if (
      subscriptionBD.status === "pending" ||
      subscriptionBD.status === "pendingToFree"
    ) {
      await suspendStripeCancellation(userId);
      return {
        success: true,
        message: "Cancelación suspendida. No se realizó ninguna acción.",
      };
    }

    return await cancelStripeSubscription(userId, newPlan);
  }

  const priceMap = {
    premium_annual: STPRICE_PREMIUM_ANNUAL,
    premium_monthly: STPRICE_PREMIUM_MONTHLY,
    pro_annual: STPRICE_PRO_ANNUAL,
    pro_monthly: STPRICE_PRO_MONTHLY,
  };

  const newProductId = priceMap[newPlan];
  if (!newProductId) throw new Error("Plan no válido");

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionBD.stripeSubscriptionId
  );

  if (!subscription.items || !subscription.items.data.length) {
    throw new Error("No hay items de suscripción para actualizar.");
  }

  const subscriptionItemId = subscription.items.data[0].id;

  const updatedSubscription = await stripe.subscriptions.update(
    subscription.id,
    {
      items: [{ id: subscriptionItemId, price: newProductId }],
      proration_behavior: "create_prorations",
      expand: ["latest_invoice.payment_intent"],
    }
  );

  if (
    updatedSubscription.latest_invoice.payment_intent &&
    updatedSubscription.latest_invoice.payment_intent.status !== "succeeded"
  ) {
    return {
      requiresCheckout: true,
      checkoutUrl: `${FRONTEND_URL}/dashboard/subscription/retry-payment/${updatedSubscription.latest_invoice.payment_intent.id}`,
    };
  }

  subscriptionBD.plan = newPlan;
  subscriptionBD.status = "active";
  subscriptionBD.renewalDate = new Date(
    updatedSubscription.current_period_end * 1000
  );
  await subscriptionBD.save();

  return updatedSubscription;
};

// Cancels suscription **************************************************************
const cancelStripeSubscription = async (userId, newPlan) => {
  try {
    const user = await User.findById(userId).populate("subscription");
    if (!user || !user.subscription)
      throw new Error("Usuario o suscripción no encontrados");

    const subscription = user.subscription;

    if (newPlan === "free_monthly" || newPlan === "free_annual") {
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "pendingToFree",
        renewalDate: subscription.renewalDate,
        cancellationDate: new Date(),
      });

      // schedules stripe cancelation for end of billing sycle when new plan= free monthly or annual
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

      return {
        success: true,
        message:
          "El cambio a un plan gratuito se completará al final del período de facturación.",
      };
    }

    // verifies if subscription is canceled
    if (subscription.status === "cancelled") {
      throw new Error("La suscripción ya está cancelada.");
    }

    // schedules stripe cancelation for end of billing sycle
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // updates subscription is DB
    await Subscription.findByIdAndUpdate(subscription._id, {
      status: "pending",
      cancellationDate: new Date(),
      renewalDate: new Date(stripeSubscription.current_period_end * 1000),
    });

    return {
      success: true,
      message:
        "La suscripción se cancelará al final del período de facturación.",
    };
  } catch (error) {
    throw new Error(`Error al programar la cancelación`);
  }
};

// Suspends suscription cancelation *************************************************
const suspendStripeCancellation = async (userId) => {
  try {
    const user = await User.findById(userId).populate("subscription");
    if (!user || !user.subscription)
      throw new Error("Usuario o suscripción no encontrados");

    const subscription = user.subscription;

    // Verifies if subscription in DB is not programmed to be canceled
    if (
      !subscription.stripeSubscriptionId ||
      !subscription.status ||
      subscription.status !== "pending"
    ) {
      throw new Error(
        "No hay cancelación pendiente o la suscripción no está activa."
      );
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // verifies if subscription in stripe is not scheduled to be canceled
    if (!stripeSubscription.cancel_at_period_end) {
      throw new Error("La suscripción no está programada para cancelarse.");
    }

    // suspends the cancelation process
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    // updates DB
    await Subscription.findByIdAndUpdate(subscription._id, {
      status: "active",
      cancellationDate: null,
      renewalDate: new Date(
        updatedStripeSubscription.current_period_end * 1000
      ),
    });

    return {
      success: true,
      message: "La cancelación de la suscripción ha sido suspendida.",
    };
  } catch (error) {
    throw new Error(`Error al suspender la cancelación de la suscripción`);
  }
};

// Gets payment history *************************************************************
const getUserPaymentHistory = async (stripeCustomerId, limit = 10) => {
  try {
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: limit,
    });

    const paymentHistory = invoices.data.map((invoice) => ({
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status === "paid" ? "success" : "pending",
      paymentMethod: invoice.payment_intent ? "card" : "unknown",
      transactionId: invoice.payment_intent || invoice.id,
      invoiceNumber: invoice.number || "Sin número",
      timestamp: new Date(invoice.created * 1000),
      invoiceUrl: invoice.hosted_invoice_url || invoice.invoice_pdf,
    }));

    return paymentHistory;
  } catch (error) {
    console.error("Error al obtener el historial de pagos desde Stripe:");
    throw new Error("No se pudo obtener el historial de pagos.");
  }
};

// Gets upcoming invoice info *******************************************************
const getUpcomingInvoice = async (userId, newPlan) => {
  const subscriptionBD = await Subscription.findOne({ user: userId });

  if (!subscriptionBD || !subscriptionBD.stripeSubscriptionId) {
    throw new Error("Usuario o suscripción no encontrados");
  }

  const priceMap = {
    premium_annual: STPRICE_PREMIUM_ANNUAL,
    premium_monthly: STPRICE_PREMIUM_MONTHLY,
    pro_annual: STPRICE_PRO_ANNUAL,
    pro_monthly: STPRICE_PRO_MONTHLY,
  };

  const newProductId = priceMap[newPlan];
  if (!newProductId) throw new Error("Plan no válido");

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionBD.stripeSubscriptionId
  );

  if (!subscription.items || !subscription.items.data.length) {
    throw new Error("No hay items de suscripción para actualizar.");
  }

  const subscriptionItemId = subscription.items.data[0].id;

  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: subscriptionBD.stripeCustomerId,
    subscription: subscriptionBD.stripeSubscriptionId,
    subscription_items: [
      {
        id: subscriptionItemId,
        price: newProductId,
      },
    ],
  });

  return {
    totalAmountDue: upcomingInvoice.total / 100,
    currency: upcomingInvoice.currency,
    date: new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString(),
    lineItems: upcomingInvoice.lines.data.map((item) => ({
      description: item.description,
      amount: item.amount / 100,
    })),
  };
};

module.exports = {
  createStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  suspendStripeCancellation,
  getUserPaymentHistory,
  getUpcomingInvoice,
};
