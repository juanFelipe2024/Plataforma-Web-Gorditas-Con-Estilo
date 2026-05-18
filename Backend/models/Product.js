const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String
    },
    precio: {
        type: Number,
        required: true
    },
    categoria: {
        type: String
    },
    tallas: {
        type: [String]
    },
    color: {
        type: String
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    imagen: {
        type: String
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Product", productSchema);