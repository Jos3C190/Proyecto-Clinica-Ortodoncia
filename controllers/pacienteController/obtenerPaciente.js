const Paciente = require('../../models/Paciente');

const obtenerPaciente = async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });
        res.json(paciente);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerPaciente;
