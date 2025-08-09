// middleware/admin.js
const User = require('../models/User');
const mongoose = require('mongoose');

const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Token no válido.' });
        }
        
        const user = await User.findById(req.user.id).select('role');

        if (user && user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ msg: 'Acceso denegado. Se requieren privilegios de administrador.' });
        }
    } catch (error) {
        return res.status(500).send('Error del servidor al verificar privilegios.');
    }
};

module.exports = adminMiddleware;