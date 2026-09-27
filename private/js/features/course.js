
import { api } from "../shared/api.js";
import { toast, esc } from "../shared/dom.js";
import { openModal, closeModal, showFormMsg, hideFormMsg } from "../shared/modal.js";

/* =====================================================
       ============ قسم الكورسات ============
       ===================================================== */
    let classesCache = [];
    let lessonsCache = {};   // classId -> [lessons]
    let sessionsCache = {};  // lessonId -> [sessions]

    export async function loadClasses() {
      const tree = document.getElementById("classesTree");
      tree.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><p>بيتم التحميل...</p></div>`;

      try {
        const data = await api("/classes");
        classesCache = data.classes || [];

        if (!classesCache.length) {
          tree.innerHTML = `<div class="empty-state"><div class="icon">📭</div><h3 style="color:var(--text);margin-bottom:6px;">مفيش كورسات لسه</h3><p>ابدأ بإضافة كورس جديد.</p></div>`;
          return;
        }

        tree.innerHTML = classesCache.map(classNodeTemplate).join("");
      } catch (err) {
        tree.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3 style="color:var(--text);margin-bottom:6px;">معرفناش نجيب الكورسات</h3><p>${esc(err.message)}</p></div>`;
      }
    }

   export function classNodeTemplate(cls) {
      const thumb = cls.thumbnail
        ? `<img src="${esc(cls.thumbnail)}" alt="" />`
        : (cls.title || "?").trim().charAt(0);

      return `
        <div class="class-node" id="class-node-${cls._id}">
          <div class="class-row" onclick="toggleClass('${cls._id}')">
            <div class="expand-icon">▶</div>
            <div class="node-thumb">${thumb}</div>
            <div class="node-info">
              <h3>${esc(cls.title)}</h3>
              <div class="node-sub">📖 ${cls.lessonsCount ?? 0} درس · 🎥 ${cls.sessionsCount ?? 0} حصة</div>
            </div>
            <span class="status-pill ${cls.isPublished ? "published" : "draft"}">${cls.isPublished ? "منشور" : "مسودة"}</span>
            <div class="row-actions" onclick="event.stopPropagation()">
              <button class="btn-outline btn-sm" onclick="openClassModal('${cls._id}')">تعديل</button>
              <button class="btn-danger btn-sm" onclick="deleteClass('${cls._id}', '${esc(cls.title)}')">حذف</button>
            </div>
          </div>
          <div class="class-children" id="class-children-${cls._id}">
            <!-- الدروس بتتحط هنا لما تتفتح -->
          </div>
        </div>
      `;
    }

   export  async function toggleClass(classId) {
      const node = document.getElementById(`class-node-${classId}`);
      const willExpand = !node.classList.contains("expanded");
      node.classList.toggle("expanded");
      if (willExpand) await loadLessons(classId);
    }

   export  async function loadLessons(classId) {
      const container = document.getElementById(`class-children-${classId}`);
      container.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">بيتم التحميل...</p>`;

      try {
        const data = await api(`/classes/${classId}/lessons`);
        lessonsCache[classId] = data.lessons || [];
        renderLessons(classId);
      } catch (err) {
        container.innerHTML = `<p style="color:var(--live);font-size:13px;">معرفناش نجيب الدروس: ${esc(err.message)}</p>`;
      }
    }

   export  function renderLessons(classId) {
      const container = document.getElementById(`class-children-${classId}`);
      const lessons = lessonsCache[classId] || [];

      const rows = lessons.map((l) => lessonNodeTemplate(l, classId)).join("");
      container.innerHTML = `
        ${rows || `<p style="color:var(--text-dim);font-size:13px;margin-bottom:8px;">مفيش دروس لسه.</p>`}
        <button class="add-child-btn" onclick="openLessonModal('${classId}')">+ إضافة درس</button>
      `;
    }

    function lessonNodeTemplate(lesson, classId) {
      return `
        <div class="lesson-node" id="lesson-node-${lesson._id}">
          <div class="lesson-row" onclick="toggleLesson('${lesson._id}')">
            <div class="expand-icon">▶</div>
            <div class="lesson-order-badge">${lesson.order}</div>
            <div class="node-info"><h3 style="font-size:14px;">${esc(lesson.title)}</h3></div>
            <div class="row-actions" onclick="event.stopPropagation()">
              <button class="btn-outline btn-sm" onclick="openLessonModal('${classId}', '${lesson._id}')">تعديل</button>
              <button class="btn-danger btn-sm" onclick="deleteLesson('${lesson._id}', '${classId}', '${esc(lesson.title)}')">حذف</button>
            </div>
          </div>
          <div class="lesson-children" id="lesson-children-${lesson._id}"></div>
        </div>
      `;
    }

    async function toggleLesson(lessonId) {
      const node = document.getElementById(`lesson-node-${lessonId}`);
      const willExpand = !node.classList.contains("expanded");
      node.classList.toggle("expanded");
      if (willExpand) await loadSessions(lessonId);
    }

    async function loadSessions(lessonId) {
      const container = document.getElementById(`lesson-children-${lessonId}`);
      container.innerHTML = `<p style="color:var(--text-dim);font-size:12.5px;">بيتم التحميل...</p>`;

      try {
        const data = await api(`/lessons/${lessonId}/sessions`);
        sessionsCache[lessonId] = data.sessions || [];
        renderSessions(lessonId);
      } catch (err) {
        container.innerHTML = `<p style="color:var(--live);font-size:12.5px;">معرفناش نجيب الحصص: ${esc(err.message)}</p>`;
      }
    }

    function renderSessions(lessonId) {
      const container = document.getElementById(`lesson-children-${lessonId}`);
      const sessions = sessionsCache[lessonId] || [];

      const rows = sessions.map((s) => sessionRowTemplate(s, lessonId)).join("");
      container.innerHTML = `
        ${rows || `<p style="color:var(--text-dim);font-size:12.5px;margin-bottom:8px;">مفيش حصص لسه.</p>`}
        <button class="add-child-btn" onclick="openSessionModal('${lessonId}')">+ إضافة حصة</button>
      `;
    }

    function sessionRowTemplate(s, lessonId) {
      const icon = s.type === "live" ? "🔴" : "🎥";
      const priceLabel = s.accessType === "free" ? "مجانية" : `${s.price} ج.م`;

      return `
        <div class="session-row">
          <span class="session-type-icon">${icon}</span>
          <div class="node-info">
            <h4>${esc(s.title)}</h4>
            <div class="node-sub">${s.type === "live" ? "لايف" : "مسجّلة"} · ${priceLabel}${s.isPublished === false ? " · <span style=\"color:var(--text-dim)\">مسودة</span>" : ""}</div>
          </div>
          <div class="row-actions">
            <button class="btn-outline btn-sm" onclick="openSessionModal('${lessonId}', '${s._id}')">تعديل</button>
            <button class="btn-danger btn-sm" onclick="deleteSession('${s._id}', '${lessonId}', '${esc(s.title)}')">حذف</button>
          </div>
        </div>
      `;
    }
