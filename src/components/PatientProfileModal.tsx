import React, { useEffect, useState } from 'react';
import { 
  X, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle, 
  AlertCircle, 
  Plus, 
  Heart, 
  Sparkles, 
  Sun, 
  Loader2
} from 'lucide-react';
import { getPacienteDetails } from '../lib/neon-db';
import type { Paciente, Consulta } from '../types/database';

interface PatientProfileModalProps {
  patientId: string;
  nutricionistaId: string;
  onClose: () => void;
  onOpenNewConsultation: (patientId: string) => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  patientId,
  nutricionistaId,
  onClose,
  onOpenNewConsultation,
}) => {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'consultas' | 'anamnese'>('geral');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPacienteDetails(patientId, nutricionistaId);
        if (mounted) {
          if (data) {
            setPaciente(data.paciente);
            setConsultas(data.consultas);
          } else {
            setError('Paciente não encontrado.');
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Erro ao carregar prontuário.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [patientId, nutricionistaId]);

  const formatBrazilianDate = (dateVal?: any) => {
    if (!dateVal) return '-';
    try {
      let str = '';
      if (dateVal instanceof Date) {
        if (isNaN(dateVal.getTime())) return '-';
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

  const calculateIMC = (peso?: number | null, altura?: number | null) => {
    if (!peso || !altura || altura <= 0) return null;
    const imc = peso / (altura * altura);
    let classif = '';
    if (imc < 18.5) classif = 'Abaixo do peso';
    else if (imc < 24.9) classif = 'Peso normal';
    else if (imc < 29.9) classif = 'Sobrepeso';
    else if (imc < 34.9) classif = 'Obesidade Grau I';
    else if (imc < 39.9) classif = 'Obesidade Grau II';
    else classif = 'Obesidade Grau III';

    return { value: imc.toFixed(1), classif };
  };

  const latestConsulta = consultas.length > 0 ? consultas[0] : null;
  const currentWeight = latestConsulta?.peso ?? paciente?.peso_inicial;
  const imcData = calculateIMC(currentWeight, paciente?.altura);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 to-emerald-50/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-emerald-600/20">
              {paciente?.nome
                ? paciente.nome
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {paciente?.nome || 'Perfil do Paciente'}
                </h2>
                {paciente?.sexo && (
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {paciente.sexo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prontuário clínico e histórico de consultas no Neon
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-slate-500">
              Carregando dados do paciente no Neon...
            </p>
          </div>
        ) : error || !paciente ? (
          <div className="flex-1 p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">{error || 'Paciente não encontrado'}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Peso Atual
                </span>
                <div className="text-lg font-bold text-slate-900">
                  {currentWeight ? `${currentWeight} kg` : '-'}
                </div>
                {paciente.peso_inicial && (
                  <span className="text-[10px] text-slate-500">
                    Inicial: {paciente.peso_inicial} kg
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Altura
                </span>
                <div className="text-lg font-bold text-slate-900">
                  {paciente.altura ? `${paciente.altura} m` : '-'}
                </div>
                <span className="text-[10px] text-slate-500">Estatura</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  IMC
                </span>
                <div className="text-lg font-bold text-slate-900">
                  {imcData?.value ? `${imcData.value} kg/m²` : '-'}
                </div>
                <span className="text-[10px] font-medium text-emerald-700">
                  {imcData?.classif || '-'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Consultas
                </span>
                <div className="text-lg font-bold text-slate-900">
                  {consultas.length}
                </div>
                <span className="text-[10px] text-slate-500">
                  {consultas.length > 0 ? `Última: ${formatBrazilianDate(latestConsulta?.data_consulta)}` : 'Nenhuma'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200/80 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('geral')}
                className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'geral'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Visão Geral & Contato
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('consultas')}
                className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'consultas'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Histórico de Consultas</span>
                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                  {consultas.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('anamnese')}
                className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'anamnese'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Anamnese & Rotina
              </button>
            </div>

            {/* Tab: Geral */}
            {activeTab === 'geral' && (
              <div className="space-y-6">
                {/* Contact card */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Dados de Contato
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{paciente.email || 'E-mail não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{paciente.telefone || 'Telefone não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Nascimento: {formatBrazilianDate(paciente.data_nascimento)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Cadastrado em: {formatBrazilianDate(paciente.created_at)}</span>
                    </div>
                  </div>

                  {paciente.whatsapp && (
                    <div className="pt-2">
                      <a
                        href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(paciente.nome.split(' ')[0])},%20tudo%20bem?`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Conversar no WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Objectives */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Objetivos Principais</span>
                  </h3>
                  {paciente.objetivos && paciente.objetivos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {paciente.objetivos.map((obj, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-100/80 text-emerald-800 rounded-full text-xs font-semibold">
                          {obj}
                        </span>
                      ))}
                    </div>
                  )}
                  {paciente.objetivo_texto && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                      "{paciente.objetivo_texto}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Consultas */}
            {activeTab === 'consultas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Histórico Clínico e Medidas
                  </h3>
                  <button
                    type="button"
                    onClick={() => onOpenNewConsultation(paciente.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Consulta</span>
                  </button>
                </div>

                {consultas.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium text-slate-600">
                      Nenhuma consulta registrada para este paciente ainda.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenNewConsultation(paciente.id)}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Registrar primeira consulta agora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consultas.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-sm font-bold text-slate-900">
                              Consulta em {formatBrazilianDate(c.data_consulta)}
                            </span>
                          </div>
                          {c.proximo_retorno && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              Retorno: {formatBrazilianDate(c.proximo_retorno)}
                            </span>
                          )}
                        </div>

                        {/* Measurements */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {c.peso && (
                            <div className="p-2 rounded-xl bg-slate-50">
                              <span className="text-slate-400 block text-[10px]">Peso</span>
                              <strong className="text-slate-800">{c.peso} kg</strong>
                            </div>
                          )}
                          {c.cintura && (
                            <div className="p-2 rounded-xl bg-slate-50">
                              <span className="text-slate-400 block text-[10px]">Cintura</span>
                              <strong className="text-slate-800">{c.cintura} cm</strong>
                            </div>
                          )}
                          {c.quadril && (
                            <div className="p-2 rounded-xl bg-slate-50">
                              <span className="text-slate-400 block text-[10px]">Quadril</span>
                              <strong className="text-slate-800">{c.quadril} cm</strong>
                            </div>
                          )}
                          {c.percentual_gordura && (
                            <div className="p-2 rounded-xl bg-slate-50">
                              <span className="text-slate-400 block text-[10px]">% Gordura</span>
                              <strong className="text-slate-800">{c.percentual_gordura}%</strong>
                            </div>
                          )}
                        </div>

                        {c.observacoes && (
                          <div className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                            <span className="font-semibold text-slate-700 block mb-1">Observações da consulta:</span>
                            {c.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Anamnese */}
            {activeTab === 'anamnese' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Routine */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Rotina e Hábitos</span>
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span>Horário acorda:</span>
                        <strong>{paciente.horario_acorda || '-'}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span>Horário dorme:</span>
                        <strong>{paciente.horario_dorme || '-'}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span>Água diária:</span>
                        <strong>{paciente.litros_agua ? `${paciente.litros_agua} Litros` : '-'}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span>Refeições/dia:</span>
                        <strong>{paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições` : '-'}</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Atividade física:</span>
                        <strong>{paciente.atividade_fisica ? 'Sim' : 'Não'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Health and Clinical Conditions */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>Saúde & Restrições</span>
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Patologias:</span>
                        <strong>
                          {paciente.patologias && paciente.patologias.length > 0
                            ? paciente.patologias.join(', ')
                            : 'Nenhuma informada'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Alergias / Intolerâncias:</span>
                        <strong>
                          {paciente.alergias && paciente.alergias.length > 0
                            ? paciente.alergias.join(', ')
                            : 'Nenhuma informada'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Medicamentos:</span>
                        <strong>{paciente.medicamentos || 'Nenhum'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Suplementos:</span>
                        <strong>{paciente.suplementos || 'Nenhum'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-all cursor-pointer"
          >
            Fechar
          </button>

          {paciente && (
            <button
              type="button"
              onClick={() => onOpenNewConsultation(paciente.id)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Consulta</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
