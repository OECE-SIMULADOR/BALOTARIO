// seeder/seeder.js

// Importaciones necesarias para el script
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db'); // La función de conexión que usa nuestra app

// Importación de los Modelos de la base de datos
const Question = require('../models/Question');
const Balotario = require('../models/Balotario');

// Importación de los datos que vamos a insertar
const balotarios = require('../data/balotarios');
const questions = require('../data/questions');

// Configuración para cargar las variables de entorno del archivo .env
dotenv.config({ path: './.env' }); 

// Establecemos la conexión con la base de datos
connectDB();

// --- Función para IMPORTAR datos ---
const importData = async () => {
    try {
        console.log('-------------------------------------------');
        console.log('INICIANDO PROCESO DE IMPORTACIÓN DE DATOS...');
        console.log('-------------------------------------------');
        
        // 1. Limpieza de colecciones existentes para evitar duplicados
        // Al ejecutar este script, se empieza desde un estado limpio.
        await Balotario.deleteMany();
        console.log('[PASO 1/4] -> Colección `balotarios` limpiada con éxito.');
        
        await Question.deleteMany();
        console.log('[PASO 2/4] -> Colección `questions` limpiada con éxito.');

        // 2. Inserción de los datos nuevos
        await Balotario.insertMany(balotarios);
        console.log('[PASO 3/4] ✅ ¡Balotarios importados exitosamente!');

        await Question.insertMany(questions);
        console.log('[PASO 4/4] ✅ ¡Preguntas importadas exitosamente!');
        
        console.log('\n=====================================');
        console.log('PROCESO DE SIEMBRA COMPLETADO.');
        console.log('=====================================');
        
        process.exit(0); // Termina el script con código de éxito

    } catch (error) {
        // Si ocurre CUALQUIER error durante el proceso, se mostrará aquí
        console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('❌ ERROR FATAL DURANTE LA IMPORTACIÓN DE DATOS:', error);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        process.exit(1); // Termina el script con código de error
    }
};

// --- Función para DESTRUIR datos (opcional, para limpieza) ---
const destroyData = async () => {
    try {
        console.log('-------------------------------------------');
        console.log('INICIANDO PROCESO DE DESTRUCCIÓN DE DATOS...');
        console.log('-------------------------------------------');

        await Balotario.deleteMany();
        console.log('[PASO 1/2] -> Colección `balotarios` destruida.');

        await Question.deleteMany();
        console.log('[PASO 2/2] -> Colección `questions` destruida.');

        console.log('\n=====================================');
        console.log('PROCESO DE DESTRUCCIÓN COMPLETADO.');
        console.log('=====================================');
        
        process.exit(0);

    } catch (error) {
        console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('❌ ERROR FATAL DURANTE LA DESTRUCCIÓN DE DATOS:', error);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        process.exit(1);
    }
};

// Lógica para determinar qué función ejecutar basándose en los argumentos de la línea de comandos
// Si ejecutamos "node seeder.js -d", se llama a destroyData.
// Si ejecutamos "node seeder.js" (o npm run data:import), se llama a importData.
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}