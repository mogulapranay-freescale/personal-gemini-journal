import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
  Flame,
  X,
  Send,
} from 'lucide-react';
import {
  Experiment,
  CheckInOutcome,
  EnergyLevel,
  DifficultyLevel,
} from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: Experiment;
  initialOutcome?: CheckInOutcome;
  onSubmit: (checkInData: {
    outcome: CheckInOutcome;
    energyLevel: EnergyLevel;
    difficulty: DifficultyLevel;
    notes: string;
  }) => Promise<void>;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  experiment,
  initialOutcome = 'done',
  onSubmit,
}) => {
  const { currentTheme } = useTheme();
  const [outcome, setOutcome] = useState<CheckInOutcome>(initialOutcome);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('moderate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        outcome,
        energyLevel,
        difficulty,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit check-in:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${currentTheme.badgeBg} ${currentTheme.badgeText} flex items-center justify-center`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-stone-900 dark:text-slate-100">Daily Execution Check-in</h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 truncate max-w-xs">{experiment.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close check-in modal"
            className="p-1.5 text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Outcome Select */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-2">
              How did today's experiment go?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                id="outcome-done-btn"
                onClick={() => setOutcome('done')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  outcome === 'done'
                    ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-600'
                    : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-750'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Completed</span>
              </button>

              <button
                type="button"
                id="outcome-partial-btn"
                onClick={() => setOutcome('partially_done')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  outcome === 'partially_done'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-600'
                    : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-750'
                }`}
              >
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Partial</span>
              </button>

              <button
                type="button"
                id="outcome-skipped-btn"
                onClick={() => setOutcome('skipped')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  outcome === 'skipped'
                    ? 'border-rose-600 bg-rose-50/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 shadow-xs ring-1 ring-rose-600'
                    : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-750'
                }`}
              >
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>Skipped</span>
              </button>
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-2 flex items-center gap-1">
              <Zap className={`w-3.5 h-3.5 ${currentTheme.iconAccent}`} />
              <span>Energy Level During Action</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as EnergyLevel[]).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergyLevel(lvl)}
                  className={`py-2 px-3 rounded-lg border text-xs capitalize font-medium transition-all ${
                    energyLevel === lvl
                      ? `${currentTheme.primaryBtn}`
                      : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {lvl} Energy
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-2 flex items-center gap-1">
              <Flame className={`w-3.5 h-3.5 ${currentTheme.iconAccent}`} />
              <span>Perceived Friction / Difficulty</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'moderate', 'hard'] as DifficultyLevel[]).map(diff => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 px-3 rounded-lg border text-xs capitalize font-medium transition-all ${
                    difficulty === diff
                      ? `${currentTheme.primaryBtn}`
                      : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Contextual Notes */}
          <div>
            <label htmlFor="checkin-notes" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
              Reflection Notes (What helped or caused friction?)
            </label>
            <textarea
              id="checkin-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Cleared my desk beforehand and stayed focused for the full 30 minutes, or felt tired after lunch..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-800/60 text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 ${currentTheme.ringClass} transition-all resize-none`}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-checkin-btn"
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg ${currentTheme.primaryBtn} transition-colors shadow-sm disabled:opacity-50`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Recording...' : 'Record Check-in'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
