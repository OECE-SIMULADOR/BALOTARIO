// config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Carga las variables del archivo .env a process.env

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, // Parámetros recomendados por Mongoose, aunque en versiones >6.x ya no son necesarios, es buena práctica mantenerlos.
            useUnifiedTopology: true,
        });
        console.log('MongoDB Conectado...'); // Mensaje de éxito en la consola
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err.message);
        // Salir del proceso con fallo si no se puede conectar a la DB
        process.exit(1);
    }
};

module.exports = connectDB;