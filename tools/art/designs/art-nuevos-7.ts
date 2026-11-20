import type { Sculpt, Shape, V3 } from "../sculpt";
import { FRONT, arm, burst, eyes, rad, turn } from "./kit";

// Album cards — art batch nuevos 7. Valdoria: floating towers and runes. Original designs only:
// a hooded apprentice mage, a flipped hourglass that strikes back, a young workshop inventor, an
// archmage's diploma and hat, a braided rope of many threads, and a levitating meditation.

// MARK: Helpers

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

/** Points on an arc in the xy plane (degrees), at depth z. */
function arcPts(cx: number, cy: number, R: number, a0: number, a1: number, n: number, z = 0, ry = R): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) { const a = rad(a0 + ((a1 - a0) * i) / n); out.push([cx + R * Math.cos(a), cy + ry * Math.sin(a), z]); }
  return out;
}

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

/** A five-point star facing +z, outer radius R. */
function star(c: V3, R: number, col: string, depth = 0.35, paint = false): Shape[] {
  const p = paint ? { paint: true } : {};
  const out: Shape[] = [{ t: "ell", c, r: [R * 0.42, R * 0.42, R * depth], col, k: 0.01, ...p }];
  for (let i = 0; i < 5; i++) {
    const a = rad(90 + 72 * i);
    out.push({ t: "cap", a: c, b: [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), c[2]], r: [R * 0.36, R * 0.04], col, k: 0.01, ...p });
  }
  return out;
}

/** A small candle standing at c (base), height h, with a flame. */
function candle(c: V3, h: number): Shape[] {
  const [x, y, z] = c;
  return [
    { t: "cap", a: [x, y, z], b: [x, y + h, z], r: [0.032, 0.03], col: "wax", k: 0.005 },
    { t: "cap", a: [x + 0.02, y + h, z + 0.02], b: [x + 0.024, y + h * 0.7, z + 0.024], r: [0.012, 0.008], col: "wax", k: 0.01 },
    { t: "cap", a: [x, y + h, z], b: [x, y + h + 0.025, z], r: [0.005, 0.004], col: "wick", k: 0 },
    { t: "ell", c: [x, y + h + 0.05, z], r: [0.022, 0.035, 0.022], col: "flame", k: 0 },
    { t: "ell", c: [x, y + h + 0.042, z], r: [0.011, 0.018, 0.011], col: "core", k: 0 },
  ];
}

/** A sturdy hourglass, upright, centred at the origin, height h. */
function hourglass(h: number): Shape[] {
  return [
    { t: "cap", a: [0, h * 0.42, 0], b: [0, h * 0.02, 0], r: [h * 0.24, h * 0.04], col: "glass", k: 0.01 },
    { t: "cap", a: [0, -h * 0.42, 0], b: [0, -h * 0.02, 0], r: [h * 0.24, h * 0.04], col: "glass", k: 0.01 },
    { t: "cap", a: [0, h * 0.4, 0], b: [0, h * 0.2, 0], r: [h * 0.2, h * 0.09], col: "sand", k: 0.01 },
    { t: "cap", a: [0, h * 0.2, 0], b: [0, -h * 0.35, 0], r: [h * 0.015, h * 0.015], col: "sand", k: 0 },
    { t: "cap", a: [0, -h * 0.4, 0], b: [0, -h * 0.3, 0], r: [h * 0.12, h * 0.04], col: "sand", k: 0.01 },
    { t: "box", c: [0, h * 0.5, 0], s: [h * 0.33, h * 0.055, h * 0.33], round: h * 0.03, col: "frame", k: 0.005 },
    { t: "box", c: [0, -h * 0.5, 0], s: [h * 0.33, h * 0.055, h * 0.33], round: h * 0.03, col: "frame", k: 0.005 },
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dz]): Shape => ({ t: "cap", a: [dx * h * 0.27, -h * 0.5, dz * h * 0.27], b: [dx * h * 0.27, h * 0.5, dz * h * 0.27], r: [h * 0.03, h * 0.03], col: "frame2", k: 0 })),
  ];
}

