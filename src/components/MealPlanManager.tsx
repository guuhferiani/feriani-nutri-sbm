import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  FileText, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  ArrowLeft, 
  Coffee, 
  Apple, 
  Utensils, 
  Sun, 
  Moon,
  RotateCcw,
  Pencil
} from 'lucide-react';
import type { 
  Paciente, 
  PlanoAlimentar, 
  DiaPlano, 
  PlanoSemanalConteudo, 
  RefeicoesDia 
} from '../types/database';
import { savePlanoAlimentar, deletePlanoAlimentar } from '../lib/neon-db';

interface MealPlanManagerProps {
  paciente: Paciente;
  planos: PlanoAlimentar[];
  onPlanosUpdated: (updatedPlanos: PlanoAlimentar[]) => void;
  showToast: (msg: string) => void;
}

const DIAS_DA_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

type RefeicaoKey = keyof RefeicoesDia;

const REFEICOES_CONFIG: {
  key: RefeicaoKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  description: string;
}[] = [
  {
    key: 'cafe_da_manha',
    label: 'Café da Manhã',
    icon: Coffee,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Primeira refeição matinal para quebra de jejum'
  },
  {
    key: 'lanche_manha',
    label: 'Lanche da Manhã',
    icon: Apple,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Colação rápida para controle glicêmico e saciedade'
  },
  {
    key: 'almoco',
    label: 'Almoço',
    icon: Utensils,
    color: 'text-teal-600',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Refeição principal completa (proteína, carboidrato e vegetais)'
  },
  {
    key: 'lanche_tarde',
    label: 'Lanche da Tarde',
    icon: Sun,
    color: 'text-orange-600',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Intermediário da tarde para manter energia e foco'
  },
  {
    key: 'jantar',
    label: 'Jantar',
    icon: Moon,
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Refeição noturna balanceada e de fácil digestão'
  }
];

const LOADING_MESSAGES = [
  'Buscando dados e histórico clínico do paciente...',
  'IA analisando metas, restrições alimentares e alergias...',
  'Calculando variedade nutricional e culinária brasileira...',
  'Organizando 5 opções equilibradas para cada refeição...',
  'Validando distribuição calórica e macronutrientes...',
  'Finalizando o plano semanal personalizado...'
];

// Helper to create an empty week meal plan template
function createEmptyPlanoSemanal(): DiaPlano[] {
  return DIAS_DA_SEMANA.map(dia => ({
    dia,
    refeicoes: {
      cafe_da_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', '']
    }
  }));
}

