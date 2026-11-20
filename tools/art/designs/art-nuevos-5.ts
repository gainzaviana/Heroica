import type { Sculpt, Shape, V3 } from "../sculpt";
import { FRONT, arm, body, burst, eyes, rad, turn } from "./kit";

// Baluarte, Custodio del Umbral and Sibila del Caos — art batch 5.
// Custodio del Umbral: a sorceress whose magic is glowing teal (#0f766e) rune circles with gold
// accents. Her invocations are great spells, so each one is a dramatic magical effect. Original
// designs only.

// MARK: Helpers

/** Capsules through a list of points, radius tapering from r0 to r1. */
function path(pts: V3[], r0: number, r1: number, col: string, k = 0.01, paint = false): Shape[] {
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

/** A helix around a vertical axis at (cx, cz) from y0 to y1: `turns` turns of radius R. */
function helix(cx: number, cz: number, y0: number, y1: number, R: number, turns: number, phase = 0, n = 28): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = rad(phase + 360 * turns * t);
    out.push([cx + R * Math.cos(a), y0 + (y1 - y0) * t, cz + R * Math.sin(a)]);
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

const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

/** A ring facing the camera (in the xy plane). */
const ring = (c: V3, R: number, r: number, col: string, k = 0): Shape => ({ t: "tor", c, R, r, rot: [90, 0, 0], col, k });

/** A small glowing up-arrow (empowerment), base at c. */
function upArrow(c: V3, h: number, col: string): Shape[] {
  const top: V3 = [c[0], c[1] + h, c[2]];
  return [
    { t: "cap", a: c, b: top, r: [h * 0.12, h * 0.12], col, k: 0 },
    { t: "cap", a: top, b: [c[0] - h * 0.38, c[1] + h * 0.62, c[2]], r: [h * 0.12, h * 0.11], col, k: 0.01 },
    { t: "cap", a: top, b: [c[0] + h * 0.38, c[1] + h * 0.62, c[2]], r: [h * 0.12, h * 0.11], col, k: 0.01 },
  ];
}

/** An open hand, palm toward +z, fingers up; thumb on the `side` (+1 = +x). Wrist at y ≈ 0.05. */
function hand(skin: string, cuff: string, side: 1 | -1 = 1): Shape[] {
  const len = [0.19, 0.25, 0.24, 0.2];
  return [
    { t: "cap", a: [0, -0.2, 0], b: [0, 0.3, 0], r: [0.1, 0.1], col: cuff, k: 0.04 },
    { t: "box", c: [0, 0.42, 0], s: [0.15, 0.15, 0.065], round: 0.06, col: skin, k: 0.05 },
    ...[-0.105, -0.035, 0.035, 0.105].map((x, i): Shape => ({ t: "cap", a: [x * side, 0.52, 0], b: [x * 1.25 * side, 0.52 + len[i], 0], r: [0.042, 0.036], col: skin, k: 0.02 })),
    { t: "cap", a: [0.12 * side, 0.36, 0.01], b: [0.27 * side, 0.5, 0.04], r: [0.048, 0.04], col: skin, k: 0.03 },
  ];
}

/** A clenched fist raised upward (knuckles on top at y ≈ 0.6), forearm below. Wrist at y ≈ 0.3. */
function fist(skin: string, cuff: string): Shape[] {
  return [
    { t: "cap", a: [0, -0.2, 0], b: [0, 0.3, 0], r: [0.1, 0.105], col: cuff, k: 0.04 },
    { t: "box", c: [0, 0.45, -0.01], s: [0.14, 0.13, 0.1], round: 0.08, col: skin, k: 0.05 },
    ...[0.1, 0.035, -0.035, -0.1].flatMap((x): Shape[] => [
      { t: "ell", c: [x, 0.57, 0], r: [0.038, 0.055, 0.08], col: skin, k: 0.012 },
      { t: "cap", a: [x, 0.57, 0.07], b: [x * 0.95, 0.48, 0.1], r: [0.034, 0.03], col: skin, k: 0.012 },
    ]),
    { t: "cap", a: [0.12, 0.36, 0.08], b: [0.04, 0.47, 0.13], r: [0.04, 0.034], col: skin, k: 0.02 },
  ];
}

/** A hooded robed figure facing +x, glowing eyes in the dark hood. Feet at y = 0. */
function hooded(cloak: string, trim: string, shadow: string, eye: string): Shape[] {
  return [
    { t: "cap", a: [0, 0.08, 0], b: [0, 0.55, 0], r: [0.2, 0.12], col: cloak },
    { t: "ell", c: [0, 0.05, 0], r: [0.22, 0.06, 0.22], col: cloak, k: 0.06 },
    { t: "tor", c: [0, 0.06, 0], R: 0.2, r: 0.025, col: trim, k: 0.02 },
    // sleeves folded in front
    { t: "cap", a: [0.02, 0.5, 0.13], b: [0.15, 0.36, 0.06], r: [0.05, 0.06], col: cloak, k: 0.03 },
    { t: "cap", a: [0.02, 0.5, -0.13], b: [0.15, 0.36, -0.06], r: [0.05, 0.06], col: cloak, k: 0.03 },
    { t: "ell", c: [0.17, 0.35, 0], r: [0.05, 0.06, 0.09], col: trim, k: 0.02 },
    // hood
    { t: "ell", c: [0, 0.7, 0], r: [0.17, 0.17, 0.16], col: cloak, k: 0.06 },
    { t: "cap", a: [-0.05, 0.8, 0], b: [-0.17, 0.92, 0], r: [0.1, 0.02], col: cloak, k: 0.05 },
    { t: "ell", c: [0.16, 0.66, 0], r: [0.09, 0.115, 0.12], col: cloak, cut: true, k: 0.02 },
    { t: "ell", c: [0.06, 0.67, 0], r: [0.1, 0.1, 0.1], col: shadow, k: 0.0 },
    ...path(arcPts(0.14, 0.67, 0.12, 100, 260, 8, 0, 0.12).map(([x, y]): V3 => [0.14, y, x - 0.14]), 0.016, 0.016, trim, 0.01).map((s): Shape => s),
    { t: "ell", c: [0.15, 0.68, 0.04], r: [0.012, 0.02, 0.02], col: eye, k: 0 },
    { t: "ell", c: [0.15, 0.68, -0.04], r: [0.012, 0.02, 0.02], col: eye, k: 0 },
  ];
}

/** Five-point star in the xy plane. */
function star(c: V3, R: number, col: string): Shape[] {
  return [
    { t: "ell", c, r: [R * 0.42, R * 0.42, R * 0.25], col, k: 0.02 },
    ...burst(c, 5, 90, R, [R * 0.3, R * 0.04], col, undefined, 0.02),
  ];
}

/** A small rune glyph (letter) in the xy plane, made of strokes, at c with size s. */
function glyph(c: V3, s: number, kind: number, col: string): Shape[] {
  const P = (x: number, y: number): V3 => [c[0] + x * s, c[1] + y * s, c[2]];
  const strokes: [number, number][][] = [
    [[[-0.5, -1], [0, 1], [0.5, -1]], [[-0.25, -0.1], [0.25, -0.1]]],
    [[[0, -1], [0, 1]], [[0, 1], [0.6, 0.5], [0, 0]], [[0, 0], [0.6, -1]]],
    [[[-0.5, 1], [0.5, 1]], [[0, 1], [0, -1]], [[-0.5, -1], [0.5, -1]]],
    [[[-0.5, -1], [-0.5, 1], [0.5, -1], [0.5, 1]]],
  ][kind % 4] as [number, number][][];
  return strokes.flatMap((st) => path(st.map(([x, y]) => P(x, y)), s * 0.2, s * 0.2, col, 0.005));
}

// MARK: Palettes

const MAGE = { teal: "#0f766e", teal2: "#14b8a6", glow: "#5eead4", hot: "#e6fffb", gold: "#e8b23a", gold2: "#ffd66a" };

// MARK: Pieces

function potencia(): Shape[] {
  const L = place(rotZ(fist("skin", "cuff"), 12, [0, 0, 0]), 1, [-0.32, 0.12, 0]);
  const R = place(rotZ(hand("skin", "cuff", -1), -12, [0, 0, 0]), 1, [0.32, 0.12, 0]);
  return [
    // rune circle behind, between the hands
    ring([0, 0.6, -0.3], 0.52, 0.018, "teal2"),
    ring([0, 0.6, -0.3], 0.44, 0.01, "gold"),
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((a): Shape => ({ t: "box", c: [0.48 * Math.cos(rad(a)), 0.6 + 0.48 * Math.sin(rad(a)), -0.3], s: [0.022, 0.022, 0.01], round: 0.005, rot: [0, 0, a + 45], col: "gold2", k: 0 })),
    ...L, ...R,
    // gold cuffs at the wrist
    { t: "tor", c: [-0.34, 0.33, 0], R: 0.105, r: 0.022, rot: [0, 0, 12], col: "gold", k: 0.005 },
    { t: "tor", c: [0.34, 0.33, 0], R: 0.105, r: 0.022, rot: [0, 0, -12], col: "gold", k: 0.005 },
    // swirling energy bands around each forearm and hand
    ...path(helix(-0.33, 0, -0.05, 0.85, 0.17, 1.6, 30), 0.022, 0.012, "glow", 0.004),
    ...path(helix(-0.33, 0, 0.05, 0.75, 0.21, 1.2, 200), 0.014, 0.008, "teal2", 0.004),
    ...path(helix(0.33, 0, -0.05, 0.95, 0.19, 1.6, 150), 0.022, 0.012, "glow", 0.004),
    ...path(helix(0.33, 0, 0.05, 0.8, 0.23, 1.2, 320), 0.014, 0.008, "teal2", 0.004),
    // empowerment
    ...upArrow([0, 0.85, 0.05], 0.16, "gold2"),
    ...upArrow([-0.55, 0.9, 0.05], 0.1, "glow"),
    ...upArrow([0.6, 1.0, 0.05], 0.1, "glow"),
    ...sparkle([0, 0.45, 0.1], 0.06, "hot"),
    ...sparkle([-0.56, 0.4, 0.05], 0.045, "hot"),
    ...sparkle([0.58, 0.55, 0.05], 0.045, "hot"),
  ];
}

function amuleto(): Shape[] {
  const c: V3 = [0, 0.42, 0];
  const hex: V3[] = [];
  for (let i = 0; i <= 6; i++) { const a = rad(90 + 60 * i); hex.push([c[0] + 0.3 * Math.cos(a), c[1] + 0.3 * Math.sin(a), 0]); }
  return [
    // dark teal backing plate inside a gold hexagonal frame
    ...[0, 60, 120].map((a): Shape => ({ t: "box", c: [c[0], c[1], -0.03], s: [0.15, 0.26, 0.025], round: 0.02, rot: [0, 0, a], col: "back", k: 0.01 })),
    ...path(hex, 0.04, 0.04, "gold", 0.02),
    ...hex.slice(0, 6).map((p): Shape => dot([p[0], p[1], 0.03], 0.04, "gem")),
    // filigree scrolls on both sides
    ...[1, -1].flatMap((s): Shape[] => path(arcPts(c[0] + s * 0.36, c[1], 0.08, s > 0 ? 120 : 60, s > 0 ? -150 : 330, 10, 0.0), 0.016, 0.01, "gold2", 0.01)),
    // bail and chain
    { t: "tor", c: [0, 0.78, 0], R: 0.045, r: 0.016, rot: [0, 90, 90], col: "gold", k: 0.005 },
    ...[1, -1].flatMap((s): Shape[] => {
      const pts = bez([0, 0.82, 0], [s * 0.1, 1.0, 0], [s * 0.38, 1.18, -0.05], 7);
      return pts.slice(1).map((p, i): Shape => ({ t: "tor", c: p, R: 0.03, r: 0.01, rot: i % 2 ? [90, 0, s * 50] : [0, 0, s * 50 + 90], col: "gold", k: 0 }));
    }),
    // the hourglass: gold caps, posts, glass bulbs, glowing sand
    { t: "cap", a: [0, 0.61, 0.07], b: [0, 0.63, 0.07], r: [0.1, 0.1], col: "bronze", k: 0.005 },
    { t: "cap", a: [0, 0.21, 0.07], b: [0, 0.23, 0.07], r: [0.1, 0.1], col: "bronze", k: 0.005 },
    ...[[0.09, 0.03], [-0.09, 0.03], [0, 0.12]].map(([x, z]): Shape => ({ t: "cap", a: [x, 0.23, 0.07 + z * 0.3], b: [x, 0.61, 0.07 + z * 0.3], r: [0.012, 0.012], col: "bronze", k: 0 })),
    { t: "cap", a: [0, 0.58, 0.07], b: [0, 0.42, 0.07], r: [0.075, 0.012], col: "glass", k: 0.03 },
    { t: "cap", a: [0, 0.42, 0.07], b: [0, 0.26, 0.07], r: [0.012, 0.075], col: "glass", k: 0.03 },
    { t: "ell", c: [0, 0.25, 0.07], r: [0.09, 0.05, 0.09], col: "sand", paint: true },
    { t: "ell", c: [0, 0.53, 0.07], r: [0.05, 0.025, 0.09], col: "sand", paint: true },
    { t: "cap", a: [0, 0.44, 0.15], b: [0, 0.3, 0.15], r: [0.006, 0.006], col: "sand", paint: true },
    // time sparkles around it
    ...path(arcPts(c[0], c[1], 0.44, 200, 340, 12, -0.08), 0.012, 0.004, "glow", 0),
    ...sparkle([0.38, 0.78, 0.05], 0.05, "hot"),
    ...sparkle([-0.4, 0.14, 0.05], 0.04, "hot"),
    dot([-0.33, 0.75, 0.03], 0.015, "glow"),
  ];
}

function cadenas(): Shape[] {
  const bands: Shape[] = [
    [0.12, 0.17, 12, 8], [0.28, 0.2, -14, -6], [0.42, 0.24, 16, 10], [0.55, 0.22, -10, -12], [0.82, 0.21, 18, 6],
  ].map(([y, R, rx, rz]): Shape => ({ t: "tor", c: [0.01, y, 0], R, r: 0.026, rot: [rx, 0, rz], col: "amber", k: 0.004 }));
  return [
    ...body({ torso: [0.14, 0.17, 0.15] }),
    // arms pinned at the sides
    { t: "cap", a: [0, 0.52, 0.16], b: [0.02, 0.26, 0.17], r: [0.05, 0.045], col: "torso", k: 0.03 },
    { t: "cap", a: [0, 0.52, -0.16], b: [0.02, 0.26, -0.17], r: [0.05, 0.045], col: "torso", k: 0.03 },
    // ragged hood / spikes on the head (a menacing shade)
    { t: "cap", a: [-0.05, 0.84, 0.08], b: [-0.12, 1.0, 0.14], r: [0.06, 0.01], col: "skin", k: 0.04 },
    { t: "cap", a: [-0.05, 0.84, -0.08], b: [-0.12, 1.0, -0.14], r: [0.06, 0.01], col: "skin", k: 0.04 },
    { t: "cap", a: [-0.1, 0.8, 0], b: [-0.26, 0.92, 0], r: [0.07, 0.01], col: "skin", k: 0.04 },
    // glowing slit eyes and a grimace
    { t: "ell", c: [0.19, 0.73, 0.065], r: [0.02, 0.022, 0.045], rot: [0, 0, 0], col: "eye", k: 0 },
    { t: "ell", c: [0.19, 0.73, -0.065], r: [0.02, 0.022, 0.045], col: "eye", k: 0 },
    ...bands,
    // links trailing off the bands
    ...[[0.2, 0.2, 0.08], [0.23, 0.14, 0.14], [0.27, 0.1, 0.2]].map(([x, y, z], i): Shape => ({ t: "tor", c: [x, y, z], R: 0.035, r: 0.011, rot: i % 2 ? [90, 0, 30] : [0, 0, 120], col: "amber2", k: 0 })),
    ...[[-0.2, 0.56, -0.1], [-0.27, 0.6, -0.12], [-0.34, 0.66, -0.14]].map(([x, y, z], i): Shape => ({ t: "tor", c: [x, y, z], R: 0.035, r: 0.011, rot: i % 2 ? [90, 0, -40] : [0, 0, 50], col: "amber2", k: 0 })),
    // glowing knot (the seal of the spell) on the chest
    { t: "box", c: [0.15, 0.42, 0], s: [0.05, 0.05, 0.05], round: 0.012, rot: [0, 0, 45], col: "amber2", k: 0.01 },
    ...sparkle([0.36, 0.9, 0.05], 0.06, "hot"),
    ...sparkle([-0.32, 0.25, 0.05], 0.045, "amber2"),
    ...sparkle([0.32, 0.5, 0.15], 0.04, "hot"),
    // arcs of power crackling outward
    ...path(arcPts(0, 0.5, 0.42, 30, 70, 5, -0.05), 0.012, 0.004, "amber2", 0),
    ...path(arcPts(0, 0.5, 0.42, 150, 200, 5, -0.05), 0.012, 0.004, "amber2", 0),
  ];
}

function espejismos(): Shape[] {
  return [
    // the shimmer between them
    ...path(bez([-0.75, 0.3, -0.2], [-0.4, 0.9, -0.2], [0.0, 1.05, -0.25], 10), 0.012, 0.004, "glow", 0),
    ...path(bez([0.75, 0.2, -0.2], [0.5, 0.9, -0.2], [0.05, 1.1, -0.25], 10), 0.012, 0.004, "pale3", 0),
    // two copies behind, fading, and the original in front
    ...place(turn(hooded("c3", "t3", "s3", "e3"), FRONT + 20), 0.9, [0.62, 0.0, -0.35]),
    ...place(turn(hooded("c2", "t2", "s2", "e2"), FRONT + 10), 0.95, [-0.55, 0.0, -0.2]),
    ...turn(hooded("cloak", "gold", "shadow", "glow"), FRONT),
    // a small rune circle hovering before the original's hands
    ring([0.2, 0.36, 0.2], 0.08, 0.014, "glow"),
    ...sparkle([0.26, 0.96, 0.05], 0.05, "hot"),
    ...sparkle([-0.7, 0.85, -0.2], 0.045, "pale3"),
    ...sparkle([0.82, 0.62, -0.2], 0.04, "pale3"),
    dot([-0.25, 1.0, -0.1], 0.015, "glow"),
    dot([0.42, 1.0, -0.2], 0.012, "glow"),
  ];
}

function sellos(): Shape[] {
  const c: V3 = [0, 0.55, 0];
  // heater shield of light
  const outline: [number, number][] = [[-0.2, 0.82], [0, 0.86], [0.2, 0.82], [0.2, 0.55], [0.12, 0.36], [0, 0.26], [-0.12, 0.36], [-0.2, 0.55], [-0.2, 0.82]];
  const out: Shape[] = [
    // orbit
    ring(c, 0.5, 0.008, "gold"),
    { t: "ell", c: [0, 0.6, 0], r: [0.19, 0.24, 0.05], col: "light" },
    { t: "cap", a: [0, 0.75, 0], b: [0, 0.32, 0], r: [0.17, 0.05], col: "light", k: 0.08 },
    ...path(outline.map(([x, y]): V3 => [x, y, 0.01]), 0.026, 0.026, "teal2", 0.01),
    { t: "ell", c: [0, 0.6, 0.04], r: [0.09, 0.12, 0.03], col: "hot", paint: true },
    // rays behind the shield
    ...burst([0, 0.56, -0.2], 16, 11, 0.36, [0.025, 0.004], "glow", undefined, 0),
  ];
  for (let i = 0; i < 7; i++) {
    const a = rad(90 + (360 / 7) * i);
    const p: V3 = [c[0] + 0.5 * Math.cos(a), c[1] + 0.5 * Math.sin(a), 0.03];
    out.push(ring(p, 0.075, 0.02, "glow"));
    out.push({ t: "ell", c: p, r: [0.055, 0.055, 0.015], col: "teal", k: 0 });
    out.push({ t: "box", c: [p[0], p[1], p[2] + 0.015], s: [0.026, 0.026, 0.008], round: 0.004, rot: [0, 0, 45 + i * 10], col: "gold2", k: 0 });
    // motion trail behind each seal
    const tr = arcPts(c[0], c[1], 0.5, 90 + (360 / 7) * i - 8, 90 + (360 / 7) * i - 24, 4, 0.0);
    out.push(...path(tr, 0.02, 0.006, "glow", 0));
  }
  out.push(...sparkle([0.5, 1.0, 0.05], 0.05, "hot"), ...sparkle([-0.52, 0.12, 0.05], 0.045, "hot"));
  return out;
}

function brumas(): Shape[] {
  const out: Shape[] = [];
  // mist swirling in an S from the spiral to the star
  const mist = bez([-0.4, 0.3, -0.05], [0.0, 1.0, -0.08], [0.42, 0.35, -0.05], 14);
  mist.forEach((p, i) => {
    const r = 0.06 + 0.04 * Math.sin((i / 14) * Math.PI);
    out.push({ t: "ell", c: [p[0], p[1] + 0.03 * Math.sin(i * 1.7), p[2]], r: [r * 1.3, r, r], col: i < 7 ? "violet" : "teal2", k: 0.06 });
  });
  const lower = bez([-0.42, 0.22, 0.05], [0.0, -0.1, 0.06], [0.44, 0.28, 0.05], 12);
  lower.forEach((p, i) => out.push({ t: "ell", c: p, r: [0.07, 0.05, 0.05], col: i < 6 ? "violet2" : "teal", k: 0.06 }));
  // wisps curling off the mist
  out.push(...path(bez([-0.1, 0.78, 0.02], [-0.05, 1.0, 0.04], [0.12, 1.02, 0.04], 6), 0.02, 0.006, "mistL", 0.02));
  out.push(...path(bez([0.1, 0.08, 0.06], [0.2, -0.04, 0.08], [0.3, 0.02, 0.08], 6), 0.018, 0.006, "mistL", 0.02));
  // the spiral symbol (left), turning into a star (right)
  const sp: V3[] = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30, a = rad(90 + 720 * t), R = 0.02 + 0.17 * t; sp.push([-0.45 + R * Math.cos(a), 0.55 + R * Math.sin(a), 0.12]); }
  out.push(...path(sp, 0.018, 0.03, "spiral", 0.004));
  out.push(...star([0.45, 0.58, 0.12], 0.2, "star"));
  out.push({ t: "ell", c: [0.45, 0.58, 0.16], r: [0.05, 0.05, 0.02], col: "hot", paint: true });
  // the change: a little arrow of sparks through the middle
  out.push(...path([[-0.18, 0.56, 0.12], [0.18, 0.56, 0.12]], 0.012, 0.012, "hot", 0));
  out.push(...path([[0.18, 0.56, 0.12], [0.12, 0.61, 0.12]], 0.012, 0.012, "hot", 0));
  out.push(...path([[0.18, 0.56, 0.12], [0.12, 0.51, 0.12]], 0.012, 0.012, "hot", 0));
  out.push(...sparkle([0.62, 0.9, 0.05], 0.05, "hot"), ...sparkle([-0.62, 0.9, 0.05], 0.04, "spiral"), dot([0.0, 0.78, 0.1], 0.015, "hot"));
  return out;
}

