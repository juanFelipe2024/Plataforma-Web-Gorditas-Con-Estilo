const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
    cargarMisPedidos();
    actualizarBadgeCarrito();
    document.getElementById("nav-logout").addEventListener("click", cerrarSesion);
});

function verificarSesion() {
    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (usuario) {
        document.getElementById("nav-usuario").textContent = `Hola, ${usuario.nombre}`;
    }
}

function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

async function cargarMisPedidos() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("pedidos-container");

    try {
        const response = await fetch(`${API_URL}/orders/mispedidos`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const pedidos = await response.json();

        if (pedidos.length === 0) {
            container.innerHTML = `
                <div class="pedidos-vacio">
                    <p>Aún no tienes pedidos realizados.</p>
                    <a href="index.html" class="btn-primary" style="display:inline-block; width:auto; padding: 12px 28px; text-decoration:none; margin-top: 16px;">
                        Ver catálogo
                    </a>
                </div>`;
            return;
        }

        container.innerHTML = pedidos.map((pedido, pedidoIdx) => {
            const fecha = new Date(pedido.fecha).toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            const estadoClase = {
                pendiente: "estado-pendiente",
                confirmado: "estado-confirmado",
                cancelado: "estado-cancelado"
            }[pedido.estado] || "estado-pendiente";

            const productosHTML = pedido.productos.map((p, idx) => {
                const expandId = `expand-${pedidoIdx}-${idx}`;
                return `
                    <div class="pedido-producto-item">
                        <div class="pedido-producto-fila" onclick="toggleDetalleProducto('${expandId}')">
                            <span class="pedido-producto-nombre">${p.nombre}</span>
                            <div class="pedido-producto-derecha">
                                <span class="pedido-producto-cantidad">x${p.cantidad}</span>
                                <span class="pedido-producto-subtotal">$${(p.precio * p.cantidad).toLocaleString()}</span>
                                <span class="pedido-expand-icon">▼</span>
                            </div>
                        </div>
                        <div id="${expandId}" class="pedido-detalle-expandido hidden">
                            <img class="pedido-detalle-imagen" src="${p.imagen || 'img/placeholder.jpg'}" alt="${p.nombre}">
                            <div class="pedido-detalle-info">
                                <p><strong>Descripción:</strong> ${p.descripcion || 'N/A'}</p>
                                <p><strong>Talla:</strong> ${p.talla || 'N/A'}</p>
                                <p><strong>Precio unitario:</strong> $${(p.precio || 0).toLocaleString()}</p>
                                <p><strong>Cantidad:</strong> ${p.cantidad}</p>
                                <p><strong>Subtotal:</strong> $${(p.precio * p.cantidad).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");

            return `
                <div class="mi-pedido-card">
                    <div class="mi-pedido-header">
                        <div>
                            <p class="mi-pedido-fecha">${fecha}</p>
                            <p class="mi-pedido-id">Pedido #${pedido._id.slice(-6).toUpperCase()}</p>
                        </div>
                        <span class="estado-badge ${estadoClase}">${pedido.estado}</span>
                    </div>

                    <div class="mi-pedido-productos">
                        ${productosHTML}
                    </div>

                    <div class="mi-pedido-footer">
                        <span class="mi-pedido-total">Total: $${pedido.total.toLocaleString()}</span>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        container.innerHTML = `<p style="color:#888">Error al cargar tus pedidos. Intenta de nuevo.</p>`;
    }
}

function toggleDetalleProducto(elementId) {
    const elemento = document.getElementById(elementId);
    const botonClick = event?.target.closest('.pedido-producto-fila');
    const icono = botonClick?.querySelector('.pedido-expand-icon');
    
    if (elemento) {
        elemento.classList.toggle('hidden');
        if (icono) {
            icono.style.transform = elemento.classList.contains('hidden') 
                ? 'rotate(0deg)' 
                : 'rotate(180deg)';
        }
    }
}

async function actualizarBadgeCarrito() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: { "Authorization": `Bearer ${token}` }
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