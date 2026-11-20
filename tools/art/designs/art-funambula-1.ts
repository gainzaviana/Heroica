import type { Sculpt, Shape, V3 } from "../sculpt";
import { SKIN, arm, body, eyes, rad, spike } from "./kit";

// Funámbula's 40-card deck — art batch 1. Valdoria: floating towers, old runes, the city of Aurelia.
// Original designs only: allies of the city watch, an automaton, an acrobat, a spymaster and an airship.

// MARK: Helpers

/** Small spheres (sparks, rivets, dots). */
const dot = (c: V3, r: number, col: string, k = 0): Shape => ({ t: "ell", c, r: [r, r, r], col, k });

/** A polyline of capsules through points. */
function line(pts: V3[], r: number, col: string, k = 0.01): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [r, r], col, k });
  return out;
}

/** Chain of capsules along an arc in the xy plane (degrees), radius tapering r0 → r1. */
function arc(cx: number, cy: number, z: number, R: number, a0: number, a1: number, n: number, r0: number, col: string, r1 = r0, k = 0.01): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: [cx + R * Math.cos(rad(t0)), cy + R * Math.sin(rad(t0)), z], b: [cx + R * Math.cos(rad(t1)), cy + R * Math.sin(rad(t1)), z], r: [ra, rb], col, k });
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
    return { ...sh, c: p(sh.c), rot: [r[0], r[1], r[2] + deg] };
  });
}

/** Moves shapes. */
function shift(shapes: Shape[], d: V3): Shape[] {
  const p = (v: V3): V3 => [v[0] + d[0], v[1] + d[1], v[2] + d[2]];
  return shapes.map((sh): Shape => (sh.t === "cap" ? { ...sh, a: p(sh.a), b: p(sh.b) } : { ...sh, c: p(sh.c) }));
}

/** A propeller in the yz plane (axis along x) at c. */
function propeller(c: V3, R: number, blade: string, hub: string, phase = 0): Shape[] {
  const out: Shape[] = [{ t: "ell", c, r: [0.03, R * 0.22, R * 0.22], col: hub, k: 0.01 }];
  for (let i = 0; i < 3; i++) {
    const a = rad(phase + i * 120);
    out.push({ t: "ell", c: [c[0] + 0.005, c[1] + Math.sin(a) * R * 0.55, c[2] + Math.cos(a) * R * 0.55], r: [0.01, R * 0.5, R * 0.16], rot: [-(phase + i * 120) + 90, 0, 0], col: blade, k: 0.01 });
  }
  return out;
}

