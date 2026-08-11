const mongoose = require("mongoose");

const Session = require("../models/session");
const Order = require("../models/order");

const sessionAccessStatus = async (req, res, next) => {
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
    // Teacher has full access to all sessions
     if (req.user.role === "teacher") {
       req.hasAccess = true;
       req.accessExpiresAt = null;
       req.sessionData = session;

  return next();
}
    // Session مجانية
    if (session.accessType === "free") {
      req.hasAccess = true;
      req.accessExpiresAt = null;
      req.sessionData = session;

      return next();
    }

    // Session مدفوعة
    const order = await Order.findOne({
      userId: req.user._id,
      sessionId: session._id,
      status: "paid",
    });

    // لا يوجد اشتراك
    if (!order) {
      req.hasAccess = false;
      req.accessExpiresAt = null;
      req.sessionData = session;

      return next();
    }

    // اشتراك بدون مدة انتهاء
    if (
      session.accessDurationDays === null ||
      session.accessDurationDays === undefined
    ) {
      req.hasAccess = true;
      req.accessExpiresAt = null;
      req.sessionData = session;

      return next();
    }

    // حساب تاريخ انتهاء الاشتراك
    const accessExpiresAt = new Date(
      order.paidAt.getTime() +
        session.accessDurationDays * 24 * 60 * 60 * 1000
    );

    // الاشتراك انتهى
    if (new Date() > accessExpiresAt) {
      req.hasAccess = false;
      req.accessExpiresAt = accessExpiresAt;
      req.sessionData = session;

      return next();
    }

    // اشتراك فعال
    req.hasAccess = true;
    req.accessExpiresAt = accessExpiresAt;
    req.sessionData = session;

    next();

  } catch (error) {
    console.error("Session access status error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = sessionAccessStatus;