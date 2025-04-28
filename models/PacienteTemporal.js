const { Schema, model } = require('mongoose');

const pacienteTemporalSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    telefono: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
    createdAt: { type: Date, default: Date.now, expires: '30d' } // Expira en 30 días
});

module.exports = model('PacienteTemporal', pacienteTemporalSchema);