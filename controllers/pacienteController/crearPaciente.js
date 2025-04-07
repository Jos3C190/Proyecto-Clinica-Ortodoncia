const { validationResult } = require('express-validator');
const Paciente = require('../../models/Paciente');

const crearPaciente = async (req, res) => {
    // Validar los errores
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const paciente = new Paciente(req.body);
        await paciente.save();
        res.status(201).json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = crearPaciente;
