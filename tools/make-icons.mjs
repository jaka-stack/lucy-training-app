/* Generates the app icons.

   The mark is the rest timer's ring — the most recognisable thing in the app —
   drawn three-quarters full in ember on the slate ground. Run with:

       node tools/make-icons.mjs

   Writes PNGs into public/. Only needs re-running if the mark or the palette
   changes. Hand-rolled rather than pulled from an image library: it is about
   sixty lines, and it keeps a build dependency out of the project. */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public');
mkdirSync(outDir, { recursive: true });

// Straight from styles/tokens.css.
const GROUND = [0x17, 0x13, 0x1a];
const EMBER = [0xff, 0x6a, 0x2b];
const LINE = [0x3a, 0x32, 0x43];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function png(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  // rows are prefixed with a filter byte (0 = none)
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixels(x, y);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
    }
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Blend two colours, for cheap anti-aliasing on the ring edges. */
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function ring(size, { padding }) {
  const c = size / 2;
  const outer = size / 2 - padding;
  const thickness = size * 0.115;
  const inner = outer - thickness;

  return (x, y) => {
    const dx = x + 0.5 - c;
    const dy = y + 0.5 - c;
    const dist = Math.hypot(dx, dy);

    // Distance to the band, in pixels — used to soften the two edges.
    const edge = Math.min(dist - inner, outer - dist);
    if (edge < -1) return GROUND;

    // Angle, starting at 12 o'clock and going clockwise like the timer.
    let angle = Math.atan2(dx, -dy);
    if (angle < 0) angle += Math.PI * 2;

    // Three-quarters ember, the last quarter the unfilled track.
    const filled = angle <= Math.PI * 1.5;
    const colour = filled ? EMBER : LINE;

    const alpha = Math.max(0, Math.min(1, edge + 0.5));
    return mix(GROUND, colour, alpha);
  };
}

for (const size of [192, 512]) {
  // A little breathing room; the maskable version needs much more, because
  // Android crops icons to whatever shape the launcher uses.
  writeFileSync(
    join(outDir, `icon-${size}.png`),
    png(size, ring(size, { padding: size * 0.16 })),
  );
  console.log(`public/icon-${size}.png`);
}

writeFileSync(
  join(outDir, 'icon-maskable-512.png'),
  png(512, ring(512, { padding: 512 * 0.27 })),
);
console.log('public/icon-maskable-512.png');

// iOS uses this one for the home screen.
writeFileSync(
  join(outDir, 'apple-touch-icon.png'),
  png(180, ring(180, { padding: 180 * 0.16 })),
);
console.log('public/apple-touch-icon.png');
