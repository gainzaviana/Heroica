import type { Sculpt, Shape, V3 } from "../sculpt";

// Guardián de Piedra (stone greys + amber glow), Sombra Errante (violet/indigo), shared cards (neutral).

/** A hexagonal plate lying in the y–z plane (facing +x): three crossed boxes rotated about x. */
function hexPlate(c: V3, R: number, t: number, col: string): Shape[] {
  return [0, 60, 120].map((a) => ({ t: "box", c, s: [t, R * 0.866, R * 0.5], round: 0.008, rot: [a, 0, 0], col, k: 0 }) as Shape);
}

/** A flat coin (disc) with a tilt. */
function coin(c: V3, rot: V3, col = "gold"): Shape {
  return { t: "ell", c, r: [0.065, 0.065, 0.018], rot, col, k: 0 };
}

/** Basalt shield face: hex plates following the curved shield surface. */
function basaltPlates(): Shape[] {
  const out: Shape[] = [];
  const cy = 0.5, rx = 0.1, ry = 0.44, rz = 0.4, R = 0.098, step = 0.2;
  const centres: [number, number][] = [[0, 0], [0, step], [0, -step], [step * 0.866, step / 2], [step * 0.866, -step / 2], [-step * 0.866, step / 2], [-step * 0.866, -step / 2]];
  for (const [dy, dz] of centres) {
    const f = Math.max(0, 1 - (dy / ry) ** 2 - (dz / rz) ** 2);
    out.push(...hexPlate([rx * Math.sqrt(f) + 0.01, cy + dy, dz], R, 0.035, "basalt"));
  }
  return out;
}

/** Turns shapes about the vertical axis (degrees, same sense as the renderer's turn): use -55 to point +x at the camera. */
function turn(shapes: Shape[], deg: number): Shape[] {
  const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t);
  const r = (v: V3): V3 => [co * v[0] + si * v[2], v[1], -si * v[0] + co * v[2]];
  return shapes.map((sh) => {
    const rot: V3 = sh.rot ? [sh.rot[0], sh.rot[1] + deg, sh.rot[2]] : [0, deg, 0];
    if (sh.t === "cap") return { ...sh, a: r(sh.a), b: r(sh.b) };
    return { ...sh, c: r(sh.c), rot };
  });
}

/** Faces the camera in the default 3/4 view. */
const FRONT = -55;

