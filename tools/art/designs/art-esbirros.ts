import type { EyeSpec, Sculpt, Shape, V3 } from "../sculpt";
import { SKIN, arm, body, burst, eyes, turn, FRONT } from "./kit";

/** Scales shapes by `s` about the origin and moves them by `o` (for several small figures in one image). */
function place(shapes: Shape[], s: number, o: V3): Shape[] {
  const p = (v: V3): V3 => [v[0] * s + o[0], v[1] * s + o[1], v[2] * s + o[2]];
  return shapes.map((sh) => {
    const k = sh.k === undefined ? 0.04 * s : sh.k * s;
    switch (sh.t) {
      case "ell": return { ...sh, k, c: p(sh.c), r: [sh.r[0] * s, sh.r[1] * s, sh.r[2] * s] };
      case "cap": return { ...sh, k, a: p(sh.a), b: p(sh.b), r: [sh.r[0] * s, sh.r[1] * s] };
      case "box": return { ...sh, k, c: p(sh.c), s: [sh.s[0] * s, sh.s[1] * s, sh.s[2] * s], round: sh.round * s };
      case "tor": return { ...sh, k, c: p(sh.c), R: sh.R * s, r: sh.r * s };
    }
  });
}
function placeEyes(es: EyeSpec[], s: number, o: V3): EyeSpec[] {
  return es.map((e) => ({ ...e, at: [e.at[0] * s + o[0], e.at[1] * s + o[1], e.at[2] * s + o[2]], r: e.r * s }));
}
/** Expands `mirror` shapes into explicit pairs (so `turn` keeps them symmetric about the turned body). */
function unmirror(shapes: Shape[]): Shape[] {
  const m = (v: V3): V3 => [v[0], v[1], -v[2]];
  return shapes.flatMap((sh) => {
    if (!sh.mirror) return [sh];
    const base = { ...sh, mirror: false };
    const rot: V3 | undefined = sh.rot ? [-sh.rot[0], -sh.rot[1], sh.rot[2]] : undefined;
    let copy: Shape;
    if (base.t === "cap") copy = { ...base, a: m(base.a), b: m(base.b) };
    else copy = { ...base, c: m(base.c), rot };
    return [base, copy];
  });
}
/** Turns shapes about y after expanding their mirrors. */
const spin = (shapes: Shape[], deg: number) => turn(unmirror(shapes), deg);
/** Rotates a point about y like `turn` does. */
function turnV(v: V3, deg: number): V3 {
  const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t);
  return [co * v[0] + si * v[2], v[1], -si * v[0] + co * v[2]];
}

/** A small jet-pack trooper flying forward (Nexo's air squad), upright size ≈ 1. */
function trooper(): { shapes: Shape[]; eyes: EyeSpec[] } {
  return {
    shapes: [
      // Jet pack and flames first so the body blends over them.
      { t: "box", c: [-0.17, 0.46, 0], s: [0.07, 0.14, 0.12], round: 0.05, rot: [0, 0, -25], col: "steel", k: 0.03 },
      { t: "cap", a: [-0.2, 0.36, 0], b: [-0.27, 0.27, 0], r: [0.07, 0.08], col: "dark", k: 0.02 },
      { t: "cap", a: [-0.29, 0.24, 0], b: [-0.48, 0.0, 0], r: [0.075, 0.012], col: "flame", k: 0.01 },
      { t: "cap", a: [-0.29, 0.24, 0], b: [-0.38, 0.12, 0], r: [0.05, 0.015], col: "hot", k: 0.01 },
      { t: "cap", a: [-0.02, 0.3, 0.065], b: [-0.16, 0.12, 0.07], r: [0.055, 0.045], col: "suit", mirror: true },
      { t: "ell", c: [-0.18, 0.09, 0.07], r: [0.07, 0.05, 0.055], col: "boots", rot: [0, 0, -40], mirror: true },
      { t: "ell", c: [0.0, 0.42, 0], r: [0.13, 0.15, 0.14], rot: [0, 0, -25], col: "suit", k: 0.05 },
      { t: "box", c: [0.08, 0.44, 0], s: [0.06, 0.1, 0.11], round: 0.05, rot: [0, 0, -25], col: "steel", k: 0.03 },
      { t: "ell", c: [0.13, 0.46, 0], r: [0.03, 0.04, 0.05], col: "red", paint: true },
      // Fist punched forward, other arm swept back.
      { t: "cap", a: [0.04, 0.52, 0.13], b: [0.26, 0.56, 0.17], r: [0.045, 0.042], col: "suit" },
      { t: "ell", c: [0.29, 0.57, 0.17], r: [0.055, 0.05, 0.05], col: "steel", k: 0.02 },
      { t: "cap", a: [0.0, 0.5, -0.13], b: [-0.14, 0.36, -0.2], r: [0.045, 0.04], col: "suit" },
      { t: "ell", c: [-0.16, 0.34, -0.2], r: [0.05, 0.05, 0.05], col: "steel", k: 0.02 },
      // Head in a helmet with a red crest and an open face.
      { t: "ell", c: [0.1, 0.7, 0], r: [0.17, 0.16, 0.16], col: "skin", k: 0.06 },
      { t: "ell", c: [0.07, 0.76, 0], r: [0.18, 0.15, 0.18], col: "steel", k: 0.02 },
      { t: "ell", c: [0.25, 0.7, 0], r: [0.08, 0.08, 0.13], col: "steel", cut: true, k: 0.02 },
      { t: "ell", c: [0.13, 0.69, 0], r: [0.14, 0.12, 0.13], col: "skin", k: 0.02 },
      { t: "cap", a: [0.12, 0.9, 0], b: [-0.12, 0.88, 0], r: [0.045, 0.03], col: "red", k: 0.02 },
    ],
    eyes: [
      { at: [0.13, 0.7, 0.07], r: 0.055, iris: "#ff3a3a", angry: true, look: [0.75, 0.04, 0.6] },
      { at: [0.13, 0.7, -0.03], r: 0.05, iris: "#ff3a3a", angry: true, look: [0.97, 0.04, 0.22] },
    ],
  };
}

const CARD_EYE = turnV([0.06, 0.5, 0], FRONT);

/** A trooper turned by `deg`, scaled by `sc` and moved to `o`. */
function squadMember(deg: number, sc: number, o: V3): { shapes: Shape[]; eyes: EyeSpec[] } {
  const t = trooper();
  const ey = t.eyes.map((e) => ({ ...e, at: turnV(e.at, deg), look: turnV(e.look ?? [1, 0, 0], deg) }));
  return { shapes: place(spin(t.shapes, deg), sc, o), eyes: placeEyes(ey, sc, o) };
}
const squad = [squadMember(5, 0.6, [-0.42, 0.66, -0.3]), squadMember(5, 0.6, [-0.46, 0.0, 0.3]), squadMember(5, 0.85, [0.12, 0.24, 0.05])];

/** The assault drone's turn toward the camera. */
const ASALTO = -40;

