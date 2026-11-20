import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, rad, turn } from "./kit";

// Funámbula's 40-card deck — art batch 2: leadership and support cards. Crimson (#c0263f) accents,
// pale silver-white silk, warm gold and brass. One iconic object or small scene each.

// MARK: Helpers

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

/** Capsules through a list of points, radius tapering from r0 to r1. */
function chain(pts: V3[], r0: number, r1: number, col: string, k = 0.02, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
  }
  return out;
}

/** Points on a circular arc in the xy plane (degrees). */
function arcPts(c: V3, R: number, a0: number, a1: number, n: number, ry = R): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) { const a = rad(a0 + ((a1 - a0) * i) / n); out.push([c[0] + R * Math.cos(a), c[1] + ry * Math.sin(a), c[2]]); }
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

const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

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

/** A waving cloth pennant from the pole at x0 out to x0 + w, centred at y, height h; z of the wave at x. */
const wave = (x: number, x0: number, w: number, amp: number) => amp * Math.sin(((x - x0) / w) * Math.PI * 2.2);
function pennant(x0: number, y: number, w: number, h: number, col: string, n = 8, amp = 0.04): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = x0 + t * w;
    const dz = (wave(x + 0.01, x0, w, amp) - wave(x - 0.01, x0, w, amp)) / 0.02;
    const hh = h / 2 * (1 - t * 0.45);
    out.push({ t: "box", c: [x, y - t * 0.05, wave(x, x0, w, amp)], s: [w / n / 2 + 0.015, hh, 0.014], round: 0.012, rot: [0, -Math.atan(dz) * 180 / Math.PI, 0], col, k: 0.035 });
  }
  return out;
}

/** A laurel leaf at c pointing toward angle `ang` (degrees, xy plane). */
function leaf(c: V3, ang: number, len: number, col: string): Shape {
  return { t: "ell", c, r: [len, len * 0.38, len * 0.18], rot: [0, 0, ang], col, k: 0.012 };
}

// MARK: Palettes

const SILK = { silk: "#eef0f8", silk2: "#c8cde0", glint: "#ffffff" };
const FUN = { ...SILK, crim: "#c0263f", crim2: "#8e1a2e", crimL: "#e04a62", gold: "#e8b23a", gold2: "#ffd66a", warm: "#ffe6a0" };

