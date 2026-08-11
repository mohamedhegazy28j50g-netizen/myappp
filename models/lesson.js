const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = Lesson;