import type { Shape, Sculpt, V3 } from "../sculpt";
import { SKIN, arm, body, eyes, rad, turn } from "./kit";

// Baluarte, Custodio del Umbral and Sibila del Caos — art batch 1. Guardia de Aurelia heroes (hero
// form + civilian identity). Original characters: archetypes only.

/** Turns shapes about the vertical axis, then moves them to `at`. */
function place(shapes: Shape[], deg: number, at: V3): Shape[] {
  const mv = (v: V3): V3 => [v[0] + at[0], v[1] + at[1], v[2] + at[2]];
  return turn(shapes, deg).map((sh) => (sh.t === "cap" ? { ...sh, a: mv(sh.a), b: mv(sh.b) } : { ...sh, c: mv(sh.c) }));
}

/** The Égida de Bronce: a heater shield facing +z with a tower emblem. */
function aegis(): Shape[] {
  return [
    { t: "box", c: [0, 0.045, 0], s: [0.135, 0.1, 0.02], round: 0.02, col: "bronzeDk", k: 0.01 },
    { t: "box", c: [0, -0.04, 0], s: [0.095, 0.095, 0.02], round: 0.02, rot: [0, 0, 45], col: "bronzeDk", k: 0.01 },
    { t: "box", c: [0, 0.04, 0.014], s: [0.115, 0.088, 0.014], round: 0.014, col: "bronze", k: 0.008 },
    { t: "box", c: [0, -0.035, 0.014], s: [0.08, 0.08, 0.014], round: 0.014, rot: [0, 0, 45], col: "bronze", k: 0.008 },
    // Tower emblem: shaft, battlement and door, steel-blue on bronze.
    { t: "box", c: [0, -0.005, 0.03], s: [0.026, 0.06, 0.03], round: 0.004, col: "steel", paint: true },
    { t: "box", c: [0, 0.07, 0.03], s: [0.042, 0.018, 0.03], round: 0.004, col: "steel", paint: true },
    ...[-0.03, 0, 0.03].map((x): Shape => ({ t: "box", c: [x, 0.1, 0.03], s: [0.009, 0.013, 0.03], round: 0.003, col: "steel", paint: true })),
    { t: "box", c: [0, -0.045, 0.03], s: [0.01, 0.02, 0.03], round: 0.006, col: "bronzeDk", paint: true },
  ];
}

/** A glowing rune circle facing +z: two rings, rune ticks and a centre glyph. */
function runeCircle(R: number): Shape[] {
  const out: Shape[] = [
    { t: "tor", c: [0, 0, 0], R, r: R * 0.09, rot: [90, 0, 0], col: "rune", k: 0.005 },
    { t: "tor", c: [0, 0, 0], R: R * 0.66, r: R * 0.06, rot: [90, 0, 0], col: "runeHot", k: 0.005 },
    { t: "box", c: [0, 0, 0], s: [R * 0.32, R * 0.07, R * 0.05], round: 0.004, rot: [0, 0, 45], col: "runeHot", k: 0.005 },
    { t: "box", c: [0, 0, 0], s: [R * 0.32, R * 0.07, R * 0.05], round: 0.004, rot: [0, 0, -45], col: "runeHot", k: 0.005 },
  ];
  for (let i = 0; i < 6; i++) {
    const a = 30 + i * 60;
    out.push({ t: "box", c: [R * 0.83 * Math.cos(rad(a)), R * 0.83 * Math.sin(rad(a)), 0], s: [R * 0.06, R * 0.13, R * 0.05], round: 0.004, rot: [0, 0, a], col: "rune", k: 0.005 });
  }
  return out;
}

/** A small die (axis-aligned, half-size s) with pips on its three visible faces. */
function die(s: number): Shape[] {
  const p = s * 0.22, o = s * 0.5, f = s + 0.002;
  const pip = (c: V3): Shape => ({ t: "ell", c, r: [p, p, p], col: "pip", paint: true });
  return [
    { t: "box", c: [0, 0, 0], s: [s, s, s], round: s * 0.3, col: "die", k: 0.005 },
    pip([0, f, 0]),
    pip([f, o, -o]), pip([f, 0, 0]), pip([f, -o, o]),
    pip([o, o, f]), pip([-o, -o, f]),
  ];
}

