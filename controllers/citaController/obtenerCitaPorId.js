const Cita = require('../../models/Cita');

const obtenerCitaPorId = async (req, res) => {
    try {
        const cita = await Cita.findById(req.params.id)
            .populate('pacienteId', 'nombre apellido correo telefono')
            .populate('pacienteTemporalId', 'nombre apellido correo telefono')
            .populate('odontologoId', 'nombre apellido especialidad correo telefono');
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        res.status(200).json(cita);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerCitaPorId; 