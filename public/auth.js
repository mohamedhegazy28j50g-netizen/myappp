
// =====================================================
// CONFIG
// =====================================================

const API_BASE_URL = "http://localhost:5000/auth";

// =====================================================
// STATE
// =====================================================

const state = {
  email: "",
  resetToken: "",
  verifyTimer: null,
};

// =====================================================
// ELEMENTS
// =====================================================

const authViews = document.querySelectorAll(".auth-view");
const authMessage = document.getElementById("message");

// =====================================================
// HELPERS
// =====================================================

function showMessage(message, type = "error") {
  if (!authMessage) return;

  authMessage.textContent = message;
  authMessage.className = `auth-message show ${type}`;
}

function hideMessage() {
  if (!authMessage) return;

  authMessage.textContent = "";
  authMessage.className = "auth-message";
}

function setLoading(button, loading, text = "") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = text || "جاري التنفيذ...";
  } else {
    button.disabled = false;
    button.textContent =
      button.dataset.originalText || button.textContent;
  }
}

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(
      `/auth${endpoint}`,
      {
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },

        ...options,
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.message || "حدث خطأ غير متوقع."
      );
    }

    return data;

  } catch (error) {

    // لو السيرفر نفسه مش شغال
    if (error.name === "TypeError") {
      throw new Error(
        "تعذر الاتصال بالسيرفر. تأكد أن Backend يعمل على http://localhost:5000"
      );
    }

    throw error;
  }
}

// =====================================================
// VIEW NAVIGATION
// =====================================================

function showView(viewId) {
  hideMessage();

  authViews.forEach((view) => {
    view.classList.remove("active");
  });

  const targetView = document.getElementById(viewId);

  if (!targetView) {
    console.error(
      `Auth view "${viewId}" غير موجود في HTML`
    );
    return;
  }

  targetView.classList.add("active");
}

// =====================================================
// LOGIN
// =====================================================

const loginForm =
  document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    handleLogin
  );
}

async function handleLogin(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const email = normalizeEmail(
    form.loginEmail.value
  );

  const password =
    form.loginPassword.value;

  const button =
    form.querySelector(
      "button[type='submit']"
    );

  hideMessage();

  setLoading(
    button,
    true,
    "جاري تسجيل الدخول..."
  );

  try {

    await apiRequest(
      "/login",
      {
        method: "POST",

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    showMessage(
      "تم تسجيل الدخول بنجاح.",
      "success"
    );

    setTimeout(() => {
      window.location.href = "home.html";
    }, 500);

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );

    setLoading(
      button,
      false
    );
  }
}

// =====================================================
// REGISTER
// =====================================================

const registerForm =
  document.getElementById("registerForm");

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    handleRegister
  );
}

