import React from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  UserPlus, 
  CalendarPlus, 
  Sparkles, 
  MessageCircle, 
  ExternalLink, 
  ChevronRight, 
  Flame, 
  CalendarCheck 
} from 'lucide-react';
import type { DashboardStats } from '../types/database';
import type { AuthUser } from '../types/auth';

interface DashboardViewProps {
  user: AuthUser | null;
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectPatient: (patientId: string) => void;
  onNavigateToPatients: () => void;
  onOpenNewPatient: () => void;
  onOpenNewConsultation: () => void;
  onSeedDemoData?: () => void;
  seedingDemo?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  stats,
  loading,
  error,
  onRefresh,
  onSelectPatient,
  onNavigateToPatients,
  onOpenNewPatient,
  onOpenNewConsultation,
  onSeedDemoData,
  seedingDemo = false,
}) => {
  const firstName = user?.name ? user.name.split(' ')[0] : 'Nutricionista';

  const formatBrazilianDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Painel Clínico
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Neon PostgreSQL em Tempo Real
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Olá, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe seus pacientes e a evolução das consultas em tempo real.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Atualizar dados do banco Neon"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenNewPatient}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200/80 flex items-start justify-between gap-3 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Erro ao carregar dados do Neon</h4>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs font-semibold text-red-700 hover:underline cursor-pointer flex-shrink-0"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Demo Data Seed Banner if no patients exist */}
      {!loading && stats && stats.totalPacientes === 0 && onSeedDemoData && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ambiente de Demonstração</span>
            </div>
            <h3 className="text-base font-bold">
              Seu banco de dados Neon está pronto!
            </h3>
            <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
              Você pode cadastrar seu primeiro paciente ou gerar dados de exemplo (com consultas desta semana e pacientes sem retorno há mais de 30 dias) para testar o painel completo.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={onSeedDemoData}
              disabled={seedingDemo}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {seedingDemo ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Populando Neon...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Popular Dados de Teste</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3 Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ========================================================================= */}
        {/* CARD 1 — Total de pacientes ativos */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Card 1 • Pacientes Ativos
              </span>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              {loading && !stats ? (
                <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {stats?.totalPacientes ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {stats?.totalPacientes === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Total de pacientes sob os cuidados do nutricionista logado.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateToPatients}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 group-hover:gap-2 transition-all cursor-pointer"
            >
              <span>Gerenciar pacientes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenNewPatient}
              title="Adicionar novo paciente"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2 — Consultas da semana */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Card 2 • Consultas da Semana
              </span>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              {loading && !stats ? (
                <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {stats?.consultasSemana ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {stats?.consultasSemana === 1 ? 'consulta registrada' : 'consultas registradas'}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Atendimentos realizados ou agendados na semana atual.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenNewConsultation}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 group-hover:gap-2 transition-all cursor-pointer"
            >
              <span>Registrar nova consulta</span>
              <CalendarPlus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-medium text-slate-400">
              Segunda a Domingo
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 3 (Summary Card) — Pacientes sem retorno status */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Card 3 • Pacientes Sem Retorno
              </span>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs transition-colors ${
                (stats?.pacientesSemRetorno.length || 0) > 0 
                  ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' 
                  : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              {loading && !stats ? (
                <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-extrabold tracking-tight ${
                    (stats?.pacientesSemRetorno.length || 0) > 0 ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {stats?.pacientesSemRetorno.length ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {stats?.pacientesSemRetorno.length === 1 ? 'paciente requer atenção' : 'pacientes requerem atenção'}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Última consulta &gt; 30 dias atrás e sem retorno agendado.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Regra dos 30 dias
            </span>
            {(stats?.pacientesSemRetorno.length || 0) > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                <Flame className="w-3.5 h-3.5" />
                <span>Acompanhar abaixo</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Em dia</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED SECTION: Card 3 — Pacientes sem retorno list */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Pacientes sem Retorno
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Pacientes cuja última consulta foi realizada há mais de 30 dias e que ainda não possuem próximo retorno agendado.
            </p>
          </div>

          {stats && stats.pacientesSemRetorno.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60 self-start sm:self-auto">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{stats.pacientesSemRetorno.length} aguardando contato</span>
            </span>
          )}
        </div>

        {/* Loading state for Card 3 */}
        {loading && !stats ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : stats && stats.pacientesSemRetorno.length > 0 ? (
          /* List of patients without return */
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/40">
            {stats.pacientesSemRetorno.map((paciente) => (
              <div
                key={paciente.id}
                onClick={() => onSelectPatient(paciente.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-emerald-50/40 transition-colors cursor-pointer group"
              >
                {/* Patient Info */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100/70 text-amber-700 font-bold text-sm flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                    {paciente.nome
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(paciente.id);
                      }}
                      className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{paciente.nome}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>
                        Última consulta: <strong className="text-slate-700">{formatBrazilianDate(paciente.ultima_consulta)}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                        {paciente.dias_sem_consulta} dias sem consulta
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions for this patient */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {paciente.whatsapp && (
                    <a
                      href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(paciente.nome.split(' ')[0])},%20aqui%20é%20da%20clínica%20de%20nutrição.%20Vamos%20agendar%20sua%20consulta%20de%20retorno?`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Enviar mensagem no WhatsApp"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer border border-emerald-200/60"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPatient(paciente.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 group-hover:border-emerald-300 group-hover:text-emerald-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Ver perfil</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state: Exactly matching Prompt 3 rule */
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-50 border border-slate-100 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-bold text-slate-800">
                Nenhum paciente sem retorno no momento
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Parabéns! Todos os seus pacientes tiveram consultas registradas nos últimos 30 dias ou já possuem uma data de próximo retorno agendada.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Consultations this week preview */}
      {stats && stats.consultasSemanaList.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <CalendarCheck className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Consultas Realizadas Nesta Semana
              </h2>
            </div>
            <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
              {stats.consultasSemanaList.length} atendimento(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {stats.consultasSemanaList.map((c) => (
              <div 
                key={c.id} 
                onClick={() => onSelectPatient(c.paciente_id)}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50/40 hover:border-teal-200 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 truncate">
                    {c.paciente_nome || 'Paciente'}
                  </span>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-md">
                    {formatBrazilianDate(c.data_consulta)}
                  </span>
                </div>
                {c.peso && (
                  <div className="text-xs text-slate-500">
                    Peso aferido: <strong className="text-slate-700">{c.peso} kg</strong>
                  </div>
                )}
                {c.proximo_retorno && (
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Próximo retorno: {formatBrazilianDate(c.proximo_retorno)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
