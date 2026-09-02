import {
  Experiment,
  CheckIn,
  MomentumState,
  NotificationSettings,
  Reflection,
} from '../types.ts';

export interface GuardianAssessment {
  momentumState: MomentumState;
  score: number; // 0 - 100
  recommendation: string;
  isStalled: boolean;
  needsAdaptation: boolean;
  consecutiveSkips: number;
  recentCompletionRate: number;
  reflectionStreak: number;
}

/**
 * Calculates reflection streak
 */
export function calculateReflectionStreak(reflections: Reflection[]): number {
  if (!reflections || reflections.length === 0) return 0;

  const dates = Array.from(
    new Set(
      reflections.map(r => new Date(r.createdAt).toISOString().split('T')[0])
    )
  ).sort().reverse();

  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const mostRecent = dates[0];
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0; // streak broken
  }

  let streak = 1;
  let curr = new Date(mostRecent);

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak++;
      curr = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Comprehensive Growth Guardian momentum analysis
 */
export function assessGrowthMomentum(
  activeExperiment: Experiment | null,
  recentCheckIns: CheckIn[],
  reflections: Reflection[]
): GuardianAssessment {
  const reflectionStreak = calculateReflectionStreak(reflections);

  if (!activeExperiment) {
    return {
      momentumState: reflectionStreak > 0 ? 'building' : 'needs_attention',
      score: Math.min(reflectionStreak * 20, 60),
      recommendation: 'Choose or generate a 7-day micro-experiment to turn your journal reflections into daily action.',
      isStalled: false,
      needsAdaptation: false,
      consecutiveSkips: 0,
      recentCompletionRate: 0,
      reflectionStreak,
    };
  }

  // Filter checkins for this experiment
  const expCheckins = recentCheckIns
    .filter(c => c.experimentId === activeExperiment.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Count consecutive recent skips
  let consecutiveSkips = 0;
  for (const c of expCheckins) {
    if (c.outcome === 'skipped') {
      consecutiveSkips++;
    } else {
      break;
    }
  }

  // Last 5 checkins rate
  const last5 = expCheckins.slice(0, 5);
  const doneCount = last5.filter(c => c.outcome === 'done').length;
  const partialCount = last5.filter(c => c.outcome === 'partially_done').length;
  const effectiveRate = last5.length > 0 ? (doneCount + partialCount * 0.5) / last5.length : 0.5;

  const isStalled = consecutiveSkips >= 2 || (last5.length >= 3 && effectiveRate < 0.35);
  const needsAdaptation = isStalled || consecutiveSkips >= 2;

  let momentumState: MomentumState = 'healthy';
  let recommendation = 'Your momentum is strong! Keep building on this consistent rhythm.';
  let score = 85;

  if (needsAdaptation) {
    momentumState = 'stalled';
    score = 35;
    recommendation = `We noticed high friction with "${activeExperiment.title}". Let's downsize this to a 15-minute micro-habit to restore ease and consistency.`;
  } else if (effectiveRate < 0.6 || reflectionStreak === 0) {
    momentumState = 'needs_attention';
    score = 60;
    recommendation = 'You are making progress, but encountering minor friction. Try checking in right after your focus session today.';
  } else if (activeExperiment.completedDays >= 5) {
    momentumState = 'healthy';
    score = 95;
    recommendation = `Outstanding execution! You've completed ${activeExperiment.completedDays}/${activeExperiment.targetDays} days. You are ready to lock in this habit.`;
  } else {
    momentumState = 'building';
    score = 75;
    recommendation = 'Solid foundational effort. Focus on completing today’s micro-step with zero pressure for perfection.';
  }

  return {
    momentumState,
    score,
    recommendation,
    isStalled,
    needsAdaptation,
    consecutiveSkips,
    recentCompletionRate: Math.round(effectiveRate * 100),
    reflectionStreak,
  };
}

/**
 * Check if the current time falls in user quiet hours
 */
export function isCurrentlyQuietHours(settings: NotificationSettings): boolean {
  if (!settings.enabled) return true;

  // Check snooze
  if (settings.snoozedUntil) {
    const snoozeTime = new Date(settings.snoozedUntil).getTime();
    if (Date.now() < snoozeTime) {
      return true;
    }
  }

  const currentHour = new Date().getHours();
  const start = settings.quietHoursStart; // e.g. 22
  const end = settings.quietHoursEnd; // e.g. 8

  if (start > end) {
    // Overnight quiet hours: 22 to 8
    return currentHour >= start || currentHour < end;
  } else {
    // Same day quiet hours
    return currentHour >= start && currentHour < end;
  }
}
