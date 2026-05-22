// steps.tsx — 各組み立てステップ（STEP1〜STEP10）の3Dジオメトリ。
import { useMemo } from 'react';
import * as THREE from 'three';
import { M } from '../materials';
import {
  SPEC,
  LAYER1_Y,
  LAYER2_Y,
  LAYER3_Y,
  AXIS_BOTTOM_Y,
  AXIS_HEIGHT,
  POLE_LEN,
  POLE_RADIUS,
  POLE_DIAMETER,
  SCAFFOLD_PIPE_R,
  PIPE_HALF_GAP,
  HORSE_Y,
  COLLAR_Y_ON_POLE,
  TALL_PILLAR_R,
  TALL_PILLAR_BOTTOM,
  TALL_PILLAR_HEIGHT,
} from '../spec';
import { ScaffoldClamp, TripleClamp, WavyRail, Horse, Person } from './parts';

const HALF_GAP = PIPE_HALF_GAP;
const PIPE_LEN = SPEC.crossPipe.length;
const IDX = [0, 1, 2, 3];

// ===== STEP 1: 床固定金具＋中心支柱 =====
export function Step1Base({ wood }: { wood: boolean }) {
  const b = SPEC.base;
  return (
    <group>
      <mesh visible={wood} castShadow receiveShadow position={[0, b.plywoodThickness / 2, 0]}>
        <cylinderGeometry args={[b.plywoodDiameter / 2, b.plywoodDiameter / 2, b.plywoodThickness, 32]} />
        <meshStandardMaterial {...M.plywood} />
      </mesh>
      <mesh castShadow position={[0, b.plywoodThickness + b.flangeThickness / 2, 0]}>
        <cylinderGeometry args={[b.flangeDiameter / 2, b.flangeDiameter / 2, b.flangeThickness, 18]} />
        <meshStandardMaterial {...M.caster} />
      </mesh>
      <mesh castShadow position={[0, 0.078, 0]}>
        <cylinderGeometry args={[b.socketDiameter / 2, b.socketDiameter / 2, b.socketHeight, 16]} />
        <meshStandardMaterial {...M.caster} />
      </mesh>
      <mesh position={[0.058, 0.078, 0]}>
        <boxGeometry args={[0.018, 0.02, 0.018]} />
        <meshStandardMaterial {...M.clampBolt} />
      </mesh>
      {IDX.map((i) => {
        const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[b.weightRadius * Math.cos(a), 0.043, b.weightRadius * Math.sin(a)]}
          >
            <cylinderGeometry args={[b.weightDiameter / 2, b.weightDiameter / 2, b.weightHeight, 24]} />
            <meshStandardMaterial {...M.caster} />
          </mesh>
        );
      })}
      <mesh castShadow position={[0, AXIS_BOTTOM_Y + AXIS_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, AXIS_HEIGHT, 16]} />
        <meshStandardMaterial {...M.pipe} />
      </mesh>
    </group>
  );
}

