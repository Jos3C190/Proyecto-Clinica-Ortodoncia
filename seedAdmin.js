require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Odontologo = require('./models/Odontologo');
const connectDB = require('./config/db');

const seedAdmin = async () => {
    try {
        // Conectar a la base de datos
        await connectDB();

        // Verificar si ya existe un administrador
        const adminExistente = await Odontologo.findOne({ role: 'admin' });
        if (adminExistente) {
            console.log('Ya existe un administrador:', adminExistente.correo);
            process.exit(0);
        }

        // Crear un nuevo administrador
        const adminData = {
            nombre: 'Admin',
            apellido: 'Principal',
            correo: 'admin@example.com',
            telefono: '1234567890',
            especialidad: 'Administración',
            password: 'admin123', // No hashear aquí, el modelo lo hará automáticamente
            role: 'admin',
            fecha_nacimiento: new Date('1980-01-01') 
        };

        // Guardar el administrador
        const admin = new Odontologo(adminData);
        await admin.save();

        console.log('Administrador creado con éxito:', admin.correo);
        process.exit(0);
    } catch (error) {
        console.error('Error al crear administrador:', error.message);
        process.exit(1);
    }
};

seedAdmin();