import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Shield,
  ChevronRight,
  Award,
  RefreshCw,
} from 'lucide-react';
import {
  Experiment,
  CheckIn,
  Reflection,
  GrowthTheme,
  WeeklyReview,
  NotificationSettings,
} from '../types.ts';
import { assessGrowthMomentum } from '../lib/growthGuardian.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface GrowthDashboardProps {
  activeExperiment: Experiment | null;
  experiments: Experiment[];
  checkIns: CheckIn[];
  reflections: Reflection[];
  weeklyReviews: WeeklyReview[];
  settings: NotificationSettings;
  onOpenCheckIn: (outcome?: 'done' | 'partially_done' | 'skipped') => void;
  onAdaptPlan: () => void;
  onSelectReflection: (id: string) => void;
  onGenerateGrowthThemes: () => Promise<void>;
  onGenerateWeeklyReview: () => Promise<void>;
  themes: GrowthTheme[];
  themesLoading: boolean;
  weeklyReviewLoading: boolean;
}

export const GrowthDashboard: React.FC<GrowthDashboardProps> = ({
  activeExperiment,
  experiments,
  checkIns,
  reflections,
  weeklyReviews,
  settings: _settings,
  onOpenCheckIn,
  onAdaptPlan,
  onSelectReflection,
  onGenerateGrowthThemes,
  onGenerateWeeklyReview,
  themes,
  themesLoading,
  weeklyReviewLoading,
}) => {
  const { currentTheme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'themes' | 'reviews' | 'history'>('overview');

  const assessment = assessGrowthMomentum(activeExperiment, checkIns, reflections);

  // Today check-in status
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find(c => c.date === todayStr);

  const completedExperimentsCount = experiments.filter(e => e.status === 'completed' || e.completedDays >= e.targetDays).length;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${currentTheme.accentText} mb-1`}>
            <TrendingUp className="w-4 h-4" />
            <span>Continuous Personal Growth</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-slate-100">
            My Growth Hub
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-0.5">
            Connecting honest reflection to daily action, pattern discovery, and adaptive momentum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-growth-patterns-btn"
            onClick={onGenerateGrowthThemes}
            disabled={themesLoading || reflections.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-slate-200 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${themesLoading ? `animate-spin ${currentTheme.iconAccent}` : ''}`} />
            <span>{themesLoading ? 'Synthesizing...' : 'Analyze Patterns'}</span>
          </button>

          <button
            id="generate-weekly-review-btn"
            onClick={onGenerateWeeklyReview}
            disabled={weeklyReviewLoading || reflections.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl ${currentTheme.primaryBtn} text-xs font-semibold transition-colors shadow-sm disabled:opacity-50`}
          >
            <Award className="w-3.5 h-3.5 text-white/90" />
            <span>{weeklyReviewLoading ? 'Compiling Review...' : 'Weekly Review'}</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 font-medium mb-1">
            <span>Reflection Streak</span>
            <Flame className={`w-4 h-4 ${currentTheme.iconAccent}`} />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-slate-100">
            {assessment.reflectionStreak} <span className="text-xs font-normal text-stone-500 dark:text-slate-400">days</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 font-medium mb-1">
            <span>Total Reflections</span>
            <Calendar className="w-4 h-4 text-stone-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-slate-100">
            {reflections.length} <span className="text-xs font-normal text-stone-500 dark:text-slate-400">entries</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 font-medium mb-1">
            <span>Daily Check-ins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-slate-100">
            {checkIns.length} <span className="text-xs font-normal text-stone-500 dark:text-slate-400">logs</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 font-medium mb-1">
            <span>Completed Habits</span>
            <Award className={`w-4 h-4 ${currentTheme.iconAccent}`} />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-slate-100">
            {completedExperimentsCount} <span className="text-xs font-normal text-stone-500 dark:text-slate-400">habits</span>
          </div>
        </div>
      </div>

      {/* Growth Guardian Status Card */}
      <div className={`p-5 rounded-2xl border shadow-sm ${
        assessment.needsAdaptation
          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
          : assessment.momentumState === 'healthy'
          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
          : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              assessment.needsAdaptation
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                : `${currentTheme.primaryBtn}`
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">Growth Guardian Evaluation</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  assessment.momentumState === 'healthy'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : assessment.momentumState === 'stalled'
                    ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                }`}>
                  Momentum: {assessment.momentumState.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-medium text-stone-900 dark:text-slate-100 mt-1 leading-snug">
                {assessment.recommendation}
              </p>
            </div>
          </div>

          {assessment.needsAdaptation && (
            <button
              id="dashboard-adapt-plan-btn"
              onClick={onAdaptPlan}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors shadow-sm shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Right-Size to 15-Min Habit</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`pb-3 px-3 transition-all border-b-2 -mb-px ${
            selectedTab === 'overview'
              ? `${currentTheme.activeTabBorder} ${currentTheme.activeTabText}`
              : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
          }`}
        >
          Today's Action &amp; Active Habit
        </button>

        <button
          onClick={() => setSelectedTab('themes')}
          className={`pb-3 px-3 transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
            selectedTab === 'themes'
              ? `${currentTheme.activeTabBorder} ${currentTheme.activeTabText}`
              : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Discovered Growth Patterns</span>
          {themes.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText} text-[10px]`}>
              {themes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSelectedTab('reviews')}
          className={`pb-3 px-3 transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
            selectedTab === 'reviews'
              ? `${currentTheme.activeTabBorder} ${currentTheme.activeTabText}`
              : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Weekly Reviews</span>
          {weeklyReviews.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-[10px]">
              {weeklyReviews.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSelectedTab('history')}
          className={`pb-3 px-3 transition-all border-b-2 -mb-px ${
            selectedTab === 'history'
              ? `${currentTheme.activeTabBorder} ${currentTheme.activeTabText}`
              : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
          }`}
        >
          Check-in Log
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {activeExperiment ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
                      Active 7-Day Experiment
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400 capitalize">
                      Category: {activeExperiment.category}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-slate-100">
                    {activeExperiment.title}
                  </h3>
                </div>

                {todayCheckIn ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Checked in today ({todayCheckIn.outcome.replace('_', ' ')})</span>
                  </div>
                ) : (
                  <button
                    id="dashboard-record-checkin-btn"
                    onClick={() => onOpenCheckIn()}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${currentTheme.primaryBtn} text-xs font-semibold transition-colors shadow-sm`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Record Today's Check-in</span>
                  </button>
                )}
              </div>

              <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                {activeExperiment.description}
              </p>

              {/* Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-slate-300">
                  <span>Consistency Progress</span>
                  <span>{activeExperiment.completedDays} of {activeExperiment.targetDays} Days Completed</span>
                </div>
                <div className="w-full h-3 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full ${currentTheme.progressBg} transition-all rounded-full`}
                    style={{
                      width: `${Math.min((activeExperiment.completedDays / activeExperiment.targetDays) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Habit Adaptations History */}
              {activeExperiment.adaptationsHistory && activeExperiment.adaptationsHistory.length > 0 && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 text-xs space-y-1.5">
                  <div className={`font-semibold ${currentTheme.accentText} flex items-center gap-1`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Growth Guardian Adaptations:</span>
                  </div>
                  {activeExperiment.adaptationsHistory.map((adapt, idx) => (
                    <div key={idx} className="text-stone-600 dark:text-slate-400">
                      &bull; <span className="font-medium text-stone-800 dark:text-slate-200">{new Date(adapt.date).toLocaleDateString()}:</span> Downsized from &ldquo;{adapt.previousTitle}&rdquo; &mdash; {adapt.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl ${currentTheme.accentBg} ${currentTheme.accentText} flex items-center justify-center mx-auto`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-slate-100">No Active Experiment</h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto">
                Turn your journal entries into measurable progress. Open any reflection and click "Convert to 7-Day Experiment".
              </p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'themes' && (
        <div className="space-y-4">
          {themes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm text-stone-500 dark:text-slate-400">
                No patterns analyzed yet. Click "Analyze Patterns" above to discover recurring themes across your reflections.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map(theme => (
                <div key={theme.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                      {theme.category}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                      Appeared in {theme.frequency} entries
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-stone-900 dark:text-slate-100">
                    {theme.title}
                  </h4>

                  <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                    {theme.summary}
                  </p>

                  <div className={`p-3 rounded-xl ${currentTheme.accentBg} border ${currentTheme.accentBorder} text-xs text-stone-800 dark:text-slate-200`}>
                    <span className={`font-bold ${currentTheme.accentText} block mb-0.5`}>Actionable Growth Tip:</span>
                    {theme.actionableTip}
                  </div>

                  {theme.relatedReflectionIds && theme.relatedReflectionIds.length > 0 && (
                    <div className="pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-stone-400 dark:text-slate-500">Related reflections</span>
                      <button
                        onClick={() => onSelectReflection(theme.relatedReflectionIds[0])}
                        className={`${currentTheme.accentText} font-semibold hover:underline flex items-center gap-0.5`}
                      >
                        <span>View source</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'reviews' && (
        <div className="space-y-4">
          {weeklyReviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm text-stone-500 dark:text-slate-400">
                No weekly reviews generated yet. Click "Weekly Review" at the top to compile your progress retrospective.
              </p>
            </div>
          ) : (
            weeklyReviews.map(review => (
              <div key={review.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400 pb-2 border-b border-stone-100 dark:border-slate-800">
                  <span className="font-bold text-stone-700 dark:text-slate-300">
                    Week of {new Date(review.weekStartDate).toLocaleDateString()} &ndash; {new Date(review.weekEndDate).toLocaleDateString()}
                  </span>
                  <span>{review.reflectionsCount} reflections &bull; {review.totalCheckInsCount} check-ins</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Key Wins &amp; Breakthroughs</h5>
                    <ul className="text-xs sm:text-sm text-stone-700 dark:text-slate-300 space-y-1.5">
                      {review.keyWins.map((win, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Recurring Friction &amp; Blockers</h5>
                    <ul className="text-xs sm:text-sm text-stone-700 dark:text-slate-300 space-y-1.5">
                      {review.recurringBlockers.map((blocker, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {review.nextRecommendedExperiment && (
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs space-y-1">
                    <span className="font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">Next Suggested Experiment:</span>
                    <div className="font-medium text-stone-900 dark:text-slate-100">{review.nextRecommendedExperiment.title}</div>
                    <p className="text-stone-600 dark:text-slate-400">{review.nextRecommendedExperiment.description}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="space-y-3">
          {checkIns.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center text-sm text-stone-500 dark:text-slate-400">
              No check-ins recorded yet.
            </div>
          ) : (
            checkIns.map(checkIn => (
              <div key={checkIn.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-stone-900 dark:text-slate-100">{checkIn.experimentTitle}</span>
                    <span className="text-stone-400 dark:text-slate-500">&bull; {new Date(checkIn.date).toLocaleDateString()}</span>
                  </div>
                  {checkIn.notes && <p className="text-stone-600 dark:text-slate-400 italic">&ldquo;{checkIn.notes}&rdquo;</p>}
                  {checkIn.feedback && <p className={`${currentTheme.accentText} mt-1`}>{checkIn.feedback}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md font-semibold capitalize ${
                    checkIn.outcome === 'done'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : checkIn.outcome === 'partially_done'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  }`}>
                    {checkIn.outcome.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 capitalize">
                    {checkIn.energyLevel} energy
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
