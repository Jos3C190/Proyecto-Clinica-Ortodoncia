const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth'); // Importamos el middleware

// Importar controladores
const crearOdontologo = require('../controllers/odontologoController/crearOdontologo');
const obtenerOdontologos = require('../controllers/odontologoController/obtenerOdontologos');
const obtenerOdontologoPorId = require('../controllers/odontologoController/obtenerOdontologoPorId');
const actualizarOdontologo = require('../controllers/odontologoController/actualizarOdontologo');
const eliminarOdontologo = require('../controllers/odontologoController/eliminarOdontologo');

// Validaciones
const validacionesOdontologo = [
    body('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').not().isEmpty().withMessage('El apellido es obligatorio'),
    body('correo').isEmail().withMessage('El correo debe ser válido'),
    body('telefono').isMobilePhone().withMessage('El teléfono debe ser válido'),
    body('especialidad').not().isEmpty().withMessage('La especialidad es obligatoria'),
    body('fecha_nacimiento').isDate().withMessage('La fecha de nacimiento debe ser una fecha válida'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'), // Añadimos validación de password
];

const validacionesOdontologoUpdate = [
    body('nombre').optional().not().isEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').optional().not().isEmpty().withMessage('El apellido es obligatorio'),
    body('correo').optional().isEmail().withMessage('El correo debe ser válido'),
    body('telefono').optional().isMobilePhone().withMessage('El teléfono debe ser válido'),
    body('especialidad').optional().not().isEmpty().withMessage('La especialidad es obligatoria'),
    body('fecha_nacimiento').optional().isDate().withMessage('La fecha de nacimiento debe ser una fecha válida'),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const validacionId = [
    param('id').isMongoId().withMessage('El ID debe ser un MongoID válido')
];

// Rutas
router.post('/', auth(['admin']), validacionesOdontologo, crearOdontologo); // Solo admin crea odontólogos/administradores
router.get('/', auth(['odontologo', 'admin']), obtenerOdontologos); // Odontólogos y admins ven la lista
router.get('/:id', auth(['odontologo', 'admin']), validacionId, obtenerOdontologoPorId); // Odontólogos y admins ven detalles
router.put('/:id', auth(['admin']), validacionId.concat(validacionesOdontologoUpdate), actualizarOdontologo); // Solo admin actualiza
router.delete('/:id', auth(['admin']), validacionId, eliminarOdontologo); // Solo admin elimina

module.exports = router;