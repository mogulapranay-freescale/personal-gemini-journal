import React from 'react';
import {
  Sparkles,
  Flame,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Experiment, CheckIn, NotificationSettings, Reflection } from '../types.ts';
import { assessGrowthMomentum, isCurrentlyQuietHours } from '../lib/growthGuardian.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface SmartNudgeBannerProps {
  activeExperiment: Experiment | null;
  recentCheckIns: CheckIn[];
  reflections: Reflection[];
  settings: NotificationSettings;
  onOpenCheckIn: (outcome?: 'done' | 'partially_done' | 'skipped') => void;
  onAdaptPlan: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

export const SmartNudgeBanner: React.FC<SmartNudgeBannerProps> = ({
  activeExperiment,
  recentCheckIns,
  reflections,
  settings,
  onOpenCheckIn,
  onAdaptPlan,
  onOpenSettings,
  onDismiss,
}) => {
  const { currentTheme } = useTheme();

  if (!settings.enabled) return null;

  const inQuietHours = isCurrentlyQuietHours(settings);
  if (inQuietHours) return null;

  const assessment = assessGrowthMomentum(activeExperiment, recentCheckIns, reflections);

  // Check if user has already checked in today
  const todayStr = new Date().toISOString().split('T')[0];
  const checkedInToday = recentCheckIns.some(c => c.date === todayStr);

  if (checkedInToday && !assessment.needsAdaptation) {
    return null; // All good today!
  }

  return (
    <aside aria-label="Growth Guardian notifications" className={`mb-6 rounded-2xl border bg-gradient-to-r ${currentTheme.bannerGradient} p-4 sm:p-5 shadow-sm`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1">
          <div className={`w-9 h-9 rounded-xl ${currentTheme.badgeBg} ${currentTheme.badgeText} flex items-center justify-center shrink-0 mt-0.5`}>
            {assessment.needsAdaptation ? (
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            ) : (
              <Flame className={`w-5 h-5 ${currentTheme.iconAccent}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider ${currentTheme.badgeBg} ${currentTheme.badgeText} px-2 py-0.5 rounded-md`}>
                Growth Guardian
              </span>
              <span className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Today's Focus</span>
              </span>
            </div>
            <p className="text-sm font-medium text-stone-900 dark:text-slate-100 mt-1 leading-snug">
              {assessment.recommendation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {assessment.needsAdaptation ? (
            <button
              id="guardian-adapt-plan-btn"
              onClick={onAdaptPlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Right-Size to 15-Min Habit</span>
            </button>
          ) : !checkedInToday && activeExperiment ? (
            <div className="flex items-center gap-1.5">
              <button
                id="guardian-quick-done-btn"
                onClick={() => onOpenCheckIn('done')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg ${currentTheme.primaryBtn} shadow-sm`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Done</span>
              </button>
              <button
                id="guardian-quick-checkin-btn"
                onClick={() => onOpenCheckIn()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span>Check In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}

          <button
            onClick={onOpenSettings}
            aria-label="Reminder settings"
            className="p-1.5 text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            title="Reminder settings"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            id="guardian-dismiss-btn"
            onClick={onDismiss}
            aria-label="Dismiss Growth Guardian notification"
            className="p-1.5 text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
