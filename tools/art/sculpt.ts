import * as THREE from "three";

/**
 * Sculpted creatures: each design is a list of soft shapes (ellipsoids, tapered capsules,
 * rounded boxes, tori) blended into ONE smooth surface with a signed distance field, meshed with
 * surface nets and painted per region. Shaded as toon (cel bands) with an ink outline and big
 * glossy eyes, like modern 3D monster games. Space: the creature faces +x, feet on y = 0,
 * height ≈ 1, the camera side is +z.
 */

export type V3 = [number, number, number];

interface Base {
  /** Palette key for its colour. */
  col: string;
  /** Smooth-blend radius with what came before (0 = hard seam). */
  k?: number;
  /** Also add the copy mirrored across z (left/right pairs). */
  mirror?: boolean;
  /** Only paints the surface inside it (markings, belly, stripes); adds no volume. */
  paint?: boolean;
  /** Carves it out of the body (mouths, sockets). */
  cut?: boolean;
  /** Euler rotation in degrees (x, y, z). */
  rot?: V3;
}
export type Shape =
  | (Base & { t: "ell"; c: V3; r: V3 })
  | (Base & { t: "cap"; a: V3; b: V3; r: [number, number] })
  | (Base & { t: "box"; c: V3; s: V3; round: number })
  | (Base & { t: "tor"; c: V3; R: number; r: number });

export interface EyeSpec { at: V3; r: number; iris: string; mirror?: boolean; angry?: boolean; look?: V3 }

export interface Sculpt {
  palette: Record<string, string>;
  shapes: Shape[];
  eyes: EyeSpec[];
  /** Palette keys that glow (data seams, flames, cores). */
  glow?: string[];
}

// MARK: Distance functions

interface Prim { kind: Shape["t"]; inv: THREE.Matrix4 | null; c: V3; data: number[]; col: string; k: number; paint: boolean; cut: boolean; lo: V3; hi: V3 }

