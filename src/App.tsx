// App.tsx — アプリ全体のレイアウト。
// 左：ダッシュボード / 右：3Dビューまたは図面ビュー＋ステップインジケータ。
import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Dashboard } from './components/Dashboard';
import { DrawingView } from './components/DrawingView';
import { SceneCanvas } from './scene/SceneCanvas';

const MOBILE_QUERY = '(max-width: 640px)';

// 画面下中央のステップインジケータ（dots）
function StepIndicator() {
  const step = useStore((s) => s.step);
  const setStep = useStore((s) => s.setStep);
  return (
    <div className="step-indicator-bar">
      {Array.from({ length: 11 }, (_, i) => {
        const state = i < step ? ' done' : i === step ? ' current' : '';
        return (
          <button
            key={i}
            className={`dot${state}`}
            onClick={() => setStep(i)}
            aria-label={`STEP ${i}`}
          />
        );
      })}
    </div>
  );
}

// 操作ヒント（3Dビューのみ）
function Legend() {
  return (
    <div className="panel legend-panel">
      ドラッグで回転 ・ ホイール／ピンチでズーム
    </div>
  );
}

export function App() {
  const viewMode = useStore((s) => s.viewMode);
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  // 画面幅がモバイル域に切り替わったらパネルを自動で折りたたむ
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setCollapsed(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const is3d = viewMode === '3d';

  return (
    <div className="app">
      <button
        className="dashboard-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label="ダッシュボード表示切替"
      >
        {collapsed ? '☰' : '✕'}
      </button>

      <Dashboard collapsed={collapsed} />

      <div className="view-area">
        {/* 3Dビューは常時マウントし、図面表示中は CSS で隠す（WebGL コンテキスト再生成を避ける） */}
        <div className="scene-canvas" style={{ display: is3d ? undefined : 'none' }}>
          <SceneCanvas />
        </div>
        {!is3d && <DrawingView />}
        {is3d && <Legend />}
        <StepIndicator />
      </div>
    </div>
  );
}
