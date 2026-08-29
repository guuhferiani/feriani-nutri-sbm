import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight
} from 'lucide-react';
import { getPacientes } from '../lib/neon-db';
import type { Paciente } from '../types/database';

interface PatientsListProps {
  nutricionistaId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenNewPatient: () => void;
  onOpenNewConsultation?: (patientId?: string) => void;
}

export const PatientsList: React.FC<PatientsListProps> = ({
  nutricionistaId,
  onSelectPatient,
  onOpenNewPatient,
}) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPacientes(nutricionistaId, search);
      setPacientes(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de pacientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (nutricionistaId) {
        fetchList(searchTerm);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, nutricionistaId]);

  const formatBrazilianDate = (dateVal?: any) => {
    if (!dateVal) return null;
    try {
      let str = '';
      if (dateVal instanceof Date) {
        if (isNaN(dateVal.getTime())) return null;
        str = dateVal.toISOString().split('T')[0];
      } else {
        str = String(dateVal).split('T')[0];
      }
      const parts = str.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return str;
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Gestão de Pacientes
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Prontuários Neon
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pacientes Cadastrados
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Consulte prontuários, objetivos e histórico de atendimentos clínicos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchList(searchTerm)}
            disabled={loading}
            title="Atualizar lista"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenNewPatient}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente por nome..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold self-end sm:self-center">
          {pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading && pacientes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-white rounded-3xl animate-pulse border border-slate-100 shadow-2xs" />
          ))}
        </div>
      ) : pacientes.length === 0 ? (
        <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <Users className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800">
              {searchTerm 
                ? 'Nenhum paciente encontrado para esta busca' 
                : 'Nenhum paciente cadastrado ainda'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchTerm 
                ? 'Verifique o nome digitado ou limpe a busca para ver todos os pacientes.'
                : 'Comece adicionando seu primeiro paciente através do formulário completo de cadastro.'}
            </p>
          </div>
          {!searchTerm && (
            <button
              type="button"
              onClick={onOpenNewPatient}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Primeiro Paciente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pacientes.map((p) => {
            const initials = p.nome
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const ultimaConsultaFormatada = formatBrazilianDate(p.ultima_consulta);

            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Name and Avatar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {p.nome}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {p.email || p.telefone || 'Sem contato cadastrado'}
                        </p>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center transition-colors flex-shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Objectives Badge / Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-100/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Objetivo Principal
                    </span>
                    {p.objetivos && p.objetivos.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {p.objetivos.slice(0, 2).map((obj, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200/50"
                          >
                            {obj}
                          </span>
                        ))}
                        {p.objetivos.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold">
                            +{p.objetivos.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        {p.objetivo_texto ? `"${p.objetivo_texto.slice(0, 30)}..."` : 'Não informado'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Last Consultation Date */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 font-medium">Última consulta:</span>
                  </div>

                  {ultimaConsultaFormatada ? (
                    <strong className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                      {ultimaConsultaFormatada}
                    </strong>
                  ) : (
                    <span className="text-slate-400 font-semibold text-[11px]">
                      Sem consultas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
