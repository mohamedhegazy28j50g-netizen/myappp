const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    // بيانات الطالب وقت التحويل اليدوي — بناخدها منه في فورم الشراء
    // عشان المدرّس يقدر يطابقها مع رسالة الواتساب ويتواصل معاه لو محتاج
    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    studentPhone: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
  type: String,
  enum: ["cash"],
  default: "cash",
},

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "rejected"],
      default: "pending",
    },

    paymentReference: {
      type: String,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;