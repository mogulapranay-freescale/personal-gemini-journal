import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'sage' | 'amber' | 'midnight' | 'slate' | 'rose';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  primaryColor: string;
  isDark: boolean;
  swatch: string[];
  
  // Tailwind utility helper strings
  primaryBtn: string;
  secondaryBtn: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  activeItemBg: string;
  activeItemBorder: string;
  badgeBg: string;
  badgeText: string;
  ringClass: string;
  progressBg: string;
  bannerGradient: string;
  activeTabBorder: string;
  activeTabText: string;
  iconAccent: string;
}

export const THEMES: Record<AppTheme, ThemeOption> = {
  sage: {
    id: 'sage',
    name: 'Sage & Forest',
    description: 'Calm botanical greens with soothing natural clarity',
    primaryColor: '#1b4332',
    isDark: false,
    swatch: ['#1b4332', '#2d6a4f', '#d8f3dc'],
    primaryBtn: 'bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700',
    secondaryBtn: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
    accentText: 'text-emerald-800 dark:text-emerald-400',
    accentBg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200/80 dark:border-emerald-800/80',
    activeItemBg: 'bg-emerald-50/90 dark:bg-emerald-950/50',
    activeItemBorder: 'border-emerald-300 dark:border-emerald-700',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950',
    badgeText: 'text-emerald-900 dark:text-emerald-300',
    ringClass: 'focus:ring-emerald-600',
    progressBg: 'bg-emerald-700 dark:bg-emerald-500',
    bannerGradient: 'from-emerald-50/90 via-stone-50 to-emerald-50/70 dark:from-emerald-950/50 dark:via-slate-900 dark:to-emerald-950/30 border-emerald-200/80 dark:border-emerald-800',
    activeTabBorder: 'border-emerald-800 dark:border-emerald-400',
    activeTabText: 'text-emerald-900 dark:text-emerald-200',
    iconAccent: 'text-emerald-700 dark:text-emerald-400',
  },
  amber: {
    id: 'amber',
    name: 'Warm Amber & Linen',
    description: 'Cozy editorial warmth with classic parchment depth',
    primaryColor: '#b45309',
    isDark: false,
    swatch: ['#78350f', '#d97706', '#fef3c7'],
    primaryBtn: 'bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-700',
    secondaryBtn: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
    accentText: 'text-amber-800 dark:text-amber-400',
    accentBg: 'bg-amber-50/80 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200/80 dark:border-amber-800/80',
    activeItemBg: 'bg-amber-50/90 dark:bg-amber-950/50',
    activeItemBorder: 'border-amber-300 dark:border-amber-700',
    badgeBg: 'bg-amber-100 dark:bg-amber-950',
    badgeText: 'text-amber-900 dark:text-amber-300',
    ringClass: 'focus:ring-amber-500',
    progressBg: 'bg-amber-700 dark:bg-amber-500',
    bannerGradient: 'from-amber-50/90 via-stone-50 to-amber-50/70 dark:from-amber-950/50 dark:via-slate-900 dark:to-amber-950/30 border-amber-200/80 dark:border-amber-800',
    activeTabBorder: 'border-amber-700 dark:border-amber-400',
    activeTabText: 'text-amber-900 dark:text-amber-200',
    iconAccent: 'text-amber-700 dark:text-amber-400',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Obsidian',
    description: 'Refined deep slate with starlight luminescence for low light',
    primaryColor: '#6366f1',
    isDark: true,
    swatch: ['#0f172a', '#312e81', '#818cf8'],
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30',
    secondaryBtn: 'bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/70 border border-indigo-800',
    accentText: 'text-indigo-400',
    accentBg: 'bg-indigo-950/40',
    accentBorder: 'border-indigo-800/80',
    activeItemBg: 'bg-indigo-950/60',
    activeItemBorder: 'border-indigo-600',
    badgeBg: 'bg-indigo-950',
    badgeText: 'text-indigo-300',
    ringClass: 'focus:ring-indigo-500',
    progressBg: 'bg-indigo-500',
    bannerGradient: 'from-indigo-950/50 via-slate-900 to-indigo-950/30 border-indigo-800',
    activeTabBorder: 'border-indigo-400',
    activeTabText: 'text-indigo-200',
    iconAccent: 'text-indigo-400',
  },
  slate: {
    id: 'slate',
    name: 'Nordic Slate & Sky',
    description: 'Clean Scandinavian minimalism with crisp azure tones',
    primaryColor: '#0369a1',
    isDark: false,
    swatch: ['#0f172a', '#0284c7', '#e0f2fe'],
    primaryBtn: 'bg-sky-700 hover:bg-sky-800 text-white dark:bg-sky-600 dark:hover:bg-sky-700',
    secondaryBtn: 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800',
    accentText: 'text-sky-800 dark:text-sky-400',
    accentBg: 'bg-sky-50/80 dark:bg-sky-950/40',
    accentBorder: 'border-sky-200/80 dark:border-sky-800/80',
    activeItemBg: 'bg-sky-50/90 dark:bg-sky-950/50',
    activeItemBorder: 'border-sky-300 dark:border-sky-700',
    badgeBg: 'bg-sky-100 dark:bg-sky-950',
    badgeText: 'text-sky-900 dark:text-sky-300',
    ringClass: 'focus:ring-sky-500',
    progressBg: 'bg-sky-700 dark:bg-sky-500',
    bannerGradient: 'from-sky-50/90 via-stone-50 to-sky-50/70 dark:from-sky-950/50 dark:via-slate-900 dark:to-sky-950/30 border-sky-200/80 dark:border-sky-800',
    activeTabBorder: 'border-sky-700 dark:border-sky-400',
    activeTabText: 'text-sky-900 dark:text-sky-200',
    iconAccent: 'text-sky-700 dark:text-sky-400',
  },
  rose: {
    id: 'rose',
    name: 'Terracotta & Rose',
    description: 'Earthy ceramic tones with gentle comforting warmth',
    primaryColor: '#9f1239',
    isDark: false,
    swatch: ['#881337', '#e11d48', '#ffe4e6'],
    primaryBtn: 'bg-rose-700 hover:bg-rose-800 text-white dark:bg-rose-600 dark:hover:bg-rose-700',
    secondaryBtn: 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
    accentText: 'text-rose-800 dark:text-rose-400',
    accentBg: 'bg-rose-50/80 dark:bg-rose-950/40',
    accentBorder: 'border-rose-200/80 dark:border-rose-800/80',
    activeItemBg: 'bg-rose-50/90 dark:bg-rose-950/50',
    activeItemBorder: 'border-rose-300 dark:border-rose-700',
    badgeBg: 'bg-rose-100 dark:bg-rose-950',
    badgeText: 'text-rose-900 dark:text-rose-300',
    ringClass: 'focus:ring-rose-500',
    progressBg: 'bg-rose-700 dark:bg-rose-500',
    bannerGradient: 'from-rose-50/90 via-stone-50 to-rose-50/70 dark:from-rose-950/50 dark:via-slate-900 dark:to-rose-950/30 border-rose-200/80 dark:border-rose-800',
    activeTabBorder: 'border-rose-700 dark:border-rose-400',
    activeTabText: 'text-rose-900 dark:text-rose-200',
    iconAccent: 'text-rose-700 dark:text-rose-400',
  },
};

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentTheme: ThemeOption;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('gemini_reflection_theme') as AppTheme;
    return saved && THEMES[saved] ? saved : 'sage';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('gemini_reflection_theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-sage', 'theme-amber', 'theme-midnight', 'theme-slate', 'theme-rose', 'dark');
    root.classList.add(`theme-${theme}`);
    if (THEMES[theme].isDark) {
      root.classList.add('dark');
    }
  }, [theme]);

  const currentTheme = THEMES[theme] || THEMES.sage;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentTheme,
        isDark: currentTheme.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
