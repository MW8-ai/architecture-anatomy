// Generates icon-192.png and icon-512.png using only Node built-ins
// Dark background (#080b11) with a simple three-plate motif in teal
'use strict';
const fs = require('fs');
const zlib = require('zlib');

function writePNG(filename, size) {
  const w = size, h = size;

  // Build raw RGBA pixel data
  const pixels = Buffer.alloc(w * h * 4);
  const bg   = [8, 11, 17, 255];
  const teal = [52, 214, 192, 255];
  const red  = [232, 87, 79, 220];
  const gold = [200, 160, 64, 200];
  const node = [52, 214, 192, 46];

  function setpx(x, y, c) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    pixels[i]=c[0]; pixels[i+1]=c[1]; pixels[i+2]=c[2]; pixels[i+3]=c[3];
  }
  function fillRect(x0, y0, rw, rh, c) {
    for (let y = y0; y < y0 + rh; y++)
      for (let x = x0; x < x0 + rw; x++) setpx(x, y, c);
  }
  function strokeRect(x0, y0, rw, rh, c, t) {
    for (let i = 0; i < t; i++) {
      for (let x = x0+i; x < x0+rw-i; x++) { setpx(x, y0+i, c); setpx(x, y0+rh-1-i, c); }
      for (let y = y0+i; y < y0+rh-i; y++) { setpx(x0+i, y, c); setpx(x0+rw-1-i, y, c); }
    }
  }
  function line(x0, y0, x1, y1, c) {
    const dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    while (true) { setpx(x, y, c); if (x===x1&&y===y1) break;
      const e2=2*err; if(e2>-dy){err-=dy;x+=sx;} if(e2<dx){err+=dx;y+=sy;} }
  }

  // Fill background
  fillRect(0, 0, w, h, bg);

  // Rounded-rect background approximation (just fill, then we'll draw plates)
  const m = Math.round(size * 0.12);  // margin
  const pw = w - m * 2;               // plate width

  // Three horizontal plates
  const plateH   = Math.round(size * 0.085);
  const plateGap = Math.round(size * 0.07);
  const y1 = Math.round(size * 0.28);
  const y2 = y1 + plateH + plateGap;
  const y3 = y2 + plateH + plateGap;
  const t  = Math.max(2, Math.round(size * 0.012));

  strokeRect(m, y1, pw, plateH, teal, t);
  strokeRect(m, y2, pw, plateH, red,  t);
  strokeRect(m, y3, pw, plateH, gold, t);

  // Node boxes on top plate
  const nw = Math.round(pw * 0.2), nh = Math.round(plateH * 0.55);
  const ny = y1 + Math.round((plateH - nh) / 2);
  const nx1 = m + Math.round(pw * 0.07);
  const nx2 = m + Math.round(pw * 0.4);
  const nx3 = m + Math.round(pw * 0.73);
  fillRect(nx1, ny, nw, nh, node);
  fillRect(nx2, ny, nw, nh, node);
  fillRect(nx3, ny, nw, nh, node);

  // Connecting lines between nodes (on top plate)
  const cy = ny + Math.round(nh / 2);
  line(nx1 + nw, cy, nx2, cy, teal);
  line(nx2 + nw, cy, nx3, cy, teal);

  // Vertical dashed connectors between plates
  const vcx = [nx1+Math.round(nw/2), nx2+Math.round(nw/2), nx3+Math.round(nw/2)];
  for (const vx of vcx) {
    for (let y = y1 + plateH; y < y2; y += 4) setpx(vx, y, [236, 234, 210, 60]);
    for (let y = y2 + plateH; y < y3; y += 4) setpx(vx, y, [236, 234, 210, 60]);
  }

  // --- PNG encoding ---
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t   = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([t, data]));
    const c   = Buffer.alloc(4); c.writeInt32BE(crc);
    return Buffer.concat([len, t, data, c]);
  }

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    return (c ^ 0xFFFFFFFF) | 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0; // 8-bit RGBA

  // Raw scanlines: filter byte (0) + RGBA row
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter type None
    pixels.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(filename, png);
  console.log(`wrote ${filename} (${size}x${size}, ${png.length} bytes)`);
}

writePNG('icon-192.png', 192);
writePNG('icon-512.png', 512);
