// Elevation.tsx — 立面図 ELEVATION。
// 全座標・全寸法は S()（= SPEC/mm 経由）から計算され、3Dモデルとズレない。
import type { JSX } from 'react';
import { mm, SPEC } from '../spec';
import { S } from './specValues';
import { L, R, C, EL, PL, PG, dimV, dimH, leader, TX, SVG, f } from './primitives';

type CoordFn = (v: number) => number;

// 馬（側面シルエット）
function horseSide(X: CoordFn, Y: CoordFn, cx: number, hY: number): JSX.Element {
  const g: JSX.Element[] = [];
  g.push(EL(X(cx), Y(hY), 330, 175, 'dw-deco'));
  g.push(
    PL(
      `${f(X(cx) + 250)},${f(Y(hY + 60))} ${f(X(cx) + 430)},${f(Y(hY + 330))} ${f(
        X(cx) + 540,
      )},${f(Y(hY + 360))}`,
      'dw-deco',
    ),
  );
  g.push(R(X(cx) + 470, Y(hY + 430), 150, 95, 'dw-deco'));
  [-180, -60, 150, 260].forEach((lx) => {
    g.push(L(X(cx) + lx, Y(hY - 120), X(cx) + lx, Y(hY - 520), 'dw-deco'));
  });
  g.push(
    PL(
      `${f(X(cx) - 300)},${f(Y(hY + 30))} ${f(X(cx) - 470)},${f(Y(hY - 260))}`,
      'dw-deco',
    ),
  );
  return <g>{g}</g>;
}

// スタッフ（側面シルエット）
function personSide(X: CoordFn, Y: CoordFn, cx: number): JSX.Element {
  const g: JSX.Element[] = [];
  g.push(C(X(cx), Y(1580), 110, 'dw-deco'));
  g.push(L(X(cx), Y(1470), X(cx), Y(820), 'dw-deco'));
  g.push(L(X(cx), Y(820), X(cx) - 130, Y(0), 'dw-deco'));
  g.push(L(X(cx), Y(820), X(cx) + 130, Y(0), 'dw-deco'));
  g.push(L(X(cx), Y(1330), X(cx) + 220, Y(1120), 'dw-deco'));
  return <g>{g}</g>;
}

