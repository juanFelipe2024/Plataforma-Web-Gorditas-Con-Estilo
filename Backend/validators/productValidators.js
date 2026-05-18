const { body } = require("express-validator");

const CATEGORIAS_VALIDAS = ["Blusas", "Pantalones", "Conjuntos", "Faldas", "Shorts", "Vestidos"];
const TALLAS_VALIDAS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const reglasBase = [
    body("nombre")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 }).withMessage("El nombre debe tener entre 2 y 120 caracteres"),

    body("precio")
        .optional()
        .isFloat({ min: 0.01 }).withMessage("El precio debe ser un número mayor a 0"),

    body("descripcion")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("La descripción no puede superar 1000 caracteres"),

    body("categoria")
        .optional()
        .trim()
        .isIn(CATEGORIAS_VALIDAS)
        .withMessage(`La categoría debe ser una de: ${CATEGORIAS_VALIDAS.join(", ")}`),

    body("tallas")
        .optional()
        .isArray().withMessage("Las tallas deben enviarse como arreglo")
        .custom((tallas) => {
            const invalidas = tallas.filter(t => !TALLAS_VALIDAS.includes(t));
            if (invalidas.length > 0) throw new Error(`Tallas no válidas: ${invalidas.join(", ")}`);
            return true;
        }),

    body("color")
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage("El color no puede superar 50 caracteres"),

    body("stock")
        .optional()
        .isInt({ min: 0 }).withMessage("El stock debe ser un número entero mayor o igual a 0"),

    body("imagen")
        .optional()
        .trim()
        .isURL().withMessage("La imagen debe ser una URL válida")
];

exports.validarProducto = [
    body("nombre")
        .trim()
        .notEmpty().withMessage("El nombre es obligatorio"),
    body("precio")
        .notEmpty().withMessage("El precio es obligatorio"),
    body("stock")
        .notEmpty().withMessage("El stock es obligatorio"),
    ...reglasBase
];

exports.validarEdicionProducto = reglasBase;