import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, gear, rad, spike } from "./kit";

// Encounter cards for Mazagón (rust/steel brute), the bomb modular set, the Titan expert set,
// Vanguardia's nemesis set, the sonic villain (magenta/violet/cyan) and Nexo's AI swarm
// (gunmetal with red optics, cyan holograms). One iconic object or small scene each.

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

/** Euler rotation that points a torus axis (or any y-up shape) along direction d. */
function axisRot(d: V3): V3 {
  const l = Math.hypot(...d), x = d[0] / l, y = d[1] / l, z = d[2] / l;
  return [(Math.atan2(z, y) * 180) / Math.PI, 0, (-Math.asin(x) * 180) / Math.PI];
}

/** A little quad-rotor drone facing the camera, scale s (1 ≈ 0.2 wide). */
function drone(x: number, y: number, z: number, s: number): Shape[] {
  const m = (v: number) => Math.max(v, 0.016);
  return [
    { t: "cap", a: [x - 0.13 * s, y + 0.02 * s, z], b: [x + 0.13 * s, y + 0.02 * s, z], r: [m(0.014 * s), m(0.014 * s)], col: "hull", k: 0.01 },
    { t: "ell", c: [x - 0.14 * s, y + 0.045 * s, z], r: [0.07 * s, m(0.014 * s), 0.07 * s], col: "rotor", k: 0.01 },
    { t: "ell", c: [x + 0.14 * s, y + 0.045 * s, z], r: [0.07 * s, m(0.014 * s), 0.07 * s], col: "rotor", k: 0.01 },
    { t: "ell", c: [x, y, z], r: [0.09 * s, 0.06 * s, 0.085 * s], col: "hull", k: 0.02 },
    { t: "ell", c: [x, y + 0.04 * s, z], r: [0.055 * s, 0.035 * s, 0.05 * s], col: "dome", k: 0.02 },
    { t: "ell", c: [x, y - 0.005 * s, z + 0.08 * s], r: [0.04 * s, 0.035 * s, 0.03 * s], col: "eye", paint: true },
  ];
}

/** A musical note (head, stem, flag) of scale s. */
function note(x: number, y: number, z: number, s: number, col: string): Shape[] {
  return [
    { t: "ell", c: [x, y, z], r: [0.065 * s, 0.048 * s, 0.045 * s], rot: [0, 0, 25], col, k: 0.01 },
    { t: "cap", a: [x + 0.052 * s, y + 0.01 * s, z], b: [x + 0.052 * s, y + 0.24 * s, z], r: [0.02 * s, 0.02 * s], col, k: 0.01 },
    { t: "cap", a: [x + 0.052 * s, y + 0.24 * s, z], b: [x + 0.13 * s, y + 0.14 * s, z], r: [0.022 * s, 0.018 * s], col, k: 0.015 },
  ];
}

const flame = (a: V3, b: V3, r: number, col = "fire", k = 0.05): Shape => ({ t: "cap", a, b, r: [r, r * 0.12], col, k });

