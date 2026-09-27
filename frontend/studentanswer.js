const mongoose = require('mongoose');

const StudentAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: Number, required: true } // index of chosen choice
}, { timestamps: true });

module.exports = mongoose.models.StudentAnswer || mongoose.model('StudentAnswer', StudentAnswerSchema);