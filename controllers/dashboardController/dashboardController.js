const Paciente = require('../../models/Paciente');
const Cita = require('../../models/Cita');
const Activity = require('../../models/Activity');
// Si en el futuro hay modelo de pagos/facturación, se importará aquí

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const totalPatients = await Paciente.countDocuments();
    const activePatients = await Paciente.countDocuments({ /* puedes definir un campo 'activo' si lo tienes */ });

    // Citas de hoy
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const appointmentsToday = await Cita.countDocuments({ fecha: { $gte: today, $lt: tomorrow } });

    // Citas de la semana
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const appointmentsWeek = await Cita.countDocuments({ fecha: { $gte: weekStart, $lt: weekEnd } });

    // Pagos pendientes y facturación (simulado)
    const pendingPayments = 5; // Simulación
    const totalRevenue = 15000; // Simulación
    const revenueThisMonth = 3200; // Simulación

    res.json({
      totalPatients,
      activePatients,
      appointmentsToday,
      appointmentsWeek,
      pendingPayments,
      totalRevenue,
      revenueThisMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error });
  }
};

// GET /api/dashboard/recent-appointments?limit=5
exports.getRecentAppointments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const citas = await Cita.find()
      .sort({ fecha: -1, hora: -1 })
      .limit(limit)
      .populate('pacienteId', 'nombre apellido')
      .populate('pacienteTemporalId', 'nombre apellido')
      .populate('odontologoId', 'nombre apellido');

    const appointments = citas.map(cita => {
      let pacienteId = '';
      let pacienteNombre = '';
      if (cita.pacienteId) {
        pacienteId = cita.pacienteId._id;
        pacienteNombre = `${cita.pacienteId.nombre} ${cita.pacienteId.apellido}`;
      } else if (cita.pacienteTemporalId) {
        pacienteId = cita.pacienteTemporalId._id;
        pacienteNombre = `${cita.pacienteTemporalId.nombre} ${cita.pacienteTemporalId.apellido}`;
      }
      return {
        id: cita._id,
        pacienteId,
        pacienteNombre,
        fecha: cita.fecha.toISOString().split('T')[0],
        hora: cita.hora,
        motivo: cita.motivo,
        estado: cita.estado,
        odontologoId: cita.odontologoId?._id,
        odontologoNombre: cita.odontologoId ? `${cita.odontologoId.nombre} ${cita.odontologoId.apellido}` : ''
      };
    });

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener citas recientes', error });
  }
};

// GET /api/dashboard/activity?limit=10
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener actividad reciente', error });
  }
}; 