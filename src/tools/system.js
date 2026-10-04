(function (root) {
"use strict";

const tools = {
  time: {
    name: "Zeitstempel", ph: "1790000000", hint: "Unix-Sekunden, Millisekunden, ISO-Datum oder „jetzt“", category: "system",
    keywords: ["unix", "timestamp", "zeitstempel", "epoch"],
    run(s) {
      let ms;
      if (/^(jetzt|now)$/i.test(s)) ms = Date.now();
      else if (/^-?\d+$/.test(s)) ms = s.replace("-", "").length >= 13 ? Number(s) : Number(s) * 1000;
      else ms = Date.parse(s);
      const d = new Date(ms);
      if (isNaN(d)) return { error: "Kein gültiger Zeitstempel oder Datum." };
      return { rows: [
        { label: "Sekunden", value: String(Math.floor(ms / 1000)) },
        { label: "Millisekunden", value: String(ms) },
        { label: "UTC (ISO)", value: d.toISOString() },
        { label: "Lokale Zeit", value: d.toLocaleString("de-DE", { dateStyle: "full", timeStyle: "medium" }) },
      ]};
    },
  },
  tz: {
    name: "Zeitzonen", ph: "14:30", hint: "Uhrzeit (heute) oder Datum wie 2026-09-29 14:30, ausgehend von deiner lokalen Zeit", category: "system",
    keywords: ["zeitzone", "timezone", "utc", "weltzeit"],
    run(s) {
      let d;
      const hm = s.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (hm) { d = new Date(); d.setHours(+hm[1], +hm[2], 0, 0); }
      else d = new Date(s);
      if (isNaN(d)) return { error: "Kein gültiges Datum oder Uhrzeit." };
      const zones = [
        ["Berlin", "Europe/Berlin"], ["UTC", "UTC"], ["London", "Europe/London"],
        ["New York", "America/New_York"], ["Los Angeles", "America/Los_Angeles"],
        ["Tokio", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"],
      ];
      return { rows: zones.map(([label, tz]) => ({
        label, value: d.toLocaleString("de-DE", { timeZone: tz, dateStyle: "medium", timeStyle: "short" }),
      }))};
    },
  },
  chmod: {
    name: "chmod", ph: "755", hint: "Oktal (z. B. 755) oder symbolisch (z. B. rwxr-xr-x)", category: "system",
    keywords: ["chmod", "rwx", "octal", "rechte", "permissions", "linux", "unix"],
    run(s) {
      const s2 = s.trim();
      let digits;
      if (/^[0-7]{3}$/.test(s2)) {
        digits = [...s2].map(Number);
      } else if (/^[rwx-]{9}$/i.test(s2)) {
        const c = s2.toLowerCase();
        digits = [0, 1, 2].map(g => {
          const r = c[g * 3] !== "-", w = c[g * 3 + 1] !== "-", x = c[g * 3 + 2] !== "-";
          return (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0);
        });
      } else return { error: "Format: dreistellig oktal (z. B. 755) oder symbolisch (z. B. rwxr-xr-x). Spezialbits (setuid/setgid/sticky) werden noch nicht unterstützt." };
      const sym = digits.map(d => (d & 4 ? "r" : "-") + (d & 2 ? "w" : "-") + (d & 1 ? "x" : "-")).join("");
      const names = ["Eigentümer", "Gruppe", "Andere"];
      const explain = d => { const parts = []; if (d & 4) parts.push("lesen"); if (d & 2) parts.push("schreiben"); if (d & 1) parts.push("ausführen"); return parts.length ? parts.join(", ") : "keine Rechte"; };
      return { rows: [
        { label: "Oktal", value: digits.join("") },
        { label: "Symbolisch", value: sym },
        ...digits.map((d, i) => ({ label: names[i], value: explain(d) })),
      ]};
    },
  },
};

const api = { tools };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else Object.assign(root.ToolsRegistry = root.ToolsRegistry || {}, tools);
})(typeof self !== "undefined" ? self : this);
