import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Initializing Gemini Reflection Journal...</p>
        <p className="text-xs text-slate-500 mt-1">Connecting to Firebase & Cloud Firestore...</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
