import type { EyeSpec, Shape, Sculpt, V3 } from "../sculpt";

/**
 * Expansion: Armadura Celeste (clockwork inventor hero, sky blue + brass + teal ether glow) and
 * Kragor, el Coloso Embestidor (boar-ogre warlord, brown / bronze / rust with orange accents),
 * plus the expert set (deep red).
 */

const SKIN = "#f4c9a4";
const rad = (d: number) => (d * Math.PI) / 180;

// Celeste colours.
const CEL = { plate: "#5fb4ec", dk: "#2f6fb4", brass: "#e0b04a", core: "#5ff2e0", hot: "#e6fffc", visor: "#1d3550" };

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

/** An armoured boot hovering on a glowing ether jet, at (dx, dy, z). */
function boot(dx: number, dy: number, z: number): Shape[] {
  return [
    { t: "cap", a: [dx, dy + 0.3, z], b: [dx, dy + 0.6, z], r: [0.085, 0.095], col: "plate", k: 0.03 },
    { t: "tor", c: [dx, dy + 0.62, z], R: 0.092, r: 0.028, col: "brass", k: 0.01 },
    { t: "ell", c: [dx + 0.02, dy + 0.25, z], r: [0.1, 0.08, 0.09], col: "plate", k: 0.04 },
    { t: "ell", c: [dx + 0.11, dy + 0.2, z], r: [0.14, 0.065, 0.09], col: "plate", k: 0.05 },
    { t: "ell", c: [dx + 0.21, dy + 0.2, z], r: [0.05, 0.06, 0.08], col: "brass", k: 0.02 },
    { t: "box", c: [dx + 0.09, dy + 0.45, z], s: [0.02, 0.12, 0.035], round: 0.01, col: "brass", paint: true },
    { t: "cap", a: [dx - 0.06, dy + 0.48, z], b: [dx - 0.17, dy + 0.62, z], r: [0.035, 0.008], col: "brass", k: 0.02 },
    { t: "cap", a: [dx + 0.04, dy + 0.16, z], b: [dx + 0.04, dy + 0.11, z], r: [0.065, 0.07], col: "dk", k: 0.01 },
    { t: "cap", a: [dx + 0.04, dy + 0.1, z], b: [dx + 0.0, dy - 0.13, z], r: [0.065, 0.01], col: "core", k: 0.03 },
    { t: "ell", c: [dx + 0.035, dy + 0.06, z], r: [0.04, 0.05, 0.04], col: "hot", paint: true },
  ];
}

/** A small repulsor bolt flying along +x (tilted `ang` degrees up), head at c. */
function bolt(c: V3, len: number, size: number, ang = 15): Shape[] {
  const d: V3 = [Math.cos(rad(ang)), Math.sin(rad(ang)), 0];
  const back = (t: number): V3 => [c[0] - d[0] * t, c[1] - d[1] * t, c[2]];
  return [
    { t: "cap", a: c, b: back(len), r: [size * 0.75, 0.008], col: "core", k: 0.03 },
    { t: "ell", c, r: [size * 1.8, size * 0.85, size * 0.85], rot: [0, 0, ang], col: "core", k: 0.03 },
    { t: "ell", c: [c[0] + 0.02, c[1], c[2] + 0.03], r: [size * 1.3, size * 0.6, size * 0.6], rot: [0, 0, ang], col: "hot", paint: true },
    { t: "tor", c: back(len * 0.35), R: size * 1.1, r: 0.017, rot: [0, 0, ang - 90], col: "core", k: 0 },
  ];
}

/** A sculpted cuirass on a wooden stand (front +x): chest, pecs, waist, belt and neck collar. */
function cuirass(main: string, trim: string): Shape[] {
  return [
    { t: "ell", c: [0, 0.04, 0], r: [0.22, 0.045, 0.22], col: "wood" },
    { t: "cap", a: [0, 0.04, 0], b: [0, 0.26, 0], r: [0.04, 0.04], col: "wood" },
    { t: "cap", a: [0, 0.28, 0], b: [0, 0.46, 0], r: [0.15, 0.17], col: main, k: 0.04 },
    { t: "ell", c: [0, 0.58, 0], r: [0.17, 0.22, 0.27], col: main, k: 0.06 },
    { t: "ell", c: [0.07, 0.6, 0.1], r: [0.12, 0.12, 0.13], col: main, mirror: true, k: 0.05 },
    { t: "tor", c: [0, 0.3, 0], R: 0.155, r: 0.03, col: trim, k: 0.02 },
    { t: "tor", c: [0, 0.78, 0], R: 0.1, r: 0.035, col: trim, k: 0.02 },
    { t: "ell", c: [0, 0.81, 0], r: [0.08, 0.06, 0.08], col: main, cut: true, k: 0.02 },
  ];
}

