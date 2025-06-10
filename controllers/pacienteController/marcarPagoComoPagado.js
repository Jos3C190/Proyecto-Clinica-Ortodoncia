const Pago = require('../../models/Pago');
const { validationResult } = require('express-validator');

const marcarPagoComoPagado = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ success: false, errores: errores.array() });
    }

    try {
        const { id } = req.params;
        const pacienteId = req.user.id; // ID del paciente autenticado
        const { metodoPago } = req.body;

        // Buscar el pago por ID y asegurarse de que pertenece al paciente autenticado
        let pago = await Pago.findOne({ _id: id, paciente: pacienteId });

        if (!pago) {
            return res.status(404).json({ success: false, message: 'Pago no encontrado o no pertenece a este paciente.' });
        }

        // Verificar si el pago ya está pagado o cancelado
        if (pago.estado === 'pagado') {
            return res.status(400).json({ success: false, message: 'El pago ya ha sido marcado como pagado.' });
        }
        if (pago.estado === 'cancelado') {
            return res.status(400).json({ success: false, message: 'Este pago ha sido cancelado y no puede ser marcado como pagado.' });
        }

        // Actualizar el estado del pago
        pago.estado = 'pagado';
        pago.fechaPago = new Date(); // Establecer la fecha actual de pago
        pago.metodoPago = metodoPago; // Establecer el método de pago

        const updatedPayment = await pago.save();

        res.status(200).json({
            success: true,
            message: 'Pago marcado como pagado exitosamente',
            payment: {
                _id: updatedPayment._id,
                estado: updatedPayment.estado,
                fechaPago: updatedPayment.fechaPago,
                metodoPago: updatedPayment.metodoPago
            }
        });

    } catch (error) {
        console.error('Error al marcar pago como pagado:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al marcar pago como pagado.', error: error.message });
    }
};

module.exports = marcarPagoComoPagado; 