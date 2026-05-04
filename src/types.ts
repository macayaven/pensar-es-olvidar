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
  date: string;
  time: string;
  scene_id: string;
  caption: string;
  digit: number;
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
    justification: string;
  };
  miras: {
    specificity: number;
    generalization: number;
    coherence: number;
    understanding: number;
    justification: string;
  };
  verdict: string;
}

export type AppPhase = 'prologue' | 'reel' | 'trial' | 'verdict';
