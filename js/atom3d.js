class AtomViewer {
  constructor(container){
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.electronOrbits = [];
    this.nucleusParticles = [];
    this.autoRotate = true;
    this.speedFactor = 1.0;

    this._setupLights();
    this._setupCamera();
    this._setupControls();

    this._resizeObserver = new ResizeObserver(() => this.onResize());
    this._resizeObserver.observe(this.container);
    this.onResize();

    this._clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this._animId = requestAnimationFrame(this._animate);
  }

  _setupLights(){
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const mainLight = new THREE.PointLight(0xffffff, 1.3, 100);
    mainLight.position.set(12, 14, 16);
    this.scene.add(mainLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 0.8, 100);
    cyanLight.position.set(-14, -10, -12);
    this.scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xd946ef, 0.5, 100);
    magentaLight.position.set(0, -15, 10);
    this.scene.add(magentaLight);
  }

  _setupCamera(){
    this.camera.position.set(0, 4, 18);
    this.camera.lookAt(0, 0, 0);
  }

  _setupControls(){
    this.defaultRotation = { x: -0.25, y: 0.35 };
    this.rotation = { ...this.defaultRotation };
    this.targetRotation = { ...this.defaultRotation };
    this.defaultDistance = 18;
    this.distance = 18;
    this.targetDistance = 18;
    this._dragging = false;
    this._lastPointer = { x: 0, y: 0 };

    const dom = this.renderer.domElement;
    dom.style.touchAction = "none";

    dom.addEventListener("pointerdown", (e) => {
      this._dragging = true;
      this._lastPointer = { x: e.clientX, y: e.clientY };
      try { dom.setPointerCapture(e.pointerId); } catch(err){}
    });

    dom.addEventListener("pointermove", (e) => {
      if(!this._dragging) return;
      const dx = e.clientX - this._lastPointer.x;
      const dy = e.clientY - this._lastPointer.y;
      this._lastPointer = { x: e.clientX, y: e.clientY };
      this.targetRotation.y += dx * 0.007;
      this.targetRotation.x += dy * 0.007;
      this.targetRotation.x = Math.max(-1.4, Math.min(1.4, this.targetRotation.x));
    });

    const stopDrag = () => { this._dragging = false; };
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);

    dom.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.targetDistance += e.deltaY * 0.015;
      this.targetDistance = Math.max(6, Math.min(45, this.targetDistance));
    }, { passive: false });

    // Touch pinch zoom
    this._pinchStart = null;
    dom.addEventListener("touchstart", (e) => {
      if(e.touches.length === 2){
        this._pinchStart = this._touchDist(e.touches);
      }
    }, { passive: true });

    dom.addEventListener("touchmove", (e) => {
      if(e.touches.length === 2 && this._pinchStart){
        const d = this._touchDist(e.touches);
        const delta = this._pinchStart - d;
        this.targetDistance += delta * 0.03;
        this.targetDistance = Math.max(6, Math.min(45, this.targetDistance));
        this._pinchStart = d;
      }
    }, { passive: true });
  }

  _touchDist(touches){
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onResize(){
    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 400;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  toggleAutoRotate(){
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  setSpeed(factor){
    this.speedFactor = factor;
  }

  resetView(){
    this.targetRotation = { ...this.defaultRotation };
    this.targetDistance = this.defaultDistance;
  }

  zoomIn(){
    this.targetDistance = Math.max(6, this.targetDistance - 3);
  }

  zoomOut(){
    this.targetDistance = Math.min(45, this.targetDistance + 3);
  }

  clear(){
    while(this.group.children.length){
      const obj = this.group.children.pop();
      if(obj.geometry) obj.geometry.dispose();
      if(obj.material) {
        if(Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
      this.group.remove(obj);
    }
    this.electronOrbits = [];
    this.nucleusParticles = [];
  }

  render(element, shells){
    this.clear();

    const protons = element.n;
    const neutrons = Math.max(0, element.m - element.n);
    this._buildNucleus(protons, neutrons);
    this._buildShells(shells);

    // Ajustar encuadre de cámara según la cantidad de capas
    const maxRadius = 3.0 + shells.length * 1.9;
    this.defaultDistance = Math.max(14, maxRadius * 2.0);
    this.targetDistance = this.defaultDistance;
    this.distance = this.defaultDistance;
  }

  _buildNucleus(protons, neutrons){
    const total = protons + neutrons;
    const nucleusRadius = Math.min(2.5, 0.95 + Math.pow(total, 1/3) * 0.28);
    const particleRadius = total > 80 ? 0.11 : total > 20 ? 0.15 : 0.20;

    const protonMat = new THREE.MeshStandardMaterial({
      color: 0xff4d6d,
      emissive: 0x590d22,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.3
    });

    const neutronMat = new THREE.MeshStandardMaterial({
      color: 0xa0aec0,
      emissive: 0x2d3748,
      emissiveIntensity: 0.2,
      roughness: 0.35,
      metalness: 0.4
    });

    const geo = new THREE.SphereGeometry(particleRadius, 16, 16);

    const maxDraw = 160;
    const scaleFactor = total > maxDraw ? maxDraw / total : 1;
    const drawProtons = Math.max(1, Math.round(protons * scaleFactor));
    const drawNeutrons = Math.max(0, Math.round(neutrons * scaleFactor));
    const drawTotal = drawProtons + drawNeutrons;

    const positions = this._fibonacciSphere(drawTotal, nucleusRadius * 0.65);

    for(let i = 0; i < drawTotal; i++){
      const isProton = i < drawProtons;
      const mesh = new THREE.Mesh(geo, isProton ? protonMat : neutronMat);
      const p = positions[i];
      mesh.position.set(p.x, p.y, p.z);
      this.group.add(mesh);
    }

    // Glow aura alrededor del núcleo
    const glowGeo = new THREE.SphereGeometry(nucleusRadius * 0.72 + particleRadius, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff758f,
      transparent: true,
      opacity: 0.09,
      side: THREE.BackSide
    });
    this.group.add(new THREE.Mesh(glowGeo, glowMat));
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

  _buildShells(shells){
    const baseRadius = 3.2;
    const step = 1.95;

    const electronMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.2
    });

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    const electronGeo = new THREE.SphereGeometry(0.24, 18, 18);

    shells.forEach((count, idx) => {
      const radius = baseRadius + idx * step;

      // Inclinaciones armónicas de cada órbita cuántica
      const tiltX = (idx % 2 === 0 ? 1 : -1) * (0.24 + idx * 0.11);
      const tiltZ = (idx % 3 === 0 ? 1 : -1) * (0.16 + idx * 0.07);

      const shellGroup = new THREE.Group();
      shellGroup.rotation.x = tiltX;
      shellGroup.rotation.z = tiltZ;

      const ringGeo = new THREE.TorusGeometry(radius, 0.016, 8, 100);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      shellGroup.add(ring);

      const speed = (0.38 / Math.sqrt(idx + 1)) * (idx % 2 === 0 ? 1 : -1);
      const startAngle = (idx * Math.PI) / 3;

      for(let i = 0; i < count; i++){
        const angle = startAngle + (i / count) * Math.PI * 2;
        const electron = new THREE.Mesh(electronGeo, electronMat);
        electron.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        shellGroup.add(electron);
        this.electronOrbits.push({ mesh: electron, radius, angle, speed, group: shellGroup });
      }

      this.group.add(shellGroup);
    });
  }

  _animate(){
    this._animId = requestAnimationFrame(this._animate);
    const dt = Math.min(0.05, this._clock.getDelta());

    // Suavizado de control orbital
    this.rotation.x += (this.targetRotation.x - this.rotation.x) * 0.12;
    this.rotation.y += (this.targetRotation.y - this.rotation.y) * 0.12;
    this.distance += (this.targetDistance - this.distance) * 0.12;

    if(this.autoRotate){
      this.autoSpin = (this.autoSpin || 0) + dt * 0.22 * this.speedFactor;
    }

    this.group.rotation.x = this.rotation.x;
    this.group.rotation.y = this.rotation.y + (this.autoSpin || 0);
    this.camera.position.set(0, 0, this.distance);
    this.camera.lookAt(0, 0, 0);

    // Mover electrones por sus trayectorias
    const orbitalSpeed = this.speedFactor;
    this.electronOrbits.forEach(o => {
      o.angle += o.speed * dt * orbitalSpeed;
      o.mesh.position.set(Math.cos(o.angle) * o.radius, 0, Math.sin(o.angle) * o.radius);
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose(){
    if(this._animId) cancelAnimationFrame(this._animId);
    this.clear();
    this._resizeObserver.disconnect();
    this.renderer.dispose();
  }
}
