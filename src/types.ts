export type Mood = 'energized' | 'calm' | 'thoughtful' | 'frustrated' | 'overwhelmed' | 'grateful' | 'curious' | 'restless';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Reflection {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: Mood;
  tags?: string[];
  summary?: string;
  keyTakeaways?: string[];
  actionSteps?: string[];
  followUpQuestions?: string[];
  chatHistory?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ExperimentStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface PlanAdaptation {
  date: string;
  previousTitle: string;
  newTitle: string;
  reason: string;
}

export interface Experiment {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'focus' | 'energy' | 'boundaries' | 'mindset' | 'skills' | 'wellness';
  targetDays: number;
  completedDays: number;
  skippedDays: number;
  status: ExperimentStatus;
  streak: number;
  lastCheckInDate?: string;
  reflectionSourceId?: string;
  reflectionSourceTitle?: string;
  adaptationsHistory?: PlanAdaptation[];
  createdAt: string;
  updatedAt: string;
}

export type CheckInOutcome = 'done' | 'partially_done' | 'skipped';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type DifficultyLevel = 'easy' | 'moderate' | 'hard';

export interface CheckIn {
  id: string;
  userId: string;
  experimentId: string;
  experimentTitle: string;
  date: string;
  outcome: CheckInOutcome;
  energyLevel: EnergyLevel;
  difficulty: DifficultyLevel;
  notes?: string;
  feedback?: string;
  createdAt: string;
}

export interface GrowthTheme {
  id: string;
  title: string;
  category: string;
  frequency: number;
  summary: string;
  sampleExcerpts: string[];
  relatedReflectionIds: string[];
  actionableTip: string;
  sentiment?: 'positive' | 'neutral' | 'challenging';
}

export type MomentumState = 'healthy' | 'building' | 'needs_attention' | 'stalled' | 'adapted';

export interface GrowthState {
  userId: string;
  currentStreak: number;
  totalReflections: number;
  totalCheckIns: number;
  activeExperimentId?: string;
  momentumState: MomentumState;
  guardianRecommendation?: string;
  lastReviewDate?: string;
  weeklySummary?: string;
  themes?: GrowthTheme[];
  updatedAt: string;
}

export interface NotificationSettings {
  enabled: boolean;
  guardianAlerts: boolean;
  preferredHour: number; // 0-23
  preferredMinute: number; // 0-59
  frequency: 'daily' | 'weekdays';
  quietHoursStart: number; // e.g. 22 (10 PM)
  quietHoursEnd: number; // e.g. 8 (8 AM)
  snoozedUntil?: string | null;
  updatedAt: string;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  completedExperimentsCount: number;
  totalCheckInsCount: number;
  reflectionsCount: number;
  keyWins: string[];
  recurringBlockers: string[];
  nextRecommendedExperiment?: {
    title: string;
    description: string;
    category: Experiment['category'];
  };
  generatedAt: string;
}
