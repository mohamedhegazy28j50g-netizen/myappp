const express = require("express");
const mongoose = require("mongoose");

const Session = require("../models/session");
const Lesson = require("../models/lesson");
const Subscription = require("../models/subscription");
const Notification = require("../models/notification");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const sessionAccessStatus = require("../middleware/sessionAccessStatus");
const { generateBunnySignedEmbedUrl, createBunnyUploadCredentials, deleteBunnyVideo } = require("../services/bunnyService");

const router = express.Router();

// =====================================================
// CREATE SESSION
// =====================================================

router.post(
  "/lessons/:lessonId/sessions",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { lessonId } = req.params;

      const {
        title,
        description,
        type,
        accessType,
        price,
        accessDurationDays,
        videos,
        pdf,
        assignment,
        order,
        scheduledAt,
        meetingUrl,
      } = req.body;

      // Check Lesson ID
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({
          message: "Invalid lesson ID",
        });
      }

      // Required fields
      if (!title || !type || order === undefined) {
        return res.status(400).json({
          message: "Title, type and order are required",
        });
      }

      // Check type
      if (!["recorded", "live"].includes(type)) {
        return res.status(400).json({
          message: "Invalid session type",
        });
      }

      // Check access type
      if (!["free", "paid"].includes(accessType)) {
        return res.status(400).json({
          message: "Invalid access type",
        });
      }

      // Check Lesson exists
      const lesson = await Lesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          message: "Lesson not found",
        });
      }

      // Paid session must have price
      if (accessType === "paid") {
        if (price === undefined || price <= 0) {
          return res.status(400).json({
            message: "Paid session must have a valid price",
          });
        }
      }

      // Recorded session must have videos
      if (type === "recorded") {
        if (!videos || !Array.isArray(videos) || videos.length === 0) {
          return res.status(400).json({
            message: "Recorded session must have at least one video",
          });
        }
      }

      // Live session must have scheduledAt and meetingUrl
      if (type === "live") {
        if (!scheduledAt || !meetingUrl) {
          return res.status(400).json({
            message: "Live session must have scheduledAt and meetingUrl",
          });
        }
      }

      const session = await Session.create({
        lessonId,
        title,
        description,
        type,
        accessType,
        price: accessType === "free" ? 0 : price,
        accessDurationDays,
        videos: type === "recorded" ? videos : [],
        pdf,
        assignment,
        order,
        scheduledAt: type === "live" ? scheduledAt : undefined,
        meetingUrl: type === "live" ? meetingUrl : undefined,
      });
      
      // Create notifications for all subscribed users of the course
      
      
      try {
       const subscriptions = await Subscription.find({
       classId: lesson.classId,
       }).select("userId");

       const notifications = subscriptions.map((subscription) => ({
       userId: subscription.userId,
       classId: lesson.classId,
       sessionId: session._id,
       title: "Session جديدة",
       message: `تم إضافة Session جديدة: ${session.title}`,
       }));

        if (notifications.length > 0) {
        await Notification.insertMany(notifications);
       }
       } catch (notificationError) {
        console.error(
       "Create notifications error:",
       notificationError
        );
       }

