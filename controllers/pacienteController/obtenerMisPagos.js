const Pago = require('../../models/Pago');

const obtenerMisPagos = async (req, res) => {
    try {
        const pacienteId = req.user.id; // El ID del paciente autenticado viene del token
        const { page = 1, limit = 10, estado = 'todos' } = req.query;

        let query = { paciente: pacienteId };

        if (estado !== 'todos') {
            query.estado = estado;
        }

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            populate: [
                { path: 'paciente', select: 'nombre apellido correo telefono' },
                { path: 'tratamiento', select: 'descripcion tipo costo' }
            ],
            sort: { fechaEmision: -1 }
        };

        const pagos = await Pago.paginate(query, options);
        res.status(200).json(pagos);
    } catch (error) {
        console.error('Error al obtener los pagos del paciente:', error);
        res.status(500).json({ message: 'Error al obtener los pagos del paciente', error: error.message });
    }
};

module.exports = obtenerMisPagos; 