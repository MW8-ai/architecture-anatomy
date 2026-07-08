// Run: node test/validate.test.mjs  — zero-dependency assertions
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const V = require("../lib/validate.js");
const sample = require("../catalogs/examples/sovereign-sample.json");
const legacy = require("../catalogs/zero-trust-access.json");

let pass = 0; const t = (name, fn) => { fn(); console.log("ok -", name); pass++; };

t("rule1: unmet requirement fires (S3/blob case)", () => {
  const f = V.unmetRequirements(sample);
  assert.equal(f.length, 1);
  assert.equal(f[0].rule, "unmet-requirement");
  assert.match(f[0].text, /storage:object/);
});

t("rule1: connecting the provider clears it (provides must MATCH, not just exist)", () => {
  const cat = structuredClone(sample);
  cat.layers[0].edges.push({ a: "app1", b: "blob1", proto: "HTTPS", port: 443 });
  // still unmet: blob1 provides storage:blob, app1 requires storage:object
  assert.equal(V.unmetRequirements(cat).length, 1);
  cat.nodes.blob1.provides = ["storage:object"];
  assert.equal(V.unmetRequirements(cat).length, 0);
});

t("rule2: blast radius is transitive (jump box case)", () => {
  const b = V.blastRadius(sample, "jump1");
  assert.deepEqual(b.orphans.sort(), ["app1", "sql1"]);
  assert.equal(b.findings.every(f => f.severity === "warning"), true);
});

t("rule3: boundary violation on strictest-hop rule", () => {
  const f = V.boundaryPathCheck(sample, sample.flows[0]);
  assert.equal(f.length, 1);
  assert.equal(f[0].nodeId, "relay1");
});

t("rule3: clean flow produces nothing", () => {
  assert.equal(V.boundaryPathCheck(sample, sample.flows[1]).length, 0);
});

t("ignore = amber, never silent", () => {
  const cat = structuredClone(sample);
  cat.meta.ignoredFindings = ["boundary:f-bad:relay1"];
  const r = V.validateCatalog(cat);
  assert.equal(r.summary.errors, 1);           // the unmet requirement remains
  assert.equal(r.summary.ignored, 1);          // violation demoted, not deleted
  const ig = r.findings.find(f => f.ignored);
  assert.match(ig.text, /explicitly ignored/);
});

t("legacy tolerance: shipped zero-trust catalog validates with ZERO findings", () => {
  const r = V.validateCatalog(legacy);
  assert.equal(r.findings.length, 0);          // additive, never breaking
});

console.log(`\n${pass}/7 passing`);
