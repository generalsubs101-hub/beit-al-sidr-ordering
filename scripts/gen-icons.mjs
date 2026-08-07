import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const INK = [0x0a, 0x4a, 0x2a];
const LIGHT = [0xd8, 0xa8, 0x3f]; // brass/gold — lit facet of the twist
const DARK = [0x6f, 0x7a, 0x38]; // olive — shadow facet of the twist

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

// mirrors the inline <Thyme/> SVG (viewBox 0 0 24 24): a single tapered blade
// following an S-curved spine, split into bands at the true twist fold-lines
// and shaded alternately light/dark so it reads as a leaf twisting in 3D
const TWISTS = 1.15;
const AMP = 2.6;
const MAXW = 6.4;
const PHASE = -0.35;

function centerline(s) {
  return [12 + AMP * Math.sin(s * TWISTS * Math.PI * 2 + PHASE), 22 - 20 * s];
}
function widthAt(s) {
  return MAXW * Math.sin(Math.PI * s);
}
function deriv(s, h = 0.001) {
  const [x0, y0] = centerline(Math.max(0, s - h));
  const [x1, y1] = centerline(Math.min(1, s + h));
  return [x1 - x0, y1 - y0];
}
function normal(s) {
  const [dx, dy] = deriv(s);
  const len = Math.hypot(dx, dy) || 1;
  return [-dy / len, dx / len];
}
function edgePoint(s, side) {
  const [cx, cy] = centerline(s);
  const [nx, ny] = normal(s);
  const w = widthAt(s) / 2;
  return [cx + nx * w * side, cy + ny * w * side];
}
function twistSign(s) {
  return Math.sin(s * TWISTS * Math.PI * 2 + PHASE) >= 0 ? 1 : -1;
}

const boundaries = [0];
for (let k = -4; k <= 8; k++) {
  const s = (k * Math.PI - PHASE) / (TWISTS * Math.PI * 2);
  if (s > 1e-6 && s < 1 - 1e-6) boundaries.push(s);
}
boundaries.push(1);
boundaries.sort((a, b) => a - b);

const SUB = 14;
const BANDS = [];
for (let i = 0; i < boundaries.length - 1; i++) {
  const s0 = boundaries[i], s1 = boundaries[i + 1];
  const left = [], right = [];
  for (let k = 0; k <= SUB; k++) {
    const s = s0 + (s1 - s0) * (k / SUB);
    left.push(edgePoint(s, 1));
    right.push(edgePoint(s, -1));
  }
  BANDS.push({ poly: [...left, ...right.reverse()], sign: twistSign((s0 + s1) / 2) });
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function thymeColor(designX, designY) {
  for (const b of BANDS) {
    if (pointInPoly(designX, designY, b.poly)) return b.sign > 0 ? LIGHT : DARK;
  }
  return null;
}

function makePng(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const circleR = size * (maskable ? 0.44 : 0.47);
  const artSize = circleR * 2 * 0.8; // 24x24 design box mapped into this span
  const scale = artSize / 24;
  const originX = cx - artSize / 2;
  const originY = cy - artSize / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const inCircle = dx * dx + dy * dy <= circleR * circleR;
      let color;
      if (!inCircle) {
        color = maskable ? INK : null; // null = transparent
      } else {
        const designX = (x + 0.5 - originX) / scale;
        const designY = (y + 0.5 - originY) / scale;
        color = thymeColor(designX, designY) || INK;
      }
      if (color) {
        buf[i] = color[0]; buf[i + 1] = color[1]; buf[i + 2] = color[2]; buf[i + 3] = 255;
      } else {
        buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
      }
    }
  }

  // raw scanlines with filter-byte 0 prefix per row
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    buf.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.resolve("public/icons");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { size: 192, name: "icon-192.png", maskable: false },
  { size: 512, name: "icon-512.png", maskable: false },
  { size: 512, name: "icon-512-maskable.png", maskable: true },
  { size: 180, name: "apple-touch-icon.png", maskable: false },
];

for (const t of targets) {
  fs.writeFileSync(path.join(outDir, t.name), makePng(t.size, { maskable: t.maskable }));
  console.log("wrote", t.name);
}
