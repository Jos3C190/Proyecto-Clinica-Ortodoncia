const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const register = require('../controllers/authController/register');
const login = require('../controllers/authController/login');

const validacionesRegistro = [
    body('correo').isEmail().withMessage('El correo debe ser válido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').not().isEmpty().withMessage('El apellido es obligatorio'),
    body('telefono').isMobilePhone().withMessage('El teléfono debe ser válido'),
    body('direccion').not().isEmpty().withMessage('La dirección es obligatoria'),
    body('fecha_nacimiento').isDate().withMessage('La fecha de nacimiento debe ser una fecha válida'),
];

const validacionesLogin = [
    body('correo').isEmail().withMessage('El correo debe ser válido'),
    body('password').not().isEmpty().withMessage('La contraseña es obligatoria'),
];

router.post('/register', validacionesRegistro, register); // Público para pacientes
router.post('/login', validacionesLogin, login); // Sin restricción por rol

module.exports = router;