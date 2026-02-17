const mongoose = require('mongoose');

const motoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    motor: String,
    potencia: String,
    precio: String,
    img: String
});

module.exports = mongoose.model('Moto', motoSchema);