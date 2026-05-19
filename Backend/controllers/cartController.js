const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { enviarConfirmacionEmail } = require("../services/emailService");

exports.agregarAlCarrito = async (req, res) => {
  try {
    const db = getDB();
    const { productoId, cantidad, talla } = req.body;
    const usuarioId = req.usuario.id;

    const producto = await db.collection("products").findOne({
      _id: new ObjectId(productoId),
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Verificar que la talla existe y tiene stock suficiente
    const tallaInfo = producto.tallas.find((t) => t.talla === talla);
    if (!tallaInfo) {
      return res
        .status(400)
        .json({
          error: `La talla ${talla} no está disponible para este producto`,
        });
    }
    if (tallaInfo.stock < cantidad) {
      return res
        .status(400)
        .json({ error: `Stock insuficiente para la talla ${talla}` });
    }

    const carrito = await db
      .collection("carts")
      .findOne({ usuario: usuarioId });

    const itemExistente = carrito?.productos.find(
      (p) => p.productoId === productoId && p.talla === talla,
    );

    if (itemExistente) {
      await db
        .collection("carts")
        .updateOne(
          {
            usuario: usuarioId,
            "productos.productoId": productoId,
            "productos.talla": talla,
          },
          { $inc: { "productos.$.cantidad": cantidad } },
        );
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
        await db
          .collection("carts")
          .updateOne(
            { usuario: usuarioId },
            { $push: { productos: nuevoItem } },
          );
      } else {
        await db.collection("carts").insertOne({
          usuario: usuarioId,
          productos: [nuevoItem],
        });
      }
    }

    const carritoActualizado = await db
      .collection("carts")
      .findOne({ usuario: usuarioId });
    res
      .status(200)
      .json({
        message: "Producto agregado al carrito",
        carrito: carritoActualizado,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar al carrito" });
  }
};

exports.obtenerCarrito = async (req, res) => {
  try {
    const db = getDB();
    const usuarioId = req.usuario.id;

    const carrito = await db
      .collection("carts")
      .findOne({ usuario: usuarioId });

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

exports.eliminarDelCarrito = async (req, res) => {
  try {
    const db = getDB();
    const usuarioId = req.usuario.id;
    const { productoId } = req.params;
    const { talla } = req.query;

    const carrito = await db
      .collection("carts")
      .findOne({ usuario: usuarioId });
    if (!carrito) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    await db
      .collection("carts")
      .updateOne(
        { usuario: usuarioId },
        { $pull: { productos: { productoId, talla } } },
      );

    const carritoActualizado = await db
      .collection("carts")
      .findOne({ usuario: usuarioId });
    res
      .status(200)
      .json({
        message: "Producto eliminado del carrito",
        carrito: carritoActualizado,
      });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar del carrito" });
  }
};

exports.confirmarCompra = async (req, res) => {
  const stockActualizado = [];

  try {
    const db = getDB();
    const usuarioId = req.usuario.id;
    const metodoPago = req.body.metodoPago || "No especificado";

    const carrito = await db
      .collection("carts")
      .findOne({ usuario: usuarioId });

    if (!carrito || carrito.productos.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    let total = 0;
    const productosParaPedido = [];

    for (const item of carrito.productos) {
      // Descontar stock de la talla específica
      const resultado = await db.collection("products").findOneAndUpdate(
        {
          _id: new ObjectId(item.productoId),
          tallas: {
            $elemMatch: {
              talla: item.talla,
              stock: { $gte: item.cantidad },
            },
          },
        },
        {
          $inc: {
            "tallas.$.stock": -item.cantidad,
            stock: -item.cantidad,
          },
        },
        { returnDocument: "after" },
      );

      if (!resultado) {
        // Revertir cambios de stock anteriores
        for (const ajuste of stockActualizado) {
          await db.collection("products").updateOne(
            {
              _id: new ObjectId(ajuste.productoId),
              "tallas.talla": ajuste.talla,
            },
            {
              $inc: {
                "tallas.$.stock": ajuste.cantidad,
                stock: ajuste.cantidad,
              },
            },
          );
        }
        return res
          .status(400)
          .json({
            error: `Stock insuficiente para ${item.nombre} talla ${item.talla}`,
          });
      }

      stockActualizado.push({
        productoId: item.productoId,
        talla: item.talla,
        cantidad: item.cantidad,
      });

      total += item.precio * item.cantidad;

      productosParaPedido.push({
        productoId: item.productoId,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        talla: item.talla,
        categoria: resultado.categoria,
        descripcion: resultado.descripcion,
        imagen: item.imagen,
      });
    }

    const usuario = await db.collection("users").findOne({
      _id: new ObjectId(usuarioId),
    });

    const pedido = {
      usuario: usuarioId,
      usuarioNombre: usuario?.nombre || "",
      usuarioEmail: usuario?.email || "",
      productos: productosParaPedido,
      total,
      estado: "pendiente",
      fecha: new Date(),
    };

    const resultadoPedido = await db.collection("orders").insertOne(pedido);

    // Vaciar carrito
    await db
      .collection("carts")
      .updateOne({ usuario: usuarioId }, { $set: { productos: [] } });

    const pedidoGuardado = { ...pedido, _id: resultadoPedido.insertedId };

    if (usuario?.email) {
      await enviarConfirmacionEmail(
        usuario.email,
        usuario.nombre,
        pedidoGuardado,
        metodoPago,
      );
    }

    res.status(201).json({
      message: "Compra confirmada correctamente",
      pedido: pedidoGuardado,
    });
  } catch (error) {
    console.error(error);
    for (const ajuste of stockActualizado) {
      await getDB()
        .collection("products")
        .updateOne(
          {
            _id: new ObjectId(ajuste.productoId),
            "tallas.talla": ajuste.talla,
          },
          {
            $inc: {
              "tallas.$.stock": ajuste.cantidad,
              stock: ajuste.cantidad,
            },
          },
        );
    }
    res.status(500).json({ error: "Error al confirmar la compra" });
  }
};
