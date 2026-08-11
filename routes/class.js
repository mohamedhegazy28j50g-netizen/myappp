const express        = require("express");
const Class          = require("../models/class");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const mongoose       = require("mongoose");

const router = express.Router();

 

//////teacher operations /////////*************** */





////////////////////////////////// CREATE CLASS *///////////////////////////////////////


router.post("/",authMiddleware,roleMiddleware([ "teacher" ]),async (req, res) => {
  try {
    const { title, description, thumbnail } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const newClass = await Class.create({
      title,
      description,
      thumbnail,
    });

    res.status(201).json({
      message: "Class created successfully",
      class: newClass,
    });

  } catch (error) {
    console.error("Create class error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


////////////////////////////////// UPDATE CLASS///////////////////////////////////////////


router.put("/:id",authMiddleware,roleMiddleware([ "teacher" ]), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    message: "Invalid class ID",
  });
   }

    const { title, description, thumbnail,isPublished } = req.body;

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    if (title !== undefined) {
      classData.title = title;
    }

    if (description !== undefined) {
      classData.description = description;
    }

    if (thumbnail !== undefined) {
      classData.thumbnail = thumbnail;
    }

    if (isPublished !== undefined) {
      classData.isPublished = isPublished;
    }

    await classData.save();

    res.status(200).json({
      message: "Class updated successfully",
      class: classData,
    });

  } catch (error) {
    console.error("Update class error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


////////////////////////////////// DELETE CLASS///////////////////////////////////////////

router.delete("/:id",authMiddleware,roleMiddleware([ "teacher" ]), async (req, res) => {
  try {
    const { id } = req.params;
     if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }


    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    await Class.findByIdAndDelete(id);

    res.status(200).json({
      message: "Class deleted successfully",
    });

  } catch (error) {
    console.error("Delete class error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});




//student operations /////////*************** */






////////////////////////////////// GET PUBLISHED CLASSES////////////////////////////////////////////
            

router.get("/", async (req, res) => {
  try {
    const classes = await Class.aggregate([
      {
        $match: {
          isPublished: true,
        },
      },

      {
        $lookup: {
          from: "lessons",
          localField: "_id",
          foreignField: "classId",
          as: "lessons",
        },
      },

      {
        $lookup: {
          from: "sessions",
          let: {
            lessonIds: "$lessons._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$lessonId", "$$lessonIds"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "sessionStats",
        },
      },

      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          isPublished: 1,
          createdAt: 1,

          lessonsCount: {
            $size: "$lessons",
          },

          sessionsCount: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$sessionStats.count",
                  0,
                ],
              },
              0,
            ],
          },
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    res.status(200).json({
      classes,
    });

  } catch (error) {
    console.error("Get classes error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

////////////////////////////////// GET ONE CLASS////////////////////////////////////////////

router.get("/:id",authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findOne({
      _id: id,
      isPublished: true,
    });

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    res.status(200).json({
      class: classData,
    });

  } catch (error) {
    console.error("Get class error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


module.exports = router;