import type { EyeSpec, Sculpt, Shape, V3 } from "../sculpt";
import { arm, body, burst, eyes, rad, turn } from "./kit";

// Protección deck cards and Yunque — art batch nuevos 3. Valdoria: floating towers, old runes; the
// Guardia de Aurelia wears blue and gold. Original designs only: a counter-punch, a defender shielding
// townsfolk, a mail shirt on a stand, a battered hero rising in flame, a fencer's parry, a dizzying
// shoulder charge, an ally pulled back from a swirl of light and a winged armour-smith.

// MARK: Helpers

/** Small spheres (sparks, rivets, buttons). */
const dot = (c: V3, r: number, col: string, k = 0): Shape => ({ t: "ell", c, r: [r, r, r], col, k });

/** A polyline of capsules through points, radius tapering r0 → r1. */
function chain(pts: V3[], r0: number, r1: number, col: string, k = 0.01, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
  }
  return out;
}

/** Expands `mirror` shapes into two explicit copies (so the set can be moved or turned freely). */
function unmirror(shapes: Shape[]): Shape[] {
  const fz = (v: V3): V3 => [v[0], v[1], -v[2]];
  return shapes.flatMap((sh): Shape[] => {
    if (!sh.mirror) return [sh];
    const base = { ...sh, mirror: false };
    const r = sh.rot;
    const m: Shape = sh.t === "cap" ? { ...base, a: fz(sh.a), b: fz(sh.b) } as Shape
      : { ...base, c: fz(sh.c), ...(r ? { rot: [-r[0], -r[1], r[2]] as V3 } : {}) } as Shape;
    return [base as Shape, m];
  });
}

/** Moves shapes. */
function shift(shapes: Shape[], d: V3): Shape[] {
  const p = (v: V3): V3 => [v[0] + d[0], v[1] + d[1], v[2] + d[2]];
  return shapes.map((sh): Shape => (sh.t === "cap" ? { ...sh, a: p(sh.a), b: p(sh.b) } : { ...sh, c: p(sh.c) }));
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

/** A five-point star facing +z at c (outer radius R). */
function star(c: V3, R: number, col: string, k = 0.01): Shape[] {
  return [
    { t: "ell", c, r: [R * 0.42, R * 0.42, R * 0.25], col, k },
    ...Array.from({ length: 5 }, (_, i): Shape => {
      const a = rad(90 + i * 72);
      return { t: "cap", a: c, b: [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2]], r: [R * 0.3, R * 0.04], col, k };
    }),
  ];
}

/** A small flame (teardrop with a curled tip), base at c, height h. */
function flameShape(c: V3, h: number, col: string, k = 0.03): Shape[] {
  return [
    { t: "ell", c: [c[0], c[1] + h * 0.28, c[2]], r: [h * 0.3, h * 0.3, h * 0.2], col, k },
    { t: "cap", a: [c[0], c[1] + h * 0.35, c[2]], b: [c[0] + h * 0.08, c[1] + h, c[2]], r: [h * 0.24, h * 0.02], col, k },
    { t: "cap", a: [c[0] - h * 0.18, c[1] + h * 0.3, c[2]], b: [c[0] - h * 0.32, c[1] + h * 0.68, c[2]], r: [h * 0.12, h * 0.015], col, k },
    { t: "cap", a: [c[0] + h * 0.18, c[1] + h * 0.3, c[2]], b: [c[0] + h * 0.34, c[1] + h * 0.6, c[2]], r: [h * 0.1, h * 0.015], col, k },
  ];
}

/** A clenched fist punching toward +x (knuckle face at x ≈ 0.16), forearm cuff behind it. */
function punch(glove: string, cuff: string): Shape[] {
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

/** A curved arrow along a circle (centre c, radius R) in the picture plane from angle a0 to a1
 * (degrees), thickening from r0 to r1, with a cone head at the end. */
function arcArrow(c: V3, R: number, a0: number, a1: number, r0: number, r1: number, col: string, head = 2.4): Shape[] {
  const n = Math.max(4, Math.round(Math.abs(a1 - a0) / 12));
  const pts: V3[] = Array.from({ length: n + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    return [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2]];
  });
  const e = rad(a1), sg = Math.sign(a1 - a0);
  const d: V3 = [-Math.sin(e) * sg, Math.cos(e) * sg, 0];
  const end = pts[n];
  const len = r1 * head * 1.6;
  return [
    ...chain(pts, r0, r1, col, 0.01),
    { t: "cap", a: [end[0] - d[0] * r1 * 0.5, end[1] - d[1] * r1 * 0.5, end[2]], b: [end[0] + d[0] * len, end[1] + d[1] * len, end[2]], r: [r1 * head, r1 * 0.2], col, k: 0.01 },
  ];
}

/** Concentric painted rings on a face (dizzy spiral eye), axis along x. */
function spiralEye(c: V3, col: string): Shape[] {
  return [
    { t: "tor", c, R: 0.034, r: 0.0065, rot: [0, 0, 90], col, paint: true },
    { t: "tor", c: [c[0], c[1] + 0.004, c[2] + 0.003], R: 0.018, r: 0.0065, rot: [0, 0, 90], col, paint: true },
    dot([c[0], c[1] + 0.006, c[2] + 0.004], 0.008, col),
  ];
}

// MARK: Shared pieces

