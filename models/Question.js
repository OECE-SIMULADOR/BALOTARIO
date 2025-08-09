// models/Question.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema; // <-- ESTA LÍNEA ES LA SOLUCIÓN

const QuestionSchema = new Schema({
    balotario: {
        type: Schema.Types.ObjectId,
        ref: 'balotario',
        required: true
    },
    questionNumber: {
        type: Number,
        required: true,
        // unique no aplica globalmente, sino por balotario. Esto lo manejamos en la lógica de creación.
    },
    questionText: {
        type: String,
        required: true,
    },
    questionType: {
        type: String,
        required: true,
    },
    options: [
        {
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
    category: {
        type: String,
        required: true,
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