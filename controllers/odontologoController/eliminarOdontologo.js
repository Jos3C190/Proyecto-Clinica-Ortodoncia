const Odontologo = require('../../models/Odontologo');

const eliminarOdontologo = async (req, res) => {
    try {
        const odontologo = await Odontologo.findById(req.params.id);
        if (!odontologo) {
            return res.status(404).json({ message: 'Odontólogo no encontrado' });
        }

        await odontologo.deleteOne();
        res.status(200).json({ message: 'Odontólogo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = eliminarOdontologo;