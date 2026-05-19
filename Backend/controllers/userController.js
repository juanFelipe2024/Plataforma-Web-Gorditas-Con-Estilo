const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
  try {
    const db = getDB();
    const { nombre, email, password, telefono } = req.body;
    const emailNormalizado = email.trim().toLowerCase();

    const usuarioExistente = await db
      .collection("users")
      .findOne({ email: emailNormalizado });
    if (usuarioExistente) {
      return res
        .status(409)
        .json({ error: "Ya existe una cuenta registrada con ese email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = {
      nombre,
      email: emailNormalizado,
      password: hashedPassword,
      telefono: telefono || "",
      rol: "cliente",
      fechaRegistro: new Date(),
    };

    await db.collection("users").insertOne(usuario);

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "Ya existe una cuenta registrada con ese email" });
    }
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;
    const emailNormalizado = email.trim().toLowerCase();

    const usuario = await db
      .collection("users")
      .findOne({ email: emailNormalizado });
    if (!usuario) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: usuario._id.toString(), rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.status(200).json({
      message: "Login exitoso",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const db = getDB();
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const resultado = await db.collection("users").findOneAndDelete({
      _id: new ObjectId(req.params.id),
    });

    if (!resultado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
