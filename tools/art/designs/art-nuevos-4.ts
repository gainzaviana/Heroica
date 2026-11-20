import * as THREE from "three";
import type { Sculpt, Shape, V3 } from "../sculpt";
import { arm, burst, eyes, rad } from "./kit";

// Baluarte, Custodio del Umbral and Sibila del Caos — art batch 4.
// Custodio del Umbral (Dra. Noa Ferrán): teal (#0f766e) robes with gold runes, a deep-blue cape,
// glowing teal rune circles (ring, rune ticks, a single triangle). Original designs only.

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

/** Points on a quadratic Bézier curve. */
function bez(p0: V3, p1: V3, p2: V3, n = 10): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1, 2].map((j) => u * u * p0[j] + 2 * u * t * p1[j] + t * t * p2[j]) as V3);
  }
  return out;
}

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

const D = 180 / Math.PI;
/** Rotates (Euler XYZ, degrees), scales and moves shapes; exact for every shape (no `mirror` inside). */
function xf(shapes: Shape[], rot: V3, s = 1, d: V3 = [0, 0, 0]): Shape[] {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(rot[0]), rad(rot[1]), rad(rot[2])));
  const p = (v: V3): V3 => { const w = new THREE.Vector3(v[0], v[1], v[2]).multiplyScalar(s).applyQuaternion(q); return [w.x + d[0], w.y + d[1], w.z + d[2]]; };
  const r = (o?: V3): V3 => {
    const o2 = o ?? [0, 0, 0];
    const qo = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(o2[0]), rad(o2[1]), rad(o2[2])));
    const e = new THREE.Euler().setFromQuaternion(q.clone().multiply(qo));
    return [e.x * D, e.y * D, e.z * D];
  };
  return shapes.map((sh): Shape => {
    const k = sh.k === undefined ? {} : { k: sh.k * s };
    switch (sh.t) {
      case "ell": return { ...sh, ...k, c: p(sh.c), r: [sh.r[0] * s, sh.r[1] * s, sh.r[2] * s], rot: r(sh.rot) };
      case "cap": return { ...sh, ...k, a: p(sh.a), b: p(sh.b), r: [sh.r[0] * s, sh.r[1] * s] };
      case "box": return { ...sh, ...k, c: p(sh.c), s: [sh.s[0] * s, sh.s[1] * s, sh.s[2] * s], round: sh.round * s, rot: r(sh.rot) };
      case "tor": return { ...sh, ...k, c: p(sh.c), R: sh.R * s, r: sh.r * s, rot: r(sh.rot) };
    }
  });
}
/** Yaw that turns something built facing +z toward the default camera. */
const FACE = 34;

/** The Custodio's rune circle in the xy plane, facing +z, centred at the origin, radius R. */
function runeCircle(R: number, ring: string, rune: string, tri = true): Shape[] {
  const out: Shape[] = [
    { t: "tor", c: [0, 0, 0], R, r: R * 0.05, rot: [90, 0, 0], col: ring, k: 0 },
    { t: "tor", c: [0, 0, 0], R: R * 0.78, r: R * 0.03, rot: [90, 0, 0], col: ring, k: 0 },
    { t: "tor", c: [0, 0, 0], R: R * 0.2, r: R * 0.03, rot: [90, 0, 0], col: rune, k: 0 },
  ];
  for (let i = 0; i < 12; i++) {
    const a = rad(i * 30 + 15), c = Math.cos(a), s = Math.sin(a), m = R * 0.89;
    if (i % 3 === 0) out.push(dot([c * m, s * m, 0], R * 0.055, rune));
    else if (i % 3 === 1) out.push({ t: "cap", a: [c * (m - R * 0.06), s * (m - R * 0.06), 0], b: [c * (m + R * 0.06), s * (m + R * 0.06), 0], r: [R * 0.025, R * 0.025], col: rune, k: 0 });
    else out.push({ t: "cap", a: [c * m - s * R * 0.06, s * m + c * R * 0.06, 0], b: [c * m + s * R * 0.06, s * m - c * R * 0.06, 0], r: [R * 0.025, R * 0.025], col: rune, k: 0 });
  }
  if (tri) {
    const v = [90, 210, 330].map((a): V3 => [Math.cos(rad(a)) * R * 0.78, Math.sin(rad(a)) * R * 0.78, 0]);
    out.push(...chain([v[0], v[1], v[2], v[0]], R * 0.025, R * 0.025, rune, 0));
  }
  return out;
}

/** An open hand, palm toward +z, fingers up (from the Funámbula designs). */
function hand(skin: string, cuff: string, side: 1 | -1 = 1, curl = 0): Shape[] {
  const len = [0.19, 0.25, 0.24, 0.2];
  return [
    { t: "cap", a: [0, -0.12, 0], b: [0, 0.3, 0], r: [0.1, 0.1], col: cuff, k: 0.04 },
    { t: "box", c: [0, 0.42, 0], s: [0.15, 0.15, 0.065], round: 0.06, col: skin, k: 0.05 },
    ...[-0.105, -0.035, 0.035, 0.105].map((x, i): Shape => ({ t: "cap", a: [x * side, 0.52, 0], b: [x * 1.15 * side, 0.52 + len[i], curl], r: [0.042, 0.036], col: skin, k: 0.02 })),
    { t: "cap", a: [0.12 * side, 0.36, 0.01], b: [0.25 * side, 0.5, 0.04], r: [0.048, 0.04], col: skin, k: 0.03 },
  ];
}

