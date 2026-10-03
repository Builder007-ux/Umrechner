(function (root) {
"use strict";
const S = typeof require !== "undefined" ? require("../shared.js") : root.ToolsShared;
const { g4, toIp, ipOk, num, maskOf } = S;

const tools = {
  ip: {
    name: "IPv4 / CIDR", ph: "192.168.1.10/24", hint: "IPv4-Adresse, optional mit /Präfix", category: "network",
    keywords: ["ip", "ipv4", "cidr", "subnetzmaske", "netzmaske", "broadcast", "host"],
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
          { label: "Netzmaske", value: toIp(mask), send: { tool: "wildcard", text: toIp(mask) } },
          { label: "Netzadresse", value: toIp(net) },
          { label: "Broadcast", value: toIp(bc) },
          { label: "Hosts", value: String(p >= 31 ? (p === 32 ? 1 : 2) : 2 ** (32 - p) - 2) },
        );
      }
      return { rows };
    },
  },
  subnet: {
    name: "Subnetze", ph: "192.168.0.0/24 in /26", hint: "Netz/Präfix in neues Präfix aufteilen, max. 64 Subnetze", category: "network",
    keywords: ["subnetz", "subnetting", "cidr", "aufteilen"],
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
  wildcard: {
    name: "Wildcard-Maske", ph: "255.255.255.0", hint: "Netzmaske oder Wildcard-Maske (z. B. 0.0.0.255), auch mit /Präfix", category: "network",
    keywords: ["wildcard", "wildcard mask", "cisco acl", "netzmaske"],
    run(s) {
      const pm = s.match(/^\/(\d{1,2})$/);
      let mask;
      if (pm) { const p = +pm[1]; if (p > 32) return { error: "Präfix maximal /32." }; mask = maskOf(p); }
      else {
        const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (!m) return { error: "Format: 255.255.255.0, 0.0.0.255 oder /24" };
        const o = m.slice(1).map(Number);
        if (!ipOk(o)) return { error: "Wert außerhalb des gültigen Bereichs." };
        mask = num(o);
      }
      const wildcard = (~mask) >>> 0;
      let prefix = null, bits = mask, count = 0;
      for (let i = 0; i < 32; i++) { if ((bits >>> (31 - i)) & 1) count++; else break; }
      const rebuilt = count === 0 ? 0 : (0xFFFFFFFF << (32 - count)) >>> 0;
      if (rebuilt === mask) prefix = count;
      const rows = [
        { label: "Eingabe (normalisiert)", value: toIp(mask) },
        { label: "Komplement (Wildcard ↔ Netzmaske)", value: toIp(wildcard) },
      ];
      rows.push({ label: "CIDR-Präfix", value: prefix === null ? "keine zusammenhängende Maske" : "/" + prefix });
      return { rows };
    },
  },
  mac: {
    name: "MAC", ph: "AA:BB:CC:DD:EE:FF", hint: "Mit Doppelpunkt, Bindestrich, Punkt oder ohne Trennzeichen", category: "network",
    keywords: ["mac", "mac adresse", "oui", "ethernet"],
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
  ipv6: {
    name: "IPv6", ph: "2001:0db8:0000:0000:0000:0000:0000:0001", hint: "Volle oder verkürzte IPv6-Adresse", category: "network",
    keywords: ["ipv6", "expand", "compress", "kompression", "verkürzen"],
    run(s) {
      let s2 = s.trim();
      if (!/^[0-9a-f:]+$/i.test(s2)) return { error: "Ungültige Zeichen für eine IPv6-Adresse." };
      if ((s2.match(/::/g) || []).length > 1) return { error: "„::“ darf höchstens einmal vorkommen." };
      let groups;
      if (s2.includes("::")) {
        const [left, right] = s2.split("::");
        const l = left ? left.split(":") : [];
        const r = right ? right.split(":") : [];
        if (l.length + r.length > 7) return { error: "Zu viele Gruppen für eine verkürzte Adresse." };
        const mid = Array(8 - l.length - r.length).fill("0");
        groups = [...l, ...mid, ...r];
      } else {
        groups = s2.split(":");
      }
      if (groups.length !== 8 || groups.some(g => !/^[0-9a-f]{1,4}$/i.test(g))) return { error: "Eine IPv6-Adresse hat 8 Gruppen à 1–4 Hex-Zeichen." };
      const full = groups.map(g => g.padStart(4, "0").toLowerCase());
      // Kürzeste Nullfolge für :: finden
      let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
      full.forEach((g, i) => {
        if (g === "0000") { if (curStart === -1) curStart = i; curLen++; if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; } }
        else { curStart = -1; curLen = 0; }
      });
      const shortGroups = full.map(g => g.replace(/^0+(?=.)/, ""));
      let compressed;
      if (bestLen > 1) {
        compressed = shortGroups.slice(0, bestStart).join(":") + "::" + shortGroups.slice(bestStart + bestLen).join(":");
      } else {
        compressed = shortGroups.join(":");
      }
      return { rows: [
        { label: "Komprimiert", value: compressed },
        { label: "Vollständig", value: full.join(":") },
      ]};
    },
  },
};

const api = { tools };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else Object.assign(root.ToolsRegistry = root.ToolsRegistry || {}, tools);
})(typeof self !== "undefined" ? self : this);
