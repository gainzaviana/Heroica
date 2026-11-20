import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, rad } from "./kit";

// Album cards (Vanguardia's Protección deck and shared básicas) — art batch 2.
// Vanguardia: titanium silver with deep red (#b8322a) accents and glowing cyan rune-tech.
// One iconic object each.

// MARK: Helpers

/** Capsules through a list of points, radius tapering from r0 to r1. */
function path(pts: V3[], r0: number, r1: number, col: string, k = 0.02, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
  }
  return out;
}

/** Points on an arc in the xy plane (degrees), at depth z; `ry` squashes it into an ellipse. */
function arcPts(cx: number, cy: number, R: number, a0: number, a1: number, n: number, z = 0, ry = R): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) { const a = rad(a0 + ((a1 - a0) * i) / n); out.push([cx + R * Math.cos(a), cy + ry * Math.sin(a), z]); }
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

/** Rotates shapes about the z axis (in the picture plane) around `o`. Exact for shapes with no x/y rotation. */
function rotZ(shapes: Shape[], deg: number, o: V3 = [0, 0, 0]): Shape[] {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  const p = (v: V3): V3 => { const x = v[0] - o[0], y = v[1] - o[1]; return [o[0] + c * x - s * y, o[1] + s * x + c * y, v[2]]; };
  return shapes.map((sh): Shape => {
    if (sh.t === "cap") return { ...sh, a: p(sh.a), b: p(sh.b) };
    const r = sh.rot ?? [0, 0, 0];
    const keep = sh.t === "tor" && r[0] === 90 && r[1] === 0;
    return { ...sh, c: p(sh.c), rot: keep ? r : [r[0], r[1], r[2] + deg] };
  });
}

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

/** A leaf at c pointing toward angle `ang` (degrees, xy plane). */
function leaf(c: V3, ang: number, len: number, col: string): Shape {
  return { t: "ell", c, r: [len, len * 0.4, len * 0.16], rot: [0, 0, ang], col, k: 0.012 };
}

const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

/** A small upright health cross. */
function plus(c: V3, s: number, col: string): Shape[] {
  return [
    { t: "box", c, s: [s, s * 0.32, s * 0.3], round: s * 0.15, col, k: 0 },
    { t: "box", c, s: [s * 0.32, s, s * 0.3], round: s * 0.15, col, k: 0 },
  ];
}

// MARK: Palettes

const VAN = { red: "#b8322a", red2: "#d9473a", ti: "#c9ced6", ti2: "#e6eaf0", tidk: "#7d8590", dark: "#2c3340", cyan: "#5fe6ff", hot: "#eafdff" };

// MARK: Pieces

/** Kite shield in the xy plane: a flat face built from horizontal slats, a rounded rim around it. */
function kiteShield(face: string, rim: string): Shape[] {
  const outline: [number, number][] = [[-0.3, 0.86], [-0.15, 0.92], [0, 0.94], [0.15, 0.92], [0.3, 0.86], [0.3, 0.62], [0.2, 0.36], [0, 0.07], [-0.2, 0.36], [-0.3, 0.62], [-0.3, 0.86]];
  // half-width at height y, from the right side of the outline
  const side = outline.slice(4, 8);
  const half = (y: number): number => {
    for (let i = 0; i + 1 < side.length; i++) {
      const [x0, y0] = side[i], [x1, y1] = side[i + 1];
      if (y <= y0 && y >= y1) return x0 + ((x1 - x0) * (y0 - y)) / (y0 - y1);
    }
    return 0.3;
  };
  const out: Shape[] = [];
  for (let y = 0.12; y <= 0.9; y += 0.04) out.push({ t: "box", c: [0, y, 0], s: [Math.max(0.03, half(y) - 0.02), 0.03, 0.03], round: 0.02, col: face, k: 0.03 });
  out.push({ t: "ell", c: [0, 0.6, 0.015], r: [0.22, 0.28, 0.04], col: face, k: 0.05 });
  out.push(...path(outline.map(([x, y]): V3 => [x, y, 0.005]), 0.036, 0.036, rim, 0.006));
  return out;
}

