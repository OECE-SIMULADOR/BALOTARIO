// models/Balotario.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BalotarioSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    // Más adelante podríamos añadir campos como 'dificultad', 'creadoPor', etc.
});

module.exports = mongoose.model('balotario', BalotarioSchema);