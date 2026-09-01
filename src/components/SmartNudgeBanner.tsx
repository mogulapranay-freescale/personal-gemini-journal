import React, { useState } from 'react';
import { GrowthExperiment, JournalReflection, NotificationSettings, GrowthStatus } from '../types';
import { evaluateGrowthGuardian } from '../lib/growthGuardian';
import {
  ShieldAlert,
  Sparkles,
  X,
  Bell,
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface SmartNudgeBannerProps {
  reflections: JournalReflection[];
  currentExperiment: GrowthExperiment | null;
  settings: NotificationSettings | null;
  dismissedToday: boolean;
  onCheckIn: (promptText: string, category?: string) => void;
  onDismissToday: () => void;
  onSnooze: () => void;
  onOpenSettings: () => void;
  onUpdateExperimentStatus?: (status: GrowthStatus, note?: string) => Promise<void>;
  onAdoptAdaptedPlan?: (adaptedAction: string, frequency: string) => Promise<void>;
}

export const SmartNudgeBanner: React.FC<SmartNudgeBannerProps> = ({
  reflections,
  currentExperiment,
  settings,
  dismissedToday,
  onCheckIn,
  onDismissToday,
  onSnooze,
  onOpenSettings,
  onUpdateExperimentStatus,
  onAdoptAdaptedPlan,
}) => {
  const [isRecordingSkip, setIsRecordingSkip] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [showAdaptModal, setShowAdaptModal] = useState(false);

  // 1. Check if user configured reminders or Growth Guardian disabled
  if (settings && (settings.enabled === false || settings.growthGuardianEnabled === false)) {
    return null;
  }

  // 2. Check if snoozed
  if (settings?.snoozedUntil) {
    const snoozeEnd = new Date(settings.snoozedUntil).getTime();
    if (Date.now() < snoozeEnd) {
      return null;
    }
  }

  // 3. Check if user dismissed today
  if (dismissedToday) {
    return null;
  }

  // 4. Check quiet hours if enabled
  if (settings && settings.quietHoursEnabled) {
    const currentHour = new Date().getHours();
    const startHour = parseInt(settings.quietHoursStart.split(':')[0], 10) || 22;
    const endHour = parseInt(settings.quietHoursEnd.split(':')[0], 10) || 8;
    if (startHour > endHour) {
      if (currentHour >= startHour || currentHour < endHour) return null;
    } else {
      if (currentHour >= startHour && currentHour < endHour) return null;
    }
  }

  // Evaluate intelligent pattern using Growth Guardian
  const guardian = evaluateGrowthGuardian(reflections, currentExperiment, settings);

  // If user is already on healthy momentum AND journaled today, do not nag on top
  const todayStr = new Date().toISOString().slice(0, 10);
  const journaledToday = reflections.some(
    (r) => (r.createdAt || r.updatedAt || '').slice(0, 10) === todayStr
  );

  if (journaledToday && guardian.state === 'healthy_momentum' && !guardian.needsAdaptation) {
    return null;
  }

  const handleQuickDone = async () => {
    if (onUpdateExperimentStatus) {
      await onUpdateExperimentStatus('completed', 'Marked done via Growth Guardian nudge');
    }
    onDismissToday();
  };

  const handleQuickPartiallyDone = async () => {
    if (onUpdateExperimentStatus) {
      await onUpdateExperimentStatus('in_progress', 'Progress in progress');
    }
    if (guardian.contextPrompt) {
      onCheckIn(guardian.contextPrompt, 'Work & Focus');
    }
  };

  const handleConfirmSkip = async () => {
    if (onUpdateExperimentStatus) {
      await onUpdateExperimentStatus('skipped', skipReason || 'Skipped for today');
    }
    setIsRecordingSkip(false);
    setSkipReason('');
    onDismissToday();
  };

  const isAdapted = guardian.state === 'plan_adaptation_recommended';

  return (
    <div
      id="smart-growth-guardian-nudge"
      className={`relative mx-4 sm:mx-6 mt-4 p-4 rounded-2xl border text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 ${
        isAdapted
          ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border-amber-500/40 shadow-amber-950/20'
          : guardian.state === 'healthy_momentum'
          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900 border-indigo-500/30 shadow-indigo-950/30'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left icon and message */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl border shrink-0 shadow-inner ${
              isAdapted
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : guardian.state === 'healthy_momentum'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
            }`}
          >
            {isAdapted ? (
              <ShieldAlert className="w-5 h-5 text-amber-300 animate-pulse" />
            ) : guardian.state === 'healthy_momentum' ? (
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            ) : (
              <Compass className="w-5 h-5 text-indigo-300 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isAdapted
                    ? 'text-amber-300'
                    : guardian.state === 'healthy_momentum'
                    ? 'text-emerald-300'
                    : 'text-indigo-300'
                }`}
              >
                Growth Guardian • {guardian.headline}
              </span>
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isAdapted ? 'bg-amber-400' : 'bg-emerald-400'
                } animate-ping`}
              />
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium max-w-2xl">
              {guardian.message}
            </p>

            {/* If plan adaptation recommended */}
            {isAdapted && guardian.adaptedSuggestion && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-white">Suggested Adaptation: </span>
                  <span>{guardian.adaptedSuggestion.action}</span>
                </div>
                {onAdoptAdaptedPlan && (
                  <button
                    onClick={() =>
                      onAdoptAdaptedPlan(
                        guardian.adaptedSuggestion!.action,
                        guardian.adaptedSuggestion!.targetFrequency
                      )
                    }
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow transition-colors cursor-pointer"
                  >
                    <span>Adopt Smaller Plan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Skip Reason Recording form */}
            {isRecordingSkip && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="text"
                  placeholder="Optional: Why was it skipped? (e.g., unexpected meeting, low energy)"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    onClick={handleConfirmSkip}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Confirm Skip
                  </button>
                  <button
                    onClick={() => setIsRecordingSkip(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
          {/* Action buttons depending on experiment status */}
          {currentExperiment && !isRecordingSkip && (
            <div className="flex items-center gap-1.5">
              <button
                id="guardian-btn-done"
                onClick={handleQuickDone}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                title="Mark experiment done for this cycle"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>

              <button
                id="guardian-btn-partially-done"
                onClick={handleQuickPartiallyDone}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                title="Log partial progress in reflection"
              >
                <span>Partially Done</span>
              </button>

              <button
                id="guardian-btn-skip"
                onClick={() => setIsRecordingSkip(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 hover:text-rose-200 border border-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                title="Record skipped session"
              >
                <span>Skipped</span>
              </button>
            </div>
          )}

          {/* Primary Check-in CTA */}
          <button
            id="guardian-check-in-btn"
            onClick={() =>
              onCheckIn(
                guardian.contextPrompt ||
                  'Growth Check-in: Sharing my current progress and reflections.',
                'Work & Focus'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 border border-indigo-500/50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Journal Check-In</span>
          </button>

          {/* Snooze CTA */}
          <button
            onClick={onSnooze}
            title="Snooze for 4 hours"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Snooze</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Guardian & Reminder Settings"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Dismiss */}
          <button
            id="guardian-dismiss-btn"
            onClick={onDismissToday}
            title="Dismiss for today"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
