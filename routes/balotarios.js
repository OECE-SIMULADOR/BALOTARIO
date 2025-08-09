// routes/balotarios.js

const express = require('express');
const router = express.Router(); // <<<--- ESTA LÍNEA ES LA QUE FALTABA O SE BORRÓ ---<<<
const FailedQuestion = require('../models/FailedQuestion');
// Middlewares
const auth = require('../middleware/auth');

// Controladores y Modelos
const Balotario = require('../models/Balotario');
const Question = require('../models/Question');
const balotarioController = require('../controllers/balotarioController');


// @ruta    GET /api/balotarios
// @desc    Obtiene la lista de balotarios disponibles para los usuarios
router.get('/', auth, async (req, res) => {
    try {
        const balotarios = await Balotario.find().select('title description').sort({ createdAt: -1 });
        res.json(balotarios);
    } catch (err) {
        res.status(500).send('Error del servidor al obtener balotarios.');
    }
});


// @ruta    GET /api/balotarios/:id/questions
// @desc    Obtiene las preguntas de un balotario (sin las respuestas) para resolverlo
router.get('/:id/questions', auth, async (req, res) => {
    try {
        const questions = await Question.find({ balotario: req.params.id })
            .select('-correctAnswer -feedback')
            .sort({ questionNumber: 1 });
        
        if (!questions) return res.status(404).json({ msg: "Preguntas no encontradas" });
        res.json(questions);
    } catch (err) {
        res.status(500).send("Error del servidor al obtener preguntas");
    }
});


// @ruta    GET /api/balotarios/:id/review
// @desc    Obtiene las preguntas COMPLETAS para la página de revisión
router.get('/:id/review', auth, async (req, res) => {
    try {
        const questions = await Question.find({ balotario: req.params.id }).sort({ questionNumber: 1 });
        if (!questions) return res.status(404).json({ msg: "Preguntas para revisión no encontradas" });
        res.json(questions);
    } catch (err) {
        res.status(500).send("Error del servidor al obtener preguntas para revisión");
    }
});

router.get('/reforzamiento', auth, async (req, res) => {
    const REINFORCEMENT_SIZE = 20;
    const MINIMUM_FAILED = 5;

    console.log(`[Reforzamiento] Buscando preguntas falladas para usuario: ${req.user.id}`);
    
    try {
        const failedEntries = await FailedQuestion.find({ user: req.user.id })
            .populate('question');

        console.log(`[Reforzamiento] Preguntas falladas encontradas en la BD: ${failedEntries.length}`);

        if (failedEntries.length < MINIMUM_FAILED) {
            console.log('[Reforzamiento] No hay suficientes preguntas falladas. Devolviendo array vacío.');
            return res.json([]);
        }
        
        let reinforcementQuestions = failedEntries
            .map(entry => entry.question)
            .filter(q => q !== null); // Filtra preguntas que podrían haber sido eliminadas

        console.log(`[Reforzamiento] Preguntas válidas después de poblar: ${reinforcementQuestions.length}`);

        reinforcementQuestions = reinforcementQuestions.sort(() => 0.5 - Math.random()).slice(0, REINFORCEMENT_SIZE);
        
        const questionsForUser = reinforcementQuestions.map(q => {
            const { correctAnswer, feedback, ...rest } = q.toObject();
            return rest;
        });

        console.log(`[Reforzamiento] Enviando ${questionsForUser.length} preguntas al frontend.`);
        res.json(questionsForUser);
        
    } catch (err) {
        console.error("--- ERROR en la ruta /reforzamiento ---:", err);
        res.status(500).send("Error del servidor");
    }
});


// @ruta    POST /api/balotarios/evaluar
// @desc    Evalúa las respuestas de un balotario que el usuario ha enviado
router.post('/evaluar', auth, balotarioController.evaluateAnswers);


module.exports = router; // <-- No olvidar exportar el router al final