export const artEsbirros: Record<string, Sculpt> = {
  // Matón a Sueldo: broad hired thug in a rust jacket and grey flat cap, a nail-studded club raised.
  "maton-sueldo": {
    palette: {
      skin: "#e0a07a", torso: "#a8462a", legs: "#5d636e", boots: "#2e2a2a", cap: "#6b707a", capDark: "#454a54",
      wood: "#7a4a2a", nail: "#c9d0d8", stubble: "#a87a62", shirt: "#d8cfc0", mouth: "#3a1a14",
    },
    shapes: [
      ...body({ torso: [0.17, 0.17, 0.18], hips: 0.07 }),
      { t: "ell", c: [-0.02, 0.53, 0], r: [0.15, 0.09, 0.25], col: "torso", k: 0.06 },
      { t: "ell", c: [0.16, 0.46, 0], r: [0.04, 0.09, 0.06], col: "shirt", paint: true },
      { t: "tor", c: [0, 0.27, 0], R: 0.155, r: 0.025, col: "capDark" },
      { t: "ell", c: [0.18, 0.62, 0], r: [0.07, 0.06, 0.15], col: "stubble", paint: true },
      { t: "box", c: [0.205, 0.62, 0], s: [0.02, 0.01, 0.05], round: 0.008, col: "mouth", paint: true },
      // Flat cap with a stubby brim.
      { t: "ell", c: [0.0, 0.85, 0], r: [0.2, 0.085, 0.2], col: "cap", k: 0.02 },
      { t: "ell", c: [0.15, 0.82, 0], r: [0.11, 0.025, 0.15], col: "capDark", k: 0.01 },
      // Club raised over the shoulder.
      ...arm(1, [0.1, 0.64, 0.28], "torso", "skin", 0.055),
      { t: "cap", a: [0.1, 0.58, 0.28], b: [-0.06, 1.02, 0.3], r: [0.025, 0.065], col: "wood", k: 0.01 },
      { t: "cap", a: [-0.02, 0.92, 0.35], b: [0.0, 0.93, 0.4], r: [0.012, 0.004], col: "nail", k: 0 },
      { t: "cap", a: [0.0, 0.88, 0.3], b: [0.05, 0.9, 0.3], r: [0.012, 0.004], col: "nail", k: 0 },
      { t: "cap", a: [-0.05, 0.98, 0.33], b: [-0.05, 1.04, 0.36], r: [0.012, 0.004], col: "nail", k: 0 },
      ...arm(-1, [0.22, 0.4, -0.22], "torso", "skin", 0.055),
    ],
    eyes: eyes("#c8501a", true, 0.7),
  },

  // Guardaespaldas Blindado: steel-armoured bodyguard in a helmet, crouched behind a tall riot shield.
  "guardaespaldas-blindado": {
    palette: {
      skin: "#d89a72", torso: "#5d636e", legs: "#3f4652", boots: "#262a32", armor: "#9aa3b0", dark: "#3f4652",
      shield: "#a9c4d6", rim: "#4a525e", visor: "#2a3442", rust: "#c2552f", baton: "#2a2e36",
    },
    shapes: [
      ...body({ torso: [0.16, 0.17, 0.17], hips: 0.07 }),
      { t: "box", c: [0.05, 0.42, 0], s: [0.12, 0.13, 0.16], round: 0.07, col: "armor", k: 0.03 },
      { t: "ell", c: [0, 0.56, 0.17], r: [0.1, 0.08, 0.1], col: "armor", mirror: true, k: 0.02 },
      // Helmet with the face opening and a raised visor.
      { t: "ell", c: [-0.01, 0.75, 0], r: [0.22, 0.21, 0.22], col: "armor", k: 0.03 },
      { t: "ell", c: [0.21, 0.68, 0], r: [0.1, 0.1, 0.15], col: "armor", cut: true, k: 0.03 },
      { t: "ell", c: [0.08, 0.68, 0], r: [0.16, 0.14, 0.15], col: "skin", k: 0.02 },
      { t: "box", c: [0.15, 0.9, 0], s: [0.05, 0.03, 0.17], round: 0.025, rot: [0, 0, 35], col: "visor", k: 0.02 },
      { t: "box", c: [0.0, 0.94, 0], s: [0.16, 0.02, 0.03], round: 0.015, col: "rust", paint: true },
      // Baton raised in the near hand.
      ...arm(1, [0.08, 0.6, 0.28], "torso", "dark", 0.05),
      { t: "cap", a: [0.08, 0.55, 0.28], b: [0.0, 0.92, 0.3], r: [0.025, 0.022], col: "baton", k: 0.01 },
      // Riot shield in the far hand, a viewport window and a rust stripe.
      ...arm(-1, [0.22, 0.42, -0.14], "torso", "dark", 0.05),
      { t: "box", c: [0.3, 0.36, -0.04], s: [0.025, 0.3, 0.2], round: 0.02, rot: [0, -30, 0], col: "rim", k: 0 },
      { t: "box", c: [0.31, 0.36, -0.04], s: [0.05, 0.27, 0.17], round: 0.02, rot: [0, -30, 0], col: "shield", paint: true },
      { t: "box", c: [0.31, 0.54, -0.04], s: [0.05, 0.04, 0.13], round: 0.02, rot: [0, -30, 0], col: "visor", paint: true },
      { t: "box", c: [0.31, 0.24, -0.04], s: [0.05, 0.025, 0.17], round: 0.01, rot: [0, -30, 0], col: "rust", paint: true },
    ],
    eyes: eyes("#c8501a", true, 0.69),
  },

  // Artificiero: soot-smudged bomb-maker in a leather apron, welding mask flipped up, a lit bomb held high.
  artificiero: {
    palette: {
      skin: "#e8b48e", torso: "#5d636e", legs: "#3f3a36", boots: "#2a2420", apron: "#8a5a3a", mask: "#4a5058",
      lens: "#2f5a3a", bomb: "#2e3140", fuse: "#c9a36a", spark: "#ffd24a", strap: "#a8462a", gloves: "#c8873a",
      stick: "#c2412f", soot: "#9a7a6a",
    },
    glow: ["spark"],
    shapes: [
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "ell", c: [0.14, 0.33, 0], r: [0.05, 0.17, 0.12], col: "apron", paint: true },
      { t: "cap", a: [0.1, 0.54, 0.13], b: [0.12, 0.26, -0.13], r: [0.022, 0.022], col: "strap", k: 0.01 },
      { t: "cap", a: [0.15, 0.48, 0.07], b: [0.17, 0.38, 0.06], r: [0.018, 0.018], col: "stick", k: 0.005 },
      { t: "cap", a: [0.16, 0.42, 0.0], b: [0.18, 0.32, -0.01], r: [0.018, 0.018], col: "stick", k: 0.005 },
      { t: "ell", c: [0.19, 0.64, 0.06], r: [0.04, 0.03, 0.05], col: "soot", paint: true },
      // Headband and the welding mask pushed up on top of the head.
      { t: "tor", c: [0.02, 0.79, 0], R: 0.185, r: 0.02, col: "mask", k: 0.01 },
      { t: "box", c: [0.04, 0.92, 0], s: [0.05, 0.13, 0.17], round: 0.04, rot: [0, 0, 65], col: "mask", k: 0.02 },
      { t: "box", c: [0.06, 0.965, 0], s: [0.03, 0.04, 0.12], round: 0.015, rot: [0, 0, 65], col: "lens", paint: true },
      // Lit bomb held up in the near hand.
      ...arm(1, [0.04, 0.5, 0.36], "torso", "gloves"),
      { t: "ell", c: [0.02, 0.6, 0.42], r: [0.11, 0.11, 0.11], col: "bomb", k: 0 },
      { t: "cap", a: [0.02, 0.71, 0.42], b: [0.02, 0.74, 0.42], r: [0.035, 0.035], col: "bomb", k: 0.01 },
      { t: "cap", a: [0.02, 0.74, 0.42], b: [-0.04, 0.83, 0.44], r: [0.012, 0.01], col: "fuse", k: 0.01 },
      { t: "ell", c: [-0.05, 0.86, 0.44], r: [0.045, 0.045, 0.045], col: "spark", k: 0 },
      ...burst([-0.05, 0.86, 0.44], 6, 15, 0.08, [0.014, 0.004], "spark", undefined, 0.01),
      { t: "ell", c: [0.08, 0.65, 0.48], r: [0.03, 0.03, 0.02], col: "fuse", paint: true },
      // Dynamite bundle in the far hand.
      ...arm(-1, [0.22, 0.38, -0.22], "torso", "gloves"),
      { t: "cap", a: [0.27, 0.3, -0.22], b: [0.27, 0.5, -0.22], r: [0.025, 0.025], col: "stick", k: 0.005 },
      { t: "cap", a: [0.27, 0.3, -0.26], b: [0.27, 0.5, -0.26], r: [0.025, 0.025], col: "stick", k: 0.005 },
      { t: "cap", a: [0.27, 0.5, -0.24], b: [0.3, 0.56, -0.24], r: [0.006, 0.006], col: "fuse", k: 0 },
    ],
    eyes: eyes("#ff8a2a", true, 0.7),
  },

  // Mercenario Veterano: grizzled veteran in heavy steel plate, eye patch and scar, a huge cleaver blade.
  "mercenario-veterano": {
    palette: {
      skin: "#d89a72", torso: "#4a4f58", legs: "#3a3530", boots: "#2a2420", armor: "#8f96a0", dark: "#3f4652",
      rust: "#a8462a", patch: "#1e1a1a", scar: "#9a4a3a", blade: "#b8c0ca", edge: "#eef2f6", grip: "#5a3a2a",
      hair: "#8a8a8a",
    },
    shapes: [
      ...body({ torso: [0.17, 0.17, 0.18], hips: 0.07 }),
      { t: "box", c: [0.05, 0.42, 0], s: [0.13, 0.14, 0.17], round: 0.08, col: "armor", k: 0.03 },
      { t: "box", c: [0.07, 0.31, 0], s: [0.13, 0.025, 0.18], round: 0.02, col: "rust", paint: true },
      { t: "ell", c: [-0.01, 0.57, 0.19], r: [0.13, 0.1, 0.12], col: "armor", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.01, 0.62, 0.24], b: [-0.03, 0.72, 0.29], r: [0.03, 0.006], col: "dark", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.03, 0.8, 0], r: [0.18, 0.12, 0.18], col: "hair", paint: true },
      { t: "ell", c: [0.17, 0.6, 0], r: [0.07, 0.06, 0.15], col: "hair", paint: true },
      // Eye patch on the near eye, its strap, and a scar across it.
      { t: "ell", c: [0.12, 0.7, 0.16], r: [0.06, 0.055, 0.05], col: "patch", paint: true },
      { t: "tor", c: [0.02, 0.73, 0], R: 0.19, r: 0.012, rot: [-25, 0, 0], col: "patch", paint: true },
      { t: "cap", a: [0.13, 0.82, 0.12], b: [0.17, 0.58, 0.12], r: [0.01, 0.008], col: "scar", paint: true },
      // Cleaver blade raised forward in the near hand.
      ...arm(1, [0.14, 0.5, 0.28], "torso", "dark", 0.05),
      { t: "cap", a: [0.16, 0.44, 0.3], b: [0.14, 0.58, 0.3], r: [0.02, 0.02], col: "grip", k: 0.01 },
      { t: "box", c: [0.16, 0.6, 0.3], s: [0.07, 0.02, 0.03], round: 0.012, rot: [0, 0, 25], col: "dark", k: 0.01 },
      { t: "box", c: [0.04, 0.86, 0.3], s: [0.075, 0.25, 0.016], round: 0.02, rot: [0, 0, 25], col: "blade", k: 0.01 },
      { t: "box", c: [0.1, 0.89, 0.3], s: [0.02, 0.25, 0.03], round: 0.01, rot: [0, 0, 25], col: "edge", paint: true },
      ...arm(-1, [0.22, 0.38, -0.22], "torso", "dark", 0.05),
    ],
    eyes: [{ at: [0.02, 0.7, -0.045], r: 0.058, iris: "#c8501a", angry: true, look: [0.97, 0.04, 0.22] }],
  },

  // Silas Corven, el Magnate de Hierro: portly iron-plated industrialist in a top hat, monocle and moustache, leaning on a cane.
  "silas-corven": {
    palette: {
      skin: "#ecc8aa", torso: "#3f4652", plate: "#7d8796", legs: "#2b2f38", boots: "#1a1c22", hat: "#22252c",
      band: "#a8462a", vest: "#8a2a2a", shirt: "#efe6d8", gold: "#e0a83a", cane: "#2a2226", stache: "#5a5552", glove: "#d8d8d8",
    },
    shapes: [
      { t: "box", c: [-0.15, 0.27, 0], s: [0.03, 0.17, 0.14], round: 0.025, rot: [0, 0, -12], col: "torso", k: 0.04 },
      ...body({ torso: [0.16, 0.18, 0.17] }),
      { t: "ell", c: [0.15, 0.4, 0], r: [0.05, 0.14, 0.08], col: "vest", paint: true },
      { t: "ell", c: [0.15, 0.53, 0], r: [0.04, 0.05, 0.04], col: "shirt", paint: true },
      { t: "ell", c: [0.17, 0.45, 0.0], r: [0.015, 0.015, 0.015], col: "gold", k: 0 },
      { t: "ell", c: [0.17, 0.37, 0.0], r: [0.015, 0.015, 0.015], col: "gold", k: 0 },
      { t: "ell", c: [0.0, 0.42, 0.13], r: [0.1, 0.13, 0.06], col: "plate", mirror: true, k: 0.03 },
      { t: "ell", c: [-0.01, 0.56, 0.18], r: [0.1, 0.07, 0.1], col: "plate", mirror: true, k: 0.02 },
      { t: "ell", c: [0.02, 0.6, 0.27], r: [0.015, 0.015, 0.015], col: "gold", mirror: true, k: 0 },
      // Moustache with curled tips.
      { t: "cap", a: [0.2, 0.635, 0.0], b: [0.17, 0.62, 0.1], r: [0.025, 0.014], col: "stache", mirror: true, k: 0.02 },
      { t: "cap", a: [0.17, 0.62, 0.1], b: [0.17, 0.66, 0.13], r: [0.014, 0.008], col: "stache", mirror: true, k: 0.01 },
      // Monocle on the near eye with its chain.
      { t: "tor", c: [0.125, 0.7, 0.17], R: 0.068, r: 0.012, rot: [90, 0, -37], col: "gold", k: 0 },
      { t: "cap", a: [0.12, 0.63, 0.22], b: [0.12, 0.48, 0.2], r: [0.006, 0.006], col: "gold", k: 0 },
      // Tall top hat.
      { t: "ell", c: [0.0, 0.86, 0], r: [0.22, 0.025, 0.22], col: "hat", k: 0.01 },
      { t: "cap", a: [0.0, 0.86, 0], b: [-0.01, 1.14, 0], r: [0.13, 0.145], col: "hat", k: 0.01 },
      { t: "cap", a: [0.0, 0.9, 0], b: [0.0, 0.95, 0], r: [0.15, 0.15], col: "band", paint: true },
      // Cane planted in front, other fist on the hip.
      ...arm(-1, [0.26, 0.38, -0.18], "torso", "glove"),
      { t: "cap", a: [0.28, 0.0, -0.2], b: [0.26, 0.4, -0.18], r: [0.016, 0.016], col: "cane", k: 0.01 },
      { t: "ell", c: [0.26, 0.43, -0.18], r: [0.035, 0.035, 0.035], col: "gold", k: 0.01 },
      ...arm(1, [0.14, 0.32, 0.24], "torso", "glove"),
    ],
    eyes: eyes("#5a8fb8", true, 0.7),
  },

  // Contrabandista de Armas: masked smuggler in a long violet coat and beanie, hauling a crate bristling with weapons.
  "contrabandista-armas": {
    palette: {
      skin: "#e0a07a", torso: "#3a3346", coat: "#4a3a5c", legs: "#2e2a36", boots: "#1e1a22", beanie: "#8a3fbf",
      scarf: "#c03a8a", crate: "#9a6a3a", crateDark: "#6a4424", metal: "#b8c0ca", dark: "#2e3140", stencil: "#e8d8b0",
    },
    shapes: [
      ...body({ torso: [0.15, 0.17, 0.16] }),
      { t: "cap", a: [-0.02, 0.16, 0], b: [0, 0.48, 0], r: [0.2, 0.15], col: "coat", k: 0.04 },
      { t: "tor", c: [0.01, 0.55, 0], R: 0.11, r: 0.045, col: "scarf", k: 0.03 },
      { t: "ell", c: [0.18, 0.62, 0], r: [0.07, 0.065, 0.17], col: "scarf", paint: true },
      { t: "ell", c: [-0.01, 0.83, 0], r: [0.19, 0.13, 0.19], col: "beanie", k: 0.02 },
      { t: "tor", c: [0.01, 0.79, 0], R: 0.175, r: 0.03, col: "beanie", k: 0.01 },
      { t: "ell", c: [-0.03, 0.97, 0], r: [0.04, 0.04, 0.04], col: "beanie", k: 0.02 },
      // Weapons poking out of the crate first, then the crate itself.
      { t: "cap", a: [0.22, 0.42, 0.1], b: [0.32, 0.72, 0.12], r: [0.02, 0.018], col: "dark", k: 0.01 },
      { t: "cap", a: [0.28, 0.6, 0.11], b: [0.25, 0.64, 0.11], r: [0.02, 0.02], col: "dark", k: 0.01 },
      { t: "cap", a: [0.18, 0.42, -0.06], b: [0.12, 0.78, -0.1], r: [0.022, 0.006], col: "metal", k: 0.01 },
      { t: "box", c: [0.17, 0.5, -0.07], s: [0.012, 0.012, 0.05], round: 0.006, col: "dark", k: 0.005 },
      { t: "cap", a: [0.26, 0.42, 0.0], b: [0.38, 0.66, -0.02], r: [0.016, 0.016], col: "dark", k: 0.01 },
      { t: "cap", a: [0.38, 0.66, -0.02], b: [0.4, 0.74, -0.02], r: [0.03, 0.004], col: "metal", k: 0.01 },
      { t: "box", c: [0.25, 0.34, 0], s: [0.13, 0.11, 0.17], round: 0.015, col: "crate", k: 0 },
      { t: "box", c: [0.25, 0.34, 0], s: [0.135, 0.02, 0.175], round: 0.01, col: "crateDark", paint: true },
      { t: "box", c: [0.38, 0.34, 0], s: [0.02, 0.06, 0.1], round: 0.01, col: "stencil", paint: true },
      ...arm(1, [0.2, 0.34, 0.2], "coat", "boots"),
      ...arm(-1, [0.2, 0.34, -0.2], "coat", "boots"),
    ],
    eyes: eyes("#ff5ad8", true, 0.71),
  },

  // Guardia Sónico: violet-uniformed guard in a headphone helmet, swinging a sonic baton that rings with sound waves.
  "guardia-sonico": {
    palette: {
      skin: "#e8b48e", torso: "#4a2f6e", legs: "#2e2440", boots: "#1e1a26", armor: "#7a5aa8", helm: "#3a2a52",
      phone: "#c03a8a", pad: "#2a2030", baton: "#2e3140", wave: "#ff5ad8",
    },
    glow: ["wave"],
    shapes: [
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "box", c: [0.05, 0.42, 0], s: [0.11, 0.12, 0.15], round: 0.07, col: "armor", k: 0.03 },
      { t: "ell", c: [0.16, 0.44, 0], r: [0.03, 0.04, 0.04], col: "wave", paint: true },
      { t: "tor", c: [0, 0.28, 0], R: 0.14, r: 0.024, col: "helm" },
      { t: "ell", c: [-0.02, 0.79, 0], r: [0.2, 0.15, 0.2], col: "helm", k: 0.02 },
      { t: "box", c: [0.17, 0.8, 0], s: [0.04, 0.03, 0.15], round: 0.02, col: "helm", k: 0.02 },
      // Headphones: band over the top, big cups with glowing rims.
      { t: "tor", c: [-0.03, 0.76, 0], R: 0.21, r: 0.026, rot: [0, 0, 90], col: "phone", k: 0.01 },
      { t: "cap", a: [-0.03, 0.72, 0.16], b: [-0.03, 0.72, 0.23], r: [0.075, 0.065], col: "phone", mirror: true, k: 0.02 },
      { t: "tor", c: [-0.03, 0.72, 0.235], R: 0.045, r: 0.013, rot: [90, 0, 0], col: "wave", mirror: true, k: 0 },
      { t: "ell", c: [-0.03, 0.72, 0.24], r: [0.035, 0.035, 0.02], col: "pad", paint: true, mirror: true },
      // Sonic baton with rings of sound.
      ...arm(1, [0.14, 0.56, 0.28], "torso", "pad"),
      { t: "cap", a: [0.1, 0.5, 0.28], b: [0.28, 0.8, 0.3], r: [0.022, 0.03], col: "baton", k: 0.01 },
      { t: "ell", c: [0.29, 0.82, 0.3], r: [0.042, 0.042, 0.042], col: "wave", k: 0.01 },
      { t: "tor", c: [0.34, 0.9, 0.3], R: 0.05, r: 0.011, rot: [0, 0, -30], col: "wave", k: 0 },
      { t: "tor", c: [0.39, 0.98, 0.3], R: 0.075, r: 0.011, rot: [0, 0, -30], col: "wave", k: 0 },
      ...arm(-1, [0.22, 0.38, -0.22], "torso", "pad"),
    ],
    eyes: eyes("#ff5ad8", true, 0.7),
  },

  // Bajo Sónico: hulking violet brute whose whole chest is a bass speaker cabinet, small head, huge fists.
  "bajo-sonico": {
    palette: {
      hide: "#7a5aa8", cab: "#3a2a4a", trim: "#c03a8a", cone: "#1a141e", wave: "#ff5ad8", knob: "#d8d0e0",
      tusk: "#f4ead2", mouth: "#1a0d1a", boots: "#2a2030",
    },
    glow: ["wave"],
    shapes: [
      { t: "cap", a: [0.02, 0.05, 0.13], b: [0, 0.22, 0.12], r: [0.09, 0.09], col: "hide", mirror: true },
      { t: "ell", c: [0.06, 0.05, 0.13], r: [0.12, 0.05, 0.09], col: "boots", mirror: true },
      { t: "box", c: [0, 0.45, 0], s: [0.22, 0.25, 0.24], round: 0.08, col: "cab", k: 0.04 },
      // Woofer and tweeter on the front.
      { t: "tor", c: [0.22, 0.41, 0], R: 0.13, r: 0.028, rot: [0, 0, 90], col: "trim", k: 0.01 },
      { t: "ell", c: [0.23, 0.41, 0], r: [0.03, 0.12, 0.12], col: "cone", paint: true },
      { t: "ell", c: [0.23, 0.41, 0], r: [0.035, 0.05, 0.05], col: "wave", k: 0.01 },
      { t: "ell", c: [0.23, 0.62, 0.1], r: [0.02, 0.035, 0.035], col: "wave", paint: true },
      { t: "ell", c: [0.23, 0.62, -0.1], r: [0.02, 0.035, 0.035], col: "wave", paint: true },
      { t: "cap", a: [-0.05, 0.71, 0.12], b: [-0.05, 0.74, 0.12], r: [0.025, 0.02], col: "knob", k: 0.01 },
      { t: "cap", a: [-0.1, 0.71, 0.04], b: [-0.1, 0.74, 0.04], r: [0.025, 0.02], col: "knob", k: 0.01 },
      // Sound rings pulsing out of the woofer.
      { t: "tor", c: [0.36, 0.41, 0], R: 0.12, r: 0.012, rot: [0, 0, 90], col: "wave", k: 0 },
      { t: "tor", c: [0.46, 0.41, 0], R: 0.17, r: 0.012, rot: [0, 0, 90], col: "wave", k: 0 },
      // Small head sunk between the shoulders.
      { t: "ell", c: [0.06, 0.78, 0], r: [0.15, 0.13, 0.15], col: "hide", k: 0.06 },
      { t: "box", c: [0.2, 0.72, 0], s: [0.02, 0.012, 0.06], round: 0.01, col: "mouth", paint: true },
      { t: "cap", a: [0.19, 0.71, 0.05], b: [0.2, 0.77, 0.06], r: [0.016, 0.006], col: "tusk", mirror: true, k: 0.01 },
      // Huge arms with fists.
      { t: "ell", c: [-0.02, 0.62, 0.24], r: [0.12, 0.1, 0.1], col: "hide", mirror: true, k: 0.04 },
      { t: "cap", a: [-0.02, 0.6, 0.28], b: [-0.02, 0.28, 0.38], r: [0.08, 0.075], col: "hide", mirror: true },
      { t: "ell", c: [0.0, 0.2, 0.4], r: [0.1, 0.1, 0.1], col: "hide", mirror: true, k: 0.03 },
      { t: "tor", c: [-0.02, 0.3, 0.37], R: 0.07, r: 0.02, rot: [0, 0, -5], col: "trim", mirror: true, k: 0.01 },
    ],
    eyes: [{ at: [0.15, 0.8, 0.06], r: 0.05, iris: "#ff5ad8", mirror: true, angry: true, look: [0.7, 0.05, 0.7] }],
  },

  // Fundidora: woman in a charcoal heat suit and round goggles, her hands molten orange and dripping.
  fundidora: {
    palette: {
      skin: "#e8b48e", torso: "#3a3036", legs: "#2a2428", boots: "#1e1a1c", hair: "#8a2a1e", rim: "#4a4f58",
      strap: "#2a2428", molten: "#ff7a1f", hot: "#ffd24a", trim: "#ff8a2a",
    },
    glow: ["molten", "hot", "trim"],
    shapes: [
      { t: "cap", a: [-0.16, 0.84, 0], b: [-0.3, 0.56, 0], r: [0.07, 0.035], col: "hair", k: 0.04 },
      ...body({ torso: [0.13, 0.16, 0.14] }),
      { t: "tor", c: [0, 0.3, 0], R: 0.12, r: 0.018, col: "trim" },
      { t: "ell", c: [0.12, 0.46, 0], r: [0.02, 0.06, 0.03], col: "trim", paint: true },
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.19, 0.15, 0.2], col: "hair", k: 0.02 },
      { t: "cap", a: [0.06, 0.88, 0.08], b: [0.16, 0.8, 0.14], r: [0.04, 0.02], col: "hair", k: 0.02 },
      // Round heat goggles over the eyes.
      { t: "tor", c: [0.02, 0.73, 0], R: 0.19, r: 0.014, col: "strap", paint: true },
      { t: "tor", c: [0.125, 0.7, 0.17], R: 0.07, r: 0.016, rot: [90, 0, -37], col: "rim", k: 0 },
      { t: "tor", c: [0.215, 0.71, -0.005], R: 0.065, r: 0.016, rot: [0, 0, -90], col: "rim", k: 0 },
      // Molten hands, dripping, flames curling up.
      { t: "cap", a: [0, 0.5, 0.15], b: [0.2, 0.52, 0.28], r: [0.045, 0.045], col: "torso" },
      { t: "cap", a: [0.14, 0.52, 0.25], b: [0.21, 0.53, 0.29], r: [0.047, 0.06], col: "molten", k: 0.02 },
      { t: "ell", c: [0.25, 0.54, 0.3], r: [0.075, 0.075, 0.075], col: "molten", k: 0.03 },
      { t: "ell", c: [0.28, 0.56, 0.33], r: [0.045, 0.045, 0.045], col: "hot", paint: true },
      { t: "cap", a: [0.26, 0.48, 0.31], b: [0.27, 0.36, 0.32], r: [0.03, 0.012], col: "molten", k: 0.02 },
      { t: "ell", c: [0.27, 0.32, 0.32], r: [0.02, 0.025, 0.02], col: "molten", k: 0 },
      { t: "cap", a: [0.25, 0.6, 0.3], b: [0.28, 0.76, 0.32], r: [0.04, 0.008], col: "hot", k: 0.03 },
      { t: "cap", a: [0.23, 0.58, 0.26], b: [0.2, 0.7, 0.24], r: [0.03, 0.006], col: "hot", k: 0.03 },
      { t: "cap", a: [0, 0.5, -0.15], b: [0.22, 0.42, -0.24], r: [0.045, 0.045], col: "torso" },
      { t: "cap", a: [0.16, 0.43, -0.22], b: [0.23, 0.42, -0.25], r: [0.047, 0.06], col: "molten", k: 0.02 },
      { t: "ell", c: [0.27, 0.42, -0.25], r: [0.075, 0.075, 0.075], col: "molten", k: 0.03 },
      { t: "ell", c: [0.3, 0.44, -0.24], r: [0.04, 0.04, 0.04], col: "hot", paint: true },
      { t: "cap", a: [0.28, 0.36, -0.25], b: [0.29, 0.22, -0.25], r: [0.03, 0.01], col: "molten", k: 0.02 },
      { t: "ell", c: [0.29, 0.17, -0.25], r: [0.02, 0.025, 0.02], col: "molten", k: 0 },
    ],
    eyes: eyes("#ff8a2a", true, 0.7),
  },

  // Hombre Radiante: glowing green man in a bulky olive hazard suit and hood, respirator, a blazing core in his chest.
  "hombre-radiante": {
    palette: {
      skin: "#8cf03a", torso: "#4a5a3a", legs: "#4a5a3a", boots: "#2a2e26", hazard: "#ffd23a", core: "#eaff6a",
      filter: "#3a3a3a", spark: "#c8ff5a",
    },
    glow: ["skin", "core", "spark"],
    shapes: [
      { t: "ell", c: [-0.02, 0.74, 0], r: [0.22, 0.21, 0.22], col: "torso", k: 0.04 },
      { t: "ell", c: [0.21, 0.71, 0], r: [0.1, 0.11, 0.15], col: "torso", cut: true, k: 0.03 },
      ...body({ torso: [0.17, 0.18, 0.18], hips: 0.075 }),
      { t: "ell", c: [0.08, 0.7, 0], r: [0.16, 0.14, 0.15], col: "skin", k: 0.02 },
      { t: "tor", c: [0, 0.27, 0], R: 0.165, r: 0.025, col: "hazard" },
      { t: "tor", c: [0, 0.18, 0.072], R: 0.062, r: 0.018, col: "hazard", mirror: true },
      // Respirator.
      { t: "ell", c: [0.2, 0.62, 0], r: [0.05, 0.04, 0.07], col: "filter", k: 0.02 },
      { t: "cap", a: [0.2, 0.6, 0.06], b: [0.25, 0.58, 0.12], r: [0.03, 0.032], col: "filter", mirror: true, k: 0.01 },
      // Chest core with a hazard rim.
      { t: "tor", c: [0.17, 0.42, 0], R: 0.085, r: 0.022, rot: [0, 0, 90], col: "hazard", k: 0.01 },
      { t: "ell", c: [0.17, 0.42, 0], r: [0.04, 0.075, 0.075], col: "core", k: 0.01 },
      // Arms with glowing hands.
      ...arm(1, [0.16, 0.36, 0.3], "torso", "skin", 0.055),
      { t: "tor", c: [0.12, 0.38, 0.27], R: 0.05, r: 0.014, rot: [0, 0, 70], col: "hazard", k: 0.01 },
      ...arm(-1, [0.24, 0.6, -0.24], "torso", "skin", 0.055),
      // Radioactive motes floating around.
      { t: "ell", c: [0.32, 0.72, 0.28], r: [0.025, 0.025, 0.025], col: "spark", k: 0 },
      { t: "ell", c: [-0.2, 0.9, 0.2], r: [0.03, 0.03, 0.03], col: "spark", k: 0 },
      { t: "ell", c: [-0.24, 0.5, 0.26], r: [0.02, 0.02, 0.02], col: "spark", k: 0 },
      { t: "ell", c: [0.32, 0.72, -0.3], r: [0.025, 0.025, 0.025], col: "spark", k: 0 },
    ],
    eyes: eyes("#2a6a10", true, 0.72),
  },

  // Tiburón Acorazado: hulking blue-grey shark-man bolted into steel plates, dorsal fin, a grin full of teeth.
  "tiburon-acorazado": {
    palette: {
      shark: "#5a7a9a", belly: "#e8eef2", plate: "#8f96a0", dark: "#3f4652", rust: "#a8462a", tooth: "#ffffff",
      mouth: "#3a1020", gill: "#3a506a", fin: "#4a6a8a",
    },
    shapes: [
      { t: "cap", a: [0.02, 0.05, 0.12], b: [0, 0.24, 0.11], r: [0.08, 0.085], col: "shark", mirror: true },
      { t: "ell", c: [0.06, 0.05, 0.12], r: [0.11, 0.05, 0.08], col: "dark", mirror: true },
      { t: "ell", c: [0, 0.42, 0], r: [0.2, 0.2, 0.21], col: "shark", k: 0.06 },
      { t: "ell", c: [0.14, 0.36, 0], r: [0.08, 0.14, 0.14], col: "belly", paint: true },
      // Dorsal fin on the back.
      { t: "ell", c: [-0.18, 0.86, 0], r: [0.05, 0.17, 0.025], rot: [0, 0, 35], col: "fin", k: 0.06 },
      // Big shark head with a snout and a toothy mouth.
      { t: "ell", c: [0.04, 0.72, 0], r: [0.23, 0.2, 0.21], col: "shark", k: 0.08 },
      { t: "ell", c: [0.2, 0.7, 0], r: [0.15, 0.13, 0.15], col: "shark", k: 0.06 },
      { t: "ell", c: [0.24, 0.6, 0], r: [0.11, 0.05, 0.13], col: "belly", paint: true },
      { t: "box", c: [0.33, 0.645, 0], s: [0.04, 0.022, 0.12], round: 0.02, col: "mouth", paint: true },
      { t: "cap", a: [0.33, 0.67, 0.0], b: [0.345, 0.635, 0.0], r: [0.014, 0.004], col: "tooth", k: 0 },
      { t: "cap", a: [0.32, 0.67, 0.05], b: [0.335, 0.635, 0.05], r: [0.014, 0.004], col: "tooth", mirror: true, k: 0 },
      { t: "cap", a: [0.3, 0.67, 0.095], b: [0.31, 0.635, 0.095], r: [0.013, 0.004], col: "tooth", mirror: true, k: 0 },
      { t: "cap", a: [0.07, 0.72, 0.19], b: [0.04, 0.62, 0.2], r: [0.008, 0.008], col: "gill", paint: true, mirror: true },
      { t: "cap", a: [0.02, 0.73, 0.2], b: [-0.01, 0.63, 0.2], r: [0.008, 0.008], col: "gill", paint: true, mirror: true },
      // Steel plates: helmet plate, chest plate, pauldrons.
      { t: "box", c: [-0.02, 0.88, 0], s: [0.14, 0.03, 0.12], round: 0.03, rot: [0, 0, -10], col: "plate", k: 0.03 },
      { t: "box", c: [0.1, 0.46, 0], s: [0.1, 0.09, 0.15], round: 0.05, col: "plate", k: 0.03 },
      { t: "ell", c: [0.2, 0.46, 0.1], r: [0.015, 0.015, 0.015], col: "dark", mirror: true, k: 0 },
      { t: "box", c: [0.08, 0.3, 0], s: [0.14, 0.025, 0.2], round: 0.02, col: "rust", paint: true },
      { t: "ell", c: [-0.02, 0.56, 0.22], r: [0.12, 0.09, 0.11], col: "plate", mirror: true, k: 0.02 },
      // Arms with fin blades and fists.
      { t: "cap", a: [0.0, 0.54, 0.26], b: [0.18, 0.32, 0.32], r: [0.07, 0.06], col: "shark", mirror: true },
      { t: "cap", a: [0.08, 0.44, 0.33], b: [-0.02, 0.36, 0.38], r: [0.03, 0.006], col: "fin", mirror: true, k: 0.03 },
      { t: "tor", c: [0.15, 0.36, 0.31], R: 0.06, r: 0.02, rot: [0, 0, -40], col: "plate", mirror: true, k: 0.01 },
      { t: "ell", c: [0.21, 0.28, 0.33], r: [0.075, 0.075, 0.075], col: "shark", mirror: true, k: 0.03 },
    ],
    eyes: [{ at: [0.16, 0.78, 0.08], r: 0.05, iris: "#ffcf3a", mirror: true, angry: true, look: [0.7, 0.05, 0.7] }],
  },

  // Remolino: teal-suited fighter spinning inside rings of wind, arms flung out with curved wrist blades.
  remolino: {
    palette: {
      skin: SKIN, torso: "#2f8a9a", legs: "#25606e", boots: "#1e3a44", helm: "#c9d3dc", wind: "#bff4ff",
      wind2: "#7fe0f0", blade: "#eef2f6", dark: "#2a3442", trim: "#ffd23a",
    },
    shapes: [
      ...body(),
      { t: "ell", c: [0.12, 0.42, 0], r: [0.03, 0.06, 0.06], col: "trim", paint: true },
      { t: "tor", c: [0, 0.28, 0], R: 0.12, r: 0.02, col: "dark" },
      { t: "ell", c: [-0.02, 0.8, 0], r: [0.19, 0.13, 0.19], col: "helm", k: 0.02 },
      { t: "cap", a: [0.1, 0.88, 0], b: [-0.08, 1.0, 0], r: [0.04, 0.012], col: "trim", k: 0.03 },
      { t: "cap", a: [-0.08, 1.0, 0], b: [-0.18, 0.94, 0], r: [0.012, 0.006], col: "trim", k: 0.02 },
      { t: "ell", c: [0.17, 0.71, 0], r: [0.06, 0.04, 0.16], col: "dark", paint: true },
      // Arms flung out, curved blades at the wrists.
      ...arm(1, [0.04, 0.58, 0.36], "torso", "dark"),
      { t: "cap", a: [0.04, 0.6, 0.38], b: [0.2, 0.68, 0.44], r: [0.03, 0.004], col: "blade", k: 0.01 },
      { t: "cap", a: [0.04, 0.56, 0.38], b: [-0.12, 0.48, 0.42], r: [0.03, 0.004], col: "blade", k: 0.01 },
      ...arm(-1, [0.04, 0.58, -0.36], "torso", "dark"),
      { t: "cap", a: [0.04, 0.6, -0.38], b: [0.2, 0.68, -0.44], r: [0.03, 0.004], col: "blade", k: 0.01 },
      // Rings of wind widening upward like a funnel.
      { t: "tor", c: [0, 0.1, 0], R: 0.2, r: 0.022, rot: [8, 0, 6], col: "wind", k: 0 },
      { t: "tor", c: [0, 0.3, 0], R: 0.28, r: 0.02, rot: [-12, 0, 8], col: "wind2", k: 0 },
      { t: "tor", c: [0, 0.52, 0], R: 0.42, r: 0.018, rot: [14, 0, -8], col: "wind", k: 0 },
      { t: "tor", c: [0, 0.82, 0], R: 0.36, r: 0.016, rot: [-10, 0, 10], col: "wind2", k: 0 },
    ],
    eyes: eyes("#2fc8e0", true, 0.71),
  },

  // Dron: a cheap little drone built around a face-down card, one red eye and two rotors.
  dron: {
    palette: { card: "#2b2f5a", border: "#e0a83a", metal: "#8f96a0", dark: "#3f4652", rotor: "#d8e0e8", red: "#ff3a3a" },
    glow: ["red"],
    shapes: spin([
      { t: "box", c: [0, 0.5, 0], s: [0.035, 0.3, 0.21], round: 0.03, col: "border", k: 0 },
      { t: "box", c: [0, 0.5, 0], s: [0.05, 0.26, 0.17], round: 0.02, col: "card", paint: true },
      { t: "ell", c: [0.04, 0.5, 0], r: [0.04, 0.1, 0.1], col: "metal", k: 0.02 },
      { t: "tor", c: [0.075, 0.5, 0], R: 0.085, r: 0.014, rot: [0, 0, 90], col: "dark", k: 0.01 },
      // Rotor struts and spinning discs.
      { t: "cap", a: [0, 0.76, 0.14], b: [0, 0.9, 0.22], r: [0.02, 0.018], col: "dark", mirror: true },
      { t: "cap", a: [0, 0.9, 0.22], b: [0, 0.95, 0.22], r: [0.025, 0.02], col: "dark", mirror: true },
      { t: "ell", c: [0, 0.96, 0.22], r: [0.13, 0.01, 0.13], col: "rotor", mirror: true, k: 0 },
      // Landing claws and a red thruster glow.
      { t: "cap", a: [0, 0.22, 0.1], b: [0.04, 0.12, 0.14], r: [0.016, 0.01], col: "dark", mirror: true },
      { t: "ell", c: [0, 0.2, 0], r: [0.04, 0.03, 0.04], col: "red", k: 0.01 },
    ], FRONT),
    eyes: [{ at: CARD_EYE, r: 0.08, iris: "#ff3a3a", angry: true, look: turnV([1, 0.02, 0], FRONT) }],
  },

  // Dron Centinela: armoured sentry orb with a single big scanning red eye in a visor band, radar fin and thruster.
  "dron-centinela": {
    palette: { steel: "#8f96a0", plate: "#5d636e", dark: "#2e3140", red: "#ff3a3a", flame: "#ff7a5a" },
    glow: ["red", "flame"],
    shapes: [
      { t: "ell", c: [0, 0.5, 0], r: [0.27, 0.26, 0.27], col: "steel", k: 0.04 },
      { t: "ell", c: [-0.02, 0.66, 0], r: [0.24, 0.12, 0.24], col: "plate", paint: true },
      { t: "tor", c: [0, 0.5, 0], R: 0.27, r: 0.03, col: "dark", k: 0.02 },
      { t: "ell", c: [0.22, 0.5, 0.06], r: [0.08, 0.14, 0.16], col: "dark", k: 0.03 },
      { t: "tor", c: [0.27, 0.5, 0.08], R: 0.11, r: 0.018, rot: [90, 0, -55], col: "red", k: 0.01 },
      // Armour side plates.
      { t: "box", c: [-0.02, 0.5, 0.27], s: [0.14, 0.17, 0.03], round: 0.03, col: "plate", mirror: true, k: 0.02 },
      { t: "box", c: [-0.02, 0.5, 0.29], s: [0.1, 0.02, 0.02], round: 0.01, col: "red", paint: true, mirror: true },
      // Radar fin and antenna on top.
      { t: "box", c: [-0.08, 0.8, 0], s: [0.1, 0.06, 0.015], round: 0.015, rot: [0, 0, 20], col: "plate", k: 0.03 },
      { t: "cap", a: [0.05, 0.74, 0.08], b: [0.05, 0.92, 0.1], r: [0.012, 0.01], col: "dark", k: 0.01 },
      { t: "ell", c: [0.05, 0.93, 0.1], r: [0.025, 0.025, 0.025], col: "red", k: 0 },
      // Thruster and flame below.
      { t: "cap", a: [0, 0.26, 0], b: [0, 0.18, 0], r: [0.08, 0.06], col: "dark", k: 0.03 },
      { t: "cap", a: [0, 0.16, 0], b: [0, 0.02, 0], r: [0.055, 0.01], col: "flame", k: 0 },
      // Twin gun barrels under the chin.
      { t: "cap", a: [0.12, 0.32, 0.09], b: [0.3, 0.3, 0.1], r: [0.025, 0.02], col: "dark", mirror: true, k: 0.02 },
    ],
    eyes: [{ at: [0.15, 0.5, 0.08], r: 0.11, iris: "#ff3a3a", angry: true, look: [0.8, 0, 0.6] }],
  },

  // Dron de Asalto: bulky armoured quadrotor with a front shield plate, red visor eye and twin weapon pods.
  "dron-asalto": {
    palette: { steel: "#7d8796", plate: "#4a525e", dark: "#2a2e36", red: "#ff3a3a", rotor: "#d8e0e8", hazard: "#e0a83a" },
    glow: ["red"],
    shapes: spin([
      { t: "box", c: [0, 0.5, 0], s: [0.24, 0.21, 0.22], round: 0.09, col: "steel", k: 0.04 },
      // Front shield plate with a hazard stripe and an armoured brow over the eye.
      { t: "box", c: [0.24, 0.47, 0], s: [0.05, 0.17, 0.2], round: 0.05, col: "plate", k: 0.03 },
      { t: "box", c: [0.28, 0.35, 0], s: [0.03, 0.025, 0.2], round: 0.01, col: "hazard", paint: true },
      { t: "box", c: [0.28, 0.52, 0], s: [0.03, 0.06, 0.13], round: 0.04, col: "dark", paint: true },
      { t: "box", c: [0.3, 0.63, 0.07], s: [0.04, 0.025, 0.09], round: 0.02, rot: [-18, 0, 0], col: "steel", mirror: true, k: 0.02 },
      // Four rotor arms with guarded rotors.
      { t: "cap", a: [0.1, 0.62, 0.12], b: [0.2, 0.76, 0.3], r: [0.045, 0.035], col: "plate", mirror: true },
      { t: "cap", a: [-0.1, 0.62, 0.12], b: [-0.2, 0.76, 0.3], r: [0.045, 0.035], col: "plate", mirror: true },
      { t: "tor", c: [0.2, 0.78, 0.3], R: 0.11, r: 0.022, col: "dark", mirror: true, k: 0.02 },
      { t: "tor", c: [-0.2, 0.78, 0.3], R: 0.11, r: 0.022, col: "dark", mirror: true, k: 0.02 },
      { t: "ell", c: [0.2, 0.79, 0.3], r: [0.095, 0.008, 0.095], col: "rotor", mirror: true, k: 0 },
      { t: "ell", c: [-0.2, 0.79, 0.3], r: [0.095, 0.008, 0.095], col: "rotor", mirror: true, k: 0 },
      { t: "ell", c: [0.2, 0.8, 0.3], r: [0.025, 0.02, 0.025], col: "dark", mirror: true, k: 0 },
      { t: "ell", c: [-0.2, 0.8, 0.3], r: [0.025, 0.02, 0.025], col: "dark", mirror: true, k: 0 },
      // Weapon pods slung on the flanks, barrels forward.
      { t: "cap", a: [-0.08, 0.36, 0.27], b: [0.2, 0.36, 0.27], r: [0.07, 0.07], col: "dark", mirror: true, k: 0.04 },
      { t: "cap", a: [0.2, 0.39, 0.29], b: [0.38, 0.39, 0.29], r: [0.022, 0.022], col: "plate", mirror: true, k: 0.01 },
      { t: "cap", a: [0.2, 0.33, 0.25], b: [0.38, 0.33, 0.25], r: [0.022, 0.022], col: "plate", mirror: true, k: 0.01 },
      { t: "ell", c: [0.39, 0.39, 0.29], r: [0.01, 0.016, 0.016], col: "red", paint: true, mirror: true },
      { t: "ell", c: [0.39, 0.33, 0.25], r: [0.01, 0.016, 0.016], col: "red", paint: true, mirror: true },
      { t: "box", c: [0.05, 0.36, 0.34], s: [0.08, 0.02, 0.01], round: 0.008, col: "hazard", paint: true, mirror: true },
      { t: "ell", c: [0.0, 0.27, 0], r: [0.07, 0.03, 0.07], col: "red", k: 0.01 },
    ], ASALTO),
    eyes: [{ at: turnV([0.2, 0.52, 0], ASALTO), r: 0.11, iris: "#ff3a3a", angry: true, look: turnV([1, 0, 0], ASALTO) }],
  },

  // Escuadrón Aéreo: three jet-pack troopers in red-crested steel helmets streaking across the sky in formation.
  "escuadron-aereo": {
    palette: {
      skin: SKIN, suit: "#3f4652", steel: "#8f96a0", dark: "#2a2e36", boots: "#2a2e36", red: "#e0352f",
      flame: "#ff7a2a", hot: "#ffd24a",
    },
    glow: ["flame", "hot"],
    shapes: squad.flatMap((m) => m.shapes),
    eyes: squad.flatMap((m) => m.eyes),
  },
};
