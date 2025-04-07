const { validationResult } = require('express-validator');
const Paciente = require('../../models/Paciente');

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { 
        return res.status(400).json({ errores: errors.array() });
    }

    const { correo, password, nombre, apellido, telefono, direccion, fecha_nacimiento } = req.body;

    try {
        // Verificar si el correo ya existe
        const usuarioExistente = await Paciente.findOne({ correo });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'El correo ya está en uso' });
        }

        // Crear nuevo paciente
        const nuevoPaciente = new Paciente({
            correo,
            password,
            nombre,
            apellido,
            telefono,
            direccion,
            fecha_nacimiento
        });

        await nuevoPaciente.save();
        res.status(201).json({ message: 'Paciente registrado con éxito', usuario: nuevoPaciente });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = register;