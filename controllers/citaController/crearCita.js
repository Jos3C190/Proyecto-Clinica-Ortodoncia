const { validationResult } = require('express-validator');
const Cita = require('../../models/Cita');
const Paciente = require('../../models/Paciente');
const PacienteTemporal = require('../../models/PacienteTemporal');
const Odontologo = require('../../models/Odontologo');
const Activity = require('../../models/Activity');

const crearCita = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const { fecha, hora, motivo, pacienteId } = req.body;
        let odontologoId = null;
        let pacienteData = null;

        // Verificar si el usuario está autenticado
        if (req.user) {
            if (req.user.role === 'paciente') {
                // Paciente autenticado
                pacienteData = await Paciente.findById(req.user.id);
                if (!pacienteData) {
                    return res.status(404).json({ message: 'Paciente no encontrado' });
                }
            } else if (req.user.role === 'odontologo' || req.user.role === 'admin') {
                // Odontólogo autenticado
                odontologoId = req.user.id;
                if (!pacienteId) {
                    return res.status(400).json({ message: 'El ID del paciente es obligatorio' });
                }
                pacienteData = await Paciente.findById(pacienteId);
                if (!pacienteData) {
                    return res.status(404).json({ message: 'Paciente no encontrado' });
                }
            }
        } else {
            // Paciente no autenticado
            const { nombre, apellido, telefono, correo } = req.body;

            // Verificar si el correo ya está registrado
            const pacienteExistente = await Paciente.findOne({ correo });
            if (pacienteExistente) {
                return res.status(400).json({ message: 'Este correo ya está registrado, por favor inicia sesión' });
            }

            // Verificar límite de citas (máximo 3 citas pendientes por correo)
            const citasPendientes = await Cita.countDocuments({
                pacienteTemporalId: { $exists: true },
                'pacienteTemporal.correo': correo,
                estado: 'pendiente'
            });
            if (citasPendientes >= 3) {
                return res.status(400).json({ message: 'Límite de citas alcanzado para este correo' });
            }

            // Crear PacienteTemporal
            let pacienteTemporal = await PacienteTemporal.findOne({ correo });
            if (!pacienteTemporal) {
                pacienteTemporal = new PacienteTemporal({ nombre, apellido, telefono, correo });
                await pacienteTemporal.save();
            }
            pacienteData = pacienteTemporal;
        }

        // Asignar odontólogo automáticamente si no es odontólogo autenticado
        if (!odontologoId) {
            const odontologos = await Odontologo.find({ role: 'odontologo' });
            if (odontologos.length === 0) {
                return res.status(400).json({ message: 'No hay odontólogos disponibles' });
            }

            // Buscar odontólogo disponible (sin cita en la fecha y hora)
            let odontologoDisponible = null;
            for (const odontologo of odontologos) {
                const citaExistente = await Cita.findOne({
                    odontologoId: odontologo._id,
                    fecha,
                    hora,
                    estado: 'pendiente'
                });
                if (!citaExistente) {
                    odontologoDisponible = odontologo;
                    break;
                }
            }

            if (!odontologoDisponible) {
                return res.status(400).json({ message: 'No hay odontólogos disponibles en el horario seleccionado' });
            }
            odontologoId = odontologoDisponible._id;
        }

        // Crear la cita
        const cita = new Cita({
            pacienteId: req.user && req.user.role === 'paciente' ? req.user.id : pacienteId,
            pacienteTemporalId: !req.user ? pacienteData._id : null,
            odontologoId,
            fecha,
            hora,
            motivo: motivo || 'Consulta inicial'
        });

        await cita.save();

        // Registrar actividad
        let userName = '';
        let userRole = '';
        let userId = null;
        let pacienteNombre = '';
        if (req.user) {
            userName = req.user.nombre ? `${req.user.nombre} ${req.user.apellido}` : req.user.id;
            userRole = req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1);
            userId = req.user.id;
            pacienteNombre = userName;
        } else if (pacienteData) {
            userName = `${pacienteData.nombre} ${pacienteData.apellido}`;
            userRole = 'Paciente';
            userId = pacienteData._id;
            pacienteNombre = userName;
        }
        await Activity.create({
            type: 'cita',
            action: 'created',
            description: `Nueva cita para ${pacienteNombre}`,
            userId,
            userRole,
            userName
        });

        res.status(201).json({ message: 'Cita creada con éxito', cita });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = crearCita;