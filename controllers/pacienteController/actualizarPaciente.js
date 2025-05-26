const { validationResult } = require('express-validator');
const Paciente = require('../../models/Paciente');
const Activity = require('../../models/Activity');
const bcrypt = require('bcryptjs');

const actualizarPaciente = async (req, res) => {
    // Validar los errores
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    try {
        let updateData = { ...req.body };
        // Si se va a actualizar la contraseña, encriptarla (solo si se envía en el body)
        if (updateData.password === undefined || updateData.password === null || updateData.password === '') {
            delete updateData.password;
        } else if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        const paciente = await Paciente.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });
        await Activity.create({
            type: 'patient',
            action: 'updated',
            description: `Paciente actualizado: ${paciente.nombre} ${paciente.apellido}`,
            userId: paciente._id,
            userRole: 'Paciente',
            userName: `${paciente.nombre} ${paciente.apellido}`
        });
        res.json(paciente);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = actualizarPaciente;
