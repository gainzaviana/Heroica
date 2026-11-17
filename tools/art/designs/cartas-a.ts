import type { Sculpt, Shape, V3 } from "../sculpt";

// Helpers for radial / curved objects (all in the xy plane unless told otherwise).
const rad = (d: number) => (d * Math.PI) / 180;
/** A tapered spike from c, at angle `ang` (degrees, in the xy plane), `len` long. */
function spike(c: V3, ang: number, len: number, r: [number, number], col: string, k = 0.03): Shape {
  return { t: "cap", a: c, b: [c[0] + Math.cos(rad(ang)) * len, c[1] + Math.sin(rad(ang)) * len, c[2]], r, col, k };
}
/** n spikes evenly spread from `start` degrees, alternating long/short when `alt` is set. */
function burst(c: V3, n: number, start: number, len: number, r: [number, number], col: string, alt?: { len: number; r: [number, number]; col: string }, k = 0.03): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (360 / n) * i;
    if (alt && i % 2 === 1) out.push(spike(c, a, alt.len, alt.r, alt.col, k));
    else out.push(spike(c, a, len, r, col, k));
  }
  return out;
}
/** A chain of capsules through the given points, radius tapering from r0 to r1. */
function chain(pts: V3[], r0: number, r1: number, col: string, k = 0.02): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k });
  }
  return out;
}

// Coraza: scales laid on the visible (+x / +z) side of the breastplate ellipsoid.
function scales(): Shape[] {
  const out: Shape[] = [];
  const cy = 0.55, ry = 0.28, rx = 0.26, rz = 0.2;
  [0.4, 0.5, 0.6].forEach((y, row) => {
    const s = Math.sqrt(1 - ((y - cy) / ry) ** 2);
    for (let i = 0; i < 6; i++) {
      const phi = rad(28 + i * 22 + (row % 2) * 11);
      out.push({ t: "ell", c: [rx * s * Math.cos(phi), y - 0.01, rz * s * Math.sin(phi)], r: [0.025, 0.06, 0.058], rot: [0, -(phi * 180) / Math.PI, 12], col: (i + row) % 2 ? "scale" : "scale2", k: 0.01 });
    }
  });
  return out;
}

// Arco: the bow limbs as points along a curve bulging to +x, recurved at the tips.
function bowLimb(): V3[] {
  const pts: V3[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = -1 + i * 0.2;
    let x = 0.2 * (1 - t * t);
    if (Math.abs(t) > 0.75) x += (Math.abs(t) - 0.75) * 0.35;
    pts.push([x, 0.5 + 0.45 * t, 0]);
  }
  return pts;
}

// Contraataque: a swoosh ring around the sword, in a tilted plane, tapering to the tail.
function swoosh(): Shape[] {
  const C: V3 = [0, 0.58, 0], R = 0.42, W: V3 = [0, 0.97, 0.24];
  const at = (deg: number, r = R): V3 => [C[0] + r * Math.cos(rad(deg)), C[1] + r * Math.sin(rad(deg)) * W[1], C[2] + r * Math.sin(rad(deg)) * W[2]];
  const pts: V3[] = [];
  for (let d = 130; d <= 410; d += 28) pts.push(at(d));
  const endA = 410;
  const end = at(endA);
  // Tangent (direction of travel) and the radial direction at the end, both in the ring's plane.
  const t: V3 = [-Math.sin(rad(endA)), Math.cos(rad(endA)) * W[1], Math.cos(rad(endA)) * W[2]];
  const tip: V3 = [end[0] + t[0] * 0.13, end[1] + t[1] * 0.13, end[2] + t[2] * 0.13];
  const head: Shape[] = [at(endA, R + 0.11), at(endA, R - 0.11)].map((b): Shape => ({ t: "cap", a: tip, b, r: [0.03, 0.035], col: "slash", k: 0.02 }));
  return [...chain(pts, 0.012, 0.045, "slash", 0.015), { t: "cap", a: end, b: tip, r: [0.045, 0.03], col: "slash", k: 0.02 }, ...head];
}

