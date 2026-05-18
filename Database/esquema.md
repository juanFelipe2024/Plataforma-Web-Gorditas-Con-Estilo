```json

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
  color: String,
  imagen: String,
  fechaCreacion: Date,
  tallas: [
    {
      talla: String,   // "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"
      stock: Number    // stock específico de esa talla
    }
  ]
}

carrito
{
  _id: ObjectId,
  usuario: String,
  productos: [
    {
      productoId: String,
      nombre: String,
      precio: Number,
      imagen: String,
      talla: String,
      cantidad: Number
    }
  ]
}

orden
{
  _id: ObjectId,
  usuario: String,
  usuarioNombre: String,
  usuarioEmail: String,
  productos: [
    {
      productoId: String,
      nombre: String,
      precio: Number,
      cantidad: Number,
      talla: String,
      categoria: String,
      descripcion: String,
      imagen: String
    }
  ],
  total: Number,
  estado: "pendiente" | "confirmado" | "cancelado",
  fecha: Date
}
```
