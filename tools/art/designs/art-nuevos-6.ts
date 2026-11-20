import type { Sculpt, Shape, V3 } from "../sculpt";
import { arm, burst, rad, spike } from "./kit";

// Baluarte, Custodio del Umbral and Sibila del Caos — art batch 6. This file: the Sibila del Caos
// (Lucía Montenegro) deck. Magenta (#be185d) and black, slim silver, swirling pink-violet chaos
// energy with dice and probability motifs. Original designs only.

// MARK: Helpers

/** Small spheres (sparks, pips, beads). */
const dot = (c: V3, r: number, col: string, k = 0): Shape => ({ t: "ell", c, r: [r, r, r], col, k });

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

/** Uniform scale about the origin, then a move. */
function place(shapes: Shape[], s: number, d: V3): Shape[] {
  const p = (v: V3): V3 => [v[0] * s + d[0], v[1] * s + d[1], v[2] * s + d[2]];
  return shapes.map((sh): Shape => {
    const k = sh.k === undefined ? {} : { k: sh.k * s };
    switch (sh.t) {
      case "ell": return { ...sh, ...k, c: p(sh.c), r: [sh.r[0] * s, sh.r[1] * s, sh.r[2] * s] };
      case "cap": return { ...sh, ...k, a: p(sh.a), b: p(sh.b), r: [sh.r[0] * s, sh.r[1] * s] };
      case "box": return { ...sh, ...k, c: p(sh.c), s: [sh.s[0] * s, sh.s[1] * s, sh.s[2] * s], round: sh.round * s };
      case "tor": return { ...sh, ...k, c: p(sh.c), R: sh.R * s, r: sh.r * s };
    }
  });
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

/** Rotates a vector by Euler angles (degrees, XYZ order, as the renderer applies a shape's `rot`). */
function eul(v: V3, r: V3): V3 {
  let [x, y, z] = v;
  const [ax, ay, az] = r.map(rad);
  [x, y] = [x * Math.cos(az) - y * Math.sin(az), x * Math.sin(az) + y * Math.cos(az)];
  [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
  [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
  return [x, y, z];
}

/** A die (half-size s) at c turned by `rot`, with painted pips on all six faces. */
function die(c: V3, s: number, rot: V3, body: string, pip: string): Shape[] {
  const g = s * 0.5, pr = s * 0.2;
  const faces: { n: V3; u: V3; v: V3; pts: [number, number][] }[] = [
    { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], pts: [[0, 0]] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[-1, -1], [1, 1]] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], pts: [[-1, -1], [0, 0], [1, 1]] },
    { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], pts: [[-1, -1], [1, 1], [-1, 1], [1, -1]] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], pts: [[-1, -1], [1, 1], [-1, 1], [1, -1], [0, 0]] },
    { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1], pts: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] },
  ];
  const out: Shape[] = [{ t: "box", c, s: [s, s, s], round: s * 0.3, rot, col: body, k: 0.01 }];
  for (const f of faces) for (const [a, b] of f.pts) {
    const l: V3 = [f.n[0] * s + (f.u[0] * a + f.v[0] * b) * g, f.n[1] * s + (f.u[1] * a + f.v[1] * b) * g, f.n[2] * s + (f.u[2] * a + f.v[2] * b) * g];
    const w = eul(l, rot);
    out.push({ ...dot([c[0] + w[0], c[1] + w[1], c[2] + w[2]], pr, pip), paint: true });
  }
  return out;
}

/** Points along a spiral in the xy plane around c, from radius r0 to r1 over `turns`, z drifting by dz. */
function spiral(c: V3, r0: number, r1: number, a0: number, turns: number, n: number, dz = 0, ry = 1): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = rad(a0 + turns * 360 * t), r = r0 + (r1 - r0) * t;
    out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a) * ry, c[2] + dz * t]);
  }
  return out;
}

/** A playing card (half-size w × h) facing +z at c: a face, a border and a centred symbol. */
function card(c: V3, w: number, h: number, face: string, edge: string, sym: string): Shape[] {
  return [
    { t: "box", c, s: [w, h, 0.012], round: 0.012, col: edge, k: 0.005 },
    { t: "box", c: [c[0], c[1], c[2] + 0.012], s: [w * 0.78, h * 0.84, 0.01], round: 0.008, col: face, paint: true },
    { t: "ell", c: [c[0], c[1], c[2] + 0.014], r: [w * 0.38, w * 0.38, 0.012], col: sym, paint: true },
    { t: "box", c: [c[0], c[1], c[2] + 0.014], s: [w * 0.24, w * 0.24, 0.012], round: 0.003, rot: [0, 0, 45], col: edge, paint: true },
  ];
}

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