export const expansion: Record<string, Sculpt> = {
  // Armadura Celeste: clockwork knight in sky-blue and brass plates, round visor helm, teal ether
  // core on the chest, near gauntlet thrust forward firing a repulsor blast.
  "hero-celeste": {
    palette: {
      skin: CEL.plate, torso: CEL.plate, legs: CEL.dk, boots: CEL.brass, plate: CEL.plate, dk: CEL.dk,
      brass: CEL.brass, core: CEL.core, hot: CEL.hot, visor: "#9fe6f2",
    },
    glow: ["core", "hot"],
    shapes: [
      { t: "tor", c: [-0.14, 0.44, 0], R: 0.075, r: 0.028, rot: [0, 0, 90], col: "brass", k: 0.02 },
      { t: "ell", c: [-0.13, 0.44, 0], r: [0.04, 0.05, 0.05], col: "core", k: 0.01 },
      ...body({ torso: [0.15, 0.16, 0.16] }),
      { t: "ell", c: [0.05, 0.17, 0.075], r: [0.045, 0.045, 0.045], col: "brass", mirror: true, k: 0.02 },
      { t: "tor", c: [0, 0.28, 0], R: 0.14, r: 0.026, col: "brass" },
      { t: "box", c: [0.07, 0.43, 0], s: [0.09, 0.1, 0.13], round: 0.07, col: "plate", k: 0.03 },
      { t: "tor", c: [0.16, 0.44, 0], R: 0.052, r: 0.02, rot: [0, 0, 90], col: "brass", k: 0.01 },
      { t: "ell", c: [0.165, 0.44, 0], r: [0.035, 0.045, 0.045], col: "core", k: 0.01 },
      { t: "ell", c: [0.2, 0.445, 0.01], r: [0.02, 0.025, 0.025], col: "hot", paint: true },
      { t: "ell", c: [0, 0.54, 0.16], r: [0.095, 0.065, 0.085], col: "brass", mirror: true, k: 0.02 },
      // Round helm with a brass crest fin, ear discs and a round dark visor window.
      { t: "box", c: [-0.02, 0.89, 0], s: [0.14, 0.04, 0.018], round: 0.015, rot: [0, 0, -8], col: "brass", k: 0.03 },
      { t: "cap", a: [0.02, 0.71, 0.16], b: [0.02, 0.71, 0.21], r: [0.05, 0.05], col: "brass", mirror: true, k: 0.01 },
      { t: "ell", c: [0.2, 0.71, 0], r: [0.06, 0.1, 0.14], col: "visor", paint: true },
      { t: "tor", c: [0.165, 0.71, 0], R: 0.13, r: 0.02, rot: [0, 0, 90], col: "brass", k: 0 },
      // Near gauntlet thrust forward, glowing palm and repulsor blast.
      ...arm(1, [0.28, 0.54, 0.22], "plate", "brass", 0.05),
      { t: "tor", c: [0.2, 0.53, 0.2], R: 0.05, r: 0.02, rot: [0, 0, 80], col: "brass", k: 0.01 },
      { t: "ell", c: [0.33, 0.545, 0.225], r: [0.025, 0.055, 0.055], col: "core", k: 0 },
      { t: "cap", a: [0.35, 0.55, 0.23], b: [0.45, 0.57, 0.25], r: [0.05, 0.075], col: "core", k: 0.02 },
      { t: "ell", c: [0.47, 0.57, 0.25], r: [0.05, 0.075, 0.075], col: "hot", k: 0.03 },
      ...[0, 72, 144, 216, 288].map((a): Shape => ({ t: "cap", a: [0.48, 0.57, 0.25], b: [0.52, 0.57 + 0.13 * Math.cos(rad(a)), 0.25 + 0.13 * Math.sin(rad(a))], r: [0.03, 0.006], col: "core", k: 0.02 })),
      // Far arm: clenched brass fist.
      ...arm(-1, [0.12, 0.32, -0.22], "plate", "brass", 0.05),
    ],
    eyes: eyes("#5ff2e0", false, 0.71, 0.02, 0.052),
  },

  // Teodor Valcourt: court inventor, goggles on the forehead, blue waistcoat, rolled sleeves,
  // a wrench raised and a little glowing clockwork gadget.
  "identity-celeste": {
    palette: {
      skin: SKIN, hair: "#7a4a2a", torso: "#f2ead8", legs: "#4a5a7a", boots: "#5a3e2a", vest: "#3a8ad0",
      brass: "#e0b04a", lens: "#7ff7ee", metal: "#9aa3b0", tie: "#c0603a", strap: "#6a4a30",
    },
    glow: ["lens"],
    shapes: [
      ...body(),
      { t: "box", c: [0.06, 0.4, 0], s: [0.08, 0.13, 0.15], round: 0.07, col: "vest", k: 0.03 },
      { t: "box", c: [0.135, 0.38, 0], s: [0.015, 0.1, 0.012], round: 0.005, col: "brass", paint: true },
      { t: "ell", c: [0.13, 0.53, 0], r: [0.035, 0.025, 0.055], col: "tie", k: 0.02 },
      { t: "ell", c: [-0.04, 0.78, 0], r: [0.19, 0.15, 0.2], col: "hair" },
      { t: "cap", a: [0.1, 0.87, 0.02], b: [0.2, 0.84, 0.1], r: [0.05, 0.015], col: "hair" },
      { t: "cap", a: [-0.14, 0.82, 0], b: [-0.24, 0.9, 0.04], r: [0.06, 0.015], col: "hair" },
      // Goggles pushed up on the forehead.
      { t: "tor", c: [0, 0.83, 0], R: 0.195, r: 0.02, rot: [0, 0, 10], col: "strap", k: 0.01 },
      { t: "cap", a: [0.13, 0.87, 0.075], b: [0.19, 0.89, 0.075], r: [0.05, 0.05], col: "brass", mirror: true, k: 0.01 },
      { t: "ell", c: [0.24, 0.895, 0.075], r: [0.02, 0.036, 0.036], col: "lens", paint: true, mirror: true },
      // Near arm: rolled sleeve, wrench raised.
      { t: "cap", a: [0, 0.5, 0.15], b: [0.05, 0.5, 0.19], r: [0.06, 0.055], col: "torso", k: 0.02 },
      ...arm(1, [0.12, 0.46, 0.3], "skin", "skin"),
      { t: "cap", a: [0.12, 0.4, 0.3], b: [0.13, 0.68, 0.34], r: [0.022, 0.022], col: "metal", k: 0.01 },
      { t: "tor", c: [0.133, 0.73, 0.345], R: 0.045, r: 0.022, rot: [90, 0, 0], col: "metal", k: 0.01 },
      { t: "box", c: [0.133, 0.78, 0.345], s: [0.022, 0.035, 0.06], round: 0.005, col: "metal", cut: true, k: 0 },
      // Far arm: clockwork gadget with a glowing window and a wind-up key.
      { t: "cap", a: [0, 0.5, -0.15], b: [0.05, 0.48, -0.19], r: [0.06, 0.055], col: "torso", k: 0.02 },
      ...arm(-1, [0.22, 0.38, -0.2], "skin", "skin"),
      { t: "ell", c: [0.28, 0.44, -0.18], r: [0.065, 0.065, 0.065], col: "brass", k: 0.02 },
      { t: "ell", c: [0.33, 0.45, -0.14], r: [0.035, 0.035, 0.035], col: "lens", paint: true },
      { t: "cap", a: [0.27, 0.5, -0.18], b: [0.26, 0.56, -0.18], r: [0.014, 0.014], col: "metal", k: 0.005 },
      { t: "tor", c: [0.26, 0.59, -0.18], R: 0.028, r: 0.013, rot: [90, 0, 0], col: "metal", k: 0.005 },
    ],
    eyes: eyes("#3a7ac0"),
  },

  // Kragor, el Coloso Embestidor: huge hunched boar-ogre warlord charging forward, tusks, nose
  // ring, orange bristle crest and spiked bronze shoulder plates.
  "villain-estampida": {
    palette: {
      hide: "#8a5a3a", belly: "#c49572", bronze: "#c8873a", rust: "#a8462a", dark: "#4a2e22", tusk: "#f4ead2",
      bristle: "#e0702a", ring: "#f0bf4a", snout: "#d8977c", mouth: "#2a1210", dust: "#dcc8a2",
    },
    shapes: [
      // Legs mid-stride: near leg forward, far leg back.
      { t: "cap", a: [0.12, 0.08, 0.14], b: [0.03, 0.32, 0.13], r: [0.08, 0.1], col: "dark" },
      { t: "ell", c: [0.15, 0.05, 0.14], r: [0.11, 0.05, 0.08], col: "dark" },
      { t: "cap", a: [-0.2, 0.08, -0.13], b: [-0.05, 0.32, -0.12], r: [0.08, 0.1], col: "dark" },
      { t: "ell", c: [-0.18, 0.05, -0.13], r: [0.11, 0.05, 0.08], col: "dark" },
      // Big leaning body.
      { t: "ell", c: [0.02, 0.47, 0], r: [0.26, 0.24, 0.26], rot: [0, 0, -18], col: "hide", k: 0.06 },
      { t: "ell", c: [0.21, 0.42, 0], r: [0.1, 0.15, 0.18], col: "belly", paint: true },
      { t: "box", c: [0.02, 0.31, 0], s: [0.26, 0.035, 0.27], round: 0.03, rot: [0, 0, -10], col: "rust", paint: true },
      { t: "ell", c: [0.25, 0.33, 0], r: [0.04, 0.045, 0.05], col: "bronze", k: 0.01 },
      // Head low and forward: snout, tusks, nose ring, ears and bristle crest.
      { t: "ell", c: [0.24, 0.7, 0], r: [0.17, 0.16, 0.17], col: "hide", k: 0.06 },
      { t: "cap", a: [0.34, 0.66, 0], b: [0.45, 0.63, 0], r: [0.085, 0.075], col: "snout", k: 0.04 },
      { t: "ell", c: [0.52, 0.635, 0], r: [0.02, 0.05, 0.065], col: "snout", k: 0.01 },
      { t: "ell", c: [0.535, 0.64, 0.025], r: [0.01, 0.018, 0.015], col: "mouth", paint: true, mirror: true },
      { t: "box", c: [0.45, 0.585, 0], s: [0.05, 0.012, 0.065], round: 0.01, col: "mouth", paint: true },
      { t: "tor", c: [0.53, 0.585, 0], R: 0.045, r: 0.016, rot: [90, 0, 0], col: "ring", k: 0 },
      { t: "cap", a: [0.44, 0.6, 0.06], b: [0.47, 0.76, 0.14], r: [0.032, 0.008], col: "tusk", mirror: true, k: 0.02 },
      { t: "cap", a: [0.16, 0.8, 0.12], b: [0.08, 0.92, 0.23], r: [0.055, 0.01], col: "hide", mirror: true },
      { t: "cap", a: [0.22, 0.84, 0], b: [0.12, 1.0, 0], r: [0.05, 0.01], col: "bristle" },
      { t: "cap", a: [0.1, 0.82, 0], b: [-0.05, 0.95, 0], r: [0.05, 0.01], col: "bristle" },
      { t: "cap", a: [-0.03, 0.72, 0], b: [-0.2, 0.8, 0], r: [0.045, 0.01], col: "bristle" },
      // Spiked bronze shoulder plates.
      { t: "ell", c: [0.06, 0.63, 0.22], r: [0.14, 0.085, 0.12], rot: [0, 0, -15], col: "bronze", mirror: true, k: 0.02 },
      { t: "ell", c: [0.06, 0.6, 0.27], r: [0.13, 0.04, 0.08], rot: [0, 0, -15], col: "rust", paint: true, mirror: true },
      { t: "cap", a: [0.04, 0.69, 0.27], b: [0.0, 0.8, 0.33], r: [0.032, 0.008], col: "tusk", mirror: true, k: 0.02 },
      // Near arm swings a fist forward with a bronze bracer, far arm pumps back.
      { t: "cap", a: [0.08, 0.58, 0.27], b: [0.28, 0.42, 0.34], r: [0.08, 0.07], col: "hide" },
      { t: "cap", a: [0.2, 0.48, 0.32], b: [0.27, 0.43, 0.34], r: [0.083, 0.078], col: "bronze", k: 0.01 },
      { t: "ell", c: [0.33, 0.39, 0.35], r: [0.09, 0.085, 0.09], col: "hide", k: 0.02 },
      { t: "cap", a: [0.0, 0.58, -0.27], b: [-0.13, 0.4, -0.34], r: [0.08, 0.07], col: "hide" },
      { t: "ell", c: [-0.16, 0.36, -0.35], r: [0.09, 0.085, 0.09], col: "hide", k: 0.02 },
    ],
    eyes: [{ at: [0.3, 0.75, 0.075], r: 0.055, iris: "#ff8a1a", mirror: true, angry: true, look: [0.8, 0.05, 0.6] }],
  },

  // Peto de Éter: a sky-blue armoured breastplate on a stand, brass pauldrons, glowing teal ether core.
  "peto-eter": {
    palette: { wood: "#7a4f2e", plate: CEL.plate, dk: CEL.dk, brass: CEL.brass, core: CEL.core, hot: CEL.hot },
    glow: ["core", "hot"],
    shapes: [
      ...cuirass("plate", "brass"),
      { t: "box", c: [0, 0.4, 0], s: [0.2, 0.015, 0.3], round: 0.005, col: "dk", paint: true },
      { t: "ell", c: [0, 0.72, 0.29], r: [0.13, 0.1, 0.1], rot: [-30, 0, 0], col: "brass", mirror: true, k: 0.02 },
      { t: "ell", c: [0, 0.64, 0.33], r: [0.11, 0.07, 0.07], rot: [-30, 0, 0], col: "dk", mirror: true, k: 0.02 },
      { t: "tor", c: [0.2, 0.58, 0], R: 0.07, r: 0.024, rot: [0, 0, 90], col: "brass", k: 0.01 },
      { t: "ell", c: [0.2, 0.58, 0], r: [0.045, 0.06, 0.06], col: "core", k: 0.01 },
      { t: "ell", c: [0.24, 0.585, 0.01], r: [0.02, 0.03, 0.03], col: "hot", paint: true },
      { t: "cap", a: [0.2, 0.5, 0.0], b: [0.15, 0.36, 0.0], r: [0.014, 0.014], col: "core", paint: true },
      { t: "cap", a: [0.18, 0.63, 0.07], b: [0.12, 0.7, 0.17], r: [0.013, 0.013], col: "core", paint: true, mirror: true },
      { t: "ell", c: [0.16, 0.42, 0.1], r: [0.022, 0.022, 0.022], col: "brass", mirror: true, k: 0.005 },
    ],
    eyes: [],
  },

  // Botas Propulsoras: a pair of armoured sky-blue boots hovering on glowing ether jets.
  "botas-propulsoras": {
    palette: { plate: CEL.plate, dk: CEL.dk, brass: CEL.brass, core: CEL.core, hot: CEL.hot },
    glow: ["core", "hot"],
    shapes: [
      ...boot(-0.12, 0.22, -0.14),
      ...boot(0.02, 0.15, 0.14),
      { t: "ell", c: [0.28, 0.12, 0.2], r: [0.025, 0.025, 0.025], col: "core", k: 0 },
      { t: "ell", c: [-0.26, 0.1, -0.05], r: [0.022, 0.022, 0.022], col: "core", k: 0 },
    ],
    eyes: [],
  },

  // Guanteletes Repulsores: an upright armoured gauntlet, palm out with a glowing repulsor and pulses.
  "guanteletes-repulsores": {
    palette: { plate: CEL.plate, dk: CEL.dk, brass: CEL.brass, core: CEL.core, hot: CEL.hot },
    glow: ["core", "hot"],
    shapes: [
      { t: "cap", a: [0, 0.05, 0], b: [0, 0.4, 0], r: [0.15, 0.11], col: "plate", k: 0.03 },
      { t: "tor", c: [0, 0.08, 0], R: 0.145, r: 0.04, col: "brass", k: 0.02 },
      { t: "tor", c: [0, 0.38, 0], R: 0.11, r: 0.03, col: "brass", k: 0.02 },
      { t: "box", c: [0, 0.22, 0.12], s: [0.05, 0.06, 0.03], round: 0.02, col: "dk", paint: true },
      { t: "box", c: [0, 0.55, 0], s: [0.075, 0.13, 0.14], round: 0.07, col: "plate", k: 0.04 },
      ...[-0.1, -0.035, 0.035, 0.1].map((z, i): Shape => ({ t: "cap", a: [0, 0.66, z], b: [0.02, 0.84 + (i === 1 || i === 2 ? 0.03 : 0), z * 1.2], r: [0.036, 0.03], col: "plate", k: 0.015 })),
      ...[-0.1, -0.035, 0.035, 0.1].map((z): Shape => ({ t: "ell", c: [0.005, 0.72, z], r: [0.042, 0.022, 0.038], col: "brass", k: 0.01 })),
      { t: "cap", a: [0.02, 0.52, 0.13], b: [0.06, 0.66, 0.22], r: [0.042, 0.032], col: "plate", k: 0.02 },
      { t: "tor", c: [0.075, 0.55, 0], R: 0.085, r: 0.018, rot: [0, 0, 90], col: "brass", k: 0.01 },
      { t: "ell", c: [0.08, 0.55, 0], r: [0.025, 0.075, 0.075], col: "core", k: 0.01 },
      { t: "ell", c: [0.1, 0.55, 0], r: [0.02, 0.04, 0.04], col: "hot", paint: true },
      { t: "tor", c: [0.22, 0.55, 0], R: 0.1, r: 0.018, rot: [0, 0, 90], col: "core", k: 0 },
      { t: "tor", c: [0.35, 0.55, 0], R: 0.14, r: 0.017, rot: [0, 0, 90], col: "core", k: 0 },
    ],
    eyes: [],
  },

  // Casco Analítico: a round sky-blue helmet, dark visor with a glowing teal scanning lens, ear discs and antenna.
  "casco-analitico": {
    palette: { plate: CEL.plate, dk: CEL.dk, brass: CEL.brass, core: CEL.core, hot: CEL.hot, visor: "#9fe6f2" },
    glow: ["core", "hot"],
    shapes: [
      { t: "cap", a: [0, 0.05, 0], b: [0, 0.16, 0], r: [0.2, 0.17], col: "dk", k: 0.03 },
      { t: "tor", c: [0, 0.06, 0], R: 0.22, r: 0.045, col: "brass", k: 0.02 },
      { t: "ell", c: [0, 0.44, 0], r: [0.32, 0.29, 0.32], col: "plate", k: 0.05 },
      { t: "ell", c: [0.08, 0.22, 0], r: [0.2, 0.08, 0.26], col: "plate", k: 0.06 },
      { t: "box", c: [-0.02, 0.79, 0], s: [0.2, 0.05, 0.025], round: 0.02, rot: [0, 0, -12], col: "brass", k: 0.03 },
      { t: "box", c: [0, 0.6, 0], s: [0.32, 0.012, 0.32], round: 0.005, col: "dk", paint: true },
      { t: "ell", c: [0.28, 0.46, 0], r: [0.08, 0.09, 0.26], col: "visor", paint: true },
      { t: "cap", a: [0.24, 0.48, 0.09], b: [0.27, 0.48, 0.095], r: [0.075, 0.075], col: "brass", k: 0.01 },
      { t: "ell", c: [0.345, 0.48, 0.1], r: [0.025, 0.058, 0.058], col: "core", k: 0 },
      { t: "ell", c: [0.37, 0.49, 0.11], r: [0.012, 0.025, 0.025], col: "hot", paint: true },
      { t: "cap", a: [0, 0.46, 0.27], b: [0, 0.46, 0.32], r: [0.08, 0.08], col: "brass", mirror: true, k: 0.01 },
      { t: "cap", a: [0, 0.48, 0.32], b: [-0.05, 0.76, 0.35], r: [0.016, 0.013], col: "dk", k: 0.01 },
      { t: "ell", c: [-0.05, 0.79, 0.35], r: [0.035, 0.035, 0.035], col: "core", k: 0.01 },
      { t: "ell", c: [0.48, 0.62, 0.18], r: [0.022, 0.022, 0.022], col: "core", k: 0 },
      { t: "ell", c: [0.46, 0.36, 0.2], r: [0.02, 0.02, 0.02], col: "core", k: 0 },
    ],
    eyes: [],
  },

  // Taller Real: an inventor's wooden workbench with a big brass cog, a blue gear, a wrench and a glowing vial.
  "taller-real": {
    palette: { wood: "#a86e3c", woodDk: "#6a4224", brass: CEL.brass, blue: CEL.plate, hub: "#5a4a3a", metal: "#9aa3b0", glow: CEL.core, cork: "#c8a070" },
    glow: ["glow"],
    shapes: [
      { t: "box", c: [0, 0.42, 0], s: [0.42, 0.04, 0.22], round: 0.015, col: "wood", k: 0.01 },
      { t: "box", c: [-0.36, 0.2, 0.16], s: [0.03, 0.2, 0.03], round: 0.01, col: "woodDk", mirror: true, k: 0.01 },
      { t: "box", c: [0.36, 0.2, 0.16], s: [0.03, 0.2, 0.03], round: 0.01, col: "woodDk", mirror: true, k: 0.01 },
      { t: "box", c: [0, 0.12, 0], s: [0.38, 0.018, 0.18], round: 0.01, col: "woodDk", k: 0.01 },
      ...gear(-0.12, 0.68, 0.2, 8, "brass", "hub", -0.08, 10),
      ...gear(0.16, 0.57, 0.1, 6, "blue", "hub", -0.04, 0),
      { t: "cap", a: [-0.05, 0.475, 0.13], b: [0.2, 0.475, 0.07], r: [0.02, 0.02], col: "metal", k: 0.01 },
      { t: "tor", c: [0.235, 0.475, 0.06], R: 0.038, r: 0.018, col: "metal", k: 0.01 },
      { t: "cap", a: [0.32, 0.47, 0.06], b: [0.32, 0.6, 0.06], r: [0.045, 0.04], col: "glow", k: 0.02 },
      { t: "cap", a: [0.32, 0.6, 0.06], b: [0.32, 0.66, 0.06], r: [0.025, 0.025], col: "cork", k: 0.01 },
    ],
    eyes: [],
  },

  // Descarga Total: an armoured gauntlet unleashing a huge teal ether blast.
  "descarga-total": {
    palette: { plate: CEL.plate, dk: CEL.dk, brass: CEL.brass, core: CEL.core, hot: CEL.hot },
    glow: ["core", "hot"],
    shapes: [
      { t: "cap", a: [-0.46, 0.18, 0], b: [-0.2, 0.4, 0], r: [0.1, 0.085], col: "plate", k: 0.03 },
      { t: "tor", c: [-0.36, 0.26, 0], R: 0.095, r: 0.03, rot: [0, 0, -50], col: "brass", k: 0.02 },
      { t: "box", c: [-0.15, 0.44, 0], s: [0.06, 0.1, 0.11], round: 0.05, rot: [0, 0, -40], col: "plate", k: 0.03 },
      ...[-0.07, 0, 0.07].map((z): Shape => ({ t: "cap", a: [-0.1, 0.52, z], b: [-0.07, 0.6, z * 1.4], r: [0.03, 0.025], col: "plate", k: 0.015 })),
      { t: "tor", c: [-0.1, 0.47, 0], R: 0.07, r: 0.018, rot: [0, 0, -50], col: "brass", k: 0.01 },
      { t: "cap", a: [-0.08, 0.48, 0], b: [0.14, 0.56, 0], r: [0.06, 0.15], col: "core", k: 0.03 },
      { t: "ell", c: [0.2, 0.58, 0], r: [0.2, 0.2, 0.2], col: "core", k: 0.05 },
      ...burst([0.2, 0.58, 0], 10, 0, 0.38, [0.07, 0.012], "core", { len: 0.27, r: [0.055, 0.01], col: "hot" }, 0.04),
      { t: "cap", a: [0.2, 0.58, 0], b: [0.24, 0.58, 0.36], r: [0.08, 0.012], col: "core", k: 0.04 },
      { t: "ell", c: [0.22, 0.59, 0.12], r: [0.14, 0.14, 0.1], col: "hot", paint: true },
      { t: "tor", c: [0.02, 0.52, 0], R: 0.13, r: 0.02, rot: [0, 0, -72], col: "hot", k: 0 },
    ],
    eyes: [],
  },

  // Ráfaga Repulsora: three quick teal repulsor bolts streaking forward with pulse rings.
  "rafaga-repulsora": {
    palette: { core: CEL.core, hot: CEL.hot, brass: CEL.brass },
    glow: ["core", "hot"],
    shapes: [
      ...bolt([0.28, 0.76, 0.04], 0.42, 0.08),
      ...bolt([0.06, 0.48, -0.1], 0.36, 0.065),
      ...bolt([0.32, 0.22, 0.12], 0.4, 0.07),
      { t: "ell", c: [0.42, 0.52, 0.1], r: [0.025, 0.025, 0.025], col: "hot", k: 0 },
      { t: "ell", c: [-0.18, 0.86, 0.0], r: [0.022, 0.022, 0.022], col: "core", k: 0 },
    ],
    eyes: [],
  },

  // Autómata Ayudante: a cute round clockwork helper bot, brass head with big eyes, teal belly core,
  // waving, wind-up key on its back and a glowing antenna bulb.
  "automata-ayudante": {
    palette: { brass: CEL.brass, blue: CEL.plate, dk: "#3a5a7a", core: CEL.core, face: "#f6eedc", cheek: "#ff9a8a" },
    glow: ["core"],
    shapes: [
      { t: "ell", c: [0.04, 0.05, 0.08], r: [0.075, 0.045, 0.06], col: "dk", mirror: true },
      { t: "cap", a: [0, 0.08, 0.08], b: [0, 0.2, 0.08], r: [0.032, 0.036], col: "brass", mirror: true },
      { t: "ell", c: [0, 0.33, 0], r: [0.17, 0.16, 0.17], col: "blue", k: 0.05 },
      { t: "tor", c: [0.15, 0.33, 0], R: 0.065, r: 0.02, rot: [0, 0, 90], col: "brass", k: 0.01 },
      { t: "ell", c: [0.16, 0.33, 0], r: [0.035, 0.05, 0.05], col: "core", k: 0.01 },
      { t: "cap", a: [0, 0.38, 0.15], b: [0.06, 0.52, 0.25], r: [0.032, 0.026], col: "brass" },
      { t: "ell", c: [0.07, 0.55, 0.26], r: [0.045, 0.045, 0.045], col: "dk", k: 0.02 },
      { t: "cap", a: [0, 0.36, -0.15], b: [0.07, 0.24, -0.22], r: [0.032, 0.026], col: "brass" },
      { t: "ell", c: [0.08, 0.22, -0.23], r: [0.045, 0.045, 0.045], col: "dk", k: 0.02 },
      { t: "cap", a: [-0.15, 0.36, 0], b: [-0.25, 0.36, 0], r: [0.022, 0.022], col: "brass", k: 0.01 },
      { t: "ell", c: [-0.27, 0.36, 0.055], r: [0.025, 0.05, 0.05], col: "brass", mirror: true, k: 0.01 },
      { t: "ell", c: [0.02, 0.66, 0], r: [0.21, 0.18, 0.2], col: "brass", k: 0.04 },
      { t: "ell", c: [0.17, 0.65, 0], r: [0.08, 0.13, 0.17], col: "face", paint: true },
      { t: "ell", c: [0.2, 0.59, 0.11], r: [0.02, 0.022, 0.03], col: "cheek", paint: true, mirror: true },
      { t: "cap", a: [0.02, 0.66, 0.18], b: [0.02, 0.66, 0.23], r: [0.045, 0.045], col: "blue", mirror: true, k: 0.01 },
      { t: "cap", a: [0, 0.82, 0], b: [-0.03, 0.96, 0], r: [0.016, 0.013], col: "dk", k: 0.01 },
      { t: "ell", c: [-0.03, 0.99, 0], r: [0.045, 0.045, 0.045], col: "core", k: 0.01 },
    ],
    eyes: eyes("#25b8d8", false, 0.67, 0.04, 0.07),
  },

  // Matón Acorazado: burly thug in a kettle helm and bronze armour, raising a big axe.
  "maton-acorazado": {
    palette: {
      skin: "#e0a07a", torso: "#8a5a3a", legs: "#5a3a2a", boots: "#3a2620", bronze: "#c8873a", metal: "#8f96a0",
      wood: "#7a4a2a", rust: "#a8462a", stubble: "#b07e66", edge: "#e6ecf2",
    },
    shapes: [
      ...body({ torso: [0.16, 0.17, 0.17], hips: 0.07 }),
      { t: "box", c: [0.06, 0.42, 0], s: [0.11, 0.12, 0.15], round: 0.07, col: "bronze", k: 0.03 },
      { t: "ell", c: [0.17, 0.44, 0], r: [0.025, 0.06, 0.06], col: "rust", paint: true },
      { t: "tor", c: [0, 0.28, 0], R: 0.145, r: 0.028, col: "rust" },
      { t: "ell", c: [0, 0.55, 0.17], r: [0.1, 0.07, 0.09], col: "bronze", mirror: true, k: 0.02 },
      { t: "cap", a: [0, 0.6, 0.2], b: [-0.02, 0.7, 0.24], r: [0.03, 0.007], col: "metal", mirror: true, k: 0.02 },
      // Kettle helm with a nose guard.
      { t: "ell", c: [-0.01, 0.79, 0], r: [0.2, 0.14, 0.21], col: "metal", k: 0.03 },
      { t: "ell", c: [0, 0.75, 0], r: [0.24, 0.025, 0.24], col: "metal", k: 0.02 },
      { t: "cap", a: [0.2, 0.78, 0], b: [0.215, 0.66, 0], r: [0.022, 0.018], col: "metal", k: 0.02 },
      { t: "cap", a: [-0.02, 0.92, 0], b: [0.01, 0.96, 0], r: [0.03, 0.02], col: "bronze", k: 0.02 },
      { t: "ell", c: [0.18, 0.61, 0], r: [0.06, 0.05, 0.14], col: "stubble", paint: true },
      // Near arm raises the axe, far arm a clenched fist.
      ...arm(1, [0.08, 0.72, 0.26], "torso", "boots", 0.05),
      { t: "cap", a: [0.08, 0.55, 0.26], b: [0.06, 1.04, 0.26], r: [0.024, 0.024], col: "wood", k: 0.01 },
      { t: "box", c: [0.12, 0.96, 0.26], s: [0.06, 0.045, 0.022], round: 0.015, col: "metal", k: 0.01 },
      { t: "ell", c: [0.2, 0.96, 0.26], r: [0.05, 0.13, 0.024], col: "metal", k: 0.03 },
      { t: "ell", c: [0.25, 0.96, 0.26], r: [0.025, 0.13, 0.03], col: "edge", paint: true },
      ...arm(-1, [0.2, 0.38, -0.22], "torso", "boots", 0.05),
    ],
    eyes: eyes("#c8501a", true, 0.69),
  },

  // Bandido Saqueador: rust-hooded bandit with a bandana over the face, loot sack on the shoulder, dagger out.
  "bandido-saqueador": {
    palette: {
      skin: "#e8b48e", torso: "#7a4a2e", legs: "#4a3a2e", boots: "#3a2a20", hood: "#a8462a", mask: "#3a2620",
      sack: "#c8a46a", rope: "#7a4f22", metal: "#c4ccd6", band: "#e08a2a", gold: "#ffd34a",
    },
    glow: ["gold"],
    shapes: [
      { t: "box", c: [-0.16, 0.3, 0], s: [0.022, 0.24, 0.19], round: 0.02, rot: [0, 0, -14], col: "hood", k: 0.04 },
      ...body(),
      { t: "tor", c: [0, 0.28, 0], R: 0.13, r: 0.026, col: "band" },
      { t: "cap", a: [0.12, 0.5, 0.1], b: [0.1, 0.28, -0.12], r: [0.02, 0.02], col: "rope", k: 0.01 },
      { t: "ell", c: [0.02, 0.74, 0], r: [0.22, 0.21, 0.21], col: "hood", k: 0.04 },
      { t: "cap", a: [-0.1, 0.9, 0], b: [-0.22, 0.96, 0], r: [0.08, 0.02], col: "hood" },
      { t: "ell", c: [0.2, 0.71, 0], r: [0.1, 0.1, 0.14], col: "hood", cut: true, k: 0.03 },
      { t: "ell", c: [0.08, 0.7, 0], r: [0.17, 0.15, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.23, 0.62, 0], r: [0.06, 0.06, 0.16], col: "mask", paint: true },
      // Loot sack slung over the near shoulder, a coin peeking out.
      { t: "ell", c: [-0.26, 0.6, 0.16], r: [0.13, 0.15, 0.12], col: "sack", k: 0.03 },
      { t: "cap", a: [-0.16, 0.66, 0.2], b: [-0.06, 0.6, 0.25], r: [0.04, 0.03], col: "sack", k: 0.03 },
      { t: "tor", c: [-0.15, 0.66, 0.2], R: 0.04, r: 0.015, rot: [0, 0, 60], col: "rope", k: 0.01 },
      { t: "cap", a: [-0.3, 0.75, 0.2], b: [-0.3, 0.75, 0.2], r: [0.035, 0.035], col: "gold" },
      ...arm(1, [-0.04, 0.58, 0.26], "torso", "boots"),
      // Far hand thrusts a dagger forward.
      ...arm(-1, [0.24, 0.4, -0.2], "torso", "boots"),
      { t: "cap", a: [0.26, 0.42, -0.2], b: [0.45, 0.5, -0.2], r: [0.035, 0.008], col: "metal", k: 0.01 },
      { t: "cap", a: [0.25, 0.37, -0.24], b: [0.27, 0.47, -0.16], r: [0.015, 0.015], col: "rope", k: 0.005 },
    ],
    eyes: eyes("#e08a2a", true, 0.72),
  },

  // Carga Imparable: a charging boar head bursting out of a dust cloud, tusks first, shockwave rings ahead.
  "carga-imparable": {
    palette: {
      hide: "#8a5a3a", snout: "#d8977c", tusk: "#f4ead2", bristle: "#e0702a", dust: "#c9a982", dust2: "#a8835e",
      wave: "#ff9a3a", ring: "#f0bf4a", mouth: "#2a1210",
    },
    glow: ["wave"],
    shapes: [
      { t: "ell", c: [-0.3, 0.32, 0], r: [0.2, 0.2, 0.2], col: "dust", k: 0.1 },
      { t: "ell", c: [-0.44, 0.5, -0.04], r: [0.13, 0.12, 0.13], col: "dust", k: 0.1 },
      { t: "ell", c: [-0.28, 0.12, 0.05], r: [0.16, 0.1, 0.16], col: "dust2", k: 0.1 },
      { t: "ell", c: [-0.5, 0.22, 0.06], r: [0.11, 0.1, 0.11], col: "dust2", k: 0.1 },
      { t: "ell", c: [0, 0.5, 0], r: [0.24, 0.22, 0.24], col: "hide", k: 0.06 },
      { t: "cap", a: [0.16, 0.45, 0], b: [0.3, 0.42, 0], r: [0.11, 0.1], col: "snout", k: 0.04 },
      { t: "ell", c: [0.39, 0.42, 0], r: [0.025, 0.075, 0.09], col: "snout", k: 0.01 },
      { t: "ell", c: [0.41, 0.43, 0.035], r: [0.01, 0.025, 0.02], col: "mouth", paint: true, mirror: true },
      { t: "tor", c: [0.405, 0.36, 0], R: 0.05, r: 0.017, rot: [90, 0, 0], col: "ring", k: 0 },
      { t: "cap", a: [0.28, 0.36, 0.09], b: [0.34, 0.58, 0.2], r: [0.042, 0.01], col: "tusk", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.04, 0.66, 0.16], b: [-0.12, 0.8, 0.28], r: [0.07, 0.012], col: "hide", mirror: true },
      { t: "cap", a: [0.02, 0.7, 0], b: [-0.2, 0.88, 0], r: [0.07, 0.012], col: "bristle" },
      { t: "cap", a: [-0.12, 0.62, 0], b: [-0.36, 0.74, 0], r: [0.06, 0.01], col: "bristle" },
      { t: "tor", c: [0.48, 0.44, 0], R: 0.22, r: 0.022, rot: [0, 0, 90], col: "wave", k: 0 },
      { t: "tor", c: [0.58, 0.44, 0], R: 0.3, r: 0.02, rot: [0, 0, 90], col: "wave", k: 0 },
      { t: "cap", a: [-0.15, 0.24, 0.3], b: [-0.48, 0.26, 0.3], r: [0.02, 0.006], col: "wave", k: 0 },
      { t: "cap", a: [-0.15, 0.7, 0.26], b: [-0.44, 0.74, 0.26], r: [0.02, 0.006], col: "wave", k: 0 },
    ],
    eyes: [{ at: [0.17, 0.57, 0.09], r: 0.05, iris: "#ff8a1a", mirror: true, angry: true, look: [0.8, 0.05, 0.6] }],
  },

  // Pisotón: a giant ogre foot with a bronze anklet stomping down on cracked, glowing ground.
  pisoton: {
    palette: {
      hide: "#8a5a3a", nail: "#4a2e22", bronze: "#c8873a", rust: "#a8462a", ground: "#9a8670", rock: "#b8a68a", crack: "#ff8a2a", dust: "#e6d6b4",
    },
    glow: ["crack"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.48, 0.045, 0.42], col: "ground", k: 0.02 },
      ...[20, 75, 140, 200, 250, 310].map((a): Shape => ({ t: "box", c: [0.3 * Math.cos(rad(a)), 0.08, -0.3 * Math.sin(rad(a))], s: [0.13, 0.05, 0.014], round: 0.005, rot: [0, a, 0], col: "crack", paint: true })),
      { t: "ell", c: [-0.02, 0.2, 0], r: [0.24, 0.12, 0.18], col: "hide", k: 0.06 },
      ...[-0.12, 0, 0.12].map((z): Shape => ({ t: "ell", c: [0.22, 0.14, z * 1.1], r: [0.09, 0.075, 0.065], col: "hide", k: 0.03 })),
      ...[-0.12, 0, 0.12].map((z): Shape => ({ t: "ell", c: [0.3, 0.16, z * 1.1], r: [0.03, 0.05, 0.05], col: "nail", paint: true })),
      { t: "cap", a: [-0.08, 0.24, 0], b: [-0.24, 0.72, 0], r: [0.15, 0.16], col: "hide", k: 0.06 },
      { t: "ell", c: [-0.26, 0.78, 0], r: [0.17, 0.15, 0.18], col: "hide", k: 0.06 },
      { t: "cap", a: [-0.26, 0.8, 0], b: [-0.02, 1.0, 0], r: [0.17, 0.19], col: "hide", k: 0.06 },
      { t: "tor", c: [-0.12, 0.4, 0], R: 0.155, r: 0.04, rot: [0, 0, 18], col: "bronze", k: 0.02 },
      ...[-0.12, 0, 0.12].map((z): Shape => ({ t: "cap", a: [-0.16, 0.66, z], b: [-0.08, 0.54, z * 1.4], r: [0.05, 0.012], col: "rust", k: 0.03 })),
      { t: "cap", a: [-0.2, 0.7, 0.13], b: [-0.14, 0.58, 0.2], r: [0.05, 0.012], col: "rust", k: 0.03 },
      { t: "cap", a: [0.3, 0.98, 0.2], b: [0.26, 0.7, 0.2], r: [0.02, 0.006], col: "crack", k: 0 },
      { t: "cap", a: [-0.38, 0.98, 0.16], b: [-0.36, 0.68, 0.16], r: [0.02, 0.006], col: "crack", k: 0 },
      { t: "ell", c: [0.36, 0.25, 0.22], r: [0.05, 0.045, 0.05], col: "rock", k: 0 },
      { t: "ell", c: [-0.38, 0.2, 0.2], r: [0.06, 0.05, 0.06], col: "rock", k: 0 },
      { t: "ell", c: [0.3, 0.32, -0.22], r: [0.04, 0.04, 0.04], col: "rock", k: 0 },
      { t: "ell", c: [0.32, 0.1, 0.3], r: [0.1, 0.07, 0.1], col: "dust", k: 0.04 },
      { t: "ell", c: [-0.32, 0.1, 0.3], r: [0.1, 0.06, 0.1], col: "dust", k: 0.04 },
      { t: "ell", c: [-0.3, 0.1, -0.3], r: [0.1, 0.06, 0.1], col: "dust", k: 0.04 },
    ],
    eyes: [],
  },

  // Placas de Bronce: heavy layered bronze armour plates on a wooden stand, boar-tusk emblem, spiked pauldrons.
  "placas-bronce": {
    palette: { wood: "#7a4f2e", bronze: "#c8873a", bronze2: "#e0a84a", rust: "#a8462a", rivet: "#f4cf78", tusk: "#f4ead2" },
    shapes: [
      ...cuirass("bronze", "rust"),
      { t: "box", c: [0, 0.4, 0], s: [0.2, 0.015, 0.3], round: 0.005, col: "rust", paint: true },
      { t: "ell", c: [0.19, 0.58, 0], r: [0.04, 0.09, 0.09], col: "rust", paint: true },
      { t: "cap", a: [0.21, 0.55, 0.035], b: [0.2, 0.64, 0.08], r: [0.018, 0.006], col: "tusk", paint: true, mirror: true },
      { t: "ell", c: [0, 0.74, 0.28], r: [0.15, 0.09, 0.12], rot: [-25, 0, 0], col: "bronze2", mirror: true, k: 0.02 },
      { t: "ell", c: [0, 0.65, 0.33], r: [0.14, 0.08, 0.09], rot: [-35, 0, 0], col: "bronze", mirror: true, k: 0.02 },
      { t: "ell", c: [0, 0.56, 0.36], r: [0.12, 0.07, 0.07], rot: [-45, 0, 0], col: "bronze2", mirror: true, k: 0.02 },
      { t: "cap", a: [0, 0.8, 0.29], b: [-0.02, 0.94, 0.35], r: [0.04, 0.008], col: "tusk", mirror: true, k: 0.02 },
      { t: "ell", c: [0.15, 0.68, 0.14], r: [0.025, 0.025, 0.025], col: "rivet", mirror: true, k: 0.005 },
      { t: "ell", c: [0.16, 0.45, 0.1], r: [0.022, 0.022, 0.022], col: "rivet", mirror: true, k: 0.005 },
      { t: "box", c: [0.04, 0.22, 0.09], s: [0.11, 0.06, 0.07], round: 0.03, col: "bronze2", mirror: true, k: 0.02 },
    ],
    eyes: [],
  },

  // Derribar el Puente: a stone bridge cracking in the middle, both halves sagging, stones falling into the river.
  "puente-roto": {
    palette: { stone: "#a89580", stone2: "#c8b89c", dark: "#6a5a4a", water: "#4f9ad0", foam: "#e6f6ff", dust: "#e8c890", ember: "#ff8a2a" },
    glow: ["ember"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.52, 0.03, 0.3], col: "water", k: 0.02 },
      { t: "box", c: [-0.4, 0.25, 0], s: [0.08, 0.25, 0.12], round: 0.02, col: "stone", k: 0.02 },
      { t: "box", c: [0.4, 0.25, 0], s: [0.08, 0.25, 0.12], round: 0.02, col: "stone", k: 0.02 },
      { t: "box", c: [-0.4, 0.3, 0], s: [0.085, 0.012, 0.125], round: 0.005, col: "dark", paint: true },
      { t: "box", c: [0.4, 0.18, 0], s: [0.085, 0.012, 0.125], round: 0.005, col: "dark", paint: true },
      { t: "cap", a: [-0.34, 0.3, 0], b: [-0.16, 0.44, 0], r: [0.07, 0.05], col: "stone2", k: 0.03 },
      { t: "cap", a: [0.34, 0.3, 0], b: [0.18, 0.4, 0], r: [0.07, 0.05], col: "stone2", k: 0.03 },
      { t: "box", c: [-0.24, 0.52, 0], s: [0.2, 0.045, 0.13], round: 0.015, rot: [0, 0, -14], col: "stone", k: 0.02 },
      { t: "box", c: [-0.24, 0.59, 0.11], s: [0.2, 0.03, 0.02], round: 0.01, rot: [0, 0, -14], col: "stone2", mirror: true, k: 0.01 },
      { t: "box", c: [0.24, 0.49, 0], s: [0.2, 0.045, 0.13], round: 0.015, rot: [0, 0, 20], col: "stone", k: 0.02 },
      { t: "box", c: [0.24, 0.56, 0.11], s: [0.2, 0.03, 0.02], round: 0.01, rot: [0, 0, 20], col: "stone2", mirror: true, k: 0.01 },
      { t: "box", c: [-0.05, 0.42, 0.04], s: [0.04, 0.035, 0.045], round: 0.01, rot: [20, 30, 15], col: "stone2", k: 0 },
      { t: "box", c: [0.04, 0.28, -0.05], s: [0.045, 0.04, 0.04], round: 0.01, rot: [-15, 10, 35], col: "stone", k: 0 },
      { t: "box", c: [-0.02, 0.15, 0.08], s: [0.035, 0.03, 0.035], round: 0.01, rot: [30, 0, -20], col: "stone2", k: 0 },
      { t: "ell", c: [0.0, 0.52, 0.0], r: [0.06, 0.06, 0.06], col: "dust", k: 0 },
      { t: "ell", c: [0.05, 0.6, 0.06], r: [0.045, 0.045, 0.045], col: "dust", k: 0 },
      { t: "ell", c: [-0.06, 0.5, 0.0], r: [0.02, 0.06, 0.08], col: "ember", k: 0 },
      { t: "cap", a: [0, 0.04, 0.04], b: [-0.02, 0.16, 0.06], r: [0.05, 0.01], col: "foam", k: 0.02 },
      { t: "cap", a: [0.04, 0.04, -0.04], b: [0.1, 0.12, -0.06], r: [0.035, 0.008], col: "foam", k: 0.02 },
      { t: "cap", a: [-0.04, 0.04, -0.02], b: [-0.11, 0.11, -0.04], r: [0.035, 0.008], col: "foam", k: 0.02 },
    ],
    eyes: [],
  },

  // Furia Desatada (expert): a deep-red explosion of rage with a furious face, shouting.
  "furia-desatada": {
    palette: { red: "#b81c2a", deep: "#7a0e1c", orange: "#ff6a2a", hot: "#ffc04a", mouth: "#2a0508", teeth: "#fff0e0" },
    glow: ["orange", "hot"],
    shapes: [
      ...burst([0, 0.5, 0], 10, 90, 0.46, [0.1, 0.015], "deep", { len: 0.34, r: [0.08, 0.015], col: "orange" }, 0.05),
      { t: "cap", a: [0, 0.5, 0], b: [-0.05, 0.72, 0.38], r: [0.08, 0.014], col: "orange", k: 0.05 },
      { t: "cap", a: [0, 0.5, 0], b: [-0.02, 0.26, 0.38], r: [0.08, 0.014], col: "deep", k: 0.05 },
      { t: "cap", a: [0, 0.5, 0], b: [-0.08, 0.5, -0.4], r: [0.08, 0.014], col: "deep", k: 0.05 },
      { t: "ell", c: [0, 0.5, 0], r: [0.25, 0.25, 0.23], col: "red", k: 0.06 },
      { t: "box", c: [0.23, 0.4, 0], s: [0.05, 0.04, 0.11], round: 0.03, col: "mouth", paint: true },
      { t: "box", c: [0.24, 0.435, 0], s: [0.05, 0.012, 0.1], round: 0.005, col: "teeth", paint: true },
      { t: "cap", a: [0.12, 0.72, 0.16], b: [0.08, 0.8, 0.2], r: [0.018, 0.016], col: "hot", paint: true },
      { t: "cap", a: [0.06, 0.74, 0.12], b: [0.14, 0.78, 0.24], r: [0.018, 0.016], col: "hot", paint: true },
      { t: "ell", c: [0.3, 0.86, 0.2], r: [0.03, 0.03, 0.03], col: "hot", k: 0 },
      { t: "ell", c: [-0.34, 0.2, 0.1], r: [0.025, 0.025, 0.025], col: "hot", k: 0 },
    ],
    eyes: [{ at: [0.15, 0.56, 0.09], r: 0.07, iris: "#ffd23a", mirror: true, angry: true, look: [0.8, 0.05, 0.6] }],
  },

  // Golpe Maestro (expert): a giant deep-red armoured fist smashing down, impact rings and flying rocks.
  "golpe-maestro": {
    palette: { glove: "#9a1a24", knuckle: "#c8323a", bronze: "#c8873a", ring: "#ff5a3a", ground: "#5a2a2a", rock: "#7a4a44", spark: "#ffc04a" },
    glow: ["ring", "spark"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.46, 0.04, 0.4], col: "ground", k: 0.02 },
      ...[30, 100, 170, 230, 300].map((a): Shape => ({ t: "box", c: [0.24 * Math.cos(rad(a)), 0.08, -0.24 * Math.sin(rad(a))], s: [0.1, 0.05, 0.012], round: 0.004, rot: [0, a, 0], col: "spark", paint: true })),
      { t: "tor", c: [0, 0.08, 0], R: 0.3, r: 0.025, col: "ring", k: 0 },
      { t: "tor", c: [0, 0.07, 0], R: 0.43, r: 0.02, col: "ring", k: 0 },
      { t: "box", c: [-0.02, 0.37, 0], s: [0.19, 0.17, 0.21], round: 0.1, col: "glove", k: 0.04 },
      ...[-0.135, -0.045, 0.045, 0.135].map((z): Shape => ({ t: "cap", a: [0.12, 0.34, z], b: [0.12, 0.22, z], r: [0.058, 0.05], col: "knuckle", k: 0.012 })),
      ...[-0.135, -0.045, 0.045, 0.135].map((z): Shape => ({ t: "ell", c: [0.04, 0.2, z], r: [0.07, 0.05, 0.045], col: "glove", k: 0.012 })),
      { t: "cap", a: [0.1, 0.44, 0.2], b: [0.19, 0.38, 0.05], r: [0.055, 0.045], col: "glove", k: 0.02 },
      ...[-0.135, -0.045, 0.045, 0.135].map((z): Shape => ({ t: "ell", c: [0.16, 0.34, z], r: [0.04, 0.045, 0.042], col: "bronze", k: 0.01 })),
      { t: "cap", a: [-0.08, 0.46, 0], b: [-0.3, 0.86, 0], r: [0.14, 0.15], col: "glove", k: 0.04 },
      { t: "tor", c: [-0.13, 0.55, 0], R: 0.155, r: 0.045, rot: [0, 0, 30], col: "bronze", k: 0.02 },
      ...[-0.1, 0.1].map((z): Shape => ({ t: "cap", a: [-0.17, 0.62, z * 1.5], b: [-0.32, 0.66, z * 2.4], r: [0.035, 0.008], col: "bronze", k: 0.02 })),
      { t: "ell", c: [0.36, 0.22, 0.2], r: [0.05, 0.045, 0.05], col: "rock", k: 0 },
      { t: "ell", c: [-0.36, 0.18, 0.18], r: [0.055, 0.05, 0.05], col: "rock", k: 0 },
      { t: "ell", c: [0.3, 0.3, -0.24], r: [0.04, 0.04, 0.04], col: "rock", k: 0 },
      { t: "cap", a: [0.18, 0.95, 0.2], b: [0.15, 0.6, 0.2], r: [0.02, 0.006], col: "spark", k: 0 },
      { t: "cap", a: [0.05, 0.98, -0.2], b: [0.12, 0.66, -0.2], r: [0.02, 0.006], col: "spark", k: 0 },
    ],
    eyes: [],
  },
};
