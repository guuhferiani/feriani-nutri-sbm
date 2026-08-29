import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Calendar, 
  MessageCircle, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Save, 
  User, 
  Stethoscope, 
  Utensils, 
  Check, 
  X, 
  FileText, 
  Eye, 
  CalendarCheck 
} from 'lucide-react';
import { 
  getPacienteDetails, 
  updatePaciente, 
  deletePaciente 
} from '../lib/neon-db';
import { WeightEvolutionChart } from './WeightEvolutionChart';
import type { Paciente, Consulta, PlanoAlimentar } from '../types/database';

interface PatientProfileViewProps {
  patientId: string;
  nutricionistaId: string;
  onBackToList: () => void;
  onOpenNewConsultation: (patientId: string) => void;
  onPatientUpdated?: (updated: Paciente) => void;
  onPatientDeleted?: () => void;
  showToast: (msg: string) => void;
}

const OBJETIVOS_LIST = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
];

const PATOLOGIAS_LIST = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_LIST = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_LIST = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patientId,
  nutricionistaId,
  onBackToList,
  onOpenNewConsultation,
  onPatientUpdated,
  onPatientDeleted,
  showToast,
}) => {
  // Main Section Navigation (Prompt 5: 3 sections: Dados do Paciente, Consultas, Planos Alimentares)
  const [mainSection, setMainSection] = useState<'dados' | 'consultas' | 'planos'>('dados');
  // Sub-tab inside Section 1 (Dados do Paciente: Pessoal, Clínico, Hábitos)
  const [dadosTab, setDadosTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Direct Editable Form State (Section 1)
  const [formData, setFormData] = useState<Partial<Paciente>>({});
  const [editAlturaStr, setEditAlturaStr] = useState('');
  const [editPesoStr, setEditPesoStr] = useState('');
  const [novaPatologia, setNovaPatologia] = useState('');
  const [novaRestricao, setNovaRestricao] = useState('');
  const [novaAlergia, setNovaAlergia] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Plan viewer modal state (Section 3)
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const normalizeDateStr = (dateVal?: any): string => {
    if (!dateVal) return '';
    if (dateVal instanceof Date) {
      if (isNaN(dateVal.getTime())) return '';
      return dateVal.toISOString().split('T')[0];
    }
    const s = String(dateVal);
    if (s.includes('T')) return s.split('T')[0];
    return s;
  };

  const formatBrazilianDate = (dateVal?: any) => {
    if (!dateVal) return '-';
    const str = normalizeDateStr(dateVal);
    if (!str) return '-';
    const parts = str.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  };

  const calculateAge = (birthDateVal?: any): number | null => {
    if (!birthDateVal) return null;
    const str = normalizeDateStr(birthDateVal);
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    const birth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const formatTimeAuto = (val: string) => {
    const clean = val.trim().replace(':', '');
    if (!clean) return '';
    if (clean.length === 1 || clean.length === 2) {
      const num = parseInt(clean, 10);
      if (num >= 0 && num <= 23) return `${String(num).padStart(2, '0')}:00`;
    } else if (clean.length === 3) {
      const h = parseInt(clean.slice(0, 1), 10);
      const m = parseInt(clean.slice(1), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    } else if (clean.length >= 4) {
      const h = parseInt(clean.slice(0, 2), 10);
      const m = parseInt(clean.slice(2, 4), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return val;
  };

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPacienteDetails(patientId, nutricionistaId);
      if (data) {
        setPaciente(data.paciente);
        setConsultas(data.consultas || []);
        setPlanos(data.planos || []);
        initFormData(data.paciente);
      } else {
        setError('Paciente não encontrado no banco de dados Neon.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do paciente.');
    } finally {
      setLoading(false);
    }
  };

  const initFormData = (p: Paciente) => {
    setFormData({
      nome: p.nome || '',
      data_nascimento: normalizeDateStr(p.data_nascimento),
      sexo: p.sexo || 'Feminino',
      telefone: p.telefone || '',
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      peso_inicial: p.peso_inicial,
      altura: p.altura,
      objetivos: p.objetivos || [],
      objetivo_texto: p.objetivo_texto || '',
      nivel_atividade: p.nivel_atividade || 'Moderadamente ativo',
      patologias: p.patologias || [],
      restricoes_alimentares: p.restricoes_alimentares || [],
      alergias: p.alergias || [],
      medicamentos: p.medicamentos || '',
      suplementos: p.suplementos || '',
      refeicoes_por_dia: p.refeicoes_por_dia || 5,
      horario_acorda: p.horario_acorda || '06:30',
      horario_dorme: p.horario_dorme || '22:30',
      litros_agua: p.litros_agua ?? 2.5,
      atividade_fisica: p.atividade_fisica ?? true,
      atividade_fisica_descricao: p.atividade_fisica_descricao || '',
      observacoes: p.observacoes || '',
    });

    setEditPesoStr(p.peso_inicial != null ? String(p.peso_inicial) : '');
    if (p.altura) {
      setEditAlturaStr(p.altura < 3 ? String(Math.round(p.altura * 100)) : String(p.altura));
    } else {
      setEditAlturaStr('');
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [patientId, nutricionistaId]);

  // Real-time IMC for Section 1 edit form
  const computedIMC = useMemo(() => {
    const p = parseFloat(editPesoStr.replace(',', '.'));
    let h = parseFloat(editAlturaStr.replace(',', '.'));
    if (!p || !h || p <= 0 || h <= 0) return null;
    if (h > 3) h = h / 100;
    const imc = p / (h * h);
    let classif = '';
    let colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';

    if (imc < 18.5) {
      classif = 'Abaixo do peso';
      colorClass = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (imc < 24.9) {
      classif = 'Peso normal (Eutrofia)';
      colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (imc < 29.9) {
      classif = 'Sobrepeso';
      colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (imc < 34.9) {
      classif = 'Obesidade Grau I';
      colorClass = 'text-orange-700 bg-orange-50 border-orange-200';
    } else if (imc < 39.9) {
      classif = 'Obesidade Grau II';
      colorClass = 'text-red-700 bg-red-50 border-red-200';
    } else {
      classif = 'Obesidade Grau III';
      colorClass = 'text-purple-700 bg-purple-50 border-purple-200';
    }

    return { value: imc.toFixed(1), classif, colorClass };
  }, [editPesoStr, editAlturaStr]);

  const patientAge = calculateAge(formData.data_nascimento || paciente?.data_nascimento);

  // Multiple choice helper
  const toggleArrayItem = (key: 'objetivos' | 'patologias' | 'restricoes_alimentares' | 'alergias', item: string) => {
    const list = (formData[key] as string[]) || [];
    if (list.includes(item)) {
      setFormData({ ...formData, [key]: list.filter((i) => i !== item) });
    } else {
      setFormData({ ...formData, [key]: [...list.filter((i) => i !== 'Nenhum'), item] });
    }
  };

  const toggleNoneArray = (key: 'patologias' | 'restricoes_alimentares' | 'alergias') => {
    const list = (formData[key] as string[]) || [];
    if (list.includes('Nenhum')) {
      setFormData({ ...formData, [key]: [] });
    } else {
      setFormData({ ...formData, [key]: ['Nenhum'] });
    }
  };

  const addCustomTag = (
    key: 'patologias' | 'restricoes_alimentares' | 'alergias',
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const list = (formData[key] as string[]) || [];
    if (!list.includes(trimmed)) {
      setFormData({ ...formData, [key]: [...list.filter((i) => i !== 'Nenhum'), trimmed] });
    }
    setVal('');
  };

  // Section 1: Save Edits
  const handleSaveEdits = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.nome?.trim()) {
      setEditError('O nome completo do paciente é obrigatório.');
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      let parsedAltura: number | undefined = undefined;
      if (editAlturaStr.trim()) {
        const rawAlt = parseFloat(editAlturaStr.replace(',', '.'));
        if (!isNaN(rawAlt)) {
          parsedAltura = rawAlt > 3 ? parseFloat((rawAlt / 100).toFixed(2)) : rawAlt;
        }
      }

      const parsedPeso = editPesoStr.trim() ? parseFloat(editPesoStr.replace(',', '.')) : undefined;

      const updated = await updatePaciente(patientId, nutricionistaId, {
        ...formData,
        nome: formData.nome.trim(),
        peso_inicial: parsedPeso,
        altura: parsedAltura,
      });

      setPaciente(updated);
      initFormData(updated);
      showToast('Dados do paciente salvos com sucesso!');
      if (onPatientUpdated) onPatientUpdated(updated);
    } catch (err: any) {
      setEditError(err.message || 'Erro ao salvar alterações do paciente.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Patient
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePaciente(patientId, nutricionistaId);
      showToast('Paciente removido com sucesso!');
      if (onPatientDeleted) onPatientDeleted();
      onBackToList();
    } catch (err: any) {
      showToast(`Erro ao excluir paciente: ${err.message}`);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500">
          Carregando prontuário completo no Neon...
        </p>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Erro ao carregar paciente</h3>
        <p className="text-xs text-slate-500">{error || 'Paciente não encontrado.'}</p>
        <button
          type="button"
          onClick={onBackToList}
          className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Voltar para Lista de Pacientes
        </button>
      </div>
    );
  }

  const initials = paciente.nome
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Bar with Back Button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <button
          type="button"
          onClick={onBackToList}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Pacientes</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenNewConsultation(paciente.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Consulta</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Excluir Paciente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                {paciente.nome}
              </h1>
              {paciente.sexo && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {paciente.sexo}
                </span>
              )}
              {patientAge !== null && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  {patientAge} anos
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              {paciente.email && <span>{paciente.email}</span>}
              {paciente.telefone && <span>• {paciente.telefone}</span>}
              <span>• Cadastrado em {formatBrazilianDate(paciente.created_at)}</span>
            </p>
          </div>
        </div>

        {paciente.whatsapp && (
          <a
            href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(paciente.nome.split(' ')[0])},%20tudo%20bem?`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all inline-flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Conversar no WhatsApp</span>
          </a>
        )}
      </div>

      {/* Main 3 Sections Navigation (Prompt 5: Dados do Paciente, Consultas, Planos Alimentares) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setMainSection('dados')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainSection === 'dados'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('consultas')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainSection === 'consultas'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>2. Consultas ({consultas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('planos')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainSection === 'planos'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>3. Planos Alimentares ({planos.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1 — DADOS DO PACIENTE (COM 3 ABAS EDITÁVEIS DIRETAMENTE) */}
      {/* ========================================================================= */}
      {mainSection === 'dados' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ficha Cadastral e Anamnese
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Os campos são editáveis diretamente na página. Clique em "Salvar alterações" ao finalizar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveEdits()}
              disabled={savingEdit}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 self-start sm:self-auto"
            >
              {savingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar alterações</span>
                </>
              )}
            </button>
          </div>

          {editError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* 3 Sub-tabs: Pessoal, Clínico, Hábitos */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setDadosTab('pessoal')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                dadosTab === 'pessoal'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Aba 1 — Pessoal
            </button>
            <button
              type="button"
              onClick={() => setDadosTab('clinico')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                dadosTab === 'clinico'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Aba 2 — Clínico
            </button>
            <button
              type="button"
              onClick={() => setDadosTab('habitos')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                dadosTab === 'habitos'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Aba 3 — Hábitos
            </button>
          </div>

          {/* Aba 1: Pessoal */}
          {dadosTab === 'pessoal' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo do paciente"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Data de Nascimento</span>
                    {patientAge !== null && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {patientAge} anos
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={normalizeDateStr(formData.data_nascimento)}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sexo Biológico
                  </label>
                  <select
                    value={formData.sexo || 'Feminino'}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone || ''}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail do Paciente
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="paciente@exemplo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba 2: Clínico */}
          {dadosTab === 'clinico' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Peso, Altura e IMC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peso Inicial
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={editPesoStr}
                      onChange={(e) => setEditPesoStr(e.target.value)}
                      placeholder="Ex: 68.5"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={editAlturaStr}
                      onChange={(e) => setEditAlturaStr(e.target.value)}
                      placeholder="Ex: 168"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IMC (Calculado)
                  </label>
                  <div className={`py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    computedIMC ? computedIMC.colorClass : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <span className="font-extrabold text-sm">
                      {computedIMC ? `${computedIMC.value} kg/m²` : '---'}
                    </span>
                    <span className="text-[10px] font-bold truncate max-w-[120px]">
                      {computedIMC ? computedIMC.classif : 'Sem cálculo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Objetivos Nutricionais (Múltipla Escolha)
                </label>
                <div className="flex flex-wrap gap-2">
                  {OBJETIVOS_LIST.map((obj) => {
                    const isSel = ((formData.objetivos as string[]) || []).includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        onClick={() => toggleArrayItem('objetivos', obj)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSel && <Check className="w-3.5 h-3.5" />}
                        <span>{obj}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={formData.objetivo_texto || ''}
                  onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                  placeholder="Descrição livre do objetivo ou queixa principal..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Nível de Atividade Física */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nível de Atividade Física
                </label>
                <select
                  value={formData.nivel_atividade || 'Moderadamente ativo'}
                  onChange={(e) => setFormData({ ...formData, nivel_atividade: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {NIVEIS_ATIVIDADE.map((na) => (
                    <option key={na} value={na}>{na}</option>
                  ))}
                </select>
              </div>

              {/* Patologias */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Patologias ou Condições de Saúde
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleNoneArray('patologias')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      ((formData.patologias as string[]) || []).includes('Nenhum')
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nenhum
                  </button>
                  {PATOLOGIAS_LIST.map((p) => {
                    const isSel = ((formData.patologias as string[]) || []).includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleArrayItem('patologias', p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  {((formData.patologias as string[]) || [])
                    .filter((p) => !PATOLOGIAS_LIST.includes(p) && p !== 'Nenhum')
                    .map((custom) => (
                      <span key={custom} className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                        <span>{custom}</span>
                        <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => toggleArrayItem('patologias', custom)} />
                      </span>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={novaPatologia}
                    onChange={(e) => setNovaPatologia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag('patologias', novaPatologia, setNovaPatologia);
                      }
                    }}
                    placeholder="Adicionar outra patologia..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTag('patologias', novaPatologia, setNovaPatologia)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Restrições e Alergias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Restrições */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Restrições Alimentares
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleNoneArray('restricoes_alimentares')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                        ((formData.restricoes_alimentares as string[]) || []).includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Nenhum
                    </button>
                    {RESTRICOES_LIST.map((r) => {
                      const isSel = ((formData.restricoes_alimentares as string[]) || []).includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleArrayItem('restricoes_alimentares', r)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                            isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                    {((formData.restricoes_alimentares as string[]) || [])
                      .filter((r) => !RESTRICOES_LIST.includes(r) && r !== 'Nenhum')
                      .map((custom) => (
                        <span key={custom} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                          <span>{custom}</span>
                          <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayItem('restricoes_alimentares', custom)} />
                        </span>
                      ))}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={novaRestricao}
                      onChange={(e) => setNovaRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag('restricoes_alimentares', novaRestricao, setNovaRestricao);
                        }
                      }}
                      placeholder="Outra restrição..."
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomTag('restricoes_alimentares', novaRestricao, setNovaRestricao)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Alergias */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/60 border border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Alergias Alimentares
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleNoneArray('alergias')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                        ((formData.alergias as string[]) || []).includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Nenhum
                    </button>
                    {ALERGIAS_LIST.map((a) => {
                      const isSel = ((formData.alergias as string[]) || []).includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleArrayItem('alergias', a)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                            isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}
                    {((formData.alergias as string[]) || [])
                      .filter((a) => !ALERGIAS_LIST.includes(a) && a !== 'Nenhum')
                      .map((custom) => (
                        <span key={custom} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-semibold flex items-center gap-1">
                          <span>{custom}</span>
                          <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayItem('alergias', custom)} />
                        </span>
                      ))}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={novaAlergia}
                      onChange={(e) => setNovaAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag('alergias', novaAlergia, setNovaAlergia);
                        }
                      }}
                      placeholder="Outra alergia..."
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomTag('alergias', novaAlergia, setNovaAlergia)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Medicamentos e Suplementos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medicamentos Contínuos
                  </label>
                  <textarea
                    rows={2}
                    value={formData.medicamentos || ''}
                    onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                    placeholder="Ex: Levotiroxina 50mcg..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Suplementos em Uso
                  </label>
                  <textarea
                    rows={2}
                    value={formData.suplementos || ''}
                    onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                    placeholder="Ex: Whey protein, Creatina 5g..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aba 3: Hábitos */}
          {dadosTab === 'habitos' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Refeições por dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.refeicoes_por_dia ?? 5}
                    onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário que acorda
                  </label>
                  <input
                    type="text"
                    value={formData.horario_acorda || ''}
                    onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                    onBlur={() => setFormData({ ...formData, horario_acorda: formatTimeAuto(formData.horario_acorda || '') })}
                    placeholder="Ex: 6 ou 06:30"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário que dorme
                  </label>
                  <input
                    type="text"
                    value={formData.horario_dorme || ''}
                    onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                    onBlur={() => setFormData({ ...formData, horario_dorme: formatTimeAuto(formData.horario_dorme || '') })}
                    placeholder="Ex: 23 ou 22:30"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade de Água
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.litros_agua ?? 2.5}
                      onChange={(e) => setFormData({ ...formData, litros_agua: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-3.5 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      litros
                    </span>
                  </div>
                </div>
              </div>

              {/* Atividade Física */}
              <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block">
                      Pratica Atividade Física?
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Exercícios físicos estruturados ou esportes regulares.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, atividade_fisica: true })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        formData.atividade_fisica
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, atividade_fisica: false })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !formData.atividade_fisica
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {formData.atividade_fisica && (
                  <div className="pt-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Qual atividade e frequência semanal?
                    </label>
                    <input
                      type="text"
                      value={formData.atividade_fisica_descricao || ''}
                      onChange={(e) => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                      placeholder="Ex: Musculação (4x/semana) + Corrida no fim de semana"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Gerais
                </label>
                <textarea
                  rows={2}
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais da rotina, histórico familiar..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Section 1 Footer Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleSaveEdits()}
              disabled={savingEdit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              {savingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no Neon...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2 — CONSULTAS & EVOLUÇÃO DE PESO */}
      {/* ========================================================================= */}
      {mainSection === 'consultas' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Weight Evolution Chart (Always Visible at Top of Consultations Section) */}
          <WeightEvolutionChart
            initialWeight={paciente.peso_inicial}
            initialDate={paciente.created_at}
            consultations={consultas}
            onOpenNewConsultation={() => onOpenNewConsultation(paciente.id)}
          />

          {/* Consultations List Container */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Histórico de Consultas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Todas as consultas registradas em ordem cronológica decrescente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenNewConsultation(paciente.id)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Consulta</span>
              </button>
            </div>

            {consultas.length === 0 ? (
              <div className="py-10 px-6 text-center bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
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
              <div className="space-y-4">
                {consultas.map((c, index) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition-colors"
                  >
                    {/* Consultation Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                        <strong className="text-sm font-bold text-slate-900">
                          Consulta em {formatBrazilianDate(c.data_consulta)}
                        </strong>
                        {index === 0 && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Mais recente
                          </span>
                        )}
                      </div>

                      {c.proximo_retorno && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 w-fit flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Próximo Retorno: {formatBrazilianDate(c.proximo_retorno)}</span>
                        </span>
                      )}
                    </div>

                    {/* Consultation Measurements Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {c.peso != null && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                            Peso Atual
                          </span>
                          <strong className="text-slate-900 text-sm font-extrabold">{c.peso} kg</strong>
                        </div>
                      )}
                      {c.cintura != null && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                            Cintura
                          </span>
                          <strong className="text-slate-900 text-sm font-extrabold">{c.cintura} cm</strong>
                        </div>
                      )}
                      {c.quadril != null && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                            Quadril
                          </span>
                          <strong className="text-slate-900 text-sm font-extrabold">{c.quadril} cm</strong>
                        </div>
                      )}
                      {c.percentual_gordura != null && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
                            % Gordura
                          </span>
                          <strong className="text-slate-900 text-sm font-extrabold">{c.percentual_gordura}%</strong>
                        </div>
                      )}
                    </div>

                    {/* Observations */}
                    {c.observacoes && (
                      <div className="text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-800 block mb-1 text-[11px] uppercase tracking-wider">
                          Observações Clínicas:
                        </span>
                        <p className="leading-relaxed font-medium">{c.observacoes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
      {/* ========================================================================= */}
      {mainSection === 'planos' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Planos Alimentares & Dietas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Histórico de planos nutricionais calculados e gerados para o paciente.
              </p>
            </div>

            {/* Prominent "Gerar Plano Alimentar" button as required by Prompt 5 */}
            <button
              type="button"
              onClick={() => showToast('A funcionalidade de geração automática por IA será habilitada no Prompt 6.')}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto group"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
              <span>Gerar Plano Alimentar</span>
            </button>
          </div>

          {/* History of Saved Plans */}
          {planos.length === 0 ? (
            <div className="py-14 px-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-2xs border border-slate-100">
                <Utensils className="w-7 h-7 stroke-[1.6]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-slate-800">
                  Nenhum plano alimentar gerado ainda
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Utilize o botão "Gerar Plano Alimentar" para criar e salvar cardápios personalizados no prontuário do paciente.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {planos.map((plano, idx) => (
                <div
                  key={plano.id}
                  onClick={() => setSelectedPlano(plano)}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          Plano Alimentar #{planos.length - idx}
                        </strong>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Ativo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        Gerado em {formatBrazilianDate(plano.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                    <Eye className="w-4 h-4" />
                    <span>Ver Conteúdo Completo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Content Viewer Modal */}
      {selectedPlano && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Plano Alimentar Detalhado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gerado em {formatBrazilianDate(selectedPlano.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlano(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-800 leading-relaxed">
              {typeof selectedPlano.conteudo === 'string' ? (
                <div className="whitespace-pre-wrap font-mono p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800">
                  {selectedPlano.conteudo}
                </div>
              ) : (
                <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedPlano.conteudo, null, 2)}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedPlano(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Excluir Paciente
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tem certeza que deseja excluir <strong>{paciente.nome}</strong>? Esta ação removerá o prontuário e todo o histórico de consultas no Neon permanentemente.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 transition-all"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
