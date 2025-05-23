const { validationResult } = require('express-validator');
const Odontologo = require('../../models/Odontologo');
const Activity = require('../../models/Activity');

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
        await Activity.create({
            type: 'odontologo',
            action: 'created',
            description: `Nuevo odontólogo registrado: ${odontologo.nombre} ${odontologo.apellido}`,
            userId: odontologo._id,
            userRole: 'Odontologo',
            userName: `${odontologo.nombre} ${odontologo.apellido}`
        });
        res.status(201).json(odontologo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = crearOdontologo;