const GR_TILT = 32, GR_PIVOT: V3 = [0, 0.45, 0];
/** Rotates a point (or a direction) the way Grajilla's body is tilted. */
function rp(v: V3, dir = false): V3 {
  const c = Math.cos(rad(GR_TILT)), s = Math.sin(rad(GR_TILT)), o = dir ? [0, 0, 0] : GR_PIVOT;
  const x = v[0] - o[0], y = v[1] - o[1];
  return [o[0] + c * x - s * y, o[1] + s * x + c * y, v[2]];
}
/** Grajilla upright (tilted back into the flip by rotZ). */
const GRAJILLA: Shape[] = [
  // Torso: black suit, white harlequin diamonds, crimson sash with streaming ends.
  { t: "ell", c: [0, 0.42, 0], r: [0.12, 0.15, 0.13], col: "suit" },
  { t: "box", c: [0.1, 0.47, 0.04], s: [0.04, 0.035, 0.035], round: 0.004, rot: [45, 0, 0], col: "feather", paint: true },
  { t: "box", c: [0.11, 0.38, -0.03], s: [0.04, 0.03, 0.03], round: 0.004, rot: [45, 0, 0], col: "feather", paint: true },
  { t: "tor", c: [0, 0.33, 0], R: 0.12, r: 0.018, col: "gold", k: 0.01 },
  // Legs tucked: knees up toward the chest, feet under.
  { t: "cap", a: [0, 0.3, 0.07], b: [0.2, 0.4, 0.1], r: [0.062, 0.05], col: "suit", k: 0.03 },
  { t: "cap", a: [0.2, 0.4, 0.1], b: [0.12, 0.2, 0.11], r: [0.05, 0.042], col: "suit", k: 0.02 },
  { t: "ell", c: [0.15, 0.17, 0.11], r: [0.075, 0.042, 0.05], col: "boots", k: 0.01 },
  { t: "box", c: [0.12, 0.37, 0.15], s: [0.03, 0.03, 0.03], round: 0.004, rot: [0, 0, 45], col: "feather", paint: true },
  { t: "tor", c: [0.13, 0.22, 0.11], R: 0.045, r: 0.012, rot: [0, 0, -20], col: "feather", paint: true },
  { t: "cap", a: [0, 0.3, -0.07], b: [0.18, 0.32, -0.1], r: [0.062, 0.05], col: "suit", k: 0.03 },
  { t: "cap", a: [0.18, 0.32, -0.1], b: [0.06, 0.14, -0.1], r: [0.05, 0.042], col: "suit", k: 0.02 },
  { t: "ell", c: [0.09, 0.11, -0.1], r: [0.075, 0.042, 0.05], col: "boots", k: 0.01 },
  { t: "tor", c: [0.08, 0.16, -0.1], R: 0.045, r: 0.012, rot: [0, 0, -40], col: "feather", paint: true },
  // Head; pale-grey cowl over the crown and nape, a swept-back crest of feathers.
  { t: "ell", c: [0.04, 0.71, 0], r: [0.17, 0.16, 0.16], col: "skin", k: 0.06 },
  { t: "ell", c: [-0.03, 0.76, 0], r: [0.19, 0.17, 0.19], col: "cowl", k: 0.03 },
  { t: "ell", c: [0.2, 0.69, 0], r: [0.11, 0.12, 0.16], col: "cowl", cut: true, k: 0.03 },
  { t: "ell", c: [0.11, 0.83, 0], r: [0.08, 0.035, 0.12], col: "hair", paint: true },
  { t: "ell", c: [-0.02, 0.57, 0], r: [0.13, 0.05, 0.15], col: "cowlDk", k: 0.02 },
  ...([[0.88, 0, "suit"], [0.82, 0.08, "suitLt"], [0.82, -0.08, "suitLt"], [0.74, 0.02, "cowlDk"]] as [number, number, string][]).map(
    ([y, z, col]): Shape => ({ t: "ell", c: [-0.2, y, z], r: [0.1, 0.03, 0.035], rot: [0, 0, 18], col, k: 0.03 }),
  ),
  { t: "cap", a: [0.2, 0.635, -0.02], b: [0.19, 0.64, 0.06], r: [0.009, 0.009], col: "mouth", paint: true },
  // Arms flung wide, a short stave in each hand.
  ...arm(1, [-0.16, 0.6, 0.32], "suit", "suitLt", 0.04),
  { t: "cap", a: [-0.3, 0.48, 0.33], b: [-0.04, 0.74, 0.33], r: [0.024, 0.024], col: "wood", k: 0.005 },
  dot([-0.3, 0.48, 0.33], 0.03, "gold"), dot([-0.04, 0.74, 0.33], 0.03, "gold"),
  ...arm(-1, [0.3, 0.36, -0.26], "suit", "suitLt", 0.04),
  { t: "cap", a: [0.22, 0.2, -0.27], b: [0.4, 0.52, -0.27], r: [0.024, 0.024], col: "wood", k: 0.005 },
  dot([0.22, 0.2, -0.27], 0.03, "gold"), dot([0.4, 0.52, -0.27], 0.03, "gold"),
];

