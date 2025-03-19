module.exports = {
    NODE_ENV: process.env.NODE_ENV,

    PORT: process.env.PORT,

    MONGO_URI: process.env.MONGO_UR,

    JWT_SECRET: process.env.JWT_SECRET,
    API_PASSWORD: process.env.API_PASSWORD,

    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_HOST: process.env.EMAIL_HOST,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

    STRIPE_ENDPOINT_SECRET: process.env.STRIPE_ENDPOINT_SECRET,

    FRONTEND_URL: process.env.FRONTEND_URL,

    STPRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    STPRICE_PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
    STPRICE_PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    STPRICE_PREMIUM_ANNUAL: process.env.STRIPE_PRICE_PREMIUM_ANNUAL
}