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

// creates or updates user's subscription *******************************************
const handleSubscription = async (
  email,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  sessionToSend,
  renewalDate
) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found while creating the subscription");

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
      throw new Error("User not found");
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
        throw new Error("Invalid plan");
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
    console.error("Error creating a stripe subscription");
    throw new Error("Error adding subscription into data base");
  }
};

// Updates subscription with proration handling and database update. ****************
const updateStripeSubscription = async (userId, newPlan) => {
  if (!newPlan) {
    throw new Error("Invalid plan");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid User ID");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Invalid User ID");
  }

  const subscriptionBD = await Subscription.findOne({ user: userId });

  if (!subscriptionBD || !subscriptionBD.stripeSubscriptionId) {
    if (newPlan.startsWith("free")) {
      return {
        success: true,
        message: "User is already on a Free plan",
      };
    } else {
      const newSubscription = await createStripeSubscription(
        userId,
        newPlan,
        null,
        {}
      );

      return {
        requiresCheckout: true,
        checkoutUrl: `${FRONTEND_URL}/dashboard/subscription/retry-payment/${newSubscription.latest_invoice.payment_intent.id}`,
        invoiceAmount: newSubscription.latest_invoice.total / 100,
        currency: newSubscription.latest_invoice.currency,
      };
    }
  }

  // if (!subscriptionBD || !subscriptionBD.stripeSubscriptionId) {
  //   throw new Error("User or Subscription not found");
  // }

  if (newPlan === "free_monthly" || newPlan === "free_annual") {
    if (
      subscriptionBD.status === "pending" ||
      subscriptionBD.status === "pendingToFree"
    ) {
      await suspendStripeCancellation(userId);
      return {
        success: true,
        message: "Cancellation suspended. no actions were executed",
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
  if (!newProductId) throw new Error("Invalid Plan");

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionBD.stripeSubscriptionId
  );

  if (!subscription.items || !subscription.items.data.length) {
    throw new Error("No subscription items were found to update");
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
      throw new Error("User or subscription not found");

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
          "The migration to a free plan will be completed at the end of the billing cycle",
      };
    }

    // verifies if subscription is canceled
    if (subscription.status === "cancelled") {
      throw new Error("Subscription already cancelled");
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
        "The subscription will be cancelled at the end of billing cycle",
    };
  } catch (error) {
    throw new Error(`Error scheduling the cancelation`);
  }
};

// Suspends suscription cancelation *************************************************
const suspendStripeCancellation = async (userId) => {
  try {
    const user = await User.findById(userId).populate("subscription");
    if (!user || !user.subscription)
      throw new Error("User or subscription not found");

    const subscription = user.subscription;

    // Verifies if subscription in DB is not programmed to be canceled
    if (
      !subscription.stripeSubscriptionId ||
      !subscription.status ||
      subscription.status !== "pending"
    ) {
      throw new Error(
        "no pending cancellation found or the subscripcion is not active"
      );
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // verifies if subscription in stripe is not scheduled to be canceled
    if (!stripeSubscription.cancel_at_period_end) {
      throw new Error("Subscription not scheduled to be cancelled");
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
      message: "Subscription cancellation was suspended",
    };
  } catch (error) {
    throw new Error(`Subscription cancellation failed`);
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
      invoiceNumber: invoice.number || "####",
      timestamp: new Date(invoice.created * 1000),
      invoiceUrl: invoice.hosted_invoice_url || invoice.invoice_pdf,
    }));

    return paymentHistory;
  } catch (error) {
    console.error("Error retrieving stripe payment history");
    throw new Error("Unable to get payment history");
  }
};

// Gets upcoming invoice info *******************************************************
const getUpcomingInvoice = async (userId, newPlan) => {
  const subscriptionBD = await Subscription.findOne({ user: userId });

  if (!subscriptionBD || !subscriptionBD.stripeSubscriptionId) {
    throw new Error("User or subscription not found");
  }

  const priceMap = {
    premium_annual: STPRICE_PREMIUM_ANNUAL,
    premium_monthly: STPRICE_PREMIUM_MONTHLY,
    pro_annual: STPRICE_PRO_ANNUAL,
    pro_monthly: STPRICE_PRO_MONTHLY,
  };

  const newProductId = priceMap[newPlan];
  if (!newProductId) throw new Error("Invalid plan");

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionBD.stripeSubscriptionId
  );

  if (!subscription.items || !subscription.items.data.length) {
    throw new Error("No subscription items to update");
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
