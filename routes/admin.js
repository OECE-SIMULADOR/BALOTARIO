// routes/admin.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../config/upload');
const adminController = require('../controllers/adminController');
const jsonParser = express.json();

// Rutas de Balotarios
router.route('/balotarios')
    .post([auth, admin, jsonParser], adminController.createBalotario)
    .get([auth, admin], adminController.getAllBalotarios);
router.route('/balotarios/:id')
    .get([auth, admin], adminController.getBalotarioById)
    .put([auth, admin, jsonParser], adminController.updateBalotario)
    .delete([auth, admin], adminController.deleteBalotario);

// Rutas de Preguntas
router.route('/balotarios/:balotarioId/questions')
    .get([auth, admin], adminController.getQuestionsForBalotario)
    .post([auth, admin, jsonParser], adminController.addQuestionToBalotario);
router.route('/questions/:questionId')
    .get([auth, admin], adminController.getQuestionById)
    .put([auth, admin, jsonParser], adminController.updateQuestion)
    .delete([auth, admin], adminController.deleteQuestion);

// Rutas de Importación
router.post('/import-full-balotario', [auth, admin, upload.single('file')], adminController.importFullBalotario);

// Ruta de Prueba (la puedes dejar o borrar)
router.post('/test-upload', upload.single('file'), (req, res) => {
    if (req.file) res.json({ msg: 'Éxito: archivo de prueba recibido.' });
    else res.status(400).json({ msg: 'Fallo: no se recibió archivo.' });
});

module.exports = router;