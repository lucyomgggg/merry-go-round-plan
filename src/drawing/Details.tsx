// Details.tsx — 部品詳細図 PART DETAILS。
// N.T.S.（寸法は SPEC 連動・単位 mm）。寸法値はすべて S()（= SPEC/mm 経由）から取得する。
import type { JSX } from 'react';
import { S } from './specValues';
import { L, R, C, PG, dimH, dimV, leader, TX, SVG, f } from './primitives';

// detPipe — 鋼管 断面
function detPipe(): JSX.Element {
  const s = S();
  const cx = 580;
  const cy = 560;
  const r = 290;
  return SVG(1200, 1160, [
    L(cx - r - 170, cy, cx + r + 170, cy, 'dw-ax'),
    L(cx, cy - r - 170, cx, cy + r + 170, 'dw-ax'),
    C(cx, cy, r, 'dw-pipe'),
    C(cx, cy, r * 0.82, 'dw-pipe'),
    dimH(cx - r, cx + r, cy - r - 160, cy - r, 'φ' + s.aD),
    TX(cx, cy + r + 210, '足場用単管（鋼管）', 'dw-lbl'),
  ]);
}

// detBase — 床固定金具
function detBase(): JSX.Element {
  const s = S();
  const cx = 640;
  const by = 860;
  const fw = 620;
  const fh = 120;
  const sw = 300;
  const sh = 400;
  return SVG(1440, 1160, [
    R(cx - fw / 2, by - fh, fw, fh, 'dw-steel'),
    R(cx - sw / 2, by - fh - sh, sw, sh, 'dw-steel'),
    L(cx, by - fh - sh - 150, cx, by + 150, 'dw-ax'),
    dimH(cx - fw / 2, cx + fw / 2, by + 210, by, 'φ' + s.flD),
    dimH(cx - sw / 2, cx + sw / 2, by - fh - sh - 170, by - fh - sh, 'φ' + s.soD),
    dimV(by - fh, by - fh - sh, cx + fw / 2 + 210, cx + sw / 2, 'h' + s.soH),
    dimV(by, by - fh, cx - fw / 2 - 190, cx - fw / 2, 't' + s.flT),
  ]);
}

// detWeight — 重り
function detWeight(): JSX.Element {
  const s = S();
  const cx = 540;
  const cy = 420;
  const w = 560;
  const h = 187;
  return SVG(1240, 840, [
    R(cx - w / 2, cy - h / 2, w, h, 'dw-steel'),
    dimH(cx - w / 2, cx + w / 2, cy - h / 2 - 170, cy - h / 2, 'φ' + s.wD),
    dimV(cy + h / 2, cy - h / 2, cx + w / 2 + 200, cx + w / 2, 'h' + s.wH),
    TX(cx, cy + h / 2 + 200, '円柱ウェイト ×' + s.wN, 'dw-lbl'),
  ]);
}

// detClamp — 三連クランプ
function detClamp(): JSX.Element {
  const s = S();
  const cx = 600;
  const cy = 400;
  const r = 130;
  const gap = 300;
  const o: JSX.Element[] = [];
  [-gap, 0, gap].forEach((dx) => {
    o.push(C(cx + dx, cy, r, 'dw-steel'), C(cx + dx, cy, r * 0.42, 'dw-pipe'));
  });
  o.push(L(cx - gap, cy, cx + gap, cy, 'dw-steel'));
  o.push(TX(cx, cy + r + 170, 'φ' + s.aD + ' 単管用', 'dw-lbl'));
  o.push(TX(cx, cy + r + 300, '仮止め → 本締めで固定', 'dw-note'));
  return SVG(1320, 900, o);
}

// detCaster — キャスター
function detCaster(): JSX.Element {
  const s = S();
  const cx = 560;
  const wy = 760;
  const r = 180;
  const bw = 180;
  const bh = 250;
  return SVG(1320, 1320, [
    R(cx - bw / 2, wy - r - bh, bw, bh, 'dw-steel'),
    C(cx, wy, r, 'dw-steel'),
    C(cx, wy, r * 0.3, 'dw-pipe'),
    R(cx - 70, wy - r - bh - 90, 140, 90, 'dw-pipe'),
    dimH(cx - r, cx + r, wy + r + 170, wy + r, 'φ' + s.cD),
    dimV(wy - r, wy - r - bh, cx + bw / 2 + 210, cx + bw / 2, 'h' + s.cBr),
    TX(cx, wy + r + 320, '自在キャスター', 'dw-lbl'),
  ]);
}

