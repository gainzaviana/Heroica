import type { EyeSpec, Sculpt, Shape, V3 } from "../sculpt";
import { SKIN, burst, rad } from "./kit";

// Baluarte, Custodio del Umbral and Sibila del Caos — art batch 2.
// Baluarte (Teniente Marcos Alcalá): a broad veteran in a steel-blue (#2f6f8f) padded gambeson with
// bronze pauldrons and trim, grey-streaked brown hair. His Égida de Bronce is a bronze heater shield
// embossed with a plain tower. Original designs only.

// MARK: Helpers

type M3 = number[];
const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function mul(a: M3, b: M3): M3 {
  const o: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
  return o;
}
const rx = (d: number): M3 => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const ry = (d: number): M3 => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rz = (d: number): M3 => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
/** Euler XYZ (degrees, three.js order) to a row-major matrix, and back. */
function fromEuler(e: V3): M3 { return mul(mul(rx(e[0]), ry(e[1])), rz(e[2])); }
function toEuler(m: M3): V3 {
  const d = (x: number) => (x * 180) / Math.PI;
  const y = Math.asin(Math.max(-1, Math.min(1, m[2])));
  if (Math.abs(m[2]) < 0.9999999) return [d(Math.atan2(-m[5], m[8])), d(y), d(Math.atan2(-m[1], m[0]))];
  return [d(Math.atan2(m[7], m[4])), d(y), 0];
}
const app = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];

/** Rigid transform (scale s, then rotation R, then move t) of any shapes; mirrored pairs are expanded first. */
function xf(shapes: Shape[], o: { s?: number; R?: M3; t?: V3 }): Shape[] {
  const s = o.s ?? 1, R = o.R ?? I3, t = o.t ?? [0, 0, 0];
  const p = (v: V3): V3 => { const q = app(R, [v[0] * s, v[1] * s, v[2] * s]); return [q[0] + t[0], q[1] + t[1], q[2] + t[2]]; };
  const flat: Shape[] = [];
  for (const sh of shapes) {
    const { mirror, ...rest } = sh;
    flat.push(rest as Shape);
    if (mirror) {
      const m = (v: V3): V3 => [v[0], v[1], -v[2]];
      const r = sh.rot ?? [0, 0, 0];
      if (sh.t === "cap") flat.push({ ...(rest as Shape & { t: "cap" }), a: m(sh.a), b: m(sh.b) });
      else flat.push({ ...(rest as Shape), c: m((sh as { c: V3 }).c), rot: [-r[0], -r[1], r[2]] } as Shape);
    }
  }
  return flat.map((sh): Shape => {
    const k = sh.k === undefined ? {} : { k: sh.k * s };
    if (sh.t === "cap") return { ...sh, ...k, a: p(sh.a), b: p(sh.b), r: [sh.r[0] * s, sh.r[1] * s] };
    const rot = toEuler(mul(R, fromEuler(sh.rot ?? [0, 0, 0])));
    switch (sh.t) {
      case "ell": return { ...sh, ...k, rot, c: p(sh.c), r: [sh.r[0] * s, sh.r[1] * s, sh.r[2] * s] };
      case "box": return { ...sh, ...k, rot, c: p(sh.c), s: [sh.s[0] * s, sh.s[1] * s, sh.s[2] * s], round: sh.round * s };
      case "tor": return { ...sh, ...k, rot, c: p(sh.c), R: sh.R * s, r: sh.r * s };
    }
  });
}
const xfPt = (v: V3, o: { s?: number; R?: M3; t?: V3 }): V3 => { const s = o.s ?? 1, t = o.t ?? [0, 0, 0]; const q = app(o.R ?? I3, [v[0] * s, v[1] * s, v[2] * s]); return [q[0] + t[0], q[1] + t[1], q[2] + t[2]]; };

/** Capsules through a list of points, radius tapering from r0 to r1. */
function chain(pts: V3[], r0: number, r1: number, col: string, k = 0.01, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
  }
  return out;
}

/** Points on a quadratic Bézier curve. */
function bez(p0: V3, p1: V3, p2: V3, n = 10): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1, 2].map((j) => u * u * p0[j] + 2 * u * t * p1[j] + t * t * p2[j]) as V3);
  }
  return out;
}

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}
const dot = (c: V3, r: number, col: string, k = 0): Shape => ({ t: "ell", c, r: [r, r, r], col, k });

/**
 * The Égida de Bronce: a bronze heater shield in its own frame, face toward +x, up +y, about 0.95
 * tall centred on the origin. A raised rim and a raised plain tower. Contains cuts, so it must come
 * FIRST in a design's shape list.
 */
function egida(): Shape[] {
  const rim: V3[] = [[0.05, 0.375, -0.3], [0.05, 0.375, 0.3], [0.05, 0.3, 0.325], [0.05, 0.08, 0.33], [0.05, -0.12, 0.27], [0.05, -0.3, 0.16], [0.05, -0.47, 0.0]];
  const rimAll: V3[] = [...rim, ...rim.slice(0, -1).reverse().map(([x, y, z]): V3 => [x, y, -z])];
  const raised: Shape[] = [
    ...chain(rimAll, 0.03, 0.03, "rim", 0.01),
    { t: "box", c: [0.055, -0.02, 0], s: [0.032, 0.17, 0.08], round: 0.01, col: "tower", k: 0.01 },
    { t: "box", c: [0.06, 0.17, 0], s: [0.032, 0.04, 0.112], round: 0.01, col: "tower", k: 0.008 },
    ...[-0.08, 0, 0.08].map((z): Shape => ({ t: "box", c: [0.06, 0.245, z], s: [0.03, 0.038, 0.027], round: 0.008, col: "tower", k: 0.004 })),
    { t: "box", c: [0.06, -0.2, 0], s: [0.03, 0.032, 0.118], round: 0.01, col: "tower", k: 0.008 },
  ];
  return [
    { t: "cap", a: [0, 0.06, 0], b: [0, -0.46, 0], r: [0.34, 0.035], col: "bronze", k: 0 },
    { t: "box", c: [0, 0.22, 0], s: [0.2, 0.18, 0.335], round: 0.03, col: "bronze", k: 0.05 },
    // flat top and a shallow plate
    { t: "box", c: [0, 0.4 + 0.5, 0], s: [0.6, 0.5, 0.6], round: 0, col: "bronze", cut: true, k: 0.03 },
    { t: "box", c: [0.25, 0, 0], s: [0.2, 0.6, 0.5], round: 0, col: "bronze", cut: true, k: 0.02 },
    { t: "box", c: [-0.25, 0, 0], s: [0.2, 0.6, 0.5], round: 0, col: "bronze", cut: true, k: 0.02 },
    // a soft sheen on the upper face
    { t: "ell", c: [0.05, 0.22, -0.16], r: [0.08, 0.12, 0.08], rot: [-35, 0, 0], col: "bronzeLt", paint: true },
    // raised rim and tower (repeated as paint so their colour wins over the plate underneath)
    ...raised,
    ...raised.map((sh): Shape => ({ ...sh, paint: true })),
    { t: "cap", a: [0.1, -0.15, 0], b: [0.1, -0.07, 0], r: [0.032, 0.032], col: "bronzeDk", paint: true },
    { t: "box", c: [0.1, 0.06, 0], s: [0.03, 0.032, 0.016], round: 0.006, col: "bronzeDk", paint: true },
  ];
}
const BRONZE = { bronze: "#b8742a", bronzeLt: "#dda255", bronzeDk: "#5a3510", rim: "#7a4a16", tower: "#ffe0a0" };
const BAL = { ...BRONZE, gamb: "#2f6f8f", gambDk: "#1f4e66", gambLt: "#4a8cab", skin: SKIN, hair: "#6a4a30", grey: "#b0aaa2", legs: "#3a3a44", boots: "#4a3020", glove: "#5e3c22", mouth: "#7a3a30", brow: "#4a3220" };

