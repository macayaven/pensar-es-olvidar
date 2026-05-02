export interface Scene {
  id: string;
  duration_ms: number;
  background_gradient: string;
  caption: string;
  digit: number;
  digit_position: { x_pct: number; y_pct: number };
  digit_size_px: number;
  digit_color: string;
}

export interface FunesEntry {
  timestamp: number;
  scene_id: string;
  digit: number;
  click_xy: { x: number; y: number };
  reaction_ms: number;
}

export interface TrialRound {
  question: string;
  funesAnswer: string;
  mirasAnswer: string;
}

export interface JudgeVerdict {
  funes: {
    specificity: number;
    generalization: number;
    coherence: number;
    understanding: number;
  };
  miras: {
    specificity: number;
    generalization: number;
    coherence: number;
    understanding: number;
  };
  verdict: string;
}

export type AppPhase = 'prologue' | 'reel' | 'trial' | 'verdict';
