import React, { useState, useEffect } from 'react';
import { JournalReflection, GrowthInsights } from '../types';
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
} from 'lucide-react';

interface GrowthDashboardProps {
  reflections: JournalReflection[];
  onStartNew: () => void;
}

export const GrowthDashboard: React.FC<GrowthDashboardProps> = ({ reflections, onStartNew }) => {
  const [insights, setInsights] = useState<GrowthInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute local stats from actual Firestore reflections
  const totalReflections = reflections.length;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const last7DaysCount = reflections.filter((r) => new Date(r.createdAt || r.updatedAt) >= sevenDaysAgo).length;
  const last30DaysCount = reflections.filter((r) => new Date(r.createdAt || r.updatedAt) >= thirtyDaysAgo).length;

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

  // Calculate Streak (consecutive days with reflections)
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
    // Check if today or yesterday has a reflection to start streak
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

  // Fetch AI Insights from server
  const fetchInsights = async () => {
    if (reflections.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/growth/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflections }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setInsights(data);
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

  return (
    <div id="growth-dashboard" className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-8 max-w-6xl mx-auto w-full">
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
            Understand your reflection patterns and turn them into meaningful next steps.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={isLoading || reflections.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analyzing...' : '✨ Refresh Insights'}</span>
        </button>
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
            Start writing reflections to unlock your personal growth insights, recurring themes, and actionable focus.
          </p>
          <button
            onClick={onStartNew}
            className="mt-6 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Create First Reflection
          </button>
        </div>
      )}

      {totalReflections > 0 && (
        <>
          {/* Top Row: Streak & Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Reflection Streak */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reflection Streak</span>
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div className="my-4">
                <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-baseline gap-2">
                  <span>{streakDays}</span>
                  <span className="text-sm font-semibold text-amber-400">days active</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Total reflections: <strong className="text-slate-200">{totalReflections}</strong></p>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                {streakDays > 0 ? 'Consistent journaling habit maintained.' : 'Write today to start your streak!'}
              </div>
            </div>

            {/* Reflection Overview */}
            <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity Overview</span>
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
                  <div className="text-xs sm:text-sm font-bold text-indigo-300 truncate mt-1">{mostUsedCategory}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Top Category</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                Derived directly from your secure Firestore journal records.
              </div>
            </div>
          </div>

          {/* Low Entry Notice if < 3 entries */}
          {totalReflections < 3 && (
            <div className="p-4 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-indigo-200 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>You have {totalReflections} reflection{totalReflections === 1 ? '' : 's'}. Write a few more entries for even richer thematic insights and trend curves.</span>
            </div>
          )}

          {/* Loading State for AI sections */}
          {isLoading && !insights && (
            <div className="py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Sparkles className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200">Analyzing your reflections...</p>
              <p className="text-xs text-slate-500 mt-1">Gemini is synthesizing themes, tone trends, and focus recommendations.</p>
            </div>
          )}

          {/* AI Insights Sections */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Themes, Trend, Summary & Focus */}
              <div className="lg:col-span-2 space-y-6">
                {/* Section C: Top Themes */}
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
                        <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h4 className="text-sm font-semibold text-white">{theme.name}</h4>
                              {theme.frequency && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                  {theme.frequency} entries
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{theme.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section D: Reflection Trend */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">📈 Reflection Tone Trend</h3>
                  </div>

                  {insights.trend.length === 0 ? (
                    <p className="text-xs text-slate-400">No trend data available.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1.5"><Smile className="w-3.5 h-3.5 text-emerald-400" /> Positive</span>
                        <span className="flex items-center gap-1.5"><Meh className="w-3.5 h-3.5 text-sky-400" /> Neutral</span>
                        <span className="flex items-center gap-1.5"><Frown className="w-3.5 h-3.5 text-amber-400" /> Challenging</span>
                      </div>

                      <div className="space-y-2">
                        {insights.trend.map((item, idx) => {
                          const toneColor =
                            item.tone === 'positive'
                              ? 'bg-emerald-500'
                              : item.tone === 'challenging'
                              ? 'bg-amber-500'
                              : 'bg-sky-500';

                          const widthPct = Math.max(25, Math.min(100, Math.round((item.score || 0.7) * 100)));

                          return (
                            <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-slate-300 w-24">{item.date}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                                  item.tone === 'positive'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : item.tone === 'challenging'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-sky-950 text-sky-300 border border-sky-800'
                                }`}>
                                  {item.tone}
                                </span>
                              </div>
                              <div className="flex-1 max-w-xs bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                                <div className={`h-full rounded-full ${toneColor}`} style={{ width: `${widthPct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Gemini Perspective & Suggested Focus */}
              <div className="space-y-6">
                {/* Section E: Gemini Summary */}
                <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">🧠 Gemini's Perspective</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {insights.summary || 'Your reflections highlight steady personal awareness and thoughtful engagement with your goals.'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400">
                    Synthesized from your private journal history.
                  </div>
                </div>

                {/* Section F: Weekly Focus */}
                <div className="bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-900 border border-violet-900/50 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-violet-400" />
                    <h3 className="text-base font-bold text-white">🎯 Suggested Focus</h3>
                  </div>
                  <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-800/60 text-violet-200 text-xs sm:text-sm leading-relaxed font-medium">
                    {insights.suggestedFocus || 'Choose one key priority and allocate 30 focused minutes this week to make concrete progress.'}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-violet-300">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Practical action derived from your reflections</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
