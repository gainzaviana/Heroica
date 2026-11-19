import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, gear, rad, spike, turn } from "./kit";

// Campaign "El Ascenso del Mariscal de Ceniza" — art batch 4: encounter cards for Réplica (navy and
// silver, mirror-cyan copies), Doctor Quimera (lab glass, toxic green serum, violet) and the
// Mariscal de Ceniza's Legión (charcoal and ash grey with an ember-orange flame insignia).
// One iconic object or small scene each.

// MARK: Helpers

/** A polyline of capsules through points. */
function line(pts: V3[], r: number, col: string, k = 0.01, paint = false): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [r, r], col, k, ...(paint ? { paint } : {}) });
  return out;
}

/** Chain of capsules along an arc in the xy plane (degrees), radius tapering r0 → r1. */
function arc(cx: number, cy: number, z: number, R: number, a0: number, a1: number, n: number, r0: number, col: string, r1 = r0, k = 0.01, ry = R): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: [cx + R * Math.cos(rad(t0)), cy + ry * Math.sin(rad(t0)), z], b: [cx + R * Math.cos(rad(t1)), cy + ry * Math.sin(rad(t1)), z], r: [ra, rb], col, k });
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

/** Tilts shapes about the x axis (positive tips the top toward the camera) around a pivot. */
function tiltX(shapes: Shape[], deg: number, pivot: V3 = [0, 0, 0]): Shape[] {
  const t = rad(deg), co = Math.cos(t), si = Math.sin(t);
  const r = (v: V3): V3 => {
    const y = v[1] - pivot[1], z = v[2] - pivot[2];
    return [v[0], pivot[1] + co * y - si * z, pivot[2] + si * y + co * z];
  };
  return shapes.map((sh) => {
    if (sh.t === "cap") return { ...sh, a: r(sh.a), b: r(sh.b) };
    const rot: V3 = sh.rot ? [sh.rot[0] + deg, sh.rot[1], sh.rot[2]] : [deg, 0, 0];
    return { ...sh, c: r(sh.c), rot };
  });
}

/** Mirrors shapes across the x = 0 plane. */
function flipX(shapes: Shape[]): Shape[] {
  const f = (v: V3): V3 => [-v[0], v[1], v[2]];
  return shapes.map((sh): Shape => {
    const rot: V3 | undefined = sh.rot ? [sh.rot[0], -sh.rot[1], -sh.rot[2]] : undefined;
    if (sh.t === "cap") return { ...sh, a: f(sh.a), b: f(sh.b) };
    return { ...sh, c: f(sh.c), ...(rot ? { rot } : {}) };
  });
}

/** A clenched fist punching toward +x (knuckle face at x ≈ 0.16), forearm cuff behind it, size ≈ 0.5 long. */
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

