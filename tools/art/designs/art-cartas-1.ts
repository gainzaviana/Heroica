import * as THREE from "three";
import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, rad, spike } from "./kit";

// MARK: Local helpers

/** Copies `mirror` shapes into explicit pairs (so they can be rotated about any axis safely). */
function unmirror(shapes: Shape[]): Shape[] {
  const out: Shape[] = [];
  for (const sh of shapes) {
    if (!sh.mirror) { out.push(sh); continue; }
    const base = { ...sh, mirror: false } as Shape;
    out.push(base);
    const f = (v: V3): V3 => [v[0], v[1], -v[2]];
    const rot: V3 | undefined = sh.rot ? [-sh.rot[0], -sh.rot[1], sh.rot[2]] : undefined;
    if (sh.t === "cap") out.push({ ...sh, mirror: false, a: f(sh.a), b: f(sh.b) });
    else out.push({ ...sh, mirror: false, c: f(sh.c), rot } as Shape);
  }
  return out;
}

/** Rotates shapes about an axis through `p` (degrees), composing each shape's own rotation. */
function spin(shapes: Shape[], axis: "x" | "y" | "z", deg: number, p: V3 = [0, 0, 0]): Shape[] {
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

/** Capsules through the given points (a zig-zag bolt or a curve), radius tapering r0 → r1. */
function path(pts: V3[], r0: number, r1: number, col: string, k = 0.02, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, paint });
  }
  return out;
}

/** Points on an arc in the xy plane (centre, radius, from/to degrees), at depth z. */
function arc(c: [number, number], R: number, from: number, to: number, n: number, z = 0): V3[] {
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(from + ((to - from) * i) / n);
    pts.push([c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), z]);
  }
  return pts;
}

/** A waving cloth flag: thin panels from the pole at x0 out to x0 + w, centred at y, height h. */
function flag(x0: number, y: number, w: number, h: number, col: string, n = 7, amp = 0.045): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const z = amp * Math.sin(t * Math.PI * 2.2);
    const dz = amp * Math.cos(t * Math.PI * 2.2) * Math.PI * 2.2 / n;
    out.push({ t: "box", c: [x0 + t * w, y - t * 0.06, z], s: [w / n / 2 + 0.015, h / 2 - t * 0.02, 0.014], round: 0.012, rot: [0, -Math.atan2(dz, w / n) * 180 / Math.PI, 0], col, k: 0.035 });
  }
  return out;
}

/** Round chain links along a line in the xy plane, alternating face-on / edge-on. */
function chainLinks(p0: V3, p1: V3, n: number, R: number, r: number, col: string, col2 = col): Shape[] {
  const out: Shape[] = [];
  const ang = (Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180) / Math.PI;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const c: V3 = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t];
    out.push(i % 2 === 0
      ? { t: "tor", c, R, r, rot: [90, 0, 0], col, k: 0 }
      : { t: "tor", c, R, r, rot: [0, 0, ang], col: col2, k: 0 });
  }
  return out;
}

/** Small spheres (sparks, dots). */
const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

// MARK: Palettes

const VAN = { red: "#b8322a", red2: "#d9473a", ti: "#c9ced6", tidk: "#7d8590", dark: "#2c3340", cyan: "#5fe6ff", hot: "#eafdff" };
const FUR = { red: "#d23a2a", orange: "#ff7a2a", yellow: "#ffd04a", dark: "#4a2522", cream: "#ffe9c8" };
const LID = { blue: "#2f5fb3", blue2: "#4f86d6", gold: "#f0b23e", gold2: "#ffd36a", dark: "#1f2f55", wood: "#8a5a36" };
const PRO = { steel: "#5d7fa8", steel2: "#7e9fc4", silver: "#d3dbe6", dark: "#33465f", glow: "#9fd8ff" };

