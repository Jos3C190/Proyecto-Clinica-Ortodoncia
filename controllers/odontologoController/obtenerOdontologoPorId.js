const Odontologo = require('../../models/Odontologo');

const obtenerOdontologoPorId = async (req, res) => {
    try {
        const odontologo = await Odontologo.findById(req.params.id);
        if (!odontologo) {
            return res.status(404).json({ message: 'Odontólogo no encontrado' });
        }
        res.status(200).json(odontologo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerOdontologoPorId;