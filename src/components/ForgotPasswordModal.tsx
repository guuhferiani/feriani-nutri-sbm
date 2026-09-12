import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, X, KeyRound } from 'lucide-react';
import { neonForgotPassword } from '../lib/neon-auth';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail profissional.');
      return;
    }

    setLoading(true);
    try {
      await neonForgotPassword(cleanEmail);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível solicitar a recuperação de senha no momento.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  Link de recuperação enviado!
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Enviamos as instruções para o e-mail: <br />
                  <strong className="text-slate-800 font-semibold">{email}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  Próximos passos:
                </p>
                <p>1. Acesse sua caixa de entrada e procure pelo e-mail do <strong>Feriani Nutri</strong>.</p>
                <p>2. Caso não localize na caixa principal, verifique sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.</p>
                <p>3. Clique no link recebido para cadastrar sua nova senha segura.</p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm"
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <div>
              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    Recuperar Senha
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insira seu e-mail para receber o link de redefinição
                  </p>
                </div>
              </div>

              {/* Error alert */}
              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                  <div className="leading-relaxed">{error}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    E-mail profissional cadastrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mariana@nutricao.com.br"
                      required
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    O link de redefinição será válido por 30 minutos.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors cursor-pointer text-sm text-center"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
