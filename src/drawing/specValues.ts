// specValues.ts — SPEC / mm() / COLLAR_Y_ON_POLE を mm 整数化して図面へ供給する。
// 図面はすべてこの値を経由するため 3Dモデルとズレない。
import { SPEC, mm, COLLAR_Y_ON_POLE } from '../spec';

export interface SpecValues {
  aB: number;
  aL: number;
  aD: number;
  L1: number;
  L2: number;
  L3: number;
  pR: number;
  pL: number;
  pD: number;
  eR: number;
  eB: number;
  eT: number;
  eD: number;
  cpL: number;
  cpD: number;
  plyD: number;
  plyT: number;
  flD: number;
  flT: number;
  soD: number;
  soH: number;
  wD: number;
  wH: number;
  wR: number;
  wN: number;
  cD: number;
  cBr: number;
  rIn: number;
  rOut: number;
  rCY: number;
  rTh: number;
  rWH: number;
  rWC: number;
  dpL: number;
  dpS: number;
  dpT: number;
  dpN: number;
  dHole: number;
  dDia: number;
  coD: number;
  coH: number;
  sbW: number;
  sbD: number;
  sbT: number;
  spL: number;
  seatY: number;
  collarY: number;
  hY: number;
  hLen: number;
  poleCnt: number;
  pillarCnt: number;
}

// SPEC 値を mm 整数で返す（図面共通の数値ソース）
export function S(): SpecValues {
  return {
    aB: mm(SPEC.centerAxis.bottomY),
    aL: mm(SPEC.centerAxis.length),
    aD: mm(SPEC.centerAxis.diameter),
    L1: mm(SPEC.layer1Y),
    L2: mm(SPEC.layer2Y),
    L3: mm(SPEC.layer3Y),
    pR: mm(SPEC.horsePole.radius),
    pL: mm(SPEC.horsePole.length),
    pD: mm(SPEC.horsePole.diameter),
    eR: mm(SPEC.edgePillar.radius),
    eB: mm(SPEC.edgePillar.bottomY),
    eT: mm(SPEC.edgePillar.topY),
    eD: mm(SPEC.edgePillar.diameter),
    cpL: mm(SPEC.crossPipe.length),
    cpD: mm(SPEC.crossPipe.diameter),
    plyD: mm(SPEC.base.plywoodDiameter),
    plyT: mm(SPEC.base.plywoodThickness),
    flD: mm(SPEC.base.flangeDiameter),
    flT: mm(SPEC.base.flangeThickness),
    soD: mm(SPEC.base.socketDiameter),
    soH: mm(SPEC.base.socketHeight),
    wD: mm(SPEC.base.weightDiameter),
    wH: mm(SPEC.base.weightHeight),
    wR: mm(SPEC.base.weightRadius),
    wN: SPEC.base.weightCount,
    cD: mm(SPEC.caster.diameter),
    cBr: mm(SPEC.caster.bracketHeight),
    rIn: mm(SPEC.wavyRail.innerDiameter),
    rOut: mm(SPEC.wavyRail.outerDiameter),
    rCY: mm(SPEC.wavyRail.centerY),
    rTh: mm(SPEC.wavyRail.thickness),
    rWH: mm(SPEC.wavyRail.waveHeight),
    rWC: SPEC.wavyRail.waveCount,
    dpL: mm(SPEC.deck.plateLong),
    dpS: mm(SPEC.deck.plateShort),
    dpT: mm(SPEC.deck.plateThick),
    dpN: SPEC.deck.plateCount,
    dHole: mm(SPEC.deck.centerHole),
    dDia: mm(SPEC.deck.diamondD),
    coD: mm(SPEC.seat.collarDiameter),
    coH: mm(SPEC.seat.collarHeight),
    sbW: mm(SPEC.seat.boardWidth),
    sbD: mm(SPEC.seat.boardDepth),
    sbT: mm(SPEC.seat.boardThick),
    spL: mm(SPEC.seat.shortPipeLength),
    seatY: mm(SPEC.seat.seatY),
    collarY: mm(COLLAR_Y_ON_POLE),
    hY: mm(SPEC.horse.centerY),
    hLen: mm(SPEC.horse.approxLength),
    poleCnt: SPEC.horsePole.count,
    pillarCnt: SPEC.edgePillar.count,
  };
}
