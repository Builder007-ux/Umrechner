(function (root) {
"use strict";
const S = typeof require !== "undefined" ? require("../shared.js") : root.ToolsShared;
const { g4 } = S;

const tools = {
  color: {
    name: "Farbe", ph: "BC002D", hint: "Hex (BC002D, #BC0) oder RGB (188, 0, 45)", category: "developer",
    keywords: ["farbe", "color", "hex", "rgb", "hsl", "css"],
    run(s) {
      let rgb, m;
      if (m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)) {
        let h = m[1]; if (h.length === 3) h = [...h].map(c => c + c).join("");
        rgb = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
      } else if (m = s.match(/^(?:rgb\()?\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)?$/i)) {
        rgb = m.slice(1, 4).map(Number);
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
    name: "Zahlensysteme", ph: "255", hint: "Dezimal oder mit Präfix: 0b1010, 0xFF, 0o17", category: "developer",
    keywords: ["binär", "hex", "oktal", "dezimal", "zahlensystem", "base"],
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
  hex: {
    name: "Hex ↔ Text", ph: "Hallo", hint: "Text wird zu Hex kodiert, gültiger Hex-String zusätzlich zu Text dekodiert", category: "developer",
    keywords: ["hex", "hexadezimal", "text", "bytes"],
    run(s) {
      const bytes = new TextEncoder().encode(s);
      const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
      const rows = [{ label: "Hex (aus Text)", value: hex }];
      const clean = s.replace(/[\s:]/g, "");
      if (/^[0-9a-f]+$/i.test(clean) && clean.length % 2 === 0 && clean.length > 0) {
        try {
          const by = clean.match(/../g).map(h => parseInt(h, 16));
          rows.push({ label: "Text (aus Hex)", value: new TextDecoder().decode(new Uint8Array(by)) });
        } catch {}
      }
      return { rows };
    },
  },
  ascii: {
    name: "ASCII / Unicode", ph: "A", hint: "Ein Zeichen, oder ein Code: 65, 0x41, U+0041", category: "developer",
    keywords: ["ascii", "unicode", "zeichen", "code", "character"],
    run(s) {
      const s2 = s.trim();
      let cp, m;
      if (m = s2.match(/^0x([0-9a-f]+)$/i)) cp = parseInt(m[1], 16);
      else if (m = s2.match(/^u\+([0-9a-f]+)$/i)) cp = parseInt(m[1], 16);
      else if (/^\d+$/.test(s2) && s2.length > 1) cp = parseInt(s2, 10);
      else if ([...s2].length === 1) cp = s2.codePointAt(0);
      else return { error: "Ein einzelnes Zeichen oder ein Code wie 65, 0x41, U+0041." };
      if (isNaN(cp) || cp < 0 || cp > 0x10FFFF) return { error: "Code außerhalb des gültigen Unicode-Bereichs." };
      let char; try { char = String.fromCodePoint(cp); } catch { return { error: "Ungültiger Code-Punkt." }; }
      return { rows: [
        { label: "Zeichen", value: char || "(Steuerzeichen)" },
        { label: "Dezimal", value: String(cp) },
        { label: "Hexadezimal", value: "0x" + cp.toString(16).toUpperCase() },
        { label: "Binär", value: cp.toString(2) },
        { label: "Oktal", value: cp.toString(8) },
      ]};
    },
  },
  urlenc: {
    name: "URL-Encoding", ph: "hallo welt?.de", hint: "Text wird URL-kodiert, kodierter Text zusätzlich dekodiert", category: "developer",
    keywords: ["url", "encode", "decode", "prozent", "percent"],
    run(s) {
      const rows = [{ label: "Kodiert", value: encodeURIComponent(s) }];
      if (/%[0-9a-f]{2}/i.test(s)) {
        try { rows.push({ label: "Dekodiert", value: decodeURIComponent(s) }); } catch {}
      }
      return { rows };
    },
  },
  base64: {
    name: "Base64", ph: "Hallo Welt", hint: "Text wird kodiert, gültiges Base64 zusätzlich dekodiert", category: "developer",
    keywords: ["base64", "kodieren", "dekodieren", "encode", "decode"],
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
    name: "JSON", ph: '{"a":1,"b":[2,3]}', hint: "JSON validieren, formatieren oder minifizieren (kompakte Zeile)", category: "developer",
    keywords: ["json", "formatter", "validator", "minify", "minifier", "pretty"],
    run(s) {
      let v;
      try { v = JSON.parse(s); } catch (e) { return { error: "Ungültiges JSON: " + e.message }; }
      return { rows: [
        { label: "Formatiert", value: JSON.stringify(v, null, 2) },
        { label: "Minifiziert", value: JSON.stringify(v) },
      ]};
    },
  },
  count: {
    name: "Zeichen zählen", ph: "Hallo Welt", hint: "Beliebiger Text", category: "developer",
    keywords: ["zeichen", "wörter", "zählen", "counter", "länge", "bytes"],
    run(s) {
      const chars = [...s].length;
      const noSpace = [...s.replace(/\s/g, "")].length;
      const words = s.trim() ? s.trim().split(/\s+/).length : 0;
      const lines = s.split(/\r\n|\r|\n/).length;
      const bytes = new TextEncoder().encode(s).length;
      return { rows: [
        { label: "Zeichen", value: String(chars) },
        { label: "Ohne Leerzeichen", value: String(noSpace) },
        { label: "Wörter", value: String(words) },
        { label: "Zeilen", value: String(lines) },
        { label: "Bytes (UTF-8)", value: String(bytes) },
      ]};
    },
  },
  uuid: {
    name: "UUID-Generator", ph: "1", hint: "Anzahl der gewünschten UUIDs (1 bis 20)", category: "developer",
    keywords: ["uuid", "guid", "generator", "zufall"],
    run(s) {
      const n = parseInt(s.trim(), 10);
      if (!Number.isInteger(n) || n < 1 || n > 20) return { error: "Bitte eine Zahl von 1 bis 20 eingeben." };
      if (typeof crypto === "undefined" || !crypto.randomUUID) return { error: "crypto.randomUUID ist nicht verfügbar (benötigt HTTPS oder localhost)." };
      return { rows: Array.from({ length: n }, (_, i) => ({ label: `UUID ${i + 1}`, value: crypto.randomUUID() })) };
    },
  },
};

const api = { tools };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else Object.assign(root.ToolsRegistry = root.ToolsRegistry || {}, tools);
})(typeof self !== "undefined" ? self : this);
