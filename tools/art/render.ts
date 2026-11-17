import * as THREE from "three";
import { eyeGeometry, eyeTexture, sculptData, sculptGeometries, toonMaterial } from "./sculpt";
import { ART } from "./designs";
import { artKeys } from "./keys";

/**
 * Renders card art from sculpts (browser only): a toon-shaded model with an ink outline and big
 * eyes, on a transparent background, 3/4 view. Used by tools/art/render.mjs.
 */
let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

function setup() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  const key = new THREE.DirectionalLight("#fff0d8", 2.4); key.position.set(2.5, 3.5, 3);
  const fill = new THREE.DirectionalLight("#cfe0ff", 0.8); fill.position.set(-3, 1, 2);
  const rim = new THREE.DirectionalLight("#ffd9a8", 1.4); rim.position.set(-1, 2.5, -3);
  scene.add(key, fill, rim, new THREE.HemisphereLight("#fff6e8", "#b9a8d6", 1.1));
  camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
}

export function renderArt(key: string, size = 512, turn = -0.6): string | null {
  const design = ART[key];
  if (!design) return null;
  setup();
  const d = sculptData(design, 96);
  const { geo, glow } = sculptGeometries(d);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geo, toonMaterial()));
  if (glow) group.add(new THREE.Mesh(glow, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
  const ink = new THREE.MeshBasicMaterial({ color: "#1c1630", side: THREE.BackSide });
  ink.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <begin_vertex>", "vec3 transformed = position + normal * 0.01;"); };
  group.add(new THREE.Mesh(geo, ink));
  if (glow) group.add(new THREE.Mesh(glow, ink));
  for (const e of d.eyes) {
    const eye = new THREE.Mesh(eyeGeometry(), new THREE.MeshBasicMaterial({ map: eyeTexture(e.iris, e.angry), transparent: true, alphaTest: 0.2 }));
    const n = new THREE.Vector3(...e.n);
    eye.position.set(...e.p).addScaledVector(n, 0.004);
    eye.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    eye.scale.set(e.r * 0.85, e.r, e.r);
    group.add(eye);
  }
  group.rotation.y = turn;
  scene.add(group);
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const c = box.getCenter(new THREE.Vector3()), span = box.getSize(new THREE.Vector3());
  const radius = Math.max(span.x, span.y, span.z * 0.8) * 0.6;
  const dist = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(c.x + dist * 0.1, c.y + dist * 0.18, c.z + dist);
  camera.lookAt(c);
  renderer!.setSize(size, size, false);
  renderer!.render(scene, camera);
  const url = renderer!.domElement.toDataURL("image/png");
  scene.remove(group);
  geo.dispose(); glow?.dispose();
  return url;
}

declare global { interface Window { renderArt: typeof renderArt; artKeys: typeof artKeys; artDesigned: () => string[] } }
window.renderArt = renderArt;
window.artKeys = artKeys;
window.artDesigned = () => Object.keys(ART);
