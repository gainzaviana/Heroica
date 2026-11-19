import * as THREE from "three";
import type { EyeSpec, Sculpt, Shape, V3 } from "../sculpt";
import { SKIN, arm, body, burst, eyes, rad, turn } from "./kit";

// Campaign "El Ascenso del Mariscal de Ceniza" — art batch 2: the Legión de Ceniza's troops and
// its experimental weapons.

// MARK: Local helpers

/** Scales shapes by `s` about the origin and moves them by `o`. */
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
/** Expands `mirror` shapes into explicit pairs (so rotations keep them symmetric). */
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
/** Turns shapes about y (like the kit's `turn`) after expanding their mirrors. */
const spinY = (shapes: Shape[], deg: number) => turn(unmirror(shapes), deg);
/** Rotates a point about y like `turn` does. */
function turnV(v: V3, deg: number): V3 {
  const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t);
  return [co * v[0] + si * v[2], v[1], -si * v[0] + co * v[2]];
}
/** Rotates shapes about an axis through `p` (degrees), composing each shape's own rotation. */
function rot3(shapes: Shape[], axis: "x" | "y" | "z", deg: number, p: V3 = [0, 0, 0]): Shape[] {
  const ax = new THREE.Vector3(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0);
  const q = new THREE.Quaternion().setFromAxisAngle(ax, rad(deg));
  const G = new THREE.Matrix4().makeRotationFromQuaternion(q);
  const pt = (v: V3): V3 => {
    const w = new THREE.Vector3(v[0] - p[0], v[1] - p[1], v[2] - p[2]).applyQuaternion(q);
    return [w.x + p[0], w.y + p[1], w.z + p[2]];
  };
  return unmirror(shapes).map((sh) => {
    if (sh.t === "cap") return { ...sh, a: pt(sh.a), b: pt(sh.b) };
    const r = sh.rot ?? [0, 0, 0];
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rad(r[0]), rad(r[1]), rad(r[2])));
    m.premultiply(G);
    const e = new THREE.Euler().setFromRotationMatrix(m);
    const rot: V3 = [(e.x * 180) / Math.PI, (e.y * 180) / Math.PI, (e.z * 180) / Math.PI];
    return { ...sh, c: pt(sh.c), rot } as Shape;
  });
}
/** Rotates shapes about z through the origin by `deg`, then moves them to `o` (for held weapons). */
const hold = (shapes: Shape[], deg: number, o: V3) => place(rot3(shapes, "z", deg), 1, o);
const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

/** The Legión's ember insignia painted onto a surface facing +x at `c` (a three-tongued flame). */
function ember(c: V3, s = 1, col = "ember"): Shape[] {
  return [
    { t: "cap", a: [c[0], c[1] - 0.04 * s, c[2]], b: [c[0], c[1] + 0.05 * s, c[2]], r: [0.032 * s, 0.006 * s], col, paint: true },
    { t: "cap", a: [c[0], c[1] - 0.03 * s, c[2] + 0.02 * s], b: [c[0], c[1] + 0.025 * s, c[2] + 0.045 * s], r: [0.018 * s, 0.005 * s], col, paint: true },
    { t: "cap", a: [c[0], c[1] - 0.03 * s, c[2] - 0.02 * s], b: [c[0], c[1] + 0.025 * s, c[2] - 0.045 * s], r: [0.018 * s, 0.005 * s], col, paint: true },
  ];
}

// MARK: Legion kit

const LEG = {
  skin: SKIN, torso: "#3b3d44", legs: "#2c2d33", boots: "#1b1b1f", ash: "#8b8f97", ash2: "#b9bcc2", dark: "#222328",
  gun: "#2a2c31", metal: "#5d626b", ember: "#ff5a1f", hot: "#ffb340",
};
const EMBER_EYE = "#ff6a2a";

/** A Legion trooper: charcoal uniform, ash chest plate and pads, ember insignia, helmet and face mask. */
function legion(o: { torso?: V3; hips?: number; helmet?: boolean; mask?: boolean; pads?: boolean } = {}): Shape[] {
  const t = o.torso ?? [0.13, 0.16, 0.15];
  const out: Shape[] = [
    ...body({ torso: t, hips: o.hips }),
    { t: "box", c: [0.05, 0.43, 0], s: [t[0] - 0.02, 0.12, t[2]], round: 0.07, col: "ash", k: 0.03 },
    ...ember([t[0] + 0.03, 0.44, 0]),
    { t: "tor", c: [0, 0.28, 0], R: t[0] + 0.01, r: 0.022, col: "dark" },
    { t: "box", c: [t[0] + 0.02, 0.28, 0], s: [0.012, 0.025, 0.03], round: 0.01, col: "ember", k: 0 },
  ];
  if (o.pads !== false) out.push({ t: "ell", c: [-0.01, 0.56, t[2] + 0.02], r: [0.09, 0.07, 0.09], col: "ash", mirror: true, k: 0.02 });
  if (o.mask !== false) out.push({ t: "ell", c: [0.17, 0.6, 0], r: [0.08, 0.065, 0.17], col: "dark", paint: true });
  if (o.helmet !== false) out.push(
    { t: "ell", c: [-0.01, 0.8, 0], r: [0.205, 0.145, 0.205], col: "ash", k: 0.02 },
    { t: "box", c: [0.15, 0.79, 0], s: [0.05, 0.022, 0.16], round: 0.02, col: "ash", k: 0.02 },
    { t: "box", c: [0.0, 0.94, 0], s: [0.17, 0.02, 0.022], round: 0.012, col: "ember", paint: true },
  );
  return out;
}

/** A compact assault rifle along +x from the origin (stock at x = 0), ember sight. */
function rifle(len = 1): Shape[] {
  return [
    { t: "box", c: [0.06, -0.01, 0], s: [0.06, 0.035, 0.022], round: 0.015, col: "gun", k: 0.01 },
    { t: "box", c: [0.2, 0.01, 0], s: [0.1, 0.04, 0.03], round: 0.015, col: "metal", k: 0.01 },
    { t: "cap", a: [0.28, 0.02, 0], b: [0.28 + 0.2 * len, 0.02, 0], r: [0.018, 0.015], col: "gun", k: 0.01 },
    { t: "box", c: [0.21, -0.06, 0], s: [0.022, 0.045, 0.018], round: 0.01, rot: [0, 0, -12], col: "gun", k: 0.01 },
    { t: "box", c: [0.13, -0.045, 0], s: [0.016, 0.04, 0.016], round: 0.01, rot: [0, 0, 18], col: "gun", k: 0.01 },
    { t: "box", c: [0.2, 0.06, 0], s: [0.04, 0.012, 0.012], round: 0.008, col: "ember", k: 0.005 },
  ];
}

