const test = require("node:test");
const assert = require("node:assert");
const { tools } = require("../src/tools/currency.js");

test("Währungen: ungültiges Format", async () => {
  assert.ok((await tools.currency.run("abc")).error);
});
test("Währungen: Netzwerkfehler wird abgefangen (keine Verbindung in der Testumgebung)", async () => {
  assert.ok((await tools.currency.run("100 USD")).error);
});
