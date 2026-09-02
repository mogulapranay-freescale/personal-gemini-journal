import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Moon,
  Shield,
  X,
  Save,
  CheckCircle,
  Palette,
  Check,
} from 'lucide-react';
import { NotificationSettings } from '../types.ts';
import { useTheme, THEMES, AppTheme } from '../context/ThemeContext.tsx';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSave: (settings: Partial<NotificationSettings>) => Promise<void>;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const { theme, setTheme, currentTheme } = useTheme();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [guardianAlerts, setGuardianAlerts] = useState(settings.guardianAlerts);
  const [preferredHour, setPreferredHour] = useState(settings.preferredHour);
  const [frequency, setFrequency] = useState(settings.frequency);
  const [quietHoursStart, setQuietHoursStart] = useState(settings.quietHoursStart);
  const [quietHoursEnd, setQuietHoursEnd] = useState(settings.quietHoursEnd);
  const [snoozeHours, setSnoozeHours] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    let snoozedUntil: string | null = settings.snoozedUntil || null;
    if (snoozeHours > 0) {
      snoozedUntil = new Date(Date.now() + snoozeHours * 3600000).toISOString();
    } else if (snoozeHours === -1) {
      snoozedUntil = null; // clear snooze
    }

    try {
      await onSave({
        enabled,
        guardianAlerts,
        preferredHour,
        frequency,
        quietHoursStart,
        quietHoursEnd,
        snoozedUntil,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${currentTheme.badgeBg} ${currentTheme.badgeText} flex items-center justify-center`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-stone-900 dark:text-slate-100">Settings &amp; Theme Customization</h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">Configure accountability pacing, quiet hours, and aesthetic theme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings modal"
            className="p-1.5 text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* App Color Theme */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-slate-100">
              <Palette className={`w-4 h-4 ${currentTheme.iconAccent}`} />
              <span>App Aesthetic &amp; Color Theme</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Select your preferred visual atmosphere. This applies globally across journals, growth loops, and headers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {(Object.keys(THEMES) as AppTheme[]).map(key => {
                const opt = THEMES[key];
                const isSelected = theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `border-stone-900 dark:border-slate-300 bg-white dark:bg-slate-700 ring-2 ring-stone-900/10 dark:ring-slate-300/20 shadow-xs`
                        : 'border-stone-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-750 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1">
                        {opt.swatch.map((c, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-white dark:border-slate-900 shadow-2xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900 dark:text-slate-100">{opt.name}</div>
                        <div className="text-[10px] text-stone-500 dark:text-slate-400 truncate max-w-[110px]">{opt.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-stone-900 dark:text-slate-100 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700">
            <div>
              <div className="text-sm font-semibold text-stone-900 dark:text-slate-100">Smart Growth Reminders</div>
              <div className="text-xs text-stone-500 dark:text-slate-400">Enable in-app reminders and momentum evaluations</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="notifications-enabled-toggle"
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${currentTheme.primaryBtn.split(' ')[0]}`}></div>
            </label>
          </div>

          {/* Growth Guardian Alerts Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700">
            <div>
              <div className="text-sm font-semibold text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                <Shield className={`w-3.5 h-3.5 ${currentTheme.iconAccent}`} />
                <span>Guardian Accountability Nudges</span>
              </div>
              <div className="text-xs text-stone-500 dark:text-slate-400">Proactively suggest 15-minute micro-habits when progress stalls</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="guardian-alerts-toggle"
                type="checkbox"
                checked={guardianAlerts}
                onChange={e => setGuardianAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-stone-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${currentTheme.primaryBtn.split(' ')[0]}`}></div>
            </label>
          </div>

          {/* Timing & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferred-reminder-time" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Preferred Reminder Time</span>
              </label>
              <select
                id="preferred-reminder-time"
                value={preferredHour}
                onChange={e => setPreferredHour(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 focus:outline-hidden focus:ring-2"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reminder-frequency" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                Frequency
              </label>
              <select
                id="reminder-frequency"
                value={frequency}
                onChange={e => setFrequency(e.target.value as 'daily' | 'weekdays')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 focus:outline-hidden focus:ring-2"
              >
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
              </select>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-slate-100">
              <Moon className="w-4 h-4 text-stone-600 dark:text-slate-400" />
              <span>Quiet Hours Protection</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
              No nudges or notifications will be triggered during these hours to ensure uninterrupted rest.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="quiet-hours-start" className="block text-xs text-stone-600 dark:text-slate-400 mb-1">Start (Night)</label>
                <select
                  id="quiet-hours-start"
                  value={quietHoursStart}
                  onChange={e => setQuietHoursStart(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quiet-hours-end" className="block text-xs text-stone-600 dark:text-slate-400 mb-1">End (Morning)</label>
                <select
                  id="quiet-hours-end"
                  value={quietHoursEnd}
                  onChange={e => setQuietHoursEnd(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Snooze */}
          <div>
            <label htmlFor="quick-snooze-select" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
              Temporary Snooze
            </label>
            <select
              id="quick-snooze-select"
              value={snoozeHours}
              onChange={e => setSnoozeHours(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100"
            >
              <option value={0}>Do not snooze</option>
              <option value={4}>Snooze for 4 hours</option>
              <option value={24}>Snooze for 24 hours (1 day)</option>
              <option value={72}>Snooze for 3 days</option>
              {settings.snoozedUntil && <option value={-1}>Clear active snooze</option>}
            </select>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-notification-settings-btn"
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg ${currentTheme.primaryBtn} transition-colors shadow-sm disabled:opacity-50`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
