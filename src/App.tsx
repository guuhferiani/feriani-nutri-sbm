import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ResetPassword } from './components/ResetPassword';
import { Dashboard } from './components/Dashboard';
import { Loader2, Leaf } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'reset-password'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if URL has a reset token or query param
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    // Also check hash in case Neon Auth returns token in fragment
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const hashToken = hashParams.get('token');

    const effectiveToken = token || hashToken;

    if (effectiveToken) {
      setResetToken(effectiveToken);
      setAuthView('reset-password');
    }
  }, []);

  const handleResetComplete = () => {
    // Clean query parameters from URL cleanly
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    setResetToken(null);
    setAuthView('login');
  };

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

  // Reset Password View when token is present
  if (authView === 'reset-password' && resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onSuccess={handleResetComplete}
        onCancel={handleResetComplete}
      />
    );
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
