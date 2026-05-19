const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

exports.crearProducto = async (req, res) => {
  try {
    const db = getDB();
    const {
      nombre,
      descripcion,
      precio,
      categoria,
      tallas,
      color,
      stock,
      imagen,
    } = req.body;

    // tallas ahora es array de objetos { talla, stock }
    const tallasConStock = (tallas || []).map((t) => ({
      talla: t.talla,
      stock: Number(t.stock) || 0,
    }));

    const stockTotal = tallasConStock.reduce((sum, t) => sum + t.stock, 0);

    const producto = {
      nombre,
      descripcion,
      precio: Number(precio),
      categoria,
      tallas: tallasConStock,
      color,
      stock: stockTotal,
      imagen,
      fechaCreacion: new Date(),
    };

    const resultado = await db.collection("products").insertOne(producto);

    res.status(201).json({
      message: "Producto creado correctamente",
      producto: { ...producto, _id: resultado.insertedId },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el producto" });
  }
};

exports.obtenerProductos = async (req, res) => {
  try {
    const db = getDB();
    const productos = await db.collection("products").find({}).toArray();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los productos" });
  }
};

exports.obtenerProductoPorId = async (req, res) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const producto = await db.collection("products").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};

exports.editarProducto = async (req, res) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const {
      nombre,
      descripcion,
      precio,
      categoria,
      tallas,
      color,
      stock,
      imagen,
    } = req.body;

    const updateFields = {};
    if (nombre !== undefined) updateFields.nombre = nombre;
    if (descripcion !== undefined) updateFields.descripcion = descripcion;
    if (precio !== undefined) updateFields.precio = Number(precio);
    if (categoria !== undefined) updateFields.categoria = categoria;
    if (color !== undefined) updateFields.color = color;
    if (imagen !== undefined) updateFields.imagen = imagen;

    if (tallas !== undefined) {
      const tallasConStock = tallas.map((t) => ({
        talla: t.talla,
        stock: Number(t.stock) || 0,
      }));
      updateFields.tallas = tallasConStock;
      updateFields.stock = tallasConStock.reduce((sum, t) => sum + t.stock, 0);
    } else if (stock !== undefined) {
      updateFields.stock = Number(stock);
    }

    const resultado = await db
      .collection("products")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updateFields },
        { returnDocument: "after" },
      );

    if (!resultado) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({
      message: "Producto actualizado correctamente",
      producto: resultado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    const db = getDB();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const resultado = await db.collection("products").findOneAndDelete({
      _id: new ObjectId(req.params.id),
    });

    if (!resultado) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};
