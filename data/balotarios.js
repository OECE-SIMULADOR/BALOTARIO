// routes/balotarios.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // El middleware de autenticación
const Balotario = require('../models/Balotario'); // El modelo para consultar

// @ruta    GET /api/balotarios
// @desc    Obtiene la lista de balotarios disponibles para usuarios
// @acceso  Privado (requiere estar logueado)
router.get('/', auth, async (req, res) => {
    console.log('[Ruta Pública] Petición a GET /api/balotarios recibida.');
    try {
        const balotarios = await Balotario.find()
            .select('title description') // Solo devolvemos los campos necesarios
            .sort({ createdAt: -1 }); // Opcional: ordenar por fecha de creación

        console.log(`[Ruta Pública] Se encontraron ${balotarios.length} balotarios.`);
        res.json(balotarios);

    } catch (err) {
        console.error("--- ERROR en GET /api/balotarios ---:", err.message);
        res.status(500).send('Error del servidor al obtener la lista de balotarios.');
    }
});

module.exports = router;