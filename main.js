window.addEventListener('load', function() {
  if (typeof THREE === 'undefined') {
    document.getElementById('loading').textContent = 'Three.jsの読み込みに失敗しました';
    return;
  }
  document.getElementById('loading').style.display = 'none';
  document.getElementById('step-panel').style.display = '';
  document.getElementById('legend-panel').style.display = '';
  document.getElementById('step-indicator-bar').style.display = '';

  var dashToggle = document.getElementById('dashboard-toggle');
  var stepPanel = document.getElementById('step-panel');
  var isMobile = window.matchMedia('(max-width: 640px)');
  function applyMobileCollapse() {
    if (isMobile.matches) {
      dashToggle.style.display = 'block';
      stepPanel.classList.add('collapsed');
      dashToggle.textContent = '☰';
    } else {
      dashToggle.style.display = 'none';
      stepPanel.classList.remove('collapsed');
    }
  }
  applyMobileCollapse();
  isMobile.addEventListener('change', applyMobileCollapse);
  dashToggle.addEventListener('click', function() {
    var isCollapsed = stepPanel.classList.toggle('collapsed');
    dashToggle.textContent = isCollapsed ? '☰' : '✕';
  });

  const canvas = document.getElementById('scene');

  // ============================================================
  // SPEC — 寸法の単一定義元
  // 3Dモデル・寸法ラベル・図面はすべてこの SPEC を参照する。
  // ここを編集すれば3Dモデルと図面の両方が同時に更新され、ズレが生じない。
  // 値はすべてメートル単位。ラベル表示は mm() で mm 整数に換算する。
  // ============================================================
  const SPEC = {
    layer1Y: 0.42,            // L1 十字パイプ層の高さ
    layer2Y: 0.54,            // L2 デッキ合板の高さ
    layer3Y: 2.00,            // L3 上部十字パイプ層の高さ

    centerAxis: {             // 中心支柱（静止軸）
      bottomY:  0.05,
      length:   2.50,         // 鉄パイプ 2500mm
      diameter: 0.0486,       // φ48.6
    },
    horsePole: {              // 馬ポール（昇降する垂直パイプ）
      radius:   1.00,         // 配置半径 r=1000
      length:   2.00,         // 2000mm
      diameter: 0.0486,
      count:    4,
    },
    edgePillar: {             // 外周支柱（押して回す垂直パイプ）
      radius:   2.05,         // 配置半径 r=2050
      bottomY:  0.085,
      topY:     2.20,
      diameter: 0.0486,
      count:    4,
    },
    crossPipe: {              // 十字フレーム用 鉄パイプ
      length:   4.40,         // 4400mm
      diameter: 0.0486,
    },
    base: {                   // 床固定金具まわり
      plywoodDiameter:  1.20, // φ1200 床合板
      plywoodThickness: 0.018,
      flangeDiameter:   0.20, // φ200 フランジ
      flangeThickness:  0.012,
      socketDiameter:   0.10, // φ100 ソケット
      socketHeight:     0.12, // h120
      weightDiameter:   0.15, // φ150 重り
      weightHeight:     0.05,
      weightRadius:     0.36, // 重りの配置半径
      weightCount:      4,
    },
    caster: {                 // キャスター
      diameter:      0.10,    // φ100
      bracketHeight: 0.05,    // h50
    },
    wavyRail: {               // 波型レール
      innerDiameter: 1.68,    // φ1680
      outerDiameter: 2.32,    // φ2320
      centerY:       0.15,
      thickness:     0.025,
      waveHeight:    0.10,    // 凸の高さ（谷→山）100mm
      waveCount:     4,       // 凸4つ
    },
    deck: {                   // L2 デッキ
      plateLong:  1.80,       // 合板 1800
      plateShort: 0.90,       // 合板 900
      plateThick: 0.012,      // 合板 12
      plateCount: 4,
      centerHole: 0.40,       // 中心穴 400×400
      diamondD:   1.80,       // 菱形ベニヤ
    },
    seat: {                   // 止め輪＋乗り板
      collarDiameter:  0.084, // φ84 シャフトカラー
      collarHeight:    0.04,
      boardWidth:      0.30,  // 乗り板 300
      boardDepth:      0.40,  // 乗り板 400
      boardThick:      0.018, // 乗り板 18
      shortPipeLength: 0.42,  // 短パイプ 420mm
      seatY:           0.80,  // 座面の高さ
    },
    horse: {                  // 馬
      centerY:      0.95,     // 馬の取付高さ
      approxLength: 0.70,     // 全長 ≈700mm
    },
  };

  // mm 表記ヘルパ（メートル → mm。小数第1位まで保持し φ48.6 等の精度を維持）
  function mm(m) { return Math.round(m * 10000) / 10; }

  // ===== Derived constants (SPEC から導出 — 既存コードとの互換用) =====
  const LAYER1_Y          = SPEC.layer1Y;
  const LAYER2_Y          = SPEC.layer2Y;
  const LAYER3_Y          = SPEC.layer3Y;
  const AXIS_BOTTOM_Y     = SPEC.centerAxis.bottomY;
  const AXIS_HEIGHT       = SPEC.centerAxis.length;
  const POLE_LEN          = SPEC.horsePole.length;
  const POLE_RADIUS       = SPEC.horsePole.radius;
  const POLE_DIAMETER     = SPEC.horsePole.diameter;
  const SCAFFOLD_PIPE_R   = POLE_DIAMETER / 2;
  const PIPE_HALF_GAP     = POLE_DIAMETER + 0.003;
  const HORSE_Y           = SPEC.horse.centerY;
  const WAVE_CENTER_Y     = SPEC.wavyRail.centerY;
  const COLLAR_Y_ON_POLE  = LAYER3_Y - (WAVE_CENTER_Y - 0.075);
  const TALL_PILLAR_R     = SPEC.edgePillar.radius;
  const TALL_PILLAR_BOTTOM = SPEC.edgePillar.bottomY;
  const TALL_PILLAR_TOP   = SPEC.edgePillar.topY;
  const TALL_PILLAR_HEIGHT = TALL_PILLAR_TOP - TALL_PILLAR_BOTTOM;
  const waveAmplitude = SPEC.wavyRail.waveHeight / 2;  // 振幅±5cm
  const waveCount     = SPEC.wavyRail.waveCount;

  // ===== Scene =====
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1419);
  scene.fog = new THREE.Fog(0x0f1419, 18, 48);

  var isMobileLayout = window.matchMedia('(max-width: 640px)');
  var PANEL_WIDTH = 360;
  function canvasRect() {
    if (isMobileLayout.matches) return { x: 0, w: window.innerWidth, h: window.innerHeight };
    var w = window.innerWidth - PANEL_WIDTH;
    return { x: PANEL_WIDTH, w: w, h: window.innerHeight };
  }

  function applyCanvasLayout() {
    var r = canvasRect();
    canvas.style.left = r.x + 'px';
    canvas.style.width = r.w + 'px';
    var dv = document.getElementById('drawing-view');
    if (dv) { dv.style.left = r.x + 'px'; dv.style.width = r.w + 'px'; }
    renderer.setSize(r.w, r.h);
    camera.aspect = r.w / r.h;
    camera.updateProjectionMatrix();
  }

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  applyCanvasLayout();

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

  // ===== Triple scaffold clamp (三連クランプ) =====
  function makeTripleClamp(vertAxis, horizAxis, pipeGap, material) {
    material = material || clampMat;
    var group = new THREE.Group();
    var ringR = 0.04, tubeR = 0.012;
    var allAxes = ['x','y','z'];
    var perpAxis = allAxes.find(function(a) { return a !== vertAxis && a !== horizAxis; });
    var swapMeshes = [];
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
    var ringCenter = new THREE.Mesh(new THREE.TorusGeometry(ringR, tubeR, 10, 18), material);
    rotateTorusForAxis(ringCenter, vertAxis);
    ringCenter.castShadow = true;
    group.add(ringCenter);
    swapMeshes.push(ringCenter);
    for (var s = -1; s <= 1; s += 2) {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, tubeR, 10, 18), material);
      rotateTorusForAxis(ring, horizAxis);
      setPos(ring, perpAxis, s * pipeGap);
      ring.castShadow = true;
      group.add(ring);
      swapMeshes.push(ring);
      var connGeo;
      if (perpAxis === 'x') connGeo = new THREE.BoxGeometry(pipeGap, 0.026, 0.026);
      else if (perpAxis === 'y') connGeo = new THREE.BoxGeometry(0.026, pipeGap, 0.026);
      else connGeo = new THREE.BoxGeometry(0.026, 0.026, pipeGap);
      var conn = new THREE.Mesh(connGeo, material);
      setPos(conn, perpAxis, s * pipeGap / 2);
      conn.castShadow = true;
      group.add(conn);
      swapMeshes.push(conn);
      var bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8), clampBoltMat);
      rotateCylForAxis(bolt, perpAxis);
      setPos(bolt, perpAxis, s * (pipeGap + ringR + 0.022));
      bolt.castShadow = true;
      group.add(bolt);
      var nut = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 6), clampBoltMat);
      rotateCylForAxis(nut, perpAxis);
      setPos(nut, perpAxis, s * (pipeGap + ringR + 0.055));
      nut.castShadow = true;
      group.add(nut);
    }
    group.userData.rings = swapMeshes;
    return group;
  }

  // ===== Wavy rail geometry helper =====
  function makeWavyRailGeometry() {
    const segments = 256;
    const innerR = SPEC.wavyRail.innerDiameter / 2, outerR = SPEC.wavyRail.outerDiameter / 2, thickness = SPEC.wavyRail.thickness;
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

  // ===== Limb helper — an oriented cylinder spanning two points =====
  function makeLimb(p1, p2, r1, r2, material) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 10), material);
    limb.position.copy(p1).addScaledVector(dir, 0.5);
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    limb.castShadow = true;
    return limb;
  }

  // ===== Person factory =====
  // Faces local +z. Each arm is one connected chain: shoulder joint → upper arm
  // → elbow joint → forearm → hand, both hands reaching forward to push a pillar.
  function createPerson() {
    const person = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), skinMat);
    head.position.set(0, 1.58, 0.02); head.castShadow = true; person.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12, 0, Math.PI*2, 0, Math.PI*0.55), hairMat);
    hair.position.set(0, 1.59, 0.02); hair.castShadow = true; person.add(hair);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.58, 14), shirtMat);
    torso.position.y = 1.10; torso.castShadow = true; person.add(torso);
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1;
      const shoulder = new THREE.Vector3(s * 0.17, 1.33, 0.06);
      const hand     = new THREE.Vector3(s * 0.03, 1.20 - i * 0.18, 0.41);
      const elbow    = new THREE.Vector3(
        (shoulder.x + hand.x) / 2,
        (shoulder.y + hand.y) / 2 - 0.10,
        (shoulder.z + hand.z) / 2 + 0.02
      );
      person.add(makeLimb(shoulder, elbow, 0.042, 0.05, shirtMat)); // upper arm
      person.add(makeLimb(elbow, hand, 0.034, 0.042, skinMat));     // forearm
      const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), shirtMat);
      shoulderJoint.position.copy(shoulder); shoulderJoint.castShadow = true; person.add(shoulderJoint);
      const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), skinMat);
      elbowJoint.position.copy(elbow); person.add(elbowJoint);
      const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.046, 10, 8), skinMat);
      handMesh.position.copy(hand); handMesh.castShadow = true; person.add(handMesh);
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
  const woodObjects      = []; // wooden parts across steps (wood toggle)

  // ===== STEP 1: Floor anchor + center post =====
  function buildStep1() {
    const g = new THREE.Group();
    // Plywood base disc
    const plywoodBase = new THREE.Mesh(new THREE.CylinderGeometry(SPEC.base.plywoodDiameter/2, SPEC.base.plywoodDiameter/2, SPEC.base.plywoodThickness, 32), plywoodMat);
    plywoodBase.position.y = SPEC.base.plywoodThickness / 2;
    plywoodBase.receiveShadow = true; plywoodBase.castShadow = true;
    g.add(plywoodBase);
    woodObjects.push(plywoodBase);
    // Steel mounting flange
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(SPEC.base.flangeDiameter/2, SPEC.base.flangeDiameter/2, SPEC.base.flangeThickness, 18), casterMat);
    flange.position.y = SPEC.base.plywoodThickness + SPEC.base.flangeThickness / 2;
    flange.castShadow = true; g.add(flange);
    // Pipe socket
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(SPEC.base.socketDiameter/2, SPEC.base.socketDiameter/2, SPEC.base.socketHeight, 16), casterMat);
    socket.position.y = 0.078;
    socket.castShadow = true; g.add(socket);
    // Set screw on socket
    const setScrew = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.02, 0.018), clampBoltMat);
    setScrew.position.set(0.058, 0.078, 0); g.add(setScrew);
    // 4 weights
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(SPEC.base.weightDiameter/2, SPEC.base.weightDiameter/2, SPEC.base.weightHeight, 24), casterMat);
      w.position.set(SPEC.base.weightRadius * Math.cos(a), 0.043, SPEC.base.weightRadius * Math.sin(a));
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
    const pipeR = SCAFFOLD_PIPE_R, pipeLen = SPEC.crossPipe.length;
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
    // Triple clamps (三連クランプ) at 4 horse-pole positions
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const isXAxis = (i % 2 === 0);
      const clamp = isXAxis
        ? makeTripleClamp('y', 'x', halfGap, clampLooseMat)
        : makeTripleClamp('y', 'z', halfGap, clampLooseMat);
      const yOff = isXAxis ? LAYER1_Y : LAYER1_Y + 0.07;
      clamp.position.set(POLE_RADIUS * Math.cos(a), yOff, POLE_RADIUS * Math.sin(a));
      g.add(clamp);
      allStepClampGroups.push(clamp);
    }
    // Triple clamps at 4 edge-pillar positions
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const isXAxis = (i % 2 === 0);
      const clamp = isXAxis
        ? makeTripleClamp('y', 'x', halfGap, clampLooseMat)
        : makeTripleClamp('y', 'z', halfGap, clampLooseMat);
      const yOff = isXAxis ? LAYER1_Y : LAYER1_Y + 0.07;
      clamp.position.set(TALL_PILLAR_R * Math.cos(a), yOff, TALL_PILLAR_R * Math.sin(a));
      g.add(clamp);
      allStepClampGroups.push(clamp);
    }
    // Center triple clamps (center post + parallel cross pipes)
    const centerClampX = makeTripleClamp('y', 'x', halfGap, clampLooseMat);
    centerClampX.position.set(0, LAYER1_Y, 0);
    g.add(centerClampX);
    allStepClampGroups.push(centerClampX);
    const centerClampZ = makeTripleClamp('y', 'z', halfGap, clampLooseMat);
    centerClampZ.position.set(0, LAYER1_Y + 0.07, 0);
    g.add(centerClampZ);
    allStepClampGroups.push(centerClampZ);
    // 4 right-angle clamps at cross-pipe intersections (十字パイプ同士)
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sz = -1; sz <= 1; sz += 2) {
        const crossClamp = makeScaffoldClamp('x', 'z', 0.07, clampLooseMat);
        crossClamp.position.set(sx * halfGap, LAYER1_Y + 0.035, sz * halfGap);
        g.add(crossClamp);
        allStepClampGroups.push(crossClamp);
      }
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
      pole.position.y = 0.14 + POLE_LEN / 2; pole.castShadow = true;
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
      const caster = new THREE.Mesh(new THREE.CylinderGeometry(SPEC.caster.diameter/2, SPEC.caster.diameter/2, 0.04, 14), casterMat);
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
      const caster = new THREE.Mesh(new THREE.CylinderGeometry(SPEC.caster.diameter/2, SPEC.caster.diameter/2, 0.04, 14), casterMat);
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
    const pipeR = SCAFFOLD_PIPE_R, pipeLen = SPEC.crossPipe.length;
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
    // Horse pole clamps at L3 (visually clamped to the upper structure)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const isXAxis = (i % 2 === 0);
      const c = isXAxis
        ? makeScaffoldClamp('y', 'x', halfGap, clampMat)
        : makeScaffoldClamp('y', 'z', halfGap, clampMat);
      const yOff = isXAxis ? LAYER3_Y : LAYER3_Y + 0.07;
      const xOff = isXAxis ? POLE_RADIUS * Math.cos(a) : halfGap / 2;
      const zOff = isXAxis ? halfGap / 2 : POLE_RADIUS * Math.sin(a);
      c.position.set(xOff, yOff, zOff);
      g.add(c);
    }
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
    woodObjects.push(substrate);
    // Wavy rail
    wavyRailMesh = new THREE.Mesh(makeWavyRailGeometry(), railWoodMat);
    wavyRailMesh.receiveShadow = true;
    wavyRailMesh.castShadow = true;
    g.add(wavyRailMesh);
    woodObjects.push(wavyRailMesh);
    return g;
  }

  // ===== STEP 8: L2 deck (4 plates + diamond veneer) =====
  function buildStep8() {
    const g = new THREE.Group();
    const PLATE_LONG = SPEC.deck.plateLong, PLATE_SHORT = SPEC.deck.plateShort, PLATE_THICK = SPEC.deck.plateThick;
    const HOLE_HALF = SPEC.deck.centerHole / 2;
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
      woodObjects.push(plate);
    }
    // Diamond veneer with center hole
    const diamondShape = new THREE.Shape();
    const D = SPEC.deck.diamondD;
    diamondShape.moveTo( D, 0);
    diamondShape.lineTo(0,  D);
    diamondShape.lineTo(-D, 0);
    diamondShape.lineTo(0, -D);
    diamondShape.closePath();
    const holePath = new THREE.Path();
    const H = SPEC.deck.centerHole / 2;
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
    woodObjects.push(veneer);
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
        new THREE.CylinderGeometry(SPEC.seat.collarDiameter/2, SPEC.seat.collarDiameter/2, SPEC.seat.collarHeight, 16, 1, true),
        collarMat
      );
      collar.position.set(px, COLLAR_Y_ON_POLE, pz);
      collar.castShadow = true;
      sub.add(collar);
      const capGeo = new THREE.RingGeometry(POLE_DIAMETER/2 + 0.001, SPEC.seat.collarDiameter/2, 16);
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
      const seatY = SPEC.seat.seatY;
      const seatClamp = makeScaffoldClamp('y', 'x', PIPE_HALF_GAP, clampMat);
      seatClamp.position.set(px, seatY, pz);
      seatClamp.rotation.y = Math.PI / 2 - a;
      sub.add(seatClamp);
      // Short horizontal pipe (cross-arm) through the clamp, tangential to the radius
      const shortPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, SPEC.seat.shortPipeLength, 10),
        pipeMat
      );
      shortPipe.position.set(px, seatY, pz);
      shortPipe.rotation.y = -a;
      shortPipe.rotation.z = Math.PI / 2;
      shortPipe.castShadow = true;
      sub.add(shortPipe);
      // Seat board on top of the short pipe (a small wooden plank)
      const seatBoard = new THREE.Mesh(
        new THREE.BoxGeometry(SPEC.seat.boardWidth, SPEC.seat.boardThick, SPEC.seat.boardDepth),
        seatBoardMat
      );
      seatBoard.position.set(px, seatY + 0.04, pz);
      seatBoard.rotation.y = -a;
      seatBoard.castShadow = true; seatBoard.receiveShadow = true;
      sub.add(seatBoard);
      woodObjects.push(seatBoard);

      g.add(sub);
      seatAssemblies.push(sub);
    }
    return g;
  }

  // ===== STEP 10: 4 horses + 4 staff pushing the edge pillars =====
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
    // Staff standing just behind each edge pillar, pushing it directly by hand
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const px = TALL_PILLAR_R * Math.cos(a);
      const pz = TALL_PILLAR_R * Math.sin(a);
      const tx = -Math.sin(a), tz = Math.cos(a); // tangential push direction
      const person = createPerson();
      person.position.set(px - tx * 0.46, 0, pz - tz * 0.46);
      person.rotation.y = Math.atan2(tx, tz);
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
      desc: '4 m 鉄パイプ 4 本を中心軸を挟んで＃字状に配置。各ポール・支柱位置と中心軸に三連クランプを仮止め、十字パイプ交差部に直交クランプ 4 個。',
      detail: 'クランプはまだ締めない（このあと垂直パイプを通すため）。',
      parts: 'A-01 鉄パイプ 4m × 4 ・ 三連クランプ × 10 ・ 直交クランプ（交差部） × 4'
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
      title: '馬を装飾・スタッフ配置・完成',
      desc: '4 頭の馬をポール上に固定。外周支柱 4 箇所にスタッフが付き、支柱を直接手で押して回す。',
      detail: '試運転：(a) 一体回転 (b) 馬の上下動 (c) ポール抜けなし (d) 全クランプ増し締め — を確認して開場。',
      parts: 'E-03 馬 × 4 ・ 結束バンド・針金 ・ 装飾'
    }
  ];

  // ===== State + UI =====
  let currentStep = 0;
  const totalSteps = 10;

  // ===== Toggle state =====
  let rotationEnabled    = true;   // 回転 ON/OFF
  let decorationsVisible = true;   // 装飾品（馬・人）表示
  let dimensionsVisible  = false;  // 寸法ラベル表示
  let woodVisible        = true;   // 木材（木製パーツ）表示
  let assemblyAngle      = 0;      // current rotation of the merry-go-round (rad)
  let viewMode           = '3d';   // '3d' = 3Dモデル / 'drawing' = 図面

  // ===== Dimension labels — attached directly to each part =====
  var dimLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthTest: false });
  var dimDotGeo  = new THREE.SphereGeometry(0.015, 6, 4);
  var dimDotMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });

  function makeDimLabel(text) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fontSize = 20;
    var font = 'bold ' + fontSize + "px 'JetBrains Mono', ui-monospace, monospace";
    ctx.font = font;
    var pad = 10;
    var tw = Math.ceil(ctx.measureText(text).width);
    canvas.width  = tw + pad * 2;
    canvas.height = fontSize + pad * 2;
    // background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    var r = 4;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(canvas.width - r, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
    ctx.lineTo(canvas.width, canvas.height - r);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
    ctx.lineTo(r, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    // text
    ctx.font = font;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    var texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.encoding  = THREE.sRGBEncoding;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, depthTest: false, depthWrite: false, transparent: true
    }));
    var s = 0.0016;
    sprite.scale.set(canvas.width * s, canvas.height * s, 1);
    return sprite;
  }

  function makeStick(ax, ay, az, bx, by, bz) {
    var pts = [new THREE.Vector3(ax,ay,az), new THREE.Vector3(bx,by,bz)];
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), dimLineMat);
  }

  // Per-step dimension groups
  var stepDimGroups = [];
  for (var di = 0; di < 10; di++) { stepDimGroups.push(new THREE.Group()); stepDimGroups[di].visible = false; scene.add(stepDimGroups[di]); }

  // Place a label near a part: dot on part, short stick, label at end
  function tagPart(stepIdx, text, partX, partY, partZ, offX, offY, offZ) {
    var g = stepDimGroups[stepIdx];
    var dot = new THREE.Mesh(dimDotGeo, dimDotMat);
    dot.position.set(partX, partY, partZ);
    g.add(dot);
    var lx = partX + offX, ly = partY + offY, lz = partZ + offZ;
    g.add(makeStick(partX, partY, partZ, lx, ly, lz));
    var label = makeDimLabel(text);
    label.position.set(lx, ly, lz);
    g.add(label);
  }

  // Height span: two dots + vertical stick + label at midpoint
  function tagHeight(stepIdx, text, x, yBot, yTop, z, offX, offZ) {
    var g = stepDimGroups[stepIdx];
    var dotB = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotB.position.set(x, yBot, z); g.add(dotB);
    var dotT = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotT.position.set(x, yTop, z); g.add(dotT);
    g.add(makeStick(x, yBot, z, x, yTop, z));
    // small ticks at ends
    g.add(makeStick(x - 0.03, yBot, z, x + 0.03, yBot, z));
    g.add(makeStick(x - 0.03, yTop, z, x + 0.03, yTop, z));
    var label = makeDimLabel(text);
    label.position.set(x + offX, (yBot + yTop) / 2, z + offZ);
    g.add(label);
    g.add(makeStick(x, (yBot + yTop) / 2, z, x + offX, (yBot + yTop) / 2, z + offZ));
  }

  // Width span: two dots + horizontal stick + label above midpoint
  function tagWidth(stepIdx, text, ax, ay, az, bx, by, bz, labelOffY) {
    var g = stepDimGroups[stepIdx];
    var dotA = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotA.position.set(ax, ay, az); g.add(dotA);
    var dotB = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotB.position.set(bx, by, bz); g.add(dotB);
    g.add(makeStick(ax, ay, az, bx, by, bz));
    var label = makeDimLabel(text);
    var my = (ay + by) / 2 + (labelOffY || 0.08);
    label.position.set((ax+bx)/2, my, (az+bz)/2);
    g.add(label);
  }

  // 寸法ラベルのテキストはすべて SPEC から生成する（ハードコード禁止）。
  // --- Step 1: 床固定金具＋中心支柱 ---
  tagPart(0, 'φ'+mm(SPEC.base.plywoodDiameter)+' 床合板', 0.55, 0.009, 0, 0.18, 0.08, 0);
  tagPart(0, 'φ'+mm(SPEC.base.flangeDiameter)+' フランジ', 0.10, 0.024, 0, 0.10, 0.06, 0.10);
  tagPart(0, 'φ'+mm(SPEC.base.socketDiameter)+'×h'+mm(SPEC.base.socketHeight)+' ソケット', 0, 0.078, 0.05, 0.10, 0.06, 0.08);
  tagHeight(0, mm(SPEC.centerAxis.length)+'mm φ'+mm(SPEC.centerAxis.diameter), 0.06, AXIS_BOTTOM_Y, AXIS_BOTTOM_Y + AXIS_HEIGHT, 0, 0.12, 0);
  tagPart(0, 'φ'+mm(SPEC.base.weightDiameter)+' 重り×'+SPEC.base.weightCount, SPEC.base.weightRadius*Math.cos(Math.PI/4), 0.043, SPEC.base.weightRadius*Math.sin(Math.PI/4), 0.08, 0.06, 0.08);

  // --- Step 2: L1 十字パイプ ---
  tagPart(1, 'h'+mm(SPEC.layer1Y)+' L1層', 0, LAYER1_Y, -PIPE_HALF_GAP, 0, 0.08, -0.10);
  tagWidth(1, mm(SPEC.crossPipe.length)+'mm パイプ×4', -SPEC.crossPipe.length/2, LAYER1_Y, -PIPE_HALF_GAP, SPEC.crossPipe.length/2, LAYER1_Y, -PIPE_HALF_GAP, 0.08);
  tagPart(1, 'クランプ仮止め×8', POLE_RADIUS, LAYER1_Y, 0, 0.08, 0.08, 0.08);

  // --- Step 3: 垂直パイプ8本 ---
  tagHeight(2, mm(SPEC.horsePole.length)+'mm 馬ポール', POLE_RADIUS+0.06, 0, POLE_LEN, 0, 0.12, 0);
  tagHeight(2, mm(TALL_PILLAR_HEIGHT)+'mm 外周支柱', TALL_PILLAR_R+0.06, TALL_PILLAR_BOTTOM, TALL_PILLAR_TOP, 0, 0.12, 0);
  tagWidth(2, 'r='+mm(SPEC.horsePole.radius), 0, 0.35, 0, POLE_RADIUS, 0.35, 0, 0.06);
  tagWidth(2, 'r='+mm(SPEC.edgePillar.radius), 0, 0.25, 0, TALL_PILLAR_R, 0.25, 0, 0.06);
  tagPart(2, 'φ'+mm(SPEC.crossPipe.diameter)+' 全8本', -POLE_RADIUS, 1.0, 0, -0.08, 0.08, 0);

  // --- Step 4: キャスター ---
  tagPart(3, 'φ'+mm(SPEC.caster.diameter)+' キャスター', POLE_RADIUS, 0.05, 0, 0.10, 0.06, 0.10);
  tagPart(3, 'φ'+mm(SPEC.caster.diameter)+' キャスター', 0, 0.05, TALL_PILLAR_R, 0.10, 0.06, 0.10);
  tagPart(3, 'ブラケット h'+mm(SPEC.caster.bracketHeight), POLE_RADIUS, 0.115, 0, -0.10, 0.06, -0.10);

  // --- Step 5: クランプ本締め ---
  tagPart(4, '本締め', TALL_PILLAR_R, LAYER1_Y, 0, 0.10, 0.06, 0.10);
  tagPart(4, '緩め維持', POLE_RADIUS, LAYER1_Y, 0, 0.10, 0.06, 0.10);

  // --- Step 6: L3 上部十字パイプ ---
  tagPart(5, 'h'+mm(SPEC.layer3Y)+' L3層', 0, LAYER3_Y, PIPE_HALF_GAP, 0, 0.08, 0.10);
  tagWidth(5, mm(SPEC.crossPipe.length)+'mm 上部パイプ×2', -SPEC.crossPipe.length/2, LAYER3_Y, PIPE_HALF_GAP, SPEC.crossPipe.length/2, LAYER3_Y, PIPE_HALF_GAP, 0.08);
  tagPart(5, 'スリーブ（回転軸受）', PIPE_HALF_GAP, LAYER3_Y+0.035, PIPE_HALF_GAP, 0.10, 0.06, 0.08);
  tagPart(5, '支柱クランプ×4', TALL_PILLAR_R, LAYER3_Y, 0, 0.10, 0.06, 0);

  // --- Step 7: 波型レール ---
  tagWidth(6, '内径 φ'+mm(SPEC.wavyRail.innerDiameter), 0, WAVE_CENTER_Y, SPEC.wavyRail.innerDiameter/2, 0, WAVE_CENTER_Y, -SPEC.wavyRail.innerDiameter/2, 0.08);
  tagWidth(6, '外径 φ'+mm(SPEC.wavyRail.outerDiameter), 0, WAVE_CENTER_Y, SPEC.wavyRail.outerDiameter/2, 0, WAVE_CENTER_Y, -SPEC.wavyRail.outerDiameter/2, 0.10);
  tagPart(6, '凸'+SPEC.wavyRail.waveCount+'つ h'+mm(SPEC.wavyRail.waveHeight), POLE_RADIUS, WAVE_CENTER_Y + waveAmplitude, 0, 0.08, 0.06, 0.08);
  tagPart(6, '基台ベニヤ', 0, 0.003, 1.0, 0.10, 0.06, 0.08);

  // --- Step 8: L2 デッキ合板 ---
  tagPart(7, mm(SPEC.deck.plateLong)+'×'+mm(SPEC.deck.plateShort)+'×'+mm(SPEC.deck.plateThick)+' 合板×4', 1.10, LAYER2_Y, 0, 0.08, 0.08, 0.08);
  tagPart(7, 'h'+mm(SPEC.layer2Y)+' L2層', 0, LAYER2_Y, 0.20, 0, 0.08, 0.08);
  tagPart(7, '菱形ベニヤ D'+mm(SPEC.deck.diamondD), -0.90, LAYER2_Y-0.007, 0.90, -0.08, 0.06, 0.08);
  tagPart(7, '中心穴 '+mm(SPEC.deck.centerHole)+'×'+mm(SPEC.deck.centerHole), 0.15, LAYER2_Y, 0.15, 0.08, 0.06, 0.08);

  // --- Step 9: 止め輪＋乗り板 ---
  tagPart(8, 'φ'+mm(SPEC.seat.collarDiameter)+' シャフトカラー', POLE_RADIUS, COLLAR_Y_ON_POLE, 0, 0.10, 0.06, 0.10);
  tagPart(8, '乗り板 '+mm(SPEC.seat.boardWidth)+'×'+mm(SPEC.seat.boardDepth)+'×'+mm(SPEC.seat.boardThick), POLE_RADIUS, SPEC.seat.seatY+0.04, 0, 0.10, 0.06, 0.10);
  tagPart(8, '短パイプ '+mm(SPEC.seat.shortPipeLength)+'mm', POLE_RADIUS, SPEC.seat.seatY, 0, -0.10, -0.06, -0.10);
  tagHeight(8, 'h'+mm(SPEC.seat.seatY)+' 座面', -POLE_RADIUS-0.06, 0, SPEC.seat.seatY, 0, -0.12, 0);

  // --- Step 10: 馬・スタッフ ---
  tagPart(9, '馬 ≈'+mm(SPEC.horse.approxLength)+'mm', POLE_RADIUS, HORSE_Y, 0, 0.08, 0.15, 0.08);
  tagPart(9, '上下動 ±'+mm(SPEC.wavyRail.waveHeight/2)+'mm', -POLE_RADIUS, HORSE_Y, 0, -0.08, 0.15, -0.08);
  tagPart(9, 'スタッフ×'+SPEC.edgePillar.count, TALL_PILLAR_R, 0.80, 0, 0.08, 0.10, 0.08);

  // ===== Dimension visibility per step =====
  function applyDimensions() {
    for (var i = 0; i < stepDimGroups.length; i++) {
      stepDimGroups[i].visible = dimensionsVisible && (i < currentStep);
    }
  }

  // ===== Decoration (horses + staff) visibility =====
  function applyDecorations() {
    for (let i = 0; i < horseObjects.length; i++)  horseObjects[i].visible  = decorationsVisible;
    for (let i = 0; i < personObjects.length; i++) personObjects[i].visible = decorationsVisible;
  }

  // ===== Wood (wooden parts) visibility =====
  function applyWood() {
    for (let i = 0; i < woodObjects.length; i++) woodObjects[i].visible = woodVisible;
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

  // ============================================================
  // 図面 (2D technical drawing) — 3Dモデルと同じ SPEC から描画
  // すべての寸法値は mm() / SPEC を経由するため 3Dモデルとズレない。
  // ============================================================
  const DWG = (function() {
    const ARR = 42, DIM_FS = 82, LBL_FS = 74;
    const STYLE = '<style>'
      + '.dw-pipe{stroke:#aab2bd;stroke-width:6;fill:rgba(170,178,189,0.10);stroke-linejoin:round;}'
      + '.dw-steel{stroke:#9097a3;stroke-width:6;fill:rgba(132,138,150,0.18);stroke-linejoin:round;}'
      + '.dw-wood{stroke:#d2a06a;stroke-width:6;fill:rgba(210,160,106,0.13);stroke-linejoin:round;}'
      + '.dw-deco{stroke:#8a8f9c;stroke-width:5;fill:rgba(122,128,140,0.12);stroke-linejoin:round;}'
      + '.dw-dim{stroke:#5f8fc8;stroke-width:4;fill:none;}'
      + '.dw-dimar{fill:#5f8fc8;}'
      + '.dw-ext{stroke:#5f8fc8;stroke-width:3;fill:none;opacity:0.55;}'
      + '.dw-dtxt{fill:#cfe0f5;font-size:' + DIM_FS + 'px;font-family:ui-monospace,monospace;font-weight:600;}'
      + '.dw-dbg{fill:#12161d;}'
      + '.dw-lbl{fill:#aab0c0;font-size:' + LBL_FS + 'px;font-family:-apple-system,sans-serif;}'
      + '.dw-llead{stroke:#7a8290;stroke-width:3;fill:none;}'
      + '.dw-ldot{fill:#7a8290;}'
      + '.dw-ax{stroke:#50607a;stroke-width:3;fill:none;stroke-dasharray:46 20 10 20;}'
      + '.dw-ground{stroke:#788193;stroke-width:6;}'
      + '.dw-gh{stroke:#3c4453;stroke-width:3;}'
      + '.dw-hidden{stroke:#8a8f9c;stroke-width:4;fill:none;stroke-dasharray:28 18;}'
      + '.dw-note{fill:#7a8290;font-size:' + Math.round(LBL_FS*0.8) + 'px;font-family:ui-monospace,monospace;}'
      + '</style>';

    function f(n) { return Math.round(n * 10) / 10; }
    function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function L(x1,y1,x2,y2,c) { return '<line x1="'+f(x1)+'" y1="'+f(y1)+'" x2="'+f(x2)+'" y2="'+f(y2)+'" class="'+c+'"/>'; }
    function R(x,y,w,h,c) { return '<rect x="'+f(x)+'" y="'+f(y)+'" width="'+f(w)+'" height="'+f(h)+'" class="'+c+'"/>'; }
    function C(x,y,r,c) { return '<circle cx="'+f(x)+'" cy="'+f(y)+'" r="'+f(r)+'" class="'+c+'"/>'; }
    function EL(x,y,rx,ry,c) { return '<ellipse cx="'+f(x)+'" cy="'+f(y)+'" rx="'+f(rx)+'" ry="'+f(ry)+'" class="'+c+'"/>'; }
    function PL(p,c) { return '<polyline points="'+p+'" class="'+c+'" fill="none"/>'; }
    function PG(p,c) { return '<polygon points="'+p+'" class="'+c+'"/>'; }
    function TX(x,y,s,c,a) { return '<text x="'+f(x)+'" y="'+f(y)+'" class="'+c+'" text-anchor="'+(a||'middle')+'" dominant-baseline="middle">'+esc(s)+'</text>'; }
    function textW(s,fs) { var w=0; for (var i=0;i<s.length;i++) { w += s.charCodeAt(i)>0x2000 ? fs : fs*0.6; } return w; }
    function dtext(cx,cy,s,rot) {
      var fs=DIM_FS, w=textW(s,fs)+fs*0.5, h=fs*1.35;
      var inner=R(cx-w/2,cy-h/2,w,h,'dw-dbg')+TX(cx,cy,s,'dw-dtxt');
      return rot ? '<g transform="rotate('+rot+' '+f(cx)+' '+f(cy)+')">'+inner+'</g>' : inner;
    }
    function arrow(tx,ty,dx,dy) {
      var ax=tx-dx*ARR, ay=ty-dy*ARR, px=-dy*ARR*0.34, py=dx*ARR*0.34;
      return PG(f(tx)+','+f(ty)+' '+f(ax+px)+','+f(ay+py)+' '+f(ax-px)+','+f(ay-py),'dw-dimar');
    }
    // vertical dim: sy1=bottom(larger y), sy2=top; line at sx; extension from extX
    function dimV(sx,sy1,sy2,extX,label) {
      return L(sx,sy1,sx,sy2,'dw-dim')
        + L(extX,sy1,sx,sy1,'dw-ext') + L(extX,sy2,sx,sy2,'dw-ext')
        + arrow(sx,sy1,0,1) + arrow(sx,sy2,0,-1)
        + dtext(sx,(sy1+sy2)/2,label,-90);
    }
    // horizontal dim between sx1 & sx2 at line sy; extension from extY
    function dimH(sx1,sx2,sy,extY,label) {
      return L(sx1,sy,sx2,sy,'dw-dim')
        + L(sx1,extY,sx1,sy,'dw-ext') + L(sx2,extY,sx2,sy,'dw-ext')
        + arrow(sx1,sy,-1,0) + arrow(sx2,sy,1,0)
        + dtext((sx1+sx2)/2,sy,label,0);
    }
    function leader(px,py,lx,ly,label,a) {
      a = a || 'start';
      var tx = a==='start' ? lx+24 : lx-24;
      return C(px,py,9,'dw-ldot') + PL(f(px)+','+f(py)+' '+f(lx)+','+f(ly),'dw-llead')
        + TX(tx,ly,label,'dw-lbl',a);
    }
    function SVG(W,H,body) {
      return '<svg viewBox="0 0 '+f(W)+' '+f(H)+'" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">'
        + STYLE + body + '</svg>';
    }

    // ---- SPEC 値を mm 整数で取得（図面はすべてここ経由）----
    function S() {
      return {
        aB:mm(SPEC.centerAxis.bottomY), aL:mm(SPEC.centerAxis.length), aD:mm(SPEC.centerAxis.diameter),
        L1:mm(SPEC.layer1Y), L2:mm(SPEC.layer2Y), L3:mm(SPEC.layer3Y),
        pR:mm(SPEC.horsePole.radius), pL:mm(SPEC.horsePole.length), pD:mm(SPEC.horsePole.diameter),
        eR:mm(SPEC.edgePillar.radius), eB:mm(SPEC.edgePillar.bottomY), eT:mm(SPEC.edgePillar.topY), eD:mm(SPEC.edgePillar.diameter),
        cpL:mm(SPEC.crossPipe.length), cpD:mm(SPEC.crossPipe.diameter),
        plyD:mm(SPEC.base.plywoodDiameter), plyT:mm(SPEC.base.plywoodThickness),
        flD:mm(SPEC.base.flangeDiameter), flT:mm(SPEC.base.flangeThickness),
        soD:mm(SPEC.base.socketDiameter), soH:mm(SPEC.base.socketHeight),
        wD:mm(SPEC.base.weightDiameter), wH:mm(SPEC.base.weightHeight), wR:mm(SPEC.base.weightRadius), wN:SPEC.base.weightCount,
        cD:mm(SPEC.caster.diameter), cBr:mm(SPEC.caster.bracketHeight),
        rIn:mm(SPEC.wavyRail.innerDiameter), rOut:mm(SPEC.wavyRail.outerDiameter),
        rCY:mm(SPEC.wavyRail.centerY), rTh:mm(SPEC.wavyRail.thickness),
        rWH:mm(SPEC.wavyRail.waveHeight), rWC:SPEC.wavyRail.waveCount,
        dpL:mm(SPEC.deck.plateLong), dpS:mm(SPEC.deck.plateShort), dpT:mm(SPEC.deck.plateThick),
        dpN:SPEC.deck.plateCount, dHole:mm(SPEC.deck.centerHole), dDia:mm(SPEC.deck.diamondD),
        coD:mm(SPEC.seat.collarDiameter), coH:mm(SPEC.seat.collarHeight),
        sbW:mm(SPEC.seat.boardWidth), sbD:mm(SPEC.seat.boardDepth), sbT:mm(SPEC.seat.boardThick),
        spL:mm(SPEC.seat.shortPipeLength), seatY:mm(SPEC.seat.seatY), collarY:mm(COLLAR_Y_ON_POLE),
        hY:mm(SPEC.horse.centerY), hLen:mm(SPEC.horse.approxLength),
        poleCnt:SPEC.horsePole.count, pillarCnt:SPEC.edgePillar.count
      };
    }

    // ===== 立面図 ELEVATION =====
    function elevation(step) {
      var s = S();
      var mL=1150, mR=520, mT=110, mB=600;
      var wXmin=-2200, wXmax=2200, wYmax=2650;
      var W=mL+(wXmax-wXmin)+mR, H=mT+wYmax+mB;
      function X(wx){ return mL+(wx-wXmin); }
      function Y(wy){ return mT+(wYmax-wy); }
      var gY=Y(0), o=[];

      // 中心線
      o.push(L(X(0),Y(2650),X(0),gY+90,'dw-ax'));
      // 地面＋ハッチング
      o.push(L(X(wXmin)-220,gY,X(wXmax)+220,gY,'dw-ground'));
      for (var hx=X(wXmin)-180; hx<X(wXmax)+220; hx+=130) o.push(L(hx,gY,hx-72,gY+72,'dw-gh'));

      // helper: 縦パイプ
      function vpipe(cx,yb,yt,dia,cls){ return R(X(cx)-dia/2,Y(yt),dia,Y(yb)-Y(yt),cls); }

      // STEP1: 床合板・フランジ・ソケット・中心支柱・重り
      if (step>=1) {
        o.push(R(X(-s.plyD/2),Y(s.plyT),s.plyD,s.plyT,'dw-wood'));
        o.push(R(X(-s.flD/2),Y(s.plyT+s.flT),s.flD,s.flT,'dw-steel'));
        o.push(R(X(-s.soD/2),Y(s.plyT+s.flT+s.soH),s.soD,s.soH,'dw-steel'));
        o.push(vpipe(0,s.aB,s.aB+s.aL,s.aD,'dw-pipe'));
        var wx1=Math.round(s.wR*0.707);
        o.push(R(X(wx1-s.wD/2),Y(s.wH),s.wD,s.wH,'dw-steel'));
        o.push(R(X(-wx1-s.wD/2),Y(s.wH),s.wD,s.wH,'dw-steel'));
        o.push(leader(X(0)+s.aD/2,Y(s.aB+s.aL-260),X(0)+560,Y(s.aB+s.aL-150),'φ'+s.aD+' 鋼管・中心支柱'));
      }
      // STEP2: L1 十字パイプ
      if (step>=2) o.push(R(X(-s.cpL/2),Y(s.L1)-s.cpD/2,s.cpL,s.cpD,'dw-pipe'));
      // STEP3: 馬ポール×2・外周支柱×2
      if (step>=3) {
        o.push(vpipe(-s.pR,0,s.pL,s.pD,'dw-pipe'));
        o.push(vpipe( s.pR,0,s.pL,s.pD,'dw-pipe'));
        o.push(vpipe(-s.eR,s.eB,s.eT,s.eD,'dw-pipe'));
        o.push(vpipe( s.eR,s.eB,s.eT,s.eD,'dw-pipe'));
      }
      // STEP4: キャスター（8本ぶん）
      if (step>=4) {
        [-s.eR,-s.pR,s.pR,s.eR].forEach(function(cx){
          o.push(C(X(cx),Y(s.cD/2),s.cD/2,'dw-steel'));
        });
      }
      // STEP6: L3 上部十字パイプ
      if (step>=6) o.push(R(X(-s.cpL/2),Y(s.L3)-s.cpD/2,s.cpL,s.cpD,'dw-pipe'));
      // STEP7: 波型レール
      if (step>=7) {
        var amp=s.rWH/2, top=[], bot=[], N=120;
        for (var i=0;i<=N;i++){
          var wx=-s.rOut/2 + s.rOut*(i/N);
          var yy=s.rCY + amp*Math.sin((i/N)*s.rWC*Math.PI*2);
          top.push(f(X(wx))+','+f(Y(yy+s.rTh/2)));
          bot.push(f(X(wx))+','+f(Y(yy-s.rTh/2)));
        }
        o.push(PG(top.join(' ')+' '+bot.reverse().join(' '),'dw-wood'));
      }
      // STEP8: L2 デッキ
      if (step>=8) {
        var dHalf=s.dHole/2+s.dpL;
        o.push(R(X(-dHalf),Y(s.L2),dHalf-s.dHole/2,s.dpT,'dw-wood'));
        o.push(R(X(s.dHole/2),Y(s.L2),dHalf-s.dHole/2,s.dpT,'dw-wood'));
      }
      // STEP9: 止め輪＋乗り板
      if (step>=9) {
        [-s.pR,s.pR].forEach(function(cx){
          o.push(R(X(cx)-s.coD/2,Y(s.collarY+s.coH/2),s.coD,s.coH,'dw-steel'));
          o.push(R(X(cx)-s.spL/2,Y(s.seatY)-s.cpD/2,s.spL,s.cpD,'dw-pipe'));
          o.push(R(X(cx)-s.sbW/2,Y(s.seatY+s.cpD/2+s.sbT),s.sbW,s.sbT,'dw-wood'));
        });
      }
      // STEP10: 馬・スタッフ
      if (step>=10) {
        [-s.pR,s.pR].forEach(function(cx){ o.push(horseSide(X,Y,cx,s.hY)); });
        [-s.eR,s.eR].forEach(function(cx){
          var off = cx<0 ? -300 : 300;
          o.push(personSide(X,Y,cx+off));
        });
      }

      // ===== 寸法（高さ）— ステップ到達時のみ =====
      var colX=[mL-140,mL-280,mL-420,mL-560,mL-700,mL-840,mL-980];
      function vd(idx,h,label,need){ if(step>=need) o.push(dimV(colX[idx],gY,Y(h),X(wXmin),label)); }
      vd(0,s.L1,mm(SPEC.layer1Y)+'',2);
      vd(1,s.L2,mm(SPEC.layer2Y)+'',8);
      vd(2,s.seatY,mm(SPEC.seat.seatY)+'',9);
      vd(3,s.hY,mm(SPEC.horse.centerY)+'',10);
      vd(4,s.L3,mm(SPEC.layer3Y)+'',6);
      vd(5,s.eT,mm(SPEC.edgePillar.topY)+'',3);
      vd(6,s.aB+s.aL,mm(SPEC.centerAxis.length)+' (支柱)',1);

      // ===== 寸法（幅）=====
      var rowY=[gY+200,gY+370,gY+540];
      if (step>=3) o.push(dimH(X(-s.pR),X(s.pR),rowY[0],gY,'2×'+s.pR+'='+(s.pR*2)));
      if (step>=3) o.push(dimH(X(-s.eR),X(s.eR),rowY[1],gY,'2×'+s.eR+'='+(s.eR*2)));
      if (step>=2) o.push(dimH(X(-s.cpL/2),X(s.cpL/2),rowY[2],gY,mm(SPEC.crossPipe.length)+' (十字パイプ)'));

      // タイトル＋凡例
      o.push(TX(mL,mT-30,'立面図 — Z軸方向から見る','dw-note','start'));

      return SVG(W,H,o.join(''));
    }

    // 馬（側面シルエット）
    function horseSide(X,Y,cx,hY) {
      var g=[];
      g.push(EL(X(cx),Y(hY),330,175,'dw-deco'));
      g.push(PL(f(X(cx)+250)+','+f(Y(hY+60))+' '+f(X(cx)+430)+','+f(Y(hY+330))+' '+f(X(cx)+540)+','+f(Y(hY+360)),'dw-deco'));
      g.push(R(X(cx)+470,Y(hY+430),150,95,'dw-deco'));
      [-180,-60,150,260].forEach(function(lx){
        g.push(L(X(cx)+lx,Y(hY-120),X(cx)+lx,Y(hY-520),'dw-deco'));
      });
      g.push(PL(f(X(cx)-300)+','+f(Y(hY+30))+' '+f(X(cx)-470)+','+f(Y(hY-260)),'dw-deco'));
      return g.join('');
    }
    // スタッフ（側面シルエット）
    function personSide(X,Y,cx) {
      var g=[];
      g.push(C(X(cx),Y(1580),110,'dw-deco'));
      g.push(L(X(cx),Y(1470),X(cx),Y(820),'dw-deco'));
      g.push(L(X(cx),Y(820),X(cx)-130,Y(0),'dw-deco'));
      g.push(L(X(cx),Y(820),X(cx)+130,Y(0),'dw-deco'));
      g.push(L(X(cx),Y(1330),X(cx)+220,Y(1120),'dw-deco'));
      return g.join('');
    }

    // ===== 平面図 PLAN =====
    function plan(step) {
      var s = S();
      var hg = mm(PIPE_HALF_GAP);
      var RAD=2380, mSide=380, mTop=1100, mBot=1120;
      var W=mSide*2+RAD*2, H=mTop+mBot+RAD*2;
      var cx=mSide+RAD, cy=mTop+RAD;
      function X(wx){ return cx+wx; }
      function Y(wz){ return cy+wz; }
      var o=[], i, a;

      // 中心十字線
      o.push(L(X(-RAD-140),cy,X(RAD+140),cy,'dw-ax'));
      o.push(L(cx,Y(-RAD-140),cx,Y(RAD+140),'dw-ax'));

      // STEP1: 床合板・ソケット・重り
      if (step>=1) {
        o.push(C(cx,cy,s.plyD/2,'dw-wood'));
        for (i=0;i<s.wN;i++){ a=Math.PI/4+i/s.wN*Math.PI*2; o.push(C(X(s.wR*Math.cos(a)),Y(s.wR*Math.sin(a)),s.wD/2,'dw-steel')); }
        o.push(C(cx,cy,s.soD/2,'dw-steel'));
      }
      // STEP2: L1 十字パイプ（＃）
      if (step>=2) {
        [-hg,hg].forEach(function(z){ o.push(R(X(-s.cpL/2),Y(z)-s.cpD/2,s.cpL,s.cpD,'dw-pipe')); });
        [-hg,hg].forEach(function(x){ o.push(R(X(x)-s.cpD/2,Y(-s.cpL/2),s.cpD,s.cpL,'dw-pipe')); });
      }
      // STEP6: L3 上部十字パイプ（X1本＋Z1本）
      if (step>=6) {
        o.push(R(X(-s.cpL/2),Y(hg)-s.cpD/2,s.cpL,s.cpD,'dw-pipe'));
        o.push(R(X(hg)-s.cpD/2,Y(-s.cpL/2),s.cpD,s.cpL,'dw-pipe'));
      }
      // STEP7: 波型レール（内外リング）
      if (step>=7) {
        o.push(C(cx,cy,s.rOut/2,'dw-wood'));
        o.push(C(cx,cy,s.rIn/2,'dw-wood'));
        o.push(C(cx,cy,(s.rOut+s.rIn)/4,'dw-hidden'));
      }
      // STEP8: L2 デッキ合板（放射4枚）＋菱形ベニヤ＋中心穴
      if (step>=8) {
        var dd=s.dDia;
        o.push(PG([X(dd),cy,cx,Y(dd),X(-dd),cy,cx,Y(-dd)].join(' '),'dw-wood'));
        var pc=s.dHole/2+s.dpL/2;
        for (i=0;i<s.dpN;i++){
          a=i/s.dpN*90;
          o.push('<g transform="rotate('+f(a)+' '+f(cx)+' '+f(cy)+')">'
            + R(X(pc)-s.dpL/2,cy-s.dpS/2,s.dpL,s.dpS,'dw-wood') + '</g>');
        }
        o.push(R(cx-s.dHole/2,cy-s.dHole/2,s.dHole,s.dHole,'dw-hidden'));
      }
      // STEP3: 馬ポール・外周支柱（ピッチ円＋本体）
      if (step>=3) {
        o.push(C(cx,cy,s.pR,'dw-hidden'));
        o.push(C(cx,cy,s.eR,'dw-hidden'));
        for (i=0;i<s.poleCnt;i++){ a=i/s.poleCnt*Math.PI*2; o.push(C(X(s.pR*Math.cos(a)),Y(s.pR*Math.sin(a)),s.pD/2,'dw-pipe')); }
        for (i=0;i<s.pillarCnt;i++){ a=i/s.pillarCnt*Math.PI*2; o.push(C(X(s.eR*Math.cos(a)),Y(s.eR*Math.sin(a)),s.eD/2,'dw-pipe')); }
      }
      // STEP4: キャスター（8）
      if (step>=4) {
        for (i=0;i<s.poleCnt;i++){ a=i/s.poleCnt*Math.PI*2; o.push(C(X(s.pR*Math.cos(a)),Y(s.pR*Math.sin(a)),s.cD/2,'dw-steel')); }
        for (i=0;i<s.pillarCnt;i++){ a=i/s.pillarCnt*Math.PI*2; o.push(C(X(s.eR*Math.cos(a)),Y(s.eR*Math.sin(a)),s.cD/2,'dw-steel')); }
      }
      // STEP9: 乗り板（馬ポール上）
      if (step>=9) {
        for (i=0;i<s.poleCnt;i++){
          a=i/s.poleCnt*90;
          var pcr=s.pR;
          o.push('<g transform="rotate('+f(a)+' '+f(cx)+' '+f(cy)+')">'
            + R(X(pcr)-s.sbD/2,cy-s.sbW/2,s.sbD,s.sbW,'dw-wood') + '</g>');
        }
      }
      // STEP10: 馬・スタッフ
      if (step>=10) {
        for (i=0;i<s.poleCnt;i++){
          a=i/s.poleCnt*Math.PI*2;
          var deg=i/s.poleCnt*90;
          o.push('<g transform="rotate('+f(deg)+' '+f(cx)+' '+f(cy)+')">'
            + EL(X(s.pR),cy,s.hLen/2,150,'dw-deco') + '</g>');
        }
        for (i=0;i<s.pillarCnt;i++){
          a=i/s.pillarCnt*Math.PI*2;
          o.push(C(X((s.eR+300)*Math.cos(a)),Y((s.eR+300)*Math.sin(a)),110,'dw-deco'));
        }
      }

      // ===== 半径寸法（空き角へ斜めに）=====
      function radial(angDeg,r,label,need){
        if (step<need) return;
        var ang=angDeg*Math.PI/180;
        var ex=X(r*Math.cos(ang)), ey=Y(r*Math.sin(ang));
        o.push(L(cx,cy,ex,ey,'dw-dim'));
        o.push(arrow(ex,ey,Math.cos(ang),Math.sin(ang)));
        o.push(dtext((cx+ex)/2,(cy+ey)/2,label,0));
      }
      radial(38,s.pR,'r='+s.pR,3);
      radial(-38,s.eR,'r='+s.eR,3);

      // ===== 直径寸法（下方へ）=====
      if (step>=2) o.push(dimH(X(-s.cpL/2),X(s.cpL/2),cy+RAD+260,cy+RAD,mm(SPEC.crossPipe.length)+' 十字パイプ'));
      if (step>=7) o.push(dimH(X(-s.rOut/2),X(s.rOut/2),cy+RAD+520,cy+RAD,'φ'+s.rOut+' レール外径'));
      if (step>=7) o.push(dimH(X(-s.rIn/2),X(s.rIn/2),cy+RAD+780,cy+RAD,'φ'+s.rIn+' レール内径'));
      if (step>=1) o.push(leader(X(-s.plyD*0.35),Y(s.plyD*0.35),X(-RAD*0.62),Y(-RAD-60),'φ'+s.plyD+' 床合板','start'));

      o.push(TX(mSide,140,'平面図 — 上から見る','dw-note','start'));
      return SVG(W,H,o.join(''));
    }

    // ===== 部品詳細図 PART DETAILS（N.T.S. — 寸法値のみ SPEC 連動）=====
    function detPipe() {
      var s=S(), cx=580,cy=560,r=290;
      var o=L(cx-r-170,cy,cx+r+170,cy,'dw-ax')+L(cx,cy-r-170,cx,cy+r+170,'dw-ax');
      o+=C(cx,cy,r,'dw-pipe')+C(cx,cy,r*0.82,'dw-pipe');
      o+=dimH(cx-r,cx+r,cy-r-160,cy-r,'φ'+s.aD);
      o+=TX(cx,cy+r+210,'足場用単管（鋼管）','dw-lbl');
      return SVG(1200,1160,o);
    }
    function detBase() {
      var s=S(), cx=640,by=860, fw=620,fh=120, sw=300,sh=400;
      var o=R(cx-fw/2,by-fh,fw,fh,'dw-steel')+R(cx-sw/2,by-fh-sh,sw,sh,'dw-steel');
      o+=L(cx,by-fh-sh-150,cx,by+150,'dw-ax');
      o+=dimH(cx-fw/2,cx+fw/2,by+210,by,'φ'+s.flD);
      o+=dimH(cx-sw/2,cx+sw/2,by-fh-sh-170,by-fh-sh,'φ'+s.soD);
      o+=dimV(by-fh,by-fh-sh,cx+fw/2+210,cx+sw/2,'h'+s.soH);
      o+=dimV(by,by-fh,cx-fw/2-190,cx-fw/2,'t'+s.flT);
      return SVG(1440,1160,o);
    }
    function detWeight() {
      var s=S(), cx=540,cy=420,w=560,h=187;
      var o=R(cx-w/2,cy-h/2,w,h,'dw-steel');
      o+=dimH(cx-w/2,cx+w/2,cy-h/2-170,cy-h/2,'φ'+s.wD);
      o+=dimV(cy+h/2,cy-h/2,cx+w/2+200,cx+w/2,'h'+s.wH);
      o+=TX(cx,cy+h/2+200,'円柱ウェイト ×'+s.wN,'dw-lbl');
      return SVG(1240,840,o);
    }
    function detClamp() {
      var s=S(), cx=600,cy=400,r=130,gap=300;
      var o='';
      [-gap,0,gap].forEach(function(dx){ o+=C(cx+dx,cy,r,'dw-steel')+C(cx+dx,cy,r*0.42,'dw-pipe'); });
      o+=L(cx-gap,cy,cx+gap,cy,'dw-steel');
      o+=TX(cx,cy+r+170,'φ'+s.aD+' 単管用','dw-lbl');
      o+=TX(cx,cy+r+300,'仮止め → 本締めで固定','dw-note');
      return SVG(1320,900,o);
    }
    function detCaster() {
      var s=S(), cx=560,wy=760,r=180, bw=180,bh=250;
      var o=R(cx-bw/2,wy-r-bh,bw,bh,'dw-steel');
      o+=C(cx,wy,r,'dw-steel')+C(cx,wy,r*0.3,'dw-pipe');
      o+=R(cx-70,wy-r-bh-90,140,90,'dw-pipe');
      o+=dimH(cx-r,cx+r,wy+r+170,wy+r,'φ'+s.cD);
      o+=dimV(wy-r,wy-r-bh,cx+bw/2+210,cx+bw/2,'h'+s.cBr);
      o+=TX(cx,wy+r+320,'自在キャスター','dw-lbl');
      return SVG(1320,1320,o);
    }
    function detRail() {
      var s=S(), x0=200,x1=1160,midY=380,amp=150,N=140,th=40;
      var top=[],bot=[],i;
      for (i=0;i<=N;i++){
        var x=x0+(x1-x0)*i/N, y=midY+amp*Math.sin(i/N*s.rWC*Math.PI*2);
        top.push(f(x)+','+f(y-th/2)); bot.push(f(x)+','+f(y+th/2));
      }
      var o=PG(top.join(' ')+' '+bot.reverse().join(' '),'dw-wood');
      o+=dimV(midY+amp,midY-amp,x0-170,x0,'h'+s.rWH);
      o+=TX(x0,midY+amp+250,'凸 '+s.rWC+'つ ／ 板厚 '+s.rTh,'dw-lbl','start');
      o+=TX(x0,midY+amp+380,'レール φ内'+s.rIn+' ／ φ外'+s.rOut,'dw-lbl','start');
      return SVG(1340,960,o);
    }
    function detPlate() {
      var s=S(), cx=580,cy=460,w=820,h=410;
      var o=R(cx-w/2,cy-h/2,w,h,'dw-wood');
      o+=dimH(cx-w/2,cx+w/2,cy-h/2-170,cy-h/2,''+s.dpL);
      o+=dimV(cy+h/2,cy-h/2,cx+w/2+200,cx+w/2,''+s.dpS);
      o+=TX(cx,cy+h/2+200,'構造用合板 厚'+s.dpT,'dw-lbl');
      return SVG(1460,920,o);
    }
    function detCollar() {
      var s=S(), cx=580,cy=560,rO=300,rI=Math.round(300*s.aD/s.coD);
      var o=L(cx-rO-150,cy,cx+rO+150,cy,'dw-ax')+L(cx,cy-rO-150,cx,cy+rO+150,'dw-ax');
      o+=C(cx,cy,rO,'dw-steel')+C(cx,cy,rI,'dw-pipe');
      o+=R(cx-26,cy-rO-70,52,80,'dw-steel');
      o+=dimH(cx-rO,cx+rO,cy-rO-200,cy-rO-90,'φ'+s.coD);
      o+=leader(cx+rI*0.7,cy-rI*0.7,cx+rO+110,cy-rO+50,'φ'+s.aD+' 内径');
      o+=TX(cx,cy+rO+210,'シャフトカラー 高さ'+s.coH,'dw-lbl');
      return SVG(1280,1280,o);
    }
    function detBoard() {
      var s=S(), cx=560,cy=470,w=620,h=465;
      var o=R(cx-w/2,cy-h/2,w,h,'dw-wood');
      o+=dimH(cx-w/2,cx+w/2,cy-h/2-170,cy-h/2,''+s.sbD);
      o+=dimV(cy+h/2,cy-h/2,cx+w/2+200,cx+w/2,''+s.sbW);
      o+=TX(cx,cy+h/2+190,'乗り板 厚'+s.sbT,'dw-lbl');
      return SVG(1320,1020,o);
    }
    function detailsSheet(step) {
      var items=[
        {st:1,t:'鋼管 断面 SECTION',fn:detPipe},
        {st:1,t:'床固定金具',fn:detBase},
        {st:1,t:'重り',fn:detWeight},
        {st:2,t:'三連クランプ',fn:detClamp},
        {st:4,t:'キャスター',fn:detCaster},
        {st:7,t:'波型レール',fn:detRail},
        {st:8,t:'L2 デッキ合板',fn:detPlate},
        {st:9,t:'シャフトカラー',fn:detCollar},
        {st:9,t:'乗り板',fn:detBoard}
      ];
      var cells='';
      for (var i=0;i<items.length;i++){
        if (step<items[i].st) continue;
        cells+='<div class="dwg-detail-cell"><div class="dc-title">'+items[i].t+'</div>'
          +'<div class="dc-step">STEP '+items[i].st+'</div>'+items[i].fn()+'</div>';
      }
      if (!cells) return '';
      return '<div class="dwg-sheet"><div class="dwg-sheet-title">PART DETAILS 部品詳細図</div>'
        +'<div class="dwg-sheet-sub">N.T.S.（寸法は SPEC 連動・単位 mm）</div>'
        +'<div class="dwg-details-grid">'+cells+'</div></div>';
    }

    function sheet(title,sub,svg) {
      return '<div class="dwg-sheet"><div class="dwg-sheet-title">'+title+'</div>'
        + '<div class="dwg-sheet-sub">'+sub+'</div>'+svg+'</div>';
    }
    function render(step) {
      var host=document.getElementById('drawing-view');
      if (!host) return;
      if (step<=0) {
        host.innerHTML='<div class="dwg-empty">図面はステップ1以降で表示されます。<br>左の一覧から組み立て段階を選んでください。</div>';
        return;
      }
      var sub='単位 mm ／ 寸法は SPEC 連動（3Dモデルと共通）／ 現在 STEP '+step+' まで';
      var h=sheet('ELEVATION 立面図', sub, elevation(step))
          + sheet('PLAN 平面図', sub, plan(step))
          + detailsSheet(step);
      host.innerHTML=h;
    }
    return { render: render };
  })();

  function setStep(n) {
    currentStep = Math.max(0, Math.min(totalSteps, n));
    // Show/hide step groups
    for (let i = 0; i < stepGroups.length; i++) {
      stepGroups[i].visible = (i < currentStep);
    }
    applyDimensions();
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
    // 図面モードのときは選択中ステップに合わせて図面を再描画
    if (viewMode === 'drawing') DWG.render(currentStep);
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
  const btnWood = document.getElementById('toggle-wood');
  function syncToggleUI() {
    btnDim.classList.toggle('active', dimensionsVisible);
    btnRot.classList.toggle('active', rotationEnabled);
    btnDeco.classList.toggle('active', decorationsVisible);
    btnWood.classList.toggle('active', woodVisible);
  }
  btnDim.onclick = function() {
    dimensionsVisible = !dimensionsVisible;
    applyDimensions();
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
  btnWood.onclick = function() {
    woodVisible = !woodVisible;
    applyWood();
    syncToggleUI();
  };
  syncToggleUI();

  // ===== View-mode switch (3Dモデル / 図面) =====
  const vm3dBtn  = document.getElementById('vm-3d');
  const vmDwgBtn = document.getElementById('vm-drawing');
  function applyViewMode() {
    const is3d = (viewMode === '3d');
    canvas.style.display = is3d ? '' : 'none';
    const dv = document.getElementById('drawing-view');
    const legend = document.getElementById('legend-panel');
    if (dv) dv.style.display = is3d ? 'none' : '';
    if (legend) legend.style.display = is3d ? '' : 'none';
    vm3dBtn.classList.toggle('active', is3d);
    vmDwgBtn.classList.toggle('active', !is3d);
    if (!is3d) DWG.render(currentStep);
  }
  vm3dBtn.onclick  = function() { viewMode = '3d';      applyViewMode(); };
  vmDwgBtn.onclick = function() { viewMode = 'drawing'; applyViewMode(); };

  // Initialize
  setStep(0);
  applyViewMode();

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
    applyCanvasLayout();
  });
});
