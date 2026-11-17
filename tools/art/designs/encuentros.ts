import type { Sculpt, Shape, V3 } from "../sculpt";

// Villains' treacheries, side schemes and attachments: one iconic object each.
// Morvath = fire/ash (reds, black) · Vesperia = sea (teals, deep blue) · Gorvak = iron (steel, rust)
// · moon cult = violet/silver · shared = dark purple.

const rad = (d: number) => (d * Math.PI) / 180;

/** An upright gear facing the camera (axis along z). */
function gear(cx: number, cy: number, R: number, teeth: number, col: string, hub: string, z = 0, phase = 0): Shape[] {
  const out: Shape[] = [
    { t: "tor", c: [cx, cy, z], R: R * 0.78, r: R * 0.22, rot: [90, 0, 0], col, k: 0.02 },
    { t: "cap", a: [cx, cy, z - R * 0.16], b: [cx, cy, z + R * 0.16], r: [R * 0.32, R * 0.32], col: hub, k: 0.02 },
    { t: "box", c: [cx, cy, z], s: [R * 0.75, R * 0.09, R * 0.1], round: 0.01, col, k: 0.02 },
    { t: "box", c: [cx, cy, z], s: [R * 0.09, R * 0.75, R * 0.1], round: 0.01, col, k: 0.02 },
  ];
  for (let i = 0; i < teeth; i++) {
    const th = phase + (360 / teeth) * i;
    out.push({
      t: "box", c: [cx + R * 1.02 * Math.cos(rad(th)), cy + R * 1.02 * Math.sin(rad(th)), z],
      s: [R * 0.14, R * 0.16, R * 0.17], round: 0.015, rot: [0, 0, th - 90], col, k: 0.015,
    });
  }
  return out;
}

/** A flame tongue: wide base tapering upward. */
const flame = (a: V3, b: V3, r: number, col = "fire", k = 0.05): Shape => ({ t: "cap", a, b, r: [r, r * 0.12], col, k });

/** A candle with its flame at (x, z). */
function candle(x: number, z: number, h: number, wax: string): Shape[] {
  return [
    { t: "cap", a: [x, 0.06, z], b: [x, 0.06 + h, z], r: [0.045, 0.04], col: wax, k: 0.01 },
    { t: "ell", c: [x, 0.11 + h, z], r: [0.035, 0.06, 0.035], col: "flame", k: 0 },
  ];
}

