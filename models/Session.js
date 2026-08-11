const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["recorded", "live"],
      required: true,
    },

    // =========================
    // ACCESS / PAYMENT
    // =========================

    accessType: {
      type: String,
      enum: ["free", "paid"],
      default: "paid",
    },

    price: {
      type: Number,
      default: 0,
    },

    accessDurationDays: {
      type: Number,
      default: null,
    },

    // =========================
    // VIDEOS
    // =========================

    videos: [
      {
        title: {
          type: String,
          required: true,
        },

        videoId: {
          type: String,
          required: true,
        },

        order: {
          type: Number,
          required: true,
        },
      },
    ],

    // =========================
    // PDF
    // =========================

    pdf: {
      title: {
        type: String,
      },

      url: {
        type: String,
      },
    },

    // =========================
    // ASSIGNMENT
    // =========================

    assignment: {
      title: {
        type: String,
      },

      description: {
        type: String,
      },

      pdfUrl: {
        type: String,
      },
    },

    // =========================
    // ORDER
    // =========================

    order: {
      type: Number,
      required: true,
    },

    // =========================
    // LIVE SESSION
    // =========================

    scheduledAt: {
      type: Date,
    },

    meetingUrl: {
      type: String,
    },

    // =========================
    // PUBLISH
    // =========================

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;