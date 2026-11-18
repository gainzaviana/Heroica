import type { EyeSpec, Shape, Sculpt, V3 } from "../sculpt";
import { SKIN, SKIN_DEEP, arm, body, burst, eyes, rad, spike } from "./kit";

/**
 * The new heroes (hero form + civilian identity) and three villain portraits: Vanguardia de
 * Titanio, Funámbula, Mole Tronante, Centella Estelar, Soberano de Oricalco; Mazagón, Estruendo
 * and Nexo. Original characters: archetypes only.
 */

/** Two eyes for a head centred elsewhere than the standard chibi head. */
function eyesAt(iris: string, x: number, y: number, z: number, r: number, angry = false): EyeSpec[] {
  return [{ at: [x, y, z], r, iris, mirror: true, angry, look: [0.75, 0.04, 0.6] }];
}

/** A flat silk ribbon segment from a to b (a thin wide capsule pair). */
function ribbon(a: V3, b: V3, w: number, col: string): Shape[] {
  return [
    { t: "cap", a, b, r: [w, w * 0.6], col, k: 0.01 },
  ];
}

const VAN = { red: "#b8322a", redDk: "#7e1f1a", ti: "#c3ccd4", tiDk: "#6f7a85", core: "#5ff2ff", hot: "#e6ffff" };

