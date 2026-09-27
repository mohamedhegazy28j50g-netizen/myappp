const mongoose = require('mongoose');

const ChoiceSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  image: { type: String, trim: true } // optional URL or path
}, { _id: false });

function minChoices(val) { return Array.isArray(val) && val.length >= 2; }

const QuestionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  text: { type: String, required: true, trim: true },
  image: { type: String, trim: true }, // optional question image
  choices: { type: [ChoiceSchema], validate: [minChoices, 'At least two choices are required'] },
  correctAnswer: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) { return Number.isInteger(v) && this.choices && v >= 0 && v < this.choices.length; },
      message: 'correctAnswer must be a valid index into choices'
    }
  },
  points: { type: Number, required: true, default: 1, min: 0 } // weight/score for the question
}, { timestamps: true });

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema);