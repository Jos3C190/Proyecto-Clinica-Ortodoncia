const { Schema, model, Types } = require('mongoose');
const bcrypt = require('bcryptjs');

const odontologoSchema = new Schema({
    _id: { type: Types.ObjectId, auto: true }, 
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    telefono: { type: String, required: true, unique: true },
    especialidad: { type: String, required: true },
    fecha_nacimiento: { type: Date, required: true },
    password: { type: String, required: true }, // Campo para contraseña
    role: { type: String, enum: ['odontologo', 'admin'], default: 'odontologo' } // Rol: odontologo o admin
});

// Hashear contraseña antes de guardar
odontologoSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = model('Odontologo', odontologoSchema);