const { validationResult } = require('express-validator');
const Cita = require('../../models/Cita');

const obtenerCitas = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const { estado, page = 1, limit = 10 } = req.query;
        const { id: userId, role } = req.user;

        // Construir la query según el rol
        let query = {};

        if (role === 'paciente') {
            // Pacientes solo ven sus citas
            query = {
                $or: [
                    { pacienteId: userId },
                    { pacienteTemporalId: userId }
                ]
            };
        } else if (role === 'odontologo') {
            // Odontólogos ven sus citas asignadas
            query = { odontologoId: userId };
        } else if (role === 'admin') {
            // Administradores ven todas las citas
            query = {};
        }

        // Añadir filtro por estado si se proporciona
        if (estado) {
            query.estado = estado;
        }

        const total = await Cita.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const citas = await Cita.find(query)
            .populate('pacienteId', 'nombre apellido correo')
            .populate('pacienteTemporalId', 'nombre apellido correo')
            .populate('odontologoId', 'nombre apellido especialidad')
            .sort({ fecha: 1, hora: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        if (citas.length === 0) {
            return res.status(200).json({ message: 'No hay citas disponibles' });
        }

        res.status(200).json({
            data: citas,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerCitas;