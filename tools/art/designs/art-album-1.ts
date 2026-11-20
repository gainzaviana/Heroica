import type { Sculpt, Shape, V3 } from "../sculpt";
import { arm, body, burst, eyes, rad, spike } from "./kit";

// Album cards (Vanguardia's Protección deck and shared básicas) — art batch 1. Valdoria: floating
// towers, old runes, the city of Aurelia. Original designs only: the hero's business partner, a
// lynx-hooded spy, a granite bruiser, an ember guardian, the Guard's hall, a healer's kit and a
// forearm block that strikes first.

// MARK: Helpers

/** Small spheres (sparks, rivets, coins seen edge-on). */
const dot = (c: V3, r: number, col: string, k = 0): Shape => ({ t: "ell", c, r: [r, r, r], col, k });

/** Capsules through a list of points, radius tapering from r0 to r1. */
function chain(pts: V3[], r0: number, r1: number, col: string, k = 0.01, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
  }
  return out;
}

/** Uniform scale about the origin, then a move. */
function place(shapes: Shape[], s: number, d: V3): Shape[] {
  const p = (v: V3): V3 => [v[0] * s + d[0], v[1] * s + d[1], v[2] * s + d[2]];
  return shapes.map((sh): Shape => {
    const k = sh.k === undefined ? {} : { k: sh.k * s };
    switch (sh.t) {
      case "ell": return { ...sh, ...k, c: p(sh.c), r: [sh.r[0] * s, sh.r[1] * s, sh.r[2] * s] };
      case "cap": return { ...sh, ...k, a: p(sh.a), b: p(sh.b), r: [sh.r[0] * s, sh.r[1] * s] };
      case "box": return { ...sh, ...k, c: p(sh.c), s: [sh.s[0] * s, sh.s[1] * s, sh.s[2] * s], round: sh.round * s };
      case "tor": return { ...sh, ...k, c: p(sh.c), R: sh.R * s, r: sh.r * s };
    }
  });
}

/** Rotates shapes about the z axis (in the picture plane) around `o`. Exact for shapes with no x/y rotation. */
function rotZ(shapes: Shape[], deg: number, o: V3 = [0, 0, 0]): Shape[] {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  const p = (v: V3): V3 => { const x = v[0] - o[0], y = v[1] - o[1]; return [o[0] + c * x - s * y, o[1] + s * x + c * y, v[2]]; };
  return shapes.map((sh): Shape => {
    if (sh.t === "cap") return { ...sh, a: p(sh.a), b: p(sh.b) };
    const r = sh.rot ?? [0, 0, 0];
    const keep = sh.t === "tor" && r[0] === 90 && r[1] === 0;
    return { ...sh, c: p(sh.c), rot: keep ? r : [r[0], r[1], r[2] + deg] };
  });
}

/** A small flame (teardrop with a curled tip), base at c, height h. */
function flameShape(c: V3, h: number, col: string, k = 0.03): Shape[] {
  return [
    { t: "ell", c: [c[0], c[1] + h * 0.28, c[2]], r: [h * 0.3, h * 0.3, h * 0.2], col, k },
    { t: "cap", a: [c[0], c[1] + h * 0.35, c[2]], b: [c[0] + h * 0.08, c[1] + h, c[2]], r: [h * 0.24, h * 0.02], col, k },
    { t: "cap", a: [c[0] - h * 0.18, c[1] + h * 0.3, c[2]], b: [c[0] - h * 0.32, c[1] + h * 0.68, c[2]], r: [h * 0.12, h * 0.015], col, k },
    { t: "cap", a: [c[0] + h * 0.18, c[1] + h * 0.3, c[2]], b: [c[0] + h * 0.34, c[1] + h * 0.6, c[2]], r: [h * 0.1, h * 0.015], col, k },
  ];
}

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

/** An arm with the shirt sleeve rolled to the elbow: shirt upper arm, a cuff roll, bare forearm, hand. */
function rolledArm(s: 1 | -1, elbow: V3, hand: V3, sleeve: string, skin: string, r = 0.045): Shape[] {
  return [
    { t: "cap", a: [0, 0.5, 0.15 * s], b: elbow, r: [r + 0.008, r + 0.004], col: sleeve },
    { t: "ell", c: elbow, r: [0.05, 0.05, 0.05], col: sleeve, k: 0.02 },
    { t: "cap", a: elbow, b: hand, r: [r - 0.002, r - 0.006], col: skin, k: 0.015 },
    { t: "ell", c: hand, r: [0.045, 0.045, 0.045], col: skin, k: 0.02 },
  ];
}

/** A clenched fist punching toward +x (knuckle face at x ≈ 0.16), forearm cuff behind it. */
function punch(glove: string, cuff: string): Shape[] {
  return [
    { t: "cap", a: [-0.34, 0, 0], b: [-0.16, 0, 0], r: [0.1, 0.11], col: cuff, k: 0.03 },
    { t: "box", c: [-0.01, 0, -0.01], s: [0.13, 0.13, 0.1], round: 0.08, col: glove, k: 0.05 },
    ...[0.09, 0.03, -0.03, -0.09].flatMap((y): Shape[] => [
      { t: "ell", c: [0.12, y, 0.0], r: [0.055, 0.036, 0.08], col: glove, k: 0.012 },
      { t: "cap", a: [0.12, y, 0.07], b: [0.03, y * 0.95, 0.1], r: [0.034, 0.03], col: glove, k: 0.012 },
    ]),
    { t: "cap", a: [-0.06, -0.1, 0.09], b: [0.06, -0.06, 0.135], r: [0.04, 0.034], col: glove, k: 0.02 },
  ];
}