/** A boot, toe toward +x, sole at y ≈ 0, shin up to y ≈ 0.2. */
function boot(col: string, sole: string): Shape[] {
  return [
    { t: "cap", a: [-0.02, 0.06, 0], b: [-0.04, 0.24, 0], r: [0.065, 0.06], col, k: 0.04 },
    { t: "ell", c: [0.05, 0.05, 0], r: [0.12, 0.06, 0.065], col, k: 0.05 },
    { t: "box", c: [0.04, 0.0, 0], s: [0.13, 0.015, 0.065], round: 0.012, col: sole, k: 0.01 },
    { t: "tor", c: [-0.04, 0.22, 0], R: 0.06, r: 0.016, col: sole, k: 0.01 },
  ];
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

/** The Legión de Ceniza insignia: an ember flame inside a ring, facing +z, radius R. */
function insignia(c: V3, R: number, ring: string, fire: string, core: string, paint = false): Shape[] {
  const p = paint ? { paint: true } : {};
  return [
    { t: "tor", c, R, r: R * 0.13, rot: [90, 0, 0], col: ring, k: 0.01, ...p },
    ...flameShape([c[0], c[1] - R * 0.7, c[2]], R * 1.35, fire, 0.02).map((s) => ({ ...s, ...p })),
    { t: "ell", c: [c[0], c[1] - R * 0.35, c[2] + R * 0.12], r: [R * 0.22, R * 0.24, R * 0.12], col: core, k: 0.01, ...p },
  ];
}

/** A charcoal factory gear facing the camera. */
function gearShapes(c: V3, R: number): Shape[] {
  return gear(c[0], c[1], R, 8, "gearc", "char", c[2]);
}

const flame = (a: V3, b: V3, r: number, col = "fire", k = 0.05): Shape => ({ t: "cap", a, b, r: [r, r * 0.12], col, k });

// Palettes
const REP = { navy: "#2b3b6b", navy2: "#1c2648", silver: "#c9d2de", mask: "#f1f4f8", mirror: "#9fe3f5", mirror2: "#5fc4e6", ghost: "#7fe8ff", glint: "#ffffff" };
const QUI = { glass: "#d6f2f0", serum: "#7dff4a", serum2: "#38c82a", violet: "#7a4ab8", violet2: "#4e2c80", fog: "#e2ebe8", fog2: "#c4d2ce", steel: "#8a95a0" };
const ASH = { char: "#35353b", char2: "#4a4a52", ash: "#8a8a92", ash2: "#b4b4ba", ember: "#ff6a24", ember2: "#ffb03a", core: "#fff0b0", blood: "#c2311e" };

export const artCeniza4: Record<string, Sculpt> = {
  // ───────────────────────── Réplica ─────────────────────────

  // Contraataque Aprendido: two fists meet knuckle to knuckle across a glowing mirror pane.
  "contraataque-aprendido": {
    palette: { ...REP, cuff: "#c9d2de", cuff2: "#9fe3f5" },
    glow: ["ghost", "glint"],
    shapes: [
      { t: "ell", c: [0, 0.52, -0.2], r: [0.34, 0.44, 0.03], col: "mirror", k: 0 },
      ...arc(0, 0.52, -0.17, 0.35, 0, 360, 18, 0.03, "silver", 0.03, 0.02, 0.45),
      { t: "box", c: [0, 0.52, -0.16], s: [0.006, 0.4, 0.01], round: 0.003, col: "glint", paint: true },
      ...place(punch("navy", "cuff"), 0.9, [-0.2, 0.5, 0.04]),
      ...flipX(place(punch("mirror2", "cuff2"), 0.9, [-0.2, 0.5, 0.04])),
      ...burst([0, 0.5, 0.06], 8, 22, 0.2, [0.03, 0.006], "glint", { len: 0.13, r: [0.025, 0.006], col: "ghost" }, 0.01),
    ],
    eyes: [],
  },

  // Estudio de Combate: a screen replaying a kick, a film strip unspooling from a reel beside it.
  "estudio-combate": {
    palette: { ...REP, screen: "#123048", fig: "#7fe8ff", reel: "#8a95a6", film: "#2a2a34", frame: "#d8e6f0", stand: "#4a5468" },
    glow: ["fig", "ghost"],
    shapes: [
      { t: "box", c: [0.08, 0.56, 0], s: [0.3, 0.22, 0.05], round: 0.04, col: "navy2", k: 0.02 },
      { t: "box", c: [0.08, 0.56, 0.04], s: [0.26, 0.18, 0.02], round: 0.02, col: "screen", paint: true },
      { t: "cap", a: [0.08, 0.1, -0.02], b: [0.08, 0.34, -0.02], r: [0.04, 0.035], col: "stand", k: 0.02 },
      { t: "ell", c: [0.08, 0.04, -0.02], r: [0.18, 0.04, 0.12], col: "stand", k: 0.02 },
      // kicking stick figure on the screen
      { t: "ell", c: [0.0, 0.67, 0.06], r: [0.03, 0.03, 0.01], col: "fig", paint: true },
      ...line([[0.0, 0.64, 0.06], [0.02, 0.54, 0.06]], 0.013, "fig", 0, true),
      ...line([[0.02, 0.54, 0.06], [-0.04, 0.42, 0.06]], 0.012, "fig", 0, true),
      ...line([[0.02, 0.54, 0.06], [0.16, 0.62, 0.06]], 0.012, "fig", 0, true),
      ...line([[0.0, 0.61, 0.06], [-0.07, 0.56, 0.06], [-0.04, 0.5, 0.06]], 0.01, "fig", 0, true),
      ...line([[0.01, 0.61, 0.06], [0.07, 0.66, 0.06]], 0.01, "fig", 0, true),
      ...arc(0.1, 0.56, 0.06, 0.1, 10, 70, 3, 0.008, "fig", 0.008, 0),
      // play triangle
      { t: "cap", a: [0.26, 0.7, 0.06], b: [0.26, 0.64, 0.06], r: [0.01, 0.01], col: "ghost", paint: true },
      // film reel
      { t: "ell", c: [-0.34, 0.66, -0.06], r: [0.17, 0.17, 0.035], col: "reel", k: 0.01 },
      ...[0, 120, 240].map((a): Shape => ({ t: "ell", c: [-0.34 + 0.09 * Math.cos(rad(a + 90)), 0.66 + 0.09 * Math.sin(rad(a + 90)), -0.02], r: [0.045, 0.045, 0.04], col: "film", cut: true, k: 0.01 })),
      { t: "ell", c: [-0.34, 0.66, -0.02], r: [0.03, 0.03, 0.03], col: "silver", k: 0.01 },
      { t: "tor", c: [-0.34, 0.66, -0.06], R: 0.16, r: 0.02, rot: [90, 0, 0], col: "film", k: 0.01 },
      // film strip
      ...[[-0.24, 0.5], [-0.2, 0.36], [-0.08, 0.24], [0.08, 0.2], [0.24, 0.22], [0.36, 0.3]].map(([x, y], i, a): Shape => {
        const [nx, ny] = a[Math.min(i + 1, a.length - 1)];
        const ang = i + 1 < a.length ? Math.atan2(ny - y, nx - x) * 180 / Math.PI : 30;
        return { t: "box", c: [x, y, 0.1], s: [0.07, 0.04, 0.01], round: 0.006, rot: [0, 0, ang], col: "film", k: 0.01 };
      }),
      ...[[-0.24, 0.5], [-0.2, 0.36], [-0.08, 0.24], [0.08, 0.2], [0.24, 0.22], [0.36, 0.3]].map(([x, y]): Shape => ({ t: "box", c: [x, y, 0.11], s: [0.035, 0.022, 0.006], round: 0.004, col: "frame", paint: true })),
    ],
    eyes: [],
  },

  // Memoria Muscular: a glowing brain with a fist imprinted on it, memory rings circling.
  "memoria-muscular": {
    palette: { brain: "#f29ab8", brain2: "#d06a92", fold: "#b04a78", fist: "#7fe8ff", ring: "#9fe3f5", spark: "#ffffff" },
    glow: ["fist", "ring", "spark"],
    shapes: [
      { t: "ell", c: [-0.13, 0.52, 0], r: [0.2, 0.22, 0.24], col: "brain", k: 0.05 },
      { t: "ell", c: [0.13, 0.52, 0], r: [0.2, 0.22, 0.24], col: "brain", k: 0.05 },
      { t: "ell", c: [0, 0.38, -0.02], r: [0.3, 0.12, 0.2], col: "brain", k: 0.08 },
      { t: "ell", c: [0.05, 0.27, -0.06], r: [0.12, 0.07, 0.1], col: "brain2", k: 0.05 },
      { t: "cap", a: [0.0, 0.26, -0.06], b: [0.02, 0.12, -0.06], r: [0.05, 0.04], col: "brain2", k: 0.04 },
      { t: "box", c: [0, 0.6, 0.12], s: [0.008, 0.16, 0.14], round: 0.004, col: "fold", paint: true },
      ...arc(-0.16, 0.52, 0.22, 0.1, 100, 260, 5, 0.012, "fold", 0.012, 0).map((s) => ({ ...s, paint: true })),
      ...arc(0.16, 0.52, 0.22, 0.1, -80, 80, 5, 0.012, "fold", 0.012, 0).map((s) => ({ ...s, paint: true })),
      ...arc(-0.13, 0.66, 0.2, 0.07, 200, 340, 4, 0.012, "fold", 0.012, 0).map((s) => ({ ...s, paint: true })),
      ...arc(0.13, 0.66, 0.2, 0.07, 200, 340, 4, 0.012, "fold", 0.012, 0).map((s) => ({ ...s, paint: true })),
      ...arc(-0.24, 0.42, 0.18, 0.06, 0, 180, 4, 0.012, "fold", 0.012, 0).map((s) => ({ ...s, paint: true })),
      ...arc(0.24, 0.42, 0.18, 0.06, 0, 180, 4, 0.012, "fold", 0.012, 0).map((s) => ({ ...s, paint: true })),
      ...place(punch("fist", "fist"), 0.5, [0.06, 0.5, 0.3]),
      { t: "tor", c: [0, 0.5, 0], R: 0.42, r: 0.014, rot: [75, 0, 10], col: "ring", k: 0 },
      { t: "tor", c: [0, 0.5, 0], R: 0.46, r: 0.012, rot: [70, 0, -25], col: "ring", k: 0 },
      ...burst([0.36, 0.86, 0.1], 4, 0, 0.06, [0.02, 0.004], "spark", undefined, 0.01),
      ...burst([-0.38, 0.8, 0.1], 4, 45, 0.05, [0.018, 0.004], "spark", undefined, 0.01),
    ],
    eyes: [],
  },

  // Escudo Imitado: a plain round buckler, with its pale mirror-copy outline shimmering behind it.
  "escudo-imitado": {
    palette: { ...REP, wood: "#8a5a3a", band: "#9aa6b4", boss: "#dfe6ee", rivet: "#5a6474" },
    glow: ["ghost"],
    shapes: [
      { t: "ell", c: [-0.18, 0.56, -0.16], r: [0.32, 0.32, 0.05], col: "ghost", k: 0 },
      { t: "ell", c: [-0.18, 0.56, -0.12], r: [0.28, 0.28, 0.05], col: "mirror2", k: 0.01 },
      { t: "ell", c: [0.08, 0.48, 0.04], r: [0.34, 0.34, 0.07], col: "wood", k: 0.02 },
      { t: "tor", c: [0.08, 0.48, 0.06], R: 0.33, r: 0.035, rot: [90, 0, 0], col: "band", k: 0.01 },
      { t: "tor", c: [0.08, 0.48, 0.09], R: 0.2, r: 0.016, rot: [90, 0, 0], col: "band", k: 0.01 },
      { t: "ell", c: [0.08, 0.48, 0.1], r: [0.09, 0.09, 0.07], col: "boss", k: 0.02 },
      ...Array.from({ length: 8 }, (_, i): Shape => ({ t: "ell", c: [0.08 + 0.27 * Math.cos(rad(i * 45 + 22)), 0.48 + 0.27 * Math.sin(rad(i * 45 + 22)), 0.1], r: [0.018, 0.018, 0.018], col: "rivet", k: 0.005 })),
      ...arc(0.08, 0.48, 0.12, 0.46, 20, 70, 4, 0.014, "ghost"),
      ...arc(0.08, 0.48, 0.12, 0.46, 200, 250, 4, 0.014, "ghost"),
    ],
    eyes: [],
  },

  // Espada Imitada: a steel sword and its glowing mirror-copy crossed beside it.
  "espada-imitada": {
    palette: { ...REP, blade: "#d6dee8", edge: "#ffffff", guard: "#d8a83a", grip: "#3a2a2a", pommel: "#e0b84a" },
    glow: ["ghost", "glint"],
    shapes: [
      ...rotZ([
        { t: "ell", c: [0, 0.04, 0], r: [0.04, 0.04, 0.04], col: "pommel", k: 0.01 },
        { t: "cap", a: [0, 0.06, 0], b: [0, 0.22, 0], r: [0.03, 0.03], col: "grip", k: 0.01 },
        { t: "box", c: [0, 0.24, 0], s: [0.14, 0.025, 0.035], round: 0.02, col: "guard", k: 0.01 },
        { t: "box", c: [0, 0.6, 0], s: [0.05, 0.34, 0.015], round: 0.012, col: "blade", k: 0.01 },
        { t: "cap", a: [0, 0.92, 0], b: [0, 1.04, 0], r: [0.05, 0.005], col: "blade", k: 0.02 },
        { t: "box", c: [0, 0.6, 0.012], s: [0.008, 0.32, 0.006], round: 0.003, col: "edge", paint: true },
      ], -24, [0, 0, 0]).map((s) => place([s], 0.85, [0.0, 0.05, 0.04])[0]),
      ...rotZ([
        { t: "ell", c: [0, 0.04, 0], r: [0.04, 0.04, 0.04], col: "ghost", k: 0.01 },
        { t: "cap", a: [0, 0.06, 0], b: [0, 0.22, 0], r: [0.03, 0.03], col: "mirror2", k: 0.01 },
        { t: "box", c: [0, 0.24, 0], s: [0.14, 0.025, 0.035], round: 0.02, col: "ghost", k: 0.01 },
        { t: "box", c: [0, 0.6, 0], s: [0.05, 0.34, 0.015], round: 0.012, col: "mirror", k: 0.01 },
        { t: "cap", a: [0, 0.92, 0], b: [0, 1.04, 0], r: [0.05, 0.005], col: "mirror", k: 0.02 },
        { t: "box", c: [0, 0.6, 0.012], s: [0.008, 0.32, 0.006], round: 0.003, col: "glint", paint: true },
      ], 24, [0, 0, 0]).map((s) => place([s], 0.85, [0.0, 0.05, -0.04])[0]),
      ...burst([0, 0.5, 0.05], 4, 45, 0.08, [0.022, 0.004], "glint", undefined, 0.01),
    ],
    eyes: [],
  },

  // Academia de Réplica: a dojo hall with a sweeping roof, a sliding door and a mask banner.
  "academia-replica": {
    palette: { ...REP, wall: "#efe6d4", beam: "#5a3a2a", roof: "#2b3b6b", roof2: "#1c2648", step: "#a89a88", door: "#d6c8a8", lattice: "#6a4a34", banner: "#c9d2de" },
    shapes: [
      { t: "box", c: [0, 0.05, 0], s: [0.46, 0.05, 0.28], round: 0.02, col: "step", k: 0.01 },
      { t: "box", c: [0, 0.11, 0.02], s: [0.4, 0.02, 0.24], round: 0.01, col: "step", k: 0.01 },
      { t: "box", c: [0, 0.3, 0], s: [0.36, 0.17, 0.2], round: 0.02, col: "wall", k: 0.01 },
      ...[-0.36, -0.12, 0.12, 0.36].map((x): Shape => ({ t: "box", c: [x, 0.3, 0.19], s: [0.02, 0.18, 0.02], round: 0.006, col: "beam", k: 0.005 })),
      { t: "box", c: [0, 0.46, 0.19], s: [0.38, 0.02, 0.02], round: 0.006, col: "beam", k: 0.005 },
      { t: "box", c: [0, 0.26, 0.2], s: [0.1, 0.13, 0.01], round: 0.004, col: "door", k: 0.005 },
      ...[-0.05, 0, 0.05].map((x): Shape => ({ t: "box", c: [x, 0.26, 0.21], s: [0.004, 0.13, 0.006], round: 0.002, col: "lattice", paint: true })),
      ...[0.18, 0.26, 0.34].map((y): Shape => ({ t: "box", c: [0, y, 0.21], s: [0.1, 0.004, 0.006], round: 0.002, col: "lattice", paint: true })),
      // roof with upturned eaves
      { t: "box", c: [0, 0.54, 0], s: [0.5, 0.05, 0.3], round: 0.04, col: "roof", k: 0.02 },
      { t: "box", c: [0, 0.64, 0], s: [0.34, 0.06, 0.2], round: 0.06, col: "roof2", k: 0.05 },
      { t: "box", c: [0, 0.72, 0], s: [0.36, 0.025, 0.04], round: 0.02, col: "roof", k: 0.02 },
      ...[1, -1].flatMap((s): Shape[] => [
        { t: "cap", a: [0.44 * s, 0.56, 0.26], b: [0.56 * s, 0.64, 0.3], r: [0.04, 0.02], col: "roof", k: 0.03 },
        { t: "cap", a: [0.44 * s, 0.56, -0.26], b: [0.56 * s, 0.64, -0.3], r: [0.04, 0.02], col: "roof", k: 0.03 },
        { t: "cap", a: [0.34 * s, 0.73, 0], b: [0.44 * s, 0.8, 0], r: [0.03, 0.015], col: "roof", k: 0.02 },
      ]),
      // banner with a split mirror mask
      { t: "box", c: [0.24, 0.32, 0.22], s: [0.07, 0.11, 0.01], round: 0.01, col: "navy2", k: 0.005 },
      { t: "ell", c: [0.24, 0.34, 0.235], r: [0.04, 0.055, 0.015], col: "mask", k: 0.005 },
      { t: "box", c: [0.255, 0.34, 0.25], s: [0.016, 0.06, 0.01], round: 0.004, col: "mirror2", paint: true },
      { t: "ell", c: [0.225, 0.35, 0.25], r: [0.01, 0.007, 0.01], col: "navy2", paint: true },
      { t: "ell", c: [0.258, 0.35, 0.25], r: [0.01, 0.007, 0.01], col: "navy2", paint: true },
      { t: "box", c: [-0.24, 0.32, 0.22], s: [0.07, 0.11, 0.01], round: 0.01, col: "navy2", k: 0.005 },
      { t: "ell", c: [-0.24, 0.34, 0.235], r: [0.04, 0.055, 0.015], col: "mask", k: 0.005 },
      { t: "ell", c: [-0.255, 0.35, 0.25], r: [0.01, 0.007, 0.01], col: "navy2", paint: true },
      { t: "ell", c: [-0.222, 0.35, 0.25], r: [0.01, 0.007, 0.01], col: "navy2", paint: true },
    ],
    eyes: [],
  },

  // Persecución Implacable: a trail of footprints racing toward us, dust kicked up, speed lines.
  "persecucion-implacable": {
    palette: { ground: "#c9b896", top: "#dccaa6", print: "#5a4636", dust: "#efe2c6", dust2: "#c8b08a", line: "#7fe8ff", boot: "#2b3b6b", sole: "#c9d2de" },
    glow: ["line"],
    shapes: [
      ...tiltX([
        { t: "ell", c: [0, 0.03, 0], r: [0.52, 0.045, 0.3], col: "ground", k: 0.02 },
        { t: "ell", c: [0, 0.065, 0], r: [0.51, 0.02, 0.29], col: "top", paint: true },
        ...[[-0.42, 1], [-0.26, -1], [-0.1, 1], [0.06, -1]].flatMap(([x, s]): Shape[] => [
          { t: "ell", c: [x, 0.075, 0.07 * s], r: [0.06, 0.03, 0.04], col: "print", cut: true, k: 0.01 },
          { t: "ell", c: [x + 0.09, 0.075, 0.07 * s], r: [0.032, 0.03, 0.036], col: "print", cut: true, k: 0.01 },
          { t: "ell", c: [x, 0.055, 0.07 * s], r: [0.065, 0.03, 0.045], col: "print", paint: true },
          { t: "ell", c: [x + 0.09, 0.055, 0.07 * s], r: [0.037, 0.03, 0.04], col: "print", paint: true },
        ]),
      ], 34, [0, 0.03, 0]),
      ...rotZ(place(boot("boot", "sole"), 1.9, [0, 0, 0]), 22).map((sh) => place([sh], 1, [0.3, 0.12, 0.04])[0]),
      { t: "ell", c: [0.3, 0.1, 0.04], r: [0.09, 0.06, 0.09], col: "dust", k: 0.06 },
      { t: "ell", c: [0.18, 0.08, 0.08], r: [0.06, 0.045, 0.06], col: "dust2", k: 0.06 },
      ...[[0.12, 0.34], [0.08, 0.5], [0.14, 0.66]].map(([x, y], i): Shape => ({ t: "cap", a: [x, y, 0.06], b: [x - 0.4 - i * 0.06, y, 0.06], r: [0.026, 0.006], col: "line", k: 0 })),
    ],
    eyes: [],
  },

  // Celda de Contención: a steel cell with crackling energy bars and a warning lamp on top.
  "celda-contencion": {
    palette: { ...REP, steel: "#5a6474", steel2: "#8a95a6", inside: "#141a2c", bar: "#7fe8ff", core: "#e8fbff", lamp: "#ff4a3a", stripe: "#ffd23a", stripe2: "#2a2a30" },
    glow: ["bar", "core", "lamp"],
    shapes: [
      { t: "box", c: [0, 0.06, 0], s: [0.36, 0.06, 0.28], round: 0.03, col: "steel", k: 0.01 },
      ...[-0.27, -0.09, 0.09, 0.27].map((x, i): Shape => ({ t: "box", c: [x, 0.06, 0.28], s: [0.09, 0.03, 0.01], round: 0.005, rot: [0, 0, 0], col: i % 2 ? "stripe2" : "stripe", paint: true })),
      { t: "box", c: [0, 0.5, -0.24], s: [0.32, 0.38, 0.04], round: 0.02, col: "inside", k: 0.01 },
      ...[1, -1].map((s): Shape => ({ t: "box", c: [0.33 * s, 0.5, 0], s: [0.04, 0.4, 0.26], round: 0.02, col: "steel2", k: 0.01 })),
      { t: "box", c: [0, 0.92, 0], s: [0.37, 0.05, 0.27], round: 0.03, col: "steel", k: 0.01 },
      { t: "box", c: [0, 0.14, 0.2], s: [0.33, 0.025, 0.05], round: 0.01, col: "steel2", k: 0.01 },
      { t: "box", c: [0, 0.86, 0.2], s: [0.33, 0.025, 0.05], round: 0.01, col: "steel2", k: 0.01 },
      ...[-0.22, -0.11, 0, 0.11, 0.22].flatMap((x): Shape[] => [
        { t: "cap", a: [x, 0.16, 0.2], b: [x, 0.84, 0.2], r: [0.022, 0.022], col: "bar", k: 0.01 },
        { t: "cap", a: [x, 0.18, 0.22], b: [x, 0.82, 0.22], r: [0.008, 0.008], col: "core", paint: true },
      ]),
      ...line([[-0.22, 0.6, 0.22], [-0.17, 0.66, 0.24], [-0.14, 0.58, 0.24], [-0.11, 0.64, 0.22]], 0.008, "core", 0),
      ...line([[0.11, 0.38, 0.22], [0.15, 0.32, 0.24], [0.18, 0.4, 0.24], [0.22, 0.34, 0.22]], 0.008, "core", 0),
      { t: "cap", a: [0, 0.96, 0], b: [0, 1.0, 0], r: [0.05, 0.05], col: "steel2", k: 0.01 },
      { t: "ell", c: [0, 1.05, 0], r: [0.06, 0.06, 0.06], col: "lamp", k: 0.01 },
    ],
    eyes: [],
  },

  // Maestro de Todo: a fan of weapons — sword, spear, staff, axe and nunchaku — behind a white mask.
  "maestro-de-todo": {
    palette: { ...REP, blade: "#d6dee8", wood: "#a0703e", wood2: "#6e4a2a", gold: "#e0b84a", grip: "#3a2a2a", chain: "#9aa6b4", eye: "#1c2648" },
    glow: ["ghost"],
    shapes: [
      // sword (far left)
      ...rotZ([
        { t: "cap", a: [0, 0.0, 0], b: [0, 0.2, 0], r: [0.035, 0.035], col: "grip", k: 0.01 },
        { t: "box", c: [0, 0.22, 0], s: [0.12, 0.028, 0.04], round: 0.02, col: "gold", k: 0.01 },
        { t: "box", c: [0, 0.52, 0], s: [0.05, 0.29, 0.022], round: 0.015, col: "blade", k: 0.01 },
        { t: "cap", a: [0, 0.8, 0], b: [0, 0.92, 0], r: [0.05, 0.006], col: "blade", k: 0.02 },
      ], 52).map((s) => place([s], 1, [0, 0.1, -0.08])[0]),
      // spear
      ...rotZ([
        { t: "cap", a: [0, 0.0, 0], b: [0, 0.8, 0], r: [0.024, 0.024], col: "wood", k: 0.01 },
        { t: "ell", c: [0, 0.9, 0], r: [0.055, 0.13, 0.025], col: "blade", k: 0.02 },
        { t: "tor", c: [0, 0.79, 0], R: 0.03, r: 0.013, col: "gold", k: 0.01 },
      ], 24).map((s) => place([s], 1, [0, 0.1, -0.05])[0]),
      // staff (vertical)
      { t: "cap", a: [0, 0.1, -0.03], b: [0, 1.06, -0.03], r: [0.03, 0.03], col: "wood2", k: 0.01 },
      { t: "tor", c: [0, 0.98, -0.03], R: 0.03, r: 0.013, col: "gold", k: 0.01 },
      { t: "tor", c: [0, 0.94, -0.03], R: 0.03, r: 0.013, col: "gold", k: 0.01 },
      // axe
      ...rotZ([
        { t: "cap", a: [0, 0.0, 0], b: [0, 0.8, 0], r: [0.026, 0.026], col: "wood", k: 0.01 },
        { t: "box", c: [0.04, 0.7, 0], s: [0.05, 0.05, 0.03], round: 0.015, col: "chain", k: 0.01 },
        { t: "ell", c: [0.12, 0.7, 0], r: [0.08, 0.14, 0.025], col: "blade", k: 0.03 },
      ], -26).map((s) => place([s], 1, [0, 0.1, -0.05])[0]),
      // nunchaku (far right)
      ...rotZ([
        { t: "cap", a: [0, 0.2, 0], b: [0, 0.56, 0], r: [0.035, 0.035], col: "wood2", k: 0.01 },
        ...line([[0, 0.58, 0], [0.05, 0.64, 0], [0.11, 0.66, 0], [0.16, 0.63, 0]], 0.01, "chain", 0),
        { t: "cap", a: [0.18, 0.6, 0], b: [0.36, 0.34, 0], r: [0.035, 0.035], col: "wood2", k: 0.01 },
      ], -56).map((s) => place([s], 1, [0, 0.1, -0.08])[0]),
      // mask hub
      { t: "ell", c: [0, 0.16, 0.06], r: [0.13, 0.16, 0.06], col: "mask", k: 0.02 },
      { t: "box", c: [0.045, 0.16, 0.11], s: [0.04, 0.17, 0.02], round: 0.01, col: "mirror2", paint: true },
      { t: "ell", c: [-0.05, 0.2, 0.11], r: [0.032, 0.018, 0.02], col: "eye", paint: true },
      { t: "ell", c: [0.05, 0.2, 0.11], r: [0.032, 0.018, 0.02], col: "eye", paint: true },
    ],
    eyes: [],
  },

  // Golpe Predecible: a fist slamming into a standing mirror that cracks into a starburst.
  "golpe-predecible": {
    palette: { ...REP, frame: "#7a5a3a", frame2: "#a07a4a", glass: "#bfeaf7", crack: "#ffffff", glove: "#c2311e", cuff: "#f0d8b8", spark: "#ffe066" },
    glow: ["crack", "spark"],
    shapes: [
      { t: "ell", c: [0.08, 0.52, -0.06], r: [0.27, 0.42, 0.03], col: "glass", k: 0.01 },
      ...arc(0.08, 0.52, -0.04, 0.28, 0, 360, 20, 0.035, "frame", 0.035, 0.02, 0.43),
      { t: "cap", a: [0.0, 0.03, -0.06], b: [0.06, 0.1, -0.06], r: [0.03, 0.03], col: "frame2", k: 0.02 },
      { t: "cap", a: [0.16, 0.03, -0.06], b: [0.1, 0.1, -0.06], r: [0.03, 0.03], col: "frame2", k: 0.02 },
      ...[15, 70, 120, 165, 210, 260, 310, 350].map((a, i): Shape => {
        const L = i % 2 ? 0.22 : 0.3;
        return { t: "cap", a: [0.1, 0.56, -0.03], b: [0.1 + L * 0.85 * Math.cos(rad(a)), 0.56 + L * Math.sin(rad(a)), -0.03], r: [0.016, 0.008], col: "crack", paint: true };
      }),
      ...arc(0.1, 0.56, -0.03, 0.11, 0, 360, 10, 0.014, "crack", 0.014, 0).map((s) => ({ ...s, paint: true })),
      ...place(turn(punch("glove", "cuff"), 70), 0.9, [0.06, 0.56, 0.16]),
      ...burst([0.1, 0.56, 0.06], 6, 30, 0.12, [0.022, 0.004], "spark", undefined, 0.01),
    ],
    eyes: [],
  },

  // ───────────────────────── Doctor Quimera ─────────────────────────

  // Celdas de la Isla: a rocky island in the sea, a squat concrete cell block on top, fog rolling in.
  "celdas-isla": {
    palette: { ...QUI, sea: "#3a8aa8", sea2: "#6ab8cc", rock: "#6e6a66", rock2: "#8e8882", block: "#b8bcb4", block2: "#8a8e88", door: "#2a2e36", bar: "#c8ccd4", lamp: "#7dff4a" },
    glow: ["lamp"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.58, 0.035, 0.42], col: "sea", k: 0.02 },
      ...[0.5, 0.36].map((R): Shape => ({ t: "tor", c: [0, 0.06, 0], R, r: 0.012, col: "sea2", paint: true })),
      { t: "ell", c: [0, 0.08, 0], r: [0.42, 0.14, 0.3], col: "rock", k: 0.05 },
      { t: "ell", c: [-0.18, 0.16, 0.08], r: [0.16, 0.1, 0.14], col: "rock2", k: 0.05 },
      { t: "ell", c: [0.24, 0.13, -0.05], r: [0.14, 0.09, 0.14], col: "rock2", k: 0.05 },
      { t: "box", c: [0.02, 0.34, -0.02], s: [0.26, 0.12, 0.15], round: 0.02, col: "block", k: 0.03 },
      { t: "box", c: [0.02, 0.475, -0.02], s: [0.28, 0.02, 0.17], round: 0.01, col: "block2", k: 0.01 },
      ...[-0.15, 0.02, 0.19].flatMap((x): Shape[] => [
        { t: "box", c: [x, 0.33, 0.13], s: [0.055, 0.08, 0.01], round: 0.01, col: "door", paint: true },
        ...[-0.03, 0, 0.03].map((dx): Shape => ({ t: "cap", a: [x + dx, 0.26, 0.135], b: [x + dx, 0.4, 0.135], r: [0.007, 0.007], col: "bar", k: 0 })),
      ]),
      { t: "box", c: [-0.16, 0.6, -0.08], s: [0.06, 0.12, 0.06], round: 0.015, col: "block2", k: 0.02 },
      { t: "box", c: [-0.16, 0.74, -0.08], s: [0.08, 0.02, 0.08], round: 0.01, col: "block", k: 0.01 },
      { t: "ell", c: [-0.16, 0.8, -0.08], r: [0.05, 0.05, 0.05], col: "lamp", k: 0.01 },
      { t: "ell", c: [-0.42, 0.16, 0.2], r: [0.14, 0.07, 0.1], col: "fog", k: 0.06 },
      { t: "ell", c: [-0.3, 0.12, 0.3], r: [0.1, 0.06, 0.08], col: "fog2", k: 0.06 },
      { t: "ell", c: [0.38, 0.18, 0.22], r: [0.15, 0.08, 0.1], col: "fog", k: 0.06 },
      { t: "ell", c: [0.48, 0.12, 0.08], r: [0.1, 0.06, 0.1], col: "fog2", k: 0.06 },
      { t: "ell", c: [0.3, 0.56, -0.2], r: [0.16, 0.06, 0.08], col: "fog", k: 0.06 },
    ],
    eyes: [],
  },

  // Delirio: a dizzy green-and-violet spiral with little stars wheeling around it.
  delirio: {
    palette: { ...QUI, star: "#ffe066", dot: "#ffffff" },
    glow: ["serum", "star"],
    shapes: [
      ...Array.from({ length: 34 }, (_, i): Shape => {
        const t0 = i * 0.5, t1 = (i + 1) * 0.5;
        const r0 = 0.02 + t0 * 0.024, r1 = 0.02 + t1 * 0.024;
        return { t: "cap", a: [r0 * Math.cos(t0), 0.5 + r0 * Math.sin(t0), 0], b: [r1 * Math.cos(t1), 0.5 + r1 * Math.sin(t1), 0], r: [0.022 + i * 0.0012, 0.022 + (i + 1) * 0.0012], col: i % 6 < 3 ? "serum" : "violet", k: 0.01 };
      }),
      { t: "ell", c: [0, 0.5, 0], r: [0.035, 0.035, 0.035], col: "dot", k: 0.01 },
      ...[[0.48, 0.82, 0.06, 0], [-0.46, 0.86, 0.04, 20], [0.52, 0.18, 0.08, 10], [-0.48, 0.16, 0.0, 30]].flatMap(([x, y, z, a]): Shape[] => [
        ...burst([x, y, z], 5, 90 + a, 0.07, [0.03, 0.006], "star", undefined, 0.02),
        { t: "ell", c: [x, y, z], r: [0.035, 0.035, 0.025], col: "star", k: 0.02 },
      ]),
    ],
    eyes: [],
  },

  // Frenesí Mutante: a hulking green mutant hand with long claws mid-swipe, red claw slashes behind.
  "frenesi-mutante": {
    palette: { ...QUI, hide: "#5aa83a", hide2: "#3e7e2a", vein: "#a8ff6a", claw: "#f2ead2", slash: "#ff3a3a", slash2: "#ffb03a", rage: "#ff6a2a" },
    glow: ["slash", "slash2", "vein"],
    shapes: [
      ...[-0.18, 0, 0.18].map((dx): Shape => ({ t: "cap", a: [-0.2 + dx, 1.0, -0.22], b: [0.34 + dx, 0.2, -0.22], r: [0.035, 0.008], col: dx === 0 ? "slash2" : "slash", k: 0 })),
      { t: "cap", a: [-0.34, 0.0, 0], b: [-0.08, 0.36, 0], r: [0.12, 0.1], col: "hide2", k: 0.04 },
      { t: "ell", c: [0.0, 0.48, 0.0], r: [0.15, 0.14, 0.1], col: "hide", k: 0.06 },
      ...line([[-0.28, 0.08, 0.1], [-0.2, 0.18, 0.11], [-0.12, 0.24, 0.1]], 0.012, "vein", 0, true),
      ...line([[-0.2, 0.18, 0.11], [-0.24, 0.26, 0.09]], 0.01, "vein", 0, true),
      ...[38, 62, 86, 110].flatMap((ang): Shape[] => {
        const d = (l: number, bend = 0): V3 => [Math.cos(rad(ang - bend)) * l, 0.48 + Math.sin(rad(ang - bend)) * l, 0.02];
        return [
          { t: "cap", a: d(0.08), b: d(0.24), r: [0.05, 0.042], col: "hide", k: 0.03 },
          { t: "cap", a: d(0.26), b: d(0.38, 6), r: [0.034, 0.012], col: "claw", k: 0.012 },
          { t: "cap", a: d(0.38, 6), b: d(0.45, 16), r: [0.012, 0.003], col: "claw", k: 0.008 },
        ];
      }),
      { t: "cap", a: [0.1, 0.4, 0.06], b: [0.22, 0.36, 0.08], r: [0.045, 0.035], col: "hide", k: 0.03 },
      { t: "cap", a: [0.24, 0.36, 0.08], b: [0.33, 0.38, 0.08], r: [0.028, 0.006], col: "claw", k: 0.01 },
    ],
    eyes: [],
  },

  // Inyección Experimental: a big syringe of glowing green serum, a drop at the needle tip.
  "inyeccion-experimental": {
    palette: { ...QUI, plunger: "#7a4ab8", rubber: "#2a2a34", tick: "#4a6a68", needle: "#d8dee6" },
    glow: ["serum"],
    shapes: rotZ([
      { t: "cap", a: [0, 0.2, 0], b: [0, 0.68, 0], r: [0.1, 0.1], col: "glass", k: 0.01 },
      { t: "cap", a: [0, 0.22, 0.0], b: [0, 0.5, 0.0], r: [0.104, 0.104], col: "serum", paint: true },
      ...[0.3, 0.38, 0.46, 0.54, 0.62].map((y): Shape => ({ t: "box", c: [0.07, y, 0.07], s: [0.03, 0.006, 0.02], round: 0.003, col: "tick", paint: true })),
      { t: "ell", c: [0, 0.7, 0], r: [0.17, 0.025, 0.08], col: "violet", k: 0.01 },
      { t: "cap", a: [0, 0.5, 0], b: [0, 0.86, 0], r: [0.03, 0.03], col: "plunger", k: 0.01 },
      { t: "ell", c: [0, 0.5, 0], r: [0.095, 0.02, 0.095], col: "rubber", k: 0.01 },
      { t: "ell", c: [0, 0.88, 0], r: [0.1, 0.022, 0.1], col: "plunger", k: 0.01 },
      { t: "cap", a: [0, 0.2, 0], b: [0, 0.14, 0], r: [0.05, 0.03], col: "glass", k: 0.02 },
      { t: "cap", a: [0, 0.14, 0], b: [0, -0.06, 0], r: [0.01, 0.005], col: "needle", k: 0.005 },
      { t: "ell", c: [0, -0.1, 0], r: [0.025, 0.035, 0.025], col: "serum", k: 0 },
      { t: "cap", a: [-0.05, 0.6, 0.09], b: [-0.05, 0.3, 0.09], r: [0.012, 0.012], col: "fog", paint: true },
    ], -40, [0, 0.4, 0]).concat([
      { t: "ell", c: [-0.4, 0.06, 0.06], r: [0.04, 0.05, 0.04], col: "serum", k: 0 },
      { t: "ell", c: [-0.3, 0.02, 0.1], r: [0.06, 0.012, 0.05], col: "serum2", k: 0 },
    ]),
    eyes: [],
  },

  // Suero de Mejora: a round flask of glowing green serum, cork stopper, bubbles rising out.
  "suero-mejora": {
    palette: { ...QUI, cork: "#b07a4a", label: "#f4ecd8", bubble: "#c8ff9a", spark: "#ffffff" },
    glow: ["serum", "bubble", "spark"],
    shapes: [
      { t: "ell", c: [0, 0.3, 0], r: [0.28, 0.27, 0.27], col: "serum", k: 0.02 },
      { t: "box", c: [0, 0.46, 0], s: [0.3, 0.1, 0.3], round: 0.01, col: "glass", paint: true },
      { t: "ell", c: [0, 0.37, 0], r: [0.285, 0.015, 0.285], col: "serum2", paint: true },
      { t: "cap", a: [0, 0.5, 0], b: [0, 0.72, 0], r: [0.08, 0.075], col: "glass", k: 0.04 },
      { t: "tor", c: [0, 0.72, 0], R: 0.08, r: 0.02, col: "glass", k: 0.01 },
      { t: "cap", a: [0, 0.7, 0], b: [0, 0.82, 0], r: [0.068, 0.075], col: "cork", k: 0.01 },
      { t: "ell", c: [-0.12, 0.42, 0.18], r: [0.05, 0.08, 0.04], rot: [0, 0, 30], col: "spark", paint: true },
      { t: "box", c: [0.02, 0.24, 0.24], s: [0.1, 0.06, 0.05], round: 0.02, col: "label", paint: true },
      { t: "box", c: [0.02, 0.24, 0.27], s: [0.012, 0.035, 0.03], round: 0.004, col: "violet", paint: true },
      { t: "box", c: [0.02, 0.24, 0.27], s: [0.035, 0.012, 0.03], round: 0.004, col: "violet", paint: true },
      ...[[0.12, 0.92, 0.035], [-0.06, 1.02, 0.028], [0.16, 1.1, 0.022], [-0.14, 0.88, 0.025]].map(([x, y, r]): Shape => ({ t: "ell", c: [x, y, 0], r: [r, r, r], col: "bubble", k: 0 })),
      ...burst([0.34, 0.62, 0.05], 4, 0, 0.08, [0.022, 0.004], "spark", undefined, 0.01),
      ...burst([-0.34, 0.66, 0.05], 4, 45, 0.06, [0.02, 0.004], "spark", undefined, 0.01),
    ],
    eyes: [],
  },

  // Aceleración Genética: a DNA double helix twisting upward fast, speed rings whipping round it.
  "aceleracion-genetica": {
    palette: { ...QUI, rung: "#e8f4f0", ring: "#c8ff9a" },
    glow: ["serum", "ring"],
    shapes: rotZ([
      ...Array.from({ length: 14 }, (_, i): Shape[] => {
        const y = 0.06 + i * 0.065, t = i * 0.62, R = 0.17;
        const p1: V3 = [R * Math.cos(t), y, R * Math.sin(t)], p2: V3 = [-R * Math.cos(t), y, -R * Math.sin(t)];
        const tn = (i + 1) * 0.62, yn = y + 0.065;
        const out: Shape[] = [
          { t: "cap", a: p1, b: p2, r: [0.018, 0.018], col: "rung", k: 0.01 },
          { t: "ell", c: p1, r: [0.04, 0.04, 0.04], col: "serum", k: 0.02 },
          { t: "ell", c: p2, r: [0.04, 0.04, 0.04], col: "violet", k: 0.02 },
        ];
        if (i < 13) out.push(
          { t: "cap", a: p1, b: [R * Math.cos(tn), yn, R * Math.sin(tn)], r: [0.028, 0.028], col: "serum2", k: 0.02 },
          { t: "cap", a: p2, b: [-R * Math.cos(tn), yn, -R * Math.sin(tn)], r: [0.028, 0.028], col: "violet2", k: 0.02 },
        );
        return out;
      }).flat(),
      { t: "tor", c: [0, 0.25, 0], R: 0.32, r: 0.014, rot: [8, 0, 0], col: "ring", k: 0 },
      { t: "tor", c: [0, 0.5, 0], R: 0.36, r: 0.014, rot: [8, 0, 0], col: "ring", k: 0 },
      { t: "tor", c: [0, 0.75, 0], R: 0.32, r: 0.014, rot: [8, 0, 0], col: "ring", k: 0 },
    ], -18, [0, 0.5, 0]).concat([
      ...[[-0.4, 0.2], [-0.46, 0.4], [-0.38, 0.6]].map(([x, y]): Shape => ({ t: "cap", a: [x, y, 0.1], b: [x - 0.2, y - 0.08, 0.1], r: [0.02, 0.005], col: "ring", k: 0 })),
    ]),
    eyes: [],
  },

  // Mutación Forzada: a cracked green pod bursting open, a small clawed creature peeking out.
  "mutacion-forzada": {
    palette: { ...QUI, pod: "#6a9a4a", pod2: "#4a7a3a", spot: "#a6d86a", inner: "#2a3a22", goo: "#7dff4a", crit: "#9a6ad8", crit2: "#6e44b0", claw: "#f2ead2" },
    glow: ["goo"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.34, 0.03, 0.28], col: "goo", k: 0.02 },
      { t: "ell", c: [0, 0.34, 0], r: [0.27, 0.32, 0.26], col: "pod", k: 0.02 },
      { t: "ell", c: [0, 0.66, 0], r: [0.22, 0.14, 0.21], col: "pod", cut: true, k: 0 },
      { t: "ell", c: [0, 0.6, 0], r: [0.2, 0.2, 0.19], col: "inner", cut: true, k: 0.01 },
      ...Array.from({ length: 9 }, (_, i): Shape => {
        const a = rad(i * 40 + 10), R = 0.21;
        return { t: "cap", a: [R * Math.cos(a), 0.5, R * Math.sin(a)], b: [R * 1.05 * Math.cos(a), 0.6 + (i % 2) * 0.06, R * 1.05 * Math.sin(a)], r: [0.04, 0.006], col: "pod", k: 0.01 };
      }),
      ...[[-0.15, 0.26, 0.2], [0.12, 0.18, 0.22], [0.2, 0.38, 0.15], [-0.08, 0.42, 0.22]].map(([x, y, z]): Shape => ({ t: "ell", c: [x, y, z], r: [0.04, 0.035, 0.04], col: "spot", paint: true })),
      ...line([[0.04, 0.52, 0.24], [0.08, 0.42, 0.25], [0.04, 0.34, 0.26], [0.1, 0.26, 0.25]], 0.01, "inner", 0, true),
      // creature
      { t: "ell", c: [0, 0.62, 0.02], r: [0.15, 0.13, 0.13], col: "crit", k: 0.03 },
      { t: "cap", a: [-0.08, 0.72, 0.0], b: [-0.13, 0.86, -0.02], r: [0.03, 0.006], col: "crit2", k: 0.02 },
      { t: "cap", a: [0.08, 0.72, 0.0], b: [0.13, 0.86, -0.02], r: [0.03, 0.006], col: "crit2", k: 0.02 },
      ...[1, -1].flatMap((s): Shape[] => [
        { t: "ell", c: [0.2 * s, 0.56, 0.12], r: [0.05, 0.035, 0.04], col: "crit", k: 0.02 },
        ...[-0.025, 0, 0.025].map((dz): Shape => ({ t: "cap", a: [0.22 * s, 0.54, 0.14 + dz], b: [0.25 * s, 0.48, 0.18 + dz], r: [0.01, 0.003], col: "claw", k: 0.005 })),
      ]),
      { t: "box", c: [0, 0.56, 0.13], s: [0.05, 0.008, 0.02], round: 0.004, col: "inner", paint: true },
    ],
    eyes: [
      { at: [-0.055, 0.64, 0.13], r: 0.045, iris: "#ffe066", look: [0.2, 0.05, 1] },
      { at: [0.055, 0.64, 0.13], r: 0.045, iris: "#ffe066", look: [0.2, 0.05, 1] },
    ],
  },

  // ───────────────────────── El Mariscal de Ceniza ─────────────────────────

  // Órdenes del Mariscal: an unrolled scroll of orders sealed with an ember-red wax insignia.
  "ordenes-mariscal": {
    palette: { ...ASH, paper: "#efe2c2", paper2: "#d8c69e", ink: "#4a3a30", rod: "#35353b", wax: "#c2311e", wax2: "#ff6a24" },
    glow: ["wax2"],
    shapes: turn([
      { t: "box", c: [0, 0.5, 0], s: [0.28, 0.32, 0.012], round: 0.01, col: "paper", k: 0.01 },
      { t: "cap", a: [-0.32, 0.84, 0.02], b: [0.32, 0.84, 0.02], r: [0.05, 0.05], col: "paper2", k: 0.02 },
      { t: "cap", a: [-0.32, 0.16, 0.02], b: [0.32, 0.16, 0.02], r: [0.05, 0.05], col: "paper2", k: 0.02 },
      ...[-0.38, 0.38].flatMap((x): Shape[] => [
        { t: "ell", c: [x, 0.84, 0.02], r: [0.04, 0.06, 0.06], col: "rod", k: 0.01 },
        { t: "ell", c: [x, 0.16, 0.02], r: [0.04, 0.06, 0.06], col: "rod", k: 0.01 },
      ]),
      ...[0.72, 0.65, 0.58, 0.51, 0.44].map((y, i): Shape => ({ t: "box", c: [-0.03 - (i % 2) * 0.03, y, 0.012], s: [0.2 - (i % 2) * 0.04, 0.01, 0.006], round: 0.004, col: "ink", paint: true })),
      { t: "cap", a: [0.02, 0.3, 0.03], b: [-0.08, 0.12, 0.05], r: [0.025, 0.02], col: "wax", k: 0.01 },
      { t: "cap", a: [0.02, 0.3, 0.03], b: [0.12, 0.12, 0.05], r: [0.025, 0.02], col: "wax", k: 0.01 },
      { t: "ell", c: [0.02, 0.3, 0.04], r: [0.1, 0.1, 0.03], col: "wax", k: 0.02 },
      ...insignia([0.02, 0.31, 0.07], 0.06, "wax2", "wax2", "core", true),
    ], 28),
    eyes: [],
  },

  // Propaganda: a megaphone on a post blaring beside a Legión poster with the ember insignia.
  propaganda: {
    palette: { ...ASH, poster: "#e8dcc4", wave: "#ffb03a", horn: "#8a8a92", mouth: "#202024" },
    glow: ["ember", "ember2", "wave"],
    shapes: [
      { t: "box", c: [-0.14, 0.52, -0.08], s: [0.24, 0.34, 0.02], round: 0.015, col: "char", k: 0.01 },
      { t: "box", c: [-0.14, 0.52, -0.06], s: [0.21, 0.31, 0.01], round: 0.01, col: "poster", k: 0.005 },
      { t: "box", c: [-0.14, 0.78, -0.045], s: [0.21, 0.04, 0.01], round: 0.005, col: "blood", paint: true },
      { t: "box", c: [-0.14, 0.26, -0.045], s: [0.21, 0.04, 0.01], round: 0.005, col: "blood", paint: true },
      ...insignia([-0.14, 0.53, -0.04], 0.15, "char", "ember", "ember2"),
      { t: "cap", a: [0.26, 0.0, 0.08], b: [0.26, 0.6, 0.08], r: [0.03, 0.03], col: "char2", k: 0.01 },
      { t: "ell", c: [0.26, 0.03, 0.08], r: [0.1, 0.03, 0.1], col: "char", k: 0.02 },
      { t: "cap", a: [0.22, 0.66, 0.1], b: [0.44, 0.8, 0.14], r: [0.05, 0.13], col: "horn", k: 0.02 },
      { t: "ell", c: [0.46, 0.81, 0.145], r: [0.03, 0.12, 0.12], rot: [0, 0, 33], col: "mouth", k: 0.005 },
      { t: "tor", c: [0.45, 0.805, 0.14], R: 0.13, r: 0.018, rot: [0, 0, -57], col: "ember", k: 0.01 },
      { t: "box", c: [0.2, 0.62, 0.1], s: [0.04, 0.06, 0.04], round: 0.015, col: "char", k: 0.02 },
      ...[0.12, 0.22, 0.32].flatMap((R): Shape[] => arc(0.48, 0.82, 0.14, R, -25, 70, 5, 0.02, "wave")),
    ],
    eyes: [],
  },

  // Mano de Hierro: a raised charcoal iron gauntlet fist, ember seams and the insignia on its back.
  "mano-hierro": {
    palette: { ...ASH, plate: "#6e6e78", rivet: "#d8d8de", seam: "#ff6a24" },
    glow: ["ember", "ember2", "core", "seam"],
    shapes: [
      ...rotZ(place(punch("plate", "char"), 1.7, [0, 0, 0]), 90).map((sh) => place([sh], 1, [0, 0.62, 0])[0]),
      ...[-0.05, 0.05].map((x): Shape => ({ t: "box", c: [x, 0.82, 0.16], s: [0.006, 0.06, 0.08], round: 0.003, col: "seam", paint: true })),
      { t: "box", c: [0, 0.62, 0.18], s: [0.2, 0.006, 0.06], round: 0.003, col: "seam", paint: true },
      ...[0.08, 0.36].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.17, r: 0.024, col: "plate", k: 0.01 })),
      ...[-50, 50].map((a): Shape => ({ t: "ell", c: [0.18 * Math.sin(rad(a)), 0.22, 0.18 * Math.cos(rad(a))], r: [0.02, 0.02, 0.02], col: "rivet", k: 0.005 })),
      ...insignia([0, 0.22, 0.19], 0.07, "ember2", "ember", "core"),
      ...[[0.0, 1.0, 90], [-0.24, 0.92, 130], [0.24, 0.92, 50]].map(([x, y, a]): Shape => spike([x, y, 0.08], a, 0.13, [0.03, 0.006], "ember2", 0)),
    ],
    eyes: [],
  },

  // Bastón de Mando: a black marshal's baton banded in steel, an ember insignia medallion at its head.
  "baston-mando": {
    palette: { ...ASH, band: "#c8c8ce", tassel: "#c2311e" },
    glow: ["ember", "ember2", "core"],
    shapes: [
      ...burst([0.0, 0.5, -0.12], 12, 0, 0.46, [0.05, 0.01], "ember", { len: 0.34, r: [0.04, 0.01], col: "ember2" }, 0.02).map((sh) => ({ ...sh, col: sh.col })),
      { t: "ell", c: [0, 0.5, -0.12], r: [0.2, 0.2, 0.03], col: "char", k: 0.02 },
      ...rotZ([
        { t: "cap", a: [0, 0.08, 0.04], b: [0, 0.84, 0.04], r: [0.055, 0.055], col: "char", k: 0.01 },
        ...[0.2, 0.36, 0.52, 0.68].map((y): Shape => ({ t: "tor", c: [0, y, 0.04], R: 0.056, r: 0.012, col: "band", k: 0.005 })),
        { t: "ell", c: [0, 0.07, 0.04], r: [0.07, 0.04, 0.07], col: "band", k: 0.01 },
        { t: "ell", c: [0, 0.87, 0.04], r: [0.08, 0.045, 0.08], col: "band", k: 0.01 },
        { t: "ell", c: [0, 0.94, 0.04], r: [0.11, 0.11, 0.035], col: "char2", k: 0.02 },
        ...insignia([0, 0.94, 0.08], 0.075, "ember2", "ember", "core", true),
        { t: "cap", a: [0, 0.05, 0.04], b: [0.04, -0.06, 0.08], r: [0.012, 0.012], col: "tassel", k: 0.005 },
        { t: "cap", a: [0.04, -0.06, 0.08], b: [0.05, -0.16, 0.08], r: [0.02, 0.045], col: "tassel", k: 0.01 },
      ], -35, [0, 0.5, 0]),
    ],
    eyes: [],
  },

  // La Purga: roaring ember flames rising from charred ground, burnt posts and floating ash.
  "la-purga": {
    palette: { ...ASH, fire: "#ff6a24", fire2: "#ff9a2e", hot: "#ffd84a", ground: "#2a2a2e", post: "#1e1c20", flake: "#d8d8dc" },
    glow: ["fire", "fire2", "hot", "ember"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.04, 0.32], col: "ground", k: 0.02 },
      ...[[-0.3, 0.06], [0.32, -0.08]].map(([x, z]): Shape => ({ t: "box", c: [x, 0.2, z], s: [0.035, 0.2, 0.035], round: 0.01, rot: [0, 0, x > 0 ? -10 : 8], col: "post", k: 0.01 })),
      flame([-0.22, 0.04, 0.06], [-0.3, 0.5, 0.06], 0.13, "fire"),
      flame([0.22, 0.04, 0.04], [0.32, 0.56, 0.04], 0.13, "fire"),
      flame([0.0, 0.04, -0.06], [0.04, 0.92, -0.06], 0.22, "fire"),
      flame([0.06, 0.04, 0.08], [0.12, 0.66, 0.1], 0.15, "fire2"),
      flame([-0.1, 0.04, 0.1], [-0.16, 0.6, 0.12], 0.13, "fire2"),
      flame([0.0, 0.04, 0.16], [0.0, 0.42, 0.18], 0.11, "hot"),
      flame([-0.04, 0.04, 0.2], [-0.06, 0.28, 0.22], 0.07, "core"),
      ...[[-0.42, 0.7, 0.1], [0.44, 0.82, 0.0], [-0.3, 0.94, -0.06], [0.3, 1.02, 0.1]].map(([x, y, z], i): Shape => ({ t: "ell", c: [x, y, z], r: [0.025, 0.025, 0.025], col: i % 2 ? "ember" : "flake", k: 0 })),
    ],
    eyes: [],
  },

  // Cuartel de la Ceniza: a charcoal fortress keep with towers, ember-lit windows and insignia banners.
  "cuartel-ceniza": {
    palette: { ...ASH, rock: "#5a5650", wall: "#4a4a52", wall2: "#62626a", window: "#ff8a2a", gate: "#1e1c20", banner: "#2a2a30" },
    glow: ["window", "ember", "ember2"],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.56, 0.08, 0.36], col: "rock", k: 0.04 },
      { t: "box", c: [0, 0.34, 0], s: [0.24, 0.26, 0.2], round: 0.015, col: "wall", k: 0.02 },
      ...[-0.18, -0.06, 0.06, 0.18].map((x): Shape => ({ t: "box", c: [x, 0.63, 0.15], s: [0.04, 0.035, 0.05], round: 0.01, col: "wall", k: 0.01 })),
      ...[-0.18, -0.06, 0.06, 0.18].map((x): Shape => ({ t: "box", c: [x, 0.63, -0.15], s: [0.04, 0.035, 0.05], round: 0.01, col: "wall", k: 0.01 })),
      ...[1, -1].flatMap((sd): Shape[] => [
        { t: "cap", a: [0.36 * sd, 0.06, 0.06], b: [0.36 * sd, 0.62, 0.06], r: [0.11, 0.1], col: "wall2", k: 0.02 },
        ...[-60, 0, 60, 120, 180, 240].map((a): Shape => ({ t: "box", c: [0.36 * sd + 0.1 * Math.cos(rad(a)), 0.68, 0.06 + 0.1 * Math.sin(rad(a))], s: [0.03, 0.035, 0.03], round: 0.008, col: "wall2", k: 0.01 })),
        { t: "box", c: [0.36 * sd, 0.42, 0.16], s: [0.02, 0.04, 0.01], round: 0.006, col: "window", paint: true },
        { t: "cap", a: [0.36 * sd, 0.66, 0.06], b: [0.36 * sd, 0.88, 0.06], r: [0.01, 0.01], col: "char", k: 0 },
        { t: "box", c: [0.36 * sd + 0.07, 0.83, 0.06], s: [0.065, 0.045, 0.008], round: 0.005, col: "blood", k: 0 },
      ]),
      { t: "box", c: [0, 0.18, 0.2], s: [0.08, 0.11, 0.02], round: 0.04, col: "gate", k: 0.01 },
      ...[-0.12, 0.12].map((x): Shape => ({ t: "box", c: [x, 0.46, 0.2], s: [0.022, 0.04, 0.01], round: 0.008, col: "window", paint: true })),
      { t: "box", c: [0, 0.44, 0.205], s: [0.07, 0.12, 0.012], round: 0.01, col: "banner", k: 0.005 },
      ...insignia([0, 0.45, 0.22], 0.05, "ember2", "ember", "core", true),
    ],
    eyes: [],
  },

  // Campos de Internamiento: a barbed-wire fence around grey huts, a watchtower sweeping a searchlight.
  "campos-internamiento": {
    palette: { ...ASH, ground: "#8a8478", hut: "#9a9a9e", roof: "#4a4a52", post: "#5a4a3a", wire: "#3a3a40", tower: "#4a4a52", beam: "#ffe8a0", lamp: "#fff4c8" },
    glow: ["beam", "lamp"],
    shapes: [
      { t: "box", c: [0, 0.03, 0], s: [0.52, 0.03, 0.38], round: 0.03, col: "ground", k: 0.02 },
      ...[[-0.2, -0.1], [0.08, -0.16]].flatMap(([x, z]): Shape[] => [
        { t: "box", c: [x, 0.12, z], s: [0.12, 0.07, 0.08], round: 0.01, col: "hut", k: 0.01 },
        { t: "box", c: [x, 0.2, z], s: [0.13, 0.03, 0.07], round: 0.01, rot: [45, 0, 0], col: "roof", k: 0.01 },
        { t: "box", c: [x, 0.11, z + 0.08], s: [0.02, 0.04, 0.01], round: 0.004, col: "char", paint: true },
      ]),
      // fence
      ...[-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48].map((x): Shape => ({ t: "cap", a: [x, 0.05, 0.34], b: [x, 0.3, 0.34], r: [0.014, 0.014], col: "post", k: 0.005 })),
      ...[-0.48, 0.48].flatMap((x): Shape[] => [-0.3, -0.04, 0.2].map((z): Shape => ({ t: "cap", a: [x, 0.05, z], b: [x, 0.3, z], r: [0.014, 0.014], col: "post", k: 0.005 }))),
      ...[0.12, 0.2, 0.28].flatMap((y): Shape[] => [
        { t: "cap", a: [-0.48, y, 0.34], b: [0.48, y, 0.34], r: [0.005, 0.005], col: "wire", k: 0 },
        { t: "cap", a: [-0.48, y, 0.34], b: [-0.48, y, -0.3], r: [0.005, 0.005], col: "wire", k: 0 },
        { t: "cap", a: [0.48, y, 0.34], b: [0.48, y, -0.3], r: [0.005, 0.005], col: "wire", k: 0 },
      ]),
      ...[-0.4, -0.24, -0.08, 0.08, 0.24, 0.4].map((x): Shape => ({ t: "tor", c: [x, 0.3, 0.34], R: 0.03, r: 0.006, rot: [90, 0, 0], col: "wire", k: 0 })),
      // watchtower
      ...[[-0.04, -0.04], [0.04, -0.04], [-0.04, 0.04], [0.04, 0.04]].map(([dx, dz]): Shape => ({ t: "cap", a: [0.34 + dx * 2, 0.05, -0.16 + dz * 2], b: [0.34 + dx, 0.6, -0.16 + dz], r: [0.014, 0.014], col: "tower", k: 0.005 })),
      { t: "box", c: [0.34, 0.66, -0.16], s: [0.09, 0.06, 0.09], round: 0.01, col: "tower", k: 0.01 },
      { t: "box", c: [0.34, 0.76, -0.16], s: [0.11, 0.02, 0.11], round: 0.01, rot: [0, 45, 0], col: "char", k: 0.01 },
      { t: "ell", c: [0.26, 0.68, -0.1], r: [0.04, 0.04, 0.04], col: "lamp", k: 0.01 },
      { t: "cap", a: [0.26, 0.68, -0.1], b: [-0.3, 0.42, 0.1], r: [0.03, 0.12], col: "beam", k: 0 },
    ],
    eyes: [],
  },

  // Tropas en la Frontera: a Legión tank and helmeted soldiers massing at a striped border barrier and flag.
  "tropas-frontera": {
    palette: { ...ASH, ground: "#9a8a6a", tank: "#4a4a52", tank2: "#62626a", tread: "#2a2a2e", helm: "#35353b", face: "#e8c09a", stripe: "#f4f0e8", flag: "#2a2a30", pole: "#c8c8ce" },
    glow: ["ember", "ember2"],
    shapes: [
      { t: "box", c: [0, 0.03, 0], s: [0.54, 0.03, 0.34], round: 0.03, col: "ground", k: 0.02 },
      // barrier
      ...[-0.42, 0.42].map((x): Shape => ({ t: "box", c: [x, 0.12, 0.24], s: [0.03, 0.09, 0.03], round: 0.01, col: "char", k: 0.01 })),
      { t: "cap", a: [-0.46, 0.2, 0.26], b: [0.46, 0.2, 0.26], r: [0.025, 0.025], col: "blood", k: 0.01 },
      ...[-0.36, -0.18, 0, 0.18, 0.36].map((x): Shape => ({ t: "box", c: [x, 0.2, 0.27], s: [0.045, 0.03, 0.03], round: 0.005, col: "stripe", paint: true })),
      // flag
      { t: "cap", a: [-0.4, 0.05, -0.04], b: [-0.4, 0.9, -0.04], r: [0.014, 0.014], col: "pole", k: 0.005 },
      { t: "box", c: [-0.26, 0.76, -0.04], s: [0.14, 0.1, 0.01], round: 0.01, rot: [0, -10, -4], col: "flag", k: 0.005 },
      ...insignia([-0.26, 0.77, -0.02], 0.055, "ember2", "ember", "core", true),
      // tank
      { t: "box", c: [0.12, 0.13, -0.04], s: [0.24, 0.06, 0.14], round: 0.03, col: "tank", k: 0.01 },
      ...[0.13, -0.21].map((z): Shape => ({ t: "cap", a: [-0.08, 0.09, z], b: [0.32, 0.09, z], r: [0.06, 0.06], col: "tread", k: 0.01 })),
      ...[-0.04, 0.06, 0.16, 0.26].map((x): Shape => ({ t: "ell", c: [x, 0.09, 0.19], r: [0.03, 0.03, 0.01], col: "tank2", paint: true })),
      { t: "ell", c: [0.1, 0.24, -0.04], r: [0.12, 0.07, 0.1], col: "tank2", k: 0.02 },
      { t: "cap", a: [0.18, 0.26, -0.04], b: [0.48, 0.32, -0.04], r: [0.022, 0.02], col: "tank", k: 0.01 },
      ...insignia([0.1, 0.25, 0.06], 0.035, "ember2", "ember", "core", true),
      // soldiers
      ...[[-0.24, 0.1], [-0.12, -0.18], [0.0, 0.14]].flatMap(([x, z]): Shape[] => [
        { t: "cap", a: [x, 0.06, z], b: [x, 0.2, z], r: [0.045, 0.04], col: "char2", k: 0.02 },
        { t: "ell", c: [x, 0.26, z], r: [0.04, 0.04, 0.04], col: "face", k: 0.02 },
        { t: "ell", c: [x, 0.29, z], r: [0.055, 0.03, 0.055], col: "helm", k: 0.01 },
        { t: "box", c: [x, 0.16, z + 0.045], s: [0.015, 0.015, 0.006], round: 0.004, col: "ember", paint: true },
      ]),
    ],
    eyes: [],
  },

  // Fábricas de Guerra: a sawtooth-roofed war factory, chimneys belching smoke, furnace-lit windows.
  "fabricas-guerra": {
    palette: { ...ASH, brick: "#5a4a48", roof: "#3a3a40", window: "#ff8a2a", smoke: "#4a4650", smoke2: "#6a6670", gearc: "#8a8a92" },
    glow: ["window", "ember"],
    shapes: [
      { t: "box", c: [0, 0.03, 0], s: [0.54, 0.03, 0.3], round: 0.02, col: "char", k: 0.01 },
      { t: "box", c: [-0.06, 0.2, 0], s: [0.4, 0.15, 0.2], round: 0.015, col: "brick", k: 0.01 },
      ...[-0.36, -0.16, 0.04, 0.24].map((x): Shape => ({ t: "box", c: [x + 0.06, 0.38, 0], s: [0.1, 0.012, 0.2], round: 0.006, rot: [0, 0, 32], col: "roof", k: 0.01 })),
      ...[-0.36, -0.16, 0.04, 0.24].map((x): Shape => ({ t: "box", c: [x + 0.15, 0.4, 0], s: [0.012, 0.05, 0.19], round: 0.004, col: "window", k: 0.01 })),
      ...[-0.32, -0.18, -0.04, 0.1, 0.24].map((x): Shape => ({ t: "box", c: [x, 0.2, 0.2], s: [0.04, 0.05, 0.01], round: 0.01, col: "window", paint: true })),
      ...[[-0.3, 0.72], [-0.12, 0.88], [0.06, 0.78]].flatMap(([x, h], i): Shape[] => [
        { t: "cap", a: [x, 0.3, -0.12], b: [x, h, -0.12], r: [0.05, 0.04], col: "char2", k: 0.01 },
        { t: "tor", c: [x, h - 0.06, -0.12], R: 0.045, r: 0.012, col: "blood", k: 0.005 },
        { t: "ell", c: [x + 0.04, h + 0.08, -0.12], r: [0.08, 0.06, 0.07], col: i % 2 ? "smoke2" : "smoke", k: 0.05 },
        { t: "ell", c: [x + 0.14, h + 0.14, -0.14], r: [0.07, 0.055, 0.06], col: i % 2 ? "smoke" : "smoke2", k: 0.05 },
      ]),
      ...gearShapes([0.44, 0.24, 0.06], 0.13),
      ...insignia([0.44, 0.24, 0.12], 0.05, "ember2", "ember", "core", true),
    ],
    eyes: [],
  },

  // Red de Espías: a watchful eye at the centre of a web of linked listening nodes.
  "red-espias": {
    palette: { ...ASH, white: "#f4f0e8", lid: "#35353b", iris: "#ff6a24", pupil: "#1a1a1e", link: "#ffb03a", node: "#62626a", dot: "#ff6a24" },
    glow: ["link", "dot", "iris"],
    shapes: (() => {
      const nodes: V3[] = [0, 60, 120, 180, 240, 300].map((a) => [0.42 * Math.cos(rad(a + 30)), 0.5 + 0.38 * Math.sin(rad(a + 30)), -0.04]);
      const out: Shape[] = [];
      nodes.forEach((n, i) => {
        out.push({ t: "cap", a: [0, 0.5, -0.04], b: n, r: [0.012, 0.012], col: "link", k: 0 });
        out.push({ t: "cap", a: n, b: nodes[(i + 1) % 6], r: [0.01, 0.01], col: "link", k: 0 });
        out.push({ t: "ell", c: n, r: [0.06, 0.06, 0.05], col: "node", k: 0.01 });
        out.push({ t: "ell", c: [n[0], n[1], n[2] + 0.045], r: [0.028, 0.028, 0.02], col: "dot", paint: true });
      });
      out.push(
        { t: "ell", c: [0, 0.5, 0.02], r: [0.24, 0.15, 0.1], col: "lid", k: 0.02 },
        { t: "ell", c: [0, 0.5, 0.06], r: [0.2, 0.11, 0.08], col: "white", k: 0.01 },
        { t: "ell", c: [0, 0.5, 0.12], r: [0.08, 0.08, 0.04], col: "iris", paint: true },
        { t: "ell", c: [0, 0.5, 0.13], r: [0.035, 0.035, 0.04], col: "pupil", paint: true },
        { t: "ell", c: [0.03, 0.53, 0.14], r: [0.014, 0.014, 0.02], col: "white", paint: true },
      );
      return out;
    })(),
    eyes: [],
  },

  // El Coloso Dormido: a giant stone colossus slumped asleep in a cavern, eyes shut, ember cracks.
  "coloso-dormido": {
    palette: { ...ASH, cave: "#4a4248", cave2: "#5e555a", stone: "#8a8478", stone2: "#6a6458", lid: "#4a4440", crack: "#ff6a24", moss: "#6a8a4a" },
    glow: ["crack"],
    shapes: [
      // cavern arch
      ...arc(0, 0.0, -0.2, 0.56, 0, 180, 9, 0.12, "cave", 0.12, 0.06, 0.9),
      ...arc(0, 0.0, -0.1, 0.62, 10, 170, 7, 0.08, "cave2", 0.08, 0.06, 0.96),
      ...[-0.24, -0.06, 0.14, 0.3].map((x, i): Shape => ({ t: "cap", a: [x, 0.9 - Math.abs(x) * 0.3, -0.12], b: [x, 0.74 - (i % 2) * 0.06 - Math.abs(x) * 0.3, -0.06], r: [0.035, 0.005], col: "cave2", k: 0.02 })),
      { t: "ell", c: [0, 0.03, 0], r: [0.6, 0.04, 0.3], col: "cave", k: 0.03 },
      // colossus
      { t: "box", c: [0, 0.24, 0], s: [0.3, 0.18, 0.16], round: 0.08, col: "stone2", k: 0.04 },
      ...[1, -1].map((sd): Shape => ({ t: "ell", c: [0.3 * sd, 0.3, 0.02], r: [0.11, 0.1, 0.12], col: "stone", k: 0.04 })),
      ...[1, -1].map((sd): Shape => ({ t: "cap", a: [0.34 * sd, 0.24, 0.06], b: [0.2 * sd, 0.08, 0.16], r: [0.07, 0.07], col: "stone2", k: 0.04 })),
      { t: "box", c: [0.02, 0.5, 0.04], s: [0.15, 0.13, 0.13], round: 0.07, rot: [0, 0, -12], col: "stone", k: 0.05 },
      { t: "box", c: [0.0, 0.6, 0.08], s: [0.14, 0.025, 0.06], round: 0.02, rot: [0, 0, -12], col: "stone2", k: 0.02 },
      ...[-0.06, 0.07].map((x): Shape[] => arc(x, 0.535 + x * -0.2, 0.17, 0.035, 200, 340, 3, 0.009, "lid", 0.009, 0).map((s) => ({ ...s, paint: true }))).flat(),
      { t: "box", c: [0.0, 0.44, 0.17], s: [0.04, 0.008, 0.02], round: 0.004, rot: [0, 0, -12], col: "lid", paint: true },
      ...line([[-0.12, 0.3, 0.17], [-0.06, 0.24, 0.17], [-0.1, 0.16, 0.17]], 0.012, "crack", 0, true),
      ...line([[0.14, 0.34, 0.17], [0.1, 0.26, 0.17], [0.16, 0.18, 0.17]], 0.012, "crack", 0, true),
      { t: "ell", c: [-0.1, 0.62, 0.02], r: [0.08, 0.03, 0.08], col: "moss", paint: true },
      { t: "ell", c: [0.3, 0.38, 0.04], r: [0.06, 0.03, 0.06], col: "moss", paint: true },
    ],
    eyes: [],
  },

  // Doctrina de la Ceniza: a heavy charcoal tome with the ember insignia on its cover, embers rising.
  "doctrina-ceniza": {
    palette: { ...ASH, cover: "#2e2e34", edge: "#55555c", page: "#efe2c2", ribbon: "#c2311e", metal: "#b4b4ba" },
    glow: ["ember", "ember2", "core"],
    shapes: [
      ...turn([
        { t: "box", c: [0, 0.42, 0], s: [0.27, 0.36, 0.07], round: 0.03, col: "cover", k: 0.01 },
        { t: "box", c: [0.025, 0.42, 0], s: [0.24, 0.34, 0.06], round: 0.01, col: "page", paint: true },
        { t: "box", c: [0, 0.42, 0], s: [0.27, 0.36, 0.045], round: 0.02, col: "cover", paint: true },
        { t: "cap", a: [-0.27, 0.07, 0], b: [-0.27, 0.77, 0], r: [0.075, 0.075], col: "cover", k: 0.02 },
        ...[0.16, 0.68].map((y): Shape => ({ t: "box", c: [-0.27, y, 0], s: [0.03, 0.015, 0.08], round: 0.01, col: "edge", k: 0.01 })),
        ...[[0.24, 0.75], [0.24, 0.09]].map(([x, y]): Shape => ({ t: "box", c: [x, y, 0.06], s: [0.035, 0.035, 0.02], round: 0.01, col: "metal", k: 0.01 })),
        ...insignia([0.0, 0.46, 0.08], 0.14, "ember2", "ember", "core"),
        { t: "box", c: [0.0, 0.18, 0.075], s: [0.14, 0.012, 0.008], round: 0.004, col: "ember2", paint: true },
        { t: "cap", a: [0.1, 0.05, 0.02], b: [0.12, -0.06, 0.04], r: [0.02, 0.02], col: "ribbon", k: 0.01 },
      ], 25),
      ...[[-0.36, 0.86], [0.34, 0.94], [0.18, 1.08], [-0.22, 1.02]].map(([x, y], i): Shape => ({ t: "ell", c: [x, y, 0.06], r: [0.022, 0.022, 0.022], col: i % 2 ? "ember2" : "ember", k: 0 })),
    ],
    eyes: [],
  },

  // Estado de Sitio: sandbag walls, a striped barrier and a steel hedgehog, a searchlight beam sweeping the sky.
  "estado-sitio": {
    palette: { ...ASH, ground: "#6a6460", bag: "#b8a888", bag2: "#9a8a6c", stripe: "#f4f0e8", steel: "#5a5a64", beam: "#ffe8a0", lamp: "#fff4c8" },
    glow: ["beam", "lamp"],
    shapes: [
      { t: "box", c: [0, 0.03, 0], s: [0.54, 0.03, 0.32], round: 0.03, col: "ground", k: 0.02 },
      ...[-0.42, -0.28, -0.14, 0.0].map((x, i): Shape => ({ t: "ell", c: [x, 0.1, 0.18], r: [0.075, 0.045, 0.06], col: i % 2 ? "bag" : "bag2", k: 0.01 })),
      ...[-0.35, -0.21, -0.07].map((x, i): Shape => ({ t: "ell", c: [x, 0.18, 0.17], r: [0.075, 0.045, 0.06], col: i % 2 ? "bag2" : "bag", k: 0.01 })),
      { t: "ell", c: [-0.28, 0.26, 0.16], r: [0.075, 0.045, 0.06], col: "bag", k: 0.01 },
      // striped barrier
      ...[0.18, 0.46].flatMap((x): Shape[] => [
        { t: "cap", a: [x - 0.04, 0.05, 0.16], b: [x, 0.2, 0.16], r: [0.014, 0.014], col: "char", k: 0.005 },
        { t: "cap", a: [x + 0.04, 0.05, 0.16], b: [x, 0.2, 0.16], r: [0.014, 0.014], col: "char", k: 0.005 },
      ]),
      { t: "box", c: [0.32, 0.22, 0.17], s: [0.2, 0.035, 0.02], round: 0.01, col: "blood", k: 0.01 },
      ...[0.2, 0.32, 0.44].map((x): Shape => ({ t: "box", c: [x, 0.22, 0.19], s: [0.03, 0.05, 0.01], round: 0.004, rot: [0, 0, 35], col: "stripe", paint: true })),
      // steel hedgehog
      { t: "cap", a: [0.22, 0.05, -0.08], b: [0.4, 0.27, -0.04], r: [0.02, 0.02], col: "steel", k: 0.005 },
      { t: "cap", a: [0.4, 0.05, -0.1], b: [0.22, 0.27, -0.02], r: [0.02, 0.02], col: "steel", k: 0.005 },
      { t: "cap", a: [0.31, 0.05, 0.04], b: [0.31, 0.27, -0.18], r: [0.02, 0.02], col: "steel", k: 0.005 },
      // searchlight
      ...[[-0.05, 0.0], [0.05, 0.0], [0.0, -0.06]].map(([dx, dz]): Shape => ({ t: "cap", a: [0.0 + dx * 2, 0.05, -0.16 + dz * 2], b: [0.0, 0.3, -0.16], r: [0.012, 0.012], col: "steel", k: 0.005 })),
      { t: "cap", a: [-0.04, 0.32, -0.16], b: [0.06, 0.42, -0.16], r: [0.075, 0.08], col: "char2", k: 0.01 },
      { t: "ell", c: [0.07, 0.43, -0.16], r: [0.06, 0.06, 0.06], col: "lamp", k: 0.005 },
      { t: "cap", a: [0.07, 0.43, -0.16], b: [-0.26, 1.0, -0.2], r: [0.05, 0.15], col: "beam", k: 0 },
    ],
    eyes: [],
  },
};