/** Baluarte's padded, broad upper body (no arms, no legs): torso, quilting, belt, pauldrons, head. Facing +x. */
function baluarteTop(): Shape[] {
  return [
    { t: "ell", c: [0.02, 0.42, 0], r: [0.15, 0.17, 0.2], col: "gamb" },
    ...[-0.1, -0.035, 0.035, 0.1].map((z): Shape => ({ t: "box", c: [0.13, 0.43, z], s: [0.06, 0.11, 0.008], round: 0.004, col: "gambDk", paint: true })),
    { t: "box", c: [0.13, 0.43, 0], s: [0.06, 0.007, 0.16], round: 0.004, col: "gambDk", paint: true },
    { t: "ell", c: [0.02, 0.29, 0], r: [0.135, 0.032, 0.18], col: "bronze", k: 0.015 },
    { t: "box", c: [0.15, 0.29, 0], s: [0.014, 0.03, 0.035], round: 0.008, col: "bronzeLt", k: 0.005 },
    { t: "ell", c: [0.02, 0.24, 0], r: [0.13, 0.05, 0.17], col: "gambDk", k: 0.02 },
    // bronze collar and pauldrons
    { t: "tor", c: [0.02, 0.56, 0], R: 0.09, r: 0.028, col: "bronze", k: 0.02 },
    { t: "ell", c: [0.0, 0.54, 0.19], r: [0.11, 0.075, 0.09], rot: [-22, 0, 0], col: "bronze", k: 0.02, mirror: true },
    { t: "ell", c: [0.0, 0.5, 0.235], r: [0.1, 0.04, 0.06], rot: [-30, 0, 0], col: "rim", k: 0.01, mirror: true },
    // head: square jaw, cropped brown hair greying at the temples
    { t: "ell", c: [0.03, 0.72, 0], r: [0.18, 0.175, 0.175], col: "skin", k: 0.06 },
    { t: "ell", c: [0.1, 0.63, 0], r: [0.1, 0.07, 0.12], col: "skin", k: 0.05 },
    { t: "ell", c: [-0.03, 0.8, 0], r: [0.17, 0.12, 0.18], col: "hair", k: 0.02 },
    { t: "ell", c: [0.08, 0.86, 0], r: [0.1, 0.045, 0.15], rot: [0, 0, -10], col: "hair", k: 0.02 },
    { t: "ell", c: [0.0, 0.76, 0.16], r: [0.05, 0.045, 0.03], col: "grey", paint: true, mirror: true },
    { t: "cap", a: [0.06, 0.88, 0.05], b: [-0.08, 0.86, 0.09], r: [0.016, 0.014], col: "grey", paint: true },
    // stubble shadow, firm brows and mouth
    { t: "ell", c: [0.15, 0.6, 0], r: [0.06, 0.04, 0.11], col: "hair", paint: true },
    { t: "cap", a: [0.19, 0.78, 0.02], b: [0.17, 0.77, 0.115], r: [0.014, 0.012], col: "brow", paint: true },
    { t: "cap", a: [0.2, 0.78, -0.02], b: [0.18, 0.775, -0.1], r: [0.014, 0.012], col: "brow", paint: true },
    { t: "cap", a: [0.205, 0.64, -0.03], b: [0.2, 0.64, 0.06], r: [0.009, 0.009], col: "mouth", paint: true },
  ];
}
const BAL_EYES = (o: { s?: number; R?: M3; t?: V3 }, r = 0.048): EyeSpec[] => [
  { at: xfPt([0.06, 0.715, 0.085], o), r, iris: "#4a6a7a", angry: true, look: app(o.R ?? I3, [0.75, 0.04, 0.6]) },
  { at: xfPt([0.06, 0.715, -0.045], o), r: r * 0.92, iris: "#4a6a7a", angry: true, look: app(o.R ?? I3, [0.97, 0.04, 0.22]) },
];

/** A clenched gloved fist (knuckles toward +x), forearm cuff behind it. */
function fist(glove: string, cuff: string): Shape[] {
  return [
    { t: "cap", a: [-0.34, 0, 0], b: [-0.16, 0, 0], r: [0.1, 0.11], col: cuff, k: 0.03 },
    { t: "box", c: [-0.01, 0, -0.01], s: [0.13, 0.13, 0.1], round: 0.08, col: glove, k: 0.05 },
    ...[0.09, 0.03, -0.03, -0.09].flatMap((y): Shape[] => [
      { t: "ell", c: [0.12, y, 0.0], r: [0.055, 0.036, 0.08], col: glove, k: 0.012 },
      { t: "cap", a: [0.12, y, 0.07], b: [0.03, y * 0.95, 0.1], r: [0.034, 0.03], col: glove, k: 0.012 },
    ]),
    { t: "cap", a: [-0.06, -0.1, 0.09], b: [0.06, -0.06, 0.135], r: [0.04, 0.034], col: glove, k: 0.02 },
  ];
}

