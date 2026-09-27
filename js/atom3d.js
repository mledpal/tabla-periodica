// Visor 3D del modelo atómico de Bohr (Three.js como módulo ES).
// main.js lo carga de forma diferida con import() la primera vez que se abre un elemento.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Colores de las capas K → Q (los mismos que SHELL_COLORS en data.js)
const SHELL_HEX = [0x00f0ff, 0x38bdf8, 0x818cf8, 0xc084fc, 0xf472b6, 0xfb923c, 0xfacc15];

const MIN_DISTANCE = 6;
const MAX_DISTANCE = 90;
const FOV = 45;

// Textura de halo compartida por electrones y núcleo (degradado radial blanco → transparente)
function createGlowTexture(){
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class AtomViewer {
  constructor(container){
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.electronOrbits = [];
    this.glowTexture = createGlowTexture();
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.speedFactor = this.reducedMotion ? 0.3 : 1.0;
    this.defaultDistance = 18;
    this.targetDistance = null; // distancia a la que se acerca/aleja con suavidad (botones de zoom)

    this._setupLights();
    this._setupStarfield();
    this._setupControls();

    this._resizeObserver = new ResizeObserver(() => this.onResize());
    this._resizeObserver.observe(this.container);
    this.onResize();

    this._clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this._animId = null;
    this._running = false;

    // No dibujar mientras la pestaña está oculta
    this._onVisibility = () => {
      if(document.hidden) this._pauseLoop();
      else if(this._running) this._resumeLoop();
    };
    document.addEventListener("visibilitychange", this._onVisibility);
  }

  _setupLights(){
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(12, 14, 16);
    this.scene.add(key);

    // decay = 0: intensidad constante con la distancia (luces de acento, no físicas)
    const cyan = new THREE.PointLight(0x00f0ff, 1.4, 0, 0);
    cyan.position.set(-14, -10, -12);
    this.scene.add(cyan);

    const magenta = new THREE.PointLight(0xd946ef, 0.9, 0, 0);
    magenta.position.set(0, -15, 10);
    this.scene.add(magenta);
  }

  // Fondo de estrellas: puntos repartidos en una capa esférica lejana
  _setupStarfield(){
    const count = 900;
    const positions = new Float32Array(count * 3);
    for(let i = 0; i < count; i++){
      const r = 120 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xbfd8ff,
      size: 1.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
      map: this.glowTexture,
      depthWrite: false
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  _setupControls(){
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = MIN_DISTANCE;
    this.controls.maxDistance = MAX_DISTANCE;
    this.controls.autoRotate = !this.reducedMotion;
    this.controls.autoRotateSpeed = 0.9;
    // Al tocar el modelo se cancela cualquier zoom animado en curso
    this.controls.addEventListener("start", () => { this.targetDistance = null; });
    this.renderer.domElement.style.touchAction = "none";
  }

  // Arranca el bucle de animación (al abrir el modal)
  start(){
    this._running = true;
    this._resumeLoop();
  }

  // Detiene el bucle por completo (al cerrar el modal)
  stop(){
    this._running = false;
    this._pauseLoop();
  }

  _resumeLoop(){
    if(this._animId !== null || document.hidden) return;
    this._clock.getDelta(); // descartar el tiempo transcurrido en pausa
    this._animId = requestAnimationFrame(this._animate);
  }

  _pauseLoop(){
    if(this._animId !== null) cancelAnimationFrame(this._animId);
    this._animId = null;
  }

  onResize(){
    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 400;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  toggleAutoRotate(){
    this.controls.autoRotate = !this.controls.autoRotate;
    return this.controls.autoRotate;
  }

  setSpeed(factor){
    this.speedFactor = factor;
  }

  resetView(){
    this.targetDistance = null;
    this.controls.target.set(0, 0, 0);
    this._placeCamera(this.defaultDistance);
  }

  zoomIn(){
    this.targetDistance = Math.max(MIN_DISTANCE, this._distance() * 0.8);
  }

  zoomOut(){
    this.targetDistance = Math.min(MAX_DISTANCE, this._distance() * 1.25);
  }

  _distance(){
    return this.camera.position.distanceTo(this.controls.target);
  }

  // Coloca la cámara a una distancia dada con una ligera elevación
  _placeCamera(distance){
    const elevation = 0.32;
    this.camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  clear(){
    // Recorre también los grupos anidados (órbitas) para liberar toda la memoria de GPU.
    // La geometría de los sprites es interna y compartida por Three.js: no se libera.
    const geometries = new Set();
    const materials = new Set();
    this.group.traverse(obj => {
      if(obj.geometry && !obj.isSprite) geometries.add(obj.geometry);
      if(obj.material) [].concat(obj.material).forEach(m => materials.add(m));
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    this.group.clear();
    this.electronOrbits = [];
  }

  render(element, shells){
    this.clear();

    const protons = element.n;
    const neutrons = Math.max(0, element.m - element.n);
    this._buildNucleus(protons, neutrons);
    const outerRadius = this._buildShells(shells);

    // Encuadre: que la órbita exterior quepa en el campo de visión más estrecho (vertical u horizontal)
    const vFov = THREE.MathUtils.degToRad(FOV);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const fov = Math.min(vFov, hFov);
    this.defaultDistance = Math.min(MAX_DISTANCE, Math.max(12, (outerRadius * 1.12) / Math.sin(fov / 2)));
    this.resetView();
  }

  _buildNucleus(protons, neutrons){
    const total = protons + neutrons;
    const nucleusRadius = Math.min(2.5, 0.95 + Math.pow(total, 1/3) * 0.28);
    const particleRadius = total > 80 ? 0.11 : total > 20 ? 0.15 : 0.20;

    const protonMat = new THREE.MeshStandardMaterial({
      color: 0xff4d6d,
      emissive: 0x590d22,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.2
    });

    const neutronMat = new THREE.MeshStandardMaterial({
      color: 0xb4c0d4,
      emissive: 0x2d3748,
      emissiveIntensity: 0.25,
      roughness: 0.4,
      metalness: 0.3
    });

    const geo = new THREE.SphereGeometry(particleRadius, 16, 16);

    // Los núcleos muy grandes se representan con un máximo de partículas manteniendo la proporción p/n
    const maxDraw = 160;
    const scaleFactor = total > maxDraw ? maxDraw / total : 1;
    const drawProtons = Math.max(1, Math.round(protons * scaleFactor));
    const drawNeutrons = Math.max(0, Math.round(neutrons * scaleFactor));
    const drawTotal = drawProtons + drawNeutrons;

    const positions = this._fibonacciSphere(drawTotal, nucleusRadius * 0.65);
    // Mezclar protones y neutrones para que no queden en hemisferios separados
    const kinds = Array.from({ length: drawTotal }, (_, i) => i < drawProtons);
    for(let i = kinds.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }

    for(let i = 0; i < drawTotal; i++){
      const mesh = new THREE.Mesh(geo, kinds[i] ? protonMat : neutronMat);
      mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
      this.group.add(mesh);
    }

    // Halo luminoso alrededor del núcleo
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: 0xff758f,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    const glowSize = nucleusRadius * 4.2;
    glow.scale.set(glowSize, glowSize, 1);
    this.group.add(glow);
  }

  _fibonacciSphere(count, radius){
    const pts = [];
    if(count <= 0) return pts;
    const offset = 2 / count;
    const increment = Math.PI * (3 - Math.sqrt(5));
    for(let i = 0; i < count; i++){
      const y = ((i * offset) - 1) + (offset / 2);
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * increment;
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      const jitter = 0.85 + Math.random() * 0.3;
      pts.push({ x: x * radius * jitter, y: y * radius * jitter, z: z * radius * jitter });
    }
    return pts;
  }

  // Devuelve el radio de la órbita más externa
  _buildShells(shells){
    const baseRadius = 3.2;
    const step = 1.95;
    const lastIdx = shells.length - 1;
    let outerRadius = baseRadius;

    shells.forEach((count, idx) => {
      const radius = baseRadius + idx * step;
      const color = SHELL_HEX[idx] || 0xffffff;
      const isValence = idx === lastIdx;
      outerRadius = radius;

      // Inclinaciones armónicas de cada órbita
      const shellGroup = new THREE.Group();
      shellGroup.rotation.x = (idx % 2 === 0 ? 1 : -1) * (0.24 + idx * 0.11);
      shellGroup.rotation.z = (idx % 3 === 0 ? 1 : -1) * (0.16 + idx * 0.07);

      // La capa de valencia tiene la órbita más visible y electrones algo mayores
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, isValence ? 0.035 : 0.016, 8, 160),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isValence ? 0.7 : 0.22 })
      );
      ring.rotation.x = Math.PI / 2;
      shellGroup.add(ring);

      const electronSize = isValence ? 0.27 : 0.21;
      const electronGeo = new THREE.SphereGeometry(electronSize, 16, 16);
      const electronMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.1
      });
      const glowMat = new THREE.SpriteMaterial({
        map: this.glowTexture,
        color,
        transparent: true,
        opacity: isValence ? 0.9 : 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const speed = (0.38 / Math.sqrt(idx + 1)) * (idx % 2 === 0 ? 1 : -1);
      const startAngle = (idx * Math.PI) / 3;

      for(let i = 0; i < count; i++){
        const angle = startAngle + (i / count) * Math.PI * 2;
        const electron = new THREE.Mesh(electronGeo, electronMat);
        const glow = new THREE.Sprite(glowMat);
        glow.scale.setScalar(electronSize * 6);
        electron.add(glow);
        electron.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        shellGroup.add(electron);
        this.electronOrbits.push({ mesh: electron, radius, angle, speed });
      }

      this.group.add(shellGroup);
    });

    return outerRadius;
  }

  _animate(){
    this._animId = requestAnimationFrame(this._animate);
    const dt = Math.min(0.05, this._clock.getDelta());

    // Zoom animado de los botones + / −
    if(this.targetDistance !== null){
      const d = this._distance();
      const next = d + (this.targetDistance - d) * 0.15;
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      this.camera.position.copy(this.controls.target).addScaledVector(dir, next);
      if(Math.abs(next - this.targetDistance) < 0.01) this.targetDistance = null;
    }
    this.controls.update(dt);

    // Mover electrones por sus órbitas
    this.electronOrbits.forEach(o => {
      o.angle += o.speed * dt * this.speedFactor;
      o.mesh.position.set(Math.cos(o.angle) * o.radius, 0, Math.sin(o.angle) * o.radius);
    });
    this.stars.rotation.y += dt * 0.004;

    this.renderer.render(this.scene, this.camera);
  }

  dispose(){
    this.stop();
    document.removeEventListener("visibilitychange", this._onVisibility);
    this.clear();
    this.controls.dispose();
    this.stars.geometry.dispose();
    this.stars.material.dispose();
    this.glowTexture.dispose();
    this._resizeObserver.disconnect();
    this.renderer.dispose();
  }
}
