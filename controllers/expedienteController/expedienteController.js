const Expediente = require('../../models/Expediente');
const Activity = require('../../models/Activity');
const Paciente = require('../../models/Paciente');

exports.crearExpediente = async (req, res) => {
  try {
    // Verificar si ya existe un expediente para el paciente
    const existe = await Expediente.findOne({ paciente: req.body.paciente });
    if (existe) {
      return res.status(400).json({ message: 'Ya existe un expediente para este paciente.' });
    }
    const expediente = new Expediente(req.body);
    await expediente.save();
    const pacienteDoc = await Paciente.findById(expediente.paciente);
    const pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : expediente.paciente.toString();
    await Activity.create({
      type: 'expediente',
      action: 'created',
      description: `Nuevo expediente creado para paciente ${pacienteNombre}`,
      userId: expediente.paciente,
      userRole: 'Paciente',
      userName: pacienteNombre
    });
    res.status(201).json(expediente);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear expediente', error });
  }
};

exports.obtenerExpedientes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Expediente.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const expedientes = await Expediente.find()
      .populate('paciente', 'nombre apellido correo telefono direccion fecha_nacimiento')
      .populate({
        path: 'tratamientos',
        populate: {
          path: 'odontologo',
          select: 'nombre apellido correo telefono especialidad fecha_nacimiento'
        },
        select: '-__v'
      })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({
      data: expedientes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener expedientes', error });
  }
};

exports.obtenerExpedientePorId = async (req, res) => {
  try {
    const expediente = await Expediente.findById(req.params.id)
      .populate('paciente', 'nombre apellido correo telefono direccion fecha_nacimiento')
      .populate({
        path: 'tratamientos',
        populate: {
          path: 'odontologo',
          select: 'nombre apellido correo telefono especialidad fecha_nacimiento'
        },
        select: '-__v'
      });
    if (!expediente) return res.status(404).json({ message: 'Expediente no encontrado' });
    res.json(expediente);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener expediente', error });
  }
};

exports.actualizarExpediente = async (req, res) => {
  try {
    const expediente = await Expediente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expediente) return res.status(404).json({ message: 'Expediente no encontrado' });
    const pacienteDoc = await Paciente.findById(expediente.paciente);
    const pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : expediente.paciente.toString();
    await Activity.create({
      type: 'expediente',
      action: 'updated',
      description: `Expediente actualizado para paciente ${pacienteNombre}`,
      userId: expediente.paciente,
      userRole: 'Paciente',
      userName: pacienteNombre
    });
    res.json(expediente);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar expediente', error });
  }
};

exports.eliminarExpediente = async (req, res) => {
  try {
    const expediente = await Expediente.findByIdAndDelete(req.params.id);
    if (!expediente) return res.status(404).json({ message: 'Expediente no encontrado' });
    const pacienteDoc = await Paciente.findById(expediente.paciente);
    const pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : expediente.paciente.toString();
    await Activity.create({
      type: 'expediente',
      action: 'deleted',
      description: `Expediente eliminado para paciente ${pacienteNombre}`,
      userId: expediente.paciente,
      userRole: 'Paciente',
      userName: pacienteNombre
    });
    res.json({ message: 'Expediente eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar expediente', error });
  }
}; 