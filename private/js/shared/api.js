 export async function api(path, options = {}) {
      const res = await fetch(path, { credentials: "include", ...options });
      let data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      return data;
    }