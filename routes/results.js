// routes/results.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Result = require('../models/Result');

router.get('/', auth, async (req, res) => {
    try {
        console.log(`[Resultados] Buscando resultados para el usuario ID: ${req.user.id}`);
        
        // --- >>>>> LA SINTAXIS CORRECTA ES EL ENCADENAMIENTO <<< ---
        const results = await Result.find({ user: req.user.id })
            .populate('balotario', 'title') // '.populate()' se encadena a .find()
            .sort({ date: -1 });            // '.sort()' se encadena al resultado de populate
        // --------------------------------------------------------

        console.log(`[Resultados] Se encontraron ${results.length} resultados.`);
        res.json(results);

    } catch (err) {
        console.error("--- ERROR en GET /api/resultados ---:", err.message);
        res.status(500).send('Error del servidor.');
    }
});

module.exports = router;