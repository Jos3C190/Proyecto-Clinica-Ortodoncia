const Paciente = require('../../models/Paciente');

const obtenerPacientes = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const total = await Paciente.countDocuments();
        const totalPages = Math.ceil(total / limit);
        const pacientes = await Paciente.find()
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({
            data: pacientes,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = obtenerPacientes;
