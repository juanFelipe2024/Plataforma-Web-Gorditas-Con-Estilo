const Order = require("../models/Order");

exports.obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Order.find().sort({ fecha: -1 });

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener los pedidos",
    });
  }
};

exports.obtenerPedidosCliente = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const pedidos = await Order.find({ usuario: usuarioId }).sort({
      fecha: -1,
    });

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener los pedidos",
    });
  }
};

exports.actualizarEstadoPedido = async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ["pendiente", "confirmado", "cancelado"];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: "Estado no válido",
      });
    }

    const pedido = await Order.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true },
    ).populate("usuario", "nombre email");

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido no encontrado",
      });
    }

    res.status(200).json({
      message: "Estado actualizado correctamente",
      pedido,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar el estado del pedido",
    });
  }
};

// Estadísticas para administrador
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const Order = require("../models/Order");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

    // Ingresos y cantidad de pedidos del mes
    const revenueThisMonthAgg = await Order.aggregate([
      { $match: { fecha: { $gte: startOfMonth }, estado: "confirmado" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          ordersCount: { $sum: 1 },
        },
      },
    ]);

    const revenueThisMonth =
      (revenueThisMonthAgg[0] && revenueThisMonthAgg[0].totalRevenue) || 0;
    const ordersCountThisMonth =
      (revenueThisMonthAgg[0] && revenueThisMonthAgg[0].ordersCount) || 0;

    // Top productos vendidos (últimos 90 días para dar contexto)
    const topProductsAgg = await Order.aggregate([
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
    ]);

    // Ingresos por día últimos 30 días
    const revenueByDayAgg = await Order.aggregate([
      { $match: { fecha: { $gte: last30 }, estado: "confirmado" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

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
