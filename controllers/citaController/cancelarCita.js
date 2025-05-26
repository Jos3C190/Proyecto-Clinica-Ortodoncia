const Cita = require('../../models/Cita');
const Activity = require('../../models/Activity');
const Paciente = require('../../models/Paciente');
const PacienteTemporal = require('../../models/PacienteTemporal');

const cancelarCita = async (req, res) => {
    try {
        const citaId = req.params.id;
        const userId = req.user.id;

        // Buscar la cita
        const cita = await Cita.findById(citaId);
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        // Verificar que la cita pertenezca al paciente autenticado
        if (
            (cita.pacienteId && cita.pacienteId.toString() !== userId) &&
            (cita.pacienteTemporalId && cita.pacienteTemporalId.toString() !== userId)
        ) {
            return res.status(403).json({ message: 'No tienes permiso para cancelar esta cita.' });
        }

        // Cambiar el estado a cancelada
        cita.estado = 'cancelada';
        await cita.save();

        // Obtener nombre del paciente
        let pacienteNombre = '';
        if (cita.pacienteId) {
            const pacienteDoc = await Paciente.findById(cita.pacienteId);
            pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : cita.pacienteId.toString();
        } else if (cita.pacienteTemporalId) {
            const pacienteTempDoc = await PacienteTemporal.findById(cita.pacienteTemporalId);
            pacienteNombre = pacienteTempDoc ? `${pacienteTempDoc.nombre} ${pacienteTempDoc.apellido}` : cita.pacienteTemporalId.toString();
        }

        // Registrar actividad
        await Activity.create({
            type: 'cita',
            action: 'cancelada',
            description: `${pacienteNombre} canceló su cita para ${cita.motivo}`,
            userId: req.user.id,
            userRole: 'Paciente',
            userName: pacienteNombre
        });

        res.status(200).json({ message: 'Cita cancelada con éxito', cita });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = cancelarCita; 