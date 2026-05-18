require("dotenv").config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// ── Validación de variables de entorno ──────────────────
const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET"];
const missingVars = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.error("❌ Faltan variables de entorno obligatorias:");
    missingVars.forEach(key => console.error(`   - ${key}`));
    console.error("\nRevisa tu archivo .env en la raíz del backend.");
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.error("❌ JWT_SECRET debe tener al menos 32 caracteres.");
    process.exit(1);
}

console.log("✅ Variables de entorno verificadas correctamente");
// ────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const { baseLimiter } = require("./middleware/rateLimiters");
const sanitizeRequest = require("./middleware/sanitizeRequest");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
connectDB();

app.disable("x-powered-by");

if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
}

const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
app.use(sanitizeRequest);
app.use(baseLimiter);

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
    res.send("API Gorditas con Estilo funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});