const express = require("express");
const router = express.Router();
const { agregarAlCarrito, obtenerCarrito, eliminarDelCarrito, confirmarCompra } = require("../controllers/cartController");
const { verifyToken } = require("../middleware/authMiddleware");
const { validarAgregarAlCarrito, validarEliminarDelCarrito, validarConfirmarCompra } = require("../validators/cartValidators");
const { validar } = require("../middleware/validationMiddleware");
const { checkoutLimiter } = require("../middleware/rateLimiters");

router.post("/", verifyToken, validarAgregarAlCarrito, validar, agregarAlCarrito);
router.get("/", verifyToken, obtenerCarrito);
router.delete("/:productoId", verifyToken, validarEliminarDelCarrito, validar, eliminarDelCarrito);
router.post("/confirmar", verifyToken, checkoutLimiter, validarConfirmarCompra, validar, confirmarCompra);

module.exports = router;