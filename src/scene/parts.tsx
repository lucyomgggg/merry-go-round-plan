// parts.tsx — 3Dモデルの再利用パーツ（クランプ・波型レール・馬・スタッフ）。
import { useMemo } from 'react';
import * as THREE from 'three';
import { M, type MaterialProps } from '../materials';
import { SPEC, WAVE_CENTER_Y, waveAmplitude, waveCount } from '../spec';

type Axis = 'x' | 'y' | 'z';
type Vec3 = [number, number, number];

const AXES: Axis[] = ['x', 'y', 'z'];
const thirdAxis = (a: Axis, b: Axis): Axis => AXES.find((x) => x !== a && x !== b)!;

// 値を指定軸成分に持つ位置ベクトル
const onAxis = (axis: Axis, v: number): Vec3 => [
  axis === 'x' ? v : 0,
  axis === 'y' ? v : 0,
  axis === 'z' ? v : 0,
];
// シリンダ（既定 Y 軸）を指定軸へ向ける回転
const cylRot = (axis: Axis): Vec3 => {
  if (axis === 'x') return [0, 0, Math.PI / 2];
  if (axis === 'z') return [Math.PI / 2, 0, 0];
  return [0, 0, 0];
};
// トーラス（既定 Z 軸）を指定軸へ向ける回転
const torusRot = (axis: Axis): Vec3 => {
  if (axis === 'x') return [0, Math.PI / 2, 0];
  if (axis === 'y') return [Math.PI / 2, 0, 0];
  return [0, 0, 0];
};

const RING_R = 0.04;
const TUBE_R = 0.012;

// ===== 直交クランプ =====
export function ScaffoldClamp({
  axis1,
  axis2,
  sep = 0,
  material,
}: {
  axis1: Axis;
  axis2: Axis;
  sep?: number;
  material: MaterialProps;
}) {
  const axis3 = thirdAxis(axis1, axis2);
  return (
    <group>
      <mesh castShadow rotation={torusRot(axis1)} position={onAxis(axis3, -sep / 2)}>
        <torusGeometry args={[RING_R, TUBE_R, 10, 18]} />
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh castShadow rotation={torusRot(axis2)} position={onAxis(axis3, sep / 2)}>
        <torusGeometry args={[RING_R, TUBE_R, 10, 18]} />
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.026, 0.026, 0.026]} />
        <meshStandardMaterial {...material} />
      </mesh>
      {[0, 1].map((s) => {
        const ringOffset = s === 0 ? -sep / 2 : sep / 2;
        const sign = s === 0 ? -1 : 1;
        return (
          <group key={s}>
            <mesh
              castShadow
              rotation={cylRot(axis3)}
              position={onAxis(axis3, ringOffset + sign * (RING_R + 0.022))}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.06, 8]} />
              <meshStandardMaterial {...M.clampBolt} />
            </mesh>
            <mesh
              castShadow
              rotation={cylRot(axis3)}
              position={onAxis(axis3, ringOffset + sign * (RING_R + 0.055))}
            >
              <cylinderGeometry args={[0.011, 0.011, 0.012, 6]} />
              <meshStandardMaterial {...M.clampBolt} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ===== 三連クランプ =====
export function TripleClamp({
  vertAxis,
  horizAxis,
  pipeGap,
  material,
}: {
  vertAxis: Axis;
  horizAxis: Axis;
  pipeGap: number;
  material: MaterialProps;
}) {
  const perp = thirdAxis(vertAxis, horizAxis);
  const connArgs: Vec3 =
    perp === 'x'
      ? [pipeGap, 0.026, 0.026]
      : perp === 'y'
        ? [0.026, pipeGap, 0.026]
        : [0.026, 0.026, pipeGap];
  return (
    <group>
      <mesh castShadow rotation={torusRot(vertAxis)}>
        <torusGeometry args={[RING_R, TUBE_R, 10, 18]} />
        <meshStandardMaterial {...material} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh castShadow rotation={torusRot(horizAxis)} position={onAxis(perp, s * pipeGap)}>
            <torusGeometry args={[RING_R, TUBE_R, 10, 18]} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh castShadow position={onAxis(perp, (s * pipeGap) / 2)}>
            <boxGeometry args={connArgs} />
            <meshStandardMaterial {...material} />
          </mesh>
          <mesh
            castShadow
            rotation={cylRot(perp)}
            position={onAxis(perp, s * (pipeGap + RING_R + 0.022))}
          >
            <cylinderGeometry args={[0.005, 0.005, 0.06, 8]} />
            <meshStandardMaterial {...M.clampBolt} />
          </mesh>
          <mesh
            castShadow
            rotation={cylRot(perp)}
            position={onAxis(perp, s * (pipeGap + RING_R + 0.055))}
          >
            <cylinderGeometry args={[0.011, 0.011, 0.012, 6]} />
            <meshStandardMaterial {...M.clampBolt} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ===== 波型レール =====
export function WavyRail({ visible = true }: { visible?: boolean }) {
  const geometry = useMemo(() => {
    const segments = 256;
    const innerR = SPEC.wavyRail.innerDiameter / 2;
    const outerR = SPEC.wavyRail.outerDiameter / 2;
    const thickness = SPEC.wavyRail.thickness;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const y = WAVE_CENTER_Y + waveAmplitude * Math.sin(waveCount * t);
      positions.push(outerR * Math.cos(t), y, outerR * Math.sin(t));
      positions.push(innerR * Math.cos(t), y, innerR * Math.sin(t));
    }
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
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
      const a = base + i * 2;
      const b = base + i * 2 + 1;
      const c = base + (i + 1) * 2;
      const d = base + (i + 1) * 2 + 1;
      indices.push(a, b, c, c, b, d);
    }
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const c = (i + 1) * 2;
      const a2 = base + i * 2;
      const c2 = base + (i + 1) * 2;
      indices.push(a, a2, c, c, a2, c2);
      const b = i * 2 + 1;
      const d = (i + 1) * 2 + 1;
      const b2 = base + i * 2 + 1;
      const d2 = base + (i + 1) * 2 + 1;
      indices.push(b, d, b2, d, d2, b2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
  return (
    <mesh geometry={geometry} visible={visible} castShadow receiveShadow>
      <meshStandardMaterial {...M.railWood} />
    </mesh>
  );
}

// ===== 馬 =====
function buildHorse(): THREE.Group {
  const horse = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ ...M.horseBody });
  const maneMat = new THREE.MeshStandardMaterial({ ...M.horseMane });
  const saddleMat = new THREE.MeshStandardMaterial({ ...M.horseSaddle });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
  const hoofMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), bodyMat);
  body.scale.set(1.9, 1.0, 1.0);
  body.castShadow = true;
  horse.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), bodyMat);
  chest.position.set(0.3, 0.04, 0);
  chest.castShadow = true;
  horse.add(chest);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.34, 12), bodyMat);
  neck.position.set(0.36, 0.2, 0);
  neck.rotation.z = -Math.PI / 5;
  neck.castShadow = true;
  horse.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.14), bodyMat);
  head.position.set(0.52, 0.34, 0);
  head.castShadow = true;
  horse.add(head);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), bodyMat);
  snout.position.set(0.64, 0.3, 0);
  snout.castShadow = true;
  horse.add(snout);
  for (let i = 0; i < 2; i++) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 6), bodyMat);
    ear.position.set(0.48, 0.44, i === 0 ? -0.05 : 0.05);
    horse.add(ear);
  }
  for (let i = 0; i < 2; i++) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeMat);
    eye.position.set(0.56, 0.36, i === 0 ? -0.07 : 0.07);
    horse.add(eye);
  }
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.2 - i * 0.02, 0.12), maneMat);
    m.position.set(0.36 - i * 0.04, 0.24 - i * 0.018, 0);
    m.castShadow = true;
    horse.add(m);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), maneMat);
  tail.position.set(-0.34, 0, 0);
  tail.rotation.z = Math.PI * 0.55;
  tail.castShadow = true;
  horse.add(tail);
  const legGeo = new THREE.CylinderGeometry(0.028, 0.022, 0.44, 8);
  const legPs: Vec3[] = [
    [0.22, -0.3, -0.1],
    [0.22, -0.3, 0.1],
    [-0.22, -0.3, -0.1],
    [-0.22, -0.3, 0.1],
  ];
  for (let i = 0; i < legPs.length; i++) {
    const leg = new THREE.Mesh(legGeo, bodyMat);
    leg.position.set(legPs[i][0], legPs[i][1], legPs[i][2]);
    leg.castShadow = true;
    horse.add(leg);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.04, 8), hoofMat);
    hoof.position.set(legPs[i][0], -0.52, legPs[i][2]);
    horse.add(hoof);
  }
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.26), saddleMat);
  saddle.position.set(0, 0.19, 0);
  saddle.castShadow = true;
  horse.add(saddle);
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.06, 8), saddleMat);
  horn.position.set(0.1, 0.24, 0);
  horse.add(horn);
  return horse;
}

