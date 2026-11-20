import type { Sculpt, Shape, V3 } from "../sculpt";
import { burst, rad, turn } from "./kit";

// Album cards for Centella, Mole and Soberano's rebuilt decks — art batch 4.
// Guardia de Aurelia: deep blue and gold, emblem a gold star inside a heraldic kite shield.
// One iconic object or small scene each.

// MARK: Helpers

/** Capsules through a list of points, radius tapering from r0 to r1. */
function path(pts: V3[], r0: number, r1: number, col: string, k = 0.02, paint = false): Shape[] {
  const out: Shape[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + ((r1 - r0) * i) / n, rb = r0 + ((r1 - r0) * (i + 1)) / n;
    out.push({ t: "cap", a: pts[i], b: pts[i + 1], r: [ra, rb], col, k, ...(paint ? { paint } : {}) });
  }
  return out;
}

/** Points on an arc in the xy plane (degrees), at depth z; `ry` squashes it into an ellipse. */
function arcPts(cx: number, cy: number, R: number, a0: number, a1: number, n: number, z = 0, ry = R): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) { const a = rad(a0 + ((a1 - a0) * i) / n); out.push([cx + R * Math.cos(a), cy + ry * Math.sin(a), z]); }
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

/** A small four-point sparkle. */
function sparkle(c: V3, len: number, col: string): Shape[] {
  return burst(c, 4, 0, len, [len * 0.32, len * 0.07], col, undefined, 0.03);
}

const dot = (c: V3, r: number, col: string): Shape => ({ t: "ell", c, r: [r, r, r], col, k: 0 });

/** A five-point star facing +z, outer radius R. */
function star(c: V3, R: number, col: string, depth = 0.35, paint = false): Shape[] {
  const p = paint ? { paint: true } : {};
  const out: Shape[] = [{ t: "ell", c, r: [R * 0.42, R * 0.42, R * depth], col, k: 0.01, ...p }];
  for (let i = 0; i < 5; i++) {
    const a = rad(90 + 72 * i);
    out.push({ t: "cap", a: c, b: [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), c[2]], r: [R * 0.36, R * 0.04], col, k: 0.01, ...p });
  }
  return out.map((s) => (s.t === "cap" ? s : s));
}

/** Kite shield in the xy plane, top at y ≈ 0.94, point at y ≈ 0.07, half-width 0.3: slats + rim. */
function kiteShield(face: string, rim: string, rimR = 0.036): Shape[] {
  const outline: [number, number][] = [[-0.3, 0.86], [-0.15, 0.92], [0, 0.94], [0.15, 0.92], [0.3, 0.86], [0.3, 0.62], [0.2, 0.36], [0, 0.07], [-0.2, 0.36], [-0.3, 0.62], [-0.3, 0.86]];
  const side = outline.slice(4, 8);
  const half = (y: number): number => {
    for (let i = 0; i + 1 < side.length; i++) {
      const [x0, y0] = side[i], [x1, y1] = side[i + 1];
      if (y <= y0 && y >= y1) return x0 + ((x1 - x0) * (y0 - y)) / (y0 - y1);
    }
    return 0.3;
  };
  const out: Shape[] = [];
  for (let y = 0.12; y <= 0.9; y += 0.04) out.push({ t: "box", c: [0, y, 0], s: [Math.max(0.03, half(y) - 0.02), 0.03, 0.03], round: 0.02, col: face, k: 0.03 });
  out.push({ t: "ell", c: [0, 0.6, 0.015], r: [0.22, 0.28, 0.04], col: face, k: 0.05 });
  out.push(...path(outline.map(([x, y]): V3 => [x, y, 0.005]), rimR, rimR, rim, 0.006));
  return out;
}

/** The Guardia de Aurelia crest: blue kite shield, gold rim, gold star; centred at c, height ≈ 0.87·s. */
function crest(c: V3, s: number, o: { face?: string; rim?: string; star?: string; paint?: boolean } = {}): Shape[] {
  const face = o.face ?? "blue", rim = o.rim ?? "gold", st = o.star ?? "gold";
  const shapes = [...kiteShield(face, rim), ...star([0, 0.56, 0.05], 0.17, st, 0.3)];
  const out = place(shapes, s, [c[0], c[1] - 0.5 * s, c[2]]);
  return o.paint ? out.map((sh) => ({ ...sh, paint: true })) : out;
}

const GUARD = { blue: "#1f3f94", blue2: "#142b68", blue3: "#3d6fd0", gold: "#e8b23a", gold2: "#b5832a", goldhi: "#fff1b8", ray: "#ffd970" };

