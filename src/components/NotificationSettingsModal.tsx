import React, { useState } from 'react';
import { NotificationSettings } from '../types';
import {
  Bell,
  X,
  Check,
  Clock,
  Calendar,
  ShieldCheck,
  VolumeX,
  ShieldAlert,
} from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings | null;
  onSave: (newSettings: NotificationSettings) => Promise<void>;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);
  const [growthGuardianEnabled, setGrowthGuardianEnabled] = useState(
    settings?.growthGuardianEnabled ?? true
  );
  const [reminderTime, setReminderTime] = useState(settings?.reminderTime ?? '20:00');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays'>(
    settings?.frequency ?? 'daily'
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    settings?.quietHoursEnabled ?? false
  );
  const [quietHoursStart, setQuietHoursStart] = useState(
    settings?.quietHoursStart ?? '22:00'
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    settings?.quietHoursEnd ?? '08:00'
  );

  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setGrowthGuardianEnabled(settings.growthGuardianEnabled ?? true);
      setReminderTime(settings.reminderTime);
      setFrequency(settings.frequency);
      setQuietHoursEnabled(settings.quietHoursEnabled);
      setQuietHoursStart(settings.quietHoursStart);
      setQuietHoursEnd(settings.quietHoursEnd);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await onSave({
        enabled,
        growthGuardianEnabled,
        reminderTime,
        frequency,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        lastNudgeDate: settings?.lastNudgeDate,
        snoozedUntil: settings?.snoozedUntil,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="notification-settings-modal"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Growth Guardian & Reminders</h3>
              <p className="text-xs text-slate-400">Smart momentum nudges & quiet hours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-white">Enable Reflection Reminders</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Gentle daily reflection prompt
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Growth Guardian Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/30">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white">Growth Guardian Accountability</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Contextual nudges on experiments, skips & adaptive plans
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={growthGuardianEnabled}
                onChange={(e) => setGrowthGuardianEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {enabled && (
            <div className="space-y-4 pt-1">
              {/* Reminder Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Preferred Reminder Time</span>
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Frequency</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('daily')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      frequency === 'daily'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Every Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('weekdays')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      frequency === 'weekdays'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Weekdays Only
                  </button>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">Quiet Hours (No Nudges)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">From</label>
                      <input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">To</label>
                      <input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Browser Notification Status & Action */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Browser Notifications</span>
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                      permissionStatus === 'granted'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : permissionStatus === 'denied'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {permissionStatus}
                  </span>
                </div>

                {permissionStatus !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-all cursor-pointer text-center"
                  >
                    Request Browser Permission
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{isSaving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
