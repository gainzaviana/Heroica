import type { Sculpt, Shape, V3 } from "../sculpt";
import { SKIN, arm, body, burst, eyes, rad, turn } from "./kit";

// Album cards for Centella, Mole and Soberano's rebuilt decks — art batch 3. Valdoria: floating
// towers, old runes, the city of Aurelia; the Guardia de Aurelia wears deep blue and gold. Original
// designs only: a glider scout, a forest rogue and her squirrel, a ruby-fisted boxer, a street judge,
// a lantern-badge agent, the neighbourhood watch, the Guard's tower and the Council's bastion.

// MARK: Helpers

/** Small spheres (sparks, rivets, buttons). */
const dot = (c: V3, r: number, col: string, k = 0): Shape => ({ t: "ell", c, r: [r, r, r], col, k });

/** A polyline of capsules through points, radius tapering r0 → r1. */
function chain(pts: V3[], r0: number, r1: number, col: string, k = 0.01, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
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

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

/** A five-point star facing +z at c (outer radius R). */
function star(c: V3, R: number, col: string, k = 0.01): Shape[] {
  return [
    { t: "ell", c, r: [R * 0.42, R * 0.42, R * 0.25], col, k },
    ...Array.from({ length: 5 }, (_, i): Shape => {
      const a = rad(90 + i * 72);
      return { t: "cap", a: c, b: [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2]], r: [R * 0.3, R * 0.04], col, k };
    }),
  ];
}

/** A heater shield facing +z at c (half width w): a squared top tapering to a point. */
function shield(c: V3, w: number, d: number, col: string, k = 0.005): Shape[] {
  return [
    { t: "box", c: [c[0], c[1] + w * 0.35, c[2]], s: [w, w * 0.55, d], round: w * 0.2, col, k },
    { t: "box", c: [c[0], c[1] - w * 0.2, c[2]], s: [w * 0.7, w * 0.7, d], round: w * 0.12, rot: [0, 0, 45], col, k },
  ];
}

/** An acorn (cup up), centred at c, size s. */
function acorn(c: V3, s: number, nut: string, cup: string): Shape[] {
  return [
    { t: "ell", c: [c[0], c[1] - s * 0.15, c[2]], r: [s * 0.75, s, s * 0.75], col: nut, k: 0.005 },
    { t: "ell", c: [c[0], c[1] + s * 0.45, c[2]], r: [s * 0.85, s * 0.45, s * 0.85], col: cup, k: 0.005 },
    { t: "cap", a: [c[0], c[1] + s * 0.8, c[2]], b: [c[0] + s * 0.15, c[1] + s * 1.15, c[2]], r: [s * 0.16, s * 0.1], col: cup, k: 0.004 },
  ];
}

/** A small hanging lantern: brass cap and base, glowing glass, a ring on top. Centre c, height h. */
function lantern(c: V3, h: number, brass: string, light: string): Shape[] {
  const [x, y, z] = c;
  return [
    { t: "cap", a: [x, y - h * 0.3, z], b: [x, y + h * 0.3, z], r: [h * 0.32, h * 0.32], col: light, k: 0.01 },
    { t: "cap", a: [x, y + h * 0.3, z], b: [x, y + h * 0.5, z], r: [h * 0.38, h * 0.1], col: brass, k: 0.01 },
    { t: "box", c: [x, y - h * 0.38, z], s: [h * 0.36, h * 0.08, h * 0.36], round: h * 0.05, col: brass, k: 0.005 },
    ...([[1, 1], [1, -1], [-1, 1], [-1, -1]] as number[][]).map(([dx, dz]): Shape => ({ t: "cap", a: [x + dx * h * 0.25, y - h * 0.32, z + dz * h * 0.25], b: [x + dx * h * 0.25, y + h * 0.32, z + dz * h * 0.25], r: [h * 0.05, h * 0.05], col: brass, k: 0 })),
    { t: "tor", c: [x, y + h * 0.62, z], R: h * 0.12, r: h * 0.04, rot: [90, 0, 0], col: brass, k: 0 },
  ];
}

/** A floating rock islet under a building: flat top, a hanging point, runes on the flank. */
function islet(w: number, d: number, depth: number): Shape[] {
  return [
    { t: "ell", c: [0, 0.02, 0], r: [w, 0.1, d], col: "rock", k: 0.04 },
    { t: "cap", a: [0, -0.04, 0], b: [0.03, -depth, 0.02], r: [w * 0.5, 0.03], col: "rock", k: 0.1 },
    { t: "ell", c: [-w * 0.45, -0.1, d * 0.2], r: [w * 0.4, 0.1, d * 0.55], col: "rock2", k: 0.05 },
    { t: "ell", c: [w * 0.45, -0.12, d * 0.1], r: [w * 0.38, 0.1, d * 0.55], col: "rock", k: 0.05 },
    { t: "ell", c: [0, 0.1, 0], r: [w * 1.02, 0.02, d * 1.02], col: "grass", paint: true },
  ];
}

// MARK: Vigía Alado

/** A glider wing fanned up and back from a hub at the shoulder blade, in the picture plane at depth z:
 * brass ribs at the given angles (degrees from +x), canvas panels between them alternating cream and blue. */
function wing(hub: V3, angles: number[], lens: number[]): Shape[] {
  const out: Shape[] = [];
  const tip = (i: number): V3 => [hub[0] + Math.cos(rad(angles[i])) * lens[i], hub[1] + Math.sin(rad(angles[i])) * lens[i], hub[2]];
  for (let i = 0; i + 1 < angles.length; i++) {
    const m = (angles[i] + angles[i + 1]) / 2, L = (lens[i] + lens[i + 1]) / 2;
    out.push({ t: "ell", c: [hub[0] + Math.cos(rad(m)) * L * 0.5, hub[1] + Math.sin(rad(m)) * L * 0.5, hub[2]], r: [L * 0.5, L * 0.21, 0.018], rot: [0, 0, m], col: i % 2 ? "blue" : "canvas", k: 0.015 });
  }
  for (let i = 0; i < angles.length; i++) out.push({ t: "cap", a: hub, b: tip(i), r: [i === 0 ? 0.026 : 0.016, i === 0 ? 0.014 : 0.009], col: "brass", k: 0.01 });
  out.push({ t: "cap", a: [hub[0] - 0.02, hub[1], hub[2] - 0.03 * Math.sign(hub[2])], b: [hub[0], hub[1], hub[2] + 0.02 * Math.sign(hub[2])], r: [0.04, 0.04], col: "brassDk", k: 0.01 });
  return out;
}

