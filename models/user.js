const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: { type: String, trim: true },
    apellido: { type: String, trim: true },

    correo: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true
    },

    celular: { type: String, trim: true },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: { type: String, required: true },


    pais: { type: String },
    moto_preferida: { type: String },
    verificado: { type: Boolean, default: false },
    codigoTemp: { type: String },

    role: {
        type: String,
        enum: ['client', 'admin'],
        default: 'client'
    },
    fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);