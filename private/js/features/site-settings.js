import { api } from "../shared/api.js";
import { toast, esc } from "../shared/dom.js";
import { openModal, closeModal, showFormMsg, hideFormMsg } from "../shared/modal.js";

/* =====================================================
       ============ قسم "الموقع" (من أنا / تواصل) ============
       ===================================================== */
    let siteSettingsLoaded = false;
    let currentSettings = null;

    document.querySelector('.side-link[data-view="site"]').addEventListener("click", () => {
      if (!siteSettingsLoaded) loadSiteSettings();
    });

    async function loadSiteSettings() {
      try {
        const data = await api("/settings");
        currentSettings = data.settings || { about: {}, contact: {} };
        fillSettingsForm(currentSettings);
        siteSettingsLoaded = true;
      } catch (err) {
        showFormMsg("siteSettingsMsg", "تعذّر تحميل الإعدادات: " + err.message, "error");
      }
    }

    function fillSettingsForm(settings) {
      const about = settings.about || {};
      const contact = settings.contact || {};

      document.getElementById("aboutPhotoUrl").value = about.photoUrl || "";
      document.getElementById("aboutBioInput").value = about.bio || "";
      updatePhotoPreview(about.photoUrl || "");

      document.getElementById("aboutStatsRows").innerHTML = "";
      (about.stats || []).forEach(addStatRow);

      document.getElementById("contactWhatsapp").value = contact.whatsapp || "";
      document.getElementById("contactPhone").value = contact.phone || "";
      document.getElementById("contactEmail").value = contact.email || "";
      document.getElementById("contactFacebook").value = contact.facebook || "";
      document.getElementById("contactInstagram").value = contact.instagram || "";
      document.getElementById("contactYoutube").value = contact.youtube || "";
      document.getElementById("contactTiktok").value = contact.tiktok || "";
    }

    function updatePhotoPreview(url) {
      const el = document.getElementById("aboutPhotoPreview");
      el.innerHTML = url ? `<img src="${esc(url)}" />` : "أ";
    }

    document.getElementById("aboutPhotoUrl").addEventListener("input", (e) => {
      updatePhotoPreview(e.target.value.trim());
    });

    function addStatRow(stat = { label: "", value: "" }) {
      const wrap = document.getElementById("aboutStatsRows");
      const rowId = `stat-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const div = document.createElement("div");
      div.className = "stat-row";
      div.id = rowId;
      div.innerHTML = `
        <input type="text" placeholder="القيمة (مثال: +1200)" class="s-value" value="${esc(stat.value)}" />
        <input type="text" placeholder="الوصف (مثال: طالب مشترك)" class="s-label" value="${esc(stat.label)}" />
        <button type="button" class="remove-row-btn" onclick="document.getElementById('${rowId}').remove()">✕</button>
      `;
      wrap.appendChild(div);
    }

    async function saveSiteSettings() {
      hideFormMsg("siteSettingsMsg");

      const stats = Array.from(document.querySelectorAll("#aboutStatsRows .stat-row"))
        .map((row) => ({
          label: row.querySelector(".s-label").value.trim(),
          value: row.querySelector(".s-value").value.trim(),
        }))
        .filter((s) => s.label && s.value);

      const payload = {
        about: {
          photoUrl: document.getElementById("aboutPhotoUrl").value.trim(),
          bio: document.getElementById("aboutBioInput").value.trim(),
          stats,
        },
        contact: {
          whatsapp: document.getElementById("contactWhatsapp").value.trim(),
          phone: document.getElementById("contactPhone").value.trim(),
          email: document.getElementById("contactEmail").value.trim(),
          facebook: document.getElementById("contactFacebook").value.trim(),
          instagram: document.getElementById("contactInstagram").value.trim(),
          youtube: document.getElementById("contactYoutube").value.trim(),
          tiktok: document.getElementById("contactTiktok").value.trim(),
        },
      };

      const btn = document.getElementById("saveSettingsBtn");
      btn.disabled = true;
      btn.textContent = "بيحفظ...";

      try {
        const data = await api("/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        currentSettings = data.settings;
        showFormMsg("siteSettingsMsg", "اتحفظت التغييرات بنجاح", "success");
      } catch (err) {
        showFormMsg("siteSettingsMsg", err.message, "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "حفظ التغييرات";
      }
    }

    window.saveSiteSettings = saveSiteSettings;
    