const { validationResult } = require('express-validator');
const Cita = require('../../models/Cita');

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

        res.status(200).json({ message: 'Cita eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = eliminarCita;