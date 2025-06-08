const Pago = require('../models/Pago');
const Paciente = require('../models/Paciente');
const Tratamiento = require('../models/Tratamiento');

exports.getAllPagos = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado, paciente } = req.query;
        let query = {};

        if (estado) {
            query.estado = estado;
        }
        if (paciente) {
            query.paciente = paciente;
        }

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            populate: [{ path: 'paciente', select: 'nombre apellido correo telefono direccion' }, { path: 'tratamiento', select: 'descripcion tipo costo' }],
            sort: { fechaEmision: -1 }
        };

        const pagos = await Pago.paginate(query, options);
        res.status(200).json(pagos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPago = async (req, res) => {
    const {
        paciente,
        tratamiento,
        items,
        metodoPago,
        estado,
        fechaVencimiento,
        notas
    } = req.body;

    try {
        // Verificar que paciente y tratamiento existan
        const existingPaciente = await Paciente.findById(paciente);
        if (!existingPaciente) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }
        const existingTratamiento = await Tratamiento.findById(tratamiento);
        if (!existingTratamiento) {
            return res.status(404).json({ message: 'Tratamiento no encontrado.' });
        }

        const newPago = new Pago({
            paciente,
            tratamiento,
            items,
            metodoPago,
            estado,
            fechaVencimiento,
            notas
        });

        const savedPago = await newPago.save();
        res.status(201).json(savedPago);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updatePago = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPago = await Pago.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        if (!updatedPago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }
        res.status(200).json(updatedPago);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePago = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPago = await Pago.findByIdAndDelete(id);

        if (!deletedPago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }
        res.status(200).json({ message: 'Pago eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPagosStats = async (req, res) => {
    try {
        const stats = await Pago.aggregate([
            {
                $group: {
                    _id: '$estado',
                    totalPagos: { $sum: 1 },
                    totalMonto: { $sum: '$total' }
                }
            },
            {
                $project: {
                    _id: 0,
                    estado: '$_id',
                    totalPagos: 1,
                    totalMonto: 1
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 