/////////////////////////// continue without waiting for notifications to finish//
      res.status(201).json({
        message: "Session created successfully",
        session,
      });
    } catch (error) {
      console.error("Create session error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
  
);

// =====================================================
// GET SESSIONS OF LESSON - PREVIEW ONLY
// =====================================================

router.get(
  "/lessons/:lessonId/sessions",
  authMiddleware,
  async (req, res) => {
    try {
      const { lessonId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({
          message: "Invalid lesson ID",
        });
      }

      const lesson = await Lesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          message: "Lesson not found",
        });
      }

      const sessions = await Session.find(
        {
          lessonId,
          isPublished: true,
        },
        {
          _id: 1,
          lessonId: 1,
          title: 1,
          description: 1,
          type: 1,
          accessType: 1,
          price: 1,
          accessDurationDays: 1,
          order: 1,
          createdAt: 1,
        }
      ).sort({
        order: 1,
      });

      res.status(200).json({
        sessions,
      });
    } catch (error) {
      console.error("Get sessions error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET ONE SESSION
// PREVIEW OR FULL CONTENT BASED ON ACCESS
// =====================================================

router.get(
  "/sessions/:id",
  authMiddleware,
  sessionAccessStatus,
  async (req, res) => {
    try {
      const session = req.sessionData;

      // ==========================================
      // USER HAS ACCESS
      // ==========================================

      if (req.hasAccess) {
  const sessionObj = session.toObject();

  if (sessionObj.videos && sessionObj.videos.length > 0) {
    sessionObj.videos = sessionObj.videos.map((video) => ({
      _id: video._id,
      title: video.title,
      order: video.order,
      embedUrl: generateBunnySignedEmbedUrl(video.videoId, 3600),
    }));
  }

  return res.status(200).json({
    hasAccess: true,
    accessExpiresAt: req.accessExpiresAt,
    session: sessionObj,
  });
}
      // ==========================================
      // USER DOES NOT HAVE ACCESS
      // ==========================================

      const preview = {
        _id: session._id,
        lessonId: session.lessonId,
        title: session.title,
        description: session.description,
        type: session.type,
        accessType: session.accessType,
        price: session.price,
        accessDurationDays: session.accessDurationDays,
        order: session.order,
        createdAt: session.createdAt,
      };

      return res.status(200).json({
        hasAccess: false,
        session: preview,
      });
    } catch (error) {
      console.error("Get session error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPDATE SESSION
// =====================================================

router.put(
  "/sessions/:id",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        description,
        type,
        accessType,
        price,
        accessDurationDays,
        videos,
        removeVideoIds,
        pdf,
        assignment,
        order,
        scheduledAt,
        meetingUrl,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid session ID",
        });
      }

      const session = await Session.findById(id);

      if (!session) {
        return res.status(404).json({
          message: "Session not found",
        });
      }

      // Update basic fields

      if (title !== undefined) {
        session.title = title;
      }

      if (description !== undefined) {
        session.description = description;
      }

      if (type !== undefined) {
        if (!["recorded", "live"].includes(type)) {
          return res.status(400).json({
            message: "Invalid session type",
          });
        }

        session.type = type;
      }

      if (accessType !== undefined) {
        if (!["free", "paid"].includes(accessType)) {
          return res.status(400).json({
            message: "Invalid access type",
          });
        }

        session.accessType = accessType;

        if (accessType === "free") {
          session.price = 0;
        }
      }

      if (price !== undefined) {
        session.price = price;
      }

      if (accessDurationDays !== undefined) {
        session.accessDurationDays = accessDurationDays;
      }

      // حذف فيديوهات معيّنة (بالـ _id بتاعها في الحصة، مش videoId بتاع Bunny)
      if (removeVideoIds !== undefined) {
        if (!Array.isArray(removeVideoIds)) {
          return res.status(400).json({
            message: "removeVideoIds must be an array",
          });
        }

        // بنجيب بيانات الفيديوهات المطلوب حذفها الأول (قبل أي تعديل)
        // عشان نعرف الـ videoId بتاعها على Bunny
        const videosToDelete = [];
        for (const removeId of removeVideoIds) {
          const videoDoc = session.videos.id(removeId);

          if (!videoDoc) {
            return res.status(400).json({
              message: `Video ${removeId} not found in this session`,
            });
          }

          videosToDelete.push(videoDoc);
        }

        // بنمسح من Bunny الأول. لو أي فيديو فشل يتمسح، نوقف العملية
        // كلها ومفيش أي حاجة بتتغيّر في الداتا بيز — session.save()
        // لسه ما اتنداش، فالحصة فاضلة زي ما هي بالظبط
        for (const videoDoc of videosToDelete) {
          try {
            await deleteBunnyVideo(videoDoc.videoId);
          } catch (bunnyError) {
            console.error("Delete Bunny video error:", bunnyError);

            return res.status(502).json({
              message: `Failed to delete video from Bunny, nothing was changed: ${bunnyError.message}`,
            });
          }
        }

        const removeSet = new Set(removeVideoIds.map(String));
        session.videos = session.videos.filter(
          (v) => !removeSet.has(v._id.toString())
        );
      }

      // إضافة فيديوهات جديدة وتعديل فيديوهات موجودة مع بعض:
      // - عنصر معاه _id → تعديل عنوان/ترتيب فيديو موجود بالفعل
      // - عنصر من غيره _id → فيديو جديد، لازم title + videoId + order
      if (videos !== undefined) {
        if (!Array.isArray(videos)) {
          return res.status(400).json({
            message: "Videos must be an array",
          });
        }

        for (const v of videos) {
          if (v._id) {
            const existing = session.videos.id(v._id);

            if (!existing) {
              return res.status(400).json({
                message: `Video ${v._id} not found in this session`,
              });
            }

            if (v.title !== undefined) existing.title = v.title;
            if (v.order !== undefined) existing.order = v.order;
            // videoId بتاع Bunny متعمّد إننا مانعدّلوش من هنا —
            // فيديو موجود يفضل مربوط بنفس الملف اللي اتربط بيه أول مرة
          } else {
            if (!v.title || !v.videoId || v.order === undefined) {
              return res.status(400).json({
                message: "New videos need title, videoId and order",
              });
            }

            session.videos.push({
              title: v.title,
              videoId: v.videoId,
              order: v.order,
            });
          }
        }
      }

      if (pdf !== undefined) {
        session.pdf = pdf;
      }

      if (assignment !== undefined) {
        session.assignment = assignment;
      }

      if (order !== undefined) {
        session.order = order;
      }

      if (scheduledAt !== undefined) {
        session.scheduledAt = scheduledAt;
      }

      if (meetingUrl !== undefined) {
        session.meetingUrl = meetingUrl;
      }

      // Final validation

      if (session.accessType === "paid") {
        if (session.price === undefined || session.price <= 0) {
          return res.status(400).json({
            message: "Paid session must have a valid price",
          });
        }
      }

      // ملحوظة: مفيش شرط هنا إن الحصة المسجّلة لازم يكون فيها فيديو
      // على الأقل — عمداً، عشان المدرّس يقدر يمسح كل فيديوهات حصة
      // وتفضل موجودة فاضية لحد ما يضيفلها فيديوهات تانية. الشرط ده
      // موجود بس وقت إنشاء حصة جديدة.

      if (session.type === "live") {
        if (!session.scheduledAt || !session.meetingUrl) {
          return res.status(400).json({
            message: "Live session must have scheduledAt and meetingUrl",
          });
        }
      }

      await session.save();

      res.status(200).json({
        message: "Session updated successfully",
        session,
      });
    } catch (error) {
      console.error("Update session error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET SESSION VIDEOS (بيانات آمنة بس — من غير videoId بتاع Bunny)
// يستخدمها المدرّس عشان يعرض/يعدّل/يمسح فيديوهات حصة موجودة
// =====================================================

router.get(
  "/sessions/:id/videos",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid session ID",
        });
      }

      const session = await Session.findById(id);

      if (!session) {
        return res.status(404).json({
          message: "Session not found",
        });
      }

      const videos = session.videos
        .map((v) => ({
          _id: v._id,
          title: v.title,
          order: v.order,
        }))
        .sort((a, b) => a.order - b.order);

      res.status(200).json({
        videos,
      });
    } catch (error) {
      console.error("Get session videos error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// DELETE SESSION
// =====================================================

router.delete(
  "/sessions/:id",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid session ID",
        });
      }

      const session = await Session.findById(id);

      if (!session) {
        return res.status(404).json({
          message: "Session not found",
        });
      }

      // ممنوع تمسح حصة لسه فيها فيديوهات — لازم تتمسح الفيديوهات
      // الأول (عن طريق PUT /sessions/:id مع removeVideoIds)، عشان
      // نضمن إن كل فيديو بيتمسح فعلياً من Bunny مش بس من الداتا بيز
      if (session.videos && session.videos.length > 0) {
        return res.status(400).json({
          message: "Delete the session's videos first before deleting the session itself",
        });
      }

      await Session.findByIdAndDelete(id);

      res.status(200).json({
        message: "Session deleted successfully",
      });
    } catch (error) {
      console.error("Delete session error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// INIT VIDEO UPLOAD (يستخدمه المدرّس قبل رفع أي فيديو)
// =====================================================

router.post(
  "/videos/init-upload",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({
          message: "Title is required",
        });
      }

      const credentials = await createBunnyUploadCredentials(title);

      res.status(200).json(credentials);
    } catch (error) {
      console.error("Init upload error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;