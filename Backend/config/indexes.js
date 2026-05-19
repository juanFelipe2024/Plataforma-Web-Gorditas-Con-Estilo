const { getDB } = require("./db");

const crearIndices = async () => {
  try {
    const db = getDB();

    // Índices para users
    await db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true, name: "email_unico" });

    // Índices para products
    await db
      .collection("products")
      .createIndex({ categoria: 1 }, { name: "idx_categoria" });
    await db
      .collection("products")
      .createIndex({ nombre: 1 }, { name: "idx_nombre" });
    await db
      .collection("products")
      .createIndex({ stock: 1 }, { name: "idx_stock" });

    // Índices para orders
    await db
      .collection("orders")
      .createIndex({ usuario: 1 }, { name: "idx_orders_usuario" });
    await db
      .collection("orders")
      .createIndex({ fecha: -1 }, { name: "idx_orders_fecha" });
    await db
      .collection("orders")
      .createIndex(
        { estado: 1, fecha: -1 },
        { name: "idx_orders_estado_fecha" },
      );

    // Índices para carts
    await db
      .collection("carts")
      .createIndex({ usuario: 1 }, { unique: true, name: "idx_carts_usuario" });

    console.log("✅ Índices creados correctamente");
  } catch (error) {
    console.error("❌ Error al crear índices:", error);
  }
};

module.exports = { crearIndices };
