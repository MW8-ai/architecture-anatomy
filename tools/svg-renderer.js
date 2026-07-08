// Shared pure SVG renderer.
// UMD: works as browser <script src> (exposes window.renderCatalogSVG) and as Node require().
// No DOM, no CSS vars, no external deps. All var(--...) resolved to hex internally.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderCatalogSVG: factory() };
  } else {
    root.renderCatalogSVG = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const BW = 128, BH = 46;
  const VW = 1040, VH = 720;

  // Resolved values for every CSS custom property used in catalogs and code.
  const VARS = {
    '--bg': '#080b11', '--bg2': '#0d1219', '--ink': '#ece4d2',
    '--muted': '#7d8898', '--faint': 'rgba(236,228,210,.16)', '--line': 'rgba(236,228,210,.10)',
    '--skeleton': '#ece3cd', '--vascular': '#ff4d57', '--nervous': '#ffc53d',
    '--lymph': '#34d6c0', '--zone': '#6f86a3',
    '--s-nist': '#b794f6', '--s-hipaa': '#4dd0e1', '--s-ato': '#ffd166',
    '--c-pub': '#57cb8b', '--c-int': '#5b9bd5', '--c-conf': '#ffb14d', '--c-reg': '#c084fc',
    '--eol-red': '#ff4d57', '--eol-amber': '#ffb14d', '--eol-green': '#57cb8b', '--eol-none': '#7c8694'
  };

  const rv = c => c ? String(c).replace(/var\(([^)]+)\)/g, (_, v) => VARS[v.trim()] || '#888') : '#888';

  const CLS = {
    pub: { c: '#57cb8b', t: 'Public' },
    int: { c: '#5b9bd5', t: 'Internal' },
    conf: { c: '#ffb14d', t: 'Confidential' },
    reg: { c: '#c084fc', t: 'Regulated (PHI/CJI)' }
  };
  const TIER = { 1: { t: 'Mission', c: '#ff6b6b' }, 2: { t: 'Business', c: '#ffb14d' }, 3: { t: 'Admin', c: '#7c8694' } };
  const CONN = {
    internet: { dash: '1 7' }, er: { dash: '' }, dx: { dash: '' },
    vpn: { dash: '7 4' }, lan: { dash: '' }, repl: { dash: '2 7' }
  };
  const ICONS = {
    cloud: 'M4 11.5 a3 3 0 0 1 0.5-5.95 a4 4 0 0 1 7.5 1 a2.5 2.5 0 0 1-0.5 4.95 z',
    db: 'M3 4 c0-1.2 2.6-2 5-2 s5 0.8 5 2 v8 c0 1.2-2.6 2-5 2 s-5-0.8-5-2 z M3 4 c0 1.2 2.6 2 5 2 s5-0.8 5-2',
    storage: 'M3 4 h10 v8 h-10 z M3 7 h10 M3 10 h10',
    server: 'M3 3 h10 v4 h-10 z M3 9 h10 v4 h-10 z M5 5 h0.01 M5 11 h0.01',
    identity: 'M8 2 l5 2 v4.2 c0 3-2.6 5-5 6 c-2.4-1-5-3-5-6 v-4.2 z',
    users: 'M8 7 a2.2 2.2 0 1 0 0-4.4 a2.2 2.2 0 0 0 0 4.4 z M3.6 13 c0-2.5 2-3.9 4.4-3.9 s4.4 1.4 4.4 3.9',
    network: 'M8 2 l4.5 2.6 v5.2 l-4.5 2.6 l-4.5-2.6 v-5.2 z',
    generic: 'M3.5 3.5 h9 v9 h-9 z'
  };

  function iconFor(n, k) {
    if (n.icon && ICONS[n.icon]) return n.icon;
    const s = (k + ' ' + n.l).toLowerCase();
    if (/user/.test(s)) return 'users';
    if (/azure|aws|gcp|oci|cloud/.test(s)) return 'cloud';
    if (/sql|oracle|database|postgres|mysql|mongo/.test(s)) return 'db';
    if (/isilon|nas|storage|blob|disk|bucket/.test(s)) return 'storage';
    if (/okta|entra|\bad\b|adds|ldap|identity|connect|directory|iam/.test(s)) return 'identity';
    if (/cloudflare|f5|firewall|nsx|fabric|edge|gateway|router|network|vpn/.test(s)) return 'network';
    if (/vmware|windows|linux|server|citrix|compute|host/.test(s)) return 'server';
    return 'generic';
  }

  function eolStatus(eol) {
    if (!eol) return { c: '#7c8694' };
    const days = Math.floor((new Date(eol) - new Date()) / 86400000);
    if (days < 0) return { c: '#ff4d57' };
    if (days <= 180) return { c: '#ffb14d' };
    return { c: '#57cb8b' };
  }

  const x = s => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // ─── main export ────────────────────────────────────────────────────────────
  // cat    — normalized catalog object (same shape as DEFAULT_CATALOG in index.html)
  // opts   — { layers:[ids], overlays:{zones,cls,cross,elabels,eol,tier,NIST,...},
  //            diff:{addedNodes,removedNodes,changedNodes,addedEdges,removedEdges} }
  return function renderCatalogSVG(cat, opts) {
    opts = opts || {};
    const layerIds = opts.layers || cat.layers.map(L => L.id);
    const activeLayers = cat.layers.filter(L => layerIds.includes(L.id));
    const scopes = (cat.meta && Array.isArray(cat.meta.scopes) && cat.meta.scopes.length)
      ? cat.meta.scopes.map((s, i) => Object.assign({ slot: i }, s))
      : [
        { id: 'NIST', t: 'NIST 800-53', c: '#b794f6', slot: 0 },
        { id: 'HIPAA', t: 'HIPAA · PHI', c: '#4dd0e1', slot: 1 },
        { id: 'ATO', t: 'Agency ATO', c: '#ffd166', slot: 2 }
      ];

    const zoneOf = k => cat.nodes[k] ? cat.nodes[k].zone : null;
    const m = cat.meta || {};
    const classification = m.classification || '';
    const classColor = m.classColor || '#3f5165';
    const BANNER_H = classification ? 24 : 0;
    const LEGEND_H = 130;
    const totalH = BANNER_H + VH + LEGEND_H;
    const cy = BANNER_H;

    const o = opts.overlays || { zones: true };
    const diff = opts.diff || null;
    const out = [];

    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${totalH}" width="${VW}" height="${totalH}">`);
    out.push(`<rect width="${VW}" height="${totalH}" fill="#080b11"/>`);

    // arrowhead markers
    out.push('<defs>');
    activeLayers.forEach(L => {
      const lc = rv(L.color);
      out.push(`<marker id="ar-${x(L.id)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${x(lc)}"/></marker>`);
    });
    if (diff) {
      out.push('<marker id="ar-dadd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#57cb8b"/></marker>');
      out.push('<marker id="ar-drem" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ff4d57"/></marker>');
    }
    out.push('</defs>');

    // top classification banner
    if (classification) {
      out.push(`<rect x="0" y="0" width="${VW}" height="${BANNER_H}" fill="${x(classColor)}"/>`);
      out.push(`<text x="${VW / 2}" y="${BANNER_H * 0.75}" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="11" font-weight="700" letter-spacing="4">${x(classification.toUpperCase())}</text>`);
    }

    // zone bands
    if (o.zones !== false) {
      cat.zones.forEach((z, i) => {
        const fill = i % 2 ? 'rgba(111,134,163,.06)' : 'rgba(111,134,163,.12)';
        out.push(`<rect x="8" y="${cy + z.y0}" width="${VW - 16}" height="${z.y1 - z.y0}" rx="8" fill="${fill}" stroke="rgba(111,134,163,.25)" stroke-dasharray="2 6"/>`);
        const lw = z.t.length * 6.0 + 12;
        out.push(`<rect x="12" y="${cy + z.y0 + 6}" width="${lw}" height="15" rx="3" fill="rgba(8,11,17,.6)"/>`);
        out.push(`<text x="18" y="${cy + z.y0 + 17}" fill="#6f86a3" font-family="monospace" font-size="10" letter-spacing="3">${x(z.t.toUpperCase())}</text>`);
      });
    }

    // edges
    activeLayers.forEach(L => {
      const lc = rv(L.color);
      L.edges.forEach(e => {
        const pa = cat.nodes[e.a], pb = cat.nodes[e.b];
        if (!pa || !pb) return;
        const cross = zoneOf(e.a) !== zoneOf(e.b);
        const dash = (CONN[e.conn] || CONN.lan).dash;
        const sw = L.id === 'skel' ? 2.6 : 1.8;
        const dir = e.dir || '->';
        let ln = `<line x1="${pa.x}" y1="${cy + pa.y}" x2="${pb.x}" y2="${cy + pb.y}" stroke="${x(lc)}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="${diff ? '0.18' : '0.65'}"`;
        if (dash) ln += ` stroke-dasharray="${dash}"`;
        if (dir.indexOf('>') >= 0) ln += ` marker-end="url(#ar-${x(L.id)})"`;
        if (dir.indexOf('<') >= 0) ln += ` marker-start="url(#ar-${x(L.id)})"`;
        out.push(ln + '/>');

        if (o.cross && cross) {
          const mx = (pa.x + pb.x) / 2, my = cy + (pa.y + pb.y) / 2;
          out.push(`<rect x="${mx - 5}" y="${my - 5}" width="10" height="10" fill="#ffffff" stroke="${x(lc)}" stroke-width="1.4" transform="rotate(45 ${mx} ${my})"/>`);
        }
        if (o.elabels && (e.proto || e.port)) {
          const lbl = (e.proto || '') + (e.port ? ' ' + e.port : '');
          const mx = (pa.x + pb.x) / 2, my = cy + (pa.y + pb.y) / 2;
          const tw = lbl.length * 4.7 + 8;
          out.push(`<rect x="${mx - tw / 2}" y="${my - 7}" width="${tw}" height="13" rx="3" fill="rgba(8,11,17,.85)"/>`);
          out.push(`<text x="${mx}" y="${my + 2.5}" text-anchor="middle" fill="#ece4d2" font-family="monospace" font-size="8">${x(lbl)}</text>`);
        }
      });
    });

    // diff edge overlays
    if (diff) {
      (diff.removedEdges || []).forEach(({ e, nodes }) => {
        const pa = nodes[e.a], pb = nodes[e.b];
        if (!pa || !pb) return;
        out.push(`<line x1="${pa.x}" y1="${cy + pa.y}" x2="${pb.x}" y2="${cy + pb.y}" stroke="#ff4d57" stroke-width="1.8" fill="none" stroke-dasharray="5 4" opacity="0.7" marker-end="url(#ar-drem)"/>`);
      });
      (diff.addedEdges || []).forEach(({ e }) => {
        const pa = cat.nodes[e.a], pb = cat.nodes[e.b];
        if (!pa || !pb) return;
        out.push(`<line x1="${pa.x}" y1="${cy + pa.y}" x2="${pb.x}" y2="${cy + pb.y}" stroke="#57cb8b" stroke-width="2.2" fill="none" opacity="0.9" marker-end="url(#ar-dadd)"/>`);
      });
    }

    // nodes
    Object.keys(cat.nodes).forEach(k => {
      const n = cat.nodes[k];
      const clsColor = (CLS[n.cls] || CLS.int).c;
      const tc = TIER[n.tier] || TIER[3];
      const nodeOpacity = diff ? '0.22' : '1';

      (n.scopes || []).forEach(sc => {
        const sd = scopes.find(z => z.id === sc);
        if (!sd || !o[sc]) return;
        const off = 6 + sd.slot * 5;
        out.push(`<rect x="${n.x - BW / 2 - off}" y="${cy + n.y - BH / 2 - off}" width="${BW + off * 2}" height="${BH + off * 2}" rx="${10 + off}" fill="none" stroke="${x(rv(sd.c))}" stroke-width="1.4" stroke-dasharray="5 5" opacity="0.9"/>`);
      });

      if (o.cls) {
        out.push(`<circle cx="${n.x}" cy="${cy + n.y}" r="${BW / 2 + 3}" fill="none" stroke="${x(clsColor)}" stroke-width="2" opacity="0.7"/>`);
      }
      if (o.tier) {
        out.push(`<rect x="${n.x - BW / 2}" y="${cy + n.y - BH / 2}" width="4" height="${BH}" rx="2" fill="${x(tc.c)}" opacity="0.9"/>`);
      }

      out.push(`<rect x="${n.x - BW / 2}" y="${cy + n.y - BH / 2}" width="${BW}" height="${BH}" rx="9" fill="rgba(15,22,32,.55)" stroke="rgba(236,228,210,.16)" stroke-width="1" opacity="${nodeOpacity}"/>`);

      const ico = ICONS[iconFor(n, k)];
      out.push(`<g transform="translate(${n.x - BW / 2 + 8},${cy + n.y - BH / 2 + 5}) scale(0.78)" opacity="${nodeOpacity}"><path d="${x(ico)}" fill="none" stroke="rgba(236,228,210,.5)" stroke-width="1.35" stroke-linejoin="round" stroke-linecap="round"/></g>`);

      out.push(`<text x="${n.x}" y="${cy + n.y - 1}" text-anchor="middle" fill="#ece4d2" font-family="system-ui,-apple-system,sans-serif" font-size="12.5" font-weight="500" opacity="${nodeOpacity}">${x(n.l)}</text>`);
      out.push(`<text x="${n.x}" y="${cy + n.y + 13}" text-anchor="middle" fill="rgba(236,228,210,.52)" font-family="monospace" font-size="8.5" letter-spacing="1" opacity="${nodeOpacity}">${x(k.toUpperCase())}</text>`);

      if (o.tier) {
        out.push(`<text x="${n.x - BW / 2 + 9}" y="${cy + n.y + BH / 2 - 5}" fill="#ece4d2" font-family="monospace" font-size="8" opacity="0.9">T${n.tier}</text>`);
      }
      if (o.eol) {
        const st = eolStatus(n.eol);
        out.push(`<circle cx="${n.x + BW / 2 - 7}" cy="${cy + n.y - BH / 2 + 7}" r="5" fill="${st.c}" stroke="#0a0e14" stroke-width="1.4"/>`);
      }
    });

    // diff node overlays
    if (diff) {
      (diff.removedNodes || []).forEach(({ k, n }) => {
        out.push(`<rect x="${n.x - BW / 2}" y="${cy + n.y - BH / 2}" width="${BW}" height="${BH}" rx="9" fill="rgba(255,77,87,.07)" stroke="#ff4d57" stroke-width="1.6" stroke-dasharray="5 4" opacity="0.85"/>`);
        out.push(`<text x="${n.x}" y="${cy + n.y - 1}" text-anchor="middle" fill="#ff4d57" font-family="system-ui,-apple-system,sans-serif" font-size="12" opacity="0.75">${x(n.l)}</text>`);
        out.push(`<text x="${n.x}" y="${cy + n.y + 13}" text-anchor="middle" fill="#ff4d57" font-family="monospace" font-size="8" opacity="0.7">${x(k.toUpperCase())} · REMOVED</text>`);
      });
      (diff.addedNodes || []).forEach(k => {
        const n = cat.nodes[k]; if (!n) return;
        out.push(`<rect x="${n.x - BW / 2 - 3}" y="${cy + n.y - BH / 2 - 3}" width="${BW + 6}" height="${BH + 6}" rx="11" fill="rgba(87,203,139,.1)" stroke="#57cb8b" stroke-width="2.2" opacity="0.95"/>`);
        out.push(`<text x="${n.x + BW / 2 - 4}" y="${cy + n.y - BH / 2 + 11}" text-anchor="end" fill="#57cb8b" font-family="monospace" font-size="8" font-weight="700">+NEW</text>`);
      });
      (diff.changedNodes || []).forEach(k => {
        const n = cat.nodes[k]; if (!n) return;
        out.push(`<rect x="${n.x - BW / 2 - 3}" y="${cy + n.y - BH / 2 - 3}" width="${BW + 6}" height="${BH + 6}" rx="11" fill="rgba(255,177,77,.08)" stroke="#ffb14d" stroke-width="2" opacity="0.95"/>`);
        out.push(`<text x="${n.x + BW / 2 - 4}" y="${cy + n.y - BH / 2 + 11}" text-anchor="end" fill="#ffb14d" font-family="monospace" font-size="8" font-weight="700">~MOD</text>`);
      });
    }

    // legend strip
    const ly = cy + VH + 8;
    out.push(`<rect x="0" y="${cy + VH}" width="${VW}" height="${LEGEND_H}" fill="#080d14"/>`);
    out.push(`<line x1="0" y1="${cy + VH}" x2="${VW}" y2="${cy + VH}" stroke="rgba(236,228,210,.1)"/>`);

    let lx = 18;
    activeLayers.forEach(L => {
      const lc = rv(L.color);
      out.push(`<rect x="${lx}" y="${ly + 10}" width="10" height="10" rx="2" fill="${x(lc)}"/>`);
      out.push(`<text x="${lx + 14}" y="${ly + 20}" fill="#ece4d2" font-family="monospace" font-size="9">${x(L.arch.toUpperCase())}</text>`);
      lx += Math.max(L.arch.length * 6 + 28, 90);
    });

    lx = 18;
    Object.keys(CLS).forEach(c => {
      out.push(`<rect x="${lx}" y="${ly + 38}" width="8" height="8" rx="2" fill="${x(CLS[c].c)}"/>`);
      out.push(`<text x="${lx + 12}" y="${ly + 46}" fill="rgba(236,228,210,.7)" font-family="monospace" font-size="9">${x(CLS[c].t)}</text>`);
      lx += CLS[c].t.length * 5.8 + 22;
    });

    if (diff) {
      lx = 18;
      const ly3 = ly + 62;
      [['#57cb8b', '+', 'ADDED'], ['#ffb14d', '~', 'CHANGED'], ['#ff4d57', '−', 'REMOVED']].forEach(([c, , t]) => {
        out.push(`<rect x="${lx}" y="${ly3}" width="8" height="8" rx="2" fill="${c}" opacity="0.85"/>`);
        out.push(`<text x="${lx + 12}" y="${ly3 + 8}" fill="${c}" font-family="monospace" font-size="9" opacity="0.9">${t}</text>`);
        lx += 80;
      });
    }

    const tx = VW - 18;
    out.push(`<text x="${tx}" y="${ly + 16}" text-anchor="end" fill="#ece4d2" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="500">${x(m.title || '')}</text>`);
    out.push(`<text x="${tx}" y="${ly + 30}" text-anchor="end" fill="rgba(236,228,210,.52)" font-family="monospace" font-size="9">${x(m.system || '')}</text>`);
    out.push(`<text x="${tx}" y="${ly + 44}" text-anchor="end" fill="rgba(236,228,210,.52)" font-family="monospace" font-size="9">v${x(m.version || '—')} · ${x(m.updated || '')} · ${x(m.author || '')}</text>`);
    if (classification) {
      out.push(`<text x="${tx}" y="${ly + 58}" text-anchor="end" fill="rgba(236,228,210,.52)" font-family="monospace" font-size="9">${x(classification)}</text>`);
    }

    const nodeCount = Object.keys(cat.nodes).length;
    const edgeCount = activeLayers.reduce((a, L) => a + L.edges.length, 0);
    out.push(`<text x="${VW / 2}" y="${cy + VH + LEGEND_H - 10}" text-anchor="middle" fill="rgba(236,228,210,.22)" font-family="monospace" font-size="8">${nodeCount} components · ${edgeCount} connections · Architecture Anatomy</text>`);

    if (classification) {
      out.push(`<rect x="0" y="${totalH - BANNER_H}" width="${VW}" height="${BANNER_H}" fill="${x(classColor)}"/>`);
      out.push(`<text x="${VW / 2}" y="${totalH - 7}" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="11" font-weight="700" letter-spacing="4">${x(classification.toUpperCase())}</text>`);
    }

    out.push('</svg>');
    return out.join('\n');
  };
});
