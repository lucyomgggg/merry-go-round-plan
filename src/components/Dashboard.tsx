// Dashboard.tsx — 左サイドパネル。表示モード切替・ステップ一覧・現在ステップ説明・表示オプション。
import { useStore } from '../store';
import { stepData } from '../stepData';
import { TOTAL_STEPS } from '../spec';

function StepListItem({
  value,
  label,
  step,
  onSelect,
}: {
  value: number;
  label: string;
  step: number;
  onSelect: (n: number) => void;
}) {
  const state = value < step ? ' done' : value === step ? ' current' : '';
  return (
    <button className={`step-list-item${state}`} onClick={() => onSelect(value)}>
      <span className="sli-num">{value}</span>
      <span className="sli-title">{label}</span>
    </button>
  );
}

export function Dashboard({ collapsed }: { collapsed: boolean }) {
  const step = useStore((s) => s.step);
  const setStep = useStore((s) => s.setStep);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const rotation = useStore((s) => s.rotation);
  const decorations = useStore((s) => s.decorations);
  const dimensions = useStore((s) => s.dimensions);
  const wood = useStore((s) => s.wood);
  const toggleRotation = useStore((s) => s.toggleRotation);
  const toggleDecorations = useStore((s) => s.toggleDecorations);
  const toggleDimensions = useStore((s) => s.toggleDimensions);
  const toggleWood = useStore((s) => s.toggleWood);

  const current = step === 0 ? null : stepData[step - 1];

  return (
    <aside className={`step-panel${collapsed ? ' collapsed' : ''}`}>
      <div className="step-header-row">
        <span className="step-counter">
          STEP <span className="num">{step}</span> / {TOTAL_STEPS}
        </span>
        <span className="v6-badge">V6</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      <div className="view-mode-switch">
        <button
          className={`vm-btn${viewMode === '3d' ? ' active' : ''}`}
          onClick={() => setViewMode('3d')}
        >
          3Dモデル
        </button>
        <button
          className={`vm-btn${viewMode === 'drawing' ? ' active' : ''}`}
          onClick={() => setViewMode('drawing')}
        >
          図面
        </button>
      </div>

      <div className="step-list">
        <StepListItem value={0} label="開始前" step={step} onSelect={setStep} />
        {stepData.map((sd, i) => (
          <StepListItem key={i} value={i + 1} label={sd.title} step={step} onSelect={setStep} />
        ))}
      </div>

      {current ? (
        <>
          <h2 className="step-title">{current.title}</h2>
          <p className="step-desc">{current.desc}</p>
          <div className="step-detail">
            <span className="label">POINT</span>
            {current.detail}
          </div>
          <div className="parts-mini">
            <span className="key">PARTS</span> {current.parts}
          </div>
        </>
      ) : (
        <>
          <h2 className="step-title">開始前</h2>
          <p className="step-desc">
            上の一覧から段階を選んでください。全 {TOTAL_STEPS} 段階で完成します。
          </p>
        </>
      )}

      <div className="toggle-section">
        <div className="toggle-label">表示オプション</div>
        <div className="toggle-row">
          <button
            className={`toggle-btn${dimensions ? ' active' : ''}`}
            onClick={toggleDimensions}
          >
            寸法
          </button>
          <button className={`toggle-btn${rotation ? ' active' : ''}`} onClick={toggleRotation}>
            回転
          </button>
          <button
            className={`toggle-btn${decorations ? ' active' : ''}`}
            onClick={toggleDecorations}
          >
            装飾品
          </button>
          <button className={`toggle-btn${wood ? ' active' : ''}`} onClick={toggleWood}>
            木材
          </button>
        </div>
      </div>
    </aside>
  );
}
