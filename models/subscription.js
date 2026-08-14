const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// نفس الطالب لا يشترك في نفس الكورس مرتين
subscriptionSchema.index(
  { classId: 1, userId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);