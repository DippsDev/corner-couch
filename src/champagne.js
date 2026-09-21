import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MODEL_URL = `${import.meta.env.BASE_URL}models/bottle_of_champagne.glb`;

function sharpenTextures(mat, maxAniso) {
  for (const mapKey of [
    "map",
    "normalMap",
    "roughnessMap",
    "metalnessMap",
    "aoMap",
    "emissiveMap",
    "alphaMap",
  ]) {
    const tex = mat[mapKey];
    if (!tex) continue;
    tex.anisotropy = maxAniso;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (mapKey === "map" || mapKey === "emissiveMap") tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
  }
}

function toClearGlass(mat) {
  const glass = new THREE.MeshPhysicalMaterial({
    map: mat.map ?? null,
    normalMap: mat.normalMap ?? null,
    roughnessMap: mat.roughnessMap ?? null,
    metalnessMap: mat.metalnessMap ?? null,
    normalScale: mat.normalScale?.clone?.() ?? new THREE.Vector2(1, 1),
    color: mat.color?.clone?.() ?? new THREE.Color(0xffffff),
    roughness: 0.04,
    metalness: 0,
    transmission: 0.88,
    thickness: 0.55,
    ior: 1.48,
    specularIntensity: 1,
    envMapIntensity: 1.8,
    transparent: true,
    opacity: 1,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  mat.dispose?.();
  return glass;
}

function polishFoil(mat) {
  mat.envMapIntensity = 1.9;
  mat.roughness = Math.min(mat.roughness ?? 0.35, 0.22);
  mat.metalness = Math.max(mat.metalness ?? 0.2, 0.55);
  if (mat.normalScale) mat.normalScale.set(1.35, 1.35);
  mat.side = THREE.DoubleSide;
  mat.needsUpdate = true;
  return mat;
}

export function createChampagneViewer(canvas, { reduceMotion = false } = {}) {
  if (!canvas) return { setActive() {}, destroy() {} };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral keeps label/foil contrast clearer than ACES.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.sortObjects = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 100);

  const pmrem = new THREE.PMREMGenerator(renderer);
  // Higher blur floor = softer env; keep it low for crisp reflections.
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.015).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 1.55;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xfff8ef, 0x14110d, 0.4));

  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3.2, 4.8, 3.6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffe7c2, 0.7);
  fill.position.set(-2.8, 1.8, 1.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xc9a45c, 1.15);
  rim.position.set(-2.4, 2.2, -3.2);
  scene.add(rim);

  const kick = new THREE.DirectionalLight(0xffffff, 0.45);
  kick.position.set(0.4, -2.8, 2.2);
  scene.add(kick);

  const root = new THREE.Group();
  scene.add(root);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.enableZoom = false;
  controls.panSpeed = 0.65;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 0.35;
  controls.maxDistance = 6;
  controls.maxPolarAngle = Math.PI * 0.92;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 4.8;
  controls.target.set(0, 0, 0);

  let bottle = null;
  let frame = 0;
  let active = false;
  let ready = false;
  let disposed = false;
  let framed = false;
  let resumeTimer = 0;

  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";

  const onControlStart = () => {
    canvas.style.cursor = "grabbing";
    controls.autoRotate = false;
    window.clearTimeout(resumeTimer);
  };

  const onControlEnd = () => {
    canvas.style.cursor = "grab";
    window.clearTimeout(resumeTimer);
    if (!reduceMotion) {
      resumeTimer = window.setTimeout(() => {
        if (!disposed) controls.autoRotate = true;
      }, 2200);
    }
  };

  controls.addEventListener("start", onControlStart);
  controls.addEventListener("end", onControlEnd);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      if (disposed) return;
      bottle = gltf.scene;
      bottle.traverse((node) => {
        if (!node.isMesh) return;
        const isSuit = /suit|foil|cork|label/i.test(node.name);
        if (isSuit) node.renderOrder = 1;

        const mats = Array.isArray(node.material) ? node.material : [node.material];
        const next = mats.map((mat) => {
          if (!mat) return mat;
          sharpenTextures(mat, maxAniso);
          const glassLike =
            mat.transparent ||
            mat.opacity < 1 ||
            /glass/i.test(mat.name || "") ||
            /glass/i.test(node.name || "");
          if (glassLike && !isSuit) return toClearGlass(mat);
          return polishFoil(mat);
        });

        node.material = Array.isArray(node.material) ? next : next[0];
      });

      root.add(bottle);
      root.rotation.set(0.42, 0.35, -0.18);
      ready = true;
      canvas.classList.add("is-ready");
      resize();
      frameBottle(true);
      if (active) start();
      else renderer.render(scene, camera);
    },
    undefined,
    () => {
      canvas.classList.add("is-failed");
    },
  );

  function frameBottle(force = false) {
    if (!bottle || (framed && !force)) return;

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const padding = 1.02;
    const fitH = Math.max(size.y, 0.001) * padding;
    const fitW = Math.max(size.x, 0.001) * padding;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distH = fitH / 2 / Math.tan(fov / 2);
    const distW = fitW / 2 / Math.tan(fov / 2) / Math.max(camera.aspect, 0.001);
    const dist = Math.max(distH, distW);

    controls.target.copy(center);
    camera.position.set(
      center.x + dist * 0.72,
      center.y + dist * 0.28,
      center.z + dist * 0.78,
    );
    camera.near = Math.max(dist / 140, 0.01);
    camera.far = dist * 50;
    camera.updateProjectionMatrix();
    controls.minDistance = dist * 0.35;
    controls.maxDistance = dist * 3.2;
    controls.update();
    framed = true;
  }

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    // Prefer native retina pixels for label/foil clarity.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (ready && !framed) frameBottle(true);
  }

  function render() {
    if (!active || disposed) return;
    frame = requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  }

  function start() {
    if (disposed || !ready) return;
    cancelAnimationFrame(frame);
    resize();
    controls.autoRotate = !reduceMotion;
    frame = requestAnimationFrame(render);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    window.clearTimeout(resumeTimer);
  }

  const onResize = () => {
    if (!active) return;
    resize();
  };
  window.addEventListener("resize", onResize);

  return {
    setActive(on) {
      active = Boolean(on);
      if (active) start();
      else stop();
    },
    destroy() {
      disposed = true;
      active = false;
      stop();
      controls.removeEventListener("start", onControlStart);
      controls.removeEventListener("end", onControlEnd);
      controls.dispose();
      window.removeEventListener("resize", onResize);
      envTex.dispose?.();
      scene.traverse((node) => {
        if (node.geometry) node.geometry.dispose?.();
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          if (!mat) return;
          Object.values(mat).forEach((value) => {
            if (value && value.isTexture) value.dispose?.();
          });
          mat.dispose?.();
        });
      });
      renderer.dispose();
    },
  };
}
