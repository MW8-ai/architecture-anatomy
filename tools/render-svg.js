#!/usr/bin/env node
// Headless SVG renderer — same renderer as the in-browser ⬡ SVG button.
// Usage:
//   node tools/render-svg.js catalogs/architecture-catalog.json out.svg
//   node tools/render-svg.js catalogs/sovereign-boundary.json out.svg --layers nerv,skel
//   node tools/render-svg.js catalogs/architecture-catalog.json out.svg --overlays zones,cls,eol,tier
//   node tools/render-svg.js catA.json out.svg --diff catalogs/catB.json
'use strict';
const fs   = require('fs');
const path = require('path');
const { renderCatalogSVG } = require('./svg-renderer.js');

// ── arg parsing ──────────────────────────────────────────────────────────────
const positional = [];
const flags = {};
let i = 2;
while (i < process.argv.length) {
  const a = process.argv[i];
  if (a.startsWith('--')) { flags[a.slice(2)] = process.argv[i + 1] || ''; i += 2; }
  else { positional.push(a); i++; }
}

const catalogPath = positional[0];
const outPath     = positional[1] || 'out.svg';

if (!catalogPath) {
  console.error('Usage: node tools/render-svg.js <catalog.json> [out.svg] [--layers id,...] [--overlays key,...] [--diff catalog2.json]');
  process.exit(1);
}

// ── normalize (mirrors index.html normalize()) ───────────────────────────────
function normalize(cat) {
  cat.flows = cat.flows || [];
  cat.layers.forEach(L => {
    L.edges = L.edges.map(e =>
      Array.isArray(e) ? { a: e[0], b: e[1], conn: 'lan' }
                       : Object.assign({ conn: 'lan', dir: '->' }, e)
    );
  });
  return cat;
}

const cat = normalize(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));

const layerIds = flags.layers ? flags.layers.split(',') : cat.layers.map(L => L.id);
const overlayKeys = flags.overlays ? flags.overlays.split(',') : ['zones'];
const overlays = {};
overlayKeys.forEach(k => { overlays[k] = true; });
if (!flags.overlays) overlays.zones = true; // default on

// ── optional diff ─────────────────────────────────────────────────────────────
let diffData = null;
if (flags.diff) {
  const catB = normalize(JSON.parse(fs.readFileSync(flags.diff, 'utf8')));
  diffData = computeDiff(cat, catB);
}

function edgeKey(e) { return [e.a, e.b].sort().join('::'); }

function computeDiff(catA, catB) {
  const keysA = new Set(Object.keys(catA.nodes));
  const keysB = new Set(Object.keys(catB.nodes));

  const addedNodes   = [...keysA].filter(k => !keysB.has(k));
  const removedNodes = [...keysB].filter(k => !keysA.has(k)).map(k => ({ k, n: catB.nodes[k] }));
  const changedNodes = [...keysA].filter(k => keysB.has(k) && JSON.stringify(catA.nodes[k]) !== JSON.stringify(catB.nodes[k]));

  const edgesA = new Set(), edgesB = new Set();
  catA.layers.forEach(L => L.edges.forEach(e => edgesA.add(edgeKey(e))));
  catB.layers.forEach(L => L.edges.forEach(e => edgesB.add(edgeKey(e))));

  const addedEdges   = [];
  const removedEdges = [];
  catA.layers.forEach(L => L.edges.forEach(e => { if (!edgesB.has(edgeKey(e))) addedEdges.push({ e }); }));
  catB.layers.forEach(L => L.edges.forEach(e => { if (!edgesA.has(edgeKey(e))) removedEdges.push({ e, nodes: catB.nodes }); }));

  return { addedNodes, removedNodes, changedNodes, addedEdges, removedEdges };
}

// ── render ────────────────────────────────────────────────────────────────────
const svg = renderCatalogSVG(cat, {
  layers:   layerIds,
  overlays,
  diff:     diffData
});

fs.writeFileSync(outPath, svg, 'utf8');
console.log(`Written: ${path.resolve(outPath)}`);
console.log(`  ${Object.keys(cat.nodes).length} nodes · ${layerIds.length} plates · ${fs.statSync(outPath).size} bytes`);
if (diffData) {
  console.log(`  Diff vs ${flags.diff}: +${diffData.addedNodes.length} nodes, −${diffData.removedNodes.length} removed, ~${diffData.changedNodes.length} changed`);
}
