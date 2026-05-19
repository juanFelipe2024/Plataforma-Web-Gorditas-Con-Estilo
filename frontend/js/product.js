const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  cargarProducto();
  actualizarBadgeCarrito();
  document.getElementById("nav-logout").addEventListener("click", cerrarSesion);
});

function verificarSesion() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (usuario) {
    document.getElementById("nav-usuario").textContent =
      `Hola, ${usuario.nombre}`;
  }
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

async function cargarProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    const producto = await response.json();

    if (!response.ok) {
      window.location.href = "index.html";
      return;
    }

    renderProducto(producto);
  } catch (error) {
    console.error("Error al cargar el producto:", error);
  }
}

function renderProducto(producto) {
  const div = document.getElementById("producto-detalle");
  const agotado = producto.stock === 0;

  // Construir opciones de talla con stock disponible
  const tallasConStock = (producto.tallas || []).filter((t) => t.stock > 0);
  const tallasAgotadas = (producto.tallas || []).filter((t) => t.stock === 0);

  const opcionesTallas = [
    ...tallasConStock.map(
      (t) =>
        `<option value="${t.talla}">${t.talla} (${t.stock} disponibles)</option>`,
    ),
    ...tallasAgotadas.map(
      (t) =>
        `<option value="${t.talla}" disabled>${t.talla} (agotada)</option>`,
    ),
  ].join("");

  div.innerHTML = `
        <div class="detalle-imagen">
            <div class="producto-imagen-wrapper">
                <img src="${producto.imagen || "img/placeholder.jpg"}" alt="${producto.nombre}">
                ${agotado ? `<div class="etiqueta-agotado etiqueta-agotado-grande">Agotado</div>` : ""}
            </div>
        </div>
        <div class="detalle-info">
            <h2 class="detalle-nombre">${producto.nombre}</h2>
            <p class="detalle-precio">$${producto.precio.toLocaleString()}</p>
            <p class="detalle-descripcion">${producto.descripcion || "Sin descripción disponible."}</p>

            <div class="detalle-fila">
                <span class="detalle-label">Categoría:</span>
                <span>${producto.categoria || "—"}</span>
            </div>
            <div class="detalle-fila">
                <span class="detalle-label">Color:</span>
                <span>${producto.color || "—"}</span>
            </div>
            <div class="detalle-fila">
                <span class="detalle-label">Stock total:</span>
                <span>${agotado ? "Sin stock" : `${producto.stock} unidades`}</span>
            </div>

            ${
              agotado
                ? `
                <div class="agotado-aviso">
                    Este producto no está disponible por el momento.
                </div>
            `
                : `
                <div class="form-group" style="margin-top: 20px;">
                    <label>Selecciona tu talla</label>
                    <select id="talla-select" class="select-talla"
                        onchange="actualizarStockTalla(this.value, ${JSON.stringify(producto.tallas)})">
                        <option value="">Selecciona una talla</option>
                        ${opcionesTallas}
                    </select>
                </div>
                <p id="stock-talla-info" style="color: var(--muted); font-size: 0.88rem; margin-top: -6px;"></p>
                <button class="btn-primary" onclick="agregarAlCarrito('${producto._id}')">
                    Agregar al carrito
                </button>
            `
            }
        </div>
    `;
}

function actualizarStockTalla(tallaSeleccionada, tallas) {
  const infoEl = document.getElementById("stock-talla-info");
  if (!infoEl) return;

  if (!tallaSeleccionada) {
    infoEl.textContent = "";
    return;
  }

  const tallaInfo = tallas.find((t) => t.talla === tallaSeleccionada);
  if (tallaInfo) {
    infoEl.textContent = `Quedan ${tallaInfo.stock} unidades en talla ${tallaSeleccionada}`;
  }
}

async function agregarAlCarrito(productoId) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const talla = document.getElementById("talla-select").value;

  if (!talla) {
    showToast("Por favor selecciona una talla", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productoId, cantidad: 1, talla }),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Producto agregado al carrito", "success");
      await actualizarBadgeCarrito();
      bumpBadge();
    } else {
      showToast(data.error || "No se pudo agregar", "error");
    }
  } catch (error) {
    showToast("Error de conexión, intenta de nuevo", "error");
  }
}

async function actualizarBadgeCarrito() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    const badge = document.getElementById("carrito-badge");
    if (!badge) return;

    const total = data.productos
      ? data.productos.reduce((sum, item) => sum + item.cantidad, 0)
      : 0;

    if (total > 0) {
      badge.textContent = total;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  } catch (error) {
    console.error("Error al obtener badge del carrito:", error);
  }
}
