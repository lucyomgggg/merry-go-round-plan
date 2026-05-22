// ============================================================
// spec.ts — 寸法の単一定義元
// 3Dモデル・寸法ラベル・図面はすべてこの SPEC を参照する。
// ここを編集すれば3Dモデルと図面の両方が同時に更新され、ズレが生じない。
// 値はすべてメートル単位。ラベル表示は mm() で mm 整数に換算する。
// ============================================================
export const SPEC = {
  layer1Y: 0.42, // L1 十字パイプ層の高さ
  layer2Y: 0.54, // L2 デッキ合板の高さ
  layer3Y: 2.0, // L3 上部十字パイプ層の高さ

  centerAxis: {
    // 中心支柱（静止軸）
    bottomY: 0.05,
    length: 2.5, // 鉄パイプ 2500mm
    diameter: 0.0486, // φ48.6
  },
  horsePole: {
    // 馬ポール（昇降する垂直パイプ）
    radius: 1.0, // 配置半径 r=1000
    length: 2.0, // 2000mm
    diameter: 0.0486,
    count: 4,
  },
  edgePillar: {
    // 外周支柱（押して回す垂直パイプ）
    radius: 2.05, // 配置半径 r=2050
    bottomY: 0.085,
    topY: 2.2,
    diameter: 0.0486,
    count: 4,
  },
  crossPipe: {
    // 十字フレーム用 鉄パイプ
    length: 4.4, // 4400mm
    diameter: 0.0486,
  },
  base: {
    // 床固定金具まわり
    plywoodDiameter: 1.2, // φ1200 床合板
    plywoodThickness: 0.018,
    flangeDiameter: 0.2, // φ200 フランジ
    flangeThickness: 0.012,
    socketDiameter: 0.1, // φ100 ソケット
    socketHeight: 0.12, // h120
    weightDiameter: 0.15, // φ150 重り
    weightHeight: 0.05,
    weightRadius: 0.36, // 重りの配置半径
    weightCount: 4,
  },
  caster: {
    // キャスター
    diameter: 0.1, // φ100
    bracketHeight: 0.05, // h50
  },
  wavyRail: {
    // 波型レール
    innerDiameter: 1.68, // φ1680
    outerDiameter: 2.32, // φ2320
    centerY: 0.15,
    thickness: 0.025,
    waveHeight: 0.1, // 凸の高さ（谷→山）100mm
    waveCount: 4, // 凸4つ
  },
  deck: {
    // L2 デッキ
    plateLong: 1.8, // 合板 1800
    plateShort: 0.9, // 合板 900
    plateThick: 0.012, // 合板 12
    plateCount: 4,
    centerHole: 0.4, // 中心穴 400×400
    diamondD: 1.8, // 菱形ベニヤ
  },
  seat: {
    // 止め輪＋乗り板
    collarDiameter: 0.084, // φ84 シャフトカラー
    collarHeight: 0.04,
    boardWidth: 0.3, // 乗り板 300
    boardDepth: 0.4, // 乗り板 400
    boardThick: 0.018, // 乗り板 18
    shortPipeLength: 0.42, // 短パイプ 420mm
    seatY: 0.8, // 座面の高さ
  },
  horse: {
    // 馬
    centerY: 0.95, // 馬の取付高さ
    approxLength: 0.7, // 全長 ≈700mm
  },
} as const;

// mm 表記ヘルパ（メートル → mm。小数第1位まで保持し φ48.6 等の精度を維持）
export const mm = (m: number): number => Math.round(m * 10000) / 10;

// ============================================================
// 派生定数 — SPEC から導出。3Dモデル・図面の両方が参照する。
// ============================================================
export const LAYER1_Y = SPEC.layer1Y;
export const LAYER2_Y = SPEC.layer2Y;
export const LAYER3_Y = SPEC.layer3Y;
export const AXIS_BOTTOM_Y = SPEC.centerAxis.bottomY;
export const AXIS_HEIGHT = SPEC.centerAxis.length;
export const POLE_LEN = SPEC.horsePole.length;
export const POLE_RADIUS = SPEC.horsePole.radius;
export const POLE_DIAMETER = SPEC.horsePole.diameter;
export const SCAFFOLD_PIPE_R = POLE_DIAMETER / 2;
export const PIPE_HALF_GAP = POLE_DIAMETER + 0.003;
export const HORSE_Y = SPEC.horse.centerY;
export const WAVE_CENTER_Y = SPEC.wavyRail.centerY;
export const COLLAR_Y_ON_POLE = LAYER3_Y - (WAVE_CENTER_Y - 0.075);
export const TALL_PILLAR_R = SPEC.edgePillar.radius;
export const TALL_PILLAR_BOTTOM = SPEC.edgePillar.bottomY;
export const TALL_PILLAR_TOP = SPEC.edgePillar.topY;
export const TALL_PILLAR_HEIGHT = TALL_PILLAR_TOP - TALL_PILLAR_BOTTOM;
export const waveAmplitude = SPEC.wavyRail.waveHeight / 2; // 振幅±5cm
export const waveCount = SPEC.wavyRail.waveCount;

export const TOTAL_STEPS = 10;
