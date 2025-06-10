const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const auth = require('../middleware/auth');

router.get('/', auth(['admin', 'odontologo']), pagoController.getAllPagos);
router.post('/', auth(['admin', 'odontologo']), pagoController.createPago);
router.get('/:id', auth(['admin', 'odontologo']), pagoController.getByIdPago);
router.put('/:id', auth(['admin', 'odontologo']), pagoController.updatePago);
router.delete('/:id', auth(['admin']), pagoController.deletePago);
router.get('/stats', auth(['admin', 'odontologo']), pagoController.getPagosStats);

module.exports = router; 