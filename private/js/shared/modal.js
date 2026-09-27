    export function openModal(id) { document.getElementById(id).classList.add("show"); }
    export function closeModal(id) { document.getElementById(id).classList.remove("show"); }

    export function showFormMsg(elId, msg, type) {
      const el = document.getElementById(elId);
      el.textContent = msg;
      el.className = `form-msg show ${type}`;
    }
    export function hideFormMsg(elId) {
      document.getElementById(elId).className = "form-msg";
    }
    
