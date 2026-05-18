const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            error: "Acceso denegado, token requerido"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            error: "Token inválido o expirado"
        });
    }
};

exports.verifyAdmin = (req, res, next) => {
    if (req.usuario.rol !== "admin") {
        return res.status(403).json({
            error: "Acceso denegado, se requiere rol de administrador"
        });
    }
    next();
};