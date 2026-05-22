// Model.tsx — メリーゴーランド本体。ステップ表示・回転・馬の上下動を統括。
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useStore } from '../store';
import { waveAmplitude, waveCount } from '../spec';
import {
  Step1Base,
  Step2L1Frame,
  EdgePillars,
  EdgePillarCasters,
  Step6L3Frame,
  Step7Rail,
  Step8Deck,
  HorsePole,
  Staff,
} from './steps';
import { Dimensions } from './dimensions';

// 回転速度 0.5 rpm
const OMEGA = (0.5 * Math.PI * 2) / 60;

export function Model() {
  const step = useStore((s) => s.step);
  const rotation = useStore((s) => s.rotation);
  const decorations = useStore((s) => s.decorations);
  const dimensions = useStore((s) => s.dimensions);
  const wood = useStore((s) => s.wood);

  const rotatingRef = useRef<Group>(null);
  const pole0 = useRef<Group>(null);
  const pole1 = useRef<Group>(null);
  const pole2 = useRef<Group>(null);
  const pole3 = useRef<Group>(null);
  const poleRefs = [pole0, pole1, pole2, pole3];
  const angleRef = useRef(0);

  // 中心支柱（STEP1）と波型レール（STEP7）は静止。それ以外は中心軸まわりに回転し、
  // 馬ポールのキャスターが固定された波型レール上を転がる。完成時のみ馬が上下動する。
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (rotation) angleRef.current += OMEGA * dt;
    const angle = angleRef.current;
    if (rotatingRef.current) rotatingRef.current.rotation.y = angle;
    for (let i = 0; i < 4; i++) {
      const baseAngle = (i / 4) * Math.PI * 2;
      const bob =
        step === 10 ? waveAmplitude * Math.sin(waveCount * (baseAngle + angle)) : 0;
      const ref = poleRefs[i].current;
      if (ref) ref.position.y = bob;
    }
  });

  return (
    <>
      {/* 静止グループ */}
      <group>
        {step >= 1 && <Step1Base wood={wood} />}
        {step >= 7 && <Step7Rail wood={wood} />}
        {dimensions && <Dimensions step={step} />}
      </group>
      {/* 回転グループ */}
      <group ref={rotatingRef}>
        {step >= 2 && <Step2L1Frame step={step} />}
        {step >= 3 && <EdgePillars />}
        {step >= 4 && <EdgePillarCasters />}
        {step >= 6 && <Step6L3Frame />}
        {step >= 8 && <Step8Deck wood={wood} />}
        {poleRefs.map((ref, i) => (
          <group key={i} ref={ref}>
            <HorsePole index={i} step={step} wood={wood} decorations={decorations} />
          </group>
        ))}
        {step >= 10 && decorations && <Staff />}
      </group>
    </>
  );
}
