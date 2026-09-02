import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { Reflection } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface HistorySidebarProps {
  reflections: Reflection[];
  activeReflectionId: string | null;
  onSelectReflection: (id: string) => void;
  onNewReflection: () => void;
  onDeleteReflection: (id: string) => void;
  currentView: 'reflections' | 'growth';
  onSwitchView: (view: 'reflections' | 'growth') => void;
  onClose?: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  reflections,
  activeReflectionId,
  onSelectReflection,
  onNewReflection,
  onDeleteReflection,
  currentView,
  onSwitchView,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = reflections.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(query) ||
      r.content.toLowerCase().includes(query) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(query)))
    );
  });

  const handleSelect = (id: string) => {
    onSelectReflection(id);
    onSwitchView('reflections');
    // On small screens, close the drawer after selection
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const handleNew = () => {
    onNewReflection();
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const handleSwitchView = (view: 'reflections' | 'growth') => {
    onSwitchView(view);
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-stone-200 dark:border-slate-800 flex flex-col h-full shrink-0 transition-colors duration-150">
      {/* Top Action Switcher */}
      <div className="p-4 border-b border-stone-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200/60 dark:border-slate-700/60">
            <button
              id="nav-reflections-tab"
              onClick={() => handleSwitchView('reflections')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'reflections'
                  ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${currentTheme.iconAccent}`} />
              <span>Journal</span>
            </button>
            <button
              id="nav-growth-tab"
              onClick={() => handleSwitchView('growth')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'growth'
                  ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${currentTheme.iconAccent}`} />
              <span>My Growth</span>
            </button>
          </div>

          {onClose && (
            <button
              id="mobile-close-sidebar-btn"
              onClick={onClose}
              className="md:hidden p-2 text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-200 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          id="new-reflection-btn"
          onClick={handleNew}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${currentTheme.primaryBtn} text-xs font-semibold transition-all shadow-sm`}
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Reflection</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            id="reflection-search-input"
            type="text"
            placeholder="Search reflections &amp; tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-800/80 text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 ${currentTheme.ringClass}`}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800/80 p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-stone-400 dark:text-slate-500 text-xs">
            {searchQuery ? 'No matching reflections found.' : 'No reflections yet. Write your first entry to begin!'}
          </div>
        ) : (
          filtered.map(reflection => {
            const isSelected = activeReflectionId === reflection.id && currentView === 'reflections';
            const dateStr = new Date(reflection.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={reflection.id}
                onClick={() => handleSelect(reflection.id)}
                className={`group p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? `${currentTheme.activeItemBg} border ${currentTheme.activeItemBorder} shadow-xs`
                    : 'hover:bg-stone-50 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-stone-900 dark:text-slate-100 truncate">
                    {reflection.title || 'Untitled Reflection'}
                  </span>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteReflection(reflection.id);
                      }}
                      className="p-1 text-stone-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                      title="Delete reflection"
                      aria-label={`Delete reflection: ${reflection.title || 'Untitled Reflection'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {reflection.summary || reflection.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-slate-500 pt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </div>
                  {reflection.mood && (
                    <span className="px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 capitalize text-[10px]">
                      {reflection.mood}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
