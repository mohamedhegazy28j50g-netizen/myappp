const express          = require("express");
const bcrypt           = require("bcrypt");
const crypto           = require("crypto");
const User             = require("../models/user");
const VerificationCode = require("../models/verificationcode");
const sendEmail         = require("../services/mailer");


const router = express.Router();





////////////////////////////////REGISTER ISSUEE/////////////////////////////////////////////


router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. التأكد من البيانات
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }
//تحويل الإيميل إلى حروف صغيرة وإزالة الفراغات
    const normalizedEmail = email.toLowerCase().trim();

    // 2. البحث عن المستخدم
    let user = await User.findOne({
      email: normalizedEmail,
    });

    // 3. لو المستخدم موجود بالفعل ومؤكد
    if (user && user.isVerified) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // 4. تشفير الـpassword
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. لو المستخدم موجود لكنه غير مؤكد
    if (user && !user.isVerified) {
      user.name = name;
      user.password = passwordHash;

      await user.save();
    }

    // 6. لو المستخدم مش موجود
    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
        password: passwordHash,
        isVerified: false,
      });
    }

    // 7. إنشاء Verification Code
    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 8. Hash للـcode
    const codeHash = await bcrypt.hash(code, 10);

    // 9. وقت انتهاء الكود = 5 دقائق
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // 10. حذف أي Code قديم لنفس الإيميل
    await VerificationCode.deleteMany({
      email: normalizedEmail,
    });

    // 11. حفظ الـCode الجديد
    await VerificationCode.create({
      email: normalizedEmail,
      codeHash,
      expiresAt,
    });

    // مؤقتًا هنطبع الكود في الـTerminal
    // لحد ما نربط Email Service
    await sendEmail( normalizedEmail, "Email Verification Code",
       ` <h2>Verify your email</h2> 
       <p>Your verification code is:</p> 
       <h1>${code}</h1>
       <p>This code expires in 5 minutes.</p> ` 
      );

    res.status(201).json({
      message:
        "Registration successful. Verification code sent.",
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});



router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // البحث عن الـverification code
    const verification = await VerificationCode.findOne({
      email: normalizedEmail,
    });

    if (!verification) {
      return res.status(400).json({
        message: "Verification code not found or expired",
      });
    }

    // التأكد من انتهاء المدة
    if (verification.expiresAt < new Date()) {
      await VerificationCode.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        message: "Verification code expired",
      });
    }

    // مقارنة الكود
    const isCodeCorrect = await bcrypt.compare(
      code,
      verification.codeHash
    );

    if (!isCodeCorrect) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // تأكيد الحساب
    user.isVerified = true;

    await user.save();

    // حذف verification code بعد نجاح التحقق
    await VerificationCode.deleteOne({
      _id: verification._id,
    });

    res.status(200).json({
      message: "Email verified successfully",
    });

  } catch (error) {
    console.error("Verification error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});



router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // البحث عن المستخدم
    const user = await User.findOne({
      email: normalizedEmail,
    });

    // المستخدم غير موجود
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // المستخدم متحقق بالفعل
    if (user.isVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    // إنشاء Code جديد
    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash للـCode
    const codeHash = await bcrypt.hash(code, 10);

    // صلاحية 5 دقائق
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // حذف أي Code قديم
    await VerificationCode.deleteMany({
      email: normalizedEmail,
    });

    // إنشاء Code جديد
    await VerificationCode.create({
      email: normalizedEmail,
      codeHash,
      expiresAt,
    });

    // مؤقتًا نطبع الكود في Terminal
    console.log(
      `New verification code for ${normalizedEmail}: ${code}`
    );

    res.status(200).json({
      message: "New verification code sent",
    });

  } catch (error) {
    console.error("Resend code error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});








////////////////////////////////LOGIN ISSUES //////////////////////////////////////////////

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // التأكد من البيانات
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // البحث عن المستخدم
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // التأكد من Verification
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    // مقارنة الباسورد
    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // إنشاء Session
    req.session.userId = user._id.toString();

    res.status(200).json({
      message: "Login successful",
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});



router.get("/me", async (req, res) => {
  try {
    // هل فيه Session؟
    if (!req.session.userId) {
      return res.status(401).json({
        authenticated: false,
        message: "Not authenticated",
      });
    }

    // نجيب المستخدم من MongoDB
    const user = await User.findById(req.session.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        authenticated: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      authenticated: true,
      user,
    });

  } catch (error) {
    console.error("Auth me error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});



router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // لا نكشف هل الإيميل موجود أم لا
    if (!user) {
      return res.status(200).json({
        message:
          "If this email exists, a verification code has been sent",
      });
    }

    // إنشاء كود 6 أرقام
    const code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash للكود
    const codeHash = await bcrypt.hash(code, 10);

    // حفظ الـHash ووقت الانتهاء
    user.passwordResetCodeHash = codeHash;
    user.passwordResetCodeExpires =
      new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    // مؤقتًا للاختبار فقط
    await sendEmail( normalizedEmail, "Email Verification Code",
       ` <h2>Verify your email</h2> 
       <p>Your verification code is:</p> 
       <h1>${code}</h1>
       <p>This code expires in 5 minutes.</p> ` 
      );

    res.status(200).json({
      message:
        "If this email exists, a verification code has been sent",
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});





router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired code",
      });
    }

    // هل الكود انتهت صلاحيته؟
    if (
      !user.passwordResetCodeExpires ||
      user.passwordResetCodeExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired code",
      });
    }

    // مقارنة الكود بالـHash المخزن
    const isCodeValid = await bcrypt.compare(
      code,
      user.passwordResetCodeHash
    );

    if (!isCodeValid) {
      return res.status(400).json({
        message: "Invalid or expired code",
      });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

const resetTokenHash = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

user.passwordResetTokenHash = resetTokenHash;

user.passwordResetTokenExpires =
  new Date(Date.now() + 10 * 60 * 1000);

// الكود خلاص اتستخدم
user.passwordResetCodeHash = null;
user.passwordResetCodeExpires = null;

await user.save();

    res.status(200).json({
      message: "Code verified successfully",
       resetToken,
    });

  } catch (error) {
    console.error("Verify reset code error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});



router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // نعمل Hash للـToken اللي جاي من الطالب
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // نبحث عن المستخدم بالـHash
    const user = await User.findOne({
      passwordResetTokenHash: resetTokenHash,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // نتأكد إن الـToken لسه صالح
    if (
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // تشفير الباسورد الجديد
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    user.password = newPasswordHash;

    // إبطال الـReset Token بعد استخدامه
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpires = null;

    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});






//////////////////////////////////////////////LOGOUT//////////////////////////////////////

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        message: "Could not logout",
      });
    }

    res.clearCookie("connect.sid");

    res.status(200).json({
      message: "Logout successful",
    });
  });
});






module.exports = router;