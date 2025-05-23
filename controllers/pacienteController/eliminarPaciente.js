const Paciente = require('../../models/Paciente');
const Activity = require('../../models/Activity');

const eliminarPaciente = async (req, res) => {
    try {
        const paciente = await Paciente.findByIdAndDelete(req.params.id);
        if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });
        await Activity.create({
            type: 'patient',
            action: 'deleted',
            description: `Paciente eliminado: ${paciente.nombre} ${paciente.apellido}`,
            userId: paciente._id,
            userRole: 'Paciente',
            userName: `${paciente.nombre} ${paciente.apellido}`
        });
        res.json({ message: 'Paciente eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = eliminarPaciente;
