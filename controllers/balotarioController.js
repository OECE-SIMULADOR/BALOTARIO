// controllers/balotarioController.js

const Question = require('../models/Question');
const Result = require('../models/Result');
const FailedQuestion = require('../models/FailedQuestion'); // Para registrar los errores
/**
 * Recibe las respuestas del usuario, las evalúa, calcula los puntajes,
 * guarda el resultado, registra las preguntas falladas y limpia las acertadas.
 */
exports.evaluateAnswers = async (req, res) => {
    try {
        const { answers, balotarioId, timeTakenInSeconds } = req.body;
        const userId = req.user.id;

        console.log(`[Evaluate] Iniciando evaluación para balotarioId: "${balotarioId}"`);

        // --- >>> LÓGICA CONDICIONAL PARA OBTENER LAS PREGUNTAS <<< ---
        let allQuestions;
        let isReinforcement = balotarioId === 'reforzamiento'; // Flag para usar después

        if (isReinforcement) {
            // Si es de reforzamiento, las preguntas son las que el usuario ha fallado.
            const failedEntries = await FailedQuestion.find({ user: userId }).populate('question');
            allQuestions = failedEntries.map(entry => entry.question).filter(q => q);
        } else {
            // Si es un balotario normal, busca las preguntas por el ID del balotario.
            allQuestions = await Question.find({ balotario: balotarioId });
        }
        
        if (!allQuestions || allQuestions.length === 0) {
            return res.status(404).json({ msg: "No se encontraron preguntas para evaluar." });
        }
        // --- ---------------------------------------------------- ---
        
        let correctAnswersCount = 0;
        const categoryPerformance = {};
        const answersDetails = [];
        
        allQuestions.forEach(question => {
            const questionId = question._id.toString();
            const userAnswer = answers[questionId] || 'No respondida';
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (!categoryPerformance[question.category]) {
                categoryPerformance[question.category] = { correct: 0, total: 0 };
            }
            categoryPerformance[question.category].total++;

            if (isCorrect) {
                correctAnswersCount++;
                categoryPerformance[question.category].correct++;
            }
            answersDetails.push({ questionId, questionText: question.questionText, userAnswer, correctAnswer: question.correctAnswer, isCorrect });
        });
        
        const totalQuestions = allQuestions.length;
        const score = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 20 : 0;
        
        const categoryScores = {};
        for (const category in categoryPerformance) {
            const { correct, total } = categoryPerformance[category];
            categoryScores[category] = total > 0 ? (correct / total) * 100 : 0;
        }

        const competencyMap = {
        'Gestión por Resultados': ['Principios y Marco Normativo General'],
        'Actuaciones Preparatorias': ['Actores del Proceso de Contratación', 'Planificación y Actuaciones Preparatorias', 'Herramientas Digitales y Registros'],
        'Procedimientos de Selección': ['Procedimientos de Selección'],
        'Ejecución Contractual': ['Ejecución Contractual', 'Solución de Controversias', 'Régimen de Infracciones y Sanciones', 'Disposiciones Específicas por Objeto de Contratación']
    };
    
    // 2. Inicializamos la estructura para contar aciertos y totales por competencia
    const competencyPerformance = {
        'Gestión por Resultados': { correct: 0, total: 0 },
        'Actuaciones Preparatorias': { correct: 0, total: 0 },
        'Procedimientos de Selección': { correct: 0, total: 0 },
        'Ejecución Contractual': { correct: 0, total: 0 },
    };
    
    // 3. Recorremos los resultados por categoría que ya teníamos
    for (const category in categoryPerformance) {
        const { correct, total } = categoryPerformance[category];
        // Buscamos a qué competencia pertenece esta categoría
        for (const competency in competencyMap) {
            if (competencyMap[competency].includes(category)) {
                competencyPerformance[competency].correct += correct;
                competencyPerformance[competency].total += total;
                break; // Pasamos a la siguiente categoría
            }
        }
    }
    
    // 4. Calculamos los porcentajes finales para el nuevo Radar Chart
    const competencyScores = {};
    for (const competency in competencyPerformance) {
        const { correct, total } = competencyPerformance[competency];
        competencyScores[competency] = total > 0 ? (correct / total) * 100 : 0;
    }
        const newResult = new Result({
            // Si es un balotario de reforzamiento, no tiene un ID real, así que lo omitimos (o guardamos null)
            balotario: isReinforcement ? null : balotarioId,
            user: userId,
            score: score.toFixed(2),
            categoryScores,
            totalQuestions,
            correctAnswersCount,
            answersDetails,
            timeTakenInSeconds,
        });

        await newResult.save();
        console.log(`[Evaluate] Resultado guardado con ID: ${newResult._id}`);

        // Lógica para registrar errores y limpiar aciertos (no cambia)
        const failedQuestions = answersDetails.filter(detail => !detail.isCorrect);
        if (failedQuestions.length > 0) {
            const bulkOps = failedQuestions.map(failed => ({
                updateOne: {
                    filter: { user: userId, question: failed.questionId },
                    update: { $set: { user: userId, question: failed.questionId } },
                    upsert: true
                }
            }));
            await FailedQuestion.bulkWrite(bulkOps);
        }
        
        const correctQuestions = answersDetails.filter(detail => detail.isCorrect);
        if (correctQuestions.length > 0) {
            const correctQuestionIds = correctQuestions.map(cq => cq.questionId);
            await FailedQuestion.deleteMany({ user: userId, question: { $in: correctQuestionIds } });
        }

        res.status(201).json(newResult);
    
    } catch (err) {
        console.error("--- ERROR FATAL EN evaluateAnswers ---:", err);
        // Devolvemos el error en un formato consistente
        res.status(500).json({ msg: 'Error interno en el servidor al evaluar las respuestas.', error: err.message });
    }
};
