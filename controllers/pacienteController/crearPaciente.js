const { validationResult } = require('express-validator');
const Paciente = require('../../models/Paciente');
const Activity = require('../../models/Activity');

const crearPaciente = async (req, res) => {
    // Validar los errores
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const paciente = new Paciente(req.body);
        await paciente.save();
        await Activity.create({
            type: 'patient',
            action: 'created',
            description: `Nuevo paciente registrado: ${paciente.nombre} ${paciente.apellido}`,
            userId: paciente._id,
            userRole: 'Paciente',
            userName: `${paciente.nombre} ${paciente.apellido}`
        });
        res.status(201).json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = crearPaciente;
