// models/FailedQuestion.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FailedQuestionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    question: {
        type: Schema.Types.ObjectId,
        ref: 'question',
        required: true
    },
    // 'unique' compuesto para que no se guarde el mismo error del mismo usuario dos veces
}, { timestamps: true });

FailedQuestionSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('failedQuestion', FailedQuestionSchema);