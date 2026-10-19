// Logo WZS em 3D, no estilo "esfera de contornos".
// Os arcos do símbolo são as curvas de nível do campo h = x + sqrt(1 - y²)
// sobre uma esfera unitária: de frente, h = k * STEP desenha exatamente os
// círculos r=200 deslocados 44,44 px do assets/wzs-logo.svg. Como é um campo
// contínuo, cada arco vira um laço fechado que passa pela borda sem emenda,
// e somar um ruído de fluxo ao campo faz as linhas escorrerem pela esfera.
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const STEP = 44.44 / 200;    // distância entre arcos
const HW = 13 / 200 / 2;     // meia largura do traço
const RIDGE = 0.03;          // altura do relevo (dá volume de tubo)

export const STATES = {
  //        fluxo   camadas verso   corpo   giro   extras
  logo:    { noise: 0,    layers: 0, back: 0,    body: 0,    spin: 0, extra: 0 },
  camadas: { noise: 0.14, layers: 1, back: 0.25, body: 0,    spin: 0.6, extra: 0 },
  esfera:  { noise: 0.42, layers: 0.35, back: 0.55, body: 0.5, spin: 1, extra: 1 },
};

export const PALETTES = {
  gelo:      { a: "#eef1f6", b: "#eef1f6", back: "#3b82f6", inner: "#1f5fd6" },
  gradiente: { a: "#eef1f6", b: "#3b82f6", back: "#1f5fd6", inner: "#3b82f6" },
  azul:      { a: "#3b82f6", b: "#1f5fd6", back: "#9ec5ff", inner: "#eef1f6" },
};

// Mesmo campo em GLSL e em JS (o JS é usado para exportar o .glb)
const GLSL_FIELD = /* glsl */ `
  uniform float uTime, uNoise, uExtra, uWarp, uPhase;
  uniform vec3 uPtr;
  const float STEP = ${STEP.toFixed(5)};
  const float HW = ${HW.toFixed(5)};
  float flow(vec3 p, float t) {
    return sin(p.x * 2.1 + t * 0.9 + sin(p.y * 1.7 - t * 0.6) * 1.3) * 0.5
         + sin(p.y * 2.6 - t * 0.7 + sin(p.z * 2.3 + t * 0.5) * 1.2) * 0.35
         + sin(p.z * 3.1 + t * 0.4 + sin(p.x * 2.7 + t * 0.3) * 1.1) * 0.25;
  }
  float fieldH(vec3 p) {
    float s = sqrt(max(0.0, 1.0 - p.y * p.y));
    vec3 d = p - uPtr;
    return p.x + s + uNoise * flow(p + uPhase, uTime) * s + uWarp * 0.22 * exp(-dot(d, d) * 7.0) * s;
  }
  // distância até a linha mais próxima = |h - nível| / |grad h| (grad numérico,
  // com piso para o traço não virar mancha onde o campo fica plano); w = peso da linha
  float lineDist(vec3 p, out float k, out float w) {
    float h = fieldH(p);
    vec3 t1 = normalize(abs(p.y) < 0.99 ? cross(p, vec3(0.0, 1.0, 0.0)) : cross(p, vec3(1.0, 0.0, 0.0)));
    vec3 t2 = cross(p, t1);
    float e = 0.003;
    vec2 g = vec2(fieldH(normalize(p + t1 * e)) - h, fieldH(normalize(p + t2 * e)) - h) / e;
    float u = h / STEP;
    k = floor(u + 0.5);
    w = (k < 0.0 || k > 9.0) ? uExtra : 1.0;
    return abs(u - k) * STEP / clamp(length(g), 0.7, 7.0);
  }
  // anel externo da logo: grande círculo z = 0
  float rimDist(vec3 p) { return abs(p.z); }
`;

