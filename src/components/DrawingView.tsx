// DrawingView.tsx — 図面ビュー。
// 立面図・平面図・部品詳細図を縦に並べる。寸法はすべて SPEC 連動で3Dモデルとズレない。
import type { ReactNode } from 'react';
import { useStore } from '../store';
import { elevation } from '../drawing/Elevation';
import { plan } from '../drawing/Plan';
import { details } from '../drawing/Details';
import '../drawing/drawing.css';

function Sheet({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="dwg-sheet">
      <div className="dwg-sheet-title">{title}</div>
      <div className="dwg-sheet-sub">{sub}</div>
      {children}
    </div>
  );
}

export function DrawingView() {
  const step = useStore((s) => s.step);

  if (step <= 0) {
    return (
      <div className="drawing-view">
        <div className="dwg-empty">
          図面はステップ1以降で表示されます。
          <br />
          左の一覧から組み立て段階を選んでください。
        </div>
      </div>
    );
  }

  const sub = `単位 mm ／ 寸法は SPEC 連動（3Dモデルと共通）／ 現在 STEP ${step} まで`;
  return (
    <div className="drawing-view">
      <Sheet title="ELEVATION 立面図" sub={sub}>
        {elevation(step)}
      </Sheet>
      <Sheet title="PLAN 平面図" sub={sub}>
        {plan(step)}
      </Sheet>
      {details(step)}
    </div>
  );
}