// detRail — 波型レール
function detRail(): JSX.Element {
  const s = S();
  const x0 = 200;
  const x1 = 1160;
  const midY = 380;
  const amp = 150;
  const N = 140;
  const th = 40;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    const y = midY + amp * Math.sin((i / N) * s.rWC * Math.PI * 2);
    top.push(`${f(x)},${f(y - th / 2)}`);
    bot.push(`${f(x)},${f(y + th / 2)}`);
  }
  return SVG(1340, 960, [
    PG(`${top.join(' ')} ${bot.reverse().join(' ')}`, 'dw-wood'),
    dimV(midY + amp, midY - amp, x0 - 170, x0, 'h' + s.rWH),
    TX(x0, midY + amp + 250, '凸 ' + s.rWC + 'つ ／ 板厚 ' + s.rTh, 'dw-lbl', 'start'),
    TX(x0, midY + amp + 380, 'レール φ内' + s.rIn + ' ／ φ外' + s.rOut, 'dw-lbl', 'start'),
  ]);
}

// detPlate — L2 デッキ合板
function detPlate(): JSX.Element {
  const s = S();
  const cx = 580;
  const cy = 460;
  const w = 820;
  const h = 410;
  return SVG(1460, 920, [
    R(cx - w / 2, cy - h / 2, w, h, 'dw-wood'),
    dimH(cx - w / 2, cx + w / 2, cy - h / 2 - 170, cy - h / 2, '' + s.dpL),
    dimV(cy + h / 2, cy - h / 2, cx + w / 2 + 200, cx + w / 2, '' + s.dpS),
    TX(cx, cy + h / 2 + 200, '構造用合板 厚' + s.dpT, 'dw-lbl'),
  ]);
}

// detCollar — シャフトカラー
function detCollar(): JSX.Element {
  const s = S();
  const cx = 580;
  const cy = 560;
  const rO = 300;
  const rI = Math.round((300 * s.aD) / s.coD);
  return SVG(1280, 1280, [
    L(cx - rO - 150, cy, cx + rO + 150, cy, 'dw-ax'),
    L(cx, cy - rO - 150, cx, cy + rO + 150, 'dw-ax'),
    C(cx, cy, rO, 'dw-steel'),
    C(cx, cy, rI, 'dw-pipe'),
    R(cx - 26, cy - rO - 70, 52, 80, 'dw-steel'),
    dimH(cx - rO, cx + rO, cy - rO - 200, cy - rO - 90, 'φ' + s.coD),
    leader(cx + rI * 0.7, cy - rI * 0.7, cx + rO + 110, cy - rO + 50, 'φ' + s.aD + ' 内径'),
    TX(cx, cy + rO + 210, 'シャフトカラー 高さ' + s.coH, 'dw-lbl'),
  ]);
}

// detBoard — 乗り板
function detBoard(): JSX.Element {
  const s = S();
  const cx = 560;
  const cy = 470;
  const w = 620;
  const h = 465;
  return SVG(1320, 1020, [
    R(cx - w / 2, cy - h / 2, w, h, 'dw-wood'),
    dimH(cx - w / 2, cx + w / 2, cy - h / 2 - 170, cy - h / 2, '' + s.sbD),
    dimV(cy + h / 2, cy - h / 2, cx + w / 2 + 200, cx + w / 2, '' + s.sbW),
    TX(cx, cy + h / 2 + 190, '乗り板 厚' + s.sbT, 'dw-lbl'),
  ]);
}

// detailsSheet の items
const ITEMS: { st: number; t: string; fn: () => JSX.Element }[] = [
  { st: 1, t: '鋼管 断面 SECTION', fn: detPipe },
  { st: 1, t: '床固定金具', fn: detBase },
  { st: 1, t: '重り', fn: detWeight },
  { st: 2, t: '三連クランプ', fn: detClamp },
  { st: 4, t: 'キャスター', fn: detCaster },
  { st: 7, t: '波型レール', fn: detRail },
  { st: 8, t: 'L2 デッキ合板', fn: detPlate },
  { st: 9, t: 'シャフトカラー', fn: detCollar },
  { st: 9, t: '乗り板', fn: detBoard },
];

// detailsSheet(step) — 現在ステップまでに登場する部品の詳細図シート
export function details(step: number): JSX.Element | null {
  const cells = ITEMS.filter((it) => step >= it.st);
  if (cells.length === 0) return null;
  return (
    <div className="dwg-sheet">
      <div className="dwg-sheet-title">PART DETAILS 部品詳細図</div>
      <div className="dwg-sheet-sub">N.T.S.（寸法は SPEC 連動・単位 mm）</div>
      <div className="dwg-details-grid">
        {cells.map((it, i) => (
          <div className="dwg-detail-cell" key={i}>
            <div className="dc-title">{it.t}</div>
            <div className="dc-step">STEP {it.st}</div>
            {it.fn()}
          </div>
        ))}
      </div>
    </div>
  );
}
