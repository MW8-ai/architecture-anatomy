// CI smoke: every catalogs/index.json entry must resolve to a parseable catalog.
import { readFileSync, existsSync } from "node:fs";
const idx = JSON.parse(readFileSync("catalogs/index.json", "utf8"));
let fail = 0;
for (const c of idx.catalogs || []) {
  const path = c.file.includes("/") ? c.file : "catalogs/" + c.file;
  if (!existsSync(path)) { console.error(`MISSING: ${path} (${c.title})`); fail++; continue; }
  try {
    const j = JSON.parse(readFileSync(path, "utf8"));
    if (!j.nodes || !j.layers) { console.error(`MALFORMED (needs nodes+layers): ${path}`); fail++; continue; }
    console.log(`ok  ${path}  (${Object.keys(j.nodes).length} nodes)`);
  } catch (e) { console.error(`UNPARSEABLE: ${path}: ${e.message}`); fail++; }
}
if (fail) { console.error(`${fail} catalog index entr${fail===1?"y":"ies"} broken`); process.exit(1); }
console.log("catalog index: all entries resolve");
