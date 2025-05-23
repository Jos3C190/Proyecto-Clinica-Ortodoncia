const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const pacienteSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    correo: { type: String, required: true, unique: true }, 
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    fecha_nacimiento: { type: Date, required: true }, 
    historia_clinica: { type: String }, // Opcional, no required
    password: { type: String, required: true }, // Campo para contraseña
    role: { type: String, default: 'paciente' } // Rol fijo como paciente
});

// Hashear contraseña antes de guardar
pacienteSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = model('Paciente', pacienteSchema);