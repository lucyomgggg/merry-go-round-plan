// dimensions.tsx — 3Dモデル上の寸法ラベル。
// 寸法テキストはすべて SPEC から生成する（ハードコード禁止）。
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  SPEC,
  mm,
  LAYER1_Y,
  LAYER2_Y,
  LAYER3_Y,
  AXIS_BOTTOM_Y,
  AXIS_HEIGHT,
  POLE_LEN,
  POLE_RADIUS,
  HORSE_Y,
  WAVE_CENTER_Y,
  COLLAR_Y_ON_POLE,
  TALL_PILLAR_R,
  TALL_PILLAR_BOTTOM,
  TALL_PILLAR_TOP,
  TALL_PILLAR_HEIGHT,
  PIPE_HALF_GAP,
  waveAmplitude,
} from '../spec';

// テキストからピル付きスプライトを生成
function makeDimLabel(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 20;
  const font = `bold ${fontSize}px 'JetBrains Mono', ui-monospace, monospace`;
  ctx.font = font;
  const pad = 10;
  const tw = Math.ceil(ctx.measureText(text).width);
  canvas.width = tw + pad * 2;
  canvas.height = fontSize + pad * 2;
  // 背景ピル
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  const r = 4;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
  ctx.lineTo(canvas.width, canvas.height - r);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  // テキスト
  ctx.font = font;
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true }),
  );
  const s = 0.0016;
  sprite.scale.set(canvas.width * s, canvas.height * s, 1);
  return sprite;
}