export const cartasB: Record<string, Sculpt> = {
  // Puño de Granito: a raised granite fist with glowing amber cracks.
  "puno-granito": {
    palette: { stone: "#9aa3ab", dark: "#6c7680", crack: "#ffb43a", band: "#b77a3c", rock: "#857c70" },
    glow: ["crack"],
    shapes: turn([
      { t: "ell", c: [0, 0.05, 0], r: [0.36, 0.06, 0.36], col: "rock" },
      { t: "cap", a: [-0.02, 0.05, 0], b: [0, 0.36, 0], r: [0.15, 0.15], col: "dark", k: 0.06 },
      { t: "tor", c: [0, 0.34, 0], R: 0.16, r: 0.05, col: "band", k: 0.02 },
      { t: "box", c: [-0.02, 0.6, 0], s: [0.17, 0.2, 0.23], round: 0.1, col: "stone", k: 0.06 },
      ...[-0.17, -0.06, 0.05, 0.16].map((z) => ({ t: "cap", a: [0.0, 0.8, z], b: [0.17, 0.76, z], r: [0.075, 0.068], col: "stone", k: 0.025 }) as Shape),
      ...[-0.17, -0.06, 0.05, 0.16].map((z) => ({ t: "ell", c: [0.19, 0.64, z], r: [0.07, 0.085, 0.06], col: "stone", k: 0.025 }) as Shape),
      { t: "cap", a: [0.0, 0.5, 0.24], b: [0.22, 0.56, 0.12], r: [0.075, 0.06], col: "stone", k: 0.04 },
      { t: "cap", a: [0.2, 0.48, -0.1], b: [0.26, 0.72, -0.04], r: [0.02, 0.02], col: "crack", paint: true },
      { t: "cap", a: [0.26, 0.72, -0.04], b: [0.24, 0.84, 0.05], r: [0.02, 0.02], col: "crack", paint: true },
      { t: "cap", a: [0.15, 0.42, 0.22], b: [0.08, 0.7, 0.26], r: [0.02, 0.02], col: "crack", paint: true },
      { t: "cap", a: [0.12, 0.1, 0.06], b: [0.15, 0.3, -0.05], r: [0.02, 0.02], col: "crack", paint: true },
    ], FRONT).concat([
      { t: "ell", c: [0.32, 0.88, 0.18], r: [0.05, 0.045, 0.05], col: "rock", rot: [20, 10, 30] },
      { t: "ell", c: [-0.28, 0.82, -0.12], r: [0.045, 0.04, 0.045], col: "rock", rot: [10, 40, 0] },
      { t: "ell", c: [0.3, 0.3, -0.25], r: [0.05, 0.04, 0.05], col: "rock", rot: [0, 0, 25] },
    ]),
    eyes: [],
  },

  // Muralla de Roca: a stacked stone wall with an amber rune.
  "muralla-roca": {
    palette: { a: "#9aa3ab", b: "#868f98", c: "#adb3b8", rune: "#ffb43a", ground: "#8c7d66" },
    glow: ["rune"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.38, 0.05, 0.55], col: "ground" },
      { t: "box", c: [0, 0.14, -0.3], s: [0.13, 0.11, 0.17], round: 0.05, col: "a", k: 0.01 },
      { t: "box", c: [0, 0.14, 0.05], s: [0.14, 0.11, 0.17], round: 0.05, col: "b", k: 0.01 },
      { t: "box", c: [0, 0.13, 0.38], s: [0.13, 0.1, 0.15], round: 0.05, col: "c", k: 0.01 },
      { t: "box", c: [0, 0.37, -0.15], s: [0.12, 0.11, 0.18], round: 0.05, col: "c", k: 0.01, rot: [0, 0, 3] },
      { t: "box", c: [0, 0.37, 0.24], s: [0.12, 0.11, 0.19], round: 0.05, col: "a", k: 0.01, rot: [0, 0, -2] },
      { t: "box", c: [0, 0.37, -0.43], s: [0.11, 0.1, 0.09], round: 0.04, col: "b", k: 0.01 },
      { t: "box", c: [0, 0.59, -0.3], s: [0.11, 0.1, 0.16], round: 0.05, col: "b", k: 0.01, rot: [0, 0, -3] },
      { t: "box", c: [0, 0.6, 0.05], s: [0.12, 0.11, 0.17], round: 0.05, col: "a", k: 0.01 },
      { t: "box", c: [0, 0.58, 0.37], s: [0.11, 0.1, 0.14], round: 0.05, col: "c", k: 0.01 },
      { t: "box", c: [0, 0.8, -0.32], s: [0.1, 0.09, 0.1], round: 0.04, col: "c", k: 0.01 },
      { t: "box", c: [0, 0.8, 0.05], s: [0.1, 0.09, 0.1], round: 0.04, col: "b", k: 0.01 },
      { t: "box", c: [0, 0.8, 0.38], s: [0.1, 0.09, 0.1], round: 0.04, col: "a", k: 0.01 },
      { t: "cap", a: [0.13, 0.48, 0.05], b: [0.13, 0.7, 0.05], r: [0.02, 0.02], col: "rune", paint: true },
      { t: "cap", a: [0.13, 0.62, 0.05], b: [0.13, 0.52, 0.13], r: [0.018, 0.018], col: "rune", paint: true },
      { t: "cap", a: [0.13, 0.62, 0.05], b: [0.13, 0.52, -0.03], r: [0.018, 0.018], col: "rune", paint: true },
    ],
    eyes: [],
  },

  // Temblor: ground split by a glowing fissure, rock shards erupting.
  temblor: {
    palette: { ground: "#9b8b72", top: "#7fa05a", rock: "#8e969d", glow: "#ffb43a", shard: "#a7aeb4" },
    glow: ["glow"],
    shapes: [
      { t: "cap", a: [0.03, 0.14, -0.42], b: [-0.03, 0.14, 0.42], r: [0.06, 0.06], col: "glow" },
      { t: "box", c: [-0.29, 0.1, 0], s: [0.19, 0.08, 0.42], round: 0.05, rot: [0, 0, 14], col: "ground", k: 0 },
      { t: "box", c: [0.3, 0.1, 0.02], s: [0.19, 0.08, 0.4], round: 0.05, rot: [0, 0, -16], col: "ground", k: 0 },
      { t: "box", c: [-0.29, 0.17, 0], s: [0.19, 0.02, 0.42], round: 0.02, rot: [0, 0, 14], col: "top", paint: true },
      { t: "box", c: [0.3, 0.17, 0.02], s: [0.19, 0.02, 0.4], round: 0.02, rot: [0, 0, -16], col: "top", paint: true },
      { t: "cap", a: [0, 0.1, -0.1], b: [0.03, 0.66, -0.08], r: [0.11, 0.02], col: "shard", k: 0.02 },
      { t: "cap", a: [0, 0.1, 0.18], b: [-0.06, 0.48, 0.24], r: [0.09, 0.02], col: "rock", k: 0.02 },
      { t: "cap", a: [0, 0.1, -0.32], b: [0.07, 0.42, -0.38], r: [0.08, 0.02], col: "rock", k: 0.02 },
      { t: "ell", c: [-0.05, 0.82, 0.08], r: [0.06, 0.055, 0.06], col: "shard", rot: [20, 0, 40] },
      { t: "ell", c: [0.25, 0.7, -0.1], r: [0.045, 0.04, 0.045], col: "rock", rot: [0, 30, 10] },
      { t: "ell", c: [-0.3, 0.72, 0.1], r: [0.04, 0.035, 0.04], col: "rock", rot: [30, 0, 0] },
      { t: "ell", c: [0.1, 0.95, -0.08], r: [0.03, 0.03, 0.03], col: "glow" },
    ],
    eyes: [],
  },

  // Piel de Basalto: a shield of basalt hexagon plates with amber light in the seams.
  "piel-basalto": {
    palette: { seam: "#ffb43a", basalt: "#4d5560", rim: "#9aa3ab", gem: "#ffd27a" },
    glow: ["seam", "gem"],
    shapes: [
      { t: "ell", c: [0, 0.5, 0], r: [0.1, 0.44, 0.4], col: "seam" },
      { t: "tor", c: [0, 0.5, 0], R: 0.41, r: 0.05, rot: [0, 0, 90], col: "rim", k: 0.02 },
      ...basaltPlates(),
      { t: "ell", c: [0.15, 0.5, 0], r: [0.04, 0.05, 0.05], col: "gem", k: 0.01 },
    ],
    eyes: [],
  },

  // Cantera Ancestral: stepped quarry blocks with an old pickaxe and a rune stone.
  "cantera-ancestral": {
    palette: { a: "#a3a9ad", b: "#8b939a", rune: "#ffb43a", wood: "#9a6a3c", iron: "#5e6670", ground: "#8c7d66" },
    glow: ["rune"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.48, 0.05, 0.45], col: "ground" },
      { t: "box", c: [-0.15, 0.3, -0.08], s: [0.2, 0.3, 0.22], round: 0.04, col: "b", k: 0.01 },
      { t: "box", c: [0.12, 0.15, 0.12], s: [0.18, 0.15, 0.22], round: 0.04, col: "a", k: 0.01 },
      { t: "box", c: [0.22, 0.07, -0.25], s: [0.12, 0.07, 0.12], round: 0.03, col: "b", k: 0.01, rot: [0, 20, 0] },
      { t: "box", c: [0.06, 0.38, 0.03], s: [0.025, 0.08, 0.08], round: 0.01, col: "rune", paint: true },
      { t: "cap", a: [0.06, 0.36, 0.14], b: [0.06, 0.36, -0.12], r: [0.012, 0.012], col: "b", paint: true },
      { t: "cap", a: [0.02, 0.3, 0.12], b: [0.36, 0.86, 0.18], r: [0.03, 0.028], col: "wood", k: 0.02 },
      { t: "cap", a: [0.32, 0.82, 0.17], b: [0.5, 0.74, 0.18], r: [0.05, 0.015], col: "iron", k: 0.02 },
      { t: "cap", a: [0.32, 0.82, 0.17], b: [0.2, 0.98, 0.18], r: [0.05, 0.015], col: "iron", k: 0.02 },
      { t: "ell", c: [0.3, 0.32, 0.3], r: [0.05, 0.04, 0.05], col: "a", rot: [0, 0, 20] },
      { t: "ell", c: [-0.1, 0.65, -0.15], r: [0.04, 0.035, 0.04], col: "rune" },
    ],
    eyes: [],
  },

  // Golpe Sísmico: a stone maul slamming the ground, glowing shockwave rings.
  "golpe-sismico": {
    palette: { ground: "#8c7d66", wave: "#ffb43a", head: "#9aa3ab", band: "#c98a3a", wood: "#8a5a32", rock: "#7f878f" },
    glow: ["wave"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.52, 0.06, 0.52], col: "ground" },
      { t: "tor", c: [0, 0.08, 0], R: 0.3, r: 0.022, col: "wave", k: 0.01 },
      { t: "tor", c: [0, 0.07, 0], R: 0.45, r: 0.018, col: "wave", k: 0.01 },
      { t: "box", c: [0, 0.3, 0], s: [0.3, 0.17, 0.19], round: 0.07, col: "head", k: 0.05, rot: [0, -20, 0] },
      { t: "box", c: [0, 0.3, 0], s: [0.06, 0.175, 0.195], round: 0.05, col: "band", k: 0, rot: [0, -20, 0] },
      { t: "box", c: [-0.13, 0.3, 0.13], s: [0.06, 0.06, 0.06], round: 0.02, col: "wave", paint: true, rot: [0, -20, 45] },
      { t: "cap", a: [0, 0.45, 0], b: [-0.1, 0.92, 0.02], r: [0.045, 0.04], col: "wood", k: 0.02 },
      { t: "ell", c: [-0.1, 0.93, 0.02], r: [0.055, 0.045, 0.055], col: "band" },
      { t: "cap", a: [0.32, 0.06, 0.25], b: [0.36, 0.22, 0.3], r: [0.06, 0.015], col: "rock", k: 0.02 },
      { t: "cap", a: [-0.34, 0.06, 0.2], b: [-0.4, 0.2, 0.24], r: [0.055, 0.015], col: "rock", k: 0.02 },
      { t: "cap", a: [0.2, 0.06, 0.1], b: [0.3, 0.07, 0.25], r: [0.014, 0.014], col: "wave", paint: true },
      { t: "cap", a: [-0.2, 0.06, 0.1], b: [-0.3, 0.07, 0.3], r: [0.014, 0.014], col: "wave", paint: true },
      { t: "ell", c: [0.38, 0.4, 0.2], r: [0.05, 0.045, 0.05], col: "rock", rot: [20, 10, 30] },
      { t: "ell", c: [-0.36, 0.36, -0.18], r: [0.05, 0.04, 0.05], col: "rock", rot: [10, 40, 0] },
      { t: "ell", c: [0.3, 0.6, -0.15], r: [0.035, 0.03, 0.035], col: "rock" },
      { t: "ell", c: [-0.3, 0.58, 0.2], r: [0.035, 0.03, 0.035], col: "rock" },
    ],
    eyes: [],
  },

  // Daga Umbría: a violet shadow dagger, point up, wisps curling around it.
  "daga-umbria": {
    palette: { blade: "#a77bff", edge: "#e6d4ff", guard: "#3b2f66", grip: "#2a2240", gem: "#d07bff", wisp: "#5b4a8a" },
    glow: ["blade", "edge", "gem"],
    shapes: [
      { t: "ell", c: [0, 0.66, 0], r: [0.085, 0.32, 0.025], col: "blade" },
      { t: "cap", a: [0, 0.4, 0.02], b: [0, 0.95, 0.02], r: [0.012, 0.004], col: "edge", paint: true },
      { t: "cap", a: [-0.17, 0.36, 0], b: [0.17, 0.36, 0], r: [0.035, 0.035], col: "guard", k: 0.02 },
      { t: "ell", c: [0.19, 0.39, 0], r: [0.04, 0.04, 0.04], col: "gem", k: 0.01 },
      { t: "ell", c: [-0.19, 0.39, 0], r: [0.04, 0.04, 0.04], col: "gem", k: 0.01 },
      { t: "ell", c: [0, 0.36, 0], r: [0.06, 0.05, 0.05], col: "guard", k: 0.02 },
      { t: "cap", a: [0, 0.32, 0], b: [0, 0.12, 0], r: [0.035, 0.04], col: "grip", k: 0.01 },
      { t: "tor", c: [0, 0.25, 0], R: 0.035, r: 0.012, col: "guard", k: 0 },
      { t: "ell", c: [0, 0.09, 0], r: [0.05, 0.05, 0.05], col: "gem", k: 0.01 },
      { t: "cap", a: [0.12, 0.2, 0.1], b: [0.2, 0.55, 0.05], r: [0.035, 0.008], col: "wisp" },
      { t: "cap", a: [-0.12, 0.45, -0.08], b: [-0.2, 0.8, -0.02], r: [0.03, 0.008], col: "wisp" },
      { t: "cap", a: [-0.1, 0.15, 0.08], b: [-0.22, 0.32, 0.12], r: [0.03, 0.008], col: "wisp" },
    ],
    eyes: [],
  },

  // Robo Audaz: an indigo-gloved hand snatching a gold coin bag, coins flying.
  "robo-audaz": {
    palette: { bag: "#c89a5a", tie: "#7a4e2a", gold: "#ffcc3f", glove: "#3b2f66", sleeve: "#5b4a8a", mark: "#ffe8a0" },
    glow: [],
    shapes: [
      { t: "ell", c: [0, 0.3, 0], r: [0.26, 0.27, 0.26], col: "bag" },
      { t: "cap", a: [0, 0.48, 0], b: [0, 0.62, 0], r: [0.13, 0.07], col: "bag", k: 0.06 },
      { t: "tor", c: [0, 0.58, 0], R: 0.075, r: 0.025, col: "tie", k: 0.01 },
      { t: "ell", c: [0, 0.68, 0], r: [0.12, 0.06, 0.12], col: "bag", k: 0.03 },
      { t: "ell", c: [0.24, 0.32, 0.06], r: [0.05, 0.08, 0.08], col: "mark", paint: true },
      { t: "box", c: [0.02, 0.66, 0], s: [0.09, 0.07, 0.1], round: 0.05, col: "glove", k: 0.03 },
      { t: "cap", a: [0.06, 0.6, 0.07], b: [0.11, 0.66, 0.0], r: [0.035, 0.03], col: "glove", k: 0.02 },
      { t: "cap", a: [-0.02, 0.7, 0], b: [-0.22, 0.92, -0.05], r: [0.07, 0.08], col: "glove", k: 0.04 },
      { t: "cap", a: [-0.2, 0.9, -0.05], b: [-0.35, 1.0, -0.08], r: [0.09, 0.1], col: "sleeve", k: 0.02 },
      coin([0.32, 0.2, 0.15], [70, 0, 20]),
      coin([0.36, 0.52, -0.1], [30, 40, 0]),
      coin([-0.32, 0.4, 0.15], [-40, 0, 60]),
      coin([0.18, 0.04, 0.3], [90, 0, 0]),
      coin([0.25, 0.85, 0.15], [20, -30, 70]),
    ],
    eyes: [],
  },

  // Humo y Espejos: swirling violet smoke with two hand mirrors.
  "humo-espejos": {
    palette: { smoke: "#b3a6d6", smoke2: "#8f80c0", frame: "#d9b25a", glass: "#cfe8ff", handle: "#7a5a3a" },
    glow: ["glass"],
    shapes: [
      { t: "ell", c: [0, 0.12, 0], r: [0.22, 0.12, 0.2], col: "smoke" },
      { t: "ell", c: [0.2, 0.15, 0.15], r: [0.15, 0.12, 0.14], col: "smoke2", k: 0.08 },
      { t: "ell", c: [-0.22, 0.14, -0.1], r: [0.16, 0.12, 0.15], col: "smoke", k: 0.08 },
      { t: "ell", c: [-0.05, 0.3, 0.05], r: [0.14, 0.12, 0.14], col: "smoke2", k: 0.08 },
      { t: "ell", c: [0.25, 0.85, -0.15], r: [0.1, 0.08, 0.1], col: "smoke" },
      { t: "ell", c: [0.33, 0.8, -0.05], r: [0.07, 0.06, 0.07], col: "smoke2", k: 0.05 },
      { t: "ell", c: [-0.3, 0.9, 0.1], r: [0.08, 0.07, 0.08], col: "smoke2" },
      // left mirror (tilted)
      { t: "tor", c: [-0.12, 0.62, -0.08], R: 0.15, r: 0.03, rot: [90, 0, 15], col: "frame", k: 0 },
      { t: "ell", c: [-0.12, 0.62, -0.08], r: [0.14, 0.14, 0.015], rot: [0, 0, 15], col: "glass", k: 0 },
      { t: "cap", a: [-0.08, 0.47, -0.08], b: [-0.03, 0.3, -0.08], r: [0.03, 0.025], col: "handle", k: 0.02 },
      // right mirror
      { t: "tor", c: [0.18, 0.5, 0.12], R: 0.13, r: 0.028, rot: [90, 0, -20], col: "frame", k: 0 },
      { t: "ell", c: [0.18, 0.5, 0.12], r: [0.12, 0.12, 0.015], rot: [0, 0, -20], col: "glass", k: 0 },
      { t: "cap", a: [0.13, 0.37, 0.12], b: [0.08, 0.22, 0.12], r: [0.028, 0.022], col: "handle", k: 0.02 },
    ],
    eyes: [],
  },

  // Capa de Sombras: an empty hooded cloak, two violet eyes glowing in the hood.
  "capa-sombras": {
    palette: { cloak: "#3b2f66", lining: "#7a5bc0", void: "#120c22", eye: "#e2c2ff", clasp: "#e0b85a", wisp: "#5b4a8a" },
    glow: ["eye"],
    shapes: turn([
      { t: "cap", a: [0, 0.12, 0], b: [0, 0.62, 0], r: [0.3, 0.17], col: "cloak" },
      { t: "ell", c: [0, 0.1, 0], r: [0.34, 0.1, 0.34], col: "cloak", k: 0.06 },
      { t: "ell", c: [0.02, 0.78, 0], r: [0.2, 0.21, 0.2], col: "cloak", k: 0.08 },
      { t: "cap", a: [-0.12, 0.82, 0], b: [-0.24, 0.98, 0], r: [0.1, 0.02], col: "cloak", k: 0.06 },
      { t: "ell", c: [0.22, 0.76, 0], r: [0.12, 0.13, 0.13], col: "void", cut: true, k: 0.02 },
      { t: "ell", c: [0.16, 0.76, 0], r: [0.09, 0.15, 0.15], col: "void", paint: true },
      { t: "ell", c: [0.11, 0.78, 0.06], r: [0.05, 0.028, 0.035], col: "eye", paint: true },
      { t: "ell", c: [0.11, 0.78, -0.06], r: [0.05, 0.028, 0.035], col: "eye", paint: true },
      { t: "cap", a: [0.22, 0.58, 0.0], b: [0.32, 0.08, 0.0], r: [0.035, 0.08], col: "lining", paint: true },
      { t: "ell", c: [0.2, 0.6, 0], r: [0.045, 0.045, 0.045], col: "clasp", k: 0.01 },
      { t: "cap", a: [0.25, 0.05, 0.2], b: [0.42, 0.22, 0.32], r: [0.05, 0.01], col: "wisp" },
      { t: "cap", a: [-0.25, 0.05, -0.2], b: [-0.42, 0.25, -0.3], r: [0.05, 0.01], col: "wisp" },
      { t: "cap", a: [-0.2, 0.05, 0.25], b: [-0.38, 0.14, 0.42], r: [0.05, 0.01], col: "wisp" },
      { t: "cap", a: [0.28, 0.05, -0.18], b: [0.44, 0.18, -0.3], r: [0.05, 0.01], col: "wisp" },
    ], FRONT),
    eyes: [],
  },

  // Guarida de Ladrones: a crooked thieves' shack with a glowing window and lantern.
  guarida: {
    palette: { wood: "#9a6a3c", plank: "#7d5430", roof: "#5b4a8a", door: "#3a2a20", light: "#ffcb5c", stone: "#8e969d", ground: "#8c7d66", cloth: "#7a5bc0" },
    glow: ["light"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.48, 0.05, 0.45], col: "ground" },
      { t: "box", c: [0, 0.27, 0], s: [0.28, 0.24, 0.26], round: 0.03, col: "wood", rot: [0, 0, 3] },
      ...[0.08, 0.2, 0.32, 0.44].map((y) => ({ t: "box", c: [0.285, y, 0], s: [0.01, 0.008, 0.27], round: 0.004, col: "plank", paint: true }) as Shape),
      { t: "box", c: [0.01, 0.62, 0.14], s: [0.36, 0.025, 0.19], round: 0.02, rot: [38, 0, 3], col: "roof", k: 0, mirror: true },
      { t: "box", c: [-0.12, 0.78, -0.15], s: [0.05, 0.12, 0.05], round: 0.02, col: "stone", k: 0, rot: [0, 0, 8] },
      { t: "box", c: [0.28, 0.2, -0.08], s: [0.02, 0.16, 0.08], round: 0.02, col: "door", k: 0 },
      { t: "box", c: [0.28, 0.32, 0.14], s: [0.02, 0.06, 0.06], round: 0.02, col: "light", k: 0 },
      { t: "cap", a: [0.29, 0.32, 0.08], b: [0.29, 0.32, 0.2], r: [0.008, 0.008], col: "plank", paint: true },
      { t: "cap", a: [0.32, 0.5, 0.25], b: [0.4, 0.5, 0.25], r: [0.012, 0.012], col: "plank", k: 0.01 },
      { t: "ell", c: [0.4, 0.42, 0.25], r: [0.04, 0.055, 0.04], col: "light", k: 0.01 },
      { t: "box", c: [0.3, 0.5, -0.24], s: [0.01, 0.1, 0.05], round: 0.005, col: "cloth", k: 0.01 },
      { t: "box", c: [0.35, 0.08, 0.3], s: [0.07, 0.07, 0.07], round: 0.02, col: "plank", rot: [0, 25, 0] },
    ],
    eyes: [],
  },

  // Golpe por la Espalda: a glowing violet crescent slash behind a dagger.
  "golpe-espalda": {
    palette: { slash: "#c79bff", core: "#f2e6ff", blade: "#cfd6e0", guard: "#3b2f66", grip: "#2a2240", spark: "#e0b8ff" },
    glow: ["slash", "core", "spark"],
    shapes: [
      { t: "ell", c: [0, 0.52, 0], r: [0.42, 0.42, 0.03], rot: [0, 0, -30], col: "slash" },
      { t: "ell", c: [-0.1, 0.6, 0], r: [0.4, 0.4, 0.06], rot: [0, 0, -30], col: "slash", cut: true, k: 0 },
      { t: "ell", c: [0.22, 0.36, 0], r: [0.07, 0.25, 0.04], rot: [0, 0, 40], col: "core", paint: true },
      { t: "ell", c: [0.02, 0.5, 0.08], r: [0.045, 0.22, 0.015], rot: [0, 0, -45], col: "blade", k: 0 },
      { t: "cap", a: [-0.15, 0.43, 0.08], b: [-0.03, 0.31, 0.08], r: [0.03, 0.03], col: "guard", k: 0 },
      { t: "cap", a: [-0.14, 0.31, 0.08], b: [-0.26, 0.19, 0.08], r: [0.032, 0.035], col: "grip", k: 0.01 },
      { t: "ell", c: [-0.28, 0.17, 0.08], r: [0.045, 0.045, 0.045], col: "spark", k: 0.01 },
      { t: "ell", c: [0.38, 0.75, 0.05], r: [0.03, 0.03, 0.03], col: "spark" },
      { t: "ell", c: [0.44, 0.6, -0.05], r: [0.022, 0.022, 0.022], col: "spark" },
      { t: "ell", c: [0.3, 0.92, 0], r: [0.02, 0.02, 0.02], col: "spark" },
    ],
    eyes: [],
  },

  // Poción de Curación: a round bottle of glowing red-pink healing liquid with a heart.
  "pocion-curacion": {
    palette: { liquid: "#ff4f6d", glass: "#d8f2ff", cork: "#b07a45", heart: "#fff0f3", bubble: "#ffc2cf", string: "#e8c26a" },
    glow: ["liquid", "heart", "bubble"],
    shapes: [
      { t: "ell", c: [0, 0.32, 0], r: [0.3, 0.3, 0.3], col: "liquid" },
      { t: "ell", c: [0, 0.5, 0], r: [0.32, 0.14, 0.32], col: "glass", paint: true },
      { t: "cap", a: [0, 0.55, 0], b: [0, 0.78, 0], r: [0.1, 0.085], col: "glass", k: 0.06 },
      { t: "tor", c: [0, 0.77, 0], R: 0.09, r: 0.025, col: "glass", k: 0.01 },
      { t: "tor", c: [0, 0.66, 0], R: 0.095, r: 0.018, col: "string", k: 0 },
      { t: "cap", a: [0, 0.76, 0], b: [0, 0.9, 0], r: [0.075, 0.085], col: "cork", k: 0.01 },
      ...turn([
        { t: "ell", c: [0.28, 0.33, 0.045], r: [0.07, 0.05, 0.045], col: "heart", paint: true },
        { t: "ell", c: [0.28, 0.33, -0.045], r: [0.07, 0.05, 0.045], col: "heart", paint: true },
        { t: "cap", a: [0.28, 0.33, 0.075], b: [0.29, 0.22, 0], r: [0.035, 0.012], col: "heart", paint: true },
        { t: "cap", a: [0.28, 0.33, -0.075], b: [0.29, 0.22, 0], r: [0.035, 0.012], col: "heart", paint: true },
      ] as Shape[], FRONT),
      { t: "ell", c: [0.12, 1.0, 0.08], r: [0.035, 0.035, 0.035], col: "bubble" },
      { t: "ell", c: [-0.06, 1.08, -0.04], r: [0.025, 0.025, 0.025], col: "bubble" },
      { t: "ell", c: [0.2, 0.92, -0.1], r: [0.02, 0.02, 0.02], col: "bubble" },
    ],
    eyes: [],
  },

  // Segundo Aliento: a white feather lifted by glowing mint wind swirls.
  respiro: {
    palette: { vane: "#fff3d2", tip: "#6fdcb8", shaft: "#d9c7a0", wind: "#8ff0d0", spark: "#e8fff6" },
    glow: ["wind", "spark"],
    shapes: [
      { t: "cap", a: [-0.1, 0.12, 0], b: [0.08, 0.92, 0], r: [0.018, 0.01], col: "shaft" },
      { t: "ell", c: [0.0, 0.56, 0], r: [0.13, 0.34, 0.025], rot: [0, 0, -13], col: "vane", k: 0.02 },
      { t: "ell", c: [0.05, 0.82, 0], r: [0.08, 0.1, 0.026], rot: [0, 0, -13], col: "tip", paint: true },
      { t: "cap", a: [0.1, 0.4, 0], b: [0.18, 0.38, 0], r: [0.03, 0.01], col: "vane", k: 0.02 },
      { t: "tor", c: [0, 0.35, 0], R: 0.32, r: 0.018, rot: [12, 0, 8], col: "wind", k: 0 },
      { t: "tor", c: [0, 0.62, 0], R: 0.26, r: 0.015, rot: [-10, 0, -6], col: "wind", k: 0 },
      { t: "tor", c: [0, 0.12, 0], R: 0.2, r: 0.02, col: "wind", k: 0 },
      { t: "ell", c: [0.3, 0.85, 0.1], r: [0.03, 0.03, 0.03], col: "spark" },
      { t: "ell", c: [-0.28, 0.78, -0.08], r: [0.025, 0.025, 0.025], col: "spark" },
      { t: "ell", c: [-0.2, 0.98, 0.1], r: [0.02, 0.02, 0.02], col: "spark" },
    ],
    eyes: [],
  },

  // Vigilancia: a brass lantern whose glowing glass holds one watchful eye.
  vigilancia: {
    palette: { brass: "#c99a3c", dark: "#5a4630", glass: "#ffe08a", ring: "#a07a2a" },
    glow: ["glass"],
    shapes: [
      { t: "box", c: [0, 0.08, 0], s: [0.22, 0.06, 0.22], round: 0.03, col: "brass", rot: [0, 45, 0] },
      { t: "ell", c: [0, 0.42, 0], r: [0.21, 0.27, 0.21], col: "glass", k: 0.02 },
      ...([[0.24, 0], [-0.24, 0], [0, 0.24], [0, -0.24]] as [number, number][]).map(([x, z]) => ({ t: "cap", a: [x, 0.12, z], b: [x, 0.72, z], r: [0.022, 0.022], col: "dark", k: 0.02 }) as Shape),
      { t: "cap", a: [0, 0.72, 0], b: [0, 0.86, 0], r: [0.23, 0.08], col: "brass", k: 0.03 },
      { t: "ell", c: [0, 0.88, 0], r: [0.06, 0.04, 0.06], col: "brass", k: 0.02 },
      { t: "tor", c: [0, 0.98, 0], R: 0.07, r: 0.018, rot: [90, 0, 0], col: "ring", k: 0.01 },
    ],
    eyes: [{ at: [0, 0.42, 0], r: 0.14, iris: "#7a4be0", look: [0.6, 0.05, 0.8] }],
  },
};