// elevation(step)
export function elevation(step: number): JSX.Element {
  const s = S();
  const mL = 1150;
  const mR = 520;
  const mT = 110;
  const mB = 600;
  const wXmin = -2200;
  const wXmax = 2200;
  const wYmax = 2650;
  const W = mL + (wXmax - wXmin) + mR;
  const H = mT + wYmax + mB;
  const X: CoordFn = (wx) => mL + (wx - wXmin);
  const Y: CoordFn = (wy) => mT + (wYmax - wy);
  const gY = Y(0);
  const o: JSX.Element[] = [];

  // 中心線
  o.push(L(X(0), Y(2650), X(0), gY + 90, 'dw-ax'));
  // 地面＋ハッチング
  o.push(L(X(wXmin) - 220, gY, X(wXmax) + 220, gY, 'dw-ground'));
  for (let hx = X(wXmin) - 180; hx < X(wXmax) + 220; hx += 130) {
    o.push(L(hx, gY, hx - 72, gY + 72, 'dw-gh'));
  }

  // helper: 縦パイプ
  const vpipe = (cx: number, yb: number, yt: number, dia: number, cls: string): JSX.Element =>
    R(X(cx) - dia / 2, Y(yt), dia, Y(yb) - Y(yt), cls);

  // STEP1: 床合板・フランジ・ソケット・中心支柱・重り
  if (step >= 1) {
    o.push(R(X(-s.plyD / 2), Y(s.plyT), s.plyD, s.plyT, 'dw-wood'));
    o.push(R(X(-s.flD / 2), Y(s.plyT + s.flT), s.flD, s.flT, 'dw-steel'));
    o.push(R(X(-s.soD / 2), Y(s.plyT + s.flT + s.soH), s.soD, s.soH, 'dw-steel'));
    o.push(vpipe(0, s.aB, s.aB + s.aL, s.aD, 'dw-pipe'));
    const wx1 = Math.round(s.wR * 0.707);
    o.push(R(X(wx1 - s.wD / 2), Y(s.wH), s.wD, s.wH, 'dw-steel'));
    o.push(R(X(-wx1 - s.wD / 2), Y(s.wH), s.wD, s.wH, 'dw-steel'));
    o.push(
      leader(
        X(0) + s.aD / 2,
        Y(s.aB + s.aL - 260),
        X(0) + 560,
        Y(s.aB + s.aL - 150),
        `φ${s.aD} 鋼管・中心支柱`,
      ),
    );
  }
  // STEP2: L1 十字パイプ
  if (step >= 2) o.push(R(X(-s.cpL / 2), Y(s.L1) - s.cpD / 2, s.cpL, s.cpD, 'dw-pipe'));
  // STEP3: 馬ポール×2・外周支柱×2
  if (step >= 3) {
    o.push(vpipe(-s.pR, 0, s.pL, s.pD, 'dw-pipe'));
    o.push(vpipe(s.pR, 0, s.pL, s.pD, 'dw-pipe'));
    o.push(vpipe(-s.eR, s.eB, s.eT, s.eD, 'dw-pipe'));
    o.push(vpipe(s.eR, s.eB, s.eT, s.eD, 'dw-pipe'));
  }
  // STEP4: キャスター（8本ぶん）
  if (step >= 4) {
    [-s.eR, -s.pR, s.pR, s.eR].forEach((cx) => {
      o.push(C(X(cx), Y(s.cD / 2), s.cD / 2, 'dw-steel'));
    });
  }
  // STEP6: L3 上部十字パイプ
  if (step >= 6) o.push(R(X(-s.cpL / 2), Y(s.L3) - s.cpD / 2, s.cpL, s.cpD, 'dw-pipe'));
  // STEP7: 波型レール
  if (step >= 7) {
    const amp = s.rWH / 2;
    const top: string[] = [];
    const bot: string[] = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const wx = -s.rOut / 2 + s.rOut * (i / N);
      const yy = s.rCY + amp * Math.sin((i / N) * s.rWC * Math.PI * 2);
      top.push(`${f(X(wx))},${f(Y(yy + s.rTh / 2))}`);
      bot.push(`${f(X(wx))},${f(Y(yy - s.rTh / 2))}`);
    }
    o.push(PG(`${top.join(' ')} ${bot.reverse().join(' ')}`, 'dw-wood'));
  }
  // STEP8: L2 デッキ
  if (step >= 8) {
    const dHalf = s.dHole / 2 + s.dpL;
    o.push(R(X(-dHalf), Y(s.L2), dHalf - s.dHole / 2, s.dpT, 'dw-wood'));
    o.push(R(X(s.dHole / 2), Y(s.L2), dHalf - s.dHole / 2, s.dpT, 'dw-wood'));
  }
  // STEP9: 止め輪＋乗り板
  if (step >= 9) {
    [-s.pR, s.pR].forEach((cx) => {
      o.push(R(X(cx) - s.coD / 2, Y(s.collarY + s.coH / 2), s.coD, s.coH, 'dw-steel'));
      o.push(R(X(cx) - s.spL / 2, Y(s.seatY) - s.cpD / 2, s.spL, s.cpD, 'dw-pipe'));
      o.push(R(X(cx) - s.sbW / 2, Y(s.seatY + s.cpD / 2 + s.sbT), s.sbW, s.sbT, 'dw-wood'));
    });
  }
  // STEP10: 馬・スタッフ
  if (step >= 10) {
    [-s.pR, s.pR].forEach((cx) => {
      o.push(horseSide(X, Y, cx, s.hY));
    });
    [-s.eR, s.eR].forEach((cx) => {
      const off = cx < 0 ? -300 : 300;
      o.push(personSide(X, Y, cx + off));
    });
  }

  // ===== 寸法（高さ）— ステップ到達時のみ =====
  const colX = [mL - 140, mL - 280, mL - 420, mL - 560, mL - 700, mL - 840, mL - 980];
  const vd = (idx: number, h: number, label: string, need: number): void => {
    if (step >= need) o.push(dimV(colX[idx], gY, Y(h), X(wXmin), label));
  };
  vd(0, s.L1, `${mm(SPEC.layer1Y)}`, 2);
  vd(1, s.L2, `${mm(SPEC.layer2Y)}`, 8);
  vd(2, s.seatY, `${mm(SPEC.seat.seatY)}`, 9);
  vd(3, s.hY, `${mm(SPEC.horse.centerY)}`, 10);
  vd(4, s.L3, `${mm(SPEC.layer3Y)}`, 6);
  vd(5, s.eT, `${mm(SPEC.edgePillar.topY)}`, 3);
  vd(6, s.aB + s.aL, `${mm(SPEC.centerAxis.length)} (支柱)`, 1);

  // ===== 寸法（幅）=====
  const rowY = [gY + 200, gY + 370, gY + 540];
  if (step >= 3) o.push(dimH(X(-s.pR), X(s.pR), rowY[0], gY, `2×${s.pR}=${s.pR * 2}`));
  if (step >= 3) o.push(dimH(X(-s.eR), X(s.eR), rowY[1], gY, `2×${s.eR}=${s.eR * 2}`));
  if (step >= 2)
    o.push(
      dimH(X(-s.cpL / 2), X(s.cpL / 2), rowY[2], gY, `${mm(SPEC.crossPipe.length)} (十字パイプ)`),
    );

  // タイトル＋凡例
  o.push(TX(mL, mT - 30, '立面図 — Z軸方向から見る', 'dw-note', 'start'));

  return SVG(W, H, o);
}
