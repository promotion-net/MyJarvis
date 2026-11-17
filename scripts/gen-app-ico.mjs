// Generator for `public/app.ico` of the desktop shell: MyJarvis brand mark.
// Rounded green gradient square + white "M" polyline, supersampled, BMP ICO entries.
// Run from the repo root: `node scripts/gen-app-ico.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SS = 8; // supersample factor
const TOP = [0x23, 0xe3, 0x8a];
const BOTTOM = [0x0f, 0xa9, 0x68];

function sample(x, y, size) {
    // Normalized coords in [0,1].
    const u = x / size;
    const v = y / size;
    // Rounded rect: inset 0.04, radius 0.22.
    const inset = 0.04;
    const r = 0.22;
    const inRect = (p, q) => {
        if (p < inset || p > 1 - inset || q < inset || q > 1 - inset) return false;
        const rx = Math.min(Math.max(p, inset + r), 1 - inset - r);
        const ry = Math.min(Math.max(q, inset + r), 1 - inset - r);
        const dx = p - rx;
        const dy = q - ry;
        return dx * dx + dy * dy <= r * r || (p >= inset + r && p <= 1 - inset - r) || (q >= inset + r && q <= 1 - inset - r);
    };
    if (!inRect(u, v)) return null;
    // Gradient by vertical position.
    const t = (v - inset) / (1 - 2 * inset);
    const bg = [
        TOP[0] + (BOTTOM[0] - TOP[0]) * t,
        TOP[1] + (BOTTOM[1] - TOP[1]) * t,
        TOP[2] + (BOTTOM[2] - TOP[2]) * t,
    ];
    // White M polyline through these normalized points, stroke half-width:
    const pts = [
        [0.28, 0.7],
        [0.28, 0.3],
        [0.5, 0.55],
        [0.72, 0.3],
        [0.72, 0.7],
    ];
    const half = 0.075;
    let d = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
        d = Math.min(d, distToSegment(u, v, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
    }
    if (d <= half) {
        // Soft edge for anti-aliased look after downsampling.
        const edge = half - d;
        const w = Math.min(1, edge / 0.03);
        return [255 * w + bg[0] * (1 - w), 255 * w + bg[1] * (1 - w), 255 * w + bg[2] * (1 - w)];
    }
    return bg;
}

function distToSegment(px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const len2 = vx * vx + vy * vy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
    const dx = wx - vx * t;
    const dy = wy - vy * t;
    return Math.sqrt(dx * dx + dy * dy);
}

function renderBmp(size) {
    // Supersample into float RGBA then average.
    const big = size * SS;
    const acc = new Float64Array(size * size * 4);
    for (let by = 0; by < big; by++) {
        for (let bx = 0; bx < big; bx++) {
            const c = sample(bx, by, big);
            const px = Math.floor(bx / SS);
            const py = Math.floor(by / SS);
            const o = (py * size + px) * 4;
            if (c) {
                acc[o] += c[0];
                acc[o + 1] += c[1];
                acc[o + 2] += c[2];
                acc[o + 3] += 255;
            }
        }
    }
    const div = SS * SS;
    // BMP is bottom-up; BGRA no alpha-premultiply (icon XOR mask uses straight alpha).
    const data = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const o = (y * size + x) * 4;
            const src = ((size - 1 - y) * size + x) * 4;
            const a = acc[src + 3] / div;
            // Color sums accumulate R/G/B per covered subsample; alpha sums accumulate 255
            // per covered subsample, so the true average color is sum * 255 / alphaSum.
            const scale = a > 0 ? 255 / acc[src + 3] : 0;
            data[o] = Math.round(acc[src + 2] * scale); // B
            data[o + 1] = Math.round(acc[src + 1] * scale); // G
            data[o + 2] = Math.round(acc[src] * scale); // R
            data[o + 3] = Math.round(a); // A
        }
    }
    // BITMAPINFOHEADER (height doubled: XOR + AND mask) + AND mask rows (all zero).
    const header = Buffer.alloc(40);
    header.writeInt32LE(40, 0);
    header.writeInt32LE(size, 4);
    header.writeInt32LE(size * 2, 8);
    header.writeUInt16LE(1, 12);
    header.writeUInt16LE(32, 14);
    header.writeInt32LE(0, 16);
    header.writeInt32LE(size * size * 4 + Math.ceil(size / 32) * 4 * size, 20);
    const mask = Buffer.alloc(Math.ceil(size / 32) * 4 * size);
    return Buffer.concat([header, data, mask]);
}

function buildIco(sizes) {
    const count = sizes.length;
    const dir = Buffer.alloc(6 + 16 * count);
    dir.writeUInt16LE(0, 0);
    dir.writeUInt16LE(1, 2); // icon
    dir.writeUInt16LE(count, 4);
    let offset = 6 + 16 * count;
    const bodies = [];
    sizes.forEach((size, i) => {
        const bmp = renderBmp(size);
        const e = 6 + 16 * i;
        dir.writeUInt8(size === 256 ? 0 : size, e);
        dir.writeUInt8(size === 256 ? 0 : size, e + 1);
        dir.writeUInt8(0, e + 2);
        dir.writeUInt8(0, e + 3);
        dir.writeUInt16LE(1, e + 4);
        dir.writeUInt16LE(32, e + 6);
        dir.writeUInt32LE(bmp.length, e + 8);
        dir.writeUInt32LE(offset, e + 12);
        offset += bmp.length;
        bodies.push(bmp);
    });
    return Buffer.concat([dir, ...bodies]);
}

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const out = path.join(repoRoot, 'projects', 'packages', 'my-jarvis-desktop-ui', 'public');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'app.ico'), buildIco([16, 32, 48]));
console.log('wrote public/app.ico');
