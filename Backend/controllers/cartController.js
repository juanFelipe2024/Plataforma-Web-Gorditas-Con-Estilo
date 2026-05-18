const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { enviarConfirmacionEmail } = require("../services/emailService");
const User = require("../models/User");

// Agregar un producto al carrito
exports.agregarAlCarrito = async (req, res) => {
  try {
    const { productoId, cantidad, talla } = req.body;
    const usuarioId = req.usuario.id;

    const producto = await Product.findById(productoId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    let carrito = await Cart.findOne({ usuario: usuarioId });

    const itemExistente = carrito?.productos.find(
      (p) => p.productoId === productoId && p.talla === talla,
    );

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
      const nuevoItem = {
        productoId,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        talla,
        cantidad,
      };
      if (carrito) {
        carrito.productos.push(nuevoItem);
      } else {
        carrito = new Cart({ usuario: usuarioId, productos: [nuevoItem] });
      }
    }

    await carrito.save();
    res.status(200).json({ message: "Producto agregado al carrito", carrito });
  } catch (error) {
    res.status(500).json({ error: "Error al agregar al carrito" });
  }
};

// Obtener el carrito del usuario
exports.obtenerCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const carrito = await Cart.findOne({ usuario: usuarioId });

    if (!carrito) {
      return res
        .status(200)
        .json({ message: "El carrito está vacío", productos: [] });
    }

    res.status(200).json(carrito);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
};

// Eliminar un producto del carrito
exports.eliminarDelCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { productoId } = req.params;
    const { talla } = req.query;

    const carrito = await Cart.findOne({ usuario: usuarioId });

    if (!carrito) {
      return res.status(404).json({
        error: "Carrito no encontrado",
      });
    }

    carrito.productos = carrito.productos.filter(
      (p) => !(p.productoId === productoId && p.talla === talla),
    );

    await carrito.save();

    res.status(200).json({
      message: "Producto eliminado del carrito",
      carrito,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al eliminar del carrito",
    });
  }
};

// Confirmar la compra y se convierte en pedido
exports.confirmarCompra = async (req, res) => {
  const stockActualizado = [];

  try {
    const usuarioId = req.usuario.id;
    const metodoPago = req.body.metodoPago || "No especificado";

    const carrito = await Cart.findOne({ usuario: usuarioId }); // sin populate

    if (!carrito || carrito.productos.length === 0) {
      return res.status(400).json({
        error: "El carrito está vacío",
      });
    }

    let total = 0;
    const productosParaPedido = [];

    for (const item of carrito.productos) {
      const productoActualizado = await Product.findOneAndUpdate(
        { _id: item.productoId, stock: { $gte: item.cantidad } },
        { $inc: { stock: -item.cantidad } },
        { new: true },
      );

      if (!productoActualizado) {
        for (const ajuste of stockActualizado) {
          await Product.findByIdAndUpdate(ajuste.productoId, {
            $inc: { stock: ajuste.cantidad },
          });
        }
        stockActualizado.length = 0;
        return res
          .status(400)
          .json({ error: `Stock insuficiente para ${item.nombre}` });
      }

      stockActualizado.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
      });
      total += item.precio * item.cantidad;

      productosParaPedido.push({
        productoId: item.productoId,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        talla: item.talla,
        categoria: productoActualizado.categoria,
        descripcion: productoActualizado.descripcion,
        imagen: item.imagen,
      });
    }

    const usuario = await User.findById(usuarioId);

    const pedido = new Order({
      usuario: usuarioId,
      usuarioNombre: usuario?.nombre || "",
      usuarioEmail: usuario?.email || "",
      productos: productosParaPedido,
      total,
    });

    await pedido.save();

    carrito.productos = [];
    await carrito.save();

    // envío del email que faltaba
    if (usuario && usuario.email) {
      await enviarConfirmacionEmail(
        usuario.email,
        usuario.nombre,
        pedido,
        metodoPago,
      );
    }

    res.status(201).json({
      message: "Compra confirmada correctamente",
      pedido,
    });
  } catch (error) {
    for (const ajuste of stockActualizado) {
      await Product.findByIdAndUpdate(ajuste.productoId, {
        $inc: { stock: ajuste.cantidad },
      });
    }

    res.status(500).json({
      error: "Error al confirmar la compra",
    });
  }
};