type Vec = [number, number, number];
const vadd = (a: Vec, b: Vec, k = 1): Vec => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const vnorm = (a: Vec): Vec => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const vcross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A frame on a sphere: `at(u, v)` maps tangent-plane coordinates around axis `d` onto the sphere. */
function sphereFrame(c: V3, R: number, axis: V3) {
  const d = vnorm(axis);
  const e1 = vnorm(vcross([0, 0, 1], d));
  const e2 = vcross(d, e1);
  const at = (u: number, v: number, rr = R): V3 => vadd(c, vnorm(vadd(vadd(vadd([0, 0, 0], d, R), e1, u), e2, v)), rr);
  return { d, e1, e2, at };
}

/** A hexagonal lattice on a spherical cap (centre `c`, radius R, facing `axis`): cells of size `h`. */
function hexDome(c: V3, R: number, axis: V3, h: number, rings: number, r: number, col: string): Shape[] {
  const out: Shape[] = [];
  const { at } = sphereFrame(c, R, axis);
  const seen = new Set<string>();
  const w = Math.sqrt(3) * h;
  for (let q = -rings; q <= rings; q++) for (let s = -rings; s <= rings; s++) {
    if (Math.abs(q + s) > rings) continue;
    const cu = w * (q + s / 2), cv = 1.5 * h * s;
    for (let i = 0; i < 6; i++) {
      const a0 = rad(30 + 60 * i), a1 = rad(30 + 60 * (i + 1));
      const p0 = [cu + h * Math.cos(a0), cv + h * Math.sin(a0)], p1 = [cu + h * Math.cos(a1), cv + h * Math.sin(a1)];
      const key = [p0, p1].map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ t: "cap", a: at(p0[0], p0[1]), b: at(p1[0], p1[1]), r: [r, r], col, k: 0.004 });
    }
  }
  return out;
}

/** Campo Reflector: gauntlet behind, dome facing the camera, a bolt glancing off. */
function reflector(): Shape[] {
  const c0: V3 = [0.04, 0.46, 0];
  const axis: V3 = [0.75, 0.3, 0.6];
  const R = 0.7;
  const { at, d } = sphereFrame(c0, R, axis);
  const hit = at(0.1, 0.14, R + 0.01);
  return [
    // gauntlet: forearm reaching in from the lower left, fist at the emitter
    { t: "cap", a: [-0.62, 0.1, -0.04], b: [-0.2, 0.37, 0], r: [0.085, 0.105], col: "red" },
    { t: "tor", c: [-0.58, 0.125, -0.04], R: 0.088, r: 0.026, rot: [0, 0, -57], col: "ti", k: 0.01 },
    { t: "tor", c: [-0.22, 0.36, 0], R: 0.105, r: 0.026, rot: [0, 0, -57], col: "ti", k: 0.01 },
    { t: "box", c: [-0.4, 0.24, 0.085], s: [0.1, 0.025, 0.02], round: 0.015, rot: [0, 0, 33], col: "cyan", k: 0.01 },
    { t: "box", c: [-0.1, 0.43, 0], s: [0.1, 0.1, 0.1], round: 0.07, rot: [0, 0, 33], col: "ti", k: 0.04 },
    ...[0.06, 0.0, -0.06].map((z): Shape => ({ t: "ell", c: [-0.03, 0.5, z], r: [0.04, 0.035, 0.03], col: "ti2", k: 0.012 })),
    { t: "cap", a: [-0.08, 0.44, 0], b: c0, r: [0.06, 0.04], col: "tidk", k: 0.02 },
    dot(vadd(c0, d, 0.02), 0.05, "hot"),
    ...burst(vadd(c0, d, 0.02), 6, 0, 0.1, [0.02, 0.004], "cyan", undefined, 0),
    // the dome: lattice plus a rim ring
    ...hexDome(c0, R, axis, 0.095, 3, 0.015, "cyan"),
    // impact and bounce
    dot(hit, 0.035, "bolt2"),
    ...burst(hit, 8, 15, 0.12, [0.025, 0.004], "bolt2", { len: 0.08, r: [0.02, 0.004], col: "bolt" }, 0),
    ...path([vadd(hit, [0.4, 0.34, 0.1]), vadd(hit, [0.26, 0.2, 0.07]), vadd(hit, [0.24, 0.28, 0.07]), vadd(hit, [0.1, 0.08, 0.03]), hit], 0.035, 0.02, "bolt", 0.01),
    ...path([hit, vadd(hit, [0.16, -0.05, 0.08]), vadd(hit, [0.2, 0.0, 0.09]), vadd(hit, [0.38, -0.1, 0.14])], 0.02, 0.032, "bolt2", 0.01),
    ...sparkle(vadd(hit, [0.12, 0.26, 0.1]), 0.045, "bolt2"),
    dot(vadd(hit, [0.18, -0.16, 0.1]), 0.018, "bolt"),
    dot(vadd(hit, [-0.05, 0.2, 0.1]), 0.015, "bolt"),
  ];
}

