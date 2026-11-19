import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, rad, turn } from "./kit";

// Campaign "El Ascenso del Mariscal de Ceniza" — art batch 3: encounter cards for the Legión
// modulars, Saeta Negra (charcoal/ash with ember accents) and Amalgama's environments and
// treacheries (stone, steel, wood and ice). One iconic object or small scene each.

/** Chain of capsules along an arc in the xy plane (angles in degrees), radius tapering r0 → r1. */
function arc(cx: number, cy: number, z: number, R: number, a0: number, a1: number, n: number, r0: number, col: string, r1 = r0, k = 0.01): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: [cx + R * Math.cos(rad(t0)), cy + R * Math.sin(rad(t0)), z], b: [cx + R * Math.cos(rad(t1)), cy + R * Math.sin(rad(t1)), z], r: [ra, rb], col, k });
  }
  return out;
}

/** A polyline of capsules through points. */
function line(pts: V3[], r: number, col: string, k = 0.01, paint = false): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [r, r], col, k, paint });
  return out;
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

/** Rotates shapes about the z axis (degrees, counter-clockwise) around pivot (x, y). */
function tiltZ(shapes: Shape[], deg: number, pivot: [number, number]): Shape[] {
  const t = rad(deg), co = Math.cos(t), si = Math.sin(t);
  const r = (v: V3): V3 => {
    const x = v[0] - pivot[0], y = v[1] - pivot[1];
    return [pivot[0] + co * x - si * y, pivot[1] + si * x + co * y, v[2]];
  };
  return shapes.map((sh) => {
    if (sh.t === "cap") return { ...sh, a: r(sh.a), b: r(sh.b) };
    if (sh.rot && (sh.rot[0] || sh.rot[1])) return { ...sh, c: r(sh.c) };
    const rot: V3 = [0, 0, (sh.rot?.[2] ?? 0) + deg];
    return { ...sh, c: r(sh.c), rot };
  });
}

/** A rifle lying along +x (stock at x, muzzle at x + len), scale s, at height y, depth z. */
function rifle(x: number, y: number, z: number, s: number, body: string, metal: string, extra?: string): Shape[] {
  return [
    { t: "box", c: [x + 0.08 * s, y - 0.01 * s, z], s: [0.08 * s, 0.045 * s, 0.03 * s], round: 0.02 * s, rot: [0, 0, 8], col: body, k: 0.01 },
    { t: "box", c: [x + 0.25 * s, y, z], s: [0.11 * s, 0.045 * s, 0.035 * s], round: 0.02 * s, col: body, k: 0.01 },
    { t: "cap", a: [x + 0.34 * s, y + 0.01 * s, z], b: [x + 0.58 * s, y + 0.01 * s, z], r: [0.018 * s, 0.016 * s], col: metal, k: 0.005 },
    { t: "box", c: [x + 0.3 * s, y - 0.08 * s, z], s: [0.025 * s, 0.05 * s, 0.025 * s], round: 0.01 * s, rot: [0, 0, -12], col: metal, k: 0.01 },
    { t: "box", c: [x + 0.2 * s, y - 0.07 * s, z], s: [0.02 * s, 0.04 * s, 0.022 * s], round: 0.01 * s, rot: [0, 0, 15], col: body, k: 0.01 },
    { t: "cap", a: [x + 0.2 * s, y + 0.065 * s, z], b: [x + 0.3 * s, y + 0.065 * s, z], r: [0.018 * s, 0.018 * s], col: extra ?? metal, k: 0.01 },
  ];
}

/** A sandbag (flattened ellipsoid) at c. */
const bag = (c: V3, col: string, ry = 0): Shape => ({ t: "ell", c, r: [0.1, 0.045, 0.065], rot: [0, ry, 0], col, k: 0.015 });

/** A rough rock lump. */
const rock = (c: V3, r: V3, col: string, rot: V3 = [0, 0, 0], k = 0.02): Shape => ({ t: "box", c, s: r, round: Math.min(...r) * 0.55, rot, col, k });

/** A pine tree: trunk and three stacked cones (round caps), height h. */
function pine(x: number, z: number, h: number, leaf: string, leaf2: string, trunk: string, snow?: string): Shape[] {
  const out: Shape[] = [
    { t: "cap", a: [x, 0, z], b: [x, h * 0.3, z], r: [0.025 * h * 2.4, 0.02 * h * 2.4], col: trunk, k: 0.01 },
  ];
  [0.3, 0.55, 0.78].forEach((f, i) => {
    out.push({ t: "cap", a: [x, h * f, z], b: [x, h * (f + 0.28), z], r: [h * (0.24 - i * 0.05), h * 0.015], col: i % 2 ? leaf2 : leaf, k: 0.02 });
    if (snow) out.push({ t: "cap", a: [x, h * (f + 0.12), z], b: [x, h * (f + 0.28), z], r: [h * (0.14 - i * 0.03), h * 0.012], col: snow, paint: true });
  });
  return out;
}

const MAT = { stone: "#8a8478", stone2: "#6e685e", stone3: "#4e4a44", steel: "#9aa6b2", steel2: "#c4ced8", rivet: "#e8d6a6", wood: "#9a6a3e", wood2: "#7a4e2e", ice: "#8ad8ff", ice2: "#c8f0ff" };
const LEG = { ash: "#4a4a52", ash2: "#6e6e78", ash3: "#2c2c32", ember: "#ff5a24", ember2: "#ffa040" };

