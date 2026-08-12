const mongoose = require("mongoose");


const directCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DirectCode = mongoose.model("DirectCode", directCodeSchema);

module.exports = DirectCode;