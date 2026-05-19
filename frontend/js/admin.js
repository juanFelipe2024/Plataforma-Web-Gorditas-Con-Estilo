const API_URL = "http://localhost:3000/api";
let productoEditandoId = null;
let statsCache = null;
let statsRangeDays = 30;
let productosCache = [];

document.addEventListener("DOMContentLoaded", () => {
  verificarAdmin();
  configurarPestanasAdmin();
  configurarFiltroRango();
  configurarBuscadorProductos();
  cargarProductos().then(cargarPedidos);
  cargarEstadisticas();

  document.getElementById("nav-logout").addEventListener("click", cerrarSesion);
  document
    .getElementById("btn-agregar")
    .addEventListener("click", agregarProducto);
  const tallasContainer = document.getElementById("tallas-container");
  if (tallasContainer) {
    tallasContainer.innerHTML = crearFilaTalla();
  }
});

function configurarPestanasAdmin() {
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const panelId = tab.dataset.panel;

      tabs.forEach((item) => item.classList.remove("active"));
      panels.forEach((panel) => {
        const isActive = panel.id === panelId;
        panel.classList.toggle("active", isActive);
        panel.hidden = !isActive;
      });

      tab.classList.add("active");

      // Si se abrió la pestaña de usuarios, cargar listado
      if (panelId === "panel-usuarios") cargarUsuarios();
      if (panelId === "panel-stats") cargarEstadisticas();
    });
  });
}

function configurarFiltroRango() {
  const rangeSelect = document.getElementById("stats-range");
  if (!rangeSelect || rangeSelect.dataset.bound) return;

  rangeSelect.dataset.bound = "true";
  statsRangeDays = Number(rangeSelect.value) || 30;
  actualizarTituloRango(statsRangeDays);

  rangeSelect.addEventListener("change", () => {
    statsRangeDays = Number(rangeSelect.value) || 30;
    actualizarTituloRango(statsRangeDays);
    if (statsCache) renderizarCharts(statsCache, statsRangeDays);
  });
}

function configurarBuscadorProductos() {
  const searchInput = document.getElementById("admin-productos-search");
  if (!searchInput || searchInput.dataset.bound) return;

  searchInput.dataset.bound = "true";

  searchInput.addEventListener("input", () => {
    renderProductosAdmin(productosCache, searchInput.value);
  });
}

function actualizarTituloRango(rangeDays) {
  const revenueTitle = document.getElementById("stats-revenue-title");
  if (revenueTitle)
    revenueTitle.textContent = `Ingresos últimos ${rangeDays} días`;
}

function filtrarRevenuePorRango(stats, rangeDays) {
  const source = stats && stats.revenueByDay ? stats.revenueByDay : [];
  if (!rangeDays || source.length <= rangeDays) return source;
  return source.slice(-rangeDays);
}

function verificarAdmin() {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!token || !usuario) {
    window.location.href = "login.html";
    return;
  }

  if (usuario.rol !== "admin") {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("nav-usuario").textContent =
    `Hola, ${usuario.nombre}`;
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

async function agregarProducto() {
  const token = localStorage.getItem("token");
  const errorDiv = document.getElementById("error-message");
  const successDiv = document.getElementById("success-message");

  errorDiv.classList.add("hidden");
  successDiv.classList.add("hidden");

  const nombre = document.getElementById("nombre").value.trim();
  const precio = document.getElementById("precio").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const color = document.getElementById("color").value.trim();
  const imagen = document.getElementById("imagen").value.trim();

  if (!nombre || !precio) {
    errorDiv.textContent = "Nombre y precio son obligatorios";
    errorDiv.classList.remove("hidden");
    return;
  }

  // Recoger tallas con su stock individual
  const filаsTallas = document.querySelectorAll(".talla-stock-fila");
  const tallas = [];
  let stockTotal = 0;

  for (const fila of filаsTallas) {
    const talla = fila.querySelector(".talla-nombre").value.trim();
    const stock = parseInt(fila.querySelector(".talla-stock").value) || 0;
    if (talla) {
      tallas.push({ talla, stock });
      stockTotal += stock;
    }
  }

  if (tallas.length === 0) {
    errorDiv.textContent = "Agrega al menos una talla con su stock";
    errorDiv.classList.remove("hidden");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre,
        precio: Number(precio),
        descripcion,
        categoria,
        color,
        tallas,
        stock: stockTotal,
        imagen,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      successDiv.textContent = "Producto agregado correctamente";
      successDiv.classList.remove("hidden");
      limpiarFormulario();
      cargarProductos();
    } else {
      errorDiv.textContent = data.error;
      errorDiv.classList.remove("hidden");
    }
  } catch (error) {
    errorDiv.textContent = "Error de conexión, intenta de nuevo";
    errorDiv.classList.remove("hidden");
  }
}

