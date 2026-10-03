const test = require("node:test");
const assert = require("node:assert");
const { tools } = require("../src/tools/developer.js");
const val = (res, label) => { const r = res.rows.find(x => x.label === label); assert.ok(r, "Zeile fehlt: " + label); return r.parts || r.value; };

test("Farbe", () => {
  const r = tools.color.run("BC002D");
  assert.deepStrictEqual(val(r, "Hexadezimal"), ["BC", "00", "2D"]);
  assert.strictEqual(r.swatch, "#BC002D");
});

test("Zahlensysteme", () => {
  assert.strictEqual(val(tools.base.run("0xFF"), "Dezimal"), "255");
  assert.ok(tools.base.run("abc").error);
});

test("Hex <-> Text", () => {
  assert.strictEqual(val(tools.hex.run("Hallo"), "Hex (aus Text)"), "48616c6c6f");
  assert.strictEqual(val(tools.hex.run("48616c6c6f"), "Text (aus Hex)"), "Hallo");
});

test("ASCII / Unicode", () => {
  assert.strictEqual(val(tools.ascii.run("A"), "Dezimal"), "65");
  assert.strictEqual(val(tools.ascii.run("65"), "Zeichen"), "A");
  assert.strictEqual(val(tools.ascii.run("0x41"), "Zeichen"), "A");
  assert.ok(tools.ascii.run("abc").error);
});

test("URL-Encoding", () => {
  assert.strictEqual(val(tools.urlenc.run("hallo welt?.de"), "Kodiert"), "hallo%20welt%3F.de");
  assert.strictEqual(val(tools.urlenc.run("hallo%20welt"), "Dekodiert"), "hallo welt");
});

test("Base64", () => {
  assert.strictEqual(val(tools.base64.run("Hallo Welt"), "Kodiert"), "SGFsbG8gV2VsdA==");
  assert.strictEqual(val(tools.base64.run("SGFsbG8gV2VsdA=="), "Dekodiert"), "Hallo Welt");
});

test("JSON", () => {
  const r = tools.json.run('{"a":1,"b":[2,3]}');
  assert.strictEqual(val(r, "Minifiziert"), '{"a":1,"b":[2,3]}');
  assert.ok(tools.json.run("{a:1}").error);
});

test("Zeichen zählen", () => {
  const r = tools.count.run("Hallo Welt\nzeile2");
  assert.strictEqual(val(r, "Wörter"), "3");
  assert.strictEqual(val(r, "Zeilen"), "2");
});

test("UUID-Generator", () => {
  const r = tools.uuid.run("3");
  assert.strictEqual(r.rows.length, 3);
  assert.match(val(r, "UUID 1"), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.ok(tools.uuid.run("0").error);
  assert.ok(tools.uuid.run("21").error);
});
