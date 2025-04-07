const Paciente = require('../../models/Paciente');

const eliminarPaciente = async (req, res) => {
    try {
        const paciente = await Paciente.findByIdAndDelete(req.params.id);
        if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });
        res.json({ message: 'Paciente eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = eliminarPaciente;
