const { validationResult } = require('express-validator');
const Cita = require('../../models/Cita');
const Activity = require('../../models/Activity');
const Paciente = require('../../models/Paciente');
const PacienteTemporal = require('../../models/PacienteTemporal');

const eliminarCita = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const citaId = req.params.id;

        // Buscar y eliminar la cita
        const cita = await Cita.findByIdAndDelete(citaId);
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        // Registrar actividad
        let userName = '';
        let userRole = '';
        let userId = null;
        let pacienteNombre = '';
        if (cita.pacienteId) {
            const pacienteDoc = await Paciente.findById(cita.pacienteId);
            pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : cita.pacienteId.toString();
        } else if (cita.pacienteTemporalId) {
            const pacienteTempDoc = await PacienteTemporal.findById(cita.pacienteTemporalId);
            pacienteNombre = pacienteTempDoc ? `${pacienteTempDoc.nombre} ${pacienteTempDoc.apellido}` : cita.pacienteTemporalId.toString();
        }
        if (req.user) {
            userName = req.user.nombre ? `${req.user.nombre} ${req.user.apellido}` : req.user.id;
            userRole = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);
            userId = req.user.id;
        }
        await Activity.create({
            type: 'appointment',
            action: 'deleted',
            description: `Cita eliminada para ${pacienteNombre}`,
            userId,
            userRole,
            userName
        });

        res.status(200).json({ message: 'Cita eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = eliminarCita;