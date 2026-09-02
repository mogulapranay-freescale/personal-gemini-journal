import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex flex-col items-center justify-center text-stone-600 dark:text-slate-300 gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-800 dark:bg-emerald-700 flex items-center justify-center text-white animate-pulse shadow-md">
          <Sparkles className="w-5 h-5 text-emerald-200" />
        </div>
        <div className="text-xs font-semibold tracking-wider text-stone-500 dark:text-slate-400 uppercase">
          Loading Gemini Reflection...
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
