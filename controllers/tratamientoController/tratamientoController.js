const Tratamiento = require('../../models/Tratamiento');
const Activity = require('../../models/Activity');
const Expediente = require('../../models/Expediente');
const Paciente = require('../../models/Paciente');

exports.crearTratamiento = async (req, res) => {
  try {
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
    const tratamiento = await Tratamiento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tratamiento) return res.status(404).json({ message: 'Tratamiento no encontrado' });
    const pacienteDoc = await Paciente.findById(tratamiento.paciente);
    const pacienteNombre = pacienteDoc ? `${pacienteDoc.nombre} ${pacienteDoc.apellido}` : tratamiento.paciente.toString();
    await Activity.create({
      type: 'tratamiento',
      action: 'updated',
      description: `Tratamiento actualizado para paciente ${pacienteNombre}`,
      userId: tratamiento.odontologo,
      userRole: 'Odontologo',
      userName: tratamiento.odontologo.toString()
    });
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