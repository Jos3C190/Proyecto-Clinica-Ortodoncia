const mongoose = require('mongoose');

const ExpedienteSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  fechaCreacion: { type: Date, default: Date.now },
  observaciones: { type: String },
  tratamientos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tratamiento' }]
});

module.exports = mongoose.model('Expediente', ExpedienteSchema); 