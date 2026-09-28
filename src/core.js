// Reine Rechenlogik ohne DOM: läuft im Browser (global "Core") und in Node (require).
(function (root) {
"use strict";
const g4 = s => s.padStart(Math.ceil(s.length / 4) * 4, "0").replace(/(.{4})(?=.)/g, "$1 ");
const toIp = n => [24, 16, 8, 0].map(x => (n >>> x) & 255).join(".");
const ipOk = o => o.length === 4 && o.every(x => x <= 255);
const num = o => ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
const maskOf = p => p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;

// Neuen Rechner: Eintrag ergänzen. run(text) liefert {rows, swatch?} oder {error}.
// Zeile: {label, value | parts[], copy?, send?:{tool,text}}
const tools = {
  color: {
    name: "Farbe", ph: "BC002D", hint: "Hex (BC002D, #BC0) oder RGB (188, 0, 45)",
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
    name: "Zahlensysteme", ph: "255", hint: "Dezimal oder mit Präfix: 0b1010, 0xFF, 0o17",
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
    name: "IPv4 / CIDR", ph: "192.168.1.10/24", hint: "IPv4-Adresse, optional mit /Präfix",
    run(s) {
      const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/);
      if (!m) return { error: "Format: 192.168.1.10 oder 192.168.1.10/24" };
      const o = m.slice(1, 5).map(Number), p = m[5] === undefined ? null : Number(m[5]);
      if (!ipOk(o) || (p !== null && p > 32)) return { error: "Wert außerhalb des gültigen Bereichs." };
      const n = num(o);
      const rows = [
        { label: "Dezimal", value: String(n), send: { tool: "base", text: String(n) } },
        { label: "Binär", parts: o.map(x => x.toString(2).padStart(8, "0")), copy: o.map(x => x.toString(2).padStart(8, "0")).join(".") },
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
    name: "Subnetze", ph: "192.168.0.0/24 in /26", hint: "Netz/Präfix in neues Präfix aufteilen, max. 64 Subnetze",
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
    name: "MAC", ph: "AA:BB:CC:DD:EE:FF", hint: "Mit Doppelpunkt, Bindestrich, Punkt oder ohne Trennzeichen",
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
    name: "Zeitstempel", ph: "1790000000", hint: "Unix-Sekunden, Millisekunden, ISO-Datum oder „jetzt“",
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
};

const api = { tools, g4, toIp, ipOk, num, maskOf };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.Core = api;
})(typeof self !== "undefined" ? self : this);
