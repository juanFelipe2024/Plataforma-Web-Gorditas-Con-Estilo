const Product = require("../models/Product");

//funcion para crear un producto. Exclusiva del administrador
exports.crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, tallas, color, stock, imagen } = req.body;

        const producto = new Product({
            nombre,
            descripcion,
            precio,
            categoria,
            tallas,
            color,
            stock,
            imagen
        });

        await producto.save();

        res.status(201).json({
            message: "Producto creado correctamente",
            producto
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al crear el producto"
        });
    }
};

//funcion para obtener todos los productos. Disponible para todos los usuarios
exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Product.find();

        res.status(200).json(productos);

    } catch (error) {
        res.status(500).json({
            error: "Error al obtener los productos"
        });
    }
};

//funcion para obtener un producto por su id, es decir. Disponible para todos los usuarios  
exports.obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Product.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.status(200).json(producto);

    } catch (error) {
        res.status(500).json({
            error: "Error al obtener el producto"
        });
    }
};

//funcion para editar un producto por su id. Exclusiva del administrador
exports.editarProducto = async (req, res) => {
    try {
        const producto = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!producto) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto actualizado correctamente",
            producto
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al actualizar el producto"
        });
    }
};

//funcion para eliminar un producto por su id. Exclusiva del administrador
exports.eliminarProducto = async (req, res) => {
    try {
        const producto = await Product.findByIdAndDelete(req.params.id);

        if (!producto) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto eliminado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            error: "Error al eliminar el producto"
        });
    }
};