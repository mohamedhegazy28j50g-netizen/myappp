    export function toast(msg, type = "") {
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.className = `toast show ${type}`;
      setTimeout(() => el.classList.remove("show"), 3000);
    }

    export function esc(str) {
      const div = document.createElement("div");
      div.textContent = str ?? "";
      return div.innerHTML;
    }
  