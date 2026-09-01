import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeUserReflections,
  subscribeReflectionMessages,
  saveJournalReflection,
  saveReflectionMessage,
  deleteJournalReflection,
} from '../lib/firestoreService';
import { JournalReflection, ChatMessage, ReflectionMode } from '../types';
import { HistorySidebar } from './HistorySidebar';
import { ReflectionView } from './ReflectionView';
import { ReflectionComposer } from './ReflectionComposer';
import { GrowthDashboard } from './GrowthDashboard';
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
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

  // Subscribe to user reflections
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

  // Subscribe to messages of active reflection
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

  const handleStartNewReflection = () => {
    setSelectedReflection(null);
    setMessages([]);
    setApiError(null);
    setActiveView('journal');
  };

  const handleSelectReflection = (reflection: JournalReflection) => {
    setSelectedReflection(reflection);
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
    const reflectionId = selectedReflection?.id || `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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

      // 4. Update UI active selection
      setSelectedReflection(updatedReflection);
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
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3">
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
            <span className="text-xs font-medium text-slate-200">
              {profile?.displayName || user?.displayName || user?.email || 'User'}
            </span>
          </div>

          <button
            id="btn-signout"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800 border border-slate-700 text-slate-300 text-xs font-medium transition-all"
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
            <GrowthDashboard
              reflections={reflections}
              onStartNew={handleStartNewReflection}
            />
          </main>
        ) : (
          <main id="dashboard-stage" className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-between">
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
    </div>
  );
};

