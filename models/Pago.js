const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const itemSchema = new Schema({
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioUnitario: { type: Number, required: true },
    total: { type: Number, required: true }
}, { _id: false });

const pagoSchema = new Schema({
    numeroFactura: { type: String, unique: true },
    paciente: { type: Schema.Types.ObjectId, ref: 'Paciente', required: true },
    tratamiento: { type: Schema.Types.ObjectId, ref: 'Tratamiento', required: true },
    items: [itemSchema],
    subtotal: { type: Number, required: true },
    impuestos: { type: Number, required: true },
    total: { type: Number, required: true },
    metodoPago: { type: String, required: true },
    estado: { type: String, enum: ['pendiente', 'pagado', 'cancelado'], default: 'pendiente' },
    fechaEmision: { type: Date, default: Date.now },
    fechaVencimiento: { type: Date },
    fechaPago: { type: Date },
    notas: { type: String },
    createdAt: { type: Date, default: Date.now }
});

pagoSchema.pre('save', async function(next) {
    if (this.isNew) {
        // Generar numeroFactura solo si es un nuevo documento
        const lastPago = await this.constructor.findOne({}, {}, { sort: { 'createdAt' : -1 } });
        let nextNumber = 1;
        if (lastPago && lastPago.numeroFactura) {
            const lastNum = parseInt(lastPago.numeroFactura.split('-')[2]);
            nextNumber = lastNum + 1;
        }
        const year = new Date().getFullYear();
        this.numeroFactura = `FAC-${year}-${String(nextNumber).padStart(3, '0')}`;
    }
    
    // Calcular subtotal, impuestos y total antes de guardar
    this.subtotal = this.items.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    this.impuestos = this.subtotal * 0.13; // Suponiendo un 13% de impuestos
    this.total = this.subtotal + this.impuestos;
    next();
});

pagoSchema.plugin(mongoosePaginate);

module.exports = model('Pago', pagoSchema); 