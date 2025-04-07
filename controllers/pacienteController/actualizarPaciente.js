const { validationResult } = require('express-validator');
const Paciente = require('../../models/Paciente');

const actualizarPaciente = async (req, res) => {
    // Validar los errores
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const paciente = await Paciente.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });
        res.json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = actualizarPaciente;
