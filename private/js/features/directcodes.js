
import { api } from "../shared/api.js";
import { toast, esc } from "../shared/dom.js";
import {getclassesCache} from "./course.js";

/* =====================================================
       ============ قسم الأكواد (Direct Codes) ============
       ===================================================== */
    let classesCache = getclassesCache();
    let codesCache = [];
    let currentCodesSessionId = null;
    let currentCodesFilter = "all";
    let codesSectionLoaded = false;

    document.querySelector('.side-link[data-view="codes"]').addEventListener("click", () => {
      if (!codesSectionLoaded) initCodesSection();
    });

   export async function initCodesSection() {
      codesSectionLoaded = true;
      const classSelect = document.getElementById("codesClassSelect");

      try {
        // بنستخدم classesCache لو محمّلة، وإلا بنجيبها من جديد
        if (!classesCache.length) {
          const data = await api("/classes");
          classesCache = data.classes || [];
        }
        classSelect.innerHTML =
          `<option value="">اختار كورس...</option>` +
          classesCache.map((c) => `<option value="${c._id}">${esc(c.title)}</option>`).join("");
      } catch (err) {
        toast("معرفناش نجيب الكورسات: " + err.message, "error");
      }
    }

    document.getElementById("codesClassSelect").addEventListener("change", async (e) => {
      const classId = e.target.value;
      const lessonSelect = document.getElementById("codesLessonSelect");
      const sessionSelect = document.getElementById("codesSessionSelect");

      lessonSelect.innerHTML = `<option value="">اختار درس...</option>`;
      sessionSelect.innerHTML = `<option value="">اختار حصة...</option>`;
      lessonSelect.disabled = true;
      sessionSelect.disabled = true;
      hideCodesPanel();

      if (!classId) return;

      try {
        const data = await api(`/classes/${classId}/lessons`);
        const lessons = data.lessons || [];
        lessonSelect.innerHTML =
          `<option value="">اختار درس...</option>` +
          lessons.map((l) => `<option value="${l._id}">${esc(l.title)}</option>`).join("");
        lessonSelect.disabled = false;
      } catch (err) {
        toast("معرفناش نجيب الدروس: " + err.message, "error");
      }
    });

    document.getElementById("codesLessonSelect").addEventListener("change", async (e) => {
      const lessonId = e.target.value;
      const sessionSelect = document.getElementById("codesSessionSelect");

      sessionSelect.innerHTML = `<option value="">اختار حصة...</option>`;
      sessionSelect.disabled = true;
      hideCodesPanel();

      if (!lessonId) return;

      try {
        const data = await api(`/lessons/${lessonId}/sessions`);
        const sessions = data.sessions || [];
        sessionSelect.innerHTML =
          `<option value="">اختار حصة...</option>` +
          sessions.map((s) => `<option value="${s._id}" data-title="${esc(s.title)}">${esc(s.title)}</option>`).join("");
        sessionSelect.disabled = false;
      } catch (err) {
        toast("معرفناش نجيب الحصص: " + err.message, "error");
      }
    });

    document.getElementById("codesSessionSelect").addEventListener("change", (e) => {
      const sessionId = e.target.value;
      if (!sessionId) {
        hideCodesPanel();
        return;
      }
      const title = e.target.selectedOptions[0].dataset.title || "";
      showCodesPanel(sessionId, title);
    });

     function hideCodesPanel() {
      currentCodesSessionId = null;
      document.getElementById("codesSessionPanel").style.display = "none";
      document.getElementById("codesEmptyState").style.display = "";
    }

     function showCodesPanel(sessionId, sessionTitle) {
      currentCodesSessionId = sessionId;
      currentCodesFilter = "all";
      document.querySelectorAll("#codesFilter .chip").forEach((c) => c.classList.remove("active"));
      document.querySelector('#codesFilter .chip[data-filter="all"]').classList.add("active");

      document.getElementById("codesSessionTitle").textContent = sessionTitle;
      document.getElementById("codesSessionPanel").style.display = "";
      document.getElementById("codesEmptyState").style.display = "none";

      loadDirectCodes(sessionId);
    }

    async function loadDirectCodes(sessionId) {
      const wrap = document.getElementById("codesListWrap");
      wrap.innerHTML = `<p style="color:var(--text-dim);font-size:12.5px;">بيتم التحميل...</p>`;

      try {
        const data = await api(`/orders/direct-code/session/${sessionId}`);
        codesCache = data.codes || [];

        document.getElementById("codesStatTotal").textContent = data.total ?? codesCache.length;
        document.getElementById("codesStatUsed").textContent = data.used ?? codesCache.filter((c) => c.isUsed).length;
        document.getElementById("codesStatRemaining").textContent =
          data.remaining ?? (codesCache.length - codesCache.filter((c) => c.isUsed).length);

        renderDirectCodes();
      } catch (err) {
        wrap.innerHTML = `<p style="color:var(--live);font-size:12.5px;">معرفناش نجيب الأكواد: ${esc(err.message)}</p>`;
      }
    }

    export function renderDirectCodes() {
      const wrap = document.getElementById("codesListWrap");

      const filtered = codesCache.filter((c) => {
        if (currentCodesFilter === "used") return c.isUsed;
        if (currentCodesFilter === "unused") return !c.isUsed;
        return true;
      });

      if (!filtered.length) {
        wrap.innerHTML = `<p style="color:var(--text-dim);font-size:12.5px;text-align:center;padding:20px 0;">مفيش أكواد في القسم ده.</p>`;
        return;
      }

      wrap.innerHTML = filtered.map(codeRowTemplate).join("");
    }

    export function codeRowTemplate(c) {
      const usedByName = c.usedBy?.name || c.usedBy?.email || "—";
      const usedAt = c.usedAt ? new Date(c.usedAt).toLocaleString("ar-EG") : "—";

      const details = c.isUsed
        ? `اتستخدم بواسطة: <strong>${esc(usedByName)}</strong> — بتاريخ: ${usedAt}`
        : `الكود لسه متستخدمش.`;

      return `
        <div class="code-row" id="code-row-${c._id}">
          <div class="code-row-main">
            <code>${esc(c.code)}</code>
            <span class="code-status-pill ${c.isUsed ? "used" : "free"}">${c.isUsed ? "مستخدم" : "فاضي"}</span>
            <button class="btn-outline btn-sm" style="margin-inline-start:auto;" onclick="toggleCodeDetails('${c._id}')">تفاصيل</button>
          </div>
          <div class="code-row-details">${details}</div>
        </div>
      `;
    }

   export  function toggleCodeDetails(codeId) {
      document.getElementById(`code-row-${codeId}`).classList.toggle("expanded");
    }

    document.getElementById("codesFilter").addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      document.querySelectorAll("#codesFilter .chip").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      currentCodesFilter = btn.dataset.filter;
      renderDirectCodes();
    });

    export async function generateDirectCodes() {
      if (!currentCodesSessionId) return;

      const countStr = prompt("عايز تولّد كام كود؟");
      if (countStr === null) return;

      const count = parseInt(countStr, 10);
      if (!count || count <= 0) {
        toast("اكتب رقم صحيح أكبر من صفر", "error");
        return;
      }

      try {
        const data = await api("/orders/direct-code/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: currentCodesSessionId, count }),
        });
        toast(`اتولّدت ${data.count} كود بنجاح`, "success");
        await loadDirectCodes(currentCodesSessionId);
      } catch (err) {
        toast(err.message, "error");
      }
    }
   window.toggleCodeDetails = toggleCodeDetails;
   window.generateDirectCodes = generateDirectCodes;
  
   