/** A helical strand along x from x0 to x1, radius R about (y, z), `turns` turns, starting at phase ph (deg). */
function helix(x0: number, x1: number, y: number, z: number, R: number, turns: number, ph: number, r: number, col: string): Shape[] {
  const n = Math.ceil(turns * 10);
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = rad(ph) + t * turns * Math.PI * 2;
    pts.push([x0 + (x1 - x0) * t, y + R * Math.cos(a), z + R * Math.sin(a)]);
  }
  return chain(pts, r, r, col, 0.012);
}

export const artNuevos7: Record<string, Sculpt> = {
  // Eco, el Aprendiz: a teenage apprentice in a deep-blue hooded robe with silver trim, a crystal-tipped
  // staff in one hand, the other hand casting a small swirl of light, sparkles around.
  "eco-aprendiz": {
    palette: {
      skin: "#f2c6a0", robe: "#2f56a8", robeDk: "#1e3a78", silver: "#d6dde8", hair: "#6a4a32", boots: "#3a3446", torso: "#2f56a8",
      wood: "#8a5a34", orb: "#9ff2ff", glint: "#ffffff", spell: "#7fe0ff", mouth: "#8a3a34", belt: "#c0c8d6",
    },
    glow: ["orb", "glint", "spell"],
    shapes: [
      // Robe: a bell to the ground with a silver hem, boots peeking out.
      { t: "ell", c: [0.06, 0.04, 0.07], r: [0.08, 0.045, 0.06], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.1, 0], b: [0, 0.48, 0], r: [0.2, 0.125], col: "robe", k: 0.03 },
      { t: "tor", c: [0, 0.1, 0], R: 0.19, r: 0.018, col: "silver", k: 0.01 },
      { t: "box", c: [0.19, 0.28, 0], s: [0.03, 0.2, 0.025], round: 0.01, rot: [0, 0, 12], col: "silver", paint: true },
      { t: "ell", c: [0, 0.42, 0], r: [0.13, 0.15, 0.15], col: "robe" },
      { t: "tor", c: [0, 0.34, 0], R: 0.14, r: 0.016, col: "belt", k: 0.01 },
      dot([0.15, 0.34, 0.01], 0.022, "spell", 0.005),
      // Short cape over the shoulders with a silver edge and a clasp.
      { t: "ell", c: [-0.02, 0.5, 0], r: [0.17, 0.09, 0.21], col: "robeDk", k: 0.03 },
      { t: "ell", c: [-0.02, 0.45, 0], r: [0.17, 0.025, 0.21], col: "silver", paint: true },
      dot([0.15, 0.54, 0.0], 0.025, "silver", 0.005),
      // Hood framing the face, its tip drooping behind.
      { t: "ell", c: [-0.03, 0.74, 0], r: [0.22, 0.22, 0.21], col: "robeDk", k: 0.04 },
      { t: "cap", a: [-0.12, 0.86, 0], b: [-0.3, 0.78, 0], r: [0.1, 0.025], col: "robeDk", k: 0.04 },
      { t: "ell", c: [0.19, 0.7, 0], r: [0.12, 0.15, 0.17], col: "robeDk", cut: true, k: 0.03 },
      { t: "ell", c: [0.05, 0.7, 0], r: [0.16, 0.16, 0.16], col: "skin", k: 0.02 },
      { t: "tor", c: [0.11, 0.7, 0], R: 0.165, r: 0.02, rot: [0, 0, 90], col: "silver", paint: true },
      { t: "ell", c: [0.15, 0.81, 0.0], r: [0.06, 0.04, 0.13], rot: [0, 0, -15], col: "hair", k: 0.02 },
      { t: "cap", a: [0.2, 0.62, -0.02], b: [0.19, 0.615, 0.05], r: [0.008, 0.008], col: "mouth", paint: true },
      // Near hand grips the staff; the staff tip is a silver crescent cradling a glowing crystal.
      ...arm(1, [0.2, 0.42, 0.22], "robe", "skin", 0.042),
      { t: "cap", a: [0.17, 0.0, 0.23], b: [0.24, 0.98, 0.22], r: [0.018, 0.016], col: "wood", k: 0.005 },
      { t: "tor", c: [0.245, 1.05, 0.22], R: 0.06, r: 0.014, rot: [90, 0, 0], col: "silver", k: 0.01 },
      { t: "ell", c: [0.245, 1.07, 0.22], r: [0.035, 0.055, 0.035], col: "orb", k: 0.01 },
      // Far hand raised forward, palm up, a little swirl of light spinning above it.
      ...arm(-1, [0.3, 0.58, -0.1], "robe", "skin", 0.042),
      ...chain(arcPts(0.36, 0.72, 0.07, -90, 250, 12, -0.06), 0.006, 0.016, "spell", 0.005),
      dot([0.36, 0.72, -0.06], 0.03, "glint", 0.01),
      ...sparkle([0.48, 0.86, -0.04], 0.05, "glint"),
      ...sparkle([0.44, 1.0, 0.1], 0.04, "spell"),
      ...sparkle([0.4, 1.15, 0.2], 0.05, "glint"),
      ...sparkle([-0.24, 1.0, 0.1], 0.04, "spell"),
      dot([0.52, 0.66, -0.02], 0.014, "spell"),
      dot([0.12, 1.12, 0.22], 0.012, "glint"),
    ],
    eyes: eyes("#4aa0e0", false, 0.7, 0.05, 0.05),
  },

  // Las Tornas Cambian: a hand gripping a tilted brass hourglass mid-flip, curved arrows showing the
  // turn, and a sharp counter-attack spark bursting from its top.
  "tornas-cambian": {
    palette: {
      frame: "#d8a440", frame2: "#a4742a", glass: "#dff4fa", sand: "#ffae3a", skin: "#e8b48c", sleeve: "#7a3a8a", cuff: "#e8c060",
      arrow: "#8fe8ff", spark: "#fff3b0", spark2: "#ff9a3a", glint: "#ffffff",
    },
    glow: ["arrow", "spark", "spark2", "glint", "sand"],
    shapes: [
      // Curved flip arrows behind.
      ...chain(arcPts(0, 0.55, 0.42, 110, 200, 10, -0.2), 0.022, 0.022, "arrow", 0.005),
      { t: "cap", a: [-0.4, 0.4, -0.2], b: [-0.32, 0.26, -0.2], r: [0.055, 0.005], col: "arrow", k: 0.005 },
      ...chain(arcPts(0, 0.55, 0.42, -70, 20, 10, -0.2), 0.022, 0.022, "arrow", 0.005),
      { t: "cap", a: [0.4, 0.7, -0.2], b: [0.32, 0.84, -0.2], r: [0.055, 0.005], col: "arrow", k: 0.005 },
      // The hourglass, tilted mid-turn, gripped from the lower left.
      ...rotZ([
        ...place(hourglass(0.6), 1, [0, 0, 0]),
        // hand around the waist of the glass: palm behind, fingers wrapping to the front
        { t: "cap", a: [-0.4, -0.04, 0.02], b: [-0.2, 0.0, 0.02], r: [0.058, 0.052], col: "sleeve", k: 0.02 },
        { t: "tor", c: [-0.19, 0.0, 0.02], R: 0.052, r: 0.018, rot: [0, 0, 90], col: "cuff", k: 0.01 },
        { t: "ell", c: [-0.1, 0.0, 0.03], r: [0.065, 0.058, 0.05], col: "skin", k: 0.03 },
        ...[0.04, 0.013, -0.014, -0.04].map((y): Shape => ({ t: "cap", a: [-0.06, y, 0.07], b: [0.025, y * 0.9, 0.085], r: [0.019, 0.017], col: "skin", k: 0.01 })),
        { t: "cap", a: [-0.09, 0.05, 0.06], b: [-0.02, 0.085, 0.08], r: [0.021, 0.018], col: "skin", k: 0.012 },
      ], -35).map((sh) => place([sh], 1, [0, 0.52, 0])[0]),
      // Counter-attack spark bursting from the top.
      ...burst([0.22, 0.85, 0.05], 10, 15, 0.26, [0.04, 0.004], "spark", { len: 0.15, r: [0.03, 0.004], col: "spark2" }, 0.02),
      dot([0.22, 0.85, 0.05], 0.06, "spark", 0.02),
      ...sparkle([0.48, 1.08, 0.05], 0.06, "glint"),
      ...sparkle([-0.3, 0.98, 0.05], 0.045, "glint"),
      ...sparkle([0.4, 0.18, 0.05], 0.045, "spark2"),
    ],
    eyes: [],
  },

  // Chispa, la Inventora: a young inventor girl in teal overalls over a cream shirt, brass goggles pushed
  // up on her forehead, a brass tool belt with a wrench, holding up a small glowing clockwork gadget.
  "chispa-inventora": {
    palette: {
      skin: "#f0c09a", hair: "#c8582a", torso: "#f2e6cc", teal: "#2a8a8a", tealDk: "#1c6262", legs: "#2a8a8a", boots: "#5a3a24",
      brass: "#e0a840", brass2: "#a8742a", lens: "#7fe8e0", belt: "#6a4228", steel: "#b8c2cc", core: "#9ffff0", glint: "#ffffff",
      mouth: "#8a3a34", cheek: "#f09a8a",
    },
    glow: ["core", "glint"],
    shapes: [
      { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
      { t: "cap", a: [0, 0.08, 0.072], b: [0, 0.28, 0.068], r: [0.06, 0.068], col: "legs", mirror: true },
      { t: "ell", c: [0, 0.4, 0], r: [0.13, 0.16, 0.15], col: "torso" },
      // Overalls bib and straps.
      { t: "ell", c: [0.01, 0.33, 0], r: [0.135, 0.1, 0.155], col: "teal", k: 0.01 },
      { t: "box", c: [0.13, 0.43, 0], s: [0.02, 0.07, 0.07], round: 0.02, col: "teal", k: 0.02 },
      { t: "cap", a: [0.12, 0.48, 0.07], b: [0.0, 0.56, 0.1], r: [0.018, 0.018], col: "teal", mirror: true, k: 0.01 },
      dot([0.135, 0.47, 0.06], 0.012, "brass"),
      dot([0.135, 0.47, -0.06], 0.012, "brass"),
      // Tool belt with pouches and a wrench.
      { t: "tor", c: [0, 0.28, 0], R: 0.145, r: 0.025, col: "belt", k: 0.01 },
      { t: "box", c: [0.15, 0.28, 0.0], s: [0.015, 0.025, 0.03], round: 0.006, col: "brass", k: 0.004 },
      { t: "box", c: [0.06, 0.22, 0.14], s: [0.04, 0.045, 0.03], round: 0.015, rot: [0, -60, 0], col: "belt", k: 0.01 },
      { t: "box", c: [-0.08, 0.22, 0.13], s: [0.04, 0.045, 0.03], round: 0.015, rot: [0, 60, 0], col: "brass2", k: 0.01 },
      { t: "cap", a: [0.12, 0.3, 0.12], b: [0.14, 0.14, 0.15], r: [0.012, 0.012], col: "steel", k: 0.004 },
      { t: "tor", c: [0.145, 0.12, 0.15], R: 0.025, r: 0.01, rot: [90, 0, 0], col: "steel", k: 0.004 },
      { t: "cap", a: [0.08, 0.3, 0.15], b: [0.07, 0.38, 0.16], r: [0.008, 0.008], col: "brass", k: 0.004 },
      // Head: auburn hair in a messy bun, goggles on the forehead.
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [-0.05, 0.78, 0], r: [0.18, 0.14, 0.195], col: "hair", k: 0.02 },
      { t: "ell", c: [-0.17, 0.92, -0.02], r: [0.08, 0.08, 0.08], col: "hair", k: 0.03 },
      { t: "cap", a: [-0.04, 0.76, 0.17], b: [0.02, 0.6, 0.17], r: [0.035, 0.02], col: "hair", mirror: true, k: 0.02 },
      { t: "tor", c: [0.0, 0.81, 0], R: 0.19, r: 0.016, rot: [0, 0, 8], col: "belt", k: 0.01 },
      ...[0.075, -0.075].flatMap((z): Shape[] => [
        { t: "cap", a: [0.15, 0.85, z], b: [0.2, 0.86, z], r: [0.05, 0.05], col: "brass", k: 0.01 },
        { t: "ell", c: [0.205, 0.86, z], r: [0.012, 0.038, 0.038], col: "lens", k: 0.004 },
      ]),
      { t: "ell", c: [0.17, 0.64, 0.09], r: [0.02, 0.018, 0.025], col: "cheek", paint: true },
      { t: "cap", a: [0.205, 0.62, -0.03], b: [0.195, 0.615, 0.05], r: [0.009, 0.009], col: "mouth", paint: true },
      // Near arm down, rolled sleeve; far arm holding the gadget high.
      ...arm(1, [0.12, 0.3, 0.24], "torso", "skin", 0.042),
      ...arm(-1, [0.4, 0.84, -0.04], "torso", "skin", 0.042),
      // Gadget: a brass sphere with a glowing core window, a little gear and an antenna.
      { t: "ell", c: [0.44, 0.98, -0.02], r: [0.085, 0.085, 0.085], col: "brass", k: 0.02 },
      { t: "tor", c: [0.44, 0.98, -0.02], R: 0.085, r: 0.012, rot: [0, 0, 90], col: "brass2", k: 0.01 },
      { t: "ell", c: [0.50, 0.99, 0.03], r: [0.04, 0.045, 0.045], rot: [0, -40, 0], col: "core", k: 0.01 },
      { t: "cap", a: [0.42, 1.06, -0.02], b: [0.40, 1.17, -0.02], r: [0.008, 0.006], col: "steel", k: 0.004 },
      dot([0.40, 1.18, -0.02], 0.022, "core"),
      ...Array.from({ length: 6 }, (_, i): Shape => ({ t: "box", c: [0.35 + 0.035 * Math.cos(rad(i * 60)), 0.94 + 0.035 * Math.sin(rad(i * 60)), 0.04], s: [0.012, 0.012, 0.012], round: 0.003, rot: [0, 0, i * 60], col: "brass2", k: 0.005 })),
      ...sparkle([0.62, 1.1, 0.05], 0.06, "glint"),
      ...sparkle([0.16, 1.22, 0.0], 0.045, "core"),
      ...sparkle([0.62, 0.84, 0.08], 0.04, "core"),
    ],
    eyes: eyes("#3aa89a", false, 0.7, 0.03, 0.052),
  },

  // Título de Archimago: an unrolled parchment diploma with a red wax seal and gold ribbon tails, a tall
  // midnight-blue pointed hat with gold stars and a band standing beside it.
  archimago: {
    palette: {
      paper: "#f6ecd0", paper2: "#e2d0a6", ink: "#6a5a7a", seal: "#c0303a", seal2: "#8a1e2a", ribbon: "#e8b23a", ribbon2: "#b5832a",
      hat: "#2c2e7a", hatDk: "#1c1d54", band: "#e8b23a", star: "#ffe27a", glint: "#ffffff",
    },
    glow: ["star", "glint"],
    shapes: [
      // The hat, behind on the left: wide brim, tall cone bending back at the tip.
      { t: "ell", c: [-0.22, 0.04, -0.12], r: [0.32, 0.03, 0.3], col: "hat", k: 0.02 },
      { t: "cap", a: [-0.22, 0.04, -0.12], b: [-0.22, 0.6, -0.12], r: [0.17, 0.06], col: "hat", k: 0.03 },
      { t: "cap", a: [-0.22, 0.6, -0.12], b: [-0.12, 0.8, -0.12], r: [0.06, 0.03], col: "hat", k: 0.03 },
      { t: "cap", a: [-0.12, 0.8, -0.12], b: [0.0, 0.82, -0.12], r: [0.03, 0.012], col: "hat", k: 0.03 },
      { t: "cap", a: [-0.22, 0.1, -0.12], b: [-0.22, 0.17, -0.12], r: [0.165, 0.155], col: "band", k: 0.01 },
      ...star([-0.2, 0.36, 0.0], 0.06, "star", 0.4),
      ...star([-0.3, 0.52, -0.02], 0.04, "star", 0.4),
      ...star([-0.15, 0.62, -0.06], 0.03, "star", 0.4),
      { t: "box", c: [-0.22, 0.135, 0.04], s: [0.03, 0.03, 0.01], round: 0.008, col: "ribbon2", k: 0.005 },
      // The diploma, tilted toward us, two rolled ends.
      ...rotZ([
        { t: "box", c: [0, 0, 0], s: [0.3, 0.18, 0.008], round: 0.006, col: "paper", k: 0.005 },
        { t: "cap", a: [-0.3, -0.18, 0.03], b: [0.3, -0.18, 0.03], r: [0.045, 0.045], col: "paper2", k: 0.02 },
        { t: "cap", a: [-0.3, 0.18, 0.03], b: [0.3, 0.18, 0.03], r: [0.04, 0.04], col: "paper2", k: 0.02 },
        ...[0.1, 0.05, 0.0, -0.05].map((y, i): Shape => ({ t: "box", c: [i === 0 ? 0 : -0.06, y, 0.01], s: [i === 0 ? 0.16 : 0.18, 0.008, 0.005], round: 0.003, col: "ink", paint: true })),
        // ribbon tails and seal at the lower right
        { t: "box", c: [0.17, -0.2, 0.06], s: [0.025, 0.09, 0.006], round: 0.005, rot: [0, 0, 18], col: "ribbon", k: 0.004 },
        { t: "box", c: [0.25, -0.2, 0.06], s: [0.025, 0.09, 0.006], round: 0.005, rot: [0, 0, -18], col: "ribbon2", k: 0.004 },
        { t: "ell", c: [0.21, -0.1, 0.06], r: [0.075, 0.075, 0.025], col: "seal", k: 0.01 },
        ...Array.from({ length: 8 }, (_, i): Shape => dot([0.21 + 0.075 * Math.cos(rad(i * 45)), -0.1 + 0.075 * Math.sin(rad(i * 45)), 0.06], 0.02, "seal", 0.02)),
        ...star([0.21, -0.1, 0.085], 0.035, "seal2", 0.3, true),
      ], -12).map((sh) => place([sh], 1.15, [0.18, 0.32, 0.18])[0]),
      ...sparkle([0.42, 0.72, 0.1], 0.06, "glint"),
      ...sparkle([0.02, 0.92, -0.1], 0.045, "star"),
      ...sparkle([-0.5, 0.5, 0.0], 0.04, "glint"),
    ],
    eyes: [],
  },

  // Unión de Todos: four threads of different colours (crimson, azure, leaf, gold) fanning up from below,
  // braiding into one rope that ties into a glowing silver knot, a soft silver ring around it.
  "union-todos": {
    palette: {
      t1: "#d0404a", t2: "#3a74d0", t3: "#4aae5a", t4: "#e8b23a", knot: "#eef4ff", silver: "#aab4c4", ring: "#d8e2f0", glint: "#ffffff",
    },
    glow: ["knot", "ring", "glint"],
    shapes: [
      { t: "tor", c: [0, 0.86, -0.12], R: 0.26, r: 0.016, rot: [90, 0, 0], col: "ring", k: 0 },
      { t: "tor", c: [0, 0.86, -0.12], R: 0.33, r: 0.009, rot: [90, 0, 0], col: "silver", k: 0 },
      // Loose threads fanning out at the bottom.
      ...([["t1", -0.36, 0.06], ["t2", -0.12, -0.08], ["t3", 0.12, 0.08], ["t4", 0.36, -0.06]] as [string, number, number][]).flatMap(([col, x, z]): Shape[] =>
        chain([[x, 0.02, z], [x * 0.75, 0.12, z * 0.7], [x * 0.35, 0.24, z * 0.3], [0, 0.34, 0]], 0.036, 0.04, col, 0.02)),
      // The braid rising to the knot.
      ...(["t1", "t2", "t3", "t4"] as const).flatMap((col, i): Shape[] => rotZ(helix(0.32, 0.72, 0, 0, 0.05, 2, i * 90, 0.042, col), 90)),
      // The glowing knot: a bright core wrapped by silver turns of the rope.
      dot([0, 0.86, 0.0], 0.1, "knot", 0.02),
      { t: "tor", c: [0, 0.86, 0], R: 0.1, r: 0.03, rot: [0, 0, 90], col: "silver", k: 0.01 },
      { t: "tor", c: [0, 0.86, 0], R: 0.1, r: 0.03, rot: [0, 0, 90], col: "silver", k: 0.01 },
      { t: "tor", c: [0, 0.86, 0], R: 0.1, r: 0.03, rot: [90, 0, 0], col: "silver", k: 0.01 },
      { t: "tor", c: [0, 0.86, 0], R: 0.1, r: 0.026, rot: [0, 90, 90], col: "silver", k: 0.01 },
      ...sparkle([0.36, 1.06, 0.1], 0.06, "glint"),
      ...sparkle([-0.38, 0.62, 0.1], 0.05, "ring"),
      ...sparkle([0.34, 0.5, 0.1], 0.045, "ring"),
      dot([-0.3, 1.02, 0.05], 0.015, "glint"),
      dot([0.24, 0.3, 0.05], 0.015, "glint"),
    ],
    eyes: [],
  },

  // Meditación Profunda: a figure in a violet-and-cream robe sitting cross-legged, eyes closed and hands
  // resting on the knees, floating above a glowing ring with a calm halo behind and candles drifting around.
  meditacion: {
    palette: {
      skin: "#e2b08a", robe: "#6a4aa8", robeDk: "#4a3280", sash: "#f2e6c8", hair: "#3a2a3a", lid: "#4a2e2a", mouth: "#8a3a34",
      aura: "#b8a4ff", aura2: "#e4dcff", wax: "#f6efdc", wick: "#3a2a24", flame: "#ffcc5a", core: "#fff6c8", glint: "#ffffff",
    },
    glow: ["aura", "aura2", "flame", "core", "glint"],
    shapes: [
      ...turn([
      // Halo behind and a glowing ring below.
      { t: "tor", c: [-0.14, 0.66, 0], R: 0.3, r: 0.018, rot: [0, 0, 90], col: "aura", k: 0 },
      { t: "tor", c: [-0.15, 0.66, 0], R: 0.38, r: 0.01, rot: [0, 0, 90], col: "aura2", k: 0 },
      { t: "tor", c: [0, 0.02, 0], R: 0.34, r: 0.02, col: "aura", k: 0 },
      { t: "tor", c: [0, 0.02, 0], R: 0.24, r: 0.012, col: "aura2", k: 0 },
      // Crossed legs: two folded shins in front.
      { t: "ell", c: [0, 0.18, 0], r: [0.18, 0.08, 0.25], col: "robe", k: 0.03 },
      { t: "cap", a: [0.06, 0.18, 0.24], b: [0.18, 0.16, -0.08], r: [0.065, 0.055], col: "robeDk", k: 0.03 },
      { t: "cap", a: [0.06, 0.2, -0.24], b: [0.19, 0.2, 0.1], r: [0.065, 0.055], col: "robe", k: 0.03 },
      { t: "ell", c: [0.2, 0.17, -0.1], r: [0.05, 0.035, 0.035], col: "skin", k: 0.01 },
      // Torso, sash and upright head.
      { t: "ell", c: [-0.02, 0.4, 0], r: [0.13, 0.17, 0.15], col: "robe", k: 0.05 },
      { t: "cap", a: [0.08, 0.56, 0.11], b: [0.12, 0.3, -0.1], r: [0.025, 0.025], col: "sash", k: 0.01 },
      { t: "tor", c: [-0.02, 0.3, 0], R: 0.14, r: 0.02, col: "sash", k: 0.01 },
      { t: "ell", c: [0.0, 0.7, 0], r: [0.17, 0.165, 0.165], col: "skin", k: 0.06 },
      { t: "ell", c: [-0.06, 0.77, 0], r: [0.16, 0.12, 0.175], col: "hair", k: 0.02 },
      { t: "ell", c: [-0.12, 0.86, 0], r: [0.07, 0.07, 0.07], col: "hair", k: 0.02 },
      { t: "ell", c: [0.1, 0.83, 0.0], r: [0.06, 0.035, 0.12], rot: [0, 0, -15], col: "hair", k: 0.02 },
      // Closed eyes: two calm curved lids, and a gentle smile.
      ...[0.07, -0.05].flatMap((z0): Shape[] => chain(Array.from({ length: 6 }, (_, i): V3 => {
        const a = rad(200 + i * 28), z = z0 + 0.032 * Math.cos(a), y = 0.71 + 0.022 * Math.sin(a);
        return [Math.sqrt(Math.max(0, 0.165 ** 2 - z * z - (y - 0.7) ** 2)), y, z];
      }), 0.009, 0.009, "lid", 0, true)),
      { t: "cap", a: [0.17, 0.62, -0.02], b: [0.165, 0.62, 0.04], r: [0.007, 0.007], col: "mouth", paint: true },
      // Arms resting, hands on the knees.
      { t: "cap", a: [-0.02, 0.52, 0.15], b: [0.08, 0.3, 0.22], r: [0.045, 0.045], col: "robe", k: 0.02 },
      { t: "ell", c: [0.1, 0.25, 0.22], r: [0.04, 0.04, 0.04], col: "skin", k: 0.02 },
      { t: "cap", a: [-0.02, 0.52, -0.15], b: [0.08, 0.3, -0.22], r: [0.045, 0.045], col: "robe", k: 0.02 },
      { t: "ell", c: [0.1, 0.25, -0.22], r: [0.04, 0.04, 0.04], col: "skin", k: 0.02 },
      dot([0.12, 0.29, 0.22], 0.016, "aura2"),
      dot([0.12, 0.29, -0.22], 0.016, "aura2"),
      ], FRONT),
      // Floating candles.
      ...candle([0.42, 0.62, 0.1], 0.12),
      ...candle([-0.42, 0.48, 0.12], 0.1),
      ...candle([0.36, 0.2, -0.2], 0.09),
      ...candle([-0.3, 0.98, -0.1], 0.08),
      ...sparkle([0.28, 0.98, 0.05], 0.05, "glint"),
      ...sparkle([-0.46, 0.18, 0.05], 0.04, "aura2"),
    ],
    eyes: [],
  },
};
