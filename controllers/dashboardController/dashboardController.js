const Paciente = require('../../models/Paciente');
const Cita = require('../../models/Cita');
const Activity = require('../../models/Activity');
const moment = require('moment-timezone');
// Si en el futuro hay modelo de pagos/facturación, se importará aquí

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const totalPatients = await Paciente.countDocuments();

    // Zona horaria de El Salvador
    const tz = 'America/El_Salvador';
    // Día actual en El Salvador
    const startOfDay = moment.tz(tz).startOf('day');
    const endOfDay = moment.tz(tz).endOf('day');
    // Semana actual (lunes a domingo) en El Salvador
    moment.updateLocale('es', { week: { dow: 1 } }); // Lunes como primer día
    const startOfWeek = moment.tz(tz).startOf('week');
    const endOfWeek = moment.tz(tz).endOf('week');
    // Mes actual en El Salvador
    const startOfMonth = moment.tz(tz).startOf('month');
    const endOfMonth = moment.tz(tz).endOf('month');

    // Convertir a Date (UTC) para MongoDB
    const startOfDayUTC = startOfDay.toDate();
    const endOfDayUTC = endOfDay.toDate();
    const startOfWeekUTC = startOfWeek.toDate();
    const endOfWeekUTC = endOfWeek.toDate();
    const startOfMonthUTC = startOfMonth.toDate();
    const endOfMonthUTC = endOfMonth.toDate();

    const appointmentsToday = await Cita.countDocuments({ fecha: { $gte: startOfDayUTC, $lte: endOfDayUTC } });
    const appointmentsWeek = await Cita.countDocuments({ fecha: { $gte: startOfWeekUTC, $lte: endOfWeekUTC } });
    const monthlyAppointments = await Cita.countDocuments({ fecha: { $gte: startOfMonthUTC, $lte: endOfMonthUTC } });

    // Tratamientos completados este mes
    const Tratamiento = require('../../models/Tratamiento');
    const completedTreatments = await Tratamiento.countDocuments({ estado: 'completado', fechaFin: { $gte: startOfMonthUTC, $lte: endOfMonthUTC } });

    // Pagos pendientes y facturación (simulado)
    const pendingPayments = 0; // Simulación
    const totalRevenue = 0; // Simulación
    const revenueThisMonth = 0; // Simulación

    res.json({
      totalPatients,
      appointmentsToday,
      appointmentsWeek,
      monthlyAppointments,
      completedTreatments,
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
    // Hoy en UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    // Buscar citas próximas (fecha mayor o igual al inicio del día actual en UTC, sin importar la hora)
    const citas = await Cita.find({
      fecha: { $gte: today, $lt: tomorrow },
      estado: { $ne: 'cancelada' }
    })
      .sort({ fecha: 1, hora: 1 })
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

// GET /api/dashboard/activity?limit=10&page=1
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const [total, activities] = await Promise.all([
      Activity.countDocuments(),
      Activity.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener actividad reciente', error });
  }
}; 