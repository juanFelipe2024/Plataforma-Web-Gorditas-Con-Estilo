const rateLimit = require("express-rate-limit");

const createLimiter = (options) => rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: options.message || {
        error: "Demasiadas solicitudes, intenta mas tarde."
    }
});

const baseLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 300
});

const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        error: "Demasiados intentos. Intenta mas tarde."
    }
});

const checkoutLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: {
        error: "Demasiadas confirmaciones. Intenta mas tarde."
    }
});

module.exports = {
    baseLimiter,
    authLimiter,
    checkoutLimiter
};
