// store.ts — アプリ全体の状態（zustand）。
// 現在ステップ・表示モード・各表示トグルを一元管理する。
// アニメーション角度のような毎フレーム値はここに入れず、Scene 内の ref で扱う。
import { create } from 'zustand';
import { TOTAL_STEPS } from './spec';

export type ViewMode = '3d' | 'drawing';

interface AppState {
  /** 現在の組み立てステップ 0..10（0 = 開始前） */
  step: number;
  /** 表示モード: 3Dモデル / 図面 */
  viewMode: ViewMode;
  /** 回転アニメーション ON/OFF */
  rotation: boolean;
  /** 装飾品（馬・スタッフ）表示 */
  decorations: boolean;
  /** 寸法ラベル表示 */
  dimensions: boolean;
  /** 木材（木製パーツ）表示 */
  wood: boolean;

  setStep: (n: number) => void;
  setViewMode: (m: ViewMode) => void;
  toggleRotation: () => void;
  toggleDecorations: () => void;
  toggleDimensions: () => void;
  toggleWood: () => void;
}

export const useStore = create<AppState>((set) => ({
  step: 0,
  viewMode: '3d',
  rotation: true,
  decorations: true,
  dimensions: false,
  wood: true,

  setStep: (n) => set({ step: Math.max(0, Math.min(TOTAL_STEPS, n)) }),
  setViewMode: (m) => set({ viewMode: m }),
  toggleRotation: () => set((s) => ({ rotation: !s.rotation })),
  toggleDecorations: () => set((s) => ({ decorations: !s.decorations })),
  toggleDimensions: () => set((s) => ({ dimensions: !s.dimensions })),
  toggleWood: () => set((s) => ({ wood: !s.wood })),
}));