/* =====================================================
       ============ نموذج الكورس (Class) ============
       ===================================================== */
    export function openClassModal(classId) {
      hideFormMsg("classFormMsg");
      document.getElementById("classForm").reset();
      document.getElementById("classId").value = classId || "";

      const publishedRow = document.getElementById("publishedRow");

      if (classId) {
        const cls = classesCache.find((c) => c._id === classId);
        document.getElementById("classModalTitle").textContent = "تعديل الكورس";
        document.getElementById("classTitle").value = cls?.title || "";
        document.getElementById("classDescription").value = cls?.description || "";
        document.getElementById("classThumbnail").value = cls?.thumbnail || "";
        document.getElementById("classPublished").checked = !!cls?.isPublished;
        publishedRow.style.display = "flex";
      } else {
        document.getElementById("classModalTitle").textContent = "كورس جديد";
        publishedRow.style.display = "none";
      }

      openModal("classModalOverlay");
    }
    //////////////////////////////////////////////image 

async function uploadClassThumbnail(file) {
  const statusEl = document.getElementById("classThumbnailStatus");
  const previewEl = document.getElementById("classThumbnailPreview");
  const hiddenUrl = document.getElementById("classThumbnail");

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    throw new Error("اختار صورة فقط");
  }

  statusEl.textContent = "جاري رفع الصورة...";

  const formData = new FormData();
  formData.append("file", file);

  const result = await api("/images/upload", {
    method: "POST",
    body: formData,
  });

  hiddenUrl.value = result.publicUrl;

  previewEl.innerHTML = `
    <img
      src="${esc(result.publicUrl)}"
      style="
        width:120px;
        height:80px;
        object-fit:cover;
        border-radius:8px;
        margin-top:8px;
      "
      alt=""
    />
  `;

  statusEl.textContent = "✅ الصورة اترفعت بنجاح";
}
document.getElementById("classThumbnailFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const statusEl = document.getElementById("classThumbnailStatus");
  if (!file) return;

  try {
    await uploadClassThumbnail(file);
  } catch (err) {
    statusEl.textContent = "❌ " + err.message;
  }
});

