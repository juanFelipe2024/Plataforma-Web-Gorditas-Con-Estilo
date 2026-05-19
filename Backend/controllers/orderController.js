const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

exports.obtenerPedidos = async (req, res) => {
  try {
    const db = getDB();
    const pedidos = await db
      .collection("orders")
      .find({})
      .sort({ fecha: -1 })
      .toArray();

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los pedidos" });
  }
};

exports.obtenerPedidosCliente = async (req, res) => {
  try {
    const db = getDB();
    const usuarioId = req.usuario.id;

    const pedidos = await db
      .collection("orders")
      .find({ usuario: usuarioId })
      .sort({ fecha: -1 })
      .toArray();

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los pedidos" });
  }
};

exports.actualizarEstadoPedido = async (req, res) => {
  try {
    const db = getDB();
    const { estado } = req.body;
    const estadosValidos = ["pendiente", "confirmado", "cancelado"];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const pedido = await db
      .collection("orders")
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: { estado } },
        { returnDocument: "after" },
      );

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.status(200).json({
      message: "Estado actualizado correctamente",
      pedido,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el estado del pedido" });
  }
};

exports.obtenerEstadisticas = async (req, res) => {
  try {
    const db = getDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

    // Ingresos y cantidad de pedidos del mes usando aggregate pipeline
    const revenueThisMonthAgg = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            fecha: { $gte: startOfMonth },
            estado: "confirmado",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            ordersCount: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const revenueThisMonth = revenueThisMonthAgg[0]?.totalRevenue || 0;
    const ordersCountThisMonth = revenueThisMonthAgg[0]?.ordersCount || 0;

    // Top productos vendidos con $unwind y $group
    const topProductsAgg = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            fecha: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            estado: "confirmado",
          },
        },
        { $unwind: "$productos" },
        {
          $group: {
            _id: "$productos.productoId",
            nombre: { $first: "$productos.nombre" },
            totalCantidad: { $sum: "$productos.cantidad" },
            totalRevenue: {
              $sum: { $multiply: ["$productos.cantidad", "$productos.precio"] },
            },
          },
        },
        { $sort: { totalCantidad: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    // Ingresos por dia ultimos 30 dias
    const revenueByDayAgg = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            fecha: { $gte: last30 },
            estado: "confirmado",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$fecha" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.status(200).json({
      revenueThisMonth,
      ordersCountThisMonth,
      topProducts: topProductsAgg,
      revenueByDay: revenueByDayAgg,
    });
  } catch (error) {
    console.error("Error obtenerEstadisticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};
