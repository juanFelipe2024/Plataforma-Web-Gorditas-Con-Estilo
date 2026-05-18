const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    telefono: {
        type: String
    },
    rol: {
        type: String,
        enum: ["cliente", "admin"],
        default: "cliente"
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);