const mongoose = require('mongoose');

const TratamientoSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
  odontologo: { type: mongoose.Schema.Types.ObjectId, ref: 'Odontologo', required: true },
  descripcion: { type: String, required: true },
  tipo: { type: String, required: true },
  costo: { type: Number, required: true },
  numeroSesiones: { type: Number, required: true },
  sesionesCompletadas: { type: Number, default: 0 },
  fechaInicio: { type: Date, default: Date.now },
  fechaFin: { type: Date },
  estado: { type: String, enum: ['pendiente', 'en progreso', 'completado'], default: 'pendiente' }
});

module.exports = mongoose.model('Tratamiento', TratamientoSchema); 