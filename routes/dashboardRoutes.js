const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController/dashboardController');
const auth = require('../middleware/auth');

router.get('/stats', auth(['admin', 'odontologo']), dashboardController.getStats);
router.get('/recent-appointments', auth(['admin', 'odontologo']), dashboardController.getRecentAppointments);
router.get('/activity', auth(['admin', 'odontologo']), dashboardController.getRecentActivity);
router.get('/revenue-chart', auth(['admin', 'odontologo']), dashboardController.getRevenueChartData);
router.get('/patient-growth', auth(['admin', 'odontologo']), dashboardController.getPatientGrowthData);
router.get('/treatment-distribution', auth(['admin', 'odontologo']), dashboardController.getTreatmentDistributionData);
router.get('/appointment-status', auth(['admin', 'odontologo']), dashboardController.getAppointmentStatusData);
router.get('/monthly-comparison', auth(['admin', 'odontologo']), dashboardController.getMonthlyComparisonData);

module.exports = router; 