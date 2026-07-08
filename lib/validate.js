/* Architecture Anatomy — Phase A validation engine (per ANATOMY-3D-ADR)
 * Renderer-agnostic. No DOM, no imports. Works in <script>, ES module, or Node.
 * Tolerant of legacy catalogs: nodes without requires/provides/boundary produce
 * no findings — validation is additive, never breaking.
 *
 * Finding shape: { id, severity: "error"|"warning"|"info", rule, nodeId?, edge?, text }
 * Node state derives from findings + explicit ignores: catalog.meta.ignoredFindings = [ids]
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AnatomyValidate = factory();
})(typeof self !== "undefined" ? self : this, function () {

  // Boundary strictness ranking — higher may not transit lower.
  const BOUNDARY_RANK = { "commercial": 0, "gcc": 1, "gcc-high": 2, "dod": 3 };

  const allEdges = (cat) => (cat.layers || []).flatMap(l => (l.edges || []).map(e => ({ ...e, layer: l.id })));

  const neighbors = (cat) => {
    const adj = {};
    for (const e of allEdges(cat)) {
      (adj[e.a] = adj[e.a] || new Set()).add(e.b);
      (adj[e.b] = adj[e.b] || new Set()).add(e.a);
    }
    return adj;
  };

  // Rule 1 — UNMET REQUIREMENTS: node.requires[] with no CONNECTED provider.
  function unmetRequirements(cat) {
    const findings = [];
    const adj = neighbors(cat);
    const nodes = cat.nodes || {};
    for (const [id, n] of Object.entries(nodes)) {
      for (const req of (n.requires || [])) {
        const linked = [...(adj[id] || [])];
        const satisfied = linked.some(nb => ((nodes[nb] || {}).provides || []).includes(req));
        if (!satisfied) findings.push({
          id: `req:${id}:${req}`, severity: "error", rule: "unmet-requirement", nodeId: id,
          text: `${n.t || id} requires "${req}" but no connected node provides it.`
        });
      }
    }
    return findings;
  }

  // Rule 2 — BLAST RADIUS: what orphans if nodeId is removed/detached.
  // A node is orphaned if it dependsOn the removed node (directly or transitively
  // through other orphans). Explicit dependsOn only — edges imply reach, not need.
  function blastRadius(cat, nodeId) {
    const nodes = cat.nodes || {};
    const dependents = {}; // provider -> [nodes that depend on it]
    for (const [id, n] of Object.entries(nodes))
      for (const dep of (n.dependsOn || []))
        (dependents[dep] = dependents[dep] || []).push(id);
    const orphans = new Set(); const queue = [nodeId];
    while (queue.length) {
      const cur = queue.shift();
      for (const d of (dependents[cur] || [])) {
        // orphaned only if ALL its dependencies are gone/orphaned? No — losing ANY
        // hard dependency breaks it. dependsOn is declared as hard by definition.
        if (!orphans.has(d) && d !== nodeId) { orphans.add(d); queue.push(d); }
      }
    }
    return {
      nodeId, orphans: [...orphans],
      findings: [...orphans].map(o => ({
        id: `blast:${nodeId}:${o}`, severity: "warning", rule: "blast-radius", nodeId: o,
        text: `Removing ${(nodes[nodeId]||{}).t || nodeId} breaks ${(nodes[o]||{}).t || o} (hard dependency).`
      }))
    };
  }

  // Rule 3 — BOUNDARY PATH: every hop of a flow must satisfy the strictest
  // boundary tag present on the path. Data never transits a lower boundary.
  function boundaryPathCheck(cat, flow) {
    const nodes = cat.nodes || {};
    const steps = flow.steps || [];
    const ranks = steps.map(s => BOUNDARY_RANK[(nodes[s] || {}).boundary] ?? null).filter(r => r !== null);
    if (!ranks.length) return [];
    const strictest = Math.max(...ranks);
    const findings = [];
    for (const s of steps) {
      const b = (nodes[s] || {}).boundary;
      const r = BOUNDARY_RANK[b];
      if (r !== undefined && r < strictest) findings.push({
        id: `boundary:${flow.id}:${s}`, severity: "error", rule: "boundary-violation", nodeId: s, flowId: flow.id,
        text: `Flow "${flow.name || flow.id}" carries ${rankName(strictest)} data through ${(nodes[s]||{}).t || s} (${b}). Forbidden hop.`
      });
    }
    return findings;
  }
  const rankName = (r) => Object.keys(BOUNDARY_RANK).find(k => BOUNDARY_RANK[k] === r) || String(r);

  // Orchestrator — run everything, honor explicit ignores (amber, never silent).
  function validateCatalog(cat) {
    const ignored = new Set(((cat.meta || {}).ignoredFindings) || []);
    let findings = [
      ...unmetRequirements(cat),
      ...((cat.flows || []).flatMap(f => boundaryPathCheck(cat, f)))
    ];
    findings = findings.map(f => ignored.has(f.id) ? { ...f, severity: "info", ignored: true,
      text: f.text + " (explicitly ignored — review periodically)" } : f);
    const perNode = {};
    for (const f of findings) if (f.nodeId)
      perNode[f.nodeId] = worst(perNode[f.nodeId], f.ignored ? "ignored" : f.severity);
    return { findings, perNode,
      summary: { errors: findings.filter(f=>f.severity==="error").length,
                 warnings: findings.filter(f=>f.severity==="warning").length,
                 ignored: findings.filter(f=>f.ignored).length } };
  }
  const ORDER = { error: 3, warning: 2, ignored: 1, info: 0 };
  const worst = (a, b) => (ORDER[b] ?? 0) >= (ORDER[a] ?? -1) ? b : a;

  return { validateCatalog, unmetRequirements, blastRadius, boundaryPathCheck, BOUNDARY_RANK };
});
