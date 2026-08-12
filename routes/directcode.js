const express = require("express");
const router = express.Router();
const authmiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const Directcode = require("../models/directcode");


// Create direct codes for a session
router.post(
  "/orders/direct-code/create",
  authmiddleware,
  async (req, res) => {
    try {
      const { sessionId, count } = req.body;

      // 1. التأكد من البيانات
      if (!sessionId || !count) {
        return res.status(400).json({
          message: "Session ID and count are required",
        });
      }

      // 2. إنشاء الأكواد
      const codes = [];
      const directCodes = [];

      for (let i = 0; i < count; i++) {
        // 9 أرقام
        const code = Math.floor(
          100000000 + Math.random() * 900000000
        ).toString();

        // الاحتفاظ بالكود الأصلي لإرجاعه للأدمن
        codes.push(code);

        // تجهيز الـDocument
        directCodes.push({
          code,
          sessionId,
          isUsed: false,
        });
      }

      // 3. حفظ الأكواد كلها في Database
      await Directcode.insertMany(directCodes);

      // 4. إرجاع الأكواد الأصلية
      return res.status(201).json({
        message: "Direct codes created successfully",
        count: codes.length,
        codes,
      });

    } catch (error) {
      console.error("Create direct codes error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);
// جلب الأكواد الخاصة بحصة معينة (مع إحصائية سريعة: كام مستخدم وكام فاضل)
router.get(
  "/orders/direct-code/session/:sessionId",
  authmiddleware,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // usedBy لازم يبقى موجود في الـ Schema (راجع الملاحظة تحت)
      const codes = await Directcode.find({ sessionId })
        .sort({ createdAt: -1 })
        .populate("usedBy", "name email");

      const used = codes.filter((c) => c.isUsed).length;

      return res.status(200).json({
        total: codes.length,
        used,
        remaining: codes.length - used,
        codes,
      });
    } catch (error) {
      console.error("Get direct codes error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;