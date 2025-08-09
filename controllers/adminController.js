// controllers/adminController.js

const mongoose = require('mongoose');
const csv = require('csv-parser');
const { Readable } = require('stream');
const fs = require('fs'); // Módulo nativo de Node.js para el sistema de archivos
// Modelos de la Base de Datos
const Balotario = require('../models/Balotario');
const Question = require('../models/Question');

// ===========================================
// ===         CONTROLADORES PARA BALOTARIOS        ===
// ===========================================

// --- Crear un nuevo balotario ---
exports.createBalotario = async (req, res) => {
    const { title, description } = req.body;
    try {
        let balotario = await Balotario.findOne({ title });
        if (balotario) {
            return res.status(400).json({ msg: 'Ya existe un balotario con ese título.' });
        }
        
        const newBalotario = new Balotario({ title, description });
        await newBalotario.save();
        res.status(201).json(newBalotario);

    } catch (error) {
        console.error("Error en createBalotario:", error.message);
        res.status(500).send('Error en el servidor al crear balotario.');
    }
};

// --- Obtener todos los balotarios ---
exports.getAllBalotarios = async (req, res) => {
    try {
        const balotarios = await Balotario.find().sort({ createdAt: -1 });
        res.json(balotarios);
    } catch (error) {
        console.error("Error en getAllBalotarios:", error.message);
        res.status(500).send('Error en el servidor al obtener balotarios.');
    }
};

// --- Obtener un balotario específico por su ID ---
exports.getBalotarioById = async (req, res) => {
    try {
        const balotario = await Balotario.findById(req.params.id);
        if (!balotario) {
            return res.status(404).json({ msg: 'Balotario no encontrado' });
        }
        res.json(balotario);
    } catch (error) {
        console.error("Error en getBalotarioById:", error.message);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Balotario no encontrado (ID con formato inválido)' });
        }
        res.status(500).send('Error en el servidor');
    }
};

// --- Actualizar un balotario existente ---
exports.updateBalotario = async (req, res) => {
    const { title, description } = req.body;
    try {
        const balotario = await Balotario.findByIdAndUpdate(
            req.params.id,
            { title, description },
            { new: true, runValidators: true }
        );
        if (!balotario) {
            return res.status(404).json({ msg: 'Balotario no encontrado.' });
        }
        res.json(balotario);
    } catch (error) {
        console.error("Error en updateBalotario:", error.message);
        res.status(500).send('Error en el servidor al actualizar balotario.');
    }
};

// --- Eliminar un balotario y sus preguntas ---
exports.deleteBalotario = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ msg: 'ID de balotario inválido.' });
        }

        const balotario = await Balotario.findById(req.params.id);
        if (!balotario) {
            return res.status(404).json({ msg: 'Balotario no encontrado.' });
        }
        
        await Question.deleteMany({ balotario: req.params.id });
        await Balotario.deleteOne({ _id: req.params.id });
        
        res.json({ msg: 'Balotario y sus preguntas han sido eliminados correctamente.' });

    } catch (error) {
        console.error("Error en deleteBalotario:", error);
        res.status(500).send('Error en el servidor al eliminar balotario.');
    }
};

// ===========================================
// ===          CONTROLADORES PARA PREGUNTAS        ===
// ===========================================

// --- Obtener todas las preguntas de un balotario ---
exports.getQuestionsForBalotario = async (req, res) => {
    try {
        const { balotarioId } = req.params;
        const questions = await Question.find({ balotario: balotarioId }).sort({ questionNumber: 1 });
        res.json(questions);
    } catch (error) {
        console.error("Error en getQuestionsForBalotario:", error.message);
        res.status(500).send('Error en el servidor al obtener preguntas.');
    }
};

// --- Añadir una nueva pregunta a un balotario ---
exports.addQuestionToBalotario = async (req, res) => {
    const { questionNumber, questionText, questionType, options, correctAnswer, feedback, category } = req.body;
    const { balotarioId } = req.params;

    try {
        const newQuestion = new Question({
            balotario: balotarioId,
            questionNumber,
            questionText,
            questionType,
            options,
            correctAnswer,
            feedback,
            category
        });
        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Error en addQuestionToBalotario:", error.message);
        if(error.name === 'ValidationError'){
            return res.status(400).json({ msg: error.message });
        }
        res.status(500).send('Error en el servidor al añadir pregunta.');
    }
};

// --- Obtener una pregunta por su ID ---
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) {
            return res.status(404).json({ msg: 'Pregunta no encontrada' });
        }
        res.json(question);
    } catch (error) {
        console.error("Error en getQuestionById:", error);
        res.status(500).send('Error del servidor');
    }
};

// --- Actualizar una pregunta ---
exports.updateQuestion = async (req, res) => {
    try {
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.questionId,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updatedQuestion) {
            return res.status(404).json({ msg: 'Pregunta no encontrada' });
        }
        res.json(updatedQuestion);
    } catch (error) {
        console.error("Error en updateQuestion:", error);
        res.status(500).send('Error del servidor');
    }
};