/** A chaos swirl: a spiral of tapering capsules around `c`, in the plane facing +z. */
function swirl(c: V3, r0: number, r1: number, turns: number, start: number, col: string, w: number): Shape[] {
  const out: Shape[] = [];
  const n = Math.round(turns * 10);
  let prev: V3 | null = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = rad(start + t * turns * 360), r = r0 + (r1 - r0) * t;
    const p: V3 = [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2]];
    if (prev) out.push({ t: "cap", a: prev, b: p, r: [w * (1 - t * 0.7) + 0.003, w * (1 - (i + 1) / n * 0.7) + 0.003], col, k: 0.005 });
    prev = p;
  }
  return out;
}

/** Long dark curly hair: a crown, curls falling at the back and sides. */
function curlyHair(col: string): Shape[] {
  const out: Shape[] = [
    { t: "ell", c: [-0.04, 0.79, 0], r: [0.2, 0.165, 0.21], col },
    { t: "cap", a: [0.1, 0.88, 0.05], b: [0.21, 0.83, 0.13], r: [0.05, 0.015], col },
    { t: "cap", a: [0.1, 0.88, -0.05], b: [0.2, 0.84, -0.12], r: [0.045, 0.015], col },
  ];
  const curls: V3[] = [
    [-0.16, 0.7, 0.1], [-0.17, 0.7, -0.1], [-0.18, 0.56, 0.12], [-0.19, 0.56, -0.12], [-0.17, 0.43, 0.08], [-0.18, 0.43, -0.08],
    [-0.2, 0.62, 0], [-0.19, 0.48, 0], [-0.04, 0.62, 0.17], [-0.06, 0.5, 0.16], [-0.04, 0.62, -0.17], [-0.06, 0.5, -0.16],
    [-0.13, 0.36, 0.0],
  ];
  for (const c of curls) out.push({ t: "ell", c, r: [0.075, 0.07, 0.075], col, k: 0.04 });
  return out;
}

const BAL = { steel: "#2f6f8f", steelDk: "#1f4d66", bronze: "#c98a3a", bronzeDk: "#8a5a24", hair: "#5a3b28", grey: "#9c9890", leather: "#5a3a26" };
const CUS = { teal: "#0f766e", tealDk: "#0a524c", gold: "#e0b04a", cape: "#1e3a8a", capeIn: "#14275e", hair: "#1c1822", silver: "#dfe4ec", rune: "#2ee6d0", hot: "#c8fff6" };
const SIB = { mag: "#be185d", magDk: "#86103f", black: "#1d1820", hair: "#231a22", silver: "#d6dbe4", chaos: "#ff4fc0", violet: "#a259ff" };

