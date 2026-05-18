const { body } = require("express-validator");

exports.validarRegistro = [
    body("nombre")
        .trim()
        .notEmpty().withMessage("El nombre es obligatorio")
        .isLength({ min: 2, max: 80 }).withMessage("El nombre debe tener entre 2 y 80 caracteres"),

    body("email")
        .trim()
        .notEmpty().withMessage("El correo es obligatorio")
        .isEmail().withMessage("El correo no tiene un formato válido")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria")
        .isLength({ min: 6 }).withMessage("La contraseña debe tener mínimo 6 caracteres"),

    body("telefono")
        .optional()
        .trim()
        .isMobilePhone("es-CO").withMessage("El teléfono no tiene un formato válido")
];

exports.validarLogin = [
    body("email")
        .trim()
        .notEmpty().withMessage("El correo es obligatorio")
        .isEmail().withMessage("El correo no tiene un formato válido")
        .normalizeEmail(),

    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria")
];