const Odontologo = require('../../models/Odontologo');

const obtenerOdontologos = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const total = await Odontologo.countDocuments();
        const totalPages = Math.ceil(total / limit);
        const odontologos = await Odontologo.find()
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.status(200).json({
            data: odontologos,
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

module.exports = obtenerOdontologos;