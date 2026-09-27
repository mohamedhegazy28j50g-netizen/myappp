 import { api } from "../shared/api.js";  
 import { toast, esc } from "../shared/dom.js";
 
 
 /* =====================================================
       ============ قسم المستخدمين (Users) ============
       ===================================================== */
    let usersCache = [];
    let usersSectionLoaded = false;

    document.querySelector('.side-link[data-view="users"]').addEventListener("click", () => {
      if (!usersSectionLoaded) loadUsers();
    });

    // بنحمّل كل المستخدمين مرة واحدة بس، والفلترة بعد كده بتتم محليًا
    // من غير ما نرجع للسيرفر تاني (زي قسم الطلبات بالظبط).
    async function loadUsers() {
      const tbody = document.getElementById("usersTableBody");
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-dim);white-space:normal;">بيتم التحميل...</td></tr>`;

      try {
        const data = await api("/users");
        usersCache = data.users || [];
        usersSectionLoaded = true;

        document.getElementById("usersTotalCount").textContent = data.total ?? usersCache.length;

        renderUsers();
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--live);white-space:normal;">معرفناش نجيب المستخدمين: ${esc(err.message)}</td></tr>`;
      }
    }

    function renderUsers() {
      const tbody = document.getElementById("usersTableBody");
      const searchValue = document.getElementById("usersEmailSearch").value.trim().toLowerCase();

      const filtered = searchValue
        ? usersCache.filter((u) => (u.email || "").toLowerCase().includes(searchValue))
        : usersCache;

      if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-dim);white-space:normal;">مفيش مستخدمين بالمواصفات دي.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(userRowTemplate).join("");
    }

    function userRowTemplate(u) {
      const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString("ar-EG") : "—";
      const name = u.name || "—";
      const email = u.email || "—";

      return `
        <tr>
          <td title="${esc(name)}"><strong>${esc(name)}</strong></td>
          <td title="${esc(email)}">${esc(email)}</td>
          <td style="color:var(--text-dim);font-size:12.5px;">${date}</td>
          <td class="actions-cell">
            <button class="btn-outline btn-sm" disabled title="هتتضاف قريباً">تفاصيل</button>
          </td>
        </tr>
      `;
    }

    document.getElementById("usersEmailSearch").addEventListener("input", () => {
      renderUsers();
    });