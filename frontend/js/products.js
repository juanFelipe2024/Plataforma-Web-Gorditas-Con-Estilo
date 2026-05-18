const API_URL = "http://localhost:3000/api";
let todosLosProductos = [];
let currentProductsList = [];
let currentPage = 0;
const PAGE_SIZE = 9;
let categoriaActual = 'todas';
let searchQuery = '';
let sortOrder = 'none';

document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
    cargarProductos();
    actualizarBadgeCarrito();
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const searchClear = document.getElementById('search-clear');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            currentPage = 0;
            applyFilters();
        });
    }
    if (searchClear) {
        searchClear.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchInput) {
                searchInput.value = '';
                searchQuery = '';
                currentPage = 0;
                applyFilters();
                searchInput.focus();
            }
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortOrder = e.target.value;
            currentPage = 0;
            applyFilters();
        });
    }
    document.getElementById("nav-logout").addEventListener("click", cerrarSesion);
});

function verificarSesion() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) {
        document.getElementById("nav-usuario").textContent = `Hola, ${usuario.nombre}`;
    }
}

function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/products`);
        todosLosProductos = await response.json();
        // Inicializar la vista en 'todas' con paginación
        filtrarCategoria('todas', document.querySelector(".categoria-btn.activa"));
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}

function filtrarCategoria(categoria, boton) {
    // Actualizar botón activo
    document.querySelectorAll(".categoria-btn").forEach(btn => {
        btn.classList.remove("activa");
    });
    if (boton) boton.classList.add("activa");

    // Actualizar título
    const titulo = document.getElementById("titulo-categoria");
    titulo.textContent = categoria === "todas" ? "Nuestras prendas" : categoria;

    categoriaActual = categoria;
    currentPage = 0;
    applyFilters();
}

function applyFilters() {
    // Filtrar por categoría
    let lista = categoriaActual === 'todas'
        ? todosLosProductos.slice()
        : todosLosProductos.filter(p => p.categoria?.toLowerCase() === categoriaActual.toLowerCase());

    // Filtrar por búsqueda
    if (searchQuery) {
        lista = lista.filter(p => {
            const nombre = (p.nombre || '').toLowerCase();
            const descripcion = (p.descripcion || '').toLowerCase();
            return nombre.includes(searchQuery) || descripcion.includes(searchQuery);
        });
    }

    // Ordenar
    if (sortOrder === 'price-asc') {
        lista.sort((a, b) => (a.precio || 0) - (b.precio || 0));
    } else if (sortOrder === 'price-desc') {
        lista.sort((a, b) => (b.precio || 0) - (a.precio || 0));
    } else if (sortOrder === 'name-asc') {
        lista.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', undefined, { sensitivity: 'base' }));
    } else if (sortOrder === 'name-desc') {
        lista.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || '', undefined, { sensitivity: 'base' }));
    } else if (sortOrder === 'stock-asc') {
        lista.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    } else if (sortOrder === 'stock-desc') {
        lista.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    }

    currentProductsList = lista;
    renderPagina();
}
function productoCardHTML(producto) {
    const agotado = producto.stock === 0;
    return `
        <div class="producto-card ${agotado ? "producto-agotado" : ""}"
            onclick="${agotado ? "" : `window.location.href='product.html?id=${producto._id}'`}"
            style="cursor: ${agotado ? "default" : "pointer"}">
            <div class="producto-imagen-wrapper">
                <img src="${producto.imagen || 'img/placeholder.jpg'}" alt="${producto.nombre}">
                ${agotado ? `<div class="etiqueta-agotado">Agotado</div>` : ""}
            </div>
            <div class="producto-info">
                <p class="producto-nombre">${producto.nombre}</p>
                <p class="producto-precio">$${producto.precio.toLocaleString()}</p>
                <p class="producto-tallas">Tallas: ${producto.tallas.join(", ")}</p>
            </div>
        </div>
    `;
}

function renderPagina() {
    const grid = document.getElementById("productos-grid");
    const total = currentProductsList.length;
    if (total === 0) {
        grid.innerHTML = "<p style='color:#888'>No hay productos en esta categoría.</p>";
        removeVerMas();
        return;
    }

    const mostradosHasta = Math.min((currentPage + 1) * PAGE_SIZE, total);
    const visibles = currentProductsList.slice(0, mostradosHasta);

    grid.innerHTML = visibles.map(productoCardHTML).join("");

    // Botón 'Ver más'
    if (mostradosHasta < total) {
        renderVerMas();
    } else {
        removeVerMas();
    }
}

function renderVerMas() {
    removeVerMas();
    const grid = document.getElementById("productos-grid");
    const btn = document.createElement("button");
    btn.id = "btn-ver-mas";
    btn.className = "btn-primary btn-ver-mas";
    btn.textContent = "Ver más";
    btn.onclick = () => {
        currentPage++;
        renderPagina();
    };

    // Insertar después del grid
    grid.insertAdjacentElement('afterend', btn);
}

function removeVerMas() {
    const old = document.getElementById("btn-ver-mas");
    if (old) old.remove();
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