export const artAlbum2: Record<string, Sculpt> = {
  // Coraza de Titanio: a titanium breastplate on a display stand, red trim, a cyan rune glowing on the sternum.
  "coraza-titanio": {
    palette: { ...VAN, base: "#4a5160", base2: "#353b48" },
    glow: ["cyan", "hot"],
    shapes: [
      // stand
      { t: "ell", c: [0, 0.03, 0], r: [0.24, 0.035, 0.2], col: "base2" },
      { t: "box", c: [0, 0.07, 0], s: [0.06, 0.03, 0.06], round: 0.02, rot: [0, 45, 0], col: "base", k: 0.02 },
      { t: "cap", a: [0, 0.08, -0.04], b: [0, 0.3, -0.04], r: [0.03, 0.026], col: "base", k: 0.02 },
      { t: "box", c: [0, 0.98, -0.06], s: [0.3, 0.025, 0.025], round: 0.02, col: "base", k: 0 },
      // plate shell
      { t: "ell", c: [0, 0.58, 0], r: [0.28, 0.36, 0.15], col: "ti" },
      { t: "box", c: [0, 0.8, -0.01], s: [0.33, 0.13, 0.12], round: 0.1, col: "ti", k: 0.1 },
      { t: "ell", c: [0, 0.97, 0.02], r: [0.13, 0.08, 0.2], col: "ti", cut: true, k: 0.04 },
      { t: "ell", c: [0.36, 0.8, 0], r: [0.1, 0.16, 0.2], col: "ti", cut: true, k: 0.04 },
      { t: "ell", c: [-0.36, 0.8, 0], r: [0.1, 0.16, 0.2], col: "ti", cut: true, k: 0.04 },
      // pectoral plates
      { t: "box", c: [0.13, 0.72, 0.12], s: [0.11, 0.08, 0.04], round: 0.035, rot: [-14, 8, -8], col: "ti2", k: 0.03 },
      { t: "box", c: [-0.13, 0.72, 0.12], s: [0.11, 0.08, 0.04], round: 0.035, rot: [-14, -8, 8], col: "ti2", k: 0.03 },
      // abdominal bands
      ...[0.47, 0.38, 0.3].map((y, i): Shape => ({ t: "box", c: [0, y, 0.12], s: [0.26 - i * 0.04, 0.012, 0.1], round: 0.008, col: "tidk", paint: true })),
      // red trim: collar, armholes, lower hem, centre spine
      ...path(arcPts(0, 0.95, 0.15, 200, 340, 8, 0.1, 0.09), 0.022, 0.022, "red", 0.015),
      ...path(arcPts(0.33, 0.8, 0.11, 110, 260, 6, 0.08, 0.17), 0.02, 0.02, "red", 0.015),
      ...path(arcPts(-0.33, 0.8, 0.11, 280, 430, 6, 0.08, 0.17), 0.02, 0.02, "red", 0.015),
      ...path(arcPts(0, 0.6, 0.29, 225, 315, 8, 0.07, 0.38), 0.026, 0.026, "red", 0.015),
      // shoulder guards
      { t: "ell", c: [0.27, 0.93, 0], r: [0.12, 0.06, 0.13], rot: [0, 0, -22], col: "red", k: 0.02 },
      { t: "ell", c: [-0.27, 0.93, 0], r: [0.12, 0.06, 0.13], rot: [0, 0, 22], col: "red", k: 0.02 },
      // rune core: a diamond with a forked glyph
      { t: "box", c: [0, 0.6, 0.15], s: [0.075, 0.075, 0.03], round: 0.012, rot: [0, 0, 45], col: "dark", k: 0.015 },
      { t: "box", c: [0, 0.6, 0.175], s: [0.05, 0.05, 0.012], round: 0.01, rot: [0, 0, 45], col: "cyan", k: 0 },
      ...path([[0, 0.66, 0.17], [0, 0.54, 0.17]], 0.007, 0.007, "hot", 0, true),
      ...path([[-0.025, 0.62, 0.17], [0, 0.6, 0.17], [0.025, 0.62, 0.17]], 0.006, 0.006, "hot", 0, true),
      ...path([[0.04, 0.6, 0.16], [0.11, 0.6, 0.15], [0.14, 0.64, 0.14]], 0.009, 0.009, "cyan", 0, true),
      ...path([[-0.04, 0.6, 0.16], [-0.11, 0.6, 0.15], [-0.14, 0.64, 0.14]], 0.009, 0.009, "cyan", 0, true),
      ...sparkle([0.36, 1.08, 0.06], 0.05, "hot"),
      ...sparkle([-0.38, 0.42, 0.06], 0.04, "cyan"),
    ],
    eyes: [],
  },

  // Firmeza: a green kite shield planted in a grassy mound, a glowing leaf rune on its face.
  firmeza: {
    palette: { face: "#2f7d4a", face2: "#22603a", rim: "#e0b84a", rim2: "#a8822a", leaf: "#9cf5a8", hot: "#effff0", dirt: "#7a5a3c", grass: "#5aa84e", stone: "#8a8f9a" },
    glow: ["leaf", "hot"],
    shapes: [
      // mound
      { t: "ell", c: [0, 0.03, 0], r: [0.42, 0.11, 0.3], col: "dirt" },
      { t: "ell", c: [0, 0.09, 0], r: [0.38, 0.05, 0.27], col: "grass", paint: true },
      ...[[-0.3, 0.12], [0.28, 0.1], [0.12, 0.15], [-0.14, 0.15]].flatMap(([x, z]): Shape[] => [
        { t: "cap", a: [x, 0.08, z], b: [x - 0.03, 0.17, z + 0.02], r: [0.018, 0.004], col: "grass", k: 0.01 },
        { t: "cap", a: [x, 0.08, z], b: [x + 0.03, 0.16, z + 0.01], r: [0.016, 0.004], col: "grass", k: 0.01 },
      ]),
      { t: "ell", c: [0.32, 0.08, -0.08], r: [0.07, 0.05, 0.06], col: "stone", k: 0.02 },
      // shield, tilted back a touch, point buried in the mound
      ...rotZ(kiteShield("face", "rim"), -6, [0, 0.1, 0]).map((sh): Shape => {
        const lift = (v: V3): V3 => [v[0], v[1] + 0.02, v[2] - 0.02];
        return sh.t === "cap" ? { ...sh, a: lift(sh.a), b: lift(sh.b) } : { ...sh, c: lift(sh.c) };
      }),
      // leaf rune: a gold-ringed green gem with a glowing leaf
      { t: "ell", c: [0.035, 0.62, 0.075], r: [0.13, 0.13, 0.045], col: "rim", k: 0.03 },
      { t: "ell", c: [0.035, 0.62, 0.1], r: [0.105, 0.105, 0.04], col: "face2", k: 0.01 },
      leaf([0.035, 0.62, 0.13], 60, 0.1, "leaf"),
      ...path([[-0.02, 0.55, 0.15], [0.09, 0.69, 0.15]], 0.008, 0.008, "hot", 0, true),
      ...path([[0.035, 0.62, 0.15], [0.0, 0.66, 0.145]], 0.006, 0.006, "hot", 0, true),
      ...path([[0.06, 0.65, 0.15], [0.1, 0.62, 0.145]], 0.006, 0.006, "hot", 0, true),
      // rivets
      ...([[-0.22, 0.82], [0.22, 0.82], [-0.2, 0.55], [0.2, 0.55], [0, 0.25]] as [number, number][]).map(([x, y]): Shape => dot([x, y, 0.06], 0.022, "rim2")),
      ...sparkle([0.36, 0.95, 0.05], 0.05, "hot"),
    ],
    eyes: [],
  },

  // Campo Reflector: a titanium gauntlet throws up a cyan hex-lattice dome; an amber bolt glances off it.
  "campo-reflector": {
    palette: { ...VAN, bolt: "#ffb43a", bolt2: "#fff0b0" },
    glow: ["cyan", "hot", "bolt", "bolt2"],
    shapes: reflector(),
    eyes: [],
  },

  // Mente Afilada: a glowing blue crystal brain, a keen crystal blade-point rising from it, focus rays behind.
  "mente-afilada": {
    palette: { blue: "#3f7fe0", blue2: "#2a55a8", ice: "#a8dcff", hot: "#eef8ff", ring: "#c9ced6", ray: "#7fc4ff" },
    glow: ["ice", "hot", "ray"],
    shapes: [
      // rune ring pedestal
      { t: "tor", c: [0, 0.06, 0], R: 0.26, r: 0.03, col: "ring" },
      ...[0, 90, 180, 270].map((a): Shape => ({ t: "box", c: [0.26 * Math.cos(rad(a)), 0.06, 0.26 * Math.sin(rad(a))], s: [0.03, 0.03, 0.03], round: 0.008, rot: [0, -a, 45], col: "ice", k: 0 })),
      // focus rays, converging on the point
      ...burst([0.04, 0.6, -0.25], 10, 18, 0.5, [0.02, 0.003], "ray", undefined, 0),
      // brain in profile (front toward +x): lobes, cerebellum, stem, a groove along the top
      { t: "ell", c: [0, 0.52, 0], r: [0.3, 0.2, 0.21], col: "blue" },
      { t: "ell", c: [0.15, 0.53, 0], r: [0.17, 0.17, 0.2], col: "blue", k: 0.08 },
      { t: "ell", c: [-0.15, 0.51, 0], r: [0.16, 0.17, 0.19], col: "blue", k: 0.08 },
      { t: "ell", c: [0.06, 0.39, 0], r: [0.18, 0.08, 0.18], col: "blue", k: 0.06 },
      { t: "ell", c: [-0.2, 0.36, 0], r: [0.1, 0.065, 0.14], col: "blue2", k: 0.03 },
      ...[25, 55, 85, 115, 145, 170].flatMap((a): Shape[] => [0.09, -0.09].map((z): Shape => ({ t: "ell", c: [0.27 * Math.cos(rad(a)), 0.5 + 0.17 * Math.sin(rad(a)), z], r: [0.085, 0.08, 0.1], col: "blue", k: 0.05 }))),
      { t: "cap", a: [-0.4, 0.73, 0], b: [0.4, 0.73, 0], r: [0.022, 0.022], col: "blue2", cut: true, k: 0.02 },
      ...[1, -1].flatMap((sz): Shape[] => [0.66, 0.58, 0.5, 0.42].flatMap((y0, li): Shape[] => {
        const pts: V3[] = [];
        const x0 = -0.27 + li * 0.02, x1 = 0.3 - li * 0.04;
        for (let n = 0; n <= 16; n++) {
          const x = x0 + ((x1 - x0) * n) / 16, y = y0 + 0.03 * Math.sin(n * 1.9 + li * 1.3);
          const q = 1 - (x / 0.34) ** 2 - ((y - 0.52) / 0.23) ** 2;
          pts.push([x, y, sz * 0.21 * Math.sqrt(Math.max(q, 0.05))]);
        }
        return path(pts, 0.013, 0.013, "ice", 0, true);
      })),
      // the sharpened crystal point
      { t: "cap", a: [0.06, 0.66, 0], b: [0.12, 1.1, 0], r: [0.075, 0.003], col: "ice", k: 0.04 },
      { t: "cap", a: [0.07, 0.72, 0.05], b: [0.115, 1.0, 0.02], r: [0.022, 0.003], col: "hot", paint: true },
      ...sparkle([0.22, 1.02, 0.05], 0.06, "hot"),
      ...sparkle([-0.3, 0.88, 0.05], 0.04, "hot"),
    ],
    eyes: [],
  },

  // Vigor: a glowing ruby heart crystal cradled by a laurel, health crosses rising around it.
  vigor: {
    palette: { ruby: "#d0283c", ruby2: "#8e1626", core: "#ff7a86", hot: "#fff0f2", laurel: "#4f9a46", laurel2: "#3a7a36", gold: "#e8b23a", warm: "#ffd0a0" },
    glow: ["core", "hot", "warm"],
    shapes: [
      ...burst([0, 0.6, -0.2], 14, 0, 0.55, [0.03, 0.004], "warm", { len: 0.4, r: [0.025, 0.004], col: "warm" }, 0),
      // heart
      { t: "ell", c: [0.13, 0.7, 0], r: [0.17, 0.17, 0.12], col: "ruby" },
      { t: "ell", c: [-0.13, 0.7, 0], r: [0.17, 0.17, 0.12], col: "ruby", k: 0.06 },
      { t: "cap", a: [0.15, 0.64, 0], b: [0, 0.3, 0], r: [0.15, 0.03], col: "ruby", k: 0.06 },
      { t: "cap", a: [-0.15, 0.64, 0], b: [0, 0.3, 0], r: [0.15, 0.03], col: "ruby", k: 0.06 },
      // facets: a darker lower half and a glowing core
      { t: "ell", c: [0.0, 0.42, 0.08], r: [0.2, 0.12, 0.1], col: "ruby2", paint: true },
      { t: "ell", c: [-0.04, 0.64, 0.1], r: [0.1, 0.11, 0.06], col: "core", paint: true },
      { t: "ell", c: [-0.13, 0.76, 0.1], r: [0.045, 0.035, 0.04], col: "hot", paint: true },
      // laurel cradling the bottom
      ...path(arcPts(0, 0.55, 0.36, 200, 270, 8, 0.1, 0.36), 0.014, 0.014, "laurel2", 0.01),
      ...path(arcPts(0, 0.55, 0.36, 340, 270, 8, 0.1, 0.36), 0.014, 0.014, "laurel2", 0.01),
      ...[205, 220, 235, 250].flatMap((a): Shape[] => {
        const p: V3 = [0.36 * Math.cos(rad(a)), 0.55 + 0.36 * Math.sin(rad(a)), 0.1];
        const q: V3 = [-p[0], p[1], 0.1];
        return [leaf([p[0] - 0.03, p[1] + 0.02, 0.11], a + 120, 0.055, "laurel"), leaf([q[0] + 0.03, q[1] + 0.02, 0.11], 60 - a, 0.055, "laurel")];
      }),
      { t: "ell", c: [0, 0.2, 0.11], r: [0.04, 0.03, 0.03], col: "gold", k: 0.01 },
      ...plus([0.38, 0.95, 0.05], 0.045, "hot"),
      ...plus([-0.4, 0.82, 0.05], 0.035, "core"),
      ...plus([0.42, 0.45, 0.08], 0.03, "core"),
    ],
    eyes: [],
  },

  // Reflejos Afilados: a wide-open eye with a lightning bolt slashing past it and speed lines streaming behind.
  "reflejos-afilados": {
    palette: { white: "#f7f4ea", lid: "#3a3550", iris: "#f0c020", iris2: "#a87a10", pupil: "#1c1630", bolt: "#ffd84a", bolt2: "#fff6c0", streak: "#ffe68a" },
    glow: ["bolt", "bolt2", "streak"],
    shapes: [
      // speed lines
      ...[[0.85, 0.55, 0.0], [0.72, 0.66, -0.02], [0.78, 0.44, -0.02], [0.6, 0.78, -0.04], [0.6, 0.32, -0.04]].map(([y0, l, z]): Shape => ({ t: "cap", a: [-0.25, y0 * 0 + l, z], b: [-0.25 - y0 * 0.7, l, z], r: [0.02, 0.004], col: "streak", k: 0 })),
      // eye
      { t: "ell", c: [0, 0.55, 0], r: [0.36, 0.2, 0.08], col: "white" },
      ...path(arcPts(0, 0.33, 0.42, 32, 148, 12, 0.04, 0.42), 0.03, 0.03, "lid", 0.01),
      ...path(arcPts(0, 0.77, 0.42, 212, 328, 12, 0.04, 0.42), 0.022, 0.022, "lid", 0.01),
      { t: "ell", c: [0, 0.55, 0.07], r: [0.14, 0.14, 0.05], col: "iris", k: 0.02 },
      { t: "ell", c: [0, 0.55, 0.1], r: [0.14, 0.14, 0.02], col: "iris2", paint: true },
      { t: "ell", c: [0, 0.55, 0.1], r: [0.115, 0.115, 0.04], col: "iris", paint: true },
      { t: "ell", c: [0, 0.55, 0.11], r: [0.055, 0.075, 0.03], col: "pupil", k: 0.01 },
      dot([-0.04, 0.6, 0.13], 0.025, "bolt2"),
      // lashes
      ...[-0.22, -0.11, 0, 0.11, 0.22].map((x): Shape => {
        const y = 0.33 + Math.sqrt(0.42 ** 2 - x * x);
        return { t: "cap", a: [x, y, 0.04], b: [x * 1.3, y + 0.08, 0.04], r: [0.014, 0.005], col: "lid", k: 0.01 };
      }),
      // lightning bolt slashing diagonally in front
      ...path([[0.55, 1.05, 0.16], [0.18, 0.62, 0.18], [0.3, 0.6, 0.18], [-0.12, 0.05, 0.16]], 0.05, 0.02, "bolt", 0.005),
      ...path([[0.5, 0.99, 0.2], [0.18, 0.62, 0.22], [0.28, 0.6, 0.22], [-0.06, 0.15, 0.2]], 0.015, 0.008, "bolt2", 0, true),
      ...sparkle([-0.4, 0.95, 0.05], 0.05, "bolt2"),
      ...sparkle([0.48, 0.25, 0.05], 0.04, "bolt2"),
    ],
    eyes: [],
  },

  // Pausa Merecida: a steaming cup of tea on a little round table, an open book and a cushion beside it.
  "pausa-merecida": {
    palette: { wood: "#9a6438", wood2: "#6e4426", cup: "#f3efe6", band: "#c0563a", tea: "#7a4a24", steam: "#eef3fa", page: "#fbf3dc", cover: "#3f6fb0", cushion: "#c8463a", tassel: "#e8b23a" },
    shapes: [
      // table
      { t: "ell", c: [0, 0.015, 0], r: [0.2, 0.025, 0.2], col: "wood2" },
      { t: "cap", a: [0, 0.02, 0], b: [0, 0.36, 0], r: [0.05, 0.04], col: "wood", k: 0.03 },
      { t: "ell", c: [0, 0.385, 0], r: [0.41, 0.022, 0.41], col: "wood", k: 0.02 },
      { t: "tor", c: [0, 0.38, 0], R: 0.4, r: 0.028, col: "wood2", k: 0.02 },
      // book, open, lying on the table (left-back)
      { t: "box", c: [-0.18, 0.425, -0.08], s: [0.2, 0.012, 0.14], round: 0.006, rot: [0, 20, 0], col: "cover", k: 0 },
      { t: "box", c: [-0.26, 0.445, -0.1], s: [0.09, 0.014, 0.12], round: 0.01, rot: [0, 20, -5], col: "page", k: 0 },
      { t: "box", c: [-0.09, 0.445, -0.05], s: [0.09, 0.014, 0.12], round: 0.01, rot: [0, 20, 5], col: "page", k: 0 },
      // saucer and cup (front-right)
      { t: "ell", c: [0.12, 0.41, 0.12], r: [0.17, 0.018, 0.17], col: "cup", k: 0.01 },
      { t: "cap", a: [0.12, 0.43, 0.12], b: [0.12, 0.64, 0.12], r: [0.095, 0.13], col: "cup", k: 0.04 },
      { t: "ell", c: [0.12, 0.67, 0.12], r: [0.112, 0.04, 0.112], col: "cup", cut: true, k: 0.01 },
      { t: "ell", c: [0.12, 0.615, 0.12], r: [0.112, 0.014, 0.112], col: "tea", k: 0 },
      { t: "tor", c: [0.12, 0.56, 0.12], R: 0.117, r: 0.016, col: "band", k: 0.005 },
      { t: "tor", c: [0.27, 0.54, 0.12], R: 0.06, r: 0.02, rot: [90, 0, 0], col: "cup", k: 0.01 },
      // steam
      ...path(bez([0.09, 0.66, 0.12], [-0.01, 0.8, 0.12], [0.1, 0.9, 0.12], 6), 0.026, 0.02, "steam", 0.01),
      ...path(bez([0.1, 0.9, 0.12], [0.22, 1.0, 0.12], [0.1, 1.12, 0.12], 6), 0.02, 0.008, "steam", 0.01),
      ...path(bez([0.17, 0.67, 0.12], [0.26, 0.78, 0.12], [0.19, 0.88, 0.12], 6), 0.018, 0.008, "steam", 0.01),
      // cushion leaning at the foot of the table
      { t: "box", c: [0.38, 0.11, 0.18], s: [0.14, 0.11, 0.05], round: 0.06, rot: [0, -20, 10], col: "cushion", k: 0 },
    ],
    eyes: [],
  },
};
