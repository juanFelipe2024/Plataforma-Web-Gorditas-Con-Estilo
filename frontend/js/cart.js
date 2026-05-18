const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  cargarCarrito();
  document.getElementById("nav-logout").addEventListener("click", cerrarSesion);
  document
    .getElementById("btn-confirmar")
    .addEventListener("click", abrirModalPago);
});

function verificarSesion() {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (usuario)
    document.getElementById("nav-usuario").textContent =
      `Hola, ${usuario.nombre}`;
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

async function cargarCarrito() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const itemsDiv = document.getElementById("carrito-items");
    const resumenDiv = document.getElementById("carrito-resumen");

    if (!data.productos || data.productos.length === 0) {
      itemsDiv.innerHTML = `<p class="carrito-vacio">Tu carrito está vacío. <a href="index.html">Ver catálogo</a></p>`;
      resumenDiv.classList.add("hidden");
      return;
    }

    let total = 0;
    // Después:
    itemsDiv.innerHTML = data.productos
      .map((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        return `
        <div class="carrito-item" style="--i:${index}">
            <img class="carrito-item-thumb" src="${item.imagen || "img/placeholder.jpg"}" alt="${item.nombre}">
            <div class="carrito-item-info">
                <p class="carrito-item-nombre">${item.nombre}</p>
                <p class="carrito-item-precio">$${(item.precio || 0).toLocaleString()}</p>
                <p class="carrito-item-cantidad">Talla: ${item.talla} — Cantidad: ${item.cantidad}</p>
            </div>
            <button class="btn-eliminar"
                onclick="eliminarDelCarrito('${item.productoId}', '${item.talla}')">
                Eliminar
            </button>
        </div>`;
      })
      .join("");

    document.getElementById("carrito-total").textContent =
      `$${total.toLocaleString()}`;
    resumenDiv.classList.remove("hidden");
  } catch (error) {
    console.error("Error al cargar el carrito:", error);
  }
}

async function eliminarDelCarrito(productoId, talla) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(
      `${API_URL}/cart/${productoId}?talla=${talla}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (response.ok) {
      cargarCarrito();
      showToast("Producto eliminado", "success");
    }
  } catch (error) {
    alert("Error de conexión, intenta de nuevo");
  }
}

// ── Modal de pago ──────────────────────────────────────────────

function abrirModalPago() {
  mostrarSeccion("seccion-metodo");
  document.getElementById("modal-pago").classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("modal-pago").classList.add("hidden");
  document.getElementById("form-transferencia").reset();
  document.getElementById("form-tarjeta").reset();
}

function mostrarSeccion(id) {
  [
    "seccion-metodo",
    "seccion-transferencia",
    "seccion-tarjeta",
    "seccion-procesando",
    "seccion-exito",
  ].forEach((s) => document.getElementById(s).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function elegirMetodo(metodo) {
  if (metodo === "transferencia") mostrarSeccion("seccion-transferencia");
  if (metodo === "tarjeta") mostrarSeccion("seccion-tarjeta");
}

async function procesarPago(metodoPago) {
  mostrarSeccion("seccion-procesando");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await confirmarCompra(metodoPago);
}

async function confirmarCompra(metodoPago) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/cart/confirmar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ metodoPago }),
    });

    const data = await response.json();

    if (response.ok) {
      mostrarSeccion("seccion-exito");
      document.getElementById("exito-total").textContent =
        `$${data.pedido.total.toLocaleString()}`;
      document.getElementById("exito-metodo").textContent =
        metodoPago === "transferencia"
          ? "Transferencia bancaria"
          : "Tarjeta de crédito/débito";
    } else {
      cerrarModal();
      alert(data.error);
    }
  } catch (error) {
    cerrarModal();
    alert("Error de conexión, intenta de nuevo");
  }
}

function finalizarCompra() {
  cerrarModal();
  window.location.href = "index.html";
}
