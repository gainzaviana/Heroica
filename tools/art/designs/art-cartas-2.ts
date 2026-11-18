import type { Sculpt, Shape, V3 } from "../sculpt";
import { rad, burst, turn, FRONT } from "./kit";

// Player cards for Funámbula (crimson + white silk), Mole Tronante (stone green, purple-grey,
// electric yellow), Centella Estelar (gold + deep blue) and Soberano de Oricalco (purple, gold,
// violet glow).

// MARK: Helpers

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

/** Capsules through a list of points, radius tapering from r0 to r1. */
function chain(pts: V3[], r0: number, r1: number, col: string, k = 0.02, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
  }
  return out;
}

/** Points on a circular arc in the xy plane (degrees). */
function arcPts(c: V3, R: number, a0: number, a1: number, n: number, ry = R): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) { const a = rad(a0 + ((a1 - a0) * i) / n); out.push([c[0] + R * Math.cos(a), c[1] + ry * Math.sin(a), c[2]]); }
  return out;
}

/** Points on a quadratic Bézier curve. */
function bez(p0: V3, p1: V3, p2: V3, n = 10): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1, 2].map((j) => u * u * p0[j] + 2 * u * t * p1[j] + t * t * p2[j]) as V3);
  }
  return out;
}

/** A puffy five-point star facing the camera. */
function star5(c: V3, R: number, col: string, tilt = 90, depth = 0.07): Shape[] {
  return [
    ...burst(c, 5, tilt, R, [R * 0.36, R * 0.06], col, undefined, 0.04),
    { t: "ell", c, r: [R * 0.45, R * 0.45, depth], col, k: 0.04 },
  ];
}

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

/** A zigzag bolt through points. */
function bolt(pts: V3[], r: number, col: string): Shape[] {
  return chain(pts, r, r * 0.6, col, 0.005);
}

/** A raised fist (knuckles toward +x, fingers along z), wrist at y ≈ 0.05, top at y ≈ 0.88. */
function fist(skin: string, cuff: string): Shape[] {
  return [
    { t: "cap", a: [-0.02, 0.05, 0], b: [0, 0.36, 0], r: [0.14, 0.15], col: cuff, k: 0.06 },
    { t: "box", c: [-0.02, 0.6, 0], s: [0.17, 0.2, 0.23], round: 0.1, col: skin, k: 0.06 },
    ...[-0.17, -0.06, 0.05, 0.16].map((z): Shape => ({ t: "cap", a: [0.0, 0.8, z], b: [0.17, 0.76, z], r: [0.075, 0.068], col: skin, k: 0.025 })),
    ...[-0.17, -0.06, 0.05, 0.16].map((z): Shape => ({ t: "ell", c: [0.19, 0.64, z], r: [0.07, 0.085, 0.06], col: skin, k: 0.025 })),
    { t: "cap", a: [0.0, 0.5, 0.24], b: [0.22, 0.56, 0.12], r: [0.075, 0.06], col: skin, k: 0.04 },
  ];
}

/** An open hand, palm toward +z, fingers up; thumb on the `side` (+1 = +x). Wrist at y ≈ 0.05. */
function hand(skin: string, cuff: string, side: 1 | -1 = 1): Shape[] {
  const len = [0.19, 0.25, 0.24, 0.2];
  return [
    { t: "cap", a: [0, 0.05, 0], b: [0, 0.3, 0], r: [0.1, 0.1], col: cuff, k: 0.04 },
    { t: "box", c: [0, 0.42, 0], s: [0.15, 0.15, 0.065], round: 0.06, col: skin, k: 0.05 },
    ...[-0.105, -0.035, 0.035, 0.105].map((x, i): Shape => ({ t: "cap", a: [x * side, 0.52, 0], b: [x * 1.2 * side, 0.52 + len[i], 0], r: [0.042, 0.036], col: skin, k: 0.02 })),
    { t: "cap", a: [0.12 * side, 0.36, 0.01], b: [0.25 * side, 0.5, 0.04], r: [0.048, 0.04], col: skin, k: 0.03 },
  ];
}

/** A boot, toe toward +x, sole at y ≈ 0, shin up to y ≈ 0.2. */
function boot(col: string, sole: string): Shape[] {
  return [
    { t: "cap", a: [-0.02, 0.06, 0], b: [-0.04, 0.24, 0], r: [0.065, 0.06], col, k: 0.04 },
    { t: "ell", c: [0.05, 0.05, 0], r: [0.12, 0.06, 0.065], col, k: 0.05 },
    { t: "box", c: [0.04, 0.0, 0], s: [0.13, 0.015, 0.065], round: 0.012, col: sole, k: 0.01 },
    { t: "tor", c: [-0.04, 0.22, 0], R: 0.06, r: 0.016, col: sole, k: 0.01 },
  ];
}

/** A dagger pointing +y from the origin. */
function dagger(): Shape[] {
  return [
    { t: "ell", c: [0, 0.04, 0], r: [0.035, 0.035, 0.035], col: "gold", k: 0.01 },
    { t: "cap", a: [0, 0.06, 0], b: [0, 0.2, 0], r: [0.026, 0.026], col: "grip", k: 0.01 },
    { t: "cap", a: [-0.08, 0.22, 0], b: [0.08, 0.22, 0], r: [0.026, 0.026], col: "grip", k: 0.01 },
    { t: "ell", c: [0, 0.22, 0.02], r: [0.028, 0.028, 0.025], col: "gem", k: 0.01 },
    { t: "ell", c: [0, 0.4, 0], r: [0.065, 0.16, 0.02], col: "blade", k: 0.02 },
    { t: "cap", a: [0, 0.48, 0], b: [0, 0.68, 0], r: [0.05, 0.004], col: "blade", k: 0.03 },
    { t: "cap", a: [0, 0.28, 0.02], b: [0, 0.56, 0.02], r: [0.016, 0.008], col: "gold", paint: true },
  ];
}

/** "¡Por Oricalcia!": a fist raising a purple royal banner with a golden crown, lit by the resource colour. */
function porOricalcia(accent: string, light: string): Sculpt {
  return {
    palette: { pole: "#e9b52a", gold: "#f2c33a", goldD: "#b8861a", banner: "#6b3fa0", bannerD: "#4a2878", skin: "#6b4630", acc: accent, accL: light },
    glow: ["acc", "accL"],
    shapes: [
      { t: "ell", c: [0.06, 0.7, -0.2], r: [0.42, 0.42, 0.03], col: "acc", k: 0 },
      ...burst([0.06, 0.7, -0.18], 12, 90, 0.62, [0.1, 0.014], "acc", { len: 0.52, r: [0.08, 0.012], col: "accL" }, 0.02),
      { t: "cap", a: [-0.24, 0.12, 0], b: [-0.24, 1.08, 0], r: [0.028, 0.028], col: "pole", k: 0.01 },
      { t: "ell", c: [-0.24, 1.1, 0], r: [0.045, 0.045, 0.045], col: "gold", k: 0.01 },
      { t: "cap", a: [-0.24, 1.12, 0], b: [-0.24, 1.22, 0], r: [0.035, 0.005], col: "gold", k: 0.01 },
      { t: "cap", a: [-0.24, 1.0, 0], b: [0.36, 1.0, 0], r: [0.022, 0.022], col: "goldD", k: 0.01 },
      { t: "box", c: [-0.12, 0.74, 0.0], s: [0.1, 0.25, 0.022], round: 0.015, col: "banner", k: 0.03, rot: [0, 12, 0] },
      { t: "box", c: [0.06, 0.74, 0.02], s: [0.1, 0.25, 0.022], round: 0.015, col: "banner", k: 0.03, rot: [0, -12, 0] },
      { t: "box", c: [0.24, 0.74, 0.0], s: [0.1, 0.25, 0.022], round: 0.015, col: "banner", k: 0.03, rot: [0, 12, 0] },
      { t: "ell", c: [-0.08, 0.5, 0.01], r: [0.14, 0.09, 0.022], rot: [0, 0, -25], col: "banner", k: 0.03 },
      { t: "ell", c: [0.2, 0.5, 0.01], r: [0.14, 0.09, 0.022], rot: [0, 0, 25], col: "banner", k: 0.03 },
      { t: "box", c: [0.06, 0.95, 0.03], s: [0.32, 0.045, 0.04], round: 0.01, col: "acc", paint: true },
      { t: "box", c: [0.06, 0.62, 0.03], s: [0.32, 0.04, 0.05], round: 0.01, col: "acc", paint: true },
      // crown
      { t: "box", c: [0.06, 0.72, 0.05], s: [0.13, 0.035, 0.03], round: 0.015, col: "gold", k: 0.01 },
      ...[-0.07, 0.06, 0.19].map((x, i): Shape => ({ t: "cap", a: [x, 0.74, 0.05], b: [x, i === 1 ? 0.92 : 0.86, 0.05], r: [0.04, 0.012], col: "gold", k: 0.02 })),
      ...[-0.07, 0.06, 0.19].map((x, i): Shape => ({ t: "ell", c: [x, i === 1 ? 0.93 : 0.87, 0.05], r: [0.022, 0.022, 0.022], col: "gold", k: 0.01 })),
      { t: "ell", c: [0.06, 0.72, 0.08], r: [0.028, 0.028, 0.02], col: "accL", k: 0.005 },
      // tassels
      { t: "cap", a: [0.36, 1.0, 0], b: [0.38, 0.86, 0.02], r: [0.01, 0.03], col: "acc", k: 0.01 },
      // fist gripping the pole
      ...place(turn(fist("skin", "gold"), FRONT), 0.46, [-0.27, -0.06, 0.03]),
    ],
    eyes: [],
  };
}

// MARK: Designs

const SILK = "#ffffff";
const CRIMSON = "#c0263f";
const CRIMSON_D = "#7c1426";

const MOLE = { skin: "#3f8a3a", skinL: "#5fae4f", cuff: "#6e6382", zap: "#ffe23a", earth: "#8c7d66", rock: "#8e969d" };

export const artCartas2: Record<string, Sculpt> = {
  // Lanzadores de Seda: a crimson wrist launcher shooting a ribbon of white silk.
  "lanzadores-seda": {
    palette: { cuff: CRIMSON, dark: CRIMSON_D, metal: "#d9dde3", silk: SILK, gem: "#ff6b8a" },
    glow: ["gem"],
    shapes: [
      { t: "cap", a: [-0.46, 0.22, 0], b: [-0.02, 0.38, 0], r: [0.12, 0.13], col: "cuff", k: 0.03 },
      { t: "tor", c: [-0.34, 0.265, 0], R: 0.125, r: 0.028, rot: [0, 0, -70], col: "dark", k: 0.01 },
      { t: "tor", c: [-0.1, 0.35, 0], R: 0.13, r: 0.028, rot: [0, 0, -70], col: "dark", k: 0.01 },
      { t: "ell", c: [0.1, 0.42, 0], r: [0.12, 0.1, 0.11], col: "dark", k: 0.04 },
      { t: "box", c: [-0.2, 0.46, 0], s: [0.13, 0.05, 0.07], round: 0.03, rot: [0, 0, 20], col: "metal", k: 0.02 },
      { t: "cap", a: [-0.08, 0.5, 0], b: [0.04, 0.55, 0], r: [0.04, 0.032], col: "metal", k: 0.01 },
      { t: "ell", c: [-0.22, 0.36, 0.12], r: [0.04, 0.04, 0.03], col: "gem", k: 0.01 },
      ...chain(bez([0.05, 0.56, 0], [0.32, 0.62, 0], [0.4, 1.02, 0]), 0.03, 0.022, "silk", 0.01),
      ...chain(bez([0.05, 0.56, 0.02], [0.4, 0.5, 0.06], [0.52, 0.86, 0.04]), 0.022, 0.018, "silk", 0.01),
      ...sparkle([0.42, 1.06, 0.02], 0.08, "silk"),
      ...sparkle([0.56, 0.9, 0.04], 0.06, "silk"),
    ],
    eyes: [],
  },

  // Voltereta: a backflip loop of crimson and white ribbon, a boot at its leading end.
  voltereta: {
    palette: { trail: CRIMSON, silk: SILK, boot: CRIMSON_D, sole: "#2a2232", floor: "#e6d3bb", spark: "#ffd0da" },
    glow: ["spark"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.42, 0.03, 0.26], col: "floor" },
      ...chain(arcPts([0, 0.55, 0], 0.4, -60, 205, 16), 0.012, 0.075, "trail", 0.02),
      ...chain(arcPts([0, 0.55, 0.04], 0.29, -40, 190, 14), 0.01, 0.04, "silk", 0.02),
      ...place(rotZ(boot("boot", "sole"), 110), 1.1, [-0.39, 0.41, 0.02]),
      ...sparkle([0.32, 0.12, 0.05], 0.07, "spark"),
      ...sparkle([0.0, 1.03, 0.05], 0.06, "spark"),
    ],
    eyes: [],
  },

  // Patada Pendular: a crimson boot swinging on a silk line, swing arc behind, impact flash ahead.
  "patada-pendular": {
    palette: { silk: SILK, trail: CRIMSON, boot: CRIMSON, sole: "#2a2232", metal: "#c3c8d0", hit: "#ffd84a", hot: "#ffffff" },
    glow: ["hit", "hot"],
    shapes: [
      { t: "tor", c: [-0.3, 1.02, 0], R: 0.05, r: 0.018, rot: [90, 0, 0], col: "metal", k: 0 },
      { t: "cap", a: [-0.3, 0.97, 0], b: [0.06, 0.4, 0], r: [0.02, 0.022], col: "silk", k: 0.01 },
      ...chain(arcPts([-0.3, 1.02, -0.04], 0.68, -150, -72, 10), 0.008, 0.05, "trail", 0.02),
      ...chain(arcPts([-0.3, 1.02, -0.02], 0.56, -145, -76, 9), 0.006, 0.03, "silk", 0.02),
      ...place(rotZ(boot("boot", "sole"), 15), 1.7, [0.06, 0.2, 0]),
      ...burst([0.42, 0.42, 0], 8, 0, 0.17, [0.05, 0.01], "hit", { len: 0.11, r: [0.04, 0.01], col: "hot" }, 0.03),
      { t: "ell", c: [0.42, 0.42, 0], r: [0.06, 0.06, 0.05], col: "hot", k: 0.03 },
    ],
    eyes: [],
  },

  // Red Atrapante: a lump bound tight in white silk ribbons with a crimson bow, dizzy stars above.
  "red-atrapante": {
    palette: { lump: "#6e5a7e", silk: SILK, bow: CRIMSON, star: "#ffd84a" },
    glow: ["star"],
    shapes: [
      { t: "ell", c: [0, 0.4, 0], r: [0.27, 0.34, 0.24], col: "lump" },
      { t: "tor", c: [0, 0.4, 0], R: 0.26, r: 0.035, rot: [0, 0, 28], col: "silk", k: 0.01 },
      { t: "tor", c: [0, 0.4, 0], R: 0.26, r: 0.035, rot: [0, 0, -28], col: "silk", k: 0.01 },
      { t: "tor", c: [0, 0.22, 0], R: 0.235, r: 0.033, col: "silk", k: 0.01 },
      { t: "tor", c: [0, 0.58, 0], R: 0.22, r: 0.033, col: "silk", k: 0.01 },
      { t: "tor", c: [0, 0.4, 0], R: 0.265, r: 0.03, rot: [90, 0, 0], col: "silk", k: 0.01 },
      // bow on the front
      { t: "ell", c: [-0.09, 0.46, 0.24], r: [0.09, 0.055, 0.03], rot: [0, 0, 20], col: "bow", k: 0.02 },
      { t: "ell", c: [0.09, 0.46, 0.24], r: [0.09, 0.055, 0.03], rot: [0, 0, -20], col: "bow", k: 0.02 },
      { t: "ell", c: [0, 0.45, 0.25], r: [0.035, 0.035, 0.03], col: "bow", k: 0.01 },
      { t: "cap", a: [0, 0.44, 0.25], b: [-0.08, 0.3, 0.26], r: [0.022, 0.014], col: "bow", k: 0.01 },
      { t: "cap", a: [0, 0.44, 0.25], b: [0.07, 0.29, 0.26], r: [0.022, 0.014], col: "bow", k: 0.01 },
      ...chain(bez([0.2, 0.68, 0], [0.38, 0.8, 0], [0.42, 0.62, 0]), 0.022, 0.012, "silk", 0.01),
      ...star5([-0.22, 0.92, 0.05], 0.08, "star", 90, 0.03),
      ...star5([0.04, 0.98, 0.05], 0.07, "star", 100, 0.03),
      ...star5([0.26, 0.9, 0.05], 0.06, "star", 80, 0.03),
    ],
    eyes: [],
  },

  // Salto entre Tejados: two night rooftops with a crimson leap arc between them.
  "salto-tejados": {
    palette: { wall: "#7b6e8f", wall2: "#94869f", roof: "#4a3f5c", win: "#ffd86b", trail: CRIMSON, silk: SILK, star: "#fff4c0" },
    glow: ["win", "star"],
    shapes: [
      { t: "box", c: [-0.32, 0.3, 0], s: [0.17, 0.3, 0.18], round: 0.02, col: "wall", k: 0.01 },
      { t: "box", c: [-0.32, 0.61, 0], s: [0.19, 0.025, 0.2], round: 0.012, col: "roof", k: 0.01 },
      { t: "box", c: [-0.4, 0.69, -0.06], s: [0.035, 0.06, 0.035], round: 0.01, col: "roof", k: 0.01 },
      { t: "box", c: [0.3, 0.2, 0.02], s: [0.16, 0.2, 0.18], round: 0.02, col: "wall2", k: 0.01 },
      { t: "box", c: [0.3, 0.41, 0.02], s: [0.18, 0.025, 0.2], round: 0.012, col: "roof", k: 0.01 },
      { t: "cap", a: [0.38, 0.44, -0.06], b: [0.38, 0.56, -0.06], r: [0.05, 0.05], col: "wall", k: 0.01 },
      ...[[-0.4, 0.45], [-0.24, 0.45], [-0.4, 0.27], [-0.24, 0.27], [-0.4, 0.1]].map(([x, y]): Shape => ({ t: "box", c: [x, y, 0.18], s: [0.04, 0.05, 0.02], round: 0.01, col: "win", paint: true })),
      ...[[0.22, 0.27], [0.38, 0.27], [0.22, 0.1]].map(([x, y]): Shape => ({ t: "box", c: [x, y, 0.2], s: [0.04, 0.05, 0.02], round: 0.01, col: "win", paint: true })),
      ...chain(bez([-0.24, 0.66, 0.05], [0.0, 1.25, 0.08], [0.24, 0.5, 0.05]), 0.012, 0.055, "trail", 0.02),
      ...chain(bez([-0.2, 0.7, 0.1], [0.0, 1.14, 0.12], [0.2, 0.56, 0.1]), 0.008, 0.025, "silk", 0.02),
      ...sparkle([0.3, 0.52, 0.1], 0.07, "star"),
      ...sparkle([-0.08, 1.02, 0], 0.05, "star"),
    ],
    eyes: [],
  },

  // Abuela Teresa: a cosy polka-dot soup pot on a trivet, steam curling into a heart.
  "abuela-teresa": {
    palette: { pot: "#c84a32", rim: "#f6efe2", lid: "#a8372a", dot: "#ffe9d6", wood: "#9a6a44", metal: "#b9bec6", steam: "#ffffff", heart: "#ff6b8a" },
    glow: ["heart"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.34, 0.04, 0.34], col: "wood" },
      { t: "cap", a: [0, 0.12, 0], b: [0, 0.38, 0], r: [0.27, 0.27], col: "pot", k: 0.03 },
      { t: "tor", c: [0, 0.4, 0], R: 0.27, r: 0.025, col: "rim", k: 0.01 },
      { t: "ell", c: [0, 0.44, 0], r: [0.26, 0.06, 0.26], col: "lid", k: 0.02 },
      { t: "ell", c: [0, 0.52, 0], r: [0.05, 0.035, 0.05], col: "rim", k: 0.02 },
      { t: "tor", c: [0.3, 0.32, 0], R: 0.055, r: 0.02, rot: [90, 0, 0], col: "metal", k: 0.01, mirror: false },
      { t: "tor", c: [-0.3, 0.32, 0], R: 0.055, r: 0.02, rot: [90, 0, 0], col: "metal", k: 0.01 },
      ...[[-0.14, 0.3, 0.22], [0.0, 0.2, 0.27], [0.14, 0.32, 0.22], [0.06, 0.34, 0.26], [-0.08, 0.17, 0.26], [0.18, 0.18, 0.2], [-0.2, 0.22, 0.17]].map((c): Shape => ({ t: "ell", c: c as V3, r: [0.028, 0.028, 0.03], col: "dot", paint: true })),
      { t: "cap", a: [0.1, 0.46, 0.12], b: [0.3, 0.68, 0.16], r: [0.022, 0.022], col: "metal", k: 0.01 },
      ...chain([[-0.12, 0.52, 0], [-0.17, 0.62, 0], [-0.1, 0.72, 0], [-0.16, 0.82, 0]], 0.03, 0.015, "steam", 0.02),
      ...chain([[0.12, 0.54, -0.03], [0.17, 0.62, -0.03], [0.13, 0.7, -0.03]], 0.026, 0.014, "steam", 0.02),
      { t: "ell", c: [-0.03, 0.92, 0.02], r: [0.07, 0.07, 0.05], col: "heart", k: 0.02 },
      { t: "ell", c: [0.09, 0.92, 0.02], r: [0.07, 0.07, 0.05], col: "heart", k: 0.02 },
      { t: "box", c: [0.03, 0.86, 0.02], s: [0.075, 0.075, 0.045], round: 0.025, rot: [0, 0, 45], col: "heart", k: 0.03 },
    ],
    eyes: [],
  },

  // Visión Periférica: a wide-open eye with nested crimson and white sight arcs on both sides.
  "vision-periferica": {
    palette: { white: "#ffffff", lid: CRIMSON, iris: "#d4405a", pupil: "#2a1420", arc: CRIMSON, arc2: "#ffb3c0" },
    glow: ["arc2"],
    shapes: [
      { t: "ell", c: [0, 0.5, -0.02], r: [0.33, 0.2, 0.09], col: "lid" },
      { t: "ell", c: [0, 0.5, 0.01], r: [0.29, 0.16, 0.1], col: "white", k: 0.01 },
      { t: "ell", c: [0, 0.5, 0.1], r: [0.11, 0.11, 0.06], col: "iris", paint: true },
      { t: "ell", c: [0, 0.5, 0.11], r: [0.05, 0.05, 0.06], col: "pupil", paint: true },
      { t: "ell", c: [0.035, 0.54, 0.11], r: [0.022, 0.022, 0.05], col: "white", paint: true },
      ...[0.44, 0.56, 0.68].flatMap((R, i): Shape[] => [
        ...chain(arcPts([0, 0.5, 0], R, -38 + i * 4, 38 - i * 4, 6), 0.03 - i * 0.004, 0.03 - i * 0.004, i === 1 ? "arc2" : "arc", 0.01),
        ...chain(arcPts([0, 0.5, 0], R, 142 + i * 4, 218 - i * 4, 6), 0.03 - i * 0.004, 0.03 - i * 0.004, i === 1 ? "arc2" : "arc", 0.01),
      ]),
    ],
    eyes: [],
  },

  // Golpe Sincronizado: a crimson-gloved fist punching past a clock face, a spark at the knuckles.
  "golpe-sincronizado": {
    palette: { face: "#fff7ea", rim: CRIMSON, hand: "#2a2232", tick: "#7c1426", glove: CRIMSON, cuff: "#f0e6e8", zap: "#ffd84a", hot: "#ffffff" },
    glow: ["zap", "hot"],
    shapes: [
      { t: "ell", c: [-0.1, 0.58, -0.12], r: [0.34, 0.34, 0.05], col: "face" },
      { t: "tor", c: [-0.1, 0.58, -0.12], R: 0.34, r: 0.045, rot: [90, 0, 0], col: "rim", k: 0.01 },
      { t: "ell", c: [-0.1, 0.97, -0.12], r: [0.06, 0.04, 0.04], col: "rim", k: 0.02 },
      ...Array.from({ length: 12 }, (_, i): Shape => ({ t: "ell", c: [-0.1 + 0.27 * Math.cos(rad(i * 30)), 0.58 + 0.27 * Math.sin(rad(i * 30)), -0.07], r: [0.02, 0.02, 0.02], col: "tick", paint: true })),
      { t: "cap", a: [-0.1, 0.58, -0.06], b: [-0.1, 0.8, -0.06], r: [0.022, 0.016], col: "hand", k: 0 },
      { t: "cap", a: [-0.1, 0.58, -0.06], b: [-0.26, 0.5, -0.06], r: [0.022, 0.016], col: "hand", k: 0 },
      { t: "ell", c: [-0.1, 0.58, -0.06], r: [0.03, 0.03, 0.02], col: "rim", k: 0 },
      ...place(turn(rotZ(fist("glove", "cuff"), -90), -30), 0.55, [-0.02, 0.38, 0.14]),
      ...burst([0.44, 0.34, 0.12], 8, 0, 0.16, [0.045, 0.01], "zap", { len: 0.1, r: [0.035, 0.01], col: "hot" }, 0.03),
    ],
    eyes: [],
  },

  // Golpe Demoledor: a giant green fist smashing down into cracked, crackling ground.
  "golpe-demoledor": {
    palette: { ...MOLE },
    glow: ["zap"],
    shapes: [
      { t: "ell", c: [0, 0.05, 0], r: [0.55, 0.06, 0.45], col: "earth" },
      { t: "tor", c: [0, 0.1, 0], R: 0.42, r: 0.022, col: "zap", k: 0.01 },
      ...[20, 80, 150, 210, 280, 330].map((a): Shape => ({ t: "cap", a: [0.12 * Math.cos(rad(a)), 0.105, 0.12 * Math.sin(rad(a))], b: [0.45 * Math.cos(rad(a + 10)), 0.08, 0.38 * Math.sin(rad(a + 10))], r: [0.022, 0.01], col: "zap", paint: true })),
      ...place(turn(rotZ([
        ...fist("skin", "cuff"),
        { t: "cap", a: [-0.02, 0.05, 0], b: [-0.04, -0.12, 0], r: [0.15, 0.16], col: "skin", k: 0.05 },
      ], -140, [0, 0.46, 0]), -30), 0.85, [0.0, 0.2, 0]),
      ...burst([0.12, 0.14, 0.15], 7, 20, 0.16, [0.04, 0.01], "zap", undefined, 0.02),
      ...bolt([[0.3, 0.75, 0.1], [0.4, 0.62, 0.12], [0.34, 0.58, 0.12], [0.46, 0.44, 0.12]], 0.022, "zap"),
      ...bolt([[-0.32, 0.7, 0.1], [-0.42, 0.56, 0.1], [-0.36, 0.52, 0.1], [-0.46, 0.38, 0.1]], 0.022, "zap"),
      { t: "ell", c: [0.42, 0.24, 0.2], r: [0.05, 0.045, 0.05], col: "rock", rot: [20, 10, 30] },
      { t: "ell", c: [-0.44, 0.22, -0.1], r: [0.05, 0.04, 0.05], col: "rock", rot: [10, 40, 0] },
      { t: "ell", c: [0.26, 0.3, -0.25], r: [0.04, 0.035, 0.04], col: "rock" },
    ],
    eyes: [],
  },

  // Palmada Sísmica: two huge green hands clapping, yellow shockwave rings and crackles.
  "palmada-sismica": {
    palette: { ...MOLE },
    glow: ["zap"],
    shapes: [
      { t: "tor", c: [0, 0.6, -0.15], R: 0.36, r: 0.022, rot: [90, 0, 0], col: "zap", k: 0 },
      { t: "tor", c: [0, 0.6, -0.2], R: 0.5, r: 0.018, rot: [90, 0, 0], col: "zap", k: 0 },
      ...rotZ(place(turn(hand("skin", "cuff", -1), 62), 1, [-0.1, 0, 0]), -22, [0, 0.95, 0]),
      ...rotZ(place(turn(hand("skin", "cuff", 1), -62), 1, [0.1, 0, 0]), 22, [0, 0.95, 0]),
      ...bolt([[0.12, 0.95, 0.05], [0.22, 1.05, 0.05], [0.18, 1.08, 0.05], [0.3, 1.18, 0.05]], 0.02, "zap"),
      ...bolt([[-0.12, 0.95, 0.05], [-0.22, 1.05, 0.05], [-0.18, 1.08, 0.05], [-0.3, 1.18, 0.05]], 0.02, "zap"),
      ...bolt([[0.36, 0.7, 0.05], [0.48, 0.74, 0.05], [0.46, 0.66, 0.05], [0.6, 0.7, 0.05]], 0.02, "zap"),
      ...bolt([[-0.36, 0.7, 0.05], [-0.48, 0.74, 0.05], [-0.46, 0.66, 0.05], [-0.6, 0.7, 0.05]], 0.02, "zap"),
    ],
    eyes: [],
  },

  // Salto Suborbital: a crater in the ground and a huge glowing leap trail arcing up to a green fist.
  "salto-suborbital": {
    palette: { ...MOLE, dark: "#5b5046", trail: "#fff3a0" },
    glow: ["zap", "trail"],
    shapes: [
      { t: "ell", c: [0, 0.05, 0], r: [0.55, 0.06, 0.42], col: "earth" },
      { t: "ell", c: [-0.2, 0.11, 0.05], r: [0.17, 0.02, 0.15], col: "dark", paint: true },
      { t: "tor", c: [-0.2, 0.1, 0.05], R: 0.19, r: 0.05, col: "rock", k: 0.03 },
      ...[30, 150, 260].map((a): Shape => ({ t: "cap", a: [-0.2 + 0.24 * Math.cos(rad(a)), 0.105, 0.05 + 0.2 * Math.sin(rad(a))], b: [-0.2 + 0.42 * Math.cos(rad(a)), 0.09, 0.05 + 0.33 * Math.sin(rad(a))], r: [0.018, 0.01], col: "zap", paint: true })),
      ...chain(bez([-0.2, 0.16, 0.05], [-0.18, 0.85, 0.05], [0.22, 0.86, 0.05]), 0.015, 0.1, "zap", 0.03),
      ...chain(bez([-0.17, 0.2, 0.1], [-0.14, 0.8, 0.1], [0.2, 0.84, 0.1]), 0.01, 0.05, "trail", 0.02),
      ...place(turn(rotZ(fist("skin", "cuff"), -60), FRONT + 20), 0.62, [0.18, 0.58, 0.02]),
      { t: "ell", c: [0.12, 0.3, 0.2], r: [0.04, 0.035, 0.04], col: "rock", rot: [20, 10, 30] },
      { t: "ell", c: [-0.42, 0.3, -0.05], r: [0.045, 0.04, 0.045], col: "rock" },
      { t: "ell", c: [-0.3, 0.5, 0.1], r: [0.03, 0.03, 0.03], col: "rock" },
    ],
    eyes: [],
  },

  // Fuerza Imparable: a green fist bursting the iron chains bound around its wrist.
  "fuerza-imparable": {
    palette: { ...MOLE, iron: "#7c8290", hot: "#ffffff" },
    glow: ["zap", "hot"],
    shapes: [
      ...turn(fist("skin", "cuff"), FRONT).map((s) => place([s], 0.9, [0, 0.03, 0])[0]),
      { t: "tor", c: [0, 0.22, 0], R: 0.15, r: 0.035, col: "iron", k: 0.01 },
      ...[-0.25, -0.36, -0.47, -0.58].map((x, i): Shape => ({ t: "tor", c: [x, 0.22 - i * 0.03, 0.02], R: 0.06, r: 0.022, rot: i % 2 ? [90, 0, 0] : [0, 0, 90], col: "iron", k: 0 })),
      { t: "tor", c: [0.25, 0.24, 0.02], R: 0.06, r: 0.022, rot: [0, 0, 90], col: "iron", k: 0 },
      { t: "tor", c: [0.52, 0.42, 0.05], R: 0.06, r: 0.022, rot: [60, 0, 30], col: "iron", k: 0 },
      { t: "tor", c: [0.62, 0.58, 0.02], R: 0.06, r: 0.022, rot: [10, 40, 70], col: "iron", k: 0 },
      { t: "cap", a: [0.38, 0.3, 0.05], b: [0.42, 0.36, 0.08], r: [0.022, 0.022], col: "iron", k: 0 },
      ...burst([0.36, 0.3, 0.06], 8, 15, 0.15, [0.04, 0.01], "zap", { len: 0.1, r: [0.03, 0.008], col: "hot" }, 0.03),
      ...bolt([[-0.22, 0.95, 0.05], [-0.3, 0.84, 0.05], [-0.24, 0.8, 0.05], [-0.34, 0.68, 0.05]], 0.02, "zap"),
    ],
    eyes: [],
  },

  // Furia sin Límites: two raised fists glowing red with rage inside a blazing red aura.
  "furia-sin-limites": {
    palette: { fist: "#d8322e", cuff: "#7a1414", aura: "#ff3b2a", aura2: "#ff9a3a", vein: "#ffe0d0" },
    glow: ["aura", "aura2"],
    shapes: [
      ...burst([0, 0.55, -0.25], 14, 90, 0.55, [0.1, 0.014], "aura", { len: 0.42, r: [0.08, 0.012], col: "aura2" }, 0.03),
      ...place(turn(rotZ(fist("fist", "cuff"), 14), FRONT), 0.62, [-0.2, 0.06, 0]),
      ...place(turn(rotZ(fist("fist", "cuff"), -14), FRONT - 10), 0.62, [0.2, 0.06, 0.06]),
      ...[0, 90, 180, 270].map((a): Shape => ({ t: "cap", a: [0.36 + 0.035 * Math.cos(rad(a)), 0.96 + 0.035 * Math.sin(rad(a)), 0.1], b: [0.36 + 0.09 * Math.cos(rad(a + 30)), 0.96 + 0.09 * Math.sin(rad(a + 30)), 0.1], r: [0.02, 0.012], col: "aura", k: 0.01 })),
    ],
    eyes: [],
  },

  // Laboratorio Subterráneo: a bench with a glowing tube, a bubbling flask and a monitor.
  "laboratorio-gamma": {
    palette: { bench: "#6e6382", metal: "#9aa0ae", glass: "#e4fbe8", goo: "#6af05a", screen: "#3fd86a", wave: "#ffe23a", frame: "#3a3446", rock: "#7d7268" },
    glow: ["goo", "screen", "wave"],
    shapes: [
      { t: "box", c: [0, 0.08, 0], s: [0.52, 0.06, 0.26], round: 0.03, col: "bench" },
      // glowing tube
      { t: "cap", a: [-0.3, 0.2, 0], b: [-0.3, 0.74, 0], r: [0.11, 0.11], col: "glass", k: 0.01 },
      { t: "cap", a: [-0.3, 0.22, 0.0], b: [-0.3, 0.62, 0.0], r: [0.125, 0.125], col: "goo", paint: true },
      ...[[-0.33, 0.35], [-0.27, 0.46], [-0.32, 0.56]].map(([x, y]): Shape => ({ t: "ell", c: [x, y, 0.11], r: [0.022, 0.022, 0.02], col: "glass", paint: true })),
      { t: "cap", a: [-0.3, 0.13, 0], b: [-0.3, 0.22, 0], r: [0.14, 0.14], col: "metal", k: 0.01 },
      { t: "cap", a: [-0.3, 0.74, 0], b: [-0.3, 0.82, 0], r: [0.14, 0.13], col: "metal", k: 0.01 },
      ...chain([[-0.2, 0.8, 0], [0.0, 0.88, -0.05], [0.22, 0.72, -0.1]], 0.02, 0.02, "frame", 0.01),
      // monitor
      { t: "box", c: [0.22, 0.52, -0.1], s: [0.2, 0.16, 0.035], round: 0.025, col: "frame", k: 0.01 },
      { t: "box", c: [0.22, 0.52, -0.065], s: [0.17, 0.13, 0.01], round: 0.01, col: "screen", paint: true },
      ...chain([[0.08, 0.5, -0.06], [0.14, 0.5, -0.06], [0.17, 0.6, -0.06], [0.21, 0.42, -0.06], [0.25, 0.56, -0.06], [0.29, 0.5, -0.06], [0.36, 0.5, -0.06]], 0.012, 0.012, "wave", 0, true),
      { t: "cap", a: [0.22, 0.14, -0.1], b: [0.22, 0.36, -0.1], r: [0.03, 0.03], col: "frame", k: 0.01 },
      // flask
      { t: "cap", a: [0.08, 0.15, 0.14], b: [0.08, 0.33, 0.14], r: [0.13, 0.045], col: "glass", k: 0.02 },
      { t: "cap", a: [0.08, 0.33, 0.14], b: [0.08, 0.45, 0.14], r: [0.04, 0.04], col: "glass", k: 0.02 },
      { t: "ell", c: [0.08, 0.16, 0.14], r: [0.15, 0.08, 0.15], col: "goo", paint: true },
      { t: "ell", c: [0.1, 0.55, 0.14], r: [0.035, 0.035, 0.035], col: "goo" },
      { t: "ell", c: [0.05, 0.64, 0.14], r: [0.025, 0.025, 0.025], col: "goo" },
      { t: "ell", c: [0.42, 0.14, 0.12], r: [0.06, 0.05, 0.06], col: "rock", rot: [0, 30, 10] },
    ],
    eyes: [],
  },

  // Piel Indestructible: a cracked green stone-skin plate, unbroken, a flattened bullet bouncing off.
  "piel-indestructible": {
    palette: { ...MOLE, plate: "#4f8f46", plate2: "#5fa354", crack: "#24461f", rim: "#6e6382", lead: "#b9bec6", hot: "#ffffff" },
    glow: ["zap", "hot"],
    shapes: [
      { t: "ell", c: [0, 0.52, -0.02], r: [0.4, 0.46, 0.12], col: "plate" },
      { t: "tor", c: [0, 0.52, -0.02], R: 0.41, r: 0.045, rot: [90, 0, 0], col: "rim", k: 0.01 },
      { t: "ell", c: [-0.14, 0.66, 0.08], r: [0.14, 0.12, 0.05], col: "plate2", k: 0.05 },
      { t: "ell", c: [0.14, 0.44, 0.08], r: [0.15, 0.13, 0.05], col: "plate2", k: 0.05 },
      ...chain([[0.0, 0.92, 0.1], [0.04, 0.78, 0.12], [-0.03, 0.66, 0.13], [0.04, 0.54, 0.13], [-0.02, 0.4, 0.12], [0.03, 0.2, 0.1]], 0.05, 0.04, "crack", 0, true),
      ...chain([[0.04, 0.54, 0.13], [0.18, 0.6, 0.12], [0.3, 0.56, 0.1]], 0.045, 0.035, "crack", 0, true),
      ...chain([[-0.03, 0.66, 0.13], [-0.18, 0.56, 0.12], [-0.3, 0.6, 0.1]], 0.045, 0.035, "crack", 0, true),
      { t: "ell", c: [0.08, 0.6, 0.15], r: [0.06, 0.06, 0.02], col: "lead", k: 0.01 },
      ...burst([0.08, 0.6, 0.17], 6, 10, 0.14, [0.035, 0.008], "zap", undefined, 0.02),
      { t: "cap", a: [0.3, 0.84, 0.2], b: [0.44, 0.96, 0.22], r: [0.03, 0.03], col: "lead", k: 0.01 },
      { t: "ell", c: [0.46, 0.98, 0.22], r: [0.04, 0.04, 0.04], col: "lead", k: 0.01 },
    ],
    eyes: [],
  },

  // Arrancar el Suelo: a slab of road ripped up by green hands, dirt and rocks falling from it.
  "arrancar-suelo": {
    palette: { ...MOLE, asphalt: "#4a4a55", dirt: "#7a5a3c", lane: "#ffd23a", dark: "#3e342c" },
    glow: ["zap"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.55, 0.05, 0.42], col: "earth" },
      { t: "ell", c: [0, 0.09, 0], r: [0.3, 0.01, 0.22], col: "dark", paint: true },
      { t: "box", c: [0, 0.58, 0], s: [0.4, 0.06, 0.24], round: 0.03, rot: [0, 0, 18], col: "asphalt", k: 0.01 },
      { t: "box", c: [0.02, 0.5, 0], s: [0.37, 0.05, 0.22], round: 0.04, rot: [0, 0, 18], col: "dirt", k: 0.04 },
      ...[-0.24, 0.0, 0.24].map((t): Shape => ({ t: "box", c: [t * Math.cos(rad(18)) - 0.06 * Math.sin(rad(18)), 0.58 + t * Math.sin(rad(18)) + 0.06 * Math.cos(rad(18)), 0], s: [0.07, 0.012, 0.025], round: 0.01, rot: [0, 0, 18], col: "lane", paint: true })),
      { t: "ell", c: [-0.1, 0.42, 0.05], r: [0.05, 0.05, 0.05], col: "dirt", k: 0.04 },
      { t: "ell", c: [0.15, 0.48, -0.05], r: [0.05, 0.04, 0.05], col: "dirt", k: 0.04 },
      ...place(turn(hand("skin", "cuff", 1), FRONT + 30), 0.55, [-0.36, 0.1, 0.16]),
      ...place(turn(hand("skin", "cuff", -1), -FRONT - 30), 0.55, [0.36, 0.22, 0.16]),
      { t: "ell", c: [-0.05, 0.28, 0.1], r: [0.04, 0.035, 0.04], col: "rock", rot: [20, 10, 30] },
      { t: "ell", c: [0.1, 0.22, -0.1], r: [0.035, 0.03, 0.035], col: "rock" },
      { t: "ell", c: [0.42, 0.95, 0.0], r: [0.045, 0.04, 0.045], col: "rock", rot: [10, 40, 0] },
      ...bolt([[-0.48, 0.75, 0.05], [-0.42, 0.66, 0.05], [-0.48, 0.62, 0.05], [-0.4, 0.52, 0.05]], 0.02, "zap"),
    ],
    eyes: [],
  },

  // Canal de Energía: a blue-and-gold capacitor with a glowing core and floating charge rings.
  "canal-energia": {
    palette: { body: "#1f3a8a", trim: "#d9a21b", core: "#ffd54a", ring: "#ffe68a", pip: "#8fd0ff" },
    glow: ["core", "ring", "pip"],
    shapes: [
      { t: "ell", c: [0, 0.05, 0], r: [0.22, 0.05, 0.22], col: "trim" },
      { t: "cap", a: [0, 0.1, 0], b: [0, 0.3, 0], r: [0.17, 0.17], col: "body", k: 0.02 },
      { t: "cap", a: [0, 0.3, 0], b: [0, 0.62, 0], r: [0.14, 0.14], col: "core", k: 0.01 },
      { t: "cap", a: [0, 0.62, 0], b: [0, 0.8, 0], r: [0.17, 0.17], col: "body", k: 0.01 },
      { t: "tor", c: [0, 0.31, 0], R: 0.16, r: 0.025, col: "trim", k: 0.01 },
      { t: "tor", c: [0, 0.62, 0], R: 0.16, r: 0.025, col: "trim", k: 0.01 },
      { t: "cap", a: [0, 0.85, 0], b: [0, 0.96, 0], r: [0.06, 0.06], col: "trim", k: 0.02 },
      ...[0.14, 0.2, 0.26].map((y, i): Shape => ({ t: "ell", c: [-0.06 + i * 0.06, y + 0.0, 0.16], r: [0.022, 0.022, 0.02], col: "pip", paint: true })),
      { t: "tor", c: [0, 0.46, 0], R: 0.3, r: 0.022, rot: [72, 0, 12], col: "ring", k: 0 },
      { t: "tor", c: [0, 0.5, 0], R: 0.38, r: 0.018, rot: [70, 0, -18], col: "ring", k: 0 },
      ...[[0.3, 0.88], [-0.32, 0.86], [-0.36, 0.2]].flatMap(([x, y]) => sparkle([x, y, 0.05], 0.06, "ring")),
    ],
    eyes: [],
  },

  // Ráfaga Fotónica: a gold photon beam fired from a blue gauntlet, rings along it, a flare at the end.
  "rafaga-fotonica": {
    palette: { arm: "#1f3a8a", trim: "#d9a21b", beam: "#ffd54a", core: "#ffffff", ring: "#7fb2ff" },
    glow: ["beam", "core", "ring"],
    shapes: [
      { t: "cap", a: [-0.55, 0.1, 0], b: [-0.32, 0.26, 0], r: [0.1, 0.12], col: "arm", k: 0.03 },
      { t: "tor", c: [-0.34, 0.25, 0], R: 0.12, r: 0.03, rot: [0, 0, -55], col: "trim", k: 0.01 },
      { t: "cap", a: [-0.3, 0.28, 0], b: [0.3, 0.7, 0], r: [0.07, 0.12], col: "beam", k: 0.02 },
      { t: "cap", a: [-0.28, 0.29, 0.06], b: [0.28, 0.69, 0.1], r: [0.025, 0.045], col: "core", paint: true },
      { t: "tor", c: [-0.1, 0.42, 0], R: 0.12, r: 0.02, rot: [0, 0, -55], col: "ring", k: 0 },
      { t: "tor", c: [0.1, 0.56, 0], R: 0.15, r: 0.02, rot: [0, 0, -55], col: "ring", k: 0 },
      ...burst([0.34, 0.73, 0], 10, 15, 0.26, [0.07, 0.012], "beam", { len: 0.17, r: [0.05, 0.01], col: "core" }, 0.03),
      { t: "ell", c: [0.34, 0.73, 0], r: [0.12, 0.12, 0.1], col: "core", k: 0.03 },
    ],
    eyes: [],
  },

  // Vuelo Cósmico: a winged gold star sweeping up on blue and gold trails.
  "vuelo-cosmico": {
    palette: { star: "#f2b51b", trail: "#2b4fae", trail2: "#ffd54a", wing: "#e8f0ff", spark: "#fff6d8" },
    glow: ["trail2", "spark"],
    shapes: [
      ...chain(bez([-0.5, 0.08, -0.04], [-0.05, 0.12, -0.04], [0.16, 0.64, -0.04]), 0.012, 0.08, "trail", 0.02),
      ...chain(bez([-0.42, 0.26, 0.02], [-0.06, 0.3, 0.02], [0.12, 0.66, 0.02]), 0.01, 0.045, "trail2", 0.02),
      { t: "ell", c: [0.04, 0.82, -0.04], r: [0.16, 0.05, 0.02], rot: [0, 0, 35], col: "wing", k: 0.02 },
      { t: "ell", c: [0.02, 0.74, -0.04], r: [0.15, 0.045, 0.02], rot: [0, 0, 20], col: "wing", k: 0.02 },
      ...star5([0.24, 0.7, 0.02], 0.24, "star", 100, 0.08),
      ...sparkle([-0.2, 0.62, 0.05], 0.07, "spark"),
      ...sparkle([0.44, 0.3, 0.05], 0.06, "spark"),
      ...sparkle([-0.36, 0.9, 0.0], 0.05, "spark"),
    ],
    eyes: [],
  },

  // Absorción de Energía: a gold spiral of energy swirling into a blue-gloved open palm.
  "absorcion-energia": {
    palette: { glove: "#1f3a8a", cuff: "#d9a21b", swirl: "#ffd54a", core: "#ffffff" },
    glow: ["swirl", "core"],
    shapes: [
      ...place(hand("glove", "cuff"), 1.3, [0, -0.06, -0.05]),
      { t: "ell", c: [0, 0.5, 0.04], r: [0.08, 0.08, 0.04], col: "core", k: 0.02 },
      ...chain(Array.from({ length: 28 }, (_, i): V3 => { const t = i / 27, a = rad(40 + t * 560), R = 0.34 - t * 0.29; return [R * Math.cos(a), 0.5 + R * 0.85 * Math.sin(a), 0.12 + 0.12 * (1 - t)]; }), 0.04, 0.012, "swirl", 0.02),
    ],
    eyes: [],
  },

  // Impacto Binario: a gold star and a blue-white star smashing together in a flash.
  "impacto-binario": {
    palette: { a: "#f2b51b", b: "#9fd0ff", trailA: "#ffd54a", trailB: "#3f6fd8", flash: "#ffffff" },
    glow: ["flash", "trailA"],
    shapes: [
      ...chain([[-0.62, 0.12, -0.05], [-0.45, 0.3, -0.05], [-0.26, 0.44, -0.05]], 0.015, 0.09, "trailA", 0.02),
      ...chain([[0.62, 0.98, -0.05], [0.45, 0.8, -0.05], [0.26, 0.66, -0.05]], 0.015, 0.09, "trailB", 0.02),
      ...burst([0, 0.55, 0.0], 10, 0, 0.42, [0.07, 0.01], "flash", undefined, 0.03),
      ...star5([-0.24, 0.46, 0.06], 0.25, "a", 100, 0.08),
      ...star5([0.24, 0.64, 0.06], 0.25, "b", 80, 0.08),
      { t: "ell", c: [0, 0.55, 0.12], r: [0.08, 0.08, 0.06], col: "flash", k: 0.02 },
    ],
    eyes: [],
  },

  // Base Orbital: a space station hub with a gold ring, blue solar wings and an antenna.
  "base-orbital": {
    palette: { hull: "#dfe6f2", band: "#1f3a8a", ring: "#d9a21b", panel: "#2b4fae", frame: "#c9ced8", light: "#ffd54a", grid: "#183070" },
    glow: ["light"],
    shapes: [
      { t: "cap", a: [-0.66, 0.5, 0], b: [0.66, 0.5, 0], r: [0.025, 0.025], col: "frame", k: 0 },
      { t: "ell", c: [0, 0.5, 0], r: [0.18, 0.18, 0.18], col: "hull" },
      { t: "tor", c: [0, 0.5, 0], R: 0.18, r: 0.03, col: "band", k: 0.01 },
      { t: "cap", a: [0, 0.26, 0], b: [0, 0.74, 0], r: [0.09, 0.09], col: "hull", k: 0.04 },
      { t: "tor", c: [0, 0.5, 0], R: 0.4, r: 0.05, rot: [22, 0, 12], col: "ring", k: 0 },
      ...[45, 135, 225, 315].map((a): Shape => ({ t: "cap", a: [0, 0.5, 0], b: [0.4 * Math.cos(rad(a)), 0.5, 0.4 * Math.sin(rad(a))], r: [0.018, 0.018], col: "frame", k: 0 })).map((sh) => rotZ([sh], 12, [0, 0.5, 0])[0]),
      ...[-1, 1].flatMap((s): Shape[] => [
        { t: "box", c: [0.6 * s, 0.5, 0], s: [0.13, 0.24, 0.016], round: 0.01, col: "panel", k: 0 },
        { t: "box", c: [0.6 * s, 0.5, 0.014], s: [0.008, 0.24, 0.01], round: 0.004, col: "grid", paint: true },
        { t: "box", c: [0.6 * s, 0.5, 0.014], s: [0.13, 0.008, 0.01], round: 0.004, col: "grid", paint: true },
      ]),
      { t: "cap", a: [0, 0.7, 0], b: [0, 0.9, 0], r: [0.015, 0.015], col: "frame", k: 0 },
      { t: "ell", c: [0, 0.92, 0], r: [0.06, 0.02, 0.06], col: "ring", k: 0.01 },
      { t: "ell", c: [0, 0.98, 0], r: [0.02, 0.02, 0.02], col: "light", k: 0 },
      ...[[0.06, 0.55], [-0.06, 0.55], [0.0, 0.42]].map(([x, y]): Shape => ({ t: "ell", c: [x * 1.2, y, 0.17], r: [0.03, 0.03, 0.03], col: "light", paint: true })),
    ],
    eyes: [],
  },

  // Energía Binaria: two energy spheres, gold and blue-white, chasing each other round an orbit.
  "energia-binaria": {
    palette: { a: "#ffd54a", b: "#bfe0ff", trailA: "#d9a21b", trailB: "#3f6fd8", core: "#1f3a8a", spark: "#fff6d8", ring: "#8fa8e0" },
    glow: ["a", "b", "spark"],
    shapes: (() => {
      const orbit = (t: number): V3 => { const a = rad(t), x = 0.42 * Math.cos(a), y = 0.17 * Math.sin(a), c = Math.cos(rad(-15)), s = Math.sin(rad(-15)); return [c * x - s * y, 0.52 + s * x + c * y, 0.22 * Math.sin(a)]; };
      const trail = (t0: number, t1: number) => Array.from({ length: 9 }, (_, i) => orbit(t0 + ((t1 - t0) * i) / 8));
      return [
        ...chain(Array.from({ length: 17 }, (_, i) => orbit((360 * i) / 16)), 0.012, 0.012, "ring", 0),
        { t: "ell", c: [0, 0.52, 0], r: [0.1, 0.1, 0.1], col: "core" },
        ...sparkle([0, 0.52, 0.08], 0.14, "spark"),
        ...chain(trail(-10, 75), 0.008, 0.045, "trailA", 0.02),
        ...chain(trail(170, 255), 0.008, 0.045, "trailB", 0.02),
        { t: "ell", c: orbit(90), r: [0.12, 0.12, 0.12], col: "a", k: 0.03 },
        { t: "ell", c: orbit(270), r: [0.12, 0.12, 0.12], col: "b", k: 0.03 },
      ] as Shape[];
    })(),
    eyes: [],
  },

  // Pulso Cósmico: a bright yellow four-point pulse star in widening yellow rings.
  "pulso-cosmico": {
    palette: { star: "#ffd21f", hot: "#fff6b0", ring: "#ffc400", white: "#ffffff" },
    glow: ["star", "hot", "ring", "white"],
    shapes: [
      { t: "tor", c: [0, 0.52, -0.06], R: 0.3, r: 0.028, rot: [90, 0, 0], col: "ring", k: 0 },
      { t: "tor", c: [0, 0.52, -0.1], R: 0.44, r: 0.022, rot: [90, 0, 0], col: "ring", k: 0 },
      ...burst([0, 0.52, 0], 4, 90, 0.5, [0.11, 0.012], "star", undefined, 0.06),
      ...burst([0, 0.52, 0], 4, 45, 0.24, [0.07, 0.01], "hot", undefined, 0.05),
      { t: "ell", c: [0, 0.52, 0.02], r: [0.12, 0.12, 0.1], col: "white", k: 0.05 },
      ...sparkle([0.38, 0.9, 0.04], 0.06, "star"),
      ...sparkle([-0.36, 0.16, 0.04], 0.06, "star"),
    ],
    eyes: [],
  },

  // Supernova: a huge starburst explosion, gold and orange rays, a blue shockwave ring.
  supernova: {
    palette: { gold: "#ffc21a", orange: "#ff7a1a", white: "#fff6d8", ring: "#3f6fd8", deep: "#1f3a8a" },
    glow: ["gold", "orange", "white"],
    shapes: [
      ...burst([0, 0.52, -0.05], 16, 90, 0.52, [0.07, 0.01], "gold", { len: 0.36, r: [0.06, 0.01], col: "orange" }, 0.03),
      { t: "ell", c: [0, 0.52, 0], r: [0.22, 0.22, 0.15], col: "orange", k: 0.04 },
      { t: "ell", c: [0, 0.52, 0.04], r: [0.15, 0.15, 0.14], col: "white", k: 0.04 },
      { t: "tor", c: [0, 0.52, 0], R: 0.4, r: 0.03, rot: [70, 0, 20], col: "ring", k: 0 },
      { t: "ell", c: [0.42, 0.95, 0.1], r: [0.035, 0.035, 0.035], col: "deep" },
      { t: "ell", c: [-0.46, 0.1, 0.05], r: [0.04, 0.04, 0.04], col: "deep" },
      { t: "ell", c: [-0.4, 0.92, -0.05], r: [0.03, 0.03, 0.03], col: "gold" },
    ],
    eyes: [],
  },

  // Garras de Oricalco: a golden gauntlet with long curved claws and violet glow seams.
  "garras-oricalco": {
    palette: { gold: "#e9b52a", goldD: "#b8861a", claw: "#fff0a8", cuff: "#6b3fa0", seam: "#c08bff" },
    glow: ["seam"],
    shapes: [
      { t: "cap", a: [0, 0.04, 0], b: [0, 0.38, 0], r: [0.14, 0.12], col: "gold", k: 0.03 },
      { t: "tor", c: [0, 0.08, 0], R: 0.14, r: 0.035, col: "cuff", k: 0.01 },
      { t: "tor", c: [0, 0.36, 0], R: 0.12, r: 0.03, col: "cuff", k: 0.01 },
      { t: "ell", c: [0, 0.5, 0], r: [0.17, 0.14, 0.09], col: "goldD", k: 0.05 },
      { t: "ell", c: [0, 0.5, 0.08], r: [0.05, 0.05, 0.03], col: "seam", k: 0.01 },
      { t: "cap", a: [0, 0.12, 0.13], b: [0, 0.32, 0.11], r: [0.015, 0.015], col: "seam", paint: true },
      { t: "cap", a: [-0.08, 0.14, 0.11], b: [-0.06, 0.3, 0.09], r: [0.012, 0.012], col: "seam", paint: true },
      { t: "cap", a: [0.08, 0.14, 0.11], b: [0.06, 0.3, 0.09], r: [0.012, 0.012], col: "seam", paint: true },
      ...[-0.12, -0.04, 0.04, 0.12].flatMap((x, i): Shape[] => {
        const top: V3 = [x * 1.5, 0.74 + (i === 1 || i === 2 ? 0.04 : 0), 0.03];
        return [
          { t: "cap", a: [x, 0.58, 0], b: top, r: [0.042, 0.036], col: "gold", k: 0.02 },
          { t: "cap", a: top, b: [x * 2.2, top[1] + 0.2, 0.12], r: [0.034, 0.006], col: "claw", k: 0.02 },
        ];
      }),
      { t: "cap", a: [0.16, 0.44, 0.02], b: [0.28, 0.56, 0.05], r: [0.045, 0.038], col: "gold", k: 0.03 },
      { t: "cap", a: [0.28, 0.56, 0.05], b: [0.4, 0.7, 0.12], r: [0.034, 0.006], col: "claw", k: 0.02 },
    ],
    eyes: [],
  },

  // Traje Reflectante: a golden suit on a stand, violet energy seams, glints bouncing off it.
  "traje-reflectante": {
    palette: { gold: "#e9b52a", goldD: "#b8861a", purple: "#6b3fa0", seam: "#c08bff", glint: "#ffffff", zap: "#ffe27a" },
    glow: ["seam", "glint", "zap"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.22, 0.035, 0.22], col: "purple" },
      { t: "cap", a: [0, 0.03, 0], b: [0, 0.32, 0], r: [0.03, 0.03], col: "goldD" },
      { t: "ell", c: [0, 0.58, 0], r: [0.22, 0.26, 0.14], col: "gold", k: 0.04 },
      { t: "cap", a: [0, 0.34, 0], b: [0, 0.44, 0], r: [0.15, 0.17], col: "purple", k: 0.04 },
      { t: "ell", c: [0.23, 0.75, 0], r: [0.1, 0.08, 0.1], col: "goldD", k: 0.04 },
      { t: "ell", c: [-0.23, 0.75, 0], r: [0.1, 0.08, 0.1], col: "goldD", k: 0.04 },
      { t: "cap", a: [0.27, 0.72, 0], b: [0.32, 0.52, 0], r: [0.07, 0.06], col: "gold", k: 0.03 },
      { t: "cap", a: [-0.27, 0.72, 0], b: [-0.32, 0.52, 0], r: [0.07, 0.06], col: "gold", k: 0.03 },
      { t: "cap", a: [0, 0.8, 0], b: [0, 0.9, 0], r: [0.07, 0.065], col: "purple", k: 0.02 },
      { t: "tor", c: [0, 0.82, 0], R: 0.09, r: 0.025, col: "goldD", k: 0.01 },
      { t: "ell", c: [0, 0.98, 0], r: [0.12, 0.12, 0.12], col: "gold", k: 0.03 },
      { t: "box", c: [0, 0.98, 0.1], s: [0.09, 0.03, 0.04], round: 0.02, col: "seam", paint: true },
      { t: "cap", a: [0, 1.08, 0], b: [0, 1.16, 0], r: [0.03, 0.008], col: "goldD", k: 0.02 },
      { t: "cap", a: [0, 0.78, 0.14], b: [0, 0.38, 0.14], r: [0.014, 0.014], col: "seam", paint: true },
      { t: "cap", a: [-0.16, 0.74, 0.1], b: [0, 0.62, 0.15], r: [0.012, 0.012], col: "seam", paint: true },
      { t: "cap", a: [0.16, 0.74, 0.1], b: [0, 0.62, 0.15], r: [0.012, 0.012], col: "seam", paint: true },
      { t: "cap", a: [-0.14, 0.48, 0.12], b: [0.14, 0.48, 0.12], r: [0.012, 0.012], col: "seam", paint: true },
      ...chain([[-0.6, 0.95, 0.05], [-0.18, 0.66, 0.15]], 0.02, 0.025, "zap", 0.01),
      ...chain([[-0.18, 0.66, 0.15], [-0.44, 0.36, 0.1]], 0.025, 0.012, "zap", 0.01),
      ...sparkle([-0.18, 0.66, 0.17], 0.1, "glint"),
      ...sparkle([0.36, 0.95, 0.05], 0.07, "glint"),
    ],
    eyes: [],
  },

  // Ordenador Táctico: a royal purple-and-gold console projecting a violet hologram screen.
  "ordenador-tactico": {
    palette: { body: "#6b3fa0", gold: "#e9b52a", holo: "#c9a0ff", line: "#6a3fc0", key: "#ffe27a", beam: "#e4d0ff" },
    glow: ["holo", "key", "beam"],
    shapes: [
      { t: "box", c: [0, 0.13, 0], s: [0.34, 0.1, 0.2], round: 0.05, col: "body" },
      { t: "box", c: [0, 0.25, 0.04], s: [0.3, 0.025, 0.15], round: 0.02, rot: [20, 0, 0], col: "gold", k: 0.02 },
      ...[-0.18, -0.06, 0.06, 0.18].map((x): Shape => ({ t: "box", c: [x, 0.27, 0.1], s: [0.04, 0.012, 0.03], round: 0.008, rot: [20, 0, 0], col: "key", paint: true })),
      { t: "tor", c: [0, 0.13, 0.19], R: 0.05, r: 0.012, rot: [90, 0, 0], col: "gold", k: 0 },
      { t: "cap", a: [-0.24, 0.3, -0.08], b: [-0.3, 0.42, -0.06], r: [0.012, 0.012], col: "beam", k: 0 },
      { t: "cap", a: [0.24, 0.3, -0.08], b: [0.3, 0.42, -0.06], r: [0.012, 0.012], col: "beam", k: 0 },
      { t: "box", c: [0, 0.64, -0.06], s: [0.36, 0.22, 0.012], round: 0.01, col: "holo", k: 0 },
      { t: "cap", a: [-0.36, 0.86, -0.06], b: [0.36, 0.86, -0.06], r: [0.02, 0.02], col: "gold", k: 0.005 },
      { t: "cap", a: [-0.36, 0.42, -0.06], b: [0.36, 0.42, -0.06], r: [0.02, 0.02], col: "gold", k: 0.005 },
      ...chain([[-0.3, 0.5, -0.045], [-0.18, 0.62, -0.045], [-0.06, 0.56, -0.045], [0.06, 0.72, -0.045]], 0.012, 0.012, "line", 0, true),
      { t: "tor", c: [0.18, 0.62, -0.045], R: 0.08, r: 0.012, rot: [90, 0, 0], col: "line", paint: true },
      { t: "ell", c: [0.18, 0.62, -0.045], r: [0.025, 0.025, 0.02], col: "line", paint: true },
      ...[-0.1, 0, 0.1].map((x, i): Shape => ({ t: "cap", a: [x, 0.88, -0.06], b: [x, i === 1 ? 1.02 : 0.97, -0.06], r: [0.03, 0.008], col: "gold", k: 0.02 })),
    ],
    eyes: [],
  },

  // Dagas de Oricalco: a fan of five golden throwing daggers with violet-gemmed grips.
  "dagas-oricalco": {
    palette: { blade: "#f2c33a", gold: "#b8861a", grip: "#6b3fa0", gem: "#c08bff" },
    glow: ["gem"],
    shapes: [-56, -28, 0, 28, 56].flatMap((a, i) => place(rotZ(place(dagger(), 1, [0, 0.12, 0]), a), 1.2, [0, 0.02, 0.04 * (2 - Math.abs(i - 2))])),
    eyes: [],
  },

  "por-oricalcia-e": porOricalcia("#f5c518", "#fff2a0"),
  "por-oricalcia-m": porOricalcia("#2f86e0", "#a8d4ff"),
  "por-oricalcia-f": porOricalcia("#e0393a", "#ffb0a0"),
  "por-oricalcia-c": porOricalcia("#2fb84f", "#b0f0b8"),

  // La Ciudad Dorada: a skyline of golden towers and purple domes with violet-lit windows.
  "ciudad-dorada": {
    palette: { gold: "#e9b52a", goldD: "#c4921c", dome: "#6b3fa0", base: "#4a2878", win: "#c08bff", spire: "#fff0a8" },
    glow: ["win", "spire"],
    shapes: [
      { t: "ell", c: [0, 0.05, 0], r: [0.58, 0.05, 0.3], col: "base" },
      // back row
      { t: "box", c: [-0.16, 0.38, -0.14], s: [0.08, 0.33, 0.08], round: 0.03, col: "goldD", k: 0.01 },
      { t: "cap", a: [-0.16, 0.7, -0.14], b: [-0.16, 0.86, -0.14], r: [0.08, 0.005], col: "dome", k: 0.01 },
      { t: "box", c: [0.2, 0.34, -0.14], s: [0.08, 0.29, 0.08], round: 0.03, col: "goldD", k: 0.01 },
      { t: "cap", a: [0.2, 0.62, -0.14], b: [0.2, 0.78, -0.14], r: [0.08, 0.005], col: "dome", k: 0.01 },
      // centre spire
      { t: "cap", a: [0, 0.08, 0], b: [0, 0.68, 0], r: [0.11, 0.09], col: "gold", k: 0.02 },
      { t: "tor", c: [0, 0.52, 0], R: 0.1, r: 0.022, col: "dome", k: 0.01 },
      { t: "ell", c: [0, 0.72, 0], r: [0.12, 0.11, 0.12], col: "dome", k: 0.02 },
      { t: "cap", a: [0, 0.8, 0], b: [0, 1.06, 0], r: [0.035, 0.006], col: "spire", k: 0.02 },
      // sides
      { t: "box", c: [-0.3, 0.24, 0.04], s: [0.09, 0.2, 0.09], round: 0.03, col: "gold", k: 0.01 },
      { t: "ell", c: [-0.3, 0.46, 0.04], r: [0.09, 0.08, 0.09], col: "dome", k: 0.02 },
      { t: "cap", a: [0.3, 0.08, 0.04], b: [0.3, 0.36, 0.04], r: [0.085, 0.085], col: "gold", k: 0.01 },
      { t: "cap", a: [0.3, 0.44, 0.04], b: [0.3, 0.6, 0.04], r: [0.09, 0.005], col: "dome", k: 0.01 },
      { t: "box", c: [-0.48, 0.14, 0.06], s: [0.06, 0.1, 0.06], round: 0.02, col: "goldD", k: 0.01 },
      { t: "box", c: [0.48, 0.13, 0.06], s: [0.06, 0.09, 0.06], round: 0.02, col: "goldD", k: 0.01 },
      ...[[0, 0.3, 0.1], [0, 0.42, 0.1], [-0.3, 0.3, 0.13], [-0.3, 0.17, 0.13], [0.3, 0.26, 0.12], [-0.48, 0.15, 0.12], [0.48, 0.14, 0.12]].map((c): Shape => ({ t: "box", c: c as V3, s: [0.022, 0.04, 0.02], round: 0.01, col: "win", paint: true })),
      ...sparkle([0, 1.1, 0.02], 0.06, "spire"),
    ],
    eyes: [],
  },

  // Oricalco Puro: a raw ore cluster of golden and glowing green crystals on dark rock.
  "oricalco-puro": {
    palette: { rock: "#4a3b5c", gold: "#ffcf3a", green: "#3fe07a", greenL: "#b0ffc8" },
    glow: ["green", "greenL"],
    shapes: [
      { t: "ell", c: [0, 0.12, 0], r: [0.38, 0.13, 0.3], col: "rock" },
      { t: "ell", c: [0.2, 0.1, 0.12], r: [0.14, 0.09, 0.12], col: "rock", rot: [0, 20, 0] },
      { t: "cap", a: [0, 0.14, 0], b: [0.02, 0.88, 0], r: [0.14, 0.02], col: "green", k: 0.03 },
      { t: "cap", a: [-0.12, 0.16, -0.04], b: [-0.32, 0.62, -0.04], r: [0.1, 0.015], col: "gold", k: 0.03 },
      { t: "cap", a: [0.12, 0.16, -0.02], b: [0.34, 0.66, -0.02], r: [0.1, 0.015], col: "green", k: 0.03 },
      { t: "cap", a: [0.08, 0.16, 0.12], b: [0.16, 0.56, 0.22], r: [0.08, 0.012], col: "green", k: 0.03 },
      { t: "cap", a: [-0.08, 0.16, 0.12], b: [-0.16, 0.46, 0.24], r: [0.07, 0.012], col: "gold", k: 0.03 },
      { t: "cap", a: [-0.02, 0.2, 0.12], b: [0.0, 0.72, 0.11], r: [0.03, 0.02], col: "greenL", paint: true },
      ...sparkle([-0.3, 0.86, 0.05], 0.07, "greenL"),
      ...sparkle([0.36, 0.9, 0.05], 0.06, "greenL"),
      ...sparkle([0.44, 0.34, 0.1], 0.05, "greenL"),
    ],
    eyes: [],
  },

  // Hierba Ancestral: a glowing green herb with a violet bud in a purple-and-gold stone bowl.
  "hierba-ancestral": {
    palette: { bowl: "#5b3d86", rim: "#e9b52a", soil: "#3a2a22", stem: "#3f9a46", leaf: "#5fdc6a", bud: "#c08bff", mote: "#fff0a8" },
    glow: ["leaf", "bud", "mote"],
    shapes: [
      { t: "ell", c: [0, 0.2, 0], r: [0.3, 0.17, 0.3], col: "bowl" },
      { t: "ell", c: [0, 0.34, 0], r: [0.26, 0.12, 0.26], col: "bowl", cut: true, k: 0.02 },
      { t: "tor", c: [0, 0.33, 0], R: 0.275, r: 0.03, col: "rim", k: 0.01 },
      { t: "tor", c: [0, 0.18, 0], R: 0.3, r: 0.012, col: "rim", paint: true },
      { t: "ell", c: [0, 0.3, 0], r: [0.25, 0.02, 0.25], col: "soil" },
      { t: "cap", a: [0, 0.3, 0], b: [0.02, 0.8, 0], r: [0.022, 0.016], col: "stem", k: 0.01 },
      { t: "cap", a: [0, 0.32, 0], b: [-0.16, 0.62, 0.04], r: [0.018, 0.014], col: "stem", k: 0.01 },
      { t: "cap", a: [0, 0.32, 0], b: [0.18, 0.58, 0.04], r: [0.018, 0.014], col: "stem", k: 0.01 },
      { t: "ell", c: [-0.2, 0.66, 0.04], r: [0.12, 0.05, 0.02], rot: [0, 0, 30], col: "leaf", k: 0.01 },
      { t: "ell", c: [0.22, 0.62, 0.04], r: [0.12, 0.05, 0.02], rot: [0, 0, -30], col: "leaf", k: 0.01 },
      { t: "ell", c: [-0.1, 0.52, 0.08], r: [0.1, 0.04, 0.02], rot: [0, 0, 15], col: "leaf", k: 0.01 },
      { t: "ell", c: [0.1, 0.46, 0.08], r: [0.1, 0.04, 0.02], rot: [0, 0, -15], col: "leaf", k: 0.01 },
      { t: "ell", c: [-0.07, 0.78, 0], r: [0.09, 0.04, 0.02], rot: [0, 0, 45], col: "leaf", k: 0.01 },
      { t: "ell", c: [0.1, 0.76, 0], r: [0.09, 0.04, 0.02], rot: [0, 0, -45], col: "leaf", k: 0.01 },
      { t: "ell", c: [0.02, 0.86, 0], r: [0.055, 0.07, 0.055], col: "bud", k: 0.02 },
      { t: "ell", c: [-0.32, 0.86, 0.05], r: [0.025, 0.025, 0.025], col: "mote" },
      { t: "ell", c: [0.34, 0.8, 0.05], r: [0.02, 0.02, 0.02], col: "mote" },
      { t: "ell", c: [0.24, 1.0, 0.0], r: [0.02, 0.02, 0.02], col: "mote" },
      { t: "ell", c: [-0.2, 1.02, 0.0], r: [0.018, 0.018, 0.018], col: "mote" },
    ],
    eyes: [],
  },

  // Postura del Guardián: two gold-bracered forearms crossed in a block before a royal shield.
  "postura-guardian": {
    palette: { shield: "#6b3fa0", rim: "#e9b52a", skin: "#6b4630", bracer: "#e9b52a", glove: "#b8861a", seam: "#c08bff", spark: "#ffffff" },
    glow: ["seam", "spark"],
    shapes: [
      { t: "ell", c: [0, 0.55, -0.14], r: [0.42, 0.42, 0.05], col: "shield" },
      { t: "tor", c: [0, 0.55, -0.14], R: 0.42, r: 0.04, rot: [90, 0, 0], col: "rim", k: 0.01 },
      { t: "tor", c: [0, 0.55, -0.1], R: 0.26, r: 0.016, rot: [90, 0, 0], col: "seam", paint: true },
      { t: "cap", a: [-0.36, 0.12, 0.02], b: [0.22, 0.78, 0.02], r: [0.085, 0.08], col: "skin", k: 0.02 },
      { t: "cap", a: [-0.22, 0.28, 0.02], b: [0.1, 0.64, 0.02], r: [0.1, 0.1], col: "bracer", k: 0.02 },
      { t: "ell", c: [0.26, 0.82, 0.02], r: [0.1, 0.1, 0.1], col: "glove", k: 0.03 },
      { t: "cap", a: [0.36, 0.12, 0.14], b: [-0.22, 0.78, 0.14], r: [0.085, 0.08], col: "skin", k: 0.02 },
      { t: "cap", a: [0.22, 0.28, 0.14], b: [-0.1, 0.64, 0.14], r: [0.1, 0.1], col: "bracer", k: 0.02 },
      { t: "ell", c: [-0.26, 0.82, 0.14], r: [0.1, 0.1, 0.1], col: "glove", k: 0.03 },
      { t: "cap", a: [0.2, 0.3, 0.24], b: [-0.08, 0.62, 0.24], r: [0.014, 0.014], col: "seam", paint: true },
      ...sparkle([0, 0.98, 0.1], 0.1, "spark"),
      ...sparkle([-0.44, 0.92, 0.1], 0.06, "spark"),
      ...sparkle([0.44, 0.92, 0.1], 0.06, "spark"),
    ],
    eyes: [],
  },
};
