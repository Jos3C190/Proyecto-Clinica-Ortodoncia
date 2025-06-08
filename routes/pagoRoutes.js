const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, pagoController.getAllPagos);
router.post('/', verifyToken, pagoController.createPago);
router.put('/:id', verifyToken, pagoController.updatePago);
router.delete('/:id', verifyToken, pagoController.deletePago);
router.get('/stats', verifyToken, pagoController.getPagosStats);

module.exports = router; 