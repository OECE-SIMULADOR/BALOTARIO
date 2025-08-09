// models/Result.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definición del esquema para la colección 'results'
const ResultSchema = new Schema(
    {
        // Referencia al balotario que se resolvió
        balotario: {
            type: Schema.Types.ObjectId,
            ref: 'balotario',
            required: false
        },
        
        // Referencia al usuario que realizó el intento
        user: { 
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        
        // Puntaje numérico obtenido
        score: {
            type: Number,
            required: true,
        },
        
        // Objeto para los porcentajes por categoría del Radar Chart
        categoryScores: {
            type: Map,
            of: Number,
            required: true,
        },

        competencyScores: {
            type: Map,
            of: Number,
            required: false 

        },

        totalQuestions: {
            type: Number,
            required: true
        },
        
        correctAnswersCount: {
            type: Number,
            required: true
        },

        // Campo para almacenar el tiempo en segundos
        timeTakenInSeconds: {
            type: Number,
            required: true,
        },
        
        // Array con el detalle de cada respuesta
        answersDetails: [{
            _id: false, // Evita que cada sub-documento tenga su propio _id
            questionId:     { type: String, required: true },
            questionText:   { type: String, required: true },
            userAnswer:     { type: String, required: true },
            correctAnswer:  { type: String, required: true },
            isCorrect:      { type: Boolean, required: true }
        }],

    },
    {
        // Opción para que Mongoose añada automáticamente los campos createdAt y updatedAt
        timestamps: true 
    }
);

// Se exporta el modelo para que pueda ser usado en otras partes de la aplicación
module.exports = mongoose.model('result', ResultSchema);