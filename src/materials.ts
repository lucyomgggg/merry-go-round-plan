// materials.ts — three.js マテリアル定義。
// プロパティオブジェクトとして公開し、<meshStandardMaterial {...M.pipe} /> の形で使う。
// 色や質感を変えたいときはここ1か所を編集する。
import { DoubleSide } from 'three';

export const M = {
  pipe: { color: 0xc8ccd0, metalness: 0.82, roughness: 0.28 }, // 鉄パイプ
  plywood: { color: 0xd2a06a, roughness: 0.86 }, // 合板
  horseBody: { color: 0xf2efe6, roughness: 0.55 }, // 馬の body
  horseMane: { color: 0xb74040, roughness: 0.62 }, // たてがみ・尾
  horseSaddle: { color: 0x6b3d1e, roughness: 0.7 }, // 鞍
  caster: { color: 0x2a2a2a, roughness: 0.65 }, // キャスター・金具
  railWood: { color: 0x7a5a3a, roughness: 0.92 }, // 波型レール
  clamp: { color: 0xc8a02e, metalness: 0.7, roughness: 0.32 }, // クランプ（本締め）
  clampLoose: {
    color: 0x807548,
    metalness: 0.4,
    roughness: 0.55,
    transparent: true,
    opacity: 0.7,
  }, // クランプ（仮止め・半透明）
  clampBolt: { color: 0xa07b1e, metalness: 0.8, roughness: 0.4 }, // ボルト・ナット
  collar: { color: 0x888888, metalness: 0.85, roughness: 0.22 }, // シャフトカラー
  skin: { color: 0xf4c8a8, roughness: 0.7 }, // スタッフ 肌
  shirt: { color: 0x3a6db5, roughness: 0.75 }, // スタッフ シャツ
  pants: { color: 0x2a2a3a, roughness: 0.8 }, // スタッフ ズボン
  hair: { color: 0x2a1a0a, roughness: 0.85 }, // スタッフ 髪
  seatBoard: { color: 0xa07a4a, roughness: 0.85 }, // 乗り板
  veneer: { color: 0xe6c890, roughness: 0.88, side: DoubleSide }, // 菱形ベニヤ
} as const;

export type MaterialProps = (typeof M)[keyof typeof M];
