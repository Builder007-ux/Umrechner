// Reine Rechenlogik ohne DOM: läuft im Browser (global "Core") und in Node (require).
(function (root) {
"use strict";
const g4 = s => s.padStart(Math.ceil(s.length / 4) * 4, "0").replace(/(.{4})(?=.)/g, "$1 ");
const toIp = n => [24, 16, 8, 0].map(x => (n >>> x) & 255).join(".");
const ipOk = o => o.length === 4 && o.every(x => x <= 255);
const num = o => ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
const maskOf = p => p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
const fmt = n => !isFinite(n) ? String(n) : (Math.round(n * 1e6) / 1e6).toLocaleString("de-DE", { maximumFractionDigits: 6 });
const fmt2 = n => !isFinite(n) ? String(n) : (Math.round(n * 100) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function makeLinearTool(opts) {
  return {
    name: opts.name, ph: opts.ph, hint: opts.hint, category: "mass",
    run(s) {
      const m = s.trim().replace(",", ".").match(/^(-?[\d.]+)\s*([a-zA-ZäöüÄÖÜß²³]+)$/);
      if (!m) return { error: opts.hint };
      const val = parseFloat(m[1]);
      if (isNaN(val)) return { error: "Ungültige Zahl." };
      const raw = m[2].toLowerCase();
      const unit = opts.aliases[raw] || raw;
      if (!(unit in opts.units)) return { error: `Unbekannte Einheit "${m[2]}". Erlaubt: ${opts.display.join(", ")}` };
      const base = val * opts.units[unit];
      return { rows: opts.display.map(u => ({ label: opts.labels[u] || u, value: fmt(base / opts.units[u]) + " " + u, copy: fmt(base / opts.units[u]) })) };
    },
  };
}

// Neuen Rechner: Eintrag ergänzen. run(text) liefert {rows, swatch?} oder {error}, category ist "it", "mass" oder "currency".
// Zeile: {label, value | parts[], copy?, send?:{tool,text}}
const tools = {
  color: {
    name: "Farbe", ph: "BC002D", hint: "Hex (BC002D, #BC0) oder RGB (188, 0, 45)", category: "it",
    run(s) {
      let rgb, m;
      if (m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)) {
        let h = m[1]; if (h.length === 3) h = [...h].map(c => c + c).join("");
        rgb = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
      } else if (m = s.match(/^(?:rgb\()?\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)?$/i)) {
        rgb = m.slice(1).map(Number);
        if (rgb.some(x => x > 255)) return { error: "RGB-Werte gehen von 0 bis 255." };
      } else return { error: "Format: BC002D, #BC002D oder 188, 0, 45" };
      const [r, g, b] = rgb, hx = rgb.map(x => x.toString(16).padStart(2, "0").toUpperCase());
      const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
      let h = 0, sat = 0;
      if (d) {
        sat = d / (1 - Math.abs(2 * l - 1));
        h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
        h = Math.round((h * 60 + 360) % 360);
      }
      return { swatch: "#" + hx.join(""), rows: [
        { label: "Hexadezimal", parts: hx, copy: "#" + hx.join(""), send: { tool: "base", text: "0x" + hx.join("") } },
        { label: "Binär", parts: rgb.map(x => x.toString(2).padStart(8, "0")) },
        { label: "Dezimal", parts: rgb.map(x => String(x).padStart(3, "0")), copy: rgb.join(", ") },
        { label: "CSS RGB", value: `rgb(${r}, ${g}, ${b})` },
        { label: "CSS HSL", value: `hsl(${h}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)` },
      ]};
    },
  },
  base: {
    name: "Zahlensysteme", ph: "255", hint: "Dezimal oder mit Präfix: 0b1010, 0xFF, 0o17", category: "it",
    run(s) {
      s = s.replace(/[_\s]/g, ""); let n;
      try {
        if (/^\d+$/.test(s)) n = BigInt(s);
        else if (/^0[bxo][0-9a-f]+$/i.test(s)) n = BigInt(s.toLowerCase());
        else return { error: "Ungültige Zahl. Erlaubt: Dezimal, 0b…, 0x…, 0o…" };
      } catch { return { error: "Ungültige Zahl." }; }
      return { rows: [
        { label: "Dezimal", value: n.toString(10) },
        { label: "Binär", value: g4(n.toString(2)), copy: n.toString(2) },
        { label: "Hexadezimal", value: n.toString(16).toUpperCase() },
        { label: "Oktal", value: n.toString(8) },
      ]};
    },
  },
  ip: {
    name: "IPv4 / CIDR", ph: "192.168.1.10/24", hint: "IPv4-Adresse, optional mit /Präfix", category: "it",
    run(s) {
      const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/);
      if (!m) return { error: "Format: 192.168.1.10 oder 192.168.1.10/24" };
      const o = m.slice(1, 5).map(Number), p = m[5] === undefined ? null : Number(m[5]);
      if (!ipOk(o) || (p !== null && p > 32)) return { error: "Wert außerhalb des gültigen Bereichs." };
      const n = num(o), oBin = o.map(x => x.toString(2).padStart(8, "0"));
      const rows = [
        { label: "Dezimal", value: String(n), send: { tool: "base", text: String(n) } },
        { label: "Binär", parts: oBin, copy: oBin.join(".") },
        { label: "Hexadezimal", value: n.toString(16).toUpperCase().padStart(8, "0") },
      ];
      if (p !== null) {
        const mask = maskOf(p), net = (n & mask) >>> 0, bc = (net | ~mask) >>> 0;
        rows.push(
          { label: "Netzmaske", value: toIp(mask) },
          { label: "Netzadresse", value: toIp(net) },
          { label: "Broadcast", value: toIp(bc) },
          { label: "Hosts", value: String(p >= 31 ? (p === 32 ? 1 : 2) : 2 ** (32 - p) - 2) },
        );
      }
      return { rows };
    },
  },
  subnet: {
    name: "Subnetze", ph: "192.168.0.0/24 in /26", hint: "Netz/Präfix in neues Präfix aufteilen, max. 64 Subnetze", category: "it",
    run(s) {
      const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})\s+(?:in\s+)?\/?(\d{1,2})$/i);
      if (!m) return { error: "Format: 192.168.0.0/24 in /26" };
      const o = m.slice(1, 5).map(Number), p1 = +m[5], p2 = +m[6];
      if (!ipOk(o) || p1 > 32 || p2 > 32 || p1 > p2) return { error: "Das neue Präfix muss größer oder gleich dem alten sein (max. 32)." };
      const cnt = 2 ** (p2 - p1);
      if (cnt > 64) return { error: `Das ergäbe ${cnt} Subnetze, erlaubt sind 64. Wähle ein kleineres neues Präfix.` };
      const base = (num(o) & maskOf(p1)) >>> 0, size = 2 ** (32 - p2), rows = [];
      for (let i = 0; i < cnt; i++) {
        const a = base + i * size, cidr = `${toIp(a)}/${p2}`;
        rows.push({ label: `Subnetz ${i + 1}`, value: cidr + (p2 >= 31 ? "" : `  (Hosts ${toIp(a + 1)} bis ${toIp(a + size - 2)})`), copy: cidr });
      }
      return { rows };
    },
  },
  mac: {
    name: "MAC", ph: "AA:BB:CC:DD:EE:FF", hint: "Mit Doppelpunkt, Bindestrich, Punkt oder ohne Trennzeichen", category: "it",
    run(s) {
      if (!/^[0-9a-f:.\-\s]+$/i.test(s)) return { error: "Ungültige MAC-Adresse." };
      const h = s.replace(/[^0-9a-f]/gi, "").toLowerCase();
      if (h.length !== 12) return { error: "Eine MAC-Adresse hat 12 Hex-Zeichen." };
      const by = h.match(/../g), f = parseInt(by[0], 16);
      return { rows: [
        { label: "Doppelpunkt", value: by.join(":").toUpperCase() },
        { label: "Bindestrich", value: by.join("-").toUpperCase() },
        { label: "Cisco", value: h.match(/.{4}/g).join(".") },
        { label: "Ohne Trenner", value: h.toUpperCase() },
        { label: "Kleinbuchstaben", value: by.join(":") },
        { label: "OUI-Präfix", value: by.slice(0, 3).join(":").toUpperCase() },
        { label: "Art", value: `${f & 1 ? "Multicast" : "Unicast"}, ${f & 2 ? "lokal verwaltet" : "global eindeutig"}` },
      ]};
    },
  },
  time: {
    name: "Zeitstempel", ph: "1790000000", hint: "Unix-Sekunden, Millisekunden, ISO-Datum oder „jetzt“", category: "it",
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
    name: "Zeitzonen", ph: "14:30", hint: "Uhrzeit (heute) oder Datum wie 2026-09-29 14:30, ausgehend von deiner lokalen Zeit", category: "it",
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
  base64: {
    name: "Base64", ph: "Hallo Welt", hint: "Text wird kodiert, gültiges Base64 zusätzlich dekodiert", category: "it",
    run(s) {
      let enc;
      try { enc = btoa(unescape(encodeURIComponent(s))); }
      catch { return { error: "Text konnte nicht kodiert werden." }; }
      const rows = [{ label: "Kodiert", value: enc }];
      if (/^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0) {
        try { rows.push({ label: "Dekodiert", value: decodeURIComponent(escape(atob(s))) }); } catch {}
      }
      return { rows };
    },
  },
  json: {
    name: "JSON", ph: '{"a":1,"b":[2,3]}', hint: "JSON validieren und formatieren", category: "it",
    run(s) {
      let v;
      try { v = JSON.parse(s); } catch (e) { return { error: "Ungültiges JSON: " + e.message }; }
      return { rows: [
        { label: "Formatiert", value: JSON.stringify(v, null, 2) },
        { label: "Kompakt", value: JSON.stringify(v) },
      ]};
    },
  },

  length: makeLinearTool({
    name: "Länge", ph: "5 km", hint: "Zahl mit Einheit: mm, cm, m, km, in, ft, yd, mi",
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    aliases: { zoll: "in", "\"": "in", fuß: "ft", fuss: "ft", yard: "yd", meile: "mi", meilen: "mi" },
    display: ["mm", "cm", "m", "km", "in", "ft", "yd", "mi"],
    labels: { mm: "Millimeter", cm: "Zentimeter", m: "Meter", km: "Kilometer", in: "Zoll (in)", ft: "Fuß (ft)", yd: "Yard", mi: "Meile" },
  }),
  weight: makeLinearTool({
    name: "Gewicht", ph: "5 kg", hint: "Zahl mit Einheit: mg, g, kg, t, lb, oz",
    units: { mg: 0.001, g: 1, kg: 1000, t: 1000000, lb: 453.59237, oz: 28.349523125 },
    aliases: { pfund: "lb", unze: "oz", tonne: "t", tonnen: "t" },
    display: ["mg", "g", "kg", "t", "lb", "oz"],
    labels: { mg: "Milligramm", g: "Gramm", kg: "Kilogramm", t: "Tonne", lb: "Pfund (lb)", oz: "Unze (oz)" },
  }),
  volume: makeLinearTool({
    name: "Volumen", ph: "5 l", hint: "Zahl mit Einheit: ml, cl, l, m3, gal",
    units: { ml: 0.001, cl: 0.01, l: 1, m3: 1000, gal: 3.785411784 },
    aliases: { "m³": "m3", gallone: "gal", gallonen: "gal" },
    display: ["ml", "cl", "l", "m3", "gal"],
    labels: { ml: "Milliliter", cl: "Zentiliter", l: "Liter", m3: "Kubikmeter", gal: "US-Gallone" },
  }),
  temp: {
    name: "Temperatur", ph: "36,6 C", hint: "Zahl mit Einheit: C, F oder K", category: "mass",
    run(s) {
      const m = s.trim().replace(",", ".").match(/^(-?[\d.]+)\s*°?\s*(c|f|k)$/i);
      if (!m) return { error: "Format: Zahl mit C, F oder K, z. B. 36,6 C" };
      const val = parseFloat(m[1]), unit = m[2].toLowerCase();
      let c;
      if (unit === "c") c = val;
      else if (unit === "f") c = (val - 32) * 5 / 9;
      else c = val - 273.15;
      if (c < -273.15) return { error: "Tiefer als der absolute Nullpunkt geht nicht." };
      return { rows: [
        { label: "Celsius", value: fmt2(c) + " °C" },
        { label: "Fahrenheit", value: fmt2(c * 9 / 5 + 32) + " °F" },
        { label: "Kelvin", value: fmt2(c + 273.15) + " K" },
      ]};
    },
  },

  currency: {
    name: "Währungen", ph: "100 USD", hint: "Betrag und Währungscode, z. B. 100 USD — Tageskurse der EZB, nicht in Echtzeit", category: "currency",
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

const api = { tools, g4, toIp, ipOk, num, maskOf };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.Core = api;
})(typeof self !== "undefined" ? self : this);
