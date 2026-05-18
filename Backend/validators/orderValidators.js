const { body, param } = require("express-validator");

exports.validarActualizarEstado = [
    param("id")
        .isMongoId().withMessage("El id del pedido no es válido"),

    body("estado")
        .trim()
        .notEmpty().withMessage("El estado es obligatorio")
        .isIn(["pendiente", "confirmado", "cancelado"])
        .withMessage("El estado debe ser: pendiente, confirmado o cancelado")
];