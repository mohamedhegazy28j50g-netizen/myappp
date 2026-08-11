const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  try {
    // هل فيه مستخدم عامل Login؟
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // جلب المستخدم من Database
    const user = await User.findById(req.session.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // نحط المستخدم في req
    req.user = user;

    next();

  } catch (error) {
    console.error("Auth middleware error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = authMiddleware;