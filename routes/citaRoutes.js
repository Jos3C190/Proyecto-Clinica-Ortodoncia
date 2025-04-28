const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const crearCita = require('../controllers/citaController/crearCita');
const obtenerCitas = require('../controllers/citaController/obtenerCitas');

// Middleware personalizado para autenticación opcional
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        req.user = null; // No autenticado
        return next();
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// Validaciones para crear cita
const validacionesCita = [
    // Validaciones comunes para todos
    body('fecha').isDate().withMessage('La fecha debe ser válida'),
    body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe estar en formato HH:MM'),
    body('motivo').optional().isString().withMessage('El motivo debe ser un texto'),

    // Validaciones para usuarios no autenticados
    body('nombre')
        .if((value, { req }) => !req.user)
        .not().isEmpty().withMessage('El nombre es obligatorio'),
    body('apellido')
        .if((value, { req }) => !req.user)
        .not().isEmpty().withMessage('El apellido es obligatorio'),
    body('telefono')
        .if((value, { req }) => !req.user)
        .isMobilePhone().withMessage('El teléfono debe ser válido'),
    body('correo')
        .if((value, { req }) => !req.user)
        .isEmail().withMessage('El correo debe ser válido'),

    // Validaciones para odontólogos autenticados
    body('pacienteId')
        .if((value, { req }) => req.user && (req.user.role === 'odontologo' || req.user.role === 'admin'))
        .isMongoId().withMessage('El ID del paciente debe ser un MongoID válido')
        .notEmpty().withMessage('El ID del paciente es obligatorio')
];

// Validaciones para obtener citas
const validacionesObtenerCitas = [
    query('estado')
        .optional()
        .isIn(['pendiente', 'completada', 'cancelada'])
        .withMessage('El estado debe ser pendiente, completada o cancelada')
];

// Rutas
router.post('/', optionalAuth, validacionesCita, crearCita);
router.get('/', auth(['paciente', 'odontologo', 'admin']), validacionesObtenerCitas, obtenerCitas);

module.exports = router;