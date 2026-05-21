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
  ],
  stock: Number        // stock total (suma de todas las tallas)
}

carrito
{
  _id: ObjectId,
  usuario: String,     // id del usuario (embebido como string, no referencia)
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
  usuario: String,          // id del usuario (embebido como string, no referencia)
  usuarioNombre: String,    // nombre embebido al momento de la compra
  usuarioEmail: String,     // email embebido al momento de la compra
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
  fecha: Date,
  metodoPago: "tarjeta" | "transferencia"
}
```
