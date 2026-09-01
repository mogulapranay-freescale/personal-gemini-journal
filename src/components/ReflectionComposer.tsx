import React, { useState } from 'react';
import { Sparkles, Send, Lightbulb, Compass, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { ReflectionMode, JournalReflection, ChatMessage } from '../types';

interface ReflectionComposerProps {
  currentReflection: JournalReflection | null;
  onSendMessage: (params: {
    prompt: string;
    mode: ReflectionMode;
    title: string;
    category: JournalReflection['category'];
  }) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ReflectionComposer: React.FC<ReflectionComposerProps> = ({
  currentReflection,
  onSendMessage,
  isGenerating,
  error,
  onRetry,
}) => {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState(currentReflection?.title || '');
  const [category, setCategory] = useState<JournalReflection['category']>(
    currentReflection?.category || 'Daily Log'
  );
  const [mode, setMode] = useState<ReflectionMode>('reflect');

  // Sync title and category when active reflection changes
  React.useEffect(() => {
    if (currentReflection) {
      setTitle(currentReflection.title);
      setCategory(currentReflection.category);
    } else {
      setTitle('');
      setCategory('Daily Log');
    }
  }, [currentReflection?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const activeTitle = title.trim() || (prompt.slice(0, 40) + '...');
    const messagePrompt = prompt.trim();
    
    // Clear prompt immediately for responsive feel, but preserve inputs on error
    setPrompt('');
    
    try {
      await onSendMessage({
        prompt: messagePrompt,
        mode,
        title: activeTitle,
        category,
      });
    } catch {
      // Restore prompt if failed
      setPrompt(messagePrompt);
    }
  };

  const isFollowUp = Boolean(currentReflection && currentReflection.turnCount > 0);

  return (
    <div id="reflection-composer" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {error && (
        <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRetry}
            className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-xs font-medium flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title and Category for new entries */}
        {!isFollowUp && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="reflection-title-input" className="block text-xs font-medium text-slate-300 mb-1">
                Entry Title / Topic
              </label>
              <input
                id="reflection-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Planning my quarterly roadmap, Overcoming self-doubt..."
                disabled={isGenerating}
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="reflection-category-select" className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                id="reflection-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                disabled={isGenerating}
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none transition-colors"
              >
                <option value="Daily Log">Daily Log</option>
                <option value="Deep Reflection">Deep Reflection</option>
                <option value="Idea Brainstorm">Idea Brainstorm</option>
                <option value="Work & Focus">Work & Focus</option>
                <option value="Mindfulness">Mindfulness</option>
              </select>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium mr-1">AI Focus:</span>
          <button
            type="button"
            onClick={() => setMode('reflect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              mode === 'reflect'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Reflect & Clarify
          </button>
          <button
            type="button"
            onClick={() => setMode('brainstorm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              mode === 'brainstorm'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Brainstorm Ideas
          </button>
          <button
            type="button"
            onClick={() => setMode('summarize')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              mode === 'summarize'
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Synthesize
          </button>
        </div>

        {/* Prompt Text Area */}
        <div className="relative">
          <textarea
            id="reflection-prompt-textarea"
            rows={isFollowUp ? 3 : 4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              isFollowUp
                ? 'Add follow-up thoughts or ask Gemini for deeper exploration...'
                : 'Write what is on your mind today: thoughts, decisions, challenges, or goals you want to explore...'
            }
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
            className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors resize-none"
          />

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-400">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">Ctrl+Enter</kbd> to reflect
            </p>

            <button
              id="btn-submit-reflection"
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Gemini Reflecting...</span>
                </>
              ) : (
                <>
                  <span>{isFollowUp ? 'Send Reply' : 'Generate Reflection'}</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
