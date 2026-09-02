import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, AppTheme } from '../context/ThemeContext.tsx';

interface ThemeSelectorProps {
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ compact = false }) => {
  const { theme, setTheme, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="theme-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change app color theme"
        className={`flex items-center gap-1.5 rounded-lg border transition-all duration-150 ${
          compact
            ? 'p-2 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 border-stone-200 dark:border-slate-700'
            : 'px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 border-stone-200 dark:border-slate-750 shadow-2xs'
        }`}
        title={`Current Theme: ${currentTheme.name}`}
      >
        <div className="flex items-center gap-1">
          <div
            className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20"
            style={{ backgroundColor: currentTheme.primaryColor }}
          />
          {!compact && <span className="hidden sm:inline-block">{currentTheme.name}</span>}
        </div>
        <Palette className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2.5 py-1.5 border-b border-stone-100 dark:border-slate-800 mb-1">
            <div className="text-xs font-bold text-stone-900 dark:text-slate-100">Color Themes</div>
            <div className="text-[11px] text-stone-500 dark:text-slate-400">Choose your reflection atmosphere</div>
          </div>

          <div className="space-y-1">
            {(Object.keys(THEMES) as AppTheme[]).map(key => {
              const option = THEMES[key];
              const isSelected = theme === key;

              return (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-stone-100 dark:bg-slate-800 text-stone-900 dark:text-white font-semibold'
                      : 'text-stone-700 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Swatch dots */}
                    <div className="flex items-center -space-x-1">
                      {option.swatch.map((c, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-white dark:border-slate-900 shadow-2xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-[10px] text-stone-400 dark:text-slate-400 font-normal truncate max-w-[130px]">
                        {option.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