function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("color").value = "";
  document.getElementById("imagen").value = "";
  // Resetear tallas a una fila vacía
  const contenedor = document.getElementById("tallas-container");
  if (contenedor) {
    contenedor.innerHTML = crearFilaTalla();
  }
}

async function cargarPedidos() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const pedidos = await response.json();
    const container = document.getElementById("pedidos-container");

    actualizarResumenAdmin(pedidos, null);

    if (pedidos.length === 0) {
      container.innerHTML = "<p style='color:#888'>No hay pedidos todavía.</p>";
      return;
    }

    container.innerHTML = pedidos
      .map((pedido) => {
        const fecha = new Date(pedido.fecha).toLocaleDateString("es-CO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const productosHTML = (pedido.productos || [])
          .map((p) => {
            const imagen = p.imagen || "img/placeholder.jpg";
            const categoria = resolverCategoriaPedido(p);
            const precio = Number(p.precio || 0);
            const talla = p.talla || "N/A";
            return `
              <div class="pedido-item">
                <img class="pedido-item-img" src="${imagen}" alt="${p.nombre}">
                <div class="pedido-item-info">
                  <span class="pedido-item-nombre">${p.nombre}</span>
                  <span class="pedido-item-categoria">Categoría: ${categoria}</span>
                  <span class="pedido-item-talla">Talla: ${talla}</span>
                  <span class="pedido-item-cantidad">Cantidad: x${p.cantidad}</span>
                </div>
                <div class="pedido-item-meta">
                  <span class="pedido-item-precio">$${precio.toLocaleString()}</span>
                </div>
              </div>
            `;
          })
          .join("");

        return `
                <div class="pedido-card" id="pedido-${pedido._id}">
                    <div class="pedido-header">
                        <div>
                            <span class="pedido-cliente">
                                ${pedido.usuarioNombre} — ${pedido.usuarioEmail}
                            </span>
                            <p class="pedido-fecha">${fecha}</p>
                        </div>
                        <span class="pedido-total">$${pedido.total.toLocaleString()}</span>
                    </div>

                    <div class="pedido-productos pedido-items">
                      ${productosHTML}
                    </div>

                    <div class="pedido-estado-row">
                        <select
                            class="select-estado estado-${pedido.estado}"
                            onchange="actualizarEstado('${pedido._id}', this)">
                            <option value="pendiente"   ${pedido.estado === "pendiente" ? "selected" : ""}>Pendiente</option>
                            <option value="confirmado"  ${pedido.estado === "confirmado" ? "selected" : ""}>Confirmado</option>
                            <option value="cancelado"   ${pedido.estado === "cancelado" ? "selected" : ""}>Cancelado</option>
                        </select>
                        <span class="estado-feedback hidden" id="feedback-${pedido._id}">✓ Guardado</span>
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
  }
}

function resolverCategoriaPedido(productoPedido) {
  if (productoPedido.categoria) return productoPedido.categoria;
  const match = productosCache.find(
    (item) => item._id === productoPedido.productoId,
  );
  return match?.categoria || "Sin categoría";
}

async function cargarEstadisticas() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/orders/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return;

    const stats = await response.json();
    statsCache = stats;

    const revenueEl = document.getElementById("admin-revenue-month");
    const topCountEl = document.getElementById("admin-top-count");
    const topList = document.getElementById("admin-top-products-list");

    if (revenueEl)
      revenueEl.textContent = `$${Number(stats.revenueThisMonth || 0).toLocaleString()}`;
    if (topCountEl)
      topCountEl.textContent =
        stats.topProducts && stats.topProducts.length
          ? stats.topProducts.length
          : "—";

    if (topList) {
      topList.innerHTML = (stats.topProducts || [])
        .map(
          (p, i) =>
            `<li>${i + 1}. ${p.nombre || "Sin nombre"} — ${p.totalCantidad || 0} uds — $${Number(p.totalRevenue || 0).toLocaleString()}</li>`,
        )
        .join("");
    }

    // Render para nueva pestaña de estadísticas
    const statRevenueMonth = document.getElementById("stat-revenue-month");
    const statOrdersMonth = document.getElementById("stat-orders-month");
    const statTopProduct = document.getElementById("stat-top-product");
    const statsTopProducts = document.getElementById("stats-top-products");

    if (statRevenueMonth)
      statRevenueMonth.textContent = `$${Number(stats.revenueThisMonth || 0).toLocaleString()}`;
    if (statOrdersMonth)
      statOrdersMonth.textContent = stats.ordersCountThisMonth || 0;
    if (statTopProduct)
      statTopProduct.textContent =
        stats.topProducts && stats.topProducts[0]
          ? `${stats.topProducts[0].nombre} — ${stats.topProducts[0].totalCantidad} uds`
          : "—";

    // Lista top productos en panel
    if (statsTopProducts) {
      statsTopProducts.innerHTML = (stats.topProducts || [])
        .map(
          (p, i) =>
            `<li style="margin-bottom:6px"><strong style="color:#3b2b24">${i + 1}. ${p.nombre || "Sin nombre"}</strong> — ${p.totalCantidad || 0} uds — $${Number(p.totalRevenue || 0).toLocaleString()}</li>`,
        )
        .join("");
    }

    renderizarCharts(stats, statsRangeDays);

    // Botón exportar CSV
    const btnExport = document.getElementById("btn-export-csv");
    if (btnExport) {
      btnExport.onclick = () => {
        const rows = [];
        rows.push(["fecha", "revenue", "orders"]);
        const filtered = filtrarRevenuePorRango(stats, statsRangeDays);
        filtered.forEach((r) => rows.push([r._id, r.revenue, r.orders]));
        const csv = rows
          .map((r) =>
            r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
          )
          .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "estadisticas_ventas.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };
    }
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
  }
}

function renderizarCharts(stats, rangeDays) {
  if (!stats) return;

  actualizarTituloRango(rangeDays);

  try {
    const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;
    const chartColors = {
      accent: "rgba(15,118,110,0.9)",
      accentSoft: "rgba(15,118,110,0.18)",
      primary: "rgba(211,86,58,0.9)",
      primarySoft: "rgba(211,86,58,0.18)",
      grid: "rgba(160,140,120,0.18)",
    };

    const revenueCanvas = document.getElementById("chart-revenue");
    if (revenueCanvas) {
      const filtered = filtrarRevenuePorRango(stats, rangeDays);
      const labels = filtered.map((r) => r._id);
      const data = filtered.map((r) => r.revenue || 0);
      if (window._revenueChart) window._revenueChart.destroy();

      const ctx = revenueCanvas.getContext("2d");
      const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        revenueCanvas.height || 220,
      );
      gradient.addColorStop(0, "rgba(15,118,110,0.35)");
      gradient.addColorStop(1, "rgba(15,118,110,0.03)");

      window._revenueChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Ingresos diarios",
              data,
              borderColor: chartColors.accent,
              backgroundColor: gradient,
              fill: true,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: "#fff",
              pointBorderColor: chartColors.accent,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${formatCurrency(context.parsed.y)}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#6f645a" } },
            y: {
              grid: { color: chartColors.grid },
              ticks: {
                callback: (value) => formatCurrency(value),
                color: "#6f645a",
              },
            },
          },
        },
      });
    }

    const topCanvas = document.getElementById("chart-top-products");
    if (topCanvas) {
      const topItems = (stats.topProducts || []).slice(0, 6);
      const labels = topItems.map((p) => p.nombre || "Sin nombre");
      const data = topItems.map((p) => p.totalCantidad || 0);
      if (window._topProductsChart) window._topProductsChart.destroy();

      const ctx2 = topCanvas.getContext("2d");
      const barGradient = ctx2.createLinearGradient(
        0,
        0,
        topCanvas.width || 320,
        0,
      );
      barGradient.addColorStop(0, chartColors.primary);
      barGradient.addColorStop(1, chartColors.primarySoft);

      window._topProductsChart = new Chart(ctx2, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Unidades",
              data,
              backgroundColor: barGradient,
              borderRadius: 12,
              barThickness: 16,
            },
          ],
        },
        options: {
          indexAxis: "y",
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.parsed.x} uds`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: chartColors.grid },
              ticks: { color: "#6f645a" },
            },
            y: { grid: { display: false }, ticks: { color: "#6f645a" } },
          },
        },
      });
    }
  } catch (e) {
    console.warn("Chart.js no disponible o error al renderizar charts", e);
  }
}

