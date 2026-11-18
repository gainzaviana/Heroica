import type { Sculpt } from "../sculpt";
import { SKIN, arm, body, eyes } from "./kit";

/** Allies: the friendly characters that join the hero (drone, giant, huntress, guards, inventors…). */
export const artAliados: Record<string, Sculpt> = {
  // Lumen: a round combat drone with one big friendly lens, cyan glow and little thrusters.
  "lumen-ia": {
    palette: { shell: "#e8eef4", dark: "#34465a", screen: "#1c2a3a", lens: "#5ef0ff", jet: "#9af8ff", accent: "#ffb23a" },
    glow: ["lens", "jet"],
    shapes: [
      { t: "ell", c: [0, 0.52, 0], r: [0.22, 0.2, 0.22], col: "shell", k: 0.05 },
      { t: "tor", c: [0, 0.47, 0], R: 0.215, r: 0.024, col: "dark", k: 0.01 },
      { t: "ell", c: [0.17, 0.56, 0.03], r: [0.08, 0.12, 0.15], col: "screen", paint: true },
      { t: "ell", c: [0.21, 0.47, 0.0], r: [0.02, 0.012, 0.06], col: "lens", paint: true },
      // Side fins and thrusters.
      { t: "box", c: [-0.04, 0.6, 0.21], s: [0.07, 0.03, 0.035], round: 0.02, rot: [20, 0, 25], col: "dark", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.08, 0.44, 0.17], b: [-0.13, 0.38, 0.24], r: [0.05, 0.06], col: "dark", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.15, 0.36, 0.26], b: [-0.24, 0.24, 0.3], r: [0.045, 0.006], col: "jet", mirror: true, k: 0.02 },
      { t: "cap", a: [0, 0.34, 0], b: [0, 0.28, 0], r: [0.08, 0.06], col: "dark", k: 0.02 },
      { t: "cap", a: [0, 0.26, 0], b: [0, 0.1, 0], r: [0.055, 0.005], col: "jet", k: 0.02 },
      // Antenna.
      { t: "cap", a: [-0.03, 0.7, 0], b: [-0.07, 0.82, 0], r: [0.014, 0.011], col: "dark", k: 0.01 },
      { t: "ell", c: [-0.075, 0.845, 0], r: [0.03, 0.03, 0.03], col: "accent", k: 0.01 },
      // Little blaster arm on the near side.
      { t: "cap", a: [0.04, 0.44, 0.19], b: [0.16, 0.4, 0.27], r: [0.03, 0.026], col: "dark", k: 0.02 },
      { t: "cap", a: [0.16, 0.4, 0.27], b: [0.29, 0.42, 0.29], r: [0.035, 0.03], col: "shell", k: 0.01 },
      { t: "ell", c: [0.3, 0.42, 0.29], r: [0.012, 0.025, 0.025], col: "lens", k: 0.005 },
    ],
    eyes: [{ at: [0.04, 0.57, 0.03], r: 0.09, iris: "#25d8f0", look: [0.8, 0.04, 0.55] }],
  },

  // Torvo: a hulking furious giant, reddish-purple, stubby horns, roaring with a fist raised.
  "torvo-iracundo": {
    palette: {
      skin: "#b8527e", dk: "#8a3a62", pants: "#3a3a58", belt: "#7a4e2a", horn: "#f2e2c0", hair: "#2a1a2a",
      mouth: "#3a0a1a", teeth: "#fff8e8", metal: "#8f96a0",
    },
    shapes: [
      { t: "ell", c: [0.06, 0.05, 0.12], r: [0.11, 0.06, 0.09], col: "dk", mirror: true },
      { t: "cap", a: [0, 0.08, 0.11], b: [0, 0.26, 0.1], r: [0.08, 0.09], col: "pants", mirror: true },
      { t: "ell", c: [0, 0.27, 0], r: [0.2, 0.11, 0.22], col: "pants", k: 0.04 },
      { t: "ell", c: [0.02, 0.46, 0], r: [0.22, 0.23, 0.24], col: "skin", k: 0.06 },
      { t: "tor", c: [0, 0.3, 0], R: 0.2, r: 0.03, col: "belt", k: 0.01 },
      { t: "ell", c: [0.18, 0.47, 0], r: [0.08, 0.1, 0.15], col: "dk", paint: true },
      { t: "ell", c: [-0.02, 0.6, 0.22], r: [0.13, 0.11, 0.12], col: "skin", mirror: true, k: 0.05 },
      // Low, forward head with horns, heavy brow and a roaring mouth.
      { t: "ell", c: [0.13, 0.68, 0], r: [0.15, 0.14, 0.15], col: "skin", k: 0.07 },
      { t: "ell", c: [0.06, 0.8, 0], r: [0.11, 0.05, 0.11], col: "hair", k: 0.03 },
      { t: "cap", a: [0.1, 0.78, 0.09], b: [0.1, 0.9, 0.16], r: [0.04, 0.012], col: "horn", mirror: true, k: 0.02 },
      { t: "box", c: [0.26, 0.75, 0], s: [0.03, 0.02, 0.12], round: 0.015, col: "hair", paint: true },
      { t: "ell", c: [0.28, 0.6, 0], r: [0.04, 0.035, 0.07], col: "mouth", cut: true, k: 0.02 },
      { t: "ell", c: [0.25, 0.6, 0], r: [0.06, 0.045, 0.09], col: "mouth", paint: true },
      { t: "cap", a: [0.25, 0.64, 0.04], b: [0.26, 0.61, 0.04], r: [0.012, 0.004], col: "teeth", mirror: true, k: 0.005 },
      // Near fist forward, far fist raised high.
      { t: "cap", a: [-0.02, 0.6, 0.27], b: [0.17, 0.44, 0.34], r: [0.085, 0.075], col: "skin", k: 0.04 },
      { t: "tor", c: [0.2, 0.43, 0.35], R: 0.07, r: 0.025, rot: [0, 0, 60], col: "metal", k: 0.01 },
      { t: "ell", c: [0.28, 0.4, 0.36], r: [0.13, 0.12, 0.12], col: "dk", k: 0.04 },
      { t: "cap", a: [-0.02, 0.6, -0.27], b: [0.04, 0.84, -0.32], r: [0.085, 0.075], col: "skin", k: 0.04 },
      { t: "ell", c: [0.07, 0.96, -0.33], r: [0.13, 0.12, 0.12], col: "dk", k: 0.04 },
    ],
    eyes: eyes("#ffd23a", true, 0.7, 0.13, 0.045),
  },

  // Zarpa: cat huntress crouched to pounce, striped orange hair, ears, tail and claws.
  "zarpa-cazadora": {
    palette: {
      skin: SKIN, fur: "#f08a2a", stripe: "#5a2a1a", suit: "#2f6a5e", suitDk: "#1f4a42", claw: "#fff6e0",
      ear: "#ffb0a0", belt: "#c9a24a",
    },
    shapes: [
      { t: "ell", c: [0.12, 0.04, 0.1], r: [0.09, 0.04, 0.06], col: "suitDk", mirror: true },
      { t: "cap", a: [-0.06, 0.22, 0.1], b: [0.12, 0.22, 0.1], r: [0.07, 0.055], col: "suit", mirror: true },
      { t: "cap", a: [0.12, 0.22, 0.1], b: [0.08, 0.07, 0.1], r: [0.055, 0.045], col: "suit", mirror: true },
      { t: "ell", c: [0, 0.36, 0], r: [0.16, 0.14, 0.14], rot: [0, 0, -25], col: "suit" },
      { t: "tor", c: [-0.02, 0.28, 0], R: 0.12, r: 0.02, rot: [0, 0, -25], col: "belt", k: 0.01 },
      // Tail curling up behind.
      { t: "cap", a: [-0.14, 0.28, 0], b: [-0.3, 0.3, 0], r: [0.04, 0.035], col: "fur", k: 0.03 },
      { t: "cap", a: [-0.3, 0.3, 0], b: [-0.38, 0.46, 0], r: [0.035, 0.032], col: "fur", k: 0.03 },
      { t: "cap", a: [-0.38, 0.46, 0], b: [-0.32, 0.6, 0], r: [0.032, 0.03], col: "fur", k: 0.03 },
      { t: "ell", c: [-0.32, 0.6, 0], r: [0.05, 0.05, 0.05], col: "stripe", paint: true },
      { t: "ell", c: [-0.37, 0.42, 0], r: [0.05, 0.02, 0.05], col: "stripe", paint: true },
      // Head, striped hair and cat ears.
      { t: "ell", c: [0.1, 0.6, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [0.04, 0.67, 0], r: [0.19, 0.16, 0.2], col: "fur" },
      { t: "cap", a: [-0.08, 0.66, 0], b: [-0.26, 0.5, 0], r: [0.1, 0.03], col: "fur" },
      { t: "cap", a: [0.18, 0.74, 0.05], b: [0.24, 0.66, 0.12], r: [0.05, 0.015], col: "fur" },
      { t: "cap", a: [0.0, 0.83, 0.05], b: [0.12, 0.78, 0.07], r: [0.012, 0.012], col: "stripe", paint: true },
      { t: "cap", a: [-0.08, 0.8, 0.12], b: [0.02, 0.72, 0.17], r: [0.012, 0.012], col: "stripe", paint: true },
      { t: "cap", a: [-0.14, 0.72, 0.1], b: [-0.08, 0.62, 0.17], r: [0.012, 0.012], col: "stripe", paint: true },
      { t: "cap", a: [0.04, 0.8, 0.1], b: [0.04, 0.95, 0.15], r: [0.06, 0.012], col: "fur", mirror: true, k: 0.03 },
      { t: "ell", c: [0.08, 0.86, 0.12], r: [0.02, 0.04, 0.03], col: "ear", paint: true, mirror: true },
      // Both clawed hands reaching forward.
      { t: "cap", a: [0.03, 0.44, 0.14], b: [0.26, 0.28, 0.2], r: [0.045, 0.04], col: "suit" },
      { t: "ell", c: [0.28, 0.27, 0.2], r: [0.05, 0.045, 0.05], col: "skin", k: 0.02 },
      { t: "cap", a: [0.31, 0.27, 0.17], b: [0.38, 0.24, 0.17], r: [0.012, 0.003], col: "claw", k: 0.005 },
      { t: "cap", a: [0.32, 0.27, 0.2], b: [0.39, 0.24, 0.21], r: [0.012, 0.003], col: "claw", k: 0.005 },
      { t: "cap", a: [0.31, 0.27, 0.23], b: [0.38, 0.24, 0.25], r: [0.012, 0.003], col: "claw", k: 0.005 },
      { t: "cap", a: [0.03, 0.44, -0.14], b: [0.28, 0.42, -0.18], r: [0.045, 0.04], col: "suit" },
      { t: "ell", c: [0.3, 0.42, -0.18], r: [0.05, 0.045, 0.05], col: "skin", k: 0.02 },
      { t: "cap", a: [0.33, 0.44, -0.18], b: [0.4, 0.47, -0.18], r: [0.012, 0.003], col: "claw", k: 0.005 },
      { t: "cap", a: [0.33, 0.42, -0.15], b: [0.41, 0.44, -0.14], r: [0.012, 0.003], col: "claw", k: 0.005 },
    ],
    eyes: eyes("#8ad040", false, 0.6, 0.1),
  },

  // Halcón Plateado: winged hero in a beaked silver helmet, metallic wings spread, pointing ahead.
  "halcon-plateado": {
    palette: {
      skin: SKIN, torso: "#26707e", legs: "#1d4f5a", boots: "#b8c4d0", helm: "#b4c0d0", mask: "#1d4f5a", wing: "#c2ccd8",
      tip: "#8a98aa", gold: "#ffcc3a", glove: "#b8c4d0",
    },
    shapes: [
      // Wings sweep up and back from the shoulders.
      { t: "cap", a: [-0.1, 0.5, 0.06], b: [-0.2, 0.78, 0.3], r: [0.05, 0.045], col: "wing", mirror: true },
      { t: "cap", a: [-0.2, 0.78, 0.3], b: [-0.3, 1.02, 0.44], r: [0.045, 0.018], col: "wing", mirror: true },
      { t: "cap", a: [-0.2, 0.76, 0.3], b: [-0.42, 0.88, 0.48], r: [0.042, 0.016], col: "wing", mirror: true },
      { t: "cap", a: [-0.2, 0.72, 0.28], b: [-0.46, 0.7, 0.46], r: [0.04, 0.015], col: "wing", mirror: true },
      { t: "cap", a: [-0.18, 0.66, 0.26], b: [-0.42, 0.52, 0.42], r: [0.038, 0.014], col: "wing", mirror: true },
      { t: "ell", c: [-0.4, 0.75, 0.46], r: [0.1, 0.2, 0.1], col: "tip", paint: true, mirror: true },
      ...body(),
      { t: "ell", c: [0.12, 0.42, 0], r: [0.035, 0.06, 0.07], col: "helm", paint: true },
      { t: "tor", c: [0, 0.28, 0], R: 0.125, r: 0.022, col: "gold" },
      // Falcon helmet with a golden beak over the brow.
      { t: "ell", c: [-0.02, 0.78, 0], r: [0.2, 0.16, 0.21], col: "helm" },
      { t: "cap", a: [0.1, 0.88, 0], b: [0.3, 0.76, 0], r: [0.07, 0.014], col: "gold", k: 0.02 },
      { t: "ell", c: [0.19, 0.72, 0], r: [0.05, 0.045, 0.17], col: "mask", paint: true },
      { t: "cap", a: [-0.06, 0.8, 0.17], b: [-0.2, 0.9, 0.2], r: [0.035, 0.008], col: "helm", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.1, 0.86, 0], b: [-0.26, 0.92, 0], r: [0.05, 0.01], col: "helm", k: 0.02 },
      // Near arm points forward, far fist at the hip.
      { t: "cap", a: [0, 0.5, 0.15], b: [0.32, 0.6, 0.2], r: [0.047, 0.043], col: "torso" },
      { t: "ell", c: [0.34, 0.6, 0.2], r: [0.05, 0.045, 0.045], col: "glove", k: 0.02 },
      { t: "cap", a: [0.37, 0.61, 0.2], b: [0.44, 0.63, 0.2], r: [0.016, 0.014], col: "glove", k: 0.01 },
      ...arm(-1, [0.06, 0.32, -0.2], "torso", "glove"),
    ],
    eyes: eyes("#3ab0ff"),
  },

  // Capitana Fernández: veteran guard captain in navy with a blue cape, round shield and short grey hair.
  "capitana-fernandez": {
    palette: {
      skin: "#ecb994", hair: "#b8bcc4", torso: "#24346a", legs: "#1c2848", boots: "#1a1a22", cape: "#3a56a8",
      gold: "#e8b84a", shield: "#f0f0ea", star: "#d8343a", blade: "#dfe6ee", line: "#c48a6a",
    },
    shapes: [
      { t: "box", c: [-0.15, 0.32, 0], s: [0.022, 0.24, 0.19], round: 0.02, rot: [0, 0, -12], col: "cape", k: 0.04 },
      ...body(),
      { t: "tor", c: [0, 0.28, 0], R: 0.125, r: 0.024, col: "gold" },
      { t: "box", c: [0.13, 0.42, 0], s: [0.012, 0.09, 0.02], round: 0.01, col: "gold", paint: true },
      { t: "ell", c: [0, 0.54, 0.15], r: [0.075, 0.035, 0.07], col: "gold", mirror: true, k: 0.02 },
      { t: "tor", c: [0, 0.55, 0], R: 0.1, r: 0.03, col: "cape", k: 0.02 },
      // Short grey hair, side part.
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.15, 0.2], col: "hair" },
      { t: "cap", a: [0.06, 0.88, -0.04], b: [0.18, 0.84, 0.1], r: [0.05, 0.02], col: "hair" },
      { t: "cap", a: [-0.02, 0.76, 0.17], b: [0.0, 0.66, 0.18], r: [0.035, 0.02], col: "hair", mirror: true },
      { t: "cap", a: [0.19, 0.66, 0.1], b: [0.17, 0.62, 0.13], r: [0.005, 0.005], col: "line", paint: true },
      // Round shield on the near arm, sword raised in the far hand.
      ...arm(1, [0.14, 0.4, 0.24], "torso", "boots"),
      { t: "ell", c: [0.2, 0.4, 0.3], r: [0.03, 0.17, 0.17], rot: [0, -45, 0], col: "shield", k: 0.01 },
      { t: "tor", c: [0.2, 0.4, 0.3], R: 0.165, r: 0.022, rot: [0, -45, 90], col: "gold", k: 0.01 },
      { t: "ell", c: [0.225, 0.4, 0.325], r: [0.02, 0.07, 0.07], rot: [0, -45, 0], col: "star", k: 0.01 },
      ...arm(-1, [0.14, 0.58, -0.22], "torso", "boots"),
      { t: "box", c: [0.15, 0.62, -0.22], s: [0.02, 0.02, 0.06], round: 0.008, col: "gold", k: 0.005 },
      { t: "cap", a: [0.15, 0.62, -0.22], b: [0.17, 0.95, -0.22], r: [0.025, 0.012], col: "blade", k: 0.005 },
    ],
    eyes: eyes("#4a6aa0"),
  },

  // Mago Errante: wandering wizard, tall bent hat, long white beard, staff with a glowing crystal.
  "mago-errante": {
    palette: {
      skin: SKIN, torso: "#3a7a4a", legs: "#2a5a36", boots: "#5a3a22", robe: "#3a7a4a", hat: "#2e6a3e",
      band: "#d8a83a", beard: "#eef2fa", wood: "#7a4a2a", crystal: "#ff6ad5",
    },
    glow: ["crystal"],
    shapes: [
      ...body(),
      { t: "cap", a: [0, 0.45, 0], b: [0, 0.1, 0], r: [0.13, 0.21], col: "robe", k: 0.04 },
      { t: "tor", c: [0, 0.33, 0], R: 0.15, r: 0.02, col: "band", k: 0.01 },
      // Beard and moustache.
      { t: "cap", a: [0.14, 0.64, 0], b: [0.2, 0.36, 0], r: [0.12, 0.035], col: "beard", k: 0.03 },
      { t: "cap", a: [0.2, 0.64, 0.0], b: [0.19, 0.6, 0.1], r: [0.03, 0.015], col: "beard", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.08, 0.72, 0.15], b: [-0.12, 0.6, 0.16], r: [0.05, 0.03], col: "beard", mirror: true },
      // Pointy hat.
      { t: "ell", c: [-0.01, 0.84, 0], r: [0.26, 0.025, 0.26], col: "hat", k: 0.02 },
      { t: "cap", a: [-0.02, 0.86, 0], b: [-0.08, 1.1, 0], r: [0.17, 0.06], col: "hat", k: 0.02 },
      { t: "cap", a: [-0.08, 1.1, 0], b: [-0.2, 1.17, 0], r: [0.06, 0.015], col: "hat", k: 0.02 },
      { t: "tor", c: [-0.02, 0.88, 0], R: 0.155, r: 0.02, col: "band", k: 0.01 },
      // Staff in the far hand, near hand at the hip.
      ...arm(-1, [0.27, 0.46, -0.2], "robe", "skin", 0.05),
      { t: "cap", a: [0.28, 0.03, -0.23], b: [0.28, 0.98, -0.23], r: [0.02, 0.02], col: "wood", k: 0.01 },
      { t: "tor", c: [0.28, 0.99, -0.23], R: 0.035, r: 0.012, col: "wood", k: 0.01 },
      { t: "ell", c: [0.28, 1.05, -0.23], r: [0.045, 0.075, 0.045], col: "crystal", k: 0.01 },
      ...arm(1, [0.08, 0.32, 0.22], "robe", "skin", 0.05),
    ],
    eyes: eyes("#5a8ad0", false, 0.71),
  },

  // Doctora Ignis: scientist in a lab coat with flaming hair, heat goggles and a flame in her palm.
  "doctora-ignis": {
    palette: {
      skin: "#e8b08a", torso: "#d8402a", legs: "#2a2438", boots: "#141218", coat: "#f4f2ee", flame: "#ff7a1a",
      core: "#ffd84a", goggle: "#b0703a", lens: "#ffb03a", glove: "#2a2438",
    },
    glow: ["flame", "core", "lens"],
    shapes: [
      ...body(),
      { t: "cap", a: [-0.05, 0.42, 0], b: [-0.08, 0.27, 0], r: [0.13, 0.145], col: "coat", k: 0.04 },
      { t: "ell", c: [0.1, 0.44, 0.09], r: [0.06, 0.11, 0.045], col: "coat", paint: true, mirror: true },
      { t: "tor", c: [0, 0.29, 0], R: 0.125, r: 0.02, col: "boots", k: 0.01 },
      // Flaming hair.
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.16, 0.2], col: "flame" },
      { t: "cap", a: [-0.02, 0.88, 0], b: [-0.06, 1.08, 0], r: [0.08, 0.01], col: "flame" },
      { t: "cap", a: [-0.06, 0.86, 0.1], b: [-0.12, 1.02, 0.16], r: [0.07, 0.01], col: "flame", mirror: true },
      { t: "cap", a: [-0.12, 0.84, 0], b: [-0.3, 0.98, 0], r: [0.08, 0.01], col: "flame" },
      { t: "cap", a: [0.08, 0.88, 0.02], b: [0.16, 1.0, 0.04], r: [0.06, 0.01], col: "flame" },
      { t: "ell", c: [-0.05, 0.94, 0], r: [0.05, 0.08, 0.06], col: "core", paint: true },
      // Thin copper goggles on the forehead.
      { t: "tor", c: [-0.01, 0.83, 0], R: 0.19, r: 0.009, rot: [0, 0, 8], col: "goggle", k: 0.005 },
      { t: "cap", a: [0.16, 0.855, 0.07], b: [0.2, 0.86, 0.075], r: [0.032, 0.032], col: "goggle", mirror: true, k: 0.008 },
      { t: "ell", c: [0.21, 0.86, 0.075], r: [0.01, 0.026, 0.026], col: "lens", mirror: true, k: 0.004 },
      // Flame held up in the far palm, near hand at the hip.
      ...arm(-1, [0.26, 0.44, -0.2], "coat", "glove"),
      { t: "cap", a: [0.27, 0.48, -0.2], b: [0.29, 0.72, -0.2], r: [0.07, 0.008], col: "flame", k: 0.03 },
      { t: "cap", a: [0.27, 0.5, -0.2], b: [0.28, 0.62, -0.2], r: [0.045, 0.01], col: "core", paint: true },
      ...arm(1, [0.04, 0.3, 0.21], "coat", "glove"),
    ],
    eyes: eyes("#ff8a2a"),
  },

  // Escudero Fiel: young squire behind a big round wooden shield, short sword raised.
  "escudero-fiel": {
    palette: {
      skin: SKIN, hair: "#8a5a2a", torso: "#4a8a3a", legs: "#7a5a3a", boots: "#5a3a22", wood: "#b87e44",
      plank: "#8a5a2e", metal: "#b8c0ca", blade: "#e6ecf2", belt: "#5a3a22", cheek: "#f0907a",
    },
    shapes: [
      ...body(),
      { t: "tor", c: [0, 0.28, 0], R: 0.125, r: 0.022, col: "belt" },
      { t: "ell", c: [-0.03, 0.78, 0], r: [0.2, 0.15, 0.21], col: "hair" },
      { t: "cap", a: [0.12, 0.84, -0.1], b: [0.2, 0.8, 0.1], r: [0.05, 0.03], col: "hair" },
      { t: "ell", c: [0.17, 0.64, 0.1], r: [0.03, 0.022, 0.035], col: "cheek", paint: true, mirror: true },
      // Short sword raised in the near hand.
      ...arm(1, [0.1, 0.62, 0.26], "torso", "skin"),
      { t: "box", c: [0.11, 0.66, 0.26], s: [0.06, 0.016, 0.02], round: 0.008, col: "metal", k: 0.005 },
      { t: "cap", a: [0.11, 0.67, 0.26], b: [0.15, 0.92, 0.26], r: [0.025, 0.01], col: "blade", k: 0.005 },
      // Big round shield in front, on the far arm.
      ...arm(-1, [0.18, 0.4, -0.06], "torso", "skin"),
      { t: "ell", c: [0.26, 0.38, 0.06], r: [0.035, 0.21, 0.21], rot: [0, -45, 0], col: "wood", k: 0.01 },
      { t: "tor", c: [0.26, 0.38, 0.06], R: 0.205, r: 0.022, rot: [0, -45, 90], col: "metal", k: 0.01 },
      { t: "ell", c: [0.29, 0.38, 0.09], r: [0.035, 0.05, 0.05], rot: [0, -45, 0], col: "metal", k: 0.01 },
      { t: "box", c: [0.28, 0.38, 0.08], s: [0.04, 0.22, 0.008], round: 0.004, rot: [0, -45, 0], col: "plank", paint: true },
      { t: "box", c: [0.28, 0.38, 0.08], s: [0.04, 0.22, 0.008], round: 0.004, rot: [0, -45, 0], col: "plank", paint: true },
    ],
    eyes: eyes("#4a8ad0"),
  },

  // Centinela Real: royal sentinel in bulky full plate, visor helm with a red plume, tall halberd.
  "centinela-real": {
    palette: {
      skin: "#2a2e3a", torso: "#aab4c2", legs: "#98a2b2", boots: "#6a7484", metal: "#aab4c2", dk: "#6a7484", shade: "#2a2e3a",
      gold: "#e0b040", plume: "#d8303a", tabard: "#b02a3a", wood: "#6a4a2a", blade: "#e6ecf2",
    },
    shapes: [
      { t: "cap", a: [-0.04, 0.9, 0], b: [-0.06, 1.04, 0], r: [0.04, 0.06], col: "plume", k: 0.02 },
      { t: "cap", a: [-0.06, 1.04, 0], b: [-0.24, 1.02, 0], r: [0.06, 0.035], col: "plume", k: 0.03 },
      { t: "cap", a: [-0.24, 1.02, 0], b: [-0.32, 0.84, 0], r: [0.035, 0.01], col: "plume", k: 0.03 },
      ...body({ torso: [0.18, 0.18, 0.19], hips: 0.08 }),
      { t: "box", c: [0.13, 0.3, 0], s: [0.06, 0.15, 0.1], round: 0.04, col: "tabard", k: 0.02 },
      { t: "ell", c: [0.19, 0.34, 0], r: [0.02, 0.04, 0.04], col: "gold", paint: true },
      { t: "tor", c: [0, 0.27, 0], R: 0.17, r: 0.025, col: "gold", k: 0.01 },
      { t: "ell", c: [-0.02, 0.58, 0.2], r: [0.13, 0.09, 0.12], col: "metal", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.02, 0.56, 0.24], r: [0.13, 0.03, 0.1], col: "gold", paint: true, mirror: true },
      // Visored great helm with an eye slit.
      { t: "ell", c: [0.01, 0.74, 0], r: [0.21, 0.2, 0.21], col: "metal", k: 0.03 },
      { t: "box", c: [0.21, 0.7, 0], s: [0.09, 0.045, 0.15], round: 0.03, col: "shade", cut: true, k: 0.01 },
      { t: "ell", c: [0.05, 0.7, 0], r: [0.15, 0.13, 0.15], col: "shade", k: 0.01 },
      { t: "cap", a: [0.2, 0.62, 0], b: [0.2, 0.55, 0], r: [0.03, 0.02], col: "dk", k: 0.02 },
      { t: "cap", a: [-0.12, 0.92, 0], b: [0.18, 0.84, 0], r: [0.02, 0.02], col: "gold", k: 0.02 },
      // Halberd upright in the near hand.
      ...arm(1, [-0.04, 0.44, 0.3], "metal", "dk", 0.055),
      { t: "cap", a: [-0.04, 0.02, 0.33], b: [-0.04, 1.1, 0.33], r: [0.02, 0.02], col: "wood", k: 0.01 },
      { t: "box", c: [0.03, 0.98, 0.33], s: [0.07, 0.08, 0.012], round: 0.012, col: "blade", k: 0.005 },
      { t: "cap", a: [-0.04, 1.0, 0.33], b: [-0.12, 0.96, 0.33], r: [0.018, 0.004], col: "blade", k: 0.005 },
      { t: "cap", a: [-0.04, 1.1, 0.33], b: [-0.04, 1.22, 0.33], r: [0.025, 0.004], col: "blade", k: 0.005 },
      ...arm(-1, [0.08, 0.3, -0.24], "metal", "dk", 0.055),
    ],
    eyes: eyes("#ffd84a", false, 0.7, 0.05, 0.045),
  },

  // Dédalo: old tinkerer in a teal work coat, magnifying goggles, a wrench and little mechanical wings.
  "dedalo-inventor": {
    palette: {
      skin: "#ecb48e", hair: "#70707e", torso: "#1f7a78", legs: "#4a3a2e", boots: "#2e2218", coat: "#1f7a78",
      shirt: "#f0e2c0", brass: "#e0a838", lens: "#a8e8ff", canvas: "#f4e8c8", leather: "#5a3a22",
    },
    shapes: [
      // A small pair of mechanical wings tucked behind the back.
      { t: "cap", a: [-0.12, 0.5, 0.05], b: [-0.2, 0.66, 0.15], r: [0.02, 0.016], col: "brass", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.2, 0.56, 0.13], r: [0.025, 0.1, 0.06], rot: [25, 0, -15], col: "canvas", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.13, 0.48, 0], b: [-0.16, 0.48, 0], r: [0.05, 0.05], col: "brass", k: 0.02 },
      ...body(),
      { t: "cap", a: [0, 0.42, 0], b: [-0.02, 0.17, 0], r: [0.14, 0.17], col: "coat", k: 0.04 },
      { t: "ell", c: [0.14, 0.44, 0], r: [0.02, 0.08, 0.04], col: "shirt", paint: true },
      { t: "tor", c: [0, 0.3, 0], R: 0.15, r: 0.02, col: "leather", k: 0.01 },
      // Bald top, grey fringe, grey moustache and short beard.
      { t: "ell", c: [-0.08, 0.7, 0], r: [0.13, 0.12, 0.19], col: "hair", k: 0.03 },
      { t: "cap", a: [-0.02, 0.72, 0.17], b: [0.0, 0.78, 0.24], r: [0.05, 0.015], col: "hair", mirror: true, k: 0.02 },
      { t: "ell", c: [0.15, 0.575, 0], r: [0.075, 0.065, 0.11], col: "hair", k: 0.012 },
      { t: "cap", a: [0.2, 0.635, 0.0], b: [0.17, 0.6, 0.12], r: [0.035, 0.015], col: "hair", mirror: true, k: 0.02 },
      { t: "ell", c: [0.19, 0.77, 0.08], r: [0.02, 0.014, 0.045], col: "hair", paint: true, mirror: true },
      // Magnifying goggles pushed up on the forehead.
      { t: "tor", c: [0.0, 0.83, 0], R: 0.19, r: 0.012, rot: [0, 0, 10], col: "leather", k: 0.01 },
      { t: "cap", a: [0.13, 0.87, 0.075], b: [0.21, 0.89, 0.085], r: [0.05, 0.046], col: "brass", mirror: true, k: 0.01 },
      { t: "ell", c: [0.22, 0.89, 0.085], r: [0.01, 0.038, 0.038], col: "lens", mirror: true, k: 0.005 },
      // Far hand holds up a wrench, near hand on the hip.
      ...arm(-1, [0.27, 0.44, -0.2], "coat", "skin"),
      { t: "cap", a: [0.27, 0.46, -0.2], b: [0.29, 0.64, -0.2], r: [0.018, 0.018], col: "brass", k: 0.005 },
      { t: "tor", c: [0.29, 0.67, -0.2], R: 0.032, r: 0.013, rot: [90, 0, 0], col: "brass", k: 0.005 },
      ...arm(1, [0.04, 0.32, 0.21], "coat", "skin"),
    ],
    eyes: eyes("#3a6aa0"),
  },

  // Coronel Ruiz: stocky colonel in olive with a maroon beret, big moustache and binoculars.
  "coronel-ruiz": {
    palette: {
      skin: "#e0a882", hair: "#4a4444", torso: "#6a7a3a", legs: "#4e5a2a", boots: "#2a2418", beret: "#8a2a2a",
      gold: "#e8c04a", must: "#3a3030", belt: "#5a3a22", bino: "#2e2e32", lens: "#6ad0ff", red: "#d83a3a", blue: "#3a6ad8",
    },
    shapes: [
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "tor", c: [0, 0.28, 0], R: 0.14, r: 0.025, col: "belt" },
      { t: "ell", c: [0.14, 0.45, 0.06], r: [0.02, 0.025, 0.02], col: "red", paint: true },
      { t: "ell", c: [0.14, 0.45, 0.11], r: [0.02, 0.025, 0.02], col: "blue", paint: true },
      { t: "box", c: [0.15, 0.37, 0], s: [0.01, 0.08, 0.012], round: 0.005, col: "gold", paint: true },
      { t: "ell", c: [0, 0.54, 0.15], r: [0.08, 0.03, 0.07], col: "gold", mirror: true, k: 0.02 },
      // Short dark hair, beret and moustache.
      { t: "ell", c: [-0.06, 0.74, 0], r: [0.16, 0.13, 0.19], col: "hair" },
      { t: "ell", c: [-0.02, 0.84, 0.02], r: [0.21, 0.07, 0.21], rot: [-8, 0, 14], col: "beret", k: 0.03 },
      { t: "ell", c: [-0.02, 0.87, 0.03], r: [0.08, 0.05, 0.08], rot: [-8, 0, 14], col: "beret", k: 0.03 },
      { t: "ell", c: [0.12, 0.83, 0.14], r: [0.03, 0.03, 0.03], col: "gold", paint: true },
      { t: "cap", a: [0.21, 0.63, 0.0], b: [0.18, 0.59, 0.13], r: [0.04, 0.016], col: "must", mirror: true, k: 0.02 },
      { t: "box", c: [0.19, 0.77, 0.03], s: [0.02, 0.012, 0.13], round: 0.01, col: "must", paint: true },
      // Binoculars in the near hand, far hand behind the back.
      ...arm(1, [0.2, 0.46, 0.22], "torso", "skin"),
      { t: "cap", a: [0.2, 0.52, 0.18], b: [0.3, 0.54, 0.18], r: [0.035, 0.032], col: "bino", k: 0.01 },
      { t: "cap", a: [0.2, 0.52, 0.26], b: [0.3, 0.54, 0.26], r: [0.035, 0.032], col: "bino", k: 0.01 },
      { t: "box", c: [0.25, 0.53, 0.22], s: [0.03, 0.015, 0.04], round: 0.008, col: "bino", k: 0.005 },
      { t: "ell", c: [0.31, 0.54, 0.18], r: [0.008, 0.024, 0.024], col: "lens", paint: true },
      { t: "ell", c: [0.31, 0.54, 0.26], r: [0.008, 0.024, 0.024], col: "lens", paint: true },
      ...arm(-1, [-0.1, 0.32, -0.16], "torso", "skin"),
    ],
    eyes: eyes("#5a3a2a"),
  },

  // Teniente Okafor: confident pilot, leather flight jacket with fleece collar, aviator helmet, thumbs up.
  "teniente-okafor": {
    palette: {
      skin: "#8a5636", torso: "#c06a2a", legs: "#2a5a6a", boots: "#2a2a2a", fleece: "#f2e6cc", helmet: "#3a2a22",
      brass: "#d0a040", lens: "#8ae0ff", scarf: "#f8f8f4", zip: "#e0c080", glove: "#3a2a20",
    },
    shapes: [
      { t: "cap", a: [-0.08, 0.56, 0.06], b: [-0.32, 0.6, 0.14], r: [0.045, 0.02], col: "scarf", k: 0.03 },
      ...body(),
      { t: "box", c: [0.135, 0.4, 0], s: [0.008, 0.12, 0.012], round: 0.004, col: "zip", paint: true },
      { t: "tor", c: [0.01, 0.55, 0], R: 0.11, r: 0.042, col: "fleece", k: 0.02 },
      // Leather aviator helmet with ear flaps and goggles up.
      { t: "ell", c: [-0.02, 0.77, 0], r: [0.2, 0.16, 0.21], col: "helmet" },
      { t: "ell", c: [0.0, 0.66, 0.17], r: [0.06, 0.08, 0.035], col: "helmet", mirror: true, k: 0.02 },
      { t: "tor", c: [0.0, 0.83, 0], R: 0.19, r: 0.016, rot: [0, 0, 10], col: "brass", k: 0.01 },
      { t: "cap", a: [0.14, 0.86, 0.075], b: [0.2, 0.87, 0.08], r: [0.045, 0.045], col: "brass", mirror: true, k: 0.01 },
      { t: "ell", c: [0.21, 0.87, 0.08], r: [0.01, 0.035, 0.035], col: "lens", mirror: true, k: 0.005 },
      // Thumbs up with the far hand, near hand on the hip.
      ...arm(-1, [0.24, 0.56, -0.22], "torso", "glove"),
      { t: "cap", a: [0.24, 0.6, -0.22], b: [0.24, 0.68, -0.22], r: [0.02, 0.017], col: "glove", k: 0.01 },
      ...arm(1, [0.02, 0.32, 0.2], "torso", "glove"),
    ],
    eyes: eyes("#5a3a20"),
  },

  // Zola: royal engineer princess in purple and gold with braids and a glowing gauntlet.
  "zola-ingeniera": {
    palette: {
      skin: "#8a5a3a", hair: "#2a1a1a", torso: "#7a3ab0", legs: "#4a2a7a", boots: "#e0b040", dress: "#7a3ab0",
      gold: "#f0c040", glow: "#6affd0", gaunt: "#e0b040",
    },
    glow: ["glow"],
    shapes: [
      ...body(),
      { t: "cap", a: [0, 0.4, 0], b: [0, 0.16, 0], r: [0.13, 0.19], col: "dress", k: 0.04 },
      { t: "tor", c: [0, 0.3, 0], R: 0.14, r: 0.022, col: "gold", k: 0.01 },
      { t: "ell", c: [0.13, 0.46, 0], r: [0.03, 0.05, 0.08], col: "gold", paint: true },
      { t: "ell", c: [0, 0.54, 0.15], r: [0.07, 0.04, 0.065], col: "gold", mirror: true, k: 0.02 },
      // Hair with braids and a small gold tiara.
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.19, 0.15, 0.2], col: "hair" },
      { t: "cap", a: [-0.12, 0.76, 0], b: [-0.2, 0.42, 0], r: [0.035, 0.025], col: "hair" },
      { t: "cap", a: [-0.11, 0.76, 0.08], b: [-0.18, 0.44, 0.1], r: [0.035, 0.025], col: "hair", mirror: true },
      { t: "cap", a: [-0.06, 0.76, 0.15], b: [-0.08, 0.46, 0.2], r: [0.035, 0.025], col: "hair", mirror: true },
      { t: "ell", c: [-0.2, 0.42, 0], r: [0.03, 0.03, 0.03], col: "gold", k: 0.01 },
      { t: "ell", c: [-0.18, 0.44, 0.1], r: [0.03, 0.03, 0.03], col: "gold", mirror: true, k: 0.01 },
      { t: "ell", c: [-0.08, 0.46, 0.2], r: [0.03, 0.03, 0.03], col: "gold", mirror: true, k: 0.01 },
      { t: "tor", c: [0.0, 0.86, 0], R: 0.16, r: 0.016, rot: [0, 0, 12], col: "gold", k: 0.01 },
      { t: "cap", a: [0.16, 0.89, 0], b: [0.17, 0.96, 0], r: [0.03, 0.01], col: "gold", k: 0.01 },
      { t: "ell", c: [0.17, 0.9, 0], r: [0.02, 0.02, 0.02], col: "glow", paint: true },
      // Glowing gauntlet held forward on the far arm, near hand on the hip.
      { t: "cap", a: [0, 0.5, -0.15], b: [0.22, 0.52, -0.22], r: [0.048, 0.044], col: "torso" },
      { t: "cap", a: [0.16, 0.51, -0.21], b: [0.27, 0.53, -0.23], r: [0.06, 0.068], col: "gaunt", k: 0.02 },
      { t: "tor", c: [0.22, 0.52, -0.22], R: 0.062, r: 0.012, rot: [0, 0, 80], col: "glow", k: 0.005 },
      { t: "ell", c: [0.38, 0.55, -0.24], r: [0.06, 0.06, 0.06], col: "glow", k: 0.0 },
      ...arm(1, [0.02, 0.32, 0.2], "torso", "skin"),
    ],
    eyes: eyes("#c08a2a"),
  },
};
