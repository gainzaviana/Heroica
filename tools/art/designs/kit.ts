import type { EyeSpec, Shape, V3 } from "../sculpt";

/**
 * Shared sculpting helpers for the card art (copied from the first designs so every new design
 * uses the same proportions): the chibi body, eyes and arms for characters, spikes and bursts for
 * energy, gears, and `turn` to rotate an object so its front (+x) faces the 3/4 camera.
 */

export const SKIN = "#f4c9a4";
export const SKIN_DARK = "#b67a52";
export const SKIN_DEEP = "#7a4a30";
export const rad = (d: number) => (d * Math.PI) / 180;

/** Chibi body: boots, legs, torso and head (head centre ≈ [0.02, 0.71, 0], radius ≈ 0.19). */
export function body(o: { torso?: V3; hips?: number } = {}): Shape[] {
  const t = o.torso ?? [0.13, 0.16, 0.15];
  return [
    { t: "ell", c: [0.03, 0.05, 0.075], r: [0.085, 0.055, 0.065], col: "boots", mirror: true },
    { t: "cap", a: [0, 0.08, 0.072], b: [0, 0.28, 0.068], r: [0.058, o.hips ?? 0.065], col: "legs", mirror: true },
    { t: "ell", c: [0, 0.4, 0], r: t, col: "torso" },
    { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
  ];
}

/** Two big eyes on the front of the face. */
export function eyes(iris: string, angry = false, y = 0.7, x = 0.02, r = 0.055): EyeSpec[] {
  return [
    { at: [x, y, 0.085], r, iris, angry, look: [0.75, 0.04, 0.6] },
    { at: [x, y, -0.045], r: r * 0.92, iris, angry, look: [0.97, 0.04, 0.22] },
  ];
}

/** An arm from the shoulder (z side `s`) to the hand, with a round hand/glove. */
export function arm(s: 1 | -1, hand: V3, col: string, glove: string, r = 0.045): Shape[] {
  return [
    { t: "cap", a: [0, 0.5, 0.15 * s], b: hand, r: [r + 0.005, r], col },
    { t: "ell", c: hand, r: [0.05, 0.05, 0.05], col: glove, k: 0.02 },
  ];
}

/** A tapered spike from c, at angle `ang` (degrees, in the xy plane), `len` long. */
export function spike(c: V3, ang: number, len: number, r: [number, number], col: string, k = 0.03): Shape {
  return { t: "cap", a: c, b: [c[0] + Math.cos(rad(ang)) * len, c[1] + Math.sin(rad(ang)) * len, c[2]], r, col, k };
}
/** n spikes evenly spread from `start` degrees, alternating long/short when `alt` is set. */
export function burst(c: V3, n: number, start: number, len: number, r: [number, number], col: string, alt?: { len: number; r: [number, number]; col: string }, k = 0.03): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (360 / n) * i;
    if (alt && i % 2 === 1) out.push(spike(c, a, alt.len, alt.r, alt.col, k));
    else out.push(spike(c, a, len, r, col, k));
  }
  return out;
}

/** An upright gear facing the camera (axis along z). */
export function gear(cx: number, cy: number, R: number, teeth: number, col: string, hub: string, z = 0, phase = 0): Shape[] {
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

/** Turns shapes about the vertical axis (degrees, same sense as the renderer's turn): use -55 to point +x at the camera. */
export function turn(shapes: Shape[], deg: number): Shape[] {
  const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t);
  const r = (v: V3): V3 => [co * v[0] + si * v[2], v[1], -si * v[0] + co * v[2]];
  return shapes.map((sh) => {
    const rot: V3 = sh.rot ? [sh.rot[0], sh.rot[1] + deg, sh.rot[2]] : [0, deg, 0];
    if (sh.t === "cap") return { ...sh, a: r(sh.a), b: r(sh.b) };
    return { ...sh, c: r(sh.c), rot };
  });
}

/** Faces the camera in the default 3/4 view. */
export const FRONT = -55;