const VERT = /* glsl */ `
  uniform float uR, uRidge, uRim;
  varying vec3 vP;
  varying vec3 vW;
  varying vec3 vN;
  ${GLSL_FIELD}
  vec3 disp(vec3 p) {
    float k, w;
    float d = lineDist(p, k, w);
    float pr = sqrt(clamp(1.0 - (d / HW) * (d / HW), 0.0, 1.0)) * w;
    float dr = rimDist(p);
    pr = max(pr, sqrt(clamp(1.0 - (dr / HW) * (dr / HW), 0.0, 1.0)) * uRim);
    return p * uR * (1.0 + pr * uRidge);
  }
  void main() {
    vec3 p = normalize(position);
    vec3 pos = disp(p);
    // normal suave por diferenças finitas no relevo
    vec3 t1 = normalize(abs(p.y) < 0.99 ? cross(p, vec3(0.0, 1.0, 0.0)) : cross(p, vec3(1.0, 0.0, 0.0)));
    vec3 t2 = cross(p, t1);
    float e = 0.0025;
    vec3 n = normalize(cross(disp(normalize(p + t1 * e)) - pos, disp(normalize(p + t2 * e)) - pos));
    if (dot(n, p) < 0.0) n = -n;
    vN = normalize(mat3(modelMatrix) * n);
    vP = p;
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColA, uColB, uBodyCol;
  uniform float uLineA, uBody, uRim, uFlip;
  varying vec3 vP;
  varying vec3 vW;
  varying vec3 vN;
  ${GLSL_FIELD}
  void main() {
    vec3 p = normalize(vP);
    float k, w;
    float d = lineDist(p, k, w);
    float aa = fwidth(d) * 1.2 + 1e-4;
    float la = smoothstep(HW + aa, HW - aa, d) * w;
    float dr = rimDist(p);
    float ra = smoothstep(HW + fwidth(dr) * 1.2, HW - fwidth(dr) * 1.2, dr) * uRim;
    float kk = ra > la ? 0.0 : k;
    la = max(la, ra);

    vec3 n = normalize(vN) * uFlip;
    vec3 v = normalize(cameraPosition - vW);
    vec3 L = normalize(vec3(-0.5, 0.7, 0.8));
    float diff = 0.45 + 0.55 * max(dot(n, L), 0.0);
    float spec = pow(max(dot(reflect(-L, n), v), 0.0), 36.0) * 0.55;
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);

    vec3 lineCol = mix(uColA, uColB, clamp(kk / 9.0, 0.0, 1.0)) * diff + spec + fres * 0.25;
    vec3 bodyCol = uBodyCol + fres * vec3(0.23, 0.51, 0.96) * 0.5;
    float ba = uBody * (0.35 + fres * 0.65);
    vec3 col = mix(bodyCol, lineCol, la);
    float a = max(ba * (1.0 - la), la * uLineA);
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

function flowJS(x, y, z, t) {
  return Math.sin(x * 2.1 + t * 0.9 + Math.sin(y * 1.7 - t * 0.6) * 1.3) * 0.5
       + Math.sin(y * 2.6 - t * 0.7 + Math.sin(z * 2.3 + t * 0.5) * 1.2) * 0.35
       + Math.sin(z * 3.1 + t * 0.4 + Math.sin(x * 2.7 + t * 0.3) * 1.1) * 0.25;
}

export function mountLogo3D(container, opts = {}) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "pan-y";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  const tilt = new THREE.Group(), root = new THREE.Group();
  tilt.add(root); scene.add(tilt);

  const u = (extra) => ({
    uTime: { value: 0 }, uNoise: { value: 0 }, uExtra: { value: 0 }, uWarp: { value: 0 },
    uPhase: { value: 0 }, uPtr: { value: new THREE.Vector3(0, 0, 9) },
    uR: { value: 1 }, uRidge: { value: RIDGE }, uRim: { value: 1 },
    uColA: { value: new THREE.Color() }, uColB: { value: new THREE.Color() },
    uBodyCol: { value: new THREE.Color("#132036") },
    uLineA: { value: 1 }, uBody: { value: 0 }, uFlip: { value: 1 }, ...extra,
  });
  const mat = (uniforms, side) => new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG, side,
    transparent: true, depthWrite: false, extensions: { derivatives: true },
  });

  const seg = small ? 320 : 512;
  const geo = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));
  const geoLo = new THREE.SphereGeometry(1, seg / 2, Math.round(seg * 0.375));

  // ordem de desenho: verso externo -> camadas internas -> frente externa
  const backU = u({ uFlip: { value: -1 } });
  const back = new THREE.Mesh(geo, mat(backU, THREE.BackSide)); back.renderOrder = 0;
  const innerDefs = [{ r: 0.78, phase: 1.7 }, { r: 0.56, phase: 3.4 }];
  const inner = innerDefs.map((d, i) => {
    const iu = u({ uR: { value: d.r }, uPhase: { value: d.phase }, uRim: { value: 0 }, uRidge: { value: RIDGE / d.r } });
    const m = new THREE.Mesh(geoLo, mat(iu, THREE.DoubleSide)); m.renderOrder = 1 + i;
    const g = new THREE.Group(); g.add(m); root.add(g);
    return { g, m, u: iu, r: d.r };
  });
  const frontU = u();
  const front = new THREE.Mesh(geo, mat(frontU, THREE.FrontSide)); front.renderOrder = 5;
  root.add(back, front);
  const all = [frontU, backU, ...inner.map((x) => x.u)];

  const state = { ...STATES[opts.state || "logo"] };
  let palette = opts.palette || "gelo";
  function setPalette(name) {
    palette = PALETTES[name] ? name : "gelo";
    const p = PALETTES[palette];
    frontU.uColA.value.set(p.a); frontU.uColB.value.set(p.b);
    backU.uColA.value.set(p.back); backU.uColB.value.set(p.back);
    inner.forEach((x, i) => { x.u.uColA.value.set(p.inner); x.u.uColB.value.set(i ? p.back : p.inner); });
  }
  setPalette(palette);

  let tween;
  function setState(name, dur = 1.8) {
    const to = STATES[name]; if (!to) return;
    tween?.kill?.();
    if (window.gsap && !reduce) tween = gsap.to(state, { ...to, duration: dur, ease: "expo.inOut" });
    else Object.assign(state, to);
  }

  // arrastar para girar (com inércia) + ponteiro que deforma as linhas
  const vel = { x: 0, y: 0 }, mouse = { x: 0, y: 0, in: false };
  let drag = null, warp = 0;
  const el = renderer.domElement;
  el.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); container.classList.add("is-dragging"); });
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1; mouse.in = true;
    if (!drag) return;
    vel.y = (e.clientX - drag.x) * 0.006; vel.x = (e.clientY - drag.y) * 0.006;
    drag = { x: e.clientX, y: e.clientY };
  });
  const end = () => { drag = null; container.classList.remove("is-dragging"); };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  el.addEventListener("pointerleave", () => { mouse.x = mouse.y = 0; mouse.in = false; });

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = 6.4 * Math.max(1, 0.8 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
  io.observe(container);

  const clock = new THREE.Clock(), qx = new THREE.Quaternion(), qy = new THREE.Quaternion(), qid = new THREE.Quaternion();
  const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), inv = new THREE.Matrix4();
  const ptr = new THREE.Vector3(0, 0, 9), ptrTarget = new THREE.Vector3(0, 0, 9);
  let raf, t = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05), s = state;
    if (!reduce) t += dt * (0.55 + s.noise);

    if (!drag) { vel.x *= 0.94; vel.y *= 0.94; vel.y += (0.0035 * s.spin - vel.y) * 0.02 * s.spin; }
    qy.setFromAxisAngle(AY, vel.y); qx.setFromAxisAngle(AX, vel.x);
    root.quaternion.premultiply(qy).premultiply(qx);
    if (!drag && s.spin < 0.3) root.quaternion.slerp(qid, 0.04 * (1 - s.spin)); // logo volta a ficar de frente

    tilt.rotation.y += (mouse.x * 0.3 - tilt.rotation.y) * 0.05;
    tilt.rotation.x += (mouse.y * 0.22 - tilt.rotation.x) * 0.05;
    scene.updateMatrixWorld();

    // onde o ponteiro toca a esfera (no espaço do objeto)
    let hit = false;
    if (mouse.in && !drag) {
      ndc.set(mouse.x, -mouse.y); ray.setFromCamera(ndc, camera);
      const o = ray.ray.origin, dir = ray.ray.direction, b = o.dot(dir), c = o.lengthSq() - 1, disc = b * b - c;
      if (disc > 0) {
        inv.copy(root.matrixWorld).invert();
        ptrTarget.copy(dir).multiplyScalar(-b - Math.sqrt(disc)).add(o).applyMatrix4(inv).normalize();
        hit = true;
      }
    }
    warp += ((hit && !reduce ? 1 : 0) - warp) * 0.06;
    if (hit) ptr.lerp(ptrTarget, 0.15);

    for (const x of all) {
      x.uTime.value = t; x.uNoise.value = s.noise; x.uExtra.value = s.extra;
      x.uWarp.value = warp; x.uPtr.value.copy(ptr);
    }
    frontU.uBody.value = s.body;
    backU.uLineA.value = s.back;
    inner.forEach((x, i) => {
      x.u.uLineA.value = s.layers * (0.75 - i * 0.2);
      x.m.visible = s.layers > 0.01;
      // cada camada gira num ritmo próprio: profundidade/parallax
      x.g.rotation.y = Math.sin(t * 0.35 + i * 2) * 0.6 * s.layers;
      x.g.rotation.x = Math.cos(t * 0.28 + i) * 0.25 * s.layers;
      x.u.uR.value = x.r * (1 - 0.15 * (1 - s.layers));
    });
    back.visible = s.back > 0.01;
    renderer.render(scene, camera);
  }
  frame();

  // exporta a esfera em relevo (pose e fluxo atuais)
  async function exportGLB(filename = "wzs-logo-3d.glb") {
    const g = new THREE.SphereGeometry(1, 384, 288), pos = g.attributes.position, v = new THREE.Vector3();
    const s = state, t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), q = new THREE.Vector3(), e = 0.003;
    const H = (p) => { const sy = Math.sqrt(Math.max(0, 1 - p.y * p.y)); return p.x + sy + s.noise * flowJS(p.x, p.y, p.z, t) * sy; };
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      t1.crossVectors(v, Math.abs(v.y) < 0.99 ? AY : AX).normalize(); t2.crossVectors(v, t1);
      const h = H(v);
      const gx = (H(q.copy(v).addScaledVector(t1, e).normalize()) - h) / e;
      const gy = (H(q.copy(v).addScaledVector(t2, e).normalize()) - h) / e;
      const uu = h / STEP, k = Math.round(uu), w = k < 0 || k > 9 ? s.extra : 1;
      const d = Math.abs(uu - k) * STEP / Math.min(7, Math.max(0.7, Math.hypot(gx, gy)));
      let pr = Math.sqrt(Math.min(1, Math.max(0, 1 - (d / HW) ** 2))) * w;
      pr = Math.max(pr, Math.sqrt(Math.min(1, Math.max(0, 1 - (v.z / HW) ** 2))));
      v.multiplyScalar(1 + pr * RIDGE * 1.6);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: PALETTES[palette].a, roughness: 0.35 }));
    m.name = "wzs-logo-3d";
    const buf = await new GLTFExporter().parseAsync(m, { binary: true });
    g.dispose(); m.material.dispose();
    const url = URL.createObjectURL(new Blob([buf], { type: "model/gltf-binary" }));
    Object.assign(document.createElement("a"), { href: url, download: filename }).click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function destroy() {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    geo.dispose(); geoLo.dispose();
    [front, back, ...inner.map((x) => x.m)].forEach((m) => m.material.dispose());
    renderer.dispose(); el.remove();
  }

  return { setState, setPalette, exportGLB, destroy, state };
}