/** An open hand, palm toward +z, fingers up; thumb on the `side` (+1 = +x). Wrist at y ≈ 0.05. */
function hand(skin: string, cuff: string, side: 1 | -1 = 1, curl = 0): Shape[] {
  const len = [0.19, 0.25, 0.24, 0.2];
  return [
    { t: "cap", a: [0, -0.12, 0], b: [0, 0.3, 0], r: [0.1, 0.1], col: cuff, k: 0.04 },
    { t: "box", c: [0, 0.42, 0], s: [0.15, 0.15, 0.065], round: 0.06, col: skin, k: 0.05 },
    ...[-0.105, -0.035, 0.035, 0.105].map((x, i): Shape => ({ t: "cap", a: [x * side, 0.52, 0], b: [x * 1.15 * side, 0.52 + len[i], curl], r: [0.042, 0.036], col: skin, k: 0.02 })),
    { t: "cap", a: [0.12 * side, 0.36, 0.01], b: [0.25 * side, 0.5, 0.04], r: [0.048, 0.04], col: skin, k: 0.03 },
  ];
}

// MARK: Palettes

const CHAOS = { mag: "#be185d", mag2: "#8a0f43", pink: "#ff5fb0", pink2: "#ffa6d6", violet: "#9b5cf6", violet2: "#5b2a9a", glint: "#ffffff", ink: "#1c1424" };

export const artNuevos6: Record<string, Sculpt> = {
  // Velo, el Hermano Veloz: Lucía's lean younger brother mid-sprint, short spiky silver-white hair,
  // a plain blue-grey tracksuit with a white side stripe, a magenta scarf streaming behind, blur streaks.
  "velo-hermano": {
    palette: {
      ...CHAOS, skin: "#f1c6a2", hair: "#e6eaf2", hair2: "#b9c1d0", suit: "#7d899e", suit2: "#5a6478", stripe: "#f2f4f8",
      shoe: "#f4f4f6", sole: "#3a3f4c", streak: "#c9d6ec", streak2: "#ffc2e2", mouth: "#8a3a34",
    },
    glow: ["streak", "streak2"],
    shapes: [
      // Speed streaks trailing behind.
      ...([[0.62, 0.0, 0.46, "streak"], [0.48, 0.14, 0.34, "streak2"], [0.36, -0.12, 0.38, "streak"], [0.24, 0.1, 0.3, "streak2"], [0.82, -0.08, 0.3, "streak"], [0.12, -0.1, 0.26, "streak"]] as [number, number, number, string][])
        .map(([y, z, len, col]): Shape => ({ t: "cap", a: [-0.2, y, z - 0.08], b: [-0.2 - len, y, z - 0.1], r: [0.018, 0.004], col, k: 0 })),
      // Legs mid-stride: near leg driving forward, far leg kicked back.
      { t: "cap", a: [0.0, 0.3, 0.07], b: [0.17, 0.22, 0.08], r: [0.062, 0.055], col: "suit" },
      { t: "cap", a: [0.17, 0.22, 0.08], b: [0.14, 0.06, 0.08], r: [0.05, 0.042], col: "suit", k: 0.02 },
      { t: "ell", c: [0.19, 0.04, 0.08], r: [0.08, 0.042, 0.05], col: "shoe", k: 0.01 },
      { t: "ell", c: [0.19, 0.005, 0.08], r: [0.08, 0.012, 0.05], col: "sole", paint: true },
      { t: "cap", a: [-0.02, 0.3, -0.07], b: [-0.1, 0.16, -0.08], r: [0.062, 0.055], col: "suit2" },
      { t: "cap", a: [-0.1, 0.16, -0.08], b: [-0.27, 0.22, -0.08], r: [0.05, 0.042], col: "suit2", k: 0.02 },
      { t: "ell", c: [-0.31, 0.24, -0.08], r: [0.075, 0.04, 0.05], rot: [0, 0, 40], col: "shoe", k: 0.01 },
      // Torso leaning into the run, white side stripe, zip.
      { t: "ell", c: [0.04, 0.43, 0], r: [0.12, 0.155, 0.13], rot: [0, 0, -16], col: "suit" },
      { t: "cap", a: [0.13, 0.31, 0.0], b: [0.2, 0.52, 0.0], r: [0.008, 0.008], col: "suit2", paint: true },
      { t: "cap", a: [-0.02, 0.3, 0.13], b: [0.06, 0.55, 0.12], r: [0.015, 0.015], col: "stripe", paint: true },
      // Magenta scarf at the neck, its long ends streaming back.
      { t: "tor", c: [0.1, 0.56, 0], R: 0.085, r: 0.035, rot: [0, 0, -20], col: "mag", k: 0.02 },
      ...chain([[0.0, 0.58, 0.04], [-0.14, 0.6, 0.06], [-0.28, 0.55, 0.03], [-0.42, 0.6, 0.06], [-0.54, 0.56, 0.04]], 0.04, 0.025, "mag", 0.03),
      ...chain([[0.0, 0.56, -0.02], [-0.12, 0.52, -0.04], [-0.26, 0.47, -0.02], [-0.38, 0.5, -0.04]], 0.034, 0.02, "mag2", 0.03),
      // Head: short swept silver-white hair with spikes blown back.
      { t: "ell", c: [0.13, 0.72, 0], r: [0.17, 0.16, 0.16], col: "skin", k: 0.06 },
      { t: "ell", c: [0.07, 0.79, 0], r: [0.16, 0.12, 0.17], col: "hair", k: 0.02 },
      { t: "ell", c: [0.21, 0.84, 0.01], r: [0.08, 0.04, 0.13], rot: [0, 0, -18], col: "hair", k: 0.02 },
      spike([0.0, 0.85, 0.06], 165, 0.17, [0.05, 0.008], "hair", 0.03),
      spike([0.0, 0.79, -0.08], 175, 0.17, [0.05, 0.008], "hair", 0.03),
      spike([0.02, 0.88, -0.03], 150, 0.15, [0.05, 0.008], "hair2", 0.03),
      spike([-0.02, 0.74, 0.1], 185, 0.14, [0.045, 0.008], "hair", 0.03),
      { t: "cap", a: [0.27, 0.635, -0.02], b: [0.25, 0.64, 0.06], r: [0.008, 0.008], col: "mouth", paint: true },
      // Arms pumping: near forearm swung forward, far arm back.
      { t: "cap", a: [0.06, 0.5, 0.14], b: [0.18, 0.4, 0.17], r: [0.042, 0.04], col: "suit" },
      { t: "cap", a: [0.18, 0.4, 0.17], b: [0.29, 0.52, 0.15], r: [0.04, 0.036], col: "suit", k: 0.02 },
      dot([0.31, 0.54, 0.15], 0.045, "skin", 0.02),
      ...arm(-1, [-0.2, 0.36, -0.15], "suit2", "skin", 0.04),
    ],
    eyes: [
      { at: [0.13, 0.71, 0.08], r: 0.05, iris: "#4a8ad0", angry: true, look: [0.75, 0.04, 0.6] },
      { at: [0.13, 0.71, -0.045], r: 0.046, iris: "#4a8ad0", angry: true, look: [0.97, 0.04, 0.22] },
    ],
  },

  // Desorden Arcano: dice tumbling through a swirl of pink-violet chaos energy, one card spinning free.
  "desorden-arcano": {
    palette: { ...CHAOS, dieW: "#f6f2fa", dieP: "#f3d3ea", pipD: "#2a1838", cardB: "#2a1838", cardF: "#be185d", star: "#ffd66a" },
    glow: ["pink", "pink2", "violet", "glint", "star"],
    shapes: [
      // The swirl: two interleaved spiral ribbons.
      ...chain(spiral([0, 0.5, -0.1], 0.08, 0.5, 0, 1.25, 24, -0.1, 0.85), 0.012, 0.04, "pink", 0.01),
      ...chain(spiral([0, 0.5, -0.12], 0.1, 0.46, 180, 1.15, 22, -0.1, 0.85), 0.01, 0.032, "violet", 0.01),
      dot([0, 0.5, -0.1], 0.06, "pink2"),
      // Tumbling dice.
      ...die([-0.2, 0.62, 0.08], 0.1, [25, 35, 15], "dieW", "pipD"),
      ...die([0.18, 0.36, 0.12], 0.085, [-20, 50, -30], "dieP", "mag2"),
      ...die([0.04, 0.84, 0.05], 0.07, [40, -20, 60], "dieW", "pipD"),
      ...die([-0.1, 0.24, 0.02], 0.06, [10, 70, 35], "dieW", "mag2"),
      // A card flying free out of the swirl.
      ...rotZ(card([0.42, 0.78, 0.04], 0.085, 0.125, "cardF", "cardB", "star"), -28, [0.42, 0.78, 0]),
      ...chain([[0.32, 0.68, 0.0], [0.24, 0.62, -0.02], [0.14, 0.6, -0.04]], 0.008, 0.002, "pink2", 0),
      ...sparkle([-0.38, 0.92, 0.06], 0.06, "glint"),
      ...sparkle([0.36, 0.2, 0.08], 0.05, "glint"),
      dot([-0.42, 0.3, 0.05], 0.018, "pink2"),
      dot([0.3, 0.98, 0.0], 0.015, "pink2"),
    ],
    eyes: [],
  },

  // Sortilegio: an open hand in a magenta cuff, three cards fanned above it, each glowing a different
  // colour (rose, violet, gold), magenta sparks rising.
  sortilegio: {
    palette: {
      ...CHAOS, skin: "#f1c6a2", cuff: "#be185d", cuffB: "#1c1424",
      c1: "#ff7ac0", c1f: "#fff0f8", c2: "#a879ff", c2f: "#f2ecff", c3: "#ffc94a", c3f: "#fff8e2", back: "#2a1838",
    },
    glow: ["c1", "c2", "c3", "glint", "pink"],
    shapes: [
      ...rotZ(place(hand("skin", "cuff", 1, 0.08), 0.85, [0, -0.08, 0]), -8, [0, 0.2, 0]),
      { t: "tor", c: [0, 0.12, 0], R: 0.09, r: 0.02, col: "cuffB", k: 0.01 },
      // Fanned cards floating above the fingertips.
      ...rotZ(card([0, 0.86, -0.06], 0.11, 0.16, "c1f", "c1", "mag"), 28, [0, 0.55, 0]),
      ...rotZ(card([0, 0.9, 0.0], 0.11, 0.16, "c2f", "c2", "violet2"), 0, [0, 0.55, 0]),
      ...rotZ(card([0, 0.86, 0.06], 0.11, 0.16, "c3f", "c3", "mag2"), -28, [0, 0.55, 0]),
      // Magenta sparks.
      ...sparkle([-0.36, 0.7, 0.08], 0.06, "pink"),
      ...sparkle([0.38, 0.62, 0.1], 0.055, "pink"),
      ...sparkle([0.2, 1.14, 0.06], 0.045, "glint"),
      dot([-0.24, 1.08, 0.05], 0.018, "pink"),
      dot([0.3, 0.38, 0.1], 0.015, "pink"),
      dot([-0.3, 0.42, 0.1], 0.013, "pink"),
    ],
    eyes: [],
  },

  // Disolución: a solid grey-violet block coming apart at one corner into a stream of cubes and
  // particles that turn pink and violet as they drift away.
  disolucion: {
    palette: { ...CHAOS, block: "#7a7490", block2: "#5a546e", crack: "#ff7ac0" },
    glow: ["pink", "pink2", "violet", "glint", "crack"],
    shapes: [
      { t: "box", c: [-0.15, 0.25, 0], s: [0.24, 0.24, 0.24], round: 0.03, col: "block", k: 0 },
      // The dissolving corner: bites carved out of the top-right.
      { t: "box", c: [0.12, 0.52, 0.1], s: [0.17, 0.17, 0.22], round: 0.01, rot: [0, 0, 45], col: "block", cut: true, k: 0.0 },
      { t: "box", c: [0.05, 0.36, 0.22], s: [0.08, 0.08, 0.08], round: 0.01, rot: [20, 30, 0], col: "block", cut: true, k: 0.0 },
      { t: "box", c: [-0.1, 0.5, 0.2], s: [0.07, 0.07, 0.07], round: 0.01, rot: [10, 40, 20], col: "block", cut: true, k: 0.0 },
      { t: "box", c: [-0.28, 0.08, 0.1], s: [0.2, 0.1, 0.16], round: 0.02, col: "block2", paint: true },
      ...chain([[-0.02, 0.4, 0.245], [-0.1, 0.3, 0.245], [-0.06, 0.2, 0.245], [-0.16, 0.1, 0.245]], 0.008, 0.005, "crack", 0, true),
      // Cubes peeling off, shrinking and changing colour.
      ...([
        [0.12, 0.5, 0.08, 0.06, "block"], [0.0, 0.58, 0.14, 0.05, "block"], [0.2, 0.62, 0.0, 0.05, "violet2"], [0.1, 0.72, 0.1, 0.045, "violet"],
        [0.3, 0.72, 0.06, 0.04, "violet"], [0.22, 0.86, -0.02, 0.035, "pink"], [0.38, 0.88, 0.1, 0.03, "pink"], [0.32, 1.0, 0.0, 0.025, "pink2"],
        [0.48, 1.0, 0.06, 0.02, "pink2"], [0.12, 0.96, 0.08, 0.025, "violet"], [0.42, 0.62, 0.12, 0.028, "pink"],
      ] as [number, number, number, number, string][]).map(([x, y, z, s, col], i): Shape => ({ t: "box", c: [x, y, z], s: [s, s, s], round: s * 0.25, rot: [i * 37, i * 53, i * 29], col, k: 0 })),
      ...([[0.04, 0.82, 0.12, 0.014], [0.5, 0.82, 0.04, 0.012], [0.4, 1.12, 0.02, 0.012], [0.26, 1.12, 0.06, 0.01], [0.58, 0.94, 0.08, 0.01], [0.18, 0.44, 0.16, 0.012]] as number[][])
        .map(([x, y, z, r]) => dot([x, y, z], r, "pink2")),
      ...sparkle([0.56, 1.1, 0.06], 0.05, "glint"),
    ],
    eyes: [],
  },

  // Torcer la Realidad: a stone doorway twisted into an S-bend, its opening a pink-violet vortex
  // spiralling inward, the space behind it bent.
  "torcer-realidad": {
    palette: { ...CHAOS, frame: "#8a7a96", frame2: "#5e5070", hole: "#2a1240", sky: "#3a2a6a" },
    glow: ["pink", "pink2", "violet", "glint"],
    shapes: (() => {
      const cx = 0, cy = 0.55, W = 0.3, H = 0.46;
      const swirl = (p: V3): V3 => {
        const x = p[0] - cx, y = p[1] - cy, r = Math.hypot(x / W, y / H);
        const a = rad(38 * Math.exp(-r * r * 0.6) * (1 + 0.3 * Math.sin(p[1] * 6)));
        return [cx + x * Math.cos(a) - y * Math.sin(a) * 0.7, cy + x * Math.sin(a) * 1.3 + y * Math.cos(a), p[2] + 0.05 * Math.sin(p[1] * 7)];
      };
      const rect: V3[] = [];
      const corners: [number, number][] = [[-W, -H], [W, -H], [W, H * 0.6], [0, H], [-W, H * 0.6], [-W, -H]];
      for (let i = 0; i < corners.length - 1; i++) {
        for (let j = 0; j < 6; j++) {
          const t = j / 6;
          rect.push([cx + corners[i][0] + (corners[i + 1][0] - corners[i][0]) * t, cy + corners[i][1] + (corners[i + 1][1] - corners[i][1]) * t, 0]);
        }
      }
      rect.push(rect[0]);
      const frame = rect.map(swirl);
      return [
        // The bent space behind: a dark backing warped like the frame.
        { t: "ell", c: [cx, cy, -0.08], r: [0.3, 0.44, 0.04], rot: [0, 0, -18], col: "sky", k: 0 },
        ...chain(frame, 0.05, 0.05, "frame", 0.03),
        ...chain(frame.map((p): V3 => [p[0], p[1], p[2] + 0.04]), 0.02, 0.02, "frame2", 0.01, true),
        // Vortex: spiral arms falling inward to a dark eye.
        ...chain(spiral([cx, cy, -0.04], 0.26, 0.03, 90, 1.4, 22, 0.02, 1.35), 0.03, 0.01, "pink", 0.01),
        ...chain(spiral([cx, cy, -0.04], 0.24, 0.03, 270, 1.4, 22, 0.02, 1.35), 0.026, 0.01, "violet", 0.01),
        dot([cx, cy, -0.04], 0.05, "hole"),
        // Bits of the world being pulled in.
        { t: "box", c: [0.42, 0.95, 0.05], s: [0.04, 0.04, 0.04], round: 0.01, rot: [20, 30, 40], col: "frame2", k: 0 },
        { t: "box", c: [-0.42, 0.3, 0.05], s: [0.035, 0.035, 0.035], round: 0.01, rot: [40, 10, 20], col: "frame", k: 0 },
        ...chain(spiral([cx, cy, 0.04], 0.62, 0.48, 30, 0.25, 6, 0, 1), 0.012, 0.004, "pink2", 0),
        ...chain(spiral([cx, cy, 0.04], 0.62, 0.48, 210, 0.25, 6, 0, 1), 0.012, 0.004, "pink2", 0),
        ...sparkle([0.36, 0.22, 0.08], 0.05, "glint"),
        ...sparkle([-0.36, 1.0, 0.04], 0.045, "glint"),
      ];
    })(),
    eyes: [],
  },

  // Maestra Eulalia: an elderly witch mentor with a silver-grey bun and round spectacles, a warm
  // rust knitted shawl over a navy dress, a teacup in one hand and a fan of tarot cards in the other,
  // a sly half-lidded smile.
  "maestra-eulalia": {
    palette: {
      skin: "#efc6a6", hair: "#c9ccd4", hair2: "#9ea3ae", dress: "#2f3a5e", dress2: "#222a46", shawl: "#c4622d", shawl2: "#e08a4a",
      boots: "#3a2a24", specs: "#c9a050", cup: "#f4efe6", cup2: "#5f8fb8", tea: "#9a5a2a", cardB: "#3a2550", gold: "#f0c24a", mouth: "#8a3a34",
      blush: "#f09a8a", steam: "#ffffff",
    },
    glow: ["steam"],
    shapes: [
      // Long dress down to the floor, little boots peeking out.
      { t: "ell", c: [0.08, 0.03, 0.08], r: [0.07, 0.04, 0.055], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.06, 0], b: [0, 0.4, 0], r: [0.21, 0.13], col: "dress", k: 0.04 },
      { t: "tor", c: [0, 0.07, 0], R: 0.19, r: 0.02, col: "dress2", k: 0.01 },
      { t: "ell", c: [0, 0.43, 0], r: [0.14, 0.14, 0.15], col: "dress", k: 0.04 },
      // Knitted shawl over the shoulders, its point hanging at the front.
      { t: "ell", c: [-0.01, 0.47, 0], r: [0.17, 0.08, 0.2], col: "shawl", k: 0.02 },
      { t: "cap", a: [0.1, 0.5, 0.06], b: [0.17, 0.33, 0.0], r: [0.06, 0.015], col: "shawl", k: 0.03 },
      ...[0.43, 0.46, 0.49].map((y): Shape => ({ t: "tor", c: [-0.01, y, 0], R: 0.17, r: 0.007, col: "shawl2", paint: true })),
      { t: "ell", c: [0.15, 0.42, 0.01], r: [0.025, 0.025, 0.025], col: "gold", k: 0.005 },
      // Head: grey hair swept up into a bun, a pencil-like pin through it.
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.03 },
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.18, 0.15, 0.19], col: "hair", k: 0.02 },
      { t: "ell", c: [0.08, 0.84, 0.0], r: [0.1, 0.05, 0.15], rot: [0, 0, -15], col: "hair", k: 0.02 },
      { t: "ell", c: [-0.08, 0.95, 0], r: [0.09, 0.08, 0.09], col: "hair", k: 0.03 },
      { t: "tor", c: [-0.08, 0.95, 0], R: 0.07, r: 0.01, rot: [0, 0, 20], col: "hair2", paint: true },
      { t: "cap", a: [-0.16, 0.92, 0.1], b: [0.0, 1.02, -0.1], r: [0.009, 0.009], col: "cardB", k: 0 },
      // Round spectacles over the eyes.
      { t: "tor", c: [0.125, 0.7, 0.165], R: 0.058, r: 0.008, rot: [90, 0, -30], col: "specs", k: 0 },
      { t: "tor", c: [0.215, 0.705, -0.004], R: 0.054, r: 0.008, rot: [90, 0, -90], col: "specs", k: 0 },
      { t: "cap", a: [0.165, 0.71, 0.13], b: [0.2, 0.71, 0.05], r: [0.007, 0.007], col: "specs", k: 0 },
      { t: "ell", c: [0.15, 0.64, 0.1], r: [0.03, 0.018, 0.03], col: "blush", paint: true },
      { t: "cap", a: [0.19, 0.615, -0.03], b: [0.17, 0.605, 0.04], r: [0.007, 0.007], col: "mouth", paint: true },
      { t: "cap", a: [0.17, 0.605, 0.04], b: [0.15, 0.615, 0.07], r: [0.007, 0.007], col: "mouth", paint: true },
      // Near hand: a teacup on a saucer, a wisp of steam.
      ...arm(1, [0.24, 0.36, 0.2], "dress", "skin", 0.042),
      { t: "cap", a: [0.28, 0.39, 0.2], b: [0.28, 0.4, 0.2], r: [0.09, 0.09], col: "cup2", k: 0 },
      { t: "cap", a: [0.28, 0.41, 0.2], b: [0.28, 0.51, 0.2], r: [0.05, 0.068], col: "cup", k: 0.01 },
      { t: "tor", c: [0.28, 0.46, 0.2], R: 0.06, r: 0.01, col: "cup2", paint: true },
      { t: "ell", c: [0.28, 0.515, 0.2], r: [0.056, 0.01, 0.056], col: "tea", k: 0 },
      { t: "tor", c: [0.36, 0.46, 0.2], R: 0.025, r: 0.009, rot: [90, 0, 0], col: "cup", k: 0.004 },
      ...chain([[0.28, 0.54, 0.2], [0.3, 0.6, 0.2], [0.27, 0.66, 0.2], [0.29, 0.72, 0.2]], 0.011, 0.005, "steam", 0),
      // Far hand: a fan of tarot cards held up beside her face.
      ...arm(-1, [0.22, 0.56, -0.22], "dress", "skin", 0.042),
      ...[-22, 0, 22].map((a, i): Shape => ({
        t: "box", c: [0.24 + i * 0.008, 0.6 + 0.09 * Math.cos(rad(a)), -0.24 + 0.09 * Math.sin(rad(a))], s: [0.004, 0.09, 0.055], round: 0.006, rot: [a, 0, 0], col: "cardB", k: 0,
      })),
      { t: "ell", c: [0.258, 0.69, -0.24], r: [0.006, 0.022, 0.022], col: "gold", paint: true },
      { t: "ell", c: [0.25, 0.68, -0.29], r: [0.008, 0.016, 0.016], col: "gold", paint: true },
    ],
    eyes: [
      { at: [0.02, 0.7, 0.085], r: 0.046, iris: "#5a8a6a", angry: true, look: [0.75, 0.04, 0.6] },
      { at: [0.02, 0.7, -0.045], r: 0.043, iris: "#5a8a6a", angry: true, look: [0.97, 0.04, 0.22] },
    ],
  },

  // Escudo de Bruma: a bubble shield of pink mist with soft swirls and a bright rim, an arrow
  // glancing off it with a burst at the point of impact.
  "escudo-bruma": {
    palette: { ...CHAOS, bubble: "#f7b3d8", bubble2: "#e78ac0", mist: "#ffd8ec", shaft: "#8a5a34", head: "#a7adb8", fletch: "#e8e4dc", impact: "#fff0c4" },
    glow: ["mist", "glint", "impact", "pink"],
    shapes: [
      { t: "ell", c: [-0.05, 0.42, 0], r: [0.36, 0.36, 0.34], col: "bubble", k: 0 },
      { t: "tor", c: [-0.05, 0.42, 0], R: 0.34, r: 0.03, rot: [90, 0, 0], col: "bubble2", k: 0.04 },
      // Mist swirls painted across the bubble, and highlights.
      ...chain(spiral([-0.05, 0.42, 0.3], 0.06, 0.24, 0, 1.2, 16, 0.04, 0.9), 0.02, 0.03, "mist", 0, true),
      ...chain(spiral([-0.2, 0.62, 0.25], 0.02, 0.1, 90, 0.7, 8, 0, 1), 0.03, 0.03, "glint", 0, true),
      ...chain(spiral([-0.05, 0.42, 0], 0.39, 0.39, 160, 0.18, 6, 0.0, 1), 0.012, 0.012, "glint", 0),
      // Wisps of mist curling off the bubble.
      ...chain(spiral([-0.4, 0.2, 0.12], 0.02, 0.12, 0, 0.9, 10, 0, 1), 0.012, 0.03, "mist", 0.02),
      ...chain(spiral([0.26, 0.12, 0.14], 0.02, 0.1, 180, -0.9, 10, 0, 1), 0.012, 0.028, "mist", 0.02),
      ...chain(spiral([-0.34, 0.74, 0.1], 0.015, 0.08, 90, 0.8, 8, 0, 1), 0.01, 0.024, "mist", 0.02),
      // The arrow glancing off the right side, bouncing up and away.
      ...burst([0.32, 0.5, 0.1], 8, 10, 0.12, [0.025, 0.004], "impact", { len: 0.07, r: [0.02, 0.004], col: "pink" }, 0),
      { t: "cap", a: [0.37, 0.56, 0.1], b: [0.66, 0.94, 0.1], r: [0.02, 0.02], col: "shaft", k: 0 },
      { t: "cap", a: [0.36, 0.545, 0.1], b: [0.4, 0.6, 0.1], r: [0.05, 0.006], col: "head", k: 0 },
      ...[1, -1].map((s): Shape => ({ t: "cap", a: [0.62, 0.89, 0.1], b: [0.68 + s * 0.05, 0.92 - s * 0.03, 0.1], r: [0.012, 0.035], col: s > 0 ? "fletch" : "mag", k: 0 })),
      ...[1, -1].map((s): Shape => ({ t: "cap", a: [0.58, 0.84, 0.1], b: [0.64 + s * 0.05, 0.87 - s * 0.03, 0.1], r: [0.012, 0.03], col: s > 0 ? "fletch" : "mag", k: 0 })),
      ...chain([[0.48, 0.5, 0.1], [0.6, 0.46, 0.1], [0.72, 0.44, 0.1]], 0.006, 0.002, "glint", 0),
      ...sparkle([-0.36, 0.84, 0.06], 0.05, "glint"),
    ],
    eyes: [],
  },

  // Diadema del Azar: a slim silver circlet with a single round pip-gem (a die's one) on the front,
  // resting on a plum velvet cushion with gold tassels.
  "diadema-azar": {
    palette: { ...CHAOS, velvet: "#6a1a4a", velvet2: "#4a0f34", trim: "#e0b04a", silver: "#dfe4ee", silver2: "#a8b0c2", gem: "#ff4fa6", gemCore: "#ffd6ec", gemSet: "#f6f8fc" },
    glow: ["gem", "gemCore", "glint", "pink"],
    shapes: [
      // Cushion: a soft plump square with piping and corner tassels.
      { t: "box", c: [0, 0.12, 0], s: [0.38, 0.1, 0.32], round: 0.09, col: "velvet", k: 0 },
      { t: "ell", c: [0, 0.2, 0], r: [0.3, 0.06, 0.25], col: "velvet", k: 0.08 },
      { t: "tor", c: [0, 0.12, 0], R: 0.33, r: 0.016, col: "trim", k: 0.01 },
      { t: "ell", c: [0, 0.255, 0], r: [0.025, 0.012, 0.025], col: "velvet2", paint: true },
      ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]): Shape[] => [
        dot([sx * 0.35, 0.12, sz * 0.29], 0.025, "trim", 0.005),
        { t: "cap", a: [sx * 0.36, 0.1, sz * 0.3], b: [sx * 0.37, 0.03, sz * 0.31], r: [0.014, 0.026], col: "trim", k: 0.01 },
      ]),
      // The circlet resting on top, tilted toward the viewer.
      { t: "tor", c: [0, 0.33, 0], R: 0.24, r: 0.016, rot: [32, 0, 0], col: "silver", k: 0 },
      { t: "tor", c: [0, 0.33, 0], R: 0.24, r: 0.007, rot: [32, 0, 0], col: "silver2", paint: true },
      // Front setting with the round pip-gem, two tiny side beads.
      { t: "ell", c: [0.0, 0.31, 0.21], r: [0.06, 0.06, 0.03], rot: [-20, 0, 0], col: "gemSet", k: 0.01 },
      { t: "ell", c: [0.0, 0.315, 0.23], r: [0.042, 0.042, 0.028], rot: [-20, 0, 0], col: "gem", k: 0.005 },
      { t: "ell", c: [-0.012, 0.33, 0.255], r: [0.016, 0.016, 0.008], col: "gemCore", k: 0 },
      ...[1, -1].map((s): Shape => dot([s * 0.11, 0.29, 0.19], 0.014, "silver", 0.005)),
      // Sparkles of luck.
      ...sparkle([0.2, 0.62, 0.15], 0.06, "glint"),
      ...sparkle([-0.28, 0.5, 0.1], 0.045, "pink"),
      dot([0.32, 0.42, 0.12], 0.014, "pink"),
      dot([-0.12, 0.66, 0.1], 0.012, "pink2"),
    ],
    eyes: [],
  },
};