export function Horse() {
  const obj = useMemo(() => buildHorse(), []);
  return <primitive object={obj} />;
}

// ===== スタッフ =====
function buildPerson(): THREE.Group {
  const person = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ ...M.skin });
  const shirtMat = new THREE.MeshStandardMaterial({ ...M.shirt });
  const pantsMat = new THREE.MeshStandardMaterial({ ...M.pants });
  const hairMat = new THREE.MeshStandardMaterial({ ...M.hair });

  // 2点をつなぐ円柱
  const limb = (
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    r1: number,
    r2: number,
    mat: THREE.Material,
  ): THREE.Mesh => {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 10), mat);
    mesh.position.copy(p1).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = true;
    return mesh;
  };

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), skinMat);
  head.position.set(0, 1.58, 0.02);
  head.castShadow = true;
  person.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat,
  );
  hair.position.set(0, 1.59, 0.02);
  hair.castShadow = true;
  person.add(hair);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.58, 14), shirtMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  person.add(torso);
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const shoulder = new THREE.Vector3(s * 0.17, 1.33, 0.06);
    const hand = new THREE.Vector3(s * 0.03, 1.2 - i * 0.18, 0.41);
    const elbow = new THREE.Vector3(
      (shoulder.x + hand.x) / 2,
      (shoulder.y + hand.y) / 2 - 0.1,
      (shoulder.z + hand.z) / 2 + 0.02,
    );
    person.add(limb(shoulder, elbow, 0.042, 0.05, shirtMat));
    person.add(limb(elbow, hand, 0.034, 0.042, skinMat));
    const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), shirtMat);
    shoulderJoint.position.copy(shoulder);
    shoulderJoint.castShadow = true;
    person.add(shoulderJoint);
    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), skinMat);
    elbowJoint.position.copy(elbow);
    person.add(elbowJoint);
    const handMesh = new THREE.Mesh(new THREE.SphereGeometry(0.046, 10, 8), skinMat);
    handMesh.position.copy(hand);
    handMesh.castShadow = true;
    person.add(handMesh);
  }
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.82, 10), pantsMat);
    leg.position.set(s * 0.07, 0.41, 0);
    leg.castShadow = true;
    person.add(leg);
  }
  return person;
}

export function Person() {
  const obj = useMemo(() => buildPerson(), []);
  return <primitive object={obj} />;
}