async function cargarProductos() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const productos = await response.json();

    actualizarResumenAdmin(null, productos);

    productosCache = Array.isArray(productos) ? productos : [];
    renderProductosAdmin(productosCache);
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

function renderProductosAdmin(productos, searchQuery = "") {
  const container = document.getElementById("productos-container");
  if (!container) return;

  if (!productos || productos.length === 0) {
    container.innerHTML =
      "<p class='carrito-vacio'>No hay productos en el catálogo.</p>";
    return;
  }

  const lista = filtrarProductosAdmin(productos, searchQuery);

  if (lista.length === 0) {
    container.innerHTML =
      "<p class='carrito-vacio'>No hay productos que coincidan con la búsqueda.</p>";
    return;
  }

  container.innerHTML = lista
    .map(
      (producto, index) => `
            <div class="admin-producto-card" style="--i:${index}">
                <div class="admin-producto-info">
                    <strong>${producto.nombre}</strong>
                    <p>Precio: $${producto.precio.toLocaleString()} — Stock: ${producto.stock}</p>
                    <p>Categoría: ${producto.categoria || "Sin categoría"}</p>
                    <p class="admin-producto-desc">${producto.descripcion || "Sin descripción"}</p>
                    <p>Tallas: ${(producto.tallas || []).join(", ") || "Sin tallas"}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-editar-producto"
                        onclick="abrirModalEditar('${producto._id}')">
                        Editar
                    </button>
                    <button class="btn-eliminar-producto"
                        onclick="eliminarProducto('${producto._id}')">
                        Eliminar
                    </button>
                </div>
            </div>
        `,
    )
    .join("");
}

