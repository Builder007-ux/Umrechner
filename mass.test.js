const test = require("node:test");
const assert = require("node:assert");
const { tools } = require("../src/tools/mass.js");
const val = (res, label) => { const r = res.rows.find(x => x.label === label); assert.ok(r, "Zeile fehlt: " + label); return r.value; };

test("Länge", () => {
  assert.strictEqual(val(tools.length.run("5 km"), "Meter"), "5.000 m");
  assert.strictEqual(val(tools.length.run("12 zoll"), "Zentimeter"), "30,48 cm");
});
test("Fläche", () => {
  assert.strictEqual(val(tools.area.run("1 hectare"), "m²"), "10.000 m2");
});
test("Volumen", () => {
  assert.strictEqual(val(tools.volume.run("1 gal"), "Liter"), "3,785412 l");
});
test("Gewicht", () => {
  assert.strictEqual(val(tools.weight.run("1 st"), "Kilogramm"), "6,350293 kg");
});
test("Geschwindigkeit", () => {
  assert.strictEqual(val(tools.speed.run("100 km/h"), "Meter pro Sekunde"), "27,777778 m/s");
});
test("Dauer", () => {
  assert.strictEqual(val(tools.duration.run("1 year"), "Tage"), "365,25 d");
});
test("Druck", () => {
  assert.strictEqual(val(tools.pressure.run("1 atm"), "Bar"), "1,01325 bar");
});
test("Energie", () => {
  assert.strictEqual(val(tools.energy.run("1 kwh"), "Kilojoule"), "3.600 kj");
});
test("Leistung", () => {
  assert.strictEqual(val(tools.power.run("1 ps"), "Watt"), "735,49875 w");
});
test("Frequenz", () => {
  assert.strictEqual(val(tools.frequency.run("1 ghz"), "Megahertz"), "1.000 mhz");
});
test("Winkel", () => {
  assert.strictEqual(val(tools.angle.run("180 deg"), "Radiant"), "3,141593 rad");
});
test("Daten SI vs IEC", () => {
  assert.strictEqual(val(tools.data.run("1 mb"), "MiB (IEC, 1024)"), "0,953674 mib");
  assert.strictEqual(val(tools.data.run("1 mib"), "MB (SI, 1000)"), "1,048576 mb");
});
test("Temperatur", () => {
  assert.strictEqual(val(tools.temp.run("36,6 C"), "Fahrenheit"), "97,88 °F");
  assert.ok(tools.temp.run("-300 C").error);
});
