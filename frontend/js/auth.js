const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btn-login");
    if (btnLogin) {
        btnLogin.addEventListener("click", login);
    }
});

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("error-message");

    errorDiv.classList.add("hidden");

    if (!email || !password) {
        errorDiv.textContent = "Por favor completa todos los campos";
        errorDiv.classList.remove("hidden");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error;
            errorDiv.classList.remove("hidden");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        if (data.usuario.rol === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "index.html";
        }

    } catch (error) {
        errorDiv.textContent = "Error de conexión, intenta de nuevo";
        errorDiv.classList.remove("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btnRegister = document.getElementById("btn-register");
    if (btnRegister) {
        btnRegister.addEventListener("click", register);
    }
});

async function register() {
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("error-message");
    const successDiv = document.getElementById("success-message");

    errorDiv.classList.add("hidden");
    successDiv.classList.add("hidden");

    if (!nombre || !email || !password) {
        errorDiv.textContent = "Nombre, correo y contraseña son obligatorios";
        errorDiv.classList.remove("hidden");
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = "La contraseña debe tener mínimo 6 caracteres";
        errorDiv.classList.remove("hidden");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, telefono, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error;
            errorDiv.classList.remove("hidden");
            return;
        }

        successDiv.textContent = "Cuenta creada correctamente, redirigiendo...";
        successDiv.classList.remove("hidden");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        errorDiv.textContent = "Error de conexión, intenta de nuevo";
        errorDiv.classList.remove("hidden");
    }
}