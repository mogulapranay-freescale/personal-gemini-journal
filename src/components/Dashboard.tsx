import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserReflections,
  subscribeReflectionMessages,
  saveJournalReflection,
  saveReflectionMessage,
  deleteJournalReflection,
  subscribeGrowthExperiment,
  saveGrowthExperiment,
  subscribeNotificationSettings,
  saveNotificationSettings,
} from '../lib/firestoreService';
import {
  JournalReflection,
  ChatMessage,
  ReflectionMode,
  GrowthExperiment,
  NotificationSettings,
  GrowthStatus,
} from '../types';
import { HistorySidebar } from './HistorySidebar';
import { ReflectionView } from './ReflectionView';
import { ReflectionComposer } from './ReflectionComposer';
import { GrowthDashboard } from './GrowthDashboard';
import { SmartNudgeBanner } from './SmartNudgeBanner';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  const [reflections, setReflections] = useState<JournalReflection[]>([]);
  const [selectedReflection, setSelectedReflection] = useState<JournalReflection | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'journal' | 'growth'>('journal');

  // Growth Loop & Notification state
  const [activeExperiment, setActiveExperiment] = useState<GrowthExperiment | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dismissedToday, setDismissedToday] = useState(false);

  // Composer prefill state
  const [composerPrompt, setComposerPrompt] = useState<string>('');
  const [composerCategory, setComposerCategory] = useState<JournalReflection['category']>('Daily Log');

  // Check today's dismissal from localStorage on mount
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dismissed = localStorage.getItem(`nudge_dismissed_${todayStr}`);
    if (dismissed === 'true') {
      setDismissedToday(true);
    }
  }, []);

  // 1. Subscribe to user reflections
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingHistory(true);

    const unsubscribe = subscribeUserReflections(
      user.uid,
      (data) => {
        setReflections(data);
        setLoadingHistory(false);
        // If current selection is still in list, update it
        if (selectedReflection) {
          const updated = data.find((r) => r.id === selectedReflection.id);
          if (updated) {
            setSelectedReflection(updated);
          }
        }
      },
      (err) => {
        console.error('Failed to load user reflections:', err);
        setLoadingHistory(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Subscribe to messages of active reflection
  useEffect(() => {
    if (!user?.uid || !selectedReflection?.id) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeReflectionMessages(
      user.uid,
      selectedReflection.id,
      (msgs) => {
        setMessages(msgs);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, selectedReflection?.id]);

  // 3. Subscribe to active growth experiment
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeGrowthExperiment(
      user.uid,
      (exp) => {
        setActiveExperiment(exp);
      },
      (err) => {
        console.error('Failed to load growth experiment:', err);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // 4. Subscribe to notification settings
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeNotificationSettings(
      user.uid,
      (settings) => {
        setNotificationSettings(settings);
      },
      (err) => {
        console.error('Failed to load notification settings:', err);
      }
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const handleStartNewReflection = () => {
    setSelectedReflection(null);
    setComposerPrompt('');
    setComposerCategory('Daily Log');
    setMessages([]);
    setApiError(null);
    setActiveView('journal');
  };

  const handleStartNewWithPrompt = (promptText: string, category?: JournalReflection['category']) => {
    setSelectedReflection(null);
    setComposerPrompt(promptText);
    if (category) {
      setComposerCategory(category);
    }
    setMessages([]);
    setApiError(null);
    setActiveView('journal');
  };

  const handleSelectReflection = (reflection: JournalReflection) => {
    setSelectedReflection(reflection);
    setComposerPrompt('');
    setApiError(null);
    setActiveView('journal');
  };

  const handleDeleteReflection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    try {
      await deleteJournalReflection(user.uid, id);
      if (selectedReflection?.id === id) {
        handleStartNewReflection();
      }
    } catch (err: any) {
      console.error('Failed to delete reflection:', err);
      setApiError('Failed to delete entry from Firestore.');
    }
  };

  const handleDismissToday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`nudge_dismissed_${todayStr}`, 'true');
    setDismissedToday(true);
  };

  const handleSnooze = async () => {
    // Snooze for 4 hours
    const snoozeUntil = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    if (user?.uid && notificationSettings) {
      const updated: NotificationSettings = {
        ...notificationSettings,
        snoozedUntil: snoozeUntil,
      };
      await saveNotificationSettings(user.uid, updated);
      setNotificationSettings(updated);
    }
    handleDismissToday();
  };

  const handleUpdateExperiment = async (exp: GrowthExperiment) => {
    if (!user?.uid) return;
    await saveGrowthExperiment(user.uid, exp);
    setActiveExperiment(exp);
  };

  const handleUpdateExperimentStatus = async (status: GrowthStatus, note?: string) => {
    if (!user?.uid || !activeExperiment) return;
    const currentSkips = activeExperiment.skipCount || 0;
    const currentCompletions = activeExperiment.completionCount || 0;

    const updated: GrowthExperiment = {
      ...activeExperiment,
      status,
      statusNote: note,
      skipCount: status === 'skipped' ? currentSkips + 1 : currentSkips,
      completionCount: status === 'completed' ? currentCompletions + 1 : currentCompletions,
      completedAt: status === 'completed' ? new Date().toISOString() : activeExperiment.completedAt,
      updatedAt: new Date().toISOString(),
      history: [
        ...(activeExperiment.history || []),
        {
          date: new Date().toISOString().slice(0, 10),
          status,
          note,
        },
      ],
    };
    await saveGrowthExperiment(user.uid, updated);
    setActiveExperiment(updated);
  };

  const handleAdoptAdaptedPlan = async (actionText: string, frequency: string) => {
    if (!user?.uid) return;
    const newExp: GrowthExperiment = {
      id: `exp_adapted_${Date.now()}`,
      goal: 'Overcome friction with right-sized daily routine',
      action: actionText,
      targetFrequency: frequency,
      timeframe: 'Next 7 days',
      successSignal: 'Progress reported in reflection logs',
      status: 'in_progress',
      skipCount: 0,
      completionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveGrowthExperiment(user.uid, newExp);
    setActiveExperiment(newExp);
  };

  const handleSaveNotificationPreferences = async (newSettings: NotificationSettings) => {
    if (!user?.uid) return;
    await saveNotificationSettings(user.uid, newSettings);
    setNotificationSettings(newSettings);
  };

  const handleSendMessage = async ({
    prompt,
    mode,
    title,
    category,
  }: {
    prompt: string;
    mode: ReflectionMode;
    title: string;
    category: JournalReflection['category'];
  }) => {
    if (!user?.uid) return;
    setIsGenerating(true);
    setApiError(null);

    const timestamp = new Date().toISOString();
    const reflectionId =
      selectedReflection?.id || `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userMessageId = `msg_${Date.now()}_u`;
    const modelMessageId = `msg_${Date.now() + 1}_m`;

    const userMessage: ChatMessage = {
      id: userMessageId,
      reflectionId,
      userId: user.uid,
      role: 'user',
      content: prompt,
      mode,
      timestamp,
    };

    // Construct context history for multi-turn conversational Gemini prompt
    const contextHistory = messages.map((m) => ({
      role: m.role,
      text: m.content,
    }));

    try {
      // 1. Call server-side Gemini endpoint with resilient fallback
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode,
          contextHistory,
          entryTitle: title || selectedReflection?.title || 'Journal Reflection',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const aiData = await response.json();

      const modelMessage: ChatMessage = {
        id: modelMessageId,
        reflectionId,
        userId: user.uid,
        role: 'model',
        content: aiData.reply || 'Reflection generated.',
        mode,
        timestamp: new Date().toISOString(),
      };

      // 2. Build or update reflection metadata document
      const currentTurnCount = (selectedReflection?.turnCount || 0) + 1;
      const updatedReflection: JournalReflection = {
        id: reflectionId,
        userId: user.uid,
        title: title || selectedReflection?.title || prompt.slice(0, 40),
        category: category || selectedReflection?.category || 'Daily Log',
        initialPrompt: selectedReflection?.initialPrompt || prompt,
        summary: aiData.summary || selectedReflection?.summary || '',
        brainstormIdeas: [
          ...(aiData.brainstormIdeas || []),
          ...(selectedReflection?.brainstormIdeas || []),
        ].slice(0, 8),
        keyInsights: [
          ...(aiData.keyInsights || []),
          ...(selectedReflection?.keyInsights || []),
        ].slice(0, 6),
        turnCount: currentTurnCount,
        createdAt: selectedReflection?.createdAt || timestamp,
        updatedAt: new Date().toISOString(),
      };

      // 3. Atomically save reflection document and both messages in Firestore
      await saveJournalReflection(user.uid, updatedReflection);
      await saveReflectionMessage(user.uid, reflectionId, userMessage);
      await saveReflectionMessage(user.uid, reflectionId, modelMessage);

      // 4. Update UI active selection and clear composer prefill
      setSelectedReflection(updatedReflection);
      setComposerPrompt('');
      setActiveView('journal');
    } catch (err: any) {
      console.error('Error during reflection generation/save:', err);
      setApiError(err?.message || 'Failed to generate reflection with Gemini. Please try again.');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="dashboard-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header id="dashboard-header" className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Hide entries history' : 'Show entries history'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Gemini Reflections</h1>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3" /> User-Isolated Storage
              </span>
            </div>
          </div>
        </div>

        {/* User Profile, Reminders & Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            id="btn-open-reminders"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
            title="Reflection Reminders & Growth Guardian Preferences"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Reminders & Guardian</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-right">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
              {profile?.displayName || user?.displayName || user?.email || 'User'}
            </span>
          </div>

          <button
            id="btn-signout"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800 border border-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Dashboard Body Workspace */}
      <div id="dashboard-body" className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
          <HistorySidebar
            reflections={reflections}
            activeId={selectedReflection?.id || null}
            activeView={activeView}
            onSelectReflection={handleSelectReflection}
            onNewReflection={handleStartNewReflection}
            onSelectView={(view) => setActiveView(view)}
            onDeleteReflection={handleDeleteReflection}
            isLoading={loadingHistory}
          />
        )}

        {/* Main Conversation & Composer Stage OR Growth Dashboard */}
        {activeView === 'growth' ? (
          <main id="dashboard-growth-stage" className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
            {/* Smart Growth Guardian Nudge Banner (if active) */}
            <div className="p-4 pb-0 max-w-6xl mx-auto w-full">
              <SmartNudgeBanner
                reflections={reflections}
                currentExperiment={activeExperiment}
                settings={notificationSettings}
                dismissedToday={dismissedToday}
                onDismissToday={handleDismissToday}
                onSnooze={handleSnooze}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onCheckIn={(promptText) => handleStartNewWithPrompt(promptText, 'Work & Focus')}
                onUpdateExperimentStatus={handleUpdateExperimentStatus}
                onAdoptAdaptedPlan={handleAdoptAdaptedPlan}
              />
            </div>

            <GrowthDashboard
              userId={user?.uid}
              reflections={reflections}
              activeExperiment={activeExperiment}
              onUpdateExperiment={handleUpdateExperiment}
              onStartNewWithPrompt={handleStartNewWithPrompt}
              onStartNew={handleStartNewReflection}
              onOpenReminders={() => setIsSettingsModalOpen(true)}
              onSelectReflection={(r) => {
                setSelectedReflection(r);
                setActiveView('journal');
              }}
            />
          </main>
        ) : (
          <main id="dashboard-stage" className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-between">
              {/* Smart Growth Guardian Nudge Banner (if active) */}
              <div className="mb-4">
                <SmartNudgeBanner
                  reflections={reflections}
                  currentExperiment={activeExperiment}
                  settings={notificationSettings}
                  dismissedToday={dismissedToday}
                  onDismissToday={handleDismissToday}
                  onSnooze={handleSnooze}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                  onCheckIn={(promptText) => handleStartNewWithPrompt(promptText, 'Work & Focus')}
                  onUpdateExperimentStatus={handleUpdateExperimentStatus}
                  onAdoptAdaptedPlan={handleAdoptAdaptedPlan}
                />
              </div>

              {/* If a reflection is active, show the thread */}
              {selectedReflection ? (
                <ReflectionView
                  reflection={selectedReflection}
                  messages={messages}
                  onSelectSuggestion={(text) => {
                    handleSendMessage({
                      prompt: text,
                      mode: 'brainstorm',
                      title: selectedReflection.title,
                      category: selectedReflection.category,
                    });
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Start a New Reflection</h3>
                  <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
                    Reflect on decisions, journal your day, or brainstorm ideas with Gemini. All dialogues are saved privately to your Firestore account.
                  </p>
                </div>
              )}

              {/* Reflection Composer */}
              <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
                <ReflectionComposer
                  currentReflection={selectedReflection}
                  initialPromptText={composerPrompt}
                  initialCategory={composerCategory}
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  error={apiError}
                  onRetry={() => {
                    if (selectedReflection?.initialPrompt) {
                      handleSendMessage({
                        prompt: selectedReflection.initialPrompt,
                        mode: 'reflect',
                        title: selectedReflection.title,
                        category: selectedReflection.category,
                      });
                    }
                  }}
                />
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={notificationSettings}
        onSave={handleSaveNotificationPreferences}
      />
    </div>
  );
};
