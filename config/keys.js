module.exports = {
    PROTOCOL: process.env.PROTOCOL,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    URL: process.env.API_URL, // backend url
    SITE_URL: process.env.SITE_URL,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET_KEY,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    BCRYPT_SALT: process.env.BCRYPT_SALT,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY, // stripe publishable key
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY, // Stripe secret key
    FRONT_URL: {
        HOST: process.env.MAIN_SITE
    },
    MEDIA_ROOT: process.env.MEDIA_ROOT,
    MEDIA_LIMIT: process.env.MEDIA_LIMIT,
    CODE: process.env.SUPERADMIN_CODE,
    STRIPEENDPOINTSECRET: process.env.STRIPEENDPOINTSECRET,
    NGINX_CONFIG_URL: process.env.NGINX_CONFIG_URL,
    BASIC_AUTH_USERNAME: "prolific_basic_auth",
    BASIC_AUTH_PASSWORD: "prolific_basic_auth@!23",
};
