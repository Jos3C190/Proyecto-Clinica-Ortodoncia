const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

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
];

const validacionId = [
    param('id').isMongoId().withMessage('El ID debe ser un MongoID válido')
];

// Rutas
router.post('/', validacionesOdontologo, crearOdontologo); // Crear odontólogo
router.get('/', obtenerOdontologos); // Obtener todos los odontólogos
router.get('/:id', validacionId, obtenerOdontologoPorId); // Obtener odontólogo por ID
router.put('/:id', validacionId.concat(validacionesOdontologo), actualizarOdontologo); // Actualizar odontólogo
router.delete('/:id', validacionId, eliminarOdontologo); // Eliminar odontólogo

module.exports = router;