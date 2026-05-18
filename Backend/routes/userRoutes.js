
//const { verifyToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUsers, deleteUser } = require("../controllers/userController");
const { validarRegistro, validarLogin } = require("../validators/userValidators");
const { validar } = require("../middleware/validationMiddleware");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

router.post("/register", authLimiter, validarRegistro, validar, registerUser);
router.post("/login", authLimiter, validarLogin, validar, loginUser);

// Rutas administrativas: listar y eliminar usuarios
router.get("/", verifyToken, verifyAdmin, getUsers);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

module.exports = router;

/*router.get("/perfil", verifyToken, (req, res) => {
    res.json({
        message: "Ruta protegida funcionando",
        usuario: req.usuario
    });
});
*/