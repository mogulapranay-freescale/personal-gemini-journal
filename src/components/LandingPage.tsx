import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, BookOpen, MessageSquare, ArrowRight, Lock, Key } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div id="landing-page" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header id="landing-header" className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Gemini Reflections</h1>
            <p className="text-xs text-slate-400">Authenticated AI Journal & Insights</p>
          </div>
        </div>

        <button
          id="btn-header-signin"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
        >
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Main Hero Container */}
      <main id="landing-hero" className="w-full max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-200 text-sm max-w-lg text-left flex items-start justify-between gap-3 shadow-lg"
          >
            <div>
              <p className="font-semibold">Authentication Notice</p>
              <p className="text-xs mt-1 text-rose-300">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-xs text-rose-400 hover:text-white px-2 py-1 bg-rose-900/50 rounded"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-indigo-300 mb-6 backdrop-blur-sm">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Strict User-Isolated Cloud Firestore Storage & Gemini 3.6 Flash</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-3xl">
          Deep reflection, brainstorms, and clarity with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-sky-400">
            Gemini AI
          </span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Capture thoughts, brainstorm complex ideas, and engage in multi-turn dialogues with an intelligent reflection partner. Your entries are isolated securely to your personal account.
        </p>

        {/* Primary Action Button */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="btn-hero-signin"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-base transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isSigningIn ? 'Connecting to Google...' : 'Sign In with Google to Start'}</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div id="landing-features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Multi-Turn Journaling</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Write unstructured notes, reflections, or goals. Continue the conversation across multiple turns to drill down on nuances.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Gemini 3.6 Flash Engine</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Extracts high-level summaries, key insights, and actionable brainstorm ideas with resilient fallback redundancy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">User-Isolated Security</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Enforced by Cloud Firestore security rules. No other user or unauthorized request can access your private reflections.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing-footer" className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-slate-400" />
          <span>Server-Side Gemini API Proxy & Firestore Security Rules Enforced</span>
        </div>
        <p>© 2026 Gemini Reflection Journal. Authenticated with Firebase.</p>
      </footer>
    </div>
  );
};
