const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Subscription = require("../models/subscription");
const Class          = require("../models/class");

// =====================================================
// Subscribe to a class
// POST /subscriptions/:classId
// =====================================================

router.post(
  "/subscriptions/:classId",
  authMiddleware,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const userId = req.user._id;

      // Check Class ID
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          message: "Invalid class ID",
        });
      }

      // Check class exists
      const classExists = await Class.findById(classId);

      if (!classExists) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      // Check if already subscribed
      const existingSubscription = await Subscription.findOne({
        classId,
        userId,
      });

      if (existingSubscription) {
        return res.status(409).json({
          message: "Already subscribed to this class",
        });
      }

      // Create subscription
      const subscription = await Subscription.create({
        classId,
        userId,
      });

      return res.status(201).json({
        message: "Subscribed successfully",
        subscription,
      });
    } catch (error) {
      console.error("Subscribe error:", error);

      // Handle duplicate key race condition
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Already subscribed to this class",
        });
      }

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Get current user's subscriptions
// GET /subscriptions/my
// =====================================================

router.get(
  "/subscriptions/my",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user._id;

      const subscriptions = await Subscription.find({
        userId,
      })
        .populate("classId")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        subscriptions,
      });
    } catch (error) {
      console.error("Get my subscriptions error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Check if current user is subscribed to a class
// GET /subscriptions/check/:classId
// =====================================================

router.get(
  "/subscriptions/check/:classId",
  authMiddleware,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const userId = req.user._id;

      // Check Class ID
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          message: "Invalid class ID",
        });
      }

      const subscription = await Subscription.findOne({
        classId,
        userId,
      });

      return res.status(200).json({
        subscribed: !!subscription,
      });
    } catch (error) {
      console.error("Check subscription error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Get all subscribers of a class
// GET /subscriptions/class/:classId
// =====================================================

router.get(
  "/subscriptions/class/:classId",
  authMiddleware,
  async (req, res) => {
    try {
      const { classId } = req.params;

      // Check Class ID
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          message: "Invalid class ID",
        });
      }

      // Check class exists
      const classExists = await Class.findById(classId);

      if (!classExists) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      const subscriptions = await Subscription.find({
        classId,
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        subscriptions,
      });
    } catch (error) {
      console.error("Get class subscribers error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// Unsubscribe from a class
// DELETE /subscriptions/:classId
// =====================================================

router.delete(
  "/subscriptions/:classId",
  authMiddleware,
  async (req, res) => {
    try {
      const { classId } = req.params;
      const userId = req.user._id;

      // Check Class ID
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          message: "Invalid class ID",
        });
      }

      const subscription = await Subscription.findOneAndDelete({
        classId,
        userId,
      });

      if (!subscription) {
        return res.status(404).json({
          message: "Subscription not found",
        });
      }

      return res.status(200).json({
        message: "Unsubscribed successfully",
      });
    } catch (error) {
      console.error("Unsubscribe error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;