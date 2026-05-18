usuario
{
  _id: ObjectId,
  nombre: String,
  email: String,
  password: String,
  telefono: String,
  rol: "cliente" | "admin",
  fechaRegistro: Date
}

producto
{
  _id: ObjectId,
  nombre: String,
  descripcion: String,
  precio: Number,
  categoria: String,
  tallas: [String],
  color: String,
  stock: Number,
  imagen: String,
  fechaCreacion: Date
}

orden
{
  _id: ObjectId,
  usuario: ObjectId,
  productos: [
    {
      productoId: ObjectId,
      nombre: String,
      precio: Number,
      cantidad: Number
    }
  ],
  total: Number,
  estado: String,
  fecha: Date
}

carrito
{
  _id: ObjectId,
  usuario: ObjectId,
  productos: [
    {
      productoId: ObjectId,
      cantidad: Number
    }
  ]
}

