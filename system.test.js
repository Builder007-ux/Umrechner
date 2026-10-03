const test = require("node:test");
const assert = require("node:assert");
const { tools } = require("../src/tools/system.js");
const val = (res, label) => { const r = res.rows.find(x => x.label === label); assert.ok(r, "Zeile fehlt: " + label); return r.value; };

test("Zeitstempel", () => {
  assert.strictEqual(val(tools.time.run("0"), "UTC (ISO)"), "1970-01-01T00:00:00.000Z");
  assert.ok(tools.time.run("quatsch").error);
});

test("Zeitzonen", () => {
  const r = tools.tz.run("2026-01-15T12:00:00Z");
  assert.strictEqual(val(r, "UTC"), "15.01.2026, 12:00");
  assert.strictEqual(val(r, "Tokio"), "15.01.2026, 21:00");
});

test("chmod", () => {
  assert.strictEqual(val(tools.chmod.run("755"), "Symbolisch"), "rwxr-xr-x");
  assert.strictEqual(val(tools.chmod.run("rwxr-xr-x"), "Oktal"), "755");
  assert.strictEqual(val(tools.chmod.run("644"), "Symbolisch"), "rw-r--r--");
  assert.ok(tools.chmod.run("999").error);
});
