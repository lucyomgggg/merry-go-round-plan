window.addEventListener('load', function() {
  if (typeof THREE === 'undefined') {
    document.getElementById('loading').textContent = 'Three.jsの読み込みに失敗しました';
    return;
  }
  document.getElementById('loading').style.display = 'none';
  document.getElementById('step-panel').style.display = '';
  document.getElementById('legend-panel').style.display = '';
  document.getElementById('step-indicator-bar').style.display = '';

  const canvas = document.getElementById('scene');

  // ===== Constants (matches V6) =====
  const LAYER1_Y          = 0.42;
  const LAYER2_Y          = 0.54;
  const LAYER3_Y          = 2.00;
  const AXIS_BOTTOM_Y     = 0.05;
  const AXIS_HEIGHT       = 2.6;
  const POLE_LEN          = 2.0;
  const POLE_RADIUS       = 1.0;
  const POLE_DIAMETER     = 0.0486;
  const SCAFFOLD_PIPE_R   = POLE_DIAMETER / 2;
  const PIPE_HALF_GAP     = POLE_DIAMETER + 0.003;
  const HORSE_Y           = 0.95;
  const WAVE_CENTER_Y     = 0.15;
  const COLLAR_Y_ON_POLE  = LAYER3_Y - (WAVE_CENTER_Y - 0.075);
  const TALL_PILLAR_R     = 2.05;
  const TALL_PILLAR_BOTTOM = 0.085;
  const TALL_PILLAR_TOP   = 2.20;
  const TALL_PILLAR_HEIGHT = TALL_PILLAR_TOP - TALL_PILLAR_BOTTOM;
  let waveAmplitude = 0.05;  // 凸の高さ10cm（谷→山）＝ 振幅±5cm
  let waveCount     = 4;     // 凸4つ

  // ===== Scene =====
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1419);
  scene.fog = new THREE.Fog(0x0f1419, 18, 48);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // ===== Orbit controls =====
  const target = new THREE.Vector3(0, 1.2, 0);
  let azimuth  = Math.PI * 0.25;
  let polar    = Math.PI * 0.38;
  let distance = 11;
  const minDistance = 3, maxDistance = 25;
  const minPolar = 0.1, maxPolar = Math.PI / 2 + 0.05;

  function updateCamera() {
    const sinP = Math.sin(polar);
    camera.position.set(
      target.x + distance * sinP * Math.sin(azimuth),
      target.y + distance * Math.cos(polar),
      target.z + distance * sinP * Math.cos(azimuth)
    );
    camera.lookAt(target);
  }
  updateCamera();

  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('mousedown', function(e) { dragging = true; lastX = e.clientX; lastY = e.clientY; e.preventDefault(); });
  window.addEventListener('mouseup',   function()  { dragging = false; });
  window.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    azimuth -= (e.clientX - lastX) * 0.005;
    polar   -= (e.clientY - lastY) * 0.005;
    polar    = Math.max(minPolar, Math.min(maxPolar, polar));
    lastX = e.clientX; lastY = e.clientY;
    updateCamera();
  });
  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    distance *= e.deltaY > 0 ? 1.1 : 0.9;
    distance  = Math.max(minDistance, Math.min(maxDistance, distance));
    updateCamera();
  }, { passive: false });

  let touchMode = null, lastTouchDist = 0;
  canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      touchMode = 'rotate'; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      touchMode = 'zoom';
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx*dx + dy*dy);
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', function(e) {
    if (touchMode === 'rotate' && e.touches.length === 1) {
      azimuth -= (e.touches[0].clientX - lastX) * 0.005;
      polar   -= (e.touches[0].clientY - lastY) * 0.005;
      polar    = Math.max(minPolar, Math.min(maxPolar, polar));
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      updateCamera();
    } else if (touchMode === 'zoom' && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (lastTouchDist > 0) {
        distance *= lastTouchDist / d;
        distance  = Math.max(minDistance, Math.min(maxDistance, distance));
        updateCamera();
      }
      lastTouchDist = d;
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', function() { touchMode = null; });

  // ===== Lighting =====
  scene.add(new THREE.AmbientLight(0xffffff, 0.42));
  scene.add(new THREE.HemisphereLight(0xb1d6ff, 0x303040, 0.38));
  const keyLight = new THREE.DirectionalLight(0xffe8c8, 1.05);
  keyLight.position.set(6, 12, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -7; keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top  =  7; keyLight.shadow.camera.bottom = -7;
  keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 25;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x6b9eff, 0.32);
  fillLight.position.set(-5, 4, -5);
  scene.add(fillLight);

  // ===== Materials =====
  const pipeMat        = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.82, roughness: 0.28 });
  const plywoodMat     = new THREE.MeshStandardMaterial({ color: 0xd2a06a, roughness: 0.86 });
  const horseBodyMat   = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.55 });
  const horseManeMat   = new THREE.MeshStandardMaterial({ color: 0xb74040, roughness: 0.62 });
  const horseSaddleMat = new THREE.MeshStandardMaterial({ color: 0x6b3d1e, roughness: 0.7 });
  const casterMat      = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.65 });
  const railWoodMat    = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.92 });
  const clampMat       = new THREE.MeshStandardMaterial({ color: 0xc8a02e, metalness: 0.7, roughness: 0.32 });
  const clampLooseMat  = new THREE.MeshStandardMaterial({ color: 0x807548, metalness: 0.4, roughness: 0.55, transparent: true, opacity: 0.7 });
  const clampBoltMat   = new THREE.MeshStandardMaterial({ color: 0xa07b1e, metalness: 0.8, roughness: 0.4 });
  const collarMat      = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.85, roughness: 0.22 });
  const skinMat        = new THREE.MeshStandardMaterial({ color: 0xf4c8a8, roughness: 0.7 });
  const shirtMat       = new THREE.MeshStandardMaterial({ color: 0x3a6db5, roughness: 0.75 });
  const pantsMat       = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 });
  const hairMat        = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.85 });
  const seatBoardMat   = new THREE.MeshStandardMaterial({ color: 0xa07a4a, roughness: 0.85 });
  const veneerMat      = new THREE.MeshStandardMaterial({ color: 0xe6c890, roughness: 0.88, side: THREE.DoubleSide });
  const highlightMat   = new THREE.MeshBasicMaterial({ color: 0xff8866, transparent: true, opacity: 0.0 });

  // ===== Ground =====
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(11, 64),
    new THREE.MeshStandardMaterial({ color: 0x252830, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ===== Scaffold clamp helper =====
  function makeScaffoldClamp(axis1, axis2, sep, material) {
    sep = sep || 0;
    material = material || clampMat;
    const group = new THREE.Group();
    const ringR = 0.04;
    const tubeR = 0.012;
    const allAxes = ['x','y','z'];
    const axis3 = allAxes.find(a => a !== axis1 && a !== axis2);
    function rotateTorusForAxis(mesh, axis) {
      if (axis === 'x') mesh.rotation.y = Math.PI / 2;
      else if (axis === 'y') mesh.rotation.x = Math.PI / 2;
    }
    function rotateCylForAxis(mesh, axis) {
      if (axis === 'x') mesh.rotation.z = Math.PI / 2;
      else if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    }
    function setPos(mesh, axis, val) {
      if (axis === 'x') mesh.position.x = val;
      else if (axis === 'y') mesh.position.y = val;
      else if (axis === 'z') mesh.position.z = val;
    }
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(ringR, tubeR, 10, 18), material);
    rotateTorusForAxis(ring1, axis1);
    setPos(ring1, axis3, -sep / 2);
    ring1.castShadow = true;
    group.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(ringR, tubeR, 10, 18), material);
    rotateTorusForAxis(ring2, axis2);
    setPos(ring2, axis3, +sep / 2);
    ring2.castShadow = true;
    group.add(ring2);
    const connector = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.026), material);
    connector.castShadow = true;
    group.add(connector);
    for (let s = 0; s < 2; s++) {
      const ringOffset = (s === 0) ? -sep / 2 : +sep / 2;
      const sign = (s === 0) ? -1 : 1;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8), clampBoltMat);
      rotateCylForAxis(bolt, axis3);
      setPos(bolt, axis3, ringOffset + sign * (ringR + 0.022));
      bolt.castShadow = true;
      group.add(bolt);
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 6), clampBoltMat);
      rotateCylForAxis(nut, axis3);
      setPos(nut, axis3, ringOffset + sign * (ringR + 0.055));
      nut.castShadow = true;
      group.add(nut);
    }
    // Tag the rings so we can swap materials later (for "tighten" transition)
    group.userData.rings = [ring1, ring2, connector];
    return group;
  }

  // ===== Wavy rail geometry helper =====
  function makeWavyRailGeometry() {
    const segments = 256;
    const innerR = 0.84, outerR = 1.16, thickness = 0.025;
    const positions = [], indices = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const y = WAVE_CENTER_Y + waveAmplitude * Math.sin(waveCount * t);
      positions.push(outerR * Math.cos(t), y, outerR * Math.sin(t));
      positions.push(innerR * Math.cos(t), y, innerR * Math.sin(t));
    }
    for (let i = 0; i < segments; i++) {
      const a = i*2, b = i*2+1, c = (i+1)*2, d = (i+1)*2+1;
      indices.push(a, c, b, c, d, b);
    }
    const base = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const y = WAVE_CENTER_Y + waveAmplitude * Math.sin(waveCount * t) - thickness;
      positions.push(outerR * Math.cos(t), y, outerR * Math.sin(t));
      positions.push(innerR * Math.cos(t), y, innerR * Math.sin(t));
    }
    for (let i = 0; i < segments; i++) {
      const a = base+i*2, b = base+i*2+1, c = base+(i+1)*2, d = base+(i+1)*2+1;
      indices.push(a, b, c, c, b, d);
    }
    for (let i = 0; i < segments; i++) {
      const a = i*2, c = (i+1)*2, a2 = base+i*2, c2 = base+(i+1)*2;
      indices.push(a, a2, c, c, a2, c2);
      const b = i*2+1, d = (i+1)*2+1, b2 = base+i*2+1, d2 = base+(i+1)*2+1;
      indices.push(b, d, b2, d, d2, b2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }

  // ===== Horse factory =====
  function createHorse() {
    const horse = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), horseBodyMat);
    body.scale.set(1.9, 1.0, 1.0); body.castShadow = true; horse.add(body);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), horseBodyMat);
    chest.position.set(0.3, 0.04, 0); chest.castShadow = true; horse.add(chest);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.34, 12), horseBodyMat);
    neck.position.set(0.36, 0.2, 0); neck.rotation.z = -Math.PI / 5; neck.castShadow = true; horse.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.14), horseBodyMat);
    head.position.set(0.52, 0.34, 0); head.castShadow = true; horse.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), horseBodyMat);
    snout.position.set(0.64, 0.3, 0); snout.castShadow = true; horse.add(snout);
    for (let i = 0; i < 2; i++) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 6), horseBodyMat);
      ear.position.set(0.48, 0.44, i === 0 ? -0.05 : 0.05); horse.add(ear);
    }
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
    for (let i = 0; i < 2; i++) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeMat);
      eye.position.set(0.56, 0.36, i === 0 ? -0.07 : 0.07); horse.add(eye);
    }
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.2 - i*0.02, 0.12), horseManeMat);
      m.position.set(0.36 - i*0.04, 0.24 - i*0.018, 0); m.castShadow = true; horse.add(m);
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), horseManeMat);
    tail.position.set(-0.34, 0, 0); tail.rotation.z = Math.PI * 0.55; tail.castShadow = true; horse.add(tail);
    const legGeo = new THREE.CylinderGeometry(0.028, 0.022, 0.44, 8);
    const legPs = [[0.22,-0.3,-0.1],[0.22,-0.3,0.1],[-0.22,-0.3,-0.1],[-0.22,-0.3,0.1]];
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 });
    for (let i = 0; i < legPs.length; i++) {
      const leg = new THREE.Mesh(legGeo, horseBodyMat);
      leg.position.set(legPs[i][0], legPs[i][1], legPs[i][2]); leg.castShadow = true; horse.add(leg);
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.04, 8), hoofMat);
      hoof.position.set(legPs[i][0], -0.52, legPs[i][2]); horse.add(hoof);
    }
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.26), horseSaddleMat);
    saddle.position.set(0, 0.19, 0); saddle.castShadow = true; horse.add(saddle);
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.06, 8), horseSaddleMat);
    horn.position.set(0.1, 0.24, 0); horse.add(horn);
    return horse;
  }

  // ===== Person factory =====
  function createPerson() {
    const person = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), skinMat);
    head.position.y = 1.58; head.castShadow = true; person.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12, 0, Math.PI*2, 0, Math.PI*0.55), hairMat);
    hair.position.y = 1.59; hair.castShadow = true; person.add(hair);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.58, 14), shirtMat);
    torso.position.y = 1.10; torso.castShadow = true; person.add(torso);
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1;
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.28, 10), shirtMat);
      upperArm.position.set(s * 0.18, 1.22, 0.13); upperArm.rotation.x = Math.PI / 4; upperArm.castShadow = true; person.add(upperArm);
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.26, 10), skinMat);
      forearm.position.set(s * 0.18, 1.09, 0.32); forearm.rotation.x = Math.PI / 2.3; forearm.castShadow = true; person.add(forearm);
    }
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.82, 10), pantsMat);
      leg.position.set(s * 0.07, 0.41, 0); leg.castShadow = true; person.add(leg);
    }
    return person;
  }

  // ============================================================
  // Step groups — each step adds a Group of new geometry
  // ============================================================
  const stepGroups = [];        // stepGroups[i] = group of objects added at step i+1
  const allStepClampGroups = [];// reference clamps for step-5 tightening
  let polesData = [];           // horse pole groups (used in final animation)
  let rotatingHolder = null;    // holds everything that "rotates" — created at step 6
  let wavyRailMesh = null;
  // Per-horse sub-assemblies kept for wavy-rail bobbing (index 0-3 = same angular slot)
  const horsePoleCasters = []; // step 4: caster group under each horse pole
  const seatAssemblies   = []; // step 9: stop collar + seat sub-group per horse pole
  const horseObjects     = []; // step 10: horse models
  const personObjects    = []; // step 10: staff figures (decoration toggle)

  // ===== STEP 1: Floor anchor + center post =====
  function buildStep1() {
    const g = new THREE.Group();
    // Plywood base disc
    const plywoodBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.018, 32), plywoodMat);
    plywoodBase.position.y = 0.009;
    plywoodBase.receiveShadow = true; plywoodBase.castShadow = true;
    g.add(plywoodBase);
    // Steel mounting flange
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.012, 18), casterMat);
    flange.position.y = 0.024;
    flange.castShadow = true; g.add(flange);
    // Pipe socket
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), casterMat);
    socket.position.y = 0.078;
    socket.castShadow = true; g.add(socket);
    // Set screw on socket
    const setScrew = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.018), clampBoltMat);
    setScrew.position.set(0.058, 0.078, 0); g.add(setScrew);
    // 4 weights
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 24), casterMat);
      w.position.set(0.36 * Math.cos(a), 0.043, 0.36 * Math.sin(a));
      w.castShadow = true; w.receiveShadow = true;
      g.add(w);
    }
    // Center post
    const centerAxis = new THREE.Mesh(
      new THREE.CylinderGeometry(SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, AXIS_HEIGHT, 16),
      pipeMat
    );
    centerAxis.position.y = AXIS_BOTTOM_Y + AXIS_HEIGHT / 2;
    centerAxis.castShadow = true;
    g.add(centerAxis);
    return g;
  }

  // ===== STEP 2: L1 cross frame (4 pipes # + clamps loose) =====
  function buildStep2() {
    const g = new THREE.Group();
    const pipeR = SCAFFOLD_PIPE_R, pipeLen = 4.4;
    const halfGap = PIPE_HALF_GAP;
    // X-direction pipes (at z=±halfGap)
    for (let i = 0; i < 2; i++) {
      const z = i === 0 ? -halfGap : halfGap;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(pipeR, pipeR, pipeLen, 12), pipeMat);
      pipe.rotation.z = Math.PI / 2; pipe.position.set(0, LAYER1_Y, z); pipe.castShadow = true;
      g.add(pipe);
    }
    // Z-direction pipes (at x=±halfGap, slightly higher)
    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? -halfGap : halfGap;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(pipeR, pipeR, pipeLen, 12), pipeMat);
      pipe.rotation.x = Math.PI / 2; pipe.position.set(x, LAYER1_Y + 0.07, 0); pipe.castShadow = true;
      g.add(pipe);
    }
    // Clamps (LOOSE state, light color) at 4 horse-pole positions AND 4 edge-pillar positions
    // Horse poles (r=1.0, cardinal)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const isXAxis = (i % 2 === 0);
      const clamp = isXAxis
        ? makeScaffoldClamp('y', 'x', halfGap, clampLooseMat)
        : makeScaffoldClamp('y', 'z', halfGap, clampLooseMat);
      const yOff = isXAxis ? LAYER1_Y : LAYER1_Y + 0.07;
      const xOff = isXAxis ? POLE_RADIUS * Math.cos(a) : halfGap / 2;
      const zOff = isXAxis ? halfGap / 2 : POLE_RADIUS * Math.sin(a);
      clamp.position.set(xOff, yOff, zOff);
      g.add(clamp);
      allStepClampGroups.push(clamp);
    }
    // Edge pillars (r=2.05, cardinal)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const isXAxis = (i % 2 === 0);
      const clamp = isXAxis
        ? makeScaffoldClamp('y', 'x', halfGap, clampLooseMat)
        : makeScaffoldClamp('y', 'z', halfGap, clampLooseMat);
      const yOff = isXAxis ? LAYER1_Y : LAYER1_Y + 0.07;
      const xOff = isXAxis ? TALL_PILLAR_R * Math.cos(a) : halfGap / 2;
      const zOff = isXAxis ? halfGap / 2 : TALL_PILLAR_R * Math.sin(a);
      clamp.position.set(xOff, yOff, zOff);
      g.add(clamp);
      allStepClampGroups.push(clamp);
    }
    return g;
  }

  // ===== STEP 3: 8 pipes inserted through clamps (no casters yet) =====
  function buildStep3() {
    const g = new THREE.Group();
    // 4 horse poles at r=1.0
    polesData = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const poleGroup = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(POLE_DIAMETER/2, POLE_DIAMETER/2, POLE_LEN, 12), pipeMat);
      pole.position.y = POLE_LEN / 2; pole.castShadow = true;
      poleGroup.add(pole);
      poleGroup.position.set(POLE_RADIUS * Math.cos(a), 0, POLE_RADIUS * Math.sin(a));
      poleGroup.rotation.y = Math.PI / 2 - a;
      g.add(poleGroup);
      polesData.push({ group: poleGroup, baseAngle: a });
    }
    // 4 edge pillars at r=2.05
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, TALL_PILLAR_HEIGHT, 12),
        pipeMat
      );
      pillar.position.set(
        TALL_PILLAR_R * Math.cos(a),
        TALL_PILLAR_BOTTOM + TALL_PILLAR_HEIGHT / 2,
        TALL_PILLAR_R * Math.sin(a)
      );
      pillar.castShadow = true;
      g.add(pillar);
    }
    return g;
  }

  // ===== STEP 4: Casters attached to all 8 pipes =====
  function buildStep4() {
    const g = new THREE.Group();
    // Horse pole casters (4)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const cg = new THREE.Group();
      const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 14), casterMat);
      caster.position.y = 0.05;
      caster.rotation.x = Math.PI / 2;
      caster.castShadow = true;
      cg.add(caster);
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.07), casterMat);
      bracket.position.y = 0.115;
      cg.add(bracket);
      cg.position.set(POLE_RADIUS * Math.cos(a), 0, POLE_RADIUS * Math.sin(a));
      cg.rotation.y = Math.PI / 2 - a;
      g.add(cg);
      horsePoleCasters.push(cg);
    }
    // Edge pillar casters (4)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const cg = new THREE.Group();
      const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 14), casterMat);
      caster.position.y = 0.05;
      caster.rotation.y = -a;
      caster.rotation.z = -Math.PI / 2;
      caster.castShadow = true;
      cg.add(caster);
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.07), casterMat);
      bracket.position.y = 0.115;
      bracket.rotation.y = -a;
      cg.add(bracket);
      cg.position.set(TALL_PILLAR_R * Math.cos(a), 0, TALL_PILLAR_R * Math.sin(a));
      g.add(cg);
    }
    return g;
  }

  // ===== STEP 5: L1 clamps tightened (material swap — handled in updateStep) =====
  function buildStep5() {
    // Empty group — actual change is a material swap on existing clamps
    const g = new THREE.Group();
    // Add a tiny "lock" marker as feedback that step 5 ran (invisible — just a tag)
    return g;
  }

  // ===== STEP 6: L3 upper cross frame + center sleeve clamps =====
  const upperClampGroups = [];
  function buildStep6() {
    const g = new THREE.Group();
    const pipeR = SCAFFOLD_PIPE_R, pipeLen = 4.4;
    const halfGap = PIPE_HALF_GAP;
    // X-pipe (at z=+halfGap)
    const pipeX = new THREE.Mesh(new THREE.CylinderGeometry(pipeR, pipeR, pipeLen, 12), pipeMat);
    pipeX.rotation.z = Math.PI / 2;
    pipeX.position.set(0, LAYER3_Y, +halfGap);
    pipeX.castShadow = true;
    g.add(pipeX);
    // Z-pipe (at x=+halfGap, slightly higher)
    const pipeZ = new THREE.Mesh(new THREE.CylinderGeometry(pipeR, pipeR, pipeLen, 12), pipeMat);
    pipeZ.rotation.x = Math.PI / 2;
    pipeZ.position.set(+halfGap, LAYER3_Y + 0.07, 0);
    pipeZ.castShadow = true;
    g.add(pipeZ);
    // Center clamp at X×Z intersection
    const centerClamp = makeScaffoldClamp('x', 'z', 0.07, clampMat);
    centerClamp.position.set(+halfGap, LAYER3_Y + 0.035, +halfGap);
    g.add(centerClamp);
    // Edge-pillar clamps (cardinal)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const isXAxis = (i % 2 === 0);
      const c = isXAxis
        ? makeScaffoldClamp('y', 'x', halfGap, clampMat)
        : makeScaffoldClamp('y', 'z', halfGap, clampMat);
      if (isXAxis) c.position.set(TALL_PILLAR_R * Math.cos(a), LAYER3_Y, halfGap / 2);
      else         c.position.set(halfGap / 2, LAYER3_Y + 0.07, TALL_PILLAR_R * Math.sin(a));
      g.add(c);
    }
    // Sleeve clamps at center post (loose — these are the rotation bearings)
    const sleeve1 = makeScaffoldClamp('y', 'x', halfGap, clampLooseMat);
    sleeve1.position.set(0, LAYER3_Y, halfGap / 2);
    g.add(sleeve1);
    upperClampGroups.push(sleeve1);
    const sleeve2 = makeScaffoldClamp('y', 'z', halfGap, clampLooseMat);
    sleeve2.position.set(halfGap / 2, LAYER3_Y + 0.07, 0);
    g.add(sleeve2);
    upperClampGroups.push(sleeve2);
    return g;
  }

  // ===== STEP 7: Wavy rail + substrate =====
  function buildStep7() {
    const g = new THREE.Group();
    // Paper-bundle substrate ring
    const substrate = new THREE.Mesh(new THREE.RingGeometry(0.80, 1.20, 48), plywoodMat);
    substrate.rotation.x = -Math.PI / 2;
    substrate.position.y = 0.003;
    substrate.receiveShadow = true;
    g.add(substrate);
    // Wavy rail
    wavyRailMesh = new THREE.Mesh(makeWavyRailGeometry(), railWoodMat);
    wavyRailMesh.receiveShadow = true;
    wavyRailMesh.castShadow = true;
    g.add(wavyRailMesh);
    return g;
  }

  // ===== STEP 8: L2 deck (4 plates + diamond veneer) =====
  function buildStep8() {
    const g = new THREE.Group();
    const PLATE_LONG = 1.80, PLATE_SHORT = 0.90, PLATE_THICK = 0.012;
    const HOLE_HALF = 0.20;
    const plateRadialCenter = HOLE_HALF + PLATE_LONG / 2;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(PLATE_LONG, PLATE_THICK, PLATE_SHORT), plywoodMat);
      plate.position.set(
        plateRadialCenter * Math.cos(a),
        LAYER2_Y,
        plateRadialCenter * Math.sin(a)
      );
      plate.rotation.y = -a;
      plate.castShadow = true; plate.receiveShadow = true;
      g.add(plate);
    }
    // Diamond veneer with center hole
    const diamondShape = new THREE.Shape();
    const D = 1.80;
    diamondShape.moveTo( D, 0);
    diamondShape.lineTo(0,  D);
    diamondShape.lineTo(-D, 0);
    diamondShape.lineTo(0, -D);
    diamondShape.closePath();
    const holePath = new THREE.Path();
    const H = 0.20;
    holePath.moveTo( H,  H);
    holePath.lineTo( H, -H);
    holePath.lineTo(-H, -H);
    holePath.lineTo(-H,  H);
    holePath.closePath();
    diamondShape.holes.push(holePath);
    const veneer = new THREE.Mesh(new THREE.ShapeGeometry(diamondShape), veneerMat);
    veneer.rotation.x = -Math.PI / 2;
    veneer.position.y = LAYER2_Y - 0.007;
    veneer.receiveShadow = true;
    g.add(veneer);
    return g;
  }

  // ===== STEP 9: Stop collars on horse poles + seat boards =====
  function buildStep9() {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const px = POLE_RADIUS * Math.cos(a);
      const pz = POLE_RADIUS * Math.sin(a);
      // Each horse's collar + seat parts live in one sub-group so the whole
      // "ride" can bob up and down with the pole over the wavy rail.
      const sub = new THREE.Group();

      // Stop collar (シャフトカラー)
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 0.04, 16, 1, true),
        collarMat
      );
      collar.position.set(px, COLLAR_Y_ON_POLE, pz);
      collar.castShadow = true;
      sub.add(collar);
      const capGeo = new THREE.RingGeometry(POLE_DIAMETER/2 + 0.001, 0.042, 16);
      for (let c = 0; c < 2; c++) {
        const cap = new THREE.Mesh(capGeo, collarMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(px, COLLAR_Y_ON_POLE + (c === 0 ? 0.02 : -0.02), pz);
        sub.add(cap);
      }
      const setScrew = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.015, 0.012), collarMat);
      setScrew.position.set(px + 0.044 * Math.cos(a), COLLAR_Y_ON_POLE, pz + 0.044 * Math.sin(a));
      sub.add(setScrew);

      // Cross clamp + short pipe + seat board (the "乗る部分") at HORSE_Y - 0.15
      const seatY = HORSE_Y - 0.15;  // ≈ 0.80
      const seatClamp = makeScaffoldClamp('y', 'x', PIPE_HALF_GAP, clampMat);
      seatClamp.position.set(px, seatY, pz);
      seatClamp.rotation.y = Math.PI / 2 - a;
      sub.add(seatClamp);
      // Short horizontal pipe (cross-arm) through the clamp, tangential to the radius
      const shortPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, 0.42, 10),
        pipeMat
      );
      shortPipe.position.set(px, seatY, pz);
      shortPipe.rotation.y = -a;
      shortPipe.rotation.z = Math.PI / 2;
      shortPipe.castShadow = true;
      sub.add(shortPipe);
      // Seat board on top of the short pipe (a small wooden plank)
      const seatBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.018, 0.40),
        seatBoardMat
      );
      seatBoard.position.set(px, seatY + 0.04, pz);
      seatBoard.rotation.y = -a;
      seatBoard.castShadow = true; seatBoard.receiveShadow = true;
      sub.add(seatBoard);

      g.add(sub);
      seatAssemblies.push(sub);
    }
    return g;
  }

  // ===== STEP 10: 4 horses + 4 push handles + 4 staff =====
  function buildStep10() {
    const g = new THREE.Group();
    // Horses on horse poles
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const horse = createHorse();
      horse.position.set(POLE_RADIUS * Math.cos(a), HORSE_Y, POLE_RADIUS * Math.sin(a));
      horse.rotation.y = Math.PI / 2 - a;
      g.add(horse);
      horseObjects.push(horse);
    }
    // Push handles + staff at 4 cardinal edge pillars
    const handlePositions = [
      { x:  2.0, z:  0,   baseY: LAYER1_Y },
      { x:  0,   z:  2.0, baseY: LAYER1_Y + 0.07 },
      { x: -2.0, z:  0,   baseY: LAYER1_Y },
      { x:  0,   z: -2.0, baseY: LAYER1_Y + 0.07 },
    ];
    for (let i = 0; i < handlePositions.length; i++) {
      const h = handlePositions[i];
      const handleHeight = 0.95;
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, handleHeight, 12), pipeMat);
      handle.position.set(h.x, h.baseY + handleHeight / 2, h.z);
      handle.castShadow = true;
      g.add(handle);
      const r = Math.sqrt(h.x*h.x + h.z*h.z);
      const tx = -h.z / r, tz = h.x / r;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.30, 12), pipeMat);
      grip.position.set(h.x, h.baseY + handleHeight, h.z);
      grip.rotation.y = Math.atan2(tx, tz);
      grip.rotation.z = Math.PI / 2;
      grip.castShadow = true;
      g.add(grip);
      // Staff
      const person = createPerson();
      person.position.set(h.x + tx * 0.48, 0, h.z + tz * 0.48);
      person.rotation.y = Math.atan2(tx, tz) + Math.PI;
      g.add(person);
      personObjects.push(person);
    }
    return g;
  }

  // ============================================================
  // Build all step groups (hidden initially)
  // ============================================================
  const stepBuilders = [
    buildStep1, buildStep2, buildStep3, buildStep4, buildStep5,
    buildStep6, buildStep7, buildStep8, buildStep9, buildStep10
  ];
  for (let i = 0; i < stepBuilders.length; i++) {
    const g = stepBuilders[i]();
    g.visible = false;
    stepGroups.push(g);
    scene.add(g);
  }

  // ===== Step descriptions =====
  const stepData = [
    {
      title: '床固定金具＋中心支柱',
      desc: '床合板に固定金具（フランジ＋ソケット）を取り付け、その中に 2.5 m 鉄パイプを差し込む。周囲に 4 個の重りを配置。',
      detail: '中心支柱は最終的に静止側（回転しない）になる。ソケットの止めネジで本締め。',
      parts: 'A-03 鉄パイプ 2.5m × 1 ・ 床合板 ・ フランジ ・ ソケット ・ 重り × 4'
    },
    {
      title: 'L1 十字パイプを＃に組む',
      desc: '4 m 鉄パイプ 4 本を中心軸を挟んで＃字状に配置。各ポール位置・支柱位置に三連クランプを仮止め。',
      detail: 'クランプはまだ締めない（このあと垂直パイプを通すため）。',
      parts: 'A-01 鉄パイプ 4m × 4 ・ 三連クランプ × 8 ・ 直交クランプ（交差部） × 4'
    },
    {
      title: '8 本の垂直パイプを通す',
      desc: '十字フレームを倒し、三連クランプに 2 m パイプ 8 本（馬ポール 4 ＋ 外周支柱 4）を通す。',
      detail: '実際の工程では十字フレームを横倒しにして通すと作業しやすい。クランプはまだ締めない。',
      parts: 'A-02 鉄パイプ 2m × 8'
    },
    {
      title: 'キャスター取付',
      desc: '8 本のパイプ下端にキャスター＋ブラケットを取り付け。馬ポール 4 本は長めのネジを使用。',
      detail: '馬ポールのキャスターは波型レールを走る φ100mm。外周支柱も同サイズで統一。',
      parts: 'キャスター φ100 × 8 ・ ブラケット × 8 ・ 長ネジ × 4'
    },
    {
      title: 'L1 クランプ本締め（馬ポール以外）',
      desc: '十字フレームを縦に戻し、外周支柱 4 箇所のクランプを本締め固定。馬ポール 4 本のクランプは上下スライドできるよう緩めのまま。',
      detail: 'クランプの色が変わるのが「本締め完了」のサイン。',
      parts: 'スパナ ・ レンチ'
    },
    {
      title: 'L3 上部十字パイプ＋中心軸スリーブ',
      desc: '外周支柱の上端 4 箇所と中心軸の同じ高さ位置に直交クランプを配置し、L3 の上部十字パイプ（4m × 2 本）を通す。',
      detail: '中心軸のクランプ 2 個は緩め（回転を許す摺動軸受）。これで「中心軸は静止・上部のみ回転」が成立。',
      parts: 'A-01 鉄パイプ 4m × 2 ・ 直交クランプ × 5（中心 1 ＋ 周辺 4） ・ スリーブクランプ × 2'
    },
    {
      title: '波型レール設置＋中心軸固定',
      desc: 'レール下に紙束＋ベニヤ基台を敷き、その上に波型の薄板を載せる。中心支柱を床合板に本締め固定。',
      detail: 'キャスター（前ステップ）が波型レール上を転がる構成。凸 4 つ・高さ 10 cm（馬は 10 cm 上下動）。',
      parts: '波型レール一式 ・ 基台ベニヤ ・ 紙束（重量調整用） ・ 中心軸固定ボルト'
    },
    {
      title: 'L2 デッキ合板',
      desc: '1800×900×12 mm の合板 4 枚を放射状に配置。下に菱形ベニヤ（D=1.80m）を敷き、中心は 400×400 mm の穴。',
      detail: 'L1 パイプの上に乗る形。馬ポールはこの段階で 4 枚の合板間隙に通る。',
      parts: 'B-01 合板 1800×900×12 × 4 ・ 菱形ベニヤ × 1'
    },
    {
      title: '止め輪＋乗り板（馬ポール上機構）',
      desc: '各馬ポールに止め輪（シャフトカラー）を装着して脱落防止。中ほどに交差クランプ＋短いパイプ＋木の板を取り付け、乗る部分を完成。',
      detail: '止め輪は L3 上の高さに位置決め。波の谷で着座、山で +10 cm 浮上の上下動を実現する V4 機構を継承。',
      parts: 'D-07 シャフトカラー × 4 ・ 交差クランプ × 4 ・ 短パイプ × 4 ・ 乗り板 × 4'
    },
    {
      title: '馬を装飾・押し棒設置・完成',
      desc: '4 頭の馬をポール上に固定。外周 4 箇所に T 字グリップ付きの押し棒を取り付け、スタッフが押せる状態に。',
      detail: '試運転：(a) 一体回転 (b) 馬の上下動 (c) ポール抜けなし (d) 全クランプ増し締め — を確認して開場。',
      parts: 'E-03 馬 × 4 ・ 押し棒 × 4 ・ 結束バンド・針金 ・ 装飾'
    }
  ];

  // ===== State + UI =====
  let currentStep = 0;
  const totalSteps = 10;

  // ===== Toggle state =====
  let rotationEnabled    = true;   // 回転 ON/OFF
  let decorationsVisible = true;   // 装飾品（馬・人）表示
  let dimensionsVisible  = false;  // 寸法ラベル表示
  let assemblyAngle      = 0;      // current rotation of the merry-go-round (rad)

  // ===== Dimension labels (3D billboards toggled by the 寸法 button) =====
  function makeDimLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 52;
    const font = 'bold ' + fontSize + "px -apple-system, 'Hiragino Sans', sans-serif";
    ctx.font = font;
    const pad = 26;
    canvas.width  = Math.ceil(ctx.measureText(text).width) + pad * 2;
    canvas.height = fontSize + pad * 2;
    ctx.font = font;
    ctx.fillStyle = 'rgba(176, 74, 58, 0.94)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.encoding  = THREE.sRGBEncoding;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, depthTest: false, depthWrite: false, transparent: true
    }));
    const s = 0.0023;
    sprite.scale.set(canvas.width * s, canvas.height * s, 1);
    return sprite;
  }

  const dimensionGroup = new THREE.Group();
  dimensionGroup.visible = false;
  scene.add(dimensionGroup);
  [
    ['中心軸 2.5m',              0,     2.85, 0   ],
    ['馬ポール 2m / 旋回 r1.0m',  1.35,  1.62, 0   ],
    ['波型レール 凸4・高さ10cm',  0,     0.52, 1.75],
    ['外周支柱 r=2.05m',         2.05,  2.50, 0   ],
    ['馬の上下動 10cm',          -1.35,  1.62, 0   ]
  ].forEach(function(d) {
    const label = makeDimLabel(d[0]);
    label.position.set(d[1], d[2], d[3]);
    dimensionGroup.add(label);
  });

  // ===== Decoration (horses + staff) visibility =====
  function applyDecorations() {
    for (let i = 0; i < horseObjects.length; i++)  horseObjects[i].visible  = decorationsVisible;
    for (let i = 0; i < personObjects.length; i++) personObjects[i].visible = decorationsVisible;
  }

  // ===== Horse bobbing — each horse pole follows the stationary wavy rail =====
  function applyBobbing() {
    const active = (currentStep === totalSteps);
    for (let i = 0; i < polesData.length; i++) {
      const bob = active
        ? waveAmplitude * Math.sin(waveCount * (polesData[i].baseAngle + assemblyAngle))
        : 0;
      polesData[i].group.position.y = bob;
      if (horsePoleCasters[i]) horsePoleCasters[i].position.y = bob;
      if (seatAssemblies[i])   seatAssemblies[i].position.y   = bob;
      if (horseObjects[i])     horseObjects[i].position.y     = HORSE_Y + bob;
    }
  }

  function setStep(n) {
    currentStep = Math.max(0, Math.min(totalSteps, n));
    // Show/hide step groups
    for (let i = 0; i < stepGroups.length; i++) {
      stepGroups[i].visible = (i < currentStep);
    }
    // Step 5: switch L1 clamps from loose -> tight (skip horse-pole clamps i.e. first 4)
    // currentStep >= 5: tight L1 clamps for edge pillars (indices 4..7 of allStepClampGroups)
    if (currentStep >= 5) {
      // tighten L1 clamps for edge pillars only
      for (let i = 4; i < allStepClampGroups.length; i++) {
        const cg = allStepClampGroups[i];
        if (cg.userData.rings) {
          cg.userData.rings.forEach(r => r.material = clampMat);
        }
      }
    } else {
      for (let i = 0; i < allStepClampGroups.length; i++) {
        const cg = allStepClampGroups[i];
        if (cg.userData.rings) {
          cg.userData.rings.forEach(r => r.material = clampLooseMat);
        }
      }
    }

    // UI update
    document.getElementById('step-num').textContent = currentStep;
    document.getElementById('progress-fill').style.width = (currentStep / totalSteps * 100) + '%';
    document.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.remove('done', 'current');
      const s = parseInt(d.dataset.step, 10);
      if (s < currentStep) d.classList.add('done');
      else if (s === currentStep) d.classList.add('current');
    });
    document.querySelectorAll('.step-list-item').forEach(function(item) {
      item.classList.remove('done', 'current');
      const s = parseInt(item.dataset.step, 10);
      if (s < currentStep) item.classList.add('done');
      else if (s === currentStep) item.classList.add('current');
    });
    if (currentStep === 0) {
      document.getElementById('step-title').textContent = '開始前';
      document.getElementById('step-desc').textContent = '上の一覧から段階を選んでください。全 10 段階で完成します。';
      document.getElementById('step-detail').style.display = 'none';
      document.getElementById('parts-mini').innerHTML = '';
    } else {
      const sd = stepData[currentStep - 1];
      document.getElementById('step-title').textContent = sd.title;
      document.getElementById('step-desc').textContent = sd.desc;
      document.getElementById('step-detail').style.display = '';
      document.getElementById('step-detail-text').textContent = sd.detail;
      document.getElementById('parts-mini').innerHTML = '<span class="key">PARTS</span> ' + sd.parts;
    }
  }

  document.querySelectorAll('.dot').forEach(d => {
    d.addEventListener('click', () => setStep(parseInt(d.dataset.step, 10)));
  });

  // ===== Step list — always-visible dashboard navigation =====
  const stepList = document.getElementById('step-list');
  function addStepItem(value, label) {
    const item = document.createElement('button');
    item.className = 'step-list-item';
    item.dataset.step = String(value);
    const num = document.createElement('span');
    num.className = 'sli-num';
    num.textContent = String(value);
    const title = document.createElement('span');
    title.className = 'sli-title';
    title.textContent = label;
    item.appendChild(num);
    item.appendChild(title);
    item.addEventListener('click', function() { setStep(value); });
    stepList.appendChild(item);
  }
  addStepItem(0, '開始前');
  for (let i = 0; i < stepData.length; i++) {
    addStepItem(i + 1, stepData[i].title);
  }

  // ===== Toggle buttons — 寸法 / 回転 / 装飾品 =====
  const btnDim  = document.getElementById('toggle-dim');
  const btnRot  = document.getElementById('toggle-rot');
  const btnDeco = document.getElementById('toggle-deco');
  function syncToggleUI() {
    btnDim.classList.toggle('active', dimensionsVisible);
    btnRot.classList.toggle('active', rotationEnabled);
    btnDeco.classList.toggle('active', decorationsVisible);
  }
  btnDim.onclick = function() {
    dimensionsVisible = !dimensionsVisible;
    dimensionGroup.visible = dimensionsVisible;
    syncToggleUI();
  };
  btnRot.onclick = function() {
    rotationEnabled = !rotationEnabled;
    syncToggleUI();
  };
  btnDeco.onclick = function() {
    decorationsVisible = !decorationsVisible;
    applyDecorations();
    syncToggleUI();
  };
  syncToggleUI();

  // Initialize
  setStep(0);

  // ===== Animation: rotation + horse bobbing =====
  // The center post (step 1) and the wavy rail + substrate (step 7, index 6) stay
  // STATIONARY; everything else turns around the center so the horse-pole casters
  // roll over the fixed wavy rail. Rotation is gated by the 回転 toggle.
  const rotateableSteps = [1, 2, 3, 4, 5, 7, 8, 9];
  const OMEGA = 0.5 * Math.PI * 2 / 60; // 0.5 rpm

  let lastT = 0;
  function animate(t) {
    requestAnimationFrame(animate);
    const dt = Math.min((t - lastT) / 1000, 0.1);
    lastT = t;
    if (rotationEnabled) assemblyAngle += OMEGA * dt;
    for (let k = 0; k < rotateableSteps.length; k++) {
      const g = stepGroups[rotateableSteps[k]];
      if (g) g.rotation.y = assemblyAngle;
    }
    applyBobbing();
    renderer.render(scene, camera);
  }
  animate(0);

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