function filtrarProductosAdmin(productos, searchQuery) {
  const query = String(searchQuery || "")
    .trim()
    .toLowerCase();
  if (!query) return productos;

  return productos.filter((producto) => {
    const nombre = String(producto.nombre || "").toLowerCase();
    const descripcion = String(producto.descripcion || "").toLowerCase();
    const categoria = String(producto.categoria || "").toLowerCase();
    return (
      nombre.includes(query) ||
      descripcion.includes(query) ||
      categoria.includes(query)
    );
  });
}

async function cargarUsuarios() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("usuarios-container");

  if (!token) {
    container.innerHTML = "<p style='color:#888'>Acceso no autorizado.</p>";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      container.innerHTML =
        "<p style='color:#888'>No se pueden obtener los usuarios.</p>";
      return;
    }

    const users = await response.json();

    if (!Array.isArray(users) || users.length === 0) {
      container.innerHTML =
        "<p style='color:#888'>No hay usuarios registrados.</p>";
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
            <div class="admin-producto-card">
                <div class="admin-producto-info">
                    <strong>${user.nombre}</strong>
                    <p>${user.email}</p>
                    <p style="color:var(--muted)">Rol: ${user.rol || "cliente"}</p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn-eliminar-producto" onclick="eliminarUsuario('${user._id}')">Eliminar</button>
                </div>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    container.innerHTML =
      "<p style='color:#888'>Error de conexión al obtener usuarios.</p>";
  }
}