/** Faceted granite plates along a limb from a to b: n slightly raised slabs alternating two tones. */
function granite(a: V3, b: V3, n: number, off: number): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const c: V3 = [a[0] + (b[0] - a[0]) * t + off * 0.55, a[1] + (b[1] - a[1]) * t + off * 0.6, a[2] + (b[2] - a[2]) * t];
    out.push({ t: "box", c, s: [0.05, 0.035, 0.05], round: 0.012, rot: [25 + i * 40, 30 - i * 25, 15 + i * 20], col: i % 2 ? "plate2" : "plate", k: 0.004 });
  }
  return out;
}

/** A forearm sheathed in stone blocks from a to b (n blocks, half-thickness h), alternating two tones. */
function blocks(a: V3, b: V3, n: number, h: number): Shape[] {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d);
  const yaw = (Math.atan2(-d[2], d[0]) * 180) / Math.PI, pitch = (Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180) / Math.PI;
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    out.push({ t: "box", c: [a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t], s: [len / n / 2 - 0.006, h, h], round: 0.02, rot: [i * 12, yaw, pitch], col: i % 2 ? "plate2" : "plate", k: 0.005 });
  }
  return out;
}

/** A small brass hourglass, upright, centred at c, height h. */
function hourglass(c: V3, h: number, frame: string, glass: string, sand: string): Shape[] {
  const [x, y, z] = c;
  return [
    { t: "cap", a: [x, y + h * 0.42, z], b: [x, y + h * 0.02, z], r: [h * 0.24, h * 0.04], col: glass, k: 0.01 },
    { t: "cap", a: [x, y - h * 0.42, z], b: [x, y - h * 0.02, z], r: [h * 0.24, h * 0.04], col: glass, k: 0.01 },
    { t: "cap", a: [x, y - h * 0.4, z], b: [x, y - h * 0.18, z], r: [h * 0.2, h * 0.08], col: sand, k: 0.01 },
    { t: "box", c: [x, y + h * 0.5, z], s: [h * 0.32, h * 0.05, h * 0.32], round: h * 0.03, col: frame, k: 0.005 },
    { t: "box", c: [x, y - h * 0.5, z], s: [h * 0.32, h * 0.05, h * 0.32], round: h * 0.03, col: frame, k: 0.005 },
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dz]): Shape => ({ t: "cap", a: [x + dx * h * 0.27, y - h * 0.5, z + dz * h * 0.27], b: [x + dx * h * 0.27, y + h * 0.5, z + dz * h * 0.27], r: [h * 0.03, h * 0.03], col: frame, k: 0 })),
  ];
}