////////////////////////////image

    document.getElementById("classForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      hideFormMsg("classFormMsg");

      const classId = document.getElementById("classId").value;
      const payload = {
        title: document.getElementById("classTitle").value.trim(),
        description: document.getElementById("classDescription").value.trim(),
        thumbnail: document.getElementById("classThumbnail").value.trim(),
      };

      if (classId) {
        payload.isPublished = document.getElementById("classPublished").checked;
      }

      try {
        if (classId) {
          await api(`/classes/${classId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          toast("اتحدّث الكورس بنجاح", "success");
        } else {
          await api("/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          toast("اتضاف الكورس بنجاح", "success");
        }
        closeModal("classModalOverlay");
        loadClasses();
      } catch (err) {
        showFormMsg("classFormMsg", err.message, "error");
      }
    });

    async function deleteClass(classId, title) {
      if (!confirm(`متأكد إنك عايز تمسح "${title}"؟ هيتمسح كل الدروس والحصص اللي جواه.`)) return;
      try {
        await api(`/classes/${classId}`, { method: "DELETE" });
        toast("اتمسح الكورس", "success");
        loadClasses();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /* =====================================================
       ============ نموذج الدرس (Lesson) ============
       ===================================================== */
    export function openLessonModal(classId, lessonId) {
      hideFormMsg("lessonFormMsg");
      document.getElementById("lessonForm").reset();
      document.getElementById("lessonClassId").value = classId;
      document.getElementById("lessonId").value = lessonId || "";

      if (lessonId) {
        const lesson = (lessonsCache[classId] || []).find((l) => l._id === lessonId);
        document.getElementById("lessonModalTitle").textContent = "تعديل الدرس";
        document.getElementById("lessonTitle").value = lesson?.title || "";
        document.getElementById("lessonOrder").value = lesson?.order || "";
      } else {
        document.getElementById("lessonModalTitle").textContent = "درس جديد";
        const existingCount = (lessonsCache[classId] || []).length;
        document.getElementById("lessonOrder").value = existingCount + 1;
      }

      openModal("lessonModalOverlay");
    }

    document.getElementById("lessonForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      hideFormMsg("lessonFormMsg");

      const classId = document.getElementById("lessonClassId").value;
      const lessonId = document.getElementById("lessonId").value;
      const payload = {
        title: document.getElementById("lessonTitle").value.trim(),
        order: parseInt(document.getElementById("lessonOrder").value, 10),
      };

      try {
        if (lessonId) {
          await api(`/lessons/${lessonId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          toast("اتحدّث الدرس بنجاح", "success");
        } else {
          await api(`/classes/${classId}/lessons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          toast("اتضاف الدرس بنجاح", "success");
        }
        closeModal("lessonModalOverlay");
        await loadLessons(classId);
        // نحدّث عدد الدروس في كارت الكلاس كمان
        loadClasses();
      } catch (err) {
        showFormMsg("lessonFormMsg", err.message, "error");
      }
    });

    export async function deleteLesson(lessonId, classId, title) {
      if (!confirm(`متأكد إنك عايز تمسح "${title}"؟ هيتمسح كل الحصص اللي جواه.`)) return;
      try {
        await api(`/lessons/${lessonId}`, { method: "DELETE" });
        toast("اتمسح الدرس", "success");
        await loadLessons(classId);
        loadClasses();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /* =====================================================
       ============ نموذج الحصة (Session) ============
       ===================================================== */
    let removedVideoIds = []; // فيديوهات موجودة اتعلّمت للحذف وقت التعديل (بتتبعت مع الحفظ)

    document.getElementById("sessionType").addEventListener("change", updateSessionFieldsVisibility);
    function updateSessionFieldsVisibility() {
      const type = document.getElementById("sessionType").value;
      document.getElementById("liveFields").style.display = type === "live" ? "block" : "none";
      document.getElementById("recordedFields").style.display = type === "recorded" ? "block" : "none";
    }

    function renderExistingVideoRow(video) {
      const wrap = document.getElementById("existingVideosList");
      const rowId = `existing-video-${video._id}`;
      const div = document.createElement("div");
      div.className = "video-row existing-video-row";
      div.id = rowId;
      div.dataset.existingId = video._id;
      div.innerHTML = `
        <div class="video-row-top">
          <input type="text" placeholder="عنوان الفيديو" class="v-title" value="${esc(video.title)}" />
          <input type="number" placeholder="ترتيب" class="v-order" min="1" value="${esc(video.order)}" />
          <button type="button" class="remove-row-btn" onclick="removeExistingVideoRow('${rowId}', '${video._id}')">✕</button>
        </div>
      `;
      wrap.appendChild(div);
    }

    function removeExistingVideoRow(rowId, videoDbId) {
      if (!confirm("متأكد إنك عايز تمسح الفيديو ده من الحصة؟ هيتنفّذ فور ما تحفظ.")) return;
      removedVideoIds.push(videoDbId);
      const row = document.getElementById(rowId);
      if (row) row.remove();
    }

    async function loadExistingVideos(sessionId) {
      const listEl = document.getElementById("existingVideosList");
      listEl.innerHTML = `<div class="hint">بيتحمّل...</div>`;
      try {
        const data = await api(`/sessions/${sessionId}/videos`);
        listEl.innerHTML = "";
        (data.videos || []).forEach(renderExistingVideoRow);
      } catch (err) {
        listEl.innerHTML = `<div class="hint">تعذّر تحميل الفيديوهات الحالية: ${esc(err.message)}</div>`;
      }
    }

    function addVideoRow(video = { title: "", order: "" }) {
      const wrap = document.getElementById("videoRows");
      const rowId = `video-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const div = document.createElement("div");
      div.className = "video-row";
      div.id = rowId;
      div.dataset.videoId = "";
      div.innerHTML = `
        <div class="video-row-top">
          <input type="text" placeholder="عنوان الفيديو" class="v-title" value="${esc(video.title)}" />
          <input type="number" placeholder="ترتيب" class="v-order" min="1" value="${esc(video.order)}" />
          <button type="button" class="remove-row-btn" onclick="removeVideoRow('${rowId}')">✕</button>
        </div>
        <div class="video-upload">
          <input type="file" accept="video/*" class="video-file-input" hidden />
          <button type="button" class="video-pick-btn">📹 اختار فيديو</button>
          <span class="video-filename"></span>
          <div class="video-progress-wrap">
            <div class="video-progress-track"><div class="video-progress-fill"></div></div>
            <span class="video-progress-pct">0%</span>
          </div>
          <span class="video-status"></span>
        </div>
      `;
      wrap.appendChild(div);

      const fileInput = div.querySelector(".video-file-input");
      const pickBtn = div.querySelector(".video-pick-btn");
      pickBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) startVideoUpload(div, fileInput.files[0]);
      });
    }

    function removeVideoRow(rowId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      // لو فيه رفع شغال في الخلفية، نلغيه عشان منسيبش رفع مش هيتستخدم
      if (row.uploadInstance) {
        try { row.uploadInstance.abort(); } catch (err) {}
      }
      row.remove();
    }

    // عدّاد فترة "تجهيز" الفيديو بس (نداء init-upload اللي بيرجّع
    // الـ videoId من Bunny) — ثانية أو اتنين. مش محتاجين نستنى
    // الرفع الفعلي للبايتات يخلص عشان نقدر نحفظ الحصة؛ الرفع ده
    // بيكمل في الخلفية لوحده بعد ما الـ videoId يترجع.
    let pendingVideoInits = 0;
    function setPendingInit(delta) {
      pendingVideoInits = Math.max(0, pendingVideoInits + delta);
      const submitBtn = document.querySelector('#sessionForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = pendingVideoInits > 0;
        submitBtn.textContent = pendingVideoInits > 0 ? "بيجهّز الفيديو..." : "حفظ";
      }
    }

    async function startVideoUpload(row, file) {
      const pickBtn = row.querySelector(".video-pick-btn");
      const filenameEl = row.querySelector(".video-filename");
      const progressWrap = row.querySelector(".video-progress-wrap");
      const progressFill = row.querySelector(".video-progress-fill");
      const progressPct = row.querySelector(".video-progress-pct");
      const statusEl = row.querySelector(".video-status");

      row.dataset.videoId = "";
      filenameEl.textContent = file.name;
      statusEl.textContent = "بيجهّز الرفع...";
      statusEl.className = "video-status";
      progressWrap.style.display = "none";
      pickBtn.disabled = true;
      setPendingInit(1);

      const titleForBunny = row.querySelector(".v-title").value.trim() || file.name;

      let creds;
      try {
        creds = await api("/videos/init-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleForBunny }),
        });
      } catch (err) {
        statusEl.textContent = "فشل تجهيز الرفع: " + err.message;
        statusEl.className = "video-status error";
        pickBtn.disabled = false;
        setPendingInit(-1);
        return;
      }

      // اللحظة اللي محتاجينها فعلاً: بمجرد ما Bunny يرجّع الـ videoId،
      // نحفظه على طول جوه الصف — الحصة تقدر تتحفظ من دلوقتي، من غير
      // ما تستنى رفع البايتات نفسها يخلص.
      row.dataset.videoId = creds.videoId;
      setPendingInit(-1);

      statusEl.textContent = "🟡 بيرفع في الخلفية...";
      statusEl.className = "video-status uploading";
      progressWrap.style.display = "flex";
      pickBtn.textContent = "🔁 استبدال الفيديو";
      pickBtn.disabled = false;

      const upload = new tus.Upload(file, {
        endpoint: creds.tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: creds.signature,
          AuthorizationExpire: String(creds.expirationTime),
          VideoId: creds.videoId,
          LibraryId: String(creds.libraryId),
        },
        metadata: { filetype: file.type, title: titleForBunny },
        onError: (error) => {
          // الـ videoId فضل محفوظ عندنا في الصف عمداً — الحصة تقدر
          // تتحفظ بيه، بس الفيديو نفسه لسه ما وصلش Bunny. نوريه
          // بوضوح عشان يحاول يرفعه تاني قبل ما يعتمد على الحصة دي.
          statusEl.textContent = "فشل الرفع الفعلي: " + (error.message || error) + " — جرّب تستبدل الفيديو";
          statusEl.className = "video-status error";
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
          progressFill.style.width = pct + "%";
          progressPct.textContent = pct + "%";
        },
        onSuccess: () => {
          statusEl.textContent = "✅ اترفع بالكامل (لسه بيتجهّز على Bunny شوية دقايق)";
          statusEl.className = "video-status ready";
          progressWrap.style.display = "none";
        },
      });

      row.uploadInstance = upload;
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      });
    }

    function cancelSessionModal() {
      document.querySelectorAll("#videoRows .video-row").forEach((row) => {
        if (row.uploadInstance) {
          try { row.uploadInstance.abort(); } catch (err) {}
        }
      });
      pendingVideoInits = 0;
      removedVideoIds = [];
      closeModal("sessionModalOverlay");
    }

    function openSessionModal(lessonId, sessionId) {
      hideFormMsg("sessionFormMsg");
      document.getElementById("sessionForm").reset();
      document.getElementById("sessionLessonId").value = lessonId;
      document.getElementById("sessionId").value = sessionId || "";
      document.getElementById("videoRows").innerHTML = "";
      document.getElementById("existingVideosBlock").style.display = "none";
      document.getElementById("existingVideosList").innerHTML = "";
      pendingVideoInits = 0;
      setPendingInit(0);
      removedVideoIds = [];

      if (sessionId) {
        const s = (sessionsCache[lessonId] || []).find((x) => x._id === sessionId);
        document.getElementById("sessionModalTitle").textContent = "تعديل الحصة";
        document.getElementById("sessionTitle").value = s?.title || "";
        document.getElementById("sessionDescription").value = s?.description || "";
        document.getElementById("sessionType").value = s?.type || "recorded";
        document.getElementById("sessionOrder").value = s?.order || "";
        document.getElementById("sessionAccessType").value = s?.accessType || "paid";
        document.getElementById("sessionPrice").value = s?.price || "";
        document.getElementById("sessionAccessDurationDays").value = s?.accessDurationDays || "";

        // PDF الحصة
        document.getElementById("sessionPdfTitle").value = s?.pdf?.title || "";
        document.getElementById("sessionPdfUrl").value = s?.pdf?.url || "";

        // الواجب
        document.getElementById("sessionAssignmentTitle").value = s?.assignment?.title || "";
        document.getElementById("sessionAssignmentDescription").value = s?.assignment?.description || "";
        document.getElementById("sessionAssignmentPdfUrl").value = s?.assignment?.pdfUrl || "";

        // النشر — لو الحقل مش موجود في الداتا القديمة، نعتبرها منشورة افتراضياً
        document.getElementById("sessionPublished").checked = s?.isPublished !== false;

        if (s?.type === "recorded") {
          document.getElementById("existingVideosBlock").style.display = "block";
          loadExistingVideos(sessionId);
        }

        document.getElementById("videosLabel").textContent = "إضافة فيديوهات جديدة (اختياري)";
      } else {
        document.getElementById("sessionModalTitle").textContent = "حصة جديدة";
        document.getElementById("sessionOrder").value = (sessionsCache[lessonId] || []).length + 1;
        document.getElementById("videosLabel").textContent = "الفيديوهات (لازم واحد على الأقل)";

        // ديفولت حصة جديدة: مفيش PDF/واجب، ومنشورة
        document.getElementById("sessionPdfTitle").value = "";
        document.getElementById("sessionPdfUrl").value = "";
        document.getElementById("sessionAssignmentTitle").value = "";
        document.getElementById("sessionAssignmentDescription").value = "";
        document.getElementById("sessionAssignmentPdfUrl").value = "";
        document.getElementById("sessionPublished").checked = true;

        addVideoRow();
      }

      updateSessionFieldsVisibility();
      openModal("sessionModalOverlay");
    }

    document.getElementById("sessionForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      hideFormMsg("sessionFormMsg");

      const lessonId = document.getElementById("sessionLessonId").value;
      const sessionId = document.getElementById("sessionId").value;
      const type = document.getElementById("sessionType").value;

      if (pendingVideoInits > 0) {
        return showFormMsg("sessionFormMsg", "استنى لحظة، الفيديو لسه بيتجهّز", "error");
      }

      const rowEls = Array.from(document.querySelectorAll("#videoRows .video-row"));
      const incompleteRow = rowEls.find((row) => {
        const title = row.querySelector(".v-title").value.trim();
        return title && !row.dataset.videoId;
      });
      if (incompleteRow) {
        return showFormMsg("sessionFormMsg", "فيه صف فيديو لسه ما اترفعش بنجاح — ارفعه أو امسحه قبل الحفظ", "error");
      }

      const videoRows = rowEls.map((row) => ({
        title: row.querySelector(".v-title").value.trim(),
        videoId: row.dataset.videoId || "",
        order: parseInt(row.querySelector(".v-order").value, 10) || 1,
      })).filter((v) => v.title && v.videoId);

      const basePayload = {
        title: document.getElementById("sessionTitle").value.trim(),
        description: document.getElementById("sessionDescription").value.trim(),
        type,
        accessType: document.getElementById("sessionAccessType").value,
        price: parseFloat(document.getElementById("sessionPrice").value) || 0,
        accessDurationDays: document.getElementById("sessionAccessDurationDays").value
          ? parseInt(document.getElementById("sessionAccessDurationDays").value, 10)
          : null,
        order: parseInt(document.getElementById("sessionOrder").value, 10),
        isPublished: document.getElementById("sessionPublished").checked,
      };

      // PDF — نبعته بس لو فيه رابط، وإلا نبعت null عشان لو المدرّس
      // مسح الرابط يتشال pdf من الحصة فعلياً (مش بس يتجاهل)
      const pdfTitle = document.getElementById("sessionPdfTitle").value.trim();
      const pdfUrl = document.getElementById("sessionPdfUrl").value.trim();
      basePayload.pdf = pdfUrl ? { title: pdfTitle, url: pdfUrl } : null;

      // Assignment — نفس المنطق، بس نعتبره موجود لو فيه عنوان أو وصف أو رابط
      const asgTitle = document.getElementById("sessionAssignmentTitle").value.trim();
      const asgDescription = document.getElementById("sessionAssignmentDescription").value.trim();
      const asgPdfUrl = document.getElementById("sessionAssignmentPdfUrl").value.trim();
      basePayload.assignment = (asgTitle || asgDescription || asgPdfUrl)
        ? { title: asgTitle, description: asgDescription, pdfUrl: asgPdfUrl }
        : null;

      if (type === "live") {
        basePayload.scheduledAt = document.getElementById("sessionScheduledAt").value;
        basePayload.meetingUrl = document.getElementById("sessionMeetingUrl").value.trim();
      }

      try {
        if (sessionId) {
          // بنجمع: الفيديوهات الموجودة اللي اتعدّل عنوانها/ترتيبها (معاها _id)
          // + أي فيديوهات جديدة اترفعت (من غير _id) — نداء PUT واحد
          // بيتكفّل بالإضافة والتعديل، وremoveVideoIds بيتكفّل بالحذف
          const existingRows = Array.from(document.querySelectorAll("#existingVideosList .existing-video-row"));
          const editedExisting = existingRows.map((row) => ({
            _id: row.dataset.existingId,
            title: row.querySelector(".v-title").value.trim(),
            order: parseInt(row.querySelector(".v-order").value, 10) || 1,
          }));

          const combinedVideos = [...editedExisting, ...videoRows];
          if (combinedVideos.length) basePayload.videos = combinedVideos;
          if (removedVideoIds.length) basePayload.removeVideoIds = removedVideoIds;

          await api(`/sessions/${sessionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(basePayload),
          });

          toast("اتحدّثت الحصة بنجاح", "success");
        } else {
          if (type === "recorded" && !videoRows.length) {
            return showFormMsg("sessionFormMsg", "الحصة المسجّلة لازم فيديو واحد على الأقل", "error");
          }
          basePayload.videos = videoRows;

          await api(`/lessons/${lessonId}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(basePayload),
          });
          toast("اتضافت الحصة بنجاح", "success");
        }

        closeModal("sessionModalOverlay");
        await loadSessions(lessonId);
        loadClasses();
      } catch (err) {
        showFormMsg("sessionFormMsg", err.message, "error");
      }
    });

    async function deleteSession(sessionId, lessonId, title) {
      if (!confirm(`متأكد إنك عايز تمسح "${title}"؟`)) return;
      try {
        await api(`/sessions/${sessionId}`, { method: "DELETE" });
        toast("اتمسحت الحصة", "success");
        await loadSessions(lessonId);
        loadClasses();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    export function getclassesCache() {
      return classesCache;
    }



window.openClassModal = openClassModal;
window.toggleClass = toggleClass;
window.deleteClass = deleteClass;
window.openLessonModal = openLessonModal;
window.deleteLesson = deleteLesson;
window.toggleLesson = toggleLesson;
window.openSessionModal = openSessionModal;
window.deleteSession = deleteSession;
window.addVideoRow = addVideoRow;
window.removeVideoRow = removeVideoRow;
window.removeExistingVideoRow = removeExistingVideoRow;
window.cancelSessionModal = cancelSessionModal;
window.closeModal = closeModal;