function vientos(): Shape[] {
  const bk: V3 = [-0.38, 0.14, 0];
  const out: Shape[] = [
    // open book, tilted up toward the wind
    ...rotZ([
      { t: "box", c: [bk[0], bk[1] - 0.03, 0], s: [0.3, 0.015, 0.2], round: 0.01, col: "cover", k: 0 },
      { t: "box", c: [bk[0] - 0.13, bk[1] + 0.01, 0], s: [0.14, 0.03, 0.18], round: 0.02, rot: [0, 0, 8], col: "page", k: 0.01 },
      { t: "box", c: [bk[0] + 0.13, bk[1] + 0.01, 0], s: [0.14, 0.03, 0.18], round: 0.02, rot: [0, 0, -8], col: "page", k: 0.01 },
      { t: "cap", a: [bk[0], bk[1] - 0.01, -0.19], b: [bk[0], bk[1] - 0.01, 0.19], r: [0.02, 0.02], col: "gold", k: 0.01 },
      // a page lifting off
      { t: "box", c: [bk[0] + 0.12, bk[1] + 0.12, 0], s: [0.13, 0.008, 0.17], round: 0.006, rot: [0, 0, 40], col: "page", k: 0 },
    ], 20, bk),
    { t: "ell", c: [bk[0] + 0.04, bk[1] + 0.12, 0.02], r: [0.12, 0.04, 0.12], col: "glow", paint: true },
  ];
  // gusts of wind streaming up and right out of the book
  const gusts: [V3, V3, V3, number][] = [
    [[-0.3, 0.25, 0.05], [-0.1, 0.75, 0.05], [0.45, 0.8, 0.05], 0.03],
    [[-0.25, 0.22, -0.08], [0.15, 0.4, -0.1], [0.55, 0.55, -0.1], 0.025],
    [[-0.38, 0.3, 0.12], [-0.4, 0.95, 0.12], [0.1, 1.1, 0.12], 0.022],
  ];
  for (const [a, b, c, r] of gusts) out.push(...path(bez(a, b, c, 12), r * 0.4, r, "wind", 0.01));
  // curls at the gust tips
  out.push(...path(arcPts(0.47, 0.73, 0.07, -90, 200, 8, 0.05), 0.03, 0.012, "wind", 0.01));
  out.push(...path(arcPts(0.08, 1.03, 0.07, -90, 200, 8, 0.12), 0.022, 0.01, "wind", 0.01));
  // flying pages
  const pages: [V3, number, number][] = [[[0.0, 0.62, 0.12], 30, 20], [[0.3, 0.92, 0.0], -20, 40], [[0.55, 0.38, -0.05], 50, -30], [[-0.18, 0.95, 0.02], 10, 60]];
  for (const [p, rz, ry] of pages) {
    out.push({ t: "box", c: p, s: [0.075, 0.095, 0.014], round: 0.008, rot: [10, ry, rz], col: "page", k: 0 });
  }
  // glowing letters
  out.push(...glyph([0.15, 0.48, 0.15], 0.065, 0, "gold2"));
  out.push(...glyph([0.42, 0.62, 0.15], 0.06, 1, "glow"));
  out.push(...glyph([-0.06, 0.8, 0.15], 0.06, 2, "gold2"));
  out.push(...glyph([0.3, 1.06, 0.1], 0.055, 3, "glow"));
  out.push(...glyph([0.64, 0.92, 0.1], 0.05, 0, "glow"));
  out.push(...sparkle([-0.5, 0.6, 0.05], 0.045, "hot"), dot([0.05, 0.35, 0.15], 0.015, "gold2"), dot([0.6, 0.2, 0.05], 0.015, "glow"));
  return out;
}