// ===== STEP 2: L1 十字パイプ（＃）＋クランプ =====
export function Step2L1Frame({ step }: { step: number }) {
  // STEP5 で馬ポール以外のクランプを本締め（緩め → 本締めの材質切替）
  const otherMat = step >= 5 ? M.clamp : M.clampLoose;
  return (
    <group>
      {/* X方向パイプ（z = ±HALF_GAP） */}
      {[-HALF_GAP, HALF_GAP].map((z) => (
        <mesh key={`px${z}`} castShadow rotation={[0, 0, Math.PI / 2]} position={[0, LAYER1_Y, z]}>
          <cylinderGeometry args={[SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, PIPE_LEN, 12]} />
          <meshStandardMaterial {...M.pipe} />
        </mesh>
      ))}
      {/* Z方向パイプ（x = ±HALF_GAP・わずかに高い） */}
      {[-HALF_GAP, HALF_GAP].map((x) => (
        <mesh key={`pz${x}`} castShadow rotation={[Math.PI / 2, 0, 0]} position={[x, LAYER1_Y + 0.07, 0]}>
          <cylinderGeometry args={[SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, PIPE_LEN, 12]} />
          <meshStandardMaterial {...M.pipe} />
        </mesh>
      ))}
      {/* 馬ポール位置の三連クランプ（常に緩め） */}
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        const isX = i % 2 === 0;
        const yOff = isX ? LAYER1_Y : LAYER1_Y + 0.07;
        return (
          <group key={`hc${i}`} position={[POLE_RADIUS * Math.cos(a), yOff, POLE_RADIUS * Math.sin(a)]}>
            <TripleClamp vertAxis="y" horizAxis={isX ? 'x' : 'z'} pipeGap={HALF_GAP} material={M.clampLoose} />
          </group>
        );
      })}
      {/* 外周支柱位置の三連クランプ */}
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        const isX = i % 2 === 0;
        const yOff = isX ? LAYER1_Y : LAYER1_Y + 0.07;
        return (
          <group key={`ec${i}`} position={[TALL_PILLAR_R * Math.cos(a), yOff, TALL_PILLAR_R * Math.sin(a)]}>
            <TripleClamp vertAxis="y" horizAxis={isX ? 'x' : 'z'} pipeGap={HALF_GAP} material={otherMat} />
          </group>
        );
      })}
      {/* 中心の三連クランプ */}
      <group position={[0, LAYER1_Y, 0]}>
        <TripleClamp vertAxis="y" horizAxis="x" pipeGap={HALF_GAP} material={otherMat} />
      </group>
      <group position={[0, LAYER1_Y + 0.07, 0]}>
        <TripleClamp vertAxis="y" horizAxis="z" pipeGap={HALF_GAP} material={otherMat} />
      </group>
      {/* 十字パイプ交差部の直交クランプ ×4 */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`cc${sx}${sz}`} position={[sx * HALF_GAP, LAYER1_Y + 0.035, sz * HALF_GAP]}>
            <ScaffoldClamp axis1="x" axis2="z" sep={0.07} material={otherMat} />
          </group>
        )),
      )}
    </group>
  );
}

// ===== STEP 3: 外周支柱 4 本（馬ポールは HorsePole 側で生成）=====
export function EdgePillars() {
  return (
    <group>
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            position={[
              TALL_PILLAR_R * Math.cos(a),
              TALL_PILLAR_BOTTOM + TALL_PILLAR_HEIGHT / 2,
              TALL_PILLAR_R * Math.sin(a),
            ]}
          >
            <cylinderGeometry args={[SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, TALL_PILLAR_HEIGHT, 12]} />
            <meshStandardMaterial {...M.pipe} />
          </mesh>
        );
      })}
    </group>
  );
}

