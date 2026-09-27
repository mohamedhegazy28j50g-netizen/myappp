
import {loadClasses} from "./features/course.js";
import "./features/order.js";
import "./features/directcodes.js";
import "./features/site-settings.js";
import "./features/user.js";




/* =====================================================
       التنقل بين أقسام السايدبار
       ===================================================== */
    document.querySelectorAll(".side-link[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".side-link[data-view]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".dash-view").forEach((v) => v.classList.remove("active"));
        document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
      });
    });
    
    
    
    /* =====================================================
       بداية التشغيل
       ===================================================== */
    initI18n({ ar: {}, en: {} });
    loadClasses();

    