const { validationResult } = require('express-validator');
const Cita = require('../../models/Cita');

const actualizarCita = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const { fecha, hora, motivo, estado } = req.body;
        const citaId = req.params.id;

        // Buscar la cita
        const cita = await Cita.findById(citaId);
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        // Verificar disponibilidad del nuevo horario (si se cambia fecha o hora)
        if (fecha || hora) {
            const nuevaFecha = fecha || cita.fecha;
            const nuevaHora = hora || cita.hora;

            // Buscar citas existentes para el mismo odontólogo en el nuevo horario
            const citaExistente = await Cita.findOne({
                odontologoId: cita.odontologoId,
                fecha: nuevaFecha,
                hora: nuevaHora,
                estado: { $ne: 'cancelada' },
                _id: { $ne: citaId } // Excluir la cita actual
            });

            if (citaExistente) {
                return res.status(400).json({ message: 'El horario ya está ocupado por otra cita' });
            }

            // Actualizar fecha y hora si se proporcionaron
            if (fecha) cita.fecha = fecha;
            if (hora) cita.hora = nuevaHora;
        }

        // Actualizar otros campos si se proporcionaron
        if (motivo) cita.motivo = motivo;
        if (estado) cita.estado = estado;

        // Guardar la cita actualizada
        await cita.save();

        // Devolver la cita poblada con detalles
        const citaActualizada = await Cita.findById(citaId)
            .populate('pacienteId', 'nombre apellido correo')
            .populate('pacienteTemporalId', 'nombre apellido correo')
            .populate('odontologoId', 'nombre apellido especialidad');

        res.status(200).json({ message: 'Cita actualizada con éxito', cita: citaActualizada });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = actualizarCita;