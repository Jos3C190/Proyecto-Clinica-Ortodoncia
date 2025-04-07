const { Schema, model } = require('mongoose');

const pacienteSchema = new Schema({
    id_paciente: { type: Schema.Types.ObjectId, required: true, auto: true }, 
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    correo: { type: String, required: true, unique: true }, 
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    fecha_nacimiento: { type: Date, required: true }, 
    historia_clinica: { type: String, required: true }
});

module.exports = model('Paciente', pacienteSchema);
