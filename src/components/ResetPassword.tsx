import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { neonResetPassword } from '../lib/neon-auth';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  token,
  onSuccess,
  onCancel,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha ambos os campos de senha.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    setLoading(true);
    try {
      await neonResetPassword(newPassword, token);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível redefinir a senha. O link pode ter expirado.');
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
        <div className="text-center flex flex-col items-center mb-6">
          <BrandLogo size="lg" className="mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isSuccess ? 'Senha atualizada!' : 'Redefinir sua senha'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {isSuccess 
              ? 'Suas novas credenciais já estão ativas' 
              : 'Crie uma nova senha segura para acessar sua conta'}
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-sm text-emerald-800 leading-relaxed">
              Sua senha foi redefinida com sucesso! Você já pode realizar o login normalmente.
            </div>

            <button
              type="button"
              onClick={onSuccess}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <span>Fazer Login agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <div className="text-sm font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Atualizando senha...</span>
                  </>
                ) : (
                  <>
                    <span>Salvar nova senha</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Voltar para a tela de Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
