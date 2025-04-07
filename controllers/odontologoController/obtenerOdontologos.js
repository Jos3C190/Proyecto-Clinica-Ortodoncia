const Odontologo = require('../../models/Odontologo');

const obtenerOdontologos = async (req, res) => {
    try {
        const odontologos = await Odontologo.find();
        res.status(200).json(odontologos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerOdontologos;