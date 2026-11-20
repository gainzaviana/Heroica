import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, rad } from "./kit";

// Album cards for Centella, Mole and Soberano's rebuilt decks — art batch 5.
// Guardia blue and gold; Mole Tronante's storm green (#3f8a3a); Centella's gold (#d9a21b) and deep blue.
// One iconic object or small scene each.

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

/** Points on a quadratic Bézier curve. */
function bez(p0: V3, p1: V3, p2: V3, n = 10): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1, 2].map((j) => u * u * p0[j] + 2 * u * t * p1[j] + t * t * p2[j]) as V3);
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

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

/** A small five-point cartoon star (dizzy stars, insignia), facing +z. */
function star(c: V3, R: number, col: string, phase = 90): Shape[] {
  return [
    { t: "ell", c, r: [R * 0.42, R * 0.42, R * 0.25], col, k: 0 },
    ...burst(c, 5, phase, R, [R * 0.34, R * 0.06], col, undefined, R * 0.2),
  ];
}

const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

/**
 * A clenched fist, knuckles up (+y), curled fingers facing the camera (+z), thumb crossing them;
 * forearm down to y ≈ -0.6. Rotate it about z to aim the knuckles: fingers keep facing the camera.
 */
function fist(skin: string, knuckle: string, crease: string, arm = skin, armLen = 0.62): Shape[] {
  return [
    { t: "cap", a: [0, -armLen, -0.01], b: [0, -0.1, -0.01], r: [0.125, 0.13], col: arm, k: 0.05 },
    { t: "box", c: [0, 0.06, 0], s: [0.18, 0.15, 0.12], round: 0.08, col: skin, k: 0.05 },
    ...[-0.12, -0.04, 0.04, 0.12].flatMap((x, i): Shape[] => [
      { t: "ell", c: [x, 0.2 - Math.abs(i - 1.5) * 0.012, 0.0], r: [0.046, 0.045, 0.1], col: knuckle, k: 0.015 },
      { t: "ell", c: [x, 0.1 - Math.abs(i - 1.5) * 0.012, 0.1], r: [0.045, 0.09, 0.055], col: skin, k: 0.008 },
    ]),
    ...[-0.08, 0, 0.08].map((x): Shape => ({ t: "box", c: [x, 0.11, 0.15], s: [0.011, 0.08, 0.04], round: 0.005, col: crease, paint: true })),
    { t: "cap", a: [0.21, -0.06, 0.02], b: [0.0, -0.01, 0.16], r: [0.06, 0.048], col: skin, k: 0.025 },
    { t: "box", c: [0.07, -0.0, 0.16], s: [0.08, 0.005, 0.04], round: 0.004, rot: [0, 0, 12], col: crease, paint: true },
  ];
}

/** z on the front (+z) surface of an ellipsoid at (x, y), plus a lift. */
function onEll(c: V3, r: V3, x: number, y: number, lift = 0): number {
  const q = 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2;
  return c[2] + r[2] * Math.sqrt(Math.max(q, 0)) + lift;
}

/** A rough rock chunk. */
function rock(c: V3, s: number, col: string, spinDeg = 20): Shape {
  return { t: "box", c, s: [s, s * 0.8, s * 0.9], round: s * 0.35, rot: [spinDeg, spinDeg * 1.7, spinDeg * 0.6], col, k: 0 };
}

// MARK: Palettes

const GUA = { blue: "#2f5fa8", blue2: "#4f86d6", navy: "#1f2f55", gold: "#e0b040", gold2: "#ffd66a", hot: "#fff6d0" };
const MOLE = { skin: "#3f8a3a", skin2: "#1f4d1e", skinL: "#58a64c", strap: "#5a3a24" };
const CEN = { gold: "#d9a21b", gold2: "#ffd25a", deep: "#1c2a6b", deep2: "#3550b0", hot: "#fff6d8" };

// MARK: Pieces

/** The Guardia sigil: a blue heater shield with a gold five-point star, facing +z at c. */
function guardiaShield(c: V3, s: number): Shape[] {
  return [
    { t: "ell", c: [c[0], c[1] + s * 0.25, c[2]], r: [s, s * 0.8, s * 0.22], col: "gold", k: 0.01 },
    { t: "box", c: [c[0], c[1] - s * 0.3, c[2]], s: [s * 0.64, s * 0.64, s * 0.2], round: s * 0.12, rot: [0, 0, 45], col: "gold", k: s * 0.3 },
    { t: "ell", c: [c[0], c[1] + s * 0.25, c[2] + s * 0.1], r: [s * 0.84, s * 0.64, s * 0.3], col: "blue", paint: true },
    { t: "box", c: [c[0], c[1] - s * 0.3, c[2] + s * 0.1], s: [s * 0.5, s * 0.5, s * 0.3], round: s * 0.1, rot: [0, 0, 45], col: "blue", paint: true },
    ...star([c[0], c[1] + s * 0.05, c[2] + s * 0.24], s * 0.55, "gold2"),
    // the star again as paint, so the blue face paint does not cover it
    ...star([c[0], c[1] + s * 0.05, c[2] + s * 0.24], s * 0.55, "gold2").map((sh): Shape => ({ ...sh, paint: true })),
  ];
}

/** A brass rotor on a mast: blades spinning flat above the hub. */
function rotor(x: number, z: number, y0: number, y1: number, len: number, phase: number): Shape[] {
  return [
    { t: "cap", a: [x, y0, z], b: [x, y1, z], r: [0.026, 0.02], col: "brass2", k: 0.02 },
    { t: "ell", c: [x, y1, z], r: [0.045, 0.035, 0.045], col: "brass", k: 0.01 },
    ...[0, 120, 240].map((a): Shape => ({ t: "ell", c: [x + Math.cos(rad(a + phase)) * len * 0.5, y1 + 0.01, z - Math.sin(rad(a + phase)) * len * 0.5], r: [len * 0.5, 0.014, 0.05], rot: [0, a + phase, 4], col: "brass", k: 0.02 })),
  ];
}

/** A dark threat wisp: a few smoky blobs with a curling tail. */
function wisp(c: V3, s: number, tail: V3): Shape[] {
  return [
    { t: "ell", c, r: [s, s * 0.8, s * 0.7], col: "smoke", k: 0 },
    { t: "ell", c: [c[0] + s * 0.6, c[1] + s * 0.4, c[2]], r: [s * 0.7, s * 0.6, s * 0.55], col: "smoke", k: s * 0.6 },
    { t: "ell", c: [c[0] - s * 0.5, c[1] + s * 0.2, c[2]], r: [s * 0.6, s * 0.5, s * 0.5], col: "smoke2", k: s * 0.6 },
    ...path(bez([c[0] - s * 0.6, c[1], c[2]], [c[0] + tail[0] * 0.5, c[1] + tail[1] * 0.5 - s, c[2]], [c[0] + tail[0], c[1] + tail[1], c[2] + tail[2]], 6), s * 0.45, s * 0.08, "smoke2", s * 0.3),
    dot([c[0] + s * 0.25, c[1] + s * 0.15, c[2] + s * 0.62], s * 0.14, "ember"),
    dot([c[0] + s * 0.65, c[1] + s * 0.25, c[2] + s * 0.5], s * 0.12, "ember"),
  ];
}

/** An alarm bell hung in a little stone frame on a plinth, its red lamp gone dark; a gold ring clamps it silent. */
function bellTower(x: number, lean: number): Shape[] {
  const top = 0.78;
  return [
    { t: "box", c: [x, 0.08, 0], s: [0.17, 0.08, 0.13], round: 0.03, col: "stone" },
    ...[1, -1].map((s): Shape => ({ t: "box", c: [x + 0.13 * s, 0.45, 0], s: [0.03, 0.33, 0.035], round: 0.012, col: "stone2", k: 0.01 })),
    { t: "box", c: [x, top + 0.03, 0], s: [0.18, 0.03, 0.05], round: 0.015, col: "stone2", k: 0.01 },
    { t: "cap", a: [x - 0.21, top + 0.05, 0], b: [x, top + 0.17, 0], r: [0.035, 0.025], col: "roof", k: 0.02 },
    { t: "cap", a: [x + 0.21, top + 0.05, 0], b: [x, top + 0.17, 0], r: [0.035, 0.025], col: "roof", k: 0.02 },
    // the bell, swung a little
    ...rotZ([
      { t: "ell", c: [x, top - 0.02, 0], r: [0.03, 0.025, 0.03], col: "bell2", k: 0.01 },
      { t: "ell", c: [x, top - 0.1, 0], r: [0.07, 0.07, 0.07], col: "bell", k: 0.03 },
      { t: "cap", a: [x, top - 0.1, 0], b: [x, top - 0.3, 0], r: [0.07, 0.11], col: "bell", k: 0.05 },
      { t: "tor", c: [x, top - 0.31, 0], R: 0.105, r: 0.022, col: "bell2", k: 0.01 },
      { t: "cap", a: [x, top - 0.28, 0], b: [x, top - 0.42, 0], r: [0.09, 0.09], col: "bell", cut: true, k: 0.01 },
      { t: "ell", c: [x, top - 0.33, 0], r: [0.03, 0.03, 0.03], col: "bell2", k: 0 },
      // gold silencing band clamped round the bell's waist
      { t: "tor", c: [x, top - 0.2, 0], R: 0.09, r: 0.02, col: "gold2", k: 0 },
    ], lean, [x, top, 0]),
    // dark warning lamp on the plinth
    { t: "ell", c: [x, 0.09, 0.13], r: [0.045, 0.045, 0.02], col: "lamp", k: 0.01 },
    { t: "tor", c: [x, 0.09, 0.13], R: 0.048, r: 0.01, rot: [90, 0, 0], col: "stone2", k: 0 },
  ];
}

export const artAlbum5: Record<string, Sculpt> = {
  // Nave de la Guardia: a sturdy wooden flying transport, blue-and-gold, two brass rotors, the shield-and-star on its flank.
  "nave-guardia": {
    palette: { ...GUA, wood: "#9a6438", wood2: "#6e4426", brass: "#d9a23a", brass2: "#a8741e", glass: "#bfe8ff", rune: "#7fe0ff", cloud: "#f3f6fb" },
    glow: ["glass", "rune", "hot"],
    shapes: [
      // clouds below
      { t: "ell", c: [-0.28, 0.06, 0.1], r: [0.18, 0.07, 0.12], col: "cloud" },
      { t: "ell", c: [-0.12, 0.08, 0.12], r: [0.13, 0.08, 0.1], col: "cloud", k: 0.06 },
      { t: "ell", c: [0.32, 0.04, -0.05], r: [0.15, 0.05, 0.1], col: "cloud" },
      // hull: wooden keel, flat deck
      { t: "ell", c: [0, 0.42, 0], r: [0.58, 0.2, 0.22], col: "wood" },
      { t: "box", c: [0, 0.72, 0], s: [0.8, 0.17, 0.4], round: 0, col: "wood", cut: true, k: 0.02 },
      { t: "box", c: [0, 0.38, 0], s: [0.7, 0.012, 0.228], round: 0, col: "wood2", paint: true },
      { t: "box", c: [0, 0.3, 0], s: [0.7, 0.012, 0.228], round: 0, col: "wood2", paint: true },
      // blue upper strake with gold trim lines
      { t: "box", c: [0, 0.495, 0], s: [0.7, 0.05, 0.228], round: 0, col: "blue", paint: true },
      { t: "box", c: [0, 0.44, 0], s: [0.7, 0.008, 0.228], round: 0, col: "gold", paint: true },
      // gold rail around the deck
      ...path(Array.from({ length: 25 }, (_, i): V3 => [0.54 * Math.cos(rad(i * 15)), 0.565, 0.2 * Math.sin(rad(i * 15))]), 0.016, 0.016, "gold", 0.01),
      // raised prow with a brass ram
      { t: "cap", a: [0.42, 0.48, 0], b: [0.66, 0.6, 0], r: [0.08, 0.025], col: "wood", k: 0.06 },
      { t: "ell", c: [0.66, 0.6, 0], r: [0.035, 0.035, 0.035], col: "brass", k: 0.01 },
      // stern castle
      { t: "box", c: [-0.4, 0.58, 0], s: [0.12, 0.06, 0.16], round: 0.03, col: "wood", k: 0.04 },
      // cabin
      { t: "box", c: [-0.02, 0.65, 0], s: [0.22, 0.09, 0.13], round: 0.04, col: "blue", k: 0.02 },
      { t: "ell", c: [-0.02, 0.73, 0], r: [0.25, 0.05, 0.15], col: "gold", k: 0.02 },
      ...[-0.13, -0.02, 0.09].map((x): Shape => ({ t: "ell", c: [x, 0.66, 0.125], r: [0.032, 0.032, 0.02], col: "glass", k: 0.005 })),
      ...[-0.13, -0.02, 0.09].map((x): Shape => ({ t: "tor", c: [x, 0.66, 0.128], R: 0.034, r: 0.009, rot: [90, 0, 0], col: "brass", k: 0 })),
      // two rotors on brass masts
      ...rotor(-0.32, 0, 0.62, 0.95, 0.5, 20),
      ...rotor(0.3, 0, 0.56, 0.88, 0.42, 70),
      // brass side fins (stubby wings) and tail fin
      { t: "ell", c: [-0.34, 0.4, 0.22], r: [0.12, 0.02, 0.08], rot: [-10, 0, 0], mirror: true, col: "brass", k: 0.03 },
      { t: "box", c: [-0.58, 0.62, 0], s: [0.09, 0.11, 0.015], round: 0.012, rot: [0, 0, 25], col: "brass", k: 0.03 },
      // stern propeller
      { t: "tor", c: [-0.62, 0.44, 0], R: 0.09, r: 0.014, rot: [0, 0, 90], col: "brass2", k: 0.01 },
      { t: "ell", c: [-0.62, 0.44, 0], r: [0.03, 0.03, 0.03], col: "brass", k: 0.01 },
      ...[0, 120, 240].map((a): Shape => ({ t: "ell", c: [-0.62, 0.44 + 0.045 * Math.cos(rad(a)), 0.045 * Math.sin(rad(a))], r: [0.008, 0.045, 0.02], rot: [a, 0, 0], col: "brass", k: 0.005 })),
      // Guardia shield on the flank
      ...guardiaShield([0.12, 0.43, 0.25], 0.12),
      // rune keel stone
      { t: "ell", c: [0, 0.23, 0], r: [0.08, 0.05, 0.06], col: "rune", k: 0.02 },
      ...sparkle([0.55, 0.92, 0.05], 0.05, "hot"),
    ],
    eyes: [],
  },

  // Red de Informantes: a corkboard on an easel, pinned notes and portraits joined by red string, a candle burning beside it.
  "red-informantes": {
    palette: { cork: "#b98a55", cork2: "#9a6e3e", frame: "#6e4426", paper: "#f6eed8", paper2: "#e8d9a8", pin: "#d23a2a", string: "#c8202a", photo: "#e9e2d0", face: "#a07a5a", hood: "#3a3550", ink: "#4a3a2a", wax: "#f3ead2", flame: "#ff8a2a", flame2: "#fff0b0", brass: "#c99a3a" },
    glow: ["flame", "flame2"],
    shapes: (() => {
      const z = 0.035;
      const pins: V3[] = [[-0.25, 0.92, z + 0.03], [0.2, 0.95, z + 0.03], [-0.02, 0.68, z + 0.03], [-0.3, 0.5, z + 0.03], [0.24, 0.55, z + 0.03]];
      const note = (c: V3, w: number, h: number, ang: number, col: string, lines = 3): Shape[] => [
        { t: "box", c: [c[0], c[1], z], s: [w, h, 0.008], round: 0.004, rot: [0, 0, ang], col, k: 0 },
        ...Array.from({ length: lines }, (_, i): Shape => ({ t: "box", c: [c[0], c[1] + h * 0.5 - (i + 1) * (h / (lines + 1)) * 1.6 + h * 0.3, z + 0.006], s: [w * 0.7, 0.006, 0.006], round: 0.002, rot: [0, 0, ang], col: "ink", paint: true })),
      ];
      const portrait = (c: V3, ang: number): Shape[] => rotZ([
        { t: "box", c: [c[0], c[1], z], s: [0.085, 0.1, 0.008], round: 0.004, col: "photo", k: 0 },
        { t: "box", c: [c[0], c[1] + 0.01, z + 0.004], s: [0.068, 0.075, 0.006], round: 0.003, col: "hood", k: 0 },
        { t: "ell", c: [c[0], c[1] + 0.025, z + 0.012], r: [0.026, 0.03, 0.006], col: "face", k: 0 },
        { t: "ell", c: [c[0], c[1] - 0.045, z + 0.012], r: [0.05, 0.022, 0.006], col: "face", k: 0 },
      ], ang, c);
      return [
        // easel legs
        { t: "cap", a: [-0.32, 0.0, 0.12], b: [-0.22, 1.05, -0.04], r: [0.022, 0.018], col: "frame" },
        { t: "cap", a: [0.32, 0.0, 0.12], b: [0.22, 1.05, -0.04], r: [0.022, 0.018], col: "frame" },
        { t: "cap", a: [0, 0.0, -0.3], b: [0, 1.0, -0.06], r: [0.02, 0.016], col: "frame" },
        // board with frame
        { t: "box", c: [0, 0.72, 0], s: [0.42, 0.33, 0.025], round: 0.01, col: "cork" },
        ...path([[-0.43, 0.39, 0.01], [0.43, 0.39, 0.01], [0.43, 1.05, 0.01], [-0.43, 1.05, 0.01], [-0.43, 0.39, 0.01]], 0.028, 0.028, "frame", 0.01),
        { t: "box", c: [0, 0.37, 0.04], s: [0.44, 0.015, 0.05], round: 0.008, col: "frame", k: 0.01 },
        ...[[-0.12, 0.85], [0.1, 0.45], [0.33, 0.86], [-0.36, 0.73]].map(([x, y]): Shape => ({ t: "ell", c: [x, y, 0.025], r: [0.04, 0.03, 0.004], col: "cork2", paint: true })),
        // notes and portraits
        ...note([-0.25, 0.86, 0], 0.09, 0.07, 6, "paper"),
        ...portrait([0.2, 0.88, 0], -5),
        ...note([-0.02, 0.62, 0], 0.11, 0.07, -3, "paper2", 4),
        ...portrait([-0.3, 0.45, 0], 4),
        ...note([0.26, 0.5, 0], 0.08, 0.08, 8, "paper"),
        // red string between the pins
        ...[[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [1, 4], [0, 3]].flatMap(([i, j]): Shape[] => path([pins[i], pins[j]], 0.007, 0.007, "string", 0)),
        // pins
        ...pins.map((p): Shape => dot(p, 0.022, "pin")),
        // candle on a brass dish at the foot
        { t: "ell", c: [0.56, 0.02, 0.24], r: [0.1, 0.018, 0.1], col: "brass" },
        { t: "tor", c: [0.62, 0.04, 0.32], R: 0.025, r: 0.008, rot: [90, 0, 0], col: "brass", k: 0.005 },
        { t: "cap", a: [0.56, 0.03, 0.24], b: [0.56, 0.24, 0.24], r: [0.045, 0.042], col: "wax", k: 0.01 },
        { t: "ell", c: [0.59, 0.22, 0.27], r: [0.012, 0.03, 0.012], col: "wax", k: 0.01 },
        { t: "cap", a: [0.56, 0.24, 0.24], b: [0.56, 0.27, 0.24], r: [0.005, 0.005], col: "ink", k: 0 },
        { t: "cap", a: [0.56, 0.3, 0.24], b: [0.57, 0.44, 0.24], r: [0.04, 0.004], col: "flame", k: 0.01 },
        { t: "ell", c: [0.56, 0.32, 0.27], r: [0.02, 0.03, 0.015], col: "flame2", paint: true },
      ];
    })(),
    eyes: [],
  },

  // Despejar la Plaza: a cobbled square with a fountain; a broom sweeps dark threat-wisps away as the sun breaks through.
  "despejar-plaza": {
    palette: { cobble: "#b8ad9a", cobble2: "#8f8574", stone: "#d7d0c2", stone2: "#a69d8c", water: "#7fd0ff", water2: "#e6f8ff", handle: "#9a6438", band: "#c0563a", straw: "#e8c25a", straw2: "#b8922e", smoke: "#4a3a5e", smoke2: "#2e2440", ember: "#c060ff", sun: "#ffd04a", ray: "#ffe9a0", wall: "#e8dcc4", roof: "#2f5fa8" },
    glow: ["water2", "sun", "ray", "ember"],
    shapes: [
      // sun and rays behind
      { t: "ell", c: [0.42, 1.0, -0.35], r: [0.12, 0.12, 0.05], col: "sun" },
      ...burst([0.42, 1.0, -0.37], 10, 0, 0.26, [0.025, 0.004], "ray", { len: 0.18, r: [0.02, 0.004], col: "ray" }, 0),
      // houses at the back
      { t: "box", c: [-0.3, 0.3, -0.36], s: [0.14, 0.22, 0.06], round: 0.02, col: "wall" },
      { t: "cap", a: [-0.46, 0.52, -0.36], b: [-0.3, 0.68, -0.36], r: [0.035, 0.03], col: "roof", k: 0.02 },
      { t: "cap", a: [-0.14, 0.52, -0.36], b: [-0.3, 0.68, -0.36], r: [0.035, 0.03], col: "roof", k: 0.02 },
      { t: "box", c: [-0.3, 0.33, -0.3], s: [0.03, 0.05, 0.005], round: 0.01, col: "smoke2", paint: true },
      { t: "box", c: [0.15, 0.24, -0.4], s: [0.12, 0.16, 0.06], round: 0.02, col: "wall" },
      { t: "cap", a: [0.01, 0.4, -0.4], b: [0.15, 0.52, -0.4], r: [0.03, 0.025], col: "roof", k: 0.02 },
      { t: "cap", a: [0.29, 0.4, -0.4], b: [0.15, 0.52, -0.4], r: [0.03, 0.025], col: "roof", k: 0.02 },
      // cobbled square
      { t: "ell", c: [0, 0.03, 0], r: [0.62, 0.04, 0.5], col: "cobble" },
      ...Array.from({ length: 18 }, (_, i): Shape => {
        const a = i * 137.5, rr = 0.15 + 0.4 * ((i * 0.618) % 1);
        return { t: "ell", c: [rr * Math.cos(rad(a)), 0.07, rr * 0.8 * Math.sin(rad(a))], r: [0.04, 0.02, 0.03], col: "cobble2", paint: true };
      }),
      // fountain
      { t: "cap", a: [0, 0.05, -0.05], b: [0, 0.14, -0.05], r: [0.26, 0.26], col: "stone", k: 0.02 },
      { t: "tor", c: [0, 0.15, -0.05], R: 0.25, r: 0.03, col: "stone2", k: 0.02 },
      { t: "ell", c: [0, 0.14, -0.05], r: [0.23, 0.015, 0.23], col: "water", k: 0 },
      { t: "cap", a: [0, 0.14, -0.05], b: [0, 0.38, -0.05], r: [0.05, 0.04], col: "stone", k: 0.03 },
      { t: "ell", c: [0, 0.4, -0.05], r: [0.12, 0.035, 0.12], col: "stone", k: 0.02 },
      { t: "ell", c: [0, 0.43, -0.05], r: [0.1, 0.012, 0.1], col: "water", k: 0 },
      { t: "cap", a: [0, 0.43, -0.05], b: [0, 0.56, -0.05], r: [0.025, 0.012], col: "water2", k: 0.01 },
      ...[30, 150, 270].flatMap((a): Shape[] => path(bez([0.1 * Math.cos(rad(a)), 0.41, -0.05 + 0.1 * Math.sin(rad(a))], [0.19 * Math.cos(rad(a)), 0.38, -0.05 + 0.19 * Math.sin(rad(a))], [0.2 * Math.cos(rad(a)), 0.16, -0.05 + 0.2 * Math.sin(rad(a))], 5), 0.014, 0.01, "water2", 0)),
      // threat wisps being swept off to the left
      ...wisp([-0.48, 0.24, 0.22], 0.12, [0.22, -0.1, 0]),
      ...wisp([-0.66, 0.5, 0.06], 0.095, [0.18, -0.12, 0]),
      ...wisp([-0.56, 0.78, -0.1], 0.07, [0.14, -0.1, 0]),
      // the broom, sweeping leftward
      { t: "cap", a: [0.42, 0.88, 0.22], b: [-0.12, 0.16, 0.24], r: [0.022, 0.024], col: "handle" },
      { t: "tor", c: [-0.12, 0.17, 0.24], R: 0.04, r: 0.014, rot: [90, 0, 38], col: "band", k: 0.005 },
      { t: "cap", a: [-0.13, 0.15, 0.24], b: [-0.34, 0.06, 0.24], r: [0.06, 0.14], col: "straw", k: 0.02 },
      ...[-0.06, 0, 0.06].map((dz): Shape => ({ t: "cap", a: [-0.17, 0.12, 0.24 + dz], b: [-0.36, 0.04, 0.24 + dz * 1.6], r: [0.012, 0.006], col: "straw2", k: 0.01 })),
      // sweep motion lines
      ...path(bez([0.05, 0.1, 0.36], [-0.2, 0.2, 0.38], [-0.4, 0.13, 0.36], 6), 0.012, 0.004, "ray", 0),
      ...sparkle([0.2, 0.72, 0.1], 0.05, "ray"),
      ...sparkle([-0.05, 0.86, -0.1], 0.04, "ray"),
    ],
    eyes: [],
  },

  // Golpe Conmocionante: a gauntleted fist lands on a masked thug's head; spiral eyes, dizzy stars circling, an impact burst.
  "golpe-conmocionante": {
    palette: { ...GUA, glove: "#2f5fa8", cuff: "#e0b040", head: "#9a7ab8", head2: "#6a4e86", mask: "#2a2236", spiral: "#fff4c8", boom: "#ffd04a", boom2: "#fff6d0", stars: "#ffd84a", orbit: "#ffe9a0" },
    glow: ["boom", "boom2", "stars"],
    shapes: (() => {
      const hc: V3 = [0.36, 0.6, 0];
      const hr: V3 = [0.24, 0.25, 0.22];
      const spiralPts = (cx: number, cy: number): V3[] => Array.from({ length: 19 }, (_, i) => {
        const a = rad(i * 40), R = 0.006 + i * 0.0032;
        const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        return [x, y, onEll(hc, hr, x, y, 0.004)];
      });
      return [
        // the thug: hunched shoulders, round head in a knit cap, tilted back from the hit
        ...rotZ([
          { t: "ell", c: [0.4, 0.16, 0], r: [0.38, 0.16, 0.22], col: "head2" },
          { t: "tor", c: [0.37, 0.33, 0], R: 0.12, r: 0.04, col: "mask", k: 0.02 },
          { t: "ell", c: hc, r: hr, col: "head", k: 0.05 },
          { t: "ell", c: [hc[0], hc[1] + 0.13, 0], r: [0.25, 0.15, 0.23], col: "mask", k: 0.02 },
          { t: "tor", c: [hc[0], hc[1] + 0.1, 0], R: 0.22, r: 0.03, col: "mask", k: 0.02 },
          ...[-0.09, 0.09].map((dx): Shape => ({ t: "ell", c: [hc[0] + dx, hc[1] - 0.005, onEll(hc, hr, hc[0] + dx, hc[1])], r: [0.075, 0.075, 0.06], col: "spiral", paint: true })),
          ...path(spiralPts(hc[0] - 0.09, hc[1] - 0.005), 0.008, 0.008, "mask", 0, true),
          ...path(spiralPts(hc[0] + 0.09, hc[1] - 0.005), 0.008, 0.008, "mask", 0, true),
          // wobbly open mouth
          { t: "ell", c: [hc[0] + 0.02, hc[1] - 0.14, 0.2], r: [0.05, 0.03, 0.05], col: "mask", cut: true, k: 0.01 },
        ], -16, [0.36, 0.1, 0]),
        // dizzy orbit with stars
        { t: "tor", c: [0.3, 0.98, 0], R: 0.24, r: 0.009, rot: [14, 0, -16], col: "orbit", k: 0 },
        ...star([0.08, 1.04, 0.06], 0.07, "stars"),
        ...star([0.46, 0.92, 0.2], 0.065, "stars", 70),
        ...star([0.5, 1.08, -0.16], 0.05, "stars", 100),
        // the fist, swinging in from the left
        ...rotZ(place(rotZ(fist("glove", "blue2", "navy"), -90), 0.85, [-0.15, 0.6, 0.05]), -10, [-0.15, 0.6, 0]),
        { t: "tor", c: [-0.48, 0.66, 0.04], R: 0.12, r: 0.035, rot: [0, 0, 80], col: "cuff", k: 0.01 },
        // impact burst between knuckles and head
        dot([0.1, 0.62, 0.14], 0.05, "boom2"),
        ...burst([0.1, 0.62, 0.14], 9, 10, 0.2, [0.04, 0.005], "boom", { len: 0.13, r: [0.03, 0.005], col: "boom2" }, 0),
        // speed lines behind the fist
        ...[0.5, 0.62, 0.74].map((y, i): Shape => ({ t: "cap", a: [-0.72, y + 0.05 + i * 0.01, -0.05], b: [-0.98, y + 0.1, -0.05], r: [0.016, 0.004], col: "orbit", k: 0 })),
      ];
    })(),
    eyes: [],
  },

  // Puño Cataclísmico: a huge green fist slams down into cracked earth; a glowing shockwave ring and rocks flying out.
  "puno-cataclismo": {
    palette: { ...MOLE, ground: "#8a7a62", ground2: "#6a5c48", crack: "#2a2018", lava: "#ffb43a", wave: "#fff0b0", wave2: "#ffd04a", rock: "#7a6e5e", rock2: "#5a5044", dust: "#d8ccb4" },
    glow: ["lava", "wave", "wave2"],
    shapes: [
      // cracked ground slab
      { t: "ell", c: [0, 0.06, 0], r: [0.7, 0.08, 0.55], col: "ground" },
      ...[0, 55, 125, 185, 235, 300].flatMap((a, i): Shape[] => {
        const L = 0.45 + (i % 2) * 0.12;
        const pts: V3[] = [0.08, 0.25, 0.45, 0.7, 1].map((t, j): V3 => {
          const w = (j % 2 ? 1 : -1) * 0.12 * t;
          return [L * t * Math.cos(rad(a + w * 60)), 0.14, L * t * 0.8 * Math.sin(rad(a + w * 60))];
        });
        return path(pts, 0.03, 0.008, "lava", 0, true);
      }),
      // shockwave rings on the ground
      { t: "tor", c: [0, 0.14, 0], R: 0.52, r: 0.026, col: "wave2", k: 0 },
      { t: "tor", c: [0, 0.16, 0], R: 0.36, r: 0.018, col: "wave", k: 0 },
      // dust puffs at the rim
      ...[20, 110, 160, 250, 330].map((a): Shape => ({ t: "ell", c: [0.6 * Math.cos(rad(a)), 0.16, 0.5 * Math.sin(rad(a))], r: [0.08, 0.06, 0.07], col: "dust", k: 0 })),
      // broken upturned slabs around the impact
      { t: "box", c: [0.24, 0.17, 0.14], s: [0.09, 0.03, 0.07], round: 0.015, rot: [20, 30, 25], col: "ground2", k: 0 },
      { t: "box", c: [-0.24, 0.17, 0.12], s: [0.08, 0.03, 0.07], round: 0.015, rot: [-15, -20, -28], col: "ground2", k: 0 },
      { t: "box", c: [0.02, 0.16, -0.26], s: [0.09, 0.03, 0.06], round: 0.015, rot: [-30, 10, 5], col: "ground2", k: 0 },
      // the fist, knuckles down, a huge forearm rising behind it
      ...place(rotZ([
        ...fist("skin", "skinL", "skin2", "skin", 0.34),
        { t: "tor", c: [0, -0.2, -0.01], R: 0.135, r: 0.032, col: "strap", k: 0.01 },
      ], 205), 1.75, [-0.06, 0.52, 0]),
      // flying rocks
      rock([-0.52, 0.42, 0.1], 0.06, "rock", 25),
      rock([0.55, 0.5, 0.05], 0.07, "rock2", 40),
      rock([-0.36, 0.7, -0.05], 0.045, "rock", 60),
      rock([0.42, 0.78, -0.08], 0.04, "rock", 15),
      rock([0.34, 0.32, 0.3], 0.05, "rock2", 70),
      rock([-0.3, 0.3, 0.32], 0.045, "rock2", 35),
      // impact flash under the knuckles
      ...burst([0, 0.2, 0.2], 8, 10, 0.18, [0.03, 0.005], "wave", undefined, 0),
    ],
    eyes: [],
  },

  // Ira Creciente: a green fist clenched upright, veins glowing hot, a red-orange aura rising as steam; a gauge pinned at max.
  "ira-creciente": {
    palette: { ...MOLE, vein: "#ffb43a", vein2: "#fff0b0", fire: "#e8452a", fire2: "#ff8a2a", fire3: "#ffd04a", steam: "#f0e6e0", glass: "#d8eef6", mercury: "#e8302a", brass: "#c99a3a", brass2: "#8a6420" },
    glow: ["vein", "vein2", "fire", "fire2", "fire3", "mercury"],
    shapes: [
      // rising aura flames behind the fist
      ...[[-0.36, 0.95, 0.3], [-0.2, 1.18, 0.38], [-0.04, 1.32, 0.4], [0.12, 1.18, 0.38], [0.28, 0.92, 0.3]].flatMap(([x, top, w], i): Shape[] => [
        { t: "cap", a: [x * 0.6, 0.3, -0.18], b: [x, top + 0.12, -0.2], r: [w * 0.4, 0.01], col: "fire", k: 0.06 },
        { t: "cap", a: [x * 0.6, 0.35, -0.1], b: [x * 0.95, top - 0.02, -0.12], r: [w * 0.28, 0.008], col: i % 2 ? "fire2" : "fire3", k: 0.04 },
      ]),
      // steam puffs
      ...[[-0.44, 1.2], [0.36, 1.2], [-0.26, 1.42], [0.18, 1.44]].map(([x, y], i): Shape => ({ t: "ell", c: [x, y, -0.05], r: [0.07 - i * 0.008, 0.055, 0.05], col: "steam", k: 0 })),
      // forearm and fist (knuckles up), with a leather strap
      ...place(fist("skin", "skinL", "skin2"), 1.3, [-0.06, 0.78, 0]),
      { t: "tor", c: [-0.06, 0.36, -0.01], R: 0.17, r: 0.04, col: "strap", k: 0.01 },
      // glowing veins along forearm and back of the hand
      ...([
        [[-0.04, 0.0], [0.0, 0.14], [-0.05, 0.3], [0.0, 0.46], [-0.03, 0.6]],
        [[-0.05, 0.3], [-0.13, 0.42], [-0.12, 0.56]],
        [[-0.16, 0.04], [-0.19, 0.2]],
        [[0.0, 0.46], [0.06, 0.56]],
      ] as [number, number][][]).flatMap((pts, i) => path(pts.map(([x, y]): V3 => [x, y, Math.sqrt(Math.max(0.168 ** 2 - (x + 0.06) ** 2, 0))]), i ? 0.012 : 0.017, 0.009, "vein", 0, true)),
      // crackle of energy over the knuckles
      ...burst([-0.06, 1.18, 0.0], 7, 20, 0.16, [0.025, 0.004], "vein2", undefined, 0),
      // rage gauge on the right: brass frame, glass tube full of red, needle past the top
      { t: "box", c: [0.5, 0.45, 0.05], s: [0.07, 0.34, 0.03], round: 0.025, col: "brass" },
      { t: "cap", a: [0.5, 0.2, 0.09], b: [0.5, 0.76, 0.09], r: [0.03, 0.03], col: "glass", k: 0.01 },
      { t: "ell", c: [0.5, 0.15, 0.09], r: [0.06, 0.06, 0.06], col: "mercury", k: 0.02 },
      { t: "cap", a: [0.5, 0.18, 0.11], b: [0.5, 0.78, 0.11], r: [0.02, 0.02], col: "mercury", k: 0.01 },
      ...[0.3, 0.42, 0.54, 0.66].map((y): Shape => ({ t: "box", c: [0.445, y, 0.085], s: [0.015, 0.006, 0.006], round: 0.003, col: "brass2", k: 0 })),
      ...burst([0.5, 0.84, 0.09], 5, 50, 0.08, [0.02, 0.004], "fire3", undefined, 0),
      dot([0.5, 0.82, 0.1], 0.03, "mercury"),
    ],
    eyes: [],
  },

  // Interceptar la Crisis: a gold-and-deep-blue streak loops between two alarm bell towers, clamping each bell silent.
  "interceptar-crisis": {
    palette: { ...CEN, stone: "#8f8aa0", stone2: "#6a6680", roof: "#7a3a3a", bell: "#c8463a", bell2: "#8e2a22", lamp: "#4a3a3a", trail: "#ffe08a", trail2: "#5a7ae0" },
    glow: ["gold2", "hot", "trail", "trail2"],
    shapes: [
      ...bellTower(-0.5, 7),
      ...bellTower(0.5, -7),
      // the streak: sweeps through the left bell, arcs high, dives through the right bell
      { t: "tor", c: [-0.5, 0.6, 0], R: 0.17, r: 0.016, rot: [18, 0, 12], col: "trail2", k: 0 },
      { t: "tor", c: [0.5, 0.6, 0], R: 0.17, r: 0.016, rot: [18, 0, -12], col: "trail2", k: 0 },
      ...path(bez([-0.42, 0.62, 0.22], [0.0, 1.5, 0.26], [0.4, 0.6, 0.22], 16), 0.03, 0.065, "trail2", 0.02),
      ...path(bez([-0.42, 0.63, 0.25], [0.0, 1.48, 0.29], [0.4, 0.61, 0.25], 16), 0.012, 0.04, "trail", 0.01),
      // leading comet head: gold with a deep blue core
      { t: "ell", c: [0.4, 0.6, 0.24], r: [0.08, 0.08, 0.08], col: "gold2", k: 0.03 },
      { t: "ell", c: [0.38, 0.63, 0.31], r: [0.035, 0.035, 0.03], col: "deep", paint: true },
      ...burst([0.4, 0.6, 0.24], 6, 15, 0.14, [0.022, 0.004], "hot", undefined, 0),
      // little gold flashes where the bells were clamped
      ...sparkle([-0.36, 0.62, 0.15], 0.05, "hot"),
      ...sparkle([0.62, 0.66, 0.15], 0.05, "hot"),
      // sparkles left in the wake
      ...sparkle([-0.18, 1.08, 0.22], 0.05, "hot"),
      ...sparkle([0.12, 1.12, 0.22], 0.04, "gold2"),
      ...sparkle([-0.05, 0.85, 0.25], 0.035, "hot"),
    ],
    eyes: [],
  },
};
