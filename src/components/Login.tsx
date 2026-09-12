import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { neonSignInWithMagicLink } from '../lib/neon-auth';

interface LoginProps {
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      await neonSignInWithMagicLink(cleanEmail);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar o Link Mágico no momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50/50 via-slate-50 to-teal-50/40 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 sm:p-10 relative z-10">
        {/* Brand Logo */}
        <div className="text-center flex flex-col items-center mb-8">
          <BrandLogo size="lg" className="mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Bem-vinda de volta
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Acesse sua conta para gerenciar seus pacientes
          </p>
        </div>

        {/* Auth Method Selector Tabs */}
        <div className="flex p-1 mb-6 bg-slate-100 rounded-xl border border-slate-200/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setLoginMethod('password'); setError(null); setMagicLinkSent(false); }}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer text-center ${
              loginMethod === 'password'
                ? 'bg-white text-slate-800 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Senha padrão
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('magic-link'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              loginMethod === 'magic-link'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Link Mágico ✨</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="text-sm font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {loginMethod === 'magic-link' ? (
          magicLinkSent ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Link de Acesso Enviado!
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Enviamos o link de login instantâneo para: <br />
                  <strong className="text-slate-800 font-semibold">{email}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 text-left space-y-1">
                <p className="font-semibold text-slate-700">Como entrar:</p>
                <p>1. Acesse seu e-mail e clique no botão de acesso do <strong>Feriani Nutri</strong>.</p>
                <p>2. Você será redirecionada automaticamente para o sistema, sem digitar senha!</p>
              </div>

              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer pt-2"
              >
                Reenviar ou usar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-5 animate-in fade-in">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/50 text-xs text-emerald-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Acesso sem senha:</strong> Digite seu e-mail e receba um link de entrada com 1 clique direto na sua caixa de entrada.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  E-mail profissional
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando Link Mágico...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Link de Acesso</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-in fade-in">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                E-mail profissional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-all cursor-pointer"
                >
                  Esqueci minha senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Link to Register */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Não tem conta?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-all cursor-pointer"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
      />
    </div>
  );
};
