const test = require("node:test");
const assert = require("node:assert");
const { tools } = require("../src/core.js");

const val = (res, label) => {
  const r = res.rows.find(x => x.label === label);
  assert.ok(r, "Zeile fehlt: " + label);
  return r.parts ? r.parts : r.value;
};

test("Zahlensysteme", () => {
  const r = tools.base.run("255");
  assert.strictEqual(val(r, "Dezimal"), "255");
  assert.strictEqual(val(r, "Binär"), "1111 1111");
  assert.strictEqual(val(r, "Hexadezimal"), "FF");
  assert.strictEqual(val(r, "Oktal"), "377");
  assert.strictEqual(val(tools.base.run("0xFF"), "Dezimal"), "255");
  assert.strictEqual(val(tools.base.run("0b1010"), "Dezimal"), "10");
  assert.ok(tools.base.run("abc").error);
});

test("IPv4 mit CIDR", () => {
  const r = tools.ip.run("192.168.1.10/24");
  assert.strictEqual(val(r, "Dezimal"), "3232235786");
  assert.strictEqual(val(r, "Netzmaske"), "255.255.255.0");
  assert.strictEqual(val(r, "Netzadresse"), "192.168.1.0");
  assert.strictEqual(val(r, "Broadcast"), "192.168.1.255");
  assert.strictEqual(val(r, "Hosts"), "254");
});

test("IPv4 Randfälle", () => {
  assert.strictEqual(val(tools.ip.run("10.0.0.1/32"), "Hosts"), "1");
  assert.strictEqual(val(tools.ip.run("10.0.0.0/31"), "Hosts"), "2");
  const z = tools.ip.run("1.2.3.4/0");
  assert.strictEqual(val(z, "Netzmaske"), "0.0.0.0");
  assert.strictEqual(val(z, "Broadcast"), "255.255.255.255");
  assert.ok(tools.ip.run("300.1.1.1").error);
  assert.ok(tools.ip.run("1.2.3.4/33").error);
});

test("Subnetze", () => {
  const r = tools.subnet.run("192.168.0.0/24 in /26");
  assert.strictEqual(r.rows.length, 4);
  assert.strictEqual(r.rows[1].copy, "192.168.0.64/26");
  assert.ok(r.rows[0].value.includes("192.168.0.1 bis 192.168.0.62"));
  assert.ok(tools.subnet.run("10.0.0.0/8 in /16").error);
  assert.ok(tools.subnet.run("192.168.0.0/26 in /24").error);
});

test("MAC", () => {
  const r = tools.mac.run("AA-BB-CC-DD-EE-FF");
  assert.strictEqual(val(r, "Doppelpunkt"), "AA:BB:CC:DD:EE:FF");
  assert.strictEqual(val(r, "Cisco"), "aabb.ccdd.eeff");
  assert.ok(val(tools.mac.run("01:00:5E:00:00:01"), "Art").startsWith("Multicast"));
  assert.ok(val(tools.mac.run("02:00:00:00:00:01"), "Art").includes("lokal"));
  assert.ok(tools.mac.run("zz:11").error);
});

test("Zeitstempel", () => {
  assert.strictEqual(val(tools.time.run("0"), "UTC (ISO)"), "1970-01-01T00:00:00.000Z");
  assert.strictEqual(val(tools.time.run("1000000000000"), "Sekunden"), "1000000000");
  assert.strictEqual(val(tools.time.run("2026-09-28T12:00:00Z"), "Millisekunden"), String(Date.parse("2026-09-28T12:00:00Z")));
  assert.ok(tools.time.run("quatsch").error);
});

test("Farbe", () => {
  const r = tools.color.run("BC002D");
  assert.deepStrictEqual(val(r, "Hexadezimal"), ["BC", "00", "2D"]);
  assert.deepStrictEqual(val(r, "Dezimal"), ["188", "000", "045"]);
  assert.strictEqual(r.swatch, "#BC002D");
  assert.deepStrictEqual(val(tools.color.run("#BC0"), "Hexadezimal"), ["BB", "CC", "00"]);
  assert.deepStrictEqual(val(tools.color.run("188, 0, 45"), "Hexadezimal"), ["BC", "00", "2D"]);
  assert.strictEqual(val(tools.color.run("FF0000"), "CSS HSL"), "hsl(0, 100%, 50%)");
  assert.ok(tools.color.run("256,0,0").error);
});

test("Base64", () => {
  const r = tools.base64.run("Hallo Welt");
  assert.strictEqual(val(r, "Kodiert"), "SGFsbG8gV2VsdA==");
  const d = tools.base64.run("SGFsbG8gV2VsdA==");
  assert.strictEqual(val(d, "Dekodiert"), "Hallo Welt");
});

test("JSON", () => {
  const r = tools.json.run('{"a":1,"b":[2,3]}');
  assert.strictEqual(val(r, "Kompakt"), '{"a":1,"b":[2,3]}');
  assert.ok(val(r, "Formatiert").includes("\n"));
  assert.ok(tools.json.run("{a:1}").error);
});

test("Zeitzonen", () => {
  const r = tools.tz.run("2026-01-15T12:00:00Z");
  assert.strictEqual(val(r, "UTC"), "15.01.2026, 12:00");
  assert.strictEqual(val(r, "Tokio"), "15.01.2026, 21:00");
  assert.ok(tools.tz.run("nicht-datum").error);
});

test("Länge", () => {
  const r = tools.length.run("5 km");
  assert.strictEqual(val(r, "Meter"), "5.000 m");
  assert.strictEqual(val(r, "Zoll (in)"), "196.850,393701 in");
  assert.strictEqual(val(tools.length.run("12 zoll"), "Zentimeter"), "30,48 cm");
  assert.ok(tools.length.run("5 xyz").error);
  assert.ok(tools.length.run("nix").error);
});

test("Gewicht", () => {
  const r = tools.weight.run("2 kg");
  assert.strictEqual(val(r, "Gramm"), "2.000 g");
  assert.strictEqual(val(tools.weight.run("1 pfund"), "Kilogramm"), "0,453592 kg");
});

test("Volumen", () => {
  const r = tools.volume.run("1,5 l");
  assert.strictEqual(val(r, "Milliliter"), "1.500 ml");
});

test("Temperatur", () => {
  const r = tools.temp.run("36,6 C");
  assert.strictEqual(val(r, "Fahrenheit"), "97,88 °F");
  assert.strictEqual(val(tools.temp.run("32 F"), "Celsius"), "0,00 °C");
  assert.strictEqual(val(tools.temp.run("0 K"), "Celsius"), "-273,15 °C");
  assert.ok(tools.temp.run("-300 C").error);
  assert.ok(tools.temp.run("abc").error);
});

test("Währungen: ungültiges Format", async () => {
  const r = await tools.currency.run("abc");
  assert.ok(r.error);
});

test("Währungen: Netzwerk nicht verfügbar wird abgefangen", async () => {
  // In dieser Testumgebung gibt es keinen Internetzugang; das ist genau der
  // Pfad, den echte Nutzer offline ebenfalls sehen sollen.
  const r = await tools.currency.run("100 USD");
  assert.ok(r.error);
});

test("Kategorien sind gesetzt", () => {
  for (const [id, t] of Object.entries(tools)) {
    assert.ok(["it", "mass", "currency"].includes(t.category), id + " hat keine gültige Kategorie");
  }
});
