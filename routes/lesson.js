const express        = require("express");
const mongoose       = require("mongoose");
const Lesson         = require("../models/lesson");
const Class          = require("../models/class");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// =========================
// CREATE LESSON
// =========================

router.post("/classes/:classId/lessons",authMiddleware,roleMiddleware([ "teacher" ]), async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, order } = req.body;

    // التأكد من صحة الـ ObjectId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    if (!title || order === undefined) {
      return res.status(400).json({
        message: "Title and order are required",
      });
    }

    // التأكد إن الـClass موجود
    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    const lesson = await Lesson.create({
      classId,
      title,
      order,
    });

    res.status(201).json({
      message: "Lesson created successfully",
      lesson,
    });

  } catch (error) {
    console.error("Create lesson error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =========================
// GET LESSONS OF A CLASS
// =========================

router.get("/classes/:classId/lessons", async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    const lessons = await Lesson.find({
      classId,
    }).sort({
      order: 1,
    });

    res.status(200).json({
      lessons,
    });

  } catch (error) {
    console.error("Get lessons error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =========================
// GET ONE LESSON
// =========================

router.get("/lessons/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    res.status(200).json({
      lesson,
    });

  } catch (error) {
    console.error("Get lesson error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =========================
// UPDATE LESSON
// =========================

router.put("/lessons/:id",authMiddleware,roleMiddleware([ "teacher" ]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    if (title !== undefined) {
      lesson.title = title;
    }

    if (order !== undefined) {
      lesson.order = order;
    }

    await lesson.save();

    res.status(200).json({
      message: "Lesson updated successfully",
      lesson,
    });

  } catch (error) {
    console.error("Update lesson error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =========================
// DELETE LESSON
// =========================

router.delete("/lessons/:id",authMiddleware,roleMiddleware([ "teacher" ]), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid lesson ID",
      });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    await Lesson.findByIdAndDelete(id);

    res.status(200).json({
      message: "Lesson deleted successfully",
    });

  } catch (error) {
    console.error("Delete lesson error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


module.exports = router;