/** An open book at the origin: spine along z, pages spread along ±x, page faces up (+y). */
function openBook(cover: string, paper: string, ink: string, trim: string): Shape[] {
  const out: Shape[] = [];
  for (const s of [1, -1]) {
    out.push({ t: "box", c: [0.2 * s, -0.01 + 0.025, 0], s: [0.21, 0.012, 0.27], round: 0.01, rot: [0, 0, 8 * s], col: cover, k: 0.01 });
    out.push({ t: "box", c: [0.19 * s, 0.03 + 0.025, 0], s: [0.19, 0.03, 0.25], round: 0.012, rot: [0, 0, 8 * s], col: paper, k: 0.01 });
    out.push({ t: "ell", c: [0.17 * s, 0.06 + 0.03, 0], r: [0.17, 0.035, 0.25], rot: [0, 0, 6 * s], col: paper, k: 0.03 });
    for (let i = 0; i < 5; i++) out.push({ t: "box", c: [0.19 * s, 0.11, -0.15 + i * 0.07], s: [0.11, 0.05, 0.008], round: 0.003, rot: [0, 0, 8 * s], col: ink, paint: true });
    out.push({ t: "box", c: [0.38 * s, 0.03, 0.25], s: [0.035, 0.03, 0.035], round: 0.01, col: trim, k: 0.005 });
    out.push({ t: "box", c: [0.38 * s, 0.03, -0.25], s: [0.035, 0.03, 0.035], round: 0.01, col: trim, k: 0.005 });
  }
  out.push({ t: "cap", a: [0, 0.0, 0.27], b: [0, 0.0, -0.27], r: [0.03, 0.03], col: cover, k: 0.02 });
  return out;
}

// MARK: Palettes

const CUS = { teal: "#0f766e", teal2: "#0b5550", tealL: "#1aa596", gold: "#e0b04a", gold2: "#ffd66a", cape: "#1e3a8a", cape2: "#142a66", rune: "#5eead4", runeHot: "#e6fffb", glint: "#ffffff" };

// MARK: Cape surface

type Vec = THREE.Vector3;
/** A cloth sheet of overlapping tiles along a curving spine; front and back layers in two colours. */
function capeSheet(): Shape[] {
  const n = 14, m = 8, L = 1.15;
  const spine: Vec[] = [], dirs: Vec[] = [];
  let p = new THREE.Vector3(-0.05, 1.0, 0);
  for (let i = 0; i <= n; i++) {
    const v = i / n;
    const a = rad(-90 + 45 * v + 15 * Math.sin(v * Math.PI * 2));
    const b = rad(Math.pow(Math.max(0, (v - 0.6) / 0.4), 1.3) * 145);
    const d = new THREE.Vector3(Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)).normalize();
    spine.push(p.clone()); dirs.push(d);
    p = p.clone().addScaledVector(d, L / n);
  }
  const P = (u: number, i: number): Vec => {
    const v = i / n, d = dirs[i];
    const tw = rad(30 * Math.sin(v * Math.PI));
    const ac = new THREE.Vector3(Math.cos(tw), 0, Math.sin(tw));
    ac.addScaledVector(d, -ac.dot(d)).normalize();
    const nr = new THREE.Vector3().crossVectors(ac, d).normalize();
    const w = 0.15 + 0.34 * Math.pow(v, 0.6);
    return spine[i].clone().addScaledVector(ac, u * w).addScaledVector(nr, 0.08 * Math.sin(u * Math.PI * 1.3 + v * 4) * (0.35 + v))
      .add(new THREE.Vector3(0, i === 0 ? -0.07 * u * u : 0, 0));
  };
  const out: Shape[] = [];
  const us = Array.from({ length: m + 1 }, (_, j) => -1 + (2 * j) / m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const a = P(us[j], i), b = P(us[j + 1], i), c = P(us[j], i + 1), e = P(us[j + 1], i + 1);
    const cen = a.clone().add(b).add(c).add(e).multiplyScalar(0.25);
    const tu = b.clone().add(e).sub(a).sub(c).multiplyScalar(0.5), tv = c.clone().add(e).sub(a).sub(b).multiplyScalar(0.5);
    const lu = tu.length(), lv = tv.length();
    const X = tu.normalize(), Y = new THREE.Vector3().crossVectors(tv, X).normalize(), Z = new THREE.Vector3().crossVectors(X, Y);
    const eu = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    const rot: V3 = [eu.x * D, eu.y * D, eu.z * D];
    // Y points toward the camera side (+z) for the unrolled part: front layer on +Y, lining on −Y.
    for (const [off, col] of [[0.011, "cape"], [-0.011, "lining"]] as const) {
      const cc = cen.clone().addScaledVector(Y, off);
      out.push({ t: "ell", c: [cc.x, cc.y, cc.z], r: [lu * 0.75, 0.016, lv * 0.75], rot, col, k: 0.04 });
    }
  }
  // Gold trim along both edges and the hem.
  for (const u of [-1, 1]) out.push(...chain(Array.from({ length: n + 1 }, (_, i) => P(u, i)).map((v): V3 => [v.x, v.y, v.z]), 0.024, 0.028, "gold", 0.01));
  out.push(...chain(us.map((u) => P(u, n)).map((v): V3 => [v.x, v.y, v.z]), 0.028, 0.028, "gold", 0.01));
  out.push(...chain(us.map((u) => P(u, 0)).map((v): V3 => [v.x, v.y, v.z]), 0.024, 0.024, "gold", 0.01));
  // Gold rune studs along the hem trim.
  for (let j = 1; j < m; j += 2) { const v = P(us[j], n - 1); out.push(dot([v.x, v.y, v.z], 0.022, "gold2", 0.005)); }
  // Clasp: two round gold brooches joined by a short chain, at the top corners.
  const l = P(-0.8, 0), r = P(0.8, 0);
  for (const v of [l, r]) {
    out.push({ t: "tor", c: [v.x, v.y, v.z + 0.025], R: 0.04, r: 0.014, rot: [90, 0, 0], col: "gold", k: 0.005 });
    out.push(dot([v.x, v.y, v.z + 0.03], 0.024, "rune"));
  }
  out.push(...chain(bez([l.x, l.y, l.z + 0.03], [(l.x + r.x) / 2, l.y - 0.09, l.z + 0.05], [r.x, r.y, r.z + 0.03], 8), 0.009, 0.009, "gold", 0.003));
  return out;
}

