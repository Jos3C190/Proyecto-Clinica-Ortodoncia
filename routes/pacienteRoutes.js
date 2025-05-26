const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth'); // Importamos el middleware

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
    body('historia_clinica').optional().isString().withMessage('La historia clínica debe ser texto'), // Opcional
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const validacionesPacienteRegistro = [
    ...validacionesPaciente.slice(0, -1), // Todas menos la última
    body('password').isLength({ min: 6 }).withMessage('La contraseña es obligatoria y debe tener al menos 6 caracteres'),
];

// Rutas
router.post('/', auth(['admin']), validacionesPacienteRegistro, crearPaciente); // Solo admin crea pacientes manualmente
router.get('/', auth(['odontologo', 'admin']), obtenerPacientes); // Odontólogos y admins ven todos los pacientes
router.get('/:id', auth(['paciente', 'odontologo', 'admin']), param('id').isMongoId(), obtenerPaciente); // Pacientes ven solo su ID
router.put('/:id', auth(['odontologo', 'admin']), validacionesPaciente, param('id').isMongoId(), actualizarPaciente); // Odontólogos y admins actualizan
router.delete('/:id', auth(['admin']), param('id').isMongoId(), eliminarPaciente); // Solo admin elimina

module.exports = router;