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

export type TrialStage = 'framing' | 'funes' | 'miras' | 'synthesis';

export interface TrialRound {
  question: string;
  funesAnswer: string;
  mirasAnswer: string;
  index?: number;
  stage?: TrialStage;
}

export interface MirasBridge {
  question: string;
  answer: string;
  timestamp: number;
}

export interface JudgeVerdict {
  analysis?: {
    title: string;
    thesis: string;
    evidence: string[];
    funesReading: string;
    mirasReading: string;
    synthesis: string;
    closing: string;
  };
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