export const artNuevos4: Record<string, Sculpt> = {
  // Tobías, el Bibliotecario: a calm bald scholar in a brown robe with a teal stole and round brass
  // glasses, a thick tome hugged to his chest, a stack of books at his feet.
  "tobias-bibliotecario": {
    palette: {
      skin: "#e8b890", robe: "#7a5232", robeDk: "#5a3a22", teal: "#0f766e", tealL: "#1aa596", gold: "#e0b04a", glass: "#c9a24a",
      beard: "#cfcac0", boots: "#3a2618", mouth: "#8a4a3a", tome: "#7a3424", paper: "#f4ecd6",
      b1: "#2f5e8a", b2: "#5a3a7a", b3: "#3a6a4a", b4: "#a8622e",
    },
    shapes: [
      { t: "ell", c: [0.1, 0.03, 0.07], r: [0.07, 0.035, 0.05], col: "boots" },
      { t: "ell", c: [0.1, 0.03, -0.07], r: [0.07, 0.035, 0.05], col: "boots" },
      { t: "ell", c: [0, 0.27, 0], r: [0.21, 0.27, 0.21], col: "robe", k: 0.04 },
      { t: "ell", c: [0, 0.43, 0], r: [0.16, 0.17, 0.16], col: "robe", k: 0.06 },
      { t: "tor", c: [0, 0.03, 0], R: 0.17, r: 0.045, col: "teal", paint: true },
      { t: "tor", c: [0, 0.3, 0], R: 0.19, r: 0.022, col: "teal", k: 0.01 },
      // teal stole down the front, gold rune dots on it
      ...[1, -1].map((s): Shape => ({ t: "cap", a: [0.1, 0.58, 0.07 * s], b: [0.21, 0.1, 0.09 * s], r: [0.035, 0.04], col: "tealL", paint: true })),
      ...[0.2, 0.14].map((y): Shape => ({ t: "ell", c: [0.2, y, 0.09], r: [0.02, 0.02, 0.02], col: "gold", paint: true })),
      // head: bald, grey fringe and short beard, ears
      { t: "ell", c: [0.02, 0.71, 0], r: [0.19, 0.18, 0.18], col: "skin", k: 0.07 },
      { t: "ell", c: [-0.07, 0.67, 0.13], r: [0.08, 0.06, 0.06], col: "beard", k: 0.02 },
      { t: "ell", c: [-0.07, 0.67, -0.13], r: [0.08, 0.06, 0.06], col: "beard", k: 0.02 },
      { t: "ell", c: [-0.13, 0.68, 0], r: [0.06, 0.07, 0.13], col: "beard", k: 0.02 },
      { t: "ell", c: [0.0, 0.68, 0.175], r: [0.03, 0.045, 0.025], col: "skin", k: 0.01 },
      { t: "ell", c: [0.15, 0.585, 0.01], r: [0.07, 0.06, 0.1], col: "beard", k: 0.03 },
      { t: "cap", a: [0.19, 0.635, 0.06], b: [0.21, 0.635, -0.03], r: [0.012, 0.012], col: "beard", k: 0.01 },
      // round glasses
      { t: "tor", c: [0.118, 0.705, 0.169], R: 0.056, r: 0.009, rot: [0, -62, 90], col: "glass", k: 0 },
      { t: "tor", c: [0.222, 0.708, -0.002], R: 0.052, r: 0.009, rot: [0, 0, 90], col: "glass", k: 0 },
      { t: "cap", a: [0.17, 0.715, 0.142], b: [0.222, 0.715, 0.05], r: [0.008, 0.008], col: "glass", k: 0 },
      { t: "cap", a: [0.066, 0.705, 0.196], b: [-0.01, 0.71, 0.18], r: [0.007, 0.007], col: "glass", k: 0 },
      // arms hugging the tome
      ...arm(-1, [0.2, 0.52, -0.06], "robe", "skin", 0.05),
      ...arm(1, [0.22, 0.34, 0.12], "robe", "skin", 0.05),
      ...xf([
        { t: "box", c: [0.04, 0, 0], s: [0.012, 0.17, 0.13], round: 0.01, col: "tome", k: 0.004 },
        { t: "box", c: [-0.04, 0, 0], s: [0.012, 0.17, 0.13], round: 0.01, col: "tome", k: 0.004 },
        { t: "box", c: [0, 0, -0.125], s: [0.05, 0.17, 0.014], round: 0.012, col: "tome", k: 0.004 },
        { t: "box", c: [0, 0, 0.0], s: [0.034, 0.16, 0.125], round: 0.004, col: "paper", k: 0.002 },
        { t: "tor", c: [0.055, 0.02, 0.0], R: 0.05, r: 0.012, rot: [0, 0, 90], col: "gold", k: 0.003 },
        dot([0.058, 0.02, 0], 0.02, "gold"),
        ...[[0.16, 0.12], [-0.16, 0.12], [0.16, -0.12], [-0.16, -0.12]].map(([y, z]): Shape => ({ t: "box", c: [0.05, y, z], s: [0.01, 0.025, 0.025], round: 0.006, col: "gold", k: 0.003 })),
      ], [0, -25, -8], 1, [0.22, 0.44, 0.03]),
      // stack of books at his side
      ...([[0.03, "b1", 8], [0.095, "b4", -6], [0.16, "b2", 14], [0.22, "b3", 2]] as const).flatMap(([y, col, yaw]): Shape[] => xf([
        { t: "box", c: [0, 0, 0], s: [0.12, 0.03, 0.09], round: 0.01, col, k: 0.003 },
        { t: "box", c: [0.012, 0, 0], s: [0.12, 0.021, 0.095], round: 0.004, col: "paper", paint: true },
      ], [0, yaw, 0], 1, [-0.06, y, 0.36])),
    ],
    eyes: eyes("#5a3e2a", false, 0.7, 0.02, 0.045),
  },

  // Viaje Astral: the Custodio sits cross-legged, eyes closed; her glowing teal spirit rises out of
  // her, arms open, a wispy tail still joined to her; gold stars around.
  "viaje-astral": {
    palette: { ...CUS, skin: "#ecc19c", hair: "#2a2232", silver: "#dfe4ee", lid: "#3a2a30", spirit: "#7ef7e4", spirit2: "#c9fff6", star: "#ffd66a" },
    glow: ["spirit", "spirit2", "star", "glint"],
    shapes: [
      // body: cape pooled behind, crossed legs, robe
      { t: "ell", c: [-0.14, 0.24, 0], r: [0.08, 0.24, 0.25], col: "cape", k: 0.04 },
      { t: "ell", c: [-0.12, 0.035, 0], r: [0.2, 0.035, 0.33], col: "cape", k: 0.04 },
      { t: "ell", c: [0.06, 0.08, 0], r: [0.21, 0.08, 0.25], col: "teal", k: 0.05 },
      { t: "ell", c: [0.14, 0.08, 0.19], r: [0.08, 0.06, 0.08], col: "teal", k: 0.04 },
      { t: "ell", c: [0.14, 0.08, -0.19], r: [0.08, 0.06, 0.08], col: "teal", k: 0.04 },
      { t: "ell", c: [0, 0.3, 0], r: [0.13, 0.18, 0.14], col: "teal", k: 0.05 },
      { t: "cap", a: [0.12, 0.46, 0], b: [0.15, 0.12, 0], r: [0.016, 0.016], col: "gold", paint: true },
      ...[0.4, 0.32, 0.24].map((y): Shape => ({ t: "ell", c: [0.13, y, 0.05], r: [0.016, 0.016, 0.016], col: "gold", paint: true })),
      { t: "tor", c: [0.06, 0.03, 0], R: 0.21, r: 0.02, col: "gold", paint: true },
      { t: "ell", c: [-0.09, 0.46, 0], r: [0.09, 0.07, 0.15], col: "teal2", k: 0.04 },
      // arms resting on the knees
      { t: "cap", a: [0, 0.4, 0.13], b: [0.12, 0.18, 0.19], r: [0.045, 0.05], col: "teal", k: 0.03 },
      { t: "cap", a: [0, 0.4, -0.13], b: [0.12, 0.18, -0.19], r: [0.045, 0.05], col: "teal", k: 0.03 },
      { t: "tor", c: [0.12, 0.18, 0.19], R: 0.045, r: 0.012, rot: [0, 0, 60], col: "gold", k: 0.005 },
      { t: "tor", c: [0.12, 0.18, -0.19], R: 0.045, r: 0.012, rot: [0, 0, 60], col: "gold", k: 0.005 },
      dot([0.2, 0.13, 0.2], 0.042, "skin", 0.01),
      dot([0.2, 0.13, -0.2], 0.042, "skin", 0.01),
      // head: dark hair with one silver streak, eyes closed
      { t: "ell", c: [0.03, 0.61, 0], r: [0.17, 0.155, 0.155], col: "skin", k: 0.04 },
      { t: "ell", c: [-0.06, 0.67, 0], r: [0.16, 0.16, 0.185], col: "hair", k: 0.02 },
      { t: "cap", a: [-0.09, 0.62, 0], b: [-0.14, 0.38, 0], r: [0.13, 0.08], col: "hair", k: 0.04 },
      { t: "ell", c: [0.09, 0.75, 0.0], r: [0.07, 0.04, 0.15], rot: [0, 0, -20], col: "hair", k: 0.02 },
      { t: "cap", a: [0.08, 0.81, 0.09], b: [-0.05, 0.75, 0.16], r: [0.026, 0.026], col: "silver", paint: true },
      { t: "cap", a: [-0.03, 0.74, 0.16], b: [-0.13, 0.5, 0.12], r: [0.028, 0.025], col: "silver", paint: true },
      { t: "cap", a: [0.1, 0.61, 0.14], b: [0.145, 0.61, 0.095], r: [0.01, 0.01], col: "lid", paint: true },
      { t: "cap", a: [0.188, 0.61, 0.065], b: [0.192, 0.61, 0.015], r: [0.01, 0.01], col: "lid", paint: true },
      // spirit rising out of her: wispy tail from her back, body, head, arms flung wide
      ...chain(bez([-0.24, 0.5, 0], [-0.34, 0.8, 0], [-0.06, 0.94, 0], 7), 0.03, 0.09, "spirit", 0.02),
      { t: "ell", c: [-0.02, 1.02, 0], r: [0.1, 0.15, 0.11], col: "spirit", k: 0.06 },
      { t: "ell", c: [0.02, 1.29, 0], r: [0.1, 0.1, 0.1], col: "spirit", k: 0.015 },
      { t: "cap", a: [-0.06, 1.34, 0], b: [-0.22, 1.24, 0], r: [0.065, 0.02], col: "spirit", k: 0.03 },
      ...chain([[0.0, 1.12, 0.08], [0.06, 1.2, 0.26], [0.04, 1.4, 0.42]], 0.045, 0.03, "spirit", 0.03),
      ...chain([[0.0, 1.12, -0.08], [0.06, 1.2, -0.26], [0.04, 1.4, -0.42]], 0.045, 0.03, "spirit", 0.03),
      dot([0.04, 1.43, 0.43], 0.04, "spirit", 0.02), dot([0.04, 1.43, -0.43], 0.04, "spirit", 0.02),
      { t: "ell", c: [0.05, 1.05, 0], r: [0.08, 0.1, 0.08], col: "spirit2", paint: true },
      { t: "ell", c: [0.09, 1.31, 0.02], r: [0.05, 0.045, 0.06], col: "spirit2", paint: true },
      // stars
      ...sparkle([0.32, 1.25, 0.05], 0.08, "star"),
      ...sparkle([-0.32, 1.0, 0.1], 0.06, "star"),
      ...sparkle([0.3, 0.75, -0.25], 0.05, "glint"),
      ...sparkle([-0.25, 1.38, -0.1], 0.05, "star"),
      ...sparkle([0.42, 0.22, 0.2], 0.045, "star"),
      dot([0.18, 0.95, 0.3], 0.018, "star"), dot([-0.3, 0.7, -0.2], 0.016, "glint"), dot([0.15, 1.42, -0.1], 0.016, "star"),
    ],
    eyes: [],
  },

  // Descarga Arcana: an open hand in a teal, gold-cuffed sleeve; a rune circle in front of the palm
  // fires a bright teal bolt wrapped in gold, sparks flying.
  "descarga-arcana": {
    palette: { ...CUS, skin: "#ecc19c", bolt: "#5eead4", core: "#f0fffc", zap: "#ffd66a" },
    glow: ["rune", "runeHot", "bolt", "core", "zap", "glint"],
    shapes: xf([
      ...xf(hand("skin", "teal", 1, 0.03), [0, 50, 12], 0.85, [-0.2, 0.0, 0]),
      { t: "cap", a: [-0.19, 0.0, 0], b: [-0.42, -0.45, -0.05], r: [0.1, 0.13], col: "teal", k: 0.04 },
      { t: "tor", c: [-0.2, -0.04, 0], R: 0.1, r: 0.022, rot: [0, 0, 28], col: "gold", k: 0.01 },
      { t: "cap", a: [-0.33, -0.22, 0.12], b: [-0.37, -0.32, 0.11], r: [0.018, 0.018], col: "gold", k: 0 },
      ...xf(runeCircle(0.34, "rune", "gold2"), [0, 45, 0], 1, [0.08, 0.38, 0]),
      // bolt: a fat teal zigzag with a white core, gold strand wrapped around
      ...chain([[0.1, 0.38, 0], [0.32, 0.46, 0.04], [0.5, 0.33, -0.02], [0.72, 0.45, 0.03], [0.92, 0.36, 0], [1.08, 0.42, 0]], 0.08, 0.04, "bolt", 0.03),
      ...chain([[0.12, 0.38, 0.03], [0.32, 0.46, 0.08], [0.5, 0.33, 0.04], [0.72, 0.45, 0.08], [0.92, 0.36, 0.05]], 0.035, 0.018, "core", 0.02),
      ...chain([[0.14, 0.32, 0.06], [0.28, 0.54, -0.04], [0.46, 0.26, 0.07], [0.62, 0.52, -0.05], [0.8, 0.3, 0.06], [0.98, 0.48, -0.02]], 0.018, 0.01, "zap", 0.01),
      ...burst([1.1, 0.42, 0], 8, 10, 0.2, [0.04, 0.006], "zap", { len: 0.13, r: [0.035, 0.006], col: "bolt" }, 0.02),
      dot([1.1, 0.42, 0], 0.07, "core", 0.03),
      ...sparkle([0.4, 0.7, 0.05], 0.06, "zap"),
      ...sparkle([0.62, 0.12, 0.05], 0.05, "zap"),
      ...sparkle([0.95, 0.68, 0.02], 0.05, "glint"),
      dot([0.3, 0.2, 0.1], 0.018, "zap"), dot([0.78, 0.62, -0.06], 0.016, "zap"), dot([0.55, 0.62, 0.1], 0.014, "glint"),
    ], [0, -8, 0]),
    eyes: [],
  },

  // Maestría Arcana: an open spellbook floating, gold and teal runes rising from its pages to a
  // glowing rune circle above.
  "maestria-arcana": {
    palette: { ...CUS, cover: "#0f5f58", paper: "#f6eed8", ink: "#8a7a5a", beam: "#a7f3e6" },
    glow: ["rune", "runeHot", "gold2", "beam", "glint"],
    shapes: xf([
      ...xf(openBook("cover", "paper", "ink", "gold"), [35, 0, 0], 1.1, [0, 0.2, 0]),
      // floating runes: a few simple glyphs
      ...chain([[-0.22, 0.55, 0.05], [-0.18, 0.65, 0.05], [-0.14, 0.55, 0.05]], 0.016, 0.016, "gold2", 0),
      ...chain([[0.16, 0.5, 0.05], [0.16, 0.62, 0.05]], 0.016, 0.016, "rune", 0),
      ...chain([[0.12, 0.58, 0.05], [0.2, 0.54, 0.05]], 0.016, 0.016, "rune", 0),
      { t: "tor", c: [0.02, 0.78, 0.05], R: 0.04, r: 0.013, rot: [90, 0, 0], col: "gold2", k: 0 },
      ...chain([[0.02, 0.74, 0.05], [0.02, 0.66, 0.05]], 0.013, 0.013, "gold2", 0),
      ...chain([[-0.3, 0.82, 0], [-0.24, 0.88, 0], [-0.3, 0.94, 0]], 0.014, 0.014, "rune", 0),
      ...chain([[0.28, 0.8, 0], [0.34, 0.86, 0], [0.28, 0.86, 0], [0.34, 0.92, 0]], 0.013, 0.013, "gold2", 0),
      // rune circle above, tilted toward the viewer
      ...xf(runeCircle(0.36, "rune", "gold2"), [-62, 0, 0], 1, [0, 1.08, 0]),
      ...sparkle([0.42, 0.5, 0.1], 0.06, "glint"),
      ...sparkle([-0.42, 0.66, 0.05], 0.05, "gold2"),
      dot([0.1, 0.95, 0.1], 0.016, "glint"), dot([-0.12, 0.46, 0.15], 0.016, "gold2"),
    ], [0, FACE - 8, 0]),
    eyes: [],
  },

  // Estudio del Grimorio: a wooden desk with an open teal grimoire, a lit candle, an inkwell with a
  // quill and scattered notes, all in warm candlelight.
  "estudio-grimorio": {
    palette: {
      ...CUS, wood: "#8a5a34", wood2: "#6a4024", warmWood: "#c08850", cover: "#0f5f58", paper: "#f6ecd2", ink: "#7a6a52",
      wax: "#f6e7c4", brass: "#d9a23a", flame: "#ffcf5a", flameHot: "#fff6d0", glassInk: "#24304a", feather: "#f4efe6", note: "#efe0bc",
    },
    glow: ["flame", "flameHot", "rune"],
    shapes: xf([
      // desk
      { t: "box", c: [0, 0.32, 0], s: [0.6, 0.035, 0.32], round: 0.015, col: "wood" },
      { t: "ell", c: [-0.32, 0.36, -0.08], r: [0.3, 0.02, 0.22], col: "warmWood", paint: true },
      ...[[0.54, 0.26], [-0.54, 0.26], [0.54, -0.26], [-0.54, -0.26]].map(([x, z]): Shape => ({ t: "cap", a: [x, 0.3, z], b: [x, 0.0, z], r: [0.03, 0.026], col: "wood2", k: 0.01 })),
      { t: "box", c: [0, 0.27, 0.3], s: [0.52, 0.03, 0.012], round: 0.008, col: "wood2", k: 0.01 },
      // grimoire
      ...xf(openBook("cover", "paper", "ink", "gold"), [10, -6, 0], 0.9, [0.02, 0.37, 0.02]),
      { t: "tor", c: [0.19, 0.48, 0.04], R: 0.06, r: 0.008, rot: [-80, 0, 0], col: "rune", k: 0 },
      // candle on a brass dish
      { t: "tor", c: [-0.42, 0.37, -0.12], R: 0.07, r: 0.016, col: "brass", k: 0.01 },
      { t: "ell", c: [-0.42, 0.365, -0.12], r: [0.07, 0.012, 0.07], col: "brass", k: 0.01 },
      { t: "cap", a: [-0.42, 0.37, -0.12], b: [-0.42, 0.6, -0.12], r: [0.04, 0.038], col: "wax", k: 0.01 },
      { t: "cap", a: [-0.39, 0.6, -0.1], b: [-0.385, 0.52, -0.095], r: [0.014, 0.01], col: "wax", k: 0.01 },
      { t: "ell", c: [-0.42, 0.69, -0.12], r: [0.05, 0.08, 0.05], col: "flame", k: 0.01 },
      { t: "cap", a: [-0.42, 0.72, -0.12], b: [-0.4, 0.86, -0.12], r: [0.035, 0.004], col: "flame", k: 0.02 },
      { t: "ell", c: [-0.42, 0.67, -0.1], r: [0.025, 0.045, 0.04], col: "flameHot", paint: true },
      // inkwell and quill
      { t: "ell", c: [0.44, 0.4, -0.16], r: [0.065, 0.055, 0.065], col: "glassInk", k: 0.01 },
      { t: "cap", a: [0.44, 0.44, -0.16], b: [0.44, 0.48, -0.16], r: [0.03, 0.03], col: "brass", k: 0.01 },
      { t: "cap", a: [0.44, 0.45, -0.16], b: [0.3, 0.86, -0.2], r: [0.009, 0.006], col: "wood2", k: 0 },
      { t: "ell", c: [0.34, 0.75, -0.19], r: [0.04, 0.13, 0.012], rot: [0, 0, 19], col: "feather", k: 0.01 },
      // scattered notes
      { t: "box", c: [0.3, 0.36, 0.2], s: [0.12, 0.006, 0.08], round: 0.003, rot: [0, 25, 0], col: "note", k: 0.003 },
      { t: "box", c: [0.36, 0.368, 0.14], s: [0.1, 0.006, 0.07], round: 0.003, rot: [0, -15, 0], col: "paper", k: 0.003 },
      ...[0.13, 0.16, 0.19].map((z): Shape => ({ t: "box", c: [0.36, 0.37, z], s: [0.07, 0.01, 0.005], round: 0.002, rot: [0, -15, 0], col: "ink", paint: true })),
      { t: "box", c: [-0.3, 0.36, 0.2], s: [0.1, 0.006, 0.075], round: 0.003, rot: [0, -30, 0], col: "note", k: 0.003 },
      { t: "box", c: [-0.05, 0.25, 0.37], s: [0.08, 0.006, 0.06], round: 0.003, rot: [-55, 10, 0], col: "paper", k: 0.003 },
    ], [0, FACE - 12, 0]),
    eyes: [],
  },

  // Salvaguarda Rúnica: a hexagonal teal rune ward; a dark crystal spike hits it and shatters into shards.
  "salvaguarda-runica": {
    palette: { ...CUS, pane: "#9fe9de", spike: "#3a2450", spike2: "#24163a", vein: "#b06ae8", shard: "#4a2e66", flash: "#e6fffb" },
    glow: ["rune", "runeHot", "gold2", "vein", "flash", "glint"],
    shapes: xf([
      // pane
      ...[0, 60, 120].map((a): Shape => ({ t: "box", c: [0, 0.5, -0.02], s: [0.44 * Math.sqrt(3) / 2, 0.22, 0.012], round: 0.01, rot: [0, 0, a], col: "pane", k: 0.01 })),
      // frame and inner hex
      ...chain([0, 1, 2, 3, 4, 5, 0].map((i): V3 => [Math.cos(rad(90 + 60 * i)) * 0.46, 0.5 + Math.sin(rad(90 + 60 * i)) * 0.46, 0]), 0.03, 0.03, "rune", 0.01),
      ...chain([0, 1, 2, 3, 4, 5, 0].map((i): V3 => [Math.cos(rad(90 + 60 * i)) * 0.36, 0.5 + Math.sin(rad(90 + 60 * i)) * 0.36, 0.005]), 0.012, 0.012, "rune", 0),
      ...[0, 1, 2, 3, 4, 5].map((i): Shape => dot([Math.cos(rad(90 + 60 * i)) * 0.46, 0.5 + Math.sin(rad(90 + 60 * i)) * 0.46, 0.01], 0.04, "gold2")),
      ...[0, 1, 2, 3, 4, 5].map((i): Shape => {
        const a = rad(120 + 60 * i), m = 0.41;
        return { t: "cap", a: [Math.cos(a) * m - 0.02, 0.5 + Math.sin(a) * m - 0.02, 0.01], b: [Math.cos(a) * m + 0.02, 0.5 + Math.sin(a) * m + 0.02, 0.01], r: [0.01, 0.01], col: "gold2", k: 0 };
      }),
      ...xf(runeCircle(0.17, "rune", "gold2", true), [0, 0, 0], 1, [0, 0.5, 0.01]),
      // impact flash on the front
      ...burst([0.12, 0.6, 0.05], 10, 5, 0.2, [0.03, 0.005], "flash", { len: 0.12, r: [0.025, 0.005], col: "rune" }, 0.01),
      dot([0.12, 0.6, 0.05], 0.05, "flash", 0.02),
      // the dark spike, its tip broken off against the ward
      { t: "cap", a: [0.85, 1.05, 0.32], b: [0.25, 0.68, 0.1], r: [0.11, 0.05], col: "spike", k: 0.02 },
      { t: "cap", a: [0.85, 1.05, 0.32], b: [1.0, 1.15, 0.38], r: [0.11, 0.03], col: "spike2", k: 0.03 },
      { t: "cap", a: [0.75, 0.99, 0.37], b: [0.35, 0.74, 0.18], r: [0.016, 0.01], col: "vein", paint: true },
      { t: "cap", a: [0.8, 1.06, 0.4], b: [0.6, 0.98, 0.3], r: [0.014, 0.008], col: "vein", paint: true },
      // shards flying off
      ...([[0.3, 0.86, 0.15, 20], [0.4, 0.55, 0.18, -40], [0.22, 0.42, 0.14, 70], [0.48, 0.74, 0.22, 110], [0.05, 0.82, 0.16, -10], [0.34, 0.33, 0.16, 35], [0.55, 0.6, 0.12, 80]] as const).map(([x, y, z, a], i): Shape =>
        ({ t: "box", c: [x, y, z], s: [0.04 - (i % 3) * 0.008, 0.016, 0.022], round: 0.004, rot: [a, a * 0.7, a * 1.3], col: i % 2 ? "shard" : "spike", k: 0 })),
      ...sparkle([-0.3, 0.92, 0.05], 0.05, "glint"),
      ...sparkle([0.5, 0.42, 0.1], 0.05, "rune"),
    ], [0, FACE - 14, 0]),
    eyes: [],
  },

  // La Torre del Umbral: a squat round stone sanctum with a domed roof, a big circular rune window
  // glowing teal, on a floating rock with hanging roots and loose pebbles.
  "torre-umbral": {
    palette: {
      ...CUS, rock: "#6e6258", rock2: "#4e443c", moss: "#5f8f4a", stone: "#dcd6ca", stone2: "#aaa396", stoneDk: "#8a8478",
      dome: "#2c4a6a", dome2: "#3d6488", win: "#14b8a6", door: "#3a2a22", root: "#5a4030",
    },
    glow: ["win", "runeHot", "rune", "gold2"],
    shapes: xf([
      // floating rock
      { t: "ell", c: [0, 0.2, 0], r: [0.48, 0.07, 0.44], col: "rock", k: 0.03 },
      { t: "ell", c: [0, 0.27, 0], r: [0.5, 0.035, 0.46], col: "moss", paint: true },
      { t: "cap", a: [0, 0.16, 0], b: [0.04, -0.2, 0.02], r: [0.36, 0.04], col: "rock2", k: 0.08 },
      { t: "cap", a: [0.2, 0.08, 0.15], b: [0.26, -0.18, 0.18], r: [0.12, 0.02], col: "rock2", k: 0.06 },
      { t: "cap", a: [-0.22, 0.08, 0.1], b: [-0.26, -0.14, 0.12], r: [0.12, 0.02], col: "rock2", k: 0.06 },
      ...chain(bez([0.12, 0.05, 0.3], [0.2, -0.1, 0.33], [0.14, -0.25, 0.3], 5), 0.014, 0.006, "root", 0.005),
      ...chain(bez([-0.15, 0.05, 0.3], [-0.2, -0.1, 0.3], [-0.12, -0.2, 0.28], 5), 0.012, 0.005, "root", 0.005),
      { t: "box", c: [0.36, -0.2, 0.2], s: [0.04, 0.035, 0.04], round: 0.015, rot: [20, 30, 10], col: "rock", k: 0 },
      { t: "box", c: [-0.4, -0.08, 0.15], s: [0.03, 0.025, 0.03], round: 0.01, rot: [10, 50, 30], col: "rock2", k: 0 },
      // squat tower body
      { t: "cap", a: [0, 0.28, 0], b: [0, 0.56, 0], r: [0.27, 0.27], col: "stone", k: 0.02 },
      { t: "tor", c: [0, 0.27, 0], R: 0.28, r: 0.03, col: "stoneDk", k: 0.02 },
      ...[0.36, 0.46, 0.56].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.27, r: 0.008, col: "stone2", paint: true })),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): Shape => ({ t: "box", c: [Math.cos(rad(i * 45 + (i % 2) * 20)) * 0.27, 0.41 + (i % 2) * 0.1, Math.sin(rad(i * 45 + (i % 2) * 20)) * 0.27], s: [0.006, 0.05, 0.006], round: 0.003, col: "stone2", paint: true })),
      { t: "tor", c: [0, 0.62, 0], R: 0.29, r: 0.035, col: "stoneDk", k: 0.02 },
      // dome with ribs and a finial
      { t: "ell", c: [0, 0.63, 0], r: [0.29, 0.25, 0.29], col: "dome", k: 0.02 },
      ...[0, 60, 120].map((a): Shape => ({ t: "tor", c: [0, 0.63, 0], R: 0.26, r: 0.012, rot: [90, a, 0], col: "dome2", paint: true })),
      { t: "cap", a: [0, 0.86, 0], b: [0, 0.98, 0], r: [0.035, 0.012], col: "gold", k: 0.02 },
      dot([0, 1.02, 0], 0.035, "rune"),
      // big round rune window
      { t: "tor", c: [0, 0.43, 0.25], R: 0.15, r: 0.03, rot: [90, 0, 0], col: "stoneDk", k: 0.01 },
      { t: "ell", c: [0, 0.43, 0.245], r: [0.135, 0.135, 0.035], col: "win", k: 0.01 },
      ...xf(runeCircle(0.12, "runeHot", "gold2"), [0, 0, 0], 1, [0, 0.43, 0.28]),
      // small door and side lancets
      ...xf([
        { t: "box", c: [0, 0.33, 0.27], s: [0.05, 0.05, 0.02], round: 0.01, col: "door", k: 0.005 },
        { t: "ell", c: [0, 0.38, 0.27], r: [0.05, 0.04, 0.02], col: "door", k: 0.005 },
      ], [0, 70, 0]),
      // drifting motes
      dot([0.42, 0.75, 0.1], 0.018, "rune"), dot([-0.4, 0.55, 0.2], 0.015, "rune"), dot([0.3, 1.0, -0.1], 0.014, "gold2"),
    ], [0, FACE - 14, 0]),
    eyes: [],
  },

  // Capa Errante: the Custodio's deep-blue cape, gold-trimmed, floating empty and curling like a living
  // thing, held only by a pair of gold brooches; a few teal motes trail from it.
  "capa-errante": {
    palette: { ...CUS, lining: "#155e75" },
    glow: ["rune", "gold2", "glint"],
    shapes: xf([
      ...capeSheet(),
      ...sparkle([0.42, 0.9, 0.1], 0.06, "glint"),
      ...sparkle([-0.35, 0.45, 0.15], 0.05, "gold2"),
      dot([0.35, 0.3, 0.3], 0.018, "rune"), dot([-0.3, 0.75, 0.05], 0.016, "rune"), dot([0.25, 0.08, 0.4], 0.014, "rune"),
    ], [0, FACE - 10, 0]),
    eyes: [],
  },
};
