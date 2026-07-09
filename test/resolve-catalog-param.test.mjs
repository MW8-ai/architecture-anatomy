// Run: node test/resolve-catalog-param.test.mjs — zero-dependency assertions
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveCatalogParam } = require("../lib/resolve-catalog-param.js");

// Node has no document/location globals; pass them explicitly to match what
// the browser supplies at runtime (document.baseURI / location.origin).
const opts = {
  baseHref: "http://localhost:8743/atlas.html",
  originHref: "http://localhost:8743",
};
const resolve = (raw) => resolveCatalogParam(raw, opts);

let pass = 0; const t = (name, fn) => { fn(); console.log("ok -", name); pass++; };

// --- original denylist-era cases (still must hold under the allowlist) ---

t("absolute https URL is rejected", () => {
  assert.equal(resolve("https://evil.com/x.json"), null);
});

t("absolute http URL is rejected", () => {
  assert.equal(resolve("http://evil.com/x.json"), null);
});

t("javascript: scheme is rejected", () => {
  assert.equal(resolve("javascript:alert(1)"), null);
});

t("protocol-relative URL is rejected", () => {
  assert.equal(resolve("//evil.com/x.json"), null);
});

t("empty/missing param resolves to null (caller applies its own default)", () => {
  assert.equal(resolve(""), null);
  assert.equal(resolve(null), null);
  assert.equal(resolve(undefined), null);
});

// --- bypasses found in boundary review (verified against real browser URL
// resolution first, not assumed) ---

t("backslash-backslash is rejected (browser treats as protocol-relative for special schemes)", () => {
  assert.equal(resolve("\\\\evil.com/x.json"), null);
});

t("slash-backslash is rejected (browser resolves this to a cross-origin URL)", () => {
  assert.equal(resolve("/\\evil.com/x.json"), null);
});

t("leading space before an absolute URL is rejected", () => {
  assert.equal(resolve(" https://evil.com/x.json"), null);
});

t("leading tab before an absolute URL is rejected", () => {
  assert.equal(resolve("\thttps://evil.com/x.json"), null);
});

t("percent-encoded traversal is rejected", () => {
  assert.equal(resolve("%2e%2e/%2e%2e/secrets.json"), null);
});

t("plain traversal is rejected", () => {
  assert.equal(resolve("../../../etc/passwd"), null);
  assert.equal(resolve("catalogs/../../../etc/passwd"), null);
});

t("root-relative path outside catalogs/ is rejected (same-origin, wrong directory)", () => {
  assert.equal(resolve("/other-dir/x.json"), null);
});

t("suffix-origin trick is rejected", () => {
  assert.equal(resolve("https://mw8-ai.github.io.evil.com/x.json"), null);
});

// --- must still work ---

t("bare filename resolves under catalogs/", () => {
  assert.equal(resolve("zero-trust-access.json"), "/catalogs/zero-trust-access.json");
});

t("same-origin relative path under catalogs/ is used", () => {
  assert.equal(resolve("catalogs/examples/sovereign-sample.json"), "/catalogs/examples/sovereign-sample.json");
});

// --- subpath-deployment boundary cases (the real site is served at
// https://mw8-ai.github.io/architecture-anatomy/, not domain root — confirmed
// via `gh api repos/MW8-ai/architecture-anatomy/pages`) ---

const subpathOpts = {
  baseHref: "https://mw8-ai.github.io/architecture-anatomy/atlas.html",
  originHref: "https://mw8-ai.github.io",
};
const resolveSubpath = (raw) => resolveCatalogParam(raw, subpathOpts);

t("subpath: domain-root catalogs/ does not satisfy the /architecture-anatomy/ confinement", () => {
  assert.equal(resolveSubpath("/catalogs/evil.json"), null);
});

t("subpath: bare filename resolves under the deployed subpath's catalogs/", () => {
  assert.equal(resolveSubpath("saas-platform.json"), "/architecture-anatomy/catalogs/saas-platform.json");
});

t("subpath: sibling directory catalogs-evil/ is rejected, not just string-prefix-matched", () => {
  assert.equal(resolveSubpath("../catalogs-evil/x.json"), null);
  assert.equal(resolveSubpath("/architecture-anatomy/catalogs-evil/x.json"), null);
});

t("subpath: bare 'catalogs' directory request (no trailing slash) is rejected, not treated as a prefix match", () => {
  assert.equal(resolveSubpath("catalogs"), null);
});

t(".json check is on the resolved pathname, not the raw string: query string after .json is fine", () => {
  assert.equal(resolveSubpath("saas-platform.json?a=.txt"), "/architecture-anatomy/catalogs/saas-platform.json?a=.txt");
});

t(".json check is on the resolved pathname, not the raw string: fragment is stripped, still valid", () => {
  assert.equal(resolveSubpath("saas-platform.json#.txt"), "/architecture-anatomy/catalogs/saas-platform.json");
});

t(".json check is on the resolved pathname, not the raw string: .json in the query does not count", () => {
  assert.equal(resolveSubpath("evil.txt?x=.json"), null);
});

console.log(`\n${pass} passed`);