export const artCeniza3: Record<string, Sculpt> = {
  // ───────────────────────── Asalto de la Legión ─────────────────────────

  // Ofensiva Relámpago: an ember lightning bolt slamming into the ground, shock cracks and twin speed chevrons.
  "ofensiva-relampago": {
    palette: { ...LEG, bolt: "#ffd04a", hot: "#fff2b0", ground: "#5a5660", top: "#7a7680", crack: "#ff6a2a" },
    glow: ["bolt", "hot", "crack", "ember", "ember2"],
    shapes: [
      { t: "ell", c: [0, 0.05, 0], r: [0.42, 0.05, 0.3], col: "ground", k: 0.02 },
      { t: "ell", c: [0, 0.09, 0], r: [0.4, 0.02, 0.28], col: "top", paint: true },
      ...[0, 50, 110, 170, 230, 300].map((a): Shape => ({ t: "cap", a: [0.06 * Math.cos(rad(a)), 0.1, 0.06 * Math.sin(rad(a))], b: [0.34 * Math.cos(rad(a)), 0.1, 0.24 * Math.sin(rad(a))], r: [0.022, 0.006], col: "crack", paint: true })),
      ...line([[-0.14, 1.0, 0.04], [0.1, 0.66, 0.06], [-0.07, 0.6, 0.06], [0.08, 0.3, 0.06]], 0.06, "bolt", 0.03),
      { t: "cap", a: [0.08, 0.3, 0.06], b: [0.0, 0.1, 0.04], r: [0.06, 0.012], col: "bolt", k: 0.03 },
      ...line([[-0.12, 0.96, 0.1], [0.08, 0.66, 0.11], [-0.05, 0.6, 0.11], [0.07, 0.34, 0.11]], 0.022, "hot", 0, true),
      ...burst([0, 0.14, 0.04], 8, 10, 0.2, [0.04, 0.008], "ember2", { len: 0.13, r: [0.035, 0.008], col: "ember" }, 0.02),
      ...[[-0.5, 0.56], [-0.36, 0.56]].flatMap(([x, y]): Shape[] => [
        { t: "cap", a: [x, y + 0.1, -0.04], b: [x + 0.12, y, -0.04], r: [0.035, 0.035], col: "ash", k: 0.02 },
        { t: "cap", a: [x + 0.12, y, -0.04], b: [x, y - 0.1, -0.04], r: [0.035, 0.035], col: "ash", k: 0.02 },
        { t: "cap", a: [x + 0.04, y + 0.1, 0], b: [x + 0.12, y + 0.02, 0], r: [0.014, 0.014], col: "ember", paint: true },
      ]),
      ...[[0.26, 0.56], [0.4, 0.56]].flatMap(([x, y]): Shape[] => [
        { t: "cap", a: [x, y + 0.1, -0.04], b: [x + 0.12, y, -0.04], r: [0.035, 0.035], col: "ash2", k: 0.02 },
        { t: "cap", a: [x + 0.12, y, -0.04], b: [x, y - 0.1, -0.04], r: [0.035, 0.035], col: "ash2", k: 0.02 },
      ]),
    ],
    eyes: [],
  },

  // Puesto Avanzado: an ash-grey field tent with a dark doorway, a pole flying an ember banner, sandbags.
  "puesto-avanzado": {
    palette: { ...LEG, canvas: "#5e5c62", canvas2: "#46444a", door: "#1e1c20", pole: "#3a3236", sand: "#b8a07a", sand2: "#9a845e", ground: "#6a645a" },
    glow: ["ember2"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.035, 0.34], col: "ground", k: 0.02 },
      { t: "box", c: [-0.12, 0.03, 0], s: [0.25, 0.25, 0.24], round: 0.02, rot: [0, 0, 45], col: "canvas", k: 0.02 },
      { t: "box", c: [-0.12, -0.2, 0], s: [0.5, 0.22, 0.4], round: 0.0, col: "canvas", cut: true, k: 0 },
      { t: "cap", a: [-0.12, 0.39, -0.26], b: [-0.12, 0.39, 0.27], r: [0.018, 0.018], col: "canvas2", k: 0.01 },
      { t: "ell", c: [-0.12, 0.1, 0.24], r: [0.09, 0.17, 0.03], col: "door", paint: true },
      { t: "cap", a: [-0.12, 0.39, 0.245], b: [-0.46, 0.04, 0.245], r: [0.016, 0.016], col: "ember", paint: true },
      { t: "cap", a: [-0.12, 0.39, 0.245], b: [0.22, 0.04, 0.245], r: [0.016, 0.016], col: "ember", paint: true },
      { t: "cap", a: [0.32, 0.02, -0.12], b: [0.32, 0.9, -0.12], r: [0.016, 0.014], col: "pole", k: 0.01 },
      { t: "ell", c: [0.32, 0.91, -0.12], r: [0.025, 0.025, 0.025], col: "ember2", k: 0.01 },
      { t: "box", c: [0.46, 0.76, -0.12], s: [0.14, 0.11, 0.012], round: 0.01, rot: [0, 0, -4], col: "ash3", k: 0.01 },
      { t: "box", c: [0.46, 0.76, -0.11], s: [0.14, 0.025, 0.015], round: 0.008, rot: [0, 0, -4], col: "ember", paint: true },
      { t: "cap", a: [0.38, 0.84, -0.1], b: [0.46, 0.76, -0.1], r: [0.012, 0.012], col: "ember2", paint: true },
      { t: "cap", a: [0.46, 0.76, -0.1], b: [0.38, 0.68, -0.1], r: [0.012, 0.012], col: "ember2", paint: true },
      bag([0.3, 0.07, 0.2], "sand", 20), bag([0.14, 0.07, 0.3], "sand2", 10), bag([0.24, 0.15, 0.24], "sand", 15),
    ],
    eyes: [],
  },

  // ───────────────────────── Patrulla de la Legión ─────────────────────────

  // Control de Carreteras: a striped boom barrier across the road, a guard lamp blinking, cones.
  "control-carreteras": {
    palette: { ...LEG, road: "#4a4a54", lane: "#e8e0c8", white: "#f2eee4", lamp: "#ff4a1a", cone: "#ff7a2a", post: "#3a3a42" },
    glow: ["lamp"],
    shapes: [
      { t: "box", c: [0, 0.03, 0], s: [0.52, 0.03, 0.32], round: 0.02, col: "road", k: 0.02 },
      ...[-0.36, 0.0, 0.36].map((x): Shape => ({ t: "box", c: [x, 0.06, 0.02], s: [0.09, 0.01, 0.018], round: 0.005, col: "lane", paint: true })),
      { t: "box", c: [-0.38, 0.22, 0], s: [0.07, 0.2, 0.07], round: 0.025, col: "post", k: 0.02 },
      { t: "box", c: [-0.38, 0.06, 0], s: [0.1, 0.04, 0.1], round: 0.02, col: "ash", k: 0.02 },
      { t: "ell", c: [-0.38, 0.47, 0], r: [0.05, 0.05, 0.05], col: "lamp", k: 0.02 },
      { t: "cap", a: [-0.34, 0.33, 0.06], b: [0.42, 0.33, 0.06], r: [0.04, 0.035], col: "white", k: 0.01 },
      ...[-0.2, 0.02, 0.24].map((x): Shape => ({ t: "box", c: [x, 0.33, 0.1], s: [0.055, 0.06, 0.06], round: 0.01, rot: [0, 0, 30], col: "ember", paint: true })),
      { t: "box", c: [0.42, 0.17, 0.06], s: [0.02, 0.16, 0.02], round: 0.01, col: "post", k: 0.01 },
      ...[[0.22, 0.24], [0.42, 0.22], [-0.18, 0.24]].flatMap(([x, z]): Shape[] => [
        { t: "box", c: [x, 0.07, z], s: [0.06, 0.012, 0.06], round: 0.01, col: "cone", k: 0.01 },
        { t: "cap", a: [x, 0.07, z], b: [x, 0.22, z], r: [0.05, 0.01], col: "cone", k: 0.01 },
        { t: "tor", c: [x, 0.14, z], R: 0.03, r: 0.012, col: "white", paint: true },
      ]),
    ],
    eyes: [],
  },

  // Redada: a door kicked off its hinges, a burst of light blasting through the frame, searchlight beam.
  redada: {
    palette: { ...LEG, wall: "#8a7e72", wall2: "#6a6058", frame: "#4a3a30", door: "#7a5236", door2: "#5a3a24", knob: "#e0b04a", dark: "#1a1418", flash: "#ffe08a", beam: "#fff2c8" },
    glow: ["flash", "beam", "ember2"],
    shapes: [
      { t: "box", c: [0, 0.42, -0.12], s: [0.42, 0.42, 0.05], round: 0.02, col: "wall", k: 0.01 },
      { t: "box", c: [0.0, 0.34, -0.12], s: [0.14, 0.3, 0.1], round: 0.01, col: "dark", cut: true, k: 0.01 },
      { t: "box", c: [0.0, 0.34, -0.12], s: [0.15, 0.31, 0.06], round: 0.01, col: "dark", paint: true },
      { t: "box", c: [0, 0.66, -0.06], s: [0.18, 0.025, 0.03], round: 0.01, col: "frame", k: 0.01 },
      { t: "box", c: [-0.16, 0.34, -0.06], s: [0.025, 0.32, 0.03], round: 0.01, col: "frame", k: 0.01 },
      { t: "box", c: [0.16, 0.34, -0.06], s: [0.025, 0.32, 0.03], round: 0.01, col: "frame", k: 0.01 },
      ...burst([0, 0.38, -0.04], 10, 0, 0.3, [0.05, 0.01], "flash", { len: 0.2, r: [0.045, 0.01], col: "ember2" }, 0.03),
      { t: "ell", c: [0, 0.38, -0.04], r: [0.1, 0.16, 0.04], col: "beam", k: 0.03 },
      ...tiltX(tiltZ([
        { t: "box", c: [0.22, 0.32, 0.16], s: [0.14, 0.29, 0.025], round: 0.015, col: "door", k: 0.01 },
        { t: "box", c: [0.22, 0.44, 0.19], s: [0.1, 0.1, 0.01], round: 0.01, col: "door2", paint: true },
        { t: "box", c: [0.22, 0.18, 0.19], s: [0.1, 0.08, 0.01], round: 0.01, col: "door2", paint: true },
        { t: "ell", c: [0.11, 0.3, 0.2], r: [0.022, 0.022, 0.022], col: "knob", k: 0.005 },
      ], -22, [0.3, 0.05]), 30, [0, 0.05, 0.16]),
      ...[[0.42, 0.7, 0.1, 20], [-0.36, 0.62, 0.14, -30], [-0.3, 0.12, 0.22, 10]].map(([x, y, z, r]): Shape => rock([x, y, z], [0.05, 0.03, 0.03], "wall2", [r, r, r], 0)),
    ],
    eyes: [],
  },

  // ───────────────────────── Maestro de Armas ─────────────────────────

  // Instrucción de Tiro: a silhouette practice target on a wooden stand, ringed and riddled with holes, casings below.
  "instruccion-tiro": {
    palette: { ...LEG, paper: "#efe6d0", sil: "#3a3a44", ring: "#f2eee4", hole: "#141014", wood: "#8a5a34", wood2: "#6a4226", brass: "#e0aa3a", ground: "#7a7066" },
    glow: [],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.42, 0.03, 0.3], col: "ground", k: 0.02 },
      { t: "cap", a: [-0.22, 0.02, 0.02], b: [-0.22, 0.6, -0.04], r: [0.025, 0.022], col: "wood2", k: 0.01 },
      { t: "cap", a: [0.22, 0.02, 0.02], b: [0.22, 0.6, -0.04], r: [0.025, 0.022], col: "wood2", k: 0.01 },
      { t: "box", c: [0, 0.18, -0.02], s: [0.25, 0.02, 0.02], round: 0.01, col: "wood", k: 0.01 },
      { t: "box", c: [0, 0.5, 0], s: [0.21, 0.3, 0.015], round: 0.012, col: "paper", k: 0.01 },
      { t: "ell", c: [0, 0.68, 0.015], r: [0.065, 0.075, 0.01], col: "sil", paint: true },
      { t: "ell", c: [0, 0.4, 0.015], r: [0.15, 0.2, 0.01], col: "sil", paint: true },
      { t: "box", c: [0, 0.27, 0.015], s: [0.2, 0.08, 0.01], round: 0.01, col: "sil", paint: true },
      { t: "tor", c: [0, 0.44, 0.015], R: 0.1, r: 0.008, rot: [90, 0, 0], col: "ring", paint: true },
      { t: "tor", c: [0, 0.44, 0.015], R: 0.055, r: 0.008, rot: [90, 0, 0], col: "ring", paint: true },
      { t: "ell", c: [0, 0.44, 0.015], r: [0.02, 0.02, 0.02], col: "ember", paint: true },
      ...[[0.01, 0.45], [-0.04, 0.41], [0.05, 0.5], [-0.07, 0.68], [0.12, 0.3], [-0.1, 0.56]].map(([x, y]): Shape => ({ t: "ell", c: [x, y, 0.015], r: [0.013, 0.013, 0.02], col: "hole", paint: true })),
      ...[[0.12, 0.2, 30], [0.2, 0.25, -20], [-0.1, 0.24, 70], [0.3, 0.14, 10], [-0.28, 0.2, -40]].map(([x, z, r]): Shape => ({ t: "cap", a: [x, 0.065, z], b: [x + 0.05 * Math.cos(rad(r)), 0.065, z + 0.05 * Math.sin(rad(r))], r: [0.016, 0.016], col: "brass", k: 0.005 })),
    ],
    eyes: [],
  },

  // Taller de Prototipos: a workbench with a glowing prototype blaster clamped in a vise, wrench and blueprint beside it.
  "taller-prototipos": {
    palette: { ...LEG, top: "#8a5a34", wood: "#6a4226", vise: "#4a5a6a", gun: "#3a3a44", gun2: "#8a929c", core: "#ff7a2a", blue: "#3a7ad0", line: "#c8e0ff", tool: "#c8ccd4", grip: "#d8402a" },
    glow: ["core", "ember2"],
    shapes: [
      ...[-0.36, 0.36].flatMap((x): Shape[] => [-0.14, 0.14].map((z): Shape => ({ t: "box", c: [x, 0.13, z], s: [0.03, 0.13, 0.03], round: 0.01, col: "wood", k: 0.01 }))),
      { t: "box", c: [0, 0.29, 0], s: [0.44, 0.035, 0.2], round: 0.02, col: "top", k: 0.01 },
      { t: "box", c: [0.2, 0.33, 0.04], s: [0.18, 0.004, 0.12], round: 0.003, rot: [0, -12, 0], col: "blue", k: 0 },
      ...[-0.05, 0.0, 0.05].map((z): Shape => ({ t: "box", c: [0.2, 0.336, 0.04 + z], s: [0.14, 0.004, 0.005], round: 0.002, rot: [0, -12, 0], col: "line", paint: true })),
      { t: "box", c: [-0.18, 0.38, 0], s: [0.07, 0.06, 0.06], round: 0.015, col: "vise", k: 0.01 },
      { t: "box", c: [-0.18, 0.46, -0.07], s: [0.06, 0.05, 0.02], round: 0.01, col: "vise", k: 0.01 },
      { t: "box", c: [-0.18, 0.46, 0.07], s: [0.06, 0.05, 0.02], round: 0.01, col: "vise", k: 0.01 },
      { t: "cap", a: [-0.18, 0.4, 0.09], b: [-0.18, 0.4, 0.2], r: [0.012, 0.012], col: "tool", k: 0.005 },
      { t: "cap", a: [-0.18, 0.4, 0.2], b: [-0.18, 0.46, 0.2], r: [0.015, 0.015], col: "tool", k: 0.005 },
      { t: "box", c: [-0.18, 0.54, 0], s: [0.16, 0.05, 0.045], round: 0.03, col: "gun", k: 0.02 },
      { t: "cap", a: [-0.06, 0.55, 0], b: [0.14, 0.55, 0], r: [0.035, 0.028], col: "gun2", k: 0.01 },
      ...[0.0, 0.05, 0.1].map((x): Shape => ({ t: "tor", c: [x, 0.55, 0], R: 0.036, r: 0.01, rot: [0, 0, 90], col: "ember", k: 0 })),
      { t: "ell", c: [0.16, 0.55, 0], r: [0.025, 0.03, 0.03], col: "core", k: 0.01 },
      { t: "ell", c: [-0.2, 0.6, 0.0], r: [0.04, 0.03, 0.04], col: "core", k: 0.01 },
      { t: "box", c: [-0.28, 0.48, 0], s: [0.025, 0.06, 0.03], round: 0.012, rot: [0, 0, -15], col: "gun", k: 0.01 },
      ...line([[-0.2, 0.62, 0.0], [-0.24, 0.72, 0.04], [-0.16, 0.8, 0.0]], 0.012, "ember2", 0),
      { t: "cap", a: [0.0, 0.34, 0.14], b: [0.2, 0.34, 0.16], r: [0.016, 0.016], col: "tool", k: 0.005 },
      { t: "tor", c: [0.23, 0.34, 0.165], R: 0.03, r: 0.012, col: "tool", k: 0.005 },
      { t: "cap", a: [-0.38, 0.34, 0.1], b: [-0.3, 0.34, 0.16], r: [0.02, 0.02], col: "grip", k: 0.005 },
      { t: "cap", a: [-0.3, 0.34, 0.16], b: [-0.24, 0.34, 0.2], r: [0.01, 0.01], col: "tool", k: 0.005 },
    ],
    eyes: [],
  },

  // ───────────────────────── Saeta Negra ─────────────────────────

  // Fuego de Cobertura: two rifles poking over a sandbag wall, blazing muzzle flashes.
  "fuego-cobertura": {
    palette: { ...LEG, sand: "#b8a07a", sand2: "#9a845e", flash: "#ffd04a", hot: "#fff2b0", ground: "#6a645a", tracer: "#ff8a3a" },
    glow: ["flash", "hot", "tracer"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.46, 0.03, 0.28], col: "ground", k: 0.02 },
      ...[-0.3, -0.1, 0.1, 0.3].map((x, i): Shape => bag([x, 0.07, 0.06], i % 2 ? "sand2" : "sand", i * 5)),
      ...[-0.2, 0.0, 0.2].map((x, i): Shape => bag([x, 0.16, 0.05], i % 2 ? "sand" : "sand2", -i * 6)),
      ...[-0.1, 0.1].map((x, i): Shape => bag([x, 0.25, 0.04], i % 2 ? "sand2" : "sand")),
      ...tiltZ(rifle(-0.42, 0.33, -0.06, 0.85, "ash", "ash3", "ember"), 6, [-0.1, 0.33]),
      ...tiltZ(rifle(-0.36, 0.38, -0.2, 0.75, "ash2", "ash3", "ember"), 14, [-0.1, 0.38]),
      ...burst([0.13, 0.4, -0.06], 6, 0, 0.13, [0.045, 0.01], "flash", { len: 0.08, r: [0.04, 0.01], col: "ember2" }, 0.02),
      { t: "ell", c: [0.14, 0.4, -0.06], r: [0.045, 0.045, 0.045], col: "hot", k: 0.02 },
      ...burst([0.15, 0.5, -0.2], 6, 30, 0.11, [0.04, 0.01], "flash", { len: 0.07, r: [0.035, 0.01], col: "ember2" }, 0.02),
      { t: "ell", c: [0.16, 0.5, -0.2], r: [0.04, 0.04, 0.04], col: "hot", k: 0.02 },
      { t: "cap", a: [0.3, 0.43, -0.06], b: [0.48, 0.46, -0.06], r: [0.012, 0.012], col: "tracer", k: 0 },
      { t: "cap", a: [0.3, 0.57, -0.2], b: [0.46, 0.62, -0.2], r: [0.012, 0.012], col: "tracer", k: 0 },
    ],
    eyes: [],
  },

  // Prueba de Campo: an experimental ember rifle on a tripod firing a glowing beam into a scorched test block.
  "prueba-campo": {
    palette: { ...LEG, beam: "#ff7a2a", beam2: "#ffe08a", block: "#8a8a92", block2: "#6a6a72", scorch: "#2a2226", leg: "#3a3a42", core: "#ffb04a", ground: "#7a7066" },
    glow: ["beam", "beam2", "core"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.03, 0.28], col: "ground", k: 0.02 },
      ...[[-0.44, 0.12], [-0.22, 0.12], [-0.33, -0.16]].map(([x, z]): Shape => ({ t: "cap", a: [-0.33, 0.3, -0.02], b: [x, 0.03, z], r: [0.016, 0.014], col: "leg", k: 0.01 })),
      { t: "ell", c: [-0.33, 0.31, -0.02], r: [0.03, 0.03, 0.03], col: "leg", k: 0.01 },
      { t: "box", c: [-0.34, 0.38, -0.02], s: [0.14, 0.05, 0.05], round: 0.03, col: "ash", k: 0.02 },
      { t: "cap", a: [-0.22, 0.39, -0.02], b: [-0.06, 0.39, -0.02], r: [0.035, 0.03], col: "ash2", k: 0.01 },
      ...[-0.18, -0.13, -0.08].map((x): Shape => ({ t: "tor", c: [x, 0.39, -0.02], R: 0.036, r: 0.01, rot: [0, 0, 90], col: "ember", k: 0 })),
      { t: "ell", c: [-0.36, 0.44, -0.02], r: [0.05, 0.03, 0.035], col: "core", k: 0.01 },
      { t: "box", c: [-0.47, 0.36, -0.02], s: [0.05, 0.04, 0.03], round: 0.015, col: "ash3", k: 0.01 },
      { t: "cap", a: [-0.04, 0.39, -0.02], b: [0.26, 0.34, -0.02], r: [0.04, 0.03], col: "beam", k: 0.01 },
      { t: "cap", a: [-0.04, 0.39, -0.02], b: [0.26, 0.34, -0.02], r: [0.018, 0.014], col: "beam2", k: 0 },
      ...arc(0.06, 0.38, -0.02, 0.07, 100, 260, 4, 0.012, "beam2"),
      { t: "box", c: [0.38, 0.2, -0.04], s: [0.12, 0.17, 0.12], round: 0.03, col: "block", k: 0.02 },
      { t: "box", c: [0.38, 0.33, -0.04], s: [0.12, 0.015, 0.12], round: 0.01, col: "block2", paint: true },
      { t: "ell", c: [0.28, 0.33, -0.02], r: [0.05, 0.06, 0.06], col: "scorch", cut: true, k: 0.02 },
      { t: "ell", c: [0.27, 0.33, -0.02], r: [0.06, 0.08, 0.08], col: "scorch", paint: true },
      ...burst([0.27, 0.34, -0.02], 7, 20, 0.14, [0.03, 0.006], "beam2", { len: 0.09, r: [0.028, 0.006], col: "beam" }, 0),
    ],
    eyes: [],
  },

  // Retirada Calculada: a smoke grenade pouring out a grey cloud, boot prints leading away from it.
  "retirada-calculada": {
    palette: { ...LEG, can: "#4a5a4a", can2: "#2c342c", pin: "#c8ccd4", smoke: "#8a8a94", smoke2: "#b0b0b8", smoke3: "#6a6a74", ground: "#9a8e7a", print: "#5a5044" },
    glow: ["ember2"],
    shapes: [
      { t: "box", c: [0, 0.03, 0], s: [0.5, 0.03, 0.3], round: 0.03, col: "ground", k: 0.02 },
      ...[[0.1, 0.18, -20], [0.2, 0.06, -15], [0.3, 0.16, -10], [0.4, 0.04, -10]].flatMap(([x, z, r]): Shape[] => [
        { t: "ell", c: [x, 0.06, z], r: [0.04, 0.01, 0.022], rot: [0, r, 0], col: "print", paint: true },
        { t: "ell", c: [x - 0.055, 0.06, z], r: [0.018, 0.01, 0.02], rot: [0, r, 0], col: "print", paint: true },
      ]),
      ...tiltZ([
        { t: "cap", a: [-0.34, 0.12, 0.12], b: [-0.12, 0.12, 0.12], r: [0.06, 0.06], col: "can", k: 0.01 },
        { t: "tor", c: [-0.2, 0.12, 0.12], R: 0.062, r: 0.01, rot: [0, 0, 90], col: "ember", k: 0 },
        { t: "cap", a: [-0.12, 0.12, 0.12], b: [-0.08, 0.12, 0.12], r: [0.04, 0.04], col: "can2", k: 0.01 },
        { t: "tor", c: [-0.07, 0.12, 0.18], R: 0.025, r: 0.007, col: "pin", k: 0 },
      ], 8, [-0.2, 0.08]),
      { t: "ell", c: [-0.34, 0.26, 0.06], r: [0.14, 0.12, 0.14], col: "smoke", k: 0.08 },
      { t: "ell", c: [-0.26, 0.42, -0.02], r: [0.16, 0.14, 0.15], col: "smoke2", k: 0.08 },
      { t: "ell", c: [-0.06, 0.52, -0.08], r: [0.16, 0.13, 0.14], col: "smoke", k: 0.08 },
      { t: "ell", c: [-0.4, 0.58, -0.1], r: [0.13, 0.12, 0.12], col: "smoke3", k: 0.08 },
      { t: "ell", c: [-0.18, 0.7, -0.12], r: [0.14, 0.11, 0.12], col: "smoke2", k: 0.08 },
      { t: "ell", c: [0.1, 0.66, -0.14], r: [0.1, 0.09, 0.1], col: "smoke3", k: 0.08 },
      { t: "ell", c: [-0.03, 0.12, 0.12], r: [0.03, 0.03, 0.03], col: "ember2", k: 0.01 },
      ...line([[0.36, 0.3, 0.06], [0.48, 0.3, 0.06], [0.44, 0.34, 0.06]], 0.016, "ember", 0),
      ...line([[0.48, 0.3, 0.06], [0.44, 0.26, 0.06]], 0.016, "ember", 0),
    ],
    eyes: [],
  },

  // Disparo Certero: a black-and-ember bolt struck dead centre in a bullseye, splinters flying.
  "disparo-certero": {
    palette: { ...LEG, face: "#f2eee4", ring: "#d8402a", ring2: "#3a3a44", wood: "#8a5a34", wood2: "#6a4226", shaft: "#2c2c32", fletch: "#ff5a24", tip: "#c8ccd4", trail: "#ffb04a" },
    glow: ["trail"],
    shapes: [
      { t: "cap", a: [0, 0.0, -0.18], b: [0, 0.36, -0.1], r: [0.025, 0.022], col: "wood2", k: 0.01 },
      { t: "cap", a: [-0.2, 0.0, 0.06], b: [-0.08, 0.3, -0.02], r: [0.022, 0.02], col: "wood2", k: 0.01 },
      { t: "cap", a: [0.2, 0.0, 0.06], b: [0.08, 0.3, -0.02], r: [0.022, 0.02], col: "wood2", k: 0.01 },
      { t: "ell", c: [0, 0.48, -0.06], r: [0.32, 0.32, 0.045], col: "wood", k: 0.01 },
      { t: "ell", c: [0, 0.48, -0.02], r: [0.29, 0.29, 0.04], col: "face", k: 0.01 },
      { t: "tor", c: [0, 0.48, 0.02], R: 0.235, r: 0.03, rot: [90, 0, 0], col: "ring2", paint: true },
      { t: "tor", c: [0, 0.48, 0.02], R: 0.155, r: 0.035, rot: [90, 0, 0], col: "ring", paint: true },
      { t: "tor", c: [0, 0.48, 0.02], R: 0.08, r: 0.03, rot: [90, 0, 0], col: "ring2", paint: true },
      { t: "ell", c: [0, 0.48, 0.02], r: [0.04, 0.04, 0.04], col: "ring", paint: true },
      { t: "cap", a: [0.0, 0.48, 0.0], b: [0.36, 0.64, 0.16], r: [0.018, 0.018], col: "shaft", k: 0.01 },
      ...[0, 120, 240].map((a): Shape => {
        const oy = 0.045 * Math.cos(rad(a)), oz = 0.045 * Math.sin(rad(a));
        return { t: "cap", a: [0.28, 0.6 + oy * 0.3, 0.125 + oz * 0.3], b: [0.37, 0.64 + oy, 0.165 + oz], r: [0.012, 0.03], col: "fletch", k: 0.01 };
      }),
      { t: "cap", a: [0.42, 0.7, 0.18], b: [0.62, 0.8, 0.26], r: [0.014, 0.004], col: "trail", k: 0 },
      { t: "cap", a: [0.42, 0.6, 0.18], b: [0.6, 0.66, 0.26], r: [0.012, 0.004], col: "trail", k: 0 },
      ...burst([0.0, 0.48, 0.04], 6, 15, 0.12, [0.02, 0.005], "fletch", undefined, 0),
    ],
    eyes: [],
  },

  // Cámara Acorazada: a massive round vault door set in a wall, spoked wheel handle and heavy bolts.
  "camara-acorazada": {
    palette: { ...LEG, wall: "#5a5a62", wall2: "#44444c", steel: "#9aa6b2", steel2: "#c4ced8", rim: "#6a7480", bolt: "#e0aa3a", hub: "#3a3a44", light: "#ff5a24" },
    glow: ["light"],
    shapes: [
      { t: "box", c: [0, 0.48, -0.1], s: [0.44, 0.44, 0.06], round: 0.02, col: "wall", k: 0.01 },
      ...[0.2, 0.48, 0.76].map((y): Shape => ({ t: "box", c: [0, y, -0.04], s: [0.45, 0.006, 0.02], round: 0.003, col: "wall2", paint: true })),
      { t: "ell", c: [0, 0.46, -0.04], r: [0.34, 0.34, 0.06], col: "rim", k: 0.01 },
      { t: "ell", c: [0, 0.46, 0.0], r: [0.28, 0.28, 0.07], col: "steel", k: 0.01 },
      { t: "tor", c: [0, 0.46, 0.06], R: 0.22, r: 0.012, rot: [90, 0, 0], col: "rim", paint: true },
      ...Array.from({ length: 12 }, (_, i): Shape => ({ t: "ell", c: [0.315 * Math.cos(rad(i * 30)), 0.46 + 0.315 * Math.sin(rad(i * 30)), 0.03], r: [0.02, 0.02, 0.02], col: "bolt", k: 0.005 })),
      { t: "cap", a: [0, 0.46, 0.05], b: [0, 0.46, 0.16], r: [0.05, 0.045], col: "hub", k: 0.01 },
      { t: "tor", c: [0, 0.46, 0.16], R: 0.16, r: 0.022, rot: [90, 0, 0], col: "steel2", k: 0.01 },
      ...[0, 60, 120].map((a): Shape => ({ t: "cap", a: [-0.16 * Math.cos(rad(a)), 0.46 - 0.16 * Math.sin(rad(a)), 0.16], b: [0.16 * Math.cos(rad(a)), 0.46 + 0.16 * Math.sin(rad(a)), 0.16], r: [0.016, 0.016], col: "steel2", k: 0.01 })),
      ...[0, 60, 120, 180, 240, 300].map((a): Shape => ({ t: "ell", c: [0.17 * Math.cos(rad(a)), 0.46 + 0.17 * Math.sin(rad(a)), 0.16], r: [0.026, 0.026, 0.026], col: "hub", k: 0.01 })),
      { t: "ell", c: [0, 0.46, 0.17], r: [0.035, 0.035, 0.03], col: "light", k: 0.01 },
      { t: "box", c: [0.36, 0.46, 0.0], s: [0.04, 0.12, 0.04], round: 0.015, col: "hub", k: 0.01 },
      { t: "ell", c: [0.36, 0.52, 0.04], r: [0.015, 0.015, 0.015], col: "light", k: 0 },
    ],
    eyes: [],
  },

  // ───────────────────────── Experto de Saeta ─────────────────────────

  // Arsenal Completo: a wall rack packed with ash-grey rifles, an ammo crate full of ember shells below.
  "arsenal-completo": {
    palette: { ...LEG, rack: "#6a4a34", rack2: "#4a3224", back: "#8a7a66", crate: "#5a6048", crate2: "#3e4232", shell: "#e0aa3a", tip: "#7a828c" },
    glow: [],
    shapes: [
      { t: "box", c: [0, 0.52, -0.14], s: [0.38, 0.34, 0.025], round: 0.015, col: "back", k: 0.01 },
      { t: "box", c: [0, 0.3, -0.08], s: [0.38, 0.025, 0.06], round: 0.012, col: "rack", k: 0.01 },
      { t: "box", c: [0, 0.78, -0.08], s: [0.38, 0.025, 0.06], round: 0.012, col: "rack", k: 0.01 },
      ...[-0.26, -0.09, 0.08, 0.25].flatMap((x, i): Shape[] => tiltZ(rifle(x, 0.3, -0.05, 0.85, i % 2 ? "ash2" : "ash", "ash3", "ember"), 90, [x, 0.3]).map((s): Shape => s)),
      { t: "box", c: [0.04, 0.1, 0.16], s: [0.24, 0.1, 0.1], round: 0.02, col: "crate", k: 0.01 },
      { t: "box", c: [0.04, 0.21, 0.16], s: [0.25, 0.018, 0.11], round: 0.01, col: "crate2", k: 0.005 },
      { t: "box", c: [0.04, 0.1, 0.27], s: [0.22, 0.012, 0.01], round: 0.004, col: "crate2", paint: true },
      { t: "cap", a: [-0.06, 0.14, 0.265], b: [0.0, 0.1, 0.265], r: [0.014, 0.014], col: "ember", paint: true },
      { t: "cap", a: [0.0, 0.1, 0.265], b: [-0.06, 0.06, 0.265], r: [0.014, 0.014], col: "ember", paint: true },
      ...line([[-0.22, 0.22, 0.06], [-0.1, 0.24, 0.2], [0.06, 0.235, 0.24], [0.2, 0.2, 0.26], [0.27, 0.08, 0.26]], 0.016, "ash3", 0.005),
      ...[-0.18, -0.12, -0.06, 0.0, 0.06, 0.12, 0.18].map((x): Shape => {
        const y = x < 0.2 ? 0.25 - Math.max(0, x - 0.1) * 0.6 : 0.2, z = 0.12 + Math.min(0.14, (x + 0.2) * 0.5);
        return { t: "cap", a: [x, y, z], b: [x, y + 0.05, z + 0.01], r: [0.014, 0.008], col: "shell", k: 0.004 };
      }),
    ],
    eyes: [],
  },

  // Ráfaga de Supresión: a heavy machine gun spitting a fan of ember tracers, brass casings tumbling out.
  "rafaga-supresion": {
    palette: { ...LEG, jacket: "#5a5a62", hole: "#1e1e24", flash: "#ffd04a", hot: "#fff2b0", tracer: "#ff6a24", tracer2: "#ffb04a", brass: "#e0aa3a", ground: "#6a645a" },
    glow: ["flash", "hot", "tracer", "tracer2"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.03, 0.28], col: "ground", k: 0.02 },
      ...[[-0.5, 0.14], [-0.3, 0.14], [-0.4, -0.16]].map(([x, z]): Shape => ({ t: "cap", a: [-0.4, 0.22, -0.02], b: [x, 0.03, z], r: [0.016, 0.014], col: "ash3", k: 0.01 })),
      { t: "box", c: [-0.42, 0.3, -0.02], s: [0.12, 0.07, 0.06], round: 0.03, col: "ash", k: 0.02 },
      { t: "box", c: [-0.42, 0.38, 0.06], s: [0.06, 0.03, 0.03], round: 0.012, col: "ember", k: 0.01 },
      { t: "cap", a: [-0.3, 0.31, -0.02], b: [-0.08, 0.33, -0.02], r: [0.045, 0.04], col: "jacket", k: 0.01 },
      ...[-0.26, -0.21, -0.16, -0.11].map((x): Shape => ({ t: "ell", c: [x, 0.33, 0.02], r: [0.012, 0.012, 0.02], col: "hole", paint: true })),
      { t: "cap", a: [-0.08, 0.33, -0.02], b: [-0.03, 0.335, -0.02], r: [0.025, 0.025], col: "ash3", k: 0.01 },
      { t: "box", c: [-0.42, 0.22, 0.1], s: [0.06, 0.05, 0.04], round: 0.01, col: "ash2", k: 0.01 },
      ...burst([0.0, 0.34, -0.02], 6, 0, 0.11, [0.045, 0.01], "flash", { len: 0.07, r: [0.04, 0.01], col: "tracer2" }, 0.02),
      { t: "ell", c: [0.0, 0.34, -0.02], r: [0.045, 0.045, 0.045], col: "hot", k: 0.02 },
      ...[[0.2, 0.52, 0.1], [0.26, 0.4, -0.02], [0.24, 0.26, 0.06], [0.42, 0.62, -0.06], [0.48, 0.44, 0.04], [0.44, 0.2, -0.04], [0.36, 0.78, 0.0]].map(([x, y, z], i): Shape => {
        const dx = x, dy = y - 0.34, l = Math.hypot(dx, dy);
        return { t: "cap", a: [x - (dx / l) * 0.1, y - (dy / l) * 0.1, z], b: [x, y, z], r: [0.008, 0.022], col: i % 2 ? "tracer2" : "tracer", k: 0 };
      }),
      ...[[-0.36, 0.44, 0.14, 30], [-0.28, 0.52, 0.1, -40], [-0.32, 0.1, 0.18, 80], [-0.22, 0.07, 0.22, 10], [-0.12, 0.07, 0.18, -30]].map(([x, y, z, a]): Shape => ({ t: "cap", a: [x, y, z], b: [x + 0.045 * Math.cos(rad(a)), y + 0.045 * Math.sin(rad(a)), z], r: [0.014, 0.014], col: "brass", k: 0.005 })),
    ],
    eyes: [],
  },
  // ───────────────────────── Amalgama · entornos ─────────────────────────

  // Acantilados Rocosos: a tall stepped sea cliff of layered rock, grass on top, surf foaming at its foot.
  "acantilados-rocosos": {
    palette: { ...MAT, sea: "#3a8ac8", sea2: "#5ab0e0", foam: "#f2f8ff", grass: "#6aa84a", grass2: "#4a8a3a" },
    shapes: [
      { t: "ell", c: [0.1, 0.03, 0.06], r: [0.5, 0.035, 0.3], col: "sea", k: 0.02 },
      { t: "ell", c: [0.3, 0.06, 0.14], r: [0.16, 0.012, 0.08], col: "sea2", paint: true },
      rock([-0.2, 0.2, -0.04], [0.26, 0.2, 0.2], "stone", [0, 10, 0], 0.03),
      rock([-0.24, 0.5, -0.08], [0.21, 0.13, 0.17], "stone2", [0, -8, 3], 0.03),
      rock([-0.26, 0.74, -0.1], [0.16, 0.12, 0.14], "stone", [0, 14, -3], 0.03),
      rock([0.1, 0.14, -0.08], [0.12, 0.13, 0.14], "stone2", [0, 20, 0], 0.03),
      rock([0.1, 0.32, -0.12], [0.09, 0.07, 0.1], "stone", [0, -10, 0], 0.03),
      ...[0.36, 0.62].map((y): Shape => ({ t: "box", c: [-0.22, y, 0.0], s: [0.25, 0.01, 0.2], round: 0.005, rot: [0, 10, 0], col: "stone3", paint: true })),
      { t: "ell", c: [-0.26, 0.86, -0.1], r: [0.16, 0.03, 0.14], col: "grass", k: 0.03 },
      ...[[-0.36, -0.02], [-0.24, 0.02], [-0.14, -0.06]].map(([x, z]): Shape => ({ t: "cap", a: [x, 0.86, z], b: [x + 0.02, 0.95, z], r: [0.02, 0.006], col: "grass2", k: 0.01 })),
      ...[[0.04, 0.1, 0.12], [0.24, 0.08, 0.04], [-0.02, 0.07, 0.2], [0.36, 0.06, 0.24]].map(([x, y, z]): Shape => ({ t: "ell", c: [x, y, z], r: [0.07, 0.035, 0.05], col: "foam", k: 0.03 })),
      rock([0.34, 0.08, -0.06], [0.06, 0.06, 0.05], "stone2", [10, 20, 0], 0.02),
    ],
    eyes: [],
  },

  // Fábrica Abandonada: a derelict sawtooth-roof factory, cold chimney, broken and boarded windows, weeds.
  "fabrica-abandonada": {
    palette: { ...MAT, brick: "#9a5a42", brick2: "#7a4232", roof: "#5a5a62", win: "#1e2228", board: "#9a7a4e", rust: "#b5562a", weed: "#6aa84a", ground: "#7a7066" },
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.03, 0.3], col: "ground", k: 0.02 },
      { t: "box", c: [0, 0.22, -0.02], s: [0.36, 0.2, 0.17], round: 0.015, col: "brick", k: 0.01 },
      ...[-0.24, 0.0, 0.24].map((x): Shape => ({ t: "box", c: [x, 0.44, -0.02], s: [0.1, 0.1, 0.165], round: 0.01, rot: [0, 0, 45], col: "roof", k: 0.01 })),
      { t: "box", c: [0, 0.4, -0.02], s: [0.37, 0.025, 0.175], round: 0.01, col: "brick2", k: 0.01 },
      ...[-0.24, 0.0, 0.24].map((x): Shape => ({ t: "box", c: [x - 0.035, 0.47, 0.13], s: [0.04, 0.04, 0.02], round: 0.005, rot: [0, 0, 45], col: "win", paint: true })),
      { t: "cap", a: [0.28, 0.4, -0.12], b: [0.3, 0.88, -0.12], r: [0.06, 0.05], col: "brick2", k: 0.02 },
      { t: "tor", c: [0.3, 0.82, -0.12], R: 0.055, r: 0.014, col: "rust", k: 0.005 },
      { t: "ell", c: [0.3, 0.9, -0.12], r: [0.04, 0.02, 0.04], col: "win", cut: true, k: 0.01 },
      ...[-0.24, -0.08, 0.08, 0.24].map((x): Shape => ({ t: "box", c: [x, 0.24, 0.15], s: [0.05, 0.07, 0.02], round: 0.01, col: "win", paint: true })),
      ...[-0.24, 0.08].map((x, i): Shape => ({ t: "box", c: [x, 0.24, 0.16], s: [0.07, 0.012, 0.012], round: 0.005, rot: [0, 0, i ? -25 : 25], col: "board", k: 0 })),
      { t: "box", c: [0.24, 0.26, 0.16], s: [0.07, 0.012, 0.012], round: 0.005, rot: [0, 0, -20], col: "board", k: 0 },
      { t: "box", c: [-0.08, 0.3, 0.155], s: [0.03, 0.025, 0.02], round: 0.005, col: "brick", paint: true },
      { t: "box", c: [0.0, 0.1, 0.16], s: [0.06, 0.08, 0.01], round: 0.005, col: "rust", k: 0.005 },
      { t: "box", c: [0.16, 0.34, 0.155], s: [0.008, 0.05, 0.02], round: 0.004, col: "rust", paint: true },
      ...[[-0.38, 0.12], [-0.3, 0.2], [0.34, 0.2], [0.42, 0.06], [-0.16, 0.22]].flatMap(([x, z]): Shape[] => [
        { t: "cap", a: [x, 0.04, z], b: [x - 0.02, 0.13, z], r: [0.016, 0.004], col: "weed", k: 0.01 },
        { t: "cap", a: [x, 0.04, z], b: [x + 0.03, 0.11, z], r: [0.014, 0.004], col: "weed", k: 0.01 },
      ]),
      ...line([[-0.36, 0.06, 0.18], [-0.34, 0.2, 0.17], [-0.3, 0.3, 0.17], [-0.34, 0.36, 0.17]], 0.012, "weed", 0.005),
    ],
    eyes: [],
  },

  // Montañas Nevadas: three snow-capped peaks over a snowfield, two frosted pines at their feet.
  "montanas-nevadas": {
    palette: { ...MAT, rockA: "#6a7488", rockB: "#56607a", snow: "#f4f8ff", snow2: "#d8e6f6", leaf: "#2e6a4a", leaf2: "#3a7a56", trunk: "#5a3a26" },
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.52, 0.035, 0.32], col: "snow2", k: 0.02 },
      { t: "cap", a: [-0.02, 0.0, -0.1], b: [-0.02, 0.82, -0.1], r: [0.34, 0.02], col: "rockA", k: 0.04 },
      { t: "cap", a: [-0.3, 0.0, 0.0], b: [-0.3, 0.52, 0.0], r: [0.24, 0.02], col: "rockB", k: 0.04 },
      { t: "cap", a: [0.28, 0.0, 0.02], b: [0.28, 0.6, 0.02], r: [0.24, 0.02], col: "rockB", k: 0.04 },
      { t: "box", c: [0, -0.4, 0], s: [0.8, 0.4, 0.7], round: 0, col: "rockB", cut: true, k: 0 },
      { t: "ell", c: [0, 0.03, 0.04], r: [0.56, 0.03, 0.36], col: "snow2", k: 0.03 },
      { t: "cap", a: [-0.02, 0.52, -0.1], b: [-0.02, 0.86, -0.1], r: [0.16, 0.0], col: "snow", paint: true },
      { t: "cap", a: [-0.3, 0.34, 0.0], b: [-0.3, 0.56, 0.0], r: [0.12, 0.0], col: "snow", paint: true },
      { t: "cap", a: [0.28, 0.38, 0.02], b: [0.28, 0.64, 0.02], r: [0.12, 0.0], col: "snow", paint: true },
      ...pine(0.12, 0.26, 0.26, "leaf", "leaf2", "trunk", "snow"),
      ...pine(-0.14, 0.28, 0.2, "leaf2", "leaf", "trunk", "snow"),
    ],
    eyes: [],
  },

  // Bosque Denso: a tight cluster of tall pines and leafy round trees on a mossy patch, a mushroom at the edge.
  "bosque-denso": {
    palette: { ...MAT, leaf: "#2e6a3a", leaf2: "#3e8a46", leaf3: "#5aa84a", trunk: "#6a4226", moss: "#4a7a3a", cap: "#d8402a", dot: "#f8f2e4", stem: "#f2e6c8" },
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.035, 0.32], col: "moss", k: 0.02 },
      ...pine(-0.08, -0.12, 0.92, "leaf", "leaf2", "trunk"),
      ...pine(-0.32, 0.0, 0.7, "leaf2", "leaf", "trunk"),
      ...pine(0.26, -0.06, 0.78, "leaf", "leaf2", "trunk"),
      { t: "cap", a: [0.06, 0.0, 0.16], b: [0.06, 0.24, 0.16], r: [0.035, 0.03], col: "trunk", k: 0.01 },
      { t: "ell", c: [0.06, 0.34, 0.16], r: [0.15, 0.14, 0.13], col: "leaf3", k: 0.04 },
      { t: "ell", c: [0.16, 0.3, 0.12], r: [0.09, 0.09, 0.09], col: "leaf2", k: 0.04 },
      { t: "cap", a: [-0.24, 0.0, 0.2], b: [-0.24, 0.12, 0.2], r: [0.03, 0.025], col: "trunk", k: 0.01 },
      { t: "ell", c: [-0.24, 0.2, 0.2], r: [0.1, 0.1, 0.09], col: "leaf3", k: 0.04 },
      { t: "cap", a: [0.36, 0.03, 0.22], b: [0.36, 0.09, 0.22], r: [0.016, 0.014], col: "stem", k: 0.01 },
      { t: "ell", c: [0.36, 0.1, 0.22], r: [0.05, 0.03, 0.05], col: "cap", k: 0.01 },
      { t: "ell", c: [0.36, 0.125, 0.25], r: [0.012, 0.012, 0.012], col: "dot", paint: true },
    ],
    eyes: [],
  },

  // ───────────────────────── Amalgama · traiciones ─────────────────────────

  // Golpe de Materia: a fist built of mixed materials — stone, steel, wood and ice knuckles — smashing an impact burst.
  "golpe-material": {
    palette: { ...MAT, flash: "#ffd04a", flash2: "#ff8a2a" },
    glow: ["flash", "flash2"],
    shapes: [
      ...burst([0, 0.56, -0.14], 12, 15, 0.42, [0.06, 0.01], "flash", { len: 0.3, r: [0.05, 0.01], col: "flash2" }, 0.03),
      { t: "cap", a: [0.02, 0.0, -0.04], b: [0, 0.38, 0], r: [0.13, 0.14], col: "wood", k: 0.03 },
      { t: "tor", c: [0.01, 0.12, -0.02], R: 0.135, r: 0.03, col: "stone2", k: 0.02 },
      { t: "box", c: [0.06, 0.24, 0.12], s: [0.07, 0.05, 0.04], round: 0.03, col: "ice", k: 0.02 },
      { t: "cap", a: [-0.12, 0.2, 0.08], b: [-0.08, 0.3, 0.1], r: [0.02, 0.02], col: "wood2", paint: true },
      { t: "box", c: [0, 0.54, 0.0], s: [0.23, 0.17, 0.15], round: 0.08, col: "stone", k: 0.05 },
      { t: "box", c: [0.14, 0.54, 0.0], s: [0.12, 0.2, 0.2], round: 0.02, col: "steel", paint: true },
      ...([[-0.165, "stone2"], [-0.055, "steel2"], [0.055, "wood"], [0.165, "ice"]] as [number, string][]).flatMap(([x, c]): Shape[] => [
        { t: "ell", c: [x, 0.66, 0.12], r: [0.06, 0.055, 0.06], col: c, k: 0.02 },
        { t: "ell", c: [x, 0.55, 0.16], r: [0.055, 0.05, 0.045], col: c, k: 0.02 },
      ]),
      { t: "ell", c: [-0.055, 0.68, 0.18], r: [0.016, 0.016, 0.016], col: "rivet", k: 0.004 },
      { t: "cap", a: [-0.24, 0.48, 0.1], b: [0.04, 0.42, 0.2], r: [0.065, 0.055], col: "stone3", k: 0.03 },
      { t: "box", c: [0.165, 0.7, 0.16], s: [0.015, 0.03, 0.01], round: 0.006, col: "ice2", paint: true },
      ...([[-0.36, 0.84, 0.1, "stone"], [0.38, 0.86, 0.08, "steel2"], [-0.42, 0.5, 0.12, "wood"], [0.42, 0.46, 0.12, "ice"]] as [number, number, number, string][]).map(([x, y, z, c]): Shape => rock([x, y, z], [0.035, 0.03, 0.03], c, [30, 20, 40], 0)),
    ],
    eyes: [],
  },

  // Piel Cambiante: a raised open hand whose skin shifts from stone at the wrist to steel to ice at the fingertips.
  "piel-cambiante": {
    palette: { ...MAT, glint: "#ffffff" },
    glow: [],
    shapes: [
      { t: "cap", a: [0, 0.02, 0], b: [0, 0.4, 0], r: [0.11, 0.12], col: "stone", k: 0.03 },
      { t: "box", c: [0, 0.22, 0.1], s: [0.06, 0.04, 0.03], round: 0.02, col: "stone3", paint: true },
      { t: "box", c: [0, 0.54, 0], s: [0.16, 0.14, 0.07], round: 0.06, col: "steel", k: 0.05 },
      ...[-0.13, 0.13].map((x): Shape => ({ t: "box", c: [x * 0.6, 0.47, 0.07], s: [0.02, 0.06, 0.01], round: 0.008, col: "steel2", paint: true })),
      ...[0.5, 0.58].flatMap((y): Shape[] => [-0.08, 0.08].map((x): Shape => ({ t: "ell", c: [x, y, 0.07], r: [0.012, 0.012, 0.012], col: "rivet", k: 0.004 }))),
      ...([[-0.12, 0.66, -0.18, 0.86], [-0.04, 0.68, -0.05, 0.92], [0.04, 0.68, 0.06, 0.9], [0.12, 0.66, 0.16, 0.82]] as number[][]).flatMap(([x0, y0, x1, y1]): Shape[] => [
        { t: "cap", a: [x0, y0, 0], b: [(x0 + x1) / 2, (y0 + y1) / 2, 0.01], r: [0.04, 0.036], col: "steel", k: 0.03 },
        { t: "cap", a: [(x0 + x1) / 2, (y0 + y1) / 2, 0.01], b: [x1, y1, 0.02], r: [0.036, 0.03], col: "ice", k: 0.02 },
      ]),
      { t: "cap", a: [0.14, 0.5, 0.02], b: [0.26, 0.6, 0.06], r: [0.045, 0.04], col: "steel", k: 0.04 },
      { t: "cap", a: [0.26, 0.6, 0.06], b: [0.3, 0.7, 0.08], r: [0.04, 0.032], col: "ice", k: 0.02 },
      { t: "box", c: [0, 0.4, 0], s: [0.13, 0.02, 0.13], round: 0.02, col: "stone2", k: 0.02 },
      ...[[-0.18, 0.88], [-0.05, 0.94], [0.06, 0.92], [0.16, 0.84], [0.3, 0.72]].map(([x, y]): Shape => ({ t: "cap", a: [x, y - 0.02, 0.02], b: [x + 0.01, y + 0.06, 0.03], r: [0.018, 0.004], col: "ice2", k: 0.01 })),
      { t: "ell", c: [-0.04, 0.85, 0.05], r: [0.01, 0.03, 0.01], col: "glint", paint: true },
    ],
    eyes: [],
  },

  // Congelación: a burst of blue ice crystals erupting from frozen ground under a big snowflake.
  congelacion: {
    palette: { ...MAT, ice: "#5abcf2", ice2: "#9adcff", frost: "#bfe0f2", flake: "#c8f0ff", deep: "#3a8ad0" },
    glow: ["flake"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.46, 0.035, 0.3], col: "frost", k: 0.02 },
      ...([[0, 0.62, 0.1, 0], [-0.12, 0.46, 0.08, 0.04], [0.14, 0.44, 0.075, -0.02], [-0.24, 0.3, 0.065, 0.1], [0.26, 0.32, 0.065, 0.08], [0.06, 0.3, 0.055, 0.18]] as number[][]).map(([dx, h, r, z], i): Shape => {
        const ang = 90 - dx * 140;
        return { t: "cap", a: [dx * 0.4, 0.02, z], b: [dx * 0.4 + Math.cos(rad(ang)) * h, 0.02 + Math.sin(rad(ang)) * h, z], r: [r, 0.008], col: i % 2 ? "ice2" : "ice", k: 0.02 };
      }),
      ...[-0.04, 0.04].map((x): Shape => ({ t: "cap", a: [x, 0.08, 0.08], b: [x, 0.42, 0.08], r: [0.012, 0.005], col: "ice2", paint: true })),
      ...[0, 60, 120].flatMap((a): Shape[] => [
        { t: "cap", a: [-0.13 * Math.cos(rad(a)), 0.88 - 0.13 * Math.sin(rad(a)), 0], b: [0.13 * Math.cos(rad(a)), 0.88 + 0.13 * Math.sin(rad(a)), 0], r: [0.018, 0.018], col: "flake", k: 0.01 },
      ]),
      ...[0, 60, 120, 180, 240, 300].flatMap((a): Shape[] => {
        const cx = 0.08 * Math.cos(rad(a)), cy = 0.88 + 0.08 * Math.sin(rad(a));
        return [
          { t: "cap", a: [cx, cy, 0], b: [cx + 0.045 * Math.cos(rad(a + 40)), cy + 0.045 * Math.sin(rad(a + 40)), 0], r: [0.012, 0.01], col: "flake", k: 0.005 },
          { t: "cap", a: [cx, cy, 0], b: [cx + 0.045 * Math.cos(rad(a - 40)), cy + 0.045 * Math.sin(rad(a - 40)), 0], r: [0.012, 0.01], col: "flake", k: 0.005 },
        ];
      }),
      { t: "ell", c: [0, 0.88, 0], r: [0.03, 0.03, 0.02], col: "deep", k: 0.01 },
    ],
    eyes: [],
  },

  // Raíces Profundas: thick gnarled roots bursting up through cracked paving and arching back into the ground.
  "raices-profundas": {
    palette: { ...MAT, bark: "#7a4e2e", bark2: "#5a3620", slab: "#9a948a", slab2: "#7a746a", dirt: "#4a3424", leaf: "#5aa84a" },
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.48, 0.035, 0.32], col: "dirt", k: 0.02 },
      ...([[-0.32, 0.18, 12], [0.34, 0.16, -10], [-0.3, -0.2, -8], [0.32, -0.2, 14]] as number[][]).map(([x, z, r]): Shape => ({ t: "box", c: [x, 0.06, z], s: [0.13, 0.025, 0.1], round: 0.01, rot: [r, 20, r * 0.6], col: "slab", k: 0.01 })),
      ...line([[-0.4, 0.02, 0.04], [-0.3, 0.3, 0.06], [-0.12, 0.44, 0.04], [0.02, 0.36, 0.08], [0.1, 0.12, 0.1], [0.14, 0.02, 0.1]], 0.06, "bark", 0.04),
      ...line([[0.42, 0.02, -0.06], [0.34, 0.36, -0.08], [0.16, 0.6, -0.06], [-0.04, 0.62, -0.08], [-0.16, 0.5, -0.06]], 0.055, "bark2", 0.04),
      ...line([[-0.16, 0.5, -0.06], [-0.2, 0.36, -0.04], [-0.14, 0.24, -0.02]], 0.04, "bark2", 0.03),
      ...line([[0.0, 0.02, -0.2], [0.04, 0.3, -0.18], [0.2, 0.42, -0.12], [0.3, 0.34, -0.1]], 0.04, "bark", 0.03),
      ...line([[-0.3, 0.3, 0.06], [-0.4, 0.42, 0.08], [-0.42, 0.52, 0.1]], 0.025, "bark", 0.02),
      ...line([[0.16, 0.6, -0.06], [0.2, 0.74, -0.04], [0.28, 0.8, -0.02]], 0.025, "bark2", 0.02),
      { t: "ell", c: [0.3, 0.82, -0.02], r: [0.04, 0.02, 0.03], rot: [0, 0, 30], col: "leaf", k: 0.01 },
      { t: "ell", c: [-0.43, 0.55, 0.1], r: [0.035, 0.018, 0.03], rot: [0, 0, -30], col: "leaf", k: 0.01 },
      rock([-0.22, 0.08, 0.24], [0.05, 0.03, 0.04], "slab2", [20, 30, 10], 0),
      rock([0.26, 0.08, 0.22], [0.04, 0.03, 0.04], "slab2", [-10, 10, 20], 0),
    ],
    eyes: [],
  },

  // Avalancha: a cascade of boulders tumbling down a steep rocky slope, dust billowing.
  avalancha: {
    palette: { ...MAT, slope: "#7a7468", dust: "#d8c8a8", dust2: "#b8a888", line: "#f2e6c8", snow: "#f4f8ff" },
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.52, 0.035, 0.3], col: "stone2", k: 0.02 },
      { t: "cap", a: [-0.3, 0.0, -0.12], b: [-0.3, 0.86, -0.12], r: [0.38, 0.02], col: "slope", k: 0.04 },
      { t: "box", c: [0, -0.4, 0], s: [0.8, 0.4, 0.7], round: 0, col: "slope", cut: true, k: 0 },
      { t: "cap", a: [-0.3, 0.62, -0.12], b: [-0.3, 0.9, -0.12], r: [0.12, 0.0], col: "snow", paint: true },
      ...line([[-0.3, 0.7, 0.06], [-0.22, 0.52, 0.12], [-0.08, 0.36, 0.16]], 0.012, "stone3", 0, true),
      rock([-0.12, 0.58, 0.06], [0.07, 0.06, 0.06], "stone", [10, 20, 30], 0.0),
      rock([0.0, 0.42, 0.1], [0.09, 0.08, 0.08], "stone3", [30, 10, -20], 0.0),
      rock([0.18, 0.28, 0.12], [0.11, 0.1, 0.09], "stone", [-20, 40, 15], 0.0),
      rock([0.36, 0.14, 0.14], [0.1, 0.09, 0.09], "stone3", [10, -20, 40], 0.0),
      rock([0.2, 0.1, 0.26], [0.055, 0.05, 0.05], "stone", [40, 10, 10], 0.0),
      rock([0.08, 0.62, 0.02], [0.05, 0.045, 0.045], "stone2", [20, 20, 20], 0.0),
      { t: "ell", c: [0.42, 0.06, -0.06], r: [0.14, 0.08, 0.12], col: "dust", k: 0.08 },
      { t: "ell", c: [0.48, 0.2, -0.12], r: [0.1, 0.08, 0.1], col: "dust2", k: 0.08 },
      { t: "ell", c: [0.08, 0.06, 0.2], r: [0.12, 0.05, 0.08], col: "dust2", k: 0.08 },
      ...[[-0.04, 0.68], [0.12, 0.52], [0.3, 0.38]].map(([x, y]): Shape => ({ t: "cap", a: [x - 0.12, y + 0.1, 0.16], b: [x, y, 0.16], r: [0.004, 0.014], col: "line", k: 0 })),
    ],
    eyes: [],
  },

  // Bola de Demolición: a construction crane's steel wrecking ball on a chain swinging into a brick wall, bricks flying.
  "bola-demolicion": {
    palette: { ...MAT, jib: "#f2b632", jib2: "#c88a1e", ball: "#5e646e", ball2: "#9aa2ac", chain: "#8a929c", brick: "#b8563a", mortar: "#e8d2b0", dust: "#d8c8a8" },
    shapes: [
      { t: "box", c: [-0.2, 0.94, -0.08], s: [0.32, 0.045, 0.045], round: 0.015, rot: [0, 0, -6], col: "jib", k: 0.01 },
      ...[-0.42, -0.3, -0.18, -0.06, 0.06].map((x): Shape => ({ t: "box", c: [x, 0.925 - x * 0.1, -0.03], s: [0.008, 0.04, 0.01], round: 0.004, rot: [0, 0, 30], col: "jib2", paint: true })),
      { t: "box", c: [0.1, 0.88, -0.08], s: [0.045, 0.04, 0.05], round: 0.015, col: "jib2", k: 0.01 },
      ...Array.from({ length: 6 }, (_, i): Shape => {
        const t = i / 6, x = 0.1 - t * 0.2, y = 0.82 - t * 0.38;
        return { t: "tor", c: [x, y, -0.08], R: 0.034, r: 0.013, rot: i % 2 ? [90, 0, 27] : [0, 0, 117], col: "chain", k: 0 };
      }),
      { t: "box", c: [-0.11, 0.43, -0.08], s: [0.04, 0.025, 0.03], round: 0.012, rot: [0, 0, 27], col: "ball2", k: 0.01 },
      { t: "ell", c: [-0.16, 0.26, -0.08], r: [0.16, 0.16, 0.16], col: "ball", k: 0.03 },
      { t: "tor", c: [-0.16, 0.26, -0.08], R: 0.16, r: 0.012, rot: [0, 0, 27], col: "ball2", k: 0 },
      { t: "ell", c: [-0.22, 0.33, 0.04], r: [0.05, 0.04, 0.03], col: "ball2", paint: true },
      { t: "box", c: [0.26, 0.28, -0.12], s: [0.14, 0.28, 0.1], round: 0.01, col: "brick", k: 0.01 },
      { t: "ell", c: [0.1, 0.28, -0.08], r: [0.08, 0.14, 0.14], col: "brick", cut: true, k: 0.03 },
      ...[0.1, 0.22, 0.34, 0.46].map((y): Shape => ({ t: "box", c: [0.26, y, -0.02], s: [0.15, 0.006, 0.02], round: 0.003, col: "mortar", paint: true })),
      ...[0.1, 0.22, 0.34, 0.46].map((y, i): Shape => ({ t: "box", c: [0.24 + (i % 2 ? 0.07 : -0.03), y + 0.06, -0.02], s: [0.006, 0.055, 0.02], round: 0.003, col: "mortar", paint: true })),
      ...([[0.08, 0.5, 0.14, 20], [0.14, 0.12, 0.18, -30], [0.0, 0.58, 0.06, 40], [0.02, 0.08, 0.22, 10], [0.22, 0.64, 0.08, -15]] as number[][]).map(([x, y, z, r]): Shape => ({ t: "box", c: [x, y, z], s: [0.05, 0.025, 0.03], round: 0.006, rot: [r, r * 0.5, r], col: "brick", k: 0 })),
      { t: "ell", c: [0.14, 0.44, 0.06], r: [0.06, 0.05, 0.05], col: "dust", k: 0.04 },
      { t: "ell", c: [0.12, 0.16, 0.08], r: [0.07, 0.05, 0.05], col: "dust", k: 0.04 },
      { t: "ell", c: [0.3, 0.04, 0.1], r: [0.14, 0.04, 0.08], col: "dust", k: 0.04 },
    ],
    eyes: [],
  },

  // Barricada del Puente: a stone arch bridge blocked by a barricade of crossed timbers, steel drums and a girder.
  "barricada-puente": {
    palette: { ...MAT, water: "#3a8ac8", rail: "#5a5a62", drum: "#b5562a", drum2: "#8a3c1e", stripe: "#f2d23a" },
    shapes: [
      { t: "ell", c: [0, 0.02, 0], r: [0.5, 0.025, 0.3], col: "water", k: 0.02 },
      { t: "box", c: [0, 0.3, 0], s: [0.5, 0.04, 0.2], round: 0.02, col: "stone2", k: 0.01 },
      { t: "box", c: [0.0, 0.15, 0], s: [0.46, 0.14, 0.17], round: 0.02, col: "stone", k: 0.02 },
      { t: "cap", a: [0, 0.0, -0.3], b: [0, 0.0, 0.3], r: [0.22, 0.22], col: "water", cut: true, k: 0.01 },
      ...[-0.44, -0.22, 0, 0.22, 0.44].flatMap((x): Shape[] => [-0.18, 0.18].map((z): Shape => ({ t: "cap", a: [x, 0.33, z], b: [x, 0.44, z], r: [0.016, 0.016], col: "rail", k: 0.01 }))),
      ...[-0.18, 0.18].map((z): Shape => ({ t: "cap", a: [-0.46, 0.44, z], b: [0.46, 0.44, z], r: [0.014, 0.014], col: "rail", k: 0.01 })),
      ...turn([
        ...[-0.2, 0.2].map((z): Shape => ({ t: "box", c: [0.0, 0.56, z], s: [0.025, 0.25, 0.025], round: 0.01, col: "wood2", k: 0.01 })),
        ...[0.44, 0.58, 0.72].map((y, i): Shape => ({ t: "box", c: [0.035, y, 0], s: [0.025, 0.06, 0.27], round: 0.016, rot: [i === 1 ? 4 : -3, 0, 0], col: i % 2 ? "wood2" : "wood", k: 0.005 })),
        ...[0.44, 0.58, 0.72].flatMap((y): Shape[] => [-0.14, 0.0, 0.14].map((z): Shape => ({ t: "box", c: [0.06, y, z], s: [0.01, 0.065, 0.03], round: 0.003, rot: [35, 0, 0], col: "stripe", paint: true }))),
      ], -50),
      ...[[-0.3, 0.06], [0.3, -0.06]].flatMap(([x, z]): Shape[] => [
        { t: "cap", a: [x, 0.36, z], b: [x, 0.5, z], r: [0.06, 0.06], col: "drum", k: 0.01 },
        { t: "tor", c: [x, 0.43, z], R: 0.061, r: 0.01, col: "drum2", k: 0 },
      ]),

    ],
    eyes: [],
  },

  // Absorción Total: a dark ember-veined core pulling chunks of stone, steel, wood and ice into its spiral.
  "absorcion-total": {
    palette: { ...MAT, core: "#2a2430", vein: "#ff5a24", swirl: "#8a6ab0", swirl2: "#c8a8f0" },
    glow: ["vein", "swirl2"],
    shapes: [
      ...Array.from({ length: 24 }, (_, i): Shape => {
        const t0 = 0.4 + i * 0.36, t1 = 0.4 + (i + 1) * 0.36, r0 = 0.1 + i * 0.014, r1 = 0.1 + (i + 1) * 0.014;
        return { t: "cap", a: [r0 * Math.cos(t0), 0.5 + r0 * Math.sin(t0), -0.04], b: [r1 * Math.cos(t1), 0.5 + r1 * Math.sin(t1), -0.04], r: [0.03 - i * 0.0009, 0.03 - (i + 1) * 0.0009], col: i % 3 ? "swirl" : "swirl2", k: 0.01 };
      }),
      { t: "ell", c: [0, 0.5, 0], r: [0.13, 0.13, 0.13], col: "core", k: 0.02 },
      ...[20, 140, 260].map((a): Shape => ({ t: "cap", a: [0.04 * Math.cos(rad(a)), 0.5 + 0.04 * Math.sin(rad(a)), 0.12], b: [0.11 * Math.cos(rad(a + 30)), 0.5 + 0.11 * Math.sin(rad(a + 30)), 0.08], r: [0.014, 0.006], col: "vein", paint: true })),
      rock([0.34, 0.62, 0.06], [0.06, 0.05, 0.05], "stone", [20, 30, 10], 0),
      { t: "box", c: [-0.3, 0.74, 0.04], s: [0.07, 0.012, 0.05], round: 0.006, rot: [0, 20, 30], col: "steel", k: 0 },
      { t: "box", c: [-0.34, 0.3, 0.06], s: [0.08, 0.02, 0.025], round: 0.006, rot: [0, 0, -40], col: "wood", k: 0 },
      { t: "cap", a: [0.26, 0.22, 0.08], b: [0.34, 0.3, 0.08], r: [0.035, 0.006], col: "ice", k: 0 },
      rock([0.14, 0.84, 0.0], [0.04, 0.035, 0.035], "stone3", [10, 10, 40], 0),
      { t: "box", c: [0.06, 0.18, 0.1], s: [0.04, 0.012, 0.03], round: 0.005, rot: [0, 0, 20], col: "steel2", k: 0 },
      { t: "cap", a: [-0.16, 0.86, 0.04], b: [-0.12, 0.8, 0.04], r: [0.025, 0.006], col: "ice2", k: 0 },
    ],
    eyes: [],
  },

  // Derrumbe: a cracked building toppling sideways, its top floors breaking off, chunks falling into a dust cloud.
  derrumbe: {
    palette: { ...MAT, wall: "#c8b89a", wall2: "#a8987a", win: "#2a2e38", crack: "#3a2a24", dust: "#d8c8a8", dust2: "#b8a888" },
    shapes: [
      ...tiltZ([
        { t: "box", c: [0, 0.3, -0.04], s: [0.16, 0.28, 0.13], round: 0.015, col: "wall", k: 0.01 },
        ...[0.16, 0.32, 0.48].flatMap((y): Shape[] => [-0.07, 0.07].map((x): Shape => ({ t: "box", c: [x, y, 0.09], s: [0.035, 0.045, 0.01], round: 0.006, col: "win", paint: true }))),
        ...line([[-0.16, 0.42, 0.1], [-0.06, 0.38, 0.1], [0.02, 0.44, 0.1], [0.16, 0.4, 0.1]], 0.01, "crack", 0, true),
      ], -10, [0.1, 0.0]),
      ...tiltZ([
        { t: "box", c: [0.04, 0.72, -0.04], s: [0.16, 0.13, 0.13], round: 0.015, col: "wall2", k: 0.01 },
        ...[-0.07, 0.07].map((x): Shape => ({ t: "box", c: [0.04 + x, 0.72, 0.09], s: [0.035, 0.045, 0.01], round: 0.006, col: "win", paint: true })),
        { t: "box", c: [0.04, 0.86, -0.04], s: [0.17, 0.015, 0.14], round: 0.008, col: "stone2", k: 0.01 },
      ], -32, [0.2, 0.6]),
      ...([[0.36, 0.5, 0.06, 20], [0.42, 0.3, 0.1, -30], [0.3, 0.68, -0.02, 40], [-0.26, 0.4, 0.08, 10], [0.5, 0.14, 0.0, 15]] as number[][]).map(([x, y, z, r]): Shape => rock([x, y, z], [0.04, 0.035, 0.035], "wall2", [r, r, r], 0)),
      { t: "ell", c: [-0.14, 0.05, 0.1], r: [0.18, 0.08, 0.14], col: "dust", k: 0.08 },
      { t: "ell", c: [0.2, 0.06, 0.12], r: [0.18, 0.08, 0.14], col: "dust2", k: 0.08 },
      { t: "ell", c: [0.36, 0.1, -0.06], r: [0.12, 0.09, 0.1], col: "dust", k: 0.08 },
      { t: "ell", c: [-0.32, 0.1, -0.06], r: [0.1, 0.08, 0.1], col: "dust2", k: 0.08 },
    ],
    eyes: [],
  },
};