export const artFunambula2: Record<string, Sculpt> = {
  // Hilo Rastreador: a crimson beacon bead glued by a silk blob to a runed stone, pulsing, trailing a glowing thread.
  "hilo-rastreador": {
    palette: { ...FUN, stone: "#6f7488", stone2: "#4e5266", rune: "#9fd8ff", bead: "#ff5a78", core: "#fff0f4" },
    glow: ["bead", "core", "glint", "rune", "silk"],
    shapes: [
      { t: "box", c: [-0.05, 0.16, 0], s: [0.3, 0.16, 0.22], round: 0.07, rot: [0, 0, 4], col: "stone" },
      { t: "box", c: [0.2, 0.08, 0.08], s: [0.12, 0.08, 0.1], round: 0.05, rot: [0, 20, -8], col: "stone2", k: 0.03 },
      ...chain([[-0.22, 0.2, 0.23], [-0.16, 0.12, 0.23], [-0.1, 0.2, 0.23], [-0.04, 0.12, 0.23]], 0.014, 0.014, "rune", 0, true),
      // silk splat holding the bead
      { t: "ell", c: [0.02, 0.32, 0.02], r: [0.12, 0.035, 0.1], col: "silk2", k: 0.03 },
      { t: "ell", c: [0.02, 0.4, 0.02], r: [0.075, 0.075, 0.075], col: "bead", k: 0.02 },
      { t: "ell", c: [0.0, 0.43, 0.08], r: [0.03, 0.03, 0.02], col: "core", paint: true },
      { t: "tor", c: [0.02, 0.4, 0.02], R: 0.15, r: 0.01, rot: [90, 0, 0], col: "crimL", k: 0 },
      { t: "tor", c: [0.02, 0.4, 0.02], R: 0.24, r: 0.008, rot: [90, 0, 0], col: "crimL", k: 0 },
      // the luminous thread trailing away
      ...chain(bez([0.06, 0.46, 0.02], [0.3, 0.9, 0.0], [-0.35, 0.95, -0.05], 14), 0.022, 0.013, "silk", 0.005),
      ...chain(bez([-0.35, 0.95, -0.05], [-0.6, 0.95, -0.08], [-0.55, 1.15, -0.1], 6), 0.013, 0.008, "silk", 0.005),
      ...sparkle([0.18, 0.72, 0.04], 0.05, "glint"),
      ...sparkle([-0.45, 1.02, -0.06], 0.04, "glint"),
      dot([-0.12, 0.92, -0.03], 0.015, "glint"),
    ],
    eyes: [],
  },

  // ¡En Pie!: a crimson-cuffed hand reaching down to clasp an ally's hand reaching up, warm light between.
  "en-pie": {
    palette: { ...FUN, skin: "#f4c9a4", skin2: "#c98c64", ally: "#4f6a9a" },
    glow: ["warm", "glint"],
    shapes: [
      // warm rays behind the clasp
      ...burst([0, 0.62, -0.3], 12, 15, 0.6, [0.04, 0.006], "warm", { len: 0.42, r: [0.035, 0.006], col: "warm" }, 0),
      // ally's hand reaching up from below-left
      ...rotZ(place(hand("skin2", "ally", 1, 0.06), 1, [-0.44, -0.02, -0.08]), -40, [-0.44, -0.02, 0]),
      // Funámbula's hand reaching down from above-right, silk band at the cuff
      ...rotZ(place(hand("skin", "crim", -1, -0.06), 1, [0.44, 1.22, 0.08]), 140, [0.44, 1.22, 0]),
      ...sparkle([-0.32, 0.86, 0.1], 0.07, "glint"),
      ...sparkle([0.34, 0.36, 0.1], 0.06, "glint"),
    ],
    eyes: [],
  },

  // Al Frente del Grupo: a crimson swallow-tail pennant on a tall pole, a gold rising-chevron rune on it.
  "al-frente": {
    palette: { ...FUN, pole: "#6b4a32" },
    glow: ["glint"],
    shapes: [
      { t: "cap", a: [-0.2, 0.0, 0], b: [-0.2, 1.05, 0], r: [0.028, 0.024], col: "pole" },
      { t: "ell", c: [-0.2, 1.06, 0], r: [0.045, 0.03, 0.045], col: "gold", k: 0.01 },
      { t: "cap", a: [-0.2, 1.08, 0], b: [-0.2, 1.24, 0], r: [0.045, 0.004], col: "gold", k: 0.02 },
      { t: "tor", c: [-0.2, 0.62, 0], R: 0.035, r: 0.012, col: "gold", k: 0.01 },
      ...pennant(-0.19, 0.84, 0.55, 0.38, "crim"),
      // swallow tail: two tongues
      ...[1, -1].map((s): Shape => ({ t: "cap", a: [0.3, 0.81 + 0.07 * s, wave(0.3, -0.19, 0.55, 0.04)], b: [0.48, 0.79 + 0.11 * s, wave(0.48, -0.19, 0.55, 0.04) - 0.02], r: [0.06, 0.018], col: "crim", k: 0.04 })),
      // gold trim along the pole edge
      { t: "cap", a: [-0.17, 1.02, 0.0], b: [-0.17, 0.66, 0.0], r: [0.022, 0.022], col: "gold", k: 0.01 },
      // rune: a vertical stroke with two rising chevrons, raised slightly from the cloth
      ...[[[0.06, 0.7], [0.06, 0.98]], [[-0.02, 0.86], [0.06, 0.95], [0.14, 0.86]], [[-0.02, 0.76], [0.06, 0.85], [0.14, 0.76]]].flatMap((pts) =>
        chain(pts.map(([x, y]): V3 => [x, y, wave(x, -0.19, 0.55, 0.04) + 0.018]), 0.02, 0.02, "gold2", 0.005)),
      ...sparkle([0.32, 1.1, 0.04], 0.06, "glint"),
      ...sparkle([-0.42, 0.95, 0.04], 0.045, "glint"),
    ],
    eyes: [],
  },

  // Llamada de Refuerzos: a curled brass signal horn with a crimson cord, sound rings rolling out of its bell.
  "llamada-refuerzos": {
    palette: { ...FUN, brass: "#d9a23a", brass2: "#a8741e", dark: "#4a2a12", ring: "#fff3c4" },
    glow: ["ring"],
    shapes: [
      // horn body: a curl from the mouthpiece (left) widening into the bell (right, up)
      ...chain(arcPts([-0.05, 0.42, 0], 0.22, 200, 330, 8), 0.025, 0.06, "brass", 0.02),
      ...chain([[0.14, 0.31, 0], [0.26, 0.4, 0], [0.33, 0.5, 0]], 0.06, 0.1, "brass", 0.03),
      { t: "cap", a: [0.32, 0.48, 0], b: [0.42, 0.62, 0], r: [0.1, 0.17], col: "brass", k: 0.03 },
      { t: "cap", a: [0.35, 0.52, 0], b: [0.44, 0.65, 0], r: [0.04, 0.14], col: "brass2", cut: true, k: 0.01 },
      { t: "tor", c: [0.42, 0.62, 0], R: 0.165, r: 0.026, rot: [0, 0, -34], col: "gold2", k: 0.01 },
      // mouthpiece
      { t: "cap", a: [-0.25, 0.36, 0], b: [-0.34, 0.42, 0], r: [0.02, 0.035], col: "brass2", k: 0.01 },
      // bands and crimson cord with tassel
      { t: "tor", c: [-0.05, 0.2, 0], R: 0.04, r: 0.014, rot: [0, 0, 90], col: "brass2", k: 0.005 },
      { t: "tor", c: [0.22, 0.36, 0], R: 0.07, r: 0.016, rot: [0, 0, -50], col: "crim", k: 0.005 },
      ...chain(bez([0.22, 0.32, 0.04], [0.05, 0.0, 0.08], [-0.17, 0.26, 0.04], 8), 0.014, 0.014, "crim", 0.005),
      { t: "ell", c: [0.05, 0.1, 0.08], r: [0.025, 0.025, 0.025], col: "gold", k: 0.005 },
      { t: "cap", a: [0.05, 0.08, 0.08], b: [0.05, -0.03, 0.08], r: [0.02, 0.035], col: "crim", k: 0.01 },
      // sound rings
      ...[0.2, 0.33, 0.46].flatMap((R) => chain(arcPts([0.42, 0.62, 0], R, -10 + 56 - 45, -10 + 56 + 45, 7), 0.018, 0.018, "ring", 0)),
    ],
    eyes: [],
  },

  // Don de Mando: a slim golden circlet with three peaks, a glowing star gem at the front.
  "don-mando": {
    palette: { ...FUN, gold3: "#b8821e", gem: "#fff2b0", gemc: "#ffffff", ruby: "#c0263f" },
    glow: ["gem", "gemc", "glint"],
    shapes: [
      { t: "tor", c: [0, 0.2, 0], R: 0.32, r: 0.035, rot: [14, 0, 0], col: "gold" },
      { t: "tor", c: [0, 0.27, 0], R: 0.31, r: 0.022, rot: [14, 0, 0], col: "gold3", k: 0.02 },
      // peaks around the band (front-heavy)
      ...[90, 30, 150, -30, 210].map((a, i): Shape => {
        const x = 0.31 * Math.cos(rad(a)), z = 0.31 * Math.sin(rad(a));
        const y = 0.24 - z * Math.tan(rad(14));
        const h = i === 0 ? 0.3 : 0.18;
        return { t: "cap", a: [x, y, z], b: [x * 0.97, y + h, z * 0.97 - h * Math.tan(rad(14))], r: [0.05, 0.012], col: "gold", k: 0.03 };
      }),
      ...[30, 150, -30, 210].map((a): Shape => {
        const x = 0.31 * Math.cos(rad(a)), z = 0.31 * Math.sin(rad(a));
        return { t: "ell", c: [x, 0.42 - z * Math.tan(rad(14)) - 0.18 * Math.tan(rad(14)) * 0, z - 0.04], r: [0.022, 0.022, 0.022], col: "ruby", k: 0.005 };
      }),
      // crimson setting with a glowing star gem at the front
      { t: "ell", c: [0, 0.3, 0.31], r: [0.11, 0.11, 0.045], col: "ruby", k: 0.02 },
      { t: "tor", c: [0, 0.3, 0.31], R: 0.11, r: 0.02, rot: [90, 0, 0], col: "gold2", k: 0.01 },
      ...burst([0, 0.3, 0.36], 8, 90, 0.2, [0.05, 0.008], "gem", { len: 0.12, r: [0.04, 0.008], col: "gem" }, 0.02),
      { t: "ell", c: [0, 0.3, 0.36], r: [0.065, 0.065, 0.045], col: "gemc", k: 0.02 },
      ...sparkle([0.36, 0.68, 0.2], 0.06, "glint"),
      ...sparkle([-0.38, 0.6, 0.1], 0.045, "glint"),
    ],
    eyes: [],
  },

  // Palabras de Ánimo: a glowing gold laurel wreath tied with a crimson ribbon, sparkles rising from it.
  "palabras-animo": {
    palette: { ...FUN, leaf: "#e8b23a", leaf2: "#ffd66a", gold3: "#b8821e" },
    glow: ["glint", "warm"],
    shapes: [
      ...[1, -1].flatMap((s): Shape[] => {
        const out: Shape[] = [];
        out.push(...chain(arcPts([0, 0.52, 0], 0.34, -80, 70, 10).map(([x, y, z]): V3 => [x * s, y, z]), 0.016, 0.01, "gold3", 0.01));
        for (let i = 0; i < 7; i++) {
          const a = -70 + i * 22;
          const cx = 0.34 * Math.cos(rad(a)), cy = 0.52 + 0.34 * Math.sin(rad(a));
          const tang = a + 90; // pointing up along the stem
          out.push(leaf([(cx + 0.06 * Math.cos(rad(a))) * s, cy + 0.06 * Math.sin(rad(a)), 0.01], s > 0 ? tang - 25 : 180 - (tang - 25), 0.085, i % 2 ? "leaf2" : "leaf"));
          out.push(leaf([(cx - 0.055 * Math.cos(rad(a))) * s, cy - 0.055 * Math.sin(rad(a)), 0.0], s > 0 ? tang + 25 : 180 - (tang + 25), 0.075, i % 2 ? "leaf" : "leaf2"));
        }
        return out;
      }),
      // ribbon knot and tails
      { t: "ell", c: [0, 0.19, 0.04], r: [0.06, 0.05, 0.04], col: "crim", k: 0.02 },
      ...[1, -1].flatMap((s): Shape[] => [
        { t: "ell", c: [0.08 * s, 0.21, 0.03], r: [0.07, 0.04, 0.025], rot: [0, 0, 20 * s], col: "crim", k: 0.02 },
        ...chain([[0.03 * s, 0.17, 0.04], [0.08 * s, 0.06, 0.05], [0.07 * s, -0.04, 0.04]], 0.03, 0.022, "crim2", 0.02),
      ]),
      // warm sparkles rising
      ...sparkle([0, 0.6, 0.02], 0.12, "warm"),
      ...sparkle([0.14, 0.88, 0.02], 0.06, "glint"),
      ...sparkle([-0.16, 0.8, 0.02], 0.05, "glint"),
      dot([0.06, 0.42, 0.04], 0.02, "warm"),
      dot([-0.08, 0.98, 0.0], 0.018, "warm"),
    ],
    eyes: [],
  },

  // Vendaje Rápido: a bandage roll half unwound across the ground, a brass clasp on its end, a sprig of herb.
  "vendaje-rapido": {
    palette: { ...FUN, cloth: "#f3ecdc", cloth2: "#d2c4a6", brass: "#d9a23a", herb: "#4f9a40", herb2: "#86c46a" },
    glow: ["glint"],
    shapes: [
      // the roll, its round face toward the camera
      { t: "cap", a: [-0.215, 0.24, -0.113], b: [-0.085, 0.24, 0.113], r: [0.23, 0.23], col: "cloth" },
      ...[1, -1].map((s): Shape => ({ t: "box", c: [-0.15 + 0.5 * 0.35 * s, 0.24, 0.87 * 0.35 * s], s: [0.5, 0.5, 0.2], round: 0, rot: [0, 30, 0], col: "cloth", cut: true, k: 0.02 })),
      { t: "cap", a: [-0.13, 0.24, 0.13], b: [-0.075, 0.24, 0.226], r: [0.05, 0.05], col: "cloth2", cut: true, k: 0.01 },
      ...[0.09, 0.14, 0.19].map((R): Shape => ({ t: "tor", c: [-0.085, 0.24, 0.113], R, r: 0.011, rot: [90, 0, -30], col: "cloth2", paint: true })),
      // unrolled strip along the ground, rippling
      ...[0, 1, 2, 3, 4, 5].map((i): Shape => {
        const t = 0.06 + i * 0.1;
        return { t: "box", c: [-0.15 + 0.87 * t, 0.018 + 0.02 * Math.max(0, Math.sin(i * 1.7)), -0.5 * t], s: [0.06, 0.01, 0.13], round: 0.008, rot: [0, 30 + 10 * Math.sin(i * 1.3), 4 * Math.cos(i * 1.7)], col: "cloth", k: 0.04 };
      }),
      { t: "box", c: [-0.15 + 0.87 * 0.6, 0.03, -0.5 * 0.6], s: [0.045, 0.03, 0.14], round: 0.015, rot: [0, 30, 0], col: "brass", k: 0.01 },
      { t: "tor", c: [-0.15 + 0.87 * 0.65, 0.04, -0.5 * 0.65], R: 0.05, r: 0.016, rot: [0, 30, 90], col: "brass", k: 0.01 },
      // herb sprig leaning on the roll's far side
      ...chain([[0.3, 0.03, -0.12], [0.22, 0.24, -0.14], [0.1, 0.46, -0.16]], 0.014, 0.009, "herb", 0.01),
      leaf([0.32, 0.15, -0.11], 20, 0.075, "herb2"),
      leaf([0.17, 0.22, -0.12], 150, 0.075, "herb"),
      leaf([0.25, 0.33, -0.13], 40, 0.07, "herb2"),
      leaf([0.08, 0.38, -0.14], 160, 0.065, "herb"),
      leaf([0.13, 0.52, -0.16], 80, 0.06, "herb2"),
      ...sparkle([0.38, 0.4, 0.1], 0.06, "glint"),
    ],
    eyes: [],
  },

  // Directo Demoledor: a crimson glove with silk wrist-wraps driving forward, an impact burst at the knuckles and speed lines behind.
  "directo-demoledor": {
    palette: { ...FUN, hot: "#fff6d0", zap: "#ffd84a" },
    glow: ["hot", "zap", "glint"],
    shapes: [
      ...turn(rotZ([
        ...place(punch("crim", "crim2"), 1.6, [-0.05, 0.5, 0]),
        // finger creases and a lighter thumb
        ...[0.048, 0.0, -0.048].map((y): Shape => ({ t: "cap", a: [0.21, 0.5 + y * 2, 0.16], b: [0.02, 0.5 + y * 2 * 0.95, 0.2], r: [0.012, 0.012], col: "crim2", paint: true })),
        ...[0.048, 0.0, -0.048].map((y): Shape => ({ t: "cap", a: [0.24, 0.5 + y * 2, 0.14], b: [0.24, 0.5 + y * 2, -0.14], r: [0.012, 0.012], col: "crim2", paint: true })),
        { t: "cap", a: [-0.15, 0.34, 0.15], b: [0.05, 0.4, 0.22], r: [0.06, 0.052], col: "crimL", k: 0.02 },
        // silk wraps around the wrist and across the back of the glove
        ...[-0.3, -0.38, -0.46].map((x): Shape => ({ t: "tor", c: [x, 0.5, 0], R: 0.165, r: 0.018, rot: [0, 0, 90], col: "silk", k: 0.005 })),
        // impact burst
        ...burst([0.36, 0.5, 0], 9, 0, 0.44, [0.07, 0.008], "zap", { len: 0.28, r: [0.06, 0.008], col: "hot" }, 0.02).filter((_, i) => i < 3 || i > 6),
        { t: "ell", c: [0.3, 0.5, 0], r: [0.06, 0.16, 0.16], col: "hot", k: 0.03 },
        // speed lines behind
        ...[[0.72, 0.1], [0.58, -0.08], [0.32, 0.0], [0.44, 0.17], [0.38, -0.16]].map(([y, z], i): Shape => ({ t: "cap", a: [-0.68 - (i % 2) * 0.05, y, z], b: [-0.92 + (i % 3) * 0.04, y, z], r: [0.02, 0.006], col: "silk", k: 0 })),
      ], 16, [0, 0.5, 0]), 25),
    ],
    eyes: [],
  },
};
