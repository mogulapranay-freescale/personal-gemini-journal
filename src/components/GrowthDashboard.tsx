import React, { useState, useEffect } from 'react';
import {
  JournalReflection,
  GrowthInsights,
  GrowthExperiment,
  GrowthStatus,
  CheckInEvaluation,
  GrowthCheckIn,
  GrowthTheme,
} from '../types';
import { evaluateGrowthGuardian, deriveTodayAction } from '../lib/growthGuardian';
import { saveGrowthCheckIn } from '../lib/firestoreService';
import { CheckInModal } from './CheckInModal';
import {
  Sparkles,
  RefreshCw,
  Flame,
  BookOpen,
  Calendar,
  TrendingUp,
  Lightbulb,
  Brain,
  Target,
  AlertCircle,
  CheckCircle,
  Smile,
  Meh,
  Frown,
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  BarChart3,
  Repeat,
  Bell,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  ArrowUpRight,
  Minus,
  HelpCircle,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface GrowthDashboardProps {
  userId?: string;
  reflections: JournalReflection[];
  activeExperiment: GrowthExperiment | null;
  onUpdateExperiment: (experiment: GrowthExperiment) => Promise<void>;
  onStartNewWithPrompt: (prompt: string, category?: string) => void;
  onStartNew: () => void;
  onOpenReminders?: () => void;
  onSelectReflection?: (reflection: JournalReflection) => void;
}

export const GrowthDashboard: React.FC<GrowthDashboardProps> = ({
  userId,
  reflections,
  activeExperiment,
  onUpdateExperiment,
  onStartNewWithPrompt,
  onStartNew,
  onOpenReminders,
  onSelectReflection,
}) => {
  const [insights, setInsights] = useState<GrowthInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<GrowthTheme | null>(null);

  // Local stats from actual Firestore reflections
  const totalReflections = reflections.length;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const last7DaysCount = reflections.filter(
    (r) => new Date(r.createdAt || r.updatedAt) >= sevenDaysAgo
  ).length;
  const last30DaysCount = reflections.filter(
    (r) => new Date(r.createdAt || r.updatedAt) >= thirtyDaysAgo
  ).length;

  // Most used category
  const categoryCounts: Record<string, number> = {};
  reflections.forEach((r) => {
    const cat = r.category || 'Daily Log';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  let mostUsedCategory = 'Daily Log';
  let maxCatCount = 0;
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > maxCatCount) {
      mostUsedCategory = cat;
      maxCatCount = count;
    }
  });

  // Calculate Streak
  const calculateStreak = () => {
    if (reflections.length === 0) return 0;
    const dateSet = new Set<string>();
    reflections.forEach((r) => {
      const d = new Date(r.createdAt || r.updatedAt);
      if (!isNaN(d.getTime())) {
        dateSet.add(d.toISOString().slice(0, 10));
      }
    });

    let streak = 0;
    let checkDate = new Date();
    const todayStr = checkDate.toISOString().slice(0, 10);
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    let startChecking = todayStr;
    if (!dateSet.has(todayStr)) {
      if (dateSet.has(yesterdayStr)) {
        startChecking = yesterdayStr;
      } else {
        return 0;
      }
    }

    checkDate = new Date(startChecking);
    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (dateSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const streakDays = calculateStreak();

  // Current Experiment (prefer from props, or from insights)
  const currentExperiment = activeExperiment || insights?.currentExperiment || null;

  // Today's Action string
  const todayAction = insights?.todayAction || deriveTodayAction(currentExperiment?.action || '30-minute focus session');

  // Evaluate Growth Guardian state
  const guardianState = evaluateGrowthGuardian(reflections, currentExperiment, null);

  // Fetch AI Insights from server
  const fetchInsights = async () => {
    if (reflections.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/growth/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflections,
          currentExperiment: activeExperiment,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data: GrowthInsights = await res.json();
      setInsights(data);

      // If server proposed a new experiment and user didn't have one active, save it
      if (data.currentExperiment && !activeExperiment) {
        onUpdateExperiment(data.currentExperiment).catch(console.error);
      }
    } catch (err: any) {
      console.error('Failed to fetch growth insights:', err);
      setError(err?.message || 'Failed to generate AI insights. Showing basic stats below.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reflections.length > 0 && !insights && !isLoading) {
      fetchInsights();
    }
  }, [reflections.length]);

  // Handle status update of active experiment
  const handleStatusChange = async (newStatus: GrowthStatus, note?: string) => {
    if (!currentExperiment) return;
    setUpdatingStatus(true);
    try {
      const currentSkips = currentExperiment.skipCount || 0;
      const currentCompletions = currentExperiment.completionCount || 0;

      const updated: GrowthExperiment = {
        ...currentExperiment,
        status: newStatus,
        statusNote: note,
        skipCount: newStatus === 'skipped' ? currentSkips + 1 : currentSkips,
        completionCount: newStatus === 'completed' ? currentCompletions + 1 : currentCompletions,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
        history: [
          ...(currentExperiment.history || []),
          {
            date: new Date().toISOString().slice(0, 10),
            status: newStatus,
            note,
          },
        ],
      };
      await onUpdateExperiment(updated);
      if (insights) {
        setInsights({
          ...insights,
          currentExperiment: updated,
          growthSignal:
            newStatus === 'completed'
              ? 'Growth Signal ↑ You moved from planning to consistent execution.'
              : insights.growthSignal,
        });
      }
    } catch (err) {
      console.error('Failed to update experiment status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle adopting recommended experiment as next
  const handleAdoptNextExperiment = async (actionText: string) => {
    setUpdatingStatus(true);
    try {
      const newExp: GrowthExperiment = {
        id: `exp_${Date.now()}`,
        goal: 'Accelerate growth from weekly review',
        action: actionText,
        targetFrequency: '2 sessions this week',
        timeframe: 'Next 7 days',
        successSignal: 'Logged in journal reflections',
        status: 'in_progress',
        skipCount: 0,
        completionCount: 0,
        createdAt: new Date().toISOString(),
      };
      await onUpdateExperiment(newExp);
      if (insights) {
        setInsights({
          ...insights,
          currentExperiment: newExp,
          growthSignal: 'Next growth loop initiated.',
        });
      }
    } catch (err) {
      console.error('Failed to adopt next experiment:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle modal check-in completion
  const handleCompleteCheckIn = async (
    outcome: 'done' | 'partially_done' | 'skipped',
    notes?: string,
    evalData?: CheckInEvaluation
  ) => {
    const statusMap: Record<string, GrowthStatus> = {
      done: 'completed',
      partially_done: 'in_progress',
      skipped: 'skipped',
    };
    const targetStatus = statusMap[outcome] || 'in_progress';
    await handleStatusChange(targetStatus, notes);

    // Save check-in record to Firestore
    if (userId && currentExperiment) {
      try {
        const checkInDoc: GrowthCheckIn = {
          id: `checkin_${Date.now()}`,
          userId,
          experimentId: currentExperiment.id,
          outcome,
          energyLevel: 'medium',
          difficulty: 'moderate',
          notes: notes || '',
          evaluation: evalData,
          createdAt: new Date().toISOString(),
        };
        await saveGrowthCheckIn(userId, checkInDoc);
      } catch (err) {
        console.error('Failed to save growth check-in document:', err);
      }
    }
  };

  // Find reflections matching the selected theme
  const matchingThemeReflections = selectedTheme
    ? reflections.filter((r) => {
        const text = `${r.title} ${r.initialPrompt} ${r.summary || ''} ${r.category || ''}`.toLowerCase();
        const themeKeywords = selectedTheme.name.toLowerCase().split(' ');
        return themeKeywords.some((kw) => kw.length > 3 && text.includes(kw));
      })
    : [];

  return (
    <div id="growth-dashboard" className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-8 max-w-6xl mx-auto w-full">
      {/* Check-In Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        experiment={currentExperiment}
        todayAction={todayAction}
        onCompleteCheckIn={handleCompleteCheckIn}
        onOpenJournalComposer={(prompt, category) => onStartNewWithPrompt(prompt, category)}
        onAdoptAdaptedPlan={handleAdoptNextExperiment}
      />

      {/* Theme Detail Inspection Modal */}
      {selectedTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    Reflection Theme
                  </span>
                  {selectedTheme.frequency && (
                    <span className="text-[11px] font-medium text-slate-400">
                      {selectedTheme.frequency} associated entries
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">{selectedTheme.name}</h3>
                <p className="text-xs text-slate-300 mt-1">{selectedTheme.description}</p>
              </div>

              <button
                onClick={() => setSelectedTheme(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Supporting Journal Reflections ({matchingThemeReflections.length})
              </h4>

              {matchingThemeReflections.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 text-center">
                  Theme synthesized across multiple journal reflections in your history.
                </div>
              ) : (
                matchingThemeReflections.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{ref.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                          {ref.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {ref.summary || ref.initialPrompt}
                      </p>
                      <div className="text-[10px] text-slate-500">
                        {new Date(ref.createdAt || ref.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {onSelectReflection && (
                      <button
                        onClick={() => {
                          setSelectedTheme(null);
                          onSelectReflection(ref);
                        }}
                        className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  const prompt = `Reflecting deeper on my growth theme: "${selectedTheme.name}". Here are some thoughts:`;
                  setSelectedTheme(null);
                  onStartNewWithPrompt(prompt, 'Personal');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reflect on This Theme</span>
              </button>

              <button
                onClick={() => setSelectedTheme(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 border border-violet-500/30 text-violet-300">
              Personal Growth Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Growth Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Understand your reflection patterns and turn them into small, measurable progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenReminders && (
            <button
              onClick={onOpenReminders}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Reminders & Guardian</span>
            </button>
          )}

          <button
            onClick={fetchInsights}
            disabled={isLoading || reflections.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : '✨ Refresh Insights'}</span>
          </button>
        </div>
      </div>

      {/* Visual Growth Loop Cycle Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm hidden md:block">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          <span className="flex items-center gap-1.5 text-indigo-300">
            <Repeat className="w-3.5 h-3.5 text-indigo-400" /> Continuous Accountability Loop
          </span>
          <span className="text-[10px] text-slate-500">Evidence-Grounded Progression</span>
        </div>
        <div className="grid grid-cols-6 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-800/60 border border-indigo-500/30 text-indigo-200 font-semibold flex flex-col items-center justify-center">
            <span className="text-[10px] text-indigo-400 font-bold">1</span>
            <span>Reflect</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 font-medium flex flex-col items-center justify-center">
            <span className="text-[10px] text-violet-400 font-bold">2</span>
            <span>Find Patterns</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 font-medium flex flex-col items-center justify-center">
            <span className="text-[10px] text-violet-400 font-bold">3</span>
            <span>Small Action</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 font-medium flex flex-col items-center justify-center">
            <span className="text-[10px] text-emerald-400 font-bold">4</span>
            <span>Daily Check-In</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 font-medium flex flex-col items-center justify-center">
            <span className="text-[10px] text-amber-400 font-bold">5</span>
            <span>Measure Progress</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 font-medium flex flex-col items-center justify-center">
            <span className="text-[10px] text-teal-400 font-bold">6</span>
            <span>Adapt & Grow</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-950/50 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {totalReflections === 0 && (
        <div className="text-center py-16 px-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No reflections recorded yet</h3>
          <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
            Start writing reflections to unlock your personal growth loop, recurring themes, and actionable focus.
          </p>
          <button
            onClick={onStartNew}
            className="mt-6 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Create First Reflection
          </button>
        </div>
      )}

      {totalReflections > 0 && (
        <>
          {/* ======================================================== */}
          {/* 1. TODAY / CURRENT ACTION - THE MAIN FOCAL POINT */}
          {/* ======================================================== */}
          <section id="today-action-section" className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">Today's Focus & Action</h2>
              </div>
              {insights?.growthSignal && (
                <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{insights.growthSignal}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Card 1: What am I working on? (Current Growth Focus) */}
              <div className="bg-slate-900/90 border border-indigo-900/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      What Am I Working On?
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                      {insights?.currentFocus?.frequency || maxCatCount} entries
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {insights?.currentFocus?.theme || `${mostUsedCategory} Focus`}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {insights?.currentFocus?.reason ||
                      `Derived from ${reflections.length} journal reflections in your Firestore workspace.`}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  Recurring priority identified from your journal history.
                </div>
              </div>

              {/* Card 2 & 3: What should I do today? (Today's Action & Check-In) */}
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      What Should I Do Today?
                    </span>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${
                          currentExperiment?.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : currentExperiment?.status === 'in_progress'
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                            : currentExperiment?.status === 'skipped'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {currentExperiment?.status === 'not_started'
                          ? 'Not Started'
                          : currentExperiment?.status === 'in_progress'
                          ? 'In Progress'
                          : currentExperiment?.status === 'completed'
                          ? 'Completed'
                          : currentExperiment?.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Today's Action Banner */}
                  <div className="p-4 rounded-xl bg-slate-800/70 border border-indigo-500/30 mb-3">
                    <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      🎯 Today's Action
                    </div>
                    <p className="text-base font-bold text-white leading-relaxed">
                      {todayAction}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Full goal: {currentExperiment?.action || 'Structured daily focus session.'}
                    </p>
                  </div>

                  {/* Criteria Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-indigo-400" /> Target Criteria
                      </div>
                      <div className="text-slate-200 font-semibold mt-0.5 truncate">
                        {currentExperiment?.targetFrequency || '2 sessions (30 mins)'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-violet-400" /> Timeframe
                      </div>
                      <div className="text-slate-200 font-semibold mt-0.5 truncate">
                        {currentExperiment?.timeframe || 'Next 7 days'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Flag className="w-3 h-3 text-emerald-400" /> Success Signal
                      </div>
                      <div className="text-slate-200 font-semibold mt-0.5 truncate">
                        {currentExperiment?.successSignal || 'Progress in reflection logs'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Interaction Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsCheckInModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Check In Now</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange('completed')}
                        title="Mark today as Done"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          currentExperiment?.status === 'completed'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-emerald-900/60 text-slate-300 hover:text-emerald-200 border border-slate-700'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Done</span>
                      </button>

                      <button
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange('in_progress')}
                        title="Mark as Partially Done"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          currentExperiment?.status === 'in_progress'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700'
                        }`}
                      >
                        <span>Partial</span>
                      </button>

                      <button
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange('skipped', 'Session skipped from quick action')}
                        title="Mark as Skipped"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          currentExperiment?.status === 'skipped'
                            ? 'bg-slate-700 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span>Skip</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onStartNewWithPrompt(
                        `Growth Check-in: Progress on my current focus "${todayAction}". Here is what I completed today:`,
                        'Work & Focus'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Check In With Journal</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 2. GROWTH GUARDIAN STATUS & ADAPTIVE PLAN RECOVERY */}
          {/* ======================================================== */}
          <section id="growth-guardian-section" className="space-y-4">
            <div
              id="growth-guardian-card"
              className={`p-5 rounded-2xl border shadow-lg ${
                guardianState.state === 'plan_adaptation_recommended' || guardianState.state === 'stalled'
                  ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-amber-500/40'
                  : guardianState.state === 'healthy_momentum'
                  ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/30'
                  : guardianState.state === 'recovering'
                  ? 'bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border-teal-500/30'
                  : 'bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border-indigo-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      guardianState.state === 'plan_adaptation_recommended' || guardianState.state === 'stalled'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : guardianState.state === 'healthy_momentum'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : guardianState.state === 'recovering'
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                        : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    }`}
                  >
                    {guardianState.state === 'plan_adaptation_recommended' || guardianState.state === 'stalled' ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : guardianState.state === 'healthy_momentum' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Compass className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Growth Guardian Status
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          guardianState.state === 'plan_adaptation_recommended' || guardianState.state === 'stalled'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : guardianState.state === 'healthy_momentum'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : guardianState.state === 'recovering'
                            ? 'bg-teal-950 text-teal-300 border border-teal-800'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {guardianState.state === 'plan_adaptation_recommended'
                          ? 'Plan Adaptation Recommended'
                          : guardianState.state === 'healthy_momentum'
                          ? 'Healthy Momentum'
                          : guardianState.state === 'building_momentum'
                          ? 'Building Momentum'
                          : guardianState.state === 'stalled'
                          ? 'Momentum Stalled'
                          : guardianState.state === 'recovering'
                          ? 'Recovering Momentum'
                          : 'Needs Attention'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{guardianState.headline}</h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                      {guardianState.message}
                    </p>
                  </div>
                </div>

                {/* Action Trigger */}
                {guardianState.needsAdaptation && guardianState.adaptedSuggestion ? (
                  <button
                    onClick={() =>
                      handleAdoptNextExperiment(guardianState.adaptedSuggestion!.action)
                    }
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Adopt Right-Sized Plan</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCheckInModalOpen(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check In Now</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 3. PROGRESS & ACTIVITY OVERVIEW */}
          {/* ======================================================== */}
          <section id="progress-overview-section" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Am I Making Progress?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Reflection Streak */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Reflection Streak
                  </span>
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div className="my-4">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-2">
                    <span>{streakDays}</span>
                    <span className="text-sm font-semibold text-amber-400">days active</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Total reflections logged: <strong className="text-slate-200">{totalReflections}</strong>
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                  {streakDays > 0 ? 'Consistent journaling habit maintained.' : 'Write today to start your streak!'}
                </div>
              </div>

              {/* Activity Overview */}
              <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Activity Overview
                  </span>
                  <Calendar className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center my-2">
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                    <div className="text-xl sm:text-2xl font-bold text-white">{last7DaysCount}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Last 7 Days</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                    <div className="text-xl sm:text-2xl font-bold text-white">{last30DaysCount}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Last 30 Days</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
                    <div className="text-xs sm:text-sm font-bold text-indigo-300 truncate mt-1">
                      {mostUsedCategory}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Top Category</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                  Derived directly from your secure Firestore journal records.
                </div>
              </div>
            </div>
          </section>

          {/* Loading Indicator for AI Insights */}
          {isLoading && !insights && (
            <div className="py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Sparkles className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200">Analyzing your reflections...</p>
              <p className="text-xs text-slate-500 mt-1">
                Gemini is synthesizing evidence-based patterns, what changed, and focus recommendations.
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. EVIDENCE-BASED GEMINI PERSPECTIVE & WHAT CHANGED? */}
          {/* ======================================================== */}
          {insights && (
            <section id="insights-perspective-section" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Gemini's Perspective Card (Pattern, Evidence, Interpretation, Recommendation) */}
                <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-base font-bold text-white">🧠 Gemini's Perspective</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        Evidence-Based
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs leading-relaxed">
                      {insights.geminiPerspective ? (
                        <>
                          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                            <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider mb-0.5">
                              🔍 Pattern Detected
                            </div>
                            <div className="text-slate-200 font-medium">
                              {insights.geminiPerspective.patternDetected}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                            <div className="text-[10px] font-bold uppercase text-violet-300 tracking-wider mb-0.5">
                              📋 Evidence in Notes
                            </div>
                            <div className="text-slate-300">
                              {insights.geminiPerspective.evidence}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                            <div className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider mb-0.5">
                              💡 Interpretation
                            </div>
                            <div className="text-slate-300">
                              {insights.geminiPerspective.interpretation}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60">
                            <div className="text-[10px] font-bold uppercase text-indigo-200 tracking-wider mb-0.5">
                              🚀 Recommendation
                            </div>
                            <div className="text-white font-semibold">
                              {insights.geminiPerspective.recommendation}
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-300">{insights.summary}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                    Grounded strictly in your private journal entries.
                  </div>
                </div>

                {/* What Changed? Section */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-base font-bold text-white">What Changed?</h3>
                      </div>
                      <span className="text-[10px] text-slate-400">Directional Shifts</span>
                    </div>

                    {insights.whatChanged && insights.whatChanged.length > 0 ? (
                      <div className="space-y-3">
                        {insights.whatChanged.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                {item.direction === 'up' ? (
                                  <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </div>
                                ) : item.direction === 'challenge' ? (
                                  <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                                    <Minus className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <span className="text-xs font-bold text-white">
                                  {item.observation}
                                </span>
                              </div>
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                {item.category.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed ml-7">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40 text-xs text-slate-400">
                        Keep reflecting. Once you record a few more entries, Growth Loop will identify meaningful shifts and momentum changes.
                      </div>
                    )}

                    {/* Suggested Focus Detail */}
                    {insights.suggestedFocusDetail && (
                      <div className="mt-4 p-4 rounded-xl bg-violet-950/40 border border-violet-800/60">
                        <div className="text-[10px] font-bold uppercase text-violet-300 tracking-wider mb-1 flex items-center justify-between">
                          <span>🎯 Suggested Focus</span>
                          <span className="text-[9px] text-violet-400">Recommendation</span>
                        </div>
                        <p className="text-xs font-semibold text-violet-100">
                          {insights.suggestedFocusDetail.focus}
                        </p>
                        <p className="text-[11px] text-violet-300/80 mt-1">
                          Why: {insights.suggestedFocusDetail.why}
                        </p>
                        <button
                          onClick={() => handleAdoptNextExperiment(insights.suggestedFocusDetail!.focus)}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          <span>{insights.suggestedFocusDetail.actionText || 'Start this experiment'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                    Observational patterns derived from your reflection records.
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 5. WEEKLY GROWTH REVIEW & THEMES */}
              {/* ======================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Weekly Growth Review */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-violet-400" />
                        <h3 className="text-base font-bold text-white">Weekly Growth Review</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-950 text-violet-300 border border-violet-800/60">
                        Weekly Synthesis
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          🎯 What I Focused On
                        </div>
                        <div className="text-slate-200 font-medium mt-0.5">
                          {insights?.weeklyReview?.focus || `${mostUsedCategory} & execution`}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                        <div className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                          📈 What Improved
                        </div>
                        <div className="text-slate-200 font-medium mt-0.5">
                          {insights?.weeklyReview?.progress || 'Consistent journaling and daily clarity'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                        <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                          ⚠️ Recurring Friction / Blocker
                        </div>
                        <div className="text-slate-200 font-medium mt-0.5">
                          {insights?.weeklyReview?.recurringBlocker ||
                            'Balancing focus during demanding workdays'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                        <div className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                          ✅ What Was Completed
                        </div>
                        <div className="text-slate-200 font-medium mt-0.5">
                          {insights?.weeklyReview?.completedItems ||
                            `${reflections.length} journal reflections recorded`}
                        </div>
                      </div>

                      {insights?.weeklyReview?.nextRecommendedExperiment && (
                        <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-violet-300 tracking-wider">
                              🚀 Recommended Next Experiment
                            </div>
                            <div className="text-violet-100 font-medium mt-0.5">
                              {insights.weeklyReview.nextRecommendedExperiment}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleAdoptNextExperiment(
                                insights.weeklyReview!.nextRecommendedExperiment
                              )
                            }
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                          >
                            <span>Adopt</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                    Synthesized from your private journal history.
                  </div>
                </div>

                {/* Right: Themes & Reflection Tone Trend */}
                <div className="space-y-6">
                  {/* Top Themes */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-bold text-white">💡 What You've Been Thinking About</h3>
                    </div>

                    {insights.themes.length === 0 ? (
                      <p className="text-xs text-slate-400">No themes identified yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {insights.themes.map((theme, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedTheme(theme)}
                            className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/50 transition-all flex flex-col justify-between cursor-pointer group shadow-sm"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                  {theme.name}
                                </h4>
                                {theme.frequency && (
                                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                    {theme.frequency} entries
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{theme.description}</p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-indigo-300">
                              <span>Inspect reflections</span>
                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reflection Tone Trend */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white">📈 Reflection Tone Trend</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Smile className="w-3 h-3 text-emerald-400" /> Pos
                        </span>
                        <span className="flex items-center gap-1">
                          <Meh className="w-3 h-3 text-sky-400" /> Neu
                        </span>
                        <span className="flex items-center gap-1">
                          <Frown className="w-3 h-3 text-amber-400" /> Cha
                        </span>
                      </div>
                    </div>

                    {insights.trend.length === 0 ? (
                      <p className="text-xs text-slate-400">No trend data available.</p>
                    ) : (
                      <div className="space-y-2">
                        {insights.trend.slice(0, 4).map((item, idx) => {
                          const toneColor =
                            item.tone === 'positive'
                              ? 'bg-emerald-500'
                              : item.tone === 'challenging'
                              ? 'bg-amber-500'
                              : 'bg-sky-500';

                          const widthPct = Math.max(
                            25,
                            Math.min(100, Math.round((item.score || 0.7) * 100))
                          );

                          return (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between gap-3"
                            >
                              <span className="text-xs font-medium text-slate-300 w-24 truncate">
                                {item.date}
                              </span>
                              <div className="flex-1 max-w-xs bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${toneColor}`}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                              <span
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                                  item.tone === 'positive'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : item.tone === 'challenging'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-sky-950 text-sky-300 border border-sky-800'
                                }`}
                              >
                                {item.tone}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
