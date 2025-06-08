require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const pacienteRoutes = require('./routes/pacienteRoutes');
const odontologoRoutes = require('./routes/odontologoRoutes');
const citaRoutes = require('./routes/citaRoutes');
const expedienteRoutes = require('./routes/expedienteRoutes');
const tratamientoRoutes = require('./routes/tratamientoRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const errorHandler = require('./middleware/errorHandler');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// Conectar a la base de datos
connectDB();

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/pacientes', pacienteRoutes);
app.use('/odontologos', odontologoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/tratamientos', tratamientoRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));