export const artAlbum1: Record<string, Sculpt> = {
  // Bruno Salas, el Socio: the hero's partner, a friendly broad-faced man in a teal waistcoat over a
  // cream shirt with rolled sleeves, a ledger board in one hand and a quill-pen in the other, a coin purse at his belt.
  "socio-salas": {
    palette: {
      skin: "#ecbd96", hair: "#5a3820", torso: "#f2e8d4", vest: "#2f7f7a", vestDk: "#1f5a58", legs: "#6a4a32", boots: "#3a2618",
      board: "#a06a3a", paper: "#fbf6e8", ink: "#6a6a7a", brass: "#e0b04a", pen: "#3a2a24", purse: "#8a5a30", coin: "#f2c24a",
      cravat: "#9a5a2a", mouth: "#8a3a34", belt: "#4a3020",
    },
    shapes: [
      ...body({ torso: [0.14, 0.16, 0.15] }),
      // Waistcoat over the shirt: an open V at the front, three brass buttons, a little cravat.
      { t: "ell", c: [-0.005, 0.41, 0], r: [0.148, 0.165, 0.158], col: "vest", k: 0.01 },
      { t: "cap", a: [0.15, 0.56, 0], b: [0.15, 0.44, 0], r: [0.055, 0.008], col: "torso", paint: true },
      ...[0.42, 0.36, 0.3].map((y): Shape => dot([0.148, y, 0.035], 0.012, "brass")),
      { t: "tor", c: [0, 0.28, 0], R: 0.135, r: 0.02, col: "belt" },
      { t: "ell", c: [0.13, 0.54, 0], r: [0.035, 0.03, 0.035], col: "cravat", k: 0.01 },
      { t: "cap", a: [0.14, 0.53, 0], b: [0.16, 0.47, 0.01], r: [0.022, 0.012], col: "cravat", k: 0.01 },
      // Coin purse at the hip, a coin peeking out.
      { t: "ell", c: [0.07, 0.24, 0.13], r: [0.045, 0.05, 0.035], col: "purse", k: 0.02 },
      { t: "tor", c: [0.07, 0.285, 0.13], R: 0.025, r: 0.008, col: "belt", k: 0.005 },
      { t: "cap", a: [0.07, 0.3, 0.16], b: [0.07, 0.31, 0.165], r: [0.026, 0.026], col: "coin", k: 0.003 },
      { t: "cap", a: [0.1, 0.29, 0.15], b: [0.1, 0.3, 0.16], r: [0.024, 0.024], rot: [0, 0, 0], col: "coin", k: 0.003 },
      // Head: short swept brown hair, sideburns, a short trimmed beard and a broad smile.
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.18, 0.13, 0.19], col: "hair", k: 0.02 },
      { t: "ell", c: [0.08, 0.86, 0.02], r: [0.1, 0.05, 0.14], rot: [0, 0, -12], col: "hair", k: 0.02 },
      { t: "cap", a: [-0.02, 0.76, 0.165], b: [0.02, 0.64, 0.165], r: [0.03, 0.025], col: "hair", mirror: true, k: 0.02 },
      { t: "ell", c: [0.12, 0.57, 0], r: [0.08, 0.045, 0.1], col: "hair", paint: true },
      { t: "cap", a: [0.19, 0.645, -0.03], b: [0.17, 0.64, 0.08], r: [0.01, 0.01], col: "mouth", paint: true },
      // Far hand holds the ledger board up, angled toward us; near hand ticks it with a pen.
      ...rolledArm(-1, [0.06, 0.36, -0.2], [0.2, 0.42, -0.1], "torso", "skin"),
      { t: "box", c: [0.26, 0.5, -0.02], s: [0.012, 0.15, 0.11], round: 0.008, rot: [0, -40, 8], col: "board", k: 0.01 },
      { t: "box", c: [0.27, 0.49, -0.01], s: [0.008, 0.13, 0.095], round: 0.004, rot: [0, -40, 8], col: "paper", k: 0.004 },
      ...[0.55, 0.51, 0.47, 0.43, 0.39].map((y): Shape => ({ t: "box", c: [0.28, y, 0.0], s: [0.012, 0.005, 0.07], round: 0.003, rot: [0, -40, 8], col: "ink", paint: true })),
      { t: "box", c: [0.255, 0.64, -0.025], s: [0.018, 0.022, 0.045], round: 0.008, rot: [0, -40, 8], col: "brass", k: 0.005 },
      ...rolledArm(1, [0.04, 0.36, 0.24], [0.22, 0.46, 0.2], "torso", "skin"),
      { t: "cap", a: [0.2, 0.42, 0.2], b: [0.26, 0.58, 0.18], r: [0.012, 0.009], col: "pen", k: 0.003 },
      { t: "cap", a: [0.26, 0.58, 0.18], b: [0.3, 0.68, 0.17], r: [0.02, 0.003], col: "paper", k: 0.003 },
    ],
    eyes: eyes("#6a4a2a", false, 0.72, 0.03, 0.05),
  },

  // Lince, la Espía: a crouching spy in a grey-green hooded cloak whose hood has lynx ears with black
  // tufts, a scarf over her mouth, amber eyes, a slim dagger low in one hand and a sealed message in the other.
  "lince-espia": {
    palette: {
      skin: "#e2b48e", cloak: "#5e7464", cloakDk: "#3e5046", cloakLt: "#7a907e", inner: "#262c28", tuft: "#1a1c1a", fur: "#d6c4a0",
      scarf: "#262e2a", legs: "#3a4038", boots: "#2a2420", leather: "#5a4636", steel: "#d6dde4", paper: "#f2e8cc", seal: "#3a8a5a",
      torso: "#3e4c42", hair: "#3a2c24",
    },
    shapes: [
      // Cloak spread behind her, cut open at the front.
      { t: "ell", c: [-0.12, 0.28, 0], r: [0.08, 0.28, 0.24], rot: [0, 0, -25], col: "cloak", k: 0.03 },
      { t: "ell", c: [-0.22, 0.06, 0], r: [0.08, 0.04, 0.26], col: "cloakDk", paint: true },
      // Crouch: near knee up, far knee down on the ground.
      { t: "cap", a: [0, 0.24, 0.08], b: [0.17, 0.3, 0.1], r: [0.06, 0.05], col: "legs" },
      { t: "cap", a: [0.17, 0.3, 0.1], b: [0.15, 0.08, 0.1], r: [0.05, 0.045], col: "legs", k: 0.02 },
      { t: "ell", c: [0.19, 0.045, 0.1], r: [0.08, 0.045, 0.055], col: "boots", k: 0.01 },
      { t: "cap", a: [0, 0.22, -0.08], b: [0.08, 0.05, -0.1], r: [0.06, 0.05], col: "legs" },
      { t: "cap", a: [0.08, 0.05, -0.1], b: [-0.14, 0.05, -0.1], r: [0.05, 0.045], col: "legs", k: 0.02 },
      { t: "ell", c: [-0.19, 0.06, -0.1], r: [0.06, 0.05, 0.05], col: "boots", k: 0.01 },
      // Torso leaning forward with a leather strap.
      { t: "ell", c: [0.03, 0.36, 0], r: [0.12, 0.14, 0.13], rot: [0, 0, -15], col: "torso" },
      { t: "cap", a: [0.1, 0.48, 0.09], b: [0.12, 0.28, -0.1], r: [0.016, 0.016], col: "leather", k: 0.01 },
      // Head with a hood; lynx ears with dark tufts; a scarf up over the mouth.
      { t: "ell", c: [0.07, 0.6, 0], r: [0.17, 0.16, 0.16], col: "skin", k: 0.05 },
      { t: "ell", c: [0.0, 0.64, 0], r: [0.2, 0.2, 0.2], col: "cloak", k: 0.04 },
      { t: "ell", c: [0.21, 0.6, 0], r: [0.1, 0.12, 0.15], col: "cloak", cut: true, k: 0.03 },
      { t: "ell", c: [0.08, 0.6, 0], r: [0.14, 0.14, 0.14], col: "skin", k: 0.02 },
      { t: "ell", c: [0.15, 0.72, 0], r: [0.06, 0.03, 0.12], col: "hair", paint: true },
      { t: "tor", c: [0.13, 0.6, 0], R: 0.15, r: 0.02, rot: [0, 0, 90], col: "cloakDk", paint: true },
      { t: "ell", c: [0.1, 0.53, 0], r: [0.13, 0.085, 0.165], col: "scarf", k: 0.02 },
      ...[1, -1].flatMap((s): Shape[] => [
        { t: "cap", a: [-0.02, 0.78, 0.1 * s], b: [-0.04, 0.95, 0.13 * s], r: [0.06, 0.012], col: "cloak", k: 0.03 },
        { t: "ell", c: [0.0, 0.83, 0.135 * s], r: [0.02, 0.05, 0.02], col: "fur", paint: true },
        { t: "cap", a: [-0.035, 0.91, 0.125 * s], b: [-0.06, 1.06, 0.15 * s], r: [0.024, 0.009], col: "tuft", k: 0.01 },
      ]),
      // Shoulder mantle.
      { t: "ell", c: [-0.02, 0.45, 0], r: [0.15, 0.07, 0.2], col: "cloakLt", k: 0.03 },
      // Near hand low and forward with a slim dagger.
      ...arm(1, [0.27, 0.27, 0.2], "torso", "leather", 0.04),
      { t: "box", c: [0.31, 0.27, 0.2], s: [0.008, 0.012, 0.035], round: 0.004, col: "leather", k: 0.004 },
      { t: "cap", a: [0.32, 0.27, 0.2], b: [0.5, 0.22, 0.2], r: [0.022, 0.007], col: "steel", k: 0.004 },
      // Far hand raised by the chest with a folded, sealed message.
      ...arm(-1, [0.2, 0.46, -0.12], "torso", "leather", 0.04),
      { t: "box", c: [0.24, 0.5, -0.08], s: [0.006, 0.05, 0.07], round: 0.004, rot: [0, -40, 12], col: "paper", k: 0.004 },
      { t: "ell", c: [0.25, 0.5, -0.07], r: [0.012, 0.016, 0.016], rot: [0, -40, 0], col: "seal", k: 0.003 },
    ],
    eyes: eyes("#e0a030", true, 0.61, 0.08, 0.047),
  },

  // Tomás Roca, el Inquebrantable: a huge calm bruiser whose skin is granite plates, in a plain brown
  // vest, thick arms crossed over his chest, stone-plated forearms, small calm eyes.
  "tomas-roca": {
    palette: {
      skin: "#7e8189", plate: "#a4a7ad", plate2: "#5f636b", crack: "#3a3c42", vest: "#8a5a34", vestDk: "#5e3a20", legs: "#4a4e58", boots: "#2e2a28",
      belt: "#3a2a1e", brass: "#c9a050", mouth: "#4a3e3a",
    },
    shapes: [
      { t: "ell", c: [0.05, 0.055, 0.12], r: [0.11, 0.06, 0.085], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.08, 0.12], b: [0, 0.26, 0.11], r: [0.08, 0.09], col: "legs", mirror: true },
      // Barrel chest under an open vest.
      { t: "ell", c: [0, 0.46, 0], r: [0.21, 0.23, 0.25], col: "vest" },
      { t: "box", c: [0.2, 0.5, 0], s: [0.04, 0.2, 0.08], round: 0.03, rot: [0, 0, -6], col: "skin", paint: true },
      { t: "tor", c: [0, 0.29, 0], R: 0.2, r: 0.03, col: "belt", k: 0.02 },
      { t: "box", c: [0.205, 0.29, 0], s: [0.015, 0.03, 0.035], round: 0.008, col: "brass", k: 0.005 },
      // Massive shoulders.
      { t: "ell", c: [-0.01, 0.6, 0.2], r: [0.12, 0.11, 0.12], col: "vest", k: 0.06 },
      { t: "ell", c: [-0.01, 0.6, -0.2], r: [0.12, 0.11, 0.12], col: "vest", k: 0.06 },
      // Small head on a thick neck: bald granite with a heavy brow.
      { t: "cap", a: [0, 0.6, 0], b: [0.02, 0.7, 0], r: [0.12, 0.11], col: "skin", k: 0.04 },
      { t: "ell", c: [0.04, 0.8, 0], r: [0.16, 0.16, 0.155], col: "skin", k: 0.04 },
      { t: "ell", c: [0.15, 0.84, 0], r: [0.05, 0.025, 0.12], col: "skin", k: 0.03 },
      { t: "box", c: [0.0, 0.92, 0.05], s: [0.08, 0.05, 0.08], round: 0.04, col: "plate", paint: true },
      ...chain([[0.1, 0.95, -0.04], [0.06, 0.88, 0.02], [0.08, 0.82, 0.1]], 0.007, 0.006, "crack", 0, true),
      ...chain([[-0.08, 0.86, 0.14], [-0.02, 0.78, 0.15], [-0.06, 0.7, 0.13]], 0.007, 0.006, "crack", 0, true),
      { t: "cap", a: [0.19, 0.69, -0.03], b: [0.18, 0.69, 0.05], r: [0.008, 0.008], col: "mouth", paint: true },
      // Arms crossed: far forearm under, near forearm on top.
      { t: "cap", a: [-0.01, 0.6, -0.24], b: [0.14, 0.42, -0.26], r: [0.085, 0.08], col: "skin", k: 0.04 },
      { t: "cap", a: [0.14, 0.42, -0.26], b: [0.26, 0.42, 0.12], r: [0.07, 0.065], col: "skin", k: 0.03 },
      ...blocks([0.14, 0.42, -0.26], [0.26, 0.42, 0.12], 3, 0.078),
      { t: "ell", c: [0.25, 0.43, 0.17], r: [0.075, 0.07, 0.07], col: "skin", k: 0.02 },
      { t: "cap", a: [-0.01, 0.6, 0.24], b: [0.16, 0.44, 0.27], r: [0.09, 0.085], col: "skin", k: 0.04 },
      { t: "cap", a: [0.16, 0.44, 0.27], b: [0.3, 0.5, -0.12], r: [0.075, 0.07], col: "skin", k: 0.03 },
      ...blocks([0.16, 0.44, 0.27], [0.3, 0.5, -0.12], 3, 0.085),
      { t: "ell", c: [0.28, 0.5, -0.17], r: [0.075, 0.07, 0.07], col: "skin", k: 0.02 },
      // Raised granite plates on forearms, shoulders and crown.
      ...granite([-0.01, 0.6, 0.24], [0.16, 0.44, 0.27], 2, 0.075),
      ...granite([0.0, 0.84, 0.12], [0.06, 0.84, -0.12], 3, 0.1),
    ],
    eyes: eyes("#6a8aa0", true, 0.79, 0.06, 0.042),
  },

  // Ascua, la Guardiana: a guardian in orange-and-charcoal plate with a round glowing ember disc on her
  // chest, hair like rising flame, embers drifting around her, one palm thrust forward hurling a fireball.
  "ascua-guardiana": {
    palette: {
      skin: "#e8b08a", armor: "#e2742c", armor2: "#b4501e", torso: "#2e2a2c", char2: "#4a4442", legs: "#2e2a2c", boots: "#e2742c",
      hair: "#d8401a", fire: "#ff7a1e", fire2: "#ffb43a", core: "#fff3b8", mouth: "#8a3a34",
    },
    glow: ["fire", "fire2", "core"],
    shapes: [
      // Flame wreath rising behind her.
      ...flameShape([-0.18, 0.3, -0.24], 0.38, "fire", 0.03),
      ...flameShape([-0.2, 0.4, 0.22], 0.32, "fire", 0.03),
      ...flameShape([-0.26, 0.55, 0], 0.42, "fire2", 0.03),
      ...body({ torso: [0.13, 0.16, 0.15] }),
      // Armour: knee guards, chest plate, pauldrons, belt.
      { t: "ell", c: [0.04, 0.17, 0.075], r: [0.05, 0.05, 0.05], col: "armor", mirror: true, k: 0.01 },
      { t: "ell", c: [0.02, 0.44, 0], r: [0.13, 0.12, 0.155], col: "armor", k: 0.02 },
      { t: "ell", c: [0.08, 0.36, 0], r: [0.08, 0.04, 0.15], col: "armor2", paint: true },
      { t: "tor", c: [0, 0.29, 0], R: 0.135, r: 0.022, col: "char2" },
      { t: "ell", c: [-0.01, 0.55, 0.16], r: [0.09, 0.06, 0.08], col: "armor", mirror: true, k: 0.02 },
      { t: "ell", c: [-0.01, 0.52, 0.17], r: [0.09, 0.03, 0.09], col: "armor2", mirror: true, paint: true },
      // Round ember emblem on the chest.
      { t: "ell", c: [0.15, 0.45, 0.02], r: [0.025, 0.065, 0.065], rot: [0, -25, 0], col: "torso", k: 0.01 },
      { t: "ell", c: [0.165, 0.45, 0.025], r: [0.02, 0.045, 0.045], rot: [0, -25, 0], col: "fire2", k: 0.005 },
      { t: "ell", c: [0.175, 0.45, 0.03], r: [0.015, 0.024, 0.024], rot: [0, -25, 0], col: "core", k: 0.004 },
      // Head and rising flame hair.
      { t: "ell", c: [-0.05, 0.79, 0], r: [0.18, 0.13, 0.19], col: "hair", k: 0.02 },
      { t: "ell", c: [0.1, 0.84, 0.02], r: [0.09, 0.045, 0.14], rot: [0, 0, -15], col: "hair", paint: true },
      { t: "cap", a: [-0.03, 0.78, 0.16], b: [0.0, 0.64, 0.165], r: [0.035, 0.02], col: "hair", mirror: true, k: 0.02 },
      spike([-0.02, 0.88, 0.06], 105, 0.18, [0.07, 0.01], "hair", 0.04),
      spike([-0.08, 0.86, -0.06], 125, 0.2, [0.07, 0.01], "hair", 0.04),
      spike([-0.14, 0.8, 0.0], 150, 0.2, [0.07, 0.01], "hair", 0.04),
      spike([0.0, 1.0, 0.06], 100, 0.08, [0.025, 0.005], "fire", 0.02),
      spike([-0.13, 1.0, -0.06], 125, 0.08, [0.025, 0.005], "fire", 0.02),
      { t: "cap", a: [0.19, 0.64, -0.02], b: [0.17, 0.635, 0.06], r: [0.008, 0.008], col: "mouth", paint: true },
      // Near arm: armoured fist clenched by her side.
      ...arm(1, [0.1, 0.3, 0.24], "torso", "armor"),
      // Far arm thrust out to the side, open palm, a fireball leaving it.
      ...arm(-1, [0.36, 0.56, -0.22], "torso", "armor"),
      { t: "tor", c: [0.28, 0.545, -0.21], R: 0.045, r: 0.014, rot: [0, 0, 90], col: "armor2", k: 0.01 },
      ...[-0.03, -0.01, 0.01, 0.03].map((dz, i): Shape => ({ t: "cap", a: [0.38, 0.58, -0.22 + dz], b: [0.39, 0.64 - Math.abs(i - 1.5) * 0.012, -0.22 + dz * 1.3], r: [0.012, 0.01], col: "armor", k: 0.008 })),
      { t: "cap", a: [0.42, 0.6, -0.24], b: [0.56, 0.62, -0.3], r: [0.015, 0.07], col: "fire", k: 0.04 },
      { t: "ell", c: [0.64, 0.64, -0.34], r: [0.1, 0.1, 0.1], col: "fire", k: 0.04 },
      { t: "ell", c: [0.67, 0.65, -0.32], r: [0.075, 0.075, 0.075], col: "fire2", k: 0.01 },
      { t: "ell", c: [0.7, 0.655, -0.29], r: [0.045, 0.045, 0.045], col: "core", k: 0.01 },
      // Drifting embers.
      ...([[0.3, 0.9, 0.1, 0.02], [-0.32, 1.0, 0.05, 0.016], [0.36, 0.3, -0.1, 0.018], [-0.35, 0.3, 0.2, 0.015], [0.2, 1.02, -0.05, 0.013]] as number[][]).map(([x, y, z, r]) => dot([x, y, z], r, "fire2")),
    ],
    eyes: eyes("#e8902a", true, 0.72, 0.03, 0.05),
  },

  // Salón de la Guardia: the Guard's stately hall on a floating rock islet — four columns, a pediment,
  // a great studded wooden door under a blue-and-gold banner, warm lit windows, a slim tower behind,
  // glowing runes on the rock.
  "salon-guardia": {
    palette: {
      roofS: "#dcd2bc", stone: "#e8dfcb", stone2: "#c6b99c", roof: "#3f5f8f", wood: "#8a5228", woodDk: "#5e3418", brass: "#e0b04a",
      window: "#ffcf6a", banner: "#2c4a86", gold: "#f0c24a", rock: "#8a7a6a", rock2: "#6a5c50", grass: "#6aa04a", rune: "#7fe6ff", pole: "#5a4030",
      flag: "#c8323a",
    },
    glow: ["window", "rune"],
    shapes: [
      // Pediment (two thick slopes, trimmed flat underneath).
      { t: "box", c: [-0.2, 0.75, 0.06], s: [0.25, 0.08, 0.17], round: 0.01, rot: [0, 0, 22], col: "stone", k: 0 },
      { t: "box", c: [0.2, 0.75, 0.06], s: [0.25, 0.08, 0.17], round: 0.01, rot: [0, 0, -22], col: "stone", k: 0 },
      { t: "box", c: [0, 0.6, 0.06], s: [0.6, 0.08, 0.3], round: 0, col: "stone", cut: true, k: 0 },
      { t: "box", c: [0, 0.98, 0.06], s: [0.1, 0.1, 0.3], round: 0, col: "stone", cut: true, k: 0 },
      { t: "box", c: [-0.2, 0.78, 0.06], s: [0.27, 0.02, 0.19], round: 0.01, rot: [0, 0, 22], col: "roof", k: 0.005 },
      { t: "box", c: [0.2, 0.78, 0.06], s: [0.27, 0.02, 0.19], round: 0.01, rot: [0, 0, -22], col: "roof", k: 0.005 },
      { t: "ell", c: [0, 0.75, 0.24], r: [0.045, 0.045, 0.015], col: "gold", k: 0.005 },
      // Slim tower behind with a cone roof and a flag.
      { t: "cap", a: [-0.24, 0.3, -0.2], b: [-0.24, 1.08, -0.2], r: [0.08, 0.07], col: "stone2", k: 0.02 },
      { t: "box", c: [-0.24, 0.9, -0.12], s: [0.02, 0.04, 0.01], round: 0.008, col: "window", paint: true },
      { t: "cap", a: [-0.24, 1.08, -0.2], b: [-0.24, 1.28, -0.2], r: [0.11, 0.006], col: "roof", k: 0.02 },
      { t: "cap", a: [-0.24, 1.28, -0.2], b: [-0.24, 1.38, -0.2], r: [0.006, 0.006], col: "pole", k: 0 },
      { t: "cap", a: [-0.24, 1.37, -0.2], b: [-0.12, 1.35, -0.2], r: [0.025, 0.004], col: "flag", k: 0.01 },
      // Floating rock islet with grass on top and runes glowing on its flank.
      { t: "box", c: [0, 0.1, 0], s: [0.5, 0.06, 0.34], round: 0.05, col: "rock", k: 0.04 },
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.12, 0.36], col: "rock", k: 0.04 },
      { t: "cap", a: [0, -0.06, 0], b: [0.04, -0.44, 0.02], r: [0.24, 0.03], col: "rock", k: 0.1 },
      { t: "ell", c: [-0.22, -0.1, 0.06], r: [0.2, 0.1, 0.2], col: "rock2", k: 0.05 },
      { t: "ell", c: [0.24, -0.12, 0.04], r: [0.18, 0.1, 0.2], col: "rock", k: 0.05 },
      { t: "box", c: [0, 0.16, 0], s: [0.52, 0.02, 0.36], round: 0.02, col: "grass", paint: true },
      ...chain([[-0.2, 0.0, 0.3], [-0.14, -0.08, 0.3], [-0.08, 0.0, 0.3], [-0.02, -0.08, 0.28]], 0.012, 0.012, "rune", 0, true),
      ...chain([[0.1, -0.12, 0.26], [0.14, -0.04, 0.26], [0.18, -0.12, 0.25]], 0.012, 0.012, "rune", 0, true),
      // Plinth and front steps.
      { t: "box", c: [0, 0.2, 0.02], s: [0.42, 0.035, 0.26], round: 0.01, col: "stone2", k: 0.005 },
      { t: "box", c: [0, 0.17, 0.27], s: [0.18, 0.02, 0.04], round: 0.008, col: "stone2", k: 0.005 },
      // Hall body.
      { t: "box", c: [0, 0.42, -0.04], s: [0.36, 0.2, 0.16], round: 0.01, col: "stone", k: 0.01 },
      // Entablature.
      { t: "box", c: [0, 0.645, 0.06], s: [0.42, 0.04, 0.18], round: 0.01, col: "stone2", k: 0.005 },
      // Columns.
      ...[-0.3, -0.12, 0.12, 0.3].flatMap((x): Shape[] => [
        { t: "cap", a: [x, 0.25, 0.18], b: [x, 0.6, 0.18], r: [0.032, 0.028], col: "stone", k: 0.005 },
        { t: "box", c: [x, 0.6, 0.18], s: [0.045, 0.015, 0.045], round: 0.006, col: "stone2", k: 0.004 },
        { t: "box", c: [x, 0.245, 0.18], s: [0.045, 0.015, 0.045], round: 0.006, col: "stone2", k: 0.004 },
      ]),
      // Great wooden door with an arched top, iron bands, a brass ring.
      { t: "box", c: [0, 0.33, 0.13], s: [0.075, 0.1, 0.02], round: 0.01, col: "wood", k: 0.005 },
      { t: "ell", c: [0, 0.43, 0.13], r: [0.075, 0.06, 0.02], col: "wood", k: 0.005 },
      { t: "box", c: [0, 0.38, 0.15], s: [0.004, 0.14, 0.01], round: 0.002, col: "woodDk", paint: true },
      ...[0.3, 0.4].map((y): Shape => ({ t: "box", c: [0, y, 0.15], s: [0.08, 0.006, 0.01], round: 0.002, col: "woodDk", paint: true })),
      { t: "tor", c: [0.03, 0.34, 0.152], R: 0.014, r: 0.004, rot: [90, 0, 0], col: "brass", k: 0 },
      // Banner over the door with a gold tower rune.
      { t: "box", c: [0, 0.56, 0.155], s: [0.055, 0.06, 0.006], round: 0.004, col: "banner", k: 0.003 },
      { t: "cap", a: [-0.055, 0.5, 0.155], b: [0, 0.47, 0.155], r: [0.006, 0.006], col: "banner", k: 0.01 },
      { t: "cap", a: [0.055, 0.5, 0.155], b: [0, 0.47, 0.155], r: [0.006, 0.006], col: "banner", k: 0.01 },
      { t: "box", c: [0, 0.55, 0.163], s: [0.012, 0.035, 0.003], round: 0.002, col: "gold", k: 0 },
      { t: "box", c: [0, 0.59, 0.163], s: [0.025, 0.008, 0.003], round: 0.002, col: "gold", k: 0 },
      // Lit windows either side of the door.
      ...[-0.21, 0.21].flatMap((x): Shape[] => [
        { t: "box", c: [x, 0.4, 0.122], s: [0.04, 0.06, 0.006], round: 0.004, col: "window", k: 0 },
        { t: "ell", c: [x, 0.46, 0.122], r: [0.04, 0.03, 0.006], col: "window", k: 0 },
        { t: "box", c: [x, 0.42, 0.13], s: [0.004, 0.08, 0.004], round: 0.002, col: "woodDk", k: 0 },
      ]),
      // Small floating rocks nearby.
      { t: "ell", c: [0.55, 0.5, 0.1], r: [0.06, 0.04, 0.05], col: "rock", k: 0.01 },
      { t: "cap", a: [0.55, 0.48, 0.1], b: [0.56, 0.4, 0.1], r: [0.045, 0.005], col: "rock2", k: 0.02 },
      { t: "ell", c: [-0.56, 0.75, 0.0], r: [0.045, 0.03, 0.04], col: "rock", k: 0.01 },
      { t: "cap", a: [-0.56, 0.74, 0.0], b: [-0.55, 0.68, 0.0], r: [0.035, 0.005], col: "rock2", k: 0.02 },
    ],
    eyes: [],
  },

  // Equipo de Sanadores: an open leather healer's satchel with corked vials (rose, blue, amber), a
  // bandage roll unspooling in front, a glowing green herb sprig rising from it, a small lantern beside.
  "equipo-sanadores": {
    palette: {
      leather: "#9a6236", leatherDk: "#6a3e20", inner: "#3a2414", brass: "#e0b04a", glass: "#dff4f6", cork: "#b48a5a",
      vial1: "#e8607a", vial2: "#4a8ae0", vial3: "#f0a830", bandage: "#f6f1e6", bandage2: "#d8d0c0", herb: "#6ef06a", herb2: "#2fb04a",
      stem: "#3a8a3a", light: "#fff2c0", flame: "#ffcc5a", glint: "#ffffff",
    },
    glow: ["herb", "light", "flame", "glint"],
    shapes: [
      // Satchel: open top, flap thrown back, front pocket with a stitched leaf.
      { t: "box", c: [0, 0.2, 0], s: [0.3, 0.18, 0.14], round: 0.07, col: "leather" },
      { t: "box", c: [0, 0.38, 0], s: [0.26, 0.06, 0.11], round: 0.03, col: "inner", cut: true, k: 0.02 },
      { t: "box", c: [0, 0.31, 0], s: [0.25, 0.012, 0.1], round: 0.01, col: "inner", k: 0 },
      { t: "box", c: [0, 0.28, -0.19], s: [0.28, 0.12, 0.014], round: 0.012, rot: [-25, 0, 0], col: "leatherDk", k: 0.02 },
      { t: "box", c: [0, 0.15, 0.145], s: [0.17, 0.08, 0.02], round: 0.03, col: "leatherDk", k: 0.02 },
      { t: "ell", c: [0, 0.15, 0.165], r: [0.05, 0.022, 0.01], rot: [0, 0, 35], col: "herb2", paint: true },
      { t: "box", c: [0, 0.23, 0.17], s: [0.022, 0.018, 0.01], round: 0.005, col: "brass", k: 0.004 },
      // Strap.
      ...chain([[-0.3, 0.3, -0.06], [-0.33, 0.1, -0.2], [-0.24, 0.015, -0.3], [0.0, 0.015, -0.34], [0.24, 0.015, -0.3], [0.33, 0.1, -0.2], [0.3, 0.3, -0.06]], 0.016, 0.016, "leatherDk", 0.01),
      ...[0.3, -0.3].map((x): Shape => ({ t: "tor", c: [x, 0.3, -0.06], R: 0.025, r: 0.008, rot: [0, 0, 90], col: "brass", k: 0 })),
      // Vials standing in the bag.
      ...([[-0.18, 0.04, 0.24, "vial1"], [-0.08, -0.03, 0.3, "vial2"], [0.18, 0.02, 0.26, "vial3"]] as [number, number, number, string][]).flatMap(([x, z, h, col]): Shape[] => [
        { t: "cap", a: [x, 0.26, z], b: [x, 0.26 + h, z], r: [0.04, 0.03], col: "glass", k: 0.005 },
        { t: "ell", c: [x, 0.3, z], r: [0.05, h * 0.55, 0.05], col, paint: true },
        { t: "cap", a: [x, 0.26 + h, z], b: [x, 0.3 + h, z], r: [0.024, 0.026], col: "cork", k: 0.005 },
      ]),
      // Glowing herb sprig.
      ...chain([[0.05, 0.3, 0.02], [0.06, 0.45, 0.03], [0.04, 0.6, 0.04], [0.07, 0.72, 0.04]], 0.012, 0.008, "stem", 0.005),
      ...([[0.06, 0.45, 35], [0.06, 0.48, 150], [0.05, 0.57, 30], [0.04, 0.6, 160], [0.07, 0.7, 60], [0.07, 0.72, 120]] as number[][]).map(([x, y, a]): Shape => ({ t: "ell", c: [x + Math.cos(rad(a)) * 0.06, y + Math.sin(rad(a)) * 0.06, 0.04], r: [0.065, 0.026, 0.012], rot: [0, 0, a], col: "herb", k: 0.01 })),
      ...sparkle([0.2, 0.74, 0.08], 0.05, "glint"),
      ...sparkle([-0.12, 0.72, 0.06], 0.04, "glint"),
      // Bandage roll in front, its tail unspooling.
      { t: "cap", a: [0.26, 0.07, 0.24], b: [0.42, 0.07, 0.2], r: [0.07, 0.07], col: "bandage", k: 0.005 },
      { t: "tor", c: [0.34, 0.07, 0.22], R: 0.07, r: 0.004, rot: [0, -14, 90], col: "bandage2", paint: true },
      { t: "box", c: [0.12, 0.006, 0.3], s: [0.16, 0.005, 0.05], round: 0.004, rot: [0, -14, 0], col: "bandage", k: 0.01 },
      // Small brass lantern on the left.
      { t: "box", c: [-0.44, 0.02, 0.12], s: [0.07, 0.02, 0.07], round: 0.01, col: "brass", k: 0.005 },
      { t: "box", c: [-0.44, 0.13, 0.12], s: [0.055, 0.09, 0.055], round: 0.01, col: "light", k: 0.005 },
      ...([[0.055, 0.055], [0.055, -0.055], [-0.055, 0.055], [-0.055, -0.055]] as number[][]).map(([dx, dz]): Shape => ({ t: "cap", a: [-0.44 + dx, 0.03, 0.12 + dz], b: [-0.44 + dx, 0.23, 0.12 + dz], r: [0.01, 0.01], col: "brass", k: 0 })),
      { t: "ell", c: [-0.44, 0.13, 0.12], r: [0.025, 0.045, 0.025], col: "flame", k: 0 },
      { t: "cap", a: [-0.44, 0.23, 0.12], b: [-0.44, 0.27, 0.12], r: [0.06, 0.02], col: "brass", k: 0.01 },
      { t: "tor", c: [-0.44, 0.31, 0.12], R: 0.03, r: 0.007, rot: [90, 0, 0], col: "brass", k: 0 },
    ],
    eyes: [],
  },

  // Golpe Anticipado: an armoured steel-and-brass forearm rising to block, catching an incoming dark
  // blade on the vambrace in a bright spark; a small glowing hourglass rune on the vambrace and a faint
  // clock ring behind — the hero acts first.
  "golpe-anticipado": {
    palette: {
      steel: "#7a8ca8", steel2: "#4e5e7a", brass: "#e0b04a", cuff: "#3a4660", blade: "#4a4458", bladeLt: "#8a849a", hilt: "#5a2a3a",
      spark: "#fff4b0", spark2: "#ffc24a", glint: "#ffffff", glass: "#d8f4ff", sand: "#ffe08a", ring: "#9fe6ff",
    },
    glow: ["spark", "spark2", "glint", "ring", "sand"],
    shapes: [
      // Clock ring behind with twelve ticks.
      { t: "tor", c: [0.02, 0.62, -0.3], R: 0.46, r: 0.012, rot: [90, 0, 0], col: "ring", k: 0 },
      ...Array.from({ length: 12 }, (_, i): Shape => {
        const a = rad(i * 30);
        return { t: "cap", a: [0.02 + Math.cos(a) * 0.42, 0.62 + Math.sin(a) * 0.42, -0.3], b: [0.02 + Math.cos(a) * 0.38, 0.62 + Math.sin(a) * 0.38, -0.3], r: [i % 3 ? 0.008 : 0.016, i % 3 ? 0.008 : 0.016], col: "ring", k: 0 };
      }),
      // The armoured forearm, fist up, rising from the lower left.
      ...place(rotZ(punch("steel", "cuff"), 62), 1.5, [-0.05, 0.56, 0]),
      { t: "cap", a: [-0.38, -0.12, 0], b: [-0.22, 0.2, 0], r: [0.17, 0.165], col: "steel", k: 0.03 },
      ...[0.0, 0.14].map((t): Shape => ({ t: "tor", c: [-0.31 + t * 0.5, 0.02 + t, 0], R: 0.17, r: 0.022, rot: [0, 0, -28], col: "brass", k: 0.01 })),
      { t: "box", c: [-0.22, 0.13, 0.15], s: [0.07, 0.11, 0.02], round: 0.02, rot: [0, 0, -28], col: "steel2", k: 0.02 },
      ...hourglass([-0.22, 0.13, 0.18], 0.13, "brass", "glass", "sand"),
      // The incoming blade from the upper right, stopped against the fist.
      { t: "box", c: [0.38, 0.74, 0], s: [0.25, 0.06, 0.012], round: 0.01, rot: [0, 0, 32], col: "blade", k: 0 },
      { t: "box", c: [0.38, 0.755, 0.005], s: [0.22, 0.008, 0.006], round: 0.003, rot: [0, 0, 32], col: "bladeLt", k: 0 },
      { t: "box", c: [0.6, 0.88, 0], s: [0.02, 0.12, 0.035], round: 0.008, rot: [0, 0, 32], col: "brass", k: 0.005 },
      { t: "cap", a: [0.62, 0.89, 0], b: [0.74, 0.965, 0], r: [0.03, 0.026], col: "hilt", k: 0.005 },
      dot([0.76, 0.98, 0], 0.04, "brass", 0.005),
      // Clash spark at the point of contact.
      ...burst([0.15, 0.66, 0.06], 10, 10, 0.22, [0.035, 0.004], "spark", { len: 0.13, r: [0.03, 0.004], col: "spark2" }, 0.02),
      dot([0.15, 0.66, 0.06], 0.05, "spark", 0.02),
      ...sparkle([0.36, 0.42, 0.08], 0.06, "glint"),
      ...sparkle([-0.08, 0.98, 0.06], 0.05, "glint"),
    ],
    eyes: [],
  },
};
