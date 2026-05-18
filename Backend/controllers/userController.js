const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;
        const emailNormalizado = email.trim().toLowerCase();
        const rol = "cliente";

        const usuarioExistente = await User.findOne({ email: emailNormalizado });
        if (usuarioExistente) {
            return res.status(409).json({
                error: "Ya existe una cuenta registrada con ese email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            nombre,
            email: emailNormalizado,
            password: hashedPassword,
            telefono,
            rol
        });

        await user.save();

        res.status(201).json({
            message: "Usuario registrado correctamente"
        });

    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                error: "Ya existe una cuenta registrada con ese email"
            });
        }

        res.status(500).json({
            error: "Error al registrar usuario"
        });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const emailNormalizado = email.trim().toLowerCase();

        const user = await User.findOne({ email: emailNormalizado });
        if (!user) {
            return res.status(401).json({
                error: "Email o contraseña incorrectos"
            });
        }

        const passwordValida = await bcrypt.compare(password, user.password);
        if (!passwordValida) {
            return res.status(401).json({
                error: "Email o contraseña incorrectos"
            });
        }

        const token = jwt.sign(
            { id: user._id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.status(200).json({
            message: "Login exitoso",
            token,
            usuario: {
                id: user._id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al iniciar sesión"
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, "nombre email telefono rol");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
};