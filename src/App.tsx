import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { Loader2, Leaf } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-pulse">
          <Leaf className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Carregando Feriani Nutri...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated, direct to Dashboard
  if (user) {
    return <Dashboard />;
  }

  // Otherwise, render Login or Register
  if (authView === 'register') {
    return <Register onNavigateToLogin={() => setAuthView('login')} />;
  }

  return <Login onNavigateToRegister={() => setAuthView('register')} />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
