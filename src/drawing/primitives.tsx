// primitives.tsx — 2D図面用の SVG プリミティブ＆寸法ヘルパ。
// L/R/C/EL/PL/PG/TX/dtext/arrow/dimV/dimH/leader/SVG を JSX で提供する。
import type { JSX, ReactNode } from 'react';

// const ARR = 42, DIM_FS = 82, LBL_FS = 74;
export const ARR = 42;
export const DIM_FS = 82;
export const LBL_FS = 74;

// function f(n){ return Math.round(n*10)/10; }
export function f(n: number): number {
  return Math.round(n * 10) / 10;
}

// 文字幅推定（全角は fs、半角は fs*0.6）
function textW(s: string, fs: number): number {
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    w += s.charCodeAt(i) > 0x2000 ? fs : fs * 0.6;
  }
  return w;
}

// テキストアンカー
type Anchor = 'start' | 'middle' | 'end';

let keySeq = 0;
function nextKey(prefix: string): string {
  keySeq += 1;
  return `${prefix}-${keySeq}`;
}

// L(x1,y1,x2,y2,c)
export function L(x1: number, y1: number, x2: number, y2: number, c: string): JSX.Element {
  return <line x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} className={c} key={nextKey('L')} />;
}

// R(x,y,w,h,c)
export function R(x: number, y: number, w: number, h: number, c: string): JSX.Element {
  return <rect x={f(x)} y={f(y)} width={f(w)} height={f(h)} className={c} key={nextKey('R')} />;
}

// C(x,y,r,c)
export function C(x: number, y: number, r: number, c: string): JSX.Element {
  return <circle cx={f(x)} cy={f(y)} r={f(r)} className={c} key={nextKey('C')} />;
}

// EL(x,y,rx,ry,c)
export function EL(x: number, y: number, rx: number, ry: number, c: string): JSX.Element {
  return <ellipse cx={f(x)} cy={f(y)} rx={f(rx)} ry={f(ry)} className={c} key={nextKey('EL')} />;
}

// PL(p,c) — polyline（points 文字列をそのまま受け取る）
export function PL(p: string, c: string): JSX.Element {
  return <polyline points={p} className={c} fill="none" key={nextKey('PL')} />;
}

// PG(p,c) — polygon
export function PG(p: string, c: string): JSX.Element {
  return <polygon points={p} className={c} key={nextKey('PG')} />;
}

// TX(x,y,s,c,a) — text。a 省略時は middle。
export function TX(x: number, y: number, s: string, c: string, a: Anchor = 'middle'): JSX.Element {
  return (
    <text
      x={f(x)}
      y={f(y)}
      className={c}
      textAnchor={a}
      dominantBaseline="middle"
      key={nextKey('TX')}
    >
      {s}
    </text>
  );
}

// dtext(cx,cy,s,rot) — 背景ボックス付き寸法テキスト
export function dtext(cx: number, cy: number, s: string, rot?: number): JSX.Element {
  const fs = DIM_FS;
  const w = textW(s, fs) + fs * 0.5;
  const h = fs * 1.35;
  const inner = (
    <>
      {R(cx - w / 2, cy - h / 2, w, h, 'dw-dbg')}
      {TX(cx, cy, s, 'dw-dtxt')}
    </>
  );
  if (rot) {
    return (
      <g transform={`rotate(${rot} ${f(cx)} ${f(cy)})`} key={nextKey('dtext')}>
        {inner}
      </g>
    );
  }
  return <g key={nextKey('dtext')}>{inner}</g>;
}

// arrow(tx,ty,dx,dy) — 寸法矢印（先端 tx,ty、方向 dx,dy）
export function arrow(tx: number, ty: number, dx: number, dy: number): JSX.Element {
  const ax = tx - dx * ARR;
  const ay = ty - dy * ARR;
  const px = -dy * ARR * 0.34;
  const py = dx * ARR * 0.34;
  return PG(
    `${f(tx)},${f(ty)} ${f(ax + px)},${f(ay + py)} ${f(ax - px)},${f(ay - py)}`,
    'dw-dimar',
  );
}

// dimV — 縦寸法（sy1=下端=大きいy, sy2=上端、寸法線 sx、補助線 extX 始点）
export function dimV(
  sx: number,
  sy1: number,
  sy2: number,
  extX: number,
  label: string,
): JSX.Element {
  return (
    <g key={nextKey('dimV')}>
      {L(sx, sy1, sx, sy2, 'dw-dim')}
      {L(extX, sy1, sx, sy1, 'dw-ext')}
      {L(extX, sy2, sx, sy2, 'dw-ext')}
      {arrow(sx, sy1, 0, 1)}
      {arrow(sx, sy2, 0, -1)}
      {dtext(sx, (sy1 + sy2) / 2, label, -90)}
    </g>
  );
}

// dimH — 横寸法（sx1〜sx2、寸法線 sy、補助線 extY 始点）
export function dimH(
  sx1: number,
  sx2: number,
  sy: number,
  extY: number,
  label: string,
): JSX.Element {
  return (
    <g key={nextKey('dimH')}>
      {L(sx1, sy, sx2, sy, 'dw-dim')}
      {L(sx1, extY, sx1, sy, 'dw-ext')}
      {L(sx2, extY, sx2, sy, 'dw-ext')}
      {arrow(sx1, sy, -1, 0)}
      {arrow(sx2, sy, 1, 0)}
      {dtext((sx1 + sx2) / 2, sy, label, 0)}
    </g>
  );
}

// leader(px,py,lx,ly,label,a) — 引出線。a 省略時は 'start'。
export function leader(
  px: number,
  py: number,
  lx: number,
  ly: number,
  label: string,
  a: Anchor = 'start',
): JSX.Element {
  const tx = a === 'start' ? lx + 24 : lx - 24;
  return (
    <g key={nextKey('leader')}>
      {C(px, py, 9, 'dw-ldot')}
      {PL(`${f(px)},${f(py)} ${f(lx)},${f(ly)}`, 'dw-llead')}
      {TX(tx, ly, label, 'dw-lbl', a)}
    </g>
  );
}

// SVG(W,H,body) — STYLE は drawing.css に分離済みのため出力しない。
export function SVG(W: number, H: number, body: ReactNode): JSX.Element {
  return (
    <svg
      viewBox={`0 0 ${f(W)} ${f(H)}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {body}
    </svg>
  );
}
