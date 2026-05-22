// Plan.tsx — 平面図 PLAN。
// 全座標・全寸法は S()（= SPEC/mm 経由）と PIPE_HALF_GAP から計算され、3Dモデルとズレない。
import type { JSX } from 'react';
import { mm, SPEC, PIPE_HALF_GAP } from '../spec';
import { S } from './specValues';
import { L, R, C, EL, PG, dimH, leader, TX, SVG, arrow, dtext, f } from './primitives';

// plan(step)
export function plan(step: number): JSX.Element {
  const s = S();
  const hg = mm(PIPE_HALF_GAP);
  const RAD = 2380;
  const mSide = 380;
  const mTop = 1100;
  const mBot = 1120;
  const W = mSide * 2 + RAD * 2;
  const H = mTop + mBot + RAD * 2;
  const cx = mSide + RAD;
  const cy = mTop + RAD;
  const X = (wx: number): number => cx + wx;
  const Y = (wz: number): number => cy + wz;
  const o: JSX.Element[] = [];
  let i: number;
  let a: number;

  // 中心十字線
  o.push(L(X(-RAD - 140), cy, X(RAD + 140), cy, 'dw-ax'));
  o.push(L(cx, Y(-RAD - 140), cx, Y(RAD + 140), 'dw-ax'));

  // STEP1: 床合板・ソケット・重り
  if (step >= 1) {
    o.push(C(cx, cy, s.plyD / 2, 'dw-wood'));
    for (i = 0; i < s.wN; i++) {
      a = Math.PI / 4 + (i / s.wN) * Math.PI * 2;
      o.push(C(X(s.wR * Math.cos(a)), Y(s.wR * Math.sin(a)), s.wD / 2, 'dw-steel'));
    }
    o.push(C(cx, cy, s.soD / 2, 'dw-steel'));
  }
  // STEP2: L1 十字パイプ（＃）
  if (step >= 2) {
    [-hg, hg].forEach((z) => {
      o.push(R(X(-s.cpL / 2), Y(z) - s.cpD / 2, s.cpL, s.cpD, 'dw-pipe'));
    });
    [-hg, hg].forEach((x) => {
      o.push(R(X(x) - s.cpD / 2, Y(-s.cpL / 2), s.cpD, s.cpL, 'dw-pipe'));
    });
  }
  // STEP6: L3 上部十字パイプ（X1本＋Z1本）
  if (step >= 6) {
    o.push(R(X(-s.cpL / 2), Y(hg) - s.cpD / 2, s.cpL, s.cpD, 'dw-pipe'));
    o.push(R(X(hg) - s.cpD / 2, Y(-s.cpL / 2), s.cpD, s.cpL, 'dw-pipe'));
  }
  // STEP7: 波型レール（内外リング）
  if (step >= 7) {
    o.push(C(cx, cy, s.rOut / 2, 'dw-wood'));
    o.push(C(cx, cy, s.rIn / 2, 'dw-wood'));
    o.push(C(cx, cy, (s.rOut + s.rIn) / 4, 'dw-hidden'));
  }
  // STEP8: L2 デッキ合板（放射4枚）＋菱形ベニヤ＋中心穴
  if (step >= 8) {
    const dd = s.dDia;
    o.push(PG([X(dd), cy, cx, Y(dd), X(-dd), cy, cx, Y(-dd)].join(' '), 'dw-wood'));
    const pc = s.dHole / 2 + s.dpL / 2;
    for (i = 0; i < s.dpN; i++) {
      a = (i / s.dpN) * 90;
      o.push(
        <g transform={`rotate(${f(a)} ${f(cx)} ${f(cy)})`} key={`plan-deck-${i}`}>
          {R(X(pc) - s.dpL / 2, cy - s.dpS / 2, s.dpL, s.dpS, 'dw-wood')}
        </g>,
      );
    }
    o.push(R(cx - s.dHole / 2, cy - s.dHole / 2, s.dHole, s.dHole, 'dw-hidden'));
  }
  // STEP3: 馬ポール・外周支柱（ピッチ円＋本体）
  if (step >= 3) {
    o.push(C(cx, cy, s.pR, 'dw-hidden'));
    o.push(C(cx, cy, s.eR, 'dw-hidden'));
    for (i = 0; i < s.poleCnt; i++) {
      a = (i / s.poleCnt) * Math.PI * 2;
      o.push(C(X(s.pR * Math.cos(a)), Y(s.pR * Math.sin(a)), s.pD / 2, 'dw-pipe'));
    }
    for (i = 0; i < s.pillarCnt; i++) {
      a = (i / s.pillarCnt) * Math.PI * 2;
      o.push(C(X(s.eR * Math.cos(a)), Y(s.eR * Math.sin(a)), s.eD / 2, 'dw-pipe'));
    }
  }
  // STEP4: キャスター（8）
  if (step >= 4) {
    for (i = 0; i < s.poleCnt; i++) {
      a = (i / s.poleCnt) * Math.PI * 2;
      o.push(C(X(s.pR * Math.cos(a)), Y(s.pR * Math.sin(a)), s.cD / 2, 'dw-steel'));
    }
    for (i = 0; i < s.pillarCnt; i++) {
      a = (i / s.pillarCnt) * Math.PI * 2;
      o.push(C(X(s.eR * Math.cos(a)), Y(s.eR * Math.sin(a)), s.cD / 2, 'dw-steel'));
    }
  }
  // STEP9: 乗り板（馬ポール上）
  if (step >= 9) {
    for (i = 0; i < s.poleCnt; i++) {
      a = (i / s.poleCnt) * 90;
      const pcr = s.pR;
      o.push(
        <g transform={`rotate(${f(a)} ${f(cx)} ${f(cy)})`} key={`plan-board-${i}`}>
          {R(X(pcr) - s.sbD / 2, cy - s.sbW / 2, s.sbD, s.sbW, 'dw-wood')}
        </g>,
      );
    }
  }
  // STEP10: 馬・スタッフ
  if (step >= 10) {
    for (i = 0; i < s.poleCnt; i++) {
      const deg = (i / s.poleCnt) * 90;
      o.push(
        <g transform={`rotate(${f(deg)} ${f(cx)} ${f(cy)})`} key={`plan-horse-${i}`}>
          {EL(X(s.pR), cy, s.hLen / 2, 150, 'dw-deco')}
        </g>,
      );
    }
    for (i = 0; i < s.pillarCnt; i++) {
      a = (i / s.pillarCnt) * Math.PI * 2;
      o.push(
        C(X((s.eR + 300) * Math.cos(a)), Y((s.eR + 300) * Math.sin(a)), 110, 'dw-deco'),
      );
    }
  }

  // ===== 半径寸法（空き角へ斜めに）=====
  const radial = (angDeg: number, r: number, label: string, need: number): void => {
    if (step < need) return;
    const ang = (angDeg * Math.PI) / 180;
    const ex = X(r * Math.cos(ang));
    const ey = Y(r * Math.sin(ang));
    o.push(L(cx, cy, ex, ey, 'dw-dim'));
    o.push(arrow(ex, ey, Math.cos(ang), Math.sin(ang)));
    o.push(dtext((cx + ex) / 2, (cy + ey) / 2, label, 0));
  };
  radial(38, s.pR, `r=${s.pR}`, 3);
  radial(-38, s.eR, `r=${s.eR}`, 3);

  // ===== 直径寸法（下方へ）=====
  if (step >= 2)
    o.push(
      dimH(
        X(-s.cpL / 2),
        X(s.cpL / 2),
        cy + RAD + 260,
        cy + RAD,
        `${mm(SPEC.crossPipe.length)} 十字パイプ`,
      ),
    );
  if (step >= 7)
    o.push(dimH(X(-s.rOut / 2), X(s.rOut / 2), cy + RAD + 520, cy + RAD, `φ${s.rOut} レール外径`));
  if (step >= 7)
    o.push(dimH(X(-s.rIn / 2), X(s.rIn / 2), cy + RAD + 780, cy + RAD, `φ${s.rIn} レール内径`));
  if (step >= 1)
    o.push(
      leader(
        X(-s.plyD * 0.35),
        Y(s.plyD * 0.35),
        X(-RAD * 0.62),
        Y(-RAD - 60),
        `φ${s.plyD} 床合板`,
        'start',
      ),
    );

  o.push(TX(mSide, 140, '平面図 — 上から見る', 'dw-note', 'start'));
  return SVG(W, H, o);
}
