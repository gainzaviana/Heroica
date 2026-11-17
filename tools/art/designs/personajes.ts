import type { EyeSpec, Shape, Sculpt, V3 } from "../sculpt";

/**
 * Heroes, their civilian identities and the allies. Chibi humans share one body (boots, legs,
 * torso, head) and add their own hair, costume, arms and props.
 */

const SKIN = "#f4c9a4";

/** Chibi body: boots, legs, torso and head (head centre ≈ [0.02, 0.71, 0], radius ≈ 0.19). */
function body(o: { torso?: V3; hips?: number } = {}): Shape[] {
  const t = o.torso ?? [0.13, 0.16, 0.15];
  return [
    { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
    { t: "cap", a: [0, 0.08, 0.072], b: [0, 0.28, 0.068], r: [0.058, o.hips ?? 0.065], col: "legs", mirror: true },
    { t: "ell", c: [0, 0.4, 0], r: t, col: "torso" },
    { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
  ];
}

/** Two big eyes on the front of the face. */
function eyes(iris: string, angry = false, y = 0.7, x = 0.02, r = 0.055): EyeSpec[] {
  // The face points along +x, which the 3/4 camera sees half from the side, so both eyes look a
  // little toward the camera (+z) to keep them both in view.
  return [
    { at: [x, y, 0.085], r, iris, angry, look: [0.75, 0.04, 0.6] },
    { at: [x, y, -0.045], r: r * 0.92, iris, angry, look: [0.97, 0.04, 0.22] },
  ];
}

/** An arm from the shoulder (z side `s`) to the hand, with a round hand/glove. */
function arm(s: 1 | -1, hand: V3, col: string, glove: string, r = 0.045): Shape[] {
  return [
    { t: "cap", a: [0, 0.5, 0.15 * s], b: hand, r: [r + 0.005, r], col },
    { t: "ell", c: hand, r: [0.05, 0.05, 0.05], col: glove, k: 0.02 },
  ];
}

export const personajes: Record<string, Sculpt> = {
  // Brasa Rúnica: rune-forged armour, glowing rune hammer raised, burning fist.
  "hero-brasa": {
    palette: {
      skin: SKIN, hair: "#d8452a", torso: "#e2573b", legs: "#5a2a24", boots: "#3b2321", metal: "#9aa3b0",
      rune: "#ffd45a", fire: "#ff8a2a", wood: "#7a4a2a", mask: "#3b2321", cape: "#b8322a",
    },
    glow: ["rune", "fire"],
    shapes: [
      { t: "box", c: [-0.13, 0.36, 0], s: [0.02, 0.2, 0.16], round: 0.02, rot: [0, 0, -10], col: "cape" },
      ...body(),
      { t: "tor", c: [0, 0.28, 0], R: 0.125, r: 0.028, col: "metal" },
      { t: "ell", c: [0.12, 0.42, 0], r: [0.04, 0.06, 0.035], col: "rune", paint: true },
      { t: "ell", c: [0, 0.53, 0.15], r: [0.085, 0.06, 0.08], col: "metal", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [-0.15, 0.84, 0], b: [-0.3, 1.0, 0], r: [0.08, 0.02], col: "hair" },
      { t: "cap", a: [0.1, 0.86, 0.02], b: [0.2, 0.93, 0.06], r: [0.05, 0.015], col: "hair" },
      { t: "tor", c: [0.01, 0.8, 0], R: 0.18, r: 0.018, rot: [0, 0, 12], col: "metal", k: 0.01 },
      { t: "ell", c: [0.19, 0.72, 0], r: [0.05, 0.045, 0.17], col: "mask", paint: true },
      // Near arm raises the hammer.
      ...arm(1, [0.06, 0.74, 0.26], "torso", "metal"),
      { t: "cap", a: [0.06, 0.6, 0.26], b: [0.06, 1.0, 0.26], r: [0.025, 0.025], col: "wood", k: 0.01 },
      { t: "box", c: [0.06, 1.03, 0.26], s: [0.14, 0.075, 0.075], round: 0.03, col: "metal", k: 0.01 },
      { t: "box", c: [0.06, 1.03, 0.26], s: [0.15, 0.025, 0.085], round: 0.01, col: "rune", paint: true },
      // Far arm: burning fist.
      ...arm(-1, [0.24, 0.42, -0.17], "torso", "metal"),
      { t: "cap", a: [0.25, 0.44, -0.17], b: [0.3, 0.6, -0.17], r: [0.055, 0.01], col: "fire", k: 0.03 },
      { t: "cap", a: [0.22, 0.46, -0.13], b: [0.2, 0.56, -0.1], r: [0.03, 0.006], col: "fire", k: 0.02 },
    ],
    eyes: eyes("#ffb03a", true),
  },

  // Kaela Voss: smith in a leather apron, hammer on her shoulder, red hair in a bun.
  "identity-brasa": {
    palette: {
      skin: SKIN, hair: "#d8452a", torso: "#f1e2c4", legs: "#6b5444", boots: "#4a3428", apron: "#8a5a36",
      metal: "#8f96a0", wood: "#7a4a2a", soot: "#5c4a44", glow: "#ff9a3a",
    },
    glow: ["glow"],
    shapes: [
      ...body(),
      { t: "box", c: [0.1, 0.33, 0], s: [0.06, 0.15, 0.13], round: 0.05, col: "apron", k: 0.03 },
      { t: "tor", c: [0, 0.32, 0], R: 0.13, r: 0.02, col: "apron" },
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "ell", c: [-0.1, 0.92, 0], r: [0.08, 0.08, 0.08], col: "hair" },
      { t: "cap", a: [0.12, 0.85, -0.05], b: [0.2, 0.8, -0.12], r: [0.04, 0.015], col: "hair" },
      { t: "ell", c: [0.2, 0.64, 0.08], r: [0.02, 0.025, 0.03], col: "soot", paint: true },
      // Near arm: hammer resting on the shoulder.
      ...arm(1, [0.08, 0.55, 0.24], "skin", "skin"),
      { t: "cap", a: [0.12, 0.5, 0.25], b: [-0.12, 0.78, 0.22], r: [0.022, 0.022], col: "wood", k: 0.01 },
      { t: "box", c: [-0.14, 0.81, 0.22], s: [0.06, 0.09, 0.06], round: 0.025, rot: [0, 0, -40], col: "metal", k: 0.01 },
      // Far arm holds a glowing hot horseshoe.
      ...arm(-1, [0.12, 0.34, -0.2], "skin", "skin"),
      { t: "tor", c: [0.2, 0.36, -0.2], R: 0.055, r: 0.018, rot: [90, 0, 0], col: "glow", k: 0.01 },
    ],
    eyes: eyes("#3f8f4a"),
  },

  // Vigía del Alba: golden-caped archer drawing a glowing dawn bow.
  "hero-vigia": {
    palette: {
      skin: SKIN, hair: "#f0d070", torso: "#f4f0e0", legs: "#c4882a", boots: "#7a4f22", cape: "#e8a923",
      bow: "#ffd34a", light: "#fff3b0", mask: "#e8a923", belt: "#7a4f22",
    },
    glow: ["bow", "light"],
    shapes: [
      { t: "box", c: [-0.16, 0.3, 0], s: [0.022, 0.25, 0.2], round: 0.02, rot: [0, 0, -14], col: "cape", k: 0.04 },
      ...body(),
      { t: "tor", c: [0, 0.28, 0], R: 0.125, r: 0.022, col: "belt" },
      { t: "ell", c: [0.13, 0.43, 0], r: [0.03, 0.045, 0.045], col: "cape", paint: true },
      { t: "tor", c: [0, 0.53, 0], R: 0.12, r: 0.03, col: "cape" },
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [0.08, 0.86, 0.06], b: [0.2, 0.84, 0.12], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [0.06, 0.88, -0.06], b: [0.18, 0.86, -0.13], r: [0.05, 0.015], col: "hair" },
      { t: "ell", c: [0.19, 0.72, 0], r: [0.05, 0.045, 0.17], col: "mask", paint: true },
      // Bow held out in front by the far hand, string drawn by the near hand.
      ...arm(-1, [0.27, 0.5, -0.12], "torso", "boots"),
      { t: "tor", c: [0.3, 0.52, -0.08], R: 0.26, r: 0.022, rot: [90, 0, 0], col: "bow", k: 0.01 },
      { t: "box", c: [0.11, 0.52, -0.08], s: [0.2, 0.3, 0.06], round: 0, col: "bow", cut: true, k: 0 },
      { t: "cap", a: [0.06, 0.52, 0.0], b: [0.4, 0.52, -0.1], r: [0.014, 0.01], col: "light", k: 0.01 },
      { t: "cap", a: [0.38, 0.52, -0.1], b: [0.48, 0.52, -0.12], r: [0.03, 0.005], col: "light", k: 0.01 },
      ...arm(1, [0.06, 0.52, 0.08], "torso", "boots"),
    ],
    eyes: eyes("#e89a1a"),
  },

  // Elian Morrow: young mapmaker with an open map and a satchel.
  "identity-vigia": {
    palette: {
      skin: SKIN, hair: "#c08a3e", torso: "#5a8a6a", legs: "#6a5a48", boots: "#5a3e2a", vest: "#c9a46a",
      paper: "#f4e8c8", ink: "#b0462e", strap: "#7a4f22",
    },
    shapes: [
      ...body(),
      { t: "box", c: [0.06, 0.4, 0], s: [0.08, 0.13, 0.15], round: 0.07, col: "vest", k: 0.03 },
      { t: "cap", a: [0.1, 0.54, 0.1], b: [0.08, 0.27, -0.12], r: [0.015, 0.015], col: "strap", k: 0.005 },
      { t: "box", c: [-0.02, 0.27, -0.16], s: [0.08, 0.06, 0.03], round: 0.02, col: "strap" },
      { t: "ell", c: [-0.03, 0.79, 0], r: [0.19, 0.15, 0.2], col: "hair" },
      { t: "cap", a: [0.1, 0.88, 0], b: [0.2, 0.86, 0.06], r: [0.05, 0.015], col: "hair" },
      { t: "box", c: [-0.04, 0.89, 0], s: [0.16, 0.025, 0.17], round: 0.02, col: "ink", rot: [0, 0, 10] },
      // Unrolled map in both hands.
      ...arm(1, [0.2, 0.4, 0.18], "torso", "skin"),
      ...arm(-1, [0.2, 0.4, -0.18], "torso", "skin"),
      { t: "box", c: [0.24, 0.42, 0], s: [0.01, 0.12, 0.18], round: 0.008, col: "paper", rot: [0, 0, 18] },
      { t: "cap", a: [0.2, 0.42, 0.21], b: [0.27, 0.42, 0.21], r: [0.03, 0.03], col: "paper", k: 0.01 },
      { t: "cap", a: [0.2, 0.42, -0.21], b: [0.27, 0.42, -0.21], r: [0.03, 0.03], col: "paper", k: 0.01 },
      { t: "cap", a: [0.26, 0.48, -0.08], b: [0.26, 0.38, 0.06], r: [0.012, 0.012], col: "ink", paint: true },
      { t: "ell", c: [0.26, 0.38, 0.07], r: [0.03, 0.03, 0.03], col: "ink", paint: true },
    ],
    eyes: eyes("#3a7ac0"),
  },

  // Guardián de Piedra: heavy stone-armoured guardian with huge rock fists.
  "hero-guardian": {
    palette: {
      skin: SKIN, torso: "#7a8a99", legs: "#5c6873", boots: "#4a535c", rock: "#95a3b0", moss: "#6fb35a", gem: "#6fe0ff",
    },
    glow: ["gem"],
    shapes: [
      ...body({ torso: [0.17, 0.17, 0.18], hips: 0.075 }),
      { t: "box", c: [0.05, 0.42, 0], s: [0.13, 0.12, 0.15], round: 0.06, col: "rock", k: 0.03 },
      { t: "ell", c: [0.18, 0.43, 0], r: [0.035, 0.045, 0.045], col: "gem", paint: true },
      { t: "ell", c: [-0.02, 0.55, 0.19], r: [0.12, 0.09, 0.1], col: "rock", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.02, 0.62, 0.21], r: [0.06, 0.03, 0.05], col: "moss", paint: true },
      // Stone helm with a visor opening.
      { t: "ell", c: [-0.01, 0.76, 0], r: [0.2, 0.18, 0.21], col: "torso", k: 0.03 },
      { t: "box", c: [0.2, 0.71, 0], s: [0.1, 0.07, 0.14], round: 0.04, col: "skin", cut: true, k: 0.02 },
      { t: "cap", a: [-0.05, 0.92, 0], b: [0.1, 0.97, 0], r: [0.05, 0.03], col: "rock", k: 0.03 },
      // Huge rock fists, near one punching forward.
      { t: "cap", a: [0, 0.52, 0.2], b: [0.16, 0.42, 0.28], r: [0.07, 0.065], col: "torso" },
      { t: "ell", c: [0.25, 0.4, 0.3], r: [0.12, 0.11, 0.11], col: "rock", k: 0.03 },
      { t: "cap", a: [0, 0.52, -0.2], b: [0.04, 0.3, -0.28], r: [0.07, 0.065], col: "torso" },
      { t: "ell", c: [0.06, 0.22, -0.3], r: [0.12, 0.11, 0.11], col: "rock", k: 0.03 },
      { t: "ell", c: [0.34, 0.44, 0.34], r: [0.03, 0.03, 0.03], col: "gem", paint: true },
    ],
    eyes: eyes("#6fd0ff", true, 0.71),
  },

  // Bruna Halder: sturdy quarry mason with a mallet raised and a stone block.
  "identity-guardian": {
    palette: {
      skin: "#e8b48e", hair: "#6a4a32", torso: "#b8826a", legs: "#5c6873", boots: "#4a3a2e", scarf: "#d9b84a",
      wood: "#8a5a36", stone: "#c9bca8", dust: "#e8e0d0",
    },
    shapes: [
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "tor", c: [0, 0.29, 0], R: 0.145, r: 0.025, col: "wood" },
      { t: "tor", c: [0.01, 0.55, 0], R: 0.1, r: 0.035, col: "scarf" },
      { t: "ell", c: [-0.04, 0.77, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [-0.05, 0.75, 0.18], b: [-0.05, 0.56, 0.2], r: [0.045, 0.03], col: "hair" },
      { t: "cap", a: [-0.05, 0.75, -0.18], b: [-0.05, 0.56, -0.2], r: [0.045, 0.03], col: "hair" },
      { t: "ell", c: [0.01, 0.84, 0], r: [0.17, 0.08, 0.18], col: "scarf", k: 0.02 },
      // Stone block under the far arm.
      { t: "box", c: [0.1, 0.28, -0.24], s: [0.11, 0.1, 0.09], round: 0.025, col: "stone", k: 0.01 },
      ...arm(-1, [0.12, 0.38, -0.2], "torso", "skin", 0.05),
      // Near arm raises a mallet.
      ...arm(1, [0.1, 0.66, 0.25], "torso", "skin", 0.05),
      { t: "cap", a: [0.1, 0.6, 0.25], b: [0.08, 0.88, 0.25], r: [0.022, 0.022], col: "wood", k: 0.01 },
      { t: "box", c: [0.08, 0.92, 0.25], s: [0.09, 0.06, 0.06], round: 0.03, col: "wood", k: 0.01 },
      { t: "ell", c: [0.18, 0.62, 0.08], r: [0.02, 0.02, 0.03], col: "dust", paint: true },
    ],
    eyes: eyes("#7a5a3a"),
  },

  // Sombra Errante: hooded shadow rogue with two violet glowing daggers.
  "hero-sombra": {
    palette: {
      skin: SKIN, torso: "#5b4a8a", legs: "#3a2e5c", boots: "#2a2240", hood: "#4a3a78", scarf: "#2a2240",
      blade: "#c58aff", sash: "#8a6ad0",
    },
    glow: ["blade"],
    shapes: [
      { t: "box", c: [-0.16, 0.3, 0], s: [0.022, 0.25, 0.2], round: 0.02, rot: [0, 0, -16], col: "hood", k: 0.04 },
      { t: "ell", c: [-0.2, 0.04, 0.1], r: [0.08, 0.06, 0.06], col: "hood", cut: true, mirror: true, k: 0.01 },
      ...body(),
      { t: "cap", a: [0.12, 0.5, 0.1], b: [0.1, 0.27, -0.12], r: [0.025, 0.025], col: "sash", k: 0.01 },
      { t: "ell", c: [0.02, 0.74, 0], r: [0.22, 0.21, 0.21], col: "hood", k: 0.04 },
      { t: "cap", a: [-0.1, 0.9, 0], b: [-0.24, 0.98, 0], r: [0.08, 0.02], col: "hood" },
      { t: "ell", c: [0.2, 0.71, 0], r: [0.1, 0.1, 0.14], col: "hood", cut: true, k: 0.03 },
      { t: "ell", c: [0.08, 0.7, 0], r: [0.17, 0.15, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.23, 0.63, 0], r: [0.05, 0.05, 0.15], col: "scarf", paint: true },
      // Daggers: one thrust forward low, one raised.
      ...arm(1, [0.2, 0.36, 0.22], "torso", "boots"),
      { t: "cap", a: [0.22, 0.38, 0.23], b: [0.42, 0.46, 0.25], r: [0.035, 0.008], col: "blade", k: 0.01 },
      ...arm(-1, [0.08, 0.5, -0.24], "torso", "boots"),
      { t: "cap", a: [0.09, 0.52, -0.25], b: [0.18, 0.74, -0.27], r: [0.035, 0.008], col: "blade", k: 0.01 },
    ],
    eyes: eyes("#c58aff", true, 0.71),
  },

  // Liss Corvel: gentleman thief in a long coat and top hat, flipping a coin.
  "identity-sombra": {
    palette: {
      skin: SKIN, hair: "#2e2a3a", torso: "#3e3a6a", legs: "#2a2840", boots: "#1e1c2a", shirt: "#f2eee4",
      hat: "#2a2840", band: "#a03a5a", gold: "#ffd34a", coat: "#4a4478",
    },
    glow: ["gold"],
    shapes: [
      { t: "box", c: [-0.1, 0.27, 0], s: [0.03, 0.16, 0.13], round: 0.03, rot: [0, 0, -12], col: "coat", k: 0.04 },
      ...body(),
      { t: "box", c: [0.13, 0.42, 0], s: [0.02, 0.1, 0.04], round: 0.01, col: "shirt", paint: true },
      { t: "ell", c: [0.12, 0.53, 0], r: [0.03, 0.02, 0.05], col: "band", paint: true },
      { t: "ell", c: [-0.03, 0.76, 0], r: [0.19, 0.15, 0.2], col: "hair" },
      { t: "cap", a: [0.12, 0.83, 0.02], b: [0.2, 0.76, 0.1], r: [0.04, 0.012], col: "hair" },
      // Top hat, tilted.
      { t: "ell", c: [-0.01, 0.87, 0], r: [0.22, 0.02, 0.22], rot: [0, 0, 10], col: "hat", k: 0.01 },
      { t: "box", c: [-0.03, 0.97, 0], s: [0.12, 0.1, 0.12], round: 0.05, rot: [0, 0, 10], col: "hat", k: 0.01 },
      { t: "box", c: [-0.02, 0.91, 0], s: [0.125, 0.025, 0.125], round: 0.02, rot: [0, 0, 10], col: "band", paint: true },
      // Near hand flips a coin, far hand on the hip.
      ...arm(1, [0.16, 0.5, 0.22], "coat", "shirt"),
      { t: "cap", a: [0.2, 0.66, 0.24], b: [0.2, 0.66, 0.24], r: [0.04, 0.04], col: "gold" },
      ...arm(-1, [0.0, 0.3, -0.2], "coat", "shirt"),
    ],
    eyes: eyes("#8a5ad0"),
  },

  // Torvald: stocky smith's apprentice holding tongs with a glowing hot ingot.
  torvald: {
    palette: {
      skin: "#f0bf98", hair: "#e89a3a", torso: "#a8c4d8", legs: "#6b5444", boots: "#4a3428", apron: "#9a6a42",
      metal: "#5a6068", hot: "#ff7a2a", cheek: "#f08a7a",
    },
    glow: ["hot"],
    shapes: [
      ...body({ torso: [0.15, 0.15, 0.16] }),
      { t: "box", c: [0.11, 0.33, 0], s: [0.06, 0.14, 0.13], round: 0.05, col: "apron", k: 0.03 },
      { t: "ell", c: [-0.03, 0.8, 0], r: [0.18, 0.13, 0.19], col: "hair" },
      { t: "cap", a: [0.05, 0.9, 0], b: [0.14, 0.98, 0.02], r: [0.05, 0.012], col: "hair" },
      { t: "cap", a: [-0.02, 0.9, 0.06], b: [0.0, 1.0, 0.12], r: [0.05, 0.012], col: "hair" },
      { t: "ell", c: [0.17, 0.66, 0.1], r: [0.03, 0.025, 0.035], col: "cheek", paint: true, mirror: true },
      { t: "ell", c: [0.2, 0.62, 0], r: [0.04, 0.012, 0.06], col: "boots", paint: true },
      ...arm(1, [0.18, 0.42, 0.2], "torso", "skin", 0.05),
      { t: "cap", a: [0.2, 0.42, 0.2], b: [0.42, 0.52, 0.2], r: [0.015, 0.012], col: "metal", k: 0.005 },
      { t: "box", c: [0.45, 0.53, 0.2], s: [0.05, 0.02, 0.04], round: 0.015, col: "hot", k: 0.01 },
      ...arm(-1, [0.05, 0.3, -0.21], "torso", "skin", 0.05),
    ],
    eyes: eyes("#3a8ad0"),
  },

  // Mira: a hawk made of light, wings spread.
  "mira-halcon": {
    palette: { body: "#ffe48a", wing: "#ffcf4a", tip: "#fff6c8", beak: "#ff9a3a", feet: "#e8a923", belly: "#fff3c8" },
    glow: ["tip"],
    shapes: [
      { t: "ell", c: [0, 0.45, 0], r: [0.17, 0.2, 0.15], rot: [0, 0, -15], col: "body", k: 0.06 },
      { t: "ell", c: [0.08, 0.42, 0], r: [0.1, 0.14, 0.1], col: "belly", paint: true },
      { t: "ell", c: [0.1, 0.7, 0], r: [0.14, 0.13, 0.13], col: "body", k: 0.08 },
      { t: "cap", a: [0.22, 0.7, 0], b: [0.31, 0.64, 0], r: [0.04, 0.008], col: "beak", k: 0.01 },
      { t: "cap", a: [0.06, 0.82, 0], b: [-0.05, 0.92, 0], r: [0.04, 0.01], col: "wing" },
      // Wings spread up and out.
      { t: "cap", a: [-0.02, 0.55, 0.12], b: [-0.1, 0.78, 0.38], r: [0.07, 0.05], col: "wing", mirror: true },
      { t: "cap", a: [-0.1, 0.78, 0.38], b: [-0.2, 0.95, 0.5], r: [0.05, 0.02], col: "wing", mirror: true },
      { t: "cap", a: [-0.08, 0.72, 0.38], b: [-0.28, 0.72, 0.56], r: [0.045, 0.015], col: "wing", mirror: true },
      { t: "cap", a: [-0.06, 0.62, 0.34], b: [-0.3, 0.52, 0.5], r: [0.04, 0.012], col: "wing", mirror: true },
      { t: "ell", c: [-0.22, 0.85, 0.5], r: [0.12, 0.1, 0.1], col: "tip", paint: true, mirror: true },
      { t: "ell", c: [-0.3, 0.55, 0.5], r: [0.1, 0.1, 0.1], col: "tip", paint: true, mirror: true },
      // Tail and talons.
      { t: "cap", a: [-0.12, 0.32, 0], b: [-0.32, 0.16, 0], r: [0.07, 0.04], col: "wing" },
      { t: "ell", c: [-0.32, 0.16, 0], r: [0.08, 0.04, 0.1], col: "tip", paint: true },
      { t: "cap", a: [0.02, 0.28, 0.06], b: [0.06, 0.04, 0.07], r: [0.025, 0.018], col: "feet", mirror: true },
      { t: "ell", c: [0.09, 0.03, 0.07], r: [0.05, 0.025, 0.04], col: "feet", mirror: true },
    ],
    eyes: eyes("#ff9a1a", false, 0.72, 0.1, 0.05),
  },

  // Mercenaria de la Posada: sword woman with a broadsword over her shoulder.
  "mercenario-posada": {
    palette: {
      skin: "#e2a882", hair: "#2e2a2a", torso: "#8a3a3a", legs: "#4a4038", boots: "#3a2e26", leather: "#7a5236",
      metal: "#c4ccd6", gold: "#e0b04a", scar: "#c07a6a",
    },
    shapes: [
      { t: "box", c: [-0.15, 0.33, 0], s: [0.022, 0.2, 0.16], round: 0.02, rot: [0, 0, -12], col: "leather", k: 0.04 },
      ...body(),
      { t: "cap", a: [0.1, 0.53, -0.12], b: [0.1, 0.27, 0.12], r: [0.025, 0.025], col: "leather", k: 0.01 },
      { t: "ell", c: [0, 0.53, 0.15], r: [0.08, 0.055, 0.075], col: "leather", mirror: true, k: 0.02 },
      { t: "tor", c: [0, 0.28, 0], R: 0.125, r: 0.024, col: "leather" },
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [-0.18, 0.78, 0], b: [-0.26, 0.48, 0], r: [0.06, 0.03], col: "hair" },
      { t: "cap", a: [0.12, 0.86, 0.04], b: [0.2, 0.74, 0.1], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [0.19, 0.78, -0.08], b: [0.2, 0.66, -0.1], r: [0.008, 0.008], col: "scar", paint: true },
      // Sword over the near shoulder.
      ...arm(1, [0.2, 0.42, 0.24], "torso", "leather"),
      { t: "cap", a: [0.17, 0.36, 0.25], b: [0.23, 0.48, 0.25], r: [0.022, 0.022], col: "leather", k: 0.005 },
      { t: "box", c: [0.24, 0.5, 0.25], s: [0.025, 0.02, 0.08], round: 0.01, rot: [0, 0, -28], col: "gold", k: 0.005 },
      { t: "cap", a: [0.25, 0.52, 0.25], b: [0.48, 0.98, 0.25], r: [0.045, 0.025], col: "metal", k: 0.005 },
      ...arm(-1, [0.06, 0.3, -0.21], "torso", "leather"),
    ],
    eyes: eyes("#c08a2a"),
  },

  // Aldeana Valiente: brave villager with a pitchfork and a basket of apples.
  "aldeana-valiente": {
    palette: {
      skin: SKIN, hair: "#a8642a", torso: "#e8d8b8", legs: "#4a7aa8", boots: "#6a4a32", dress: "#4a7aa8",
      scarf: "#d84a4a", wood: "#9a6a3a", metal: "#9aa3b0", basket: "#c89a5a", apple: "#e84a3a",
    },
    shapes: [
      ...body(),
      { t: "cap", a: [0, 0.4, 0], b: [0, 0.14, 0], r: [0.13, 0.2], col: "dress", k: 0.04 },
      { t: "box", c: [0.15, 0.25, 0], s: [0.04, 0.1, 0.1], round: 0.04, col: "torso", k: 0.02 },
      { t: "ell", c: [-0.04, 0.77, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [-0.08, 0.74, 0.17], b: [-0.04, 0.5, 0.2], r: [0.045, 0.025], col: "hair" },
      { t: "ell", c: [-0.02, 0.83, 0], r: [0.19, 0.11, 0.2], col: "scarf", k: 0.02 },
      { t: "cap", a: [-0.18, 0.8, 0], b: [-0.26, 0.7, 0.03], r: [0.04, 0.02], col: "scarf" },
      // Pitchfork held upright in the near hand.
      ...arm(1, [0.02, 0.42, 0.28], "torso", "skin"),
      { t: "cap", a: [0.02, 0.04, 0.3], b: [0.02, 0.92, 0.3], r: [0.02, 0.02], col: "wood", k: 0.01 },
      { t: "box", c: [0.02, 0.93, 0.3], s: [0.07, 0.015, 0.02], round: 0.01, col: "metal", k: 0.005 },
      { t: "cap", a: [-0.04, 0.93, 0.3], b: [-0.04, 1.06, 0.3], r: [0.014, 0.006], col: "metal", k: 0.005 },
      { t: "cap", a: [0.02, 0.93, 0.3], b: [0.02, 1.08, 0.3], r: [0.014, 0.006], col: "metal", k: 0.005 },
      { t: "cap", a: [0.08, 0.93, 0.3], b: [0.08, 1.06, 0.3], r: [0.014, 0.006], col: "metal", k: 0.005 },
      // Basket of apples on the far arm.
      ...arm(-1, [0.12, 0.36, -0.22], "torso", "skin"),
      { t: "ell", c: [0.14, 0.3, -0.28], r: [0.1, 0.07, 0.09], col: "basket", k: 0.01 },
      { t: "ell", c: [0.15, 0.37, -0.25], r: [0.04, 0.04, 0.04], col: "apple", k: 0.01 },
      { t: "ell", c: [0.1, 0.37, -0.32], r: [0.04, 0.04, 0.04], col: "apple", k: 0.01 },
    ],
    eyes: eyes("#4a8a3a"),
  },

  // Gólem de la Cantera: round friendly quarry golem with mossy shoulders and a glowing rune.
  "golem-cantera": {
    palette: { body: "#b8a88e", dark: "#8a7a64", moss: "#7ac05a", rune: "#7af0ff", crack: "#6a5a48" },
    glow: ["rune"],
    shapes: [
      { t: "ell", c: [0, 0.48, 0], r: [0.28, 0.3, 0.3], col: "body", k: 0.06 },
      { t: "box", c: [0.04, 0.8, 0], s: [0.16, 0.13, 0.16], round: 0.08, col: "body", k: 0.08 },
      { t: "ell", c: [-0.02, 0.62, 0.26], r: [0.14, 0.12, 0.12], col: "dark", mirror: true, k: 0.04 },
      { t: "ell", c: [-0.04, 0.72, 0.28], r: [0.09, 0.05, 0.08], col: "moss", paint: true, mirror: true },
      { t: "ell", c: [-0.04, 0.92, 0], r: [0.12, 0.04, 0.12], col: "moss", paint: true },
      { t: "ell", c: [-0.06, 0.93, 0.06], r: [0.07, 0.05, 0.07], rot: [20, 0, 15], col: "body", k: 0.03 },
      { t: "ell", c: [0.05, 0.92, -0.08], r: [0.06, 0.04, 0.06], rot: [-20, 0, -10], col: "body", k: 0.03 },
      { t: "cap", a: [0.02, 0.58, 0.32], b: [0.12, 0.3, 0.38], r: [0.09, 0.1], col: "body", mirror: true, k: 0.04 },
      { t: "ell", c: [0.13, 0.22, 0.38], r: [0.13, 0.11, 0.12], col: "dark", mirror: true, k: 0.03 },
      { t: "cap", a: [0, 0.2, 0.13], b: [0.02, 0.06, 0.14], r: [0.1, 0.11], col: "dark", mirror: true },
      { t: "ell", c: [0.27, 0.45, 0], r: [0.04, 0.07, 0.06], col: "rune", paint: true },
      { t: "cap", a: [0.26, 0.6, 0.12], b: [0.22, 0.42, 0.2], r: [0.01, 0.01], col: "crack", paint: true },
      { t: "ell", c: [0.2, 0.74, 0], r: [0.03, 0.012, 0.08], col: "crack", paint: true },
    ],
    eyes: eyes("#3ad0f0", false, 0.82, 0.04, 0.06),
  },

  // Cuervo Mensajero: round raven with a sealed letter in its beak.
  "cuervo-mensajero": {
    palette: {
      body: "#3a3a5c", wing: "#2a2a48", belly: "#5a5a84", beak: "#f0b03a", feet: "#e0a03a", paper: "#f4e8c8",
      seal: "#d83a3a", sheen: "#6a6ab0",
    },
    shapes: [
      { t: "ell", c: [0, 0.38, 0], r: [0.22, 0.22, 0.2], col: "body", k: 0.06 },
      { t: "ell", c: [0.1, 0.34, 0], r: [0.12, 0.14, 0.13], col: "belly", paint: true },
      { t: "ell", c: [0.1, 0.66, 0], r: [0.16, 0.15, 0.15], col: "body", k: 0.1 },
      { t: "cap", a: [0.04, 0.8, 0], b: [-0.04, 0.9, 0.02], r: [0.04, 0.01], col: "body" },
      { t: "cap", a: [0.0, 0.79, 0], b: [-0.1, 0.86, -0.02], r: [0.035, 0.01], col: "body" },
      { t: "cap", a: [0.22, 0.65, 0], b: [0.36, 0.6, 0], r: [0.045, 0.01], col: "beak", k: 0.01 },
      { t: "box", c: [0.38, 0.56, 0], s: [0.06, 0.04, 0.028], round: 0.01, rot: [0, 0, -15], col: "paper", k: 0 },
      { t: "ell", c: [0.4, 0.56, 0.03], r: [0.02, 0.02, 0.01], col: "seal", k: 0.005 },
      { t: "ell", c: [-0.03, 0.4, 0.17], r: [0.17, 0.12, 0.06], rot: [0, 0, -25], col: "wing", mirror: true, k: 0.03 },
      { t: "ell", c: [-0.03, 0.46, 0.21], r: [0.08, 0.04, 0.03], col: "sheen", paint: true, mirror: true },
      { t: "cap", a: [-0.16, 0.3, 0], b: [-0.34, 0.18, 0], r: [0.08, 0.05], col: "wing" },
      { t: "cap", a: [0.02, 0.18, 0.07], b: [0.04, 0.03, 0.08], r: [0.02, 0.015], col: "feet", mirror: true },
      { t: "ell", c: [0.08, 0.02, 0.08], r: [0.05, 0.02, 0.035], col: "feet", mirror: true },
    ],
    eyes: eyes("#ffd34a", false, 0.68, 0.1, 0.05),
  },
};
