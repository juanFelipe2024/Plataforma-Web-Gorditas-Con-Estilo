const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  usuario: { type: String, required: true },
  productos: [
    {
      productoId: { type: String },
      nombre: {
        type: String,
      },
      precio: {
        type: Number,
      },
      cantidad: {
        type: Number,
      },
      talla: {
        type: String,
      },
      categoria: {
        type: String,
      },
      descripcion: {
        type: String,
      },
      imagen: {
        type: String,
      },
    },
  ],
  total: {
    type: Number,
    required: true,
  },
  estado: {
    type: String,
    enum: ["pendiente", "confirmado", "cancelado"],
    default: "pendiente",
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
  usuarioNombre: { type: String },
  usuarioEmail: { type: String },
});

module.exports = mongoose.model("Order", orderSchema);
