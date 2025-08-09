// models/Question.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    // Referencia al balotario al que pertenece la pregunta
    balotario: {
        type: Schema.Types.ObjectId,
        ref: 'balotario',
        required: true
    },
    questionNumber: {
        type: Number,
        required: true,
    },
    questionText: {
        type: String,
        required: true,
    },
    questionType: {
        type: String,
        required: true,
        default: 'Normal'
    },
    // Array de objetos para las opciones de respuesta
    options: [
        {
            _id: false, // Evita que Mongoose cree un _id para cada opción
            letter: { type: String, required: true },
            text: { type: String, required: true }
        }
    ],
    correctAnswer: {
        type: String,
        required: true,
    },
    feedback: {
        type: String,
        required: true,
    },
    // --- >>>>> BLOQUE DE CATEGORÍAS ACTUALIZADO <<<<< ---
    category: {
        type: String,
        required: true,
        // La base de datos solo aceptará preguntas que tengan una de estas categorías
        enum: [
            'Principios y Marco Normativo General',
            'Actores del Proceso de Contratación',
            'Planificación y Actuaciones Preparatorias',
            'Procedimientos de Selección',
            'Ejecución Contractual',
            'Solución de Controversias',
            'Régimen de Infracciones y Sanciones',
            'Herramientas Digitales y Registros',
            'Disposiciones Específicas por Objeto de Contratación'
        ]
    }
});

module.exports = mongoose.model('question', QuestionSchema);