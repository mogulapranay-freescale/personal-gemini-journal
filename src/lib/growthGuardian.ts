import {
  GrowthExperiment,
  JournalReflection,
  NotificationSettings,
  GrowthGuardianStatus,
  GrowthGuardianState,
} from '../types';

/**
 * Derives a bite-sized, single-day action from the active experiment
 */
export function deriveTodayAction(experiment: GrowthExperiment | null): string {
  if (!experiment || !experiment.action) {
    return 'Take 5 minutes to write down your top priority for today.';
  }

  const raw = experiment.action.trim();

  // Pattern replacements for specific daily execution
  if (/three\s+(\d+)-minute/i.test(raw)) {
    const match = raw.match(/three\s+(\d+)-minute/i);
    return `Complete one ${match ? match[1] : '25'}-minute focus block on your primary objective.`;
  }
  if (/two\s+(\d+)-minute/i.test(raw)) {
    const match = raw.match(/two\s+(\d+)-minute/i);
    return `Complete one ${match ? match[1] : '30'}-minute session today.`;
  }
  if (/^Complete\s+(\d+)\s+/i.test(raw)) {
    return raw.replace(/^Complete\s+\d+\s+/i, 'Complete one ');
  }
  if (raw.toLowerCase().includes('cloud run')) {
    return 'Complete one 30-minute Cloud Run session.';
  }
  if (raw.length > 80) {
    return raw.slice(0, 80) + '...';
  }
  return raw;
}