export const artFunambula1: Record<string, Sculpt> = {
  // Arquero del Campanario: a hooded archer in moss green and leather, perched on the ledge of a bell
  // tower, drawing a longbow; a bronze bell hangs in the arched belfry below him, four arrows in his quiver.
  "arquero-campanario": {
    palette: {
      skin: SKIN, hair: "#6a4428", torso: "#4f7a3a", legs: "#5a4a34", boots: "#3e2c20", hood: "#2f6e58", hoodDk: "#22524a",
      leather: "#8a5a36", wood: "#a0703e", string: "#f2ecdc", fletch: "#f4efe2", tip: "#c9d0d8", belt: "#5a3a26",
      stone: "#c8bca6", stoneDk: "#9a8e7a", roof: "#a8553a", bell: "#d0a040", bellDk: "#8a6424", dark: "#3a3040",
    },
    shapes: [
      // Belfry: four stone pillars on a plinth, a dark back wall, a bronze bell hanging in the middle.
      { t: "box", c: [-0.02, -0.5, 0], s: [0.24, 0.05, 0.22], round: 0.015, col: "stoneDk", k: 0.005 },
      ...([[0.18, 0.17], [-0.22, 0.17], [-0.22, -0.17], [0.18, -0.17]] as number[][]).map(([x, z]): Shape => ({ t: "box", c: [x, -0.26, z], s: [0.045, 0.2, 0.045], round: 0.01, col: "stone", k: 0.005 })),
      { t: "box", c: [-0.02, -0.26, -0.17], s: [0.17, 0.2, 0.025], round: 0.005, col: "dark", k: 0 },
      { t: "box", c: [-0.22, -0.26, 0], s: [0.025, 0.2, 0.15], round: 0.005, col: "dark", k: 0 },
      ...arc(-0.02, -0.17, 0.17, 0.155, 0, 180, 8, 0.03, "stoneDk", 0.03, 0.01),
      { t: "box", c: [-0.02, -0.025, 0], s: [0.26, 0.03, 0.24], round: 0.01, col: "stoneDk", k: 0.005 },
      { t: "cap", a: [-0.02, -0.06, -0.15], b: [-0.02, -0.06, 0.15], r: [0.012, 0.012], col: "wood", k: 0 },
      { t: "cap", a: [-0.02, -0.06, 0], b: [-0.02, -0.12, 0], r: [0.012, 0.012], col: "bellDk", k: 0 },
      { t: "ell", c: [-0.02, -0.13, 0], r: [0.055, 0.04, 0.055], col: "bell", k: 0.02 },
      { t: "cap", a: [-0.02, -0.15, 0], b: [-0.02, -0.3, 0], r: [0.06, 0.11], col: "bell", k: 0.04 },
      { t: "tor", c: [-0.02, -0.3, 0], R: 0.1, r: 0.018, col: "bellDk", k: 0.01 },
      dot([-0.02, -0.36, 0], 0.028, "bellDk"),
      // Corner merlons.
      ...([[0.2, 0.03, 0.19], [-0.24, 0.03, 0.19], [-0.24, 0.03, -0.19], [0.2, 0.03, -0.19]] as V3[]).map((c): Shape => ({ t: "box", c, s: [0.045, 0.04, 0.045], round: 0.01, col: "stone", k: 0.005 })),
      // Quiver on the back with four arrows.
      { t: "cap", a: [-0.16, 0.3, 0.04], b: [-0.2, 0.62, -0.02], r: [0.045, 0.05], col: "leather", k: 0.02 },
      ...[0.04, 0.012, -0.016, -0.044].map((z, i): Shape => ({ t: "cap", a: [-0.2, 0.62, -0.02 + z], b: [-0.23 - (i % 2) * 0.02, 0.76 - (i % 2) * 0.02, -0.03 + z * 1.4], r: [0.008, 0.008], col: "wood", k: 0 })),
      ...[0.04, 0.012, -0.016, -0.044].map((z, i): Shape => ({ t: "ell", c: [-0.235 - (i % 2) * 0.02, 0.78 - (i % 2) * 0.02, -0.03 + z * 1.4], r: [0.022, 0.035, 0.006], col: "fletch", k: 0 })),
      ...body({ torso: [0.13, 0.16, 0.14] }),
      { t: "cap", a: [0.1, 0.56, 0.1], b: [0.13, 0.28, -0.1], r: [0.018, 0.018], col: "leather", k: 0.01 },
      { t: "tor", c: [0, 0.29, 0], R: 0.13, r: 0.022, col: "belt" },
      // Short hooded mantle.
      { t: "ell", c: [-0.02, 0.53, 0], r: [0.16, 0.08, 0.2], col: "hoodDk", k: 0.03 },
      { t: "ell", c: [-0.02, 0.76, 0], r: [0.22, 0.21, 0.215], col: "hood", k: 0.04 },
      { t: "ell", c: [0.2, 0.7, 0], r: [0.1, 0.13, 0.16], col: "hood", cut: true, k: 0.03 },
      { t: "ell", c: [0.07, 0.7, 0], r: [0.15, 0.15, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.13, 0.82, 0], r: [0.08, 0.04, 0.13], col: "hair", paint: true },
      { t: "cap", a: [-0.12, 0.92, 0], b: [-0.28, 0.86, 0], r: [0.05, 0.012], col: "hood", k: 0.03 },
      // Far arm holds the longbow out; near hand draws the string back to the chest.
      ...arm(-1, [0.4, 0.5, -0.12], "torso", "leather"),
      ...arc(0.12, 0.5, -0.11, 0.45, -42, 42, 8, 0.022, "wood", 0.02, 0.01),
      ...([42, -42] as number[]).map((d): Shape => ({ t: "cap", a: [0.12 + 0.45 * Math.cos(rad(d)), 0.5 + 0.45 * Math.sin(rad(d)), -0.11], b: [0.12 + 0.41 * Math.cos(rad(d * 1.12)), 0.5 + 0.45 * Math.sin(rad(d * 1.12)), -0.11], r: [0.018, 0.01], col: "wood", k: 0.01 })),
      { t: "box", c: [0.4, 0.5, -0.12], s: [0.025, 0.04, 0.025], round: 0.01, col: "leather", k: 0.01 },
      ...arm(1, [0.04, 0.48, 0.25], "torso", "leather"),
      ...([42, -42] as number[]).map((d): Shape => ({ t: "cap", a: [0.12 + 0.45 * Math.cos(rad(d)), 0.5 + 0.45 * Math.sin(rad(d)), -0.11], b: [0.05, 0.49, 0.22], r: [0.005, 0.005], col: "string", k: 0 })),
      { t: "cap", a: [0.05, 0.49, 0.22], b: [0.66, 0.5, -0.14], r: [0.013, 0.013], col: "wood", k: 0 },
      spike([0.66, 0.5, -0.14], 0, 0.07, [0.022, 0.003], "tip", 0.005),
      { t: "ell", c: [0.1, 0.49, 0.19], r: [0.04, 0.022, 0.006], col: "fletch", k: 0 },
    ],
    eyes: eyes("#3f8a4a", false, 0.7, 0.04),
  },

  // Comisaria Vega: city-watch commissioner in a long dark-blue coat with brass buttons, short dark
  // hair, holding up her watch badge (a brass tower in a silver plate) and a sealed scroll of orders.
  "comisaria-vega": {
    palette: {
      skin: "#e8b48e", hair: "#2a2026", torso: "#22345e", coat: "#26396a", coatDk: "#18254a", legs: "#1a2440", boots: "#1a1418",
      brass: "#e0b04a", silver: "#e6ecf2", glove: "#3a2a24", paper: "#f2e6c8", seal: "#c23a2a", mouth: "#8a3a34", lapel: "#5a78b8",
    },
    shapes: [
      { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.1, 0.07], b: [0, 0.26, 0.07], r: [0.055, 0.06], col: "legs", mirror: true },
      // Long coat flaring to the shins, split at the front.
      { t: "cap", a: [0, 0.45, 0], b: [-0.05, 0.16, 0], r: [0.15, 0.21], col: "coat", k: 0.05 },
      { t: "box", c: [0.22, 0.2, 0], s: [0.08, 0.1, 0.05], round: 0.03, rot: [0, 0, 15], col: "coat", cut: true, k: 0.03 },
      { t: "ell", c: [0, 0.43, 0], r: [0.15, 0.16, 0.18], col: "coat" },
      { t: "cap", a: [0.13, 0.56, 0.08], b: [0.17, 0.4, 0.02], r: [0.03, 0.012], col: "lapel", paint: true },
      { t: "cap", a: [0.13, 0.56, -0.08], b: [0.17, 0.4, -0.02], r: [0.03, 0.012], col: "lapel", paint: true },
      ...[0.44, 0.36, 0.28].flatMap((y): Shape[] => [dot([0.155, y, 0.05], 0.013, "brass"), dot([0.155, y, -0.05], 0.013, "brass")]),
      { t: "tor", c: [0, 0.32, 0], R: 0.155, r: 0.02, col: "coatDk" },
      { t: "box", c: [0.155, 0.32, 0], s: [0.012, 0.025, 0.03], round: 0.008, col: "brass", k: 0.005 },
      { t: "ell", c: [-0.01, 0.56, 0.17], r: [0.08, 0.035, 0.07], col: "coatDk", mirror: true, k: 0.02 },
      { t: "tor", c: [0, 0.57, 0], R: 0.1, r: 0.035, col: "coatDk", k: 0.02 },
      // Head: short dark crop with a side-swept fringe, confident smile.
      { t: "ell", c: [0.02, 0.72, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.06 },
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.18, 0.14, 0.19], col: "hair", k: 0.02 },
      { t: "ell", c: [0.11, 0.84, 0.03], r: [0.09, 0.045, 0.14], rot: [0, 0, -15], col: "hair", paint: true },
      { t: "cap", a: [-0.03, 0.78, 0.16], b: [0.01, 0.66, 0.17], r: [0.035, 0.02], col: "hair", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.14, 0.72, 0], b: [-0.12, 0.62, 0], r: [0.08, 0.05], col: "hair", k: 0.03 },
      { t: "cap", a: [0.185, 0.64, -0.01], b: [0.17, 0.635, 0.07], r: [0.008, 0.008], col: "mouth", paint: true },
      // Near hand raises the badge toward us.
      ...arm(1, [0.28, 0.5, 0.32], "coat", "glove", 0.048),
      { t: "ell", c: [0.32, 0.55, 0.35], r: [0.02, 0.085, 0.07], rot: [0, -45, 0], col: "silver", k: 0.01 },
      { t: "tor", c: [0.32, 0.55, 0.35], R: 0.072, r: 0.012, rot: [0, -45, 90], col: "brass", k: 0.005 },
      { t: "box", c: [0.335, 0.54, 0.365], s: [0.01, 0.038, 0.02], round: 0.006, rot: [0, -45, 0], col: "brass", k: 0.004 },
      { t: "cap", a: [0.335, 0.585, 0.365], b: [0.335, 0.605, 0.365], r: [0.022, 0.005], col: "brass", k: 0.004 },
      { t: "box", c: [0.335, 0.5, 0.365], s: [0.01, 0.008, 0.034], round: 0.004, rot: [0, -45, 0], col: "brass", k: 0.004 },
      // Far hand: scroll of orders with a red wax seal.
      ...arm(-1, [0.2, 0.36, -0.22], "coat", "glove", 0.048),
      { t: "cap", a: [0.12, 0.3, -0.24], b: [0.32, 0.44, -0.24], r: [0.04, 0.04], col: "paper", k: 0.005 },
      dot([0.11, 0.295, -0.24], 0.03, "brass", 0.005), dot([0.33, 0.445, -0.24], 0.03, "brass", 0.005),
      { t: "tor", c: [0.22, 0.37, -0.24], R: 0.036, r: 0.01, rot: [0, 0, 55], col: "seal", k: 0.005 },
      { t: "ell", c: [0.23, 0.37, -0.2], r: [0.022, 0.022, 0.012], col: "seal", k: 0.005 },
    ],
    eyes: eyes("#7a5a3a", false, 0.72, 0.03, 0.05),
  },

  // Autómata de Cristal: a faceted pale-aqua crystal automaton with brass joints and collar, a glowing
  // heart-core in the chest; loose shards drift off one arm as it turns light.
  "automata-cristal": {
    palette: {
      crystal: "#9fe6e2", crystalLt: "#e2fbf8", crystalDk: "#5ab4b8", brass: "#d0a040", brassDk: "#8a6424",
      core: "#f2ffff", coreRim: "#7ff0ff", legs: "#9fe6e2", boots: "#d0a040", torso: "#9fe6e2",
    },
    glow: ["core", "coreRim"],
    shapes: [
      // Brass feet, crystal legs with brass knees.
      { t: "ell", c: [0.04, 0.045, 0.09], r: [0.09, 0.045, 0.06], col: "brass", mirror: true },
      { t: "cap", a: [0, 0.08, 0.085], b: [0, 0.18, 0.08], r: [0.045, 0.055], col: "crystal", mirror: true },
      dot([0.0, 0.19, 0.085], 0.045, "brass", 0.01),
      { t: "cap", a: [0, 0.2, 0.08], b: [0, 0.3, 0.07], r: [0.055, 0.065], col: "crystalDk", mirror: true },
      { t: "tor", c: [0, 0.29, 0], R: 0.12, r: 0.03, col: "brass", k: 0.01 },
      // Faceted chest: two rotated boxes give the cut-gem planes.
      { t: "box", c: [0, 0.44, 0], s: [0.13, 0.15, 0.13], round: 0.015, rot: [0, 45, 0], col: "crystal", k: 0.01 },
      { t: "box", c: [0, 0.44, 0], s: [0.15, 0.12, 0.15], round: 0.015, rot: [0, 0, 0], col: "crystalDk", k: 0.01 },
      { t: "box", c: [0.07, 0.48, 0.07], s: [0.06, 0.08, 0.01], round: 0.01, rot: [0, -45, 0], col: "crystalLt", paint: true },
      { t: "ell", c: [0.15, 0.45, 0.0], r: [0.04, 0.05, 0.05], col: "brass", k: 0.005 },
      { t: "ell", c: [0.17, 0.45, 0.0], r: [0.03, 0.04, 0.04], col: "core", k: 0.005 },
      { t: "tor", c: [0.16, 0.45, 0], R: 0.045, r: 0.008, rot: [0, 0, 90], col: "coreRim", k: 0 },
      { t: "tor", c: [0, 0.6, 0], R: 0.1, r: 0.03, col: "brass", k: 0.01 },
      // Faceted crystal head with brass ear bolts and a brass brow band.
      { t: "box", c: [0.02, 0.78, 0], s: [0.15, 0.14, 0.15], round: 0.05, rot: [0, 45, 0], col: "crystal", k: 0.01 },
      { t: "box", c: [0.02, 0.8, 0], s: [0.13, 0.12, 0.13], round: 0.04, rot: [0, 0, 0], col: "crystalDk", k: 0.01 },
      { t: "box", c: [0.02, 0.93, 0], s: [0.07, 0.04, 0.07], round: 0.02, rot: [0, 45, 0], col: "crystalLt", k: 0.02 },
      { t: "cap", a: [0.02, 0.78, 0.16], b: [0.02, 0.78, 0.21], r: [0.04, 0.03], col: "brass", mirror: true, k: 0.01 },
      { t: "tor", c: [0.02, 0.88, 0], R: 0.16, r: 0.02, col: "brass", paint: true },
      { t: "box", c: [0.07, 0.86, 0.07], s: [0.04, 0.05, 0.01], round: 0.01, rot: [0, -45, 0], col: "crystalLt", paint: true },
      // Near arm: dense, raised fist with a brass gauntlet.
      dot([0, 0.55, 0.2], 0.065, "brass", 0.02),
      { t: "cap", a: [0, 0.55, 0.22], b: [0.02, 0.44, 0.38], r: [0.055, 0.05], col: "crystal" },
      dot([0.02, 0.44, 0.38], 0.045, "brass", 0.01),
      { t: "cap", a: [0.02, 0.44, 0.38], b: [0.06, 0.66, 0.42], r: [0.05, 0.058], col: "crystalDk" },
      { t: "box", c: [0.07, 0.72, 0.42], s: [0.065, 0.065, 0.06], round: 0.03, col: "brass", k: 0.01 },
      // Far arm: light, reaching out, splitting into drifting shards.
      dot([0, 0.55, -0.2], 0.06, "brass", 0.02),
      { t: "cap", a: [0, 0.55, -0.22], b: [0.18, 0.46, -0.26], r: [0.05, 0.045], col: "crystal" },
      dot([0.18, 0.46, -0.26], 0.04, "brass", 0.01),
      { t: "cap", a: [0.18, 0.46, -0.26], b: [0.32, 0.44, -0.28], r: [0.04, 0.03], col: "crystalLt" },
      ...([[0.4, 0.46, -0.28, 0.03], [0.47, 0.52, -0.26, 0.022], [0.44, 0.38, -0.3, 0.02], [0.53, 0.44, -0.27, 0.016], [0.58, 0.55, -0.24, 0.012]] as number[][]).map(
        ([x, y, z, r], i): Shape => ({ t: "box", c: [x, y, z], s: [r, r * 1.4, r], round: 0.004, rot: [20 * i, 45, 30 + 25 * i], col: i % 2 ? "crystalLt" : "crystal", k: 0 }),
      ),
      { t: "box", c: [-0.18, 0.9, 0.1], s: [0.02, 0.03, 0.02], round: 0.004, rot: [0, 45, 20], col: "crystalLt", k: 0 },
    ],
    eyes: eyes("#3ad8e8", false, 0.77, 0.06, 0.05),
  },

  // Grajilla, la Acróbata: a circus acrobat mid-backflip, legs tucked, black suit with white harlequin
  // diamonds, a pale-grey feathered cowl like a jackdaw's nape with a swept-back feather crest, jackdaw-pale
  // eyes, a crimson sash, a short wooden stave in each hand.
  "grajilla-acrobata": {
    palette: {
      skin: "#ecc0a0", suit: "#24222a", suitLt: "#44424e", cowl: "#a4aab4", cowlDk: "#6a707a", feather: "#f4f4f2",
      sash: "#c8323a", gold: "#e8b84a", wood: "#a0703e", boots: "#1a181e", swish: "#e6e2ec", mouth: "#8a3a34", hair: "#24222a",
    },
    shapes: [
      // Swoosh of the flip, with loose feathers.
      ...arc(0.04, 0.5, -0.3, 0.5, 195, 300, 8, 0.028, "swish", 0.006, 0.01),
      ...rotZ(GRAJILLA, GR_TILT, GR_PIVOT),
      { t: "ell", c: [0.36, 0.16, 0.0], r: [0.045, 0.014, 0.012], rot: [0, 0, 30], col: "suit", k: 0 },
      { t: "ell", c: [-0.36, 0.2, 0.05], r: [0.04, 0.013, 0.012], rot: [0, 0, 60], col: "feather", k: 0 },
    ],
    eyes: [
      { at: rp([0.06, 0.7, 0.085]), r: 0.05, iris: "#c9d2da", look: rp([0.75, 0.04, 0.6], true) },
      { at: rp([0.06, 0.7, -0.045]), r: 0.046, iris: "#c9d2da", look: rp([0.97, 0.04, 0.22], true) },
    ],
  },

  // El Director Umbral: a spymaster in a long grey greatcoat with a shoulder cape and a high collar
  // up to his cheeks, wide-brimmed grey hat, gloved hand raised giving an order, a shuttered lantern low.
  "director-umbral": {
    palette: {
      skin: "#d8ae90", coat: "#6a6e78", coatDk: "#474a52", coatLt: "#8a8e98", legs: "#2e3036", boots: "#1a1a1e",
      hat: "#3a3c44", band: "#7a2a34", glove: "#1e1e24", hair: "#c4c4ca", brass: "#c9a050", flame: "#ffcc5a", light: "#fff2c0",
    },
    glow: ["flame", "light"],
    shapes: [
      { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
      // Greatcoat to the ankles.
      { t: "cap", a: [0, 0.46, 0], b: [-0.05, 0.12, 0], r: [0.15, 0.23], col: "coat", k: 0.05 },
      { t: "box", c: [0.24, 0.16, 0], s: [0.08, 0.08, 0.04], round: 0.03, rot: [0, 0, 12], col: "coat", cut: true, k: 0.03 },
      { t: "ell", c: [0, 0.43, 0], r: [0.15, 0.16, 0.18], col: "coat" },
      { t: "box", c: [0.15, 0.36, 0], s: [0.02, 0.2, 0.03], round: 0.012, col: "coatDk", paint: true },
      ...[0.46, 0.38, 0.3].map((y): Shape => dot([0.16, y, -0.04], 0.012, "coatDk")),
      { t: "tor", c: [0, 0.33, 0], R: 0.155, r: 0.02, col: "coatDk" },
      // Shoulder cape.
      { t: "ell", c: [-0.01, 0.53, 0], r: [0.19, 0.09, 0.25], col: "coatLt", k: 0.02 },
      { t: "ell", c: [-0.01, 0.46, 0], r: [0.2, 0.06, 0.25], col: "coatLt", cut: true, k: 0.02 },
      // Head, then the high collar rising round the jaw.
      { t: "ell", c: [0.02, 0.73, 0], r: [0.17, 0.165, 0.165], col: "skin", k: 0.05 },
      { t: "cap", a: [-0.01, 0.56, 0], b: [-0.03, 0.72, 0], r: [0.16, 0.185], col: "coatDk", k: 0.02 },
      { t: "ell", c: [0.24, 0.72, 0], r: [0.16, 0.11, 0.14], col: "coatDk", cut: true, k: 0.02 },
      { t: "ell", c: [-0.06, 0.74, 0], r: [0.14, 0.08, 0.17], col: "hair", k: 0.02 },
      // Wide-brimmed hat, pulled low.
      { t: "ell", c: [0.0, 0.86, 0], r: [0.3, 0.035, 0.28], rot: [0, 0, -8], col: "hat", k: 0.02 },
      { t: "cap", a: [-0.02, 0.86, 0], b: [-0.03, 1.0, 0], r: [0.16, 0.13], col: "hat", k: 0.03 },
      { t: "tor", c: [-0.02, 0.9, 0], R: 0.155, r: 0.02, col: "band", k: 0.005 },
      // Near arm raised, gloved palm up giving the order.
      ...arm(1, [0.04, 0.8, 0.46], "coat", "glove", 0.05),
      { t: "box", c: [0.05, 0.84, 0.47], s: [0.025, 0.05, 0.045], round: 0.02, rot: [0, -40, -10], col: "glove", k: 0.02 },
      ...[-0.03, -0.01, 0.01, 0.03].map((dz, i): Shape => ({ t: "cap", a: [0.06, 0.88, 0.47 + dz], b: [0.07, 0.95 - Math.abs(i - 1.5) * 0.014, 0.47 + dz * 1.3], r: [0.012, 0.01], col: "glove", k: 0.008 })),
      { t: "cap", a: [0.05, 0.82, 0.43], b: [0.1, 0.87, 0.4], r: [0.013, 0.011], col: "glove", k: 0.008 },
      // Far hand holds a lantern low and forward.
      ...arm(-1, [0.26, 0.42, -0.22], "coat", "glove", 0.05),
      { t: "tor", c: [0.26, 0.4, -0.22], R: 0.03, r: 0.007, rot: [90, 0, 0], col: "brass", k: 0 },
      { t: "cap", a: [0.26, 0.36, -0.22], b: [0.26, 0.34, -0.22], r: [0.04, 0.05], col: "brass", k: 0.005 },
      { t: "box", c: [0.26, 0.26, -0.22], s: [0.05, 0.07, 0.05], round: 0.01, col: "light", k: 0.005 },
      ...([[0.05, 0.05], [0.05, -0.05], [-0.05, 0.05], [-0.05, -0.05]] as number[][]).map(([dx, dz]): Shape => ({ t: "cap", a: [0.26 + dx, 0.19, -0.22 + dz], b: [0.26 + dx, 0.33, -0.22 + dz], r: [0.01, 0.01], col: "brass", k: 0 })),
      { t: "ell", c: [0.26, 0.26, -0.22], r: [0.025, 0.04, 0.025], col: "flame", k: 0 },
      { t: "box", c: [0.26, 0.18, -0.22], s: [0.06, 0.015, 0.06], round: 0.01, col: "brass", k: 0.005 },
    ],
    eyes: eyes("#8aa0b8", true, 0.73, 0.03, 0.048),
  },

  // Aeronave de Mando: a command airship — an oblong cream-and-teal striped balloon with tail fins,
  // a wooden hull with brass portholes slung beneath on ropes, propellers and long pennants.
  "aeronave-mando": {
    palette: {
      balloon: "#f2e8d0", stripe: "#2f8a8a", fin: "#2f8a8a", hull: "#9a6034", hullDk: "#6a3e22", deck: "#c89a62",
      brass: "#e0b04a", glass: "#bfeaf0", rope: "#5a4030", blade: "#d8cfbc", pennant: "#d23a3a", pennant2: "#f2c040", cabin: "#e8dcc0",
    },
    shapes: [
      // Balloon envelope with bands and a pointed nose.
      { t: "ell", c: [0, 0.72, 0], r: [0.55, 0.22, 0.22], col: "balloon", k: 0.02 },
      ...[-0.3, -0.1, 0.1, 0.3].map((x): Shape => ({ t: "box", c: [x, 0.72, 0], s: [0.035, 0.3, 0.3], round: 0.01, col: "stripe", paint: true })),
      { t: "ell", c: [0.0, 0.72, 0], r: [0.6, 0.03, 0.3], col: "stripe", paint: true },
      { t: "ell", c: [0.55, 0.72, 0], r: [0.03, 0.03, 0.03], col: "brass", k: 0.02 },
      // Tail fins.
      { t: "box", c: [-0.52, 0.9, 0], s: [0.1, 0.1, 0.012], round: 0.01, rot: [0, 0, -25], col: "fin", k: 0.02 },
      { t: "box", c: [-0.52, 0.72, 0], s: [0.1, 0.012, 0.18], round: 0.01, col: "fin", k: 0.02 },
      // Rigging ropes.
      ...([[0.24, 0.1], [-0.24, 0.1], [0.24, -0.1], [-0.24, -0.1], [0.0, 0.11], [0.0, -0.11]] as number[][]).map(([x, z]): Shape => ({ t: "cap", a: [x * 1.25, 0.56, z * 1.5], b: [x, 0.4, z], r: [0.009, 0.009], col: "rope", k: 0 })),
      ...shift([
      // Hull: a boat shape with a rail, cabin and portholes.
      { t: "ell", c: [0, 0.3, 0], r: [0.42, 0.14, 0.15], col: "hull", k: 0.02 },
      { t: "box", c: [0, 0.48, 0], s: [0.5, 0.15, 0.2], round: 0, col: "hull", cut: true, k: 0.01 },
      { t: "ell", c: [0, 0.22, 0], r: [0.3, 0.05, 0.1], col: "hullDk", paint: true },
      { t: "box", c: [0, 0.33, 0], s: [0.36, 0.01, 0.12], round: 0.005, col: "deck", k: 0.005 },
      ...line([[-0.34, 0.37, 0.11], [0.34, 0.37, 0.11]], 0.008, "brass", 0),
      ...line([[-0.34, 0.37, -0.11], [0.34, 0.37, -0.11]], 0.008, "brass", 0),
      ...[-0.25, -0.12, 0.0, 0.12, 0.25].map((x): Shape => ({ t: "cap", a: [x, 0.33, 0.11], b: [x, 0.37, 0.11], r: [0.006, 0.006], col: "brass", k: 0 })),
      { t: "box", c: [-0.06, 0.4, 0], s: [0.12, 0.06, 0.08], round: 0.015, col: "cabin", k: 0.005 },
      { t: "box", c: [-0.06, 0.47, 0], s: [0.14, 0.012, 0.1], round: 0.006, col: "hullDk", k: 0.005 },
      ...[-0.14, -0.06, 0.02].map((x): Shape => ({ t: "ell", c: [x, 0.41, 0.08], r: [0.022, 0.022, 0.01], col: "glass", k: 0 })),
      ...[-0.2, -0.05, 0.1, 0.24].map((x): Shape => ({ t: "ell", c: [x, 0.28, 0.12], r: [0.022, 0.022, 0.012], col: "brass", k: 0 })),
      // Stern propeller and two side propellers on outriggers.
      { t: "cap", a: [-0.36, 0.3, 0], b: [-0.44, 0.3, 0], r: [0.02, 0.015], col: "brass", k: 0.005 },
      ...propeller([-0.46, 0.3, 0], 0.14, "blade", "brass", 15),
      ...[1, -1].flatMap((s): Shape[] => [
        { t: "cap", a: [-0.1, 0.36, 0.1 * s], b: [-0.12, 0.42, 0.26 * s], r: [0.012, 0.012], col: "brass", k: 0.005 },
        { t: "cap", a: [-0.06, 0.42, 0.26 * s], b: [-0.18, 0.42, 0.26 * s], r: [0.03, 0.025], col: "brass", k: 0.01 },
        ...propeller([-0.2, 0.42, 0.26 * s], 0.09, "blade", "brass", 60),
      ]),
      ], [0, 0.07, 0]),
      // Bowsprit with a pennant, mast flag on the balloon.
      { t: "cap", a: [0.38, 0.4, 0], b: [0.56, 0.46, 0], r: [0.014, 0.008], col: "hullDk", k: 0.005 },
      { t: "cap", a: [0.5, 0.44, 0], b: [0.5, 0.56, 0], r: [0.007, 0.007], col: "hullDk", k: 0 },
      { t: "cap", a: [0.5, 0.55, 0], b: [0.36, 0.53, 0.02], r: [0.025, 0.004], col: "pennant2", k: 0.01 },
      { t: "cap", a: [0.0, 0.92, 0], b: [0.0, 1.08, 0], r: [0.008, 0.008], col: "hullDk", k: 0 },
      { t: "cap", a: [0.0, 1.06, 0], b: [-0.2, 1.03, 0], r: [0.03, 0.004], col: "pennant", k: 0.01 },
      { t: "cap", a: [-0.2, 1.03, 0], b: [-0.3, 1.06, 0], r: [0.008, 0.002], col: "pennant", k: 0.01 },
      { t: "cap", a: [-0.6, 0.98, 0], b: [-0.78, 0.96, 0], r: [0.025, 0.004], col: "pennant2", k: 0.01 },
    ],
    eyes: [],
  },
};
