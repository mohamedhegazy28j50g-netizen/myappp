const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  ssessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  type: {
    type: String,
    required: true
  },

  duration: {
    type: Number,
    required: true
  },

  points: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }

}, { timestamps: true });

module.exports =
  mongoose.models.Quiz ||
  mongoose.model('Quiz', QuizSchema);