// ===== STEP 4: 外周支柱のキャスター（馬ポールのキャスターは HorsePole 側）=====
export function EdgePillarCasters() {
  return (
    <group>
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group key={i} position={[TALL_PILLAR_R * Math.cos(a), 0, TALL_PILLAR_R * Math.sin(a)]}>
            <mesh castShadow position={[0, 0.05, 0]} rotation={[0, -a, -Math.PI / 2]}>
              <cylinderGeometry args={[SPEC.caster.diameter / 2, SPEC.caster.diameter / 2, 0.04, 14]} />
              <meshStandardMaterial {...M.caster} />
            </mesh>
            <mesh position={[0, 0.115, 0]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.06, 0.05, 0.07]} />
              <meshStandardMaterial {...M.caster} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ===== STEP 6: L3 上部十字パイプ＋中心軸スリーブ =====
export function Step6L3Frame() {
  return (
    <group>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[0, LAYER3_Y, HALF_GAP]}>
        <cylinderGeometry args={[SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, PIPE_LEN, 12]} />
        <meshStandardMaterial {...M.pipe} />
      </mesh>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]} position={[HALF_GAP, LAYER3_Y + 0.07, 0]}>
        <cylinderGeometry args={[SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, PIPE_LEN, 12]} />
        <meshStandardMaterial {...M.pipe} />
      </mesh>
      {/* 交差部クランプ */}
      <group position={[HALF_GAP, LAYER3_Y + 0.035, HALF_GAP]}>
        <ScaffoldClamp axis1="x" axis2="z" sep={0.07} material={M.clamp} />
      </group>
      {/* 外周支柱クランプ ×4 */}
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        const isX = i % 2 === 0;
        const pos: [number, number, number] = isX
          ? [TALL_PILLAR_R * Math.cos(a), LAYER3_Y, HALF_GAP / 2]
          : [HALF_GAP / 2, LAYER3_Y + 0.07, TALL_PILLAR_R * Math.sin(a)];
        return (
          <group key={`ec${i}`} position={pos}>
            <ScaffoldClamp axis1="y" axis2={isX ? 'x' : 'z'} sep={HALF_GAP} material={M.clamp} />
          </group>
        );
      })}
      {/* 中心軸スリーブ（緩め＝回転軸受） */}
      <group position={[0, LAYER3_Y, HALF_GAP / 2]}>
        <ScaffoldClamp axis1="y" axis2="x" sep={HALF_GAP} material={M.clampLoose} />
      </group>
      <group position={[HALF_GAP / 2, LAYER3_Y + 0.07, 0]}>
        <ScaffoldClamp axis1="y" axis2="z" sep={HALF_GAP} material={M.clampLoose} />
      </group>
      {/* 馬ポールクランプ ×4 */}
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        const isX = i % 2 === 0;
        const pos: [number, number, number] = [
          isX ? POLE_RADIUS * Math.cos(a) : HALF_GAP / 2,
          isX ? LAYER3_Y : LAYER3_Y + 0.07,
          isX ? HALF_GAP / 2 : POLE_RADIUS * Math.sin(a),
        ];
        return (
          <group key={`hc${i}`} position={pos}>
            <ScaffoldClamp axis1="y" axis2={isX ? 'x' : 'z'} sep={HALF_GAP} material={M.clamp} />
          </group>
        );
      })}
    </group>
  );
}

// ===== STEP 7: 波型レール＋基台ベニヤ =====
export function Step7Rail({ wood }: { wood: boolean }) {
  return (
    <group>
      <mesh visible={wood} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[0.8, 1.2, 48]} />
        <meshStandardMaterial {...M.plywood} />
      </mesh>
      <WavyRail visible={wood} />
    </group>
  );
}

// ===== STEP 8: L2 デッキ合板（4枚）＋菱形ベニヤ =====
export function Step8Deck({ wood }: { wood: boolean }) {
  const veneerGeo = useMemo(() => {
    const D = SPEC.deck.diamondD;
    const shape = new THREE.Shape();
    shape.moveTo(D, 0);
    shape.lineTo(0, D);
    shape.lineTo(-D, 0);
    shape.lineTo(0, -D);
    shape.closePath();
    const H = SPEC.deck.centerHole / 2;
    const hole = new THREE.Path();
    hole.moveTo(H, H);
    hole.lineTo(H, -H);
    hole.lineTo(-H, -H);
    hole.lineTo(-H, H);
    hole.closePath();
    shape.holes.push(hole);
    return new THREE.ShapeGeometry(shape);
  }, []);

  const plateRadialCenter = SPEC.deck.centerHole / 2 + SPEC.deck.plateLong / 2;
  return (
    <group>
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            visible={wood}
            castShadow
            receiveShadow
            rotation={[0, -a, 0]}
            position={[plateRadialCenter * Math.cos(a), LAYER2_Y, plateRadialCenter * Math.sin(a)]}
          >
            <boxGeometry args={[SPEC.deck.plateLong, SPEC.deck.plateThick, SPEC.deck.plateShort]} />
            <meshStandardMaterial {...M.plywood} />
          </mesh>
        );
      })}
      <mesh
        geometry={veneerGeo}
        visible={wood}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, LAYER2_Y - 0.007, 0]}
      >
        <meshStandardMaterial {...M.veneer} />
      </mesh>
    </group>
  );
}

