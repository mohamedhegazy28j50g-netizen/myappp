const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/notification");

// =====================================================
// Get current user's notifications
// GET /notifications
// =====================================================

router.get(
  "/notifications",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user._id;

      const notifications = await Notification.find({
        userId,
      })
        .populate("classId", "title")
        .populate("sessionId", "title")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        notifications,
      });
    } catch (error) {
      console.error("Get notifications error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Get unread notifications count
// GET /notifications/unread-count
// =====================================================

router.get(
  "/notifications/unread-count",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user._id;

      const count = await Notification.countDocuments({
        userId,
        isRead: false,
      });

      return res.status(200).json({
        count,
      });
    } catch (error) {
      console.error("Get unread notifications count error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Mark one notification as read
// PATCH /notifications/:notificationId/read
// =====================================================

router.patch(
  "/notifications/:notificationId/read",
  authMiddleware,
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({
          message: "Invalid notification ID",
        });
      }

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          userId,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found",
        });
      }

      return res.status(200).json({
        message: "Notification marked as read",
        notification,
      });
    } catch (error) {
      console.error("Mark notification as read error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Mark all notifications as read
// PATCH /notifications/read-all
// =====================================================

router.patch(
  "/notifications/read-all",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user._id;

      const result = await Notification.updateMany(
        {
          userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      return res.status(200).json({
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Delete one notification
// DELETE /notifications/:notificationId
// =====================================================

router.delete(
  "/notifications/:notificationId",
  authMiddleware,
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({
          message: "Invalid notification ID",
        });
      }

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
      });

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found",
        });
      }

      return res.status(200).json({
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Delete notification error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;