async function handleRegister(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const name =
    form.registerName.value.trim();

  const email =
    normalizeEmail(
      form.registerEmail.value
    );

  const password =
    form.registerPassword.value;

  const confirmPassword =
    form.registerPasswordConfirm.value;

  const button =
    form.querySelector(
      "button[type='submit']"
    );

  hideMessage();

  // -----------------------------------------
  // Validation
  // -----------------------------------------

  if (name.length < 2) {

    showMessage(
      "اكتب اسمًا صحيحًا.",
      "error"
    );

    return;
  }

  if (password.length < 8) {

    showMessage(
      "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
      "error"
    );

    return;
  }

  if (password !== confirmPassword) {

    showMessage(
      "كلمتا المرور غير متطابقتين.",
      "error"
    );

    return;
  }

  // -----------------------------------------
  // Loading
  // -----------------------------------------

  setLoading(
    button,
    true,
    "جاري إنشاء الحساب..."
  );

  try {

    await apiRequest(
      "/register",
      {
        method: "POST",

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    // حفظ الإيميل لاستخدامه في التحقق
    state.email = email;

    // الانتقال إلى صفحة التحقق
    showView("registerVerifyView");

    const emailElement =
      document.getElementById(
        "registerVerifyEmail"
      );

    if (emailElement) {
      emailElement.textContent =
        state.email;
    }

    showMessage(
      "تم إنشاء الحساب. أدخل كود التحقق المرسل إلى بريدك.",
      "success"
    );

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );

    setLoading(
      button,
      false
    );
  }
}

// =====================================================
// REGISTER VERIFICATION
// =====================================================

const registerVerifyForm =
  document.getElementById(
    "registerVerifyForm"
  );

if (registerVerifyForm) {

  registerVerifyForm.addEventListener(
    "submit",
    handleRegisterVerification
  );
}

async function handleRegisterVerification(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const code =
    form.registerCode.value.trim();

  const button =
    form.querySelector(
      "button[type='submit']"
    );

  hideMessage();

  if (!/^\d{6}$/.test(code)) {

    showMessage(
      "أدخل كود مكوّن من 6 أرقام.",
      "error"
    );

    return;
  }

  setLoading(
    button,
    true,
    "جاري التأكيد..."
  );

  try {

    await apiRequest(
      "/verify",
      {
        method: "POST",

        body: JSON.stringify({
          email: state.email,
          code,
        }),
      }
    );

    showMessage(
      "تم تأكيد حسابك بنجاح. يمكنك الآن تسجيل الدخول.",
      "success"
    );

    setTimeout(() => {
      showView("loginView");
    }, 1000);

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );

    setLoading(
      button,
      false
    );
  }
}

// =====================================================
// RESEND REGISTER CODE
// =====================================================

const resendRegisterCode =
  document.getElementById(
    "resendRegisterCode"
  );

if (resendRegisterCode) {

  resendRegisterCode.addEventListener(
    "click",
    handleResendRegisterCode
  );
}

async function handleResendRegisterCode() {

  const button =
    resendRegisterCode;

  if (!state.email) {

    showMessage(
      "البريد الإلكتروني غير موجود.",
      "error"
    );

    return;
  }

  button.disabled = true;

  try {

    await apiRequest(
      "/resend-code",
      {
        method: "POST",

        body: JSON.stringify({
          email: state.email,
        }),
      }
    );

    showMessage(
      "تم إرسال كود جديد.",
      "success"
    );

    let seconds = 30;

    button.textContent =
      `إرسال كود جديد بعد ${seconds} ثانية`;

    const timer =
      setInterval(() => {

        seconds--;

        button.textContent =
          `إرسال كود جديد بعد ${seconds} ثانية`;

        if (seconds <= 0) {

          clearInterval(timer);

          button.disabled = false;

          button.textContent =
            "إرسال كود جديد";
        }

      }, 1000);

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );

    button.disabled = false;
  }
}

// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotForm =
  document.getElementById(
    "forgotForm"
  );

if (forgotForm) {

  forgotForm.addEventListener(
    "submit",
    handleForgotPassword
  );
}

async function handleForgotPassword(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const email =
    normalizeEmail(
      form.forgotEmail.value
    );

  const button =
    form.querySelector(
      "button[type='submit']"
    );

  state.email = email;

  hideMessage();

  setLoading(
    button,
    true,
    "جاري إرسال الكود..."
  );

  try {

    await apiRequest(
      "/forgot-password",
      {
        method: "POST",

        body: JSON.stringify({
          email,
        }),
      }
    );

    // الانتقال إلى صفحة إدخال الكود
    showView("resetVerifyView");

    const emailElement =
      document.getElementById(
        "resetVerifyEmail"
      );

    if (emailElement) {
      emailElement.textContent =
        state.email;
    }

    showMessage(
      "لو البريد مسجل، تم إرسال كود إعادة تعيين إلى بريدك.",
      "success"
    );

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );

    setLoading(
      button,
      false
    );
  }
}

// =====================================================
// VERIFY RESET CODE
// =====================================================

const resetVerifyForm =
  document.getElementById(
    "resetVerifyForm"
  );