// MARK: Pieces

/** A hand, palm down, pointing +x, wrist at the origin, with sleeve back along -x. */
function handArm(skin: string, sleeve: string, cuff: string, len = 0.5): Shape[] {
  return [
    { t: "cap", a: [-len, -0.02, 0], b: [-0.08, 0, 0], r: [0.075, 0.068], col: sleeve, k: 0.02 },
    { t: "tor", c: [-0.1, 0, 0], R: 0.068, r: 0.022, rot: [0, 0, 90], col: cuff, k: 0.01 },
    { t: "cap", a: [-0.08, 0, 0], b: [-0.02, 0.005, 0], r: [0.05, 0.05], col: skin, k: 0.02 },
    { t: "ell", c: [0.05, 0.01, 0], r: [0.085, 0.032, 0.075], col: skin, k: 0.03 },
    ...[-0.048, -0.016, 0.016, 0.048].map((z, i): Shape => ({ t: "cap", a: [0.11, 0.01, z], b: [0.2 - Math.abs(i - 1.5) * 0.02, 0.0, z * 1.05], r: [0.021, 0.018], col: skin, k: 0.012 })),
    { t: "cap", a: [0.02, 0.0, 0.07], b: [0.1, -0.005, 0.105], r: [0.024, 0.019], col: skin, k: 0.015 },
  ];
}

/** Moves shapes by d. */
const move = (shapes: Shape[], d: V3): Shape[] => place(shapes, 1, d);

