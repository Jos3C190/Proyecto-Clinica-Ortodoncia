const { validationResult } = require('express-validator');
const Odontologo = require('../../models/Odontologo');

const crearOdontologo = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        const { correo, telefono } = req.body;
        const existeOdontologo = await Odontologo.findOne({ 
            $or: [{ correo }, { telefono }] 
        });

        if (existeOdontologo) {
            return res.status(400).json({ message: 'El correo o teléfono ya están en uso' });
        }

        const odontologo = new Odontologo(req.body);
        await odontologo.save();
        res.status(201).json(odontologo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = crearOdontologo;