/** Stretches a chibi figure into a taller one: everything above the knees is raised by up to `L`. */
function lift(shapes: Shape[], L = 0.16): Shape[] {
  const f = (v: V3): V3 => [v[0], v[1] + L * Math.min(1, Math.max(0, (v[1] - 0.06) / 0.24)), v[2]];
  return shapes.map((sh): Shape => (sh.t === "cap" ? { ...sh, a: f(sh.a), b: f(sh.b) } : { ...sh, c: f(sh.c) }));
}

function centinela(): Shape[] {
  const hues = ["r", "o", "y", "g", "b", "v"];
  const bridge: Shape[] = [];
  // the crystal bridge, arching away behind him (-x): six coloured lanes of faceted slabs
  const bx = (j: number) => -0.08 - j * 0.15, by = (j: number) => -0.05 + 0.22 * Math.sin((j / 10) * Math.PI * 0.8);
  for (let i = 0; i < 6; i++) {
    const z = -0.25 + i * 0.1;
    for (let j = 0; j < 7; j++) {
      const ang = (Math.atan2(by(j + 1) - by(j), bx(j + 1) - bx(j)) * 180) / Math.PI + 180;
      bridge.push({ t: "box", c: [(bx(j) + bx(j + 1)) / 2, (by(j) + by(j + 1)) / 2, z], s: [0.078, 0.025, 0.05], round: 0.012, rot: [0, 0, ang], col: hues[i], k: 0.0 });
    }
  }
  bridge.push(...[-0.31, 0.31].flatMap((z) => path([0, 1, 2, 3, 4, 5, 6, 7].map((j): V3 => [bx(j), by(j) + 0.04, z]), 0.016, 0.01, "crys", 0)));
  return [
    ...bridge,
    // gold-and-bronze plinth at the bridge's end
    { t: "box", c: [0.1, -0.05, 0], s: [0.22, 0.04, 0.3], round: 0.02, col: "bronze2", k: 0 },
    ...lift([
    ...body({ torso: [0.14, 0.17, 0.16] }),
    // armour: breastplate, belt, tassets, pauldrons
    { t: "ell", c: [0.01, 0.43, 0], r: [0.15, 0.15, 0.165], col: "gold", k: 0.02 },
    { t: "ell", c: [0.12, 0.45, 0], r: [0.04, 0.09, 0.1], col: "gold2", paint: true },
    { t: "tor", c: [0, 0.3, 0], R: 0.145, r: 0.022, col: "bronze", k: 0.01 },
    { t: "ell", c: [0, 0.22, 0], r: [0.16, 0.08, 0.16], col: "bronze", k: 0.02 },
    { t: "ell", c: [0.0, 0.56, 0.16], r: [0.1, 0.07, 0.09], rot: [-20, 0, 0], col: "bronze", k: 0.02 },
    { t: "ell", c: [0.0, 0.56, -0.16], r: [0.1, 0.07, 0.09], rot: [20, 0, 0], col: "bronze", k: 0.02 },
    { t: "ell", c: [0.0, 0.52, 0.2], r: [0.09, 0.05, 0.07], rot: [-20, 0, 0], col: "gold", k: 0.02 },
    { t: "ell", c: [0.0, 0.52, -0.2], r: [0.09, 0.05, 0.07], rot: [20, 0, 0], col: "gold", k: 0.02 },
    // long cloak behind
    { t: "cap", a: [-0.1, 0.55, 0], b: [-0.17, 0.04, 0], r: [0.13, 0.2], col: "cloak", k: 0.04 },
    // arms resting on the pommel
    ...arm(1, [0.27, 0.5, 0.05], "mail", "gold", 0.048),
    ...arm(-1, [0.27, 0.5, -0.05], "mail", "gold", 0.048),
    // the long sword, point down into the plinth
    { t: "box", c: [0.28, 0.2, 0], s: [0.012, 0.27, 0.038], round: 0.008, col: "blade", k: 0 },
    { t: "cap", a: [0.28, 0.02, 0], b: [0.28, -0.04, 0], r: [0.02, 0.004], col: "blade", k: 0.01 },
    { t: "box", c: [0.28, 0.2, 0], s: [0.016, 0.24, 0.008], round: 0.004, col: "runeG", paint: true },
    { t: "box", c: [0.28, 0.42, 0], s: [0.025, 0.022, 0.14], round: 0.015, col: "gold", k: 0.005 },
    { t: "cap", a: [0.28, 0.44, 0], b: [0.28, 0.56, 0], r: [0.022, 0.022], col: "grip", k: 0 },
    dot([0.28, 0.58, 0], 0.035, "gem"),
    // crested helm: bowl, cheek guards, nasal, and a tall crest from brow to nape
    { t: "ell", c: [-0.04, 0.8, 0], r: [0.2, 0.15, 0.2], col: "gold", k: 0.02 },
    { t: "tor", c: [-0.01, 0.78, 0], R: 0.192, r: 0.018, rot: [0, 0, -18], col: "bronze", k: 0.01 },
    { t: "cap", a: [-0.02, 0.76, 0.18], b: [0.06, 0.6, 0.17], r: [0.035, 0.025], col: "bronze", k: 0.02 },
    { t: "cap", a: [-0.02, 0.76, -0.18], b: [0.06, 0.6, -0.17], r: [0.035, 0.025], col: "bronze", k: 0.02 },
    ...path(arcPts(-0.05, 0.8, 0.17, 50, 200, 12), 0.03, 0.04, "bronze", 0.02),
    ...[60, 85, 110, 135, 160, 185].map((a): Shape => ({ t: "cap", a: [-0.05 + 0.17 * Math.cos(rad(a)), 0.8 + 0.17 * Math.sin(rad(a)), 0], b: [-0.05 + 0.28 * Math.cos(rad(a + 8)), 0.8 + 0.28 * Math.sin(rad(a + 8)), 0], r: [0.03, 0.01], col: "plume", k: 0.03 })),
    ]),
    // keen glow around the eyes
    ...sparkle([0.38, 1.06, 0.08], 0.05, "hot"),
    ...sparkle([-0.6, 0.35, 0.1], 0.045, "crys"),
    ...sparkle([-0.9, 0.2, -0.2], 0.035, "hot"),
  ];
}

