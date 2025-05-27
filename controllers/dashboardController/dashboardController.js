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
    const hoy = moment.tz(tz);
    const year = hoy.year();
    const month = hoy.month() + 1; // moment.month() es 0-indexado
    const day = hoy.date();
    const fechaLocalHoy = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // Citas del día solo por fecha local (ignorando hora)
    const citasHoy = await Cita.aggregate([
      {
        $addFields: {
          fechaLocal: {
            $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: tz }
          }
        }
      },
      {
        $match: {
          fechaLocal: fechaLocalHoy
        }
      },
      {
        $count: "total"
      }
    ]);
    const appointmentsToday = citasHoy.length > 0 ? citasHoy[0].total : 0;

    // Semana y mes como antes (usando rangos)
    moment.updateLocale('es', { week: { dow: 1 } }); // Lunes como primer día
    const startOfWeek = moment.tz(tz).startOf('week');
    const startOfNextWeek = moment(startOfWeek).add(1, 'week');
    const startOfMonth = moment.tz(tz).startOf('month');
    const startOfNextMonth = moment(startOfMonth).add(1, 'month');
    const startOfWeekUTC = startOfWeek.toDate();
    const startOfNextWeekUTC = startOfNextWeek.toDate();
    const startOfMonthUTC = startOfMonth.toDate();
    const startOfNextMonthUTC = startOfNextMonth.toDate();

    // Citas de la semana solo por fecha local (ignorando hora)
    const fechasSemana = [];
    let cursorSemana = moment.tz(startOfWeek, tz);
    while (cursorSemana.isBefore(startOfNextWeek)) {
      fechasSemana.push(cursorSemana.format('YYYY-MM-DD'));
      cursorSemana.add(1, 'day');
    }
    const citasSemana = await Cita.aggregate([
      {
        $addFields: {
          fechaLocal: {
            $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: tz }
          }
        }
      },
      {
        $match: {
          fechaLocal: { $in: fechasSemana }
        }
      },
      { $count: "total" }
    ]);
    const appointmentsWeek = citasSemana.length > 0 ? citasSemana[0].total : 0;

    // Citas del mes solo por fecha local (ignorando hora)
    const diasEnMes = startOfNextMonth.diff(startOfMonth, 'days');
    const fechasMes = [];
    let cursorMes = moment.tz(startOfMonth, tz);
    for (let i = 0; i < diasEnMes; i++) {
      fechasMes.push(cursorMes.format('YYYY-MM-DD'));
      cursorMes.add(1, 'day');
    }
    const citasMes = await Cita.aggregate([
      {
        $addFields: {
          fechaLocal: {
            $dateToString: { format: "%Y-%m-%d", date: "$fecha", timezone: tz }
          }
        }
      },
      {
        $match: {
          fechaLocal: { $in: fechasMes }
        }
      },
      { $count: "total" }
    ]);
    const monthlyAppointments = citasMes.length > 0 ? citasMes[0].total : 0;

    // Tratamientos completados este mes
    const Tratamiento = require('../../models/Tratamiento');
    const completedTreatments = await Tratamiento.countDocuments({ estado: 'completado', fechaFin: { $gte: startOfMonthUTC, $lt: startOfNextMonthUTC } });

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