export const cartasA: Record<string, Sculpt> = {
  // Inspiración (shared): a silver-blue star crystal glowing on a little silver pedestal.
  inspiracion: {
    palette: { silver: "#c9d4e3", ring: "#4f7fc4", star: "#9fd3ff", core: "#f2fbff", spark: "#d8f1ff" },
    glow: ["core", "spark"],
    shapes: [
      { t: "ell", c: [0, 0.06, 0], r: [0.26, 0.06, 0.26], col: "silver" },
      { t: "tor", c: [0, 0.08, 0], R: 0.2, r: 0.035, col: "ring", k: 0.02 },
      { t: "cap", a: [0, 0.08, 0], b: [0, 0.32, 0], r: [0.1, 0.05], col: "silver", k: 0.05 },
      { t: "ell", c: [0, 0.6, 0], r: [0.17, 0.17, 0.11], col: "star", k: 0.04 },
      ...burst([0, 0.6, 0], 5, 90, 0.36, [0.11, 0.025], "star", undefined, 0.05),
      { t: "ell", c: [0, 0.6, 0.1], r: [0.09, 0.09, 0.06], col: "core", paint: true },
      { t: "ell", c: [0.3, 0.88, 0.05], r: [0.035, 0.035, 0.035], col: "spark" },
      { t: "ell", c: [-0.32, 0.36, 0.05], r: [0.03, 0.03, 0.03], col: "spark" },
      { t: "ell", c: [-0.26, 0.92, 0.0], r: [0.025, 0.025, 0.025], col: "spark" },
    ],
    eyes: [],
  },

  // Martillo Rúnico (Brasa): a stout smithing hammer, iron head banded with glowing fire runes.
  "martillo-runico": {
    palette: { wood: "#8a5232", wrap: "#c8402e", iron: "#5b5f6e", cap: "#d9482f", gold: "#f0b23e", rune: "#ffb347", flame: "#ff7a2a" },
    glow: ["rune", "flame"],
    shapes: [
      { t: "cap", a: [-0.16, 0.05, 0], b: [0.09, 0.66, 0], r: [0.05, 0.045], col: "wood" },
      { t: "ell", c: [-0.17, 0.04, 0], r: [0.075, 0.06, 0.075], col: "gold" },
      { t: "cap", a: [-0.12, 0.15, 0], b: [-0.05, 0.33, 0], r: [0.058, 0.055], col: "wrap", k: 0.01 },
      { t: "box", c: [0.12, 0.72, 0], s: [0.3, 0.13, 0.14], round: 0.04, rot: [0, 0, -22], col: "iron", k: 0.02 },
      { t: "box", c: [0.12 + 0.3 * Math.cos(rad(-22)), 0.72 + 0.3 * Math.sin(rad(-22)), 0], s: [0.05, 0.16, 0.17], round: 0.04, rot: [0, 0, -22], col: "cap", k: 0.01 },
      { t: "box", c: [0.12 - 0.3 * Math.cos(rad(-22)), 0.72 - 0.3 * Math.sin(rad(-22)), 0], s: [0.05, 0.16, 0.17], round: 0.04, rot: [0, 0, -22], col: "cap", k: 0.01 },
      { t: "box", c: [0.12, 0.72, 0], s: [0.035, 0.16, 0.16], round: 0.01, rot: [0, 0, -22], col: "rune", paint: true },
      { t: "box", c: [0.12 + 0.15 * Math.cos(rad(-22)), 0.72 + 0.15 * Math.sin(rad(-22)), 0.14], s: [0.02, 0.07, 0.03], round: 0.005, rot: [0, 0, 20], col: "rune", paint: true },
      { t: "box", c: [0.12 - 0.15 * Math.cos(rad(-22)), 0.72 - 0.15 * Math.sin(rad(-22)), 0.14], s: [0.02, 0.07, 0.03], round: 0.005, rot: [0, 0, -50], col: "rune", paint: true },
      { t: "box", c: [0.12 + 0.15 * Math.cos(rad(-22)), 0.72 + 0.15 * Math.sin(rad(-22)), -0.14], s: [0.02, 0.07, 0.03], round: 0.005, rot: [0, 0, 20], col: "rune", paint: true },
      { t: "cap", a: [0.05, 0.84, 0.02], b: [0.0, 1.0, 0.02], r: [0.05, 0.01], col: "flame", k: 0.03 },
      { t: "cap", a: [0.2, 0.8, 0], b: [0.24, 0.98, 0], r: [0.055, 0.01], col: "flame", k: 0.03 },
      { t: "cap", a: [0.32, 0.76, -0.02], b: [0.42, 0.9, -0.02], r: [0.04, 0.01], col: "flame", k: 0.03 },
    ],
    eyes: [],
  },

  // Chispa de Forja (Brasa): a bursting forge spark, white-hot core inside red/orange flame spikes.
  "chispa-forja": {
    palette: { red: "#e2473b", flame: "#ff8a2a", core: "#fff1a8", ember: "#ffc04a" },
    glow: ["flame", "core", "ember"],
    shapes: [
      ...burst([0, 0.5, 0], 8, 90, 0.42, [0.1, 0.015], "red", { len: 0.27, r: [0.08, 0.015], col: "flame" }, 0.05),
      { t: "ell", c: [0, 0.5, 0], r: [0.2, 0.2, 0.16], col: "flame", k: 0.06 },
      { t: "cap", a: [0, 0.5, 0], b: [0.05, 0.5, 0.36], r: [0.09, 0.015], col: "red", k: 0.05 },
      { t: "ell", c: [0.02, 0.51, 0.08], r: [0.12, 0.12, 0.1], col: "core", paint: true },
      { t: "ell", c: [0.36, 0.12, 0.05], r: [0.04, 0.04, 0.04], col: "ember" },
      { t: "ell", c: [-0.38, 0.85, 0.02], r: [0.035, 0.035, 0.035], col: "ember" },
      { t: "ell", c: [-0.34, 0.14, 0.08], r: [0.03, 0.03, 0.03], col: "ember" },
      { t: "ell", c: [0.4, 0.86, -0.04], r: [0.028, 0.028, 0.028], col: "ember" },
    ],
    eyes: [],
  },

  // Guantelete Rúnico (Brasa): a red armoured fist raised, steel knuckles, a fire rune burning on it.
  "guantelete-runico": {
    palette: { red: "#c8382c", steel: "#c3c9d4", gold: "#f0b23e", rune: "#ffb347", dark: "#5a2a2a" },
    glow: ["rune"],
    shapes: [
      { t: "cap", a: [0, 0.05, 0], b: [0, 0.38, 0], r: [0.2, 0.13], col: "red", k: 0.03 },
      { t: "tor", c: [0, 0.07, 0], R: 0.19, r: 0.045, col: "gold", k: 0.02 },
      { t: "tor", c: [0, 0.4, 0], R: 0.12, r: 0.035, col: "steel", k: 0.02 },
      { t: "box", c: [0, 0.6, 0], s: [0.2, 0.15, 0.14], round: 0.09, col: "red", k: 0.04 },
      ...[-0.135, -0.045, 0.045, 0.135].map((x): Shape => ({ t: "ell", c: [x, 0.69, 0.11], r: [0.05, 0.05, 0.05], col: "steel", k: 0.012 })),
      ...[-0.135, -0.045, 0.045, 0.135].map((x): Shape => ({ t: "ell", c: [x, 0.59, 0.125], r: [0.046, 0.045, 0.04], col: "red", k: 0.012 })),
      { t: "cap", a: [0.2, 0.55, 0.06], b: [0.0, 0.5, 0.14], r: [0.048, 0.042], col: "red", k: 0.03 },
      { t: "ell", c: [0.0, 0.5, 0.14], r: [0.04, 0.035, 0.035], col: "steel", k: 0.02 },
      { t: "ell", c: [0.02, 0.76, -0.02], r: [0.17, 0.05, 0.11], col: "steel", k: 0.04 },
      { t: "box", c: [0.0, 0.24, 0.17], s: [0.055, 0.055, 0.06], round: 0.005, rot: [0, 0, 45], col: "rune", paint: true },
      { t: "box", c: [0.0, 0.24, 0.17], s: [0.025, 0.025, 0.08], round: 0.005, rot: [0, 0, 45], col: "dark", paint: true },
      { t: "box", c: [0.13, 0.24, 0.1], s: [0.012, 0.06, 0.06], round: 0.004, rot: [0, -45, 0], col: "rune", paint: true },
      { t: "box", c: [-0.13, 0.24, 0.1], s: [0.012, 0.06, 0.06], round: 0.004, rot: [0, 45, 0], col: "rune", paint: true },
    ],
    eyes: [],
  },

  // Coraza de Escamas (Brasa): a red scale-mail breastplate on a wooden stand, gold pauldrons, ember gem.
  "coraza-escamas": {
    palette: { wood: "#8a5a3a", red: "#b8322a", scale: "#e2573b", scale2: "#f0804a", gold: "#f0b23e", gem: "#ffcf5a" },
    glow: ["gem"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.22, 0.045, 0.22], col: "wood" },
      { t: "cap", a: [0, 0.04, 0], b: [0, 0.3, 0], r: [0.04, 0.04], col: "wood" },
      { t: "ell", c: [0, 0.55, 0], r: [0.26, 0.28, 0.2], col: "red", k: 0.04 },
      { t: "ell", c: [0, 0.7, 0], r: [0.3, 0.12, 0.2], col: "red", k: 0.08 },
      ...scales(),
      { t: "ell", c: [0.27, 0.76, 0], r: [0.12, 0.07, 0.15], rot: [0, 0, -25], col: "gold", k: 0.02 },
      { t: "ell", c: [-0.27, 0.76, 0], r: [0.12, 0.07, 0.15], rot: [0, 0, 25], col: "gold", k: 0.02 },
      { t: "tor", c: [0, 0.81, 0], R: 0.1, r: 0.035, col: "gold", k: 0.02 },
      { t: "ell", c: [0, 0.83, 0], r: [0.08, 0.06, 0.08], col: "red", cut: true, k: 0.02 },
      { t: "tor", c: [0, 0.3, 0], R: 0.13, r: 0.035, col: "gold", k: 0.02 },
      { t: "ell", c: [0, 0.7, 0.17], r: [0.055, 0.055, 0.05], col: "gold", k: 0.015 },
      { t: "ell", c: [0, 0.71, 0.21], r: [0.033, 0.033, 0.03], col: "gem", paint: true },
    ],
    eyes: [],
  },

  // Yunque Ancestral (Brasa): an old iron anvil on a rune-carved stone, a glowing ingot on top.
  "yunque-ancestral": {
    palette: { stone: "#7d6a5c", iron: "#4f5464", top: "#8a90a0", rune: "#ff9a3a", ingot: "#ffb347", spark: "#ffe08a" },
    glow: ["rune", "ingot", "spark"],
    shapes: [
      { t: "box", c: [0, 0.11, 0], s: [0.3, 0.11, 0.22], round: 0.05, col: "stone" },
      { t: "box", c: [0, 0.27, 0], s: [0.13, 0.08, 0.11], round: 0.03, col: "iron", k: 0.06 },
      { t: "box", c: [-0.03, 0.42, 0], s: [0.27, 0.08, 0.15], round: 0.03, col: "iron", k: 0.04 },
      { t: "box", c: [-0.03, 0.5, 0], s: [0.26, 0.012, 0.14], round: 0.01, col: "top", k: 0.01 },
      { t: "cap", a: [0.2, 0.44, 0], b: [0.55, 0.48, 0], r: [0.09, 0.015], col: "iron", k: 0.05 },
      { t: "box", c: [-0.3, 0.44, 0], s: [0.04, 0.05, 0.1], round: 0.02, col: "iron", k: 0.03 },
      { t: "box", c: [-0.1, 0.12, 0.22], s: [0.015, 0.06, 0.03], round: 0.005, rot: [0, 0, 20], col: "rune", paint: true },
      { t: "box", c: [0.0, 0.12, 0.22], s: [0.05, 0.015, 0.03], round: 0.005, col: "rune", paint: true },
      { t: "box", c: [0.1, 0.12, 0.22], s: [0.015, 0.06, 0.03], round: 0.005, rot: [0, 0, -20], col: "rune", paint: true },
      { t: "box", c: [0.2, 0.12, 0.22], s: [0.04, 0.04, 0.03], round: 0.005, rot: [0, 0, 45], col: "rune", paint: true },
      { t: "box", c: [0.3, 0.12, 0.0], s: [0.03, 0.04, 0.04], round: 0.005, rot: [45, 0, 0], col: "rune", paint: true },
      { t: "box", c: [-0.03, 0.43, 0.15], s: [0.08, 0.012, 0.03], round: 0.005, col: "rune", paint: true },
      { t: "box", c: [-0.03, 0.55, 0], s: [0.12, 0.035, 0.06], round: 0.02, col: "ingot", k: 0.01 },
      { t: "ell", c: [0.12, 0.72, 0.05], r: [0.025, 0.025, 0.025], col: "spark" },
      { t: "ell", c: [-0.12, 0.78, -0.02], r: [0.03, 0.03, 0.03], col: "spark" },
      { t: "ell", c: [0.0, 0.88, 0.04], r: [0.022, 0.022, 0.022], col: "spark" },
    ],
    eyes: [],
  },

  // Golpe de Escudo (Brasa): a round red-and-bronze shield bashing forward in a burst of fire.
  "golpe-escudo": {
    palette: { red: "#c8382c", bronze: "#d48a3a", gold: "#f6c453", burst: "#ff9a3a", hot: "#fff0a0", rune: "#ffd070" },
    glow: ["burst", "hot", "rune"],
    shapes: [
      ...burst([0, 0.5, -0.04], 10, 90, 0.52, [0.09, 0.014], "burst", { len: 0.44, r: [0.06, 0.012], col: "hot" }, 0.02),
      { t: "ell", c: [0, 0.5, 0], r: [0.34, 0.34, 0.07], col: "red", k: 0.0 },
      { t: "tor", c: [0, 0.5, 0], R: 0.34, r: 0.04, rot: [90, 0, 0], col: "bronze", k: 0.02 },
      { t: "ell", c: [0, 0.5, 0.06], r: [0.1, 0.1, 0.07], col: "gold", k: 0.03 },
      ...[0, 90, 180, 270].map((a): Shape => ({ t: "ell", c: [Math.cos(rad(a + 45)) * 0.22, 0.5 + Math.sin(rad(a + 45)) * 0.22, 0.055], r: [0.03, 0.03, 0.03], col: "gold", k: 0.01 })),
      { t: "tor", c: [0, 0.5, 0.06], R: 0.17, r: 0.014, rot: [90, 0, 0], col: "rune", paint: true },
    ],
    eyes: [],
  },

  // Flecha del Alba (Vigía): a golden arrow of morning light flying upward, light streaks behind.
  "flecha-alba": {
    palette: { shaft: "#f2b632", head: "#fff3c0", edge: "#ffd56b", feather: "#ff8a4a", feather2: "#ffc04a", tip: "#ffe9a0" },
    glow: ["head", "tip"],
    shapes: [
      { t: "cap", a: [-0.3, 0.2, 0], b: [0.24, 0.74, 0], r: [0.035, 0.035], col: "shaft" },
      { t: "ell", c: [0.31, 0.81, 0], r: [0.15, 0.075, 0.025], rot: [0, 0, 45], col: "head", k: 0.01 },
      { t: "cap", a: [0.19, 0.79, 0], b: [0.45, 0.95, 0], r: [0.03, 0.008], col: "edge", k: 0.015 },
      { t: "cap", a: [0.29, 0.69, 0], b: [0.45, 0.95, 0], r: [0.03, 0.008], col: "edge", k: 0.015 },
      { t: "ell", c: [0.21, 0.71, 0], r: [0.05, 0.05, 0.05], col: "shaft", k: 0.02 },
      { t: "ell", c: [-0.26, 0.32, 0.0], r: [0.1, 0.04, 0.025], rot: [0, 0, 80], col: "feather", k: 0.01 },
      { t: "ell", c: [-0.18, 0.22, 0.0], r: [0.1, 0.04, 0.025], rot: [0, 0, 10], col: "feather2", k: 0.01 },
      { t: "ell", c: [-0.24, 0.26, 0.05], r: [0.1, 0.035, 0.03], rot: [0, -45, 45], col: "feather", k: 0.01 },
      ...burst([0.5, 0.62, 0.02], 4, 0, 0.08, [0.025, 0.006], "tip", undefined, 0.03),
      ...burst([0.1, 0.98, 0.02], 4, 0, 0.06, [0.02, 0.006], "tip", undefined, 0.03),
      ...burst([-0.42, 0.06, 0.02], 4, 0, 0.06, [0.02, 0.006], "tip", undefined, 0.03),
    ],
    eyes: [],
  },

  // Luz Reveladora (Vigía): a radiant dawn sun with an all-seeing eye on its face.
  "luz-reveladora": {
    palette: { sun: "#f6b42e", ray: "#ffe27a", ray2: "#ff9a4a", white: "#fffaf0", iris: "#3a8fd8", pupil: "#1c2a4a", lid: "#c97f1a" },
    glow: ["ray", "ray2"],
    shapes: [
      ...burst([0, 0.52, -0.02], 12, 90, 0.47, [0.075, 0.012], "ray", { len: 0.37, r: [0.06, 0.012], col: "ray2" }, 0.02),
      { t: "ell", c: [0, 0.52, 0], r: [0.27, 0.27, 0.09], col: "sun", k: 0.02 },
      { t: "tor", c: [0, 0.52, 0.0], R: 0.27, r: 0.03, rot: [90, 0, 0], col: "lid", k: 0.02 },
      { t: "ell", c: [0, 0.52, 0.09], r: [0.18, 0.09, 0.06], col: "lid", paint: true },
      { t: "ell", c: [0, 0.52, 0.09], r: [0.16, 0.075, 0.07], col: "white", paint: true },
      { t: "ell", c: [0, 0.52, 0.09], r: [0.065, 0.065, 0.08], col: "iris", paint: true },
      { t: "ell", c: [0, 0.52, 0.09], r: [0.03, 0.03, 0.09], col: "pupil", paint: true },
      { t: "ell", c: [0.025, 0.55, 0.1], r: [0.015, 0.015, 0.05], col: "white", paint: true },
    ],
    eyes: [],
  },

  // Arco del Amanecer (Vigía): a golden recurve bow drawn with an arrow of light, sun emblem at the grip.
  "arco-amanecer": {
    palette: { gold: "#f2b632", deep: "#c97f1a", grip: "#d6553a", string: "#fff1b0", arrow: "#ffe27a", sun: "#fff3c0" },
    glow: ["string", "arrow", "sun"],
    shapes: [
      ...chain(bowLimb().slice(0, 6), 0.022, 0.05, "gold", 0.03),
      ...chain(bowLimb().slice(5).reverse(), 0.022, 0.05, "gold", 0.03),
      { t: "cap", a: [0.19, 0.4, 0], b: [0.19, 0.6, 0], r: [0.058, 0.058], col: "grip", k: 0.02 },
      { t: "ell", c: [0.21, 0.5, 0.0], r: [0.06, 0.06, 0.07], col: "deep", k: 0.02 },
      { t: "ell", c: [0.21, 0.5, 0.06], r: [0.04, 0.04, 0.03], col: "sun", paint: true },
      { t: "ell", c: [0.087, 0.95, 0], r: [0.035, 0.035, 0.035], col: "deep", k: 0.02 },
      { t: "ell", c: [0.087, 0.05, 0], r: [0.035, 0.035, 0.035], col: "deep", k: 0.02 },
      { t: "cap", a: [0.087, 0.95, 0], b: [-0.12, 0.5, 0], r: [0.016, 0.016], col: "string", k: 0 },
      { t: "cap", a: [0.087, 0.05, 0], b: [-0.12, 0.5, 0], r: [0.016, 0.016], col: "string", k: 0 },
      { t: "cap", a: [-0.14, 0.5, 0], b: [0.4, 0.5, 0], r: [0.022, 0.022], col: "arrow", k: 0 },
      { t: "cap", a: [0.38, 0.5, 0], b: [0.54, 0.5, 0], r: [0.065, 0.01], col: "sun", k: 0.02 },
      { t: "cap", a: [-0.08, 0.5, 0], b: [-0.17, 0.56, 0], r: [0.03, 0.01], col: "arrow", k: 0.02 },
      { t: "cap", a: [-0.08, 0.5, 0], b: [-0.17, 0.44, 0], r: [0.03, 0.01], col: "arrow", k: 0.02 },
    ],
    eyes: [],
  },

  // Torre de Vigía (Vigía): a slim cream-stone watchtower, golden roof and a glowing beacon lantern.
  "torre-vigia": {
    palette: { stone: "#eadbb8", band: "#c9b48a", roof: "#e8a923", roofDark: "#c46a2a", lamp: "#ffe58a", ray: "#fff1b0", door: "#6a4a3a", win: "#ffd060", flag: "#e2573b" },
    glow: ["lamp", "win", "ray"],
    shapes: [
      { t: "ell", c: [0, 0.05, 0], r: [0.27, 0.06, 0.27], col: "band" },
      { t: "cap", a: [0, 0.14, 0], b: [0, 0.58, 0], r: [0.2, 0.15], col: "stone", k: 0.04 },
      { t: "tor", c: [0, 0.32, 0], R: 0.175, r: 0.022, col: "band", k: 0.01 },
      { t: "ell", c: [0, 0.6, 0], r: [0.23, 0.05, 0.23], col: "band", k: 0.03 },
      ...[0, 60, 120, 180, 240, 300].map((a): Shape => ({ t: "box", c: [Math.cos(rad(a + 30)) * 0.2, 0.67, Math.sin(rad(a + 30)) * 0.2], s: [0.045, 0.04, 0.045], round: 0.012, rot: [0, -(a + 30), 0], col: "stone", k: 0.01 })),
      { t: "cap", a: [0, 0.62, 0], b: [0, 0.86, 0], r: [0.11, 0.11], col: "lamp", k: 0.01 },
      ...[0, 90, 180, 270].map((a): Shape => ({ t: "cap", a: [Math.cos(rad(a)) * 0.12, 0.64, Math.sin(rad(a)) * 0.12], b: [Math.cos(rad(a)) * 0.12, 0.87, Math.sin(rad(a)) * 0.12], r: [0.025, 0.025], col: "roofDark", k: 0.01 })),
      { t: "cap", a: [0, 0.89, 0], b: [0, 1.1, 0], r: [0.19, 0.012], col: "roof", k: 0.02 },
      { t: "tor", c: [0, 0.89, 0], R: 0.17, r: 0.025, col: "roofDark", k: 0.01 },
      { t: "cap", a: [0, 1.08, 0], b: [0, 1.22, 0], r: [0.015, 0.015], col: "roofDark", k: 0 },
      { t: "box", c: [0.07, 1.18, 0], s: [0.07, 0.035, 0.012], round: 0.01, col: "flag", k: 0 },
      { t: "box", c: [0.12, 0.17, 0.12], s: [0.05, 0.08, 0.05], round: 0.04, rot: [0, -45, 0], col: "door", paint: true },
      { t: "box", c: [0.1, 0.45, 0.1], s: [0.03, 0.05, 0.03], round: 0.02, rot: [0, -45, 0], col: "win", paint: true },
      { t: "box", c: [-0.04, 0.45, 0.17], s: [0.03, 0.05, 0.03], round: 0.02, col: "win", paint: true },
    ],
    eyes: [],
  },

  // Destello Cegador (Vigía): a blinding four-point flash star with a golden ring and sparkles.
  destello: {
    palette: { white: "#ffffff", gold: "#ffe27a", amber: "#ffb53b", ring: "#f2a52a" },
    glow: ["white", "gold"],
    shapes: [
      ...burst([0, 0.5, 0], 4, 90, 0.48, [0.11, 0.012], "gold", undefined, 0.06),
      ...burst([0, 0.5, 0], 4, 45, 0.26, [0.07, 0.01], "amber", undefined, 0.05),
      { t: "ell", c: [0, 0.5, 0], r: [0.15, 0.15, 0.12], col: "white", k: 0.06 },
      { t: "tor", c: [0, 0.5, 0], R: 0.3, r: 0.025, rot: [80, 20, 0], col: "ring", k: 0.0 },
      ...burst([0.36, 0.86, 0.05], 4, 0, 0.07, [0.025, 0.006], "white", undefined, 0.03),
      ...burst([-0.36, 0.18, 0.05], 4, 0, 0.06, [0.022, 0.006], "white", undefined, 0.03),
    ],
    eyes: [],
  },

  // Capa Crepuscular (Vigía): a dusk-coloured cape on a stand, indigo fading to orange, gold clasp and stars.
  "capa-crepuscular": {
    palette: { wood: "#9a6a44", indigo: "#3d3a7a", purple: "#7a4a9a", rose: "#d65f86", dusk: "#f08a3c", gold: "#f2b632", star: "#fff1b0" },
    glow: ["star"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.2, 0.035, 0.2], col: "wood" },
      { t: "cap", a: [0, 0.03, 0], b: [0, 0.92, 0], r: [0.03, 0.03], col: "wood" },
      { t: "cap", a: [-0.3, 0.86, 0], b: [0.3, 0.86, 0], r: [0.03, 0.03], col: "wood" },
      { t: "ell", c: [0.3, 0.86, 0], r: [0.04, 0.04, 0.04], col: "gold" },
      { t: "ell", c: [-0.3, 0.86, 0], r: [0.04, 0.04, 0.04], col: "gold" },
      ...[-0.34, -0.17, 0.0, 0.17, 0.34].map((x, i): Shape => ({ t: "cap", a: [x * 0.5, 0.8, -0.02], b: [x, 0.12, -0.02 + (i % 2) * 0.05], r: [0.07, 0.11], col: "indigo", k: 0.08 })),
      { t: "ell", c: [0, 0.8, -0.02], r: [0.2, 0.06, 0.1], col: "indigo", k: 0.05 },
      { t: "box", c: [0, 0.42, 0], s: [0.5, 0.14, 0.4], round: 0.01, col: "purple", paint: true },
      { t: "box", c: [0, 0.24, 0], s: [0.5, 0.06, 0.4], round: 0.01, col: "rose", paint: true },
      { t: "box", c: [0, 0.08, 0], s: [0.5, 0.1, 0.4], round: 0.01, col: "dusk", paint: true },
      { t: "tor", c: [0, 0.83, 0], R: 0.12, r: 0.035, col: "gold", k: 0.02 },
      { t: "ell", c: [0, 0.8, 0.1], r: [0.05, 0.05, 0.05], col: "gold", k: 0.01 },
      { t: "ell", c: [0, 0.81, 0.15], r: [0.025, 0.025, 0.025], col: "star", paint: true },
      ...([[0.16, 0.62, 0.1], [-0.2, 0.52, 0.1], [0.05, 0.5, 0.12], [-0.08, 0.68, 0.1], [0.24, 0.45, 0.1], [-0.3, 0.38, 0.1], [0.12, 0.36, 0.12]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.022, 0.022, 0.08], col: "star", paint: true })),
    ],
    eyes: [],
  },

  // Escudo de Aurelia (shared): a silver heater shield, blue field with Aurelia's golden tower and rising sun.
  "escudo-ciudad": {
    palette: { silver: "#d3dbe6", blue: "#3a64b8", gold: "#f2c14a", sun: "#ffd866", door: "#2a3f7a" },
    shapes: [
      { t: "box", c: [0, 0.69, 0], s: [0.32, 0.19, 0.06], round: 0.04, col: "silver", k: 0.0 },
      { t: "box", c: [0, 0.47, 0], s: [0.24, 0.24, 0.06], round: 0.04, rot: [0, 0, 45], col: "silver", k: 0.03 },
      { t: "box", c: [0, 0.69, 0], s: [0.27, 0.15, 0.085], round: 0.02, col: "blue", paint: true },
      { t: "box", c: [0, 0.47, 0], s: [0.19, 0.19, 0.085], round: 0.02, rot: [0, 0, 45], col: "blue", paint: true },
      ...burst([0, 0.64, 0.105], 9, 0, 0.21, [0.035, 0.01], "sun", undefined, 0.0).filter((_, i) => i < 5),
      { t: "ell", c: [0, 0.64, 0.1], r: [0.13, 0.13, 0.022], col: "sun", k: 0.01 },
      { t: "box", c: [0, 0.5, 0.115], s: [0.065, 0.14, 0.025], round: 0.01, col: "gold", k: 0.005 },
      ...[-0.05, 0, 0.05].map((x): Shape => ({ t: "box", c: [x, 0.65, 0.115], s: [0.018, 0.028, 0.025], round: 0.006, col: "gold", k: 0.0 })),
      { t: "box", c: [0, 0.42, 0.14], s: [0.025, 0.04, 0.012], round: 0.01, col: "door", paint: true },
      { t: "ell", c: [0, 0.86, 0.06], r: [0.035, 0.035, 0.035], col: "gold", k: 0.01 },
    ],
    eyes: [],
  },

  // Golpe Certero (shared): a blue-white lightning bolt striking down into a ring of impact sparks.
  "golpe-certero": {
    palette: { bolt: "#bfefff", core: "#ffffff", spark: "#9fd3ff", ring: "#6aa8f0", edge: "#4f8fe0" },
    glow: ["bolt", "core", "spark"],
    shapes: [
      ...chain([[0.24, 1.02, 0], [-0.08, 0.6, 0]], 0.1, 0.07, "bolt", 0.03),
      ...chain([[-0.08, 0.6, 0], [0.16, 0.56, 0]], 0.07, 0.07, "bolt", 0.06),
      ...chain([[0.16, 0.56, 0], [-0.04, 0.1, 0]], 0.07, 0.02, "bolt", 0.06),
      ...chain([[0.24, 1.02, 0], [-0.08, 0.6, 0]], 0.05, 0.03, "core", 0.0).map((sh) => ({ ...sh, paint: true }) as Shape),
      { t: "tor", c: [-0.04, 0.06, 0], R: 0.28, r: 0.03, col: "ring", k: 0 },
      { t: "tor", c: [-0.04, 0.06, 0], R: 0.17, r: 0.022, col: "edge", k: 0 },
      ...burst([-0.04, 0.08, 0], 6, 15, 0.24, [0.045, 0.008], "spark", undefined, 0.02),
      { t: "ell", c: [-0.04, 0.08, 0], r: [0.09, 0.06, 0.09], col: "core", k: 0.03 },
    ],
    eyes: [],
  },

  // Contraataque (shared): a silver sword ringed by a cyan circular slash that turns back on itself.
  contraataque: {
    palette: { blade: "#dfe8f2", edge: "#9fb4cc", gold: "#e8b84a", grip: "#3a5a9a", slash: "#8ff0ff", gem: "#5fd0ff" },
    glow: ["slash", "gem"],
    shapes: [
      ...swoosh(),
      { t: "box", c: [0, 0.6, 0], s: [0.055, 0.3, 0.02], round: 0.015, col: "blade", k: 0.0 },
      { t: "box", c: [0, 0.89, 0], s: [0.039, 0.039, 0.02], round: 0.012, rot: [0, 0, 45], col: "blade", k: 0.01 },
      { t: "box", c: [0, 0.6, 0.02], s: [0.012, 0.28, 0.01], round: 0.005, col: "edge", paint: true },
      { t: "cap", a: [-0.16, 0.29, 0], b: [0.16, 0.29, 0], r: [0.035, 0.035], col: "gold", k: 0.02 },
      { t: "ell", c: [0, 0.29, 0.02], r: [0.04, 0.04, 0.04], col: "gem", k: 0.01 },
      { t: "cap", a: [0, 0.1, 0], b: [0, 0.27, 0], r: [0.033, 0.03], col: "grip", k: 0.02 },
      { t: "ell", c: [0, 0.08, 0], r: [0.05, 0.05, 0.05], col: "gold", k: 0.02 },
    ],
    eyes: [],
  },
};
