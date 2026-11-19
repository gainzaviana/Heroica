import type { Sculpt, Shape, V3 } from "../sculpt";
import { SKIN, arm, body, burst, eyes, spike } from "./kit";

// Campaign "El Ascenso del Mariscal de Ceniza" — art batch 1.
// The Legión de Ceniza: charcoal / ash grey with ember orange-red accents. Original designs only.

const ASH = { ash: "#4a4d54", ashDk: "#2c2e33", ashLt: "#8a8d94", ember: "#ff6a1f", emberHot: "#ffc24a", emberDk: "#c2401a" };

/** Small spheres (sparks, dots, ash flakes). */
const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

export const artCeniza1: Record<string, Sculpt> = {
  // MARK: Villains

  // Saeta Negra: mercenary marksman in black tactical armour, ember visor goggles, a long crossbow-rifle levelled.
  "villain-saeta-negra": {
    palette: {
      skin: "#d8a07c", torso: "#26282e", legs: "#2c2e33", boots: "#18191d", plate: "#3d4048", strap: "#55402e",
      visor: ASH.ember, hot: ASH.emberHot, metal: "#8e949c", wood: "#4a3428", string: "#d8d2c4", mask: "#1d1f24",
    },
    glow: ["visor", "hot"],
    shapes: [
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "box", c: [0.05, 0.42, 0], s: [0.11, 0.13, 0.155], round: 0.07, col: "plate", k: 0.03 },
      { t: "cap", a: [0.12, 0.55, 0.12], b: [0.14, 0.28, -0.12], r: [0.02, 0.02], col: "strap", k: 0.01 },
      ...[0.48, 0.4, 0.32].map((y): Shape => ({ t: "box", c: [0.15, y, -0.04 - (0.48 - y) * 0.5], s: [0.02, 0.025, 0.018], round: 0.008, col: "metal", k: 0.005 })),
      { t: "ell", c: [-0.01, 0.56, 0.17], r: [0.11, 0.08, 0.1], col: "plate", mirror: true, k: 0.02 },
      { t: "tor", c: [0, 0.27, 0], R: 0.14, r: 0.025, col: "strap" },
      // Hood-like helmet, face mask over the mouth, visor goggles across the eyes.
      { t: "ell", c: [-0.02, 0.76, 0], r: [0.21, 0.19, 0.21], col: "torso", k: 0.03 },
      { t: "ell", c: [0.2, 0.7, 0], r: [0.1, 0.11, 0.15], col: "torso", cut: true, k: 0.03 },
      { t: "ell", c: [0.07, 0.69, 0], r: [0.15, 0.13, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.12, 0.6, 0], r: [0.12, 0.075, 0.16], col: "mask", k: 0.02 },
      { t: "box", c: [0.15, 0.72, 0], s: [0.06, 0.035, 0.17], round: 0.03, col: "mask", k: 0.02 },
      { t: "cap", a: [0.2, 0.72, 0.075], b: [0.22, 0.72, 0.075], r: [0.04, 0.04], col: "visor", k: 0.005 },
      { t: "cap", a: [0.2, 0.72, -0.05], b: [0.22, 0.72, -0.05], r: [0.035, 0.035], col: "visor", k: 0.005 },
      { t: "ell", c: [0.24, 0.73, 0.085], r: [0.012, 0.015, 0.015], col: "hot", paint: true },
      // Arms bracing the crossbow-rifle.
      ...arm(1, [0.18, 0.5, 0.12], "torso", "mask", 0.045),
      ...arm(-1, [0.36, 0.53, 0.02], "torso", "mask", 0.045),
      // Crossbow-rifle: stock at the shoulder, long barrel, scope, bow limbs and string.
      { t: "box", c: [0.05, 0.53, 0.1], s: [0.09, 0.035, 0.03], round: 0.02, rot: [0, 0, 4], col: "wood", k: 0.01 },
      { t: "cap", a: [0.12, 0.54, 0.08], b: [0.78, 0.6, 0.05], r: [0.026, 0.022], col: "metal", k: 0.01 },
      { t: "box", c: [0.3, 0.52, 0.07], s: [0.12, 0.03, 0.025], round: 0.015, rot: [0, 0, 5], col: "plate", k: 0.01 },
      { t: "cap", a: [0.22, 0.6, 0.07], b: [0.36, 0.615, 0.07], r: [0.022, 0.026], col: "mask", k: 0.01 },
      { t: "ell", c: [0.365, 0.615, 0.07], r: [0.006, 0.02, 0.02], col: "visor", k: 0 },
      { t: "cap", a: [0.62, 0.585, 0.06], b: [0.52, 0.6, 0.32], r: [0.022, 0.012], col: "plate", k: 0.01 },
      { t: "cap", a: [0.62, 0.585, 0.04], b: [0.52, 0.6, -0.22], r: [0.022, 0.012], col: "plate", k: 0.01 },
      { t: "cap", a: [0.52, 0.6, 0.32], b: [0.36, 0.57, 0.06], r: [0.005, 0.005], col: "string", k: 0 },
      { t: "cap", a: [0.52, 0.6, -0.22], b: [0.36, 0.57, 0.06], r: [0.005, 0.005], col: "string", k: 0 },
      { t: "cap", a: [0.38, 0.575, 0.06], b: [0.86, 0.615, 0.04], r: [0.008, 0.008], col: "metal", k: 0 },
      spike([0.86, 0.615, 0.04], 5, 0.06, [0.02, 0.003], "hot", 0.005),
    ],
    eyes: [],
  },

  // Amalgama: huge hunched brawler whose body is turning into other matter — a stone arm, a steel arm,
  // ice crystals bursting from the shoulder.
  "villain-amalgama": {
    palette: {
      skin: "#d09272", legs: "#3a3c42", boots: "#24252a", stone: "#948e84", stoneDk: "#5f5a52", steel: "#a7b1bc",
      steelDk: "#6d7782", rivet: "#eef2f6", ice: "#8fdcff", iceLt: "#e6faff", belt: ASH.ember, mouth: "#3a1a14", hair: "#2c2e33",
    },
    glow: ["belt"],
    shapes: [
      { t: "cap", a: [0.08, 0.06, 0.15], b: [0.02, 0.3, 0.13], r: [0.08, 0.1], col: "legs" },
      { t: "ell", c: [0.12, 0.05, 0.15], r: [0.12, 0.055, 0.09], col: "boots" },
      { t: "cap", a: [-0.12, 0.06, -0.14], b: [-0.04, 0.3, -0.13], r: [0.08, 0.1], col: "legs" },
      { t: "ell", c: [-0.09, 0.05, -0.14], r: [0.12, 0.055, 0.09], col: "boots" },
      { t: "ell", c: [0.0, 0.45, 0], r: [0.24, 0.24, 0.27], rot: [0, 0, -12], col: "skin", k: 0.06 },
      { t: "tor", c: [0.0, 0.29, 0], R: 0.22, r: 0.035, col: "belt", k: 0.02 },
      // Rock crust spreading over the near chest.
      { t: "ell", c: [0.17, 0.52, 0.16], r: [0.08, 0.07, 0.07], col: "stone", k: 0.015 },
      { t: "ell", c: [0.2, 0.42, 0.18], r: [0.06, 0.055, 0.06], col: "stoneDk", k: 0.015 },
      { t: "ell", c: [0.1, 0.6, 0.2], r: [0.07, 0.05, 0.06], col: "stone", k: 0.015 },
      // Steel plate over the far chest.
      { t: "box", c: [0.15, 0.48, -0.13], s: [0.08, 0.1, 0.09], round: 0.04, rot: [0, 30, -10], col: "steel", k: 0.015 },
      ...([[0.23, 0.53, -0.11], [0.22, 0.43, -0.14]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.015, 0.015, 0.015], col: "rivet", k: 0.004 })),
      // Head forward, buzz cut.
      { t: "ell", c: [0.17, 0.7, 0], r: [0.17, 0.16, 0.16], col: "skin", k: 0.06 },
      { t: "ell", c: [0.13, 0.78, 0], r: [0.15, 0.09, 0.15], col: "hair", k: 0.02 },
      { t: "box", c: [0.33, 0.62, 0], s: [0.012, 0.01, 0.05], round: 0.006, col: "mouth", paint: true },
      // Ice crystals bursting from the far shoulder and back.
      { t: "ell", c: [-0.04, 0.63, -0.22], r: [0.12, 0.09, 0.11], col: "ice", k: 0.03 },
      { t: "cap", a: [-0.04, 0.66, -0.24], b: [-0.1, 1.0, -0.3], r: [0.065, 0.006], col: "ice", k: 0.015 },
      { t: "cap", a: [0.02, 0.66, -0.26], b: [0.12, 0.92, -0.36], r: [0.05, 0.005], col: "iceLt", k: 0.015 },
      { t: "ell", c: [-0.16, 0.56, 0.0], r: [0.1, 0.12, 0.14], col: "ice", k: 0.03 },
      { t: "cap", a: [-0.18, 0.6, 0.04], b: [-0.42, 0.86, 0.08], r: [0.065, 0.006], col: "ice", k: 0.015 },
      { t: "cap", a: [-0.2, 0.52, 0.08], b: [-0.48, 0.6, 0.14], r: [0.055, 0.005], col: "iceLt", k: 0.015 },
      { t: "cap", a: [-0.14, 0.64, -0.06], b: [-0.26, 0.96, -0.1], r: [0.055, 0.005], col: "ice", k: 0.015 },
      { t: "cap", a: [-0.2, 0.44, 0.0], b: [-0.42, 0.36, 0.04], r: [0.045, 0.005], col: "ice", k: 0.015 },
      // Near arm turned to stone, raised overhead: lumpy rock shoulder and a boulder fist.
      { t: "ell", c: [0.0, 0.63, 0.24], r: [0.13, 0.1, 0.12], rot: [0, 0, -20], col: "stone", k: 0.03 },
      { t: "cap", a: [0.0, 0.6, 0.29], b: [0.08, 0.88, 0.36], r: [0.09, 0.085], col: "stone" },
      { t: "ell", c: [0.06, 0.74, 0.36], r: [0.06, 0.05, 0.05], col: "stoneDk", k: 0.01 },
      { t: "ell", c: [0.1, 0.98, 0.38], r: [0.15, 0.14, 0.14], col: "stone", k: 0.03 },
      { t: "ell", c: [0.18, 1.02, 0.44], r: [0.06, 0.05, 0.045], col: "stoneDk", k: 0.01 },
      { t: "ell", c: [0.04, 1.08, 0.44], r: [0.05, 0.04, 0.04], col: "stoneDk", k: 0.01 },
      // Far arm turned to steel, banded, with a riveted fist.
      { t: "cap", a: [0.06, 0.58, -0.29], b: [0.3, 0.46, -0.34], r: [0.085, 0.075], col: "steel" },
      { t: "tor", c: [0.18, 0.52, -0.315], R: 0.08, r: 0.018, rot: [0, 0, 70], col: "steelDk", k: 0.01 },
      { t: "ell", c: [0.4, 0.45, -0.35], r: [0.13, 0.12, 0.12], col: "steel", k: 0.02 },
      ...([[0.5, 0.5, -0.31], [0.52, 0.44, -0.33], [0.5, 0.38, -0.33]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.017, 0.017, 0.017], col: "rivet", k: 0.004 })),
    ],
    eyes: [
      { at: [0.26, 0.7, 0.07], r: 0.055, iris: "#ff8a2a", angry: true, look: [0.75, -0.03, 0.6] },
      { at: [0.26, 0.7, -0.04], r: 0.05, iris: "#7fd8ff", angry: true, look: [0.97, -0.03, 0.22] },
    ],
  },

  // Réplica: masked martial artist with a smooth mirror mask, a blade in one hand and a war hammer in the other.
  "villain-replica": {
    palette: {
      skin: SKIN, torso: "#33353c", legs: "#2a2c31", boots: "#1c1d21", mask: "#dfe7ef", shine: "#ffffff", sash: ASH.ember,
      wrap: "#c9c2b4", blade: "#c4ccd6", edge: "#f2f6fa", grip: "#5a3a2a", head: "#6d727c", haft: "#7a4a2a", hair: "#1e1f24",
    },
    glow: ["sash"],
    shapes: [
      // Wide fighting stance.
      { t: "ell", c: [0.1, 0.05, 0.13], r: [0.085, 0.055, 0.065], col: "boots" },
      { t: "cap", a: [0.06, 0.08, 0.12], b: [0, 0.28, 0.07], r: [0.058, 0.07], col: "legs" },
      { t: "ell", c: [-0.1, 0.05, -0.13], r: [0.085, 0.055, 0.065], col: "boots" },
      { t: "cap", a: [-0.1, 0.08, -0.12], b: [0, 0.28, -0.07], r: [0.058, 0.07], col: "legs" },
      { t: "ell", c: [0, 0.4, 0], r: [0.13, 0.16, 0.15], col: "torso" },
      { t: "cap", a: [0.13, 0.54, 0.06], b: [0.14, 0.34, -0.04], r: [0.03, 0.02], col: "wrap", paint: true },
      { t: "tor", c: [0, 0.3, 0], R: 0.135, r: 0.032, col: "sash" },
      { t: "cap", a: [-0.1, 0.3, 0.1], b: [-0.2, 0.16, 0.14], r: [0.03, 0.015], col: "sash", k: 0.01 },
      // Head with a topknot and the smooth mirror mask over the whole face.
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "hair", k: 0.07 },
      { t: "ell", c: [-0.06, 0.92, 0], r: [0.06, 0.05, 0.06], col: "hair", k: 0.02 },
      { t: "ell", c: [0.1, 0.7, 0], r: [0.13, 0.16, 0.165], col: "mask", k: 0.02 },
      { t: "ell", c: [0.22, 0.78, 0.07], r: [0.03, 0.05, 0.03], col: "shine", paint: true },
      { t: "tor", c: [0.02, 0.78, 0], R: 0.19, r: 0.014, rot: [0, 0, 8], col: "sash", k: 0.01 },
      // Near arm: straight blade raised high.
      ...arm(1, [0.12, 0.66, 0.28], "torso", "wrap", 0.045),
      { t: "cap", a: [0.1, 0.6, 0.29], b: [0.14, 0.72, 0.29], r: [0.016, 0.016], col: "grip", k: 0.005 },
      { t: "box", c: [0.145, 0.735, 0.29], s: [0.05, 0.012, 0.03], round: 0.008, rot: [0, 0, -20], col: "head", k: 0.005 },
      { t: "box", c: [0.24, 0.96, 0.29], s: [0.022, 0.21, 0.008], round: 0.006, rot: [0, 0, -22], col: "blade", k: 0.005 },
      { t: "box", c: [0.255, 0.96, 0.297], s: [0.008, 0.2, 0.004], round: 0.003, rot: [0, 0, -22], col: "edge", paint: true },
      // Far arm: heavy war hammer held forward low.
      ...arm(-1, [0.3, 0.38, -0.2], "torso", "wrap", 0.045),
      { t: "cap", a: [0.22, 0.28, -0.2], b: [0.48, 0.6, -0.2], r: [0.018, 0.018], col: "haft", k: 0.005 },
      { t: "box", c: [0.5, 0.62, -0.2], s: [0.1, 0.06, 0.06], round: 0.02, rot: [0, 0, -40], col: "head", k: 0.01 },
      { t: "box", c: [0.5, 0.62, -0.2], s: [0.104, 0.02, 0.064], round: 0.01, rot: [0, 0, -40], col: "sash", paint: true },
    ],
    eyes: [],
  },

  // Doctor Quimera: geneticist in a lab coat, mechanical arm with a claw, a glowing green serum vial held up.
  "villain-quimera": {
    palette: {
      skin: "#e2b896", torso: "#eef0ea", coatDk: "#bfc4bc", legs: "#3a3d44", boots: "#24252a", hair: "#8a909a",
      metal: "#7d8590", metalDk: "#454a54", serum: "#7dff5a", glass: "#d8ffe0", ember: ASH.ember, lens: "#7dff5a",
      shirt: ASH.ashDk,
    },
    glow: ["serum", "lens"],
    shapes: [
      // Lab coat flaring to the knees.
      { t: "cap", a: [0, 0.45, 0], b: [-0.03, 0.17, 0], r: [0.14, 0.17], col: "torso", k: 0.05 },
      ...body({ torso: [0.14, 0.16, 0.15] }),
      { t: "ell", c: [0.15, 0.42, 0], r: [0.035, 0.12, 0.05], col: "shirt", paint: true },
      { t: "cap", a: [0.14, 0.55, 0.05], b: [0.17, 0.32, 0.06], r: [0.02, 0.015], col: "coatDk", paint: true, mirror: true },
      // Bandolier of serum vials.
      { t: "cap", a: [0.1, 0.55, -0.12], b: [0.13, 0.28, 0.13], r: [0.018, 0.018], col: "metalDk", k: 0.01 },
      ...([[0.15, 0.47, -0.05], [0.16, 0.4, 0.01], [0.16, 0.33, 0.07]] as V3[]).map((c): Shape => ({ t: "cap", a: [c[0], c[1] - 0.03, c[2]], b: [c[0], c[1] + 0.03, c[2]], r: [0.018, 0.018], col: "serum", k: 0.005 })),
      // Wild grey hair and goggles on the forehead.
      { t: "ell", c: [-0.05, 0.8, 0], r: [0.18, 0.14, 0.2], col: "hair" },
      ...[-0.15, 0, 0.15].map((z): Shape => spike([-0.06, 0.86, z], 140, 0.12, [0.05, 0.01], "hair", 0.03)),
      { t: "tor", c: [0, 0.84, 0], R: 0.19, r: 0.018, rot: [0, 0, 10], col: "metalDk", k: 0.01 },
      { t: "cap", a: [0.13, 0.88, 0.075], b: [0.19, 0.9, 0.075], r: [0.045, 0.045], col: "metal", mirror: true, k: 0.01 },
      { t: "ell", c: [0.235, 0.905, 0.075], r: [0.018, 0.034, 0.034], col: "lens", paint: true, mirror: true },
      // Near arm: normal hand holding a glowing vial up.
      ...arm(1, [0.06, 0.56, 0.38], "torso", "skin"),
      { t: "cap", a: [0.06, 0.58, 0.39], b: [0.07, 0.74, 0.4], r: [0.04, 0.04], col: "serum", k: 0.005 },
      { t: "ell", c: [0.1, 0.68, 0.42], r: [0.01, 0.04, 0.01], col: "glass", paint: true },
      { t: "cap", a: [0.07, 0.76, 0.4], b: [0.07, 0.8, 0.4], r: [0.03, 0.03], col: "metalDk", k: 0.005 },
      dot([0.12, 0.88, 0.43], 0.018, "serum"),
      dot([0.0, 0.9, 0.38], 0.014, "serum"),
      // Far arm: mechanical segmented arm with a three-finger claw.
      { t: "ell", c: [0.0, 0.55, -0.17], r: [0.09, 0.08, 0.08], col: "metal", k: 0.03 },
      { t: "cap", a: [0.0, 0.52, -0.18], b: [0.16, 0.42, -0.26], r: [0.045, 0.04], col: "metalDk", k: 0.01 },
      { t: "ell", c: [0.16, 0.42, -0.26], r: [0.05, 0.05, 0.05], col: "metal", k: 0.01 },
      { t: "cap", a: [0.16, 0.42, -0.26], b: [0.34, 0.46, -0.28], r: [0.04, 0.045], col: "metalDk", k: 0.01 },
      { t: "ell", c: [0.25, 0.44, -0.27], r: [0.02, 0.03, 0.03], col: "lens", paint: true },
      { t: "cap", a: [0.36, 0.47, -0.28], b: [0.46, 0.56, -0.28], r: [0.02, 0.01], col: "metal", k: 0.01 },
      { t: "cap", a: [0.36, 0.46, -0.28], b: [0.48, 0.44, -0.28], r: [0.02, 0.01], col: "metal", k: 0.01 },
      { t: "cap", a: [0.36, 0.45, -0.28], b: [0.44, 0.36, -0.28], r: [0.02, 0.01], col: "metal", k: 0.01 },
    ],
    eyes: eyes("#5ad83a", true),
  },

  // El Mariscal de Ceniza: stern warlord in a long charcoal greatcoat, glowing ember epaulettes, peaked cap,
  // a baton pointed forward, ash and embers drifting around him.
  "villain-mariscal": {
    palette: {
      skin: "#d8a888", torso: "#3a3c42", coat: "#33353b", coatDk: "#222328", legs: "#222328", boots: "#141518",
      ember: ASH.ember, hot: ASH.emberHot, brass: "#c9a050", ash: "#8a8d94", moustache: "#6f6f74", baton: "#1c1d21",
    },
    glow: ["ember", "hot"],
    shapes: [
      // Greatcoat down to the boots, split at the front.
      { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.1, 0.07], b: [0, 0.26, 0.07], r: [0.055, 0.06], col: "legs", mirror: true },
      { t: "cap", a: [0, 0.45, 0], b: [-0.05, 0.2, 0], r: [0.16, 0.22], col: "coat", k: 0.05 },
      { t: "box", c: [0.22, 0.24, 0], s: [0.08, 0.1, 0.05], round: 0.03, rot: [0, 0, 15], col: "coat", cut: true, k: 0.03 },
      { t: "ell", c: [0, 0.43, 0], r: [0.16, 0.17, 0.2], col: "coat" },
      { t: "box", c: [0.15, 0.44, 0], s: [0.02, 0.13, 0.045], round: 0.015, col: "coatDk", paint: true },
      ...[0.5, 0.42, 0.34].flatMap((y): Shape[] => [dot([0.16, y, 0.06], 0.014, "brass"), dot([0.16, y, -0.06], 0.014, "brass")]),
      { t: "tor", c: [0, 0.3, 0], R: 0.155, r: 0.02, col: "coatDk" },
      { t: "box", c: [0.155, 0.3, 0], s: [0.012, 0.025, 0.03], round: 0.008, col: "brass", k: 0.005 },
      // High collar.
      { t: "cap", a: [0, 0.54, 0], b: [0, 0.62, 0], r: [0.12, 0.13], col: "coatDk", k: 0.02 },
      // Glowing epaulettes with fringe.
      { t: "ell", c: [-0.01, 0.57, 0.2], r: [0.11, 0.04, 0.09], col: "ember", mirror: true, k: 0.015 },
      ...[-0.07, -0.025, 0.02, 0.065].flatMap((x): Shape[] => [1, -1].map((m): Shape => ({ t: "cap", a: [x, 0.55, 0.27 * m], b: [x, 0.48, 0.29 * m], r: [0.012, 0.009], col: "hot", k: 0.005 }))),
      // Stern face, grey moustache, peaked officer cap with an ember band.
      { t: "ell", c: [0.02, 0.73, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.05 },
      { t: "cap", a: [0.18, 0.64, 0.07], b: [0.17, 0.62, 0.11], r: [0.02, 0.012], col: "moustache", mirror: true, k: 0.01 },
      { t: "ell", c: [0.19, 0.65, 0], r: [0.03, 0.022, 0.07], col: "moustache", k: 0.01 },
      { t: "cap", a: [-0.02, 0.83, 0], b: [-0.03, 0.89, 0], r: [0.18, 0.19], col: "coatDk", k: 0.02 },
      { t: "ell", c: [-0.03, 0.93, 0], r: [0.25, 0.06, 0.23], rot: [0, 0, 6], col: "coat", k: 0.03 },
      { t: "tor", c: [-0.02, 0.855, 0], R: 0.185, r: 0.025, col: "ember", k: 0.01 },
      { t: "ell", c: [0.15, 0.81, 0], r: [0.11, 0.018, 0.15], rot: [0, 0, -14], col: "baton", k: 0.01 },
      { t: "ell", c: [0.2, 0.9, 0], r: [0.025, 0.035, 0.035], col: "brass", k: 0.01 },
      // Near arm: baton pointed forward; far arm behind the back.
      ...arm(1, [0.3, 0.56, 0.24], "coat", "baton", 0.05),
      { t: "cap", a: [0.28, 0.55, 0.24], b: [0.52, 0.66, 0.26], r: [0.02, 0.018], col: "baton", k: 0.005 },
      { t: "ell", c: [0.53, 0.665, 0.26], r: [0.025, 0.025, 0.025], col: "ember", k: 0.005 },
      { t: "ell", c: [0.27, 0.545, 0.24], r: [0.02, 0.025, 0.025], col: "brass", k: 0.005 },
      ...arm(-1, [-0.12, 0.38, -0.12], "coat", "baton", 0.05),
      // Ash flakes and embers drifting.
      dot([0.4, 0.92, 0.2], 0.022, "ash"), dot([-0.3, 0.8, 0.1], 0.028, "ash"), dot([-0.36, 0.5, 0.2], 0.02, "ember"),
      dot([0.42, 0.3, 0.25], 0.024, "ash"), dot([0.6, 0.85, 0.1], 0.018, "ember"), dot([-0.28, 1.05, 0], 0.018, "ember"),
      dot([-0.34, 0.22, 0.05], 0.022, "ash"), dot([0.36, 1.08, 0.05], 0.015, "hot"),
    ],
    eyes: eyes("#ff8a2a", true, 0.73, 0.02, 0.05),
  },

  // MARK: Allies

  // Sargento Brisa: hooded tracker in teal and green, drawing a short bow, a quiver on her back.
  "sargento-brisa": {
    palette: {
      skin: SKIN, hair: "#5a3a26", torso: "#2f7a6a", legs: "#3b5a3a", boots: "#4a3428", hood: "#2a9a86", hoodDk: "#1d6a5c",
      leather: "#8a5a36", wood: "#a0703e", string: "#f2ecdc", fletch: "#e6f4ee", tip: "#c9d0d8", belt: "#5a3a26",
    },
    shapes: [
      // Quiver on the back with arrows.
      { t: "cap", a: [-0.16, 0.3, 0.04], b: [-0.2, 0.62, -0.02], r: [0.045, 0.05], col: "leather", k: 0.02 },
      ...[0, 0.03, -0.03].map((z, i): Shape => ({ t: "cap", a: [-0.2, 0.62, -0.02 + z], b: [-0.22 - i * 0.02, 0.74, -0.03 + z], r: [0.008, 0.008], col: "wood", k: 0 })),
      ...[0, 0.03, -0.03].map((z, i): Shape => ({ t: "ell", c: [-0.225 - i * 0.02, 0.76, -0.03 + z], r: [0.02, 0.03, 0.006], col: "fletch", k: 0 })),
      ...body({ torso: [0.13, 0.16, 0.14] }),
      { t: "cap", a: [0.1, 0.56, 0.1], b: [0.13, 0.28, -0.1], r: [0.018, 0.018], col: "leather", k: 0.01 },
      { t: "tor", c: [0, 0.29, 0], R: 0.13, r: 0.022, col: "belt" },
      // Hooded cape.
      { t: "cap", a: [-0.06, 0.58, 0], b: [-0.14, 0.24, 0], r: [0.16, 0.12], col: "hoodDk", k: 0.04 },
      { t: "ell", c: [-0.02, 0.76, 0], r: [0.22, 0.21, 0.215], col: "hood", k: 0.04 },
      { t: "ell", c: [0.2, 0.7, 0], r: [0.1, 0.13, 0.16], col: "hood", cut: true, k: 0.03 },
      { t: "ell", c: [0.07, 0.7, 0], r: [0.15, 0.15, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.13, 0.82, 0], r: [0.08, 0.04, 0.13], col: "hair", paint: true },
      { t: "cap", a: [-0.1, 0.94, 0], b: [-0.2, 0.98, 0], r: [0.04, 0.01], col: "hood", k: 0.03 },
      // Far arm holds the bow out in front; near hand draws the string back.
      ...arm(-1, [0.36, 0.56, -0.1], "torso", "leather"),
      { t: "cap", a: [0.36, 0.56, -0.1], b: [0.33, 0.82, -0.08], r: [0.018, 0.012], col: "wood", k: 0.01 },
      { t: "cap", a: [0.36, 0.56, -0.1], b: [0.33, 0.3, -0.1], r: [0.018, 0.012], col: "wood", k: 0.01 },
      { t: "cap", a: [0.33, 0.82, -0.08], b: [0.29, 0.86, -0.08], r: [0.012, 0.008], col: "wood", k: 0.01 },
      { t: "cap", a: [0.33, 0.3, -0.1], b: [0.29, 0.27, -0.1], r: [0.012, 0.008], col: "wood", k: 0.01 },
      ...arm(1, [0.02, 0.56, 0.24], "torso", "leather"),
      { t: "cap", a: [0.29, 0.86, -0.08], b: [0.03, 0.56, 0.22], r: [0.004, 0.004], col: "string", k: 0 },
      { t: "cap", a: [0.29, 0.27, -0.1], b: [0.03, 0.56, 0.22], r: [0.004, 0.004], col: "string", k: 0 },
      { t: "cap", a: [0.03, 0.56, 0.22], b: [0.48, 0.57, -0.13], r: [0.007, 0.007], col: "wood", k: 0 },
      spike([0.48, 0.57, -0.13], -40, 0.05, [0.016, 0.003], "tip", 0.005),
      { t: "ell", c: [0.06, 0.565, 0.2], r: [0.03, 0.02, 0.006], col: "fletch", k: 0 },
    ],
    eyes: eyes("#2f8a5a", false, 0.7, 0.04),
  },

  // Hermano Cobalto: calm warrior monk in cobalt robes, a long staff planted beside him, one palm raised.
  "hermano-cobalto": {
    palette: {
      skin: "#d8a47c", torso: "#2f5fb3", robe: "#2a54a0", robeDk: "#1c3a72", legs: "#1c3a72", boots: "#4a3428",
      sash: "#e8dcc0", wood: "#8a5a36", metal: "#c9a050", bead: "#6a3a28", brow: "#3a2a24",
    },
    shapes: [
      { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.45, 0], b: [-0.02, 0.12, 0], r: [0.14, 0.2], col: "robe", k: 0.05 },
      { t: "ell", c: [0, 0.43, 0], r: [0.14, 0.16, 0.16], col: "torso" },
      { t: "cap", a: [0.12, 0.57, 0.1], b: [0.15, 0.36, -0.06], r: [0.03, 0.03], col: "robeDk", paint: true },
      { t: "tor", c: [0, 0.31, 0], R: 0.15, r: 0.03, col: "sash" },
      { t: "cap", a: [0.14, 0.3, 0.05], b: [0.2, 0.14, 0.08], r: [0.025, 0.018], col: "sash", k: 0.01 },
      // Bead necklace.
      ...Array.from({ length: 9 }, (_, i): Shape => {
        const a = (-70 + i * 17.5) * Math.PI / 180;
        return { t: "ell", c: [0.02 + Math.cos(a) * 0.13, 0.54 - Math.cos(a) * 0.04, Math.sin(a) * 0.14], r: [0.018, 0.018, 0.018], col: "bead", k: 0 };
      }),
      // Shaved head, calm face.
      { t: "ell", c: [0.02, 0.73, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.06 },
      // Wide robe sleeves.
      { t: "cap", a: [0, 0.52, -0.15], b: [0.2, 0.36, -0.22], r: [0.05, 0.08], col: "robe" },
      { t: "ell", c: [0.24, 0.35, -0.22], r: [0.045, 0.045, 0.045], col: "skin", k: 0.02 },
      { t: "cap", a: [0.24, 0.05, -0.22], b: [0.24, 1.08, -0.22], r: [0.022, 0.022], col: "wood", k: 0.005 },
      { t: "cap", a: [0.24, 1.05, -0.22], b: [0.24, 1.1, -0.22], r: [0.03, 0.03], col: "metal", k: 0.005 },
      { t: "cap", a: [0.24, 0.05, -0.22], b: [0.24, 0.1, -0.22], r: [0.028, 0.028], col: "metal", k: 0.005 },
      { t: "cap", a: [0, 0.52, 0.15], b: [0.14, 0.4, 0.26], r: [0.05, 0.075], col: "robe" },
      { t: "box", c: [0.2, 0.46, 0.27], s: [0.025, 0.07, 0.04], round: 0.024, col: "skin", k: 0.02 },
    ],
    eyes: [
      { at: [0.02, 0.72, 0.085], r: 0.05, iris: "#3f7ad8", look: [0.75, 0.04, 0.6] },
      { at: [0.02, 0.72, -0.045], r: 0.046, iris: "#3f7ad8", look: [0.97, 0.04, 0.22] },
    ],
  },

  // MARK: Minions and creatures

  // El Coloso Despierto: an ancient stone-and-iron colossus rising, ember eyes and cracks, rubble falling off.
  "coloso-despierto": {
    palette: {
      stone: "#9a9284", stoneDk: "#6e685e", iron: "#3a3e46", rivet: "#9aa3ad", ember: ASH.ember, hot: ASH.emberHot, moss: "#6a8a4a",
    },
    glow: ["ember", "hot"],
    shapes: [
      // Legs like pillars.
      { t: "box", c: [0.04, 0.12, 0.16], s: [0.1, 0.13, 0.09], round: 0.04, col: "stone" },
      { t: "box", c: [-0.04, 0.12, -0.16], s: [0.1, 0.13, 0.09], round: 0.04, col: "stone" },
      { t: "box", c: [0.06, 0.03, 0.16], s: [0.13, 0.04, 0.11], round: 0.02, col: "iron", k: 0 },
      { t: "box", c: [-0.02, 0.03, -0.16], s: [0.13, 0.04, 0.11], round: 0.02, col: "iron", k: 0 },
      // Massive torso block with iron bands and a glowing chest crack.
      { t: "box", c: [0, 0.47, 0], s: [0.22, 0.24, 0.27], round: 0.1, rot: [0, 0, -8], col: "stone", k: 0.05 },
      { t: "box", c: [0.01, 0.36, 0], s: [0.23, 0.03, 0.28], round: 0.02, rot: [0, 0, -8], col: "iron", k: 0 },
      { t: "box", c: [0.03, 0.58, 0], s: [0.22, 0.03, 0.27], round: 0.02, rot: [0, 0, -8], col: "iron", k: 0 },
      ...([[0.23, 0.6, 0.12], [0.23, 0.6, -0.12], [0.2, 0.36, 0.14], [0.2, 0.36, -0.14]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.018, 0.018, 0.018], col: "rivet", k: 0.004 })),
      { t: "cap", a: [0.23, 0.55, 0.06], b: [0.25, 0.47, -0.02], r: [0.022, 0.016], col: "ember", k: 0.005 },
      { t: "cap", a: [0.25, 0.47, -0.02], b: [0.24, 0.39, 0.06], r: [0.018, 0.012], col: "ember", k: 0.005 },
      { t: "cap", a: [0.25, 0.47, -0.02], b: [0.24, 0.42, -0.1], r: [0.014, 0.008], col: "ember", k: 0.005 },
      { t: "ell", c: [-0.1, 0.62, 0.12], r: [0.08, 0.03, 0.08], col: "moss", paint: true },
      // Head: small stone block, iron brow, ember eye slits.
      { t: "box", c: [0.12, 0.82, 0], s: [0.14, 0.12, 0.14], round: 0.06, col: "stone", k: 0.04 },
      { t: "box", c: [0.17, 0.9, 0], s: [0.1, 0.03, 0.155], round: 0.02, rot: [0, 0, -10], col: "iron", k: 0 },
      { t: "ell", c: [0.255, 0.82, 0.065], r: [0.02, 0.035, 0.05], col: "ember", k: 0 },
      { t: "ell", c: [0.255, 0.82, -0.065], r: [0.02, 0.035, 0.05], col: "ember", k: 0 },
      { t: "ell", c: [0.27, 0.82, 0.065], r: [0.01, 0.015, 0.02], col: "hot", paint: true },
      { t: "ell", c: [0.27, 0.82, -0.065], r: [0.01, 0.015, 0.02], col: "hot", paint: true },
      { t: "box", c: [0.255, 0.72, 0], s: [0.012, 0.012, 0.06], round: 0.006, col: "stoneDk", paint: true },
      // Shoulders and huge arms raised, rubble falling.
      { t: "ell", c: [0.0, 0.68, 0.3], r: [0.14, 0.12, 0.13], col: "stone", mirror: true, k: 0.04 },
      { t: "box", c: [0.0, 0.76, 0.3], s: [0.12, 0.03, 0.11], round: 0.02, col: "iron", mirror: true, k: 0 },
      { t: "cap", a: [0.02, 0.7, 0.34], b: [0.1, 0.92, 0.5], r: [0.09, 0.08], col: "stone", mirror: true },
      { t: "box", c: [0.12, 0.99, 0.54], s: [0.11, 0.1, 0.1], round: 0.05, col: "stoneDk", mirror: true, k: 0.03 },
      { t: "tor", c: [0.07, 0.84, 0.44], R: 0.085, r: 0.018, rot: [30, 0, -60], col: "iron", mirror: true, k: 0 },
      dot([0.36, 0.86, 0.6], 0.035, "stoneDk"), dot([0.34, 0.66, 0.3], 0.025, "stone"), dot([0.36, 0.4, -0.38], 0.03, "stoneDk"),
      dot([-0.28, 0.9, 0.2], 0.03, "stone"), dot([0.4, 1.1, 0.0], 0.02, "hot"), dot([-0.2, 1.12, -0.2], 0.018, "ember"),
    ],
    eyes: [],
  },

  // Recluso Fugado: escaped inmate sprinting, ragged jumpsuit, broken cuffs on both wrists with snapped links.
  "recluso-fugado": {
    palette: {
      skin: "#e0a880", torso: "#c96a32", legs: "#c96a32", boots: "#3a3430", hair: "#3a2a22", metal: "#8e96a0", metalDk: "#5a6068",
      tag: "#f2ecdc", ink: "#2a2a2a", stubble: "#b08870",
    },
    shapes: [
      // Running legs.
      { t: "cap", a: [0.0, 0.3, 0.07], b: [0.16, 0.14, 0.08], r: [0.062, 0.055], col: "legs" },
      { t: "ell", c: [0.2, 0.1, 0.08], r: [0.085, 0.05, 0.06], rot: [0, 0, -20], col: "boots" },
      { t: "cap", a: [0.0, 0.3, -0.07], b: [-0.14, 0.1, -0.07], r: [0.062, 0.055], col: "legs" },
      { t: "ell", c: [-0.18, 0.06, -0.07], r: [0.085, 0.05, 0.06], rot: [0, 0, 25], col: "boots" },
      { t: "ell", c: [0.03, 0.43, 0], r: [0.14, 0.16, 0.15], rot: [0, 0, -15], col: "torso" },
      { t: "box", c: [0.15, 0.48, 0.07], s: [0.012, 0.03, 0.04], round: 0.008, col: "tag", paint: true },
      { t: "box", c: [0.16, 0.48, 0.07], s: [0.012, 0.006, 0.025], round: 0.003, col: "ink", paint: true },
      { t: "ell", c: [0.08, 0.72, 0], r: [0.18, 0.17, 0.17], col: "skin", k: 0.06 },
      { t: "ell", c: [0.2, 0.62, 0], r: [0.07, 0.06, 0.15], col: "stubble", paint: true },
      { t: "ell", c: [0.0, 0.8, 0], r: [0.18, 0.13, 0.19], col: "hair" },
      ...[-0.12, -0.03, 0.06, 0.13].map((z): Shape => spike([-0.04, 0.84, z], 150, 0.1, [0.04, 0.01], "hair", 0.03)),
      // Arms pumping, broken cuffs and dangling links.
      ...arm(1, [0.28, 0.54, 0.22], "torso", "skin"),
      { t: "tor", c: [0.24, 0.53, 0.21], R: 0.045, r: 0.016, rot: [0, 0, 70], col: "metal", k: 0.005 },
      { t: "tor", c: [0.22, 0.47, 0.22], R: 0.022, r: 0.008, rot: [90, 0, 0], col: "metalDk", k: 0 },
      { t: "tor", c: [0.22, 0.43, 0.22], R: 0.022, r: 0.008, rot: [0, 0, 90], col: "metalDk", k: 0 },
      ...arm(-1, [-0.16, 0.36, -0.2], "torso", "skin"),
      { t: "tor", c: [-0.12, 0.38, -0.19], R: 0.045, r: 0.016, rot: [0, 0, 60], col: "metal", k: 0.005 },
      { t: "tor", c: [-0.2, 0.32, -0.2], R: 0.022, r: 0.008, rot: [90, 0, 0], col: "metalDk", k: 0 },
      // Speed lines.
      { t: "cap", a: [-0.3, 0.6, 0.1], b: [-0.5, 0.6, 0.1], r: [0.01, 0.004], col: "tag", k: 0 },
      { t: "cap", a: [-0.32, 0.46, 0.15], b: [-0.48, 0.46, 0.15], r: [0.01, 0.004], col: "tag", k: 0 },
    ],
    eyes: eyes("#6a8a3a", true, 0.71, 0.08),
  },

  // Socio de Celda: hulking cellmate brute in a grey tank top, tattooed arms, cracking his knuckles.
  "socio-celda": {
    palette: {
      skin: "#c88a66", torso: "#9a9ea6", legs: "#c96a32", boots: "#2e2a2a", hair: "#2a2220", ink: "#3a4a6a", metal: "#8e96a0",
      mouth: "#3a1a14", band: ASH.ashDk,
    },
    shapes: [
      { t: "cap", a: [0.06, 0.06, 0.15], b: [0.02, 0.3, 0.13], r: [0.075, 0.095], col: "legs" },
      { t: "ell", c: [0.1, 0.05, 0.15], r: [0.11, 0.055, 0.08], col: "boots" },
      { t: "cap", a: [-0.06, 0.06, -0.14], b: [-0.02, 0.3, -0.13], r: [0.075, 0.095], col: "legs" },
      { t: "ell", c: [-0.02, 0.05, -0.14], r: [0.11, 0.055, 0.08], col: "boots" },
      { t: "ell", c: [0.0, 0.47, 0], r: [0.22, 0.24, 0.26], rot: [0, 0, -8], col: "torso", k: 0.06 },
      { t: "ell", c: [0.02, 0.62, 0], r: [0.18, 0.1, 0.24], col: "skin", k: 0.04 },
      { t: "ell", c: [0.0, 0.6, 0.24], r: [0.13, 0.11, 0.11], col: "skin", mirror: true, k: 0.04 },
      // Small head on a thick neck, buzz cut, scowl.
      { t: "ell", c: [0.12, 0.8, 0], r: [0.15, 0.14, 0.14], col: "skin", k: 0.07 },
      { t: "ell", c: [0.08, 0.88, 0], r: [0.13, 0.07, 0.14], col: "hair", k: 0.02 },
      { t: "box", c: [0.26, 0.72, 0], s: [0.012, 0.008, 0.045], round: 0.005, col: "mouth", paint: true },
      // Huge arms with tattoo bands, fists pressed together in front.
      { t: "cap", a: [0.0, 0.6, 0.3], b: [0.22, 0.32, 0.3], r: [0.1, 0.085], col: "skin" },
      { t: "cap", a: [0.0, 0.6, -0.28], b: [0.26, 0.34, -0.12], r: [0.1, 0.085], col: "skin" },
      { t: "tor", c: [0.08, 0.5, 0.3], R: 0.09, r: 0.014, rot: [0, 0, 50], col: "ink", paint: true },
      { t: "tor", c: [0.12, 0.45, 0.3], R: 0.088, r: 0.01, rot: [0, 0, 50], col: "ink", paint: true },
      { t: "ell", c: [0.3, 0.28, 0.26], r: [0.1, 0.1, 0.1], col: "skin", k: 0.02 },
      { t: "ell", c: [0.33, 0.3, 0.08], r: [0.11, 0.1, 0.1], col: "skin", k: 0.02 },
      { t: "tor", c: [0.22, 0.33, 0.29], R: 0.06, r: 0.018, rot: [0, 0, 50], col: "metal", k: 0.005 },
    ],
    eyes: [
      { at: [0.22, 0.8, 0.06], r: 0.045, iris: "#5a6a8a", angry: true, look: [0.75, 0.0, 0.6] },
      { at: [0.22, 0.8, -0.035], r: 0.042, iris: "#5a6a8a", angry: true, look: [0.97, 0.0, 0.22] },
    ],
  },

  // Mutante de Laboratorio: hunched green mutant with stitches, one oversized arm and glowing veins.
  "mutante-laboratorio": {
    palette: {
      skin: "#8fbf5a", skinDk: "#5f8a3a", stitch: "#2e3a22", vein: "#b6ff4a", torso: "#e6e8e0", legs: "#cfd3c8", boots: "#4a4f58",
      band: "#e8dcc0", metal: "#8e96a0",
    },
    glow: ["vein"],
    shapes: [
      { t: "ell", c: [0.04, 0.05, 0.09], r: [0.09, 0.055, 0.065], col: "skin", mirror: true },
      { t: "cap", a: [0, 0.08, 0.085], b: [0, 0.28, 0.07], r: [0.058, 0.07], col: "legs", mirror: true },
      { t: "ell", c: [0, 0.42, 0], r: [0.17, 0.18, 0.18], rot: [0, 0, -20], col: "torso" },
      { t: "ell", c: [-0.05, 0.56, 0], r: [0.16, 0.12, 0.2], rot: [0, 0, -25], col: "skin", k: 0.05 },
      // Head low and forward, lopsided, stitched across.
      { t: "ell", c: [0.14, 0.68, 0], r: [0.17, 0.16, 0.16], col: "skin", k: 0.06 },
      { t: "ell", c: [0.04, 0.76, -0.06], r: [0.1, 0.08, 0.1], col: "skinDk", k: 0.04 },
      { t: "cap", a: [0.12, 0.84, 0.12], b: [0.3, 0.68, 0.08], r: [0.007, 0.007], col: "stitch", paint: true },
      ...[0, 1, 2, 3].map((i): Shape => ({ t: "cap", a: [0.15 + i * 0.04, 0.83 - i * 0.04, 0.09 + i * 0.008], b: [0.18 + i * 0.04, 0.84 - i * 0.04, 0.13 + i * 0.008], r: [0.005, 0.005], col: "stitch", paint: true })),
      { t: "box", c: [0.3, 0.6, 0], s: [0.012, 0.012, 0.05], round: 0.006, col: "stitch", paint: true },
      // Oversized near arm dragging a huge fist, glowing veins.
      { t: "ell", c: [0.0, 0.58, 0.24], r: [0.14, 0.12, 0.12], col: "skin", k: 0.04 },
      { t: "cap", a: [0.02, 0.56, 0.3], b: [0.14, 0.24, 0.44], r: [0.095, 0.075], col: "skin" },
      { t: "ell", c: [0.18, 0.15, 0.48], r: [0.13, 0.11, 0.12], col: "skin", k: 0.03 },
      { t: "cap", a: [0.04, 0.6, 0.4], b: [0.1, 0.4, 0.52], r: [0.009, 0.007], col: "vein", paint: true },
      { t: "cap", a: [0.1, 0.4, 0.52], b: [0.16, 0.22, 0.6], r: [0.009, 0.007], col: "vein", paint: true },
      { t: "tor", c: [0.1, 0.33, 0.39], R: 0.08, r: 0.02, rot: [40, 0, 70], col: "band", k: 0.01 },
      // Thin far arm with a hospital band.
      ...arm(-1, [0.24, 0.42, -0.2], "skin", "skin", 0.035),
      { t: "tor", c: [0.2, 0.44, -0.19], R: 0.04, r: 0.012, rot: [0, 0, 70], col: "metal", k: 0.005 },
      { t: "cap", a: [0.12, 0.54, -0.2], b: [0.0, 0.44, -0.2], r: [0.006, 0.006], col: "vein", paint: true },
    ],
    eyes: [
      { at: [0.24, 0.7, 0.07], r: 0.065, iris: "#e8ff4a", angry: true, look: [0.75, 0.02, 0.6] },
      { at: [0.24, 0.72, -0.04], r: 0.042, iris: "#e8ff4a", angry: true, look: [0.97, 0.02, 0.22] },
    ],
  },

  // Bestia Quimérica: a lab-made beast — big-cat body and mane, curled horns, a scaly spined back,
  // one leathery wing and a lizard tail.
  "bestia-quimerica": {
    palette: {
      fur: "#d8964a", furDk: "#a8662e", mane: "#7a3a22", scale: "#4f8a5a", scaleDk: "#2f5a3a", horn: "#e8dcc0",
      wing: "#6a4a7a", wingDk: "#3e2a4a", claw: "#f2ecdc", nose: "#3a1a14", metal: "#8e96a0", tag: ASH.ember,
    },
    glow: ["tag"],
    shapes: [
      // Tail: scaly, curling up, spiked tip.
      { t: "cap", a: [-0.26, 0.42, 0], b: [-0.44, 0.36, 0], r: [0.06, 0.045], col: "scale" },
      { t: "cap", a: [-0.44, 0.36, 0], b: [-0.56, 0.5, 0], r: [0.045, 0.03], col: "scale" },
      { t: "cap", a: [-0.56, 0.5, 0], b: [-0.54, 0.66, 0], r: [0.03, 0.02], col: "scale" },
      spike([-0.54, 0.66, 0], 70, 0.08, [0.03, 0.004], "scaleDk", 0.01),
      spike([-0.55, 0.62, 0], 160, 0.06, [0.025, 0.004], "scaleDk", 0.01),
      // Legs with claws.
      ...([[0.18, 0.11], [-0.18, 0.11]] as [number, number][]).flatMap(([x, z]): Shape[] => [
        { t: "cap", a: [x, 0.36, z], b: [x + 0.02, 0.07, z + 0.01], r: [0.075, 0.05], col: "fur", mirror: true },
        { t: "ell", c: [x + 0.05, 0.04, z + 0.01], r: [0.075, 0.045, 0.06], col: "fur", mirror: true, k: 0.02 },
        { t: "cap", a: [x + 0.11, 0.03, z + 0.03], b: [x + 0.14, 0.02, z + 0.03], r: [0.012, 0.004], col: "claw", mirror: true, k: 0 },
      ]),
      // Body: front half fur, back half scales.
      { t: "ell", c: [0.0, 0.42, 0], r: [0.3, 0.17, 0.17], col: "fur", k: 0.06 },
      { t: "ell", c: [-0.18, 0.44, 0], r: [0.16, 0.16, 0.18], col: "scale", paint: true },
      ...[-0.22, -0.12, -0.02, 0.08].map((x, i): Shape => spike([x, 0.57 - i * 0.0, 0], 100, 0.09 - i * 0.01, [0.04, 0.005], "scaleDk", 0.02)),
      // Leathery wing from the shoulder.
      { t: "cap", a: [0.02, 0.55, -0.08], b: [-0.1, 0.86, -0.14], r: [0.025, 0.015], col: "wingDk", k: 0.02 },
      { t: "cap", a: [-0.1, 0.86, -0.14], b: [-0.32, 0.8, -0.16], r: [0.015, 0.01], col: "wingDk", k: 0.01 },
      { t: "box", c: [-0.11, 0.73, -0.14], s: [0.14, 0.12, 0.01], round: 0.01, rot: [0, 0, -20], col: "wing", k: 0.02 },
      // Head with a shaggy mane, curled horns and a lab collar.
      { t: "ell", c: [0.22, 0.6, 0], r: [0.15, 0.17, 0.2], col: "mane", k: 0.05 },
      ...burst([0.2, 0.62, 0], 9, 100, 0.17, [0.06, 0.015], "mane", undefined, 0.04).filter((_, i) => i < 6),
      { t: "ell", c: [0.32, 0.6, 0], r: [0.13, 0.12, 0.13], col: "fur", k: 0.04 },
      { t: "ell", c: [0.43, 0.56, 0], r: [0.06, 0.05, 0.07], col: "fur", k: 0.03 },
      { t: "ell", c: [0.48, 0.58, 0], r: [0.02, 0.018, 0.03], col: "nose", k: 0.005 },
      { t: "cap", a: [0.28, 0.7, 0.08], b: [0.22, 0.8, 0.14], r: [0.035, 0.025], col: "horn", mirror: true, k: 0.02 },
      { t: "cap", a: [0.22, 0.8, 0.14], b: [0.16, 0.76, 0.2], r: [0.025, 0.017], col: "horn", mirror: true, k: 0.01 },
      { t: "cap", a: [0.16, 0.76, 0.2], b: [0.17, 0.68, 0.21], r: [0.017, 0.008], col: "horn", mirror: true, k: 0.01 },
      { t: "tor", c: [0.18, 0.5, 0], R: 0.12, r: 0.018, rot: [0, 0, 70], col: "metal", k: 0.01 },
      { t: "box", c: [0.24, 0.4, 0], s: [0.012, 0.025, 0.025], round: 0.008, col: "tag", k: 0.005 },
    ],
    eyes: [
      { at: [0.36, 0.64, 0.06], r: 0.045, iris: "#ffd23a", angry: true, look: [0.75, 0.04, 0.6] },
      { at: [0.36, 0.64, -0.04], r: 0.04, iris: "#ffd23a", angry: true, look: [0.97, 0.04, 0.22] },
    ],
  },

  // Gólem Biológico: a towering blob of green biomass with lumpy arms, lab debris caught inside and a glowing core.
  "golem-biologico": {
    palette: {
      slime: "#6ccf4a", slimeDk: "#3f9a3a", core: "#d8ff5a", hot: "#f6ffd0", metal: "#7d8590", glass: "#bfe8ff", drip: "#8fe06a",
      mouth: "#1e4a22",
    },
    glow: ["core", "hot"],
    shapes: [
      { t: "ell", c: [0.0, 0.1, 0], r: [0.3, 0.12, 0.3], col: "slimeDk", k: 0.06 },
      { t: "ell", c: [0.0, 0.42, 0], r: [0.26, 0.32, 0.26], col: "slime", k: 0.1 },
      { t: "ell", c: [0.03, 0.72, 0], r: [0.18, 0.16, 0.18], col: "slime", k: 0.1 },
      { t: "ell", c: [-0.12, 0.56, 0.12], r: [0.1, 0.1, 0.1], col: "slime", k: 0.06 },
      { t: "ell", c: [-0.14, 0.3, -0.14], r: [0.1, 0.1, 0.1], col: "slimeDk", k: 0.06 },
      // Glowing core in the chest.
      { t: "ell", c: [0.22, 0.42, 0.04], r: [0.07, 0.07, 0.07], col: "core", k: 0.02 },
      { t: "ell", c: [0.27, 0.43, 0.06], r: [0.03, 0.03, 0.03], col: "hot", paint: true },
      // Lab debris stuck in it: a vial and a bolt.
      { t: "cap", a: [-0.05, 0.62, 0.22], b: [0.04, 0.72, 0.26], r: [0.03, 0.03], col: "glass", k: 0.0 },
      { t: "box", c: [0.14, 0.24, 0.22], s: [0.05, 0.015, 0.015], round: 0.006, rot: [0, 0, 30], col: "metal", k: 0 },
      { t: "box", c: [0.1, 0.22, 0.22], s: [0.012, 0.03, 0.03], round: 0.006, rot: [0, 0, 30], col: "metal", k: 0 },
      // Lumpy arms reaching forward.
      { t: "cap", a: [0.04, 0.56, 0.24], b: [0.3, 0.4, 0.38], r: [0.1, 0.08], col: "slime", k: 0.06 },
      { t: "ell", c: [0.36, 0.36, 0.4], r: [0.1, 0.09, 0.1], col: "slime", k: 0.04 },
      { t: "cap", a: [0.04, 0.56, -0.24], b: [0.3, 0.52, -0.34], r: [0.1, 0.08], col: "slime", k: 0.06 },
      { t: "ell", c: [0.36, 0.5, -0.36], r: [0.1, 0.09, 0.1], col: "slime", k: 0.04 },
      // Drips.
      { t: "cap", a: [0.36, 0.3, 0.42], b: [0.37, 0.18, 0.43], r: [0.03, 0.015], col: "drip", k: 0.02 },
      { t: "ell", c: [0.37, 0.12, 0.43], r: [0.025, 0.03, 0.025], col: "drip", k: 0 },
      { t: "cap", a: [0.38, 0.44, -0.36], b: [0.38, 0.32, -0.36], r: [0.03, 0.015], col: "drip", k: 0.02 },
      { t: "cap", a: [0.2, 0.7, 0.12], b: [0.24, 0.58, 0.14], r: [0.025, 0.012], col: "drip", k: 0.02 },
      { t: "ell", c: [0.2, 0.62, 0], r: [0.02, 0.03, 0.07], col: "mouth", paint: true },
    ],
    eyes: [
      { at: [0.1, 0.76, 0.08], r: 0.06, iris: "#ffe03a", angry: true, look: [0.75, 0.04, 0.6] },
      { at: [0.1, 0.76, -0.05], r: 0.055, iris: "#ffe03a", angry: true, look: [0.97, 0.04, 0.22] },
    ],
  },

  // Siervo Definitivo: a big armoured bio-servant — charcoal plates over grey-violet flesh, glowing veins, visor helm.
  "siervo-definitivo": {
    palette: {
      flesh: "#8a7e96", armor: "#3a3c44", armorLt: "#5a5e68", vein: "#9cff4a", visor: ASH.ember, hot: ASH.emberHot,
      legs: "#2c2e33", boots: "#1c1d21", rivet: "#9aa3ad",
    },
    glow: ["vein", "visor", "hot"],
    shapes: [
      { t: "cap", a: [0.06, 0.06, 0.15], b: [0.02, 0.3, 0.13], r: [0.08, 0.1], col: "legs" },
      { t: "ell", c: [0.1, 0.05, 0.15], r: [0.12, 0.06, 0.09], col: "boots" },
      { t: "cap", a: [-0.08, 0.06, -0.14], b: [-0.02, 0.3, -0.13], r: [0.08, 0.1], col: "legs" },
      { t: "ell", c: [-0.05, 0.05, -0.14], r: [0.12, 0.06, 0.09], col: "boots" },
      { t: "ell", c: [0.0, 0.47, 0], r: [0.23, 0.25, 0.27], rot: [0, 0, -10], col: "flesh", k: 0.06 },
      { t: "box", c: [0.09, 0.48, 0], s: [0.15, 0.17, 0.2], round: 0.1, rot: [0, 0, -10], col: "armor", k: 0.02 },
      { t: "ell", c: [0.24, 0.5, 0.0], r: [0.03, 0.05, 0.05], col: "vein", k: 0.01 },
      { t: "tor", c: [0.0, 0.3, 0], R: 0.21, r: 0.03, col: "armorLt", k: 0.01 },
      // Pauldrons.
      { t: "ell", c: [0.0, 0.68, 0.26], r: [0.15, 0.1, 0.13], rot: [0, 0, -15], col: "armor", mirror: true, k: 0.02 },
      { t: "ell", c: [0.0, 0.73, 0.26], r: [0.12, 0.03, 0.1], rot: [0, 0, -15], col: "armorLt", mirror: true, k: 0.01 },
      ...([[0.12, 0.7, 0.34], [0.12, 0.7, -0.34]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.017, 0.017, 0.017], col: "rivet", k: 0.004 })),
      // Helmeted head with a glowing visor slit.
      { t: "ell", c: [0.14, 0.82, 0], r: [0.15, 0.15, 0.15], col: "armor", k: 0.06 },
      { t: "box", c: [0.26, 0.82, 0], s: [0.04, 0.03, 0.12], round: 0.025, col: "visor", k: 0.01 },
      { t: "box", c: [0.295, 0.825, 0.03], s: [0.01, 0.012, 0.06], round: 0.005, col: "hot", paint: true },
      { t: "box", c: [0.12, 0.97, 0], s: [0.11, 0.025, 0.025], round: 0.012, col: "armorLt", k: 0.02 },
      // Huge flesh arms with glowing veins and armoured fists.
      { t: "cap", a: [0.02, 0.62, 0.32], b: [0.12, 0.34, 0.46], r: [0.095, 0.085], col: "flesh" },
      { t: "cap", a: [0.06, 0.6, 0.42], b: [0.1, 0.46, 0.52], r: [0.01, 0.008], col: "vein", paint: true },
      { t: "cap", a: [0.1, 0.46, 0.52], b: [0.16, 0.38, 0.55], r: [0.01, 0.008], col: "vein", paint: true },
      { t: "cap", a: [0.1, 0.46, 0.52], b: [0.06, 0.4, 0.55], r: [0.008, 0.006], col: "vein", paint: true },
      { t: "ell", c: [0.16, 0.24, 0.5], r: [0.13, 0.12, 0.12], col: "armor", k: 0.02 },
      { t: "cap", a: [0.04, 0.62, -0.3], b: [0.28, 0.5, -0.34], r: [0.095, 0.085], col: "flesh" },
      { t: "ell", c: [0.38, 0.47, -0.35], r: [0.13, 0.12, 0.12], col: "armor", k: 0.02 },
      { t: "ell", c: [0.48, 0.47, -0.34], r: [0.03, 0.09, 0.09], col: "armorLt", paint: true },
    ],
    eyes: [],
  },

  // Mutante Fugado: a wiry mutant bounding away on all fours, a snapped cage collar around its neck.
  "mutante-fugado": {
    palette: {
      skin: "#8a6ac8", skinDk: "#5a428a", belly: "#c8b6e8", claw: "#f2ecdc", metal: "#5a6068", metalDk: "#3a3e46",
      light: ASH.ember, mouth: "#2a1a3a", line: "#ffffff",
    },
    glow: ["light"],
    shapes: [
      // Hind legs pushing off, front arms reaching forward.
      { t: "cap", a: [-0.16, 0.36, 0.1], b: [-0.32, 0.18, 0.12], r: [0.07, 0.05], col: "skin" },
      { t: "cap", a: [-0.32, 0.18, 0.12], b: [-0.42, 0.06, 0.12], r: [0.05, 0.035], col: "skin" },
      { t: "cap", a: [-0.16, 0.36, -0.1], b: [-0.3, 0.2, -0.12], r: [0.07, 0.05], col: "skin" },
      { t: "cap", a: [-0.3, 0.2, -0.12], b: [-0.38, 0.1, -0.12], r: [0.05, 0.035], col: "skin" },
      { t: "ell", c: [-0.02, 0.42, 0], r: [0.2, 0.13, 0.14], rot: [0, 0, 12], col: "skin", k: 0.06 },
      { t: "ell", c: [0.0, 0.36, 0], r: [0.15, 0.07, 0.1], rot: [0, 0, 12], col: "belly", paint: true },
      ...[-0.12, -0.02, 0.08].map((x): Shape => spike([x, 0.53 + x * 0.2, 0], 110, 0.07, [0.03, 0.005], "skinDk", 0.02)),
      { t: "cap", a: [-0.2, 0.44, 0], b: [-0.42, 0.5, 0], r: [0.035, 0.012], col: "skinDk", k: 0.03 },
      { t: "cap", a: [0.12, 0.48, 0.1], b: [0.34, 0.3, 0.16], r: [0.05, 0.04], col: "skin" },
      { t: "ell", c: [0.38, 0.27, 0.17], r: [0.05, 0.035, 0.05], col: "skin", k: 0.02 },
      { t: "cap", a: [0.12, 0.48, -0.1], b: [0.36, 0.42, -0.14], r: [0.05, 0.04], col: "skin" },
      { t: "ell", c: [0.4, 0.41, -0.14], r: [0.05, 0.035, 0.05], col: "skin", k: 0.02 },
      ...[0.15, 0.19].map((z): Shape => ({ t: "cap", a: [0.42, 0.26, z], b: [0.46, 0.23, z], r: [0.01, 0.003], col: "claw", k: 0 })),
      // Head with big pointed ears, grinning.
      { t: "ell", c: [0.2, 0.62, 0], r: [0.15, 0.14, 0.14], col: "skin", k: 0.06 },
      { t: "cap", a: [0.12, 0.7, 0.09], b: [-0.02, 0.86, 0.18], r: [0.05, 0.008], col: "skin", mirror: true, k: 0.03 },
      { t: "ell", c: [0.33, 0.56, 0.0], r: [0.02, 0.025, 0.08], col: "mouth", paint: true },
      // Thick cage collar with snapped bars and a dangling broken link.
      { t: "tor", c: [0.13, 0.53, 0], R: 0.13, r: 0.04, rot: [0, 0, 60], col: "metal", k: 0 },
      { t: "box", c: [0.2, 0.46, 0.0], s: [0.025, 0.02, 0.03], round: 0.01, col: "light", k: 0.005 },
      { t: "cap", a: [0.06, 0.6, 0.08], b: [0.0, 0.72, 0.1], r: [0.014, 0.01], col: "metalDk", k: 0.005 },
      { t: "cap", a: [0.04, 0.58, -0.08], b: [-0.04, 0.7, -0.1], r: [0.014, 0.01], col: "metalDk", k: 0.005 },
      { t: "cap", a: [0.0, 0.72, 0.1], b: [-0.03, 0.76, 0.06], r: [0.01, 0.006], col: "metalDk", k: 0.005 },
      { t: "tor", c: [0.16, 0.38, 0.06], R: 0.025, r: 0.009, rot: [90, 0, 0], col: "metalDk", k: 0 },
      { t: "tor", c: [0.15, 0.33, 0.06], R: 0.025, r: 0.009, rot: [0, 0, 90], col: "metalDk", k: 0 },
      // Speed lines.
      { t: "cap", a: [-0.5, 0.5, 0.1], b: [-0.7, 0.5, 0.1], r: [0.01, 0.004], col: "line", k: 0 },
      { t: "cap", a: [-0.52, 0.34, 0.16], b: [-0.66, 0.34, 0.16], r: [0.01, 0.004], col: "line", k: 0 },
    ],
    eyes: [
      { at: [0.28, 0.65, 0.06], r: 0.05, iris: "#ff8a2a", angry: true, look: [0.75, 0.04, 0.6] },
      { at: [0.28, 0.65, -0.04], r: 0.045, iris: "#ff8a2a", angry: true, look: [0.97, 0.04, 0.22] },
    ],
  },

  // MARK: Campaign rewards

  // Arma Confiscada: a sleek pulse pistol with glowing coils, an evidence tag tied to the trigger guard.
  "arma-confiscada": {
    palette: {
      body: "#3a3d45", bodyLt: "#6a707a", grip: "#24262b", coil: "#5ff2ff", hot: "#e6ffff", ember: ASH.ember,
      tag: "#f2e2b8", tagDk: "#c9a86a", string: "#8a5a36", ink: "#c2401a",
    },
    glow: ["coil", "hot"],
    shapes: [
      // Grip angled down-back, body, long barrel with coil rings and an emitter.
      { t: "box", c: [-0.2, 0.36, 0], s: [0.07, 0.15, 0.06], round: 0.04, rot: [0, 0, -18], col: "grip", k: 0.02 },
      ...[0.4, 0.34, 0.28].map((y): Shape => ({ t: "box", c: [-0.18 + (0.4 - y) * 0.3, y, 0.06], s: [0.055, 0.008, 0.01], round: 0.004, rot: [0, 0, -18], col: "bodyLt", paint: true })),
      { t: "box", c: [-0.06, 0.56, 0], s: [0.24, 0.09, 0.075], round: 0.05, col: "body", k: 0.03 },
      { t: "box", c: [-0.1, 0.66, 0], s: [0.12, 0.025, 0.04], round: 0.02, col: "bodyLt", k: 0.02 },
      { t: "cap", a: [0.12, 0.57, 0], b: [0.46, 0.57, 0], r: [0.05, 0.045], col: "bodyLt", k: 0.02 },
      ...[0.2, 0.28, 0.36].map((x): Shape => ({ t: "tor", c: [x, 0.57, 0], R: 0.052, r: 0.016, rot: [0, 0, 90], col: "coil", k: 0.005 })),
      { t: "tor", c: [0.47, 0.57, 0], R: 0.05, r: 0.022, rot: [0, 0, 90], col: "body", k: 0.01 },
      { t: "ell", c: [0.49, 0.57, 0], r: [0.02, 0.035, 0.035], col: "hot", k: 0 },
      { t: "ell", c: [-0.02, 0.56, 0.075], r: [0.06, 0.03, 0.01], col: "ember", paint: true },
      // Trigger guard.
      { t: "tor", c: [-0.07, 0.44, 0], R: 0.05, r: 0.012, rot: [90, 0, 0], col: "body", k: 0.01 },
      // Evidence tag on a string.
      { t: "cap", a: [-0.04, 0.4, 0.01], b: [0.04, 0.24, 0.04], r: [0.006, 0.006], col: "string", k: 0 },
      { t: "box", c: [0.1, 0.15, 0.06], s: [0.12, 0.08, 0.008], round: 0.012, rot: [0, 0, -15], col: "tag", k: 0 },
      { t: "box", c: [0.1, 0.15, 0.07], s: [0.12, 0.018, 0.004], round: 0.004, rot: [0, 0, -15], col: "ink", paint: true },
      { t: "box", c: [0.08, 0.1, 0.07], s: [0.06, 0.006, 0.004], round: 0.003, rot: [0, 0, -15], col: "tagDk", paint: true },
      { t: "box", c: [0.13, 0.2, 0.07], s: [0.06, 0.006, 0.004], round: 0.003, rot: [0, 0, -15], col: "tagDk", paint: true },
      { t: "tor", c: [0.0, 0.2, 0.06], R: 0.014, r: 0.005, rot: [90, 0, 0], col: "tagDk", k: 0 },
    ],
    eyes: [],
  },

  // Blindaje Recuperado: a dented charcoal armour chestplate with shoulder guards and an ember stripe.
  "blindaje-recuperado": {
    palette: {
      plate: "#5a5f6a", plateLt: "#8a919c", dark: "#2c2e33", ember: ASH.ember, hot: ASH.emberHot, scratch: "#c3cad2", strap: "#5a3a26",
    },
    glow: ["ember"],
    shapes: [
      // Cuirass: broad at the chest, narrowing to the waist, neck and arm openings carved out.
      { t: "box", c: [0, 0.5, 0], s: [0.26, 0.2, 0.12], round: 0.1, col: "plate", k: 0.04 },
      { t: "box", c: [0, 0.26, 0], s: [0.19, 0.12, 0.1], round: 0.08, col: "plate", k: 0.08 },
      { t: "ell", c: [0, 0.71, 0.04], r: [0.12, 0.1, 0.2], col: "plate", cut: true, k: 0.03 },
      { t: "ell", c: [0.3, 0.54, 0], r: [0.07, 0.11, 0.2], col: "plate", cut: true, k: 0.03 },
      { t: "ell", c: [-0.3, 0.54, 0], r: [0.07, 0.11, 0.2], col: "plate", cut: true, k: 0.03 },
      // Pectoral plates and the central ridge.
      { t: "ell", c: [-0.1, 0.5, 0.07], r: [0.12, 0.1, 0.06], col: "plate", k: 0.03 },
      { t: "ell", c: [0.1, 0.5, 0.07], r: [0.12, 0.1, 0.06], col: "plate", k: 0.03 },
      { t: "cap", a: [0, 0.6, 0.11], b: [0, 0.2, 0.09], r: [0.016, 0.016], col: "plateLt", k: 0.02 },
      // Ember chevron across the chest, banded abdomen plates.
      { t: "cap", a: [-0.22, 0.46, 0.1], b: [0, 0.38, 0.13], r: [0.026, 0.026], col: "ember", paint: true },
      { t: "cap", a: [0.22, 0.46, 0.1], b: [0, 0.38, 0.13], r: [0.026, 0.026], col: "ember", paint: true },
      ...[0.28, 0.2].map((y): Shape => ({ t: "box", c: [0, y, 0.0], s: [0.22, 0.008, 0.14], round: 0.004, col: "dark", paint: true })),
      { t: "box", c: [0, 0.1, 0], s: [0.17, 0.03, 0.09], round: 0.03, col: "dark", k: 0.02 },
      // Rivets at the shoulders.
      ...([[-0.17, 0.66, 0.06], [0.17, 0.66, 0.06]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.02, 0.02, 0.02], col: "plateLt", k: 0.005 })),
      // Dent and scratches.
      { t: "ell", c: [0.14, 0.3, 0.12], r: [0.04, 0.035, 0.04], col: "plate", cut: true, k: 0.02 },
      { t: "cap", a: [-0.18, 0.34, 0.1], b: [-0.08, 0.26, 0.11], r: [0.005, 0.005], col: "scratch", paint: true },
      { t: "cap", a: [-0.16, 0.38, 0.11], b: [-0.06, 0.3, 0.12], r: [0.004, 0.004], col: "scratch", paint: true },
      dot([0.32, 0.84, 0.1], 0.02, "hot"), dot([-0.34, 0.2, 0.1], 0.016, "hot"),
    ],
    eyes: [],
  },

  // Muestra de Materia Viva: a sealed specimen jar with a shimmering, swirling living blob inside.
  "muestra-materia": {
    palette: {
      glass: "#cfeef6", glassLt: "#ffffff", lid: "#3a3d45", lidLt: "#6a707a", blob: "#b06aff", blob2: "#5ff2d8", hot: "#f4e6ff",
      ember: ASH.ember, label: "#f2e2b8",
    },
    glow: ["blob", "blob2", "hot"],
    shapes: [
      { t: "box", c: [0, 0.36, 0], s: [0.23, 0.28, 0.23], round: 0.13, col: "glass", k: 0.02 },
      // The blob seen through the glass (painted on its surface), swirling.
      { t: "ell", c: [0.02, 0.34, 0.21], r: [0.16, 0.19, 0.1], col: "blob", paint: true },
      { t: "ell", c: [-0.04, 0.42, 0.21], r: [0.07, 0.06, 0.08], col: "blob2", paint: true },
      { t: "ell", c: [0.08, 0.3, 0.21], r: [0.05, 0.04, 0.08], col: "hot", paint: true },
      { t: "ell", c: [0.1, 0.5, 0.21], r: [0.03, 0.03, 0.08], col: "blob2", paint: true },
      { t: "box", c: [-0.13, 0.4, 0.2], s: [0.018, 0.17, 0.05], round: 0.015, col: "glassLt", paint: true },
      // Lid, base ring and a lab label.
      { t: "box", c: [0, 0.68, 0], s: [0.17, 0.05, 0.17], round: 0.04, col: "lid", k: 0.01 },
      { t: "box", c: [0, 0.68, 0], s: [0.175, 0.012, 0.175], round: 0.01, col: "lidLt", paint: true },
      { t: "cap", a: [0, 0.73, 0], b: [0, 0.77, 0], r: [0.06, 0.05], col: "lidLt", k: 0.01 },
      { t: "box", c: [0, 0.07, 0], s: [0.22, 0.03, 0.22], round: 0.03, col: "lid", k: 0.01 },
      { t: "box", c: [0.13, 0.2, 0.17], s: [0.07, 0.04, 0.02], round: 0.01, rot: [0, 40, 0], col: "label", paint: true },
      { t: "box", c: [0.13, 0.2, 0.18], s: [0.07, 0.008, 0.02], round: 0.004, rot: [0, 40, 0], col: "ember", paint: true },
      // Sparkles.
      dot([0.32, 0.7, 0.1], 0.025, "blob2"), dot([-0.32, 0.56, 0.1], 0.02, "blob"), dot([0.3, 0.28, 0.12], 0.018, "hot"),
      dot([-0.28, 0.9, 0.0], 0.016, "blob2"),
    ],
    eyes: [],
  },

  // Mapa de los Pasos de Montaña: an unrolled parchment map with peaks, a dashed route and an ember X.
  "mapa-pasos": {
    palette: {
      paper: "#f2e2b8", paperDk: "#d8bf88", roll: "#e2cc98", wood: "#8a5a36", peak: "#6a7a8a", snow: "#ffffff", route: "#c2401a",
      ember: ASH.ember, tree: "#4f7a4a",
    },
    shapes: [
      // Sheet tilted back, rolled ends.
      { t: "box", c: [0, 0.4, 0], s: [0.3, 0.26, 0.012], round: 0.01, rot: [-20, 0, 6], col: "paper", k: 0.02 },
      { t: "cap", a: [-0.34, 0.12, 0.08], b: [-0.28, 0.67, -0.12], r: [0.045, 0.045], col: "roll", k: 0.02 },
      { t: "cap", a: [0.3, 0.14, 0.09], b: [0.36, 0.69, -0.11], r: [0.045, 0.045], col: "roll", k: 0.02 },
      ...([[-0.345, 0.08, 0.1], [-0.275, 0.71, -0.13], [0.295, 0.1, 0.11], [0.365, 0.73, -0.12]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.025, 0.025, 0.025], col: "wood", k: 0.01 })),
      // Mountains painted on (three peaks with snow caps).
      ...([[-0.14, 0.42, 0.11], [0.0, 0.48, 0.09], [0.14, 0.4, 0.12]] as [number, number, number][]).flatMap(([x, y, h]): Shape[] => [
        { t: "box", c: [x, y, 0.0], s: [h, h, 0.05], round: 0.005, rot: [-20, 0, 45], col: "peak", paint: true },
        { t: "box", c: [x, y + h * 0.95, 0.0], s: [h * 0.4, h * 0.4, 0.05], round: 0.004, rot: [-20, 0, 45], col: "snow", paint: true },
      ]),
      ...([[-0.2, 0.24], [-0.14, 0.22], [0.2, 0.26]] as [number, number][]).map(([x, y]): Shape => ({ t: "ell", c: [x, y, 0.06], r: [0.02, 0.03, 0.05], rot: [-20, 0, 0], col: "tree", paint: true })),
      // Dashed route winding through the pass to an X.
      ...([[-0.24, 0.16], [-0.17, 0.22], [-0.09, 0.27], [-0.04, 0.34], [0.03, 0.38], [0.08, 0.46], [0.14, 0.53]] as [number, number][]).map(([x, y]): Shape => ({ t: "ell", c: [x, y, 0.0], r: [0.016, 0.011, 0.06], rot: [-20, 0, 40], col: "route", paint: true })),
      { t: "box", c: [0.19, 0.6, 0.0], s: [0.045, 0.01, 0.06], round: 0.005, rot: [-20, 0, 45], col: "ember", paint: true },
      { t: "box", c: [0.19, 0.6, 0.0], s: [0.045, 0.01, 0.06], round: 0.005, rot: [-20, 0, -45], col: "ember", paint: true },
    ],
    eyes: [],
  },

  // Expediente Robado: a stolen manila dossier — papers and a photo spilling out, an ember "classified" stamp.
  "expediente-robado": {
    palette: {
      folder: "#d8a85a", folderDk: "#a8783a", paper: "#fbf6ee", line: "#a8a8b0", photo: "#4a4f58", photoLt: "#9aa3ad",
      stamp: ASH.emberDk, clip: "#c3cad2", ash: ASH.ash,
    },
    shapes: [
      // Back cover, papers and the front cover, tilted.
      { t: "box", c: [-0.02, 0.4, -0.03], s: [0.27, 0.32, 0.012], round: 0.012, rot: [-15, 0, 8], col: "folderDk", k: 0 },
      { t: "box", c: [0.04, 0.46, 0.0], s: [0.24, 0.29, 0.008], round: 0.006, rot: [-15, 0, -6], col: "paper", k: 0 },
      ...[0.62, 0.57, 0.52].map((y): Shape => ({ t: "box", c: [0.06 + (0.62 - y) * -0.1, y, 0.02], s: [0.15, 0.007, 0.03], round: 0.003, rot: [-15, 0, -6], col: "line", paint: true })),
      // Photo clipped to the paper.
      { t: "box", c: [0.22, 0.56, 0.03], s: [0.1, 0.12, 0.008], round: 0.006, rot: [-15, 0, 14], col: "photo", k: 0 },
      { t: "ell", c: [0.22, 0.58, 0.05], r: [0.035, 0.04, 0.02], col: "photoLt", paint: true },
      { t: "ell", c: [0.22, 0.5, 0.05], r: [0.06, 0.03, 0.02], col: "photoLt", paint: true },
      { t: "tor", c: [0.2, 0.69, 0.03], R: 0.03, r: 0.008, rot: [0, 0, 0], col: "clip", k: 0 },
      { t: "box", c: [-0.02, 0.32, 0.05], s: [0.28, 0.25, 0.012], round: 0.012, rot: [-15, 0, 3], col: "folder", k: 0 },
      { t: "box", c: [-0.2, 0.59, 0.0], s: [0.08, 0.03, 0.012], round: 0.012, rot: [-15, 0, 3], col: "folder", k: 0 },
      // Stamp on the cover.
      { t: "tor", c: [0.02, 0.3, 0.08], R: 0.1, r: 0.012, rot: [75, 0, 0], col: "stamp", paint: true },
      { t: "box", c: [0.02, 0.3, 0.08], s: [0.1, 0.022, 0.03], round: 0.006, rot: [-15, 0, -15], col: "stamp", paint: true },
      // Scorch at a corner.
      { t: "ell", c: [-0.28, 0.1, 0.09], r: [0.07, 0.06, 0.04], col: "ash", paint: true },
    ],
    eyes: [],
  },

  // Técnica Aprendida: a wooden training post with peg arms, a martial-arts scroll tied with a ribbon in front.
  "tecnica-aprendida": {
    palette: {
      wood: "#a0703e", woodDk: "#6a4426", base: "#5a5f6a", paper: "#f2e2b8", ink: "#2a2a2a", ribbon: "#2f5fb3", ember: ASH.ember,
      wrap: "#e8dcc0",
    },
    glow: ["ember"],
    shapes: [
      { t: "box", c: [-0.06, 0.03, -0.06], s: [0.2, 0.03, 0.2], round: 0.025, col: "base", k: 0.01 },
      { t: "cap", a: [-0.06, 0.06, -0.06], b: [-0.06, 0.94, -0.06], r: [0.11, 0.1], col: "wood", k: 0.02 },
      { t: "tor", c: [-0.06, 0.82, -0.06], R: 0.1, r: 0.016, col: "woodDk", k: 0.005 },
      { t: "tor", c: [-0.06, 0.2, -0.06], R: 0.11, r: 0.016, col: "woodDk", k: 0.005 },
      { t: "box", c: [-0.06, 0.55, -0.06], s: [0.115, 0.08, 0.115], round: 0.04, col: "wrap", k: 0.01 },
      // Peg arms.
      { t: "cap", a: [0.0, 0.7, 0.0], b: [0.26, 0.74, 0.12], r: [0.03, 0.025], col: "woodDk", k: 0.01 },
      { t: "cap", a: [0.0, 0.7, -0.12], b: [0.26, 0.74, -0.2], r: [0.03, 0.025], col: "woodDk", k: 0.01 },
      { t: "cap", a: [0.02, 0.42, -0.04], b: [0.3, 0.36, 0.04], r: [0.03, 0.025], col: "woodDk", k: 0.01 },
      // Impact sparks at the strike point.
      { t: "ell", c: [0.05, 0.55, 0.06], r: [0.03, 0.03, 0.03], col: "ember", k: 0 },
      ...burst([0.06, 0.55, 0.08], 6, 0, 0.1, [0.014, 0.003], "ember", undefined, 0.005),
      // Scroll lying in front, ribbon tied round.
      { t: "cap", a: [-0.08, 0.06, 0.26], b: [0.3, 0.06, 0.12], r: [0.055, 0.055], col: "paper", k: 0.01 },
      { t: "tor", c: [0.11, 0.06, 0.19], R: 0.056, r: 0.012, rot: [90, 70, 0], col: "ribbon", k: 0.005 },
      { t: "cap", a: [0.12, 0.06, 0.25], b: [0.2, 0.01, 0.32], r: [0.012, 0.008], col: "ribbon", k: 0.005 },
      ...([[-0.09, 0.06, 0.265], [0.31, 0.06, 0.115]] as V3[]).map((c): Shape => ({ t: "ell", c, r: [0.03, 0.03, 0.03], col: "woodDk", k: 0.01 })),
      { t: "box", c: [0.0, 0.08, 0.27], s: [0.03, 0.03, 0.01], round: 0.006, rot: [0, 20, 0], col: "ink", paint: true },
    ],
    eyes: [],
  },

  // Antídoto Universal: a round glass flask of glowing mint antidote with a cork, two capsules beside it.
  antidoto: {
    palette: {
      glass: "#d8f4ee", glassLt: "#ffffff", liquid: "#4ae8b0", hot: "#d8fff0", cork: "#b0844e", band: "#2f5fb3",
      pill: "#fbf6ee", pill2: "#4ae8b0", leaf: "#2f8a5a",
    },
    glow: ["liquid", "hot"],
    shapes: [
      { t: "ell", c: [0, 0.3, 0], r: [0.25, 0.25, 0.25], col: "glass", k: 0.02 },
      { t: "cap", a: [0, 0.5, 0], b: [0, 0.72, 0], r: [0.08, 0.07], col: "glass", k: 0.06 },
      { t: "box", c: [0, 0.24, 0], s: [0.26, 0.17, 0.26], round: 0.0, col: "liquid", paint: true },
      { t: "ell", c: [0.06, 0.2, 0.22], r: [0.08, 0.05, 0.05], col: "hot", paint: true },
      { t: "ell", c: [-0.13, 0.4, 0.18], r: [0.03, 0.08, 0.04], col: "glassLt", paint: true },
      { t: "cap", a: [0, 0.7, 0], b: [0, 0.8, 0], r: [0.065, 0.075], col: "cork", k: 0.01 },
      { t: "tor", c: [0, 0.6, 0], R: 0.08, r: 0.018, col: "band", k: 0.005 },
      // Leaf emblem on the flask.
      { t: "ell", c: [0.08, 0.36, 0.2], r: [0.03, 0.06, 0.06], rot: [0, 0, -30], col: "leaf", paint: true },
      // Capsules.
      { t: "cap", a: [0.28, 0.04, 0.2], b: [0.4, 0.04, 0.12], r: [0.04, 0.04], col: "pill", k: 0 },
      { t: "cap", a: [0.34, 0.04, 0.16], b: [0.4, 0.04, 0.12], r: [0.041, 0.041], col: "pill2", k: 0 },
      { t: "cap", a: [-0.3, 0.04, 0.22], b: [-0.2, 0.04, 0.3], r: [0.04, 0.04], col: "pill", k: 0 },
      { t: "cap", a: [-0.25, 0.04, 0.26], b: [-0.2, 0.04, 0.3], r: [0.041, 0.041], col: "pill2", k: 0 },
      dot([0.22, 0.7, 0.1], 0.02, "liquid"), dot([-0.24, 0.62, 0.05], 0.016, "hot"),
    ],
    eyes: [],
  },

  // Suero Estabilizado: a syringe of glowing blue serum, held diagonally, stabiliser rings round the barrel.
  "suero-estabilizado": {
    palette: {
      glass: "#dff2ff", serum: "#3fa8ff", hot: "#d8f0ff", metal: "#c3cad2", metalDk: "#6a707a", plunger: "#3a3d45", ring: "#2f5fb3",
    },
    glow: ["serum", "hot"],
    shapes: (() => {
      const ang = 40, c = Math.cos((ang * Math.PI) / 180), sn = Math.sin((ang * Math.PI) / 180);
      const P = (t: number, z = 0): V3 => [t * c, 0.42 + t * sn, z];
      const ring = (t: number, R: number, r: number, col: string): Shape => ({ t: "tor", c: P(t), R, r, rot: [0, 0, ang - 90], col, k: 0.005 });
      return [
        { t: "cap", a: P(-0.48), b: P(-0.44), r: [0.1, 0.1], col: "plunger", k: 0.01 },
        { t: "cap", a: P(-0.44), b: P(-0.26), r: [0.02, 0.02], col: "metalDk", k: 0.01 },
        { t: "box", c: P(-0.24), s: [0.02, 0.13, 0.05], round: 0.015, rot: [0, 0, ang], col: "metal", k: 0.01 },
        { t: "cap", a: P(-0.23), b: P(0.24), r: [0.085, 0.085], col: "glass", k: 0.01 },
        { t: "cap", a: P(-0.14), b: P(0.22), r: [0.087, 0.087], col: "serum", paint: true },
        { t: "cap", a: P(-0.1, 0.06), b: P(0.16, 0.06), r: [0.02, 0.02], col: "hot", paint: true },
        ring(-0.05, 0.088, 0.018, "ring"), ring(0.08, 0.088, 0.018, "ring"),
        { t: "cap", a: P(0.24), b: P(0.3), r: [0.06, 0.03], col: "metal", k: 0.01 },
        { t: "cap", a: P(0.3), b: P(0.5), r: [0.008, 0.004], col: "metal", k: 0.005 },
        dot(P(0.56), 0.02, "serum"), dot([0.0, 0.85, 0.1], 0.02, "hot"), dot([-0.3, 0.75, 0.05], 0.016, "serum"),
      ];
    })(),
    eyes: [],
  },
};
