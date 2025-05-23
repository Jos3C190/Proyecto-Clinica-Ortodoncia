const express = require('express');
const router = express.Router();
const tratamientoController = require('../controllers/tratamientoController/tratamientoController');
const auth = require('../middleware/auth');

router.post('/', auth(['admin', 'odontologo']), tratamientoController.crearTratamiento);
router.get('/', auth(['admin', 'odontologo']), tratamientoController.obtenerTratamientos);
router.get('/:id', auth(['admin', 'odontologo']), tratamientoController.obtenerTratamientoPorId);
router.put('/:id', auth(['admin', 'odontologo']), tratamientoController.actualizarTratamiento);
router.delete('/:id', auth(['admin', 'odontologo']), tratamientoController.eliminarTratamiento);

module.exports = router; 