const Paciente = require('../../models/Paciente');

const obtenerPacientes = async (req, res) => {
    try {
        const pacientes = await Paciente.find();
        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerPacientes;