function smin(a: number, b: number, k: number): number {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function smaxCut(a: number, b: number, k: number): number {
  // a minus b (b is the carved shape's distance)
  const nb = -b;
  if (k <= 0) return Math.max(a, nb);
  const h = Math.max(k - Math.abs(a - nb), 0) / k;
  return Math.max(a, nb) + h * h * k * 0.25;
}

const tmp = new THREE.Vector3();
function local(p: THREE.Vector3, pr: Prim): THREE.Vector3 {
  tmp.set(p.x - pr.c[0], p.y - pr.c[1], p.z - pr.c[2]);
  if (pr.inv) tmp.applyMatrix4(pr.inv);
  return tmp;
}

function primDist(p: THREE.Vector3, pr: Prim): number {
  const d = pr.data;
  switch (pr.kind) {
    case "ell": {
      const q = local(p, pr);
      const k0 = Math.hypot(q.x / d[0], q.y / d[1], q.z / d[2]);
      const k1 = Math.hypot(q.x / (d[0] * d[0]), q.y / (d[1] * d[1]), q.z / (d[2] * d[2]));
      return k1 === 0 ? -Math.min(d[0], d[1], d[2]) : (k0 * (k0 - 1)) / k1;
    }
    case "cap": {
      // Round cone from a (radius r1) to b (radius r2); a is stored relative to c = a.
      const q = local(p, pr);
      const bx = d[0], by = d[1], bz = d[2], r1 = d[3], r2 = d[4];
      const l2 = bx * bx + by * by + bz * bz;
      if (l2 < 1e-9) return Math.hypot(q.x, q.y, q.z) - r1;
      const rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
      const y = q.x * bx + q.y * by + q.z * bz;
      const z = y - l2;
      const xx = (q.x * l2 - bx * y) ** 2 + (q.y * l2 - by * y) ** 2 + (q.z * l2 - bz * y) ** 2;
      const y2 = y * y * l2, z2 = z * z * l2;
      const k = Math.sign(rr) * rr * rr * xx;
      if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(xx + z2) * il2 - r2;
      if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(xx + y2) * il2 - r1;
      return (Math.sqrt(xx * a2 * il2) + y * rr) * il2 - r1;
    }
    case "box": {
      const q = local(p, pr);
      const r = d[3];
      const qx = Math.abs(q.x) - d[0] + r, qy = Math.abs(q.y) - d[1] + r, qz = Math.abs(q.z) - d[2] + r;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
    }
    case "tor": {
      const q = local(p, pr);
      const qx = Math.hypot(q.x, q.z) - d[0];
      return Math.hypot(qx, q.y) - d[1];
    }
  }
}

function toPrims(s: Sculpt): Prim[] {
  const out: Prim[] = [];
  const add = (sh: Shape, mz: boolean) => {
    const f = (v: V3): V3 => (mz ? [v[0], v[1], -v[2]] : v);
    let inv: THREE.Matrix4 | null = null;
    if (sh.rot) {
      const r = sh.rot.map((x) => (x * Math.PI) / 180);
      const e = new THREE.Euler(mz ? -r[0] : r[0], mz ? -r[1] : r[1], r[2]);
      inv = new THREE.Matrix4().makeRotationFromEuler(e).invert();
    }
    let c: V3, data: number[], ext: number;
    switch (sh.t) {
      case "ell": c = f(sh.c); data = [...sh.r]; ext = Math.max(...sh.r); break;
      case "cap": {
        const a = f(sh.a), b = f(sh.b);
        c = a; data = [b[0] - a[0], b[1] - a[1], b[2] - a[2], sh.r[0], sh.r[1]];
        ext = Math.hypot(data[0], data[1], data[2]) + Math.max(sh.r[0], sh.r[1]);
        inv = null;
        break;
      }
      case "box": c = f(sh.c); data = [...sh.s, sh.round]; ext = Math.hypot(...sh.s); break;
      case "tor": c = f(sh.c); data = [sh.R, sh.r]; ext = sh.R + sh.r; break;
    }
    const lo: V3 = [c[0] - ext, c[1] - ext, c[2] - ext], hi: V3 = [c[0] + ext, c[1] + ext, c[2] + ext];
    if (sh.t === "cap") { const b: V3 = [c[0] + data[0], c[1] + data[1], c[2] + data[2]]; for (let i = 0; i < 3; i++) { lo[i] = Math.min(c[i], b[i]) - Math.max(sh.r[0], sh.r[1]); hi[i] = Math.max(c[i], b[i]) + Math.max(sh.r[0], sh.r[1]); } }
    out.push({ kind: sh.t, inv, c, data, col: sh.col, k: sh.k ?? 0.04, paint: !!sh.paint, cut: !!sh.cut, lo, hi });
  };
  for (const sh of s.shapes) { add(sh, false); if (sh.mirror) add(sh, true); }
  return out;
}

/** Distance from p to a primitive's bounding box (a cheap lower bound of its distance). */
function boxDist(p: THREE.Vector3, pr: Prim): number {
  const dx = Math.max(pr.lo[0] - p.x, 0, p.x - pr.hi[0]), dy = Math.max(pr.lo[1] - p.y, 0, p.y - pr.hi[1]), dz = Math.max(pr.lo[2] - p.z, 0, p.z - pr.hi[2]);
  return Math.hypot(dx, dy, dz);
}

function field(p: THREE.Vector3, prims: Prim[]): number {
  let d = 1e9;
  for (const pr of prims) {
    if (pr.paint) continue;
    // A shape too far away to change the blend is skipped.
    if (!pr.cut && d < 1e9 && boxDist(p, pr) > d + pr.k) continue;
    if (pr.cut && boxDist(p, pr) > pr.k) continue;
    const pd = primDist(p, pr);
    d = pr.cut ? smaxCut(d, pd, pr.k) : d === 1e9 ? pd : smin(d, pd, pr.k);
  }
  return d;
}

/**
 * The colour at a surface point: the nearest shape's colour, blended over about one cell with the
 * runner-up and with paint edges, so region borders come out smooth instead of stair-stepped.
 * Returns the colour and the palette key that dominates there.
 */
function colourAt(p: THREE.Vector3, prims: Prim[], pal: Map<string, THREE.Color>, w: number, out: THREE.Color): string {
  let best = "", bd = 1e9, second = "", sd = 1e9;
  for (const pr of prims) {
    if (pr.paint || pr.cut) continue;
    if (boxDist(p, pr) > sd) continue;
    const d = primDist(p, pr);
    if (d < bd) { if (pr.col !== best) { second = best; sd = bd; } best = pr.col; bd = d; }
    else if (d < sd && pr.col !== best) { second = pr.col; sd = d; }
  }
  const base = pal.get(best) ?? new THREE.Color("#ff00ff");
  out.copy(base);
  if (second) {
    const t = Math.min(1, (sd - bd) / w);
    if (t < 1) out.lerp(pal.get(second) ?? base, 0.5 * (1 - t));
  }
  let key = best;
  for (const pr of prims) {
    if (!pr.paint || boxDist(p, pr) > w) continue;
    const d = primDist(p, pr);
    const t = Math.min(1, Math.max(0, 0.5 - d / w));
    if (t > 0) { out.lerp(pal.get(pr.col) ?? out, t); if (t >= 0.5) key = pr.col; }
  }
  return key;
}

// MARK: Meshing (naive surface nets)

export interface SculptEye { p: V3; n: V3; r: number; iris: string; angry: boolean }
/** A computed sculpt as plain arrays (so it can come from a worker): feet on y = 0, centred. */
export interface SculptData { pos: Float32Array; nrm: Float32Array; col: Float32Array; body: Uint32Array; glow: Uint32Array; height: number; width: number; eyes: SculptEye[] }

export function sculptData(s: Sculpt, cells = 84): SculptData {
  const prims = toPrims(s);
  const solid = prims.filter((p) => !p.paint && !p.cut);
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const p of solid) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p.lo[i]); hi[i] = Math.max(hi[i], p.hi[i]); }
  const span = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
  const h = span / cells;
  for (let i = 0; i < 3; i++) { lo[i] -= h * 2; hi[i] += h * 2; }
  const nx = Math.ceil((hi[0] - lo[0]) / h) + 1, ny = Math.ceil((hi[1] - lo[1]) / h) + 1, nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
  const vals = new Float32Array(nx * ny * nz);
  const P = new THREE.Vector3();
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  // Coarse pass every 4 cells; fine values only near the surface (the field is a distance bound).
  const S = 4;
  const cx = Math.ceil((nx - 1) / S) + 1, cy = Math.ceil((ny - 1) / S) + 1, cz = Math.ceil((nz - 1) / S) + 1;
  const coarse = new Float32Array(cx * cy * cz);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    coarse[i + cx * (j + cy * k)] = field(P.set(lo[0] + i * S * h, lo[1] + j * S * h, lo[2] + k * S * h), prims);
  }
  const band = S * h * 1.8;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const ci = Math.round(i / S), cj = Math.round(j / S), ck = Math.round(k / S);
    const c = coarse[Math.min(ci, cx - 1) + cx * (Math.min(cj, cy - 1) + cy * Math.min(ck, cz - 1))];
    vals[at(i, j, k)] = Math.abs(c) > band ? c : field(P.set(lo[0] + i * h, lo[1] + j * h, lo[2] + k * h), prims);
  }
  // One vertex per cell that the surface crosses.
  const cellV = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cIdx = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos: number[] = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const v = vals[at(i + corners[c][0], j + corners[c][1], k + corners[c][2])]; cv[c] = v; if (v < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of edges) {
      const va = cv[a], vb = cv[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += corners[a][0] + (corners[b][0] - corners[a][0]) * t;
      sy += corners[a][1] + (corners[b][1] - corners[a][1]) * t;
      sz += corners[a][2] + (corners[b][2] - corners[a][2]) * t;
      n++;
    }
    cellV[cIdx(i, j, k)] = pos.length / 3;
    pos.push(lo[0] + (i + sx / n) * h, lo[1] + (j + sy / n) * h, lo[2] + (k + sz / n) * h);
  }
  // Quads across every grid edge with a sign change.
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = vals[at(i, j, k)] < 0, b = vals[at(i + 1, j, k)] < 0;
    if (a === b) continue;
    quad(cellV[cIdx(i, j - 1, k - 1)], cellV[cIdx(i, j, k - 1)], cellV[cIdx(i, j, k)], cellV[cIdx(i, j - 1, k)], a);
  }
  for (let k = 1; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const a = vals[at(i, j, k)] < 0, b = vals[at(i, j + 1, k)] < 0;
    if (a === b) continue;
    quad(cellV[cIdx(i - 1, j, k - 1)], cellV[cIdx(i - 1, j, k)], cellV[cIdx(i, j, k)], cellV[cIdx(i, j, k - 1)], a);
  }
  for (let k = 0; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const a = vals[at(i, j, k)] < 0, b = vals[at(i, j, k + 1)] < 0;
    if (a === b) continue;
    quad(cellV[cIdx(i - 1, j - 1, k)], cellV[cIdx(i, j - 1, k)], cellV[cIdx(i, j, k)], cellV[cIdx(i - 1, j, k)], a);
  }
  // Normals from the field's gradient; colours per region.
  const count = pos.length / 3;
  const nrm = new Float32Array(count * 3), col = new Float32Array(count * 3), glowFlag = new Uint8Array(count);
  const e = h * 0.5;
  const C = new THREE.Color();
  const glowKeys = new Set(s.glow ?? []);
  const hex = new Map<string, THREE.Color>();
  for (const [key, v] of Object.entries(s.palette)) hex.set(key, new THREE.Color(v));
  for (let v = 0; v < count; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    const gx = field(P.set(x + e, y, z), prims) - field(P.set(x - e, y, z), prims);
    const gy = field(P.set(x, y + e, z), prims) - field(P.set(x, y - e, z), prims);
    const gz = field(P.set(x, y, z + e), prims) - field(P.set(x, y, z - e), prims);
    const l = Math.hypot(gx, gy, gz) || 1;
    nrm[v * 3] = gx / l; nrm[v * 3 + 1] = gy / l; nrm[v * 3 + 2] = gz / l;
    const key = colourAt(P.set(x, y, z), prims, hex, h * 1.2, C);
    col[v * 3] = C.r; col[v * 3 + 1] = C.g; col[v * 3 + 2] = C.b;
    if (glowKeys.has(key)) glowFlag[v] = 1;
  }
  // Glowing regions get their own (unlit) mesh: triangles whose corners all glow.
  const bodyIdx: number[] = [], glowIdx: number[] = [];
  for (let t = 0; t < idx.length; t += 3) {
    const g = glowFlag[idx[t]] && glowFlag[idx[t + 1]] && glowFlag[idx[t + 2]];
    (g ? glowIdx : bodyIdx).push(idx[t], idx[t + 1], idx[t + 2]);
  }
  // Feet on y = 0, centred on x and z.
  let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (let v = 0; v < count; v++) {
    minX = Math.min(minX, pos[v * 3]); maxX = Math.max(maxX, pos[v * 3]);
    minY = Math.min(minY, pos[v * 3 + 1]); maxY = Math.max(maxY, pos[v * 3 + 1]);
    minZ = Math.min(minZ, pos[v * 3 + 2]); maxZ = Math.max(maxZ, pos[v * 3 + 2]);
  }
  const off: V3 = [-(minX + maxX) / 2, -minY, -(minZ + maxZ) / 2];
  const posOut = new Float32Array(pos.length);
  for (let v = 0; v < count; v++) for (let c = 0; c < 3; c++) posOut[v * 3 + c] = pos[v * 3 + c] + off[c];
  // Eyes: found on the surface along their look direction.
  const eyes: SculptEye[] = [];
  for (const e of s.eyes) {
    for (const side of e.mirror ? [1, -1] : [1]) {
      const look = e.look ?? [0.42, 0.08, 0.9];
      const dir: V3 = [look[0], look[1], look[2] * side];
      const from: V3 = [e.at[0] + dir[0] * 0.4, e.at[1] + dir[1] * 0.4, e.at[2] * side + dir[2] * 0.4];
      const hit = surfaceHitPrims(prims, from, [-dir[0], -dir[1], -dir[2]]);
      if (!hit) continue;
      eyes.push({ p: [hit.p.x + off[0], hit.p.y + off[1], hit.p.z + off[2]], n: [hit.n.x, hit.n.y, hit.n.z], r: e.r, iris: e.iris, angry: !!e.angry });
    }
  }
  return { pos: posOut, nrm, col, body: Uint32Array.from(bodyIdx), glow: Uint32Array.from(glowIdx), height: maxY - minY, width: maxX - minX, eyes };
}

