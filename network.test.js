const test = require("node:test");
const assert = require("node:assert");
const { tools } = require("../src/tools/network.js");
const val = (res, label) => { const r = res.rows.find(x => x.label === label); assert.ok(r, "Zeile fehlt: " + label); return r.parts || r.value; };

test("IPv4 mit CIDR", () => {
  const r = tools.ip.run("192.168.1.10/24");
  assert.strictEqual(val(r, "Dezimal"), "3232235786");
  assert.strictEqual(val(r, "Netzmaske"), "255.255.255.0");
  assert.strictEqual(val(r, "Netzadresse"), "192.168.1.0");
  assert.strictEqual(val(r, "Broadcast"), "192.168.1.255");
  assert.strictEqual(val(r, "Hosts"), "254");
  assert.ok(tools.ip.run("300.1.1.1").error);
});

test("Subnetze", () => {
  const r = tools.subnet.run("192.168.0.0/24 in /26");
  assert.strictEqual(r.rows.length, 4);
  assert.strictEqual(r.rows[1].copy, "192.168.0.64/26");
  assert.ok(tools.subnet.run("10.0.0.0/8 in /16").error);
});

test("Wildcard-Maske", () => {
  assert.strictEqual(val(tools.wildcard.run("255.255.255.0"), "Komplement (Wildcard ↔ Netzmaske)"), "0.0.0.255");
  assert.strictEqual(val(tools.wildcard.run("/24"), "Eingabe (normalisiert)"), "255.255.255.0");
  assert.strictEqual(val(tools.wildcard.run("0.0.0.63"), "Komplement (Wildcard ↔ Netzmaske)"), "255.255.255.192");
});

test("MAC", () => {
  const r = tools.mac.run("AA-BB-CC-DD-EE-FF");
  assert.strictEqual(val(r, "Doppelpunkt"), "AA:BB:CC:DD:EE:FF");
  assert.strictEqual(val(r, "Cisco"), "aabb.ccdd.eeff");
  assert.ok(tools.mac.run("zz:11").error);
});

test("IPv6 Kompression/Expansion", () => {
  assert.strictEqual(val(tools.ipv6.run("2001:0db8:0000:0000:0000:0000:0000:0001"), "Komprimiert"), "2001:db8::1");
  assert.strictEqual(val(tools.ipv6.run("2001:db8::1"), "Vollständig"), "2001:0db8:0000:0000:0000:0000:0000:0001");
  assert.strictEqual(val(tools.ipv6.run("::1"), "Vollständig"), "0000:0000:0000:0000:0000:0000:0000:0001");
  assert.strictEqual(val(tools.ipv6.run("::"), "Vollständig"), "0000:0000:0000:0000:0000:0000:0000:0000");
  assert.ok(tools.ipv6.run("::1::2").error);
  assert.ok(tools.ipv6.run("zzzz::1").error);
});