export const artHeroes: Record<string, Sculpt> = {
  // Vanguardia de Titanio: red modular battle-suit with brushed-titanium plates, open helm with a
  // raised cyan visor, diamond energy core, twin back thrusters and an oversized plasma gauntlet.
  "hero-vanguardia": {
    palette: {
      skin: SKIN, hair: "#2e2226", torso: VAN.red, legs: VAN.red, boots: VAN.ti, red: VAN.red, redDk: VAN.redDk,
      ti: VAN.ti, tiDk: VAN.tiDk, core: VAN.core, hot: VAN.hot,
    },
    glow: ["core", "hot"],
    shapes: [
      // Back thrusters with cyan jets.
      { t: "cap", a: [-0.15, 0.56, 0.08], b: [-0.17, 0.34, 0.09], r: [0.055, 0.045], col: "tiDk", mirror: true, k: 0.03 },
      { t: "tor", c: [-0.17, 0.33, 0.09], R: 0.04, r: 0.014, col: "ti", mirror: true, k: 0.01 },
      { t: "cap", a: [-0.17, 0.31, 0.09], b: [-0.2, 0.14, 0.1], r: [0.04, 0.008], col: "core", mirror: true, k: 0.01 },
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "ell", c: [0.05, 0.17, 0.075], r: [0.045, 0.045, 0.045], col: "ti", mirror: true, k: 0.02 },
      { t: "tor", c: [0, 0.28, 0], R: 0.14, r: 0.026, col: "tiDk" },
      { t: "box", c: [0.07, 0.43, 0], s: [0.09, 0.1, 0.13], round: 0.07, col: "ti", k: 0.03 },
      { t: "box", c: [0.13, 0.33, 0], s: [0.04, 0.05, 0.1], round: 0.03, col: "red", paint: true },
      // Diamond core.
      { t: "box", c: [0.165, 0.45, 0], s: [0.035, 0.058, 0.058], round: 0.014, rot: [45, 0, 0], col: "core", k: 0.01 },
      { t: "ell", c: [0.2, 0.45, 0], r: [0.02, 0.028, 0.028], col: "hot", paint: true },
      { t: "ell", c: [0, 0.54, 0.16], r: [0.1, 0.07, 0.09], col: "ti", mirror: true, k: 0.02 },
      { t: "ell", c: [0.02, 0.58, 0.18], r: [0.06, 0.025, 0.05], col: "red", paint: true, mirror: true },
      // Open helm: red shell, titanium ear pods, crest fin and a raised cyan visor.
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.2, 0.16, 0.205], col: "red", k: 0.02 },
      { t: "cap", a: [0.02, 0.71, 0.16], b: [0.02, 0.71, 0.215], r: [0.055, 0.05], col: "ti", mirror: true, k: 0.01 },
      { t: "cap", a: [0.03, 0.66, 0.18], b: [0.12, 0.6, 0.15], r: [0.03, 0.02], col: "red", mirror: true, k: 0.02 },
      { t: "box", c: [-0.03, 0.94, 0], s: [0.13, 0.035, 0.016], round: 0.014, rot: [0, 0, -10], col: "ti", k: 0.03 },
      { t: "box", c: [0.13, 0.88, 0], s: [0.05, 0.03, 0.15], round: 0.025, rot: [0, 0, -25], col: "core", k: 0.01 },
      // Near arm: plasma gauntlet thrust forward.
      ...arm(-1, [0.26, 0.52, -0.24], "red", "ti", 0.05),
      { t: "ell", c: [0.32, 0.52, -0.24], r: [0.1, 0.095, 0.095], col: "ti", k: 0.02 },
      { t: "tor", c: [0.23, 0.52, -0.24], R: 0.07, r: 0.024, rot: [0, 0, 90], col: "red", k: 0.01 },
      { t: "ell", c: [0.32, 0.52, -0.24], r: [0.03, 0.1, 0.1], col: "redDk", paint: true },
      { t: "ell", c: [0.415, 0.52, -0.24], r: [0.025, 0.065, 0.065], col: "core", k: 0 },
      { t: "cap", a: [0.43, 0.52, -0.24], b: [0.54, 0.53, -0.23], r: [0.05, 0.08], col: "core", k: 0.02 },
      { t: "ell", c: [0.56, 0.53, -0.23], r: [0.05, 0.075, 0.075], col: "hot", k: 0.03 },
      // Near arm: armoured fist at the side.
      ...arm(1, [0.1, 0.3, 0.25], "red", "ti", 0.05),
      { t: "ell", c: [0.11, 0.29, 0.26], r: [0.07, 0.065, 0.065], col: "ti", k: 0.02 },
    ],
    eyes: eyes("#3fd8f0", true),
  },

  // Iria Montalbán: young engineer in workshop overalls, goggles on the forehead, wrench raised and
  // a glowing tablet.
  "identity-vanguardia": {
    palette: {
      skin: SKIN, hair: "#2a1f22", torso: "#efe4d0", legs: "#3f6a8a", boots: "#4a3428", over: "#3f6a8a",
      metal: "#9aa3b0", strap: "#4a3a34", lens: "#7ff7ee", brass: "#c3ccd4", scarf: VAN.red, screen: "#5ff2ff", case: "#2e3540",
    },
    glow: ["lens", "screen"],
    shapes: [
      ...body(),
      // Overall bib and straps.
      { t: "box", c: [0.08, 0.36, 0], s: [0.07, 0.13, 0.13], round: 0.06, col: "over", k: 0.03 },
      { t: "cap", a: [0.1, 0.5, 0.08], b: [0.0, 0.56, 0.12], r: [0.016, 0.016], col: "over", mirror: true, k: 0.01 },
      { t: "tor", c: [0, 0.27, 0], R: 0.13, r: 0.02, col: "over" },
      { t: "box", c: [0.14, 0.4, 0.04], s: [0.012, 0.035, 0.035], round: 0.01, col: "case", paint: true },
      { t: "tor", c: [0.01, 0.55, 0], R: 0.09, r: 0.03, col: "scarf" },
      // Hair with a high ponytail.
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [0.1, 0.86, 0.04], b: [0.2, 0.82, 0.12], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [-0.14, 0.88, 0], b: [-0.3, 0.7, 0], r: [0.06, 0.02], col: "hair" },
      // Goggles on the forehead.
      { t: "tor", c: [0, 0.83, 0], R: 0.195, r: 0.02, rot: [0, 0, 10], col: "strap", k: 0.01 },
      { t: "cap", a: [0.13, 0.87, 0.075], b: [0.19, 0.89, 0.075], r: [0.05, 0.05], col: "brass", mirror: true, k: 0.01 },
      { t: "ell", c: [0.24, 0.895, 0.075], r: [0.02, 0.036, 0.036], col: "lens", paint: true, mirror: true },
      // Near arm: wrench raised.
      ...arm(1, [0.12, 0.5, 0.28], "torso", "skin"),
      { t: "cap", a: [0.12, 0.44, 0.28], b: [0.13, 0.72, 0.31], r: [0.024, 0.024], col: "metal", k: 0.01 },
      { t: "tor", c: [0.133, 0.77, 0.315], R: 0.048, r: 0.024, rot: [90, 0, 0], col: "metal", k: 0.01 },
      { t: "box", c: [0.133, 0.82, 0.315], s: [0.024, 0.038, 0.06], round: 0.005, col: "metal", cut: true, k: 0 },
      // Far arm: glowing tablet.
      ...arm(-1, [0.2, 0.38, -0.2], "torso", "skin"),
      { t: "box", c: [0.25, 0.44, -0.16], s: [0.012, 0.09, 0.07], round: 0.012, rot: [0, 0, 20], col: "case", k: 0.01 },
      { t: "box", c: [0.262, 0.444, -0.16], s: [0.006, 0.075, 0.056], round: 0.006, rot: [0, 0, 20], col: "screen", paint: true },
    ],
    eyes: eyes("#6a4a30"),
  },

  // Funámbula: circus acrobat in a crimson leotard with a white ruffle, domino mask, long ponytail,
  // swinging up a silk thread from her raised hand, one leg kicked forward, ribbons streaming.
  "hero-funambula": {
    palette: {
      skin: SKIN, hair: "#2b2440", torso: "#c0263f", legs: "#c0263f", boots: "#f6f1f4", silk: "#ffffff",
      mask: "#6e1024", gold: "#f2c14e", ruff: "#f6f1f4",
    },
    glow: ["silk"],
    shapes: [
      // Standing near leg, far leg kicked forward.
      { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots" },
      { t: "cap", a: [0, 0.08, 0.072], b: [0, 0.28, 0.068], r: [0.055, 0.062], col: "legs" },
      { t: "cap", a: [0.02, 0.28, -0.07], b: [0.24, 0.36, -0.1], r: [0.062, 0.05], col: "legs" },
      { t: "ell", c: [0.29, 0.38, -0.1], r: [0.07, 0.045, 0.055], rot: [0, 0, 20], col: "boots" },
      { t: "ell", c: [0, 0.4, 0], r: [0.12, 0.16, 0.14], col: "torso" },
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      // White ruffle and gold belt.
      { t: "tor", c: [0, 0.29, 0], R: 0.13, r: 0.035, col: "ruff", k: 0.02 },
      { t: "tor", c: [0, 0.33, 0], R: 0.12, r: 0.016, col: "gold", k: 0.01 },
      { t: "ell", c: [0.12, 0.45, 0], r: [0.02, 0.05, 0.02], col: "gold", paint: true, rot: [45, 0, 0] },
      { t: "ell", c: [0.12, 0.45, 0], r: [0.02, 0.05, 0.02], col: "gold", paint: true, rot: [-45, 0, 0] },
      // Hair, long ponytail streaming back.
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [0.1, 0.87, 0.04], b: [0.2, 0.84, 0.12], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [-0.14, 0.9, 0], b: [-0.32, 0.8, 0.02], r: [0.06, 0.035], col: "hair" },
      { t: "cap", a: [-0.32, 0.8, 0.02], b: [-0.42, 0.6, 0.0], r: [0.035, 0.01], col: "hair" },
      { t: "tor", c: [-0.15, 0.9, 0], R: 0.04, r: 0.018, rot: [0, 0, 70], col: "silk", k: 0.01 },
      { t: "ell", c: [0.19, 0.715, 0], r: [0.05, 0.036, 0.16], col: "mask", paint: true },
      // Near arm raised, gripping the silk thread that rises off the card.
      ...arm(1, [0.0, 0.94, 0.32], "torso", "skin"),
      { t: "cap", a: [0.0, 0.94, 0.32], b: [0.04, 1.34, 0.36], r: [0.018, 0.012], col: "silk", k: 0.01 },
      // A ribbon wrapped around the forearm.
      { t: "tor", c: [0.0, 0.8, 0.27], R: 0.05, r: 0.012, rot: [30, 0, 10], col: "silk", k: 0.005 },
      // Far arm stretched back, trailing a silk ribbon.
      ...arm(-1, [-0.18, 0.48, -0.2], "torso", "skin"),
      ...ribbon([-0.2, 0.47, -0.2], [-0.32, 0.36, -0.18], 0.025, "silk"),
      ...ribbon([-0.32, 0.36, -0.18], [-0.38, 0.2, -0.12], 0.018, "silk"),
    ],
    eyes: eyes("#c0263f"),
  },

  // Lía Brenner: physics student in a hoodie with a crimson backpack and a stack of books.
  "identity-funambula": {
    palette: {
      skin: SKIN, hair: "#2b2440", torso: "#4f7fb8", legs: "#33476a", boots: "#e8e2da", pack: "#c0263f", strap: "#6e1024",
      b1: "#e8a33a", b2: "#3a9a7a", b3: "#7a4aa0", paper: "#f6f1e4", hood: "#3f6a9a",
    },
    shapes: [
      // Backpack.
      { t: "box", c: [-0.16, 0.42, 0], s: [0.07, 0.13, 0.12], round: 0.06, col: "pack", k: 0.02 },
      { t: "box", c: [-0.22, 0.36, 0], s: [0.03, 0.06, 0.08], round: 0.03, col: "strap", k: 0.01 },
      ...body(),
      { t: "cap", a: [0.1, 0.54, 0.1], b: [0.1, 0.3, 0.12], r: [0.014, 0.014], col: "strap", mirror: true, k: 0.005 },
      { t: "box", c: [0.13, 0.36, 0], s: [0.02, 0.05, 0.08], round: 0.02, col: "hood", paint: true },
      { t: "cap", a: [0.13, 0.52, 0.03], b: [0.15, 0.42, 0.04], r: [0.006, 0.006], col: "paper", mirror: true, k: 0.002 },
      // Hood bunched behind the neck.
      { t: "tor", c: [-0.03, 0.56, 0], R: 0.1, r: 0.045, rot: [0, 0, -15], col: "hood" },
      // Hair: ponytail and fringe.
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [0.1, 0.87, -0.04], b: [0.21, 0.82, -0.1], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [-0.15, 0.86, 0], b: [-0.26, 0.68, 0], r: [0.055, 0.02], col: "hair" },
      // Near arm hugs a stack of books.
      { t: "box", c: [0.18, 0.4, 0.12], s: [0.07, 0.025, 0.09], round: 0.01, rot: [0, 0, 5], col: "b1", k: 0.005 },
      { t: "box", c: [0.18, 0.455, 0.12], s: [0.065, 0.025, 0.085], round: 0.01, rot: [0, 0, -4], col: "b2", k: 0.005 },
      { t: "box", c: [0.18, 0.51, 0.12], s: [0.06, 0.025, 0.08], round: 0.01, rot: [0, 0, 6], col: "b3", k: 0.005 },
      { t: "box", c: [0.25, 0.455, 0.12], s: [0.004, 0.08, 0.07], round: 0.003, col: "paper", paint: true },
      ...arm(1, [0.2, 0.44, 0.23], "torso", "skin"),
      // Far arm: waving.
      ...arm(-1, [0.1, 0.74, -0.26], "torso", "skin"),
    ],
    eyes: eyes("#5a3e8a"),
  },

  // Mole Tronante: a towering storm of muscle in stone-green, granite plates on the shoulders,
  // stormcloud hair, lightning cracks glowing over the skin and fists crackling with thunder.
  "hero-mole": {
    palette: {
      skin: "#6fa463", skinDk: "#4a7a48", stone: "#8f9c8a", stoneDk: "#5f6b5c", shorts: "#6a5f7c", hair: "#e4e8f2",
      bolt: "#fff27a", spark: "#9ff4ff", mouth: "#2a1a18",
    },
    glow: ["bolt", "spark"],
    shapes: [
      // Thick legs, bare feet.
      { t: "cap", a: [0.04, 0.08, 0.13], b: [0.0, 0.32, 0.13], r: [0.09, 0.11], col: "skin", mirror: true },
      { t: "ell", c: [0.08, 0.05, 0.13], r: [0.13, 0.055, 0.09], col: "skin", mirror: true },
      { t: "ell", c: [0, 0.34, 0], r: [0.19, 0.11, 0.24], col: "shorts", k: 0.04 },
      ...[0.1, -0.03, 0.17].flatMap((z): Shape[] => [
        { t: "cap", a: [0.06, 0.28, z], b: [0.08, 0.2, z + 0.01], r: [0.03, 0.006], col: "shorts", k: 0.02 },
      ]),
      // Huge leaning torso.
      { t: "ell", c: [0.03, 0.56, 0], r: [0.24, 0.22, 0.27], rot: [0, 0, -12], col: "skin", k: 0.06 },
      { t: "ell", c: [0.18, 0.63, 0], r: [0.12, 0.08, 0.26], col: "shorts", paint: true },
      { t: "cap", a: [0.2, 0.52, 0.04], b: [0.23, 0.44, -0.02], r: [0.012, 0.008], col: "bolt", paint: true },
      { t: "cap", a: [0.23, 0.44, -0.02], b: [0.21, 0.36, 0.05], r: [0.012, 0.008], col: "bolt", paint: true },
      // Massive shoulders with granite plates and crystals.
      { t: "ell", c: [-0.02, 0.72, 0.27], r: [0.15, 0.13, 0.14], col: "skin", mirror: true, k: 0.05 },
      { t: "ell", c: [-0.04, 0.8, 0.28], r: [0.13, 0.06, 0.12], rot: [0, 0, -10], col: "stone", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.04, 0.84, 0.3], b: [-0.08, 0.95, 0.36], r: [0.04, 0.01], col: "stoneDk", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.1, 0.83, 0.25], b: [-0.18, 0.92, 0.28], r: [0.035, 0.008], col: "stoneDk", mirror: true, k: 0.02 },
      // Small head low between the shoulders, stormcloud hair.
      { t: "ell", c: [0.15, 0.83, 0], r: [0.17, 0.16, 0.16], col: "skin", k: 0.06 },
      { t: "ell", c: [0.07, 0.93, 0], r: [0.15, 0.09, 0.17], col: "hair", k: 0.03 },
      { t: "ell", c: [0.0, 0.96, 0.06], r: [0.08, 0.07, 0.08], col: "hair", k: 0.04 },
      { t: "ell", c: [-0.04, 0.95, -0.07], r: [0.08, 0.07, 0.08], col: "hair", k: 0.04 },
      { t: "ell", c: [0.1, 1.01, 0], r: [0.07, 0.06, 0.07], col: "hair", k: 0.04 },
      { t: "box", c: [0.31, 0.76, 0], s: [0.02, 0.012, 0.05], round: 0.01, col: "mouth", paint: true },
      // Near arm: giant fist slammed forward, thunder sparks.
      { t: "cap", a: [0.04, 0.7, 0.33], b: [0.28, 0.48, 0.4], r: [0.1, 0.09], col: "skin" },
      { t: "ell", c: [0.2, 0.55, 0.4], r: [0.1, 0.05, 0.1], rot: [0, 0, -40], col: "stone", paint: true },
      { t: "ell", c: [0.35, 0.42, 0.42], r: [0.13, 0.12, 0.12], col: "skin", k: 0.03 },
      { t: "ell", c: [0.44, 0.45, 0.44], r: [0.05, 0.08, 0.08], col: "skinDk", paint: true },
      ...burst([0.37, 0.42, 0.43], 7, 10, 0.26, [0.035, 0.006], "bolt", { len: 0.2, r: [0.026, 0.005], col: "spark" }, 0.02),
      // Far arm: fist hammered down.
      { t: "cap", a: [0.0, 0.7, -0.33], b: [0.16, 0.38, -0.4], r: [0.1, 0.09], col: "skin" },
      { t: "ell", c: [0.2, 0.3, -0.41], r: [0.12, 0.115, 0.115], col: "skin", k: 0.03 },
      { t: "cap", a: [0.12, 0.2, -0.42], b: [0.05, 0.06, -0.44], r: [0.02, 0.004], col: "bolt", k: 0.02 },
      { t: "cap", a: [0.28, 0.2, -0.4], b: [0.36, 0.06, -0.38], r: [0.02, 0.004], col: "spark", k: 0.02 },
    ],
    eyes: eyesAt("#e8c21a", 0.17, 0.845, 0.075, 0.06, true),
  },

  // Dra. Irene Volkova: nuclear scientist in a long lab coat, round glasses, grey-streaked bun and a
  // clipboard with a glowing atom.
  "identity-mole": {
    palette: {
      skin: SKIN, hair: "#5a4038", grey: "#c8c8cc", torso: "#3f8a3a", legs: "#4a4a5a", boots: "#3a2e2a", coat: "#f4f6f8",
      coatDk: "#cfd6de", frame: "#8a3a2a", board: "#b0804a", paper: "#fbf8ee", atom: "#7ff07a",
    },
    glow: ["atom"],
    shapes: [
      ...body(),
      // Long lab coat (flared), open over a green blouse.
      { t: "cap", a: [-0.01, 0.21, 0], b: [0, 0.5, 0], r: [0.155, 0.13], col: "coat", k: 0.04 },
      { t: "box", c: [0.13, 0.42, 0], s: [0.05, 0.11, 0.06], round: 0.03, col: "torso", paint: true },
      { t: "cap", a: [0.14, 0.53, 0.06], b: [0.16, 0.36, 0.035], r: [0.012, 0.01], col: "coatDk", paint: true, mirror: true },
      // Hair with a grey-streaked bun.
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "hair" },
      { t: "cap", a: [0.08, 0.89, 0.0], b: [-0.12, 0.86, 0.0], r: [0.025, 0.02], col: "grey", paint: true },
      { t: "ell", c: [-0.13, 0.93, 0], r: [0.08, 0.08, 0.08], col: "hair" },
      { t: "tor", c: [-0.13, 0.93, 0], R: 0.07, r: 0.016, rot: [0, 0, 60], col: "grey", k: 0.01 },
      { t: "cap", a: [0.1, 0.87, 0.04], b: [0.2, 0.84, 0.1], r: [0.045, 0.015], col: "grey" },
      // Round glasses around the eyes.
      { t: "tor", c: [0.118, 0.705, 0.163], R: 0.066, r: 0.007, rot: [0, -59, -90], col: "frame", k: 0 },
      { t: "tor", c: [0.21, 0.708, -0.002], R: 0.062, r: 0.007, rot: [0, 0, -90], col: "frame", k: 0 },
      // Near arm: clipboard with a glowing atom.
      ...arm(1, [0.16, 0.38, 0.22], "coat", "skin"),
      { t: "box", c: [0.24, 0.48, 0.18], s: [0.012, 0.11, 0.08], round: 0.01, rot: [0, 0, 15], col: "board", k: 0.01 },
      { t: "box", c: [0.252, 0.47, 0.18], s: [0.006, 0.09, 0.065], round: 0.005, rot: [0, 0, 15], col: "paper", paint: true },
      { t: "tor", c: [0.255, 0.48, 0.18], R: 0.04, r: 0.006, rot: [30, 0, 90], col: "atom", paint: true },
      { t: "tor", c: [0.255, 0.48, 0.18], R: 0.04, r: 0.006, rot: [-30, 0, 90], col: "atom", paint: true },
      // Far arm: pen raised, explaining.
      ...arm(-1, [0.16, 0.62, -0.22], "coat", "skin"),
      { t: "cap", a: [0.17, 0.6, -0.22], b: [0.2, 0.74, -0.2], r: [0.012, 0.008], col: "frame", k: 0.005 },
    ],
    eyes: eyes("#3f8a3a"),
  },

  // Centella Estelar: star-powered pilot flying forward in a deep-blue and gold flight suit, short
  // swept hair, fist blazing with a star burst and a sparkling trail behind.
  "hero-centella": {
    palette: {
      skin: SKIN, hair: "#7a3a22", torso: "#1f3a7a", legs: "#1f3a7a", gold: "#d9a21b", boots: "#d9a21b",
      star: "#ffe27a", hot: "#fffbe0", trail: "#ffd24a",
    },
    glow: ["star", "hot", "trail"],
    shapes: [
      // Star trail behind the trailing feet.
      { t: "cap", a: [-0.28, 0.2, 0], b: [-0.6, 0.04, -0.02], r: [0.07, 0.01], col: "trail", k: 0.04 },
      { t: "cap", a: [-0.28, 0.24, 0.04], b: [-0.52, 0.2, 0.08], r: [0.04, 0.008], col: "star", k: 0.03 },
      ...burst([-0.48, 0.1, 0], 4, 0, 0.07, [0.022, 0.004], "hot", undefined, 0.02),
      // Legs trailing back.
      { t: "cap", a: [0, 0.36, 0.07], b: [-0.2, 0.24, 0.08], r: [0.06, 0.055], col: "legs" },
      { t: "ell", c: [-0.25, 0.22, 0.08], r: [0.07, 0.05, 0.055], rot: [0, 0, 30], col: "boots" },
      { t: "cap", a: [0, 0.36, -0.07], b: [-0.18, 0.2, -0.08], r: [0.06, 0.055], col: "legs" },
      { t: "ell", c: [-0.23, 0.17, -0.08], r: [0.07, 0.05, 0.055], rot: [0, 0, 40], col: "boots" },
      // Leaning torso with a gold chevron and sash.
      { t: "ell", c: [0.03, 0.48, 0], r: [0.13, 0.16, 0.15], rot: [0, 0, -20], col: "torso" },
      { t: "cap", a: [0.12, 0.6, 0.12], b: [0.17, 0.44, 0], r: [0.025, 0.025], col: "gold", paint: true },
      { t: "cap", a: [0.12, 0.6, -0.12], b: [0.17, 0.44, 0], r: [0.025, 0.025], col: "gold", paint: true },
      { t: "tor", c: [0.01, 0.37, 0], R: 0.125, r: 0.02, rot: [0, 0, -20], col: "gold" },
      { t: "ell", c: [0.03, 0.62, 0.15], r: [0.07, 0.05, 0.07], col: "gold", mirror: true, k: 0.02 },
      { t: "ell", c: [0.09, 0.78, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      // Short hair swept back.
      { t: "ell", c: [0.03, 0.86, 0], r: [0.19, 0.15, 0.2], col: "hair" },
      { t: "cap", a: [0.0, 0.92, 0], b: [-0.2, 0.92, 0.0], r: [0.08, 0.02], col: "hair" },
      { t: "cap", a: [0.0, 0.88, 0.12], b: [-0.18, 0.86, 0.16], r: [0.06, 0.015], col: "hair" },
      { t: "cap", a: [0.0, 0.88, -0.12], b: [-0.18, 0.86, -0.16], r: [0.06, 0.015], col: "hair" },
      { t: "cap", a: [0.16, 0.94, 0.04], b: [0.24, 0.9, 0.1], r: [0.045, 0.012], col: "hair" },
      // Near fist thrust forward and up in a star burst.
      { t: "cap", a: [0.04, 0.6, 0.16], b: [0.36, 0.66, 0.22], r: [0.05, 0.045], col: "torso" },
      { t: "ell", c: [0.38, 0.665, 0.22], r: [0.06, 0.055, 0.055], col: "gold", k: 0.02 },
      { t: "ell", c: [0.43, 0.67, 0.22], r: [0.06, 0.06, 0.06], col: "hot", k: 0 },
      ...burst([0.44, 0.67, 0.22], 8, 15, 0.17, [0.03, 0.004], "star", { len: 0.1, r: [0.022, 0.004], col: "hot" }, 0.02),
      // Far arm swept back, small glow.
      { t: "cap", a: [0.0, 0.6, -0.16], b: [-0.16, 0.44, -0.22], r: [0.05, 0.045], col: "torso" },
      { t: "ell", c: [-0.18, 0.42, -0.22], r: [0.055, 0.05, 0.05], col: "gold", k: 0.02 },
      ...burst([-0.19, 0.41, -0.22], 4, 45, 0.09, [0.02, 0.004], "star", undefined, 0.02),
    ],
    eyes: eyes("#f2b81a", false, 0.77, 0.09),
  },

  // Comandante Elena Saavedra: commander in a blue-grey uniform jacket with gold insignia, peaked
  // cap, a white flight helmet under her arm.
  "identity-centella": {
    palette: {
      skin: SKIN, hair: "#7a3a22", torso: "#3c5478", legs: "#2c3c58", boots: "#1f2430", gold: "#d9a21b", cap: "#2c3c58",
      helm: "#eef0f4", visor: "#1f3a7a", shirt: "#eef0f4", ribbon: "#b8322a",
    },
    shapes: [
      ...body(),
      { t: "tor", c: [0, 0.28, 0], R: 0.13, r: 0.02, col: "legs" },
      { t: "box", c: [0.13, 0.5, 0], s: [0.02, 0.05, 0.03], round: 0.02, col: "shirt", paint: true },
      { t: "ell", c: [0.14, 0.42, 0], r: [0.01, 0.012, 0.012], col: "gold", paint: true },
      { t: "ell", c: [0.14, 0.35, 0], r: [0.01, 0.012, 0.012], col: "gold", paint: true },
      { t: "box", c: [0.11, 0.45, 0.08], s: [0.03, 0.012, 0.035], round: 0.008, col: "ribbon", paint: true },
      { t: "ell", c: [0, 0.54, 0.15], r: [0.08, 0.035, 0.07], col: "gold", mirror: true, k: 0.02 },
      // Short hair under a peaked cap.
      { t: "ell", c: [-0.04, 0.77, 0], r: [0.19, 0.15, 0.2], col: "hair" },
      { t: "cap", a: [-0.1, 0.72, 0.15], b: [-0.05, 0.6, 0.17], r: [0.045, 0.02], col: "hair", mirror: true },
      { t: "ell", c: [-0.02, 0.88, 0], r: [0.2, 0.07, 0.2], col: "cap", k: 0.02 },
      { t: "ell", c: [0.15, 0.85, 0], r: [0.11, 0.015, 0.13], rot: [0, 0, -12], col: "boots", k: 0.01 },
      { t: "tor", c: [-0.02, 0.86, 0], R: 0.19, r: 0.014, col: "gold", k: 0.005 },
      { t: "ell", c: [0.16, 0.9, 0], r: [0.02, 0.025, 0.025], col: "gold", k: 0.005 },
      // Near arm: helmet held at the hip.
      ...arm(1, [0.12, 0.36, 0.24], "torso", "skin"),
      { t: "ell", c: [0.16, 0.36, 0.3], r: [0.1, 0.1, 0.1], col: "helm", k: 0.02 },
      { t: "ell", c: [0.25, 0.37, 0.32], r: [0.04, 0.06, 0.08], col: "visor", paint: true },
      { t: "cap", a: [0.1, 0.46, 0.3], b: [0.22, 0.44, 0.33], r: [0.015, 0.015], col: "gold", paint: true },
      // Far arm: saluting.
      ...arm(-1, [0.18, 0.84, -0.14], "torso", "skin"),
    ],
    eyes: eyes("#3a6a3a"),
  },

  // Soberano de Oricalco: king in living golden armour with glowing violet seams, crown-crested
  // open helm, regal purple cloak and clawed gauntlets.
  "hero-soberano": {
    palette: {
      skin: SKIN_DEEP, torso: "#e3b23c", legs: "#c8922a", boots: "#6b3fa0", gold: "#e3b23c", goldDk: "#a8741e",
      cloak: "#6b3fa0", cloakIn: "#3f2266", seam: "#c77dff", gem: "#e9c2ff",
    },
    glow: ["seam", "gem"],
    shapes: [
      // Cloak.
      { t: "ell", c: [-0.13, 0.36, 0], r: [0.08, 0.34, 0.3], rot: [0, 0, -8], col: "cloak", k: 0.03 },
      { t: "ell", c: [-0.07, 0.34, 0], r: [0.03, 0.29, 0.26], rot: [0, 0, -8], col: "cloakIn", paint: true },
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "tor", c: [0, 0.28, 0], R: 0.14, r: 0.024, col: "goldDk" },
      { t: "box", c: [0.07, 0.43, 0], s: [0.09, 0.1, 0.13], round: 0.07, col: "gold", k: 0.03 },
      { t: "cap", a: [0.15, 0.52, 0], b: [0.16, 0.34, 0], r: [0.009, 0.009], col: "seam", paint: true },
      { t: "cap", a: [0.15, 0.48, 0.0], b: [0.11, 0.42, 0.11], r: [0.008, 0.008], col: "seam", paint: true, mirror: true },
      { t: "ell", c: [0.16, 0.45, 0], r: [0.03, 0.035, 0.035], col: "gem", k: 0.01 },
      { t: "cap", a: [0.07, 0.2, 0.07], b: [0.07, 0.1, 0.075], r: [0.008, 0.008], col: "seam", paint: true, mirror: true },
      // Pauldrons with the cloak clasp.
      { t: "ell", c: [-0.01, 0.55, 0.16], r: [0.1, 0.07, 0.09], col: "gold", mirror: true, k: 0.02 },
      { t: "ell", c: [0.0, 0.58, 0.2], r: [0.06, 0.02, 0.05], col: "seam", paint: true, mirror: true },
      // Open helm with a crown crest.
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.2, 0.16, 0.205], col: "gold", k: 0.02 },
      { t: "box", c: [0.155, 0.875, 0], s: [0.03, 0.01, 0.13], round: 0.008, rot: [0, 0, -20], col: "seam", paint: true },
      { t: "tor", c: [-0.03, 0.92, 0], R: 0.15, r: 0.03, col: "gold", k: 0.03 },
      ...[0, 55, 110, 160, 200, 250, 305].map((a): Shape => {
        const x = -0.03 + 0.15 * Math.cos(rad(a)), z = 0.15 * Math.sin(rad(a));
        return { t: "cap", a: [x, 0.93, z], b: [x + 0.02 * Math.cos(rad(a)), a === 0 ? 1.1 : 1.04, z * 1.12], r: [0.032, 0.007], col: "gold", k: 0.02 };
      }),
      { t: "ell", c: [0.125, 0.93, 0], r: [0.025, 0.03, 0.03], col: "gem", k: 0.005 },
      // Near arm: clawed gauntlet raised.
      ...arm(1, [0.2, 0.44, 0.3], "gold", "gold", 0.05),
      { t: "tor", c: [0.14, 0.46, 0.27], R: 0.05, r: 0.012, rot: [0, 0, 60], col: "seam", k: 0 },
      ...[-0.03, 0, 0.03].map((dz, i): Shape => spike([0.24, 0.45 + i * 0.012, 0.3 + dz], 20, 0.12, [0.017, 0.003], "seam", 0.01)),
      // Far arm: claws lowered.
      ...arm(-1, [0.18, 0.34, -0.22], "gold", "gold", 0.05),
      ...[-0.03, 0, 0.03].map((dz): Shape => spike([0.22, 0.33, -0.22 + dz], -20, 0.1, [0.016, 0.003], "seam", 0.01)),
    ],
    eyes: eyes("#b26bff", true),
  },

  // Rey Adisa Mbeki: king in ceremonial purple-and-gold robes with a short beard, a gold circlet
  // and a tall staff topped with an oricalco orb.
  "identity-soberano": {
    palette: {
      skin: SKIN_DEEP, hair: "#1e1410", torso: "#6b3fa0", legs: "#3f2266", boots: "#3a2416", robe: "#6b3fa0",
      gold: "#e3b23c", pattern: "#f2d36a", beard: "#1e1410", orb: "#c77dff", wood: "#5a3a22",
    },
    glow: ["orb"],
    shapes: [
      ...body(),
      // Long robe with gold bands.
      { t: "cap", a: [-0.01, 0.13, 0], b: [0, 0.5, 0], r: [0.18, 0.13], col: "robe", k: 0.04 },
      { t: "tor", c: [-0.01, 0.15, 0], R: 0.17, r: 0.025, col: "gold", k: 0.02 },
      { t: "box", c: [0.15, 0.32, 0], s: [0.04, 0.17, 0.035], round: 0.02, col: "gold", paint: true },
      ...[0.2, 0.28, 0.36].map((y): Shape => ({ t: "box", c: [0.17, y, 0], s: [0.03, 0.01, 0.04], round: 0.005, col: "torso", paint: true })),
      { t: "cap", a: [0.12, 0.56, 0.12], b: [0.05, 0.3, -0.16], r: [0.03, 0.03], col: "pattern", paint: true },
      { t: "tor", c: [0, 0.55, 0], R: 0.11, r: 0.035, col: "gold" },
      // Close-cropped hair, short beard, circlet.
      { t: "ell", c: [-0.03, 0.78, 0], r: [0.19, 0.15, 0.195], col: "hair" },
      { t: "ell", c: [0.14, 0.6, 0], r: [0.08, 0.06, 0.11], col: "beard", k: 0.04 },
      { t: "box", c: [0.2, 0.635, 0], s: [0.03, 0.008, 0.035], round: 0.006, col: "skin", paint: true },
      { t: "tor", c: [0.0, 0.84, 0], R: 0.19, r: 0.018, rot: [0, 0, 8], col: "gold", k: 0.005 },
      { t: "ell", c: [0.19, 0.86, 0], r: [0.02, 0.03, 0.03], col: "orb", k: 0.005 },
      // Near arm: tall staff with an orb.
      ...arm(1, [0.16, 0.42, 0.24], "robe", "skin"),
      { t: "cap", a: [0.17, 0.04, 0.26], b: [0.17, 0.92, 0.26], r: [0.018, 0.018], col: "wood", k: 0.01 },
      { t: "tor", c: [0.17, 0.92, 0.26], R: 0.05, r: 0.014, col: "gold", k: 0.01 },
      { t: "ell", c: [0.17, 0.98, 0.26], r: [0.055, 0.055, 0.055], col: "orb", k: 0.01 },
      { t: "cap", a: [0.17, 0.92, 0.26], b: [0.22, 1.04, 0.26], r: [0.012, 0.004], col: "gold", k: 0.01 },
      { t: "cap", a: [0.17, 0.92, 0.26], b: [0.12, 1.04, 0.26], r: [0.012, 0.004], col: "gold", k: 0.01 },
      // Far arm: open palm.
      ...arm(-1, [0.2, 0.42, -0.2], "robe", "skin"),
    ],
    eyes: eyes("#7a4a2a"),
  },

  // Mazagón, el Titán Embestidor: a hunched dark-steel juggernaut charging head-first behind one
  // huge iron battering-ram horn, rust-orange straps, belt and rivets, big fists thrust forward.
  "villain-asalto-arsenal": {
    palette: {
      steel: "#5d6670", plate: "#7c8792", under: "#2e3238", rust: "#c4612c", rivet: "#e8a066", iron: "#a3adb8",
      shade: "#22252a",
    },
    shapes: [
      // Legs mid-stride.
      { t: "cap", a: [0.12, 0.08, 0.15], b: [0.02, 0.32, 0.14], r: [0.085, 0.1], col: "under" },
      { t: "ell", c: [0.16, 0.055, 0.15], r: [0.12, 0.055, 0.09], col: "steel" },
      { t: "cap", a: [-0.2, 0.08, -0.14], b: [-0.06, 0.32, -0.13], r: [0.085, 0.1], col: "under" },
      { t: "ell", c: [-0.18, 0.055, -0.14], r: [0.12, 0.055, 0.09], col: "steel" },
      // Huge hunched body in one steel shell, rust belt and a crossed strap.
      { t: "ell", c: [0.0, 0.47, 0], r: [0.28, 0.25, 0.28], rot: [0, 0, -22], col: "steel", k: 0.06 },
      { t: "box", c: [0.03, 0.3, 0], s: [0.3, 0.03, 0.3], round: 0.02, rot: [0, 0, -14], col: "rust", paint: true },
      { t: "cap", a: [0.16, 0.62, 0.2], b: [0.24, 0.34, -0.14], r: [0.022, 0.022], col: "rust", paint: true },
      ...([[0.27, 0.5, 0.08], [0.29, 0.42, -0.04], [0.26, 0.56, -0.12]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.017, 0.017, 0.017], col: "rivet", k: 0.004 })),
      // Hump plate across the back.
      { t: "ell", c: [-0.1, 0.64, 0], r: [0.2, 0.1, 0.25], rot: [0, 0, -30], col: "plate", k: 0.025 },
      // Head low and forward in a battering-ram helm: brim over angry eyes, one huge iron ram horn.
      { t: "ell", c: [0.27, 0.66, 0], r: [0.16, 0.15, 0.16], col: "shade", k: 0.05 },
      { t: "ell", c: [0.25, 0.73, 0], r: [0.17, 0.11, 0.175], col: "plate", k: 0.02 },
      { t: "box", c: [0.37, 0.72, 0], s: [0.06, 0.025, 0.15], round: 0.02, rot: [0, 0, -8], col: "plate", k: 0.02 },
      { t: "cap", a: [0.34, 0.78, 0], b: [0.74, 0.86, 0], r: [0.1, 0.02], col: "iron", k: 0.03 },
      { t: "tor", c: [0.38, 0.785, 0], R: 0.09, r: 0.022, rot: [0, 0, -80], col: "rust", k: 0.01 },
      ...([[0.25, 0.8, 0.13], [0.25, 0.8, -0.13], [0.2, 0.84, 0]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.017, 0.017, 0.017], col: "rivet", k: 0.004 })),
      // Shoulder plates with rust trim.
      { t: "ell", c: [0.04, 0.63, 0.24], r: [0.15, 0.09, 0.12], rot: [0, 0, -20], col: "plate", mirror: true, k: 0.02 },
      { t: "ell", c: [0.05, 0.6, 0.31], r: [0.13, 0.02, 0.07], rot: [0, 0, -20], col: "rust", paint: true, mirror: true },
      // Both big fists thrust forward, rust knuckle bands.
      { t: "cap", a: [0.08, 0.58, 0.29], b: [0.3, 0.34, 0.38], r: [0.09, 0.08], col: "steel" },
      { t: "ell", c: [0.41, 0.3, 0.4], r: [0.13, 0.12, 0.12], col: "plate", k: 0.02 },
      { t: "ell", c: [0.32, 0.33, 0.39], r: [0.025, 0.11, 0.11], col: "rust", paint: true },
      { t: "cap", a: [0.08, 0.58, -0.29], b: [0.3, 0.46, -0.34], r: [0.09, 0.08], col: "steel" },
      { t: "ell", c: [0.41, 0.44, -0.35], r: [0.13, 0.12, 0.12], col: "plate", k: 0.02 },
      { t: "ell", c: [0.32, 0.46, -0.345], r: [0.025, 0.11, 0.11], col: "rust", paint: true },
    ],
    eyes: [
      { at: [0.3, 0.645, 0.075], r: 0.062, iris: "#ff9a1a", angry: true, look: [0.75, -0.03, 0.6] },
      { at: [0.3, 0.645, -0.045], r: 0.058, iris: "#ff9a1a", angry: true, look: [0.97, -0.03, 0.22] },
    ],
  },

  // Estruendo, el Maestro del Sonido: a conductor-villain in a dark-violet tailcoat, tuning-fork
  // crest on his helm, a gramophone sound-cannon arm firing magenta sound rings and a baton.
  "villain-sinfonia": {
    palette: {
      skin: "#d8c8e8", coat: "#3a2458", coatDk: "#24163a", lapel: "#ff3fb4", wave: "#ff5cc8", metal: "#a8a0bc",
      cone: "#14101c", boots: "#1c1426", legs: "#24163a", baton: "#f4ecf8",
    },
    glow: ["wave", "lapel"],
    shapes: [
      // Tailcoat tails.
      { t: "cap", a: [-0.08, 0.4, 0.05], b: [-0.22, 0.14, 0.06], r: [0.06, 0.03], col: "coat", mirror: true, k: 0.03 },
      { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.08, 0.072], b: [0, 0.28, 0.068], r: [0.058, 0.065], col: "legs", mirror: true },
      { t: "ell", c: [0, 0.42, 0], r: [0.14, 0.17, 0.16], col: "coat" },
      { t: "cap", a: [0.11, 0.55, 0.07], b: [0.15, 0.36, 0.0], r: [0.025, 0.012], col: "lapel", paint: true, mirror: true },
      ...[0.5, 0.43, 0.36].map((y): Shape => ({ t: "tor", c: [0.15, y, 0], R: 0.03, r: 0.006, rot: [0, 0, 90], col: "wave", paint: true })),
      { t: "ell", c: [0, 0.55, 0.16], r: [0.09, 0.06, 0.08], col: "coatDk", mirror: true, k: 0.02 },
      // Head and helm with a tuning-fork crest.
      { t: "ell", c: [0.04, 0.74, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.07 },
      { t: "ell", c: [-0.02, 0.81, 0], r: [0.19, 0.14, 0.19], col: "coatDk", k: 0.02 },
      { t: "cap", a: [0.1, 0.78, 0.17], b: [0.2, 0.72, 0.14], r: [0.025, 0.015], col: "coatDk", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.02, 0.9, 0], b: [-0.02, 1.0, 0], r: [0.025, 0.02], col: "metal", k: 0.02 },
      { t: "tor", c: [-0.02, 1.04, 0], R: 0.06, r: 0.018, rot: [90, 0, 0], col: "metal", k: 0.01 },
      { t: "box", c: [-0.02, 1.1, 0], s: [0.06, 0.06, 0.03], round: 0, col: "metal", cut: true, k: 0 },
      { t: "cap", a: [-0.08, 1.04, 0], b: [-0.08, 1.17, 0], r: [0.018, 0.014], col: "metal", k: 0.01 },
      { t: "cap", a: [0.04, 1.04, 0], b: [0.04, 1.17, 0], r: [0.018, 0.014], col: "metal", k: 0.01 },
      { t: "box", c: [0.2, 0.67, 0], s: [0.02, 0.008, 0.04], round: 0.006, col: "cone", paint: true },
      // Far arm: gramophone sound cannon firing rings.
      { t: "cap", a: [0, 0.54, -0.16], b: [0.16, 0.52, -0.24], r: [0.055, 0.05], col: "coat" },
      { t: "cap", a: [0.14, 0.52, -0.24], b: [0.36, 0.56, -0.28], r: [0.05, 0.13], col: "metal", k: 0.02 },
      { t: "tor", c: [0.37, 0.56, -0.28], R: 0.125, r: 0.022, rot: [0, 0, 80], col: "wave", k: 0.01 },
      { t: "ell", c: [0.4, 0.56, -0.28], r: [0.06, 0.11, 0.11], col: "cone", cut: true, k: 0.01 },
      { t: "tor", c: [0.48, 0.565, -0.29], R: 0.14, r: 0.014, rot: [0, 0, 80], col: "wave", k: 0 },
      { t: "tor", c: [0.58, 0.57, -0.3], R: 0.17, r: 0.012, rot: [0, 0, 80], col: "wave", k: 0 },
      { t: "cap", a: [0.36, 0.56, -0.28], b: [0.6, 0.57, -0.3], r: [0.012, 0.012], col: "wave", k: 0.0 },
      // Near arm: conductor's baton raised.
      ...arm(1, [0.06, 0.8, 0.3], "coat", "skin"),
      { t: "cap", a: [0.06, 0.8, 0.3], b: [0.12, 1.0, 0.34], r: [0.012, 0.006], col: "baton", k: 0.005 },
    ],
    eyes: [{ at: [0.06, 0.73, 0.06], r: 0.055, iris: "#ff3fb4", mirror: true, angry: true, look: [0.85, 0.02, 0.5] }],
  },

  // Nexo, la IA Rebelde: a floating segmented metal core with a glowing red eye band, cable claws
  // below, a thruster glow and attack drones tethered by red beams.
  "villain-enjambre": {
    palette: {
      shell: "#59636f", shellDk: "#353c46", plate: "#9aa4b0", band: "#ff2a3a", hot: "#ffb0b0", cable: "#2a2f36",
      jet: "#ff5a4a",
    },
    glow: ["band", "hot", "jet"],
    shapes: [
      // Thruster plume to the ground.
      { t: "cap", a: [0, 0.24, 0], b: [0, 0.02, 0], r: [0.07, 0.015], col: "jet", k: 0.02 },
      // Core shell.
      { t: "ell", c: [0, 0.55, 0], r: [0.27, 0.27, 0.27], col: "shell", k: 0.04 },
      { t: "ell", c: [0, 0.82, 0], r: [0.1, 0.05, 0.1], col: "plate", k: 0.04 },
      { t: "cap", a: [0, 0.85, 0], b: [-0.06, 1.0, 0], r: [0.02, 0.008], col: "plate", k: 0.01 },
      { t: "ell", c: [-0.06, 1.01, 0], r: [0.022, 0.022, 0.022], col: "band", k: 0.005 },
      ...[0.68, 0.43].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: Math.sqrt(0.27 * 0.27 - (y - 0.55) ** 2), r: 0.012, col: "shellDk", paint: true })),
      ...[0, 60, 120].map((a): Shape => ({ t: "box", c: [0, 0.55, 0], s: [0.3, 0.3, 0.008], round: 0, rot: [0, a, 0], col: "shellDk", paint: true })),
      // Visor band.
      { t: "tor", c: [0, 0.57, 0], R: 0.26, r: 0.05, rot: [0, 0, -6], col: "shellDk", k: 0.01 },
      { t: "box", c: [0.26, 0.575, 0], s: [0.06, 0.035, 0.2], round: 0.03, col: "band", paint: true },
      // Bottom ring and cable claws.
      { t: "tor", c: [0, 0.32, 0], R: 0.12, r: 0.035, col: "plate", k: 0.03 },
      ...[30, 150, 270].flatMap((a): Shape[] => {
        const x = Math.cos(rad(a)), z = Math.sin(rad(a));
        return [
          { t: "cap", a: [0.1 * x, 0.32, 0.1 * z], b: [0.24 * x, 0.18, 0.24 * z], r: [0.022, 0.018], col: "cable", k: 0.02 },
          { t: "cap", a: [0.24 * x, 0.18, 0.24 * z], b: [0.28 * x, 0.06, 0.28 * z], r: [0.018, 0.006], col: "plate", k: 0.02 },
        ];
      }),
      // Drones tethered by beams.
      ...([[0.18, 0.95, 0.3], [-0.3, 0.9, -0.2], [0.38, 0.28, -0.22]] as V3[]).flatMap((d): Shape[] => [
        { t: "cap", a: [d[0] * 0.4, 0.55 + (d[1] - 0.55) * 0.4, d[2] * 0.4], b: d, r: [0.008, 0.008], col: "band", k: 0 },
        { t: "ell", c: d, r: [0.06, 0.045, 0.06], col: "shell", k: 0.01 },
        { t: "ell", c: [d[0], d[1] + 0.03, d[2]], r: [0.07, 0.012, 0.07], col: "plate", k: 0.01 },
        { t: "ell", c: [d[0] + 0.05, d[1], d[2] + 0.02], r: [0.02, 0.02, 0.02], col: "band", k: 0.005 },
      ]),
    ],
    eyes: [{ at: [0.1, 0.58, 0.08], r: 0.06, iris: "#ff2a3a", mirror: true, angry: true, look: [0.8, 0.0, 0.55] }],
  },
};