async function eliminarUsuario(userId) {
  const token = localStorage.getItem("token");
  if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      cargarUsuarios();
    } else {
      const data = await response.json();
      alert(data.error || "No fue posible eliminar el usuario");
    }
  } catch (error) {
    alert("Error de conexión, intenta de nuevo");
  }
}

function actualizarResumenAdmin(pedidos, productos) {
  const pedidosTotal = document.getElementById("admin-total-pedidos");
  const productosTotal = document.getElementById("admin-total-productos");
  const pendientesTotal = document.getElementById("admin-pedidos-pendientes");

  if (Array.isArray(pedidos)) {
    pedidosTotal.textContent = pedidos.length;
    pendientesTotal.textContent = pedidos.filter(
      (pedido) => pedido.estado === "pendiente",
    ).length;
  }

  if (Array.isArray(productos)) {
    productosTotal.textContent = productos.length;
  }
}

async function eliminarProducto(productoId) {
  const token = localStorage.getItem("token");

  if (!confirm("¿Estás seguro de eliminar este producto?")) return;

  try {
    const response = await fetch(`${API_URL}/products/${productoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      cargarProductos();
    }
  } catch (error) {
    alert("Error de conexión, intenta de nuevo");
  }
}

async function actualizarEstado(pedidoId, selectEl) {
  const token = localStorage.getItem("token");
  const nuevoEstado = selectEl.value;

  // Actualizar color del select inmediatamente
  selectEl.className = `select-estado estado-${nuevoEstado}`;

  try {
    const response = await fetch(`${API_URL}/orders/${pedidoId}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    if (response.ok) {
      const feedback = document.getElementById(`feedback-${pedidoId}`);
      feedback.classList.remove("hidden");
      setTimeout(() => feedback.classList.add("hidden"), 2000);
      cargarEstadisticas();
    } else {
      alert("Error al actualizar el estado");
      cargarPedidos();
    }
  } catch (error) {
    alert("Error de conexión, intenta de nuevo");
    cargarPedidos();
  }
}

async function abrirModalEditar(productoId) {
  productoEditandoId = productoId;

  // Limpiar mensajes previos
  document.getElementById("editar-error").classList.add("hidden");
  document.getElementById("editar-success").classList.add("hidden");

  try {
    const response = await fetch(`${API_URL}/products/${productoId}`);
    const producto = await response.json();

    // Precargar los datos actuales
    document.getElementById("editar-nombre").value = producto.nombre || "";
    document.getElementById("editar-precio").value = producto.precio || "";
    document.getElementById("editar-descripcion").value =
      producto.descripcion || "";
    document.getElementById("editar-categoria").value =
      producto.categoria || "";
    document.getElementById("editar-color").value = producto.color || "";
    // Después
    const contenedorEditar = document.getElementById("editar-tallas-container");
    contenedorEditar.innerHTML = "";
    if (producto.tallas && producto.tallas.length > 0) {
      producto.tallas.forEach((t) => {
        contenedorEditar.insertAdjacentHTML(
          "beforeend",
          crearFilaTalla(t.talla, t.stock, true),
        );
      });
    } else {
      contenedorEditar.innerHTML = crearFilaTalla("", 0, true);
    }
    document.getElementById("editar-imagen").value = producto.imagen || "";

    // Mostrar preview de la imagen actual
    const preview = document.getElementById("editar-preview");
    if (producto.imagen) {
      preview.src = producto.imagen;
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }

    // Actualizar preview cuando cambie la URL
    document.getElementById("editar-imagen").oninput = function () {
      if (this.value) {
        preview.src = this.value;
        preview.style.display = "block";
      } else {
        preview.style.display = "none";
      }
    };

    document.getElementById("modal-editar").classList.remove("hidden");
  } catch (error) {
    alert("Error al cargar el producto");
  }
}

function cerrarModalEditar() {
  document.getElementById("modal-editar").classList.add("hidden");
  productoEditandoId = null;
}

async function guardarEdicion() {
  const token = localStorage.getItem("token");
  const errorDiv = document.getElementById("editar-error");
  const successDiv = document.getElementById("editar-success");

  errorDiv.classList.add("hidden");
  successDiv.classList.add("hidden");

  const nombre = document.getElementById("editar-nombre").value.trim();
  const precio = document.getElementById("editar-precio").value.trim();

  if (!nombre || !precio) {
    errorDiv.textContent = "Nombre y precio son obligatorios";
    errorDiv.classList.remove("hidden");
    return;
  }

  // Recoger tallas con stock del modal de edición
  const filasTallas = document.querySelectorAll(".editar-talla-stock-fila");
  const tallas = [];
  let stockTotal = 0;

  for (const fila of filasTallas) {
    const talla = fila.querySelector(".talla-nombre").value.trim();
    const stock = parseInt(fila.querySelector(".talla-stock").value) || 0;
    if (talla) {
      tallas.push({ talla, stock });
      stockTotal += stock;
    }
  }

  if (tallas.length === 0) {
    errorDiv.textContent = "Agrega al menos una talla con su stock";
    errorDiv.classList.remove("hidden");
    return;
  }

  const body = {
    nombre,
    precio: Number(precio),
    descripcion: document.getElementById("editar-descripcion").value.trim(),
    categoria: document.getElementById("editar-categoria").value.trim(),
    color: document.getElementById("editar-color").value.trim(),
    tallas,
    stock: stockTotal,
    imagen: document.getElementById("editar-imagen").value.trim(),
  };

  try {
    const response = await fetch(`${API_URL}/products/${productoEditandoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      successDiv.textContent = "Producto actualizado correctamente";
      successDiv.classList.remove("hidden");
      cargarProductos();
      setTimeout(() => cerrarModalEditar(), 1500);
    } else {
      errorDiv.textContent = data.error;
      errorDiv.classList.remove("hidden");
    }
  } catch (error) {
    errorDiv.textContent = "Error de conexión, intenta de nuevo";
    errorDiv.classList.remove("hidden");
  }
}

function crearFilaTalla(talla = "", stock = 0, esEdicion = false) {
  const claseBase = esEdicion ? "editar-talla-stock-fila" : "talla-stock-fila";
  const TALLAS = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  const opciones = TALLAS.map(
    (t) =>
      `<option value="${t}" ${t === talla ? "selected" : ""}>${t}</option>`,
  ).join("");

  return `
        <div class="${claseBase}" style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
            <select class="talla-nombre select-talla" style="flex:1">
                <option value="">Talla</option>
                ${opciones}
            </select>
            <input type="number" class="talla-stock" placeholder="Stock" min="0"
                value="${stock}"
                style="width:90px; padding:10px 8px; border:1px solid rgba(189,176,163,0.9); border-radius:10px;">
            <button type="button" onclick="this.parentElement.remove()"
                style="background:#ffe9e6; color:#bb2f22; border:none; border-radius:8px;
                       padding:8px 12px; cursor:pointer; font-weight:700;">✕</button>
        </div>
    `;
}

function agregarFilaTalla(esEdicion = false) {
  const contenedorId = esEdicion
    ? "editar-tallas-container"
    : "tallas-container";
  const contenedor = document.getElementById(contenedorId);
  if (contenedor) {
    contenedor.insertAdjacentHTML(
      "beforeend",
      crearFilaTalla("", 0, esEdicion),
    );
  }
}