/** A frightened villager facing +x, unit height ≈ 0.95 before scaling; colour keys prefixed by `p`. */
function villager(p: string, hood: boolean): Shape[] {
  return unmirror([
    { t: "ell", c: [0.03, 0.05, 0.075], r: [0.08, 0.05, 0.06], col: `${p}boots`, mirror: true },
    { t: "cap", a: [0, 0.08, 0.07], b: [0, 0.26, 0.066], r: [0.055, 0.062], col: `${p}legs`, mirror: true },
    { t: "ell", c: [0, 0.38, 0], r: [0.13, 0.17, 0.15], col: `${p}shirt` },
    { t: "ell", c: [0.02, 0.69, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
    hood
      ? { t: "ell", c: [-0.04, 0.76, 0], r: [0.19, 0.16, 0.2], col: `${p}hair`, k: 0.02 }
      : { t: "ell", c: [-0.05, 0.77, 0], r: [0.17, 0.14, 0.19], col: `${p}hair`, k: 0.02 },
    { t: "ell", c: [0.08, 0.84, 0], r: [0.1, 0.04, 0.13], rot: [0, 0, -15], col: `${p}hair`, k: 0.02 },
    { t: "ell", c: [0.19, 0.6, 0.0], r: [0.016, 0.02, 0.02], col: "mouth", k: 0.004 },
    // Hands up by the cheeks.
    { t: "cap", a: [0, 0.5, 0.13], b: [0.14, 0.6, 0.18], r: [0.04, 0.038], col: `${p}shirt` },
    { t: "ell", c: [0.15, 0.62, 0.18], r: [0.04, 0.045, 0.04], col: "skin", k: 0.02 },
    { t: "cap", a: [0, 0.5, -0.13], b: [0.14, 0.6, -0.18], r: [0.04, 0.038], col: `${p}shirt` },
    { t: "ell", c: [0.15, 0.62, -0.18], r: [0.04, 0.045, 0.04], col: "skin", k: 0.02 },
  ]);
}

/** Eyes for a placed villager (scale s, offset d). */
function villagerEyes(s: number, d: V3, iris: string, deg: number): EyeSpec[] {
  const t = rad(deg), co = Math.cos(t), si = Math.sin(t);
  const r = (v: V3): V3 => [co * v[0] + si * v[2], v[1], -si * v[0] + co * v[2]];
  return eyes(iris, false, 0.69, 0.02, 0.06).map((e) => {
    const a = r(e.at);
    return { ...e, at: [a[0] * s + d[0], a[1] * s + d[1], a[2] * s + d[2]] as V3, look: r(e.look ?? [1, 0, 0]), r: e.r * s };
  });
}

// MARK: Pieces

/** A rib-and-panel mechanical wing fanned from a hub at the back (picture plane at depth hub z). */
function mechWing(hub: V3, angles: number[], lens: number[]): Shape[] {
  const out: Shape[] = [];
  const tip = (i: number): V3 => [hub[0] + Math.cos(rad(angles[i])) * lens[i], hub[1] + Math.sin(rad(angles[i])) * lens[i], hub[2]];
  for (let i = 0; i + 1 < angles.length; i++) {
    const m = (angles[i] + angles[i + 1]) / 2, L = (lens[i] + lens[i + 1]) / 2;
    out.push({ t: "ell", c: [hub[0] + Math.cos(rad(m)) * L * 0.5, hub[1] + Math.sin(rad(m)) * L * 0.5, hub[2]], r: [L * 0.5, L * 0.2, 0.014], rot: [0, 0, m], col: "blue", k: 0.012 });
  }
  for (let i = 0; i < angles.length; i++) {
    out.push({ t: "cap", a: hub, b: tip(i), r: [0.018, 0.01], col: "brass", k: 0.008 });
    out.push(dot(tip(i), 0.016, "brassDk", 0.004));
  }
  out.push({ t: "cap", a: [hub[0], hub[1], hub[2] - 0.03 * Math.sign(hub[2])], b: [hub[0], hub[1], hub[2] + 0.02 * Math.sign(hub[2])], r: [0.04, 0.04], col: "brassDk", k: 0.01 });
  return out;
}

// MARK: Embestida

const CHARGER: Shape[] = unmirror([
  // Stride: back leg pushing off, front leg bent.
  { t: "cap", a: [-0.02, 0.25, -0.07], b: [-0.2, 0.08, -0.08], r: [0.062, 0.055], col: "legs" },
  { t: "ell", c: [-0.24, 0.05, -0.08], r: [0.085, 0.05, 0.06], rot: [0, 0, 20], col: "boots" },
  { t: "cap", a: [0.02, 0.25, 0.07], b: [0.17, 0.2, 0.08], r: [0.062, 0.055], col: "legs" },
  { t: "cap", a: [0.17, 0.2, 0.08], b: [0.16, 0.07, 0.08], r: [0.055, 0.05], col: "legs", k: 0.02 },
  { t: "ell", c: [0.2, 0.05, 0.08], r: [0.085, 0.05, 0.06], col: "boots" },
  // Torso pitched forward.
  { t: "ell", c: [0.06, 0.4, 0], r: [0.13, 0.17, 0.16], rot: [0, 0, -28], col: "torso" },
  { t: "ell", c: [0.1, 0.42, 0], r: [0.12, 0.12, 0.16], rot: [0, 0, -28], col: "plate", k: 0.02 },
  { t: "tor", c: [0.0, 0.3, 0], R: 0.135, r: 0.022, rot: [0, 0, -20], col: "gold", k: 0.01 },
  // Head low and forward, a blue headband with gold, determined.
  { t: "ell", c: [0.17, 0.64, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.07 },
  { t: "ell", c: [0.11, 0.71, 0], r: [0.18, 0.13, 0.18], col: "hair", k: 0.02 },
  { t: "ell", c: [0.25, 0.77, 0.02], r: [0.09, 0.045, 0.13], rot: [0, 0, -25], col: "hair", k: 0.02 },
  { t: "tor", c: [0.15, 0.72, 0], R: 0.168, r: 0.02, rot: [0, 0, -18], col: "blue", k: 0.005 },
  { t: "cap", a: [-0.02, 0.72, -0.05], b: [-0.18, 0.78, -0.12], r: [0.025, 0.01], col: "blue", k: 0.01 },
  { t: "cap", a: [0.335, 0.57, -0.03], b: [0.33, 0.575, 0.05], r: [0.008, 0.008], col: "mouth", paint: true },
  // Leading shoulder: a big gold-trimmed blue pauldron rammed forward.
  { t: "ell", c: [0.2, 0.47, 0.17], r: [0.14, 0.12, 0.12], rot: [0, 0, -20], col: "blue", k: 0.03 },
  { t: "ell", c: [0.2, 0.43, 0.2], r: [0.15, 0.04, 0.12], rot: [0, 0, -20], col: "gold", paint: true },
  ...arm(1, [0.18, 0.28, 0.24], "torso", "glove"),
  ...arm(-1, [-0.1, 0.32, -0.24], "torso", "glove"),
  { t: "ell", c: [0.0, 0.53, -0.16], r: [0.08, 0.06, 0.07], col: "blue", k: 0.02 },
]);

const THUG: Shape[] = unmirror([
  { t: "ell", c: [0.06, 0.055, 0.12], r: [0.1, 0.06, 0.08], col: "tBoots", mirror: true },
  { t: "cap", a: [0, 0.08, 0.12], b: [0, 0.27, 0.11], r: [0.075, 0.088], col: "tLegs", mirror: true },
  // Big belly in a grubby shirt under a patched leather vest.
  { t: "ell", c: [0.02, 0.45, 0], r: [0.22, 0.23, 0.24], col: "tShirt" },
  { t: "ell", c: [-0.02, 0.47, 0], r: [0.21, 0.22, 0.245], col: "tVest", k: 0.01 },
  { t: "box", c: [0.2, 0.42, 0], s: [0.06, 0.2, 0.07], round: 0.04, col: "tShirt", paint: true },
  { t: "box", c: [0.1, 0.52, 0.2], s: [0.04, 0.04, 0.02], round: 0.01, rot: [0, 30, 10], col: "tPatch", paint: true },
  { t: "tor", c: [0, 0.29, 0], R: 0.2, r: 0.026, col: "tBelt", k: 0.02 },
  // Shoulders and limp arms flung back.
  { t: "ell", c: [-0.01, 0.6, 0.19], r: [0.11, 0.1, 0.11], col: "tVest", mirror: true, k: 0.05 },
  { t: "cap", a: [-0.01, 0.6, 0.23], b: [-0.2, 0.75, 0.33], r: [0.07, 0.06], col: "skin", k: 0.03 },
  { t: "ell", c: [-0.23, 0.78, 0.35], r: [0.06, 0.06, 0.06], col: "skin", k: 0.02 },
  { t: "cap", a: [-0.01, 0.6, -0.23], b: [-0.22, 0.5, -0.33], r: [0.07, 0.06], col: "skin", k: 0.03 },
  { t: "ell", c: [-0.25, 0.48, -0.35], r: [0.06, 0.06, 0.06], col: "skin", k: 0.02 },
  // Bald head, stubble, a lump, a dazed wobbly mouth, spiral eyes.
  { t: "cap", a: [0, 0.6, 0], b: [0.02, 0.7, 0], r: [0.11, 0.1], col: "skin", k: 0.04 },
  { t: "ell", c: [0.04, 0.8, 0], r: [0.16, 0.16, 0.155], col: "skin", k: 0.04 },
  { t: "ell", c: [0.12, 0.7, 0], r: [0.09, 0.07, 0.13], col: "skin", k: 0.04 },
  { t: "ell", c: [0.13, 0.69, 0], r: [0.08, 0.06, 0.13], col: "stubble", paint: true },
  { t: "ell", c: [0.0, 0.96, 0.02], r: [0.05, 0.045, 0.05], col: "lump", k: 0.02 },
  { t: "ell", c: [0.205, 0.69, 0.0], r: [0.02, 0.026, 0.035], col: "mouth", paint: true },
  { t: "ell", c: [0.2, 0.86, 0], r: [0.04, 0.012, 0.12], rot: [0, 0, -10], col: "stubble", paint: true },
  ...spiralEye([0.19, 0.8, 0.065], "ink"),
  ...spiralEye([0.19, 0.8, -0.065], "ink"),
  { t: "ell", c: [0.19, 0.8, 0.065], r: [0.02, 0.045, 0.045], col: "white", paint: true },
  { t: "ell", c: [0.19, 0.8, -0.065], r: [0.02, 0.045, 0.045], col: "white", paint: true },
]);

/** A ring of little stars circling over a head at c. */
function dizzyStars(c: V3, R: number): Shape[] {
  const out: Shape[] = [{ t: "tor", c, R, r: 0.007, col: "orbit", k: 0 }];
  for (let i = 0; i < 4; i++) {
    const a = rad(20 + i * 90);
    out.push(...star([c[0] + Math.cos(a) * R, c[1] + 0.01 * i, c[2] + Math.sin(a) * R], 0.085, i % 2 ? "star2" : "star", 0.005));
  }
  return out;
}

// MARK: Designs

const GUARD_BLUE = "#2f56a0", GUARD_BLUE_DK = "#1f3a72", GOLD = "#f0c24a";

export const artNuevos3: Record<string, Sculpt> = {
  // Revés Certero: a blue vambrace raised to block on the left, and a gold-gloved fist snapping past it
  // into a bright impact on the right, a curved gold "return" arrow arcing from the block to the blow.
  "reves-certero": {
    palette: {
      glove: GOLD, cuff: GUARD_BLUE, sleeve: GUARD_BLUE_DK, band: "#e0b04a", trail: "#ffd85a", trail2: "#fff2b0",
      spark: "#fff4b0", spark2: "#ff9a3a", glint: "#ffffff", rune: "#7fe6ff",
    },
    glow: ["trail", "trail2", "spark", "spark2", "glint", "rune"],
    shapes: [
      // Blocking forearm, fist up, set back.
      ...place(rotZ(punch("glove", "cuff"), 78), 1.15, [-0.3, 0.66, -0.16]),
      { t: "cap", a: [-0.48, -0.12, -0.16], b: [-0.38, 0.27, -0.16], r: [0.13, 0.12], col: "sleeve", k: 0.03 },
      { t: "tor", c: [-0.4, 0.2, -0.16], R: 0.125, r: 0.02, rot: [0, 0, -14], col: "band", k: 0.01 },
      { t: "tor", c: [-0.44, 0.05, -0.16], R: 0.13, r: 0.02, rot: [0, 0, -14], col: "band", k: 0.01 },
      { t: "box", c: [-0.36, 0.42, -0.04], s: [0.012, 0.05, 0.012], round: 0.004, col: "rune", paint: true },
      // Bright deflection flash on the block.
      ...sparkle([-0.18, 0.92, -0.08], 0.09, "glint"),
      // Counter-punch thrusting right, in front.
      ...place(rotZ(punch("glove", "cuff"), 12), 1.3, [0.18, 0.4, 0.14]),
      { t: "cap", a: [-0.62, 0.16, 0.14], b: [-0.25, 0.29, 0.14], r: [0.13, 0.13], col: "sleeve", k: 0.03 },
      { t: "tor", c: [-0.3, 0.28, 0.14], R: 0.135, r: 0.022, rot: [0, 0, -71], col: "band", k: 0.01 },
      // Speed streaks behind the punch.
      ...[0.48, 0.3, 0.12].map((y, i): Shape => ({ t: "cap", a: [-0.7 + i * 0.06, y + 0.02, 0.3], b: [-0.95, y - 0.03, 0.3], r: [0.016, 0.004], col: "trail2", k: 0 })),
      // Impact burst at the knuckles.
      ...burst([0.5, 0.48, 0.16], 10, 8, 0.26, [0.04, 0.004], "spark", { len: 0.15, r: [0.035, 0.004], col: "spark2" }, 0.02),
      dot([0.5, 0.48, 0.16], 0.07, "spark", 0.02),
      // Return arrow: from the block over the top and down into the blow.
      ...arcArrow([0.12, 0.62, 0.02], 0.4, 165, 28, 0.012, 0.03, "trail", 2.3),
      ...sparkle([0.62, 0.94, 0.0], 0.05, "glint"),
      ...sparkle([0.2, 0.12, 0.2], 0.045, "glint"),
    ],
    eyes: [],
  },

  // ¡Detrás de Mí!: a defender in steel-blue plate with gold trim, arms flung wide, stepping in front
  // of two small frightened townsfolk; a dark violet bolt shatters against his chest.
  "detras-de-mi": {
    palette: {
      skin: "#ecbd96", torso: "#5a7eaa", armor: "#6d8fbd", armorDk: "#3e5a86", gold: GOLD, legs: "#2c3e62", boots: "#3e5a86",
      hair: "#5a3820", gauntlet: "#8aa6cc", cape: GUARD_BLUE, mouth: "#8a3a34",
      aboots: "#5a3a24", alegs: "#6a5a4a", ashirt: "#d88a3a", ahair: "#c88a3a",
      bboots: "#4a3020", blegs: "#3a4a5a", bshirt: "#6aa05a", bhair: "#3a2418",
      bolt: "#8a3ad8", bolt2: "#d8a0ff", shield: "#9fe6ff",
    },
    glow: ["bolt", "bolt2", "shield"],
    shapes: [
      // Townsfolk huddled behind.
      ...place(turn(villager("a", false), -30), 0.62, [-0.42, 0, 0.36]),
      ...place(turn(villager("b", true), -20), 0.56, [-0.52, 0, 0.0]),
      // Short blue cape.
      { t: "ell", c: [-0.13, 0.36, 0], r: [0.06, 0.2, 0.2], rot: [0, 0, -8], col: "cape", k: 0.03 },
      ...body({ torso: [0.15, 0.17, 0.17] }),
      // Plate: knee guards, breastplate, gold trim, pauldrons.
      { t: "ell", c: [0.04, 0.17, 0.075], r: [0.05, 0.05, 0.05], col: "armor", mirror: true, k: 0.01 },
      { t: "ell", c: [0.03, 0.44, 0], r: [0.14, 0.13, 0.17], col: "armor", k: 0.02 },
      { t: "ell", c: [0.12, 0.35, 0], r: [0.08, 0.04, 0.17], col: "armorDk", paint: true },
      { t: "tor", c: [0, 0.29, 0], R: 0.15, r: 0.022, col: "gold" },
      { t: "box", c: [0.17, 0.46, 0.0], s: [0.02, 0.04, 0.04], round: 0.01, rot: [0, 0, 45], col: "gold", k: 0.005 },
      { t: "ell", c: [-0.01, 0.56, 0.17], r: [0.1, 0.065, 0.09], col: "armor", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.01, 0.53, 0.18], r: [0.1, 0.025, 0.1], col: "gold", mirror: true, paint: true },
      // Open-faced helm with a gold ridge.
      { t: "ell", c: [-0.02, 0.79, 0], r: [0.2, 0.14, 0.2], col: "armor", k: 0.02 },
      { t: "ell", c: [0.2, 0.68, 0], r: [0.1, 0.16, 0.15], col: "armor", cut: true, k: 0.02 },
      { t: "ell", c: [0.02, 0.71, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.01 },
      { t: "ell", c: [0.1, 0.81, 0], r: [0.1, 0.04, 0.14], col: "hair", k: 0.01 },
      { t: "cap", a: [0.14, 0.92, 0], b: [-0.18, 0.86, 0], r: [0.022, 0.022], col: "gold", k: 0.02 },
      { t: "cap", a: [0.19, 0.62, -0.03], b: [0.18, 0.615, 0.05], r: [0.01, 0.01], col: "mouth", paint: true },
      // Arms flung wide, open hands.
      ...arm(1, [0.1, 0.66, 0.44], "torso", "gauntlet", 0.048),
      ...arm(-1, [0.08, 0.66, -0.44], "torso", "gauntlet", 0.048),
      { t: "ell", c: [0.02, 0.56, 0.24], r: [0.07, 0.05, 0.06], col: "armor", k: 0.02 },
      { t: "ell", c: [0.02, 0.56, -0.24], r: [0.07, 0.05, 0.06], col: "armor", k: 0.02 },
      // The dark bolt, coming in from the right and breaking on him.
      ...chain([[1.0, 0.95, 0.05], [0.82, 0.78, 0.06], [0.74, 0.86, 0.06], [0.52, 0.6, 0.04], [0.42, 0.66, 0.03], [0.3, 0.48, 0.02]], 0.05, 0.03, "bolt", 0.02),
      ...burst([0.25, 0.48, 0.02], 8, 15, 0.16, [0.03, 0.004], "bolt2", undefined, 0.02),
      { t: "tor", c: [0.24, 0.48, 0.02], R: 0.12, r: 0.012, rot: [0, 0, 90], col: "shield", k: 0 },
      dot([0.25, 0.48, 0.02], 0.045, "bolt2", 0.01),
    ],
    eyes: [
      ...eyes("#3a6ab0", true, 0.71, 0.02, 0.05),
      ...villagerEyes(0.62, [-0.42, 0, 0.36], "#5a8a4a", -30),
      ...villagerEyes(0.56, [-0.52, 0, 0.0], "#6a4a2a", -20),
    ],
  },

  // Cota de Malla: a sleeveless chain-mail shirt on a wooden mannequin stand — rows of steel rings, a
  // hanging ring hem, a stitched leather collar and shoulder straps.
  "cota-malla": {
    palette: {
      wood: "#a06a3a", woodDk: "#6a4224", mail: "#a8b4c4", ring: "#5a6678", leather: "#7a4a28", leatherDk: "#4e2c16", brass: "#e0b04a",
    },
    shapes: (() => {
      const out: Shape[] = [
        // Stand.
        { t: "ell", c: [0, 0.03, 0], r: [0.24, 0.035, 0.2], col: "woodDk" },
        { t: "cap", a: [0, 0.05, 0], b: [0, 0.32, 0], r: [0.035, 0.03], col: "wood", k: 0.02 },
        { t: "ell", c: [0, 1.0, 0], r: [0.08, 0.08, 0.08], col: "wood", k: 0.03 },
        { t: "cap", a: [0, 0.86, 0], b: [0, 0.96, 0], r: [0.05, 0.045], col: "wood", k: 0.02 },
        // Mail body.
        { t: "ell", c: [0, 0.58, 0], r: [0.26, 0.3, 0.15], col: "mail" },
        { t: "box", c: [0, 0.78, -0.01], s: [0.3, 0.1, 0.12], round: 0.09, col: "mail", k: 0.08 },
        { t: "ell", c: [0, 0.9, 0.0], r: [0.1, 0.07, 0.2], col: "mail", cut: true, k: 0.03 },
        { t: "ell", c: [0.34, 0.74, 0], r: [0.09, 0.13, 0.2], col: "mail", cut: true, k: 0.03 },
        { t: "ell", c: [-0.34, 0.74, 0], r: [0.09, 0.13, 0.2], col: "mail", cut: true, k: 0.03 },
        // Stitched leather collar and shoulder straps, brass buckles.
        { t: "tor", c: [0, 0.875, 0.0], R: 0.11, r: 0.04, rot: [-14, 0, 0], col: "leather", k: 0.01 },
        { t: "tor", c: [0, 0.86, 0.0], R: 0.105, r: 0.006, rot: [-8, 0, 0], col: "leatherDk", paint: true },
        ...[1, -1].flatMap((s): Shape[] => [
          { t: "cap", a: [0.1 * s, 0.86, 0.02], b: [0.25 * s, 0.82, 0.02], r: [0.032, 0.03], col: "leather", k: 0.01 },
          { t: "box", c: [0.18 * s, 0.85, 0.06], s: [0.02, 0.025, 0.015], round: 0.005, col: "brass", k: 0.003 },
        ]),
        // Leather belt round the waist.
        { t: "tor", c: [0, 0.38, 0], R: 0.215, r: 0.025, col: "leather", k: 0.01 },
        { t: "box", c: [0, 0.38, 0.14], s: [0.035, 0.035, 0.012], round: 0.008, col: "brass", k: 0.003 },
      ];
      // Rings over the front and sides: rows offset by half a ring.
      const ex = 0.265, ey = 0.31, ez = 0.155, cy = 0.58;
      for (let row = 0; row < 12; row++) {
        const y = 0.3 + row * 0.042;
        for (let col = -7; col <= 7; col++) {
          const x = col * 0.04 + (row % 2) * 0.02;
          const q = 1 - (x / ex) ** 2 - ((y - cy) / ey) ** 2;
          if (q < 0.08 || y > 0.8) continue;
          const z = ez * Math.sqrt(q);
          const tilt = (Math.atan2(x / (ex * ex), z / (ez * ez)) * 180) / Math.PI;
          out.push({ t: "tor", c: [x, y, z], R: 0.016, r: 0.0055, rot: [90, tilt, 0], col: "ring", paint: true });
        }
      }
      // A hanging hem of rings with real volume.
      for (let i = -6; i <= 6; i++) {
        const x = i * 0.036, q = 1 - (x / 0.25) ** 2;
        if (q < 0.05) continue;
        const z = 0.135 * Math.sqrt(q);
        out.push({ t: "tor", c: [x, 0.3, z], R: 0.019, r: 0.007, rot: [90, (Math.atan2(x, z) * 180) / Math.PI, 0], col: "ring", k: 0.004 });
      }
      return out;
    })(),
    eyes: [],
  },

  // Indomable: a battered Guard hero down on one knee, fist planted on cracked ground, rising back up
  // in a blazing orange aura; a torn cape, a bandage on the brow and a dent in the pauldron.
  "indomable": {
    palette: {
      skin: "#ecbd96", torso: GUARD_BLUE, torsoDk: GUARD_BLUE_DK, gold: GOLD, legs: "#2a3a5e", boots: "#4a3020", glove: "#e0b04a",
      hair: "#3a2418", bandage: "#f6f1e6", scuff: "#1a2a4a", mouth: "#8a3a34", ground: "#7a6a5a", ground2: "#5a4c40",
      fire: "#ff7a1e", fire2: "#ffb43a", core: "#fff3b8",
    },
    glow: ["fire", "fire2", "core"],
    shapes: [
      // Aura of flame rising behind.
      ...flameShape([-0.22, 0.05, -0.12], 0.62, "fire", 0.04),
      ...flameShape([-0.05, 0.25, -0.22], 0.75, "fire", 0.04),
      ...flameShape([-0.3, 0.2, 0.12], 0.6, "fire", 0.04),
      ...flameShape([-0.12, 0.45, -0.1], 0.6, "fire2", 0.04),
      ...flameShape([0.3, 0.1, -0.22], 0.45, "fire", 0.04),
      // Cracked ground slab.
      { t: "ell", c: [0.05, 0.0, 0], r: [0.48, 0.04, 0.4], col: "ground" },
      ...chain([[0.3, 0.035, 0.24], [0.42, 0.035, 0.3], [0.5, 0.03, 0.26]], 0.012, 0.008, "fire2", 0, true),
      ...chain([[0.3, 0.035, 0.24], [0.26, 0.035, 0.36], [0.3, 0.03, 0.42]], 0.012, 0.008, "fire2", 0, true),
      ...chain([[0.3, 0.035, 0.24], [0.18, 0.035, 0.3]], 0.012, 0.008, "fire2", 0, true),
      // Torn cape behind.
      { t: "ell", c: [-0.14, 0.34, 0], r: [0.07, 0.22, 0.2], rot: [0, 0, -25], col: "torsoDk", k: 0.03 },
      { t: "ell", c: [-0.26, 0.15, 0.08], r: [0.06, 0.06, 0.06], col: "torsoDk", cut: true, k: 0.01 },
      // Kneel: near knee up, far knee down.
      { t: "cap", a: [0, 0.27, 0.08], b: [0.18, 0.31, 0.1], r: [0.065, 0.055], col: "legs" },
      { t: "cap", a: [0.18, 0.31, 0.1], b: [0.16, 0.09, 0.1], r: [0.055, 0.05], col: "legs", k: 0.02 },
      { t: "ell", c: [0.19, 0.31, 0.1], r: [0.05, 0.05, 0.05], col: "gold", k: 0.01 },
      { t: "ell", c: [0.2, 0.07, 0.1], r: [0.085, 0.05, 0.06], col: "boots", k: 0.01 },
      { t: "cap", a: [0, 0.25, -0.08], b: [0.08, 0.07, -0.1], r: [0.065, 0.055], col: "legs" },
      { t: "cap", a: [0.08, 0.07, -0.1], b: [-0.15, 0.07, -0.1], r: [0.055, 0.05], col: "legs", k: 0.02 },
      { t: "ell", c: [-0.2, 0.08, -0.1], r: [0.06, 0.05, 0.05], col: "boots", k: 0.01 },
      // Torso leaning forward, gold belt, scuffs.
      { t: "ell", c: [0.04, 0.42, 0], r: [0.13, 0.16, 0.15], rot: [0, 0, -18], col: "torso" },
      { t: "tor", c: [0.0, 0.3, 0], R: 0.135, r: 0.022, rot: [0, 0, -12], col: "gold", k: 0.01 },
      { t: "box", c: [0.15, 0.46, 0.06], s: [0.035, 0.008, 0.01], round: 0.004, rot: [0, -20, 30], col: "scuff", paint: true },
      { t: "box", c: [0.15, 0.4, -0.05], s: [0.03, 0.007, 0.01], round: 0.004, rot: [0, 20, -25], col: "scuff", paint: true },
      // Pauldrons, the near one dented.
      { t: "ell", c: [0.02, 0.56, 0.16], r: [0.09, 0.06, 0.08], col: "gold", k: 0.02 },
      { t: "ell", c: [0.07, 0.6, 0.2], r: [0.035, 0.03, 0.03], col: "gold", cut: true, k: 0.01 },
      { t: "ell", c: [0.02, 0.56, -0.16], r: [0.09, 0.06, 0.08], col: "gold", k: 0.02 },
      // Head, chin up, fierce: messy hair, a bandage round the brow, set mouth.
      { t: "ell", c: [0.08, 0.72, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.07 },
      { t: "ell", c: [0.02, 0.8, 0], r: [0.18, 0.13, 0.18], col: "hair", k: 0.02 },
      { t: "ell", c: [0.16, 0.86, 0.02], r: [0.09, 0.045, 0.13], rot: [0, 0, -15], col: "hair", k: 0.02 },
      { t: "tor", c: [0.04, 0.85, 0], R: 0.16, r: 0.02, rot: [0, 0, 14], col: "bandage", k: 0.005 },
      { t: "cap", a: [-0.11, 0.82, -0.05], b: [-0.24, 0.74, -0.1], r: [0.02, 0.008], col: "bandage", k: 0.01 },
      { t: "cap", a: [0.25, 0.64, -0.04], b: [0.24, 0.635, 0.05], r: [0.009, 0.009], col: "mouth", paint: true },
      // Near fist planted on the ground; far fist clenched at the chest.
      ...arm(1, [0.28, 0.1, 0.24], "torso", "glove", 0.046),
      { t: "box", c: [0.28, 0.09, 0.24], s: [0.06, 0.055, 0.06], round: 0.04, col: "glove", k: 0.02 },
      ...burst([0.3, 0.05, 0.24], 7, 20, 0.14, [0.025, 0.003], "fire2", undefined, 0.02).map((s) => ({ ...s, k: 0.01 })),
      ...arm(-1, [0.22, 0.44, -0.12], "torso", "glove", 0.046),
      // Embers.
      ...([[0.42, 0.8, 0.1, 0.022], [0.5, 0.5, -0.05, 0.018], [-0.4, 0.9, 0.05, 0.018], [0.3, 1.1, -0.1, 0.015], [-0.45, 0.45, 0.2, 0.014]] as number[][]).map(([x, y, z, r]) => dot([x, y, z], r, "core")),
    ],
    eyes: eyes("#e08a2a", true, 0.72, 0.08, 0.05),
  },

  // Guardia Experta: a Guard fencer in a blue doublet in a low defensive stance, sword raised on a
  // diagonal; a dark incoming blade glances off it in a ring of sparks.
  "guardia-experta": {
    palette: {
      skin: "#ecbd96", torso: GUARD_BLUE, torsoDk: GUARD_BLUE_DK, gold: GOLD, legs: "#e8e0cc", boots: "#3a2618", glove: "#8a5a30",
      hair: "#c87a2a", mouth: "#8a3a34", steel: "#dfe6ee", steelDk: "#9aa6b6", grip: "#3a2a5a",
      foe: "#3a3448", foeLt: "#6a6480", spark: "#fff4b0", spark2: "#ffc24a", glint: "#ffffff",
    },
    glow: ["spark", "spark2", "glint"],
    shapes: [
      // Low stance: front leg bent forward, back leg braced.
      { t: "cap", a: [0.02, 0.27, 0.07], b: [0.2, 0.18, 0.1], r: [0.062, 0.055], col: "legs" },
      { t: "cap", a: [0.2, 0.18, 0.1], b: [0.2, 0.06, 0.1], r: [0.055, 0.05], col: "legs", k: 0.02 },
      { t: "ell", c: [0.24, 0.05, 0.1], r: [0.085, 0.05, 0.06], col: "boots", k: 0.01 },
      { t: "cap", a: [-0.02, 0.27, -0.07], b: [-0.22, 0.07, -0.12], r: [0.062, 0.05], col: "legs" },
      { t: "ell", c: [-0.26, 0.05, -0.12], r: [0.085, 0.05, 0.06], rot: [0, 20, 0], col: "boots", k: 0.01 },
      // Doublet with gold trim down the front, a gold sash.
      { t: "ell", c: [0, 0.42, 0], r: [0.13, 0.17, 0.15], rot: [0, 0, -6], col: "torso" },
      { t: "cap", a: [0.13, 0.56, 0], b: [0.135, 0.3, 0], r: [0.018, 0.018], col: "gold", paint: true },
      { t: "tor", c: [0, 0.3, 0], R: 0.135, r: 0.022, col: "gold", k: 0.01 },
      { t: "ell", c: [-0.01, 0.53, 0], r: [0.11, 0.04, 0.14], col: "steel", k: 0.02 },
      // Short half-cape off the far shoulder.
      { t: "ell", c: [-0.1, 0.42, -0.14], r: [0.06, 0.16, 0.08], rot: [0, 0, -15], col: "torsoDk", k: 0.03 },
      // Head: tied-back hair, focused.
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.18, 0.13, 0.19], col: "hair", k: 0.02 },
      { t: "ell", c: [0.1, 0.86, 0.02], r: [0.09, 0.045, 0.14], rot: [0, 0, -15], col: "hair", k: 0.02 },
      ...chain([[-0.16, 0.8, 0], [-0.26, 0.74, 0.02], [-0.3, 0.62, 0.04]], 0.045, 0.02, "hair", 0.02),
      { t: "tor", c: [-0.17, 0.79, 0], R: 0.03, r: 0.012, rot: [0, 0, 60], col: "gold", k: 0.005 },
      { t: "cap", a: [0.2, 0.63, -0.02], b: [0.19, 0.625, 0.05], r: [0.008, 0.008], col: "mouth", paint: true },
      // Sword hand in front; far hand back for balance.
      ...arm(1, [0.24, 0.44, 0.2], "torso", "glove", 0.044),
      ...arm(-1, [-0.22, 0.58, -0.26], "torso", "glove", 0.042),
      // Sword: pommel, grip, crossguard, blade on a diagonal up and forward.
      dot([0.2, 0.36, 0.2], 0.032, "gold", 0.005),
      { t: "cap", a: [0.21, 0.38, 0.2], b: [0.26, 0.5, 0.2], r: [0.022, 0.022], col: "grip", k: 0.005 },
      { t: "cap", a: [0.18, 0.53, 0.2], b: [0.36, 0.46, 0.2], r: [0.022, 0.022], col: "gold", k: 0.005 },
      dot([0.18, 0.53, 0.2], 0.03, "gold", 0.004),
      dot([0.36, 0.46, 0.2], 0.03, "gold", 0.004),
      { t: "box", c: [0.4, 0.86, 0.2], s: [0.03, 0.34, 0.008], round: 0.006, rot: [0, 0, -21], col: "steel", k: 0.004 },
      { t: "box", c: [0.405, 0.86, 0.207], s: [0.006, 0.32, 0.004], round: 0.002, rot: [0, 0, -21], col: "steelDk", paint: true },
      { t: "cap", a: [0.52, 1.17, 0.2], b: [0.535, 1.22, 0.2], r: [0.026, 0.003], col: "steel", k: 0.004 },
      // The foe's dark blade, driving in from the right and glancing off.
      { t: "box", c: [0.72, 0.9, 0.2], s: [0.26, 0.032, 0.008], round: 0.006, rot: [0, 0, 18], col: "foe", k: 0 },
      { t: "box", c: [0.72, 0.91, 0.205], s: [0.24, 0.006, 0.004], round: 0.002, rot: [0, 0, 18], col: "foeLt", paint: true },
      { t: "cap", a: [0.96, 0.91, 0.17], b: [0.98, 1.06, 0.17], r: [0.022, 0.022], col: "foe", k: 0.004 },
      // Ring of sparks at the clash.
      { t: "tor", c: [0.47, 0.83, 0.22], R: 0.14, r: 0.012, rot: [90, 0, 0], col: "spark2", k: 0 },
      ...burst([0.47, 0.83, 0.22], 12, 0, 0.24, [0.026, 0.003], "spark", { len: 0.17, r: [0.022, 0.003], col: "spark2" }, 0.01),
      dot([0.47, 0.83, 0.22], 0.04, "glint", 0.01),
      ...sparkle([0.7, 1.12, 0.2], 0.05, "glint"),
    ],
    eyes: eyes("#3a6ab0", true, 0.71, 0.02, 0.05),
  },

  // Embestida Aturdidora: a Guard hero barrels in shoulder-first; a burly thug reels back with spiral
  // eyes and little gold stars circling his head.
  "embestida-aturdidora": {
    palette: {
      skin: "#ecbd96", torso: GUARD_BLUE, plate: "#4a72b8", blue: GUARD_BLUE_DK, gold: GOLD, legs: "#2a3a5e", boots: "#4a3020", glove: "#e0b04a",
      hair: "#3a2418", mouth: "#8a3a34",
      tBoots: "#2a2420", tLegs: "#4a4458", tShirt: "#c8b8a0", tVest: "#6a4a3a", tPatch: "#8a6a4a", tBelt: "#3a2a1e",
      stubble: "#b08a74", lump: "#f09a90", ink: "#1c1630", white: "#ffffff",
      orbit: "#ffe08a", star: "#ffd23a", star2: "#fff2a0", hit: "#fff4b0", streak: "#cfe6ff",
    },
    glow: ["orbit", "star", "star2", "hit", "streak"],
    shapes: [
      ...shift(CHARGER, [-0.3, 0, 0.2]),
      ...shift(rotZ(turn(rotZ(THUG, 18), -110), 0), [0.36, 0, -0.22]),
      // Stars over the thug's head.
      ...dizzyStars([0.42, 1.12, -0.2], 0.2),
      // Impact flash between them and speed streaks behind the charger.
      ...burst([0.1, 0.5, 0.25], 8, 10, 0.15, [0.03, 0.004], "hit", undefined, 0.02),
      ...[0.62, 0.45, 0.28].map((y, i): Shape => ({ t: "cap", a: [-0.52 - i * 0.03, y, 0.32], b: [-0.85, y + 0.02, 0.36], r: [0.016, 0.004], col: "streak", k: 0 })),
    ],
    eyes: eyes("#3a6ab0", true, 0.64, 0.17, 0.048).map((e) => ({ ...e, at: [e.at[0] - 0.3, e.at[1], e.at[2] + 0.2] as V3 })),
  },

  // Relevo Inmediato: a fallen ally rises as a glowing silhouette out of a swirl of light on the ground,
  // a blue-and-gold gauntlet reaching down to haul them up, a gold circular arrow wheeling round them.
  "relevo-inmediato": {
    palette: {
      ghost: "#bfefff", ghost2: "#7fd6ff", swirl: "#7fe6ff", swirl2: "#e8fbff", sleeve: GUARD_BLUE, cuff: GOLD, glove: "#e0b04a",
      arrow: "#ffd23a", glint: "#ffffff",
    },
    glow: ["ghost", "ghost2", "swirl", "swirl2", "arrow", "glint"],
    shapes: [
      // Swirl of light on the ground: rings and a spiral.
      { t: "tor", c: [0, 0.03, 0], R: 0.36, r: 0.018, col: "swirl", k: 0 },
      { t: "tor", c: [0, 0.03, 0], R: 0.24, r: 0.016, col: "swirl2", k: 0 },
      ...chain(Array.from({ length: 16 }, (_, i): V3 => { const a = rad(i * 40); const r = 0.06 + i * 0.022; return [Math.cos(a) * r, 0.04, Math.sin(a) * r]; }), 0.01, 0.02, "swirl", 0.005),
      { t: "ell", c: [0, 0.04, 0], r: [0.16, 0.03, 0.16], col: "swirl2", k: 0.02 },
      // The ally, a glowing silhouette rising out of it, one arm stretched up.
      { t: "cap", a: [0, 0.05, 0.07], b: [0, 0.28, 0.068], r: [0.05, 0.065], col: "ghost2", k: 0.04 },
      { t: "cap", a: [0, 0.05, -0.07], b: [0, 0.28, -0.068], r: [0.05, 0.065], col: "ghost2", k: 0.04 },
      { t: "ell", c: [0, 0.4, 0], r: [0.13, 0.16, 0.15], col: "ghost" },
      { t: "ell", c: [0.03, 0.7, 0], r: [0.18, 0.17, 0.17], col: "ghost", k: 0.02 },
      { t: "ell", c: [-0.02, 0.77, 0], r: [0.17, 0.12, 0.18], col: "ghost2", k: 0.02 },
      { t: "cap", a: [0, 0.5, 0.14], b: [0.16, 0.92, 0.12], r: [0.048, 0.042], col: "ghost", k: 0.02 },
      { t: "ell", c: [0.18, 0.96, 0.12], r: [0.05, 0.05, 0.05], col: "ghost", k: 0.02 },
      { t: "cap", a: [0, 0.5, -0.14], b: [0.08, 0.3, -0.2], r: [0.045, 0.04], col: "ghost", k: 0.02 },
      // The rescuer's gauntlet reaching down from the upper right, clasping the hand.
      { t: "cap", a: [0.72, 1.42, 0.1], b: [0.32, 1.06, 0.12], r: [0.1, 0.085], col: "sleeve", k: 0.03 },
      { t: "tor", c: [0.34, 1.08, 0.12], R: 0.09, r: 0.022, rot: [0, 0, 48], col: "cuff", k: 0.01 },
      { t: "box", c: [0.24, 1.0, 0.12], s: [0.075, 0.065, 0.06], round: 0.045, rot: [0, 0, 40], col: "glove", k: 0.03 },
      { t: "cap", a: [0.18, 0.98, 0.18], b: [0.13, 0.94, 0.16], r: [0.028, 0.024], col: "glove", k: 0.01 },
      { t: "cap", a: [0.2, 0.92, 0.12], b: [0.15, 0.9, 0.08], r: [0.026, 0.022], col: "glove", k: 0.01 },
      // Circular arrow wheeling round them.
      ...arcArrow([0.04, 0.58, -0.32], 0.6, 200, 480, 0.016, 0.034, "arrow", 2.2),
      ...sparkle([-0.42, 1.08, 0.1], 0.06, "glint"),
      ...sparkle([0.5, 0.3, 0.2], 0.05, "glint"),
      ...sparkle([-0.3, 0.2, 0.3], 0.04, "glint"),
    ],
    eyes: eyes("#3a8ad0", false, 0.7, 0.03, 0.05),
  },

  // Yunque, el Armero Alado: a stout bearded armour-smith in brass plate with Guard-blue panels, an
  // open-faced brass helm, small brass-ribbed mechanical wings at his back, a little anvil emblem on his
  // chest and a smith's hammer on his shoulder.
  "yunque-armero": {
    palette: {
      skin: "#e8b08a", torso: "#c8923a", brass: "#e0aa48", brassDk: "#9a6a24", blue: GUARD_BLUE, blueDk: GUARD_BLUE_DK, legs: GUARD_BLUE_DK,
      boots: "#9a6a24", beard: "#8a4a24", glove: "#5a3a24", iron: "#3e4450", steel: "#c4ccd8", wood: "#8a5a30", mouth: "#7a3a2a", glint: "#fff4c0",
    },
    glow: ["glint"],
    shapes: [
      // Wings fanned from the back.
      ...mechWing([-0.14, 0.6, -0.14], [75, 105, 135, 165], [0.28, 0.33, 0.31, 0.25]),
      ...mechWing([-0.16, 0.58, 0.14], [90, 120, 150, 180], [0.26, 0.31, 0.29, 0.23]),
      { t: "box", c: [-0.13, 0.48, 0], s: [0.05, 0.11, 0.1], round: 0.04, col: "brassDk", k: 0.02 },
      ...body({ torso: [0.16, 0.17, 0.17], hips: 0.075 }),
      // Plate: brass chest with a blue belly panel, gold rivets, knee cops, a wide belt.
      { t: "ell", c: [0.02, 0.44, 0], r: [0.16, 0.14, 0.175], col: "brass", k: 0.02 },
      { t: "ell", c: [0.11, 0.33, 0], r: [0.09, 0.06, 0.15], col: "blue", paint: true },
      { t: "tor", c: [0, 0.28, 0], R: 0.16, r: 0.03, col: "blueDk", k: 0.01 },
      { t: "box", c: [0.19, 0.28, 0], s: [0.016, 0.035, 0.04], round: 0.01, col: "brass", k: 0.004 },
      { t: "ell", c: [0.05, 0.17, 0.08], r: [0.05, 0.05, 0.05], col: "brass", mirror: true, k: 0.01 },
      // Anvil emblem on a blue chest disc.
      { t: "ell", c: [0.16, 0.47, 0.03], r: [0.03, 0.075, 0.075], rot: [0, -20, 0], col: "blue", k: 0.01 },
      { t: "box", c: [0.19, 0.5, 0.04], s: [0.012, 0.016, 0.04], round: 0.006, rot: [0, -20, 0], col: "steel", k: 0.004 },
      { t: "cap", a: [0.19, 0.5, 0.075], b: [0.18, 0.5, 0.11], r: [0.013, 0.003], col: "steel", k: 0.004 },
      { t: "box", c: [0.19, 0.465, 0.035], s: [0.01, 0.02, 0.015], round: 0.004, rot: [0, -20, 0], col: "steel", k: 0.004 },
      { t: "box", c: [0.19, 0.435, 0.035], s: [0.012, 0.01, 0.035], round: 0.004, rot: [0, -20, 0], col: "steel", k: 0.004 },
      // Big round pauldrons, brass with a blue band.
      { t: "ell", c: [-0.01, 0.56, 0.18], r: [0.1, 0.075, 0.1], col: "brass", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.01, 0.55, 0.19], r: [0.1, 0.022, 0.105], col: "blue", mirror: true, paint: true },
      // Head: open-faced brass helm with a blue crest ridge, a big bushy beard.
      { t: "ell", c: [-0.02, 0.79, 0], r: [0.2, 0.15, 0.2], col: "brass", k: 0.02 },
      { t: "ell", c: [0.2, 0.69, 0], r: [0.1, 0.15, 0.15], col: "brass", cut: true, k: 0.02 },
      { t: "ell", c: [0.02, 0.71, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.01 },
      { t: "cap", a: [0.15, 0.92, 0], b: [-0.2, 0.86, 0], r: [0.026, 0.026], col: "blue", k: 0.02 },
      { t: "tor", c: [0, 0.8, 0], R: 0.19, r: 0.012, col: "brassDk", paint: true },
      { t: "ell", c: [0.12, 0.58, 0], r: [0.1, 0.1, 0.14], col: "beard", k: 0.03 },
      { t: "ell", c: [0.16, 0.5, 0], r: [0.06, 0.06, 0.08], col: "beard", k: 0.03 },
      { t: "ell", c: [0.17, 0.67, 0], r: [0.04, 0.02, 0.09], col: "beard", k: 0.01 },
      { t: "ell", c: [0.2, 0.7, 0.0], r: [0.025, 0.02, 0.02], col: "skin", k: 0.01 },
      // Hammer over the near shoulder; far hand on the hip.
      ...arm(1, [0.3, 0.56, 0.3], "torso", "glove", 0.05),
      { t: "cap", a: [0.3, 0.48, 0.3], b: [0.36, 0.92, 0.32], r: [0.018, 0.018], col: "wood", k: 0.004 },
      { t: "box", c: [0.365, 0.95, 0.32], s: [0.11, 0.055, 0.055], round: 0.015, rot: [0, 0, 8], col: "iron", k: 0.004 },
      { t: "box", c: [0.365, 0.95, 0.32], s: [0.035, 0.06, 0.06], round: 0.01, rot: [0, 0, 8], col: "brass", k: 0.004 },
      ...arm(-1, [0.08, 0.3, -0.24], "torso", "glove", 0.05),
      ...sparkle([0.52, 1.06, 0.32], 0.05, "glint"),
      ...sparkle([0.42, 0.62, 0.1], 0.04, "glint"),
    ],
    eyes: eyes("#3a6ab0", false, 0.73, 0.02, 0.048),
  },
};
