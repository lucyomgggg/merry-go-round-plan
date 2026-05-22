// SceneCanvas.tsx — 3Dビュー。Canvas・照明・地面・カメラ操作を構成する。
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Model } from './Model';

export function SceneCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMappingExposure: 1.05 }}
      camera={{ fov: 45, near: 0.1, far: 100, position: [7.23, 5.25, 7.23] }}
    >
      <color attach="background" args={['#c8ced6']} />
      <fog attach="fog" args={['#c8ced6', 22, 55]} />

      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#b1d6ff', '#303040', 0.38]} />
      <directionalLight
        castShadow
        color="#ffe8c8"
        intensity={1.05}
        position={[6, 12, 5]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-bias={-0.0005}
      />
      <directionalLight color="#6b9eff" intensity={0.32} position={[-5, 4, -5]} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[11, 64]} />
        <meshStandardMaterial color="#d8dce0" roughness={0.95} />
      </mesh>

      <Model />

      <OrbitControls
        target={[0, 1.2, 0]}
        enablePan={false}
        minDistance={3}
        maxDistance={25}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 + 0.05}
      />
    </Canvas>
  );
}