export const encuentros: Record<string, Sculpt> = {
  // Lluvia de Brasas: a blazing meteor plunging down with a fiery tail and loose embers.
  "lluvia-brasas": {
    palette: { rock: "#3a2a2e", crack: "#ff7a2a", fire: "#ff9a2e", hot: "#ffe066", ember: "#ff5a2a", ash: "#5a4448" },
    glow: ["crack", "fire", "hot", "ember"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.36, 0.04, 0.3], col: "ash", k: 0.02 },
      flame([0.0, 0.46, -0.04], [-0.36, 1.0, -0.04], 0.17, "fire", 0.08),
      flame([0.02, 0.46, 0.06], [-0.14, 1.02, 0.1], 0.12, "fire", 0.06),
      flame([0.0, 0.42, -0.12], [-0.44, 0.84, -0.2], 0.12, "fire", 0.06),
      flame([-0.02, 0.5, 0.02], [-0.24, 0.86, 0.04], 0.1, "hot", 0.06),
      { t: "ell", c: [0.16, 0.3, 0], r: [0.24, 0.22, 0.22], rot: [0, 0, -25], col: "rock", k: 0.03 },
      { t: "ell", c: [0.24, 0.24, 0.08], r: [0.08, 0.07, 0.07], col: "rock", k: 0.04 },
      { t: "ell", c: [0.05, 0.22, 0.12], r: [0.08, 0.07, 0.08], col: "rock", k: 0.04 },
      { t: "cap", a: [0.06, 0.42, 0.18], b: [0.24, 0.3, 0.16], r: [0.025, 0.02], col: "crack", paint: true },
      { t: "cap", a: [0.14, 0.32, 0.2], b: [0.16, 0.18, 0.15], r: [0.025, 0.02], col: "crack", paint: true },
      { t: "cap", a: [0.28, 0.4, 0.1], b: [0.34, 0.26, 0.08], r: [0.025, 0.02], col: "crack", paint: true },
      { t: "ell", c: [-0.28, 0.3, 0.16], r: [0.06, 0.06, 0.06], col: "ember", k: 0 },
      flame([-0.28, 0.3, 0.16], [-0.42, 0.48, 0.16], 0.05, "fire", 0.03),
      { t: "ell", c: [0.36, 0.72, -0.06], r: [0.05, 0.05, 0.05], col: "ember", k: 0 },
      flame([0.36, 0.72, -0.06], [0.24, 0.9, -0.06], 0.04, "fire", 0.03),
      { t: "ell", c: [-0.4, 0.12, -0.12], r: [0.05, 0.05, 0.05], col: "ember", k: 0 },
    ],
    eyes: [],
  },

  // Orden del Rey: a royal decree scroll in black rollers, sealed with a red flame-wax seal.
  "orden-del-rey": {
    palette: { paper: "#f3dfae", ink: "#6b3a2a", roll: "#2a1e22", gold: "#f2b632", wax: "#d4262c", flame: "#ffb02e", ribbon: "#a31d2a" },
    glow: ["flame"],
    shapes: [
      { t: "box", c: [0, 0.52, 0], s: [0.3, 0.36, 0.025], round: 0.02, col: "paper", k: 0.02 },
      { t: "cap", a: [-0.36, 0.9, 0], b: [0.36, 0.9, 0], r: [0.07, 0.07], col: "roll", k: 0.03 },
      { t: "cap", a: [-0.36, 0.14, 0], b: [0.36, 0.14, 0], r: [0.07, 0.07], col: "roll", k: 0.03 },
      { t: "ell", c: [-0.42, 0.9, 0], r: [0.05, 0.06, 0.06], col: "gold", k: 0.02 },
      { t: "ell", c: [0.42, 0.9, 0], r: [0.05, 0.06, 0.06], col: "gold", k: 0.02 },
      { t: "ell", c: [-0.42, 0.14, 0], r: [0.05, 0.06, 0.06], col: "gold", k: 0.02 },
      { t: "ell", c: [0.42, 0.14, 0], r: [0.05, 0.06, 0.06], col: "gold", k: 0.02 },
      { t: "box", c: [0, 0.76, 0.03], s: [0.2, 0.018, 0.03], round: 0.01, col: "ink", paint: true },
      { t: "box", c: [-0.03, 0.68, 0.03], s: [0.22, 0.012, 0.03], round: 0.008, col: "ink", paint: true },
      { t: "box", c: [0.02, 0.62, 0.03], s: [0.2, 0.012, 0.03], round: 0.008, col: "ink", paint: true },
      { t: "box", c: [-0.04, 0.56, 0.03], s: [0.18, 0.012, 0.03], round: 0.008, col: "ink", paint: true },
      { t: "box", c: [0.1, 0.42, 0.03], s: [0.1, 0.012, 0.03], round: 0.008, col: "ink", paint: true },
      { t: "cap", a: [-0.02, 0.36, 0.03], b: [-0.1, 0.12, 0.05], r: [0.035, 0.03], col: "ribbon", k: 0.01 },
      { t: "cap", a: [0.02, 0.36, 0.03], b: [0.12, 0.1, 0.05], r: [0.035, 0.03], col: "ribbon", k: 0.01 },
      { t: "ell", c: [0, 0.36, 0.05], r: [0.12, 0.12, 0.045], col: "wax", k: 0.02 },
      { t: "ell", c: [0.09, 0.42, 0.05], r: [0.04, 0.04, 0.035], col: "wax", k: 0.03 },
      { t: "ell", c: [-0.08, 0.29, 0.05], r: [0.04, 0.04, 0.035], col: "wax", k: 0.03 },
      { t: "ell", c: [0, 0.34, 0.1], r: [0.035, 0.045, 0.03], col: "flame", paint: true },
      { t: "cap", a: [0, 0.36, 0.1], b: [0, 0.44, 0.1], r: [0.025, 0.006], col: "flame", paint: true },
      { t: "cap", a: [-0.04, 0.34, 0.1], b: [-0.06, 0.41, 0.1], r: [0.018, 0.006], col: "flame", paint: true },
      { t: "cap", a: [0.04, 0.34, 0.1], b: [0.06, 0.41, 0.1], r: [0.018, 0.006], col: "flame", paint: true },
    ],
    eyes: [],
  },

  // Torre en Llamas: a stone watchtower with crenellations, fire bursting from its top and window.
  "torre-llamas": {
    palette: { stone: "#9a8f8a", dark: "#5e5452", fire: "#ff7a1f", hot: "#ffd23a", win: "#ffb02e", base: "#6b5e58" },
    glow: ["fire", "hot", "win"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.3, 0.05, 0.3], col: "base", k: 0.02 },
      { t: "cap", a: [0, 0.05, 0], b: [0, 0.6, 0], r: [0.22, 0.18], col: "stone", k: 0.03 },
      { t: "cap", a: [0, 0.6, 0], b: [0, 0.66, 0], r: [0.23, 0.23], col: "stone", k: 0.02 },
      ...[0, 60, 120, 180, 240, 300].map((d): Shape => ({
        t: "box", c: [0.2 * Math.cos(rad(d)), 0.72, 0.2 * Math.sin(rad(d))], s: [0.055, 0.06, 0.055], round: 0.015,
        rot: [0, -d, 0], col: "stone", k: 0.015,
      })),
      { t: "box", c: [0, 0.22, 0], s: [0.25, 0.02, 0.25], round: 0.01, rot: [0, 45, 0], col: "dark", paint: true },
      { t: "box", c: [0, 0.4, 0], s: [0.25, 0.015, 0.25], round: 0.01, col: "dark", paint: true },
      { t: "box", c: [0.17, 0.12, 0.08], s: [0.06, 0.05, 0.05], round: 0.02, col: "dark", paint: true },
      { t: "box", c: [-0.06, 0.3, 0.19], s: [0.05, 0.04, 0.04], round: 0.02, col: "dark", paint: true },
      { t: "cap", a: [0.12, 0.42, 0.14], b: [0.12, 0.5, 0.14], r: [0.05, 0.05], col: "win", cut: true, k: 0.01 },
      { t: "cap", a: [0.12, 0.42, 0.13], b: [0.12, 0.5, 0.13], r: [0.04, 0.04], col: "win", k: 0 },
      flame([0.14, 0.48, 0.16], [0.34, 0.66, 0.24], 0.06, "fire", 0.03),
      flame([0, 0.7, 0], [0.02, 1.25, 0], 0.24, "fire", 0.1),
      flame([0.12, 0.7, 0.08], [0.32, 1.08, 0.16], 0.14, "fire", 0.08),
      flame([-0.12, 0.7, -0.06], [-0.34, 1.06, -0.12], 0.14, "fire", 0.08),
      flame([-0.06, 0.7, 0.14], [-0.2, 1.0, 0.26], 0.12, "fire", 0.08),
      flame([0.02, 0.72, 0.1], [0.06, 1.08, 0.14], 0.15, "hot", 0.08),
    ],
    eyes: [],
  },

  // Corona de Ascuas: a black iron crown whose points end in glowing embers, ruby gems on the band.
  "corona-ascuas": {
    palette: { iron: "#2e2428", trim: "#c2402a", gem: "#ff2e3e", fire: "#ff8a1f", hot: "#ffe066", cushion: "#7a1f2e" },
    glow: ["fire", "hot", "gem"],
    shapes: [
      { t: "ell", c: [0, 0.08, 0], r: [0.44, 0.08, 0.44], col: "cushion", k: 0.03 },
      { t: "tor", c: [0, 0.22, 0], R: 0.31, r: 0.06, col: "iron", k: 0.04 },
      { t: "tor", c: [0, 0.3, 0], R: 0.31, r: 0.06, col: "iron", k: 0.04 },
      { t: "tor", c: [0, 0.37, 0], R: 0.31, r: 0.05, col: "trim", k: 0.03 },
      ...[30, 90, 150, 210, 270, 330].flatMap((d): Shape[] => {
        const x = 0.31 * Math.cos(rad(d)), z = 0.31 * Math.sin(rad(d));
        return [
          { t: "cap", a: [x, 0.38, z], b: [x * 1.08, 0.66, z * 1.08], r: [0.07, 0.02], col: "iron", k: 0.03 },
          flame([x * 1.08, 0.64, z * 1.08], [x * 1.12, 0.84, z * 1.12], 0.055, "fire", 0.03),
          { t: "ell", c: [x * 1.06, 0.29, z * 1.06], r: [0.04, 0.045, 0.04], col: "gem", k: 0.01 },
        ];
      }),
      flame([0, 0.12, 0], [0, 0.5, 0], 0.16, "hot", 0.04),
    ],
    eyes: [],
  },

  // Niebla Sombría: a creeping violet fog cloud with glaring yellow eyes and wispy tendrils.
  "niebla-sombria": {
    palette: { fog: "#6a5a9a", deep: "#45386e", wisp: "#8f80c2", mouth: "#1e1430" },
    shapes: [
      { t: "ell", c: [0, 0.5, 0], r: [0.32, 0.26, 0.28], col: "fog", k: 0.1 },
      { t: "ell", c: [-0.2, 0.62, 0.05], r: [0.2, 0.18, 0.2], col: "fog", k: 0.1 },
      { t: "ell", c: [0.1, 0.72, -0.05], r: [0.2, 0.18, 0.2], col: "wisp", k: 0.1 },
      { t: "ell", c: [-0.3, 0.42, -0.1], r: [0.18, 0.16, 0.18], col: "deep", k: 0.1 },
      { t: "ell", c: [0.3, 0.38, -0.08], r: [0.16, 0.15, 0.16], col: "deep", k: 0.1 },
      { t: "ell", c: [-0.1, 0.4, 0.2], r: [0.16, 0.14, 0.12], col: "fog", k: 0.1 },
      { t: "cap", a: [0.1, 0.3, 0.1], b: [0.36, 0.06, 0.18], r: [0.09, 0.03], col: "deep", k: 0.08 },
      { t: "cap", a: [-0.05, 0.28, 0.12], b: [-0.08, 0.04, 0.28], r: [0.08, 0.03], col: "deep", k: 0.08 },
      { t: "cap", a: [-0.25, 0.3, 0], b: [-0.46, 0.08, 0.06], r: [0.08, 0.03], col: "deep", k: 0.08 },
      { t: "cap", a: [0.15, 0.3, -0.15], b: [0.2, 0.05, -0.32], r: [0.08, 0.03], col: "deep", k: 0.08 },
      { t: "ell", c: [0.24, 0.42, 0.2], r: [0.12, 0.035, 0.12], rot: [0, 30, 0], col: "mouth", paint: true },
      { t: "ell", c: [0.42, 0.62, 0.0], r: [0.06, 0.06, 0.06], col: "wisp", k: 0.08 },
      { t: "ell", c: [-0.42, 0.7, 0.0], r: [0.07, 0.06, 0.07], col: "wisp", k: 0.08 },
    ],
    eyes: [{ at: [0.15, 0.56, 0.1], r: 0.075, iris: "#ffd23a", mirror: true, angry: true }],
  },

  // Santuario Profanado: a small stone shrine, cracked and dripping dark purple corruption around a fouled orb.
  "santuario-profanado": {
    palette: { stone: "#c9bfae", dark: "#8a7f72", roof: "#7a8a6a", goo: "#4a2a6a", orb: "#a64dff", crack: "#2a1838", gold: "#d8b04a" },
    glow: ["orb"],
    shapes: [
      { t: "box", c: [0, 0.06, 0], s: [0.38, 0.06, 0.3], round: 0.03, col: "dark", k: 0.02 },
      { t: "box", c: [0, 0.15, 0], s: [0.32, 0.04, 0.25], round: 0.02, col: "stone", k: 0.02 },
      { t: "cap", a: [-0.24, 0.18, 0.17], b: [-0.24, 0.66, 0.17], r: [0.05, 0.045], col: "stone", k: 0.02, mirror: true },
      { t: "cap", a: [0.24, 0.18, 0.17], b: [0.24, 0.6, 0.17], r: [0.05, 0.045], col: "stone", k: 0.02, mirror: true },
      { t: "box", c: [0.24, 0.66, 0.1], s: [0.07, 0.05, 0.16], round: 0.02, rot: [0, 0, 25], col: "stone", k: 0.02 },
      { t: "box", c: [-0.18, 0.78, 0], s: [0.26, 0.03, 0.3], round: 0.02, rot: [0, 0, 30], col: "roof", k: 0.02 },
      { t: "box", c: [0.16, 0.78, 0], s: [0.24, 0.03, 0.3], round: 0.02, rot: [0, 0, -38], col: "roof", k: 0.02 },
      { t: "ell", c: [0, 0.94, 0], r: [0.05, 0.05, 0.05], col: "gold", k: 0.02 },
      { t: "box", c: [0, 0.27, 0], s: [0.12, 0.08, 0.1], round: 0.02, col: "stone", k: 0.02 },
      { t: "ell", c: [0, 0.44, 0], r: [0.11, 0.11, 0.11], col: "orb", k: 0.01 },
      { t: "cap", a: [-0.04, 0.52, 0.1], b: [0.03, 0.42, 0.1], r: [0.015, 0.012], col: "crack", paint: true },
      { t: "cap", a: [0.03, 0.42, 0.1], b: [-0.02, 0.36, 0.1], r: [0.015, 0.012], col: "crack", paint: true },
      { t: "ell", c: [-0.1, 0.84, 0.05], r: [0.14, 0.04, 0.3], rot: [0, 0, 30], col: "goo", k: 0.03 },
      { t: "cap", a: [-0.2, 0.74, 0.25], b: [-0.21, 0.6, 0.27], r: [0.03, 0.035], col: "goo", k: 0.03 },
      { t: "cap", a: [-0.3, 0.68, 0.2], b: [-0.31, 0.52, 0.22], r: [0.025, 0.03], col: "goo", k: 0.03 },
      { t: "ell", c: [0, 0.34, 0.08], r: [0.1, 0.03, 0.04], col: "goo", k: 0.03 },
      { t: "cap", a: [0.05, 0.34, 0.1], b: [0.06, 0.22, 0.11], r: [0.025, 0.03], col: "goo", k: 0.03 },
      { t: "ell", c: [0.1, 0.2, 0.18], r: [0.14, 0.02, 0.1], col: "goo", k: 0.03 },
      { t: "cap", a: [-0.3, 0.1, 0.31], b: [-0.18, 0.12, 0.31], r: [0.012, 0.012], col: "crack", paint: true },
      { t: "cap", a: [0.24, 0.5, 0.22], b: [0.2, 0.38, 0.22], r: [0.012, 0.012], col: "crack", paint: true },
    ],
    eyes: [],
  },

  // Avance Oscuro: a tattered dark purple war banner on a spear, its sigil burning, thrust forward.
  "avance-oscuro": {
    palette: { pole: "#3a2a24", tip: "#b8bcc8", cloth: "#4a2a6e", hem: "#2a1840", sigil: "#ff6a2a", gold: "#d8a840" },
    glow: ["sigil"],
    shapes: [
      { t: "ell", c: [-0.05, 0.03, 0], r: [0.16, 0.035, 0.14], col: "pole", k: 0.02 },
      { t: "cap", a: [-0.12, 0.03, 0], b: [0.16, 1.0, 0], r: [0.03, 0.025], col: "pole", k: 0.01 },
      { t: "ell", c: [0.165, 1.02, 0], r: [0.04, 0.03, 0.04], col: "gold", k: 0.01 },
      { t: "cap", a: [0.17, 1.04, 0], b: [0.25, 1.24, 0], r: [0.06, 0.008], col: "tip", k: 0.01 },
      { t: "cap", a: [0.06, 0.92, 0], b: [0.24, 0.98, 0], r: [0.025, 0.025], col: "gold", k: 0.01 },
      { t: "box", c: [-0.1, 0.72, 0], s: [0.22, 0.24, 0.025], round: 0.02, rot: [0, 0, 16], col: "cloth", k: 0.02 },
      { t: "cap", a: [-0.26, 0.62, 0], b: [-0.3, 0.4, 0.02], r: [0.05, 0.02], col: "hem", k: 0.03 },
      { t: "cap", a: [-0.16, 0.6, 0], b: [-0.19, 0.34, -0.02], r: [0.06, 0.02], col: "hem", k: 0.03 },
      { t: "cap", a: [-0.05, 0.6, 0], b: [-0.05, 0.42, 0.02], r: [0.05, 0.02], col: "hem", k: 0.03 },
      { t: "box", c: [-0.3, 0.78, 0], s: [0.03, 0.2, 0.03], round: 0.02, rot: [0, 0, 16], col: "hem", k: 0.02 },
      { t: "ell", c: [-0.1, 0.7, 0.04], r: [0.09, 0.09, 0.03], col: "sigil", paint: true },
      { t: "ell", c: [-0.1, 0.7, 0.05], r: [0.05, 0.05, 0.03], col: "hem", paint: true },
      { t: "cap", a: [-0.14, 0.78, 0.05], b: [-0.08, 0.86, 0.05], r: [0.025, 0.008], col: "sigil", paint: true },
      { t: "cap", a: [-0.04, 0.74, 0.05], b: [0.02, 0.84, 0.05], r: [0.025, 0.008], col: "sigil", paint: true },
    ],
    eyes: [],
  },

  // Emboscada: two crossed daggers over a dark bush where hidden eyes glare.
  emboscada: {
    palette: { blade: "#d6dbe6", edge: "#8a93a6", grip: "#3a2a3a", guard: "#6a3d8a", bush: "#2f4a3a", leaf: "#3f6a48" },
    shapes: [
      { t: "ell", c: [0, 0.16, 0], r: [0.4, 0.18, 0.26], col: "bush", k: 0.08 },
      { t: "ell", c: [-0.22, 0.24, -0.06], r: [0.18, 0.16, 0.18], col: "leaf", k: 0.08 },
      { t: "ell", c: [0.24, 0.22, -0.06], r: [0.17, 0.15, 0.17], col: "leaf", k: 0.08 },
      { t: "ell", c: [0.02, 0.3, -0.04], r: [0.2, 0.14, 0.18], col: "leaf", k: 0.08 },
      // Dagger 1: grip lower-left, point upper-right.
      { t: "box", c: [0.1, 0.72, -0.08], s: [0.05, 0.25, 0.022], round: 0.02, rot: [0, 0, -35], col: "blade", k: 0.01 },
      { t: "cap", a: [0.235, 0.9, -0.08], b: [0.31, 1.0, -0.08], r: [0.04, 0.005], col: "blade", k: 0.01 },
      { t: "box", c: [-0.05, 0.5, -0.08], s: [0.12, 0.025, 0.035], round: 0.02, rot: [0, 0, -35], col: "guard", k: 0.01 },
      { t: "cap", a: [-0.07, 0.48, -0.08], b: [-0.17, 0.34, -0.08], r: [0.035, 0.035], col: "grip", k: 0.01 },
      { t: "ell", c: [-0.19, 0.31, -0.08], r: [0.045, 0.045, 0.045], col: "guard", k: 0.01 },
      // Dagger 2: grip lower-right, point upper-left.
      { t: "box", c: [-0.1, 0.72, 0.08], s: [0.05, 0.25, 0.022], round: 0.02, rot: [0, 0, 35], col: "blade", k: 0.01 },
      { t: "cap", a: [-0.235, 0.9, 0.08], b: [-0.31, 1.0, 0.08], r: [0.04, 0.005], col: "blade", k: 0.01 },
      { t: "box", c: [0.05, 0.5, 0.08], s: [0.12, 0.025, 0.035], round: 0.02, rot: [0, 0, 35], col: "guard", k: 0.01 },
      { t: "cap", a: [0.07, 0.48, 0.08], b: [0.17, 0.34, 0.08], r: [0.035, 0.035], col: "grip", k: 0.01 },
      { t: "ell", c: [0.19, 0.31, 0.08], r: [0.045, 0.045, 0.045], col: "guard", k: 0.01 },
      { t: "box", c: [0.1, 0.72, -0.05], s: [0.012, 0.22, 0.01], round: 0.005, rot: [0, 0, -35], col: "edge", paint: true },
      { t: "box", c: [-0.1, 0.72, 0.11], s: [0.012, 0.22, 0.01], round: 0.005, rot: [0, 0, 35], col: "edge", paint: true },
    ],
    eyes: [
      { at: [0.02, 0.2, 0.0], r: 0.06, iris: "#ff3a3a", angry: true, look: [0.3, 0, 1] },
      { at: [0.17, 0.2, 0.0], r: 0.06, iris: "#ff3a3a", angry: true, look: [0.3, 0, 1] },
    ],
  },

  // Ola Gélida: a curling teal wave frozen into ice spikes with a frosty white crest.
  "ola-gelida": {
    palette: { sea: "#1f7fa8", deep: "#16507a", ice: "#bff4ff", foam: "#f4fdff", shard: "#7fe0f0" },
    glow: ["shard"],
    shapes: [
      { t: "ell", c: [-0.05, 0.14, 0], r: [0.44, 0.14, 0.3], col: "deep", k: 0.06 },
      { t: "ell", c: [-0.12, 0.34, 0], r: [0.3, 0.3, 0.26], col: "sea", k: 0.1 },
      { t: "cap", a: [-0.22, 0.4, 0], b: [-0.08, 0.82, 0], r: [0.22, 0.17], col: "sea", k: 0.1 },
      { t: "cap", a: [-0.08, 0.82, 0], b: [0.22, 0.82, 0], r: [0.17, 0.11], col: "sea", k: 0.08 },
      { t: "cap", a: [0.22, 0.82, 0], b: [0.32, 0.62, 0], r: [0.11, 0.05], col: "foam", k: 0.06 },
      { t: "ell", c: [0.12, 0.52, 0], r: [0.14, 0.12, 0.34], col: "sea", cut: true, k: 0.06 },
      { t: "ell", c: [-0.06, 0.92, 0], r: [0.22, 0.08, 0.2], col: "foam", paint: true },
      { t: "ell", c: [0.2, 0.9, 0], r: [0.12, 0.06, 0.14], col: "foam", paint: true },
      { t: "cap", a: [-0.15, 0.92, 0.05], b: [-0.2, 1.12, 0.06], r: [0.05, 0.008], col: "ice", k: 0.02 },
      { t: "cap", a: [0.0, 0.94, -0.04], b: [0.02, 1.12, -0.06], r: [0.045, 0.008], col: "ice", k: 0.02 },
      { t: "cap", a: [0.14, 0.9, 0.06], b: [0.24, 1.04, 0.1], r: [0.04, 0.008], col: "ice", k: 0.02 },
      { t: "cap", a: [-0.3, 0.8, 0.0], b: [-0.42, 0.94, 0.0], r: [0.045, 0.008], col: "ice", k: 0.02 },
      { t: "cap", a: [0.3, 0.64, 0.02], b: [0.36, 0.5, 0.04], r: [0.035, 0.008], col: "ice", k: 0.02 },
      { t: "cap", a: [0.32, 0.14, 0.12], b: [0.46, 0.34, 0.16], r: [0.05, 0.008], col: "shard", k: 0.02 },
      { t: "cap", a: [0.26, 0.12, -0.14], b: [0.36, 0.3, -0.2], r: [0.045, 0.008], col: "shard", k: 0.02 },
      { t: "cap", a: [-0.4, 0.12, 0.14], b: [-0.5, 0.3, 0.18], r: [0.045, 0.008], col: "shard", k: 0.02 },
      { t: "ell", c: [0.36, 0.06, 0.12], r: [0.12, 0.05, 0.1], col: "foam", k: 0.04 },
      { t: "ell", c: [-0.2, 0.36, 0.22], r: [0.12, 0.04, 0.04], rot: [0, 0, 20], col: "ice", paint: true },
    ],
    eyes: [],
  },

  // Canto de Sirena: a seashell lyre with glowing strings, musical notes drifting from it.
  "canto-sirena": {
    palette: { shell: "#ffc2c8", rim: "#f08aa0", pearl: "#f6f2ff", string: "#7ffff0", note: "#3ae0d0", base: "#1f6f8a" },
    glow: ["string", "note"],
    shapes: [
      { t: "ell", c: [-0.06, 0.05, 0], r: [0.24, 0.05, 0.18], col: "base", k: 0.02 },
      { t: "ell", c: [-0.06, 0.16, 0], r: [0.17, 0.12, 0.08], col: "shell", k: 0.04 },
      { t: "box", c: [-0.06, 0.16, 0.07], s: [0.012, 0.1, 0.02], round: 0.006, col: "rim", paint: true },
      { t: "box", c: [-0.12, 0.16, 0.07], s: [0.012, 0.09, 0.02], round: 0.006, rot: [0, 0, 15], col: "rim", paint: true },
      { t: "box", c: [0.0, 0.16, 0.07], s: [0.012, 0.09, 0.02], round: 0.006, rot: [0, 0, -15], col: "rim", paint: true },
      { t: "cap", a: [-0.18, 0.2, 0], b: [-0.3, 0.48, 0], r: [0.05, 0.045], col: "shell", k: 0.04 },
      { t: "cap", a: [-0.3, 0.48, 0], b: [-0.24, 0.74, 0], r: [0.045, 0.04], col: "shell", k: 0.04 },
      { t: "cap", a: [-0.24, 0.74, 0], b: [-0.32, 0.86, 0], r: [0.04, 0.03], col: "shell", k: 0.04 },
      { t: "cap", a: [0.06, 0.2, 0], b: [0.18, 0.48, 0], r: [0.05, 0.045], col: "shell", k: 0.04 },
      { t: "cap", a: [0.18, 0.48, 0], b: [0.12, 0.74, 0], r: [0.045, 0.04], col: "shell", k: 0.04 },
      { t: "cap", a: [0.12, 0.74, 0], b: [0.2, 0.86, 0], r: [0.04, 0.03], col: "shell", k: 0.04 },
      { t: "ell", c: [-0.33, 0.87, 0], r: [0.04, 0.04, 0.04], col: "pearl", k: 0.02 },
      { t: "ell", c: [0.21, 0.87, 0], r: [0.04, 0.04, 0.04], col: "pearl", k: 0.02 },
      { t: "cap", a: [-0.26, 0.7, 0], b: [0.14, 0.7, 0], r: [0.035, 0.035], col: "rim", k: 0.02 },
      { t: "ell", c: [-0.06, 0.72, 0.02], r: [0.045, 0.045, 0.04], col: "pearl", k: 0.02 },
      ...[-0.16, -0.09, -0.02, 0.05].map((x): Shape => ({ t: "cap", a: [x, 0.27, 0], b: [x, 0.68, 0], r: [0.016, 0.016], col: "string", k: 0.005 })),
      { t: "ell", c: [0.36, 0.62, 0.08], r: [0.06, 0.045, 0.04], rot: [0, 0, 20], col: "note", k: 0 },
      { t: "cap", a: [0.41, 0.63, 0.08], b: [0.41, 0.84, 0.08], r: [0.018, 0.018], col: "note", k: 0.01 },
      { t: "cap", a: [0.41, 0.84, 0.08], b: [0.48, 0.76, 0.08], r: [0.02, 0.016], col: "note", k: 0.01 },
      { t: "ell", c: [0.38, 0.32, -0.04], r: [0.05, 0.04, 0.035], rot: [0, 0, 20], col: "note", k: 0 },
      { t: "ell", c: [0.52, 0.38, -0.04], r: [0.05, 0.04, 0.035], rot: [0, 0, 20], col: "note", k: 0 },
      { t: "cap", a: [0.42, 0.33, -0.04], b: [0.42, 0.5, -0.04], r: [0.016, 0.016], col: "note", k: 0.01 },
      { t: "cap", a: [0.56, 0.39, -0.04], b: [0.56, 0.56, -0.04], r: [0.016, 0.016], col: "note", k: 0.01 },
      { t: "cap", a: [0.42, 0.5, -0.04], b: [0.56, 0.56, -0.04], r: [0.022, 0.022], col: "note", k: 0.01 },
    ],
    eyes: [],
  },

  // Puerto Inundado: a heavy ship's anchor half-sunk in surging teal waves beside a broken pier post.
  "puerto-inundado": {
    palette: { iron: "#4a5a6a", rust: "#b0603a", sea: "#1f8fb0", deep: "#155a85", foam: "#f0fbff", wood: "#7a5232", rope: "#d8b878" },
    shapes: [
      { t: "ell", c: [0, 0.1, 0], r: [0.46, 0.11, 0.34], col: "deep", k: 0.05 },
      { t: "cap", a: [0, 0.18, 0], b: [0, 0.82, 0], r: [0.055, 0.05], col: "iron", k: 0.02 },
      { t: "tor", c: [0, 0.9, 0], R: 0.07, r: 0.025, rot: [90, 0, 0], col: "iron", k: 0.02 },
      { t: "cap", a: [-0.2, 0.72, 0], b: [0.2, 0.72, 0], r: [0.04, 0.04], col: "iron", k: 0.02 },
      { t: "ell", c: [-0.22, 0.72, 0], r: [0.04, 0.05, 0.05], col: "rust", k: 0.02 },
      { t: "ell", c: [0.22, 0.72, 0], r: [0.04, 0.05, 0.05], col: "rust", k: 0.02 },
      { t: "cap", a: [0, 0.22, 0], b: [-0.2, 0.3, 0], r: [0.05, 0.045], col: "iron", k: 0.03 },
      { t: "cap", a: [-0.2, 0.3, 0], b: [-0.3, 0.46, 0], r: [0.045, 0.035], col: "iron", k: 0.03 },
      { t: "cap", a: [0, 0.22, 0], b: [0.2, 0.3, 0], r: [0.05, 0.045], col: "iron", k: 0.03 },
      { t: "cap", a: [0.2, 0.3, 0], b: [0.3, 0.46, 0], r: [0.045, 0.035], col: "iron", k: 0.03 },
      { t: "cap", a: [-0.28, 0.42, 0], b: [-0.34, 0.54, 0], r: [0.07, 0.01], col: "iron", k: 0.02 },
      { t: "cap", a: [0.28, 0.42, 0], b: [0.34, 0.54, 0], r: [0.07, 0.01], col: "iron", k: 0.02 },
      { t: "ell", c: [0.04, 0.5, 0.05], r: [0.04, 0.05, 0.02], col: "rust", paint: true },
      { t: "ell", c: [-0.08, 0.26, 0.05], r: [0.05, 0.03, 0.02], col: "rust", paint: true },
      { t: "tor", c: [0, 0.62, 0], R: 0.07, r: 0.025, col: "rope", k: 0.01 },
      { t: "cap", a: [-0.34, 0.1, -0.16], b: [-0.36, 0.62, -0.18], r: [0.06, 0.055], col: "wood", k: 0.02 },
      { t: "cap", a: [-0.38, 0.62, -0.18], b: [-0.3, 0.66, -0.18], r: [0.06, 0.03], col: "wood", cut: true, k: 0.01 },
      { t: "ell", c: [0.2, 0.22, 0.12], r: [0.2, 0.1, 0.12], col: "sea", k: 0.06 },
      { t: "cap", a: [0.24, 0.28, 0.12], b: [0.4, 0.42, 0.12], r: [0.09, 0.05], col: "sea", k: 0.06 },
      { t: "cap", a: [0.4, 0.42, 0.12], b: [0.44, 0.32, 0.14], r: [0.05, 0.02], col: "foam", k: 0.04 },
      { t: "ell", c: [-0.22, 0.22, 0.16], r: [0.2, 0.09, 0.1], col: "sea", k: 0.06 },
      { t: "cap", a: [-0.26, 0.26, 0.16], b: [-0.42, 0.38, 0.16], r: [0.08, 0.04], col: "sea", k: 0.06 },
      { t: "cap", a: [-0.42, 0.38, 0.16], b: [-0.46, 0.28, 0.18], r: [0.045, 0.02], col: "foam", k: 0.04 },
      { t: "ell", c: [0, 0.2, 0], r: [0.46, 0.04, 0.34], col: "foam", paint: true },
    ],
    eyes: [],
  },

  // Tridente Abisal: a deep-sea trident with barbed prongs, a glowing abyssal pearl and kelp twined up the shaft.
  "tridente-abisal": {
    palette: { metal: "#2f7a8a", dark: "#1a3a5a", gold: "#e0c060", pearl: "#5affea", kelp: "#3aa86a", sea: "#164a78", foam: "#d8f8ff" },
    glow: ["pearl"],
    shapes: [
      { t: "ell", c: [0, 0.06, 0], r: [0.28, 0.07, 0.24], col: "sea", k: 0.05 },
      { t: "ell", c: [0, 0.1, 0], r: [0.22, 0.04, 0.2], col: "foam", paint: true },
      { t: "cap", a: [0, 0.06, 0], b: [0, 0.66, 0], r: [0.035, 0.03], col: "dark", k: 0.01 },
      { t: "tor", c: [0, 0.2, 0], R: 0.04, r: 0.02, col: "gold", k: 0.01 },
      { t: "ell", c: [0, 0.66, 0], r: [0.08, 0.06, 0.07], col: "gold", k: 0.02 },
      { t: "ell", c: [0, 0.68, 0.05], r: [0.045, 0.045, 0.04], col: "pearl", k: 0.01 },
      { t: "cap", a: [-0.24, 0.72, 0], b: [0.24, 0.72, 0], r: [0.035, 0.035], col: "metal", k: 0.04 },
      { t: "cap", a: [0, 0.7, 0], b: [0, 1.12, 0], r: [0.04, 0.025], col: "metal", k: 0.02 },
      { t: "cap", a: [0, 1.08, 0], b: [0, 1.26, 0], r: [0.06, 0.006], col: "metal", k: 0.02 },
      { t: "cap", a: [-0.24, 0.72, 0], b: [-0.26, 1.0, 0], r: [0.035, 0.025], col: "metal", k: 0.03 },
      { t: "cap", a: [-0.26, 0.98, 0], b: [-0.27, 1.14, 0], r: [0.05, 0.006], col: "metal", k: 0.02 },
      { t: "cap", a: [0.24, 0.72, 0], b: [0.26, 1.0, 0], r: [0.035, 0.025], col: "metal", k: 0.03 },
      { t: "cap", a: [0.26, 0.98, 0], b: [0.27, 1.14, 0], r: [0.05, 0.006], col: "metal", k: 0.02 },
      { t: "cap", a: [-0.25, 1.0, 0], b: [-0.18, 0.94, 0], r: [0.025, 0.006], col: "metal", k: 0.02 },
      { t: "cap", a: [0.25, 1.0, 0], b: [0.18, 0.94, 0], r: [0.025, 0.006], col: "metal", k: 0.02 },
      { t: "cap", a: [0.0, 1.1, 0], b: [0.06, 1.04, 0], r: [0.025, 0.006], col: "metal", k: 0.02 },
      { t: "cap", a: [0.0, 1.1, 0], b: [-0.06, 1.04, 0], r: [0.025, 0.006], col: "metal", k: 0.02 },
      { t: "cap", a: [0.05, 0.1, 0.02], b: [-0.05, 0.28, 0.04], r: [0.025, 0.025], col: "kelp", k: 0.02 },
      { t: "cap", a: [-0.05, 0.28, 0.04], b: [0.05, 0.42, 0.04], r: [0.025, 0.022], col: "kelp", k: 0.02 },
      { t: "cap", a: [0.05, 0.42, 0.04], b: [-0.04, 0.55, 0.03], r: [0.022, 0.016], col: "kelp", k: 0.02 },
      { t: "ell", c: [0.1, 0.3, 0.04], r: [0.06, 0.025, 0.02], rot: [0, 0, 30], col: "kelp", k: 0.02 },
      { t: "ell", c: [-0.1, 0.44, 0.04], r: [0.06, 0.025, 0.02], rot: [0, 0, -30], col: "kelp", k: 0.02 },
    ],
    eyes: [],
  },

  // Bombardeo: a black iron cannonball bomb with a rust band and a sparking fuse, flanked by spare shot.
  bombardeo: {
    palette: { iron: "#3a3f4a", shine: "#6a7280", rust: "#b8582a", fuse: "#d8c49a", spark: "#ffd23a", fire: "#ff7a1f", ground: "#6a5a4e" },
    glow: ["spark", "fire"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.42, 0.035, 0.34], col: "ground", k: 0.02 },
      { t: "ell", c: [0, 0.38, 0], r: [0.33, 0.33, 0.33], col: "iron", k: 0.03 },
      { t: "tor", c: [0, 0.38, 0], R: 0.33, r: 0.035, rot: [0, 0, 70], col: "rust", k: 0.02 },
      { t: "cap", a: [0.06, 0.66, 0], b: [0.1, 0.78, 0], r: [0.08, 0.075], col: "iron", k: 0.03 },
      { t: "tor", c: [0.1, 0.78, 0], R: 0.07, r: 0.02, col: "rust", k: 0.01 },
      { t: "cap", a: [0.1, 0.78, 0], b: [0.14, 0.88, 0], r: [0.022, 0.02], col: "fuse", k: 0.01 },
      { t: "cap", a: [0.14, 0.88, 0], b: [0.24, 0.94, 0], r: [0.02, 0.02], col: "fuse", k: 0.01 },
      { t: "ell", c: [0.26, 0.96, 0], r: [0.05, 0.05, 0.05], col: "spark", k: 0 },
      flame([0.26, 0.96, 0], [0.32, 1.12, 0.02], 0.045, "fire", 0.03),
      flame([0.26, 0.96, 0], [0.4, 1.0, 0.04], 0.035, "fire", 0.02),
      flame([0.26, 0.96, 0], [0.2, 1.1, -0.04], 0.035, "fire", 0.02),
      { t: "ell", c: [-0.1, 0.52, 0.24], r: [0.08, 0.06, 0.05], col: "shine", paint: true },
      { t: "ell", c: [0.32, 0.12, 0.22], r: [0.11, 0.11, 0.11], col: "iron", k: 0.02 },
      { t: "ell", c: [-0.34, 0.11, 0.18], r: [0.1, 0.1, 0.1], col: "iron", k: 0.02 },
      { t: "ell", c: [-0.26, 0.1, -0.24], r: [0.09, 0.09, 0.09], col: "iron", k: 0.02 },
    ],
    eyes: [],
  },

  // Refuerzos de Hierro: two big interlocking iron gears with a riveted war helmet perched on top.
  refuerzos: {
    palette: { steel: "#8a96a6", rust: "#b8602e", hub: "#3a3f4a", helm: "#5a6474", slit: "#ff4a2a", rivet: "#d8a050" },
    glow: ["slit"],
    shapes: [
      ...gear(-0.12, 0.36, 0.3, 8, "steel", "hub", 0, 0),
      ...gear(0.3, 0.2, 0.17, 6, "rust", "hub", 0.02, 15),
      { t: "ell", c: [-0.12, 0.8, 0], r: [0.17, 0.15, 0.16], col: "helm", k: 0.03 },
      { t: "cap", a: [-0.12, 0.7, -0.17], b: [-0.12, 0.7, 0.17], r: [0.05, 0.05], col: "helm", k: 0.04 },
      { t: "box", c: [-0.12, 0.96, 0], s: [0.02, 0.05, 0.12], round: 0.015, col: "rust", k: 0.02 },
      { t: "box", c: [0.04, 0.79, 0], s: [0.03, 0.015, 0.11], round: 0.01, col: "slit", paint: true },
      { t: "ell", c: [-0.02, 0.88, 0.1], r: [0.022, 0.022, 0.022], col: "rivet", k: 0.005 },
      { t: "ell", c: [0.02, 0.72, 0.1], r: [0.022, 0.022, 0.022], col: "rivet", k: 0.005 },
    ],
    eyes: [],
  },

  // El Gran Ariete: a huge log battering ram with an iron ram-head, slung from a wheeled timber frame.
  ariete: {
    palette: { wood: "#8a5a32", bark: "#6a4224", iron: "#5a6270", horn: "#b8c0cc", rust: "#b0582a", wheel: "#4a3222", chain: "#3a3f4a" },
    shapes: [
      { t: "tor", c: [-0.22, 0.12, 0.26], R: 0.1, r: 0.03, rot: [90, 0, 0], col: "wheel", k: 0.01, mirror: true },
      { t: "tor", c: [0.22, 0.12, 0.26], R: 0.1, r: 0.03, rot: [90, 0, 0], col: "wheel", k: 0.01, mirror: true },
      { t: "cap", a: [-0.22, 0.12, -0.26], b: [-0.22, 0.12, 0.26], r: [0.025, 0.025], col: "iron", k: 0.01 },
      { t: "cap", a: [0.22, 0.12, -0.26], b: [0.22, 0.12, 0.26], r: [0.025, 0.025], col: "iron", k: 0.01 },
      { t: "cap", a: [-0.32, 0.14, 0.22], b: [0.32, 0.14, 0.22], r: [0.035, 0.035], col: "wood", k: 0.02, mirror: true },
      { t: "cap", a: [-0.3, 0.14, 0.22], b: [-0.05, 0.76, 0.2], r: [0.035, 0.03], col: "wood", k: 0.02, mirror: true },
      { t: "cap", a: [0.2, 0.14, 0.22], b: [-0.05, 0.76, 0.2], r: [0.035, 0.03], col: "wood", k: 0.02, mirror: true },
      { t: "cap", a: [-0.05, 0.76, -0.22], b: [-0.05, 0.76, 0.22], r: [0.035, 0.035], col: "wood", k: 0.02 },
      { t: "cap", a: [-0.2, 0.76, 0], b: [-0.2, 0.5, 0], r: [0.018, 0.018], col: "chain", k: 0.005 },
      { t: "cap", a: [0.1, 0.76, 0], b: [0.12, 0.5, 0], r: [0.018, 0.018], col: "chain", k: 0.005 },
      { t: "cap", a: [-0.46, 0.46, 0], b: [0.28, 0.46, 0], r: [0.1, 0.1], col: "bark", k: 0.02 },
      { t: "box", c: [-0.1, 0.46, 0], s: [0.3, 0.11, 0.11], round: 0.1, col: "wood", paint: true },
      { t: "tor", c: [-0.2, 0.46, 0], R: 0.105, r: 0.022, rot: [0, 0, 90], col: "iron", k: 0.01 },
      { t: "tor", c: [0.12, 0.46, 0], R: 0.105, r: 0.022, rot: [0, 0, 90], col: "iron", k: 0.01 },
      { t: "ell", c: [0.36, 0.46, 0], r: [0.13, 0.12, 0.12], col: "iron", k: 0.03 },
      { t: "cap", a: [0.4, 0.46, 0], b: [0.52, 0.44, 0], r: [0.08, 0.06], col: "iron", k: 0.04 },
      { t: "tor", c: [0.34, 0.5, 0.12], R: 0.07, r: 0.028, rot: [90, 0, 0], col: "horn", k: 0.02, mirror: true },
      { t: "ell", c: [0.28, 0.46, 0], r: [0.04, 0.13, 0.13], col: "rust", k: 0.02 },
    ],
    eyes: [{ at: [0.44, 0.5, 0.05], r: 0.03, iris: "#ff4a2a", mirror: true, angry: true, look: [1, 0, 0.4] }],
  },

  // Armadura de Asedio: a hulking spiked steel war armour on a stand, visor glowing ember red.
  "armadura-asedio": {
    palette: { steel: "#8a96a6", dark: "#4a5260", rust: "#b8602e", slit: "#ff4a2a", rivet: "#e0b060", pole: "#5a3e2a" },
    glow: ["slit"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.28, 0.035, 0.26], col: "pole", k: 0.02 },
      { t: "cap", a: [0, 0.03, 0], b: [0, 0.3, 0], r: [0.035, 0.035], col: "pole", k: 0.02 },
      { t: "ell", c: [0, 0.38, 0], r: [0.17, 0.1, 0.2], col: "dark", k: 0.04 },
      { t: "ell", c: [0, 0.55, 0], r: [0.22, 0.2, 0.26], col: "steel", k: 0.05 },
      { t: "box", c: [0.1, 0.52, 0], s: [0.1, 0.015, 0.24], round: 0.01, col: "rust", paint: true },
      { t: "ell", c: [0, 0.7, 0.33], r: [0.16, 0.11, 0.14], col: "dark", k: 0.04, mirror: true },
      { t: "cap", a: [0, 0.76, 0.36], b: [0, 0.94, 0.42], r: [0.045, 0.006], col: "steel", k: 0.02, mirror: true },
      { t: "cap", a: [0.06, 0.74, 0.33], b: [0.16, 0.9, 0.38], r: [0.04, 0.006], col: "steel", k: 0.02, mirror: true },
      { t: "cap", a: [0, 0.6, 0.38], b: [0, 0.4, 0.42], r: [0.08, 0.06], col: "steel", k: 0.04, mirror: true },
      { t: "ell", c: [0, 0.87, 0], r: [0.14, 0.14, 0.14], col: "steel", k: 0.04 },
      { t: "box", c: [0, 1.0, 0], s: [0.02, 0.05, 0.1], round: 0.015, col: "rust", k: 0.02 },
      { t: "box", c: [0.13, 0.88, 0], s: [0.03, 0.018, 0.1], round: 0.01, col: "slit", paint: true },
      { t: "box", c: [0.14, 0.8, 0], s: [0.03, 0.05, 0.015], round: 0.01, col: "dark", paint: true },
      { t: "ell", c: [0.21, 0.6, 0.12], r: [0.022, 0.022, 0.022], col: "rivet", k: 0.005, mirror: true },
      { t: "ell", c: [0.2, 0.45, 0.1], r: [0.022, 0.022, 0.022], col: "rivet", k: 0.005, mirror: true },
      { t: "ell", c: [0.22, 0.56, 0], r: [0.06, 0.06, 0.03], col: "rust", paint: true },
    ],
    eyes: [],
  },

  // Ritual Oscuro: a circle of black candles around a glowing rune ring, a burning eclipse sun hovering at its heart.
  "ritual-oscuro": {
    palette: { floor: "#3a2a3a", rune: "#ff5a2a", wax: "#2a2028", flame: "#ffb02e", disc: "#1a1018", corona: "#ff7a1f", violet: "#8a3aff" },
    glow: ["rune", "flame", "corona", "violet"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.035, 0.5], col: "floor", k: 0.02 },
      { t: "tor", c: [0, 0.055, 0], R: 0.3, r: 0.022, col: "rune", k: 0 },
      { t: "box", c: [0, 0.07, 0], s: [0.3, 0.008, 0.02], round: 0.005, col: "rune", paint: true },
      { t: "box", c: [0, 0.07, 0], s: [0.3, 0.008, 0.02], round: 0.005, rot: [0, 60, 0], col: "rune", paint: true },
      { t: "box", c: [0, 0.07, 0], s: [0.3, 0.008, 0.02], round: 0.005, rot: [0, -60, 0], col: "rune", paint: true },
      ...[0, 72, 144, 216, 288].flatMap((d, i) => candle(0.4 * Math.cos(rad(d + 18)), 0.4 * Math.sin(rad(d + 18)), 0.12 + (i % 2) * 0.06, "wax")),
      { t: "cap", a: [0, 0.06, 0], b: [0, 0.32, 0], r: [0.06, 0.012], col: "violet", k: 0.04 },
      { t: "tor", c: [0, 0.62, 0], R: 0.2, r: 0.04, rot: [90, 0, 0], col: "corona", k: 0.02 },
      ...[0, 45, 90, 135, 180, 225, 270, 315].map((d): Shape => flame([0.22 * Math.cos(rad(d)), 0.62 + 0.22 * Math.sin(rad(d)), 0], [0.33 * Math.cos(rad(d)), 0.62 + 0.33 * Math.sin(rad(d)), 0], 0.045, "corona", 0.03)),
      { t: "ell", c: [0, 0.62, 0], r: [0.19, 0.19, 0.05], col: "disc", k: 0.02 },
    ],
    eyes: [],
  },

  // Altar Lunar: a carved stone altar crowned by a floating silver crescent moon, violet runes aglow.
  "altar-lunar": {
    palette: { stone: "#8a84a8", dark: "#5a5478", moon: "#e8ecff", rune: "#b07aff", cloth: "#5a2a8a", wax: "#ece4f4", flame: "#c8b4ff" },
    glow: ["moon", "rune", "flame"],
    shapes: [
      { t: "box", c: [0, 0.05, 0], s: [0.4, 0.05, 0.3], round: 0.02, col: "dark", k: 0.02 },
      { t: "box", c: [0, 0.14, 0], s: [0.34, 0.05, 0.25], round: 0.02, col: "stone", k: 0.02 },
      { t: "box", c: [0, 0.3, 0], s: [0.24, 0.12, 0.18], round: 0.03, col: "stone", k: 0.02 },
      { t: "box", c: [0, 0.44, 0], s: [0.3, 0.03, 0.22], round: 0.02, col: "dark", k: 0.02 },
      { t: "box", c: [0.1, 0.46, 0], s: [0.12, 0.02, 0.23], round: 0.01, col: "cloth", k: 0.01 },
      { t: "box", c: [0.25, 0.36, 0], s: [0.02, 0.1, 0.14], round: 0.01, col: "cloth", k: 0.01 },
      { t: "ell", c: [0, 0.3, 0.18], r: [0.06, 0.06, 0.03], col: "rune", paint: true },
      { t: "ell", c: [0.03, 0.31, 0.19], r: [0.05, 0.05, 0.04], col: "stone", paint: true },
      { t: "ell", c: [0.24, 0.3, 0.06], r: [0.03, 0.06, 0.06], col: "rune", paint: true },
      { t: "cap", a: [-0.2, 0.46, 0.14], b: [-0.2, 0.56, 0.14], r: [0.03, 0.028], col: "wax", k: 0.01, mirror: true },
      { t: "ell", c: [-0.2, 0.6, 0.14], r: [0.025, 0.04, 0.025], col: "flame", k: 0, mirror: true },
      { t: "ell", c: [0, 0.8, 0], r: [0.22, 0.22, 0.06], col: "moon", k: 0.02 },
      { t: "ell", c: [0.1, 0.86, 0], r: [0.19, 0.19, 0.12], col: "moon", cut: true, k: 0.02 },
      { t: "cap", a: [0, 0.48, 0], b: [0, 0.6, 0], r: [0.04, 0.01], col: "rune", k: 0.02 },
      { t: "ell", c: [0.28, 1.0, 0.05], r: [0.025, 0.025, 0.025], col: "rune", k: 0 },
      { t: "ell", c: [-0.3, 0.98, -0.02], r: [0.02, 0.02, 0.02], col: "moon", k: 0 },
    ],
    eyes: [],
  },
};
