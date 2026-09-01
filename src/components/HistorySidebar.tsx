import React from 'react';
import { JournalReflection } from '../types';
import { BookOpen, Plus, Trash2, ChevronRight, Sparkles, MessageSquare, BarChart3 } from 'lucide-react';

interface HistorySidebarProps {
  reflections: JournalReflection[];
  activeId: string | null;
  activeView: 'journal' | 'growth';
  onSelectReflection: (reflection: JournalReflection) => void;
  onNewReflection: () => void;
  onSelectView: (view: 'journal' | 'growth') => void;
  onDeleteReflection: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  reflections,
  activeId,
  activeView,
  onSelectReflection,
  onNewReflection,
  onSelectView,
  onDeleteReflection,
  isLoading,
}) => {
  return (
    <aside id="history-sidebar" className="w-full lg:w-80 flex flex-col bg-slate-900/90 border-r border-slate-800 h-full">
      {/* Navigation Options: Growth Dashboard & New Reflection */}
      <div className="p-3.5 border-b border-slate-800 space-y-2">
        <button
          id="btn-my-growth"
          onClick={() => onSelectView('growth')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
            activeView === 'growth'
              ? 'bg-violet-950/60 border-violet-500/60 text-violet-200 shadow-md shadow-violet-950/40'
              : 'bg-slate-800/50 border-slate-700/60 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span>📊 My Growth</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-70" />
        </button>

        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Past Entries</h3>
          </div>
          <button
            id="btn-new-reflection"
            onClick={onNewReflection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      {/* List of Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="p-4 text-center text-xs text-slate-400">
            <Sparkles className="w-4 h-4 animate-spin text-indigo-400 mx-auto mb-2" />
            Loading your private journal...
          </div>
        )}

        {!isLoading && reflections.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-medium text-slate-300">No reflections yet</p>
            <p className="mt-1 text-slate-500">Write your first reflection to receive AI synthesis and growth insights.</p>
          </div>
        )}

        {reflections.map((item) => {
          const isActive = activeView === 'journal' && item.id === activeId;
          return (
            <div
              key={item.id}
              onClick={() => {
                onSelectView('journal');
                onSelectReflection(item);
              }}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-950/40'
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 mb-1">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                    {item.title || 'Untitled Reflection'}
                  </h4>
                  {item.summary && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {item.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span>
                      {new Date(item.updatedAt || item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {item.turnCount || 1} turns
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full pt-1">
                  <button
                    title="Delete entry"
                    onClick={(e) => onDeleteReflection(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {isActive && <ChevronRight className="w-4 h-4 text-indigo-400 mt-2" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
