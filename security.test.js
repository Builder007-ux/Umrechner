const test = require("node:test");
const assert = require("node:assert");
const { tools } = require("../src/tools/security.js");

test("Hash-Generator: bekannter Testwert (leerer String)", async () => {
  const r = await tools.hash.run("");
  const sha256 = r.rows.find(x => x.label === "SHA-256").value;
  assert.strictEqual(sha256, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("Zufallstoken", () => {
  const r = tools.token.run("16");
  const hex = r.rows.find(x => x.label === "Hex").value;
  assert.strictEqual(hex.length, 32);
  assert.ok(tools.token.run("0").error);
  assert.ok(tools.token.run("200").error);
});
