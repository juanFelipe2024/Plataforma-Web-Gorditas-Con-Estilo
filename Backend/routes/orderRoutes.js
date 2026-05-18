const express = require("express");
const router = express.Router();
const { obtenerPedidos, obtenerPedidosCliente, actualizarEstadoPedido, obtenerEstadisticas } = require("../controllers/orderController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const { validarActualizarEstado } = require("../validators/orderValidators");
const { validar } = require("../middleware/validationMiddleware");

router.get("/", verifyToken, verifyAdmin, obtenerPedidos);
router.get("/mispedidos", verifyToken, obtenerPedidosCliente);
router.get("/stats", verifyToken, verifyAdmin, obtenerEstadisticas);
router.patch("/:id/estado", verifyToken, verifyAdmin, validarActualizarEstado, validar, actualizarEstadoPedido);

module.exports = router;