export const artEncuentros: Record<string, Sculpt> = {
  // ───────────────────────── Mazagón ─────────────────────────

  // Embestida a Toda Máquina: a horned iron ram-helmet charging forward, battering plate first, dust behind.
  embestida: {
    palette: { steel: "#8f9aa6", steel2: "#b8c2cc", rust: "#b5562a", horn: "#efe2c4", slit: "#1e1a1c", glare: "#ff4a2a", dust: "#d8b88a", dust2: "#b8946a", line: "#ffb04a" },
    glow: ["glare", "line"],
    shapes: [
      { t: "ell", c: [-0.34, 0.22, 0], r: [0.16, 0.14, 0.16], col: "dust", k: 0.1 },
      { t: "ell", c: [-0.52, 0.32, -0.06], r: [0.11, 0.1, 0.11], col: "dust2", k: 0.1 },
      { t: "ell", c: [-0.26, 0.08, 0.1], r: [0.12, 0.08, 0.12], col: "dust2", k: 0.1 },
      { t: "ell", c: [-0.5, 0.12, 0.08], r: [0.08, 0.07, 0.08], col: "dust", k: 0.1 },
      { t: "ell", c: [0, 0.46, 0], r: [0.25, 0.23, 0.21], col: "steel", k: 0.04 },
      { t: "box", c: [-0.02, 0.66, 0], s: [0.2, 0.035, 0.04], round: 0.03, rot: [0, 0, -8], col: "rust", k: 0.03 },
      { t: "tor", c: [-0.03, 0.28, 0], R: 0.19, r: 0.045, col: "rust", k: 0.03 },
      { t: "cap", a: [0.12, 0.42, 0], b: [0.3, 0.38, 0], r: [0.14, 0.11], col: "steel", k: 0.05 },
      { t: "box", c: [0.36, 0.38, 0], s: [0.05, 0.13, 0.14], round: 0.04, col: "rust", k: 0.03 },
      { t: "ell", c: [0.41, 0.47, 0.08], r: [0.02, 0.022, 0.022], col: "steel2", k: 0.01, mirror: true },
      { t: "ell", c: [0.41, 0.29, 0.08], r: [0.02, 0.022, 0.022], col: "steel2", k: 0.01, mirror: true },
      { t: "box", c: [0.2, 0.52, 0], s: [0.12, 0.028, 0.16], round: 0.02, col: "slit", paint: true },
      { t: "ell", c: [0.22, 0.52, 0.09], r: [0.05, 0.02, 0.04], col: "glare", paint: true, mirror: true },
      { t: "cap", a: [0.0, 0.6, 0.15], b: [0.16, 0.8, 0.3], r: [0.075, 0.05], col: "horn", mirror: true, k: 0.03 },
      { t: "cap", a: [0.16, 0.8, 0.3], b: [0.4, 0.8, 0.34], r: [0.05, 0.015], col: "horn", mirror: true, k: 0.02 },
      { t: "cap", a: [-0.24, 0.62, 0.24], b: [-0.6, 0.64, 0.24], r: [0.022, 0.006], col: "line", k: 0 },
      { t: "cap", a: [-0.28, 0.44, 0.28], b: [-0.62, 0.45, 0.28], r: [0.022, 0.006], col: "line", k: 0 },
      { t: "cap", a: [-0.3, 0.8, 0.0], b: [-0.56, 0.82, 0.0], r: [0.02, 0.006], col: "line", k: 0 },
    ],
    eyes: [],
  },

  // Puños Remachados: a heavy riveted iron gauntlet fist, raised, rivets on every knuckle.
  "punos-remachados": {
    palette: { iron: "#5d636c", steel: "#a2acb6", rust: "#b5562a", rust2: "#8a3c1e", rivet: "#e8d6a6", groove: "#2c2a2e", spark: "#ffb02e" },
    glow: ["spark"],
    shapes: [
      { t: "cap", a: [0.02, 0.03, -0.04], b: [0, 0.36, 0], r: [0.15, 0.16], col: "rust", k: 0.03 },
      { t: "tor", c: [0.01, 0.12, -0.02], R: 0.155, r: 0.035, col: "rust2", k: 0.02 },
      { t: "tor", c: [0, 0.3, 0], R: 0.165, r: 0.035, col: "rust2", k: 0.02 },
      ...[-60, -20, 20, 60].map((a): Shape => ({ t: "ell", c: [0.19 * Math.sin(rad(a)), 0.21, 0.19 * Math.cos(rad(a))], r: [0.025, 0.025, 0.025], col: "rivet", k: 0.01 })),
      { t: "box", c: [0, 0.56, 0.02], s: [0.23, 0.18, 0.17], round: 0.09, col: "iron", k: 0.05 },
      ...[-0.165, -0.055, 0.055, 0.165].flatMap((x): Shape[] => [
        { t: "ell", c: [x, 0.68, 0.14], r: [0.06, 0.055, 0.06], col: "steel", k: 0.02 },
        { t: "ell", c: [x, 0.69, 0.2], r: [0.022, 0.022, 0.02], col: "rivet", k: 0.005 },
      ]),
      ...[-0.11, 0, 0.11].map((x): Shape => ({ t: "box", c: [x, 0.52, 0.19], s: [0.008, 0.1, 0.04], round: 0.004, col: "groove", paint: true })),
      { t: "cap", a: [-0.22, 0.48, 0.12], b: [0.06, 0.42, 0.2], r: [0.065, 0.055], col: "iron", k: 0.03 },
      { t: "ell", c: [0.02, 0.43, 0.25], r: [0.02, 0.02, 0.02], col: "rivet", k: 0.005 },
      spike([0.0, 0.84, 0.1], 90, 0.14, [0.028, 0.006], "spark", 0),
      spike([-0.2, 0.8, 0.1], 125, 0.13, [0.026, 0.006], "spark", 0),
      spike([0.2, 0.8, 0.1], 55, 0.13, [0.026, 0.006], "spark", 0),
    ],
    eyes: [],
  },

  // Piel de Acero: overlapping riveted steel armour plates; a bullet ricochets off in a burst of sparks.
  "piel-acero": {
    palette: { hide: "#7a4a32", steel: "#9aa6b2", steel2: "#c4ced8", edge: "#5a6470", rivet: "#e8d6a6", spark: "#ffd23a", spark2: "#ff8a2a", lead: "#6a6a72" },
    glow: ["spark", "spark2"],
    shapes: [
      { t: "ell", c: [0, 0.5, -0.1], r: [0.34, 0.44, 0.1], col: "hide", k: 0.03 },
      { t: "box", c: [0, 0.78, -0.02], s: [0.27, 0.12, 0.08], round: 0.07, rot: [-12, 0, 0], col: "steel", k: 0.02 },
      { t: "box", c: [0, 0.56, 0.02], s: [0.31, 0.13, 0.09], round: 0.08, rot: [-12, 0, 0], col: "steel2", k: 0.02 },
      { t: "box", c: [0, 0.32, 0.06], s: [0.29, 0.13, 0.09], round: 0.08, rot: [-12, 0, 0], col: "steel", k: 0.02 },
      { t: "box", c: [0, 0.12, 0.08], s: [0.22, 0.08, 0.08], round: 0.06, rot: [-12, 0, 0], col: "steel2", k: 0.02 },
      ...[0.7, 0.47, 0.23].flatMap((y, i): Shape[] => [-0.2, 0, 0.2].map((x): Shape => ({ t: "ell", c: [x, y, 0.09 + i * 0.04], r: [0.024, 0.024, 0.024], col: "rivet", k: 0.008 }))),
      { t: "box", c: [0, 0.66, 0.08], s: [0.3, 0.01, 0.06], round: 0.005, col: "edge", paint: true },
      { t: "box", c: [0, 0.43, 0.12], s: [0.32, 0.01, 0.06], round: 0.005, col: "edge", paint: true },
      { t: "box", c: [0, 0.2, 0.15], s: [0.3, 0.01, 0.06], round: 0.005, col: "edge", paint: true },
      ...burst([0.1, 0.58, 0.18], 8, 15, 0.2, [0.035, 0.008], "spark", { len: 0.13, r: [0.03, 0.008], col: "spark2" }, 0.02),
      { t: "ell", c: [0.1, 0.58, 0.2], r: [0.06, 0.06, 0.03], col: "spark", k: 0.02 },
      { t: "ell", c: [0.38, 0.86, 0.2], r: [0.05, 0.035, 0.035], rot: [0, 0, 30], col: "lead", k: 0 },
      { t: "cap", a: [0.16, 0.66, 0.2], b: [0.34, 0.83, 0.2], r: [0.012, 0.012], col: "spark2", k: 0 },
    ],
    eyes: [],
  },

  // Arrollar: a giant boot print stamped into the pavement, cracks glowing, chunks flying.
  arrollar: {
    palette: { ground: "#9a8a76", top: "#c4b498", pit: "#3e2e26", tread: "#6a5444", crack: "#ff7a2a", rock: "#c8b89a", rock2: "#7a6a5a", dust: "#e6d6b4" },
    glow: ["crack"],
    shapes: tiltX([
      { t: "box", c: [0, 0.06, 0], s: [0.5, 0.07, 0.38], round: 0.05, col: "ground", k: 0.02 },
      { t: "box", c: [0, 0.11, 0], s: [0.49, 0.02, 0.37], round: 0.02, col: "top", paint: true },
      { t: "ell", c: [0.08, 0.15, 0], r: [0.2, 0.08, 0.14], col: "pit", cut: true, k: 0.015 },
      { t: "ell", c: [-0.25, 0.15, 0], r: [0.1, 0.08, 0.11], col: "pit", cut: true, k: 0.015 },
      { t: "ell", c: [0.08, 0.1, 0], r: [0.21, 0.07, 0.15], col: "pit", paint: true },
      { t: "ell", c: [-0.25, 0.1, 0], r: [0.11, 0.07, 0.12], col: "pit", paint: true },
      ...[-0.04, 0.06, 0.16].map((x): Shape => ({ t: "box", c: [x, 0.08, 0], s: [0.018, 0.04, 0.16], round: 0.008, col: "tread", paint: true })),
      ...[-0.28, -0.22].map((x): Shape => ({ t: "box", c: [x, 0.08, 0], s: [0.016, 0.04, 0.12], round: 0.008, col: "tread", paint: true })),
      ...[[0.28, 0.0, 0.46, 0.1], [0.24, 0.1, 0.44, 0.3], [0.1, 0.14, 0.18, 0.35], [-0.34, 0.06, -0.47, 0.22], [-0.34, -0.06, -0.47, -0.2], [0.14, -0.14, 0.26, -0.35], [-0.12, -0.1, -0.18, -0.35], [0.26, -0.1, 0.46, -0.22]]
        .map(([x0, z0, x1, z1]): Shape => ({ t: "cap", a: [x0, 0.12, z0], b: [x1, 0.12, z1], r: [0.024, 0.01], col: "crack", paint: true })),
      { t: "box", c: [0.36, 0.3, 0.2], s: [0.05, 0.04, 0.05], round: 0.012, rot: [20, 30, 15], col: "rock", k: 0 },
      { t: "box", c: [-0.36, 0.32, 0.18], s: [0.045, 0.04, 0.04], round: 0.012, rot: [-15, 10, 35], col: "rock2", k: 0 },
      { t: "box", c: [0.22, 0.4, -0.1], s: [0.04, 0.035, 0.04], round: 0.012, rot: [30, 0, -20], col: "rock", k: 0 },
      { t: "box", c: [-0.1, 0.44, -0.12], s: [0.035, 0.03, 0.035], round: 0.01, rot: [10, 40, 20], col: "rock2", k: 0 },
    ], 50, [0, 0.06, 0]),
    eyes: [],
  },

  // Caos en la Avenida: a car flipped on its roof and burning, a striped barricade and a cone on the road.
  "caos-avenida": {
    palette: { road: "#4a4a54", lane: "#ffd23a", car: "#2a7ad8", car2: "#1e5aa8", glass: "#bfe8ff", tire: "#22222a", hub: "#c8ccd4", bar: "#ff8a1f", white: "#f4f0e8", smoke: "#4a4450", smoke2: "#6a6470", fire: "#ff7a1f", hot: "#ffe066" },
    glow: ["fire", "hot"],
    shapes: [
      { t: "box", c: [0, 0.03, 0], s: [0.5, 0.03, 0.3], round: 0.02, col: "road", k: 0.02 },
      ...[-0.36, 0.3].map((x): Shape => ({ t: "box", c: [x, 0.06, 0.16], s: [0.08, 0.01, 0.02], round: 0.005, col: "lane", paint: true })),
      ...tiltZ([
        { t: "box", c: [-0.08, 0.2, 0], s: [0.28, 0.08, 0.13], round: 0.05, col: "car", k: 0.02 },
        { t: "box", c: [-0.12, 0.32, 0], s: [0.15, 0.07, 0.11], round: 0.05, col: "car2", k: 0.03 },
        { t: "box", c: [-0.12, 0.33, 0.1], s: [0.12, 0.045, 0.02], round: 0.02, col: "glass", paint: true },
        { t: "box", c: [-0.08, 0.2, 0.12], s: [0.27, 0.01, 0.02], round: 0.004, col: "white", paint: true },
        ...[-0.27, 0.11].flatMap((x): Shape[] => [
          { t: "cap", a: [x, 0.13, 0.08], b: [x, 0.13, 0.14], r: [0.065, 0.065], col: "tire", k: 0.01 },
          { t: "ell", c: [x, 0.13, 0.2], r: [0.03, 0.03, 0.01], col: "hub", k: 0 },
        ]),
      ], 18, [0.2, 0.06]),
      flame([0.18, 0.28, 0.04], [0.26, 0.56, 0.06], 0.08, "fire", 0.04),
      flame([0.22, 0.3, 0.08], [0.2, 0.46, 0.1], 0.05, "hot", 0.03),
      { t: "ell", c: [0.2, 0.68, -0.06], r: [0.1, 0.08, 0.09], col: "smoke", k: 0.06 },
      { t: "ell", c: [0.08, 0.8, -0.08], r: [0.08, 0.07, 0.08], col: "smoke2", k: 0.06 },
      { t: "cap", a: [0.26, 0.04, 0.2], b: [0.26, 0.17, 0.2], r: [0.016, 0.016], col: "white", k: 0.01 },
      { t: "cap", a: [0.46, 0.04, 0.12], b: [0.46, 0.17, 0.12], r: [0.016, 0.016], col: "white", k: 0.01 },
      { t: "box", c: [0.36, 0.17, 0.16], s: [0.13, 0.04, 0.02], round: 0.015, rot: [0, 20, 0], col: "bar", k: 0.01 },
      ...[-0.07, 0, 0.07].map((dx): Shape => ({ t: "box", c: [0.36 + dx, 0.17, 0.18], s: [0.016, 0.06, 0.04], round: 0.004, rot: [0, 20, 30], col: "white", paint: true })),
      { t: "cap", a: [-0.36, 0.05, 0.2], b: [-0.36, 0.24, 0.2], r: [0.055, 0.012], col: "bar", k: 0.01 },
      { t: "box", c: [-0.36, 0.04, 0.2], s: [0.065, 0.015, 0.065], round: 0.01, col: "bar", k: 0.01 },
      { t: "tor", c: [-0.36, 0.13, 0.2], R: 0.034, r: 0.012, col: "white", paint: true },
    ],
    eyes: [],
  },

  // Viejas Cuentas: an old gold pocket watch with a cracked glass, standing on an open ledger.
  "viejas-cuentas": {
    palette: { cover: "#6a3a24", paper: "#f3e2b8", ink: "#7a5a40", gold: "#e0a83a", gold2: "#b07a24", face: "#fbf2dc", hand: "#2a1e1a", crack: "#8a8a9a" },
    shapes: [
      { t: "box", c: [0, 0.025, 0], s: [0.4, 0.025, 0.26], round: 0.02, col: "cover", k: 0.02 },
      { t: "box", c: [-0.19, 0.06, 0], s: [0.19, 0.02, 0.24], round: 0.015, rot: [0, 0, 5], col: "paper", k: 0.01 },
      { t: "box", c: [0.19, 0.06, 0], s: [0.19, 0.02, 0.24], round: 0.015, rot: [0, 0, -5], col: "paper", k: 0.01 },
      ...[-0.15, -0.05, 0.05, 0.15].flatMap((z): Shape[] => [
        { t: "box", c: [-0.2, 0.08, z], s: [0.14, 0.03, 0.008], round: 0.003, col: "ink", paint: true },
        { t: "box", c: [0.22, 0.08, z], s: [0.12, 0.03, 0.008], round: 0.003, col: "ink", paint: true },
      ]),
      { t: "ell", c: [0, 0.4, 0], r: [0.26, 0.26, 0.08], col: "gold", k: 0.02 },
      { t: "tor", c: [0, 0.4, 0.05], R: 0.22, r: 0.035, rot: [90, 0, 0], col: "gold2", k: 0.01 },
      { t: "ell", c: [0, 0.4, 0.04], r: [0.21, 0.21, 0.05], col: "face", k: 0 },
      ...Array.from({ length: 12 }, (_, i): Shape => ({ t: "ell", c: [0.165 * Math.cos(rad(i * 30)), 0.4 + 0.165 * Math.sin(rad(i * 30)), 0.09], r: [0.016, 0.016, 0.03], col: "hand", paint: true })),
      { t: "cap", a: [0, 0.4, 0.09], b: [0.06, 0.5, 0.09], r: [0.016, 0.012], col: "hand", paint: true },
      { t: "cap", a: [0, 0.4, 0.09], b: [-0.1, 0.33, 0.09], r: [0.012, 0.009], col: "hand", paint: true },
      { t: "ell", c: [0, 0.4, 0.09], r: [0.022, 0.022, 0.03], col: "gold2", paint: true },
      ...line([[0.08, 0.6, 0.09], [0.12, 0.5, 0.09], [0.1, 0.44, 0.09], [0.15, 0.36, 0.09]], 0.007, "crack", 0, true),
      { t: "cap", a: [0, 0.66, 0], b: [0, 0.72, 0], r: [0.045, 0.045], col: "gold2", k: 0.02 },
      { t: "tor", c: [0, 0.8, 0], R: 0.065, r: 0.02, rot: [90, 0, 0], col: "gold", k: 0.01 },
      ...line([[0.05, 0.84, 0.0], [0.17, 0.86, 0.04], [0.28, 0.76, 0.08], [0.34, 0.56, 0.1], [0.34, 0.32, 0.12], [0.3, 0.12, 0.14]], 0.018, "gold2", 0.01),
    ],
    eyes: [],
  },

  // ───────────────────────── Amenaza de Bomba ─────────────────────────

  // Artefacto Explosivo: a bundle of dynamite strapped to a ticking digital timer, wires and all.
  "artefacto-explosivo": {
    palette: { stick: "#d42a2a", stick2: "#a81e22", cap: "#f2e0b8", tape: "#2a2a30", box: "#3a3e48", lcd: "#ff3a2a", lcd2: "#5a1010", wireR: "#ff4a3a", wireB: "#3a8aff", wireY: "#ffd23a", led: "#7aff4a" },
    glow: ["lcd", "led"],
    shapes: [
      ...[[-0.07, -0.1], [0.07, -0.1]].map(([x, z]): Shape => ({ t: "cap", a: [x, 0.08, z], b: [x, 0.62, z], r: [0.075, 0.075], col: "stick2", k: 0.01 })),
      ...[-0.15, 0, 0.15].map((x): Shape => ({ t: "cap", a: [x, 0.08, 0.02], b: [x, 0.62, 0.02], r: [0.075, 0.075], col: "stick", k: 0.01 })),
      ...[-0.15, 0, 0.15].map((x): Shape => ({ t: "ell", c: [x, 0.7, 0.02], r: [0.06, 0.012, 0.06], col: "cap", k: 0.01 })),
      { t: "box", c: [0, 0.18, -0.03], s: [0.24, 0.035, 0.15], round: 0.03, col: "tape", k: 0.01 },
      { t: "box", c: [0, 0.56, -0.03], s: [0.24, 0.035, 0.15], round: 0.03, col: "tape", k: 0.01 },
      { t: "box", c: [0, 0.37, 0.12], s: [0.17, 0.09, 0.04], round: 0.025, col: "box", k: 0.01 },
      { t: "box", c: [0, 0.37, 0.16], s: [0.14, 0.06, 0.01], round: 0.012, col: "lcd2", paint: true },
      ...[-0.09, -0.04, 0.04, 0.09].flatMap((x): Shape[] => [
        { t: "box", c: [x, 0.4, 0.17], s: [0.02, 0.006, 0.01], round: 0.003, col: "lcd", paint: true },
        { t: "box", c: [x, 0.34, 0.17], s: [0.02, 0.006, 0.01], round: 0.003, col: "lcd", paint: true },
        { t: "box", c: [x + 0.02, 0.37, 0.17], s: [0.006, 0.035, 0.01], round: 0.003, col: "lcd", paint: true },
      ]),
      { t: "ell", c: [0, 0.39, 0.17], r: [0.008, 0.008, 0.01], col: "lcd", paint: true },
      { t: "ell", c: [0, 0.35, 0.17], r: [0.008, 0.008, 0.01], col: "lcd", paint: true },
      { t: "ell", c: [0.13, 0.48, 0.13], r: [0.025, 0.025, 0.025], col: "led", k: 0.005 },
      ...line([[-0.12, 0.42, 0.15], [-0.24, 0.52, 0.16], [-0.2, 0.7, 0.1], [-0.15, 0.68, 0.04]], 0.016, "wireR"),
      ...line([[0.12, 0.42, 0.15], [0.25, 0.48, 0.16], [0.24, 0.66, 0.12], [0.15, 0.68, 0.06]], 0.016, "wireB"),
      ...line([[-0.06, 0.28, 0.15], [-0.12, 0.18, 0.18], [-0.04, 0.12, 0.12]], 0.014, "wireY"),
    ],
    eyes: [],
  },

  // Detonación: a blazing explosion burst — yellow core, orange fireball lobes, smoke and debris.
  detonacion: {
    palette: { fire: "#ff6a1f", fire2: "#ff9a2e", hot: "#ffd84a", core: "#fff6c8", smoke: "#5a5058", smoke2: "#7a6e72", debris: "#3a2a26" },
    glow: ["fire", "fire2", "hot", "core"],
    shapes: [
      { t: "ell", c: [-0.22, 0.1, 0], r: [0.16, 0.1, 0.16], col: "smoke", k: 0.08 },
      { t: "ell", c: [0.22, 0.1, 0.02], r: [0.16, 0.1, 0.16], col: "smoke2", k: 0.08 },
      { t: "ell", c: [0, 0.08, 0.12], r: [0.14, 0.08, 0.12], col: "smoke", k: 0.08 },
      ...burst([0, 0.5, 0], 12, 0, 0.46, [0.1, 0.02], "fire", { len: 0.34, r: [0.09, 0.02], col: "fire2" }, 0.05),
      ...[0, 60, 120, 180, 240, 300].map((a): Shape => ({ t: "ell", c: [0.24 * Math.cos(rad(a + 30)), 0.5 + 0.22 * Math.sin(rad(a + 30)), 0.02], r: [0.14, 0.13, 0.14], col: "fire2", k: 0.06 })),
      { t: "ell", c: [0, 0.5, 0], r: [0.26, 0.25, 0.24], col: "hot", k: 0.06 },
      { t: "ell", c: [0, 0.5, 0.18], r: [0.14, 0.13, 0.1], col: "core", paint: true },
      ...[[0.42, 0.86, 0.1, 20], [-0.44, 0.82, 0.06, -30], [0.5, 0.3, -0.04, 45], [-0.48, 0.34, 0.12, 10]].map(([x, y, z, r]): Shape => ({ t: "box", c: [x, y, z], s: [0.035, 0.03, 0.03], round: 0.01, rot: [r, r, r], col: "debris", k: 0 })),
    ],
    eyes: [],
  },

  // Falsa Alarma: a spinning red siren beacon in a wire cage, beams of light sweeping out.
  "falsa-alarma": {
    palette: { base: "#3a3e48", base2: "#5a606c", dome: "#ff2a2a", bulb: "#ffd0b0", cage: "#c8ccd4", beam: "#ff5a4a", beam2: "#ffb03a" },
    glow: ["dome", "bulb", "beam", "beam2"],
    shapes: [
      { t: "box", c: [0, 0.07, 0], s: [0.22, 0.07, 0.22], round: 0.04, col: "base", k: 0.02 },
      { t: "ell", c: [0, 0.16, 0], r: [0.2, 0.04, 0.2], col: "base2", k: 0.02 },
      { t: "ell", c: [0, 0.36, 0], r: [0.17, 0.22, 0.17], col: "dome", k: 0.02 },
      { t: "ell", c: [0.02, 0.36, 0.1], r: [0.07, 0.1, 0.07], col: "bulb", paint: true },
      { t: "tor", c: [0, 0.36, 0], R: 0.175, r: 0.016, col: "cage", k: 0 },
      { t: "tor", c: [0, 0.26, 0], R: 0.165, r: 0.016, col: "cage", k: 0 },
      { t: "tor", c: [0, 0.38, 0], R: 0.21, r: 0.016, rot: [0, 45, 90], col: "cage", k: 0 },
      { t: "tor", c: [0, 0.38, 0], R: 0.21, r: 0.016, rot: [0, -45, 90], col: "cage", k: 0 },
      { t: "ell", c: [0, 0.6, 0], r: [0.035, 0.03, 0.035], col: "cage", k: 0.01 },
      ...arc(0, 0.38, 0, 0.3, -35, 35, 4, 0.03, "beam"), ...arc(0, 0.38, 0, 0.3, 145, 215, 4, 0.03, "beam"),
      ...arc(0, 0.38, 0, 0.42, -30, 30, 4, 0.025, "beam2"), ...arc(0, 0.38, 0, 0.42, 150, 210, 4, 0.025, "beam2"),
      ...arc(0, 0.38, 0, 0.3, 60, 120, 3, 0.03, "beam"),
      ...arc(0, 0.38, 0, 0.42, 65, 115, 3, 0.025, "beam2"),
    ],
    eyes: [],
  },

  // ───────────────────────── Experto del Titán ─────────────────────────

  // Carga Brutal: a bull's horned head bursting through a brick wall, bricks flying.
  "carga-brutal": {
    palette: { brick: "#b8563a", brick2: "#8a3a26", mortar: "#e8d2b0", hide: "#5a3424", snout: "#c88a6a", horn: "#f2e6c8", tip: "#3a2a24", nos: "#2a1410", spark: "#ffb02e" },
    glow: ["spark"],
    shapes: [
      { t: "box", c: [0, 0.42, -0.12], s: [0.44, 0.4, 0.07], round: 0.02, col: "brick", k: 0.01 },
      { t: "ell", c: [0.02, 0.44, -0.12], r: [0.22, 0.2, 0.2], col: "brick2", cut: true, k: 0.02 },
      ...[0.12, 0.26, 0.4, 0.54, 0.68].map((y): Shape => ({ t: "box", c: [0, y, -0.05], s: [0.45, 0.007, 0.02], round: 0.003, col: "mortar", paint: true })),
      ...[[-0.3, 0.06], [0.22, 0.06], [-0.15, 0.19], [0.36, 0.19], [-0.32, 0.33], [0.3, 0.47], [-0.36, 0.61], [0.12, 0.75], [-0.2, 0.75]].map(([x, y]): Shape => ({ t: "box", c: [x, y, -0.05], s: [0.007, 0.06, 0.02], round: 0.003, col: "mortar", paint: true })),
      { t: "ell", c: [0.02, 0.46, -0.06], r: [0.17, 0.15, 0.15], col: "hide", k: 0.04 },
      { t: "ell", c: [0.02, 0.36, 0.08], r: [0.12, 0.09, 0.09], col: "snout", k: 0.05 },
      { t: "ell", c: [-0.04, 0.35, 0.16], r: [0.02, 0.025, 0.02], col: "nos", paint: true },
      { t: "ell", c: [0.08, 0.35, 0.16], r: [0.02, 0.025, 0.02], col: "nos", paint: true },
      { t: "cap", a: [0.12, 0.54, 0.0], b: [0.34, 0.6, 0.12], r: [0.065, 0.045], col: "horn", k: 0.03 },
      { t: "cap", a: [0.34, 0.6, 0.12], b: [0.42, 0.8, 0.2], r: [0.045, 0.014], col: "horn", k: 0.02 },
      { t: "cap", a: [-0.08, 0.54, 0.0], b: [-0.3, 0.6, 0.12], r: [0.065, 0.045], col: "horn", k: 0.03 },
      { t: "cap", a: [-0.3, 0.6, 0.12], b: [-0.38, 0.8, 0.2], r: [0.045, 0.014], col: "horn", k: 0.02 },
      { t: "ell", c: [0.41, 0.76, 0.19], r: [0.03, 0.05, 0.03], col: "tip", paint: true },
      { t: "ell", c: [-0.37, 0.76, 0.19], r: [0.03, 0.05, 0.03], col: "tip", paint: true },
      ...[[0.32, 0.24, 0.2, 20], [-0.3, 0.2, 0.24, -25], [0.4, 0.42, 0.26, 40], [-0.4, 0.46, 0.2, 10], [0.16, 0.12, 0.3, -10]].map(([x, y, z, r]): Shape => ({ t: "box", c: [x, y, z], s: [0.06, 0.03, 0.035], round: 0.008, rot: [r, r * 0.5, r], col: "brick", k: 0 })),
      spike([0.24, 0.3, 0.12], -20, 0.14, [0.022, 0.006], "spark", 0),
      spike([-0.2, 0.28, 0.12], 200, 0.14, [0.022, 0.006], "spark", 0),
    ],
    eyes: [
      { at: [0.09, 0.5, 0.06], r: 0.04, iris: "#ff3a1a", angry: true, look: [0.2, 0, 1] },
      { at: [-0.05, 0.5, 0.06], r: 0.04, iris: "#ff3a1a", angry: true, look: [0.2, 0, 1] },
    ],
  },

  // Bramido: Mazagón's horned iron head roaring, a cone of shockwave rings blasting forward.
  bramido: {
    palette: { steel: "#8f9aa6", rust: "#b5562a", horn: "#efe2c4", mouth: "#2a0e0e", tooth: "#fff2dc", wave: "#ff9a3a", wave2: "#ffd23a", wave3: "#ffe8a0" },
    glow: ["wave", "wave2", "wave3"],
    shapes: [
      { t: "ell", c: [-0.3, 0.46, 0], r: [0.19, 0.19, 0.18], col: "steel", k: 0.04 },
      { t: "cap", a: [-0.24, 0.52, 0], b: [-0.1, 0.52, 0], r: [0.12, 0.09], col: "steel", k: 0.05 },
      { t: "cap", a: [-0.24, 0.36, 0], b: [-0.08, 0.3, 0], r: [0.1, 0.07], col: "rust", k: 0.04 },
      { t: "ell", c: [-0.08, 0.42, 0], r: [0.09, 0.07, 0.09], col: "mouth", cut: true, k: 0.02 },
      { t: "ell", c: [-0.12, 0.42, 0], r: [0.08, 0.06, 0.08], col: "mouth", paint: true },
      ...[-0.05, 0.05].map((z): Shape => ({ t: "cap", a: [-0.06, 0.47, z], b: [-0.05, 0.43, z], r: [0.016, 0.006], col: "tooth", k: 0.005 })),
      ...[-0.05, 0.05].map((z): Shape => ({ t: "cap", a: [-0.06, 0.36, z], b: [-0.05, 0.4, z], r: [0.016, 0.006], col: "tooth", k: 0.005 })),
      { t: "cap", a: [-0.32, 0.6, 0.12], b: [-0.2, 0.78, 0.26], r: [0.06, 0.04], col: "horn", mirror: true, k: 0.03 },
      { t: "cap", a: [-0.2, 0.78, 0.26], b: [-0.02, 0.8, 0.3], r: [0.04, 0.012], col: "horn", mirror: true, k: 0.02 },
      { t: "tor", c: [0.06, 0.42, 0], R: 0.13, r: 0.03, rot: [0, 0, 90], col: "wave2", k: 0 },
      { t: "tor", c: [0.22, 0.42, 0], R: 0.2, r: 0.027, rot: [0, 0, 90], col: "wave", k: 0 },
      { t: "tor", c: [0.38, 0.42, 0], R: 0.27, r: 0.024, rot: [0, 0, 90], col: "wave2", k: 0 },
      { t: "tor", c: [0.52, 0.42, 0], R: 0.34, r: 0.02, rot: [0, 0, 90], col: "wave3", k: 0 },
    ],
    eyes: [{ at: [-0.17, 0.56, 0.08], r: 0.04, iris: "#ff4a1a", mirror: true, angry: true, look: [0.8, 0, 0.6] }],
  },

  // ───────────────────────── Némesis de Vanguardia ─────────────────────────

  // OPA Hostil: a stock-chart board with the red trend arrow crashing down and out through its frame.
  "opa-hostil": {
    palette: { board: "#f4f6fa", frame: "#3a3e4a", grid: "#b8c8e0", up: "#3ab86a", arrow: "#e02a2a", coin: "#f2b632", coin2: "#c08a1e", leg: "#5a4a40" },
    glow: [],
    shapes: [
      { t: "cap", a: [-0.24, 0.3, -0.1], b: [-0.32, 0.0, 0.04], r: [0.02, 0.02], col: "leg", k: 0.01 },
      { t: "cap", a: [0.24, 0.3, -0.1], b: [0.32, 0.0, 0.04], r: [0.02, 0.02], col: "leg", k: 0.01 },
      { t: "cap", a: [0, 0.4, -0.1], b: [0, 0.0, -0.3], r: [0.02, 0.02], col: "leg", k: 0.01 },
      { t: "box", c: [0, 0.56, -0.1], s: [0.38, 0.32, 0.025], round: 0.02, col: "frame", k: 0.01 },
      { t: "box", c: [0, 0.56, -0.08], s: [0.34, 0.28, 0.02], round: 0.015, col: "board", k: 0 },
      ...[-0.22, -0.11, 0, 0.11, 0.22].map((x): Shape => ({ t: "box", c: [x, 0.56, -0.06], s: [0.004, 0.27, 0.01], round: 0.002, col: "grid", paint: true })),
      ...[0.38, 0.5, 0.62, 0.74].map((y): Shape => ({ t: "box", c: [0, y, -0.06], s: [0.33, 0.004, 0.01], round: 0.002, col: "grid", paint: true })),
      ...line([[-0.3, 0.38, -0.04], [-0.2, 0.52, -0.04], [-0.12, 0.46, -0.04], [-0.02, 0.72, -0.04]], 0.022, "up", 0.01),
      ...line([[-0.02, 0.72, -0.02], [0.08, 0.6, 0.02], [0.14, 0.66, 0.04], [0.36, 0.2, 0.1]], 0.035, "arrow", 0.015),
      { t: "cap", a: [0.31, 0.3, 0.09], b: [0.42, 0.06, 0.12], r: [0.1, 0.01], col: "arrow", k: 0.02 },
      ...[[-0.26, 0.04, 0.2], [-0.12, 0.03, 0.26], [0.1, 0.03, 0.24]].map(([x, y, z]): Shape => ({ t: "ell", c: [x, y + 0.01, z], r: [0.065, 0.022, 0.065], col: "coin", k: 0.01 })),
      { t: "ell", c: [-0.2, 0.07, 0.2], r: [0.065, 0.022, 0.065], col: "coin2", k: 0.01 },
    ],
    eyes: [],
  },

  // Sabotaje Industrial: two meshing gears jammed by a wrench wedged in their teeth, sparks and smoke.
  "sabotaje-industrial": {
    palette: { steel: "#8a96a4", hub: "#4a525e", gear2: "#c8873a", hub2: "#7a4e22", wrench: "#d0d6de", grip: "#d8402a", spark: "#ffd23a", spark2: "#ff7a2a", smoke: "#6a6470" },
    glow: ["spark", "spark2"],
    shapes: [
      ...gear(-0.1, 0.52, 0.3, 10, "steel", "hub", 0, 9),
      ...gear(0.3, 0.2, 0.17, 8, "gear2", "hub2", 0, 0),
      { t: "ell", c: [-0.1, 0.92, -0.06], r: [0.09, 0.07, 0.08], col: "smoke", k: 0.06 },
      { t: "ell", c: [0.02, 1.0, -0.08], r: [0.07, 0.06, 0.07], col: "smoke", k: 0.06 },
      { t: "cap", a: [0.15, 0.33, 0.1], b: [0.42, 0.78, 0.1], r: [0.035, 0.04], col: "wrench", k: 0.01 },
      { t: "cap", a: [0.32, 0.61, 0.1], b: [0.42, 0.78, 0.1], r: [0.045, 0.05], col: "grip", k: 0.01 },
      { t: "ell", c: [0.13, 0.3, 0.1], r: [0.11, 0.11, 0.04], col: "wrench", k: 0.02 },
      { t: "box", c: [0.07, 0.24, 0.1], s: [0.06, 0.04, 0.08], round: 0.01, rot: [0, 0, 45], col: "wrench", cut: true, k: 0.005 },
      ...burst([0.14, 0.3, 0.16], 7, 10, 0.16, [0.028, 0.006], "spark", { len: 0.1, r: [0.024, 0.006], col: "spark2" }, 0),
    ],
    eyes: [],
  },

  // Junta de Accionistas: a polished boardroom table with high-backed chairs and a big gavel.
  "junta-accionistas": {
    palette: { wood: "#7a3e22", wood2: "#5a2a16", top: "#a8582e", chair: "#2a2a34", boss: "#a82a2a", gavel: "#4a2414", gold: "#f2b632", paper: "#f4f0e4", glass: "#9ad8f0" },
    shapes: [
      ...[-0.3, 0.3].flatMap((x): Shape[] => [-0.12, 0.12].map((z): Shape => ({ t: "box", c: [x, 0.14, z], s: [0.03, 0.14, 0.03], round: 0.01, col: "wood2", k: 0.01 }))),
      { t: "box", c: [0, 0.3, 0], s: [0.42, 0.03, 0.18], round: 0.025, col: "top", k: 0.01 },
      { t: "box", c: [0, 0.27, 0], s: [0.43, 0.012, 0.19], round: 0.01, col: "wood", paint: true },
      ...[-0.24, 0, 0.24].flatMap((x): Shape[] => [
        { t: "box", c: [x, 0.5, -0.27], s: [0.08, 0.2, 0.025], round: 0.025, col: "chair", k: 0.01 },
        { t: "box", c: [x, 0.36, -0.24], s: [0.08, 0.02, 0.05], round: 0.015, col: "chair", k: 0.01 },
      ]),
      { t: "box", c: [-0.56, 0.48, 0], s: [0.03, 0.3, 0.12], round: 0.03, col: "boss", k: 0.01 },
      { t: "box", c: [-0.5, 0.24, 0], s: [0.08, 0.03, 0.12], round: 0.02, col: "boss", k: 0.02 },
      { t: "cap", a: [-0.5, 0.0, 0], b: [-0.5, 0.22, 0], r: [0.025, 0.025], col: "chair", k: 0.01 },
      { t: "box", c: [-0.2, 0.34, 0.06], s: [0.06, 0.006, 0.08], round: 0.003, rot: [0, 15, 0], col: "paper", k: 0 },
      { t: "box", c: [0.04, 0.34, -0.08], s: [0.06, 0.006, 0.08], round: 0.003, rot: [0, -10, 0], col: "paper", k: 0 },
      { t: "cap", a: [-0.32, 0.33, -0.1], b: [-0.32, 0.42, -0.1], r: [0.025, 0.03], col: "glass", k: 0.01 },
      { t: "ell", c: [0.2, 0.35, 0.06], r: [0.07, 0.025, 0.07], col: "gavel", k: 0.01 },
      { t: "cap", a: [0.12, 0.48, 0.06], b: [0.32, 0.48, 0.06], r: [0.065, 0.065], col: "gavel", k: 0.01 },
      { t: "tor", c: [0.15, 0.48, 0.06], R: 0.066, r: 0.012, rot: [0, 0, 90], col: "gold", k: 0 },
      { t: "tor", c: [0.29, 0.48, 0.06], R: 0.066, r: 0.012, rot: [0, 0, 90], col: "gold", k: 0 },
      { t: "cap", a: [0.22, 0.48, 0.06], b: [0.3, 0.68, 0.24], r: [0.025, 0.03], col: "gavel", k: 0.01 },
    ],
    eyes: [],
  },

  // ───────────────────────── Villano sónico ─────────────────────────

  // Estallido Sónico: concentric shock rings bursting from a white-hot point, jagged sparks between.
  "estallido-sonico": {
    palette: { core: "#fff4ff", wave: "#ff4fd8", wave2: "#b04aff", wave3: "#4adcff", spark: "#ffe14a" },
    glow: ["core", "wave", "wave2", "wave3", "spark"],
    shapes: [
      { t: "ell", c: [0, 0.5, 0], r: [0.08, 0.08, 0.08], col: "core", k: 0.02 },
      { t: "tor", c: [0, 0.5, 0], R: 0.15, r: 0.035, rot: [90, 0, 0], col: "wave", k: 0 },
      { t: "tor", c: [0, 0.5, -0.02], R: 0.27, r: 0.032, rot: [90, 0, 0], col: "wave2", k: 0 },
      { t: "tor", c: [0, 0.5, -0.04], R: 0.39, r: 0.028, rot: [90, 0, 0], col: "wave3", k: 0 },
      { t: "tor", c: [0, 0.5, -0.06], R: 0.49, r: 0.022, rot: [90, 0, 0], col: "wave", k: 0 },
      ...[20, 110, 200, 290].map((a): Shape => spike([0.18 * Math.cos(rad(a)), 0.5 + 0.18 * Math.sin(rad(a)), 0.02], a, 0.09, [0.026, 0.006], "spark", 0)),
      ...[65, 155, 245, 335].map((a): Shape => spike([0.3 * Math.cos(rad(a)), 0.5 + 0.3 * Math.sin(rad(a)), 0.0], a, 0.08, [0.024, 0.006], "spark", 0)),
    ],
    eyes: [],
  },

  // Manipulación Sonora: a hypnotic spiral of sound ribbon with musical notes caught in its swirl.
  "manipulacion-sonora": {
    palette: { band: "#b04aff", band2: "#ff4fd8", core: "#ffe6ff", n1: "#4adcff", n2: "#ffe14a", n3: "#7aff9a" },
    glow: ["band2", "core"],
    shapes: [
      { t: "ell", c: [0, 0.5, 0], r: [0.06, 0.06, 0.06], col: "core", k: 0.02 },
      ...Array.from({ length: 26 }, (_, i): Shape => {
        const t0 = i * 0.42, t1 = (i + 1) * 0.42, r0 = 0.05 + t0 * 0.03, r1 = 0.05 + t1 * 0.03;
        return { t: "cap", a: [r0 * Math.cos(t0), 0.5 + r0 * Math.sin(t0), -0.01 * i], b: [r1 * Math.cos(t1), 0.5 + r1 * Math.sin(t1), -0.01 * (i + 1)], r: [0.022 + i * 0.0008, 0.022 + (i + 1) * 0.0008], col: i % 2 ? "band" : "band2", k: 0.015 };
      }),
      ...note(0.24, 0.72, 0.12, 1, "n1"),
      ...note(-0.36, 0.54, 0.1, 0.9, "n2"),
      ...note(0.2, 0.18, 0.14, 0.85, "n3"),
      ...note(-0.12, 0.84, 0.06, 0.7, "n2"),
    ],
    eyes: [],
  },

  // Cañón Sónico: a brass-ringed sound cannon horn on a wrist mount, firing rings of sound.
  "canon-sonico": {
    palette: { metal: "#5a4a7a", metal2: "#7a68a8", brass: "#f2b632", inner: "#1e1430", strap: "#2a2234", wave: "#ff4fd8", wave2: "#4adcff", lens: "#ff4fd8" },
    glow: ["wave", "wave2", "lens"],
    shapes: (() => {
      const d: V3 = [0.85, 0.28, 0.42];
      const l = Math.hypot(...d), u: V3 = [d[0] / l, d[1] / l, d[2] / l];
      const base: V3 = [-0.2, 0.36, -0.18];
      const at = (s: number): V3 => [base[0] + u[0] * s, base[1] + u[1] * s, base[2] + u[2] * s];
      const rot = axisRot(u);
      return [
        { t: "box", c: [-0.26, 0.24, -0.2], s: [0.16, 0.12, 0.13], round: 0.07, col: "strap", k: 0.03 },
        { t: "tor", c: [-0.26, 0.24, -0.2], R: 0.14, r: 0.03, rot: [0, 0, 90], col: "metal2", k: 0.02 },
        { t: "cap", a: at(-0.12), b: at(0.5), r: [0.08, 0.22], col: "metal", k: 0.03 },
        { t: "ell", c: at(0.56), r: [0.19, 0.19, 0.19], col: "inner", cut: true, k: 0.02 },
        { t: "ell", c: at(0.5), r: [0.21, 0.21, 0.21], col: "inner", paint: true },
        { t: "tor", c: at(0.48), R: 0.2, r: 0.03, rot, col: "brass", k: 0.01 },
        { t: "tor", c: at(0.1), R: 0.11, r: 0.022, rot, col: "brass", k: 0.01 },
        { t: "tor", c: at(0.26), R: 0.15, r: 0.022, rot, col: "brass", k: 0.01 },
        { t: "ell", c: at(0.36), r: [0.05, 0.05, 0.05], col: "inner", paint: true },
        { t: "tor", c: at(0.68), R: 0.25, r: 0.022, rot, col: "wave", k: 0 },
        { t: "tor", c: at(0.84), R: 0.3, r: 0.018, rot, col: "wave2", k: 0 },
      ];
    })(),
    eyes: [],
  },

  // Inmortalidad Sónica: a glowing resonance crystal floating over a stone pedestal, haloed by sound rings.
  "inmortalidad-sonica": {
    palette: { stone: "#8a80a0", stone2: "#6a5f82", crystal: "#7ae8ff", crystal2: "#c8f6ff", ring: "#ff4fd8", ring2: "#b04aff", spark: "#fff4ff" },
    glow: ["crystal", "crystal2", "ring", "ring2", "spark"],
    shapes: [
      { t: "box", c: [0, 0.04, 0], s: [0.24, 0.04, 0.24], round: 0.02, col: "stone2", k: 0.02 },
      { t: "cap", a: [0, 0.06, 0], b: [0, 0.26, 0], r: [0.15, 0.12], col: "stone", k: 0.03 },
      { t: "box", c: [0, 0.28, 0], s: [0.19, 0.035, 0.19], round: 0.02, col: "stone2", k: 0.02 },
      { t: "cap", a: [0, 0.38, 0], b: [0, 0.62, 0], r: [0.025, 0.15], col: "crystal", k: 0.0 },
      { t: "cap", a: [0, 0.62, 0], b: [0, 0.98, 0], r: [0.15, 0.025], col: "crystal", k: 0.02 },
      { t: "box", c: [0.05, 0.66, 0.1], s: [0.035, 0.14, 0.05], round: 0.02, rot: [0, 0, 6], col: "crystal2", paint: true },
      { t: "tor", c: [0, 0.64, 0], R: 0.3, r: 0.022, rot: [18, 0, 14], col: "ring", k: 0 },
      { t: "tor", c: [0, 0.64, 0], R: 0.36, r: 0.018, rot: [-16, 0, -18], col: "ring2", k: 0 },
      { t: "ell", c: [0.3, 0.92, 0.1], r: [0.025, 0.025, 0.025], col: "spark", k: 0 },
      { t: "ell", c: [-0.32, 0.4, 0.1], r: [0.02, 0.02, 0.02], col: "spark", k: 0 },
      { t: "ell", c: [-0.22, 0.98, -0.05], r: [0.02, 0.02, 0.02], col: "spark", k: 0 },
    ],
    eyes: [],
  },

  // Red de Defensa Sónica: three lattice radio towers on a rise, broadcasting arcs of sound.
  "red-defensa-sonica": {
    palette: { ground: "#5a5470", steel: "#c8c4d8", steel2: "#8a84a0", tip: "#ff4fd8", wave: "#ff4fd8", wave2: "#4adcff" },
    glow: ["tip", "wave", "wave2"],
    shapes: (() => {
      const tower = (x: number, z: number, h: number, w: number): Shape[] => {
        const out: Shape[] = [];
        for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) out.push({ t: "cap", a: [x + dx * w, 0.06, z + dz * w], b: [x + dx * 0.02, h, z + dz * 0.02], r: [0.02, 0.016], col: "steel", k: 0.01 });
        for (let i = 1; i <= 3; i++) {
          const y = 0.06 + (h - 0.06) * i * 0.24, ww = w * (1 - i * 0.24);
          out.push({ t: "box", c: [x, y, z], s: [ww, 0.012, ww], round: 0.008, col: "steel2", k: 0.005 });
        }
        out.push({ t: "ell", c: [x, h + 0.03, z], r: [0.045, 0.045, 0.045], col: "tip", k: 0.01 });
        return out;
      };
      return [
        { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.06, 0.3], col: "ground", k: 0.02 },
        ...tower(0, 0, 0.78, 0.11),
        ...tower(-0.32, -0.06, 0.48, 0.08),
        ...tower(0.32, -0.06, 0.48, 0.08),
        ...arc(0, 0.81, 0, 0.12, -40, 40, 3, 0.02, "wave"), ...arc(0, 0.81, 0, 0.12, 140, 220, 3, 0.02, "wave"),
        ...arc(0, 0.81, 0, 0.22, -45, 45, 4, 0.02, "wave2"), ...arc(0, 0.81, 0, 0.22, 135, 225, 4, 0.02, "wave2"),
        ...arc(-0.32, 0.51, -0.06, 0.1, 120, 230, 3, 0.018, "wave"),
        ...arc(0.32, 0.51, -0.06, 0.1, -50, 60, 3, 0.018, "wave"),
        ...arc(0, 0.81, 0, 0.12, 50, 130, 3, 0.02, "wave"),
      ];
    })(),
    eyes: [],
  },

  // Eco Persistente: a small sound source sending out a train of arcs that fade as they echo away.
  "eco-persistente": {
    palette: { src: "#ff4fd8", e1: "#ff4fd8", e2: "#d06af0", e3: "#a88ae8", e4: "#c8bce8", e5: "#e4ddf2", rock: "#5a5470" },
    glow: ["src", "e1", "e2"],
    shapes: [
      { t: "ell", c: [-0.4, 0.06, 0], r: [0.12, 0.06, 0.12], col: "rock", k: 0.03 },
      { t: "ell", c: [-0.4, 0.2, 0], r: [0.07, 0.07, 0.07], col: "src", k: 0.04 },
      ...arc(-0.4, 0.2, 0, 0.16, -40, 70, 4, 0.04, "e1", 0.036),
      ...arc(-0.4, 0.2, 0, 0.32, -30, 65, 5, 0.034, "e2", 0.03),
      ...arc(-0.4, 0.2, 0, 0.48, -22, 60, 6, 0.028, "e3", 0.024),
      ...arc(-0.4, 0.2, 0, 0.64, -16, 56, 7, 0.022, "e4", 0.019),
      ...arc(-0.4, 0.2, 0, 0.8, -12, 52, 8, 0.018, "e5", 0.016),
    ],
    eyes: [],
  },

  // Golpe Coordinado: two villains' gauntleted fists bumping together with an impact flash.
  "golpe-coordinado": {
    palette: { sleeveA: "#5a3a8a", gloveA: "#b04aff", sleeveB: "#1e6a7a", gloveB: "#3ad0e0", cuff: "#2a2234", hot: "#ffe14a", hot2: "#ff8a2a" },
    glow: ["hot", "hot2"],
    shapes: [
      ...burst([0, 0.62, -0.06], 10, 90, 0.3, [0.06, 0.012], "hot", { len: 0.2, r: [0.05, 0.012], col: "hot2" }, 0.03),
      ...([[-1, "sleeveA", "gloveA"], [1, "sleeveB", "gloveB"]] as const).flatMap(([s, sl, gl]): Shape[] => [
        { t: "cap", a: [s * 0.52, 0.06, 0], b: [s * 0.22, 0.44, 0.04], r: [0.09, 0.095], col: sl, k: 0.03 },
        { t: "tor", c: [s * 0.25, 0.41, 0.04], R: 0.1, r: 0.03, rot: [0, 0, s * 38], col: "cuff", k: 0.02 },
        { t: "box", c: [s * 0.12, 0.54, 0.05], s: [0.11, 0.12, 0.11], round: 0.07, col: gl, k: 0.04 },
        ...[0.62, 0.53, 0.44].map((y): Shape => ({ t: "ell", c: [s * 0.03, y + 0.02, 0.06], r: [0.04, 0.045, 0.06], col: gl, k: 0.02 })),
        { t: "cap", a: [s * 0.18, 0.62, 0.14], b: [s * 0.06, 0.6, 0.16], r: [0.04, 0.035], col: gl, k: 0.02 },
      ]),
    ],
    eyes: [],
  },

  // Frecuencia Letal: an oscilloscope whose jagged red waveform spikes right out of the screen.
  "frecuencia-letal": {
    palette: { case: "#3a3448", case2: "#5a5070", screen: "#10261e", grid: "#1e4a3a", wave: "#ff2a5a", knob: "#c8c4d8", led: "#ff4fd8" },
    glow: ["wave", "led"],
    shapes: [
      { t: "box", c: [0, 0.47, -0.06], s: [0.44, 0.33, 0.08], round: 0.06, col: "case", k: 0.02 },
      { t: "box", c: [0, 0.52, 0.0], s: [0.36, 0.23, 0.03], round: 0.03, col: "screen", k: 0.0 },
      ...[-0.24, -0.12, 0, 0.12, 0.24].map((x): Shape => ({ t: "box", c: [x, 0.52, 0.03], s: [0.004, 0.22, 0.01], round: 0.002, col: "grid", paint: true })),
      ...[0.4, 0.52, 0.64].map((y): Shape => ({ t: "box", c: [0, y, 0.03], s: [0.35, 0.004, 0.01], round: 0.002, col: "grid", paint: true })),
      ...line([[-0.5, 0.52, 0.06], [-0.3, 0.52, 0.06], [-0.24, 0.66, 0.06], [-0.18, 0.4, 0.06], [-0.1, 0.84, 0.08], [-0.02, 0.18, 0.08], [0.06, 0.92, 0.08], [0.14, 0.3, 0.08], [0.22, 0.7, 0.06], [0.28, 0.44, 0.06], [0.34, 0.52, 0.06], [0.52, 0.52, 0.06]], 0.026, "wave", 0.01),
      ...[-0.24, -0.08].map((x): Shape => ({ t: "cap", a: [x, 0.2, 0.0], b: [x, 0.2, 0.05], r: [0.035, 0.035], col: "knob", k: 0.01 })),
      { t: "ell", c: [0.2, 0.2, 0.02], r: [0.025, 0.025, 0.025], col: "led", k: 0.005 },
      { t: "box", c: [0, 0.06, -0.06], s: [0.3, 0.06, 0.1], round: 0.03, col: "case2", k: 0.02 },
    ],
    eyes: [],
  },

  // Resonancia: a big tuning fork on a block, both prongs blurred with vibration arcs.
  resonancia: {
    palette: { metal: "#c8ccd8", metal2: "#8a90a0", block: "#5a3a6a", block2: "#3a2448", wave: "#ff4fd8", wave2: "#4adcff" },
    glow: ["wave", "wave2"],
    shapes: [
      { t: "box", c: [0, 0.06, 0], s: [0.24, 0.06, 0.16], round: 0.03, col: "block", k: 0.02 },
      { t: "box", c: [0, 0.12, 0], s: [0.22, 0.012, 0.15], round: 0.01, col: "block2", paint: true },
      { t: "ell", c: [0, 0.15, 0], r: [0.05, 0.035, 0.05], col: "metal2", k: 0.02 },
      { t: "cap", a: [0, 0.16, 0], b: [0, 0.34, 0], r: [0.035, 0.035], col: "metal", k: 0.02 },
      ...arc(0, 0.44, 0, 0.11, 200, 340, 5, 0.04, "metal", 0.04, 0.02),
      { t: "cap", a: [-0.105, 0.42, 0], b: [-0.11, 0.92, 0], r: [0.04, 0.036], col: "metal", k: 0.02 },
      { t: "cap", a: [0.105, 0.42, 0], b: [0.11, 0.92, 0], r: [0.04, 0.036], col: "metal", k: 0.02 },
      { t: "cap", a: [-0.03, 0.4, 0.04], b: [-0.03, 0.88, 0.04], r: [0.008, 0.008], col: "metal2", paint: true },
      ...arc(0.11, 0.78, 0, 0.1, -50, 50, 3, 0.02, "wave"),
      ...arc(0.11, 0.78, 0, 0.19, -45, 45, 4, 0.02, "wave2"),
      ...arc(0.11, 0.78, 0, 0.28, -40, 40, 4, 0.018, "wave"),
      ...arc(-0.11, 0.78, 0, 0.1, 130, 230, 3, 0.02, "wave"),
      ...arc(-0.11, 0.78, 0, 0.19, 135, 225, 4, 0.02, "wave2"),
      ...arc(-0.11, 0.78, 0, 0.28, 140, 220, 4, 0.018, "wave"),
    ],
    eyes: [],
  },

  // ───────────────────────── Nexo, la IA rebelde ─────────────────────────

  // Ataque en Enjambre: a cloud of little red-eyed drones diving in together.
  "ataque-enjambre": {
    palette: { hull: "#4a5262", dome: "#7a8496", rotor: "#9aa8b8", eye: "#ff2a3a" },
    glow: ["eye"],
    shapes: [
      ...drone(0.02, 0.52, 0.08, 1.4),
      ...drone(-0.3, 0.74, -0.06, 1.0),
      ...drone(0.32, 0.8, -0.04, 0.95),
      ...drone(-0.34, 0.32, 0.04, 1.0),
      ...drone(0.34, 0.3, 0.1, 0.9),
      ...drone(-0.02, 0.92, -0.12, 0.75),
      ...drone(0.04, 0.14, -0.06, 0.75),
    ],
    eyes: [],
  },

  // Plan de Contingencia: a projector casting a glowing cyan holographic flowchart.
  "plan-de-contingencia": {
    palette: { base: "#3a4252", base2: "#5a6476", lens: "#4adcff", holo: "#1a6a8a", node: "#7af0ff", alt: "#ff3a4a", beam: "#2a9ac0" },
    glow: ["lens", "holo", "node", "alt", "beam"],
    shapes: [
      { t: "ell", c: [0, 0.05, 0], r: [0.22, 0.05, 0.22], col: "base", k: 0.02 },
      { t: "ell", c: [0, 0.12, 0], r: [0.08, 0.05, 0.08], col: "base2", k: 0.02 },
      { t: "ell", c: [0, 0.16, 0], r: [0.045, 0.03, 0.045], col: "lens", k: 0.01 },
      { t: "cap", a: [-0.03, 0.18, 0], b: [-0.3, 0.3, 0], r: [0.012, 0.012], col: "beam", k: 0 },
      { t: "cap", a: [0.03, 0.18, 0], b: [0.3, 0.3, 0], r: [0.012, 0.012], col: "beam", k: 0 },
      { t: "box", c: [0, 0.6, -0.04], s: [0.38, 0.3, 0.012], round: 0.01, col: "holo", k: 0 },
      { t: "box", c: [0, 0.82, 0.0], s: [0.09, 0.045, 0.025], round: 0.015, col: "node", k: 0 },
      { t: "box", c: [-0.2, 0.6, 0.0], s: [0.08, 0.045, 0.025], round: 0.015, col: "node", k: 0 },
      { t: "box", c: [0.2, 0.6, 0.0], s: [0.06, 0.06, 0.025], round: 0.01, rot: [0, 0, 45], col: "alt", k: 0 },
      { t: "box", c: [-0.2, 0.38, 0.0], s: [0.08, 0.045, 0.025], round: 0.015, col: "node", k: 0 },
      { t: "box", c: [0.2, 0.38, 0.0], s: [0.08, 0.045, 0.025], round: 0.015, col: "node", k: 0 },
      ...line([[0, 0.78, -0.02], [0, 0.7, -0.02], [-0.2, 0.7, -0.02], [-0.2, 0.64, -0.02]], 0.014, "node", 0),
      ...line([[0, 0.7, -0.02], [0.2, 0.7, -0.02], [0.2, 0.66, -0.02]], 0.014, "node", 0),
      ...line([[-0.2, 0.56, -0.02], [-0.2, 0.42, -0.02]], 0.014, "node", 0),
      ...line([[0.2, 0.54, -0.02], [0.2, 0.42, -0.02]], 0.014, "alt", 0),
    ],
    eyes: [],
  },

  // Furia de la Máquina: a heavy gunmetal robot fist with a glaring red optic and glowing seams.
  "furia-maquina": {
    palette: { gun: "#3e4450", gun2: "#5a6272", piston: "#b8c0cc", seam: "#ff2a3a", eye: "#ff2a3a", ring: "#1a1c22", cable: "#2a2e38", spark: "#ffd23a" },
    glow: ["seam", "eye", "spark"],
    shapes: [
      { t: "cap", a: [-0.06, 0.02, -0.12], b: [0, 0.34, 0], r: [0.13, 0.15], col: "gun2", k: 0.03 },
      { t: "cap", a: [-0.16, 0.06, 0.04], b: [-0.12, 0.34, 0.08], r: [0.025, 0.025], col: "piston", k: 0.01 },
      { t: "cap", a: [0.12, 0.06, 0.04], b: [0.12, 0.34, 0.08], r: [0.025, 0.025], col: "piston", k: 0.01 },
      { t: "box", c: [0, 0.54, 0.02], s: [0.23, 0.18, 0.16], round: 0.06, col: "gun", k: 0.04 },
      ...[-0.165, -0.055, 0.055, 0.165].flatMap((x): Shape[] => [
        { t: "box", c: [x, 0.66, 0.13], s: [0.05, 0.05, 0.06], round: 0.02, col: "gun2", k: 0.015 },
        { t: "box", c: [x, 0.52, 0.16], s: [0.048, 0.07, 0.04], round: 0.02, col: "gun2", k: 0.015 },
      ]),
      { t: "box", c: [0, 0.6, 0.19], s: [0.22, 0.008, 0.03], round: 0.004, col: "seam", paint: true },
      { t: "cap", a: [-0.22, 0.46, 0.12], b: [0.04, 0.4, 0.19], r: [0.06, 0.05], col: "gun2", k: 0.03 },
      { t: "tor", c: [0, 0.3, 0.13], R: 0.065, r: 0.02, rot: [90, 0, 0], col: "ring", k: 0.01 },
      { t: "ell", c: [0, 0.3, 0.13], r: [0.055, 0.055, 0.035], col: "eye", k: 0.01 },
      ...line([[-0.14, 0.28, -0.08], [-0.3, 0.2, -0.08], [-0.34, 0.02, -0.04]], 0.022, "cable"),
      spike([0.18, 0.78, 0.1], 50, 0.12, [0.024, 0.006], "spark", 0),
      spike([-0.18, 0.78, 0.1], 130, 0.12, [0.024, 0.006], "spark", 0),
      spike([0, 0.8, 0.12], 90, 0.13, [0.026, 0.006], "spark", 0),
    ],
    eyes: [],
  },

  // Drones Mejorados: a drone fitted with a glowing upgrade chip, a wrench behind it and an up-arrow.
  "drones-mejorados": {
    palette: { hull: "#4a5262", dome: "#7a8496", rotor: "#9aa8b8", eye: "#ff2a3a", tool: "#c8ccd4", chip: "#2a8a4a", pin: "#f2b632", up: "#5aff7a" },
    glow: ["eye", "up"],
    shapes: [
      { t: "cap", a: [-0.36, 0.12, -0.16], b: [0.28, 0.82, -0.16], r: [0.035, 0.035], col: "tool", k: 0.01 },
      { t: "ell", c: [0.32, 0.86, -0.16], r: [0.085, 0.085, 0.03], col: "tool", k: 0.02 },
      { t: "box", c: [0.38, 0.92, -0.16], s: [0.05, 0.04, 0.06], round: 0.01, rot: [0, 0, 45], col: "tool", cut: true, k: 0.005 },
      { t: "tor", c: [-0.38, 0.1, -0.16], R: 0.055, r: 0.025, rot: [90, 0, 0], col: "tool", k: 0.01 },
      ...drone(0, 0.42, 0.02, 2.0),
      { t: "box", c: [-0.07, 0.36, 0.17], s: [0.06, 0.04, 0.02], round: 0.01, col: "chip", k: 0.01 },
      ...[-0.11, -0.07, -0.03].map((x): Shape => ({ t: "cap", a: [x, 0.31, 0.17], b: [x, 0.29, 0.18], r: [0.008, 0.008], col: "pin", k: 0 })),
      { t: "cap", a: [0.36, 0.42, 0.1], b: [0.36, 0.66, 0.1], r: [0.035, 0.035], col: "up", k: 0.01 },
      { t: "cap", a: [0.36, 0.7, 0.1], b: [0.26, 0.6, 0.1], r: [0.035, 0.035], col: "up", k: 0.01 },
      { t: "cap", a: [0.36, 0.7, 0.1], b: [0.46, 0.6, 0.1], r: [0.035, 0.035], col: "up", k: 0.01 },
    ],
    eyes: [],
  },

  // Fábrica Robótica: a saw-roofed factory with a smoking stack and a robot arm building drones on a belt.
  "fabrica-robotica": {
    palette: { wall: "#7a8496", roof: "#4a5262", stack: "#5a606c", smoke: "#6a6470", door: "#ffd23a", stripe: "#2a2a30", win: "#ff8a3a", arm: "#ff8a1f", joint: "#3a3e48", belt: "#2a2e38", hull: "#4a5262", dome: "#7a8496", rotor: "#9aa8b8", eye: "#ff2a3a" },
    glow: ["win", "eye"],
    shapes: [
      { t: "box", c: [-0.15, 0.22, -0.12], s: [0.3, 0.2, 0.16], round: 0.02, col: "wall", k: 0.01 },
      ...[-0.36, -0.15, 0.06].map((x): Shape => ({ t: "box", c: [x, 0.46, -0.12], s: [0.1, 0.03, 0.16], round: 0.01, rot: [0, 0, 28], col: "roof", k: 0.01 })),
      { t: "cap", a: [-0.38, 0.4, -0.2], b: [-0.38, 0.82, -0.2], r: [0.05, 0.045], col: "stack", k: 0.01 },
      { t: "ell", c: [-0.34, 0.92, -0.2], r: [0.08, 0.06, 0.08], col: "smoke", k: 0.06 },
      { t: "ell", c: [-0.24, 1.0, -0.2], r: [0.07, 0.055, 0.07], col: "smoke", k: 0.06 },
      ...[-0.34, -0.22].map((x): Shape => ({ t: "box", c: [x, 0.3, 0.04], s: [0.04, 0.035, 0.01], round: 0.006, col: "win", paint: true })),
      { t: "box", c: [0.0, 0.14, 0.04], s: [0.1, 0.12, 0.01], round: 0.006, col: "door", paint: true },
      ...[0.06, 0.14, 0.22].map((y): Shape => ({ t: "box", c: [0.0, y, 0.05], s: [0.1, 0.012, 0.01], round: 0.003, col: "stripe", paint: true })),
      { t: "box", c: [0.16, 0.06, 0.22], s: [0.34, 0.035, 0.08], round: 0.03, col: "belt", k: 0.01 },
      ...drone(0.0, 0.14, 0.22, 0.7),
      ...drone(0.32, 0.14, 0.22, 0.7),
      { t: "cap", a: [0.42, 0.0, -0.04], b: [0.42, 0.1, -0.04], r: [0.07, 0.06], col: "joint", k: 0.02 },
      { t: "cap", a: [0.42, 0.1, -0.04], b: [0.36, 0.5, 0.0], r: [0.045, 0.04], col: "arm", k: 0.02 },
      { t: "ell", c: [0.36, 0.5, 0.0], r: [0.05, 0.05, 0.05], col: "joint", k: 0.02 },
      { t: "cap", a: [0.36, 0.5, 0.0], b: [0.18, 0.42, 0.16], r: [0.04, 0.035], col: "arm", k: 0.02 },
      { t: "ell", c: [0.17, 0.4, 0.17], r: [0.035, 0.035, 0.035], col: "joint", k: 0.01 },
      { t: "cap", a: [0.15, 0.38, 0.17], b: [0.12, 0.28, 0.17], r: [0.016, 0.012], col: "joint", k: 0.01 },
      { t: "cap", a: [0.19, 0.38, 0.17], b: [0.22, 0.28, 0.17], r: [0.016, 0.012], col: "joint", k: 0.01 },
    ],
    eyes: [],
  },

  // Asimilación: a globe on its stand being swallowed by dark machine plating, red circuit traces creeping on.
  asimilacion: {
    palette: { sea: "#3a8ae0", land: "#5ac86a", metal: "#3e4450", trace: "#ff2a3a", node: "#ffb0a0", stand: "#c8a04a", base: "#5a3a24" },
    glow: ["trace", "node"],
    shapes: [
      { t: "ell", c: [0, 0.03, 0], r: [0.18, 0.035, 0.18], col: "base", k: 0.02 },
      { t: "cap", a: [0, 0.05, 0], b: [0, 0.18, 0], r: [0.035, 0.03], col: "stand", k: 0.02 },
      { t: "ell", c: [0, 0.5, 0], r: [0.28, 0.28, 0.28], col: "sea", k: 0.02 },
      { t: "tor", c: [0, 0.5, 0], R: 0.32, r: 0.022, rot: [90, 0, 0], col: "stand", k: 0 },
      { t: "cap", a: [0, 0.16, 0], b: [0, 0.2, 0], r: [0.03, 0.03], col: "stand", k: 0.02 },
      { t: "ell", c: [-0.12, 0.6, 0.2], r: [0.1, 0.08, 0.12], col: "land", paint: true },
      { t: "ell", c: [-0.06, 0.4, 0.24], r: [0.06, 0.09, 0.1], col: "land", paint: true },
      { t: "ell", c: [-0.22, 0.42, 0.12], r: [0.05, 0.06, 0.1], col: "land", paint: true },
      { t: "ell", c: [0.2, 0.56, 0.2], r: [0.2, 0.3, 0.2], col: "metal", paint: true },
      { t: "ell", c: [0.26, 0.5, -0.05], r: [0.12, 0.3, 0.3], col: "metal", paint: true },
      ...[
        [0.02, 0.62, 0.22, 0.62], [0.02, 0.62, 0.02, 0.7], [-0.06, 0.5, 0.2, 0.5], [-0.06, 0.5, -0.06, 0.56], [0.0, 0.36, 0.18, 0.36], [0.0, 0.36, 0.0, 0.3],
        [0.12, 0.7, 0.12, 0.3], [-0.14, 0.56, -0.06, 0.56],
      ].map(([x0, y0, x1, y1]): Shape => ({ t: "box", c: [(x0 + x1) / 2, (y0 + y1) / 2, 0.2], s: [Math.abs(x1 - x0) / 2 + 0.008, Math.abs(y1 - y0) / 2 + 0.008, 0.14], round: 0.004, col: "trace", paint: true })),
      ...[[0.02, 0.7], [-0.06, 0.56], [0.0, 0.3], [-0.14, 0.56], [0.12, 0.5]].map(([x, y]): Shape => ({ t: "ell", c: [x, y, 0.26], r: [0.022, 0.022, 0.08], col: "node", paint: true })),
    ],
    eyes: [],
  },

  // Bombardeo Aéreo: three finned bombs whistling down from the sky toward a burst on the ground.
  "bombardeo-aereo": {
    palette: { bomb: "#4a5262", nose: "#ff3a3a", fin: "#7a8496", streak: "#8ab8e0", ground: "#8a7a68", fire: "#ff7a1f", hot: "#ffd23a", smoke: "#6a6470" },
    glow: ["fire", "hot"],
    shapes: (() => {
      const bomb = (x: number, y: number, z: number, s: number): Shape[] => [
        { t: "ell", c: [x, y, z], r: [0.075 * s, 0.15 * s, 0.075 * s], rot: [0, 0, -18], col: "bomb", k: 0.02 },
        { t: "ell", c: [x + 0.045 * s, y - 0.13 * s, z], r: [0.07 * s, 0.06 * s, 0.07 * s], col: "nose", paint: true },
        { t: "tor", c: [x, y, z], R: 0.072 * s, r: 0.012, rot: [0, 0, -18], col: "nose", k: 0 },
        { t: "box", c: [x - 0.05 * s, y + 0.17 * s, z], s: [0.08 * s, 0.05 * s, 0.012], round: 0.006, rot: [0, 0, -18], col: "fin", k: 0.01 },
        { t: "box", c: [x - 0.05 * s, y + 0.17 * s, z], s: [0.012, 0.05 * s, 0.08 * s], round: 0.006, rot: [0, 0, -18], col: "fin", k: 0.01 },
        { t: "cap", a: [x - 0.1 * s, y + 0.28 * s, z], b: [x - 0.16 * s, y + 0.46 * s, z], r: [0.02, 0.01], col: "streak", k: 0 },
        { t: "cap", a: [x - 0.03 * s, y + 0.3 * s, z], b: [x - 0.08 * s, y + 0.5 * s, z], r: [0.02, 0.01], col: "streak", k: 0 },
      ];
      return [
        { t: "ell", c: [0, 0.03, 0], r: [0.5, 0.03, 0.3], col: "ground", k: 0.02 },
        ...burst([0.2, 0.08, 0.04], 7, 20, 0.2, [0.06, 0.012], "fire", { len: 0.14, r: [0.05, 0.012], col: "hot" }, 0.03).filter((_, i) => i < 4),
        { t: "ell", c: [0.2, 0.1, 0.04], r: [0.14, 0.09, 0.12], col: "fire", k: 0.05 },
        { t: "ell", c: [0.2, 0.12, 0.12], r: [0.07, 0.05, 0.05], col: "hot", paint: true },
        { t: "ell", c: [0.32, 0.22, -0.06], r: [0.08, 0.07, 0.08], col: "smoke", k: 0.05 },
        ...bomb(-0.02, 0.46, 0.06, 1.5),
        ...bomb(-0.36, 0.74, -0.08, 1.15),
        ...bomb(0.32, 0.8, -0.04, 1.1),
      ];
    })(),
    eyes: [],
  },

  // Ciudad Asediada: a city skyline behind a cracked defensive wall, fires in the windows, smoke rising.
  "ciudad-asediada": {
    palette: { b1: "#6a7488", b2: "#8a94a8", b3: "#5a6070", win: "#ffb03a", dark: "#2a2e38", wall: "#a89a88", wall2: "#7a6e60", fire: "#ff6a1f", hot: "#ffd23a", smoke: "#4a4450", smoke2: "#6a6470" },
    glow: ["win", "fire", "hot"],
    shapes: [
      { t: "box", c: [-0.26, 0.34, -0.16], s: [0.12, 0.34, 0.1], round: 0.015, col: "b1", k: 0.01 },
      { t: "box", c: [0.02, 0.44, -0.2], s: [0.13, 0.44, 0.1], round: 0.015, col: "b2", k: 0.01 },
      { t: "ell", c: [0.12, 0.88, -0.12], r: [0.1, 0.1, 0.1], col: "dark", cut: true, k: 0.02 },
      { t: "box", c: [0.28, 0.28, -0.14], s: [0.11, 0.28, 0.1], round: 0.015, col: "b3", k: 0.01 },
      ...[[-0.3, 0.5], [-0.22, 0.5], [-0.3, 0.38], [-0.22, 0.38], [-0.3, 0.62], [-0.02, 0.7], [0.06, 0.7], [-0.02, 0.58], [0.06, 0.58], [-0.02, 0.46], [0.06, 0.46], [0.24, 0.4], [0.32, 0.4], [0.24, 0.28], [0.32, 0.28]]
        .map(([x, y], i): Shape => ({ t: "box", c: [x, y, x < -0.1 ? -0.06 : x > 0.15 ? -0.04 : -0.1], s: [0.022, 0.03, 0.01], round: 0.005, col: i % 3 === 0 ? "win" : "dark", paint: true })),
      { t: "box", c: [0, 0.12, 0.12], s: [0.48, 0.12, 0.06], round: 0.02, col: "wall", k: 0.01 },
      ...[-0.4, -0.24, 0.24, 0.4].map((x): Shape => ({ t: "box", c: [x, 0.27, 0.12], s: [0.05, 0.04, 0.06], round: 0.012, col: "wall", k: 0.01 })),
      { t: "ell", c: [0.02, 0.24, 0.14], r: [0.12, 0.1, 0.12], col: "wall2", cut: true, k: 0.02 },
      ...[0.06, 0.16].map((y): Shape => ({ t: "box", c: [0, y, 0.18], s: [0.49, 0.006, 0.01], round: 0.003, col: "wall2", paint: true })),
      flame([0.12, 0.84, -0.14], [0.16, 1.02, -0.12], 0.07, "fire", 0.03),
      flame([0.04, 0.24, 0.12], [0.02, 0.4, 0.14], 0.06, "fire", 0.03),
      flame([0.0, 0.22, 0.14], [0.06, 0.34, 0.16], 0.04, "hot", 0.02),
      { t: "ell", c: [0.2, 1.06, -0.16], r: [0.12, 0.08, 0.1], col: "smoke", k: 0.06 },
      { t: "ell", c: [0.34, 1.14, -0.16], r: [0.1, 0.07, 0.09], col: "smoke2", k: 0.06 },
      { t: "ell", c: [-0.3, 0.8, -0.18], r: [0.1, 0.07, 0.09], col: "smoke2", k: 0.06 },
      { t: "ell", c: [-0.4, 0.9, -0.18], r: [0.08, 0.06, 0.08], col: "smoke", k: 0.06 },
    ],
    eyes: [],
  },

  // ───────────────────────── Experto de Nexo ─────────────────────────

  // Actualización Hostil: a holo-screen with a red download arrow, a filling progress bar and a skull badge.
  "actualizacion-hostil": {
    palette: { frame: "#2a2e38", screen: "#0e2a3a", arrow: "#ff2a3a", bar: "#1a1c22", fill: "#ff3a4a", skull: "#ff2a3a", hole: "#1a0a0e", stand: "#4a5262" },
    glow: ["arrow", "fill", "skull"],
    shapes: [
      { t: "ell", c: [0, 0.03, -0.02], r: [0.15, 0.03, 0.12], col: "stand", k: 0.02 },
      { t: "cap", a: [0, 0.04, -0.02], b: [0, 0.18, -0.02], r: [0.03, 0.03], col: "stand", k: 0.02 },
      { t: "box", c: [0, 0.54, -0.02], s: [0.34, 0.36, 0.035], round: 0.04, col: "frame", k: 0.02 },
      { t: "box", c: [0, 0.56, 0.01], s: [0.3, 0.3, 0.012], round: 0.025, col: "screen", paint: true },
      { t: "cap", a: [0, 0.8, 0.04], b: [0, 0.52, 0.04], r: [0.045, 0.045], col: "arrow", k: 0.01 },
      { t: "cap", a: [0, 0.44, 0.04], b: [-0.14, 0.58, 0.04], r: [0.045, 0.045], col: "arrow", k: 0.01 },
      { t: "cap", a: [0, 0.44, 0.04], b: [0.14, 0.58, 0.04], r: [0.045, 0.045], col: "arrow", k: 0.01 },
      { t: "box", c: [0, 0.31, 0.03], s: [0.24, 0.035, 0.015], round: 0.02, col: "bar", k: 0.0 },
      { t: "box", c: [-0.07, 0.31, 0.045], s: [0.16, 0.022, 0.012], round: 0.015, col: "fill", k: 0.0 },
      { t: "ell", c: [0.3, 0.86, 0.06], r: [0.11, 0.1, 0.05], col: "skull", k: 0.01 },
      { t: "box", c: [0.3, 0.77, 0.06], s: [0.06, 0.04, 0.04], round: 0.015, col: "skull", k: 0.02 },
      { t: "ell", c: [0.26, 0.87, 0.1], r: [0.028, 0.03, 0.03], col: "hole", paint: true },
      { t: "ell", c: [0.34, 0.87, 0.1], r: [0.028, 0.03, 0.03], col: "hole", paint: true },
      ...[0.28, 0.3, 0.32].map((x): Shape => ({ t: "box", c: [x, 0.76, 0.1], s: [0.004, 0.025, 0.02], round: 0.002, col: "hole", paint: true })),
    ],
    eyes: [],
  },

  // Protocolo Exterminio: a red warning-triangle hologram with an exclamation mark, glitch-doubled.
  "protocolo-exterminio": {
    palette: { base: "#2a2e38", ring: "#ff2a3a", tri: "#ff2a3a", ghost: "#a81a2a", mark: "#ffd0d0", beam: "#c81a2a" },
    glow: ["ring", "tri", "mark", "beam", "ghost"],
    shapes: (() => {
      const tri = (s: number, z: number, r: number, col: string, dx = 0): Shape[] => {
        const p: V3[] = [[-0.4 * s + dx, 0.66 - 0.44 * s, z], [0.4 * s + dx, 0.66 - 0.44 * s, z], [dx, 0.66 + 0.36 * s, z]];
        return [...line([p[0], p[1], p[2], p[0]], r, col, 0.02)];
      };
      return [
        { t: "ell", c: [0, 0.04, 0], r: [0.22, 0.04, 0.22], col: "base", k: 0.02 },
        { t: "tor", c: [0, 0.06, 0], R: 0.13, r: 0.022, col: "ring", k: 0.005 },
        { t: "cap", a: [-0.08, 0.06, 0], b: [-0.3, 0.2, 0], r: [0.012, 0.012], col: "beam", k: 0 },
        { t: "cap", a: [0.08, 0.06, 0], b: [0.3, 0.2, 0], r: [0.012, 0.012], col: "beam", k: 0 },
        ...tri(1.12, -0.1, 0.022, "ghost", 0.04),
        ...tri(1, 0, 0.05, "tri"),
        { t: "cap", a: [0, 0.78, 0.02], b: [0, 0.5, 0.02], r: [0.05, 0.035], col: "mark", k: 0.01 },
        { t: "ell", c: [0, 0.4, 0.02], r: [0.042, 0.042, 0.042], col: "mark", k: 0.01 },
      ];
    })(),
    eyes: [],
  },
};