export const MealPlanManager: React.FC<MealPlanManagerProps> = ({
  paciente,
  planos,
  onPlanosUpdated,
  showToast
}) => {
  // Mode: 'history' (viewing list) or 'editing' (generating/adjusting a plan)
  const [mode, setMode] = useState<'history' | 'editing'>('history');

  // Active day tab in editor
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Editable weekly plan state
  const [currentPlan, setCurrentPlan] = useState<DiaPlano[] | null>(null);

  // Loading state with dynamic messages
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingIntervalRef = useRef<any>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Error fallback modal
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected plan for full read-only modal viewer
  const [viewingPlan, setViewingPlan] = useState<PlanoAlimentar | null>(null);
  const [viewingDayIndex, setViewingDayIndex] = useState(0);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);


  // Handle dynamic loading message rotation
  useEffect(() => {
    if (isGenerating) {
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isGenerating]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Compile formatted patient profile data for Gemini prompt
  const formatPatientClinicalData = (): string => {
    const parts: string[] = [];

    parts.push(`- Nome: ${paciente.nome}`);
    if (paciente.sexo) parts.push(`- Sexo: ${paciente.sexo}`);
    if (paciente.peso_inicial) parts.push(`- Peso Inicial: ${paciente.peso_inicial} kg`);
    if (paciente.altura) parts.push(`- Altura: ${paciente.altura} m`);

    if (paciente.objetivos && paciente.objetivos.length > 0) {
      parts.push(`- Metas/Objetivos Clínicos: ${paciente.objetivos.join(', ')}`);
    }
    if (paciente.objetivo_texto) {
      parts.push(`- Detalhe do Objetivo: ${paciente.objetivo_texto}`);
    }

    if (paciente.alergias && paciente.alergias.length > 0) {
      parts.push(`- Alergias Alimentares: ${paciente.alergias.join(', ')}`);
    } else {
      parts.push(`- Alergias Alimentares: Nenhuma relatada`);
    }

    if (paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0) {
      parts.push(`- Restrições Alimentares: ${paciente.restricoes_alimentares.join(', ')}`);
    } else {
      parts.push(`- Restrições Alimentares: Nenhuma restrição`);
    }

    if (paciente.patologias && paciente.patologias.length > 0) {
      parts.push(`- Condições de Saúde / Patologias: ${paciente.patologias.join(', ')}`);
    }

    if (paciente.nivel_atividade) {
      parts.push(`- Nível de Atividade Física: ${paciente.nivel_atividade}`);
    }
    if (paciente.atividade_fisica_descricao) {
      parts.push(`- Descrição de Exercícios: ${paciente.atividade_fisica_descricao}`);
    }

    if (paciente.refeicoes_por_dia) {
      parts.push(`- Preferência de Refeições por Dia: ${paciente.refeicoes_por_dia}`);
    }
    if (paciente.litros_agua) {
      parts.push(`- Consumo de Água: ${paciente.litros_agua} litros/dia`);
    }
    if (paciente.horario_acorda) {
      parts.push(`- Horário de Acordar: ${paciente.horario_acorda}`);
    }
    if (paciente.horario_dorme) {
      parts.push(`- Horário de Dormir: ${paciente.horario_dorme}`);
    }
    if (paciente.medicamentos) {
      parts.push(`- Medicamentos em uso: ${paciente.medicamentos}`);
    }
    if (paciente.suplementos) {
      parts.push(`- Suplementação atual: ${paciente.suplementos}`);
    }
    if (paciente.observacoes) {
      parts.push(`- Observações Adicionais: ${paciente.observacoes}`);
    }

    return parts.join('\n');
  };

  // Trigger AI Meal Plan Generation
  const handleGerarPlanoIA = async () => {
    if (isGenerating) return;

    setLoadingMessageIndex(0);
    setIsGenerating(true);
    setShowErrorModal(false);

    try {
      const dados_do_paciente = formatPatientClinicalData();

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dados_do_paciente })
      });

      if (!response.ok) {
        let errMessage = 'Falha ao conectar com o serviço de IA.';
        try {
          const errData = await response.json();
          if (errData?.message) errMessage = errData.message;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const result = await response.json();

      let weeklyPlan: DiaPlano[] = [];
      if (result && Array.isArray(result.plano_semanal)) {
        weeklyPlan = result.plano_semanal;
      } else if (result && result.plano && Array.isArray(result.plano.plano_semanal)) {
        weeklyPlan = result.plano.plano_semanal;
      } else {
        throw new Error('Formato da resposta da IA inesperado.');
      }

      // Guarantee all 7 days and all 5 meals exist and have 5 options
      const normalizedPlan = DIAS_DA_SEMANA.map((diaNome, idx) => {
        const existingDay = weeklyPlan.find(
          (d) => d.dia && d.dia.toLowerCase().includes(diaNome.toLowerCase().slice(0, 3))
        ) || weeklyPlan[idx];

        const refeicoesObj: RefeicoesDia = {
          cafe_da_manha: existingDay?.refeicoes?.cafe_da_manha?.slice(0, 5) || ['', '', '', '', ''],
          lanche_manha: existingDay?.refeicoes?.lanche_manha?.slice(0, 5) || ['', '', '', '', ''],
          almoco: existingDay?.refeicoes?.almoco?.slice(0, 5) || ['', '', '', '', ''],
          lanche_tarde: existingDay?.refeicoes?.lanche_tarde?.slice(0, 5) || ['', '', '', '', ''],
          jantar: existingDay?.refeicoes?.jantar?.slice(0, 5) || ['', '', '', '', '']
        };

        // Pad with empty strings if less than 5
        (Object.keys(refeicoesObj) as RefeicaoKey[]).forEach((key) => {
          while (refeicoesObj[key].length < 5) {
            refeicoesObj[key].push('');
          }
        });

        return {
          dia: diaNome,
          refeicoes: refeicoesObj
        };
      });

      setCurrentPlan(normalizedPlan);
      setActiveDayIndex(0);
      setMode('editing');
      showToast('✨ Plano alimentar semanal gerado com sucesso pela IA!');
    } catch (error: any) {
      console.error('Erro na geração do plano alimentar:', error);
      setErrorMessage(error?.message || 'Falha na comunicação com o serviço Gemini.');
      setShowErrorModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Start a blank manual meal plan
  const handleCriarPlanoManual = () => {
    setShowErrorModal(false);
    setCurrentPlan(createEmptyPlanoSemanal());
    setActiveDayIndex(0);
    setMode('editing');
    showToast('Modo de edição manual aberto. Preencha as opções conforme desejado.');
  };

  // Modify input in the current active plan
  const handleInputChange = (
    refeicaoKey: RefeicaoKey, 
    optionIndex: number, 
    value: string
  ) => {
    if (!currentPlan) return;

    setCurrentPlan((prevPlan) => {
      if (!prevPlan) return null;
      const updated = [...prevPlan];
      const activeDay = { ...updated[activeDayIndex] };
      const activeRefeicoes = { ...activeDay.refeicoes };
      const currentOptions = [...(activeRefeicoes[refeicaoKey] || [])];

      currentOptions[optionIndex] = value;
      activeRefeicoes[refeicaoKey] = currentOptions;
      activeDay.refeicoes = activeRefeicoes;
      updated[activeDayIndex] = activeDay;
      return updated;
    });
  };

  // Add an option to a meal
  const handleAddOption = (refeicaoKey: RefeicaoKey) => {
    if (!currentPlan) return;
    setCurrentPlan((prevPlan) => {
      if (!prevPlan) return null;
      const updated = [...prevPlan];
      const activeDay = { ...updated[activeDayIndex] };
      const activeRefeicoes = { ...activeDay.refeicoes };
      const currentOptions = [...(activeRefeicoes[refeicaoKey] || [])];

      currentOptions.push('');
      activeRefeicoes[refeicaoKey] = currentOptions;
      activeDay.refeicoes = activeRefeicoes;
      updated[activeDayIndex] = activeDay;
      return updated;
    });
  };

  // Remove an option from a meal
  const handleRemoveOption = (refeicaoKey: RefeicaoKey, optionIndex: number) => {
    if (!currentPlan) return;
    setCurrentPlan((prevPlan) => {
      if (!prevPlan) return null;
      const updated = [...prevPlan];
      const activeDay = { ...updated[activeDayIndex] };
      const activeRefeicoes = { ...activeDay.refeicoes };
      const currentOptions = (activeRefeicoes[refeicaoKey] || []).filter((_, i) => i !== optionIndex);

      activeRefeicoes[refeicaoKey] = currentOptions;
      activeDay.refeicoes = activeRefeicoes;
      updated[activeDayIndex] = activeDay;
      return updated;
    });
  };

  // Copy meals from active day to another day
  const handleCopyDayTo = (targetDayIndex: number) => {
    if (!currentPlan || targetDayIndex === activeDayIndex) return;

    setCurrentPlan((prevPlan) => {
      if (!prevPlan) return null;
      const updated = [...prevPlan];
      const sourceMeals = JSON.parse(JSON.stringify(updated[activeDayIndex].refeicoes));
      updated[targetDayIndex] = {
        dia: updated[targetDayIndex].dia,
        refeicoes: sourceMeals
      };
      return updated;
    });

    showToast(`Cardápio copiado de ${DIAS_DA_SEMANA[activeDayIndex]} para ${DIAS_DA_SEMANA[targetDayIndex]}!`);
  };

  // Save current plan to Neon PostgreSQL
  const handleSalvarPlano = async () => {
    if (!currentPlan || currentPlan.length === 0) return;

    setIsSaving(true);
    try {
      const conteudo: PlanoSemanalConteudo = {
        plano_semanal: currentPlan
      };

      const saved = await savePlanoAlimentar(paciente.id, conteudo);

      // Add to list and return to history mode
      const updatedList = [saved, ...planos];
      onPlanosUpdated(updatedList);
      setMode('history');
      setCurrentPlan(null);
      showToast('✅ Plano alimentar salvo com sucesso no prontuário do paciente!');
    } catch (err: any) {
      console.error('Erro ao salvar plano no Neon:', err);
      showToast('Erro ao persistir plano no banco de dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete plan from history
  const handleDeletePlano = async (planoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este plano alimentar do histórico?')) {
      return;
    }

    setDeletingId(planoId);
    try {
      await deletePlanoAlimentar(planoId);
      const updated = planos.filter((p) => p.id !== planoId);
      onPlanosUpdated(updated);
      showToast('Plano alimentar removido com sucesso.');
      if (viewingPlan?.id === planoId) {
        setViewingPlan(null);
      }
    } catch (err) {
      console.error('Erro ao excluir plano alimentar:', err);
      showToast('Erro ao remover plano alimentar.');
    } finally {
      setDeletingId(null);
    }
  };

  // Edit / Clone existing plan from history
  const handleEditExistingPlan = (plano: PlanoAlimentar) => {
    let weekly: DiaPlano[] = [];
    if (plano.conteudo && Array.isArray(plano.conteudo.plano_semanal)) {
      weekly = JSON.parse(JSON.stringify(plano.conteudo.plano_semanal));
    } else if (Array.isArray(plano.conteudo)) {
      weekly = JSON.parse(JSON.stringify(plano.conteudo));
    } else {
      weekly = createEmptyPlanoSemanal();
    }

    setCurrentPlan(weekly);
    setActiveDayIndex(0);
    setMode('editing');
    setViewingPlan(null);
    showToast('Plano carregado para ajustes. As alterações serão salvas como um novo registro.');
  };

  // Get active day object
  const activeDay = currentPlan ? currentPlan[activeDayIndex] : null;

  return (
    <div className="space-y-6">
      {/* Dynamic AI Loading Overlay / Banner */}
      {isGenerating && (
        <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-6 animate-pulse">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Processamento Inteligente com Gemini
              </span>
            </div>
            <h3 className="text-lg font-bold text-white transition-all duration-300">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </h3>
            <p className="text-xs text-emerald-200/80">
              Personalizando cardápio de 7 dias com 5 refeições e 5 opções acessíveis da culinária brasileira.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-black/30 px-4 py-2 rounded-xl border border-white/10">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Aguarde um instante...</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === 'editing' ? 'Editor de Plano Alimentar' : 'Planos Alimentares & Dietas'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {mode === 'editing'
                ? 'Ajuste e revise as opções de cada dia antes de salvar no prontuário.'
                : 'Histórico de planos nutricionais calculados e gerados para o paciente.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5 self-start sm:self-auto">
            {mode === 'editing' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja descartar as alterações não salvas?')) {
                      setMode('history');
                      setCurrentPlan(null);
                    }
                  }}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Histórico</span>
                </button>

                <button
                  type="button"
                  onClick={handleSalvarPlano}
                  disabled={isSaving || !currentPlan}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Plano Alimentar</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCriarPlanoManual}
                  disabled={isGenerating}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-slate-500" />
                  <span>Plano Manual</span>
                </button>

                <button
                  type="button"
                  onClick={handleGerarPlanoIA}
                  disabled={isGenerating}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Calculando IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                      <span>✨ Gerar Plano com IA</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE: EDITING (TABS INTERFACE FOR 7 DAYS & 5 MEALS x 5 INPUTS) */}
        {/* ========================================================================= */}
        {mode === 'editing' && currentPlan && (
          <div className="space-y-6">
            {/* Days Tabs Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-max">
                {DIAS_DA_SEMANA.map((diaNome, idx) => {
                  const isActive = activeDayIndex === idx;
                  return (
                    <button
                      key={diaNome}
                      type="button"
                      onClick={() => setActiveDayIndex(idx)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                    >
                      <span>{diaNome}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  );
                })}
              </div>

              {/* Quick Utility: Copy active day to another day */}
              <div className="relative flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                    Copiar cardápio deste dia para:
                  </span>
                  <select
                    value=""
                    onChange={(e) => {
                      const targetIdx = Number(e.target.value);
                      if (!isNaN(targetIdx)) {
                        handleCopyDayTo(targetIdx);
                      }
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer hover:border-emerald-400 transition-colors"
                  >
                    <option value="" disabled>
                      Copiar para outro dia...
                    </option>
                    {DIAS_DA_SEMANA.map((dia, idx) => {
                      if (idx === activeDayIndex) return null;
                      return (
                        <option key={dia} value={idx}>
                          {dia}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Active Day Meals Grid */}
            {activeDay && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Cardápio de {activeDay.dia}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    5 refeições diárias • 5 opções por refeição
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {REFEICOES_CONFIG.map(({ key, label, icon: MealIcon, color, badgeBg, description }) => {
                    const options = activeDay.refeicoes[key] || [];

                    return (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-5 space-y-4 hover:border-emerald-200 transition-colors"
                      >
                        {/* Meal Category Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl bg-white border border-slate-100 shadow-2xs ${color}`}>
                              <MealIcon className="w-4 h-4 stroke-[2.2]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">
                                  {label}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeBg}`}>
                                  {options.length} {options.length === 1 ? 'opção' : 'opções'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {description}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddOption(key)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/60 flex items-center gap-1 self-start sm:self-auto cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar Opção</span>
                          </button>
                        </div>

                        {/* 5 Options Inputs */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {options.map((optionText, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2 group">
                              <span className="w-6 text-[11px] font-bold text-slate-400 text-center flex-shrink-0">
                                {optIdx + 1}º
                              </span>
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  value={optionText}
                                  onChange={(e) => handleInputChange(key, optIdx, e.target.value)}
                                  placeholder={`Opção ${optIdx + 1} de ${label.toLowerCase()}...`}
                                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(key, optIdx)}
                                title="Remover esta opção"
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {options.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                              Nenhuma opção cadastrada para esta refeição.{' '}
                              <button
                                type="button"
                                onClick={() => handleAddOption(key)}
                                className="text-emerald-600 font-bold hover:underline"
                              >
                                Clique para adicionar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Persistence Floating / Action Bar */}
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Save className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-emerald-950 block">
                        Pronto para persistir o plano semanal?
                      </strong>
                      <span className="text-[11px] text-emerald-800">
                        Ao salvar, este plano será adicionado ao prontuário clínico de {paciente.nome}.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Descartar edição do plano?')) {
                          setMode('history');
                          setCurrentPlan(null);
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/80 border border-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvarPlano}
                      disabled={isSaving}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Gravando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirmar e Salvar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE: HISTORY (LIST OF SAVED PLANS) */}
        {/* ========================================================================= */}
        {mode === 'history' && (
          <div className="space-y-4">
            {planos.length === 0 ? (
              <div className="py-14 px-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-2xs border border-slate-100">
                  <Utensils className="w-7 h-7 stroke-[1.6]" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="text-sm font-bold text-slate-800">
                    Nenhum plano alimentar gerado ainda
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Clique no botão <strong>"✨ Gerar Plano com IA"</strong> acima para criar automaticamente um cardápio semanal completo e personalizado com base no perfil de <strong>{paciente.nome}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGerarPlanoIA}
                  disabled={isGenerating}
                  className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Gerar Primeiro Plano com IA</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-700">
                    Total de Planos: {planos.length}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Clique em um plano para visualizar detalhes
                  </span>
                </div>

                {planos.map((plano, idx) => {
                  const isLatest = idx === 0;

                  return (
                    <div
                      key={plano.id}
                      onClick={() => {
                        setViewingPlan(plano);
                        setViewingDayIndex(0);
                      }}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 border border-emerald-100/60">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              Plano Alimentar #{planos.length - idx}
                            </strong>
                            {isLatest && (
                              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                Cardápio Ativo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(plano.created_at)}</span>
                            </span>
                            <span>•</span>
                            <span>Cardápio Semanal Completo</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleEditExistingPlan(plano)}
                          title="Usar como base para edição"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar / Base</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setViewingPlan(plano);
                            setViewingDayIndex(0);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeletePlano(plano.id, e)}
                          disabled={deletingId === plano.id}
                          title="Excluir plano do histórico"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                          {deletingId === plano.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ERROR FALLBACK MODAL (AS REQUIRED BY PROMPT 6) */}
      {/* "Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?" */}
      {/* ========================================================================= */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Aviso sobre a IA do Gemini
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?
              </p>
              {errorMessage && (
                <div className="text-[11px] font-mono p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 overflow-x-auto">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCriarPlanoManual}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Criar Plano Manual
              </button>

              <button
                type="button"
                onClick={handleGerarPlanoIA}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: READ-ONLY MEAL PLAN VIEWER (WITH TABS FOR DAYS) */}
      {/* ========================================================================= */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Plano Alimentar Semanal Detalhado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paciente: {paciente.nome} • Gerado em {formatDate(viewingPlan.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEditExistingPlan(viewingPlan)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Este Plano</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingPlan(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Day Selector Tabs */}
            {viewingPlan.conteudo?.plano_semanal && (
              <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {viewingPlan.conteudo.plano_semanal.map((diaItem: DiaPlano, dIdx: number) => {
                  const isSelected = viewingDayIndex === dIdx;
                  return (
                    <button
                      key={diaItem.dia || dIdx}
                      type="button"
                      onClick={() => setViewingDayIndex(dIdx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {diaItem.dia}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Modal Body: Active Day Meals */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {viewingPlan.conteudo?.plano_semanal && viewingPlan.conteudo.plano_semanal[viewingDayIndex] ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Refeições de {viewingPlan.conteudo.plano_semanal[viewingDayIndex].dia}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {REFEICOES_CONFIG.map(({ key, label, icon: MIcon, color, badgeBg }) => {
                      const dayData = viewingPlan.conteudo.plano_semanal[viewingDayIndex];
                      const mealOptions = dayData.refeicoes?.[key] || [];

                      return (
                        <div key={key} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MIcon className={`w-4 h-4 ${color}`} />
                              <strong className="text-xs font-bold text-slate-900">{label}</strong>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeBg}`}>
                              {mealOptions.length} opções
                            </span>
                          </div>

                          <div className="space-y-1.5 pl-6">
                            {mealOptions.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-start gap-2 text-slate-700">
                                <span className="text-[11px] font-bold text-emerald-600 mt-0.5">•</span>
                                <span className="leading-relaxed">{opt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 overflow-x-auto text-[11px]">
                  {JSON.stringify(viewingPlan.conteudo, null, 2)}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[11px] text-slate-400">
                Pressione Fechar para retornar
              </span>
              <button
                type="button"
                onClick={() => setViewingPlan(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
