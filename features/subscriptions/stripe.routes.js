const express = require('express');
const { createCheckoutSession, stripeWebhook, verifyPayment } = require('./stripe.checkout');
const router = express.Router();

router.post('/checkout-session', createCheckoutSession);
// router.post('/webhook', stripeWebhook);
router.post('/verify-payment', verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