export const artNuevos5: Record<string, Sculpt> = {
  // Hechizo de Potencia: a raised fist and an open hand, each wrapped in swirling teal energy bands, gold up-arrows rising.
  "hechizo-potencia": {
    palette: { ...MAGE, skin: "#f4c9a4", cuff: "#0f5f59" },
    glow: ["glow", "teal2", "hot", "gold2"],
    shapes: potencia(),
    eyes: [],
  },

  // Amuleto del Tiempo: a gold hexagonal amulet on a chain holding a small glowing hourglass.
  "amuleto-tiempo": {
    palette: { ...MAGE, back: "#0b4f4a", gem: "#2dd4bf", glass: "#bff7ff", sand: "#ffb02e", bronze: "#9a5a24" },
    glow: ["glass", "sand", "hot", "glow"],
    shapes: amuleto(),
    eyes: [],
  },

  // Cadenas de Ámbar: glowing amber bands coiling tight around a dark spiky shade, links trailing.
  "inv-cadenas": {
    palette: { boots: "#1c1828", legs: "#241f34", torso: "#2a2440", skin: "#332b4c", eye: "#ff5a3a", amber: "#ffb020", amber2: "#ffe08a", hot: "#fff6d8" },
    glow: ["amber", "amber2", "hot", "eye"],
    shapes: cadenas(),
    eyes: [],
  },

  // Espejismos de Ilvar: a violet-hooded figure with two mirror copies beside it, each paler and fainter.
  "inv-espejismos": {
    palette: {
      ...MAGE, cloak: "#4c3a8a", shadow: "#1c1630",
      c2: "#8a7cc8", t2: "#d6c38a", s2: "#2a2448", e2: "#a8f5e8",
      c3: "#cdc6ee", t3: "#efe6c8", s3: "#5a5488", e3: "#e6fffb", pale3: "#d8f8f2",
    },
    glow: ["glow", "hot", "pale3", "e2", "e3"],
    shapes: espejismos(),
    eyes: [],
  },

  // Siete Sellos Protectores: seven glowing teal seals orbiting a heater shield of light.
  "inv-sellos": {
    palette: { ...MAGE, light: "#9ff5e6" },
    glow: ["light", "hot", "glow", "gold2"],
    shapes: sellos(),
    eyes: [],
  },

  // Brumas del Cambio: violet and teal mist swirling from a glowing spiral into a gold star.
  "inv-brumas": {
    palette: { ...MAGE, violet: "#8b5cf6", violet2: "#6d3fd0", mistL: "#d9ccff", spiral: "#c4a8ff", star: "#ffd66a" },
    glow: ["spiral", "star", "hot"],
    shapes: brumas(),
    eyes: [],
  },

  // Vientos del Saber: a gust of wind streaming out of an open book, carrying pages and glowing letters.
  "inv-vientos": {
    palette: { ...MAGE, cover: "#0f5f59", page: "#fbf3dc", ink: "#8a7a5a", wind: "#cdeff0" },
    glow: ["glow", "gold2", "hot"],
    shapes: vientos(),
    eyes: [],
  },

  // Centinela del Puente: a tall gatekeeper in gold-and-bronze armour and a crested helm, hands on a
  // long sword planted point-down, at the end of a rainbow crystal bridge.
  "centinela-puente": {
    palette: {
      skin: "#d9a57e", torso: "#5a3418", mail: "#5f6a80", legs: "#a8642a", boots: "#7a4420",
      gold: "#e0b040", gold2: "#ffe08a", bronze: "#b0682c", bronze2: "#6e4024", plume: "#b8322a", cloak: "#2c3a6e",
      blade: "#dfe6ee", runeG: "#9ff5e6", grip: "#4a2c1a", gem: "#5eead4", hot: "#fffbe6", crys: "#e6fbff",
      r: "#ff6b6b", o: "#ffa94d", y: "#ffe066", g: "#69db7c", b: "#4dabf7", v: "#b197fc",
    },
    glow: ["r", "o", "y", "g", "b", "v", "runeG", "gem", "hot", "crys"],
    shapes: centinela(),
    eyes: eyes("#ffc83a", true, 0.84, 0.02, 0.048),
  },
};