// --- Eliminar una pregunta ---
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) {
            return res.status(404).json({ msg: 'Pregunta no encontrada' });
        }
        await Question.deleteOne({ _id: req.params.questionId });
        res.json({ msg: 'Pregunta eliminada correctamente' });
    } catch (error) {
        console.error("Error en deleteQuestion:", error);
        res.status(500).send('Error del servidor');
    }
};


// ============================================================
// ===          CONTROLADOR PARA IMPORTACIÓN MASIVA          ===
// ============================================================

// dentro de controllers/adminController.js

exports.importFullBalotario = (req, res) => {
    try {
        if (!req.file || !req.file.path) {
            return res.status(400).json({ msg: "No se ha subido ningún archivo." });
        }
        
        const filePath = req.file.path;
        const results = [];
        
        fs.createReadStream(filePath)
            .pipe(csv({ mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Borramos el archivo temporal tan pronto se haya leído
                fs.unlinkSync(filePath);

                try {
                    if (results.length === 0) return res.status(400).json({ msg: "CSV vacío." });
                    
                    const { balotarioTitle, balotarioDescription } = results[0];
                    if (!balotarioTitle || !balotarioDescription) return res.status(400).json({ msg: "Columnas 'balotarioTitle' y/o 'balotarioDescription' requeridas." });

                    // Creamos o actualizamos el balotario
                    const balotario = await Balotario.findOneAndUpdate(
                        { title: balotarioTitle },
                        { description: balotarioDescription },
                        { new: true, upsert: true, runValidators: true }
                    );

                    // Mapeamos y validamos los datos del CSV a objetos de pregunta
                    const questionsToInsert = results.map((row, index) => {
                        const { questionNumber, questionText, optionA, optionB, optionC, optionD, correctAnswer, category, feedback } = row;
                        if (!questionNumber || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !category || !feedback) {
                            throw new Error(`Fila ${index + 2} del CSV incompleta.`);
                        }
                        const qNum = parseInt(questionNumber);
                        if (isNaN(qNum)) {
                            throw new Error(`'questionNumber' inválido en la fila ${index + 2}.`);
                        }
                        return { balotario: balotario._id, questionNumber: qNum, questionText, questionType: row.questionType || 'Normal', options: [{ letter: 'a', text: optionA }, { letter: 'b', text: optionB }, { letter: 'c', text: optionC }, { letter: 'd', text: optionD }], correctAnswer: correctAnswer.toLowerCase().trim(), feedback, category };
                    });

                    // --- >>>>> ESTRATEGIA DE DEPURACIÓN AVANZADA <<<<< ---
                    
                    // Primero, limpiamos las preguntas antiguas
                    await Question.deleteMany({ balotario: balotario._id });
                    
                    let insertedCount = 0;
                    let validationErrors = [];
                    
                    // Usamos un bucle for...of para poder usar 'await' y capturar errores individuales
                    for (const question of questionsToInsert) {
                        try {
                            const newQuestion = new Question(question);
                            await newQuestion.save(); // Intentamos guardar la pregunta
                            insertedCount++;
                        } catch (validationError) {
                            // Si UNA pregunta falla la validación, la registramos
                            validationErrors.push({
                                questionNumber: question.questionNumber,
                                categoryProvided: question.category,
                                error: validationError.message
                            });
                        }
                    }

                    // --- >>>>> MENSAJES DE RESULTADO <<< ---
                    if (validationErrors.length > 0) {
                        // Si hubo errores, los mostramos todos en la consola del backend
                        console.error('\n--- ❌ Se encontraron errores de validación durante la inserción ---');
                        validationErrors.forEach(err => {
                            console.error(`- Pregunta N° ${err.questionNumber}:`);
                            console.error(`  Categoría problemática: "${err.categoryProvided}"`);
                            console.error(`  Mensaje de Mongoose: ${err.error}`);
                        });
                        console.error('-----------------------------------------------------\n');
                        // Enviamos un mensaje de error claro al frontend
                        return res.status(400).json({ 
                            msg: `Se importaron ${insertedCount} preguntas, pero ${validationErrors.length} fallaron por errores de validación. Revise la consola del backend para más detalles.`,
                            errors: validationErrors
                        });
                    }

                    // Si no hubo errores, respondemos con éxito
                    return res.status(201).json({ msg: `Balotario '${balotario.title}' procesado. ${insertedCount} preguntas importadas con éxito.` });

                } catch (dbError) {
                    console.error("[Import] Error al procesar datos:", dbError);
                    return res.status(400).json({ msg: `Error de datos en CSV: ${dbError.message}` });
                }
            })
            .on('error', (parseError) => {
                fs.unlinkSync(filePath);
                console.error("[Import] Error de formato CSV:", parseError);
                return res.status(400).json({ msg: `Error de formato en CSV: ${parseError.message}` });
            });
    } catch (error) {
        if (req.file && req.file.path) fs.unlinkSync(req.file.path);
        console.error("[Import] Error crítico:", error);
        return res.status(500).send("Error crítico en el servidor.");
    }
};