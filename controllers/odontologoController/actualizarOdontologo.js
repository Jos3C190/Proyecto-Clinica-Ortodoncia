const { validationResult } = require('express-validator');
const Odontologo = require('../../models/Odontologo');

const actualizarOdontologo = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const odontologo = await Odontologo.findById(req.params.id);
        if (!odontologo) {
            return res.status(404).json({ message: 'Odontólogo no encontrado' });
        }

        const { correo, telefono } = req.body;
        const existeOdontologo = await Odontologo.findOne({ 
            $or: [{ correo }, { telefono }],
            _id: { $ne: req.params.id } // Excluye el odontólogo actual
        });

        if (existeOdontologo) {
            return res.status(400).json({ message: 'El correo o teléfono ya están en uso' });
        }

        Object.assign(odontologo, req.body);
        await odontologo.save();
        res.status(200).json(odontologo);
    } catch (error) {
        console.error('Error en actualizarOdontologo (backend):', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = actualizarOdontologo;