/** A star-shaped impact flash in the xy plane. */
function flash(c: V3, s: number): Shape[] {
  return [
    ...burst(c, 8, 10, 0.24 * s, [0.06 * s, 0.006], "hot", { len: 0.15 * s, r: [0.05 * s, 0.006], col: "zap" }, 0.02),
    { t: "ell", c, r: [0.08 * s, 0.08 * s, 0.05 * s], col: "core", k: 0.03 },
  ];
}

const FX = { hot: "#ffe27a", zap: "#ffb43a", core: "#fffbe6", glint: "#ffffff", dust: "#d8c8a8", dust2: "#b8a684", speed: "#f2ead8" };

// MARK: Designs

export const artNuevos2: Record<string, Sculpt> = {
  // Exploradora Ordóñez: a scout in a green-grey hooded jacket (hood down), a leather map tube across her
  // back, pointing ahead with one hand and holding an open brass compass in the other.
  "exploradora-ordonez": (() => {
    return {
      palette: {
        skin: "#e9bb94", hair: "#4a2e1e", jacket: "#6f7f6a", jacketDk: "#4e5c4a", jacketLt: "#8c9a84", legs: "#5a4a3a", boots: "#3e2a1c",
        leather: "#8a5a30", leatherDk: "#5a3a1e", brass: "#e0b04a", face: "#f6efdc", needle: "#c8402a", ink: "#3a3a44", mouth: "#8a3a34", scarf: "#c99a4a",
      },
      shapes: [
        // map tube slung diagonally across her back
        { t: "cap", a: [-0.17, 0.2, -0.1], b: [-0.12, 0.68, 0.12], r: [0.045, 0.045], col: "leather", k: 0.01 },
        { t: "cap", a: [-0.175, 0.17, -0.11], b: [-0.165, 0.23, -0.095], r: [0.05, 0.05], col: "brass", k: 0.005 },
        { t: "cap", a: [-0.125, 0.66, 0.115], b: [-0.115, 0.72, 0.13], r: [0.05, 0.05], col: "brass", k: 0.005 },
        { t: "cap", a: [0.1, 0.55, -0.12], b: [0.12, 0.3, 0.14], r: [0.014, 0.014], col: "leatherDk", k: 0.01 },
        // legs and boots mid-stride
        { t: "ell", c: [0.07, 0.05, 0.08], r: [0.085, 0.055, 0.065], col: "boots" },
        { t: "cap", a: [0, 0.28, 0.07], b: [0.05, 0.08, 0.075], r: [0.065, 0.056], col: "legs" },
        { t: "ell", c: [-0.04, 0.05, -0.08], r: [0.085, 0.055, 0.065], col: "boots" },
        { t: "cap", a: [0, 0.28, -0.07], b: [-0.03, 0.08, -0.075], r: [0.065, 0.056], col: "legs" },
        // jacket with a hem flare, belt, pockets
        { t: "ell", c: [0, 0.42, 0], r: [0.13, 0.17, 0.15], col: "jacket" },
        { t: "ell", c: [-0.01, 0.27, 0], r: [0.15, 0.06, 0.165], col: "jacket", k: 0.04 },
        { t: "ell", c: [0, 0.31, 0], r: [0.145, 0.025, 0.16], col: "leatherDk", k: 0.01 },
        { t: "box", c: [0.11, 0.4, 0.07], s: [0.04, 0.035, 0.035], round: 0.012, col: "jacketDk", k: 0.01 },
        { t: "box", c: [0.13, 0.43, 0], s: [0.04, 0.12, 0.006], round: 0.003, col: "jacketDk", paint: true },
        // scarf and the hood bunched behind the neck
        { t: "tor", c: [0.01, 0.56, 0], R: 0.085, r: 0.03, col: "scarf", k: 0.02 },
        { t: "ell", c: [-0.11, 0.6, 0], r: [0.08, 0.1, 0.14], col: "jacket", k: 0.03 },
        { t: "ell", c: [-0.13, 0.62, 0], r: [0.05, 0.06, 0.1], col: "jacketDk", paint: true },
        // head, hair in a low ponytail
        { t: "ell", c: [0.02, 0.71, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.07 },
        { t: "ell", c: [-0.03, 0.78, 0], r: [0.17, 0.13, 0.18], col: "hair", k: 0.02 },
        { t: "ell", c: [0.09, 0.84, 0.03], r: [0.1, 0.05, 0.14], rot: [0, 0, -18], col: "hair", k: 0.02 },
        { t: "cap", a: [-0.03, 0.78, 0.165], b: [0.03, 0.64, 0.16], r: [0.03, 0.022], col: "hair", mirror: true, k: 0.02 },
        { t: "cap", a: [-0.17, 0.73, 0], b: [-0.27, 0.56, 0.0], r: [0.05, 0.025], col: "hair", k: 0.02 },
        { t: "cap", a: [0.19, 0.655, -0.02], b: [0.18, 0.65, 0.06], r: [0.009, 0.009], col: "mouth", paint: true },
        // near arm pointing ahead, index finger out
        { t: "cap", a: [0, 0.5, 0.15], b: [0.22, 0.6, 0.2], r: [0.05, 0.044], col: "jacket" },
        { t: "tor", c: [0.22, 0.6, 0.2], R: 0.038, r: 0.013, rot: [0, 0, 70], col: "jacketDk", k: 0.01 },
        { t: "ell", c: [0.28, 0.62, 0.2], r: [0.045, 0.038, 0.038], col: "skin", k: 0.02 },
        { t: "cap", a: [0.3, 0.635, 0.2], b: [0.39, 0.665, 0.2], r: [0.016, 0.013], col: "skin", k: 0.01 },
        { t: "cap", a: [0.29, 0.6, 0.225], b: [0.33, 0.61, 0.23], r: [0.014, 0.012], col: "skin", k: 0.01 },
        // far hand holding an open compass up in front of the chest
        { t: "cap", a: [0, 0.5, -0.15], b: [0.15, 0.37, -0.05], r: [0.05, 0.044], col: "jacket" },
        { t: "ell", c: [0.19, 0.38, -0.02], r: [0.045, 0.04, 0.045], col: "skin", k: 0.02 },
        ...xf([
          { t: "ell", c: [0, 0, 0], r: [0.065, 0.065, 0.018], col: "brass", k: 0.005 },
          { t: "tor", c: [0, 0, 0.008], R: 0.06, r: 0.012, rot: [90, 0, 0], col: "brass", k: 0.004 },
          { t: "ell", c: [0, 0, 0.012], r: [0.052, 0.052, 0.012], col: "face", k: 0.002 },
          { t: "cap", a: [0, -0.04, 0.026], b: [0, 0.0, 0.026], r: [0.006, 0.012], col: "ink", k: 0 },
          { t: "cap", a: [0, 0.0, 0.026], b: [0, 0.045, 0.026], r: [0.012, 0.004], col: "needle", k: 0 },
          dot([0, 0, 0.03], 0.008, "brass"),
        ], { R: mul(ry(25), rz(-15)), t: [0.24, 0.41, 0.03] }),
        { t: "tor", c: [0.2, 0.45, 0.0], R: 0.016, r: 0.006, col: "brass", k: 0.003 },
      ],
      eyes: [
        { at: [0.04, 0.7, 0.085], r: 0.052, iris: "#4f8a5a", look: [0.75, 0.04, 0.6] },
        { at: [0.04, 0.7, -0.045], r: 0.048, iris: "#4f8a5a", look: [0.97, 0.04, 0.22] },
      ],
    };
  })(),

  // Determinación Firme: a clenched leather-gloved fist raised before a rising sun, a small steel-blue
  // pennant planted on the hill beside it.
  "determinacion-firme": {
    palette: { ...BAL, sun: "#ffcf5a", sun2: "#ffe9a8", ray: "#ffb846", hill: "#5e6a4a", hill2: "#46503a", pole: "#6b4a32", ...FX },
    glow: ["sun", "sun2", "ray", "glint"],
    shapes: [
      // sun half risen behind the hill, rays fanning upward
      { t: "ell", c: [0, 0.18, -0.45], r: [0.4, 0.4, 0.05], col: "sun", k: 0 },
      { t: "ell", c: [0, 0.18, -0.4], r: [0.27, 0.27, 0.03], col: "sun2", k: 0.02 },
      ...burst([0, 0.18, -0.48], 14, 0, 0.78, [0.05, 0.006], "ray", { len: 0.6, r: [0.04, 0.006], col: "sun2" }, 0).filter((sh) => sh.t === "cap" && sh.b[1] > 0.3),
      // hill
      { t: "ell", c: [0, -0.12, -0.1], r: [0.95, 0.32, 0.5], col: "hill", k: 0 },
      { t: "ell", c: [0.4, 0.08, 0.2], r: [0.3, 0.06, 0.2], col: "hill2", paint: true },
      // pennant on the hill
      { t: "cap", a: [0.52, 0.12, 0.05], b: [0.52, 0.66, 0.05], r: [0.016, 0.013], col: "pole", k: 0.01 },
      dot([0.52, 0.67, 0.05], 0.025, "bronze", 0.005),
      ...[0, 1, 2, 3].map((i): Shape => ({ t: "box", c: [0.56 + i * 0.045, 0.58 - i * 0.008, 0.05 + 0.015 * Math.sin(i * 1.6)], s: [0.028, 0.07 - i * 0.012, 0.01], round: 0.008, rot: [0, -25 * Math.cos(i * 1.6), 0], col: "gamb", k: 0.03 })),
      // the raised fist, rising out of the frame bottom
      ...xf([
        ...fist("glove", "gamb"),
        { t: "tor", c: [-0.2, 0, 0], R: 0.112, r: 0.022, rot: [0, 0, 90], col: "bronze", k: 0.005 },
        { t: "cap", a: [-0.8, 0, 0], b: [-0.34, 0, 0], r: [0.1, 0.1], col: "gamb", k: 0.02 },
        ...[-0.45, -0.6].map((x): Shape => ({ t: "tor", c: [x, 0, 0], R: 0.1, r: 0.008, rot: [0, 0, 90], col: "gambDk", paint: true })),
        // knuckle creases
        ...[0.06, 0.0, -0.06].map((y): Shape => ({ t: "cap", a: [0.155, y, 0.08], b: [0.155, y, -0.08], r: [0.008, 0.008], col: "brow", paint: true })),
      ], { s: 1.6, R: mul(rz(84), ry(-10)), t: [-0.08, 0.95, 0.22] }),
      ...sparkle([-0.32, 1.15, 0.2], 0.06, "glint"),
      ...sparkle([0.2, 1.22, 0.15], 0.045, "glint"),
    ],
    eyes: [],
  },

  // Carga Valiente: Baluarte charging, the bronze shield thrust forward, a short sword low at his side,
  // dust kicked up behind and speed lines.
  "carga-valiente": (() => {
    const lean = { R: rz(-14) };
    return {
      palette: { ...BAL, ...FX, steel: "#d8dee6", steelDk: "#8a96a4", grip: "#4a3020" },
      glow: ["glint"],
      shapes: [
        ...xf(egida(), { s: 0.62, R: mul(rz(-14), mul(ry(-38), rz(-6))), t: [0.33, 0.48, -0.1] }),
        ...xf([
          // legs in a long stride
          { t: "cap", a: [0, 0.28, 0.08], b: [0.13, 0.17, 0.09], r: [0.068, 0.06], col: "legs" },
          { t: "cap", a: [0.13, 0.17, 0.09], b: [0.17, 0.06, 0.09], r: [0.06, 0.055], col: "legs", k: 0.02 },
          { t: "ell", c: [0.21, 0.045, 0.09], r: [0.09, 0.05, 0.065], col: "boots", k: 0.01 },
          { t: "cap", a: [0, 0.28, -0.08], b: [-0.12, 0.17, -0.09], r: [0.068, 0.06], col: "legs" },
          { t: "cap", a: [-0.12, 0.17, -0.09], b: [-0.24, 0.08, -0.09], r: [0.06, 0.055], col: "legs", k: 0.02 },
          { t: "ell", c: [-0.27, 0.06, -0.09], r: [0.085, 0.05, 0.065], rot: [0, 0, 30], col: "boots", k: 0.01 },
          ...baluarteTop(),
          // far arm braced behind the shield
          { t: "cap", a: [0, 0.5, -0.19], b: [0.2, 0.46, -0.16], r: [0.055, 0.05], col: "gamb" },
          { t: "ell", c: [0.25, 0.46, -0.14], r: [0.05, 0.05, 0.05], col: "glove", k: 0.02 },
          // near arm: short sword held low and forward
          { t: "cap", a: [0, 0.5, 0.2], b: [0.08, 0.36, 0.25], r: [0.055, 0.05], col: "gamb" },
          { t: "cap", a: [0.08, 0.36, 0.25], b: [0.2, 0.33, 0.25], r: [0.05, 0.046], col: "gamb", k: 0.02 },
          { t: "tor", c: [0.17, 0.335, 0.25], R: 0.045, r: 0.012, rot: [0, 0, 80], col: "bronze", k: 0.005 },
          { t: "ell", c: [0.24, 0.33, 0.25], r: [0.05, 0.05, 0.05], col: "glove", k: 0.02 },
          { t: "cap", a: [0.24, 0.26, 0.25], b: [0.24, 0.4, 0.25], r: [0.016, 0.016], col: "bronze", k: 0.005 },
          { t: "cap", a: [0.27, 0.33, 0.25], b: [0.58, 0.38, 0.25], r: [0.032, 0.008], col: "steel", k: 0.004 },
          { t: "cap", a: [0.28, 0.335, 0.27], b: [0.5, 0.37, 0.27], r: [0.008, 0.004], col: "steelDk", paint: true },
          dot([0.2, 0.32, 0.25], 0.02, "bronze", 0.004),
        ], lean),
        // dust kicked up behind and speed lines
        ...[[-0.36, 0.06, -0.05, 0.08], [-0.48, 0.1, 0.05, 0.065], [-0.3, 0.12, 0.12, 0.055], [-0.58, 0.05, -0.1, 0.05], [-0.62, 0.15, 0.08, 0.035]].map(([x, y, z, r], i): Shape => ({ t: "ell", c: [x, y, z], r: [r * 1.2, r, r], col: i % 2 ? "dust2" : "dust", k: 0.04 })),
        ...[[0.82, 0.05], [0.66, -0.12], [0.5, 0.0], [0.36, 0.15], [0.96, -0.05]].map(([y, z], i): Shape => ({ t: "cap", a: [-0.38 - (i % 2) * 0.06, y, z], b: [-0.7 + (i % 3) * 0.05, y, z], r: [0.016, 0.005], col: "speed", k: 0 })),
        ...sparkle([0.62, 0.84, 0.0], 0.05, "glint"),
      ],
      eyes: BAL_EYES(lean),
    };
  })(),

  // Parada con la Égida: the bronze shield raised on a gloved arm, a big impact bursting against its face,
  // shock rings and sparks fanning off the rim.
  "parada-egida": (() => {
    const R = ry(-30);
    const impact: Shape[] = [];
    // spikes and sparks radiating in the shield plane from the strike point
    for (let i = 0; i < 12; i++) {
      const a = rad(i * 30 + 8);
      const long = i % 2 === 0;
      const L = long ? 0.44 : 0.28;
      impact.push({ t: "cap", a: [0.14, 0.1, 0.0], b: [0.14 + (long ? 0.12 : 0.06), 0.1 + Math.sin(a) * L, Math.cos(a) * L], r: [0.06, 0.006], col: long ? "hot" : "zap", k: 0.02 });
    }
    for (let i = 0; i < 9; i++) {
      const a = rad(i * 40 + 25);
      const R0 = 0.52 + (i % 3) * 0.06;
      impact.push({ t: "cap", a: [0.12, 0.1 + Math.sin(a) * R0, Math.cos(a) * R0], b: [0.2, 0.1 + Math.sin(a) * (R0 + 0.12), Math.cos(a) * (R0 + 0.12)], r: [0.016, 0.006], col: "spark", k: 0 });
    }
    return {
      palette: { ...BAL, ...FX, spark: "#ffd25a", ring: "#fff0b8", blast: "#ff9a3a" },
      glow: ["hot", "zap", "core", "spark", "ring", "glint", "blast"],
      shapes: [
        ...xf(egida(), { R }),
        ...xf([
          // gloved forearm behind the shield
          { t: "cap", a: [-0.08, -0.05, 0.02], b: [-0.42, -0.42, 0.18], r: [0.075, 0.09], col: "gamb", k: 0.02 },
          { t: "tor", c: [-0.18, -0.15, 0.065], R: 0.08, r: 0.02, rot: [0, 0, 45], col: "bronze", k: 0.005 },
          { t: "ell", c: [-0.06, -0.02, 0.0], r: [0.06, 0.06, 0.06], col: "glove", k: 0.03 },
          // the strike: a hot core on the face, shock rings, spikes and sparks
          { t: "ell", c: [0.12, 0.1, 0], r: [0.07, 0.15, 0.15], col: "core", k: 0.03 },
          ...impact,
          { t: "tor", c: [0.18, 0.1, 0], R: 0.24, r: 0.016, rot: [0, 0, 90], col: "ring", k: 0 },
          { t: "tor", c: [0.24, 0.1, 0], R: 0.38, r: 0.012, rot: [0, 0, 90], col: "ring", k: 0 },
          // the incoming blow streaking in from the front-right
          { t: "cap", a: [0.2, 0.1, 0.0], b: [0.5, 0.1, 0.0], r: [0.1, 0.05], col: "blast", k: 0.04 },
          ...[[0.0, 0.0], [0.1, 0.08], [-0.09, -0.06], [0.05, -0.1]].map(([dy, dz]): Shape => ({ t: "cap", a: [0.55, 0.1 + dy, dz], b: [0.85, 0.1 + dy * 1.3, dz * 1.3], r: [0.022, 0.006], col: "hot", k: 0 })),
        ], { R }),
        ...sparkle([-0.18, 0.55, 0.1], 0.05, "glint"),
      ],
      eyes: [],
    };
  })(),

  // Égida Arrojada: the bronze shield spinning mid-air on a curved glowing trail, ricocheting from one
  // impact flash toward another.
  "egida-arrojada": (() => {
    const at: V3 = [0.08, 0.72, 0.05];
    const R = mul(ry(-50), mul(rx(28), rz(-18)));
    const spin: Shape[] = [];
    for (const [r0, a0] of [[0.56, 30], [0.62, 200]]) {
      const pts: V3[] = [];
      for (let i = 0; i <= 6; i++) { const a = rad(a0 + i * 16); pts.push([0.02, Math.sin(a) * r0, Math.cos(a) * r0]); }
      spin.push(...chain(pts, 0.018, 0.006, "trail2", 0.005));
    }
    return {
      palette: { ...BRONZE, ...FX, trail: "#ffe7a0", trail2: "#fff6d8" },
      glow: ["hot", "zap", "core", "trail", "trail2", "glint"],
      shapes: [
        ...xf(egida(), { s: 0.78, R, t: at }),
        ...xf(spin, { s: 0.78, R, t: at }),
        // curved trail from the first ricochet up to the shield
        ...chain(bez([-0.55, 0.18, -0.05], [-0.5, 0.95, 0.0], [-0.15, 0.78, 0.04], 10), 0.012, 0.045, "trail", 0.01),
        ...chain(bez([-0.5, 0.2, -0.05], [-0.36, 0.78, 0.0], [-0.14, 0.66, 0.04], 8), 0.008, 0.025, "trail2", 0.01),
        ...flash([-0.56, 0.16, -0.05], 1),
        // dashed path onward to the next target
        ...[0, 1, 2, 3].map((i): Shape => { const t = (i + 1) / 5; const p: V3 = [0.24 + 0.32 * t, 0.56 - 0.38 * t, 0.03]; return { t: "ell", c: p, r: [0.03, 0.016, 0.016], rot: [0, 0, -50], col: "trail", k: 0 }; }),
        ...flash([0.62, 0.12, 0.0], 0.8),
        ...sparkle([0.48, 0.98, 0.05], 0.05, "glint"),
      ],
      eyes: [],
    };
  })(),

  // La Buhardilla del Teniente: a cosy attic under a sloping beamed roof: a narrow bed with a steel-blue
  // blanket, a round window with city lights, a warm lamp on a crate and an old framed photo.
  buhardilla: {
    palette: {
      wall: "#d8c2a0", wallDk: "#b49a78", floor: "#8a5e3a", floorDk: "#6a4428", beam: "#6b4428", bed: "#7a5434", blanket: "#2f6f8f", blanketDk: "#1f4e66",
      pillow: "#f2ead8", night: "#22305a", city: "#3a4670", lightC: "#ffd36a", frame: "#c08431", photo: "#d8b88a", photoDk: "#8a6a48",
      shade: "#ffcf72", lampBase: "#a86c22", crate: "#9a6a3e", rug: "#a84a3a", rug2: "#d8a04a", glow2: "#fff1c0",
    },
    glow: ["lightC", "shade", "glow2"],
    shapes: [
      // floor, back wall and left wall
      { t: "box", c: [0, 0.03, 0], s: [0.6, 0.03, 0.4], round: 0.01, col: "floor", k: 0 },
      ...[-0.3, 0, 0.3].map((x): Shape => ({ t: "box", c: [x, 0.06, 0], s: [0.004, 0.004, 0.4], round: 0.002, col: "floorDk", paint: true })),
      { t: "box", c: [0, 0.48, -0.38], s: [0.6, 0.45, 0.03], round: 0.01, col: "wall", k: 0 },
      { t: "box", c: [-0.58, 0.32, 0], s: [0.03, 0.29, 0.4], round: 0.01, col: "wallDk", k: 0 },
      // sloping roof over the left side, with rafters
      { t: "box", c: [-0.3, 0.86, -0.02], s: [0.42, 0.025, 0.4], round: 0.01, rot: [0, 0, 32], col: "wallDk", k: 0 },
      ...[-0.32, 0.0, 0.3].map((z): Shape => ({ t: "box", c: [-0.29, 0.82, z], s: [0.44, 0.03, 0.03], round: 0.008, rot: [0, 0, 32], col: "beam", k: 0.005 })),
      { t: "box", c: [0.05, 0.5, -0.34], s: [0.03, 0.42, 0.03], round: 0.008, col: "beam", k: 0.005 },
      // round window with the city at night
      { t: "cap", a: [0.32, 0.6, -0.36], b: [0.32, 0.6, -0.34], r: [0.17, 0.17], col: "night", k: 0 },
      ...[[0.22, 0.48, 0.05, 0.06], [0.3, 0.5, 0.04, 0.09], [0.38, 0.47, 0.05, 0.05], [0.44, 0.5, 0.03, 0.08]].map(([x, y, w, h]): Shape => ({ t: "box", c: [x, y, -0.34], s: [w, h, 0.01], round: 0.004, col: "city", k: 0 })),
      ...[[0.21, 0.52], [0.24, 0.47], [0.29, 0.56], [0.31, 0.5], [0.3, 0.44], [0.37, 0.5], [0.4, 0.45], [0.44, 0.55], [0.45, 0.49]].map(([x, y]): Shape => ({ t: "box", c: [x, y, -0.33], s: [0.009, 0.011, 0.006], round: 0.003, col: "lightC", k: 0 })),
      dot([0.4, 0.7, -0.335], 0.012, "glow2"),
      dot([0.25, 0.73, -0.335], 0.008, "glow2"),
      { t: "tor", c: [0.32, 0.6, -0.34], R: 0.17, r: 0.022, rot: [90, 0, 0], col: "beam", k: 0.005 },
      { t: "box", c: [0.32, 0.6, -0.335], s: [0.17, 0.01, 0.01], round: 0.004, col: "beam", k: 0 },
      { t: "box", c: [0.32, 0.6, -0.335], s: [0.01, 0.17, 0.01], round: 0.004, col: "beam", k: 0 },
      // rug
      { t: "ell", c: [0.12, 0.065, 0.12], r: [0.26, 0.008, 0.16], col: "rug", k: 0 },
      { t: "ell", c: [0.12, 0.07, 0.12], r: [0.18, 0.008, 0.1], col: "rug2", paint: true },
      { t: "ell", c: [0.12, 0.07, 0.12], r: [0.12, 0.009, 0.065], col: "rug", paint: true },
      // bed along the left wall, under the slope
      { t: "box", c: [-0.35, 0.13, 0.02], s: [0.2, 0.07, 0.3], round: 0.02, col: "bed", k: 0.005 },
      { t: "box", c: [-0.35, 0.21, 0.02], s: [0.19, 0.04, 0.29], round: 0.03, col: "pillow", k: 0.01 },
      { t: "box", c: [-0.34, 0.25, 0.08], s: [0.2, 0.035, 0.22], round: 0.035, col: "blanket", k: 0.02 },
      { t: "box", c: [-0.34, 0.25, -0.13], s: [0.21, 0.04, 0.012], round: 0.01, col: "blanketDk", k: 0.01 },
      { t: "ell", c: [-0.35, 0.28, -0.2], r: [0.13, 0.04, 0.07], col: "pillow", k: 0.02 },
      { t: "box", c: [-0.35, 0.24, -0.29], s: [0.2, 0.17, 0.02], round: 0.015, col: "bed", k: 0.005 },
      // a crate as a bedside table with a warm lamp and the old photo
      { t: "box", c: [-0.02, 0.15, -0.24], s: [0.1, 0.11, 0.09], round: 0.01, col: "crate", k: 0.005 },
      { t: "box", c: [-0.02, 0.15, -0.145], s: [0.1, 0.01, 0.006], round: 0.003, col: "beam", paint: true },
      { t: "cap", a: [0.0, 0.26, -0.26], b: [0.0, 0.29, -0.26], r: [0.04, 0.035], col: "lampBase", k: 0.01 },
      { t: "cap", a: [0.0, 0.29, -0.26], b: [0.0, 0.4, -0.26], r: [0.01, 0.01], col: "lampBase", k: 0.005 },
      { t: "cap", a: [0.0, 0.37, -0.26], b: [0.0, 0.46, -0.26], r: [0.08, 0.045], col: "shade", k: 0.01 },
      { t: "box", c: [-0.07, 0.31, -0.21], s: [0.04, 0.05, 0.008], round: 0.006, rot: [-12, 25, 0], col: "frame", k: 0.004 },
      { t: "box", c: [-0.07, 0.31, -0.2], s: [0.028, 0.036, 0.008], round: 0.003, rot: [-12, 25, 0], col: "photo", paint: true },
      { t: "ell", c: [-0.07, 0.31, -0.198], r: [0.012, 0.022, 0.01], col: "photoDk", paint: true },
      // a glow pool on the wall behind the lamp
      { t: "ell", c: [0.0, 0.47, -0.35], r: [0.13, 0.09, 0.02], col: "glow2", paint: true },
    ],
    eyes: [],
  },

  // Yelmo del Veterano: a dented steel-blue open-face helmet with a bronze brow band, cheek guards and a
  // small tower crest, a bright scratch across the dome, resting on a wooden stand.
  "yelmo-veterano": {
    palette: { ...BRONZE, steel: "#3d7c9a", steelDk: "#25546c", steelLt: "#8cc0d6", scratch: "#e6f2f6", wood: "#8a5a34", woodDk: "#5e3a20", glint: "#ffffff", inner: "#2a2a30" },
    glow: ["glint"],
    shapes: xf([
      // dome with the face opening and a dent carved out
      { t: "ell", c: [0, 0.62, 0], r: [0.24, 0.24, 0.23], col: "steel", k: 0 },
      { t: "ell", c: [0, 0.5, 0], r: [0.25, 0.14, 0.24], col: "steel", k: 0.05 },
      { t: "ell", c: [0, 0.6, 0], r: [0.205, 0.21, 0.195], col: "inner", cut: true, k: 0.01 },
      { t: "box", c: [0.22, 0.46, 0], s: [0.12, 0.12, 0.13], round: 0.06, col: "inner", cut: true, k: 0.02 },
      { t: "box", c: [0, 0.27, 0], s: [0.4, 0.1, 0.4], round: 0, col: "inner", cut: true, k: 0.01 },
      { t: "ell", c: [0.12, 0.83, 0.17], r: [0.06, 0.045, 0.05], col: "steelDk", cut: true, k: 0.03 },
      { t: "ell", c: [0.1, 0.81, 0.15], r: [0.06, 0.05, 0.06], col: "steelDk", paint: true },
      // highlight and a bright scratch
      { t: "ell", c: [-0.02, 0.8, 0.1], r: [0.06, 0.04, 0.08], col: "steelLt", paint: true },
      ...chain([[0.17, 0.72, 0.12], [0.1, 0.66, 0.2], [0.02, 0.6, 0.23]], 0.008, 0.005, "scratch", 0, true),
      // bronze brow band, rim, ridge
      { t: "tor", c: [0, 0.6, 0], R: 0.24, r: 0.026, col: "bronze", k: 0.01 },
      { t: "cap", a: [-0.24, 0.62, 0], b: [0.0, 0.87, 0], r: [0.025, 0.025], col: "bronze", k: 0.02 },
      { t: "cap", a: [0.0, 0.87, 0], b: [0.2, 0.74, 0], r: [0.025, 0.02], col: "bronze", k: 0.02 },
      ...[[0.17, 0.6, 0.17], [0.0, 0.6, 0.24], [-0.17, 0.6, 0.17], [0.24, 0.6, 0.0]].map((c): Shape => dot(c as V3, 0.018, "bronzeLt", 0.004)),
      // cheek guards hanging at the sides
      ...[1, -1].flatMap((s): Shape[] => [
        { t: "box", c: [0.07, 0.36, 0.22 * s], s: [0.075, 0.1, 0.018], round: 0.02, rot: [0, -12 * s, 6], col: "bronze", k: 0.01 },
        dot([0.07, 0.4, 0.24 * s], 0.014, "bronzeLt", 0.003),
      ]),
      // small tower crest on the crown
      { t: "box", c: [-0.02, 0.92, 0], s: [0.04, 0.05, 0.035], round: 0.006, col: "tower", k: 0.015 },
      { t: "box", c: [-0.02, 0.98, 0], s: [0.055, 0.014, 0.045], round: 0.004, col: "tower", k: 0.005 },
      ...[[-0.06, -0.035], [-0.06, 0.035], [0.02, -0.035], [0.02, 0.035]].map(([x, z]): Shape => ({ t: "box", c: [x, 1.01, z], s: [0.014, 0.016, 0.012], round: 0.003, col: "tower", k: 0.003 })),
      { t: "cap", a: [0.02, 0.89, 0], b: [0.02, 0.92, 0], r: [0.012, 0.012], col: "bronzeDk", paint: true },
      // the wooden stand: a head block, a post and a round foot
      { t: "ell", c: [-0.02, 0.5, 0], r: [0.15, 0.14, 0.15], col: "wood", k: 0.01 },
      { t: "ell", c: [0, 0.6, 0], r: [0.212, 0.217, 0.202], col: "inner", paint: true },
      { t: "ell", c: [-0.02, 0.5, 0], r: [0.16, 0.15, 0.16], col: "wood", paint: true },
      { t: "ell", c: [0.12, 0.48, 0], r: [0.04, 0.03, 0.12], col: "woodDk", paint: true },
      { t: "cap", a: [0, 0.33, 0], b: [0, 0.42, 0], r: [0.06, 0.09], col: "wood", k: 0.02 },
      { t: "cap", a: [0, 0.06, 0], b: [0, 0.34, 0], r: [0.045, 0.04], col: "wood", k: 0.02 },
      { t: "ell", c: [0, 0.03, 0], r: [0.2, 0.035, 0.2], col: "woodDk", k: 0.02 },
      ...[[0.22, 0.95, 0.14, 0.05], [-0.26, 0.7, 0.12, 0.04]].flatMap(([x, y, z, l]) => sparkle([x, y, z], l, "glint")),
    ], { R: ry(-35) }),
    eyes: [],
  },

  // Égida de Bronce: the bronze heater shield alone, frontal and iconic, the raised tower on its face,
  // shining.
  "egida-bronce": {
    palette: { ...BRONZE, glint: "#ffffff", halo: "#ffe6a0" },
    glow: ["glint", "halo"],
    shapes: [
      ...xf(egida(), { R: ry(-38), t: [0, 0.5, 0] }),
      ...burst([0, 0.55, -0.25], 12, 15, 0.62, [0.035, 0.005], "halo", { len: 0.48, r: [0.03, 0.005], col: "halo" }, 0),
      ...sparkle([0.3, 0.98, 0.25], 0.07, "glint"),
      ...sparkle([-0.28, 0.2, 0.2], 0.05, "glint"),
      ...sparkle([0.05, 0.78, 0.25], 0.04, "glint"),
    ],
    eyes: [],
  },

  // Elixir Templado: a stoppered glass vial of glowing amber liquid held in a small brass stand, a bronze
  // label on its belly, warm vapour curling from the stopper.
  "elixir-templado": {
    palette: {
      ...BRONZE, glass: "#d8eef2", glassLt: "#ffffff", amber: "#ffb43a", amber2: "#ffd77a", cork: "#9a6a3e", corkDk: "#6e4a28", brass: "#d9a23a", brassDk: "#9a6a1e",
      vapour: "#fff0c8", bubble: "#fff8e0",
    },
    glow: ["amber", "amber2", "bubble", "vapour", "glassLt"],
    shapes: [
      // vial: round belly of amber liquid, a glass shoulder and neck above the liquid line
      { t: "ell", c: [0, 0.3, 0], r: [0.15, 0.17, 0.15], col: "amber", k: 0 },
      { t: "cap", a: [0, 0.38, 0], b: [0, 0.6, 0], r: [0.11, 0.05], col: "glass", k: 0.06 },
      { t: "ell", c: [0, 0.4, 0], r: [0.142, 0.03, 0.142], col: "amber2", paint: true },
      { t: "box", c: [0, 0.52, 0], s: [0.2, 0.1, 0.2], round: 0, col: "glass", paint: true },
      { t: "tor", c: [0, 0.6, 0], R: 0.055, r: 0.015, col: "glass", k: 0.01 },
      { t: "ell", c: [-0.05, 0.35, 0.11], r: [0.03, 0.08, 0.03], rot: [0, 0, 15], col: "glassLt", paint: true },
      // stopper
      { t: "cap", a: [0, 0.58, 0], b: [0, 0.68, 0], r: [0.045, 0.055], col: "cork", k: 0.01 },
      { t: "ell", c: [0, 0.69, 0], r: [0.058, 0.02, 0.058], col: "corkDk", k: 0.01 },
      // bubbles
      dot([0.04, 0.26, 0.12], 0.016, "bubble", 0.005),
      dot([-0.06, 0.2, 0.12], 0.012, "bubble", 0.005),
      dot([0.08, 0.34, 0.09], 0.01, "bubble", 0.005),
      // bronze label tied on the belly
      { t: "box", c: [0.1, 0.26, 0.09], s: [0.02, 0.05, 0.05], round: 0.01, rot: [0, -45, 0], col: "bronze", k: 0.01 },
      { t: "box", c: [0.11, 0.26, 0.1], s: [0.015, 0.008, 0.03], round: 0.003, rot: [0, -45, 0], col: "bronzeDk", paint: true },
      { t: "tor", c: [0, 0.4, 0], R: 0.1, r: 0.006, col: "bronzeDk", k: 0.003 },
      // brass stand: a ring around the belly on three legs and a round foot
      { t: "tor", c: [0, 0.28, 0], R: 0.17, r: 0.016, col: "brass", k: 0.005 },
      ...[90, 210, 330].map((a): Shape => ({ t: "cap", a: [0.17 * Math.cos(rad(a)), 0.28, 0.17 * Math.sin(rad(a))], b: [0.2 * Math.cos(rad(a)), 0.04, 0.2 * Math.sin(rad(a))], r: [0.014, 0.014], col: "brass", k: 0.01 })),
      { t: "ell", c: [0, 0.03, 0], r: [0.24, 0.03, 0.24], col: "brassDk", k: 0.01 },
      { t: "tor", c: [0, 0.035, 0], R: 0.22, r: 0.012, col: "brass", k: 0.005 },
      // vapour curling up
      ...chain(bez([0, 0.72, 0], [0.12, 0.84, 0.0], [-0.02, 0.94, 0.0], 8), 0.025, 0.04, "vapour", 0.03),
      ...chain(bez([-0.02, 0.94, 0.0], [-0.16, 1.04, 0.0], [0.04, 1.12, 0.0], 8), 0.04, 0.02, "vapour", 0.03),
      dot([0.13, 1.06, 0.02], 0.025, "vapour"),
      dot([-0.12, 0.86, 0.0], 0.018, "vapour"),
      ...sparkle([0.24, 0.62, 0.1], 0.045, "glassLt"),
    ],
    eyes: [],
  },
};
