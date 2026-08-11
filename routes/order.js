const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/order");
const Session = require("../models/session");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// STUDENT OPERATIONS
// =====================================================

// =========================
// CREATE ORDER
// =========================

router.post("/orders", authMiddleware, async (req, res) => {
  try {
    const { sessionId, studentName, studentPhone } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID is required",
      });
    }

    if (!studentName || !studentPhone) {
      return res.status(400).json({
        message: "Student name and phone are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        message: "Invalid session ID",
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (!session.isPublished) {
      return res.status(400).json({
        message: "Session is not available",
      });
    }

    // الطالب لا يحتاج Order للـFree Session
    if (session.accessType === "free") {
      return res.status(400).json({
        message: "This session is free",
      });
    }

    // هل الطالب عنده Order مدفوعة بالفعل؟
    const paidOrder = await Order.findOne({
      userId: req.user._id,
      sessionId: session._id,
      status: "paid",
    });

    if (paidOrder) {
      return res.status(400).json({
        message: "You already have access to this session",
      });
    }

    // هل عنده Order معلقة؟
    const pendingOrder = await Order.findOne({
      userId: req.user._id,
      sessionId: session._id,
      status: "pending",
    });

    if (pendingOrder) {
      return res.status(400).json({
        message: "You already have a pending order",
        order: pendingOrder,
      });
    }

    const order = await Order.create({
      userId: req.user._id,
      sessionId: session._id,
      studentName: studentName.trim(),
      studentPhone: studentPhone.trim(),
      amount: session.price,
      paymentMethod: "cash",
      status: "pending",
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// GET MY ORDERS
// =========================

router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
    })
      .populate("sessionId", "title description price type")
      .sort({ createdAt: -1 });

    res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// GET ONE OF MY ORDERS
// =========================

router.get("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      userId: req.user._id,
    }).populate("sessionId", "title description price type");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================
// DELETE MY PENDING ORDER
// =========================

router.delete("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // لا يمكن حذف Order مدفوعة
    if (order.status === "paid") {
      return res.status(400).json({
        message: "Paid orders cannot be deleted",
      });
    }

    // لا يمكن حذف Order مرفوضة
    if (order.status === "rejected") {
      return res.status(400).json({
        message: "Rejected orders cannot be deleted",
      });
    }

    await Order.findByIdAndDelete(id);

    res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// TEACHER OPERATIONS
// =====================================================

// =========================
// GET ALL ORDERS
// =========================

router.get(
  "/teacher/orders",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("userId", "name email")
        .populate("sessionId", "title price type")
        .sort({ createdAt: -1 });

      res.status(200).json({
        orders,
      });
    } catch (error) {
      console.error("Get all orders error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// GET PENDING ORDERS
// =========================

router.get(
  "/teacher/orders/pending",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const orders = await Order.find({
        status: "pending",
      })
        .populate("userId", "name email")
        .populate("sessionId", "title price type")
        .sort({ createdAt: -1 });

      res.status(200).json({
        orders,
      });
    } catch (error) {
      console.error("Get pending orders error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// CONFIRM ORDER
// =========================

router.patch(
  "/teacher/orders/:id/confirm",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid order ID",
        });
      }

      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      // لازم تكون Pending
      if (order.status !== "pending") {
        return res.status(400).json({
          message: "Only pending orders can be confirmed",
        });
      }

      order.status = "paid";
      order.paidAt = new Date();

      await order.save();

      res.status(200).json({
        message: "Order confirmed successfully",
        order,
      });
    } catch (error) {
      console.error("Confirm order error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// REJECT ORDER
// =========================

router.patch(
  "/teacher/orders/:id/reject",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid order ID",
        });
      }

      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      // لازم تكون Pending
      if (order.status !== "pending") {
        return res.status(400).json({
          message: "Only pending orders can be rejected",
        });
      }

      order.status = "rejected";

      await order.save();

      res.status(200).json({
        message: "Order rejected successfully",
        order,
      });
    } catch (error) {
      console.error("Reject order error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;