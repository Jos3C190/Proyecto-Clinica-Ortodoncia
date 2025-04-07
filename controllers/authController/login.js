const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Paciente = require('../../models/Paciente');
const Odontologo = require('../../models/Odontologo');

const login = async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) { 
        return res.status(400).json({ errores: errors.array() }); 
    }

    const { correo, password } = req.body;

    try {
        // Buscar usuario en ambas colecciones
        let usuario = await Paciente.findOne({ correo });
        if (!usuario) {
            usuario = await Odontologo.findOne({ correo });
        }

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: usuario._id, role: usuario.role }, // Role en el token
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, role: usuario.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = login;