const VIGIA: Shape[] = [
  // Glider frame on the back: a leather pack with a brass hub, wings fanned out.
  { t: "box", c: [-0.13, 0.48, 0], s: [0.05, 0.12, 0.1], round: 0.04, col: "leather", k: 0.02 },
  { t: "cap", a: [-0.16, 0.58, -0.1], b: [-0.16, 0.58, 0.1], r: [0.035, 0.035], col: "brass", k: 0.01 },
  ...wing([-0.12, 0.6, -0.2], [62, 88, 114, 140, 166], [0.5, 0.6, 0.62, 0.56, 0.44]),
  ...wing([-0.14, 0.58, 0.2], [80, 108, 136, 164, 190], [0.52, 0.62, 0.64, 0.56, 0.42]),
  // Body leaning into the hover, legs trailing.
  { t: "ell", c: [-0.06, 0.06, 0.075], r: [0.075, 0.055, 0.06], rot: [0, 0, -40], col: "boots", mirror: true },
  { t: "cap", a: [0, 0.28, 0.07], b: [-0.05, 0.09, 0.075], r: [0.065, 0.055], col: "legs", mirror: true },
  { t: "ell", c: [0, 0.4, 0], r: [0.13, 0.16, 0.15], col: "torso" },
  { t: "ell", c: [0.06, 0.31, 0], r: [0.1, 0.07, 0.15], col: "torso", k: 0.04 },
  { t: "ell", c: [0.05, 0.3, 0], r: [0.12, 0.06, 0.16], col: "torsoDk", paint: true },
  { t: "tor", c: [0, 0.3, 0], R: 0.135, r: 0.02, col: "gold" },
  // Harness straps crossing the chest, a brass buckle.
  { t: "cap", a: [0.06, 0.54, 0.12], b: [0.13, 0.36, -0.06], r: [0.016, 0.016], col: "leather", k: 0.005 },
  { t: "cap", a: [0.06, 0.54, -0.12], b: [0.13, 0.36, 0.06], r: [0.016, 0.016], col: "leather", k: 0.005 },
  dot([0.135, 0.44, 0], 0.022, "brass"),
  // Gold shoulder trims.
  // Head with a blue scout's cap (gold band, a white plume), hair tufts, a gold scarf streaming back.
  { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
  { t: "ell", c: [-0.03, 0.78, 0], r: [0.18, 0.13, 0.19], col: "hair", k: 0.02 },
  { t: "ell", c: [-0.02, 0.84, 0], r: [0.17, 0.1, 0.17], col: "blue", k: 0.02 },
  { t: "tor", c: [-0.01, 0.8, 0], R: 0.168, r: 0.018, col: "gold", k: 0.005 },
  { t: "ell", c: [0.17, 0.81, 0], r: [0.06, 0.012, 0.11], rot: [0, 0, -15], col: "blue", k: 0.01 },
  { t: "ell", c: [-0.12, 0.92, 0.1], r: [0.11, 0.025, 0.02], rot: [0, 0, 25], col: "plume", k: 0.02 },
  { t: "ell", c: [0.0, 0.53, 0], r: [0.12, 0.045, 0.14], col: "gold", k: 0.02 },
  ...chain([[-0.08, 0.54, 0.08], [-0.22, 0.56, 0.14], [-0.36, 0.52, 0.12], [-0.46, 0.56, 0.16]], 0.035, 0.015, "gold", 0.02),
  { t: "cap", a: [0.19, 0.63, -0.04], b: [0.18, 0.625, 0.03], r: [0.008, 0.008], col: "mouth", paint: true },
  // Both hands hold a brass spyglass to the far eye, aimed down at the city.
  ...arm(-1, [0.28, 0.6, -0.12], "torso", "glove"),
  ...arm(1, [0.32, 0.47, 0.03], "torso", "glove"),
  { t: "cap", a: [0.18, 0.69, -0.05], b: [0.38, 0.5, -0.06], r: [0.026, 0.036], col: "brass", k: 0.005 },
  { t: "tor", c: [0.24, 0.633, -0.052], R: 0.03, r: 0.008, rot: [0, 0, -134], col: "brassDk", k: 0 },
  { t: "tor", c: [0.36, 0.52, -0.058], R: 0.038, r: 0.009, rot: [0, 0, -134], col: "brassDk", k: 0 },
  { t: "ell", c: [0.39, 0.49, -0.06], r: [0.028, 0.012, 0.028], rot: [0, 0, -134], col: "lens", k: 0 },
];

// MARK: Nuez

const SQUIRREL: Shape[] = [
  { t: "ell", c: [0, 0, 0], r: [0.055, 0.05, 0.042], col: "sq", k: 0.02 },
  { t: "ell", c: [0.025, -0.01, 0.0], r: [0.035, 0.035, 0.035], col: "sqBelly", paint: true },
  { t: "ell", c: [0.05, 0.06, 0], r: [0.042, 0.038, 0.038], col: "sq", k: 0.02 },
  { t: "ell", c: [0.088, 0.05, 0], r: [0.016, 0.014, 0.016], col: "sqBelly", k: 0.008 },
  dot([0.104, 0.054, 0], 0.008, "nose"),
  { t: "cap", a: [0.04, 0.09, 0.02], b: [0.035, 0.125, 0.028], r: [0.014, 0.005], col: "sq", k: 0.006 },
  { t: "cap", a: [0.04, 0.09, -0.02], b: [0.035, 0.125, -0.028], r: [0.014, 0.005], col: "sq", k: 0.006 },
  ...chain([[-0.05, -0.02, 0], [-0.1, 0.04, 0], [-0.1, 0.12, 0], [-0.06, 0.17, 0]], 0.03, 0.04, "sq", 0.02),
  dot([-0.06, 0.17, 0], 0.04, "sqTip", 0.02),
  { t: "cap", a: [0.04, -0.02, 0.025], b: [0.075, 0.02, 0.03], r: [0.012, 0.01], col: "sq", k: 0.01 },
];

export const artAlbum3: Record<string, Sculpt> = {
  // Vigía Alado: a Guard scout hovering on brass-and-canvas glider wings strapped to a back frame, in a
  // blue tunic with gold trims, a blue cap with a white plume and a gold scarf, peering down through a spyglass.
  "vigia-alado": {
    palette: {
      skin: SKIN, hair: "#6a4428", torso: "#2c4a8a", torsoDk: "#22396c", legs: "#3a3e52", boots: "#5a3a24", glove: "#8a5a34",
      blue: "#2c4a8a", gold: "#f0c24a", plume: "#f6f1e6", leather: "#7a4e2c", brass: "#d8a640", brassDk: "#9a6e24",
      canvas: "#f0e6cc", lens: "#bff0ff", mouth: "#8a3a34",
    },
    glow: ["lens"],
    shapes: rotZ(VIGIA, -22, [0, 0.45, 0]),
    eyes: [{ at: [0.02, 0.7, 0.085], r: 0.052, iris: "#3a6ab0", look: [0.75, -0.06, 0.6] }],
  },

  // Nuez, la Pícara del Bosque: a cheerful rogue girl in moss green under a brown hooded cloak whose
  // back curls up into a huge bushy tail, an acorn pouch on her hip, flinging acorns; a squirrel on her shoulder.
  "nuez-picara": {
    palette: {
      skin: SKIN, hair: "#6a3a1e", torso: "#5e8a3a", legs: "#6a4a30", boots: "#4a3020", cloak: "#8a5a32", cloakDk: "#6a4224",
      fur: "#f0dcb4", leather: "#7a4a26", nut: "#a8662e", cup: "#6a4224", sq: "#c8682a", sqBelly: "#f2d8b0", sqTip: "#e09a5a",
      nose: "#3a2420", mouth: "#8a3a34", belt: "#5a3a22",
    },
    shapes: [
      // Bushy tail-cloak curling up behind her, cream-tipped.
      ...([[-0.14, 0.28, 0, 0.11], [-0.28, 0.36, 0, 0.14], [-0.38, 0.54, 0, 0.16], [-0.38, 0.76, 0, 0.16], [-0.28, 0.94, 0, 0.14], [-0.14, 1.0, 0, 0.11]] as number[][]).map(([x, y, z, r]): Shape => ({ t: "ell", c: [x, y, z], r: [r, r, r * 1.15], col: "cloak", k: 0.08 })),
      { t: "ell", c: [-0.1, 1.0, 0], r: [0.1, 0.09, 0.12], col: "fur", k: 0.06 },
      { t: "ell", c: [-0.46, 0.65, 0], r: [0.06, 0.2, 0.12], col: "cloakDk", paint: true },
      ...body({ torso: [0.13, 0.15, 0.14] }),
      { t: "tor", c: [0, 0.29, 0], R: 0.13, r: 0.02, col: "belt" },
      { t: "ell", c: [0.05, 0.3, 0], r: [0.12, 0.06, 0.15], col: "torso", k: 0.03 },
      // Cloak over the shoulders and the hood with small round ears.
      { t: "ell", c: [-0.03, 0.53, 0], r: [0.15, 0.08, 0.2], col: "cloak", k: 0.03 },
      { t: "ell", c: [-0.03, 0.76, 0], r: [0.22, 0.21, 0.215], col: "cloak", k: 0.04 },
      { t: "ell", c: [0.2, 0.7, 0], r: [0.1, 0.13, 0.16], col: "cloak", cut: true, k: 0.03 },
      { t: "ell", c: [0.07, 0.7, 0], r: [0.15, 0.15, 0.15], col: "skin", k: 0.02 },
      { t: "ell", c: [0.12, 0.81, 0], r: [0.08, 0.045, 0.14], col: "hair", paint: true },
      { t: "ell", c: [-0.06, 0.95, 0.12], r: [0.05, 0.06, 0.035], col: "cloak", mirror: true, k: 0.03 },
      { t: "ell", c: [-0.04, 0.95, 0.13], r: [0.025, 0.035, 0.03], col: "fur", mirror: true, paint: true },
      { t: "cap", a: [0.21, 0.635, -0.03], b: [0.2, 0.625, 0.04], r: [0.01, 0.01], col: "mouth", paint: true },
      // Acorn pouch on the near hip.
      { t: "ell", c: [0.06, 0.24, 0.14], r: [0.05, 0.055, 0.04], col: "leather", k: 0.02 },
      ...acorn([0.07, 0.31, 0.15], 0.022, "nut", "cup"),
      ...acorn([0.03, 0.31, 0.13], 0.02, "nut", "cup"),
      // Far arm flung up and forward, an acorn leaving the hand; two more in the air.
      ...arm(-1, [0.24, 0.8, -0.12], "torso", "skin", 0.04),
      ...acorn([0.27, 0.86, -0.12], 0.03, "nut", "cup"),
      ...acorn([0.46, 0.84, -0.02], 0.034, "nut", "cup"),
      ...acorn([0.6, 0.66, 0.06], 0.034, "nut", "cup"),
      // Near arm low with another acorn ready.
      ...arm(1, [0.26, 0.4, 0.18], "torso", "skin", 0.04),
      ...acorn([0.3, 0.43, 0.18], 0.026, "nut", "cup"),
      // Squirrel companion on the near shoulder.
      ...place(SQUIRREL, 1.45, [0.0, 0.6, 0.24]),
    ],
    eyes: [...eyes("#5a8a3a", false, 0.7, 0.07, 0.05), { at: [0.075, 0.69, 0.24], r: 0.019, iris: "#2a1a10", look: [0.6, 0.1, 0.8] }],
  },

  // Gedeón, el Púgil de Rubí: a big bare-knuckle boxer in a cream tank top and slate trousers, short
  // red hair, a grin, guard up; his forearms are sheathed in glowing ruby crystal and his fists blaze ruby-red.
  "gedeon-rubi": {
    palette: {
      skin: "#e8b48c", hair: "#c8442a", tank: "#efe6d2", tankDk: "#cfc4ae", legs: "#3e4a66", boots: "#4a3020", belt: "#5a3a22",
      gold: "#f0c24a", ruby: "#c0183a", ruby2: "#ff2a4a", rubyLt: "#ffb0c0", mouth: "#7a2a24", tooth: "#ffffff",
    },
    glow: ["ruby2", "rubyLt"],
    shapes: [
      { t: "ell", c: [0.06, 0.055, 0.14], r: [0.11, 0.06, 0.085], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.08, 0.14], b: [0, 0.27, 0.12], r: [0.078, 0.09], col: "legs", mirror: true },
      // Barrel chest in a tank top, bare shoulders, a belt with a gold buckle.
      { t: "ell", c: [0, 0.46, 0], r: [0.2, 0.22, 0.23], col: "tank" },
      { t: "ell", c: [0.05, 0.36, 0], r: [0.16, 0.1, 0.22], col: "tankDk", paint: true },
      { t: "ell", c: [-0.01, 0.61, 0.19], r: [0.12, 0.11, 0.12], col: "skin", mirror: true, k: 0.06 },
      { t: "ell", c: [0.13, 0.62, 0], r: [0.1, 0.07, 0.1], col: "skin", paint: true },
      { t: "tor", c: [0, 0.29, 0], R: 0.19, r: 0.03, col: "belt", k: 0.02 },
      { t: "box", c: [0.2, 0.29, 0], s: [0.016, 0.035, 0.045], round: 0.01, col: "gold", k: 0.005 },
      // Head on a thick neck: square jaw, short red crop, a cocky grin.
      { t: "cap", a: [0, 0.6, 0], b: [0.02, 0.7, 0], r: [0.11, 0.1], col: "skin", k: 0.04 },
      { t: "ell", c: [0.04, 0.8, 0], r: [0.16, 0.16, 0.155], col: "skin", k: 0.04 },
      { t: "ell", c: [0.1, 0.72, 0], r: [0.1, 0.07, 0.12], col: "skin", k: 0.04 },
      { t: "ell", c: [0.0, 0.88, 0], r: [0.165, 0.1, 0.165], col: "hair", k: 0.02 },
      { t: "ell", c: [0.1, 0.93, 0.0], r: [0.08, 0.04, 0.12], rot: [0, 0, -20], col: "hair", k: 0.02 },
      { t: "ell", c: [-0.06, 0.8, 0], r: [0.12, 0.08, 0.17], col: "hair", paint: true },
      { t: "cap", a: [0.19, 0.71, -0.04], b: [0.185, 0.7, 0.06], r: [0.016, 0.016], col: "mouth", paint: true },
      { t: "cap", a: [0.196, 0.716, -0.02], b: [0.19, 0.71, 0.05], r: [0.008, 0.008], col: "tooth", paint: true },
      // Guard up: near fist forward at chin height, far fist a little higher and back. Bare forearms
      // studded with glowing ruby crystals; ruby light burning over the knuckles.
      { t: "cap", a: [-0.01, 0.6, 0.23], b: [0.1, 0.42, 0.3], r: [0.08, 0.07], col: "skin", k: 0.04 },
      { t: "cap", a: [0.1, 0.42, 0.3], b: [0.3, 0.6, 0.18], r: [0.066, 0.07], col: "skin", k: 0.03 },
      { t: "cap", a: [-0.01, 0.6, -0.23], b: [0.06, 0.44, -0.3], r: [0.08, 0.07], col: "skin", k: 0.04 },
      { t: "cap", a: [0.06, 0.44, -0.3], b: [0.22, 0.7, -0.2], r: [0.066, 0.07], col: "skin", k: 0.03 },
      ...([[[0.1, 0.42, 0.3], [0.3, 0.6, 0.18], 1], [[0.06, 0.44, -0.3], [0.22, 0.7, -0.2], -1]] as [V3, V3, number][]).flatMap(([a, b, s]): Shape[] =>
        [0.12, 0.34, 0.56, 0.78].flatMap((t, i): Shape[] => {
          const c: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
          const len = 0.12 + (i % 2) * 0.05;
          const d: V3 = [-0.35 - (i % 2) * 0.2, 0.55 + (i % 2) * 0.2, s * 0.75];
          const n = Math.hypot(...d);
          const tip: V3 = [c[0] + (d[0] / n) * len, c[1] + (d[1] / n) * len, c[2] + (d[2] / n) * len];
          const side: V3 = [c[0] + 0.02, c[1] + 0.05, c[2] + s * 0.02];
          return [
            { t: "cap", a: c, b: tip, r: [0.05, 0.006], col: i % 2 ? "ruby2" : "ruby", k: 0.005 },
            { t: "cap", a: side, b: [side[0] + 0.06, side[1] + 0.06, side[2] + s * 0.07], r: [0.032, 0.005], col: "ruby2", k: 0.004 },
          ];
        })),
      // Bare fists with ruby-lit knuckles and a ruby halo.
      ...([[0.34, 0.63, 0.17, 1], [0.26, 0.74, -0.19, -1]] as number[][]).flatMap(([x, y, z]): Shape[] => [
        { t: "box", c: [x, y, z], s: [0.08, 0.075, 0.07], round: 0.05, col: "skin", k: 0.03 },
        ...[0.045, 0.015, -0.015, -0.045].map((dz): Shape => ({ t: "ell", c: [x + 0.07, y + 0.025, z + dz], r: [0.026, 0.026, 0.02], col: "skin", k: 0.01 })),
        { t: "ell", c: [x + 0.07, y + 0.01, z], r: [0.05, 0.1, 0.1], col: "ruby2", paint: true },
        { t: "cap", a: [x + 0.03, y - 0.05, z + 0.07], b: [x + 0.07, y - 0.02, z + 0.06], r: [0.024, 0.02], col: "skin", k: 0.02 },
      ]),
      // Crackling ruby sparks.
      ...([[0.5, 0.74, 0.2, 0.02], [0.46, 0.52, 0.1, 0.016], [0.42, 0.9, -0.1, 0.018], [0.2, 0.36, 0.44, 0.015], [0.36, 0.98, -0.24, 0.013]] as number[][]).map(([x, y, z, r]) => dot([x, y, z], r, "ruby2")),
      ...sparkle([0.54, 0.6, 0.22], 0.06, "ruby2"),
    ],
    eyes: eyes("#5a7a9a", true, 0.8, 0.06, 0.042),
  },

  // Martillo, el Juez Callejero: a street vigilante in a long brown coat with the collar up and a wide
  // charcoal-brown hat, stubble and a stern stare, a gold scales-of-justice brooch on the lapel, raising
  // a heavy brass-banded wooden gavel-hammer; the other hand points out the culprit.
  "martillo-juez": {
    palette: {
      skin: SKIN, stubble: "#dcb898", hair: "#3a2a20", torso: "#7a5434", coat: "#8a5e38", coatDk: "#4a2e18", vest: "#2e4a4a", shirt: "#efe6d2",
      legs: "#3a3434", boots: "#2a2220", hat: "#4a3426", hatBand: "#2a1e18", wood: "#9a6a3a", woodDk: "#6a4424", brass: "#e0b04a",
      gold: "#f0c24a", mouth: "#6a3a30", glove: "#4a3426",
    },
    shapes: [
      // Long coat flaring to the shins, split at the front over the legs, broad shoulders.
      { t: "cap", a: [0, 0.5, 0], b: [-0.05, 0.22, 0], r: [0.15, 0.19], col: "coat", k: 0.03 },
      { t: "ell", c: [-0.14, 0.19, 0], r: [0.1, 0.08, 0.18], col: "coat", k: 0.06 },
      { t: "ell", c: [-0.2, 0.15, 0], r: [0.05, 0.05, 0.12], col: "coat", k: 0.04 },
      { t: "ell", c: [-0.01, 0.52, 0.15], r: [0.1, 0.075, 0.1], col: "coat", mirror: true, k: 0.05 },
      ...body({ torso: [0.13, 0.16, 0.14] }),
      { t: "cap", a: [0, 0.5, 0], b: [0.0, 0.3, 0], r: [0.15, 0.17], col: "coat", k: 0.03 },
      { t: "box", c: [0.17, 0.32, 0], s: [0.05, 0.2, 0.045], round: 0.02, rot: [0, 0, 8], col: "vest", paint: true },
      { t: "box", c: [0.15, 0.5, 0], s: [0.05, 0.07, 0.035], round: 0.02, col: "shirt", paint: true },
      ...[0.4, 0.33, 0.26].map((y): Shape => dot([0.165 + (0.4 - y) * 0.12, y, 0], 0.011, "brass")),
      { t: "cap", a: [0.12, 0.55, 0.07], b: [0.18, 0.3, 0.06], r: [0.02, 0.02], col: "coatDk", paint: true },
      { t: "cap", a: [0.12, 0.55, -0.07], b: [0.18, 0.3, -0.06], r: [0.02, 0.02], col: "coatDk", paint: true },
      // Turned-up collar.
      { t: "tor", c: [-0.01, 0.57, 0], R: 0.13, r: 0.04, rot: [0, 0, 10], col: "coatDk", k: 0.015 },
      { t: "tor", c: [0, 0.3, 0], R: 0.17, r: 0.022, col: "coatDk", k: 0.01 },
      { t: "ell", c: [-0.06, 0.62, 0], r: [0.06, 0.08, 0.14], col: "coatDk", k: 0.03 },
      // Scales-of-justice brooch on the near lapel.
      { t: "cap", a: [0.15, 0.43, 0.09], b: [0.15, 0.5, 0.09], r: [0.007, 0.007], col: "gold", k: 0.004 },
      { t: "cap", a: [0.15, 0.49, 0.06], b: [0.15, 0.49, 0.12], r: [0.006, 0.006], col: "gold", k: 0.004 },
      dot([0.155, 0.46, 0.058], 0.014, "gold", 0.004),
      dot([0.155, 0.46, 0.122], 0.014, "gold", 0.004),
      // Head: dark hair at the back, stubble, a set mouth; a wide hat.
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [-0.08, 0.74, 0], r: [0.13, 0.14, 0.18], col: "hair", k: 0.02 },
      { t: "ell", c: [0.1, 0.62, 0], r: [0.11, 0.07, 0.15], col: "stubble", paint: true },
      { t: "cap", a: [0.2, 0.64, -0.04], b: [0.195, 0.635, 0.05], r: [0.008, 0.008], col: "mouth", paint: true },
      { t: "ell", c: [0.0, 0.85, 0], r: [0.33, 0.022, 0.32], rot: [0, 0, -8], col: "hat", k: 0.01 },
      { t: "cap", a: [-0.01, 0.85, 0], b: [-0.02, 0.95, 0], r: [0.155, 0.15], col: "hat", k: 0.02 },
      { t: "box", c: [-0.02, 1.1, 0], s: [0.3, 0.1, 0.3], round: 0, col: "hat", cut: true, k: 0.02 },
      { t: "ell", c: [-0.02, 1.0, 0], r: [0.04, 0.025, 0.12], col: "hatBand", cut: true, k: 0.02 },
      { t: "tor", c: [-0.015, 0.885, 0], R: 0.152, r: 0.02, col: "hatBand", k: 0.005 },
      // Near hand raises the gavel-hammer; far hand points.
      ...arm(1, [0.3, 0.42, 0.24], "coat", "glove", 0.048),
      { t: "cap", a: [0.27, 0.32, 0.24], b: [0.48, 0.8, 0.24], r: [0.024, 0.022], col: "wood", k: 0.01 },
      dot([0.265, 0.31, 0.24], 0.03, "brass", 0.005),
      { t: "box", c: [0.5, 0.84, 0.24], s: [0.15, 0.075, 0.075], round: 0.06, rot: [0, 0, -24], col: "wood", k: 0.01 },
      ...[0.1, -0.1].map((d): Shape => ({ t: "tor", c: [0.5 + d * 0.91, 0.84 - d * 0.41, 0.24], R: 0.075, r: 0.014, rot: [0, 0, -114], col: "brass", k: 0.005 })),
      { t: "tor", c: [0.5, 0.84, 0.24], R: 0.078, r: 0.008, rot: [0, 0, -114], col: "woodDk", k: 0.004 },
      ...arm(-1, [0.36, 0.56, -0.16], "coat", "glove", 0.048),
      { t: "cap", a: [0.38, 0.57, -0.16], b: [0.46, 0.59, -0.16], r: [0.017, 0.014], col: "glove", k: 0.01 },
    ],
    eyes: eyes("#7a5a3a", true, 0.71, 0.03, 0.048),
  },

  // Agente Lucero: a calm secret agent in a neat grey suit and navy tie, a little glowing lantern badge on
  // his lapel, a dossier folder tucked under one arm, studying a clue through a brass magnifier.
  "agente-lucero": {
    palette: {
      skin: SKIN, hair: "#2a2420", torso: "#7a8290", suitDk: "#5a6270", legs: "#6a7280", boots: "#2a2628", shirt: "#f4f1ea",
      tie: "#2a3a6a", gold: "#f0c24a", lamp: "#fff0a0", folder: "#c89a5a", folderDk: "#9a7040", paper: "#fbf6e8", glass: "#cfefff",
      wood: "#5a3a26", mouth: "#8a3a34", seal: "#2c4a8a",
    },
    glow: ["lamp", "glass"],
    shapes: [
      ...body({ torso: [0.13, 0.17, 0.15] }),
      // Jacket with a hem, lapels, shirt and tie.
      { t: "ell", c: [0, 0.29, 0], r: [0.14, 0.08, 0.16], col: "torso", k: 0.04 },
      { t: "cap", a: [0.14, 0.56, 0], b: [0.15, 0.38, 0], r: [0.055, 0.008], col: "shirt", paint: true },
      { t: "cap", a: [0.15, 0.55, 0], b: [0.155, 0.4, 0], r: [0.012, 0.02], col: "tie", paint: true },
      { t: "cap", a: [0.12, 0.56, 0.06], b: [0.16, 0.38, 0.015], r: [0.018, 0.012], col: "suitDk", paint: true },
      { t: "cap", a: [0.12, 0.56, -0.06], b: [0.16, 0.38, -0.015], r: [0.018, 0.012], col: "suitDk", paint: true },
      // Lantern badge on the near lapel.
      ...lantern([0.115, 0.5, 0.1], 0.08, "gold", "lamp"),
      // Head: neat dark hair with a side part, a calm half-smile.
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [-0.04, 0.79, 0], r: [0.18, 0.13, 0.19], col: "hair", k: 0.02 },
      { t: "ell", c: [0.09, 0.86, 0.03], r: [0.11, 0.05, 0.15], rot: [0, 0, -14], col: "hair", k: 0.02 },
      { t: "cap", a: [0.19, 0.645, -0.03], b: [0.185, 0.645, 0.06], r: [0.008, 0.008], col: "mouth", paint: true },
      // Far arm holds a dossier against the chest.
      ...arm(-1, [0.2, 0.38, -0.06], "torso", "skin", 0.044),
      { t: "box", c: [0.2, 0.42, -0.01], s: [0.018, 0.13, 0.1], round: 0.006, rot: [0, -30, 4], col: "folder", k: 0.005 },
      { t: "box", c: [0.19, 0.55, -0.02], s: [0.01, 0.015, 0.08], round: 0.004, rot: [0, -30, 4], col: "paper", k: 0.003 },
      { t: "box", c: [0.22, 0.44, 0.0], s: [0.006, 0.03, 0.05], round: 0.004, rot: [0, -30, 4], col: "paper", paint: true },
      { t: "ell", c: [0.22, 0.38, 0.0], r: [0.01, 0.018, 0.018], rot: [0, -30, 0], col: "seal", paint: true },
      // Near hand raises a brass magnifier toward us.
      ...arm(1, [0.32, 0.46, 0.3], "torso", "skin", 0.044),
      { t: "cap", a: [0.32, 0.46, 0.3], b: [0.38, 0.55, 0.31], r: [0.016, 0.014], col: "wood", k: 0.005 },
      { t: "tor", c: [0.43, 0.63, 0.32], R: 0.075, r: 0.015, rot: [90, 0, -34], col: "gold", k: 0.004 },
      { t: "ell", c: [0.43, 0.63, 0.32], r: [0.012, 0.07, 0.07], rot: [0, -56, 0], col: "glass", k: 0.004 },
    ],
    eyes: eyes("#4a6a8a", false, 0.71, 0.02, 0.05),
  },

  // Patrulla del Barrio: a city watch officer of Aurelia in a blue tunic with gold buttons and a white
  // cross-strap, a blue kepi, blowing a brass whistle, raising a lantern high and pointing a short baton,
  // under a lit iron street lamp on the cobbles.
  "patrulla-barrio": {
    palette: {
      skin: SKIN, hair: "#5a3a24", torso: "#2c4a8a", torsoDk: "#22396c", legs: "#2a2e44", boots: "#1e1a1e", gold: "#f0c24a", strap: "#f2ecdc",
      cap: "#2c4a8a", visor: "#1e1a24", brass: "#e0b04a", light: "#ffe08a", iron: "#3a3e4a", lampGlass: "#ffe07a", stone: "#b8ae9c",
      stone2: "#9a907e", wood: "#6a4428", mouth: "#8a3a34", belt: "#2a2228",
    },
    glow: ["light", "lampGlass"],
    shapes: [
      // Cobbled kerb.
      { t: "box", c: [-0.05, -0.02, 0], s: [0.55, 0.035, 0.34], round: 0.03, col: "stone", k: 0 },
      ...([[-0.4, 0.15], [-0.2, 0.25], [0.0, 0.28], [0.25, 0.2], [0.38, -0.05], [-0.3, -0.2], [0.1, -0.24], [0.42, 0.24]] as number[][]).map(([x, z]): Shape => ({ t: "ell", c: [x, 0.015, z], r: [0.07, 0.01, 0.05], col: "stone2", paint: true })),
      // Iron street lamp behind.
      { t: "box", c: [-0.38, 0.04, -0.16], s: [0.06, 0.03, 0.06], round: 0.01, col: "iron", k: 0.01 },
      { t: "cap", a: [-0.38, 0.05, -0.16], b: [-0.38, 1.12, -0.16], r: [0.028, 0.02], col: "iron", k: 0.01 },
      { t: "tor", c: [-0.38, 0.3, -0.16], R: 0.03, r: 0.01, col: "iron", k: 0.01 },
      { t: "cap", a: [-0.38, 1.1, -0.16], b: [-0.38, 1.16, -0.16], r: [0.02, 0.06], col: "iron", k: 0.01 },
      { t: "cap", a: [-0.38, 1.17, -0.16], b: [-0.38, 1.29, -0.16], r: [0.07, 0.07], col: "lampGlass", k: 0.01 },
      ...([[1, 1], [1, -1], [-1, 1], [-1, -1]] as number[][]).map(([dx, dz]): Shape => ({ t: "cap", a: [-0.38 + dx * 0.06, 1.16, -0.16 + dz * 0.06], b: [-0.38 + dx * 0.06, 1.3, -0.16 + dz * 0.06], r: [0.012, 0.012], col: "iron", k: 0 })),
      { t: "cap", a: [-0.38, 1.3, -0.16], b: [-0.38, 1.4, -0.16], r: [0.1, 0.01], col: "iron", k: 0.01 },
      dot([-0.38, 1.42, -0.16], 0.02, "iron"),
      // The officer.
      ...body({ torso: [0.13, 0.16, 0.15] }),
      { t: "ell", c: [0, 0.29, 0], r: [0.14, 0.08, 0.16], col: "torso", k: 0.04 },
      { t: "tor", c: [0, 0.3, 0], R: 0.14, r: 0.02, col: "belt", k: 0.005 },
      { t: "box", c: [0.143, 0.3, 0], s: [0.012, 0.024, 0.03], round: 0.006, col: "gold", k: 0.004 },
      ...[0.49, 0.43, 0.37].map((y): Shape => dot([0.135, y, 0.0], 0.013, "gold")),
      { t: "cap", a: [0.08, 0.54, 0.12], b: [0.12, 0.32, -0.1], r: [0.018, 0.018], col: "strap", k: 0.005 },
      { t: "ell", c: [0, 0.54, 0.14], r: [0.07, 0.035, 0.06], col: "gold", mirror: true, k: 0.02 },
      // Head and kepi with a gold band and a little star badge.
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [-0.05, 0.76, 0], r: [0.16, 0.12, 0.18], col: "hair", k: 0.02 },
      { t: "cap", a: [-0.02, 0.8, 0], b: [-0.03, 0.9, 0], r: [0.175, 0.165], col: "cap", k: 0.02 },
      { t: "box", c: [-0.03, 1.12, 0], s: [0.3, 0.1, 0.3], round: 0, col: "cap", cut: true, k: 0.01 },
      { t: "tor", c: [-0.02, 0.84, 0], R: 0.172, r: 0.02, col: "gold", k: 0.004 },
      { t: "ell", c: [0.17, 0.82, 0], r: [0.08, 0.014, 0.14], rot: [0, 0, -12], col: "visor", k: 0.01 },
      { t: "ell", c: [0.15, 0.9, 0.0], r: [0.012, 0.028, 0.028], col: "gold", k: 0.004 },
      // Brass whistle at the lips.
      { t: "cap", a: [0.19, 0.635, 0.01], b: [0.25, 0.62, 0.02], r: [0.012, 0.014], col: "brass", k: 0.005 },
      { t: "box", c: [0.27, 0.615, 0.02], s: [0.03, 0.02, 0.02], round: 0.012, col: "brass", k: 0.005 },
      // Near hand holds a lantern high; far hand points the baton.
      ...arm(1, [0.34, 0.54, 0.22], "torso", "skin", 0.042),
      ...lantern([0.36, 0.38, 0.23], 0.2, "iron", "light"),
      ...arm(-1, [0.34, 0.64, -0.16], "torso", "skin", 0.042),
      { t: "cap", a: [0.3, 0.6, -0.16], b: [0.54, 0.8, -0.16], r: [0.024, 0.022], col: "wood", k: 0.005 },
      dot([0.54, 0.8, -0.16], 0.026, "gold"),
    ],
    eyes: eyes("#3a6ab0", false, 0.71, 0.02, 0.05),
  },

  // Torre de la Guardia: a tall slender white tower banded in Guard blue and gold on a floating islet, a
  // beacon blazing in a gold lantern room under a blue cone roof, and the Guardia banner — a gold shield
  // bearing a blue star — hanging down its face.
  "torre-guardia": {
    palette: {
      stone: "#ece4d2", stone2: "#c9bea6", blue: "#2c4a8a", blueDk: "#1a2c5c", gold: "#f0c24a", beacon: "#fff4a0", beacon2: "#ffb42a", window: "#ffcf6a",
      rock: "#8a7a6a", rock2: "#6a5c50", grass: "#6aa04a", rune: "#7fe6ff", banner: "#2c4a8a", wood: "#7a4a26", cloud: "#f4f6fb",
    },
    glow: ["beacon", "beacon2", "window", "rune"],
    shapes: [
      ...islet(0.34, 0.3, 0.46),
      ...chain([[-0.22, -0.02, 0.22], [-0.16, -0.1, 0.24], [-0.1, -0.02, 0.24], [-0.04, -0.1, 0.23]], 0.012, 0.012, "rune", 0, true),
      ...chain([[0.08, -0.12, 0.24], [0.12, -0.04, 0.23], [0.16, -0.12, 0.22]], 0.012, 0.012, "rune", 0, true),
      // Shaft, banded blue and gold.
      { t: "cap", a: [0, 0.08, 0], b: [0, 0.2, 0], r: [0.21, 0.19], col: "stone2", k: 0.01 },
      { t: "cap", a: [0, 0.2, 0], b: [0, 1.36, 0], r: [0.16, 0.12], col: "stone", k: 0.02 },
      ...[0.42, 0.78, 1.12].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.16 - ((y - 0.2) / 1.16) * 0.04, r: 0.022, col: "blue", k: 0.005 })),
      ...[0.46, 0.82].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.16 - ((y - 0.2) / 1.16) * 0.04, r: 0.01, col: "gold", k: 0.003 })),
      // Arched door and lit windows on the camera side.
      ...turn([
        { t: "box", c: [0, 0.27, 0.175], s: [0.05, 0.065, 0.02], round: 0.01, col: "wood", k: 0.005 },
        { t: "ell", c: [0, 0.33, 0.175], r: [0.05, 0.04, 0.02], col: "wood", k: 0.005 },
        { t: "box", c: [0, 0.62, 0.135], s: [0.025, 0.04, 0.012], round: 0.008, col: "window", k: 0.003 },
        { t: "box", c: [0, 0.96, 0.125], s: [0.022, 0.035, 0.012], round: 0.008, col: "window", k: 0.003 },
      ], 55),
      // Gallery with merlons, the beacon room, the cone roof and a gold finial.
      { t: "cap", a: [0, 1.32, 0], b: [0, 1.38, 0], r: [0.17, 0.17], col: "stone2", k: 0.01 },
      ...Array.from({ length: 8 }, (_, i): Shape => ({ t: "box", c: [Math.cos(rad(i * 45 + 20)) * 0.15, 1.42, Math.sin(rad(i * 45 + 20)) * 0.15], s: [0.03, 0.035, 0.03], round: 0.008, rot: [0, -(i * 45 + 20), 0], col: "blue", k: 0.004 })),
      { t: "cap", a: [0, 1.38, 0], b: [0, 1.58, 0], r: [0.1, 0.1], col: "beacon2", k: 0.01 },
      { t: "ell", c: [0.05, 1.48, 0.07], r: [0.07, 0.08, 0.07], col: "beacon", k: 0.01 },
      ...Array.from({ length: 4 }, (_, i): Shape => ({ t: "cap", a: [Math.cos(rad(i * 90 + 45)) * 0.09, 1.38, Math.sin(rad(i * 90 + 45)) * 0.09], b: [Math.cos(rad(i * 90 + 45)) * 0.09, 1.6, Math.sin(rad(i * 90 + 45)) * 0.09], r: [0.014, 0.014], col: "gold", k: 0.004 })),
      { t: "tor", c: [0, 1.6, 0], R: 0.12, r: 0.018, col: "gold", k: 0.005 },
      { t: "cap", a: [0, 1.6, 0], b: [0, 1.86, 0], r: [0.14, 0.008], col: "blue", k: 0.02 },
      dot([0, 1.88, 0], 0.025, "gold", 0.01),
      { t: "cap", a: [0, 1.88, 0], b: [0, 1.96, 0], r: [0.01, 0.004], col: "gold", k: 0.005 },
      ...burst([0, 1.48, 0.0], 12, 0, 0.44, [0.05, 0.004], "beacon2", { len: 0.3, r: [0.04, 0.004], col: "beacon" }, 0.01).filter((_, i) => i !== 3 && i !== 9),
      // The Guardia banner on the camera face: a gold rod, a blue swallow-tailed drop, gold shield, blue star.
      ...turn([
        { t: "cap", a: [-0.15, 1.25, 0.16], b: [0.15, 1.25, 0.16], r: [0.014, 0.014], col: "gold", k: 0.004 },
        dot([-0.15, 1.25, 0.16], 0.024, "gold"), dot([0.15, 1.25, 0.16], 0.024, "gold"),
        { t: "box", c: [0, 1.0, 0.165], s: [0.13, 0.24, 0.012], round: 0.008, col: "banner", k: 0.004 },
        { t: "cap", a: [-0.075, 0.78, 0.165], b: [-0.08, 0.66, 0.165], r: [0.055, 0.008], col: "banner", k: 0.01 },
        { t: "cap", a: [0.075, 0.78, 0.165], b: [0.08, 0.66, 0.165], r: [0.055, 0.008], col: "banner", k: 0.01 },
        { t: "box", c: [0, 1.2, 0.176], s: [0.13, 0.014, 0.004], round: 0.003, col: "gold", k: 0 },
        ...shield([0, 1.02, 0.178], 0.11, 0.01, "gold"),
        ...star([0, 1.03, 0.19], 0.085, "blueDk", 0.004),
      ], 34),
      // Cloud puffs at the foot and small floating rocks.
      ...([[-0.36, 0.0, 0.18, 0.1], [-0.24, -0.04, 0.26, 0.08], [0.34, -0.06, 0.2, 0.09], [0.44, -0.02, 0.1, 0.07]] as number[][]).map(([x, y, z, r]): Shape => ({ t: "ell", c: [x, y, z], r: [r * 1.3, r * 0.8, r], col: "cloud", k: 0.05 })),
      { t: "ell", c: [0.42, 0.8, 0.05], r: [0.05, 0.035, 0.045], col: "rock", k: 0.01 },
      { t: "cap", a: [0.42, 0.78, 0.05], b: [0.43, 0.71, 0.05], r: [0.04, 0.005], col: "rock2", k: 0.02 },
      { t: "ell", c: [-0.4, 1.2, -0.05], r: [0.04, 0.028, 0.035], col: "rock", k: 0.01 },
      { t: "cap", a: [-0.4, 1.19, -0.05], b: [-0.39, 1.13, -0.05], r: [0.03, 0.004], col: "rock2", k: 0.02 },
    ],
    eyes: [],
  },

  // Bastión del Consejo: a sturdy grey-stone fortress on a big floating rock — a crenellated curtain wall
  // with a studded gate, two round corner towers and a taller central keep under blue cone roofs, the
  // Council's indigo banner with a gold ring of three stars, cyan runes glowing on the rock and the wall.
  "bastion-consejo": {
    palette: {
      stone: "#cfc6b4", stone2: "#a89e8a", stoneDk: "#8a806e", roof: "#2c4a8a", gold: "#f0c24a", wood: "#7a4a26", woodDk: "#4e2e18",
      window: "#ffcf6a", rock: "#8a7a6a", rock2: "#6a5c50", grass: "#6aa04a", rune: "#7fe6ff", banner: "#4a3a8a", pole: "#5a4030",
    },
    glow: ["window", "rune"],
    shapes: [
      ...islet(0.66, 0.44, 0.6),
      ...chain([[-0.42, -0.02, 0.34], [-0.36, -0.12, 0.36], [-0.3, -0.02, 0.36], [-0.24, -0.12, 0.35]], 0.014, 0.014, "rune", 0, true),
      ...chain([[-0.06, -0.14, 0.36], [-0.02, -0.04, 0.37], [0.02, -0.14, 0.37], [0.06, -0.04, 0.36]], 0.014, 0.014, "rune", 0, true),
      ...chain([[0.24, -0.04, 0.35], [0.3, -0.14, 0.35], [0.36, -0.04, 0.34]], 0.014, 0.014, "rune", 0, true),
      ...chain([[0.0, -0.3, 0.2], [0.03, -0.42, 0.14]], 0.012, 0.012, "rune", 0, true),
      // Curtain wall with merlons along the front and the sides.
      { t: "box", c: [0, 0.28, 0], s: [0.44, 0.16, 0.26], round: 0.01, col: "stone", k: 0.01 },
      { t: "box", c: [0, 0.15, 0.27], s: [0.44, 0.03, 0.01], round: 0.005, col: "stone2", paint: true },
      ...Array.from({ length: 7 }, (_, i): Shape => ({ t: "box", c: [-0.3 + i * 0.1, 0.47, 0.235], s: [0.03, 0.035, 0.025], round: 0.006, col: "stone", k: 0.004 })),
      ...Array.from({ length: 4 }, (_, i): Shape => ({ t: "box", c: [0.415, 0.47, -0.18 + i * 0.11], s: [0.025, 0.035, 0.03], round: 0.006, col: "stone", k: 0.004 })),
      // Gate: an arched studded door with a rune row above it.
      { t: "box", c: [0, 0.2, 0.265], s: [0.08, 0.09, 0.02], round: 0.01, col: "wood", k: 0.005 },
      { t: "ell", c: [0, 0.29, 0.265], r: [0.08, 0.06, 0.02], col: "wood", k: 0.005 },
      { t: "box", c: [0, 0.24, 0.285], s: [0.004, 0.13, 0.01], round: 0.002, col: "woodDk", paint: true },
      ...[0.18, 0.26].map((y): Shape => ({ t: "box", c: [0, y, 0.285], s: [0.085, 0.006, 0.01], round: 0.002, col: "woodDk", paint: true })),
      { t: "tor", c: [0, 0.29, 0.268], R: 0.09, r: 0.014, rot: [90, 0, 0], col: "stone2", k: 0.004 },
      ...[-0.07, 0, 0.07].map((x): Shape => ({ t: "ell", c: [x, 0.4, 0.262], r: [0.022, 0.022, 0.006], col: "rune", k: 0 })),
      // Two corner towers.
      ...[-0.42, 0.42].flatMap((x): Shape[] => [
        { t: "cap", a: [x, 0.1, 0.22], b: [x, 0.62, 0.22], r: [0.13, 0.12], col: "stone", k: 0.01 },
        { t: "tor", c: [x, 0.64, 0.22], R: 0.13, r: 0.025, col: "stone2", k: 0.005 },
        ...Array.from({ length: 6 }, (_, i): Shape => ({ t: "box", c: [x + Math.cos(rad(i * 60 + 15)) * 0.13, 0.69, 0.22 + Math.sin(rad(i * 60 + 15)) * 0.13], s: [0.03, 0.035, 0.03], round: 0.006, rot: [0, -(i * 60 + 15), 0], col: "stone", k: 0.004 })),
        { t: "cap", a: [x, 0.66, 0.22], b: [x, 0.98, 0.22], r: [0.13, 0.008], col: "roof", k: 0.02 },
        dot([x, 0.99, 0.22], 0.02, "gold", 0.005),
        { t: "box", c: [x + 0.06, 0.44, 0.32], s: [0.02, 0.035, 0.01], round: 0.008, rot: [0, 30, 0], col: "window", k: 0.002 },
      ]),
      // Central keep, taller, with a crown of merlons, a high flag and the Council banner on its face.
      { t: "cap", a: [0, 0.3, -0.14], b: [0, 1.0, -0.14], r: [0.18, 0.16], col: "stone", k: 0.01 },
      { t: "tor", c: [0, 1.02, -0.14], R: 0.17, r: 0.028, col: "stone2", k: 0.005 },
      ...Array.from({ length: 8 }, (_, i): Shape => ({ t: "box", c: [Math.cos(rad(i * 45 + 20)) * 0.17, 1.07, -0.14 + Math.sin(rad(i * 45 + 20)) * 0.17], s: [0.032, 0.04, 0.032], round: 0.006, rot: [0, -(i * 45 + 20), 0], col: "stone", k: 0.004 })),
      { t: "cap", a: [0, 1.04, -0.14], b: [0, 1.42, -0.14], r: [0.17, 0.008], col: "roof", k: 0.02 },
      { t: "cap", a: [0, 1.38, -0.14], b: [0, 1.62, -0.14], r: [0.014, 0.012], col: "pole", k: 0.005 },
      { t: "box", c: [0.1, 1.55, -0.14], s: [0.1, 0.05, 0.008], round: 0.006, rot: [0, 0, -4], col: "banner", k: 0.005 },
      ...shift(turn([
        { t: "box", c: [0, 0.98, 0.0], s: [0.1, 0.012, 0.01], round: 0.004, col: "gold", k: 0 },
        { t: "box", c: [0, 0.8, 0.0], s: [0.09, 0.17, 0.01], round: 0.006, col: "banner", k: 0.004 },
        { t: "cap", a: [-0.09, 0.63, 0.0], b: [0, 0.57, 0.0], r: [0.012, 0.006], col: "banner", k: 0.02 },
        { t: "cap", a: [0.09, 0.63, 0.0], b: [0, 0.57, 0.0], r: [0.012, 0.006], col: "banner", k: 0.02 },
        { t: "box", c: [0, 0.6, 0.0], s: [0.08, 0.03, 0.01], round: 0.004, col: "banner", k: 0.02 },
        { t: "tor", c: [0, 0.81, 0.012], R: 0.05, r: 0.009, rot: [90, 0, 0], col: "gold", k: 0 },
        ...[90, 210, 330].flatMap((a) => star([Math.cos(rad(a)) * 0.05, 0.81 + Math.sin(rad(a)) * 0.05, 0.02], 0.024, "gold", 0.002)),
      ], 34), [Math.sin(rad(34)) * 0.175, 0, -0.14 + Math.cos(rad(34)) * 0.175]),
    ],
    eyes: [],
  },
};