export const artCartas1: Record<string, Sculpt> = {
  // MARK: Vanguardia de Titanio

  // Guantelete de Plasma: a sleek red/titanium gauntlet punching up-right, a plasma orb crackling at the knuckles.
  "guantelete-plasma": {
    palette: { ...VAN },
    glow: ["cyan", "hot"],
    shapes: spin([
      { t: "cap", a: [0, 0.0, 0], b: [0, 0.36, 0], r: [0.12, 0.145], col: "red" },
      { t: "tor", c: [0, 0.02, 0], R: 0.12, r: 0.035, col: "ti", k: 0.02 },
      { t: "tor", c: [0, 0.37, 0], R: 0.14, r: 0.03, col: "ti", k: 0.02 },
      { t: "box", c: [0, 0.2, 0.135], s: [0.025, 0.1, 0.03], round: 0.02, col: "cyan", paint: true },
      { t: "box", c: [0.13, 0.2, 0.0], s: [0.03, 0.1, 0.02], round: 0.02, col: "cyan", paint: true },
      { t: "box", c: [0, 0.52, 0], s: [0.16, 0.13, 0.14], round: 0.08, col: "red", k: 0.04 },
      ...[-0.11, -0.037, 0.037, 0.11].map((x): Shape => ({ t: "ell", c: [x, 0.64, 0.02], r: [0.045, 0.04, 0.09], col: "ti", k: 0.015 })),
      ...[-0.11, -0.037, 0.037, 0.11].map((x): Shape => ({ t: "ell", c: [x, 0.565, 0.115], r: [0.04, 0.04, 0.04], col: "red2", k: 0.012 })),
      { t: "cap", a: [0.17, 0.46, 0.05], b: [0.12, 0.54, 0.14], r: [0.05, 0.045], col: "red", k: 0.03 },
      { t: "ell", c: [0, 0.79, 0.02], r: [0.15, 0.1, 0.13], col: "cyan", k: 0 },
      { t: "ell", c: [0, 0.79, 0.1], r: [0.08, 0.06, 0.06], col: "hot", paint: true },
      ...burst([0, 0.8, 0.02], 7, 10, 0.3, [0.05, 0.01], "cyan", { len: 0.2, r: [0.04, 0.01], col: "hot" }, 0.04).filter((_, i) => i !== 5),
    ], "z", -32, [0, 0.35, 0]).concat([
      dot([0.48, 0.62, 0.1], 0.03, "cyan"),
      dot([0.02, 1.0, -0.05], 0.025, "cyan"),
    ]),
    eyes: [],
  },

  // Visor Táctico: a sleek red helmet with a titanium jaw and a wrap-around glowing visor; a HUD reticle floats beside it.
  "visor-tactico": {
    palette: { ...VAN },
    glow: ["cyan", "hot"],
    shapes: spin([
      { t: "cap", a: [-0.04, 0.06, 0], b: [-0.04, 0.16, 0], r: [0.13, 0.12], col: "tidk" },
      { t: "ell", c: [-0.04, 0.5, 0], r: [0.29, 0.32, 0.26], col: "red", k: 0.05 },
      { t: "ell", c: [0.08, 0.3, 0], r: [0.19, 0.15, 0.19], col: "ti", k: 0.02 },
      { t: "cap", a: [0.22, 0.36, 0], b: [0.28, 0.2, 0], r: [0.06, 0.04], col: "ti", k: 0.03 },
      { t: "box", c: [0.27, 0.26, 0], s: [0.03, 0.04, 0.06], round: 0.015, col: "dark", paint: true },
      { t: "ell", c: [0.14, 0.5, 0], r: [0.17, 0.075, 0.25], col: "cyan", k: 0.01 },
      { t: "ell", c: [0.29, 0.52, 0.05], r: [0.03, 0.025, 0.09], col: "hot", paint: true },
      { t: "box", c: [0.0, 0.78, 0], s: [0.24, 0.03, 0.035], round: 0.02, rot: [0, 0, -12], col: "ti", k: 0.03 },
      { t: "cap", a: [-0.08, 0.54, 0.22], b: [-0.34, 0.66, 0.18], r: [0.05, 0.015], col: "ti", mirror: true, k: 0.03 },
      { t: "cap", a: [-0.05, 0.38, 0.22], b: [-0.05, 0.38, 0.29], r: [0.07, 0.07], col: "ti", mirror: true, k: 0.01 },
      { t: "ell", c: [-0.05, 0.38, 0.3], r: [0.035, 0.035, 0.012], col: "cyan", mirror: true, k: 0 },
      { t: "box", c: [0.2, 0.3, 0.14], s: [0.04, 0.015, 0.04], round: 0.01, col: "cyan", paint: true, mirror: true },
    ], "y", -12).concat([
      // HUD reticle floating up and to the side of the visor
      { t: "tor", c: [0.42, 0.86, 0.12], R: 0.08, r: 0.012, rot: [90, 0, 0], col: "cyan", k: 0 },
      { t: "cap", a: [0.26, 0.86, 0.12], b: [0.33, 0.86, 0.12], r: [0.012, 0.012], col: "cyan", k: 0 },
      { t: "cap", a: [0.51, 0.86, 0.12], b: [0.58, 0.86, 0.12], r: [0.012, 0.012], col: "cyan", k: 0 },
      { t: "cap", a: [0.42, 0.7, 0.12], b: [0.42, 0.77, 0.12], r: [0.012, 0.012], col: "cyan", k: 0 },
      { t: "cap", a: [0.42, 0.95, 0.12], b: [0.42, 1.02, 0.12], r: [0.012, 0.012], col: "cyan", k: 0 },
      dot([0.42, 0.86, 0.12], 0.022, "hot"),
    ]),
    eyes: [],
  },

  // Núcleo de Fusión: a glowing cyan reactor column caged in titanium with red rings, an energy ring orbiting it.
  "nucleo-fusion": {
    palette: { ...VAN },
    glow: ["cyan", "hot"],
    shapes: [
      { t: "ell", c: [0, 0.09, 0], r: [0.33, 0.09, 0.33], col: "ti" },
      { t: "tor", c: [0, 0.12, 0], R: 0.3, r: 0.04, col: "red", k: 0.02 },
      { t: "ell", c: [0, 0.18, 0], r: [0.24, 0.06, 0.24], col: "dark", k: 0.03 },
      { t: "cap", a: [0, 0.2, 0], b: [0, 0.74, 0], r: [0.16, 0.16], col: "cyan", k: 0.02 },
      { t: "ell", c: [0, 0.47, 0.12], r: [0.08, 0.14, 0.08], col: "hot", paint: true },
      ...[45, 135, 225, 315].map((a): Shape => ({ t: "cap", a: [0.2 * Math.cos(rad(a)), 0.2, 0.2 * Math.sin(rad(a))], b: [0.2 * Math.cos(rad(a)), 0.76, 0.2 * Math.sin(rad(a))], r: [0.028, 0.028], col: "ti", k: 0.01 })),
      { t: "tor", c: [0, 0.33, 0], R: 0.19, r: 0.03, col: "red", k: 0.01 },
      { t: "tor", c: [0, 0.6, 0], R: 0.19, r: 0.03, col: "red", k: 0.01 },
      { t: "ell", c: [0, 0.82, 0], r: [0.27, 0.08, 0.27], col: "ti", k: 0.03 },
      { t: "tor", c: [0, 0.82, 0], R: 0.25, r: 0.035, col: "red", k: 0.02 },
      { t: "cap", a: [0, 0.86, 0], b: [0, 0.96, 0], r: [0.07, 0.05], col: "tidk", k: 0.02 },
      { t: "ell", c: [0, 0.98, 0], r: [0.04, 0.04, 0.04], col: "cyan", k: 0 },
      { t: "tor", c: [0, 0.48, 0], R: 0.38, r: 0.016, rot: [72, 0, 18], col: "cyan", k: 0 },
      dot([0.36, 0.62, 0.12], 0.03, "hot"),
      dot([-0.4, 0.3, 0.05], 0.025, "cyan"),
    ],
    eyes: [],
  },

  // Propulsores Dorsales: a red back-pack with titanium fins and two thrusters blasting cyan jets downward.
  "propulsores-dorsales": {
    palette: { ...VAN },
    glow: ["cyan", "hot"],
    shapes: [
      { t: "box", c: [0, 0.66, 0], s: [0.22, 0.24, 0.08], round: 0.08, col: "red" },
      { t: "box", c: [0, 0.66, 0.07], s: [0.035, 0.2, 0.03], round: 0.02, col: "ti", k: 0.02 },
      { t: "box", c: [0, 0.8, 0.08], s: [0.12, 0.018, 0.02], round: 0.01, col: "cyan", paint: true },
      { t: "box", c: [0, 0.74, 0.08], s: [0.12, 0.018, 0.02], round: 0.01, col: "cyan", paint: true },
      ...[-1, 1].flatMap((s): Shape[] => [
        { t: "cap", a: [0.17 * s, 0.68, 0.06], b: [0.2 * s, 0.4, 0.08], r: [0.075, 0.095], col: "ti", k: 0.03 },
        { t: "tor", c: [0.2 * s, 0.38, 0.08], R: 0.09, r: 0.03, col: "dark", k: 0.01 },
        { t: "ell", c: [0.2 * s, 0.35, 0.08], r: [0.07, 0.05, 0.07], col: "dark", cut: true, k: 0.01 },
        { t: "cap", a: [0.2 * s, 0.34, 0.08], b: [0.22 * s, 0.0, 0.08], r: [0.085, 0.012], col: "cyan", k: 0 },
        { t: "cap", a: [0.2 * s, 0.33, 0.12], b: [0.215 * s, 0.17, 0.12], r: [0.045, 0.012], col: "hot", paint: true },
        { t: "box", c: [0.36 * s, 0.76, 0], s: [0.15, 0.035, 0.05], round: 0.03, rot: [0, 0, 18 * s], col: "ti", k: 0.03 },
        { t: "box", c: [0.31 * s, 0.68, 0], s: [0.1, 0.03, 0.045], round: 0.03, rot: [0, 0, 10 * s], col: "red", k: 0.03 },
      ]),
    ],
    eyes: [],
  },

  // Cañón de Hombro: a red pauldron carrying a titanium energy cannon, cyan coils and a charged muzzle.
  "canon-hombro": {
    palette: { ...VAN },
    glow: ["cyan", "hot"],
    shapes: spin([
      { t: "ell", c: [-0.05, 0.36, 0], r: [0.3, 0.24, 0.28], col: "red" },
      { t: "ell", c: [-0.05, 0.2, 0], r: [0.32, 0.1, 0.3], col: "ti", k: 0.04 },
      { t: "ell", c: [-0.05, 0.08, 0], r: [0.22, 0.06, 0.2], col: "dark", k: 0.04 },
      { t: "box", c: [-0.05, 0.6, 0], s: [0.08, 0.06, 0.08], round: 0.03, col: "dark", k: 0.03 },
      { t: "box", c: [0.0, 0.72, 0], s: [0.2, 0.08, 0.09], round: 0.06, col: "ti", k: 0.03 },
      { t: "box", c: [-0.05, 0.72, 0.08], s: [0.1, 0.02, 0.02], round: 0.01, col: "cyan", paint: true },
      { t: "cap", a: [0.1, 0.73, 0], b: [0.46, 0.75, 0], r: [0.06, 0.052], col: "ti", k: 0.02 },
      ...[0.22, 0.3, 0.38].map((x): Shape => ({ t: "tor", c: [x, 0.74, 0], R: 0.062, r: 0.016, rot: [0, 0, 90], col: "cyan", k: 0 })),
      { t: "tor", c: [0.47, 0.75, 0], R: 0.06, r: 0.025, rot: [0, 0, 90], col: "dark", k: 0.01 },
      { t: "ell", c: [0.49, 0.75, 0], r: [0.02, 0.05, 0.05], col: "hot", k: 0 },
      ...[-40, -15, 15, 40].map((a) => spike([0.58, 0.75, 0], a, 0.14, [0.035, 0.008], "cyan", 0)),
    ], "y", 15),
    eyes: [],
  },

  // Forja Tecnológica: a titanium workbench where a red robot arm welds a glowing part.
  "forja-tecnologica": {
    palette: { ...VAN, spark: "#ffd27a" },
    glow: ["cyan", "hot", "spark"],
    shapes: [
      { t: "box", c: [0, 0.32, 0], s: [0.44, 0.035, 0.22], round: 0.02, col: "ti" },
      { t: "box", c: [0, 0.29, 0.21], s: [0.42, 0.02, 0.012], round: 0.01, col: "cyan", paint: true },
      ...[-0.38, 0.38].map((x): Shape => ({ t: "box", c: [x, 0.15, 0.16], s: [0.035, 0.15, 0.035], round: 0.015, col: "dark", mirror: true, k: 0.02 })),
      { t: "box", c: [0, 0.08, 0], s: [0.38, 0.02, 0.15], round: 0.01, col: "tidk", k: 0.02 },
      // part being made: a little glowing gauntlet plate in a clamp
      { t: "box", c: [0.16, 0.38, 0.04], s: [0.1, 0.03, 0.07], round: 0.02, col: "dark", k: 0.02 },
      { t: "ell", c: [0.16, 0.44, 0.04], r: [0.09, 0.05, 0.07], col: "cyan", k: 0.01 },
      { t: "ell", c: [0.16, 0.47, 0.08], r: [0.04, 0.025, 0.03], col: "hot", paint: true },
      // robot arm
      { t: "ell", c: [-0.28, 0.39, 0], r: [0.1, 0.05, 0.1], col: "dark", k: 0.02 },
      { t: "cap", a: [-0.28, 0.4, 0], b: [-0.22, 0.82, 0], r: [0.065, 0.055], col: "red", k: 0.03 },
      { t: "ell", c: [-0.22, 0.83, 0], r: [0.075, 0.075, 0.075], col: "ti", k: 0.02 },
      { t: "cap", a: [-0.22, 0.83, 0], b: [0.1, 0.76, 0.02], r: [0.055, 0.045], col: "red", k: 0.02 },
      { t: "ell", c: [0.1, 0.76, 0.02], r: [0.058, 0.058, 0.058], col: "ti", k: 0.02 },
      { t: "cap", a: [0.1, 0.76, 0.02], b: [0.15, 0.58, 0.04], r: [0.04, 0.022], col: "tidk", k: 0.02 },
      { t: "box", c: [-0.25, 0.6, 0.06], s: [0.02, 0.1, 0.02], round: 0.01, col: "cyan", paint: true },
      ...burst([0.16, 0.54, 0.05], 8, 20, 0.12, [0.025, 0.006], "spark", undefined, 0),
      dot([0.36, 0.62, 0.1], 0.025, "spark"),
      dot([-0.02, 0.6, 0.12], 0.02, "spark"),
    ],
    eyes: [],
  },

  // Pulso Iónico: a white-hot ion orb releasing a ring pulse and forked cyan lightning.
  "pulso-ionico": {
    palette: { ...VAN, ion: "#2fb8ff" },
    glow: ["cyan", "hot", "ion"],
    shapes: [
      { t: "ell", c: [0, 0.5, 0], r: [0.15, 0.15, 0.15], col: "cyan" },
      { t: "ell", c: [0, 0.52, 0.08], r: [0.09, 0.09, 0.08], col: "hot", paint: true },
      { t: "tor", c: [0, 0.5, 0], R: 0.25, r: 0.028, rot: [90, 0, 0], col: "ion", k: 0 },
      { t: "tor", c: [0, 0.5, 0], R: 0.4, r: 0.018, rot: [90, 0, 0], col: "cyan", k: 0 },
      ...[30, 150, 210, 330].flatMap((a): Shape[] => {
        const d = (r: number, off: number): V3 => [Math.cos(rad(a + off)) * r, 0.5 + Math.sin(rad(a + off)) * r, 0.02];
        return path([d(0.12, 0), d(0.24, 9), d(0.3, -9), d(0.42, 7), d(0.52, -3)], 0.035, 0.01, "cyan", 0.015);
      }),
      ...[90, 270].flatMap((a): Shape[] => {
        const d = (r: number, off: number): V3 => [Math.cos(rad(a + off)) * r, 0.5 + Math.sin(rad(a + off)) * r, 0.02];
        return path([d(0.12, 0), d(0.22, -10), d(0.32, 8), d(0.46, -4)], 0.03, 0.01, "ion", 0.015);
      }),
      dot([0.45, 0.88, 0.05], 0.025, "hot"),
      dot([-0.47, 0.15, 0.05], 0.025, "hot"),
    ],
    eyes: [],
  },

  // Impacto Supersónico: a red/titanium fist punching forward through a cone of shock rings, speed lines behind.
  "impacto-supersonico": {
    palette: { ...VAN, wave: "#e9f7ff" },
    glow: ["cyan", "hot", "wave"],
    shapes: spin([
      { t: "cap", a: [-0.46, 0.5, 0], b: [-0.04, 0.5, 0], r: [0.11, 0.135], col: "red" },
      { t: "tor", c: [-0.08, 0.5, 0], R: 0.135, r: 0.035, rot: [0, 0, 90], col: "ti", k: 0.02 },
      { t: "box", c: [0.11, 0.5, 0], s: [0.14, 0.15, 0.15], round: 0.09, col: "red", k: 0.04 },
      ...[-0.105, -0.035, 0.035, 0.105].map((y): Shape => ({ t: "ell", c: [0.24, 0.5 + y, 0.02], r: [0.045, 0.04, 0.12], col: "ti", k: 0.015 })),
      ...[-0.105, -0.035, 0.035, 0.105].map((y): Shape => ({ t: "ell", c: [0.16, 0.5 + y, 0.13], r: [0.05, 0.035, 0.035], col: "red2", k: 0.012 })),
      { t: "cap", a: [0.02, 0.36, 0.12], b: [0.14, 0.4, 0.16], r: [0.05, 0.045], col: "red", k: 0.03 },
      { t: "tor", c: [0.36, 0.5, 0], R: 0.19, r: 0.03, rot: [0, 0, 90], col: "cyan", k: 0 },
      ...[[0.14, 0.27], [-0.1, 0.35], [-0.34, 0.43]].map(([x, R]): Shape => ({ t: "tor", c: [x, 0.5, 0], R, r: 0.014, rot: [0, 0, 90], col: "wave", k: 0 })),
      ...[[0.16, 0.1], [0.84, -0.04], [0.28, -0.14], [0.72, 0.14]].map(([y, z]): Shape => ({ t: "cap", a: [-0.56, y, z], b: [-0.84, y, z], r: [0.016, 0.006], col: "cyan", k: 0 })),
    ], "y", 8),
    eyes: [],
  },

  // MARK: Furia

  // Embate Frontal: an orange fist rams into a sack-dummy minion, knocking it back with an impact burst.
  "embate-frontal": {
    palette: { ...FUR, sack: "#8a7aa6", sack2: "#6b5d86", wood: "#8a5232", rope: "#d9b56f", cuff: "#fff1d8" },
    glow: ["yellow"],
    shapes: [
      { t: "ell", c: [0.36, 0.03, 0], r: [0.18, 0.03, 0.15], col: "wood" },
      { t: "cap", a: [0.36, 0.03, 0], b: [0.36, 0.3, 0], r: [0.035, 0.035], col: "wood" },
      ...spin([
        { t: "ell", c: [0.36, 0.52, 0], r: [0.19, 0.25, 0.18], col: "sack", k: 0.04 },
        { t: "tor", c: [0.36, 0.42, 0], R: 0.18, r: 0.022, col: "rope", k: 0.01 },
        { t: "ell", c: [0.36, 0.86, 0], r: [0.15, 0.14, 0.14], col: "sack", k: 0.05 },
        { t: "cap", a: [0.36, 0.62, 0.14], b: [0.36, 0.64, 0.32], r: [0.045, 0.04], col: "sack2", k: 0.03 },
        { t: "cap", a: [0.32, 0.97, 0.08], b: [0.36, 1.08, 0.12], r: [0.03, 0.012], col: "sack2", k: 0.02 },
        // X-eyes stitched on the face (camera side)
        { t: "cap", a: [0.38, 0.9, 0.12], b: [0.43, 0.85, 0.12], r: [0.011, 0.011], col: "dark", paint: true },
        { t: "cap", a: [0.38, 0.85, 0.12], b: [0.43, 0.9, 0.12], r: [0.011, 0.011], col: "dark", paint: true },
        { t: "cap", a: [0.28, 0.9, 0.12], b: [0.33, 0.85, 0.12], r: [0.011, 0.011], col: "dark", paint: true },
        { t: "cap", a: [0.28, 0.85, 0.12], b: [0.33, 0.9, 0.12], r: [0.011, 0.011], col: "dark", paint: true },
      ], "z", -18, [0.36, 0.3, 0]),
      // the punching arm
      { t: "cap", a: [-0.46, 0.5, 0.02], b: [-0.16, 0.55, 0.02], r: [0.085, 0.095], col: "red" },
      { t: "tor", c: [-0.2, 0.545, 0.02], R: 0.1, r: 0.03, rot: [0, 0, 84], col: "cuff", k: 0.01 },
      { t: "box", c: [-0.05, 0.56, 0.02], s: [0.1, 0.1, 0.11], round: 0.07, col: "orange", k: 0.04 },
      { t: "cap", a: [-0.08, 0.47, 0.1], b: [0.0, 0.52, 0.12], r: [0.04, 0.036], col: "orange", k: 0.03 },
      ...burst([0.11, 0.57, 0.12], 8, 0, 0.17, [0.04, 0.008], "yellow", { len: 0.1, r: [0.03, 0.008], col: "orange" }, 0.02),
      ...[0.42, 0.56, 0.7].map((y): Shape => ({ t: "cap", a: [-0.56, y, 0.15], b: [-0.78, y - 0.02, 0.15], r: [0.016, 0.006], col: "orange", k: 0 })),
    ],
    eyes: [],
  },

  // Furia Imparable: a fist thrust up, its blast splitting into two roaring shockwaves (two targets).
  "furia-imparable": {
    palette: { ...FUR, lava: "#ff5a1f" },
    glow: ["yellow", "orange", "lava"],
    shapes: [
      { t: "cap", a: [0, 0.0, 0], b: [0, 0.3, 0], r: [0.12, 0.135], col: "red" },
      { t: "tor", c: [0, 0.3, 0], R: 0.13, r: 0.03, col: "dark", k: 0.01 },
      { t: "box", c: [0, 0.43, 0], s: [0.14, 0.11, 0.12], round: 0.075, col: "red", k: 0.04 },
      ...[-0.1, -0.035, 0.035, 0.1].map((x): Shape => ({ t: "ell", c: [x, 0.53, 0.03], r: [0.04, 0.035, 0.08], col: "dark", k: 0.015 })),
      { t: "cap", a: [0.15, 0.4, 0.05], b: [0.06, 0.47, 0.12], r: [0.045, 0.04], col: "red", k: 0.03 },
      { t: "ell", c: [0, 0.64, 0], r: [0.12, 0.07, 0.1], col: "yellow", k: 0 },
      ...[-1, 1].flatMap((s): Shape[] => [
        { t: "cap", a: [0.04 * s, 0.68, 0], b: [0.36 * s, 0.98, 0], r: [0.06, 0.15], col: "lava", k: 0.05 },
        { t: "cap", a: [0.04 * s, 0.68, 0.05], b: [0.33 * s, 0.95, 0.08], r: [0.035, 0.09], col: "yellow", paint: true },
        ...burst([0.38 * s, 1.0, 0], 7, 45, 0.17, [0.05, 0.01], "orange", { len: 0.11, r: [0.04, 0.01], col: "yellow" }, 0.03),
        spike([0.2 * s, 0.82, 0], s > 0 ? 10 : 170, 0.2, [0.03, 0.006], "orange", 0),
        spike([0.2 * s, 0.82, 0], s > 0 ? 75 : 105, 0.18, [0.03, 0.006], "orange", 0),
      ]),
      dot([0.3, 0.55, 0.1], 0.025, "yellow"),
      dot([-0.32, 0.5, 0.05], 0.03, "orange"),
    ],
    eyes: [],
  },

  // ¡Por Aurelia!: a raised red banner of the city with a golden tower, gripped by a gloved fist.
  "por-aurelia": {
    palette: { ...FUR, banner: "#c8302a", gold: "#f0b23e", wood: "#8a5232", glove: "#7a3a2a" },
    glow: [],
    shapes: [
      { t: "cap", a: [0, 0.0, 0], b: [0, 1.0, 0], r: [0.025, 0.025], col: "wood" },
      { t: "ell", c: [0, 1.02, 0], r: [0.045, 0.045, 0.045], col: "gold", k: 0.02 },
      { t: "cap", a: [0, 1.04, 0], b: [0, 1.14, 0], r: [0.025, 0.004], col: "gold", k: 0.02 },
      { t: "box", c: [0.24, 0.98, 0], s: [0.26, 0.018, 0.018], round: 0.01, col: "gold", k: 0.02 },
      ...flag(0.02, 0.76, 0.5, 0.42, "banner", 8),
      // gold tower emblem painted on the cloth
      { t: "box", c: [0.27, 0.72, 0], s: [0.06, 0.09, 0.12], round: 0.005, col: "gold", paint: true },
      ...[-0.06, 0, 0.06].map((dx): Shape => ({ t: "box", c: [0.27 + dx, 0.84, 0], s: [0.018, 0.03, 0.12], round: 0.004, col: "gold", paint: true })),
      { t: "box", c: [0.27, 0.69, 0], s: [0.022, 0.04, 0.13], round: 0.01, col: "banner", paint: true },
      { t: "box", c: [0.27, 0.54, 0], s: [0.26, 0.018, 0.12], round: 0.005, col: "gold", paint: true },
      // fist gripping the pole
      { t: "ell", c: [0.0, 0.26, 0.02], r: [0.09, 0.11, 0.09], col: "glove", k: 0.02 },
      { t: "cap", a: [0.0, 0.22, 0.04], b: [-0.18, 0.0, 0.06], r: [0.07, 0.08], col: "red", k: 0.04 },
      ...[0.31, 0.26, 0.21].map((y): Shape => ({ t: "ell", c: [0.07, y, 0.04], r: [0.035, 0.026, 0.05], col: "glove", k: 0.01 })),
    ],
    eyes: [],
  },

  // Persecución: a red running boot mid-stride, speed streaks and glowing footprints trailing behind.
  persecucion: {
    palette: { ...FUR, sole: "#3a2a2a", lace: "#fff1d8", dust: "#e8d3b8" },
    glow: ["orange", "yellow"],
    shapes: [
      ...spin([
        { t: "box", c: [0.04, 0.3, 0], s: [0.24, 0.035, 0.1], round: 0.03, col: "sole" },
        { t: "ell", c: [0.06, 0.38, 0], r: [0.22, 0.1, 0.1], col: "red", k: 0.04 },
        { t: "cap", a: [-0.1, 0.4, 0], b: [-0.13, 0.7, 0], r: [0.1, 0.09], col: "red", k: 0.05 },
        { t: "tor", c: [-0.13, 0.7, 0], R: 0.09, r: 0.035, col: "lace", k: 0.01 },
        { t: "ell", c: [0.2, 0.36, 0], r: [0.08, 0.08, 0.1], col: "lace", paint: true },
        ...[0, 1, 2].map((i): Shape => ({ t: "cap", a: [0.02 - i * 0.06, 0.48 + i * 0.05, 0.06], b: [0.02 - i * 0.06, 0.48 + i * 0.05, 0.1], r: [0.018, 0.018], col: "lace", paint: true })),
        { t: "cap", a: [-0.12, 0.42, 0.1], b: [0.18, 0.4, 0.1], r: [0.018, 0.018], col: "yellow", paint: true },
      ], "z", 22, [0, 0.35, 0]),
      ...[[0.38, 0.06], [0.5, 0.0], [0.62, 0.08], [0.74, 0.02]].map(([y, z], i): Shape => ({ t: "cap", a: [-0.3, y, z], b: [-0.52 + i * 0.04, y, z], r: [0.02, 0.006], col: "orange", k: 0 })),
      ...[[-0.22, 0.14], [-0.44, -0.06]].flatMap(([x, z]): Shape[] => [
        { t: "ell", c: [x, 0.0, z], r: [0.07, 0.012, 0.04], col: "orange", k: 0 },
        { t: "ell", c: [x - 0.1, 0.0, z], r: [0.035, 0.012, 0.032], col: "orange", k: 0 },
      ]),
      { t: "ell", c: [-0.22, 0.2, 0], r: [0.07, 0.06, 0.07], col: "dust", k: 0 },
      { t: "ell", c: [-0.32, 0.16, 0.04], r: [0.05, 0.045, 0.05], col: "dust", k: 0 },
    ],
    eyes: [],
  },

  // Botiquín de Campo: a sturdy red field medkit with a white cross, metal latches and a bandage roll.
  "botiquin-campo": {
    palette: { ...FUR, white: "#fbf6ee", metal: "#c3c9d4", band: "#8f2a22" },
    glow: [],
    shapes: [
      { t: "box", c: [0, 0.27, 0], s: [0.34, 0.22, 0.17], round: 0.07, col: "red" },
      { t: "box", c: [0, 0.38, 0], s: [0.35, 0.018, 0.18], round: 0.01, col: "band", paint: true },
      { t: "box", c: [-0.02, 0.24, 0.17], s: [0.045, 0.13, 0.04], round: 0.01, col: "white", paint: true },
      { t: "box", c: [-0.02, 0.24, 0.17], s: [0.13, 0.045, 0.04], round: 0.01, col: "white", paint: true },
      { t: "tor", c: [0, 0.5, 0], R: 0.11, r: 0.028, rot: [90, 0, 0], col: "dark", k: 0.01 },
      ...[-0.25, 0.25].map((x): Shape => ({ t: "box", c: [x, 0.38, 0.17], s: [0.035, 0.05, 0.02], round: 0.012, col: "metal", k: 0.01 })),
      { t: "box", c: [0, 0.06, 0.0], s: [0.33, 0.02, 0.16], round: 0.01, col: "band", paint: true },
      { t: "cap", a: [0.36, 0.08, 0.14], b: [0.36, 0.08, 0.32], r: [0.08, 0.08], col: "white", k: 0.0 },
      { t: "ell", c: [0.36, 0.08, 0.32], r: [0.03, 0.03, 0.01], col: "metal", paint: true },
      { t: "box", c: [0.22, 0.008, 0.25], s: [0.14, 0.008, 0.05], round: 0.006, rot: [0, 20, 0], col: "white", k: 0.0 },
    ],
    eyes: [],
  },

  // Instinto de Combate: a snarling fiery wolf head with glowing instinct eyes.
  "instinto-combate": {
    palette: { ...FUR, fur: "#c9512f", fur2: "#8e2f22", eye: "#ffe25a", fang: "#fff7e6" },
    glow: ["eye"],
    shapes: spin([
      { t: "ell", c: [0, 0.5, 0], r: [0.22, 0.22, 0.2], col: "fur" },
      { t: "cap", a: [0.1, 0.46, 0], b: [0.36, 0.4, 0], r: [0.11, 0.07], col: "fur", k: 0.06 },
      { t: "ell", c: [0.42, 0.42, 0], r: [0.04, 0.035, 0.045], col: "dark", k: 0.02 },
      { t: "ell", c: [0.22, 0.36, 0], r: [0.16, 0.06, 0.12], col: "cream", paint: true },
      { t: "cap", a: [0.18, 0.34, 0], b: [0.34, 0.31, 0], r: [0.06, 0.04], col: "cream", k: 0.03 },
      { t: "cap", a: [0.31, 0.33, 0.035], b: [0.32, 0.26, 0.04], r: [0.015, 0.004], col: "fang", mirror: true, k: 0.005 },
      { t: "cap", a: [-0.02, 0.64, 0.11], b: [-0.08, 0.95, 0.15], r: [0.085, 0.015], col: "fur", mirror: true, k: 0.04 },
      { t: "cap", a: [0.02, 0.68, 0.11], b: [-0.05, 0.88, 0.14], r: [0.04, 0.01], col: "fur2", paint: true, mirror: true },
      ...[[0.42, 0.18], [0.3, 0.2], [0.2, 0.18], [0.55, 0.14]].map(([y, z]): Shape => ({ t: "cap", a: [-0.08, y, z], b: [-0.32, y - 0.1, z + 0.06], r: [0.07, 0.015], col: "fur2", mirror: true, k: 0.04 })),
      { t: "cap", a: [-0.1, 0.62, 0], b: [-0.38, 0.6, 0], r: [0.08, 0.015], col: "fur2", k: 0.04 },
      { t: "ell", c: [0.15, 0.56, 0.1], r: [0.045, 0.022, 0.04], rot: [0, 0, -18], col: "eye", mirror: true, k: 0.0 },
      { t: "cap", a: [0.08, 0.61, 0.11], b: [0.2, 0.59, 0.1], r: [0.025, 0.02], col: "fur2", mirror: true, k: 0.02 },
    ], "y", -38),
    eyes: [],
  },

  // Sala de Entrenamiento: a wooden training dummy with a red target on its chest, a dumbbell at its foot.
  "sala-entrenamiento": {
    palette: { ...FUR, wood: "#b9824a", wood2: "#7c5230", white: "#fbf6ee", iron: "#4b4f5c" },
    glow: [],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.28, 0.045, 0.28], col: "wood2" },
      { t: "cap", a: [0, 0.05, 0], b: [0, 0.86, 0], r: [0.13, 0.11], col: "wood", k: 0.04 },
      { t: "tor", c: [0, 0.2, 0], R: 0.125, r: 0.022, col: "wood2", k: 0.01 },
      { t: "tor", c: [0, 0.55, 0], R: 0.12, r: 0.02, col: "wood2", k: 0.01 },
      ...[-1, 1].map((s): Shape => ({ t: "cap", a: [0.07 * s, 0.68, 0.06], b: [0.2 * s, 0.66, 0.3], r: [0.035, 0.03], col: "wood2", k: 0.02 })),
      { t: "cap", a: [0, 0.42, 0.08], b: [0.0, 0.35, 0.33], r: [0.035, 0.03], col: "wood2", k: 0.02 },
      { t: "ell", c: [0, 0.75, 0.12], r: [0.1, 0.1, 0.06], col: "red", paint: true },
      { t: "ell", c: [0, 0.75, 0.12], r: [0.066, 0.066, 0.06], col: "white", paint: true },
      { t: "ell", c: [0, 0.75, 0.12], r: [0.034, 0.034, 0.06], col: "red", paint: true },
      { t: "cap", a: [0.22, 0.06, 0.24], b: [0.48, 0.06, 0.12], r: [0.02, 0.02], col: "iron", k: 0 },
      { t: "ell", c: [0.24, 0.06, 0.23], r: [0.035, 0.06, 0.06], rot: [0, 25, 0], col: "red", k: 0.01 },
      { t: "ell", c: [0.46, 0.06, 0.13], r: [0.035, 0.06, 0.06], rot: [0, 25, 0], col: "red", k: 0.01 },
    ],
    eyes: [],
  },

  // MARK: Recursos

  // Célula de Energía: a fat yellow battery cell with a dark lightning bolt and crackling sparks.
  "celula-energia": {
    palette: { cell: "#ffd23a", band: "#3a3440", ti: "#c9ced6", bolt: "#3a3440", spark: "#fff27a" },
    glow: ["spark"],
    shapes: [
      { t: "box", c: [0, 0.42, 0], s: [0.22, 0.38, 0.22], round: 0.18, col: "cell" },
      { t: "box", c: [0, 0.1, 0], s: [0.23, 0.07, 0.23], round: 0.1, col: "band", paint: true },
      { t: "cap", a: [0, 0.78, 0], b: [0, 0.86, 0], r: [0.08, 0.07], col: "ti", k: 0.02 },
      ...path([[0.06, 0.66, 0.22], [-0.06, 0.45, 0.22], [0.06, 0.45, 0.22], [-0.05, 0.22, 0.22]], 0.04, 0.02, "bolt", 0.02, true),
      ...path([[0.34, 0.72, 0.05], [0.42, 0.62, 0.05], [0.38, 0.6, 0.05], [0.46, 0.5, 0.05]], 0.022, 0.01, "spark", 0.01),
      ...path([[-0.34, 0.5, 0.05], [-0.42, 0.42, 0.05], [-0.37, 0.4, 0.05], [-0.44, 0.3, 0.05]], 0.02, 0.01, "spark", 0.01),
      dot([0.12, 0.98, 0.05], 0.03, "spark"),
      dot([-0.2, 0.92, 0], 0.022, "spark"),
    ],
    eyes: [],
  },

  // Chispa de Genio: a glowing blue light bulb on a brass screw base, rays of insight around it.
  "chispa-genio": {
    palette: { glass: "#6fb8ff", core: "#bfe4ff", hot: "#ffffff", brass: "#e0a94a", dark: "#3a3440", ray: "#4fa8ff" },
    glow: ["glass", "core", "hot", "ray"],
    shapes: [
      { t: "ell", c: [0, 0.6, 0], r: [0.26, 0.27, 0.26], col: "glass" },
      { t: "cap", a: [0, 0.44, 0], b: [0, 0.3, 0], r: [0.17, 0.12], col: "glass", k: 0.08 },
      { t: "ell", c: [0, 0.58, 0.2], r: [0.13, 0.13, 0.1], col: "core", paint: true },
      { t: "ell", c: [0, 0.58, 0.22], r: [0.06, 0.06, 0.06], col: "hot", paint: true },
      { t: "ell", c: [-0.1, 0.72, 0.22], r: [0.07, 0.06, 0.08], col: "hot", paint: true },
      { t: "cap", a: [0, 0.12, 0], b: [0, 0.29, 0], r: [0.12, 0.12], col: "brass", k: 0.02 },
      ...[0.15, 0.2, 0.25].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.12, r: 0.02, col: "brass", k: 0.01 })),
      { t: "ell", c: [0, 0.06, 0], r: [0.07, 0.05, 0.07], col: "dark", k: 0.02 },
      ...[0, 35, 70, 110, 145, 180, -30, -150].map((a): Shape => ({
        t: "cap", a: [0.37 * Math.cos(rad(a)), 0.6 + 0.37 * Math.sin(rad(a)), 0], b: [0.5 * Math.cos(rad(a)), 0.6 + 0.5 * Math.sin(rad(a)), 0], r: [0.025, 0.012], col: "ray", k: 0,
      })),
    ],
    eyes: [],
  },

  // Pulso de Fuerza: an arm flexing a bulging bicep in front of a red burst of raw power.
  "pulso-fuerza": {
    palette: { skin: "#f4c9a4", skin2: "#d99f76", wrap: "#d8402e", pulse: "#ff4a2a", hot: "#ffb07a" },
    glow: ["pulse", "hot"],
    shapes: [
      ...burst([-0.06, 0.52, -0.22], 10, 90, 0.5, [0.1, 0.02], "pulse", { len: 0.36, r: [0.08, 0.02], col: "hot" }, 0.06),
      { t: "ell", c: [-0.06, 0.52, -0.22], r: [0.24, 0.24, 0.06], col: "pulse", k: 0.06 },
      { t: "ell", c: [-0.4, 0.3, 0], r: [0.13, 0.13, 0.12], col: "wrap" },
      { t: "cap", a: [-0.36, 0.3, 0], b: [0.04, 0.3, 0], r: [0.11, 0.1], col: "skin", k: 0.04 },
      { t: "ell", c: [-0.14, 0.42, 0.02], r: [0.17, 0.14, 0.12], col: "skin", k: 0.06 },
      { t: "cap", a: [0.05, 0.3, 0], b: [0.12, 0.64, 0], r: [0.105, 0.09], col: "skin", k: 0.06 },
      { t: "tor", c: [0.12, 0.66, 0], R: 0.095, r: 0.035, col: "wrap", k: 0.01 },
      { t: "box", c: [0.13, 0.79, 0], s: [0.11, 0.1, 0.1], round: 0.07, col: "skin", k: 0.04 },
      ...[-0.07, 0, 0.07].map((x): Shape => ({ t: "ell", c: [0.13 + x, 0.87, 0.045], r: [0.035, 0.03, 0.065], col: "skin2", k: 0.012 })),
      { t: "cap", a: [0.22, 0.77, 0.06], b: [0.17, 0.84, 0.1], r: [0.04, 0.035], col: "skin", k: 0.02 },
      { t: "ell", c: [-0.12, 0.5, 0.1], r: [0.06, 0.035, 0.03], col: "hot", paint: true },
    ],
    eyes: [],
  },

  // MARK: Liderazgo

  // Hacer la Llamada: a blue rotary telephone, the gold handset jumping off its cradle as it rings.
  "hacer-llamada": {
    palette: { ...LID, cream: "#fff3d6", ring: "#ffd36a" },
    glow: ["ring"],
    shapes: [
      { t: "box", c: [0, 0.17, 0], s: [0.32, 0.15, 0.22], round: 0.09, col: "blue" },
      { t: "ell", c: [0, 0.3, 0], r: [0.26, 0.08, 0.18], col: "blue", k: 0.06 },
      { t: "ell", c: [0, 0.2, 0.22], r: [0.14, 0.14, 0.035], col: "gold", k: 0.02 },
      ...[30, 70, 110, 150, 190, 230, 270, 310].map((a): Shape => ({ t: "ell", c: [0.095 * Math.cos(rad(a)), 0.2 + 0.095 * Math.sin(rad(a)), 0.25], r: [0.022, 0.022, 0.02], col: "dark", paint: true })),
      { t: "ell", c: [0, 0.2, 0.25], r: [0.045, 0.045, 0.02], col: "cream", paint: true },
      ...[-0.2, 0.2].map((x): Shape => ({ t: "cap", a: [x, 0.34, 0], b: [x, 0.42, 0], r: [0.035, 0.03], col: "dark", k: 0.02 })),
      ...spin([
        { t: "cap", a: [-0.24, 0.55, 0], b: [0.24, 0.55, 0], r: [0.05, 0.05], col: "gold" },
        { t: "ell", c: [-0.27, 0.5, 0], r: [0.09, 0.07, 0.1], col: "gold", k: 0.04 },
        { t: "ell", c: [0.27, 0.5, 0], r: [0.09, 0.07, 0.1], col: "gold", k: 0.04 },
      ], "z", 10, [0, 0.52, 0]),
      ...path(arc([-0.42, 0.56], 0.12, 125, 235, 5, 0), 0.018, 0.018, "ring", 0.01),
      ...path(arc([-0.42, 0.56], 0.22, 130, 230, 5, 0), 0.018, 0.018, "ring", 0.01),
      ...path(arc([0.46, 0.66], 0.12, -55, 55, 5, 0), 0.018, 0.018, "ring", 0.01),
      ...path(arc([0.46, 0.66], 0.22, -50, 50, 5, 0), 0.018, 0.018, "ring", 0.01),
    ],
    eyes: [],
  },

  // Arenga: a blue-and-gold megaphone tilted up, a golden glow of inspiration pouring from its mouth.
  arenga: {
    palette: { ...LID, inner: "#13204a", ray: "#ffd36a" },
    glow: ["ray"],
    shapes: spin([
      { t: "cap", a: [-0.25, 0.5, 0], b: [0.18, 0.5, 0], r: [0.07, 0.22], col: "blue" },
      { t: "ell", c: [0.36, 0.5, 0], r: [0.16, 0.2, 0.2], col: "inner", cut: true, k: 0.02 },
      { t: "tor", c: [0.22, 0.5, 0], R: 0.215, r: 0.035, rot: [0, 0, 90], col: "gold", k: 0.02 },
      { t: "tor", c: [-0.06, 0.5, 0], R: 0.13, r: 0.022, rot: [0, 0, 90], col: "gold", k: 0.01 },
      { t: "ell", c: [-0.3, 0.5, 0], r: [0.06, 0.07, 0.07], col: "gold", k: 0.03 },
      { t: "cap", a: [-0.12, 0.42, 0], b: [-0.16, 0.18, 0], r: [0.045, 0.05], col: "dark", k: 0.03 },
      { t: "cap", a: [-0.08, 0.38, 0], b: [-0.06, 0.32, 0], r: [0.02, 0.02], col: "gold", k: 0.01 },
      { t: "ell", c: [0.17, 0.5, 0], r: [0.03, 0.15, 0.15], col: "ray", k: 0 },
      ...[-36, -18, 0, 18, 36].map((a) => spike([0.3 + 0.08 * Math.cos(rad(a)), 0.5 + 0.08 * Math.sin(rad(a)), 0], a, a === 0 ? 0.32 : 0.24, [0.04, 0.01], "ray", 0)),
    ], "z", 20, [0, 0.5, 0]).map((s) => s).concat(...[[0.56, 0.98], [0.66, 0.42]].map(([x, y]) => [dot([x, y, 0.05], 0.03, "ray")])),
    eyes: [],
  },

  // Liderar con el Ejemplo: a blue banner with a gold star planted on top of a green hill.
  "liderar-ejemplo": {
    palette: { ...LID, grass: "#5f9e4a", grass2: "#477d38", rock: "#9a9488" },
    glow: [],
    shapes: [
      { t: "ell", c: [0, 0.0, 0], r: [0.5, 0.26, 0.42], col: "grass" },
      { t: "ell", c: [-0.2, 0.14, 0.2], r: [0.12, 0.06, 0.1], col: "grass2", paint: true },
      { t: "ell", c: [0.25, 0.1, 0.25], r: [0.07, 0.05, 0.06], col: "rock", k: 0.02 },
      { t: "ell", c: [-0.3, 0.08, 0.28], r: [0.06, 0.045, 0.05], col: "rock", k: 0.02 },
      { t: "cap", a: [-0.05, 0.2, 0], b: [-0.05, 1.0, 0], r: [0.024, 0.022], col: "wood" },
      { t: "ell", c: [-0.05, 1.02, 0], r: [0.045, 0.045, 0.045], col: "gold", k: 0.02 },
      ...flag(-0.03, 0.82, 0.48, 0.32, "blue", 7, 0.04),
      ...[90, 162, 234, 306, 18].map((a): Shape => ({ t: "cap", a: [0.21, 0.79, 0], b: [0.21 + 0.09 * Math.cos(rad(a)), 0.79 + 0.09 * Math.sin(rad(a)), 0], r: [0.035, 0.008], col: "gold", paint: true })),
      { t: "box", c: [0.21, 0.79, 0], s: [0.04, 0.04, 0.12], round: 0.03, col: "gold", paint: true },
    ],
    eyes: [],
  },

  // Toque de Reunión: a brass bugle with a blue pennant hanging from it, golden sound waves rising.
  "toque-reunion": {
    palette: { ...LID, brass: "#e8b33e", inner: "#7a5014", note: "#ffd36a" },
    glow: ["note"],
    shapes: spin([
      { t: "ell", c: [-0.42, 0.56, 0], r: [0.03, 0.04, 0.04], col: "brass" },
      { t: "cap", a: [-0.42, 0.56, 0], b: [0.04, 0.56, 0], r: [0.028, 0.03], col: "brass", k: 0.02 },
      { t: "cap", a: [0.02, 0.56, 0], b: [0.3, 0.58, 0], r: [0.035, 0.15], col: "brass", k: 0.03 },
      { t: "ell", c: [0.42, 0.58, 0], r: [0.12, 0.13, 0.13], col: "inner", cut: true, k: 0.02 },
      { t: "tor", c: [0.31, 0.58, 0], R: 0.145, r: 0.022, rot: [0, 0, 90], col: "brass", k: 0.01 },
      { t: "box", c: [-0.17, 0.42, 0], s: [0.19, 0.13, 0.014], round: 0.012, col: "blue", k: 0.02 },
      ...[-0.31, -0.17, -0.03].map((x): Shape => ({ t: "cap", a: [x, 0.3, 0], b: [x, 0.24, 0], r: [0.035, 0.012], col: "gold", k: 0.02 })),
      { t: "box", c: [-0.17, 0.3, 0], s: [0.19, 0.018, 0.025], round: 0.01, col: "gold", k: 0.02 },
      ...[90, 162, 234, 306, 18].map((a): Shape => ({ t: "cap", a: [-0.17, 0.43, 0], b: [-0.17 + 0.065 * Math.cos(rad(a)), 0.43 + 0.065 * Math.sin(rad(a)), 0], r: [0.026, 0.006], col: "gold", paint: true })),
      { t: "box", c: [-0.17, 0.43, 0], s: [0.03, 0.03, 0.05], round: 0.02, col: "gold", paint: true },
      ...path(arc([0.33, 0.58], 0.24, -45, 45, 5, 0), 0.02, 0.02, "note", 0.01),
      ...path(arc([0.33, 0.58], 0.36, -40, 40, 5, 0), 0.02, 0.02, "note", 0.01),
    ], "z", 12, [0, 0.5, 0]),
    eyes: [],
  },

  // Plan de Equipo: a round war table with a painted map, team pawns and a red threat marker.
  "plan-equipo": {
    palette: { ...LID, map: "#f0dca8", sea: "#7cb4e0", land: "#9cc77a", route: "#c8302a", enemy: "#c8302a" },
    glow: [],
    shapes: spin([
      { t: "ell", c: [0, 0.42, 0], r: [0.48, 0.05, 0.4], col: "wood" },
      { t: "tor", c: [0, 0.42, 0], R: 0.4, r: 0.05, col: "wood", k: 0.02 },
      { t: "ell", c: [0, 0.44, 0], r: [0.4, 0.04, 0.34], col: "map", k: 0.01 },
      { t: "ell", c: [-0.2, 0.47, -0.1], r: [0.14, 0.05, 0.12], col: "sea", paint: true },
      { t: "ell", c: [0.22, 0.47, 0.14], r: [0.12, 0.05, 0.08], col: "land", paint: true },
      { t: "cap", a: [-0.25, 0.48, 0.18], b: [0.0, 0.48, 0.05], r: [0.012, 0.012], col: "route", paint: true },
      { t: "cap", a: [0.0, 0.48, 0.05], b: [0.18, 0.48, -0.12], r: [0.012, 0.012], col: "route", paint: true },
      { t: "cap", a: [0, 0.38, 0], b: [0, 0.08, 0], r: [0.07, 0.09], col: "wood", k: 0.04 },
      { t: "ell", c: [0, 0.04, 0], r: [0.24, 0.04, 0.24], col: "dark", k: 0.03 },
      // pawns
      ...[[-0.18, 0.18, "blue"], [-0.06, 0.24, "gold"], [0.08, 0.2, "blue2"]].flatMap(([x, z, c]): Shape[] => [
        { t: "cap", a: [x as number, 0.47, z as number], b: [x as number, 0.58, z as number], r: [0.045, 0.025], col: c as string, k: 0.02 },
        { t: "ell", c: [x as number, 0.62, z as number], r: [0.035, 0.035, 0.035], col: c as string, k: 0.02 },
      ]),
      { t: "box", c: [0.2, 0.52, -0.1], s: [0.045, 0.05, 0.045], round: 0.01, rot: [0, 30, 0], col: "enemy", k: 0.01 },
      { t: "cap", a: [0.0, 0.47, 0.05], b: [0.0, 0.68, 0.05], r: [0.01, 0.01], col: "dark", k: 0.01 },
      { t: "box", c: [0.06, 0.64, 0.05], s: [0.06, 0.035, 0.008], round: 0.006, col: "gold", k: 0.01 },
    ], "x", 18, [0, 0.42, 0]),
    eyes: [],
  },

  // MARK: Protección

  // Bloqueo Perfecto: a steel-blue heater shield taking a hit dead-on, the impact bursting harmlessly off it.
  "bloqueo-perfecto": {
    palette: { ...PRO, spark: "#ffe07a", hit: "#fff6d6" },
    glow: ["spark", "hit", "glow"],
    shapes: [
      { t: "box", c: [0, 0.7, 0], s: [0.3, 0.18, 0.06], round: 0.05, col: "silver" },
      { t: "ell", c: [0, 0.5, 0], r: [0.3, 0.44, 0.06], col: "silver", k: 0.02 },
      { t: "box", c: [0, 0.7, 0.02], s: [0.26, 0.15, 0.06], round: 0.04, col: "steel", paint: true },
      { t: "ell", c: [0, 0.5, 0.02], r: [0.26, 0.39, 0.07], col: "steel", paint: true },
      { t: "box", c: [0, 0.52, 0.06], s: [0.035, 0.36, 0.03], round: 0.02, col: "silver", k: 0.02 },
      { t: "box", c: [0, 0.68, 0.06], s: [0.24, 0.035, 0.03], round: 0.02, col: "silver", k: 0.02 },
      { t: "ell", c: [0, 0.68, 0.08], r: [0.07, 0.07, 0.04], col: "steel2", k: 0.02 },
      ...burst([0.1, 0.6, 0.18], 8, 15, 0.22, [0.045, 0.008], "spark", { len: 0.14, r: [0.035, 0.008], col: "hit" }, 0.02),
      { t: "ell", c: [0.1, 0.6, 0.18], r: [0.06, 0.06, 0.04], col: "hit", k: 0.02 },
    ],
    eyes: [],
  },

  // Desvío y Réplica: a round buckler bouncing a purple enemy bolt back as a blue counter-bolt.
  desvio: {
    palette: { ...PRO, bad: "#b05cff", good: "#7fd8ff", hot: "#f2fbff" },
    glow: ["bad", "good", "hot"],
    shapes: [
      ...spin([
        { t: "ell", c: [0, 0.45, 0], r: [0.31, 0.31, 0.07], col: "steel" },
        { t: "tor", c: [0, 0.45, 0.01], R: 0.3, r: 0.035, rot: [90, 0, 0], col: "silver", k: 0.02 },
        { t: "ell", c: [0, 0.45, 0.05], r: [0.08, 0.08, 0.06], col: "silver", k: 0.03 },
        ...[0, 90, 180, 270].map((a): Shape => ({ t: "ell", c: [0.2 * Math.cos(rad(a)), 0.45 + 0.2 * Math.sin(rad(a)), 0.06], r: [0.025, 0.025, 0.02], col: "silver", k: 0.01 })),
      ], "y", 25, [0, 0.45, 0]),
      ...path([[-0.62, 1.0, 0.25], [-0.45, 0.86, 0.2], [-0.4, 0.92, 0.2], [-0.2, 0.7, 0.16], [-0.06, 0.58, 0.12]], 0.035, 0.02, "bad", 0.015),
      ...path([[0.06, 0.58, 0.12], [0.22, 0.74, 0.16], [0.28, 0.7, 0.18], [0.48, 0.9, 0.22]], 0.025, 0.04, "good", 0.015),
      { t: "cap", a: [0.6, 1.02, 0.24], b: [0.42, 0.98, 0.22], r: [0.012, 0.07], col: "good", k: 0.01 },
      { t: "ell", c: [0, 0.57, 0.12], r: [0.06, 0.06, 0.04], col: "hot", k: 0.01 },
      ...burst([0, 0.57, 0.12], 6, 0, 0.12, [0.03, 0.006], "hot", undefined, 0.01),
    ],
    eyes: [],
  },

  // Aguantar el Golpe: an armoured forearm braced upright, open palm facing out, shock rings breaking against it.
  "aguantar-golpe": {
    palette: { ...PRO, skin: "#f4c9a4", skin2: "#d99f76", ring: "#7fc8ff" },
    glow: ["ring"],
    shapes: [
      { t: "cap", a: [0, 0.0, 0], b: [0, 0.48, 0], r: [0.11, 0.12], col: "steel" },
      ...[0.06, 0.24, 0.44].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.115, r: 0.025, col: "silver", k: 0.01 })),
      { t: "ell", c: [0, 0.3, 0.11], r: [0.06, 0.08, 0.03], col: "silver", k: 0.02 },
      { t: "box", c: [0, 0.6, 0], s: [0.12, 0.11, 0.05], round: 0.05, col: "skin", k: 0.04 },
      ...[-0.08, -0.027, 0.027, 0.08].map((x, i): Shape => ({ t: "cap", a: [x, 0.66, 0.0], b: [x * 1.15, 0.84 + (i === 1 || i === 2 ? 0.03 : 0), 0.0], r: [0.033, 0.028], col: "skin", k: 0.015 })),
      { t: "cap", a: [0.1, 0.56, 0.01], b: [0.21, 0.7, 0.02], r: [0.036, 0.03], col: "skin", k: 0.03 },
      { t: "ell", c: [0, 0.6, 0.045], r: [0.06, 0.06, 0.02], col: "skin2", paint: true },
      ...[0, 35, 70, 110, 145, 180].map((a) => spike([0.27 * Math.cos(rad(a)), 0.68 + 0.27 * Math.sin(rad(a)), 0.02], a, 0.12, [0.026, 0.008], "ring", 0)),
      ...[200, 340].map((a) => spike([0.24 * Math.cos(rad(a)), 0.68 + 0.24 * Math.sin(rad(a)), 0.02], a, 0.09, [0.022, 0.008], "ring", 0)),
    ],
    eyes: [],
  },

  // Coraza de Púas: a steel-blue breastplate and pauldrons bristling with silver spikes.
  "coraza-puas": {
    palette: { ...PRO, spike: "#e8eef6", belt: "#6b4a2e" },
    glow: [],
    shapes: [
      { t: "ell", c: [0, 0.5, 0], r: [0.3, 0.36, 0.2], col: "steel" },
      { t: "cap", a: [0, 0.36, 0], b: [0, 0.12, 0], r: [0.24, 0.2], col: "steel", k: 0.08 },
      { t: "ell", c: [0, 0.86, 0], r: [0.13, 0.1, 0.3], col: "steel", cut: true, k: 0.04 },
      { t: "box", c: [0, 0.12, 0], s: [0.24, 0.035, 0.24], round: 0.03, col: "belt", paint: true },
      { t: "box", c: [0, 0.55, 0.2], s: [0.025, 0.28, 0.05], round: 0.02, col: "steel2", paint: true },
      ...[-1, 1].flatMap((s): Shape[] => [
        { t: "ell", c: [0.33 * s, 0.74, 0], r: [0.15, 0.1, 0.16], col: "steel2", k: 0.03 },
        spike([0.36 * s, 0.8, 0], s > 0 ? 60 : 120, 0.2, [0.045, 0.006], "spike", 0.02),
        spike([0.42 * s, 0.74, 0.06], s > 0 ? 20 : 160, 0.16, [0.04, 0.006], "spike", 0.02),
      ]),
      { t: "tor", c: [0, 0.8, 0], R: 0.13, r: 0.035, col: "silver", k: 0.02 },
      ...[0.3, 0.22].map((y): Shape => ({ t: "box", c: [0, y, 0.12], s: [0.26, 0.012, 0.12], round: 0.01, col: "dark", paint: true })),
      ...[[-0.2, 0.62], [0.2, 0.62], [-0.24, 0.42], [0.24, 0.42], [-0.1, 0.5], [0.1, 0.5], [0, 0.66]].map(([x, y]): Shape => {
        const zz = 0.2 * Math.sqrt(Math.max(0.05, 1 - (x / 0.3) ** 2 - ((y - 0.5) / 0.36) ** 2));
        const n = new THREE.Vector3(x * 7, (y - 0.5) * 6 + 0.4, 0.8).normalize();
        return { t: "cap", a: [x, y, zz - 0.03], b: [x + n.x * 0.17, y + n.y * 0.17, zz + n.z * 0.17], r: [0.045, 0.006], col: "spike", k: 0.02 };
      }),
    ],
    eyes: [],
  },

  // Armadura de Combate: a full suit of steel-blue armour displayed on a wooden stand.
  "armadura-combate": {
    palette: { ...PRO, wood: "#8a5a36", gold: "#f0b23e", visor: "#1c2433" },
    glow: [],
    shapes: [
      { t: "ell", c: [0, 0.04, 0], r: [0.28, 0.04, 0.22], col: "wood" },
      { t: "cap", a: [0, 0.05, 0], b: [0, 0.3, 0], r: [0.035, 0.035], col: "wood" },
      { t: "cap", a: [-0.14, 0.04, 0], b: [0.14, 0.04, 0], r: [0.03, 0.03], col: "wood", k: 0.02 },
      { t: "box", c: [0, 0.27, 0], s: [0.2, 0.09, 0.13], round: 0.06, col: "steel2", k: 0.02 },
      ...[-0.13, 0, 0.13].map((x): Shape => ({ t: "box", c: [x, 0.24, 0.13], s: [0.055, 0.08, 0.02], round: 0.02, col: "silver", k: 0.01 })),
      { t: "box", c: [0, 0.36, 0], s: [0.2, 0.025, 0.14], round: 0.02, col: "gold", paint: true },
      { t: "ell", c: [0, 0.54, 0], r: [0.25, 0.22, 0.16], col: "steel", k: 0.04 },
      { t: "box", c: [0, 0.55, 0.15], s: [0.025, 0.18, 0.04], round: 0.02, col: "silver", paint: true },
      { t: "box", c: [0, 0.5, 0.15], s: [0.2, 0.02, 0.04], round: 0.01, col: "steel2", paint: true },
      ...[-1, 1].map((s): Shape => ({ t: "ell", c: [0.28 * s, 0.68, 0], r: [0.13, 0.09, 0.14], col: "silver", k: 0.03 })),
      ...[-1, 1].map((s): Shape => ({ t: "ell", c: [0.3 * s, 0.6, 0], r: [0.1, 0.06, 0.12], col: "steel2", k: 0.02 })),
      { t: "cap", a: [0, 0.72, 0], b: [0, 0.8, 0], r: [0.08, 0.07], col: "dark", k: 0.03 },
      { t: "ell", c: [0, 0.92, 0], r: [0.14, 0.15, 0.14], col: "steel", k: 0.03 },
      { t: "box", c: [0, 0.91, 0.13], s: [0.1, 0.018, 0.05], round: 0.01, col: "visor", paint: true },
      { t: "box", c: [0, 0.86, 0.13], s: [0.015, 0.05, 0.05], round: 0.01, col: "visor", paint: true },
      { t: "cap", a: [0, 1.0, -0.12], b: [0, 1.08, 0.08], r: [0.02, 0.03], col: "gold", k: 0.03 },
    ],
    eyes: [],
  },

  // Voluntad de Hierro: an iron heart glowing blue through its seams, bound by a silver chain.
  "voluntad-hierro": {
    palette: { ...PRO, iron: "#5d6673", seam: "#7fd0ff", chain: "#c9d2de", chain2: "#9aa6b6" },
    glow: ["seam"],
    shapes: [
      { t: "ell", c: [-0.14, 0.62, 0], r: [0.2, 0.2, 0.15], col: "iron" },
      { t: "ell", c: [0.14, 0.62, 0], r: [0.2, 0.2, 0.15], col: "iron", k: 0.08 },
      { t: "cap", a: [-0.14, 0.55, 0], b: [0, 0.14, 0], r: [0.18, 0.04], col: "iron", k: 0.08 },
      { t: "cap", a: [0.14, 0.55, 0], b: [0, 0.14, 0], r: [0.18, 0.04], col: "iron", k: 0.08 },
      ...path([[0.02, 0.74, 0.16], [-0.05, 0.6, 0.17], [0.05, 0.5, 0.17], [-0.03, 0.38, 0.16], [0.02, 0.26, 0.12]], 0.032, 0.02, "seam", 0.01, true),
      { t: "ell", c: [0.0, 0.52, 0.15], r: [0.06, 0.06, 0.04], col: "seam", paint: true },
      { t: "ell", c: [-0.18, 0.7, 0.12], r: [0.05, 0.035, 0.04], col: "steel2", paint: true },
      ...chainLinks([-0.5, 0.2, 0.17], [0.5, 0.82, 0.17], 9, 0.068, 0.024, "chain", "chain2"),
    ],
    eyes: [],
  },
};
