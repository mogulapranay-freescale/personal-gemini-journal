import React, { useState } from 'react';
import { GrowthExperiment, CheckInEvaluation } from '../types';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MinusCircle,
  HelpCircle,
} from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: GrowthExperiment | null;
  todayAction: string;
  onCompleteCheckIn: (
    outcome: 'done' | 'partially_done' | 'skipped',
    notes?: string,
    evaluation?: CheckInEvaluation,
    additionalDetails?: {
      energyLevel?: 'high' | 'medium' | 'low';
      difficulty?: 'easy' | 'moderate' | 'hard';
      whatHelped?: string;
      whatGotInWay?: string;
    }
  ) => Promise<void>;
  onOpenJournalComposer?: (prompt: string, category: string) => void;
  onAdoptAdaptedPlan?: (newAction: string) => Promise<void>;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  experiment,
  todayAction,
  onCompleteCheckIn,
  onOpenJournalComposer,
  onAdoptAdaptedPlan,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<'done' | 'partially_done' | 'skipped'>('done');
  const [notes, setNotes] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low' | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard' | undefined>(undefined);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [whatHelped, setWhatHelped] = useState('');
  const [whatGotInWay, setWhatGotInWay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<CheckInEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const fullNotes = [
      notes,
      whatHelped ? `Helped: ${whatHelped}` : '',
      whatGotInWay ? `Obstacle: ${whatGotInWay}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      // Call backend check-in evaluation
      const res = await fetch('/api/growth/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: selectedOutcome,
          notes: fullNotes,
          experiment,
          skipCount: experiment?.skipCount || 0,
        }),
      });

      let evalData: CheckInEvaluation;
      if (res.ok) {
        evalData = await res.json();
      } else {
        // Fallback evaluation if server fails
        evalData = {
          verdict:
            selectedOutcome === 'done'
              ? 'Nice work. Your experiment is on track.'
              : selectedOutcome === 'partially_done'
              ? 'Partial progress is still progress.'
              : 'Session noted. Ready for a fresh start tomorrow.',
          feedback:
            selectedOutcome === 'done'
              ? 'Great consistency in following through with your planned session.'
              : 'Maintaining realistic expectations helps protect long-term habit formation.',
          momentumShift: selectedOutcome === 'done' ? 'improved' : selectedOutcome === 'partially_done' ? 'steady' : 'declined',
          recommendedExperimentStatus: selectedOutcome === 'done' ? 'in_progress' : selectedOutcome === 'skipped' ? 'skipped' : 'in_progress',
          suggestedNextAction: 'Continue with your daily habit practice.',
          isAdaptiveRecoveryRecommended: selectedOutcome === 'skipped' && (experiment?.skipCount || 0) >= 1,
          adaptivePlanReason:
            selectedOutcome === 'skipped' && (experiment?.skipCount || 0) >= 1
              ? 'Your current action has been skipped multiple times. Growth Guardian recommends a smaller 15-minute version.'
              : undefined,
          adaptedAction: `Complete a 15-minute focused version of ${experiment?.action || 'your goal'}.`,
        };
      }

      setEvaluation(evalData);
      await onCompleteCheckIn(selectedOutcome, fullNotes, evalData, {
        energyLevel,
        difficulty,
        whatHelped: whatHelped || undefined,
        whatGotInWay: whatGotInWay || undefined,
      });
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err?.message || 'Check-in recorded with standard tracking.');
      // Still record the outcome locally
      const fallbackEval: CheckInEvaluation = {
        verdict: 'Check-in recorded successfully.',
        feedback: 'Your habit status has been updated in Firestore.',
        momentumShift: selectedOutcome === 'done' ? 'improved' : 'steady',
        recommendedExperimentStatus: 'in_progress',
        isAdaptiveRecoveryRecommended: false,
      };
      setEvaluation(fallbackEval);
      await onCompleteCheckIn(selectedOutcome, fullNotes, fallbackEval, {
        energyLevel,
        difficulty,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEvaluation(null);
    setNotes('');
    setWhatHelped('');
    setWhatGotInWay('');
    setEnergyLevel(undefined);
    setDifficulty(undefined);
    setShowMoreDetails(false);
    setSelectedOutcome('done');
    onClose();
  };

  return (
    <div
      id="check-in-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="check-in-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Growth Check-In</h3>
              <p className="text-xs text-slate-400">Record your daily experiment progress</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Action Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Today's Action
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">
              {todayAction || experiment?.action || 'Complete your planned focus session.'}
            </p>
          </div>

          {!evaluation ? (
            <>
              {/* Outcome Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  How did it go today?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('done')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedOutcome === 'done'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/50'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Done</span>
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          selectedOutcome === 'done' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">Completed the session</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('partially_done')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedOutcome === 'partially_done'
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-950/50'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Partial</span>
                      <Clock
                        className={`w-4 h-4 ${
                          selectedOutcome === 'partially_done' ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">Completed some part</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('skipped')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedOutcome === 'skipped'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md shadow-amber-950/50'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Skipped</span>
                      <MinusCircle
                        className={`w-4 h-4 ${
                          selectedOutcome === 'skipped' ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">Couldn't get to it</span>
                  </button>
                </div>
              </div>

              {/* Optional Notes & Context */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    What happened today? <span className="text-slate-500 font-normal">(optional notes)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reflect briefly on your execution, blockers, or progress..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Collapsible More Details */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails(!showMoreDetails)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{showMoreDetails ? '− Hide additional context' : '+ Add extra context (energy, obstacles, helpers)'}</span>
                  </button>

                  {showMoreDetails && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                      {/* Energy Level */}
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">Energy Level:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['high', 'medium', 'low'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setEnergyLevel(lvl === energyLevel ? undefined : lvl)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                                energyLevel === lvl
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">Task Difficulty:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['easy', 'moderate', 'hard'] as const).map((diff) => (
                            <button
                              key={diff}
                              type="button"
                              onClick={() => setDifficulty(diff === difficulty ? undefined : diff)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                                difficulty === diff
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* What helped */}
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400 mb-1">What helped most?</span>
                        <input
                          type="text"
                          value={whatHelped}
                          onChange={(e) => setWhatHelped(e.target.value)}
                          placeholder="e.g. Quiet morning, clear checklist"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* What got in the way */}
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-400 mb-1">What got in the way?</span>
                        <input
                          type="text"
                          value={whatGotInWay}
                          onChange={(e) => setWhatGotInWay(e.target.value)}
                          placeholder="e.g. Fatigue, unexpected meeting"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Post Check-In Evaluation & Feedback */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-xl border ${
                  evaluation.momentumShift === 'improved'
                    ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200'
                    : evaluation.momentumShift === 'declined'
                    ? 'bg-amber-950/50 border-amber-800/60 text-amber-200'
                    : 'bg-indigo-950/50 border-indigo-800/60 text-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {evaluation.momentumShift === 'improved'
                      ? 'Momentum Building'
                      : evaluation.momentumShift === 'declined'
                      ? 'Momentum Paused'
                      : 'Steady Progress'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{evaluation.verdict}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evaluation.feedback}</p>
              </div>

              {/* Adaptive Plan Recovery Offer */}
              {evaluation.isAdaptiveRecoveryRecommended && evaluation.adaptedAction && (
                <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <RotateCcw className="w-4 h-4" />
                    Adaptive Plan Recovery
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {evaluation.adaptivePlanReason ||
                      "Your current action may be larger than necessary. Growth Guardian recommends a smaller right-sized version to rebuild your habit without friction."}
                  </p>
                  <div className="p-3 rounded-lg bg-amber-900/40 border border-amber-700/50 text-xs font-medium text-white">
                    🎯 Recommended Smaller Action: {evaluation.adaptedAction}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {onAdoptAdaptedPlan ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (evaluation.adaptedAction) {
                            await onAdoptAdaptedPlan(evaluation.adaptedAction);
                            handleClose();
                          }
                        }}
                        className="py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Adopt Right-Sized Plan</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleClose}
                      className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                    >
                      <span>Keep Current Plan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action to elaborate in Journal */}
              {onOpenJournalComposer && (
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">
                    Want to unpack today's thoughts in your reflection journal?
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = `Growth Check-in (${selectedOutcome.replace('_', ' ')}): Today I focused on "${todayAction}". ${notes ? `Notes: ${notes}` : ''}`;
                      onOpenJournalComposer(prompt, 'Work & Focus');
                      handleClose();
                    }}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Write in Journal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          {!evaluation ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Check-In</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
