import React, { useState, useEffect } from 'react';
import { 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  CalendarPlus
} from 'lucide-react';
import { createConsulta, getPacientes } from '../lib/neon-db';
import type { Consulta, Paciente } from '../types/database';

interface NewConsultationModalProps {
  nutricionistaId: string;
  defaultPatientId?: string;
  onClose: () => void;
  onSuccess: (newConsulta: Consulta) => void;
}

export const NewConsultationModal: React.FC<NewConsultationModalProps> = ({
  nutricionistaId,
  defaultPatientId,
  onClose,
  onSuccess,
}) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteId, setPacienteId] = useState(defaultPatientId || '');
  const [dataConsulta, setDataConsulta] = useState(() => new Date().toISOString().split('T')[0]);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatients() {
      try {
        const list = await getPacientes(nutricionistaId);
        setPacientes(list);
        if (!pacienteId && list.length > 0) {
          setPacienteId(list[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError('Não foi possível carregar os pacientes.');
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, [nutricionistaId, pacienteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) {
      setError('Por favor, selecione um paciente.');
      return;
    }
    if (!dataConsulta) {
      setError('Informe a data da consulta.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await createConsulta({
        paciente_id: pacienteId,
        data_consulta: dataConsulta,
        peso: peso ? parseFloat(peso.replace(',', '.')) : undefined,
        cintura: cintura ? parseFloat(cintura.replace(',', '.')) : undefined,
        quadril: quadril ? parseFloat(quadril.replace(',', '.')) : undefined,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : undefined,
        observacoes: observacoes.trim() || undefined,
        proximo_retorno: proximoRetorno || undefined,
      });

      onSuccess(created);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar consulta no Neon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-teal-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registrar Consulta</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Salvar atendimento e evolução antropométrica no Neon
              </p>
            </div>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paciente *
            </label>
            {loadingPatients ? (
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ) : pacientes.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                Nenhum paciente cadastrado. Cadastre um paciente primeiro.
              </div>
            ) : (
              <select
                required
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
              >
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.telefone ? `(${p.telefone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dates grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Consulta *
              </label>
              <input
                type="date"
                required
                value={dataConsulta}
                onChange={(e) => setDataConsulta(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Próximo Retorno Agendado
              </label>
              <input
                type="date"
                value={proximoRetorno}
                onChange={(e) => setProximoRetorno(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Measurements grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Medidas Aferidas na Consulta
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 66.5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cintura (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  placeholder="Ex: 74"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Quadril (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  placeholder="Ex: 98"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  % Gordura
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={percentualGordura}
                  onChange={(e) => setPercentualGordura(e.target.value)}
                  placeholder="Ex: 22.5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Clínicas e Orientações
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Paciente relatou boa disposição, cumpriu os horários das refeições. Ajustamos plano para manutenção calórica..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
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
              disabled={loading || pacientes.length === 0}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando Consulta...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Atendimento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
