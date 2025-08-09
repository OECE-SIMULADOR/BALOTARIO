// controllers/resultController.js
const Result = require('../models/Result');

exports.getUserResults = async (req, res) => {
    try {
        // Buscamos los resultados del usuario logueado
        const results = await Result.find({ user: req.user.id })
        .populate('balotario', 'title') // ¡Esta línea es CRUCIAL!
        .sort({ date: -1 }); // Los ordenamos del más reciente al más antiguo
            
        res.json(results);
    } catch (err) {
        console.error("Error obteniendo resultados de usuario:", err.message);
        res.status(500).send('Error en el servidor');
    }
};