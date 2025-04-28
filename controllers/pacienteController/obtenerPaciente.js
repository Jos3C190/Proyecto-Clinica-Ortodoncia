const Paciente = require('../../models/Paciente');

const obtenerPaciente = async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });

        // Si es paciente, solo puede ver sus propios datos
        if (req.user.role === 'paciente' && req.user.id !== paciente._id.toString()) {
            return res.status(403).json({ message: 'Acceso denegado: solo puedes ver tus propios datos' });
        }

        res.json(paciente);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerPaciente;