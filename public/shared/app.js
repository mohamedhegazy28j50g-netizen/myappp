/* =====================================================
   app.js المشترك — منصة الأستاذ
   بيتحمّل في كل صفحة قبل الـ <script> الخاص بيها.
   بيوفر:
   1) تبديل الوضع الفاتح/الغامق (theme) — نفس السلوك في كل صفحة.
   2) initI18n(translations, onChange) — كل صفحة بتعرّف كائن
      الترجمة الخاص بيها وتناديه؛ هو اللي بيتكفل بـ:
      - تطبيق data-i18n / data-i18n-placeholder / data-i18n-title
      - ضبط lang/dir على <html>
      - زرار تبديل اللغة
      - حفظ الاختيار في localStorage
      - استدعاء onChange(lang) بعد كل تبديل
   3) initAuthState() — بيتنفّذ تلقائي في أي صفحة فيها زرار
      "سجّل دخول" (.btn-cta) جوه .nav-right:
      - لو فيه اسم محفوظ من زيارة سابقة (localStorage) بيعرضه
        فوراً من غير ما يستنى رد السيرفر، وبعدين يتأكد من
        GET /auth/me في الخلفية ويصحّح لو اختلف
      - لو مفيش كاش: يستنى GET /auth/me الأول
      - لو مسجّل دخول: بيظهر زرار "مرحباً، [الاسم]" اللي بيفتح
        قائمة جانبية (Drawer) فيها لينك لـ "طلباتي/حصصي" وزرار
        "تسجيل خروج"
      - لو مش مسجّل: يظهر زرار "سجّل دخول" العادي
   ===================================================== */

(function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const html = document.documentElement;
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
    themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  }

  themeToggle.addEventListener("click", () => {
    const current = html.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    themeToggle.textContent = next === "dark" ? "☀️" : "🌙";
  });
})();

function initI18n(translations, onChange) {
  const html = document.documentElement;
  const langToggle = document.getElementById("langToggle");
  let currentLang = localStorage.getItem("lang") || "ar";

  function apply(lang) {
    const dict = translations[lang] || {};

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (dict[key] !== undefined) el.title = dict[key];
    });

    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    if (langToggle) langToggle.textContent = lang === "ar" ? "EN" : "AR";
    localStorage.setItem("lang", lang);

    if (typeof onChange === "function") onChange(lang);
  }

  if (langToggle) {
    langToggle.addEventListener("click", () => {
      currentLang = currentLang === "ar" ? "en" : "ar";
      apply(currentLang);
    });
  }

  apply(currentLang);

  return {
    getLang: () => currentLang,
    apply,
  };
}

/* =====================================================
   initAuthState — حالة تسجيل الدخول + القائمة الجانبية
   ===================================================== */
(function initAuthState() {
  const ctaBtn = document.querySelector(".nav-right .btn-cta");
  if (!ctaBtn) return;

  const drawerText = {
    ar: {
      hello: "",
      tag: "طالب مسجّل",
      orders: "طلباتي",
      sessions: "حصصي",
      dashboard: "لوحة التحكم",
      logout: "تسجيل الخروج",
      close: "إغلاق",
    },
    en: {
      hello: "",
      tag: "Registered Student",
      orders: "My Orders",
      sessions: "My Sessions",
      dashboard: "Dashboard",
      logout: "Log Out",
      close: "Close",
    },
  };

  const drawerIcons = {
    orders:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10a1 1 0 0 1 1 1v16l-2.5-1.5L13 20l-2.5-1.5L8 20l-2.5-1.5V4a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    sessions:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.7l6 3.3-6 3.3z" fill="currentColor" stroke="none"/></svg>',
    dashboard:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 22V12h6v10"/></svg>',
    logout:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  function getLang() {
    return localStorage.getItem("lang") || "ar";
  }

  const CACHE_KEY = "cachedUser";

  function getCachedUser() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function setCachedUser(user) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ name: user.name, role: user.role }));
    } catch (err) {
      // localStorage ممكن يكون معطّل (وضع خاص مثلاً) — مش مشكلة، هنكمل بدونه
    }
  }

  function clearCachedUser() {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (err) {
      // نفس الملاحظة فوق
    }
  }

  function buildDrawer(user) {
    const t = drawerText[getLang()];
    const isTeacher = user.role === "teacher";

    const drawer = document.createElement("aside");
    drawer.className = "user-drawer";
    drawer.id = "userDrawer";
    drawer.innerHTML = `
      <button class="drawer-close icon-btn" id="drawerCloseBtn" aria-label="${t.close}">${drawerIcons.close}</button>

      <div class="drawer-card">
        <div class="drawer-card-glow"></div>
        <div class="drawer-avatar">${(user.name || "?").trim().charAt(0)}</div>
        <div class="drawer-name">${user.name || ""}</div>
        <div class="drawer-tag"><span class="drawer-tag-dot"></span>${t.tag}</div>
      </div>

      <nav class="drawer-links">
        <a href="account.html?tab=orders" class="drawer-link">
          <span class="drawer-link-icon">${drawerIcons.orders}</span>
          <span class="drawer-link-label">${t.orders}</span>
          <span class="drawer-link-chevron">›</span>
        </a>
        <a href="account.html?tab=sessions" class="drawer-link">
          <span class="drawer-link-icon">${drawerIcons.sessions}</span>
          <span class="drawer-link-label">${t.sessions}</span>
          <span class="drawer-link-chevron">›</span>
        </a>
        ${isTeacher ? `
        <a href="dashboard.html" class="drawer-link">
          <span class="drawer-link-icon">${drawerIcons.dashboard}</span>
          <span class="drawer-link-label">${t.dashboard}</span>
          <span class="drawer-link-chevron">›</span>
        </a>` : ""}
      </nav>

      <button class="drawer-logout" id="drawerLogoutBtn">
        ${drawerIcons.logout}
        <span>${t.logout}</span>
      </button>
    `;

    document.body.appendChild(drawer);

    function closeDrawer() {
      drawer.classList.remove("open");
      document.body.classList.remove("drawer-open");
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    }

    function handleOutsideClick(e) {
      if (!drawer.contains(e.target) && e.target !== activeButton) closeDrawer();
    }

    function handleEscape(e) {
      if (e.key === "Escape") closeDrawer();
    }

    function openDrawer() {
      drawer.classList.add("open");
      document.body.classList.add("drawer-open");
      // مستنيين tick واحد عشان نفس ضغطة فتح القائمة (لو جاية من
      // برا الزرار) ماتقفلهاش على طول من خلال نفس الحدث
      setTimeout(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);
      }, 0);
    }

    drawer.querySelector("#drawerCloseBtn").addEventListener("click", closeDrawer);

    drawer.querySelector("#drawerLogoutBtn").addEventListener("click", async () => {
      try {
        await fetch("/auth/logout", { method: "POST", credentials: "include" });
      } catch (err) {
        // حتى لو فشل الطلب، نكمل تحديث الواجهة عشان المستخدم مايتقفلش برا
      }
      clearCachedUser();
      window.location.href = "home.html";
    });

    return { openDrawer, closeDrawer, drawer };
  }

  let activeButton = ctaBtn;
  let activeDrawer = null;

  function destroyDrawer() {
    if (activeDrawer) {
      activeDrawer.closeDrawer();
      activeDrawer.drawer.remove();
      activeDrawer = null;
    }
  }

  function mountHelloButton(user) {
    const t = drawerText[getLang()];
    const helloBtn = document.createElement("button");
    helloBtn.className = "btn-cta auth-ready";
    helloBtn.id = "userHelloBtn";
    helloBtn.type = "button";
    helloBtn.textContent = `${t.hello} ${user.name || ""}`;
    activeButton.replaceWith(helloBtn);
    activeButton = helloBtn;

    destroyDrawer();
    activeDrawer = buildDrawer(user);
    helloBtn.addEventListener("click", activeDrawer.openDrawer);
  }

  function mountLoginButton() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = originalCtaMarkup;
    const freshBtn = wrapper.firstElementChild;
    freshBtn.classList.add("auth-ready");
    activeButton.replaceWith(freshBtn);
    activeButton = freshBtn;
    destroyDrawer();
  }

  const originalCtaMarkup = ctaBtn.outerHTML;

  const cachedUser = getCachedUser();
  if (cachedUser && cachedUser.name) {
    mountHelloButton(cachedUser);
  }

  fetch("/auth/me", { credentials: "include" })
    .then((res) => {
      if (res.status === 401) return { authenticated: false };
      if (!res.ok) throw new Error("server error");
      return res.json();
    })
    .then((data) => {
      if (data.authenticated && data.user) {
        // بنقارن الاسم والدور مع بعض — لو أي حاجة اتغيّرت (خصوصاً
        // الدور) لازم نعيد بناء القائمة عشان لينك الداشبورد يتحدّث صح
        const profileChanged = !cachedUser
          || cachedUser.name !== data.user.name
          || cachedUser.role !== data.user.role;
        setCachedUser(data.user);
        if (profileChanged) mountHelloButton(data.user);
      } else {
        clearCachedUser();
        mountLoginButton();
      }
    })
    .catch(() => {
      if (!cachedUser) mountLoginButton();
    });
})();