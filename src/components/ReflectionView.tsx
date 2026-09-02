import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Send,
  ArrowRight,
  Zap,
  Trash2,
} from 'lucide-react';
import { Reflection } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface ReflectionViewProps {
  reflection: Reflection;
  onDelete: (id: string) => void;
  onCreateExperiment: (reflection: Reflection) => Promise<void>;
  onSendChatMessage: (reflectionId: string, message: string) => Promise<void>;
  experimentLoading: boolean;
  chatLoading: boolean;
}

export const ReflectionView: React.FC<ReflectionViewProps> = ({
  reflection,
  onDelete,
  onCreateExperiment,
  onSendChatMessage,
  experimentLoading,
  chatLoading,
}) => {
  const { currentTheme } = useTheme();
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'insights' | 'chat'>('insights');

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    await onSendChatMessage(reflection.id, msg);
  };

  const dateFormatted = new Date(reflection.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateFormatted}</span>
            {reflection.mood && (
              <span className={`ml-2 px-2 py-0.5 rounded-md ${currentTheme.badgeBg} ${currentTheme.badgeText} font-medium capitalize`}>
                Mood: {reflection.mood}
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-slate-100">
            {reflection.title || 'Untitled Reflection'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="turn-into-experiment-btn"
            onClick={() => onCreateExperiment(reflection)}
            disabled={experimentLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${currentTheme.primaryBtn} text-xs font-semibold transition-colors shadow-sm disabled:opacity-50`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{experimentLoading ? 'Generating Experiment...' : 'Convert to 7-Day Experiment'}</span>
          </button>
          <button
            onClick={() => onDelete(reflection.id)}
            className="p-2 text-stone-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-850 transition-colors"
            title="Delete reflection"
            aria-label={`Delete reflection: ${reflection.title || 'Untitled Reflection'}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-3">Your Journal Entry</h3>
        <p className="text-stone-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
          {reflection.content}
        </p>

        {reflection.tags && reflection.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
            {reflection.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Tabs: Insights vs Dialogue */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800">
          <button
            id="tab-insights-btn"
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === 'insights'
                ? `${currentTheme.activeTabBorder} ${currentTheme.activeTabText}`
                : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${currentTheme.iconAccent}`} />
            <span>Gemini Insights &amp; Micro-Actions</span>
          </button>

          <button
            id="tab-dialogue-btn"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === 'chat'
                ? `${currentTheme.activeTabBorder} ${currentTheme.activeTabText}`
                : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${currentTheme.iconAccent}`} />
            <span>Interactive AI Coaching Dialogue</span>
            {reflection.chatHistory && reflection.chatHistory.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText} text-[10px] font-bold`}>
                {reflection.chatHistory.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'insights' ? (
          <div className="space-y-4">
            {/* AI Summary */}
            {reflection.summary && (
              <div className={`p-5 rounded-2xl bg-gradient-to-br ${currentTheme.bannerGradient} shadow-2xs`}>
                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${currentTheme.accentText} mb-2`}>
                  <Sparkles className="w-4 h-4" />
                  <span>Empathetic AI Summary</span>
                </div>
                <p className="text-sm text-stone-800 dark:text-slate-200 leading-relaxed font-medium">
                  {reflection.summary}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Takeaways */}
              {reflection.keyTakeaways && reflection.keyTakeaways.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Evidence-Based Takeaways</span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-slate-300">
                    {reflection.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-2 shrink-0" />
                        <span className="leading-snug">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Steps */}
              {reflection.actionSteps && reflection.actionSteps.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                    <Zap className={`w-4 h-4 ${currentTheme.iconAccent}`} />
                    <span>Right-Sized Action Steps</span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-slate-300">
                    {reflection.actionSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.progressBg} mt-2 shrink-0`} />
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Follow-up Questions */}
            {reflection.followUpQuestions && reflection.followUpQuestions.length > 0 && (
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                  <HelpCircle className={`w-4 h-4 ${currentTheme.iconAccent}`} />
                  <span>Deepening Reflection Inquiries</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reflection.followUpQuestions.map((question, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTab('chat');
                        setChatInput(question);
                      }}
                      className={`p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 hover:${currentTheme.accentBorder} hover:shadow-xs cursor-pointer transition-all text-xs text-stone-700 dark:text-slate-200 leading-snug group`}
                    >
                      <div className="flex items-center justify-between gap-1 text-stone-500 dark:text-slate-400 mb-1">
                        <span className="font-semibold text-[10px] uppercase">Question {idx + 1}</span>
                        <ArrowRight className={`w-3 h-3 text-stone-400 dark:text-slate-500 group-hover:${currentTheme.accentText} transition-colors`} />
                      </div>
                      <p className="font-medium text-stone-800 dark:text-slate-100">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Multi-Turn AI Coaching Dialogue */
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-4 p-2">
              {(!reflection.chatHistory || reflection.chatHistory.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 dark:text-slate-500">
                  <MessageSquare className="w-8 h-8 mb-2 text-stone-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-stone-600 dark:text-slate-300">Start an inquiry session with your Growth Companion</p>
                  <p className="text-xs text-stone-400 dark:text-slate-500 max-w-sm mt-1">
                    Ask questions about recurring blocks, formulate experiments, or explore alternative perspectives on this entry.
                  </p>
                </div>
              ) : (
                reflection.chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="text-[10px] text-stone-400 dark:text-slate-500 font-semibold mb-1">
                      {msg.role === 'user' ? 'You' : 'Growth Companion'}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl max-w-lg text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? `${currentTheme.primaryBtn} rounded-tr-xs`
                          : 'bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-slate-400 italic">
                  <Sparkles className={`w-3.5 h-3.5 animate-spin ${currentTheme.iconAccent}`} />
                  <span>Growth Companion is reflecting...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2">
              <input
                id="reflection-chat-input"
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about this reflection or explore a solution..."
                className={`flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 ${currentTheme.ringClass}`}
              />
              <button
                id="send-reflection-chat-btn"
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className={`p-2.5 rounded-xl ${currentTheme.primaryBtn} transition-colors disabled:opacity-50`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
