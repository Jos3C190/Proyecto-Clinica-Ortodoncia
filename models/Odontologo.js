const { Schema, model, Types } = require('mongoose');

const odontologoSchema = new Schema({
    _id: { type: Types.ObjectId, auto: true }, 
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    telefono: { type: String, required: true, unique: true },
    especialidad: { type: String, required: true },
    fecha_nacimiento: { type: Date, required: true }
});

module.exports = model('Odontologo', odontologoSchema);
