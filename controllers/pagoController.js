const Pago = require('../models/Pago');
const Paciente = require('../models/Paciente');
const Tratamiento = require('../models/Tratamiento');

exports.getAllPagos = async (req, res) => {
    try {
        console.log('Iniciando getAllPagos');
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
        console.log('Query:', query);
        console.log('Options:', options);

        const pagos = await Pago.paginate(query, options);
        console.log('Pagos obtenidos:', pagos);
        res.status(200).json(pagos);
    } catch (error) {
        console.error('Error en getAllPagos:', error);
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
        // Verificar que paciente exista
        const existingPaciente = await Paciente.findById(paciente);
        if (!existingPaciente) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }
        // La validación de tratamiento ahora es opcional
        if (tratamiento) {
            const existingTratamiento = await Tratamiento.findById(tratamiento);
            if (!existingTratamiento) {
                return res.status(404).json({ message: 'Tratamiento no encontrado.' });
            }
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

        console.log('Intentando guardar nuevo pago...', newPago);
        const savedPago = await newPago.save();
        console.log('Pago guardado exitosamente:', savedPago);
        res.status(201).json(savedPago);
    } catch (error) {
        console.error('Error en createPago:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.updatePago = async (req, res) => {
    try {
        const { id } = req.params;
        let pago = await Pago.findById(id);

        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }

        // Actualizar solo los campos que se envían en el req.body
        for (let key in req.body) {
            if (req.body.hasOwnProperty(key)) {
                pago[key] = req.body[key];
            }
        }
        
        // Los cálculos en pre('save') se ejecutarán al llamar a .save()
        const updatedPago = await pago.save(); 
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

exports.getByIdPago = async (req, res) => {
    try {
        const { id } = req.params;
        const pago = await Pago.findById(id)
            .populate('paciente', 'nombre apellido correo telefono direccion')
            .populate('tratamiento', 'descripcion tipo costo');

        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }
        res.status(200).json(pago);
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