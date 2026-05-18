const { body, param, query } = require("express-validator");

const TALLAS_VALIDAS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

exports.validarAgregarAlCarrito = [
    body("productoId")
        .trim()
        .notEmpty().withMessage("El productoId es obligatorio")
        .isMongoId().withMessage("El productoId no es válido"),

    body("cantidad")
        .notEmpty().withMessage("La cantidad es obligatoria")
        .isInt({ min: 1, max: 99 }).withMessage("La cantidad debe ser un entero entre 1 y 99"),

    body("talla")
        .trim()
        .notEmpty().withMessage("La talla es obligatoria")
        .isIn(TALLAS_VALIDAS).withMessage(`La talla debe ser una de: ${TALLAS_VALIDAS.join(", ")}`)
];

exports.validarEliminarDelCarrito = [
    param("productoId")
        .isMongoId().withMessage("El productoId no es válido"),

    query("talla")
        .trim()
        .notEmpty().withMessage("La talla es obligatoria")
        .isIn(TALLAS_VALIDAS).withMessage(`La talla debe ser una de: ${TALLAS_VALIDAS.join(", ")}`)
];

exports.validarConfirmarCompra = [
    body("metodoPago")
        .trim()
        .notEmpty().withMessage("El método de pago es obligatorio")
        .isIn(["tarjeta", "transferencia"]).withMessage("El método de pago debe ser 'tarjeta' o 'transferencia'")
];