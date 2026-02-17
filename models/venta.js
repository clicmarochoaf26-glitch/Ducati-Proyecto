const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
    transaccionId: { type: String, unique: true },
    cliente: {
        id: mongoose.Schema.Types.ObjectId,
        nombre: String,
        email: String,
        pais: String
    },
    moto: {
        nombre: String,
        precio: Number
    },
    sedeElegida: String,
    fecha: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['Pendiente', 'Pago Verificado', 'Enviada', 'Entregada'],
        default: 'Pendiente'
    }
});

module.exports = mongoose.model('Venta', ventaSchema);