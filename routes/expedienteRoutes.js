const express = require('express');
const router = express.Router();
const expedienteController = require('../controllers/expedienteController/expedienteController');
const auth = require('../middleware/auth');

router.post('/', auth(['admin', 'odontologo']), expedienteController.crearExpediente);
router.get('/', auth(['admin', 'odontologo']), expedienteController.obtenerExpedientes);
router.get('/:id', auth(['admin', 'odontologo']), expedienteController.obtenerExpedientePorId);
router.put('/:id', auth(['admin', 'odontologo']), expedienteController.actualizarExpediente);
router.delete('/:id', auth(['admin', 'odontologo']), expedienteController.eliminarExpediente);

module.exports = router; 