if (resetVerifyForm) {

  resetVerifyForm.addEventListener(
    "submit",
    handleVerifyResetCode
  );
}

async function handleVerifyResetCode(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const code =
    form.resetCode.value.trim();

  const button =
    form.querySelector(
      "button[type='submit']"
    );

  hideMessage();

  if (!/^\d{6}$/.test(code)) {

    showMessage(
      "أدخل كود مكوّن من 6 أرقام.",
      "error"
    );

    return;
  }

  setLoading(
    button,
    true,
    "جاري التحقق..."
  );

  try {

    const data =
      await apiRequest(
        "/verify-reset-code",
        {
          method: "POST",

          body: JSON.stringify({
            email: state.email,
            code,
          }),
        }
      );

    if (!data.resetToken) {

      throw new Error(
        "لم يتم استلام رمز إعادة التعيين من السيرفر."
      );
    }

    state.resetToken =
      data.resetToken;

    showView("resetPasswordView");

    showMessage(
      "تم التحقق من الكود. اختر كلمة المرور الجديدة.",
      "success"
    );

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );

    setLoading(
      button,
      false
    );
  }
}

// =====================================================
// RESET PASSWORD
// =====================================================

const resetPasswordForm =
  document.getElementById(
    "resetPasswordForm"
  );

if (resetPasswordForm) {

  resetPasswordForm.addEventListener(
    "submit",
    handleResetPassword
  );
}

async function handleResetPassword(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const newPassword =
    form.newPassword.value;

  const confirmPassword =
    form.newPasswordConfirm.value;

  const button =
    form.querySelector(
      "button[type='submit']"
    );

  hideMessage();

  // -----------------------------------------
  // Validation
  // -----------------------------------------

  if (newPassword.length < 8) {

    showMessage(
      "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
      "error"
    );

    return;
  }

  if (newPassword !== confirmPassword) {

    showMessage(
      "كلمتا المرور غير متطابقتين.",
      "error"
    );

    return;
  }

  if (!state.resetToken) {

    showMessage(
      "جلسة إعادة تعيين كلمة المرور غير صالحة. ابدأ العملية من جديد.",
      "error"
    );

    return;
  }

  setLoading(
    button,
    true,
    "جاري تغيير كلمة المرور..."
  );

  try {

    await apiRequest(
      "/reset-password",
      {
        method: "POST",

        body: JSON.stringify({
          resetToken: state.resetToken,
          newPassword,
        }),
      }
    );

    state.resetToken = "";

    showMessage(
      "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
      "success"
    );

    setTimeout(() => {
      showView("loginView");
    }, 1200);

  } catch (error) {

    showMessage(
      error.message,
      "error"
    );

    setLoading(
      button,
      false
    );
  }
}

// =====================================================
// PASSWORD VISIBILITY
// =====================================================

function setupPasswordToggle() {

  const buttons =
    document.querySelectorAll(
      ".show-password"
    );

  buttons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const inputId =
          button.dataset.target;

        const input =
          document.getElementById(
            inputId
          );

        if (!input) return;

        if (input.type === "password") {

          input.type = "text";

          button.textContent = "🙈";

        } else {

          input.type = "password";

          button.textContent = "👁";
        }
      }
    );

  });
}

// =====================================================
// NAVIGATION BUTTONS
// =====================================================

document
  .querySelectorAll("[data-show]")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const viewId =
          button.dataset.show;

        showView(viewId);

        // لو صفحة التسجيل
        if (viewId === "registerView") {

          const emailInput =
            document.getElementById(
              "registerEmail"
            );

          if (emailInput) {
            emailInput.value = "";
          }
        }

        // لو صفحة نسيان الباسورد
        if (viewId === "forgotView") {

          const emailInput =
            document.getElementById(
              "forgotEmail"
            );

          if (emailInput) {
            emailInput.value = "";
          }
        }
      }
    );

  });

// =====================================================
// INITIALIZE
// =====================================================

setupPasswordToggle();

// إظهار Login عند فتح الصفحة
showView("loginView");