export function evaluateGrowthGuardian(
  reflections: JournalReflection[],
  experiment: GrowthExperiment | null,
  settings: NotificationSettings | null
): GrowthGuardianStatus {
  const todayAction = deriveTodayAction(experiment);

  // If no experiment exists yet
  if (!experiment) {
    if (reflections.length === 0) {
      return {
        state: 'idle',
        headline: 'Growth Guardian Ready',
        message: 'Record your first reflection to initialize your personal growth accountability loop.',
        notificationType: 'MISSED_REFLECTION',
        skipCount: 0,
        completionCount: 0,
        needsAdaptation: false,
        todayAction: 'Write a 3-minute initial reflection on what matters most to you.',
        evidenceExplanation: 'Awaiting your first journal entry to analyze behavioral patterns.',
        contextPrompt: 'Daily Reflection Check-in: Starting my growth journal practice.',
      };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const journaledToday = reflections.some((r) => (r.createdAt || r.updatedAt || '').slice(0, 10) === todayStr);

    if (!journaledToday) {
      return {
        state: 'needs_attention',
        headline: 'Your reflection space is waiting',
        message: "You haven't recorded a reflection today. Take a quick moment to clear your mind and log your thoughts.",
        notificationType: 'MISSED_REFLECTION',
        skipCount: 0,
        completionCount: 0,
        needsAdaptation: false,
        todayAction: 'Log 1 quick entry in your reflection journal today.',
        evidenceExplanation: `You have ${reflections.length} total entries, but none logged yet today.`,
        contextPrompt: 'Daily Reflection Check-in: What went well, what challenged me, and what I learned today:',
      };
    }

    return {
      state: 'building_momentum',
      headline: 'Building Initial Momentum',
      message: `You've recorded ${reflections.length} reflection entries. Select a Growth Focus to unlock targeted daily accountability.`,
      notificationType: 'POSITIVE_MOMENTUM',
      skipCount: 0,
      completionCount: 0,
      needsAdaptation: false,
      todayAction: 'Select or start your first growth experiment.',
      evidenceExplanation: 'Reflections are active; establishing an experiment will measure concrete progress.',
    };
  }

  // Calculate skip count, completion count, and history analysis
  let skipCount = experiment.skipCount ?? 0;
  let completionCount = experiment.completionCount ?? 0;

  const history = experiment.history || [];
  const recentHistory = history.slice(-7);
  const calculatedSkips = recentHistory.filter((h) => h.status === 'skipped').length;
  const calculatedCompletions = recentHistory.filter((h) => h.status === 'completed').length;
  const calculatedPartials = recentHistory.filter((h) => h.status === 'in_progress').length;

  if (calculatedSkips > skipCount) skipCount = calculatedSkips;
  if (calculatedCompletions > completionCount) completionCount = calculatedCompletions;

  if (experiment.status === 'skipped' && skipCount === 0) skipCount = 1;
  if (experiment.status === 'completed' && completionCount === 0) completionCount = 1;

  // Days since last update
  const lastUpdate = new Date(experiment.updatedAt || experiment.createdAt || Date.now());
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

  const todayStr = now.toISOString().slice(0, 10);
  const journaledToday = reflections.some((r) => (r.createdAt || r.updatedAt || '').slice(0, 10) === todayStr);
  const checkedInToday = history.some((h) => h.date === todayStr);

  const shortAction = experiment.action.replace(/^Complete\s+/i, '').replace(/^Study\s+/i, '');

  // 1. ADAPTIVE PLAN RECOVERY (>= 2 skips or repeated friction)
  if (skipCount >= 2 || experiment.status === 'skipped') {
    return {
      state: 'plan_adaptation_recommended',
      headline: 'Adaptive Plan Recovery',
      message: `The current plan appears too difficult or has been repeatedly skipped (${skipCount >= 2 ? `${skipCount} times` : 'recently'}). Rather than increasing pressure, Growth Guardian recommends a smaller 15-minute version.`,
      notificationType: 'PLAN_ADAPTATION',
      skipCount,
      completionCount,
      needsAdaptation: true,
      todayAction: `Complete a lightweight 15-minute micro-session on ${shortAction || 'your key priority'}.`,
      evidenceExplanation: `Repeated skips (${skipCount}) indicate friction with the current scope. Downsizing restores consistency.`,
      adaptedSuggestion: {
        action: `Spend 15 minutes reviewing ${shortAction || 'your key priority'} (3x/week)`,
        targetFrequency: '3 micro-sessions (15 mins each)',
        timeframe: 'Next 7 days',
        rationale: `Derived from your reflection logs: breaking high-friction commitments into shorter 15-minute intervals reduces barrier to entry and restores momentum.`,
      },
      contextPrompt: `Growth Check-in: I'm adjusting my growth experiment "${experiment.action}" to a lighter 15-minute routine to overcome current friction. Here is how I plan to restart:`,
    };
  }

  // 2. STALLED (No check-ins/updates for > 3 days)
  if (diffDays >= 3 && !checkedInToday && completionCount === 0) {
    return {
      state: 'stalled',
      headline: 'Stalled',
      message: `The current plan appears too difficult or has been repeatedly skipped. A short 10-minute check-in can reactivate your habit.`,
      notificationType: 'EXPERIMENT_DUE',
      skipCount,
      completionCount,
      needsAdaptation: false,
      todayAction: `Spend 10 minutes restarting "${todayAction}".`,
      evidenceExplanation: `No check-ins recorded over the last ${diffDays} days.`,
      contextPrompt: `Growth Check-in: Re-engaging with my experiment "${experiment.action}". Here is what got in the way and how I'm restarting:`,
    };
  }

  // 3. RECOVERING (Recent partials or adapted plan in progress)
  if (calculatedPartials > 0 && skipCount <= 1 && experiment.status === 'in_progress') {
    return {
      state: 'recovering',
      headline: 'Recovering',
      message: `You've restarted after a period of low activity. Focus on rebuilding consistency.`,
      notificationType: 'RECOVERING_MOMENTUM',
      skipCount,
      completionCount,
      needsAdaptation: false,
      todayAction,
      evidenceExplanation: 'Recent check-ins show steady re-engagement after previous challenges.',
      contextPrompt: `Growth Check-in: Tracking recovery momentum on "${experiment.action}":`,
    };
  }

  // 4. HEALTHY MOMENTUM (Completions logged or active streak with check-ins)
  if (experiment.status === 'completed' || completionCount >= 2 || (checkedInToday && experiment.status === 'in_progress')) {
    return {
      state: 'healthy_momentum',
      headline: 'Healthy Momentum',
      message: `You're consistently following through on your current experiment.`,
      notificationType: 'POSITIVE_MOMENTUM',
      skipCount,
      completionCount,
      needsAdaptation: false,
      todayAction,
      evidenceExplanation: 'Your recent reflections indicate consistent progress toward this goal.',
      contextPrompt: `Growth Check-in: Sharing my progress and breakthroughs on "${experiment.action}":`,
    };
  }

  // 5. BUILDING MOMENTUM / NEEDS ATTENTION
  if (!checkedInToday && !journaledToday) {
    return {
      state: 'needs_attention',
      headline: 'Needs Attention',
      message: `Your recent entries suggest some friction. A short check-in may help.`,
      notificationType: 'EXPERIMENT_DUE',
      skipCount,
      completionCount,
      needsAdaptation: false,
      todayAction,
      evidenceExplanation: 'No check-in or reflection recorded for today yet.',
      contextPrompt: `Growth Check-in: Updating progress on experiment "${experiment.action}". Here is what I accomplished today:`,
    };
  }

  return {
    state: 'building_momentum',
    headline: 'Building Momentum',
    message: `You're establishing a consistent rhythm. Keep the next action small.`,
    notificationType: 'POSITIVE_MOMENTUM',
    skipCount,
    completionCount,
    needsAdaptation: false,
    todayAction,
    evidenceExplanation: 'Experiment is active and tracking your daily habits.',
    contextPrompt: `Growth Check-in: Mid-week progress update on "${experiment.action}":`,
  };
}