export const artNuevos1: Record<string, Sculpt> = {
  // Baluarte: veteran soldier in a quilted steel-blue gambeson with bronze pauldrons and trim, short
  // grey-streaked hair and a square jaw, bracing the bronze heater shield with its tower emblem.
  "hero-baluarte": {
    palette: {
      skin: SKIN, hair: BAL.hair, grey: BAL.grey, torso: BAL.steel, legs: BAL.steelDk, boots: BAL.leather, steel: BAL.steel,
      steelDk: BAL.steelDk, bronze: BAL.bronze, bronzeDk: BAL.bronzeDk, glove: BAL.leather, mouth: "#5a2e22",
    },
    shapes: [
      ...body({ torso: [0.16, 0.17, 0.17], hips: 0.07 }),
      // Gambeson skirt and quilting.
      { t: "cap", a: [0, 0.22, 0], b: [0, 0.34, 0], r: [0.16, 0.15], col: "torso", k: 0.04 },
      ...[0.3, 0.38, 0.46].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.16, r: 0.007, col: "steelDk", paint: true })),
      { t: "cap", a: [0.165, 0.52, 0], b: [0.17, 0.22, 0], r: [0.008, 0.008], col: "steelDk", paint: true },
      // Bronze belt, buckle and collar trim.
      { t: "tor", c: [0, 0.27, 0], R: 0.15, r: 0.024, col: "bronze", k: 0.01 },
      { t: "box", c: [0.16, 0.27, 0], s: [0.02, 0.03, 0.035], round: 0.01, col: "bronzeDk", k: 0.005 },
      { t: "tor", c: [0.0, 0.55, 0], R: 0.095, r: 0.03, col: "bronze", k: 0.02 },
      // Layered bronze pauldrons.
      { t: "ell", c: [-0.02, 0.54, 0.17], r: [0.105, 0.065, 0.1], col: "bronze", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.01, 0.49, 0.2], r: [0.08, 0.04, 0.075], col: "bronzeDk", mirror: true, k: 0.01 },
      { t: "ell", c: [-0.01, 0.58, 0.2], r: [0.08, 0.013, 0.065], col: "bronzeDk", paint: true, mirror: true },
      // Square jaw, mouth.
      { t: "box", c: [0.07, 0.61, 0], s: [0.1, 0.055, 0.13], round: 0.055, col: "skin", k: 0.07 },
      { t: "box", c: [0.19, 0.615, 0], s: [0.02, 0.006, 0.035], round: 0.005, col: "mouth", paint: true },
      // Short hair, grey at the temples.
      { t: "ell", c: [-0.04, 0.8, 0], r: [0.19, 0.14, 0.2], col: "hair" },
      { t: "cap", a: [0.08, 0.89, 0.02], b: [0.19, 0.86, 0.06], r: [0.05, 0.02], col: "hair" },
      { t: "cap", a: [-0.02, 0.8, 0.17], b: [0.02, 0.68, 0.18], r: [0.035, 0.02], col: "hair", mirror: true },
      { t: "ell", c: [0.02, 0.74, 0.19], r: [0.035, 0.05, 0.03], col: "grey", paint: true, mirror: true },
      { t: "cap", a: [0.1, 0.89, 0.1], b: [-0.12, 0.88, 0.16], r: [0.012, 0.012], col: "grey", paint: true },
      { t: "cap", a: [0.1, 0.9, -0.06], b: [-0.12, 0.9, -0.12], r: [0.012, 0.012], col: "grey", paint: true },
      // Near arm: bronze bracer, fist clenched.
      ...arm(1, [0.14, 0.34, 0.27], "torso", "glove", 0.05),
      { t: "tor", c: [0.11, 0.38, 0.26], R: 0.05, r: 0.016, rot: [0, 0, 60], col: "bronze", k: 0.01 },
      // Far arm: the Égida de Bronce braced forward.
      ...arm(-1, [0.2, 0.42, -0.22], "torso", "glove", 0.05),
      ...place(aegis(), 32, [0.26, 0.42, -0.17]),
    ],
    eyes: eyes("#4a7a9a", true),
  },

  // Teniente Marcos Alcalá: the same veteran off duty in a plain steel-blue officer's jacket, warm
  // smile, a steaming mug in hand.
  "identity-baluarte": {
    palette: {
      skin: SKIN, hair: BAL.hair, grey: BAL.grey, torso: BAL.steel, legs: "#3a3f4a", boots: "#3a2a20", steelDk: BAL.steelDk,
      shirt: "#eef0f2", bronze: BAL.bronze, mug: "#e8e2d6", coffee: "#4a2e1e", mouth: "#5a2e22", steam: "#ffffff",
    },
    shapes: [
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "cap", a: [0, 0.22, 0], b: [0, 0.34, 0], r: [0.15, 0.14], col: "torso", k: 0.04 },
      // Open collar, shirt, buttons, epaulettes.
      { t: "box", c: [0.13, 0.52, 0], s: [0.03, 0.04, 0.035], round: 0.02, col: "shirt", paint: true },
      { t: "cap", a: [0.12, 0.55, 0.06], b: [0.155, 0.45, 0.0], r: [0.016, 0.01], col: "steelDk", paint: true, mirror: true },
      ...[0.42, 0.35, 0.28].map((y): Shape => ({ t: "ell", c: [0.155, y, 0], r: [0.012, 0.012, 0.012], col: "bronze", paint: true })),
      { t: "box", c: [0.0, 0.555, 0.15], s: [0.07, 0.015, 0.035], round: 0.01, col: "steelDk", mirror: true, k: 0.01 },
      { t: "box", c: [0.11, 0.46, 0.09], s: [0.02, 0.01, 0.025], round: 0.005, col: "bronze", paint: true },
      { t: "tor", c: [0, 0.27, 0], R: 0.14, r: 0.018, col: "steelDk", k: 0.01 },
      // Square jaw, kind smile.
      { t: "box", c: [0.07, 0.61, 0], s: [0.1, 0.055, 0.13], round: 0.055, col: "skin", k: 0.07 },
      { t: "cap", a: [0.19, 0.622, 0.035], b: [0.2, 0.612, 0], r: [0.006, 0.006], col: "mouth", paint: true, mirror: true },
      // Short hair, grey at the temples.
      { t: "ell", c: [-0.04, 0.8, 0], r: [0.19, 0.14, 0.2], col: "hair" },
      { t: "cap", a: [0.08, 0.89, 0.02], b: [0.19, 0.86, 0.06], r: [0.05, 0.02], col: "hair" },
      { t: "cap", a: [-0.02, 0.8, 0.17], b: [0.02, 0.68, 0.18], r: [0.035, 0.02], col: "hair", mirror: true },
      { t: "ell", c: [0.02, 0.74, 0.19], r: [0.035, 0.05, 0.03], col: "grey", paint: true, mirror: true },
      { t: "cap", a: [0.1, 0.89, 0.1], b: [-0.12, 0.88, 0.16], r: [0.012, 0.012], col: "grey", paint: true },
      { t: "cap", a: [0.1, 0.9, -0.06], b: [-0.12, 0.9, -0.12], r: [0.012, 0.012], col: "grey", paint: true },
      // Near arm: a steaming mug.
      ...arm(1, [0.2, 0.44, 0.22], "torso", "skin"),
      { t: "cap", a: [0.24, 0.43, 0.22], b: [0.24, 0.54, 0.22], r: [0.045, 0.045], col: "mug", k: 0.01 },
      { t: "tor", c: [0.24, 0.49, 0.275], R: 0.03, r: 0.01, rot: [90, 0, 0], col: "mug", k: 0.005 },
      { t: "ell", c: [0.24, 0.585, 0.22], r: [0.038, 0.012, 0.038], col: "coffee", k: 0 },
      { t: "cap", a: [0.24, 0.6, 0.22], b: [0.26, 0.66, 0.21], r: [0.012, 0.008], col: "steam", k: 0.005 },
      { t: "cap", a: [0.26, 0.66, 0.21], b: [0.23, 0.72, 0.22], r: [0.008, 0.004], col: "steam", k: 0.005 },
      // Far arm: relaxed at the side.
      ...arm(-1, [0.06, 0.3, -0.22], "torso", "skin"),
    ],
    eyes: eyes("#4a6a8a"),
  },

  // Custodio del Umbral: sorceress in a hooded teal robe with gold rune trim and a deep-blue cape,
  // dark hair with one silver streak, an hourglass amulet and two glowing teal rune circles.
  "hero-custodio": {
    palette: {
      skin: SKIN, hair: CUS.hair, silver: CUS.silver, torso: CUS.teal, legs: CUS.tealDk, boots: "#2a2230", robe: CUS.teal,
      tealDk: CUS.tealDk, gold: CUS.gold, cape: CUS.cape, capeIn: CUS.capeIn, rune: CUS.rune, runeHot: CUS.hot, sand: "#ffe08a",
    },
    glow: ["rune", "runeHot", "sand"],
    shapes: [
      // Flowing cape behind.
      { t: "ell", c: [-0.15, 0.38, 0], r: [0.09, 0.36, 0.3], rot: [0, 0, -12], col: "cape", k: 0.03 },
      { t: "cap", a: [-0.18, 0.3, 0.12], b: [-0.34, 0.08, 0.22], r: [0.09, 0.05], col: "cape", k: 0.06 },
      { t: "ell", c: [-0.08, 0.36, 0], r: [0.03, 0.3, 0.26], rot: [0, 0, -12], col: "capeIn", paint: true },
      ...body(),
      // Long robe, gold rune trim at hem and front.
      { t: "cap", a: [-0.01, 0.14, 0], b: [0, 0.5, 0], r: [0.18, 0.13], col: "robe", k: 0.04 },
      { t: "tor", c: [-0.01, 0.15, 0], R: 0.175, r: 0.022, col: "gold", k: 0.02 },
      { t: "box", c: [0.15, 0.32, 0], s: [0.04, 0.17, 0.03], round: 0.02, col: "gold", paint: true },
      ...[0.2, 0.27, 0.34].map((y): Shape => ({ t: "box", c: [0.17, y, 0], s: [0.03, 0.012, 0.012], round: 0.004, rot: [y * 300, 0, 0], col: "tealDk", paint: true })),
      { t: "tor", c: [0, 0.27, 0], R: 0.14, r: 0.018, col: "tealDk", k: 0.01 },
      // Hood down on the shoulders, gold-edged.
      { t: "tor", c: [-0.03, 0.56, 0], R: 0.11, r: 0.05, rot: [0, 0, -15], col: "robe", k: 0.02 },
      { t: "tor", c: [-0.03, 0.6, 0], R: 0.12, r: 0.012, rot: [0, 0, -15], col: "gold", k: 0.005 },
      // Hourglass amulet.
      { t: "cap", a: [0.16, 0.6, 0.05], b: [0.17, 0.5, 0], r: [0.006, 0.006], col: "gold", paint: true, mirror: true },
      { t: "box", c: [0.175, 0.5, 0], s: [0.012, 0.007, 0.028], round: 0.004, col: "gold", k: 0.005 },
      { t: "cap", a: [0.175, 0.495, 0], b: [0.175, 0.455, 0], r: [0.024, 0.004], col: "sand", k: 0.004 },
      { t: "cap", a: [0.175, 0.415, 0], b: [0.175, 0.455, 0], r: [0.024, 0.004], col: "sand", k: 0.004 },
      { t: "box", c: [0.175, 0.41, 0], s: [0.012, 0.007, 0.028], round: 0.004, col: "gold", k: 0.005 },
      // Dark hair falling past the shoulders, one silver streak.
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.2, 0.165, 0.205], col: "hair" },
      { t: "cap", a: [0.1, 0.88, 0.04], b: [0.21, 0.82, 0.13], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [0.1, 0.88, -0.05], b: [0.2, 0.84, -0.12], r: [0.045, 0.015], col: "hair" },
      { t: "cap", a: [-0.06, 0.74, 0.16], b: [-0.06, 0.5, 0.14], r: [0.06, 0.035], col: "hair", mirror: true },
      { t: "cap", a: [-0.15, 0.74, 0], b: [-0.17, 0.48, 0], r: [0.1, 0.05], col: "hair" },
      { t: "cap", a: [0.12, 0.92, 0.07], b: [0.21, 0.84, 0.135], r: [0.022, 0.015], col: "silver", paint: true },
      { t: "cap", a: [0.12, 0.92, 0.07], b: [-0.1, 0.92, 0.12], r: [0.014, 0.014], col: "silver", paint: true },
      // Near arm: rune circle cast forward.
      ...arm(1, [0.3, 0.62, 0.12], "robe", "skin"),
      { t: "tor", c: [0.25, 0.6, 0.13], R: 0.05, r: 0.012, rot: [0, 0, 70], col: "gold", k: 0.005 },
      ...place(runeCircle(0.11), 38, [0.44, 0.68, 0.1]),
      // Far arm: a smaller circle low at the side.
      ...arm(-1, [0.24, 0.38, -0.22], "robe", "skin"),
      ...place(runeCircle(0.08), 38, [0.34, 0.38, -0.18]),
    ],
    eyes: eyes("#14b8a6"),
  },

  // Dra. Noa Ferrán: surgeon-scholar in a white coat over teal scrubs, silver streak in her dark
  // hair, an old leather-bound book in her arm.
  "identity-custodio": {
    palette: {
      skin: SKIN, hair: CUS.hair, silver: CUS.silver, torso: CUS.teal, legs: CUS.tealDk, boots: "#2a2a30", coat: "#f4f6f8",
      coatDk: "#cfd6de", book: "#6a3a22", bookDk: "#4a2616", gold: CUS.gold, paper: "#f2e6c8", mouth: "#8a3a3a",
    },
    shapes: [
      ...body(),
      // Long white coat open over teal scrubs.
      { t: "cap", a: [-0.01, 0.25, 0], b: [0, 0.5, 0], r: [0.155, 0.13], col: "coat", k: 0.04 },
      { t: "box", c: [0.13, 0.42, 0], s: [0.06, 0.13, 0.075], round: 0.03, col: "torso", paint: true },
      { t: "tor", c: [0.01, 0.55, 0], R: 0.085, r: 0.025, col: "torso", k: 0.02 },
      { t: "cap", a: [0.14, 0.53, 0.06], b: [0.16, 0.36, 0.035], r: [0.012, 0.01], col: "coatDk", paint: true, mirror: true },
      { t: "box", c: [0.1, 0.3, 0.12], s: [0.03, 0.03, 0.04], round: 0.01, col: "coatDk", paint: true },
      { t: "box", c: [0.12, 0.52, 0], s: [0.04, 0.02, 0.05], round: 0.01, col: "torso", paint: true },
      { t: "box", c: [0.198, 0.62, 0], s: [0.02, 0.005, 0.03], round: 0.004, col: "mouth", paint: true },
      // Dark hair in a low ponytail, silver streak.
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.2, 0.165, 0.205], col: "hair" },
      { t: "cap", a: [0.1, 0.88, 0.04], b: [0.21, 0.82, 0.13], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [0.1, 0.88, -0.05], b: [0.2, 0.84, -0.12], r: [0.045, 0.015], col: "hair" },
      { t: "cap", a: [-0.17, 0.7, 0], b: [-0.22, 0.46, 0], r: [0.06, 0.03], col: "hair" },
      { t: "cap", a: [0.12, 0.92, 0.07], b: [0.21, 0.84, 0.135], r: [0.022, 0.015], col: "silver", paint: true },
      { t: "cap", a: [0.12, 0.92, 0.07], b: [-0.1, 0.92, 0.12], r: [0.014, 0.014], col: "silver", paint: true },
      // Near arm: an old book hugged to the chest.
      ...arm(1, [0.18, 0.4, 0.24], "coat", "skin"),
      ...place([
        { t: "box", c: [0, 0, 0], s: [0.075, 0.1, 0.03], round: 0.012, col: "book", k: 0.005 },
        { t: "box", c: [0.004, 0, 0], s: [0.07, 0.093, 0.024], round: 0.006, col: "paper", paint: true },
        { t: "box", c: [0, 0, 0.03], s: [0.06, 0.088, 0.008], round: 0.006, col: "book", paint: true },
        { t: "box", c: [0, 0, 0.032], s: [0.03, 0.035, 0.01], round: 0.006, rot: [0, 0, 45], col: "gold", paint: true },
        ...[-1, 1].flatMap((sx) => [-1, 1].map((sy): Shape => ({ t: "box", c: [sx * 0.06, sy * 0.085, 0.032], s: [0.016, 0.016, 0.01], round: 0.004, col: "gold", paint: true }))),
      ], 38, [0.24, 0.46, 0.27]),
      // Far arm: hand raised, explaining.
      ...arm(-1, [0.18, 0.6, -0.22], "coat", "skin"),
    ],
    eyes: eyes("#14b8a6"),
  },

  // Sibila del Caos: young witch in a layered magenta-and-black coat-dress, long dark curls, a slim
  // silver circlet with a dice-pip gem, pink-violet chaos swirls and two floating dice.
  "hero-sibila": {
    palette: {
      skin: SKIN, hair: SIB.hair, torso: SIB.mag, legs: SIB.black, boots: SIB.black, mag: SIB.mag, magDk: SIB.magDk,
      black: SIB.black, silver: SIB.silver, chaos: SIB.chaos, violet: SIB.violet, die: "#fbf6fa", pip: SIB.magDk, gem: "#ffffff",
    },
    glow: ["chaos", "violet"],
    shapes: [
      ...curlyHair("hair"),
      ...body(),
      // Layered coat-dress: black under-layer, magenta skirt, black coat tails, silver buttons.
      { t: "cap", a: [-0.01, 0.13, 0], b: [0, 0.42, 0], r: [0.19, 0.12], col: "black", k: 0.04 },
      { t: "cap", a: [-0.01, 0.19, 0], b: [0, 0.46, 0], r: [0.17, 0.12], col: "mag", k: 0.03 },
      { t: "tor", c: [-0.01, 0.2, 0], R: 0.165, r: 0.02, col: "magDk", k: 0.01 },
      { t: "cap", a: [-0.08, 0.36, 0.08], b: [-0.2, 0.12, 0.13], r: [0.05, 0.03], col: "black", mirror: true, k: 0.03 },
      { t: "tor", c: [0, 0.31, 0], R: 0.135, r: 0.02, col: "black", k: 0.01 },
      { t: "cap", a: [0.12, 0.55, 0.07], b: [0.155, 0.34, 0.03], r: [0.024, 0.012], col: "black", paint: true, mirror: true },
      ...[0.48, 0.41].map((y): Shape => ({ t: "ell", c: [0.155, y, 0], r: [0.011, 0.011, 0.011], col: "silver", paint: true })),
      { t: "tor", c: [0.0, 0.55, 0], R: 0.085, r: 0.025, col: "black", k: 0.02 },
      { t: "ell", c: [0, 0.54, 0.15], r: [0.07, 0.04, 0.07], col: "magDk", mirror: true, k: 0.02 },
      // Slim silver circlet with a dice-pip gem.
      { t: "tor", c: [-0.03, 0.84, 0], R: 0.2, r: 0.013, rot: [0, 0, 14], col: "silver", k: 0.004 },
      { t: "box", c: [0.18, 0.89, 0], s: [0.03, 0.03, 0.03], round: 0.01, rot: [0, 0, 45], col: "gem", k: 0.004 },
      { t: "ell", c: [0.21, 0.89, 0], r: [0.011, 0.011, 0.011], col: "pip", paint: true },
      { t: "ell", c: [0.18, 0.89, 0.03], r: [0.008, 0.008, 0.008], col: "pip", paint: true, mirror: true },
      // Near arm raised, chaos swirling from the palm.
      ...arm(1, [0.3, 0.66, 0.12], "mag", "skin"),
      { t: "tor", c: [0.25, 0.64, 0.12], R: 0.05, r: 0.016, rot: [0, 0, 70], col: "black", k: 0.005 },
      ...place(swirl([0, 0, 0], 0.02, 0.13, 1.6, 0, "chaos", 0.022), 38, [0.44, 0.74, 0.08]),
      // Far arm low, a violet swirl.
      ...arm(-1, [0.22, 0.36, -0.22], "mag", "skin"),
      { t: "tor", c: [0.18, 0.37, -0.21], R: 0.05, r: 0.016, rot: [0, 0, 80], col: "black", k: 0.005 },
      ...place(swirl([0, 0, 0], 0.015, 0.1, 1.4, 180, "violet", 0.018), 38, [0.3, 0.36, -0.18]),
      // A chaos ring around her and two floating dice.
      { t: "tor", c: [0, 0.3, 0], R: 0.33, r: 0.01, rot: [12, 0, -14], col: "violet", k: 0 },
      ...place(die(0.05), 20, [0.4, 1.0, -0.12]),
      ...place(die(0.042), -15, [0.12, 0.14, 0.34]),
    ],
    eyes: eyes("#d946a8"),
  },

  // Lucía Montenegro: the same young woman in a dark jacket and magenta scarf, smiling slightly,
  // fanning a deck of cards and tossing a die.
  "identity-sibila": {
    palette: {
      skin: SKIN, hair: SIB.hair, torso: "#2e2a38", legs: "#3a4a6a", boots: "#eeeae6", scarf: SIB.mag, scarfDk: SIB.magDk,
      shirt: "#e8e0ea", card: "#fbf6fa", back: "#6b2a8a", die: "#fbf6fa", pip: SIB.magDk, mouth: "#8a2a4a",
    },
    shapes: [
      ...curlyHair("hair"),
      ...body(),
      { t: "box", c: [0.13, 0.4, 0], s: [0.03, 0.1, 0.04], round: 0.02, col: "shirt", paint: true },
      // Magenta scarf with a hanging end.
      { t: "tor", c: [0.02, 0.54, 0], R: 0.1, r: 0.045, rot: [0, 0, -8], col: "scarf" },
      { t: "cap", a: [0.12, 0.52, 0.06], b: [0.17, 0.33, 0.1], r: [0.038, 0.032], col: "scarf", k: 0.02 },
      { t: "box", c: [0.17, 0.335, 0.1], s: [0.035, 0.008, 0.035], round: 0.004, col: "scarfDk", paint: true },
      // Slight smile.
      { t: "cap", a: [0.2, 0.622, 0.03], b: [0.205, 0.613, 0], r: [0.006, 0.006], col: "mouth", paint: true, mirror: true },
      // Near arm: a fanned deck of cards.
      ...arm(1, [0.28, 0.44, 0.14], "torso", "skin"),
      ...place([
        ...[30, 15, 0, -15, -30].map((a, i): Shape => ({
          t: "box", c: [-0.05 * Math.sin(rad(a)), 0.05 * Math.cos(rad(a)), i * 0.006],
          s: [0.042, 0.06, 0.004], round: 0.006, rot: [0, 0, a], col: i === 4 ? "card" : i % 2 ? "card" : "back", k: 0.002,
        })),
        { t: "ell", c: [0.025 + 0.012, 0.045, 0.03], r: [0.012, 0.012, 0.012], col: "pip", paint: true },
      ], 38, [0.32, 0.5, 0.16]),
      // Far arm: a die tossed up from the palm.
      ...arm(-1, [0.22, 0.5, -0.22], "torso", "skin"),
      ...place(die(0.032), 25, [0.26, 0.64, -0.2]),
    ],
    eyes: eyes("#c0307a"),
  },
};
