const Paciente = require('../../models/Paciente');
const Cita = require('../../models/Cita');
const Activity = require('../../models/Activity');
const Pago = require('../../models/Pago');
const moment = require('moment-timezone');
const Tratamiento = require('../../models/Tratamiento');
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
    const completedTreatments = await Tratamiento.countDocuments({ estado: 'completado', fechaFin: { $gte: startOfMonthUTC, $lt: startOfNextMonthUTC } });

    // Pagos pendientes y facturación
    const pendingPaymentsCount = await Pago.countDocuments({ estado: 'pendiente' });
    const totalRevenue = await Pago.aggregate([
      { $match: { estado: 'pagado' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenueValue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const monthlyRevenue = await Pago.aggregate([
      { $match: { estado: 'pagado', fechaPago: { $gte: startOfMonthUTC, $lt: startOfNextMonthUTC } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const monthlyRevenueValue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;

    res.json({
      totalPatients,
      appointmentsToday,
      appointmentsWeek,
      monthlyAppointments,
      completedTreatments,
      pendingPayments: pendingPaymentsCount,
      totalRevenue: totalRevenueValue,
      revenueThisMonth: monthlyRevenueValue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error });
  }
};

// GET /api/dashboard/revenue-chart
exports.getRevenueChartData = async (req, res) => {
  try {
    const { year: queryYear } = req.query;
    const currentYear = moment.tz('America/El_Salvador').year();
    const targetYear = queryYear ? parseInt(queryYear, 10) : currentYear;

    const tz = 'America/El_Salvador';
    const monthsData = [];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const startOfMonth = moment.tz(`${targetYear}-${monthNumber}-01`, 'YYYY-MM-DD', tz).startOf('month');
      const endOfMonth = moment(startOfMonth).endOf('month');

      const monthlyRevenue = await Pago.aggregate([
        {
          $match: {
            estado: 'pagado',
            fechaPago: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      const monthAmount = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;
      const weeksData = [];

      // Calcular ingresos por semana dentro del mes
      let currentWeekStart = moment(startOfMonth).startOf('week'); 
      while (currentWeekStart.isBefore(endOfMonth) || currentWeekStart.isSame(endOfMonth, 'day')) {
        const weekNumber = currentWeekStart.week() - moment(startOfMonth).startOf('month').week() + 1; 

        const weekEnd = moment(currentWeekStart).endOf('week');
        
        // Ajustar el final de la semana para que no exceda el fin de mes
        const actualWeekEnd = (weekEnd.isAfter(endOfMonth)) ? endOfMonth : weekEnd;

        const weeklyRevenue = await Pago.aggregate([
          {
            $match: {
              estado: 'pagado',
              fechaPago: { $gte: currentWeekStart.toDate(), $lte: actualWeekEnd.toDate() }
            }
          },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const weekAmount = weeklyRevenue.length > 0 ? weeklyRevenue[0].total : 0;
        weeksData.push({ week: weekNumber, amount: parseFloat(weekAmount.toFixed(2)) });

        currentWeekStart.add(1, 'week');
      }

      monthsData.push({
        month: monthNumber,
        monthName: monthNames[i],
        amount: parseFloat(monthAmount.toFixed(2)),
        weeks: weeksData
      });
    }

    res.status(200).json({
      success: true,
      data: {
        year: targetYear,
        months: monthsData
      }
    });

  } catch (error) {
    console.error('Error al obtener datos del gráfico de ingresos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos del gráfico de ingresos', error: error.message });
  }
};

// GET /api/dashboard/patient-growth
exports.getPatientGrowthData = async (req, res) => {
  try {
    const { year: queryYear } = req.query;
    const currentYear = moment.tz('America/El_Salvador').year();
    const targetYear = queryYear ? parseInt(queryYear, 10) : currentYear;

    const tz = 'America/El_Salvador';
    const monthsData = [];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let overallTotalPatients = 0; // Para el total acumulado a lo largo del año
    let totalNewPatientsYear = 0;
    let totalGrowthPercentage = 0;
    let growthMonthsCount = 0;
    let bestMonth = { name: '', growthPercentage: -1 };
    let worstMonth = { name: '', growthPercentage: Infinity };

    for (let i = 0; i < 12; i++) {
      const monthNumber = i + 1;
      const startOfMonth = moment.tz(`${targetYear}-${monthNumber}-01`, 'YYYY-MM-DD', tz).startOf('month');
      const endOfMonth = moment(startOfMonth).endOf('month');

      const newPatientsThisMonth = await Paciente.countDocuments({
        createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
      });

      totalNewPatientsYear += newPatientsThisMonth;
      overallTotalPatients += newPatientsThisMonth; // Acumular total pacientes del año

      const totalPatientsUpToMonth = await Paciente.countDocuments({
        createdAt: { $lte: endOfMonth.toDate() }
      });

      // Pacientes antes del inicio de este mes para el porcentaje de crecimiento
      const totalPatientsBeforeMonth = await Paciente.countDocuments({
        createdAt: { $lt: startOfMonth.toDate() }
      });

      let growthPercentage = 0;
      if (totalPatientsBeforeMonth > 0) {
        growthPercentage = (newPatientsThisMonth / totalPatientsBeforeMonth) * 100;
      }
      
      if (newPatientsThisMonth > 0) { // Solo consideramos meses con nuevos pacientes para el promedio de crecimiento
        totalGrowthPercentage += growthPercentage;
        growthMonthsCount++;
      }

      // Actualizar mejor y peor mes (basado en newPatients, o growthPercentage, según prefieras)
      // Aquí lo hacemos basado en growthPercentage como en tu ejemplo
      if (growthPercentage > bestMonth.growthPercentage) {
        bestMonth = { name: monthNames[i], growthPercentage: growthPercentage };
      }
      if (newPatientsThisMonth > 0 && growthPercentage < worstMonth.growthPercentage) { // Solo si hubo crecimiento
        worstMonth = { name: monthNames[i], growthPercentage: growthPercentage };
      }

      monthsData.push({
        month: monthNames[i],
        monthNumber: monthNumber,
        newPatients: newPatientsThisMonth,
        totalPatients: totalPatientsUpToMonth,
        growthPercentage: parseFloat(growthPercentage.toFixed(2))
      });
    }

    const averageGrowthPercentage = growthMonthsCount > 0 ? (totalGrowthPercentage / growthMonthsCount) : 0;

    res.status(200).json({
      success: true,
      data: {
        period: "year",
        year: targetYear,
        months: monthsData,
        summary: {
          totalNewPatients: totalNewPatientsYear,
          averageGrowthPercentage: parseFloat(averageGrowthPercentage.toFixed(2)),
          bestMonth: bestMonth.name,
          worstMonth: worstMonth.name
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener datos de crecimiento de pacientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos de crecimiento de pacientes', error: error.message });
  }
};

// GET /api/dashboard/treatment-distribution
exports.getTreatmentDistributionData = async (req, res) => {
  try {
    const { year: queryYear } = req.query;
    const currentYear = moment.tz('America/El_Salvador').year();
    const targetYear = queryYear ? parseInt(queryYear, 10) : currentYear;

    const tz = 'America/El_Salvador';
    const startOfYear = moment.tz(`${targetYear}-01-01`, 'YYYY-MM-DD', tz).startOf('year');
    const endOfYear = moment(startOfYear).endOf('year');

    // Obtener todos los tratamientos creados o iniciados en el año objetivo
    const treatmentsAggregation = await Tratamiento.aggregate([
      {
        $match: {
          // Filtrar tratamientos por fecha de inicio o creación dentro del año objetivo
          fechaInicio: { $gte: startOfYear.toDate(), $lte: endOfYear.toDate() }
        }
      },
      {
        $lookup: {
          from: 'pagos', // Colección de pagos
          localField: '_id', // Campo del Tratamiento
          foreignField: 'tratamiento', // Campo en el Pago que referencia al Tratamiento
          as: 'relatedPayments'
        }
      },
      {
        $addFields: {
          // Calcular el ingreso total de pagos completados para este tratamiento
          paidRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$relatedPayments',
                    as: 'payment',
                    cond: { $eq: ['$$payment.estado', 'pagado'] }
                  }
                },
                as: 'paidPayment',
                in: '$$paidPayment.total'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$tipo', // Agrupar por tipo de tratamiento
          count: { $sum: 1 }, // Contar tratamientos de este tipo
          revenue: { $sum: '$paidRevenue' }, // Sumar el ingreso de los pagos completados para este tipo de tratamiento
          totalTreatmentCostForType: { $sum: '$costo' } // Sumar el costo original de los tratamientos de este tipo
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          count: 1,
          revenue: { $round: ['$revenue', 2] },
          averageCost: { $cond: [{ $gt: ['$count', 0] }, { $round: [{ $divide: ['$totalTreatmentCostForType', '$count'] }, 2] }, 0] }
        }
      }
    ]);

    const totalTreatments = treatmentsAggregation.reduce((acc, curr) => acc + curr.count, 0);
    const totalRevenue = treatmentsAggregation.reduce((acc, curr) => acc + curr.revenue, 0);

    let mostPopular = { type: '', count: -1 };
    let mostProfitable = { type: '', revenue: -1 };

    const treatmentsData = treatmentsAggregation.map(t => {
      const percentage = totalTreatments > 0 ? (t.count / totalTreatments) * 100 : 0;

      if (t.count > mostPopular.count) {
        mostPopular = { type: t.type, count: t.count };
      }
      if (t.revenue > mostProfitable.revenue) {
        mostProfitable = { type: t.type, revenue: t.revenue };
      }

      return {
        type: t.type,
        count: t.count,
        percentage: parseFloat(percentage.toFixed(2)),
        revenue: t.revenue,
        averageCost: t.averageCost
      };
    });

    res.status(200).json({
      success: true,
      data: {
        period: "year",
        year: targetYear,
        treatments: treatmentsData,
        summary: {
          totalTreatments: totalTreatments,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          mostPopular: mostPopular.type,
          mostProfitable: mostProfitable.type
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener datos de distribución de tratamientos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos de distribución de tratamientos', error: error.message });
  }
};

// GET /api/dashboard/appointment-status
exports.getAppointmentStatusData = async (req, res) => {
  try {
    const { year: queryYear, month: queryMonth } = req.query;
    const tz = 'America/El_Salvador';
    const today = moment.tz(tz);

    const targetYear = queryYear ? parseInt(queryYear, 10) : today.year();
    const targetMonth = queryMonth ? parseInt(queryMonth, 10) : (today.month() + 1);

    let startDate, endDate, periodLabel;

    if (queryMonth) {
      // Datos para un mes específico
      startDate = moment.tz(`${targetYear}-${targetMonth}-01`, 'YYYY-MM-DD', tz).startOf('month');
      endDate = moment(startDate).endOf('month');
      periodLabel = "month";
    } else {
      // Por defecto, datos para todo el año
      startDate = moment.tz(`${targetYear}-01-01`, 'YYYY-MM-DD', tz).startOf('year');
      endDate = moment(startDate).endOf('year');
      periodLabel = "year";
    }

    const statusAggregation = await Cita.aggregate([
      {
        $match: {
          fecha: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        }
      },
      {
        $lookup: {
          from: 'pacientes',
          localField: 'pacienteId',
          foreignField: '_id',
          as: 'pacienteInfo'
        }
      },
      {
        $lookup: {
          from: 'pacientetemporals', // Asegúrate de que este es el nombre correcto de tu colección para PacienteTemporal
          localField: 'pacienteTemporalId',
          foreignField: '_id',
          as: 'pacienteTemporalInfo'
        }
      },
      {
        $match: {
          $or: [
            { 'pacienteInfo': { $ne: [] } }, // El paciente principal existe
            { 'pacienteTemporalInfo': { $ne: [] } } // El paciente temporal existe
          ]
        }
      },
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      }
    ]);

    const totalAppointments = statusAggregation.reduce((acc, curr) => acc + curr.count, 0);
    const statusDistribution = statusAggregation.map(item => {
      const percentage = totalAppointments > 0 ? (item.count / totalAppointments) * 100 : 0;
      let label = item.status;
      switch (item.status) {
        case 'completada': label = 'Completadas'; break;
        case 'pendiente': label = 'Pendientes'; break;
        case 'cancelada': label = 'Canceladas'; break;
        default: label = item.status; break;
      }
      return { ...item, percentage: parseFloat(percentage.toFixed(2)), label };
    });

    const completedCount = statusDistribution.find(s => s.status === 'completada')?.count || 0;
    const cancelledCount = statusDistribution.find(s => s.status === 'cancelada')?.count || 0;

    const completionRate = totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;
    const cancellationRate = totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        period: periodLabel,
        year: targetYear,
        month: queryMonth ? targetMonth : undefined, // Incluir el mes solo si se consultó por mes
        statusDistribution: statusDistribution,
        summary: {
          totalAppointments: totalAppointments,
          completionRate: parseFloat(completionRate.toFixed(2)),
          cancellationRate: parseFloat(cancellationRate.toFixed(2))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener datos de estado de citas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos de estado de citas', error: error.message });
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