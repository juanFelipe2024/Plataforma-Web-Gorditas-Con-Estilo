const mongoSanitize = require("express-mongo-sanitize");

const sanitizeRequest = (req, res, next) => {
    if (req.body) {
        mongoSanitize.sanitize(req.body, { replaceWith: "_" });
    }

    if (req.params) {
        mongoSanitize.sanitize(req.params, { replaceWith: "_" });
    }

    if (req.query) {
        mongoSanitize.sanitize(req.query, { replaceWith: "_" });
    }

    next();
};

module.exports = sanitizeRequest;
