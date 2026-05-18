const express = require("express");
const router = express.Router();
const { crearProducto, obtenerProductos, obtenerProductoPorId, editarProducto, eliminarProducto } = require("../controllers/productController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const { validarProducto, validarEdicionProducto } = require("../validators/productValidators");
const { validar } = require("../middleware/validationMiddleware");

router.get("/", obtenerProductos);
router.get("/:id", obtenerProductoPorId);
router.post("/", verifyToken, verifyAdmin, validarProducto, validar, crearProducto);
router.put("/:id", verifyToken, verifyAdmin, validarEdicionProducto, validar, editarProducto);
router.delete("/:id", verifyToken, verifyAdmin, eliminarProducto);

module.exports = router;