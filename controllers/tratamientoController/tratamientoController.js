const Tratamiento = require('../../models/Tratamiento');
const Activity = require('../../models/Activity');
const Expediente = require('../../models/Expediente');
const Paciente = require('../../models/Paciente');
const moment = require('moment-timezone');

exports.crearTratamiento = async (req, res) => {
  try {
    // Verificar si el paciente tiene un expediente
    const expedienteExistente = await Expediente.findOne({ paciente: req.body.paciente });
    if (!expedienteExistente) {
      return res.status(400).json({ message: 'No se puede crear un tratamiento sin un expediente asociado al paciente.' });
    }

    const tratamiento = new Tratamiento(req.body);
    await tratamiento.save();
    await Expediente.findOneAndUpdate(
      { paciente: tratamiento.paciente },
      { $addToSet: { tratamientos: tratamiento._id } }
    );
    const pacienteDoc = await Paciente.findById(tratamiento.paciente);
    const pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : tratamiento.paciente.toString();
    await Activity.create({
      type: 'tratamiento',
      action: 'created',
      description: `Nuevo tratamiento creado para paciente ${pacienteNombre}`,
      userId: tratamiento.odontologo,
      userRole: 'Odontologo',
      userName: tratamiento.odontologo.toString()
    });
    res.status(201).json(tratamiento);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear tratamiento', error });
  }
};

exports.obtenerTratamientos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Tratamiento.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const tratamientos = await Tratamiento.find()
      .populate('paciente', 'nombre apellido correo telefono direccion fecha_nacimiento')
      .populate('odontologo', 'nombre apellido correo telefono especialidad fecha_nacimiento')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({
      data: tratamientos,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tratamientos', error });
  }
};

exports.obtenerTratamientoPorId = async (req, res) => {
  try {
    const tratamiento = await Tratamiento.findById(req.params.id)
      .populate('paciente', 'nombre apellido correo telefono direccion fecha_nacimiento')
      .populate('odontologo', 'nombre apellido correo telefono especialidad fecha_nacimiento');
    if (!tratamiento) return res.status(404).json({ message: 'Tratamiento no encontrado' });
    res.json(tratamiento);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tratamiento', error });
  }
};

exports.actualizarTratamiento = async (req, res) => {
  try {
    // Obtener el tratamiento antes de actualizar para comparar el estado
    const tratamientoPrevio = await Tratamiento.findById(req.params.id);
    let updateData = { ...req.body };
    // Si el estado cambia a completado, asegurarse de que fechaFin sea la fecha actual en El Salvador si no es válida o es futura
    if (
      tratamientoPrevio &&
      tratamientoPrevio.estado !== 'completado' &&
      req.body.estado === 'completado'
    ) {
      let fechaFin = req.body.fechaFin ? new Date(req.body.fechaFin) : moment().tz('America/El_Salvador').toDate();
      const now = moment().tz('America/El_Salvador').toDate();
      if (!req.body.fechaFin || isNaN(fechaFin.getTime()) || fechaFin > now) {
        fechaFin = now;
      }
      updateData.fechaFin = fechaFin;
    }
    const tratamiento = await Tratamiento.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!tratamiento) return res.status(404).json({ message: 'Tratamiento no encontrado' });
    const pacienteDoc = await Paciente.findById(tratamiento.paciente);
    const pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : tratamiento.paciente.toString();
    // Si el estado cambió a completado, registrar actividad especial
    if (tratamientoPrevio && tratamientoPrevio.estado !== 'completado' && tratamiento.estado === 'completado') {
      await Activity.create({
        type: 'tratamiento',
        action: 'completed',
        description: `${pacienteNombre} completó su tratamiento de ${tratamiento.tipo}`,
        userId: tratamiento.paciente,
        userRole: 'Paciente',
        userName: pacienteNombre
      });
    } else {
      await Activity.create({
        type: 'tratamiento',
        action: 'updated',
        description: `Tratamiento actualizado para paciente ${pacienteNombre}`,
        userId: tratamiento.odontologo,
        userRole: 'Odontologo',
        userName: tratamiento.odontologo.toString()
      });
    }
    res.json(tratamiento);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar tratamiento', error });
  }
};

exports.eliminarTratamiento = async (req, res) => {
  try {
    const tratamiento = await Tratamiento.findByIdAndDelete(req.params.id);
    if (!tratamiento) return res.status(404).json({ message: 'Tratamiento no encontrado' });
    await Expediente.findOneAndUpdate(
      { paciente: tratamiento.paciente },
      { $pull: { tratamientos: tratamiento._id } }
    );
    const pacienteDoc = await Paciente.findById(tratamiento.paciente);
    const pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : tratamiento.paciente.toString();
    await Activity.create({
      type: 'tratamiento',
      action: 'deleted',
      description: `Tratamiento eliminado para paciente ${pacienteNombre}`,
      userId: tratamiento.odontologo,
      userRole: 'Odontologo',
      userName: tratamiento.odontologo.toString()
    });
    res.json({ message: 'Tratamiento eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tratamiento', error });
  }
}; 