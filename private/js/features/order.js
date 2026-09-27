import { api } from "../shared/api.js";
import { toast, esc } from "../shared/dom.js";

/* =====================================================
       ============ قسم الطلبات (Orders) ============
       ===================================================== */
    let ordersCache = [];
    let currentOrderFilter = "all";
    let ordersLoaded = false;

     document.querySelector('.side-link[data-view="orders"]').addEventListener("click", () => {
      if (!ordersLoaded) loadOrders();
     });

    export async function loadOrders() {
      const tbody = document.getElementById("ordersTableBody");
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-dim);">بيتم التحميل...</td></tr>`;

      try {
        // GET /teacher/orders بيرجّع كل الطلبات بكل حالاتها، وبنفلتر في الفرونت اند
        const data = await api("/teacher/orders");
        ordersCache = data.orders || [];
        ordersLoaded = true;
        renderOrders();
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--live);">معرفناش نجيب الطلبات: ${esc(err.message)}</td></tr>`;
      }
    }

    export function renderOrders() {
      const tbody = document.getElementById("ordersTableBody");
      const filtered = currentOrderFilter === "all"
        ? ordersCache
        : ordersCache.filter((o) => o.status === currentOrderFilter);

      if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-dim);">مفيش طلبات في القسم ده.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(orderRowTemplate).join("");
    }

    const statusLabels = { pending: "معلّق", paid: "مؤكد", rejected: "مرفوض", failed: "فشل" };

    export function orderRowTemplate(o) {
      const accountName = o.userId?.name || "—";
      const accountEmail = o.userId?.email || "";
      const transferName = o.studentName || accountName;
      const transferPhone = o.studentPhone || "";
      const sessionTitle = o.sessionId?.title || "—";
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString("ar-EG") : "—";

      const actions = o.status === "pending"
        ? `
          <div class="row-actions">
            <button class="btn-outline btn-sm" onclick="confirmOrder('${o._id}')">تأكيد</button>
            <button class="btn-danger btn-sm" onclick="rejectOrder('${o._id}')">رفض</button>
          </div>
        `
        : "";

      return `
        <tr>
          <td class="student-cell">
            <strong>${esc(transferName)}</strong>
            <span dir="ltr" style="display:block;">${esc(transferPhone)}</span>
            <span>${esc(accountEmail)}</span>
          </td>
          <td>${esc(sessionTitle)}</td>
          <td>${o.amount} ج.م</td>
          <td><span class="order-status-pill ${o.status}">${statusLabels[o.status] || o.status}</span></td>
          <td style="color:var(--text-dim);font-size:12.5px;">${date}</td>
          <td class="actions-cell">${actions}</td>
        </tr>
      `;
    }

    document.getElementById("ordersFilter").addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      document.querySelectorAll("#ordersFilter .chip").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      currentOrderFilter = btn.dataset.status;
      renderOrders();
    });

     async function confirmOrder(orderId) {
      if (!confirm("تأكيد إن الطلب ده اتدفع فعلاً؟")) return;
      try {
        await api(`/teacher/orders/${orderId}/confirm`, { method: "PATCH" });
        toast("اتأكد الطلب", "success");
        loadOrders();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    async function rejectOrder(orderId) {
      if (!confirm("متأكد إنك عايز ترفض الطلب ده؟")) return;
      try {
        await api(`/teacher/orders/${orderId}/reject`, { method: "PATCH" });
        toast("اترفض الطلب", "success");
        loadOrders();
      } catch (err) {
        toast(err.message, "error");
      }
    }
    window.confirmOrder = confirmOrder;
    window.rejectOrder = rejectOrder;
    window.loadOrders = loadOrders;
    window.renderOrders = renderOrders;
    window.orderRowTemplate = orderRowTemplate;
    window.ordersCache = ordersCache;
    window.currentOrderFilter = currentOrderFilter;
    window.ordersLoaded = ordersLoaded;
  

   
   
