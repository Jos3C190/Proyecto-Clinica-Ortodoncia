const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const itemSchema = new Schema({
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioUnitario: { type: Number, required: true },
    total: { type: Number }
}, { _id: false });

const pagoSchema = new Schema({
    numeroFactura: { type: String, unique: true },
    transaccionId: { type: String, unique: true },
    paciente: { type: Schema.Types.ObjectId, ref: 'Paciente', required: true },
    tratamiento: { type: Schema.Types.ObjectId, ref: 'Tratamiento', required: true },
    items: [itemSchema],
    subtotal: { type: Number },
    impuestos: { type: Number },
    total: { type: Number },
    metodoPago: { type: String, required: true },
    estado: { type: String, enum: ['pendiente', 'pagado', 'cancelado'], default: 'pendiente' },
    fechaEmision: { type: Date, default: Date.now },
    fechaVencimiento: { type: Date },
    fechaPago: { type: Date },
    notas: { type: String },
    createdAt: { type: Date, default: Date.now }
});

pagoSchema.pre('save', async function(next) {
    console.log('Pre-save hook ejecutado.');
    if (this.isNew) {
        // Generar numeroFactura solo si es un nuevo documento
        console.log('Es un nuevo documento. Generando numeroFactura...');
        const lastPago = await this.constructor.findOne({}, {}, { sort: { 'createdAt' : -1 } });
        let nextNumber = 1;
        if (lastPago && lastPago.numeroFactura) {
            const lastNum = parseInt(lastPago.numeroFactura.split('-')[2]);
            nextNumber = lastNum + 1;
        }
        const year = new Date().getFullYear();
        this.numeroFactura = `FAC-${year}-${String(nextNumber).padStart(3, '0')}`;

        // Generar transaccionId solo si es un nuevo documento
        this.transaccionId = `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        console.log('TransaccionId generada:', this.transaccionId);
    }
    
    // Calcular subtotal, impuestos y total antes de guardar
    console.log('Calculando subtotal, impuestos y total...');
    console.log('Items actuales:', this.items);
    this.subtotal = this.items.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    this.impuestos = this.subtotal * 0.13; // Suponiendo un 13% de impuestos
    this.total = this.subtotal + this.impuestos;
    console.log('Nuevos valores - Subtotal:', this.subtotal, 'Impuestos:', this.impuestos, 'Total:', this.total);
    next();
});

pagoSchema.plugin(mongoosePaginate);

module.exports = model('Pago', pagoSchema); 