/** Geometries for a computed sculpt (body, and glowing parts if any). */
export function sculptGeometries(d: SculptData): { geo: THREE.BufferGeometry; glow: THREE.BufferGeometry | null } {
  const make = (ix: Uint32Array) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(d.pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(d.nrm, 3));
    g.setAttribute("color", new THREE.BufferAttribute(d.col, 3));
    g.setIndex(new THREE.BufferAttribute(ix, 1));
    return g;
  };
  return { geo: make(d.body), glow: d.glow.length ? make(d.glow) : null };
}

/** Where a ray from `from` toward `dir` meets the surface (for placing eyes), and its normal. */
function surfaceHitPrims(prims: Prim[], from: V3, dir: V3): { p: THREE.Vector3; n: THREE.Vector3 } | undefined {
  const d = new THREE.Vector3(...dir).normalize();
  const p = new THREE.Vector3(...from);
  for (let i = 0; i < 160; i++) {
    const dist = field(p, prims);
    if (Math.abs(dist) < 0.0015) {
      const e = 0.003, P = new THREE.Vector3();
      const n = new THREE.Vector3(
        field(P.set(p.x + e, p.y, p.z), prims) - field(P.set(p.x - e, p.y, p.z), prims),
        field(P.set(p.x, p.y + e, p.z), prims) - field(P.set(p.x, p.y - e, p.z), prims),
        field(P.set(p.x, p.y, p.z + e), prims) - field(P.set(p.x, p.y, p.z - e), prims),
      ).normalize();
      return { p, n };
    }
    p.addScaledVector(d, Math.max(0.001, dist * 0.8));
  }
  return undefined;
}

