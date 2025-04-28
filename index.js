require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const pacienteRoutes = require('./routes/pacienteRoutes');
const odontologoRoutes = require('./routes/odontologoRoutes');
const citaRoutes = require('./routes/citaRoutes');
const errorHandler = require('./middleware/errorHandler');

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

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));