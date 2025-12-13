export interface Step {
  id: number;
  title: string;
  description: string;
  visualPrompt: string;
  reasoning: string;
  focusBox: number[]; // [ymin, xmin, ymax, xmax] in 0-100 percentage
  imageUrl?: string;
  isGeneratingImage: boolean;
}

export interface AnalysisResult {
  objectName: string;
  description: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GOAL_INPUT = 'GOAL_INPUT',
  PLANNING = 'PLANNING',
  RESULTS = 'RESULTS'
}