// MARK: Look

let gradient: THREE.DataTexture | undefined;
/** Three cel bands: shadow, mid, lit. */
function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([105, 105, 105, 255, 170, 170, 170, 255, 225, 225, 225, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.magFilter = THREE.NearestFilter;
  gradient.minFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

/** Toon material with vertex colours and a soft rim light. */
export function toonMaterial(): THREE.MeshToonMaterial {
  // Not tone-mapped: the palette's colours stay as saturated as designed.
  const m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient(), toneMapped: false });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `float nv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
       outgoingLight += diffuseColor.rgb * pow(1.0 - nv, 3.0) * 0.35;
       #include <opaque_fragment>`,
    );
  };
  m.customProgramCacheKey = () => "sculpt-toon";
  return m;
}

/** An anime eye texture: outlined white, coloured iris with a darker rim, pupil, two highlights. */
const eyeTextures = new Map<string, THREE.Texture>();
export function eyeTexture(iris: string, angry: boolean): THREE.Texture {
  const key = `${iris}|${angry}`;
  const hit = eyeTextures.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1c1630";
  g.beginPath(); g.ellipse(64, 64, 60, 62, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath(); g.ellipse(64, 64, 53, 56, 0, 0, Math.PI * 2); g.fill();
  const grad = g.createLinearGradient(0, 30, 0, 110);
  grad.addColorStop(0, new THREE.Color(iris).multiplyScalar(0.55).getStyle());
  grad.addColorStop(1, iris);
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(74, 68, 36, 44, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#120c22";
  g.beginPath(); g.ellipse(76, 70, 18, 26, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath(); g.ellipse(64, 50, 12, 14, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(88, 92, 6, 6, 0, 0, Math.PI * 2); g.fill();
  if (angry) {
    // A heavy lid cutting the top of the eye.
    g.fillStyle = "#1c1630";
    g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 0); g.lineTo(128, 44); g.lineTo(0, 18); g.fill();
    g.globalCompositeOperation = "destination-out";
    g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 0); g.lineTo(128, 36); g.lineTo(0, 10); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  eyeTextures.set(key, t);
  return t;
}

/** A curved disc (spherical cap) for an eye: faces +z, radius 1. */
let eyeGeo: THREE.BufferGeometry | undefined;
export function eyeGeometry(): THREE.BufferGeometry {
  if (eyeGeo) return eyeGeo;
  const g = new THREE.PlaneGeometry(2, 2, 10, 10);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sqrt(Math.max(0, 1.6 - x * x * 0.3 - y * y * 0.3)) - Math.sqrt(1.6));
  }
  g.computeVertexNormals();
  eyeGeo = g;
  return g;
}

/** Shifts a palette's hues (Brillante colours). */
export function shiftPalette(p: Record<string, string>, turn: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) out[k] = `#${new THREE.Color(v).offsetHSL(turn, 0.08, 0.02).getHexString()}`;
  return out;
}
