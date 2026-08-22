import React, { useState } from 'react';
import { 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { createPaciente } from '../lib/neon-db';
import type { Paciente } from '../types/database';

interface NewPatientModalProps {
  nutricionistaId: string;
  onClose: () => void;
  onSuccess: (newPatient: Paciente) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  nutricionistaId,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivosStr, setObjetivosStr] = useState('Emagrecimento, Reeducação alimentar');
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Moderado');
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('5');
  const [litrosAgua, setLitrosAgua] = useState('2.5');
  const [atividadeFisica, setAtividadeFisica] = useState(true);
  const [observacoes, setObservacoes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do paciente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const objetivos = objetivosStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createPaciente({
        nutricionista_id: nutricionistaId,
        nome: nome.trim(),
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
        whatsapp: (whatsapp || telefone).trim() || undefined,
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
        peso_inicial: pesoInicial ? parseFloat(pesoInicial.replace(',', '.')) : undefined,
        altura: altura ? parseFloat(altura.replace(',', '.')) : undefined,
        objetivos: objetivos.length > 0 ? objetivos : undefined,
        objetivo_texto: objetivoTexto.trim() || undefined,
        nivel_atividade: nivelAtividade,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : undefined,
        litros_agua: litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : undefined,
        atividade_fisica: atividadeFisica,
        observacoes: observacoes.trim() || undefined,
      });

      onSuccess(created);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar paciente no Neon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/40">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Novo Paciente</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastre um novo paciente no banco de dados Neon
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Identificação */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Identificação e Contato
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Beatriz Lima Ramos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="beatriz@exemplo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => {
                      setTelefone(e.target.value);
                      if (!whatsapp) setWhatsapp(e.target.value);
                    }}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sexo
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Medidas Iniciais */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Medidas Iniciais & Objetivos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peso Inicial (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pesoInicial}
                  onChange={(e) => setPesoInicial(e.target.value)}
                  placeholder="Ex: 68.5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Altura (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  placeholder="Ex: 1.65"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Objetivos (separados por vírgula)
              </label>
              <input
                type="text"
                value={objetivosStr}
                onChange={(e) => setObjetivosStr(e.target.value)}
                placeholder="Ex: Emagrecimento, Melhora intestinal, Hipertrofia"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição do Objetivo / Queixa Principal
              </label>
              <textarea
                rows={2}
                value={objetivoTexto}
                onChange={(e) => setObjetivoTexto(e.target.value)}
                placeholder="Ex: Busca emagrecimento saudável e melhora na disposição física para o dia a dia..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Section: Hábitos */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Hábitos e Rotina
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nível de Atividade
                </label>
                <select
                  value={nivelAtividade}
                  onChange={(e) => setNivelAtividade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="Sedentário">Sedentário</option>
                  <option value="Leve">Leve</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Intenso">Intenso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Água (Litros/dia)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={litrosAgua}
                  onChange={(e) => setLitrosAgua(e.target.value)}
                  placeholder="2.5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Refeições/dia
                </label>
                <input
                  type="number"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  placeholder="5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={atividadeFisica}
                  onChange={(e) => setAtividadeFisica(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <span>Pratica atividade física regularmente</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Gerais
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações complementares, alergias, medicações..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no Neon...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cadastrar Paciente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
