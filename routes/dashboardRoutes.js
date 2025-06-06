const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController/dashboardController');
const auth = require('../middleware/auth');

router.get('/stats', auth(['admin', 'odontologo']), dashboardController.getStats);
router.get('/recent-appointments', auth(['admin', 'odontologo']), dashboardController.getRecentAppointments);
router.get('/activity', auth(['admin', 'odontologo']), dashboardController.getRecentActivity);

module.exports = router; 