// ===== 馬ポール 1 本ぶんの組立（ポール／キャスター／止め輪・乗り板／馬）=====
// このコンポーネントは Model 側で波型レールに合わせて上下動するグループに包まれる。
export function HorsePole({
  index,
  step,
  wood,
  decorations,
}: {
  index: number;
  step: number;
  wood: boolean;
  decorations: boolean;
}) {
  const a = (index / 4) * Math.PI * 2;
  const px = POLE_RADIUS * Math.cos(a);
  const pz = POLE_RADIUS * Math.sin(a);
  const rotY = Math.PI / 2 - a;
  const seatY = SPEC.seat.seatY;
  return (
    <group>
      {/* STEP3: 馬ポール本体 */}
      {step >= 3 && (
        <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
          <mesh castShadow position={[0, 0.14 + POLE_LEN / 2, 0]}>
            <cylinderGeometry args={[POLE_DIAMETER / 2, POLE_DIAMETER / 2, POLE_LEN, 12]} />
            <meshStandardMaterial {...M.pipe} />
          </mesh>
        </group>
      )}
      {/* STEP4: キャスター */}
      {step >= 4 && (
        <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
          <mesh castShadow position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[SPEC.caster.diameter / 2, SPEC.caster.diameter / 2, 0.04, 14]} />
            <meshStandardMaterial {...M.caster} />
          </mesh>
          <mesh position={[0, 0.115, 0]}>
            <boxGeometry args={[0.06, 0.05, 0.07]} />
            <meshStandardMaterial {...M.caster} />
          </mesh>
        </group>
      )}
      {/* STEP9: 止め輪（シャフトカラー）＋乗り板 */}
      {step >= 9 && (
        <group>
          <mesh castShadow position={[px, COLLAR_Y_ON_POLE, pz]}>
            <cylinderGeometry
              args={[SPEC.seat.collarDiameter / 2, SPEC.seat.collarDiameter / 2, SPEC.seat.collarHeight, 16, 1, true]}
            />
            <meshStandardMaterial {...M.collar} />
          </mesh>
          {[0.02, -0.02].map((dy) => (
            <mesh key={dy} rotation={[Math.PI / 2, 0, 0]} position={[px, COLLAR_Y_ON_POLE + dy, pz]}>
              <ringGeometry args={[POLE_DIAMETER / 2 + 0.001, SPEC.seat.collarDiameter / 2, 16]} />
              <meshStandardMaterial {...M.collar} />
            </mesh>
          ))}
          <mesh position={[px + 0.044 * Math.cos(a), COLLAR_Y_ON_POLE, pz + 0.044 * Math.sin(a)]}>
            <boxGeometry args={[0.012, 0.015, 0.012]} />
            <meshStandardMaterial {...M.collar} />
          </mesh>
          <group position={[px, seatY, pz]} rotation={[0, rotY, 0]}>
            <ScaffoldClamp axis1="y" axis2="x" sep={PIPE_HALF_GAP} material={M.clamp} />
          </group>
          <mesh castShadow position={[px, seatY, pz]} rotation={[0, -a, Math.PI / 2]}>
            <cylinderGeometry args={[SCAFFOLD_PIPE_R, SCAFFOLD_PIPE_R, SPEC.seat.shortPipeLength, 10]} />
            <meshStandardMaterial {...M.pipe} />
          </mesh>
          <mesh
            visible={wood}
            castShadow
            receiveShadow
            position={[px, seatY + 0.04, pz]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[SPEC.seat.boardWidth, SPEC.seat.boardThick, SPEC.seat.boardDepth]} />
            <meshStandardMaterial {...M.seatBoard} />
          </mesh>
        </group>
      )}
      {/* STEP10: 馬 */}
      {step >= 10 && decorations && (
        <group position={[px, HORSE_Y, pz]} rotation={[0, rotY, 0]}>
          <Horse />
        </group>
      )}
    </group>
  );
}

// ===== STEP 10: 外周支柱を押すスタッフ 4 名 =====
export function Staff() {
  return (
    <group>
      {IDX.map((i) => {
        const a = (i / 4) * Math.PI * 2;
        const px = TALL_PILLAR_R * Math.cos(a);
        const pz = TALL_PILLAR_R * Math.sin(a);
        const tx = -Math.sin(a);
        const tz = Math.cos(a);
        return (
          <group
            key={i}
            position={[px - tx * 0.46, 0, pz - tz * 0.46]}
            rotation={[0, Math.atan2(tx, tz), 0]}
          >
            <Person />
          </group>
        );
      })}
    </group>
  );
}