// ステップ別の寸法グループ（0..9）を構築
function buildDimGroups(): THREE.Group[] {
  const groups: THREE.Group[] = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    g.visible = false;
    groups.push(g);
  }

  const dimLineMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    depthTest: false,
  });
  const dimDotGeo = new THREE.SphereGeometry(0.015, 6, 4);
  const dimDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });

  const makeStick = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
    const pts = [new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz)];
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), dimLineMat);
  };

  // パーツ近傍にラベルを置く: パーツ上に点・短い線・端にラベル
  const tagPart = (
    stepIdx: number,
    text: string,
    partX: number,
    partY: number,
    partZ: number,
    offX: number,
    offY: number,
    offZ: number,
  ) => {
    const g = groups[stepIdx];
    const dot = new THREE.Mesh(dimDotGeo, dimDotMat);
    dot.position.set(partX, partY, partZ);
    g.add(dot);
    const lx = partX + offX;
    const ly = partY + offY;
    const lz = partZ + offZ;
    g.add(makeStick(partX, partY, partZ, lx, ly, lz));
    const label = makeDimLabel(text);
    label.position.set(lx, ly, lz);
    g.add(label);
  };

  // 高さ寸法: 2点＋縦線＋中点ラベル
  const tagHeight = (
    stepIdx: number,
    text: string,
    x: number,
    yBot: number,
    yTop: number,
    z: number,
    offX: number,
    offZ: number,
  ) => {
    const g = groups[stepIdx];
    const dotB = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotB.position.set(x, yBot, z);
    g.add(dotB);
    const dotT = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotT.position.set(x, yTop, z);
    g.add(dotT);
    g.add(makeStick(x, yBot, z, x, yTop, z));
    g.add(makeStick(x - 0.03, yBot, z, x + 0.03, yBot, z));
    g.add(makeStick(x - 0.03, yTop, z, x + 0.03, yTop, z));
    const label = makeDimLabel(text);
    label.position.set(x + offX, (yBot + yTop) / 2, z + offZ);
    g.add(label);
    g.add(makeStick(x, (yBot + yTop) / 2, z, x + offX, (yBot + yTop) / 2, z + offZ));
  };

  // 幅寸法: 2点＋横線＋中点上方ラベル
  const tagWidth = (
    stepIdx: number,
    text: string,
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    labelOffY: number,
  ) => {
    const g = groups[stepIdx];
    const dotA = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotA.position.set(ax, ay, az);
    g.add(dotA);
    const dotB = new THREE.Mesh(dimDotGeo, dimDotMat);
    dotB.position.set(bx, by, bz);
    g.add(dotB);
    g.add(makeStick(ax, ay, az, bx, by, bz));
    const label = makeDimLabel(text);
    const my = (ay + by) / 2 + (labelOffY || 0.08);
    label.position.set((ax + bx) / 2, my, (az + bz) / 2);
    g.add(label);
  };

  // --- Step 1: 床固定金具＋中心支柱 ---
  tagPart(0, 'φ' + mm(SPEC.base.plywoodDiameter) + ' 床合板', 0.55, 0.009, 0, 0.18, 0.08, 0);
  tagPart(0, 'φ' + mm(SPEC.base.flangeDiameter) + ' フランジ', 0.1, 0.024, 0, 0.1, 0.06, 0.1);
  tagPart(
    0,
    'φ' + mm(SPEC.base.socketDiameter) + '×h' + mm(SPEC.base.socketHeight) + ' ソケット',
    0,
    0.078,
    0.05,
    0.1,
    0.06,
    0.08,
  );
  tagHeight(
    0,
    mm(SPEC.centerAxis.length) + 'mm φ' + mm(SPEC.centerAxis.diameter),
    0.06,
    AXIS_BOTTOM_Y,
    AXIS_BOTTOM_Y + AXIS_HEIGHT,
    0,
    0.12,
    0,
  );
  tagPart(
    0,
    'φ' + mm(SPEC.base.weightDiameter) + ' 重り×' + SPEC.base.weightCount,
    SPEC.base.weightRadius * Math.cos(Math.PI / 4),
    0.043,
    SPEC.base.weightRadius * Math.sin(Math.PI / 4),
    0.08,
    0.06,
    0.08,
  );

  // --- Step 2: L1 十字パイプ ---
  tagPart(1, 'h' + mm(SPEC.layer1Y) + ' L1層', 0, LAYER1_Y, -PIPE_HALF_GAP, 0, 0.08, -0.1);
  tagWidth(
    1,
    mm(SPEC.crossPipe.length) + 'mm パイプ×4',
    -SPEC.crossPipe.length / 2,
    LAYER1_Y,
    -PIPE_HALF_GAP,
    SPEC.crossPipe.length / 2,
    LAYER1_Y,
    -PIPE_HALF_GAP,
    0.08,
  );
  tagPart(1, 'クランプ仮止め×8', POLE_RADIUS, LAYER1_Y, 0, 0.08, 0.08, 0.08);

  // --- Step 3: 垂直パイプ8本 ---
  tagHeight(2, mm(SPEC.horsePole.length) + 'mm 馬ポール', POLE_RADIUS + 0.06, 0, POLE_LEN, 0, 0.12, 0);
  tagHeight(
    2,
    mm(TALL_PILLAR_HEIGHT) + 'mm 外周支柱',
    TALL_PILLAR_R + 0.06,
    TALL_PILLAR_BOTTOM,
    TALL_PILLAR_TOP,
    0,
    0.12,
    0,
  );
  tagWidth(2, 'r=' + mm(SPEC.horsePole.radius), 0, 0.35, 0, POLE_RADIUS, 0.35, 0, 0.06);
  tagWidth(2, 'r=' + mm(SPEC.edgePillar.radius), 0, 0.25, 0, TALL_PILLAR_R, 0.25, 0, 0.06);
  tagPart(2, 'φ' + mm(SPEC.crossPipe.diameter) + ' 全8本', -POLE_RADIUS, 1.0, 0, -0.08, 0.08, 0);

  // --- Step 4: キャスター ---
  tagPart(3, 'φ' + mm(SPEC.caster.diameter) + ' キャスター', POLE_RADIUS, 0.05, 0, 0.1, 0.06, 0.1);
  tagPart(3, 'φ' + mm(SPEC.caster.diameter) + ' キャスター', 0, 0.05, TALL_PILLAR_R, 0.1, 0.06, 0.1);
  tagPart(3, 'ブラケット h' + mm(SPEC.caster.bracketHeight), POLE_RADIUS, 0.115, 0, -0.1, 0.06, -0.1);

  // --- Step 5: クランプ本締め ---
  tagPart(4, '本締め', TALL_PILLAR_R, LAYER1_Y, 0, 0.1, 0.06, 0.1);
  tagPart(4, '緩め維持', POLE_RADIUS, LAYER1_Y, 0, 0.1, 0.06, 0.1);

  // --- Step 6: L3 上部十字パイプ ---
  tagPart(5, 'h' + mm(SPEC.layer3Y) + ' L3層', 0, LAYER3_Y, PIPE_HALF_GAP, 0, 0.08, 0.1);
  tagWidth(
    5,
    mm(SPEC.crossPipe.length) + 'mm 上部パイプ×2',
    -SPEC.crossPipe.length / 2,
    LAYER3_Y,
    PIPE_HALF_GAP,
    SPEC.crossPipe.length / 2,
    LAYER3_Y,
    PIPE_HALF_GAP,
    0.08,
  );
  tagPart(5, 'スリーブ（回転軸受）', PIPE_HALF_GAP, LAYER3_Y + 0.035, PIPE_HALF_GAP, 0.1, 0.06, 0.08);
  tagPart(5, '支柱クランプ×4', TALL_PILLAR_R, LAYER3_Y, 0, 0.1, 0.06, 0);

  // --- Step 7: 波型レール ---
  tagWidth(
    6,
    '内径 φ' + mm(SPEC.wavyRail.innerDiameter),
    0,
    WAVE_CENTER_Y,
    SPEC.wavyRail.innerDiameter / 2,
    0,
    WAVE_CENTER_Y,
    -SPEC.wavyRail.innerDiameter / 2,
    0.08,
  );
  tagWidth(
    6,
    '外径 φ' + mm(SPEC.wavyRail.outerDiameter),
    0,
    WAVE_CENTER_Y,
    SPEC.wavyRail.outerDiameter / 2,
    0,
    WAVE_CENTER_Y,
    -SPEC.wavyRail.outerDiameter / 2,
    0.1,
  );
  tagPart(
    6,
    '凸' + SPEC.wavyRail.waveCount + 'つ h' + mm(SPEC.wavyRail.waveHeight),
    POLE_RADIUS,
    WAVE_CENTER_Y + waveAmplitude,
    0,
    0.08,
    0.06,
    0.08,
  );
  tagPart(6, '基台ベニヤ', 0, 0.003, 1.0, 0.1, 0.06, 0.08);

  // --- Step 8: L2 デッキ合板 ---
  tagPart(
    7,
    mm(SPEC.deck.plateLong) + '×' + mm(SPEC.deck.plateShort) + '×' + mm(SPEC.deck.plateThick) + ' 合板×4',
    1.1,
    LAYER2_Y,
    0,
    0.08,
    0.08,
    0.08,
  );
  tagPart(7, 'h' + mm(SPEC.layer2Y) + ' L2層', 0, LAYER2_Y, 0.2, 0, 0.08, 0.08);
  tagPart(7, '菱形ベニヤ D' + mm(SPEC.deck.diamondD), -0.9, LAYER2_Y - 0.007, 0.9, -0.08, 0.06, 0.08);
  tagPart(
    7,
    '中心穴 ' + mm(SPEC.deck.centerHole) + '×' + mm(SPEC.deck.centerHole),
    0.15,
    LAYER2_Y,
    0.15,
    0.08,
    0.06,
    0.08,
  );

  // --- Step 9: 止め輪＋乗り板 ---
  tagPart(
    8,
    'φ' + mm(SPEC.seat.collarDiameter) + ' シャフトカラー',
    POLE_RADIUS,
    COLLAR_Y_ON_POLE,
    0,
    0.1,
    0.06,
    0.1,
  );
  tagPart(
    8,
    '乗り板 ' + mm(SPEC.seat.boardWidth) + '×' + mm(SPEC.seat.boardDepth) + '×' + mm(SPEC.seat.boardThick),
    POLE_RADIUS,
    SPEC.seat.seatY + 0.04,
    0,
    0.1,
    0.06,
    0.1,
  );
  tagPart(8, '短パイプ ' + mm(SPEC.seat.shortPipeLength) + 'mm', POLE_RADIUS, SPEC.seat.seatY, 0, -0.1, -0.06, -0.1);
  tagHeight(8, 'h' + mm(SPEC.seat.seatY) + ' 座面', -POLE_RADIUS - 0.06, 0, SPEC.seat.seatY, 0, -0.12, 0);

  // --- Step 10: 馬・スタッフ ---
  tagPart(9, '馬 ≈' + mm(SPEC.horse.approxLength) + 'mm', POLE_RADIUS, HORSE_Y, 0, 0.08, 0.15, 0.08);
  tagPart(9, '上下動 ±' + mm(SPEC.wavyRail.waveHeight / 2) + 'mm', -POLE_RADIUS, HORSE_Y, 0, -0.08, 0.15, -0.08);
  tagPart(9, 'スタッフ×' + SPEC.edgePillar.count, TALL_PILLAR_R, 0.8, 0, 0.08, 0.1, 0.08);

  return groups;
}

// 寸法ラベル群。dimensions トグルが ON のときだけ Model 側でマウントされる。
export function Dimensions({ step }: { step: number }) {
  const groups = useMemo(() => buildDimGroups(), []);
  return (
    <>
      {groups.map((g, i) => (
        <primitive key={i} object={g} visible={i < step} />
      ))}
    </>
  );
}
