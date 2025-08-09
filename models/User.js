// models/User.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Un archivo de modelo SOLO debe definir la estructura de los datos.
// No debe contener 'router.get', 'router.post', etc.

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false, // Por seguridad, no devolvemos el hash de la contraseña en las consultas por defecto
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('user', UserSchema);