/** A long scoped marksman rifle along +x from the origin. */
function longRifle(len = 1): Shape[] {
  const L = 0.3 + 0.35 * len;
  return [
    { t: "box", c: [0.06, -0.015, 0], s: [0.07, 0.04, 0.022], round: 0.018, col: "gun", k: 0.01 },
    { t: "box", c: [0.22, 0.005, 0], s: [0.1, 0.035, 0.028], round: 0.015, col: "metal", k: 0.01 },
    { t: "cap", a: [0.3, 0.01, 0], b: [L, 0.01, 0], r: [0.016, 0.013], col: "gun", k: 0.01 },
    { t: "cap", a: [L, 0.01, 0], b: [L + 0.04, 0.01, 0], r: [0.022, 0.022], col: "metal", k: 0.01 },
    { t: "box", c: [0.15, -0.05, 0], s: [0.016, 0.04, 0.016], round: 0.01, rot: [0, 0, 18], col: "gun", k: 0.01 },
    // Scope with a glowing lens.
    { t: "cap", a: [0.14, 0.075, 0], b: [0.32, 0.075, 0], r: [0.026, 0.03], col: "dark", k: 0.01 },
    { t: "cap", a: [0.2, 0.03, 0], b: [0.2, 0.06, 0], r: [0.012, 0.012], col: "dark", k: 0.01 },
    { t: "ell", c: [0.325, 0.075, 0], r: [0.01, 0.024, 0.024], col: "ember", k: 0 },
  ];
}

/** A blank-masked Réplica fighter (the mask is a smooth pale oval, eyes behind it). */
function replica(suit: string, wrap: string): Shape[] {
  return [
    ...body({ torso: [0.12, 0.16, 0.14] }).map((s) => (s.col === "torso" ? { ...s, col: suit } : s.col === "legs" ? { ...s, col: suit } : s)),
    { t: "tor", c: [0, 0.3, 0], R: 0.125, r: 0.022, col: wrap },
    { t: "cap", a: [0.12, 0.3, 0.06], b: [0.17, 0.18, 0.1], r: [0.018, 0.012], col: wrap, k: 0.01 },
    { t: "cap", a: [0.12, 0.3, 0.03], b: [0.16, 0.19, 0.02], r: [0.018, 0.012], col: wrap, k: 0.01 },
    // Cloth hood over the back of the head, blank mask on the face.
    { t: "ell", c: [-0.04, 0.75, 0], r: [0.19, 0.19, 0.2], col: wrap, k: 0.02 },
    { t: "ell", c: [0.12, 0.69, 0], r: [0.12, 0.16, 0.15], col: "mask", k: 0.02 },
    { t: "tor", c: [-0.01, 0.82, 0], R: 0.18, r: 0.016, rot: [0, 0, -18], col: "ember", k: 0.01 },
  ];
}

// MARK: Object kit

const PROTO = {
  shell: "#4a4d55", plate: "#8b8f97", light: "#b9bcc2", dark: "#222328", metal: "#5d626b",
  ember: "#ff5a1f", hot: "#ffd27a", pulse: "#ff8a2a", cyan: "#5fe6ff", ice: "#e8fdff",
};

// MARK: Squads

/** A Réplica double turned by `deg`, scaled by `sc` and moved to `o`. */
function doubleMember(deg: number, sc: number, o: V3, punch: 1 | -1): { shapes: Shape[]; eyes: EyeSpec[] } {
  const sh: Shape[] = [
    ...replica("suit", "wrap"),
    ...arm(punch, [0.36, 0.52, 0.12 * punch], "suit", "wrap"),
    ...arm(-punch as 1 | -1, [0.2, 0.6, -0.04 * punch], "suit", "wrap"),
  ];
  const es: EyeSpec[] = eyes("#d8e0ea", true, 0.7).map((e) => ({ ...e, at: turnV(e.at, deg), look: turnV(e.look ?? [1, 0, 0], deg) }));
  return { shapes: place(spinY(sh, deg), sc, o), eyes: placeEyes(es, sc, o) };
}
const doubles = [doubleMember(0, 1, [0.2, 0, -0.14], 1), doubleMember(0, 1, [-0.2, 0, 0.14], 1)];

