const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    usuario: { type: String, required: true },
    productos: [
        {
        productoId: { type: String, required: true }, // solo el ID como string, sin ref
        nombre: { type: String, required: true },
        precio: { type: Number, required: true },
        imagen: { type: String },
        talla: { type: String, required: true },
        cantidad: { type: Number, required: true, default: 1 }
        }
    ]
});

module.exports = mongoose.model("Cart", cartSchema);