const { Schema, model, Types } = require('mongoose');

const citaSchema = new Schema({
    pacienteId: { type: Types.ObjectId, ref: 'Paciente', required: false },
    pacienteTemporalId: { type: Types.ObjectId, ref: 'PacienteTemporal', required: false },
    odontologoId: { type: Types.ObjectId, ref: 'Odontologo', required: true },
    fecha: { type: Date, required: true },
    hora: { type: String, required: true }, // Formato HH:MM
    motivo: { type: String, default: 'Consulta inicial' },
    estado: { type: String, enum: ['pendiente', 'completada', 'cancelada'], default: 'pendiente' },
    createdAt: { type: Date, default: Date.now }
});

// Índice para evitar conflictos de horario
citaSchema.index({ odontologoId: 1, fecha: 1, hora: 1 }, { unique: true });

module.exports = model('Cita', citaSchema);