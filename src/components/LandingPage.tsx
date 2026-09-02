import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { ThemeSelector } from './ThemeSelector.tsx';
import {
  Sparkles,
  Compass,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, loading, error } = useAuth();
  const { currentTheme } = useTheme();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-150">
      {/* Navigation Header */}
      <header className="border-b border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors"
              style={{ backgroundColor: currentTheme.primaryColor }}
            >
              <Sparkles className="w-5 h-5 text-white/90" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-stone-900 dark:text-white">Gemini Reflection</span>
              <span className={`ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${currentTheme.badgeBg} ${currentTheme.badgeText}`}>My Growth</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSelector />
            <button
              id="google-signin-header-btn"
              onClick={signInWithGoogle}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-stone-900 dark:bg-white text-stone-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex-1 flex flex-col items-center text-center">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm max-w-md w-full">
            {error}
          </div>
        )}

        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${currentTheme.badgeBg} border ${currentTheme.accentBorder} ${currentTheme.badgeText} text-xs font-semibold uppercase tracking-wider mb-6`}>
          <Compass className="w-3.5 h-3.5" />
          <span>Introspective AI &amp; Evidence-Based Habit Growth</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-stone-900 dark:text-slate-100 max-w-3xl leading-[1.15]">
          Turn daily thoughts into <span className={`italic ${currentTheme.accentText}`}>measurable personal momentum</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-stone-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          A continuous reflection loop that pairs Gemini AI insights with structured 7-day micro-experiments, Growth Guardian accountability, and user-isolated Firestore security.
        </p>

        {/* Growth Loop Graphic */}
        <div className="mt-10 py-3 px-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-300">
          <span className={currentTheme.accentText}>Reflect</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 dark:text-slate-600" />
          <span>Find Patterns</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 dark:text-slate-600" />
          <span className={currentTheme.accentText}>Small Action</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 dark:text-slate-600" />
          <span>Daily Check-in</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 dark:text-slate-600" />
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Adapt &amp; Grow</span>
        </div>

        {/* Sign In CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="google-signin-hero-btn"
            onClick={signInWithGoogle}
            disabled={loading}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 text-base font-semibold rounded-xl ${currentTheme.primaryBtn} shadow-md hover:shadow-lg disabled:opacity-50`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Start Your Growth Journey</span>
          </button>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${currentTheme.accentBg} ${currentTheme.accentText} flex items-center justify-center mb-4`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-slate-100 mb-2">Multi-Turn Gemini Dialogue</h3>
            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
              Explore your thoughts with a compassionate AI companion that extracts actionable takeaways and asks evocative follow-up questions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${currentTheme.accentBg} ${currentTheme.accentText} flex items-center justify-center mb-4`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-slate-100 mb-2">Growth Guardian &amp; Adaptation</h3>
            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
              Non-judgmental momentum monitoring. When consistency stalls, it automatically downsizes goals into friction-free 15-minute micro-habits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${currentTheme.accentBg} ${currentTheme.accentText} flex items-center justify-center mb-4`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-slate-100 mb-2">Isolated Firestore Privacy</h3>
            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
              Protected by owner-bound security rules. All reflections, experiments, and check-ins are strictly isolated to your verified account.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
            <span>End-to-end encrypted session with Google Cloud Run &amp; Firebase</span>
          </div>
          <div>Gemini Reflection &amp; My Growth &bull; Production Edition</div>
        </div>
      </footer>
    </div>
  );
};
