import React from 'react';
import { ChatMessage, JournalReflection } from '../types';
import { Sparkles, User, Lightbulb, Compass, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface ReflectionViewProps {
  reflection: JournalReflection;
  messages: ChatMessage[];
  onSelectSuggestion?: (text: string) => void;
}

export const ReflectionView: React.FC<ReflectionViewProps> = ({
  reflection,
  messages,
  onSelectSuggestion,
}) => {
  return (
    <div id="reflection-thread-view" className="space-y-6 pb-6">
      {/* Header Info */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
            {reflection.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(reflection.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">{reflection.title}</h2>

        {/* AI High-Level Summary Card */}
        {reflection.summary && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Executive AI Synthesis
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{reflection.summary}</p>
          </div>
        )}

        {/* Key Insights & Brainstorm Cards */}
        {((reflection.keyInsights && reflection.keyInsights.length > 0) ||
          (reflection.brainstormIdeas && reflection.brainstormIdeas.length > 0)) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {reflection.keyInsights && reflection.keyInsights.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <p className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 mb-2">
                  <Compass className="w-3.5 h-3.5" /> Key Insights
                </p>
                <ul className="space-y-1.5">
                  {reflection.keyInsights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-sky-400 mt-0.5 shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reflection.brainstormIdeas && reflection.brainstormIdeas.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5" /> Brainstormed Angles
                </p>
                <ul className="space-y-1.5">
                  {reflection.brainstormIdeas.map((idea, idx) => (
                    <li
                      key={idx}
                      onClick={() => onSelectSuggestion && onSelectSuggestion(`Let's explore this angle: "${idea}"`)}
                      className="text-xs text-slate-300 flex items-start gap-2 hover:text-amber-200 cursor-pointer transition-colors"
                    >
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-Turn Messages Stream */}
      <div className="space-y-4">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id || index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-3.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none ml-10'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none mr-10 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-75">
                <span className="font-semibold">
                  {msg.role === 'user' ? 'Your Journal Note' : 'Gemini Reflection'}
                </span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
