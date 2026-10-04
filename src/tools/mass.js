(function (root) {
"use strict";
const S = typeof require !== "undefined" ? require("../shared.js") : root.ToolsShared;
const { makeLinearTool, fmt2 } = S;

const tools = {
  length: makeLinearTool({
    name: "Länge", ph: "5 km", hint: "Zahl mit Einheit: mm, cm, m, km, in, ft, yd, mi, nmi",
    keywords: ["länge", "meter", "kilometer", "zoll", "fuß", "meile", "seemeile"],
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 },
    aliases: { zoll: "in", fuß: "ft", fuss: "ft", yard: "yd", meile: "mi", meilen: "mi", seemeile: "nmi", sm: "nmi" },
    display: ["mm", "cm", "m", "km", "in", "ft", "yd", "mi", "nmi"],
    labels: { mm: "Millimeter", cm: "Zentimeter", m: "Meter", km: "Kilometer", in: "Zoll (in)", ft: "Fuß (ft)", yd: "Yard", mi: "Meile", nmi: "Seemeile (nmi)" },
  }),
  area: makeLinearTool({
    name: "Fläche", ph: "500 m2", hint: "Zahl mit Einheit: mm2, cm2, m2, km2, in2, ft2, yd2, acre, hectare",
    keywords: ["fläche", "quadratmeter", "hektar", "acre", "area"],
    units: { mm2: 0.000001, cm2: 0.0001, m2: 1, km2: 1000000, in2: 0.00064516, ft2: 0.09290304, yd2: 0.83612736, acre: 4046.8564224, hectare: 10000 },
    aliases: { "mm²": "mm2", "cm²": "cm2", "m²": "m2", "km²": "km2", "in²": "in2", "ft²": "ft2", "yd²": "yd2", ha: "hectare", hektar: "hectare" },
    display: ["mm2", "cm2", "m2", "km2", "in2", "ft2", "yd2", "acre", "hectare"],
    labels: { mm2: "mm²", cm2: "cm²", m2: "m²", km2: "km²", in2: "in² (Zoll²)", ft2: "ft² (Fuß²)", yd2: "yd² (Yard²)", acre: "Acre", hectare: "Hektar" },
  }),
  volume: makeLinearTool({
    name: "Volumen", ph: "5 l", hint: "Zahl mit Einheit: ml, cl, l, cm3, m3, usfloz, uscup, pint, gal",
    keywords: ["volumen", "liter", "gallone", "cup", "pint"],
    units: { ml: 0.001, cl: 0.01, l: 1, cm3: 0.001, m3: 1000, usfloz: 0.0295735295625, uscup: 0.2365882365, pint: 0.473176473, gal: 3.785411784 },
    aliases: { "cm³": "cm3", "m³": "m3", floz: "usfloz", cup: "uscup", gallone: "gal", gallonen: "gal" },
    display: ["ml", "cl", "l", "cm3", "usfloz", "uscup", "pint", "m3", "gal"],
    labels: { ml: "Milliliter", cl: "Zentiliter", l: "Liter", cm3: "cm³", usfloz: "US fl oz", uscup: "US Cup", pint: "US Pint", m3: "Kubikmeter", gal: "US-Gallone" },
  }),
  weight: makeLinearTool({
    name: "Gewicht", ph: "5 kg", hint: "Zahl mit Einheit: mg, g, kg, t, lb, oz, st",
    keywords: ["gewicht", "masse", "kilogramm", "pfund", "unze", "stone"],
    units: { mg: 0.001, g: 1, kg: 1000, t: 1000000, lb: 453.59237, oz: 28.349523125, st: 6350.29318 },
    aliases: { pfund: "lb", unze: "oz", tonne: "t", tonnen: "t", stone: "st" },
    display: ["mg", "g", "kg", "t", "lb", "oz", "st"],
    labels: { mg: "Milligramm", g: "Gramm", kg: "Kilogramm", t: "Tonne", lb: "Pfund (lb)", oz: "Unze (oz)", st: "Stone" },
  }),
  speed: makeLinearTool({
    name: "Geschwindigkeit", ph: "100 km/h", hint: 'Zahl mit Einheit: "m/s", km/h, mph, kn',
    keywords: ["geschwindigkeit", "speed", "knoten", "mph"],
    units: { "m/s": 1, "km/h": 1000 / 3600, mph: 0.44704, kn: 0.514444444 },
    aliases: { kmh: "km/h", kph: "km/h", ms: "m/s", knoten: "kn", kt: "kn" },
    display: ["m/s", "km/h", "mph", "kn"],
    labels: { "m/s": "Meter pro Sekunde", "km/h": "Kilometer pro Stunde", mph: "Meilen pro Stunde (mph)", kn: "Knoten" },
  }),
  duration: makeLinearTool({
    name: "Dauer", ph: "2 h", hint: "Zahl mit Einheit: ms, s, min, h, d, w, month, year (Monat/Jahr sind Durchschnittswerte)",
    keywords: ["dauer", "zeit", "minuten", "stunden", "tage", "wochen", "monate", "jahre"],
    units: { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400, w: 604800, month: 2629800, year: 31557600 },
    aliases: { sek: "s", sekunde: "s", sekunden: "s", minute: "min", minuten: "min", stunde: "h", stunden: "h", tag: "d", tage: "d", woche: "w", wochen: "w", monat: "month", monate: "month", jahr: "year", jahre: "year" },
    display: ["ms", "s", "min", "h", "d", "w", "month", "year"],
    labels: { ms: "Millisekunden", s: "Sekunden", min: "Minuten", h: "Stunden", d: "Tage", w: "Wochen", month: "Monate (Ø)", year: "Jahre (Ø)" },
  }),
  pressure: makeLinearTool({
    name: "Druck", ph: "1 bar", hint: "Zahl mit Einheit: pa, kpa, bar, atm, psi, mmhg",
    keywords: ["druck", "pressure", "bar", "pascal", "psi"],
    units: { pa: 1, kpa: 1000, bar: 100000, atm: 101325, psi: 6894.757293168, mmhg: 133.322387415 },
    aliases: {},
    display: ["pa", "kpa", "bar", "atm", "psi", "mmhg"],
    labels: { pa: "Pascal", kpa: "Kilopascal", bar: "Bar", atm: "Atmosphäre", psi: "psi", mmhg: "mmHg" },
  }),
  energy: makeLinearTool({
    name: "Energie", ph: "1 kWh", hint: "Zahl mit Einheit: j, kj, wh, kwh, cal, kcal",
    keywords: ["energie", "joule", "kalorien", "kwh"],
    units: { j: 1, kj: 1000, wh: 3600, kwh: 3600000, cal: 4.184, kcal: 4184 },
    aliases: {},
    display: ["j", "kj", "wh", "kwh", "cal", "kcal"],
    labels: { j: "Joule", kj: "Kilojoule", wh: "Wattstunde", kwh: "Kilowattstunde", cal: "Kalorie", kcal: "Kilokalorie" },
  }),
  power: makeLinearTool({
    name: "Leistung", ph: "150 kw", hint: "Zahl mit Einheit: w, kw, mw, ps, hp",
    keywords: ["leistung", "watt", "pferdestärke", "power"],
    units: { w: 1, kw: 1000, mw: 1000000, ps: 735.49875, hp: 745.699872 },
    aliases: {},
    display: ["w", "kw", "mw", "ps", "hp"],
    labels: { w: "Watt", kw: "Kilowatt", mw: "Megawatt", ps: "PS (metrisch)", hp: "hp (mechanisch)" },
  }),
  frequency: makeLinearTool({
    name: "Frequenz", ph: "2,4 ghz", hint: "Zahl mit Einheit: hz, khz, mhz, ghz",
    keywords: ["frequenz", "hertz", "takt"],
    units: { hz: 1, khz: 1000, mhz: 1000000, ghz: 1000000000 },
    aliases: {},
    display: ["hz", "khz", "mhz", "ghz"],
    labels: { hz: "Hertz", khz: "Kilohertz", mhz: "Megahertz", ghz: "Gigahertz" },
  }),
  angle: makeLinearTool({
    name: "Winkel", ph: "180 deg", hint: "Zahl mit Einheit: deg, rad",
    keywords: ["winkel", "grad", "radiant", "angle"],
    units: { deg: 1, rad: 180 / Math.PI },
    aliases: { grad: "deg", "°": "deg" },
    display: ["deg", "rad"],
    labels: { deg: "Grad (°)", rad: "Radiant" },
  }),
  data: makeLinearTool({
    name: "Daten", ph: "1500 mb", hint: "Zahl mit Einheit: bit, byte, SI (kb…pb, Basis 1000) oder IEC (kib…pib, Basis 1024)",
    keywords: ["daten", "bit", "byte", "kb", "mb", "gb", "tb", "speicher", "iec", "si"],
    units: { bit: 0.125, byte: 1, kb: 1000, mb: 1e6, gb: 1e9, tb: 1e12, pb: 1e15, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, pib: 1024 ** 5 },
    aliases: { bits: "bit", bytes: "byte" },
    display: ["bit", "byte", "kb", "mb", "gb", "tb", "pb", "kib", "mib", "gib", "tib", "pib"],
    labels: { bit: "Bit", byte: "Byte", kb: "KB (SI, 1000)", mb: "MB (SI, 1000)", gb: "GB (SI, 1000)", tb: "TB (SI, 1000)", pb: "PB (SI, 1000)", kib: "KiB (IEC, 1024)", mib: "MiB (IEC, 1024)", gib: "GiB (IEC, 1024)", tib: "TiB (IEC, 1024)", pib: "PiB (IEC, 1024)" },
  }),
  temp: {
    name: "Temperatur", ph: "36,6 C", hint: "Zahl mit Einheit: C, F oder K", category: "mass",
    keywords: ["temperatur", "celsius", "fahrenheit", "kelvin"],
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
};

const api = { tools };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else Object.assign(root.ToolsRegistry = root.ToolsRegistry || {}, tools);
})(typeof self !== "undefined" ? self : this);
