(function (root) {
"use strict";

function toHex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join(""); }
function b64url(bytes) {
  let s = "";
  if (typeof btoa !== "undefined") s = btoa(String.fromCharCode(...bytes));
  else s = Buffer.from(bytes).toString("base64");
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const tools = {
  hash: {
    name: "Hash-Generator", ph: "Hallo Welt", hint: "Beliebiger Text, Hashes werden mit SHA-1/256/384/512 berechnet", category: "security",
    keywords: ["hash", "sha1", "sha256", "sha512", "checksum", "prüfsumme"],
    async run(s) {
      if (typeof crypto === "undefined" || !crypto.subtle) return { error: "crypto.subtle ist nicht verfügbar (benötigt HTTPS oder localhost)." };
      const enc = new TextEncoder().encode(s);
      const algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
      const rows = [];
      for (const algo of algos) {
        const buf = await crypto.subtle.digest(algo, enc);
        rows.push({ label: algo, value: toHex(buf) });
      }
      return { rows };
    },
  },
  token: {
    name: "Zufallstoken", ph: "32", hint: "Länge in Byte (1 bis 128)", category: "security",
    keywords: ["token", "zufall", "random", "passwort", "secret", "api key"],
    run(s) {
      const n = parseInt(s.trim(), 10);
      if (!Number.isInteger(n) || n < 1 || n > 128) return { error: "Bitte eine Zahl von 1 bis 128 eingeben." };
      if (typeof crypto === "undefined" || !crypto.getRandomValues) return { error: "crypto.getRandomValues ist nicht verfügbar." };
      const bytes = crypto.getRandomValues(new Uint8Array(n));
      const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
      return { rows: [
        { label: "Hex", value: hex },
        { label: "Base64url", value: b64url(bytes) },
      ]};
    },
  },
};

const api = { tools };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else Object.assign(root.ToolsRegistry = root.ToolsRegistry || {}, tools);
})(typeof self !== "undefined" ? self : this);
