const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin","teacher"],
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false
    },

    passwordResetCodeHash: {
    type: String,
    default: null,
   },

passwordResetCodeExpires: {
  type: Date,
  default: null,
},

passwordResetTokenHash: {
  type: String,
  default: null,
},

passwordResetTokenExpires: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;