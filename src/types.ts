export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastActiveAt: string;
}

export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm';

export interface ChatMessage {
  id: string;
  reflectionId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  mode?: ReflectionMode;
  timestamp: string;
}

export interface JournalReflection {
  id: string;
  userId: string;
  title: string;
  category: 'Daily Log' | 'Deep Reflection' | 'Idea Brainstorm' | 'Work & Focus' | 'Mindfulness';
  initialPrompt: string;
  summary: string;
  brainstormIdeas: string[];
  keyInsights: string[];
  turnCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface GrowthTheme {
  name: string;
  description: string;
  frequency: number;
}

export interface GrowthTrendItem {
  date: string;
  tone: 'positive' | 'neutral' | 'challenging';
  score: number;
}

export type GrowthStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface GrowthExperiment {
  id: string;
  goal: string;
  action: string;
  targetFrequency: string;
  timeframe: string;
  successSignal: string;
  status: GrowthStatus;
  statusNote?: string;
  skipCount?: number;
  completionCount?: number;
  lastUpdatedDate?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  history?: Array<{
    date: string;
    status: GrowthStatus;
    note?: string;
  }>;
}

export interface GrowthFocus {
  theme: string;
  reason: string;
  frequency: number;
}

export interface GrowthComparison {
  observation: string;
  category: 'theme_shift' | 'tone_improvement' | 'blocker' | 'execution' | 'new_interest';
  detail: string;
  direction?: 'up' | 'stable' | 'down' | 'challenge';
}

export interface GeminiPerspective {
  patternDetected: string;
  evidence: string;
  interpretation: string;
  recommendation: string;
}

export interface SuggestedFocusDetail {
  focus: string;
  why: string;
  actionText: string;
}

export interface WeeklyGrowthReview {
  focus: string;
  progress: string;
  recurringBlocker: string;
  completedItems: string;
  nextRecommendedExperiment: string;
  guardianInsight?: string;
}

// Growth Guardian Notification Types
export type GrowthGuardianNotificationType =
  | 'MISSED_REFLECTION'
  | 'EXPERIMENT_DUE'
  | 'REPEATED_SKIP'
  | 'POSITIVE_MOMENTUM'
  | 'PLAN_ADAPTATION'
  | 'RECOVERING_MOMENTUM';

export type GrowthGuardianState =
  | 'healthy_momentum'
  | 'building_momentum'
  | 'needs_attention'
  | 'stalled'
  | 'recovering'
  | 'plan_adaptation_recommended'
  | 'idle';

export interface GrowthGuardianStatus {
  state: GrowthGuardianState;
  headline: string;
  message: string;
  notificationType: GrowthGuardianNotificationType;
  skipCount: number;
  completionCount: number;
  needsAdaptation: boolean;
  adaptedSuggestion?: {
    action: string;
    targetFrequency: string;
    timeframe: string;
    rationale: string;
  };
  todayAction?: string;
  evidenceExplanation?: string;
  contextPrompt?: string;
  lastEvaluatedAt?: string;
}

export interface GrowthCheckIn {
  id: string;
  userId: string;
  experimentId?: string;
  outcome: 'done' | 'partially_done' | 'skipped';
  notes?: string;
  energyLevel?: 'high' | 'medium' | 'low';
  difficulty?: 'easy' | 'moderate' | 'hard';
  whatHelped?: string;
  whatGotInWay?: string;
  evaluation?: CheckInEvaluation;
  createdAt: string;
}

export interface CheckInEvaluation {
  verdict: string;
  feedback: string;
  momentumShift: 'improved' | 'steady' | 'declined';
  recommendedExperimentStatus: GrowthStatus;
  suggestedNextAction?: string;
  isAdaptiveRecoveryRecommended: boolean;
  adaptivePlanReason?: string;
  adaptedAction?: string;
}

export interface GrowthInsights {
  themes: GrowthTheme[];
  trend: GrowthTrendItem[];
  summary: string;
  suggestedFocus: string;
  suggestedFocusDetail?: SuggestedFocusDetail;
  geminiPerspective?: GeminiPerspective;
  currentFocus?: GrowthFocus;
  currentExperiment?: GrowthExperiment;
  todayAction?: string;
  whatChanged?: GrowthComparison[];
  weeklyReview?: WeeklyGrowthReview;
  growthSignal?: string;
  guardianStatus?: GrowthGuardianStatus;
}

export interface NotificationSettings {
  enabled: boolean;
  growthGuardianEnabled?: boolean;
  reminderTime: string; // e.g. "20:00"
  frequency: 'daily' | 'weekdays';
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "08:00"
  lastNudgeDate?: string; // e.g. "2026-09-01"
  snoozedUntil?: string; // ISO string for temporary snooze
}

export interface GenerateGeminiRequest {
  prompt: string;
  mode: ReflectionMode;
  contextHistory?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
  entryTitle?: string;
}

export interface GenerateGeminiResponse {
  reply: string;
  summary?: string;
  brainstormIdeas?: string[];
  keyInsights?: string[];
  suggestedFollowUps?: string[];
  modelUsed: string;
}
