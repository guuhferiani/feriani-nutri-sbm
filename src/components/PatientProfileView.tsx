import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Plus, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle, 
  AlertCircle, 
  Heart, 
  Sparkles, 
  Loader2, 
  Save, 
  X, 
  Activity, 
  Droplets, 
  Dumbbell, 
  ShieldAlert
} from 'lucide-react';
import { 
  getPacienteDetails, 
  updatePaciente, 
  deletePaciente 
} from '../lib/neon-db';
import type { Paciente, Consulta } from '../types/database';

interface PatientProfileViewProps {
  patientId: string;
  nutricionistaId: string;
  onBackToList: () => void;
  onOpenNewConsultation: (patientId: string) => void;
  onPatientUpdated?: (updated: Paciente) => void;
  onPatientDeleted?: () => void;
  showToast: (msg: string) => void;
}

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
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
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'clinico' | 'habitos' | 'consultas' | 'editar'>('geral');

  // Edit Mode state
  const [editForm, setEditForm] = useState<Partial<Paciente>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editAlturaStr, setEditAlturaStr] = useState('');
  const [editPesoStr, setEditPesoStr] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPacienteDetails(patientId, nutricionistaId);
      if (data) {
        setPaciente(data.paciente);
        setConsultas(data.consultas);
        initEditForm(data.paciente);
      } else {
        setError('Paciente não encontrado no banco de dados Neon.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do paciente.');
    } finally {
      setLoading(false);
    }
  };

  const initEditForm = (p: Paciente) => {
    setEditForm({
      nome: p.nome || '',
      data_nascimento: p.data_nascimento || '',
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
      litros_agua: p.litros_agua || 2.5,
      atividade_fisica: p.atividade_fisica ?? true,
      atividade_fisica_descricao: p.atividade_fisica_descricao || '',
      observacoes: p.observacoes || '',
    });

    setEditPesoStr(p.peso_inicial ? String(p.peso_inicial) : '');
    // If height is e.g. 1.68m, show 168cm in input or keep formatted
    if (p.altura) {
      setEditAlturaStr(p.altura < 3 ? String(Math.round(p.altura * 100)) : String(p.altura));
    } else {
      setEditAlturaStr('');
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [patientId, nutricionistaId]);

  const formatBrazilianDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
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

  const calculateAge = (birthDateStr?: string | null): number | null => {
    if (!birthDateStr) return null;
    const parts = birthDateStr.split('T')[0].split('-');
    if (parts.length !== 3) return null;
    const birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const calculateIMC = (peso?: number | null, altura?: number | null) => {
    if (!peso || !altura || altura <= 0) return null;
    let h = altura;
    if (h > 3) h = h / 100;
    const imc = peso / (h * h);
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
  };

  const latestConsulta = consultas.length > 0 ? consultas[0] : null;
  const currentWeight = latestConsulta?.peso ?? paciente?.peso_inicial;
  const imcData = calculateIMC(currentWeight, paciente?.altura);
  const patientAge = calculateAge(paciente?.data_nascimento);

  // Handle saving edits (CRUD: Update)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.nome?.trim()) {
      setEditError('O nome completo não pode ficar em branco.');
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
        ...editForm,
        nome: editForm.nome.trim(),
        peso_inicial: parsedPeso,
        altura: parsedAltura,
      });

      setPaciente(updated);
      initEditForm(updated);
      setActiveTab('geral');
      showToast('Cadastro do paciente atualizado com sucesso no Neon!');
      if (onPatientUpdated) onPatientUpdated(updated);
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar dados do paciente.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle patient deletion (CRUD: Delete)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
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
            onClick={() => setActiveTab('editar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'editar'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Cadastro</span>
          </button>

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
            <span>WhatsApp</span>
          </a>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Peso Atual
          </span>
          <div className="text-xl font-black text-slate-900">
            {currentWeight ? `${currentWeight} kg` : '-'}
          </div>
          {paciente.peso_inicial && (
            <span className="text-[10px] text-slate-500 block">
              Inicial: {paciente.peso_inicial} kg
            </span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Altura
          </span>
          <div className="text-xl font-black text-slate-900">
            {paciente.altura ? (paciente.altura < 3 ? `${(paciente.altura * 100).toFixed(0)} cm` : `${paciente.altura} cm`) : '-'}
          </div>
          <span className="text-[10px] text-slate-500 block">Estatura física</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            IMC
          </span>
          <div className="text-xl font-black text-slate-900">
            {imcData?.value ? `${imcData.value} kg/m²` : '-'}
          </div>
          <span className="text-[10px] font-bold text-emerald-700 truncate block">
            {imcData?.classif || 'Aguardando peso/altura'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Consultas
          </span>
          <div className="text-xl font-black text-slate-900">
            {consultas.length}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">
            {consultas.length > 0
              ? `Última: ${formatBrazilianDate(latestConsulta?.data_consulta)}`
              : 'Nenhuma consulta'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('geral')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'geral'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Visão Geral & Contato
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Avaliação Clínica & Saúde
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Hábitos & Rotina
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('consultas')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'consultas'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>Histórico de Consultas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'consultas' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {consultas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('editar')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto flex items-center gap-1.5 ${
            activeTab === 'editar'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/60'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editar Cadastro (CRUD)</span>
        </button>
      </div>

      {/* Tab 1: Visão Geral */}
      {activeTab === 'geral' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Contact info */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Informações de Contato
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>E-mail:</span>
                  </span>
                  <strong className="text-slate-900">{paciente.email || 'Não informado'}</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Telefone:</span>
                  </span>
                  <strong className="text-slate-900">{paciente.telefone || 'Não informado'}</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp:</span>
                  </span>
                  <strong className="text-slate-900">{paciente.whatsapp || 'Não informado'}</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Data de Nascimento:</span>
                  </span>
                  <strong className="text-slate-900">
                    {formatBrazilianDate(paciente.data_nascimento)} {patientAge !== null ? `(${patientAge} anos)` : ''}
                  </strong>
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Objetivos do Tratamento</span>
              </h3>

              {paciente.objetivos && paciente.objetivos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paciente.objetivos.map((obj, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-bold"
                    >
                      {obj}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nenhum objetivo selecionado.</p>
              )}

              {paciente.objetivo_texto && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Queixa Principal / Descrição:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    "{paciente.objetivo_texto}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Clínico */}
      {activeTab === 'clinico' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Saúde, Patologias e Restrições</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Condições clínicas e histórico de alergias alimentares.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Patologias */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                <span>Patologias / Condições de Saúde</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {paciente.patologias && paciente.patologias.length > 0 ? (
                  paciente.patologias.map((p, i) => (
                    <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-200/60">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Nenhuma patologia informada</span>
                )}
              </div>
            </div>

            {/* Restrições */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Restrições Alimentares</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 ? (
                  paciente.restricoes_alimentares.map((r, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200/60">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Nenhuma restrição informada</span>
                )}
              </div>
            </div>

            {/* Alergias */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                <span>Alergias Alimentares</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {paciente.alergias && paciente.alergias.length > 0 ? (
                  paciente.alergias.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200/60">
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Nenhuma alergia informada</span>
                )}
              </div>
            </div>

            {/* Nível de Atividade */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nível de Atividade Física</span>
              </span>
              <div className="pt-1 text-xs font-bold text-slate-800">
                {paciente.nivel_atividade || 'Não informado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Medicamentos Contínuos
              </span>
              <p className="text-xs text-slate-700 font-medium">
                {paciente.medicamentos || 'Nenhum medicamento informado.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Suplementos em Uso
              </span>
              <p className="text-xs text-slate-700 font-medium">
                {paciente.suplementos || 'Nenhum suplemento informado.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hábitos */}
      {activeTab === 'habitos' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Rotina Diária e Estilo de Vida</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Horários de sono, consumo de água, frequência de refeições e prática esportiva.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Horário que acorda</span>
              </span>
              <strong className="text-base text-slate-900 block">
                {paciente.horario_acorda || '-'}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Horário que dorme</span>
              </span>
              <strong className="text-base text-slate-900 block">
                {paciente.horario_dorme || '-'}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-500" />
                <span>Ingestão de Água</span>
              </span>
              <strong className="text-base text-slate-900 block">
                {paciente.litros_agua ? `${paciente.litros_agua} litros` : '-'}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Refeições por dia
              </span>
              <strong className="text-base text-slate-900 block">
                {paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições` : '-'}
              </strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              <span>Prática de Atividade Física</span>
            </span>
            <div className="text-xs text-slate-800">
              {paciente.atividade_fisica ? (
                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                    Ativo
                  </span>
                  <p className="font-medium text-slate-700 pt-1">
                    {paciente.atividade_fisica_descricao || 'Pratica exercícios regularmente.'}
                  </p>
                </div>
              ) : (
                <span className="text-slate-500 font-medium">Não pratica atividade física regular no momento.</span>
              )}
            </div>
          </div>

          {paciente.observacoes && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Observações Gerais
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {paciente.observacoes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Consultas */}
      {activeTab === 'consultas' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Histórico de Atendimentos</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evolução clínica, medidas corporais e retornos agendados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenNewConsultation(paciente.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Nova Consulta</span>
            </button>
          </div>

          {consultas.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Nenhuma consulta registrada</h4>
                <p className="text-xs text-slate-500">
                  Registre a primeira avaliação clínica deste paciente para acompanhar sua evolução.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenNewConsultation(paciente.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Consulta Agora</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {consultas.map((c, index) => (
                <div key={c.id} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <strong className="text-sm text-slate-900">
                        Consulta em {formatBrazilianDate(c.data_consulta)}
                      </strong>
                      {index === 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Mais recente
                        </span>
                      )}
                    </div>

                    {c.proximo_retorno && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 w-fit">
                        Retorno agendado: {formatBrazilianDate(c.proximo_retorno)}
                      </span>
                    )}
                  </div>

                  {/* Measurements */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {c.peso && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-semibold">Peso</span>
                        <strong className="text-slate-900 text-sm">{c.peso} kg</strong>
                      </div>
                    )}
                    {c.cintura && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-semibold">Cintura</span>
                        <strong className="text-slate-900 text-sm">{c.cintura} cm</strong>
                      </div>
                    )}
                    {c.quadril && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-semibold">Quadril</span>
                        <strong className="text-slate-900 text-sm">{c.quadril} cm</strong>
                      </div>
                    )}
                    {c.percentual_gordura && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] font-semibold">% Gordura</span>
                        <strong className="text-slate-900 text-sm">{c.percentual_gordura}%</strong>
                      </div>
                    )}
                  </div>

                  {c.observacoes && (
                    <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-800 block mb-1 text-[11px]">
                        Condutas & Observações:
                      </span>
                      {c.observacoes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Editar Cadastro (CRUD: Update) */}
      {activeTab === 'editar' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Editar Cadastro do Paciente</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Altere os campos diretamente na página e salve as alterações no Neon.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {editError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleSaveEdit} className="space-y-6">
            {/* 1. Dados Pessoais */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Informações Pessoais
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nome || ''}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={editForm.data_nascimento?.split('T')[0] || ''}
                    onChange={(e) => setEditForm({ ...editForm, data_nascimento: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sexo Biológico
                  </label>
                  <select
                    value={editForm.sexo || 'Feminino'}
                    onChange={(e) => setEditForm({ ...editForm, sexo: e.target.value })}
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
                    value={editForm.telefone || ''}
                    onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editForm.whatsapp || ''}
                    onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Dados Clínicos */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Parâmetros Clínicos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peso Inicial (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPesoStr}
                    onChange={(e) => setEditPesoStr(e.target.value)}
                    placeholder="68.5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editAlturaStr}
                    onChange={(e) => setEditAlturaStr(e.target.value)}
                    placeholder="168"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nível de Atividade Física
                  </label>
                  <select
                    value={editForm.nivel_atividade || 'Moderadamente ativo'}
                    onChange={(e) => setEditForm({ ...editForm, nivel_atividade: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {NIVEIS_ATIVIDADE.map((na) => (
                      <option key={na} value={na}>{na}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Queixa Principal / Descrição do Objetivo
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.objetivo_texto || ''}
                    onChange={(e) => setEditForm({ ...editForm, objetivo_texto: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medicamentos Contínuos
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.medicamentos || ''}
                    onChange={(e) => setEditForm({ ...editForm, medicamentos: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Suplementos em Uso
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.suplementos || ''}
                    onChange={(e) => setEditForm({ ...editForm, suplementos: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Hábitos e Rotina */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Hábitos e Rotina
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário que acorda
                  </label>
                  <input
                    type="text"
                    value={editForm.horario_acorda || ''}
                    onChange={(e) => setEditForm({ ...editForm, horario_acorda: e.target.value })}
                    placeholder="06:30"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário que dorme
                  </label>
                  <input
                    type="text"
                    value={editForm.horario_dorme || ''}
                    onChange={(e) => setEditForm({ ...editForm, horario_dorme: e.target.value })}
                    placeholder="22:30"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Água (Litros/dia)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.litros_agua ?? 2.5}
                    onChange={(e) => setEditForm({ ...editForm, litros_agua: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Gerais
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.observacoes || ''}
                    onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('geral')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
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
