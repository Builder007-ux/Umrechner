// Gemeinsame Hilfsfunktionen für alle Tool-Module. Kein DOM-Zugriff hier.
(function (root) {
"use strict";
const g4 = s => s.padStart(Math.ceil(s.length / 4) * 4, "0").replace(/(.{4})(?=.)/g, "$1 ");
const toIp = n => [24, 16, 8, 0].map(x => (n >>> x) & 255).join(".");
const ipOk = o => o.length === 4 && o.every(x => x <= 255);
const num = o => ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
const maskOf = p => p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
const fmt = n => !isFinite(n) ? String(n) : (Math.round(n * 1e6) / 1e6).toLocaleString("de-DE", { maximumFractionDigits: 6 });
const fmt2 = n => !isFinite(n) ? String(n) : (Math.round(n * 100) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Baut einen linearen Umrechner (Einheit * Faktor = Basiseinheit). Für alles ohne Nullpunkt-Verschiebung
// (Länge, Fläche, Volumen, Gewicht, Geschwindigkeit, Dauer, Druck, Energie, Leistung, Frequenz, Winkel, Daten).
function makeLinearTool(opts) {
  return {
    name: opts.name, ph: opts.ph, hint: opts.hint, category: opts.category || "mass", keywords: opts.keywords || [],
    run(s) {
      const m = s.trim().replace(",", ".").match(/^(-?[\d.]+)\s*([a-zA-Z0-9äöüÄÖÜß²³/]+)$/);
      if (!m) return { error: opts.hint };
      const val = parseFloat(m[1]);
      if (isNaN(val)) return { error: "Ungültige Zahl." };
      const raw = m[2].toLowerCase();
      const unit = (opts.aliases && opts.aliases[raw]) || raw;
      if (!(unit in opts.units)) return { error: `Unbekannte Einheit "${m[2]}". Erlaubt: ${opts.display.join(", ")}` };
      const base = val * opts.units[unit];
      return { rows: opts.display.map(u => ({ label: opts.labels[u] || u, value: fmt(base / opts.units[u]) + " " + u, copy: fmt(base / opts.units[u]) })) };
    },
  };
}

const api = { g4, toIp, ipOk, num, maskOf, fmt, fmt2, makeLinearTool };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.ToolsShared = api;
})(typeof self !== "undefined" ? self : this);
