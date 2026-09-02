import React, { useState } from 'react';
import {
  Sparkles,
  Tag,
} from 'lucide-react';
import { Mood } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface ReflectionComposerProps {
  onSaveAndAnalyze: (data: {
    title: string;
    content: string;
    mood?: Mood;
    tags: string[];
  }) => Promise<void>;
  loading: boolean;
}

const INSPIRATION_PROMPTS = [
  {
    label: 'Daily Wrap-Up',
    prompt: 'What was the single most meaningful accomplishment today, and what friction slowed you down?',
  },
  {
    label: 'Focus & Energy',
    prompt: 'Where did your energy peak and dip today? What triggered any mental fatigue or distraction?',
  },
  {
    label: 'Conflict & Boundaries',
    prompt: 'Did you say yes to something you wished you had declined? What boundary can you establish next time?',
  },
  {
    label: 'Mindset & Growth',
    prompt: 'What belief or fear held you back today, and what is the smallest low-risk action you can take to test it?',
  },
];

const MOOD_OPTIONS: Array<{ value: Mood; label: string; icon: string }> = [
  { value: 'energized', label: 'Energized', icon: '⚡' },
  { value: 'calm', label: 'Calm', icon: '🍃' },
  { value: 'thoughtful', label: 'Thoughtful', icon: '💭' },
  { value: 'grateful', label: 'Grateful', icon: '🙏' },
  { value: 'curious', label: 'Curious', icon: '🔍' },
  { value: 'frustrated', label: 'Frustrated', icon: '⚠️' },
  { value: 'overwhelmed', label: 'Overwhelmed', icon: '🌊' },
  { value: 'restless', label: 'Restless', icon: '🔄' },
];

export const ReflectionComposer: React.FC<ReflectionComposerProps> = ({
  onSaveAndAnalyze,
  loading,
}) => {
  const { currentTheme } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Growth', 'Daily']);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await onSaveAndAnalyze({
      title: title.trim() || 'Daily Reflection',
      content: content.trim(),
      mood,
      tags,
    });
  };

  const applyPrompt = (promptText: string) => {
    if (content.trim()) {
      setContent(prev => `${prev}\n\n${promptText}`);
    } else {
      setContent(promptText);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-slate-100">
          New Journal Reflection
        </h1>
        <p className="text-sm text-stone-500 dark:text-slate-400">
          Write down your thoughts, wins, and obstacles. Gemini will synthesize key patterns and propose right-sized action steps.
        </p>
      </div>

      {/* Inspiration Prompts Bar */}
      <div className={`p-3.5 rounded-xl ${currentTheme.accentBg} border ${currentTheme.accentBorder} space-y-2`}>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${currentTheme.accentText}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Need a spark? Click a reflection inquiry:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INSPIRATION_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPrompt(item.prompt)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:text-stone-900 dark:hover:text-white transition-colors shadow-2xs font-medium"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <input
            id="reflection-title-input"
            type="text"
            placeholder="Reflection Title (e.g. Navigating Team Handoff Friction)..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={`w-full px-4 py-2.5 text-lg font-serif font-medium rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 ${currentTheme.ringClass} shadow-2xs`}
          />
        </div>

        {/* Mood Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 dark:text-slate-400 mb-1.5">
            How are you feeling right now?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(mood === m.value ? undefined : m.value)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  mood === m.value
                    ? `${currentTheme.primaryBtn} shadow-xs`
                    : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          <textarea
            id="reflection-content-textarea"
            rows={10}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Begin writing your honest thoughts here..."
            className={`w-full p-4 text-sm sm:text-base leading-relaxed rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 ${currentTheme.ringClass} shadow-2xs resize-y`}
          />
          <div className="absolute right-3 bottom-3 text-xs text-stone-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded">
            {wordCount} words
          </div>
        </div>

        {/* Tag Input */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs font-medium"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-600 text-stone-400 dark:text-slate-500"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Add tag + Enter..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="text-xs px-2 py-1 rounded-md border border-dashed border-stone-300 dark:border-slate-700 bg-transparent text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden w-28"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            id="submit-and-analyze-reflection-btn"
            type="submit"
            disabled={loading || !content.trim()}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${currentTheme.primaryBtn} text-sm font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50`}
          >
            <Sparkles className="w-4 h-4 text-white/90" />
            <span>{loading ? 'Synthesizing Patterns with Gemini...' : 'Analyze & Save Reflection'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
