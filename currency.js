(function (root) {
"use strict";
const S = typeof require !== "undefined" ? require("../shared.js") : root.ToolsShared;
const { fmt2 } = S;

async function getRates(from) {
  const key = "fx:" + from, today = new Date().toISOString().slice(0, 10);
  try {
    if (typeof localStorage !== "undefined") {
      const c = JSON.parse(localStorage.getItem(key) || "null");
      if (c && c.date === today) return c;
    }
  } catch {}
  const res = await fetch("https://api.frankfurter.app/latest?from=" + encodeURIComponent(from));
  if (res.status === 404) { const e = new Error("unknown currency"); e.notFound = true; throw e; }
  if (!res.ok) throw new Error("http " + res.status);
  const j = await res.json();
  if (!j || !j.rates) throw new Error("bad response");
  const data = { date: j.date, rates: j.rates };
  try { if (typeof localStorage !== "undefined") localStorage.setItem(key, JSON.stringify(data)); } catch {}
  return data;
}

const tools = {
  currency: {
    name: "Währungen", ph: "100 USD", hint: "Betrag und Währungscode, z. B. 100 USD — Tageskurse der EZB, nicht in Echtzeit", category: "currency",
    keywords: ["währung", "wechselkurs", "euro", "dollar", "currency", "exchange rate"],
    async run(s) {
      const m = s.trim().match(/^([\d.,]+)\s*([A-Za-z]{3})$/);
      if (!m) return { error: "Format: Betrag und Währungscode, z. B. 100 USD" };
      const amount = parseFloat(m[1].replace(",", "."));
      if (isNaN(amount) || amount < 0) return { error: "Ungültiger Betrag." };
      const from = m[2].toUpperCase();
      let data;
      try { data = await getRates(from); }
      catch (e) {
        if (e && e.notFound) return { error: `Währung "${from}" wird nicht unterstützt.` };
        return { error: "Kurse aktuell nicht verfügbar (keine Internetverbindung oder Dienst nicht erreichbar)." };
      }
      const majors = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY"];
      const targets = majors.filter(c => c !== from && data.rates[c] !== undefined);
      if (!targets.length) return { error: `Für "${from}" liegen keine Vergleichswerte vor.` };
      const rows = targets.map(t => ({ label: t, value: fmt2(amount * data.rates[t]) + " " + t, copy: fmt2(amount * data.rates[t]) }));
      rows.push({ label: "Datenstand", value: data.date + " (EZB-Referenzkurs)" });
      return { rows };
    },
  },
};

const api = { tools, getRates };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else Object.assign(root.ToolsRegistry = root.ToolsRegistry || {}, tools);
})(typeof self !== "undefined" ? self : this);
