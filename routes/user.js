

const express = require("express");
const router = express.Router();
const authmiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const User = require("../models/user"); // غيّر المسار/الاسم لو الموديل عندك مختلف

// جلب كل اليوزرز (الطلاب) - مع دعم البحث بالإيميل عن طريق ?email=
router.get(
  "/users",
  authmiddleware,
  // roleMiddleware("teacher", "admin"), // فعّلها لو roleMiddleware عندك بياخد الأدوار كده - راجع الملاحظة تحت
  async (req, res) => {
    try {
      const { email } = req.query;

      const filter = {};
      if (email) {
        // بحث جزئي (contains) ومش حساس لحالة الأحرف
        filter.email = { $regex: email.trim(), $options: "i" };
      }

      const users = await User.find(filter)
        .select("-password") // منشيلش أي حقول حساسة تانية عندك زي refreshToken لو موجود
        .sort({ createdAt: -1 });

      return res.status(200).json({
        total: users.length,
        users,
      });
    } catch (error) {
      console.error("Get users error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;