export const artCeniza2: Record<string, Sculpt> = {
  // MARK: Legión de Ceniza

  // Soldado de Asalto: standard Legion trooper, ash helmet and face mask, rifle held at the ready.
  "soldado-asalto": {
    palette: { ...LEG },
    glow: ["ember"],
    shapes: [
      ...legion(),
      ...place(rot3(rifle(1.2), "z", -6), 1.3, [-0.04, 0.44, 0.22]),
      ...arm(1, [0.14, 0.38, 0.24], "torso", "dark"),
      ...arm(-1, [0.4, 0.42, 0.18], "torso", "dark"),
    ],
    eyes: eyes(EMBER_EYE, true, 0.7),
  },

  // Comandante de Asalto: heavy-armoured commander with a crest and cape, fists up in a guard stance.
  "comandante-asalto": {
    palette: { ...LEG, cape: "#2c2d33" },
    glow: ["ember"],
    shapes: [
      { t: "box", c: [-0.17, 0.32, 0], s: [0.03, 0.25, 0.17], round: 0.03, rot: [0, 0, -10], col: "cape", k: 0.04 },
      { t: "box", c: [-0.2, 0.08, 0], s: [0.035, 0.02, 0.17], round: 0.015, rot: [0, 0, -10], col: "ember", paint: true },
      ...legion({ torso: [0.17, 0.17, 0.18], hips: 0.075 }),
      { t: "ell", c: [-0.01, 0.58, 0.21], r: [0.13, 0.09, 0.12], col: "ash", mirror: true, k: 0.02 },
      { t: "tor", c: [-0.01, 0.6, 0.21], R: 0.1, r: 0.012, rot: [0, 0, 10], col: "ember", mirror: true, paint: true },
      { t: "ell", c: [-0.04, 0.95, 0], r: [0.15, 0.07, 0.025], col: "ember", k: 0.03 },
      { t: "ell", c: [-0.02, 0.91, 0], r: [0.13, 0.04, 0.03], col: "ash", k: 0.03 },
      // Guard stance: both gauntlets raised before the face.
      ...arm(1, [0.24, 0.64, 0.14], "torso", "ash", 0.05),
      { t: "ell", c: [0.25, 0.64, 0.14], r: [0.07, 0.07, 0.07], col: "ash", k: 0.02 },
      { t: "box", c: [0.31, 0.66, 0.14], s: [0.012, 0.03, 0.05], round: 0.01, col: "ember", k: 0 },
      ...arm(-1, [0.27, 0.54, -0.04], "torso", "ash", 0.05),
      { t: "ell", c: [0.28, 0.54, -0.04], r: [0.07, 0.07, 0.07], col: "ash", k: 0.02 },
    ],
    eyes: eyes(EMBER_EYE, true, 0.71),
  },

  // Patrullero: Legion patrol trooper sweeping a flashlight beam ahead, baton in the other hand.
  patrullero: {
    palette: { ...LEG, beam: "#fff2b8", lamp: "#ffffff" },
    glow: ["ember", "beam", "lamp"],
    shapes: [
      ...legion(),
      { t: "box", c: [0.06, 0.56, 0.12], s: [0.03, 0.04, 0.03], round: 0.01, col: "dark", k: 0.01 },
      { t: "cap", a: [0.06, 0.6, 0.12], b: [0.04, 0.72, 0.12], r: [0.006, 0.005], col: "dark", k: 0 },
      ...arm(1, [0.22, 0.48, 0.24], "torso", "dark"),
      { t: "cap", a: [0.2, 0.47, 0.24], b: [0.34, 0.49, 0.24], r: [0.026, 0.036], col: "metal", k: 0.01 },
      { t: "ell", c: [0.35, 0.49, 0.24], r: [0.012, 0.032, 0.032], col: "lamp", k: 0 },
      { t: "cap", a: [0.37, 0.49, 0.24], b: [0.72, 0.43, 0.26], r: [0.03, 0.12], col: "beam", k: 0 },
      ...arm(-1, [0.12, 0.3, -0.22], "torso", "dark"),
      { t: "cap", a: [0.1, 0.34, -0.23], b: [0.28, 0.14, -0.25], r: [0.02, 0.02], col: "gun", k: 0.01 },
    ],
    eyes: eyes(EMBER_EYE, true, 0.7),
  },

  // Rastreador: Legion tracker with an antenna backpack sending signal rings, a glowing scanner in hand.
  "rastreador-legion": {
    palette: { ...LEG, screen: "#ffcf5a" },
    glow: ["ember", "screen"],
    shapes: [
      { t: "box", c: [-0.17, 0.44, 0], s: [0.07, 0.12, 0.11], round: 0.04, col: "metal", k: 0.03 },
      { t: "cap", a: [-0.2, 0.52, -0.06], b: [-0.24, 1.08, -0.06], r: [0.012, 0.008], col: "dark", k: 0.01 },
      dot([-0.24, 1.1, -0.06], 0.025, "ember"),
      { t: "tor", c: [-0.24, 1.0, -0.06], R: 0.06, r: 0.01, col: "ember", k: 0 },
      { t: "tor", c: [-0.24, 0.92, -0.06], R: 0.1, r: 0.009, col: "ember", k: 0 },
      ...legion(),
      // Headset mic and a single-lens tracker monocle.
      { t: "cap", a: [0.0, 0.7, 0.18], b: [0.16, 0.62, 0.14], r: [0.01, 0.01], col: "dark", k: 0 },
      // Scanner held up in front.
      ...arm(1, [0.24, 0.52, 0.22], "torso", "dark"),
      { t: "box", c: [0.28, 0.58, 0.22], s: [0.025, 0.08, 0.07], round: 0.02, rot: [0, 0, -15], col: "metal", k: 0.01 },
      { t: "box", c: [0.31, 0.6, 0.22], s: [0.01, 0.06, 0.055], round: 0.01, rot: [0, 0, -15], col: "screen", k: 0 },
      { t: "cap", a: [0.26, 0.66, 0.27], b: [0.24, 0.78, 0.29], r: [0.008, 0.006], col: "dark", k: 0 },
      dot([0.24, 0.79, 0.29], 0.016, "ember"),
      ...arm(-1, [0.2, 0.36, -0.22], "torso", "dark"),
    ],
    eyes: eyes(EMBER_EYE, true, 0.7),
  },

  // Armero: Legion armourer in goggles and apron, a big wrench on his shoulder, a crate of rifles beside him.
  "armero-legion": {
    palette: { ...LEG, apron: "#5a4a3c", hair: "#3a2e28", lens: "#ffb340", crate: "#4f5258", crateDk: "#34363c" },
    glow: ["ember", "lens"],
    shapes: [
      ...legion({ helmet: false, mask: false }),
      { t: "ell", c: [0.14, 0.33, 0], r: [0.05, 0.15, 0.12], col: "apron", paint: true },
      { t: "ell", c: [-0.03, 0.8, 0], r: [0.19, 0.12, 0.19], col: "hair", paint: true },
      { t: "tor", c: [0.02, 0.8, 0], R: 0.18, r: 0.018, rot: [0, 0, -12], col: "dark", k: 0.01 },
      { t: "tor", c: [0.14, 0.86, 0.07], R: 0.04, r: 0.016, rot: [0, 0, 70], col: "dark", mirror: true, k: 0 },
      { t: "ell", c: [0.15, 0.86, 0.07], r: [0.015, 0.03, 0.03], rot: [0, 0, -20], col: "lens", mirror: true, k: 0 },
      // Wrench over the near shoulder.
      ...arm(1, [0.1, 0.6, 0.28], "torso", "dark"),
      { t: "cap", a: [0.14, 0.52, 0.29], b: [-0.08, 0.92, 0.3], r: [0.024, 0.024], col: "ash2", k: 0.01 },
      { t: "tor", c: [-0.11, 0.98, 0.3], R: 0.055, r: 0.026, rot: [90, 0, 0], col: "ash2", k: 0.01 },
      { t: "box", c: [-0.14, 1.04, 0.3], s: [0.035, 0.05, 0.05], round: 0.01, rot: [0, 0, 30], col: "ash2", cut: true, k: 0.005 },
      // Crate of rifles at his side.
      { t: "cap", a: [0.3, 0.2, -0.16], b: [0.42, 0.56, -0.2], r: [0.018, 0.016], col: "gun", k: 0.01 },
      { t: "cap", a: [0.36, 0.2, -0.06], b: [0.5, 0.5, -0.04], r: [0.018, 0.016], col: "gun", k: 0.01 },
      { t: "box", c: [0.35, 0.44, -0.18], s: [0.02, 0.04, 0.015], round: 0.008, rot: [0, 0, 20], col: "ember", k: 0 },
      { t: "box", c: [0.34, 0.13, -0.12], s: [0.13, 0.13, 0.15], round: 0.015, col: "crate", k: 0 },
      { t: "box", c: [0.34, 0.13, -0.12], s: [0.135, 0.02, 0.155], round: 0.01, col: "crateDk", paint: true },
      ...ember([0.47, 0.13, -0.12], 1.3),
      ...arm(-1, [0.28, 0.32, -0.2], "torso", "dark"),
    ],
    eyes: eyes(EMBER_EYE, false, 0.7),
  },

  // Mercenario: hired blade in a worn brown jacket under Legion plate, ember bandana, knife in reverse grip.
  "mercenario-legion": {
    palette: { ...LEG, torso: "#5a4636", hair: "#2a2220", band: "#d8401c", blade: "#d8dee6", stubble: "#b98a6e", scar: "#a85a48" },
    glow: ["ember"],
    shapes: [
      ...legion({ helmet: false, mask: false, pads: false }),
      { t: "ell", c: [-0.03, 0.81, 0], r: [0.2, 0.13, 0.2], col: "hair", k: 0.03 },
      { t: "cap", a: [0.06, 0.92, 0.05], b: [0.15, 0.84, 0.12], r: [0.04, 0.015], col: "hair", k: 0.02 },
      { t: "tor", c: [0.02, 0.8, 0], R: 0.185, r: 0.025, rot: [0, 0, -10], col: "band", k: 0.01 },
      { t: "cap", a: [-0.18, 0.82, 0.0], b: [-0.32, 0.72, 0.06], r: [0.03, 0.012], col: "band", k: 0.02 },
      { t: "cap", a: [-0.18, 0.82, 0.0], b: [-0.3, 0.66, -0.04], r: [0.03, 0.012], col: "band", k: 0.02 },
      { t: "ell", c: [0.18, 0.6, 0], r: [0.07, 0.06, 0.15], col: "stubble", paint: true },
      { t: "cap", a: [0.1, 0.8, -0.1], b: [0.14, 0.64, -0.1], r: [0.009, 0.007], col: "scar", paint: true },
      { t: "ell", c: [0.0, 0.48, 0], r: [0.08, 0.04, 0.16], col: "band", paint: true },
      // Knife held low and forward, other fist back.
      ...arm(1, [0.24, 0.38, 0.24], "torso", "dark"),
      { t: "box", c: [0.27, 0.43, 0.245], s: [0.012, 0.04, 0.03], round: 0.006, rot: [0, 0, 22], col: "metal", k: 0.005 },
      { t: "ell", c: [0.37, 0.47, 0.245], r: [0.1, 0.034, 0.02], rot: [0, 0, 22], col: "blade", k: 0.005 },
      ...arm(-1, [0.16, 0.5, -0.24], "torso", "dark"),
    ],
    eyes: eyes(EMBER_EYE, true, 0.7),
  },

  // Tirador de Élite: marksman with a hooded cowl over his helmet, scoped rifle shouldered and aimed.
  "tirador-elite": {
    palette: { ...LEG, hood: "#4a4c52" },
    glow: ["ember"],
    shapes: [
      ...legion({ helmet: false }),
      { t: "ell", c: [-0.03, 0.77, 0], r: [0.21, 0.19, 0.21], col: "hood", k: 0.03 },
      { t: "ell", c: [0.2, 0.69, 0], r: [0.1, 0.11, 0.15], col: "hood", cut: true, k: 0.03 },
      { t: "ell", c: [0.08, 0.69, 0], r: [0.15, 0.14, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [-0.02, 0.56, 0], r: [0.12, 0.05, 0.2], col: "hood", k: 0.04 },
      { t: "box", c: [0.0, 0.94, 0], s: [0.12, 0.012, 0.02], round: 0.01, col: "ember", paint: true },
      ...hold(longRifle(1.1), 4, [-0.02, 0.56, 0.22]),
      ...arm(1, [0.14, 0.53, 0.24], "torso", "dark"),
      ...arm(-1, [0.4, 0.57, 0.18], "torso", "dark"),
    ],
    eyes: eyes(EMBER_EYE, true, 0.7),
  },

  // Francotirador: sniper down on one knee under a hooded cape, a very long rifle levelled ahead.
  francotirador: {
    palette: { ...LEG, cape: "#4a4c52" },
    glow: ["ember"],
    shapes: [
      // Cape behind.
      { t: "box", c: [-0.13, 0.36, 0], s: [0.03, 0.2, 0.14], round: 0.03, rot: [0, 0, -18], col: "cape", k: 0.04 },
      // Rear leg kneeling (knee on the ground, shin back), front leg bent.
      { t: "cap", a: [-0.02, 0.24, -0.08], b: [0.06, 0.05, -0.09], r: [0.065, 0.058], col: "legs" },
      { t: "cap", a: [0.06, 0.05, -0.09], b: [-0.2, 0.05, -0.09], r: [0.055, 0.05], col: "legs" },
      { t: "ell", c: [-0.24, 0.07, -0.09], r: [0.05, 0.07, 0.06], col: "boots", rot: [0, 0, -20] },
      { t: "cap", a: [-0.02, 0.24, 0.08], b: [0.2, 0.26, 0.09], r: [0.065, 0.06], col: "legs" },
      { t: "cap", a: [0.2, 0.26, 0.09], b: [0.2, 0.06, 0.09], r: [0.058, 0.055], col: "legs" },
      { t: "ell", c: [0.23, 0.05, 0.09], r: [0.085, 0.055, 0.065], col: "boots" },
      // Torso leaning forward, Legion plate.
      { t: "ell", c: [0.0, 0.38, 0], r: [0.13, 0.16, 0.15], rot: [0, 0, -12], col: "torso", k: 0.05 },
      { t: "box", c: [0.06, 0.4, 0], s: [0.1, 0.11, 0.14], round: 0.07, rot: [0, 0, -12], col: "ash", k: 0.03 },
      ...ember([0.16, 0.4, 0]),
      { t: "ell", c: [0.0, 0.53, 0.16], r: [0.085, 0.065, 0.085], col: "ash", mirror: true, k: 0.02 },
      // Hooded head.
      { t: "ell", c: [0.06, 0.66, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [0.02, 0.72, 0], r: [0.21, 0.19, 0.21], col: "cape", k: 0.03 },
      { t: "ell", c: [0.25, 0.64, 0], r: [0.1, 0.11, 0.15], col: "cape", cut: true, k: 0.03 },
      { t: "ell", c: [0.12, 0.64, 0], r: [0.15, 0.14, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.21, 0.56, 0], r: [0.08, 0.06, 0.16], col: "dark", paint: true },
      // Long rifle with a muzzle brake and a bipod.
      ...hold(longRifle(1.9), 0, [0.02, 0.48, 0.2]),
            ...arm(1, [0.16, 0.45, 0.24], "torso", "dark"),
      ...arm(-1, [0.4, 0.46, 0.17], "torso", "dark"),
    ],
    eyes: eyes(EMBER_EYE, true, 0.65, 0.06),
  },

  // Oficial: Legion officer in a long coat and peaked cap with an ember badge, map in hand, pointing ahead.
  "oficial-ceniza": {
    palette: { ...LEG, coat: "#34363d", cap: "#2a2b31", map: "#e8dcc0", ink: "#7a5a3a", gold: "#e0a83a" },
    glow: ["ember"],
    shapes: [
      ...legion({ helmet: false, mask: false, pads: false }),
      { t: "cap", a: [-0.02, 0.2, 0], b: [0, 0.48, 0], r: [0.17, 0.14], col: "coat", k: 0.04 },
      { t: "cap", a: [0.14, 0.48, 0.04], b: [0.16, 0.2, -0.04], r: [0.012, 0.012], col: "dark", paint: true },
      { t: "box", c: [0.05, 0.43, 0], s: [0.11, 0.12, 0.155], round: 0.07, col: "ash", k: 0.03 },
      ...ember([0.165, 0.45, 0]),
      { t: "box", c: [-0.01, 0.57, 0.17], s: [0.08, 0.02, 0.06], round: 0.02, col: "ash", mirror: true, k: 0.02 },
      { t: "cap", a: [0.06, 0.56, 0.22], b: [0.06, 0.53, 0.23], r: [0.01, 0.01], col: "ember", mirror: true, k: 0 },
      // Peaked cap: tall crown, band, glossy brim, ember badge.
      { t: "ell", c: [0.0, 0.88, 0], r: [0.21, 0.08, 0.21], col: "cap", k: 0.02 },
      { t: "cap", a: [0.0, 0.8, 0], b: [0.0, 0.84, 0], r: [0.19, 0.19], col: "ash", k: 0.02 },
      { t: "ell", c: [0.17, 0.81, 0], r: [0.09, 0.02, 0.14], rot: [0, 0, -12], col: "dark", k: 0.01 },
      ...ember([0.2, 0.89, 0], 1.1),
      // Map held out to the side, other hand pointing forward.
      ...arm(1, [0.12, 0.46, 0.3], "coat", "dark"),
      { t: "box", c: [0.16, 0.54, 0.33], s: [0.15, 0.1, 0.006], round: 0.004, rot: [0, 34, -8], col: "map", k: 0 },
      { t: "cap", a: [0.06, 0.5, 0.39], b: [0.2, 0.58, 0.29], r: [0.01, 0.01], col: "ink", paint: true },
      { t: "ell", c: [0.2, 0.58, 0.29], r: [0.025, 0.025, 0.025], col: "ember", paint: true },
      ...arm(-1, [0.32, 0.6, -0.08], "coat", "dark"),
      { t: "cap", a: [0.34, 0.61, -0.08], b: [0.41, 0.63, -0.08], r: [0.014, 0.011], col: "dark", k: 0.01 },
    ],
    eyes: eyes(EMBER_EYE, true, 0.69),
  },

  // Guardia del Mariscal: elite guard behind a tall tower shield bearing the ember insignia, spear upright.
  "guardia-mariscal": {
    palette: { ...LEG, shield: "#5d626b", rim: "#b9bcc2", spear: "#d8dee6" },
    glow: ["ember"],
    shapes: [
      ...arm(-1, [0.16, 0.42, -0.24], "torso", "dark"),
      { t: "cap", a: [0.16, 0.0, -0.26], b: [0.16, 1.12, -0.26], r: [0.016, 0.016], col: "gun", k: 0.01 },
      { t: "cap", a: [0.16, 1.1, -0.26], b: [0.16, 1.28, -0.26], r: [0.04, 0.004], col: "spear", k: 0.01 },
      { t: "cap", a: [0.16, 1.06, -0.26], b: [0.16, 1.1, -0.26], r: [0.025, 0.025], col: "ember", k: 0 },
      ...legion({ torso: [0.15, 0.17, 0.16], hips: 0.07 }),
      { t: "ell", c: [-0.06, 0.96, 0], r: [0.16, 0.08, 0.02], col: "ember", k: 0.03 },
      { t: "ell", c: [0.2, 0.7, 0], r: [0.04, 0.04, 0.15], col: "ash", k: 0.02 },
      // Tower shield on the near arm, angled toward the camera.
      ...arm(1, [0.24, 0.42, 0.14], "torso", "dark"),
      { t: "box", c: [0.32, 0.38, 0.12], s: [0.025, 0.36, 0.2], round: 0.03, rot: [0, -38, 0], col: "rim", k: 0 },
      { t: "box", c: [0.335, 0.38, 0.13], s: [0.04, 0.32, 0.165], round: 0.03, rot: [0, -38, 0], col: "shield", paint: true },
      ...rot3(ember([0, 0, 0], 3.2), "y", -38).map((s) => place([s], 1, [0.35, 0.42, 0.14])[0]),
    ],
    eyes: eyes(EMBER_EYE, true, 0.7),
  },

  // Verdugo de la Ceniza: hulking hooded executioner hefting a great axe with a glowing ember edge.
  "verdugo-ceniza": {
    palette: { ...LEG, hood: "#2a2b31", steel: "#9aa1ab", wood: "#3a2e28" },
    glow: ["ember", "hot"],
    shapes: [
      ...legion({ torso: [0.19, 0.18, 0.2], hips: 0.08, helmet: false, mask: false }),
      { t: "ell", c: [-0.03, 0.75, 0], r: [0.22, 0.22, 0.22], col: "hood", k: 0.04 },
      { t: "ell", c: [0.21, 0.7, 0], r: [0.1, 0.1, 0.14], col: "hood", cut: true, k: 0.03 },
      { t: "ell", c: [0.08, 0.69, 0], r: [0.16, 0.14, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.18, 0.61, 0], r: [0.08, 0.065, 0.17], col: "dark", paint: true },
      { t: "cap", a: [-0.08, 0.9, 0], b: [-0.2, 1.0, 0], r: [0.1, 0.03], col: "hood", k: 0.05 },
      { t: "ell", c: [-0.02, 0.55, 0], r: [0.17, 0.07, 0.27], col: "hood", k: 0.05 },
      // Great axe raised over the near shoulder, both hands on the haft.
      ...arm(1, [0.18, 0.4, 0.28], "torso", "ash", 0.055),
      ...arm(-1, [0.1, 0.58, 0.22], "torso", "ash", 0.055),
      { t: "cap", a: [0.24, 0.3, 0.28], b: [-0.12, 1.02, 0.28], r: [0.026, 0.026], col: "wood", k: 0.01 },
      { t: "box", c: [-0.03, 1.0, 0.29], s: [0.14, 0.12, 0.016], round: 0.02, rot: [0, 0, 28], col: "steel", k: 0.01 },
      { t: "ell", c: [0.07, 1.06, 0.29], r: [0.05, 0.16, 0.017], rot: [0, 0, 28], col: "steel", k: 0.02 },
      { t: "ell", c: [0.1, 1.06, 0.29], r: [0.03, 0.15, 0.03], rot: [0, 0, 28], col: "ember", paint: true },
      { t: "ell", c: [0.115, 1.06, 0.29], r: [0.015, 0.12, 0.03], rot: [0, 0, 28], col: "hot", paint: true },
      { t: "cap", a: [-0.13, 1.0, 0.28], b: [-0.2, 1.1, 0.28], r: [0.03, 0.006], col: "steel", k: 0.01 },
    ],
    eyes: eyes(EMBER_EYE, true, 0.7),
  },

  // Alumno de Réplica: martial-arts student in a plain training gi and a blank pale mask, mid-punch.
  "alumno-replica": {
    palette: { skin: SKIN, gi: "#ddd8cc", boots: "#cfc6b4", legs: "#ddd8cc", wrap: "#2c2d33", mask: "#eeece6", ember: "#ff5a1f", lapel: "#b8b2a4" },
    glow: ["ember"],
    shapes: [
      ...replica("gi", "wrap"),
      { t: "cap", a: [0.11, 0.54, 0.1], b: [0.14, 0.36, -0.02], r: [0.016, 0.016], col: "lapel", paint: true },
      { t: "cap", a: [0.11, 0.54, -0.1], b: [0.14, 0.4, 0.02], r: [0.016, 0.016], col: "lapel", paint: true },
      ...arm(1, [0.4, 0.52, 0.12], "gi", "skin"),
      { t: "tor", c: [0.3, 0.515, 0.13], R: 0.045, r: 0.012, rot: [0, 0, 90], col: "wrap", k: 0.01 },
      ...arm(-1, [0.06, 0.38, -0.24], "gi", "skin"),
    ],
    eyes: eyes("#c8d2de", true, 0.7),
  },

  // Doble de Réplica: two identical blank-masked copies side by side, striking in mirror image.
  "doble-replica": {
    palette: { skin: SKIN, suit: "#3b3d44", boots: "#1b1b1f", legs: "#3b3d44", wrap: "#8b8f97", mask: "#eeece6", ember: "#ff5a1f" },
    glow: ["ember"],
    shapes: doubles.flatMap((m) => m.shapes),
    eyes: doubles.flatMap((m) => m.eyes),
  },

  // Guardián de Celdas: stocky cell guard in a visored helmet, a big brass keyring held up, baton on his shoulder.
  "guardian-celdas": {
    palette: { ...LEG, brass: "#e0a83a", visor: "#3a4250" },
    glow: ["ember"],
    shapes: [
      ...legion({ torso: [0.16, 0.17, 0.17], hips: 0.07 }),
      { t: "box", c: [0.12, 0.92, 0], s: [0.05, 0.03, 0.17], round: 0.025, rot: [0, 0, 35], col: "visor", k: 0.02 },
      // Keyring held up on the near side.
      ...arm(1, [0.2, 0.56, 0.28], "torso", "dark"),
      { t: "tor", c: [0.24, 0.47, 0.3], R: 0.07, r: 0.012, rot: [90, 0, 0], col: "brass", k: 0 },
      ...[[-60, 0.1], [-95, 0.12], [-130, 0.1], [-25, 0.09]].flatMap(([a, l]): Shape[] => {
        const x0 = 0.24 + 0.07 * Math.cos(rad(a)), y0 = 0.47 + 0.07 * Math.sin(rad(a));
        const x1 = x0 + l * Math.cos(rad(a)), y1 = y0 + l * Math.sin(rad(a));
        return [
          { t: "cap", a: [x0, y0, 0.3], b: [x1, y1, 0.3], r: [0.01, 0.01], col: "brass", k: 0 },
          { t: "box", c: [x1, y1, 0.3], s: [0.018, 0.018, 0.006], round: 0.004, rot: [0, 0, a], col: "brass", k: 0 },
        ];
      }),
            // Baton resting on the far shoulder.
      ...arm(-1, [0.16, 0.6, -0.26], "torso", "dark"),
      { t: "cap", a: [0.2, 0.56, -0.27], b: [-0.12, 0.86, -0.26], r: [0.022, 0.022], col: "gun", k: 0.01 },
      { t: "box", c: [0.04, 0.32, 0.16], s: [0.03, 0.06, 0.03], round: 0.01, col: "dark", k: 0.01 },
    ],
    eyes: eyes(EMBER_EYE, true, 0.69),
  },

  // MARK: Experimental weapons

  // Rifle de Pulsos Prototipo: a chunky ash-and-charcoal rifle, glowing coils on the barrel, pulse rings at the muzzle.
  "rifle-pulsos": {
    palette: { ...PROTO },
    glow: ["pulse", "hot", "cyan"],
    shapes: rot3([
      { t: "box", c: [-0.42, -0.02, 0], s: [0.12, 0.07, 0.04], round: 0.035, col: "shell", k: 0.02 },
      { t: "box", c: [-0.42, -0.02, 0], s: [0.07, 0.03, 0.06], round: 0.02, col: "shell", cut: true, k: 0.01 },
      { t: "box", c: [-0.12, 0.02, 0], s: [0.2, 0.09, 0.07], round: 0.05, col: "plate", k: 0.03 },
      { t: "box", c: [-0.12, 0.02, 0], s: [0.16, 0.025, 0.08], round: 0.02, col: "shell", paint: true },
      { t: "box", c: [-0.18, -0.12, 0], s: [0.03, 0.08, 0.03], round: 0.02, rot: [0, 0, 18], col: "dark", k: 0.02 },
      // Energy cell under the body.
      { t: "cap", a: [-0.04, -0.06, 0], b: [-0.02, -0.2, 0], r: [0.045, 0.04], col: "dark", k: 0.02 },
      { t: "cap", a: [-0.03, -0.1, 0], b: [-0.02, -0.18, 0], r: [0.048, 0.043], col: "pulse", paint: true },
      // Barrel with three glowing coils and an emitter.
      { t: "cap", a: [0.08, 0.03, 0], b: [0.46, 0.03, 0], r: [0.045, 0.04], col: "shell", k: 0.02 },
      ...[0.16, 0.25, 0.34].map((x): Shape => ({ t: "tor", c: [x, 0.03, 0], R: 0.055, r: 0.018, rot: [0, 0, 90], col: "pulse", k: 0 })),
      { t: "ell", c: [0.48, 0.03, 0], r: [0.03, 0.05, 0.05], col: "plate", k: 0.01 },
      { t: "ell", c: [0.51, 0.03, 0], r: [0.02, 0.035, 0.035], col: "hot", k: 0 },
      // Top sight with a cyan lens.
      { t: "cap", a: [-0.14, 0.14, 0], b: [0.02, 0.14, 0], r: [0.025, 0.028], col: "dark", k: 0.01 },
      { t: "ell", c: [0.025, 0.14, 0], r: [0.008, 0.02, 0.02], col: "cyan", k: 0 },
      // Pulse rings leaving the muzzle.
      { t: "tor", c: [0.6, 0.03, 0], R: 0.06, r: 0.012, rot: [0, 0, 90], col: "pulse", k: 0 },
      { t: "tor", c: [0.7, 0.03, 0], R: 0.09, r: 0.011, rot: [0, 0, 90], col: "pulse", k: 0 },
      { t: "tor", c: [0.81, 0.03, 0], R: 0.12, r: 0.01, rot: [0, 0, 90], col: "hot", k: 0 },
    ], "z", 14),
    eyes: [],
  },

  // Guanteletes Sísmicos: two heavy gauntlets punched into the ground, ember shockwave rings and cracks spreading.
  "guanteletes-sismicos": {
    palette: { ...PROTO, rock: "#6a625a", crack: "#ff7a2a" },
    glow: ["ember", "crack", "hot"],
    shapes: [
      { t: "ell", c: [0, 0.0, 0], r: [0.6, 0.04, 0.6], col: "rock", k: 0 },
      ...[0, 50, 110, 170, 230, 290].flatMap((a, i): Shape[] => {
        const l = 0.4 + (i % 2) * 0.12;
        return [{ t: "cap", a: [0, 0.04, 0], b: [Math.cos(rad(a)) * l, 0.04, Math.sin(rad(a)) * l], r: [0.03, 0.008], col: "crack", paint: true }];
      }),
      { t: "tor", c: [0, 0.05, 0], R: 0.42, r: 0.014, col: "ember", k: 0 },
      { t: "tor", c: [0, 0.07, 0], R: 0.55, r: 0.012, col: "hot", k: 0 },
      ...[1, -1].flatMap((s): Shape[] => rot3([
        // Forearm cuff flaring out, pistons, ember vents.
        { t: "cap", a: [0, 0.34, 0.2 * s], b: [-0.05, 0.7, 0.23 * s], r: [0.11, 0.14], col: "plate", k: 0.03 },
        { t: "tor", c: [-0.05, 0.7, 0.23 * s], R: 0.13, r: 0.03, col: "shell", k: 0.01 },
        { t: "tor", c: [-0.01, 0.42, 0.205 * s], R: 0.115, r: 0.025, col: "shell", k: 0.01 },
        { t: "box", c: [0.1, 0.56, 0.21 * s], s: [0.03, 0.09, 0.06], round: 0.02, col: "dark", k: 0.01 },
        { t: "box", c: [0.125, 0.56, 0.21 * s], s: [0.015, 0.07, 0.035], round: 0.01, col: "ember", k: 0 },
        { t: "cap", a: [-0.12, 0.36, 0.3 * s], b: [-0.15, 0.68, 0.33 * s], r: [0.025, 0.025], col: "metal", k: 0.01 },
        // Big armoured fist with four knuckle plates, glowing seams.
        { t: "box", c: [0.04, 0.2, 0.2 * s], s: [0.17, 0.14, 0.16], round: 0.08, col: "shell", k: 0.04 },
        ...[-0.105, -0.035, 0.035, 0.105].map((z): Shape => ({ t: "box", c: [0.19, 0.22, 0.2 * s + z], s: [0.04, 0.05, 0.03], round: 0.02, col: "plate", k: 0.01 })),
        { t: "box", c: [0.2, 0.15, 0.2 * s], s: [0.03, 0.012, 0.13], round: 0.008, col: "ember", paint: true },
        ...[-0.105, -0.035, 0.035, 0.105].map((z): Shape => ({ t: "ell", c: [0.23, 0.22, 0.2 * s + z], r: [0.02, 0.03, 0.022], col: "hot", paint: true })),
      ], "z", 22, [0.04, 0.2, 0])),
      ...[[0.4, 0.22, 0.25], [-0.35, 0.3, -0.2], [0.3, 0.4, -0.35], [-0.25, 0.18, 0.4]].map(([x, y, z], i): Shape => (
        { t: "box", c: [x, y, z], s: [0.04, 0.035, 0.04], round: 0.01, rot: [20 * i, 30 * i, 15], col: "rock", k: 0 })),
    ],
    eyes: [],
  },

  // Exoarmadura de Asalto: an empty, bulky assault exo-suit standing on a charging stand, ember visor and core lit.
  "exoarmadura-asalto": {
    palette: { ...PROTO },
    glow: ["ember", "hot"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.34, 0.035, 0.34], col: "dark", k: 0.01 },
      { t: "tor", c: [0, 0.055, 0], R: 0.3, r: 0.012, col: "ember", k: 0 },
      { t: "cap", a: [-0.22, 0.05, 0], b: [-0.22, 0.5, 0], r: [0.035, 0.035], col: "metal", k: 0.01 },
      { t: "cap", a: [-0.22, 0.5, 0], b: [-0.12, 0.55, 0], r: [0.035, 0.035], col: "metal", k: 0.02 },
      // Legs.
      { t: "box", c: [0.05, 0.11, 0.1], s: [0.11, 0.05, 0.07], round: 0.04, col: "shell", mirror: true, k: 0.02 },
      { t: "cap", a: [0, 0.14, 0.1], b: [0, 0.42, 0.1], r: [0.075, 0.085], col: "plate", mirror: true, k: 0.03 },
      { t: "ell", c: [0.05, 0.28, 0.1], r: [0.05, 0.05, 0.06], col: "shell", mirror: true, k: 0.02 },
      // Torso shell and chest core.
      { t: "box", c: [0, 0.6, 0], s: [0.16, 0.17, 0.19], round: 0.1, col: "plate", k: 0.04 },
      { t: "box", c: [0.0, 0.46, 0], s: [0.12, 0.05, 0.14], round: 0.04, col: "shell", k: 0.02 },
      { t: "tor", c: [0.16, 0.6, 0], R: 0.07, r: 0.02, rot: [0, 0, 90], col: "shell", k: 0.01 },
      { t: "ell", c: [0.16, 0.6, 0], r: [0.03, 0.055, 0.055], col: "hot", k: 0 },
      ...ember([0.17, 0.72, 0.1], 0.8),
      { t: "ell", c: [-0.02, 0.76, 0.21], r: [0.13, 0.09, 0.12], col: "shell", mirror: true, k: 0.02 },
      { t: "box", c: [-0.02, 0.8, 0.27], s: [0.06, 0.012, 0.04], round: 0.008, col: "ember", mirror: true, paint: true },
      // Heavy arms hanging, big fists.
      { t: "cap", a: [-0.02, 0.7, 0.26], b: [0.03, 0.42, 0.3], r: [0.07, 0.08], col: "plate", mirror: true, k: 0.02 },
      { t: "tor", c: [0.02, 0.48, 0.3], R: 0.07, r: 0.02, rot: [0, 0, -10], col: "shell", mirror: true, k: 0.01 },
      { t: "ell", c: [0.04, 0.34, 0.3], r: [0.07, 0.07, 0.065], col: "shell", mirror: true, k: 0.02 },
      // Empty helmet with a glowing visor slit.
      { t: "ell", c: [0.0, 0.9, 0], r: [0.14, 0.13, 0.14], col: "plate", k: 0.04 },
      { t: "box", c: [0.12, 0.92, 0], s: [0.035, 0.022, 0.1], round: 0.015, col: "ember", k: 0.005 },
      { t: "ell", c: [0.1, 0.83, 0], r: [0.06, 0.04, 0.09], col: "shell", k: 0.02 },
      { t: "cap", a: [-0.04, 1.0, 0], b: [-0.12, 0.96, 0], r: [0.025, 0.012], col: "shell", k: 0.02 },
    ],
    eyes: [],
  },

  // Cañón Láser Pesado: heavy laser cannon on a tripod, cooling fins, a power cell and a charging ember lens.
  "canon-laser": {
    palette: { ...PROTO },
    glow: ["ember", "hot", "pulse"],
    shapes: [
      // Tripod.
      ...[0, 120, 240].map((a): Shape => ({ t: "cap", a: [0, 0.36, 0], b: [Math.cos(rad(a)) * 0.32, 0.0, Math.sin(rad(a)) * 0.32], r: [0.025, 0.018], col: "dark", k: 0.02 })),
      { t: "cap", a: [0, 0.32, 0], b: [0, 0.44, 0], r: [0.06, 0.05], col: "metal", k: 0.02 },
      ...rot3([
        { t: "cap", a: [-0.38, 0.0, 0], b: [0.42, 0.0, 0], r: [0.13, 0.11], col: "plate", k: 0.03 },
        ...[-0.08, 0.0, 0.08, 0.16, 0.24].map((x): Shape => ({ t: "tor", c: [x, 0, 0], R: 0.13, r: 0.022, rot: [0, 0, 90], col: "shell", k: 0.005 })),
        { t: "cap", a: [0.42, 0, 0], b: [0.56, 0, 0], r: [0.08, 0.09], col: "shell", k: 0.02 },
        { t: "tor", c: [0.56, 0, 0], R: 0.08, r: 0.02, rot: [0, 0, 90], col: "pulse", k: 0 },
        { t: "ell", c: [0.565, 0, 0], r: [0.02, 0.065, 0.065], col: "hot", k: 0 },
        dot([0.68, 0, 0], 0.045, "hot"),
        ...burst([0.68, 0, 0], 8, 0, 0.1, [0.016, 0.003], "pulse", undefined, 0),
        // Power cell on the back with ember windows, handle on top.
        { t: "box", c: [-0.34, 0.06, 0], s: [0.1, 0.13, 0.15], round: 0.04, col: "shell", k: 0.03 },
        { t: "box", c: [-0.34, 0.06, 0.15], s: [0.07, 0.08, 0.01], round: 0.01, col: "ember", paint: true },
        { t: "box", c: [-0.34, 0.06, -0.15], s: [0.07, 0.08, 0.01], round: 0.01, col: "ember", paint: true },
        { t: "cap", a: [-0.16, 0.13, 0], b: [-0.12, 0.2, 0], r: [0.02, 0.02], col: "dark", k: 0.01 },
        { t: "cap", a: [-0.12, 0.2, 0], b: [0.08, 0.2, 0], r: [0.02, 0.02], col: "dark", k: 0.01 },
        { t: "cap", a: [0.08, 0.2, 0], b: [0.1, 0.12, 0], r: [0.02, 0.02], col: "dark", k: 0.01 },
        ...ember([0.36, 0.0, 0.12], 0.9).map((s) => ({ ...s })),
      ], "z", 16).map((s) => place([s], 1, [0, 0.52, 0])[0]),
    ],
    eyes: [],
  },

  // Cuchillas de Plasma: two crossed short blades of glowing plasma on ash hilts.
  "cuchillas-plasma": {
    palette: { ...PROTO, plasma: "#ff6a2a", core: "#fff0c8", wrap: "#2a2c31" },
    glow: ["plasma", "core", "ember"],
    shapes: [1, -1].flatMap((s): Shape[] => rot3([
      { t: "cap", a: [0, -0.42, 0], b: [0, -0.18, 0], r: [0.035, 0.035], col: "wrap", k: 0.01 },
      ...[-0.38, -0.32, -0.26, -0.2].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.036, r: 0.008, col: "ember", k: 0 })),
      dot([0, -0.44, 0], 0.05, "plate"),
      { t: "box", c: [0, -0.15, 0], s: [0.09, 0.03, 0.05], round: 0.02, col: "plate", k: 0.01 },
      { t: "box", c: [0, -0.13, 0], s: [0.06, 0.02, 0.055], round: 0.01, col: "shell", k: 0.005 },
      { t: "ell", c: [0, 0.14, 0], r: [0.065, 0.3, 0.022], col: "plasma", k: 0.01 },
      { t: "ell", c: [0, 0.12, 0], r: [0.03, 0.24, 0.05], col: "core", paint: true },
    ], "z", 32 * s).map((sh) => place([sh], 1, [0, 0.5, 0.05 * s])[0])),
    eyes: [],
  },

  // Prototipo Robado: a forced-open Legion crate, a glowing prototype weapon inside and a paper tag on a string.
  "prototipo-robado": {
    palette: { ...PROTO, crate: "#4f5258", crateDk: "#34363c", tag: "#efe4c8", string: "#b89a6a", mark: "#c8321e" },
    glow: ["ember", "pulse", "hot"],
    shapes: [
      // Crate with an open top.
      { t: "box", c: [0, 0.18, 0], s: [0.3, 0.18, 0.2], round: 0.02, col: "crate", k: 0 },
      { t: "box", c: [0, 0.24, 0], s: [0.27, 0.16, 0.17], round: 0.01, col: "crate", cut: true, k: 0.005 },
      { t: "box", c: [0, 0.18, 0], s: [0.305, 0.025, 0.205], round: 0.01, col: "crateDk", paint: true },
      ...ember([0.31, 0.2, 0], 1.6),
      { t: "box", c: [0, 0.32, 0], s: [0.26, 0.04, 0.16], round: 0.01, col: "pulse", paint: true },
      // Prototype weapon lifting out of the crate.
      ...rot3([
        { t: "box", c: [0, 0, 0], s: [0.16, 0.05, 0.045], round: 0.03, col: "plate", k: 0.02 },
        { t: "cap", a: [0.12, 0.01, 0], b: [0.36, 0.01, 0], r: [0.03, 0.026], col: "shell", k: 0.01 },
        ...[0.18, 0.25].map((x): Shape => ({ t: "tor", c: [x, 0.01, 0], R: 0.04, r: 0.012, rot: [0, 0, 90], col: "pulse", k: 0 })),
        dot([0.37, 0.01, 0], 0.025, "hot"),
        { t: "box", c: [-0.18, -0.01, 0], s: [0.06, 0.035, 0.03], round: 0.02, col: "shell", k: 0.01 },
      ], "z", 28).map((s) => place([s], 1, [-0.02, 0.38, 0.02])[0]),
      // Lid leaning against the back.
      { t: "box", c: [-0.36, 0.26, 0], s: [0.02, 0.24, 0.2], round: 0.015, rot: [0, 0, -14], col: "crate", k: 0 },
      // Tag tied to the front corner.
      { t: "cap", a: [0.29, 0.35, 0.19], b: [0.42, 0.27, 0.31], r: [0.006, 0.006], col: "string", k: 0 },
      { t: "box", c: [0.44, 0.18, 0.32], s: [0.07, 0.1, 0.006], round: 0.01, rot: [0, 34, -10], col: "tag", k: 0 },
      { t: "box", c: [0.445, 0.17, 0.325], s: [0.045, 0.01, 0.02], round: 0.003, rot: [0, 34, 35], col: "mark", paint: true },
      { t: "box", c: [0.445, 0.17, 0.325], s: [0.045, 0.01, 0.02], round: 0.003, rot: [0, 34, -55], col: "mark", paint: true },
    ],
    eyes: [],
  },

  // Munición Especial: oversized armour-piercing rounds with dark penetrator tips and glowing ember bands.
  "municion-especial": {
    palette: { ...PROTO, brass: "#d9a03a", brassDk: "#a8742a", tip: "#2e3036" },
    glow: ["ember", "hot"],
    shapes: [
      ...[[0, 0, 1.0], [-0.17, -0.1, 0.85], [0.15, 0.12, 0.8]].flatMap(([x, z, s]): Shape[] => [
        { t: "cap", a: [x, 0.0, z], b: [x, 0.03 * s, z], r: [0.085 * s, 0.085 * s], col: "brassDk", k: 0.01 },
        { t: "cap", a: [x, 0.03 * s, z], b: [x, 0.42 * s, z], r: [0.075 * s, 0.075 * s], col: "brass", k: 0.01 },
        { t: "cap", a: [x, 0.42 * s, z], b: [x, 0.5 * s, z], r: [0.068 * s, 0.068 * s], col: "ember", k: 0.005 },
        { t: "cap", a: [x, 0.5 * s, z], b: [x, 0.78 * s, z], r: [0.066 * s, 0.005], col: "tip", k: 0.02 },
        { t: "cap", a: [x, 0.66 * s, z], b: [x, 0.79 * s, z], r: [0.03 * s, 0.003], col: "hot", paint: true },
      ]),
      // One round lying in front.
      ...rot3([
        { t: "cap", a: [0, 0, 0], b: [0, 0.03, 0], r: [0.07, 0.07], col: "brassDk", k: 0.01 },
        { t: "cap", a: [0, 0.03, 0], b: [0, 0.32, 0], r: [0.062, 0.062], col: "brass", k: 0.01 },
        { t: "cap", a: [0, 0.32, 0], b: [0, 0.38, 0], r: [0.056, 0.056], col: "ember", k: 0.005 },
        { t: "cap", a: [0, 0.38, 0], b: [0, 0.6, 0], r: [0.054, 0.004], col: "tip", k: 0.02 },
      ], "z", -90).map((s) => place([s], 1, [0.06, 0.065, 0.3])[0]),
    ],
    eyes: [],
  },
};
