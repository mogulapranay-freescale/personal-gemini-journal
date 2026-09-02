import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Reflection,
  Experiment,
  CheckIn,
  NotificationSettings,
  GrowthTheme,
  WeeklyReview,
  Mood,
  CheckInOutcome,
  EnergyLevel,
  DifficultyLevel,
} from '../types.ts';
import {
  saveReflection,
  updateReflection,
  deleteReflection,
  subscribeToReflections,
  saveExperiment,
  updateExperiment,
  subscribeToExperiments,
  saveCheckIn,
  subscribeToCheckIns,
  getSettings,
  saveSettings,
  saveWeeklyReview,
  getWeeklyReviews,
  DEFAULT_SETTINGS,
} from '../lib/firestoreService.ts';
import { HistorySidebar } from './HistorySidebar.tsx';
import { ReflectionComposer } from './ReflectionComposer.tsx';
import { ReflectionView } from './ReflectionView.tsx';
import { GrowthDashboard } from './GrowthDashboard.tsx';
import { SmartNudgeBanner } from './SmartNudgeBanner.tsx';
import { CheckInModal } from './CheckInModal.tsx';
import { NotificationSettingsModal } from './NotificationSettingsModal.tsx';
import { ThemeSelector } from './ThemeSelector.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Sparkles,
  Bell,
  LogOut,
  User,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();

  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [themes, setThemes] = useState<GrowthTheme[]>([]);

  const [activeReflectionId, setActiveReflectionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'reflections' | 'growth'>('reflections');
  const [isComposing, setIsComposing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals & UI States
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [initialCheckInOutcome, setInitialCheckInOutcome] = useState<CheckInOutcome>('done');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // Loading States
  const [composerLoading, setComposerLoading] = useState(false);
  const [experimentLoading, setExperimentLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [themesLoading, setThemesLoading] = useState(false);
  const [weeklyReviewLoading, setWeeklyReviewLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userId = user?.uid || 'anonymous-user';

  // Subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubReflections = subscribeToReflections(userId, list => {
      setReflections(list);
      if (list.length > 0 && !activeReflectionId && !isComposing) {
        setActiveReflectionId(list[0].id);
      } else if (list.length === 0) {
        setIsComposing(true);
      }
    });

    const unsubExperiments = subscribeToExperiments(userId, list => {
      setExperiments(list);
    });

    const unsubCheckIns = subscribeToCheckIns(userId, list => {
      setCheckIns(list);
    });

    getSettings(userId).then(s => setSettings(s)).catch(console.error);
    getWeeklyReviews(userId).then(w => setWeeklyReviews(w)).catch(console.error);

    return () => {
      unsubReflections();
      unsubExperiments();
      unsubCheckIns();
    };
  }, [user, userId]);

  const activeReflection = reflections.find(r => r.id === activeReflectionId) || null;
  const activeExperiment = experiments.find(e => e.status === 'active') || null;

  // 1. Save and Analyze Reflection
  const handleSaveAndAnalyze = async (data: {
    title: string;
    content: string;
    mood?: Mood;
    tags: string[];
  }) => {
    setComposerLoading(true);
    setErrorMessage(null);

    const newId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    try {
      // Analyze with Gemini
      const response = await fetch('/api/gemini/analyze-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          mood: data.mood,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with HTTP status ${response.status}`);
      }

      const analysis = await response.json();

      const newReflection: Reflection = {
        id: newId,
        userId,
        title: data.title,
        content: data.content,
        mood: data.mood,
        tags: data.tags,
        summary: analysis.summary,
        keyTakeaways: analysis.keyTakeaways,
        actionSteps: analysis.actionSteps,
        followUpQuestions: analysis.followUpQuestions,
        chatHistory: [],
        createdAt: now,
        updatedAt: now,
      };

      await saveReflection(userId, newReflection);
      setActiveReflectionId(newId);
      setIsComposing(false);
      setCurrentView('reflections');
    } catch (err: unknown) {
      console.error('Error analyzing reflection:', err);
      // Fallback save without analysis if network/API drops
      const fallbackReflection: Reflection = {
        id: newId,
        userId,
        title: data.title,
        content: data.content,
        mood: data.mood,
        tags: data.tags,
        summary: 'Your reflection has been recorded.',
        keyTakeaways: ['Maintained consistent reflection habit.'],
        actionSteps: ['Take a 5-minute pause to prioritize your next task.'],
        followUpQuestions: ['What is the most important lesson from this entry?'],
        chatHistory: [],
        createdAt: now,
        updatedAt: now,
      };
      await saveReflection(userId, fallbackReflection);
      setActiveReflectionId(newId);
      setIsComposing(false);
      setErrorMessage('Gemini analysis was delayed, but your reflection was safely saved!');
    } finally {
      setComposerLoading(false);
    }
  };

  // 2. Turn reflection into 7-day micro experiment
  const handleCreateExperiment = async (reflection: Reflection) => {
    setExperimentLoading(true);
    setErrorMessage(null);

    try {
      let gen: { title?: string; description?: string; category?: string } = {};

      try {
        const response = await fetch('/api/gemini/generate-experiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: reflection.title || 'Personal Reflection',
            content: reflection.content || reflection.summary || 'Mindful habit and personal growth execution',
          }),
        });

        if (response.ok) {
          gen = await response.json();
        }
      } catch (networkErr) {
        console.warn('Network issue generating experiment, utilizing smart fallback:', networkErr);
      }

      const expTitle = (typeof gen?.title === 'string' && gen.title.trim())
        ? gen.title.trim()
        : (reflection.actionSteps?.[0]
            ? `7-Day Habit: ${reflection.actionSteps[0]}`
            : `7-Day Growth: ${reflection.title || 'Daily Focus'}`);

      const expDesc = (typeof gen?.description === 'string' && gen.description.trim())
        ? gen.description.trim()
        : (reflection.actionSteps?.[0]
            ? `Execute daily: ${reflection.actionSteps[0]}. Keep friction low and track completion.`
            : `Dedicate 15-20 minutes daily to consistent progress based on "${reflection.title || 'your reflection'}".`);

      const validCategories: Experiment['category'][] = ['focus', 'energy', 'boundaries', 'mindset', 'skills', 'wellness'];
      const expCategory: Experiment['category'] = validCategories.includes(gen?.category as Experiment['category'])
        ? (gen.category as Experiment['category'])
        : 'focus';

      const expId = `exp_${Date.now()}`;
      const now = new Date().toISOString();

      const newExp: Experiment = {
        id: expId,
        userId,
        title: expTitle,
        description: expDesc,
        category: expCategory,
        targetDays: 7,
        completedDays: 0,
        skippedDays: 0,
        status: 'active',
        streak: 0,
        reflectionSourceId: reflection.id,
        reflectionSourceTitle: reflection.title || 'Personal Reflection',
        adaptationsHistory: [],
        createdAt: now,
        updatedAt: now,
      };

      // Set any previously active experiments to paused
      for (const e of experiments) {
        if (e.status === 'active') {
          await updateExperiment(userId, e.id, { status: 'paused' });
        }
      }

      await saveExperiment(userId, newExp);
      setCurrentView('growth');
    } catch (err) {
      console.error('Create experiment error:', err);
      setErrorMessage('Could not save experiment. Please check your connection and retry.');
    } finally {
      setExperimentLoading(false);
    }
  };

  // 3. Multi-turn reflection chat
  const handleSendChatMessage = async (reflectionId: string, message: string) => {
    if (!activeReflection) return;
    setChatLoading(true);

    const now = new Date().toISOString();
    const userMsg = { id: `msg_${Date.now()}`, role: 'user' as const, content: message, timestamp: now };
    const updatedHistory = [...(activeReflection.chatHistory || []), userMsg];

    // Optimistic UI update
    await updateReflection(userId, reflectionId, { chatHistory: updatedHistory });

    try {
      const response = await fetch('/api/gemini/reflection-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflectionContent: activeReflection.content,
          chatHistory: updatedHistory,
          message,
        }),
      });

      if (!response.ok) throw new Error('Chat generation failed');
      const data = await response.json();

      const aiMsg = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content: data.reply,
        timestamp: new Date().toISOString(),
      };

      await updateReflection(userId, reflectionId, {
        chatHistory: [...updatedHistory, aiMsg],
      });
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackAiMsg = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content: "I hear you. Taking this one step at a time is the best way forward. What feels like the easiest next action you can take?",
        timestamp: new Date().toISOString(),
      };
      await updateReflection(userId, reflectionId, {
        chatHistory: [...updatedHistory, fallbackAiMsg],
      });
    } finally {
      setChatLoading(false);
    }
  };

  // 4. Submit Daily Check-in
  const handleSubmitCheckIn = async (data: {
    outcome: CheckInOutcome;
    energyLevel: EnergyLevel;
    difficulty: DifficultyLevel;
    notes: string;
  }) => {
    if (!activeExperiment) return;

    const checkInId = `chk_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // Get AI Feedback
      let feedback = '';
      try {
        const fbRes = await fetch('/api/gemini/checkin-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experimentTitle: activeExperiment.title,
            outcome: data.outcome,
            energyLevel: data.energyLevel,
            difficulty: data.difficulty,
            notes: data.notes,
          }),
        });
        if (fbRes.ok) {
          const json = await fbRes.json();
          feedback = json.feedback;
        }
      } catch (fbErr) {
        console.warn('Feedback generation skipped:', fbErr);
      }

      const newCheckIn: CheckIn = {
        id: checkInId,
        userId,
        experimentId: activeExperiment.id,
        experimentTitle: activeExperiment.title,
        date: todayStr,
        outcome: data.outcome,
        energyLevel: data.energyLevel,
        difficulty: data.difficulty,
        notes: data.notes,
        feedback,
        createdAt: new Date().toISOString(),
      };

      await saveCheckIn(userId, newCheckIn);

      // Update experiment completed/skipped counts
      const newCompleted = data.outcome === 'done' ? activeExperiment.completedDays + 1 : activeExperiment.completedDays;
      const newSkipped = data.outcome === 'skipped' ? activeExperiment.skippedDays + 1 : activeExperiment.skippedDays;
      const newStreak = data.outcome === 'done' ? activeExperiment.streak + 1 : (data.outcome === 'skipped' ? 0 : activeExperiment.streak);
      const isCompleted = newCompleted >= activeExperiment.targetDays;

      await updateExperiment(userId, activeExperiment.id, {
        completedDays: newCompleted,
        skippedDays: newSkipped,
        streak: newStreak,
        lastCheckInDate: todayStr,
        status: isCompleted ? 'completed' : 'active',
      });
    } catch (err) {
      console.error('Failed to submit check-in:', err);
      setErrorMessage('Could not record check-in. Please try again.');
    }
  };

  // 5. Adapt Stalled Plan
  const handleAdaptPlan = async () => {
    if (!activeExperiment) return;
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/adapt-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentExperiment: {
            title: activeExperiment.title,
            description: activeExperiment.description,
            category: activeExperiment.category,
          },
          frictionReason: 'Consecutive skipped check-ins or reported high friction',
        }),
      });

      if (!res.ok) throw new Error('Plan adaptation failed');
      const adapted = await res.json();

      const adaptationEntry = {
        date: new Date().toISOString(),
        previousTitle: activeExperiment.title,
        newTitle: adapted.newTitle,
        reason: adapted.adaptationReason,
      };

      await updateExperiment(userId, activeExperiment.id, {
        title: adapted.newTitle,
        description: adapted.newDescription,
        adaptationsHistory: [...(activeExperiment.adaptationsHistory || []), adaptationEntry],
      });
    } catch (err) {
      console.error('Error adapting plan:', err);
      setErrorMessage('Failed to adapt plan automatically.');
    }
  };

  // 6. Generate Growth Themes & Patterns
  const handleGenerateGrowthThemes = async () => {
    setThemesLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/analyze-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflections: reflections.map(r => ({
            id: r.id,
            title: r.title,
            content: r.content,
            mood: r.mood,
            createdAt: r.createdAt,
          })),
          checkIns: checkIns.map(c => ({
            date: c.date,
            outcome: c.outcome,
            energyLevel: c.energyLevel,
            notes: c.notes,
          })),
        }),
      });

      if (!res.ok) throw new Error('Pattern analysis failed');
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (err) {
      console.error('Themes analysis error:', err);
      setErrorMessage('Failed to synthesize growth patterns.');
    } finally {
      setThemesLoading(false);
    }
  };

  // 7. Generate Weekly Review
  const handleGenerateWeeklyReview = async () => {
    setWeeklyReviewLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflections: reflections.slice(0, 7).map(r => ({ title: r.title, content: r.content })),
          checkIns: checkIns.slice(0, 7).map(c => ({ date: c.date, outcome: c.outcome, notes: c.notes })),
          experiment: activeExperiment ? {
            title: activeExperiment.title,
            completedDays: activeExperiment.completedDays,
            targetDays: activeExperiment.targetDays,
          } : undefined,
        }),
      });

      if (!res.ok) throw new Error('Weekly review generation failed');
      const reviewData = await res.json();

      const weekStart = new Date(Date.now() - 7 * 86400000).toISOString();
      const weekEnd = new Date().toISOString();
      const reviewId = `rev_${Date.now()}`;

      const newReview: WeeklyReview = {
        id: reviewId,
        userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        completedExperimentsCount: experiments.filter(e => e.status === 'completed').length,
        totalCheckInsCount: checkIns.length,
        reflectionsCount: reflections.length,
        keyWins: reviewData.keyWins,
        recurringBlockers: reviewData.recurringBlockers,
        nextRecommendedExperiment: reviewData.nextRecommendedExperiment,
        generatedAt: new Date().toISOString(),
      };

      await saveWeeklyReview(userId, newReview);
      setWeeklyReviews(prev => [newReview, ...prev]);
    } catch (err) {
      console.error('Weekly review error:', err);
      setErrorMessage('Failed to generate weekly review.');
    } finally {
      setWeeklyReviewLoading(false);
    }
  };

  // 8. Save Notification Settings
  const handleSaveSettings = async (newSettings: Partial<NotificationSettings>) => {
    await saveSettings(userId, newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-slate-950 overflow-hidden font-sans text-stone-900 dark:text-slate-100">
      {/* Mobile Sidebar Overlay Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/50 dark:bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar backdrop"
          />
          <div className="relative z-50 w-80 max-w-[85vw] h-full shadow-2xl">
            <HistorySidebar
              reflections={reflections}
              activeReflectionId={activeReflectionId}
              onSelectReflection={id => {
                setActiveReflectionId(id);
                setIsComposing(false);
              }}
              onNewReflection={() => {
                setIsComposing(true);
                setActiveReflectionId(null);
                setCurrentView('reflections');
              }}
              onDeleteReflection={async id => {
                await deleteReflection(userId, id);
                if (activeReflectionId === id) {
                  setActiveReflectionId(reflections.find(r => r.id !== id)?.id || null);
                }
              }}
              currentView={currentView}
              onSwitchView={view => {
                setCurrentView(view);
                if (view === 'reflections' && !activeReflectionId && reflections.length > 0) {
                  setActiveReflectionId(reflections[0].id);
                }
              }}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Collapsible Sidebar */}
      <div className={`hidden md:flex transition-all duration-200 shrink-0 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0'}`}>
        <HistorySidebar
          reflections={reflections}
          activeReflectionId={activeReflectionId}
          onSelectReflection={id => {
            setActiveReflectionId(id);
            setIsComposing(false);
          }}
          onNewReflection={() => {
            setIsComposing(true);
            setActiveReflectionId(null);
            setCurrentView('reflections');
          }}
          onDeleteReflection={async id => {
            await deleteReflection(userId, id);
            if (activeReflectionId === id) {
              setActiveReflectionId(reflections.find(r => r.id !== id)?.id || null);
            }
          }}
          currentView={currentView}
          onSwitchView={view => {
            setCurrentView(view);
            if (view === 'reflections' && !activeReflectionId && reflections.length > 0) {
              setActiveReflectionId(reflections[0].id);
            }
          }}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main App Content View */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="toggle-sidebar-btn"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-1.5 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors duration-200"
              style={{ backgroundColor: currentTheme.primaryColor }}
            >
              <Sparkles className="w-4 h-4 text-white/90" />
            </div>
            <span className="font-serif font-bold text-sm tracking-tight text-stone-900 dark:text-white">
              Gemini Reflection
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>
              My Growth Loop
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Selector Palette */}
            <ThemeSelector />

            <button
              id="open-settings-modal-btn"
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              title="Notification & Guardian Preferences"
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-stone-200 dark:bg-slate-750" />

            <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
                {user?.email?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden sm:inline-block max-w-[120px] truncate">{user?.email || 'Guest User'}</span>
              <button
                id="logout-btn"
                onClick={logout}
                className="p-1.5 text-stone-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error message"
                className="text-amber-600 hover:text-amber-900 font-bold ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {/* Growth Guardian Smart Nudge */}
          {!nudgeDismissed && (
            <SmartNudgeBanner
              activeExperiment={activeExperiment}
              recentCheckIns={checkIns}
              reflections={reflections}
              settings={settings}
              onOpenCheckIn={outcome => {
                setInitialCheckInOutcome(outcome || 'done');
                setCheckInModalOpen(true);
              }}
              onAdaptPlan={handleAdaptPlan}
              onOpenSettings={() => setSettingsModalOpen(true)}
              onDismiss={() => setNudgeDismissed(true)}
            />
          )}

          {/* View Routing */}
          {currentView === 'growth' ? (
            <GrowthDashboard
              activeExperiment={activeExperiment}
              experiments={experiments}
              checkIns={checkIns}
              reflections={reflections}
              weeklyReviews={weeklyReviews}
              settings={settings}
              onOpenCheckIn={outcome => {
                setInitialCheckInOutcome(outcome || 'done');
                setCheckInModalOpen(true);
              }}
              onAdaptPlan={handleAdaptPlan}
              onSelectReflection={id => {
                setActiveReflectionId(id);
                setIsComposing(false);
                setCurrentView('reflections');
              }}
              onGenerateGrowthThemes={handleGenerateGrowthThemes}
              onGenerateWeeklyReview={handleGenerateWeeklyReview}
              themes={themes}
              themesLoading={themesLoading}
              weeklyReviewLoading={weeklyReviewLoading}
            />
          ) : isComposing ? (
            <ReflectionComposer
              onSaveAndAnalyze={handleSaveAndAnalyze}
              loading={composerLoading}
            />
          ) : activeReflection ? (
            <ReflectionView
              reflection={activeReflection}
              onDelete={async id => {
                await deleteReflection(userId, id);
                setActiveReflectionId(reflections.find(r => r.id !== id)?.id || null);
              }}
              onCreateExperiment={handleCreateExperiment}
              onSendChatMessage={handleSendChatMessage}
              experimentLoading={experimentLoading}
              chatLoading={chatLoading}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400 dark:text-slate-500 space-y-3">
              <Sparkles className={`w-10 h-10 ${currentTheme.iconAccent}`} />
              <h3 className="font-serif text-lg font-bold text-stone-700 dark:text-slate-300">No Reflection Selected</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm">
                Write a new journal entry or choose one from the sidebar to begin your reflection session.
              </p>
              <button
                id="empty-state-new-reflection-btn"
                onClick={() => setIsComposing(true)}
                className={`px-4 py-2 rounded-xl ${currentTheme.primaryBtn} text-xs font-semibold shadow-sm`}
              >
                Write New Reflection
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Check-In Modal */}
      {activeExperiment && (
        <CheckInModal
          isOpen={checkInModalOpen}
          onClose={() => setCheckInModalOpen(false)}
          experiment={activeExperiment}
          initialOutcome={initialCheckInOutcome}
          onSubmit={handleSubmitCheckIn}
        />
      )}

      {/* Notification / Quiet Hours Modal */}
      <NotificationSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