export const artAlbum4: Record<string, Sculpt> = {
  // ¡Guardia, en Formación!: a gold war-horn raised high, a blue star-in-shield banner hanging from it, rays and sound rings.
  "guardia-formacion": {
    palette: { ...GUARD, cord: "#c9a24a", wave: "#fff4c8", tassel: "#e8b23a" },
    glow: ["ray", "wave", "goldhi"],
    shapes: [
      // rays behind the bell
      ...burst([0.22, 0.82, -0.3], 14, 5, 0.6, [0.03, 0.004], "ray", { len: 0.42, r: [0.022, 0.004], col: "ray" }, 0),
      // horn body: mouthpiece lower-left sweeping up to the bell
      ...path(bez([-0.48, 0.5, 0], [-0.05, 0.56, 0], [0.24, 0.86, 0], 12), 0.022, 0.08, "gold", 0.02),
      { t: "ell", c: [-0.5, 0.5, 0], r: [0.03, 0.035, 0.035], col: "gold2", k: 0.01 },
      { t: "cap", a: [0.22, 0.84, 0], b: [0.33, 0.95, 0], r: [0.08, 0.15], col: "gold", k: 0.03 },
      { t: "tor", c: [0.34, 0.96, 0], R: 0.15, r: 0.028, rot: [0, 0, -45], col: "gold2", k: 0.01 },
      { t: "ell", c: [0.38, 1.0, 0], r: [0.06, 0.13, 0.13], rot: [0, 0, 45], col: "blue2", cut: true, k: 0.02 },
      // bands on the horn
      ...[[-0.28, 0.52], [-0.02, 0.6], [0.14, 0.74]].map(([x, y], i): Shape => ({ t: "tor", c: [x, y, 0], R: 0.03 + i * 0.012, r: 0.013, rot: [0, 0, i === 0 ? 85 : i === 1 ? 70 : 52], col: "gold2", k: 0.005 })),
      // banner hanging from the horn on two cords
      ...path([[-0.3, 0.52, 0.02], [-0.3, 0.44, 0.02]], 0.01, 0.01, "cord", 0.005),
      ...path([[0.12, 0.69, 0.02], [0.14, 0.44, 0.02]], 0.01, 0.01, "cord", 0.005),
      ...place(move([
      { t: "box", c: [-0.08, 0.44, 0.02], s: [0.2, 0.018, 0.018], round: 0.015, col: "gold2", k: 0.005 },
      { t: "box", c: [-0.08, 0.26, 0.02], s: [0.17, 0.18, 0.015], round: 0.012, col: "blue", k: 0.01 },
      { t: "box", c: [-0.08, 0.07, 0.02], s: [0.06, 0.06, 0.06], round: 0.005, rot: [0, 0, 45], col: "blue", cut: true, k: 0.005 },
      ...path([[-0.25, 0.42, 0.04], [-0.25, 0.1, 0.04], [-0.08, 0.02, 0.04], [0.09, 0.1, 0.04], [0.09, 0.42, 0.04]], 0.01, 0.01, "gold", 0, true),
      ...crest([-0.08, 0.27, 0.04], 0.24),
      // tassels at the swallowtail points
      { t: "cap", a: [-0.24, 0.1, 0.02], b: [-0.25, 0.03, 0.02], r: [0.012, 0.022], col: "tassel", k: 0.01 },
      { t: "cap", a: [0.08, 0.1, 0.02], b: [0.09, 0.03, 0.02], r: [0.012, 0.022], col: "tassel", k: 0.01 },
      ], [0.08, -0.44, 0]), 1.35, [-0.08, 0.44, 0]),
      // sound rings out of the bell
      ...path(arcPts(0.36, 0.98, 0.24, 10, 80, 6, 0.02), 0.014, 0.014, "wave", 0),
      ...path(arcPts(0.36, 0.98, 0.34, 15, 75, 6, 0.02), 0.012, 0.012, "wave", 0),
      ...sparkle([-0.42, 0.85, 0.05], 0.05, "goldhi"),
      ...sparkle([0.46, 0.45, 0.05], 0.04, "goldhi"),
    ],
    eyes: [],
  },

  // Unidos Somos Más: four hands of different skin tones and sleeves stacked together in a circle, sparkles rising.
  "unidos-mas": {
    palette: {
      s1: "#f4c9a4", s2: "#c98a5a", s3: "#7a4a30", s4: "#e6b088",
      v1: "#1f3f94", v2: "#e8b23a", v3: "#b8322a", v4: "#2f8a5a", cuff: "#f3ead6", gold: "#e8b23a", hot: "#fff1b8", ray: "#ffe08a", ring: "#3d6fd0",
    },
    glow: ["hot", "ray"],
    shapes: [
      // seen from above: the plane of the hands tipped up toward the camera
      ...tiltX([
        { t: "tor", c: [0, 0, 0], R: 0.56, r: 0.018, col: "ray", k: 0 },
        ...turn(place(handArm("s1", "v1", "gold", 0.2), 1.5, [-0.2, 0.0, 0.0]), 20),
        ...turn(place(handArm("s2", "v2", "cuff", 0.2), 1.5, [-0.2, 0.05, 0.0]), 110),
        ...turn(place(handArm("s3", "v3", "gold", 0.2), 1.5, [-0.2, 0.1, 0.0]), 200),
        ...turn(place(handArm("s4", "v4", "cuff", 0.2), 1.5, [-0.2, 0.15, 0.0]), 290),
      ], 62, [0, 0, 0]).map((sh) => move([sh], [0, 0.5, 0])[0]),
      ...sparkle([0.0, 1.0, 0.1], 0.07, "hot"),
      ...sparkle([0.36, 0.84, 0.05], 0.045, "hot"),
      ...sparkle([-0.38, 0.8, 0.05], 0.05, "hot"),
      dot([0.22, 1.02, 0.1], 0.02, "ray"),
      dot([-0.22, 1.0, 0.1], 0.016, "ray"),
    ],
    eyes: [],
  },

  // Esquife Veloz: a sleek wooden flying skiff with a blue sail-wing and brass fins, zooming up with speed lines.
  "esquife-veloz": {
    palette: { ...GUARD, wood: "#a8693a", wood2: "#7a4a26", deck: "#c98e58", brass: "#d4a248", brass2: "#9a7030", sail: "#2c55b8", streak: "#d8ecff", rune: "#7fe0ff" },
    glow: ["streak", "rune"],
    shapes: rotZ([
      // speed lines streaming behind
      ...([[0.52, 0.0], [0.42, -0.05], [0.62, 0.05], [0.34, 0.08], [0.72, -0.08]] as [number, number][]).map(([y, z], i): Shape => ({ t: "cap", a: [-0.5, y, z], b: [-0.5 - 0.3 - (i % 2) * 0.15, y, z], r: [0.018, 0.004], col: "streak", k: 0 })),
      // hull
      { t: "ell", c: [0, 0.42, 0], r: [0.42, 0.13, 0.15], col: "wood" },
      { t: "cap", a: [0.25, 0.44, 0], b: [0.52, 0.5, 0], r: [0.11, 0.015], col: "wood", k: 0.06 },
      { t: "box", c: [0.05, 0.62, 0], s: [0.6, 0.15, 0.25], round: 0.0, col: "wood", cut: true, k: 0.02 },
      { t: "ell", c: [0, 0.465, 0], r: [0.37, 0.018, 0.115], col: "deck", k: 0.01 },
      // plank lines and a rune strip
      ...[0.37, 0.31].map((y): Shape => ({ t: "box", c: [0, y, 0], s: [0.6, 0.006, 0.3], round: 0.003, col: "wood2", paint: true })),
      { t: "box", c: [0.08, 0.41, 0.15], s: [0.16, 0.012, 0.02], round: 0.006, col: "rune", paint: true },
      // brass gunwale
      ...path(Array.from({ length: 21 }, (_, i): V3 => [0.4 * Math.cos(rad(18 * i)), 0.47, 0.145 * Math.sin(rad(18 * i))]), 0.016, 0.016, "brass", 0.005),
      // mast and sail-wing
      { t: "cap", a: [0.04, 0.46, 0], b: [-0.15, 1.0, 0], r: [0.018, 0.012], col: "wood2", k: 0.01 },
      ...Array.from({ length: 13 }, (_, i): Shape => {
        const y = 0.54 + i * 0.037, w = 0.3 * (1 - (i / 13) ** 1.3) + 0.02;
        return { t: "box", c: [0.01 - w / 2 - 0.16 * (i / 12) - 0.03 * Math.sin((i / 12) * Math.PI), y, 0], s: [w / 2, 0.022, 0.014], round: 0.012, col: "sail", k: 0.025 };
      }),
      { t: "cap", a: [0.03, 0.53, 0], b: [-0.34, 0.53, 0], r: [0.014, 0.012], col: "wood2", k: 0.01 },
      
      ...crest([-0.17, 0.7, 0.02], 0.17, { paint: true }),
      // side wings, swept back
      { t: "ell", c: [-0.08, 0.44, 0.22], r: [0.28, 0.024, 0.13], rot: [0, 22, -6], col: "sail", k: 0.02, mirror: true },
      { t: "cap", a: [0.14, 0.45, 0.17], b: [-0.32, 0.42, 0.33], r: [0.014, 0.012], col: "gold", k: 0.01, mirror: true },
      // brass tail fins
      { t: "box", c: [-0.42, 0.56, 0], s: [0.08, 0.1, 0.012], round: 0.01, rot: [0, 0, -30], col: "brass", k: 0.02 },
      { t: "box", c: [-0.42, 0.42, 0.1], s: [0.08, 0.012, 0.06], round: 0.008, rot: [0, 20, 0], col: "brass", k: 0.02, mirror: true },
      { t: "cap", a: [-0.38, 0.42, 0], b: [-0.48, 0.42, 0], r: [0.05, 0.04], col: "brass2", k: 0.02 },
      { t: "ell", c: [-0.49, 0.42, 0], r: [0.02, 0.035, 0.035], col: "rune", k: 0.005 },
      // figurehead star
      ...star([0.5, 0.52, 0.0], 0.05, "gold", 0.4),
    ], 12, [0, 0.4, 0]),
    eyes: [],
  },

  // Rectitud: a golden balance-scale held perfectly level, a glowing yellow gem at the pivot.
  rectitud: {
    palette: { gold: "#e3ad34", gold2: "#a87a20", goldhi: "#fff0b0", gem: "#ffe14a", gem2: "#ffb020", hot: "#fffbe0", base: "#5a4630", ray: "#ffe68a" },
    glow: ["gem", "hot", "ray"],
    shapes: [
      ...burst([0, 0.78, -0.25], 16, 0, 0.5, [0.025, 0.004], "ray", { len: 0.36, r: [0.02, 0.004], col: "ray" }, 0),
      // pedestal
      { t: "ell", c: [0, 0.03, 0], r: [0.24, 0.035, 0.18], col: "gold2" },
      { t: "ell", c: [0, 0.08, 0], r: [0.17, 0.035, 0.13], col: "gold", k: 0.02 },
      { t: "cap", a: [0, 0.1, 0], b: [0, 0.74, 0], r: [0.035, 0.024], col: "gold", k: 0.03 },
      ...[0.3, 0.52].map((y): Shape => ({ t: "tor", c: [0, y, 0], R: 0.034, r: 0.012, col: "gold2", k: 0.005 })),
      // beam
      { t: "cap", a: [-0.4, 0.78, 0], b: [0.4, 0.78, 0], r: [0.022, 0.022], col: "gold", k: 0.02 },
      ...[-1, 1].flatMap((sx): Shape[] => [
        dot([sx * 0.41, 0.78, 0], 0.03, "gold2"),
        // chains to the pans
        ...path([[sx * 0.41, 0.76, 0], [sx * 0.29, 0.4, 0]], 0.008, 0.008, "gold2", 0.005),
        ...path([[sx * 0.41, 0.76, 0], [sx * 0.53, 0.4, 0]], 0.008, 0.008, "gold2", 0.005),
        ...path([[sx * 0.41, 0.76, 0], [sx * 0.41, 0.4, 0.1]], 0.008, 0.008, "gold2", 0.005),
        // pan
        { t: "ell", c: [sx * 0.41, 0.36, 0], r: [0.16, 0.06, 0.14], col: "gold" },
        { t: "ell", c: [sx * 0.41, 0.42, 0], r: [0.14, 0.05, 0.12], col: "gold2", cut: true, k: 0.01 },
        { t: "tor", c: [sx * 0.41, 0.4, 0], R: 0.15, r: 0.012, col: "goldhi", k: 0.005 },
      ]),
      // pivot crown and the gem
      { t: "ell", c: [0, 0.8, 0], r: [0.08, 0.07, 0.05], col: "gold", k: 0.02 },
      { t: "box", c: [0, 0.88, 0.04], s: [0.07, 0.07, 0.04], round: 0.01, rot: [0, 0, 45], col: "gem", k: 0.01 },
      { t: "box", c: [0, 0.88, 0.07], s: [0.035, 0.035, 0.02], round: 0.01, rot: [0, 0, 45], col: "hot", paint: true },
      ...sparkle([0, 1.02, 0.05], 0.06, "hot"),
      ...sparkle([0.36, 0.98, 0.05], 0.04, "hot"),
      ...sparkle([-0.38, 0.6, 0.05], 0.035, "hot"),
    ],
    eyes: [],
  },

  // Olfato de Detective: a magnifying glass over a trail of footprints and a torn note, a warm lantern beside them.
  "olfato-detective": {
    palette: { floor: "#7a5638", floor2: "#5e402a", print: "#3a2618", paper: "#f2e6c8", ink: "#6a5040", brass: "#d4a248", brass2: "#9a7030", handle: "#6e3a22", glass: "#cfeef0", glint: "#ffffff", lamp: "#ffc45a", lamp2: "#fff0b8", iron: "#3a3438", warm: "#ffd98a" },
    glow: ["lamp", "lamp2", "warm"],
    shapes: [
      // floorboards
      { t: "box", c: [0, 0.03, 0], s: [0.5, 0.03, 0.34], round: 0.025, col: "floor" },
      ...[-0.2, 0.0, 0.2].map((z): Shape => ({ t: "box", c: [0, 0.06, z + 0.1], s: [0.52, 0.004, 0.006], round: 0.002, col: "floor2", paint: true })),
      // warm lamp glow pool
      { t: "ell", c: [-0.3, 0.06, -0.12], r: [0.2, 0.004, 0.14], col: "warm", paint: true },
      // footprints trailing toward the back
      ...([[0.34, 0.22, -20], [0.18, 0.08, -20], [0.04, 0.2, -20], [-0.12, 0.06, -20], [-0.26, 0.17, -20]] as [number, number, number][]).flatMap(([x, z, a]): Shape[] => [
        { t: "ell", c: [x, 0.06, z], r: [0.05, 0.01, 0.028], rot: [0, a, 0], col: "print", paint: true },
        { t: "ell", c: [x - 0.065, 0.06, z + 0.02], r: [0.025, 0.01, 0.022], rot: [0, a, 0], col: "print", paint: true },
      ]),
      // torn note
      { t: "box", c: [0.24, 0.07, -0.12], s: [0.13, 0.008, 0.09], round: 0.004, rot: [0, -15, 0], col: "paper", k: 0 },
      ...[0.3, 0.24, 0.18].map((x): Shape => ({ t: "ell", c: [x, 0.07, -0.21], r: [0.03, 0.02, 0.022], col: "paper", cut: true, k: 0 })),
      ...[-0.15, -0.11, -0.07].map((z): Shape => ({ t: "box", c: [0.24, 0.08, z], s: [0.09, 0.006, 0.007], round: 0.003, rot: [0, -15, 0], col: "ink", paint: true })),
      // lantern (back left)
      { t: "box", c: [-0.34, 0.1, -0.14], s: [0.07, 0.02, 0.07], round: 0.01, col: "iron", k: 0.01 },
      { t: "box", c: [-0.34, 0.2, -0.14], s: [0.055, 0.08, 0.055], round: 0.02, col: "lamp", k: 0.01 },
      { t: "ell", c: [-0.34, 0.2, -0.14], r: [0.025, 0.04, 0.025], col: "lamp2", paint: true },
      ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]): Shape => ({ t: "cap", a: [-0.34 + sx * 0.055, 0.12, -0.14 + sz * 0.055], b: [-0.34 + sx * 0.055, 0.28, -0.14 + sz * 0.055], r: [0.009, 0.009], col: "iron", k: 0.005 })),
      { t: "cap", a: [-0.34, 0.29, -0.14], b: [-0.34, 0.34, -0.14], r: [0.06, 0.012], col: "iron", k: 0.01 },
      { t: "tor", c: [-0.34, 0.37, -0.14], R: 0.025, r: 0.007, rot: [90, 0, 0], col: "iron", k: 0.005 },
      ...sparkle([-0.34, 0.2, -0.04], 0.09, "warm"),
      // magnifying glass, lens facing the camera, enlarged footprint seen through it
      { t: "ell", c: [0.0, 0.56, 0.08], r: [0.2, 0.2, 0.025], col: "glass", k: 0 },
      { t: "tor", c: [0.0, 0.56, 0.08], R: 0.21, r: 0.032, rot: [90, 0, 0], col: "brass", k: 0.01 },
      { t: "ell", c: [0.03, 0.54, 0.1], r: [0.1, 0.055, 0.02], rot: [0, 0, -20], col: "print", paint: true },
      { t: "ell", c: [-0.09, 0.6, 0.1], r: [0.05, 0.045, 0.02], rot: [0, 0, -20], col: "print", paint: true },
      { t: "ell", c: [-0.09, 0.66, 0.11], r: [0.045, 0.025, 0.02], rot: [0, 0, 40], col: "glint", paint: true },
      { t: "cap", a: [0.15, 0.41, 0.08], b: [0.2, 0.36, 0.08], r: [0.03, 0.03], col: "brass2", k: 0.01 },
      { t: "cap", a: [0.2, 0.36, 0.08], b: [0.4, 0.14, 0.1], r: [0.04, 0.032], col: "handle", k: 0.02 },
    ],
    eyes: [],
  },

  // Ojo Vigilante: a brass periscope-spyglass on a tripod, its lens an open glowing eye, a pinned map below.
  "ojo-vigilante": {
    palette: { ...GUARD, brass: "#d4a248", brass2: "#9a7030", wood: "#7a4a26", map: "#f0dfb4", map2: "#c8a874", ink: "#8a5a3a", pin: "#c8283a", eye: "#e8fbff", iris: "#3fc0ff", pupil: "#14223a", ray: "#9fe8ff" },
    glow: ["eye", "iris", "ray"],
    shapes: [
      // pinned map lying on a low slanted board at the foot of the tripod
      ...tiltX([
        { t: "box", c: [0.0, 0.05, 0.12], s: [0.36, 0.02, 0.22], round: 0.015, col: "wood", k: 0 },
        { t: "box", c: [0.0, 0.075, 0.12], s: [0.32, 0.008, 0.19], round: 0.006, col: "map", k: 0 },
        ...path([[-0.26, 0.085, 0.24], [-0.12, 0.085, 0.1], [0.0, 0.085, 0.16], [0.12, 0.085, 0.02], [0.24, 0.085, 0.06]], 0.008, 0.008, "ink", 0, true),
        { t: "ell", c: [-0.18, 0.085, 0.02], r: [0.06, 0.01, 0.04], col: "map2", paint: true },
        { t: "ell", c: [0.18, 0.085, 0.22], r: [0.07, 0.01, 0.04], col: "map2", paint: true },
        ...([[-0.26, 0.24], [0.12, 0.02], [0.24, 0.06]] as [number, number][]).flatMap(([x, z]): Shape[] => [
          { t: "cap", a: [x, 0.08, z], b: [x, 0.12, z], r: [0.006, 0.006], col: "brass2", k: 0 },
          dot([x, 0.13, z], 0.02, "pin"),
        ]),
      ], 22, [0, 0.05, 0.12]),
      // tripod
      ...[90, 210, 330].map((a): Shape => ({ t: "cap", a: [0, 0.5, -0.05], b: [0.3 * Math.cos(rad(a)), 0.02, -0.05 + 0.3 * Math.sin(rad(a)) * 0.6 - 0.04], r: [0.022, 0.016], col: "wood", k: 0.02 })),
      { t: "ell", c: [0, 0.5, -0.05], r: [0.06, 0.04, 0.06], col: "brass2", k: 0.02 },
      // periscope: vertical tube, elbow, lens barrel toward the camera
      { t: "cap", a: [0, 0.52, -0.05], b: [0, 0.82, -0.05], r: [0.06, 0.06], col: "brass", k: 0.02 },
      ...[0.6, 0.74].map((y): Shape => ({ t: "tor", c: [0, y, -0.05], R: 0.062, r: 0.014, col: "brass2", k: 0.005 })),
      { t: "ell", c: [0, 0.84, -0.05], r: [0.085, 0.085, 0.085], col: "brass", k: 0.03 },
      { t: "cap", a: [0, 0.84, -0.05], b: [0, 0.84, 0.12], r: [0.075, 0.1], col: "brass", k: 0.03 },
      { t: "cap", a: [0, 0.84, 0.12], b: [0, 0.84, 0.2], r: [0.13, 0.15], col: "brass", k: 0.02 },
      { t: "ell", c: [0, 0.84, 0.36], r: [0.135, 0.135, 0.07], col: "brass", cut: true, k: 0.01 },
      { t: "tor", c: [0, 0.84, 0.29], R: 0.15, r: 0.022, rot: [90, 0, 0], col: "brass2", k: 0.01 },
      // the eye-shaped lens
      { t: "ell", c: [0, 0.84, 0.28], r: [0.13, 0.13, 0.012], col: "blue2", k: 0.01 },
      { t: "ell", c: [0, 0.84, 0.29], r: [0.12, 0.07, 0.012], col: "eye", k: 0.004 },
      { t: "ell", c: [0, 0.84, 0.3], r: [0.055, 0.055, 0.01], col: "iris", paint: true },
      { t: "ell", c: [0, 0.84, 0.305], r: [0.024, 0.032, 0.01], col: "pupil", paint: true },
      { t: "ell", c: [-0.022, 0.862, 0.305], r: [0.011, 0.011, 0.01], col: "eye", paint: true },
      // short vigilant rays around the lens
      ...Array.from({ length: 10 }, (_, i): Shape => { const a = rad(18 + 36 * i); return { t: "cap", a: [0.2 * Math.cos(a), 0.84 + 0.2 * Math.sin(a), 0.22], b: [0.3 * Math.cos(a), 0.84 + 0.3 * Math.sin(a), 0.22], r: [0.014, 0.004], col: "ray", k: 0 }; }),
      // little gold star badge on the tube
      ...star([0, 0.67, 0.015], 0.035, "gold", 0.4),
    ],
    eyes: [],
  },

  // Contrainteligencia: a sealed letter crossed by a red X ribbon, its wax seal broken, an old key in front, violet shadows behind.
  contrainteligencia: {
    palette: { paper: "#ece0c2", paper2: "#c9b48a", ribbon: "#c0262e", ribbon2: "#8a1820", wax: "#a81c24", wax2: "#e0505a", key: "#b88a3e", key2: "#7a5a26", shade: "#2e2848", shade2: "#4a3e6e", glint: "#fff4d0" },
    glow: ["glint"],
    shapes: [
      // mysterious shadows behind
      { t: "ell", c: [-0.12, 0.62, -0.28], r: [0.42, 0.36, 0.04], col: "shade", k: 0 },
      { t: "ell", c: [0.22, 0.44, -0.24], r: [0.3, 0.26, 0.04], col: "shade2", k: 0.1 },
      // envelope, leaning back slightly
      ...rotZ([
        { t: "box", c: [0, 0.55, 0], s: [0.36, 0.24, 0.02], round: 0.015, col: "paper" },
        ...path([[-0.34, 0.77, 0.022], [0, 0.5, 0.022], [0.34, 0.77, 0.022]], 0.008, 0.008, "paper2", 0, true),
        ...path([[-0.34, 0.33, 0.022], [-0.08, 0.53, 0.022]], 0.006, 0.006, "paper2", 0, true),
        ...path([[0.34, 0.33, 0.022], [0.08, 0.53, 0.022]], 0.006, 0.006, "paper2", 0, true),
        // red X ribbon
        { t: "box", c: [0, 0.55, 0.03], s: [0.46, 0.035, 0.012], round: 0.008, rot: [0, 0, 33], col: "ribbon", k: 0.005 },
        { t: "box", c: [0, 0.55, 0.035], s: [0.46, 0.035, 0.012], round: 0.008, rot: [0, 0, -33], col: "ribbon", k: 0.005 },
        // broken wax seal: two halves pulled apart, with drips
        { t: "ell", c: [-0.04, 0.53, 0.06], r: [0.065, 0.1, 0.03], col: "wax", k: 0.01 },
        { t: "ell", c: [0.06, 0.5, 0.06], r: [0.06, 0.1, 0.03], rot: [0, 0, -12], col: "wax", k: 0.01 },
        { t: "box", c: [0.01, 0.52, 0.07], s: [0.012, 0.14, 0.06], round: 0.004, rot: [0, 0, -14], col: "wax", cut: true, k: 0.004 },
        { t: "ell", c: [-0.05, 0.56, 0.09], r: [0.03, 0.03, 0.01], col: "wax2", paint: true },
        { t: "ell", c: [0.07, 0.52, 0.09], r: [0.026, 0.026, 0.01], col: "wax2", paint: true },
        dot([0.12, 0.41, 0.05], 0.018, "wax"),
      ], 8, [0, 0.3, 0]),
      // old key across the front
      ...rotZ([
        { t: "tor", c: [-0.3, 0.0, 0.0], R: 0.075, r: 0.024, rot: [90, 0, 0], col: "key", k: 0.01 },
        { t: "tor", c: [-0.3, 0.0, 0.0], R: 0.035, r: 0.012, rot: [90, 0, 0], col: "key", k: 0.01 },
        { t: "cap", a: [-0.22, 0, 0], b: [0.28, 0, 0], r: [0.024, 0.02], col: "key", k: 0.01 },
        { t: "tor", c: [-0.19, 0, 0], R: 0.028, r: 0.012, rot: [0, 0, 90], col: "key2", k: 0.005 },
        { t: "box", c: [0.2, -0.05, 0], s: [0.025, 0.05, 0.014], round: 0.006, col: "key", k: 0.01 },
        { t: "box", c: [0.26, -0.065, 0], s: [0.02, 0.065, 0.014], round: 0.006, col: "key", k: 0.01 },
        { t: "box", c: [0.23, -0.1, 0], s: [0.045, 0.012, 0.014], round: 0.005, col: "key", k: 0.01 },
        dot([0.28, 0, 0], 0.026, "key2"),
      ], 22, [0, 0, 0]).map((s) => move([s], [0.02, 0.22, 0.14])[0]),
      ...sparkle([-0.28, 0.32, 0.18], 0.04, "glint"),
      ...sparkle([0.38, 0.86, 0.06], 0.04, "glint"),
    ],
    eyes: [],
  },

  // Insignia de la Guardia: a shiny gold-rimmed blue shield badge with a gold star, hanging from a blue ribbon.
  "insignia-guardia": {
    palette: { ...GUARD, ribbon: "#2a4fae", ribbon2: "#1a3478", hot: "#fffbe8" },
    glow: ["goldhi", "hot", "ray"],
    shapes: [
      ...burst([0, 0.42, -0.25], 16, 0, 0.5, [0.025, 0.004], "ray", { len: 0.36, r: [0.02, 0.004], col: "ray" }, 0),
      // ribbon: a V of two blue bands up to a gold pin bar
      { t: "box", c: [-0.1, 0.84, -0.04], s: [0.065, 0.17, 0.012], round: 0.01, rot: [0, 0, -18], col: "ribbon", k: 0.01 },
      { t: "box", c: [0.1, 0.84, -0.04], s: [0.065, 0.17, 0.012], round: 0.01, rot: [0, 0, 18], col: "ribbon2", k: 0.01 },
      { t: "box", c: [-0.1, 0.84, -0.025], s: [0.016, 0.17, 0.01], round: 0.004, rot: [0, 0, -18], col: "gold", paint: true },
      { t: "box", c: [0.1, 0.84, -0.025], s: [0.016, 0.17, 0.01], round: 0.004, rot: [0, 0, 18], col: "gold", paint: true },
      { t: "box", c: [0, 1.0, -0.04], s: [0.22, 0.03, 0.03], round: 0.025, col: "gold", k: 0.01 },
      dot([-0.22, 1.0, -0.04], 0.035, "gold2"),
      dot([0.22, 1.0, -0.04], 0.035, "gold2"),
      // the badge
      ...place([...kiteShield("blue", "gold", 0.05), ...star([0, 0.56, 0.05], 0.18, "gold", 0.35)], 0.82, [0, 0.0, 0.0]),
      { t: "ell", c: [-0.13, 0.62, 0.05], r: [0.035, 0.08, 0.01], rot: [0, 0, -25], col: "blue3", paint: true },
      { t: "ell", c: [-0.03, 0.5, 0.075], r: [0.02, 0.02, 0.01], col: "goldhi", paint: true },
      ...sparkle([0.28, 0.8, 0.08], 0.07, "hot"),
      ...sparkle([-0.3, 0.3, 0.06], 0.045, "hot"),
    ],
    eyes: [],
  },
};
