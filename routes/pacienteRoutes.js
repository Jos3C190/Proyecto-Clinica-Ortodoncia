const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const crearPaciente = require('../controllers/pacienteController/crearPaciente');
const obtenerPacientes = require('../controllers/pacienteController/obtenerPacientes');
const obtenerPaciente = require('../controllers/pacienteController/obtenerPaciente');
const actualizarPaciente = require('../controllers/pacienteController/actualizarPaciente');
const eliminarPaciente = require('../controllers/pacienteController/eliminarPaciente');

// Validaciones
const validacionesPaciente = [
    body('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').not().isEmpty().withMessage('El apellido es obligatorio'),
    body('correo').isEmail().withMessage('El correo debe ser válido'),
    body('telefono').isMobilePhone().withMessage('El teléfono debe ser válido'),
    body('direccion').not().isEmpty().withMessage('La dirección es obligatoria'),
    body('fecha_nacimiento').isDate().withMessage('La fecha de nacimiento debe ser una fecha válida'),
    body('historia_clinica').not().isEmpty().withMessage('La historia clínica es obligatoria'),
];

// Rutas

// Controlador paciente
router.post('/', validacionesPaciente, crearPaciente); // Crear paciente
router.get('/', obtenerPacientes); // Obtener pacientes
router.get('/:id', param('id').isMongoId().withMessage('ID no válido'), obtenerPaciente); // Obtener paciente por id
router.put('/:id', validacionesPaciente, param('id').isMongoId().withMessage('ID no válido'), actualizarPaciente); // Actualizar paciente
router.delete('/:id', param('id').isMongoId().withMessage('ID no válido'), eliminarPaciente); // Eliminar paciente


module.exports = router;
