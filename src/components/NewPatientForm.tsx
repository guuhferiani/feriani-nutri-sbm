import React, { useState, useMemo } from 'react';
import { 
  User, 
  Stethoscope, 
  Activity, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  Check, 
  Copy, 
  X, 
  Clock, 
  Dumbbell
} from 'lucide-react';
import { createPaciente } from '../lib/neon-db';
import type { Paciente } from '../types/database';

interface NewPatientFormProps {
  nutricionistaId: string;
  onCancel: () => void;
  onSuccess: (newPatient: Paciente) => void;
}

// Predefined option constants
const OBJETIVOS_LIST = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  { label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
  { label: 'Levemente ativo', desc: 'Exercício leve 1 a 3 dias/semana' },
  { label: 'Moderadamente ativo', desc: 'Exercício moderado 3 a 5 dias/semana' },
  { label: 'Muito ativo', desc: 'Exercício pesado 6 a 7 dias/semana' },
  { label: 'Extremamente ativo', desc: 'Treinos intensos ou trabalho braçal diário' },
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

export const NewPatientForm: React.FC<NewPatientFormProps> = ({
  nutricionistaId,
  onCancel,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  // Aba 1 — Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 — Clínico
  const [pesoKg, setPesoKg] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>(['Emagrecer']);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Moderadamente ativo');
  
  const [patologias, setPatologias] = useState<string[]>([]);
  const [patologiasNone, setPatologiasNone] = useState(false);
  const [novaPatologia, setNovaPatologia] = useState('');

  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [restricoesNone, setRestricoesNone] = useState(false);
  const [novaRestricao, setNovaRestricao] = useState('');

  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiasNone, setAlergiasNone] = useState(false);
  const [novaAlergia, setNovaAlergia] = useState('');

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('5');
  const [horarioAcorda, setHorarioAcorda] = useState('06:30');
  const [horarioDorme, setHorarioDorme] = useState('22:30');
  const [litrosAgua, setLitrosAgua] = useState('2.5');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean>(true);
  const [atividadeDescricao, setAtividadeDescricao] = useState('Musculação e corrida (4x por semana)');
  const [observacoes, setObservacoes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone masking
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Time auto-conversion (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00)
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

  // Automatic Age calculation
  const idade = useMemo(() => {
    if (!dataNascimento) return null;
    const parts = dataNascimento.split('-');
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
  }, [dataNascimento]);

  // Automatic IMC calculation
  const imcResult = useMemo(() => {
    const p = parseFloat(pesoKg.replace(',', '.'));
    let h = parseFloat(alturaCm.replace(',', '.'));
    if (!p || !h || p <= 0 || h <= 0) return null;

    // If height is in cm (e.g. 165 or 175), convert to meters
    if (h > 3) {
      h = h / 100;
    }

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

    return {
      value: imc.toFixed(1),
      classif,
      colorClass,
    };
  }, [pesoKg, alturaCm]);

  // Multiple choice helpers
  const toggleSelection = (
    item: string,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    isNoneActive: boolean,
    setIsNoneActive: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (isNoneActive) {
      setIsNoneActive(false);
    }
    if (currentList.includes(item)) {
      setList(currentList.filter((i) => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };

  const handleNoneSelection = (
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    isNoneActive: boolean,
    setIsNoneActive: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!isNoneActive) {
      setIsNoneActive(true);
      setList([]);
    } else {
      setIsNoneActive(false);
    }
  };

  const addCustomTag = (
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setIsNoneActive: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setIsNoneActive(false);
    if (!currentList.includes(trimmed)) {
      setList([...currentList, trimmed]);
    }
    setVal('');
  };

  // Submit form to Neon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setActiveTab('pessoal');
      setError('O nome completo do paciente é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Standardize height: save in meters in Neon for consistency (or cm)
      let parsedAltura: number | undefined = undefined;
      if (alturaCm.trim()) {
        const rawAlt = parseFloat(alturaCm.replace(',', '.'));
        if (!isNaN(rawAlt)) {
          parsedAltura = rawAlt > 3 ? parseFloat((rawAlt / 100).toFixed(2)) : rawAlt;
        }
      }

      const parsedPeso = pesoKg.trim() ? parseFloat(pesoKg.replace(',', '.')) : undefined;

      const created = await createPaciente({
        nutricionista_id: nutricionistaId,
        nome: nome.trim(),
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
        telefone: telefone.trim() || undefined,
        whatsapp: (whatsapp || telefone).trim() || undefined,
        email: email.trim() || undefined,
        peso_inicial: parsedPeso,
        altura: parsedAltura,
        objetivos: objetivosSelecionados.length > 0 ? objetivosSelecionados : undefined,
        objetivo_texto: objetivoTexto.trim() || undefined,
        nivel_atividade: nivelAtividade,
        patologias: patologiasNone ? ['Nenhum'] : patologias.length > 0 ? patologias : undefined,
        restricoes_alimentares: restricoesNone ? ['Nenhum'] : restricoes.length > 0 ? restricoes : undefined,
        alergias: alergiasNone ? ['Nenhum'] : alergias.length > 0 ? alergias : undefined,
        medicamentos: medicamentos.trim() || undefined,
        suplementos: suplementos.trim() || undefined,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : undefined,
        horario_acorda: formatTimeAuto(horarioAcorda) || undefined,
        horario_dorme: formatTimeAuto(horarioDorme) || undefined,
        litros_agua: litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : undefined,
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
      });

      onSuccess(created);
    } catch (err: any) {
      console.error('Error creating patient:', err);
      setError(err.message || 'Erro ao cadastrar paciente no Neon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Novo Cadastro
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Prontuário Neon</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cadastrar Novo Paciente
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Preencha os dados pessoais, clínicos e hábitos do paciente para iniciar o acompanhamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100/70 hover:text-slate-800 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Paciente</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>2. Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>3. Hábitos</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-medium animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSubmit}>
          {/* ========================================================================= */}
          {/* ABA 1 — PESSOAL */}
          {/* ========================================================================= */}
          {activeTab === 'pessoal' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Informações Pessoais e Contato</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dados de identificação e canais diretos para comunicação.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome Completo <span className="text-emerald-600 font-extrabold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Beatriz Lima Ramos"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Único campo obrigatório do cadastro.
                  </span>
                </div>

                {/* Data de Nascimento + Idade Calculada + Sexo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Data de Nascimento</span>
                      {idade !== null && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {idade} {idade === 1 ? 'ano' : 'anos'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Sexo Biológico
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSexo(s)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            sexo === s
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/10 font-bold'
                              : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Telefone e WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        WhatsApp
                      </label>
                      {telefone && (
                        <button
                          type="button"
                          onClick={() => setWhatsapp(telefone)}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar do telefone</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    E-mail do Paciente
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@exemplo.com"
                    className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Passo 1 de 3</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('clinico')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <span>Próximo: Dados Clínicos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2 — CLÍNICO */}
          {/* ========================================================================= */}
          {activeTab === 'clinico' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Avaliação Clínica & Objetivos</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parâmetros corporais, objetivos nutricionais, histórico de saúde e restrições.
                </p>
              </div>

              {/* Medidas Iniciais e IMC em Destaque */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Peso */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Peso Atual
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={pesoKg}
                      onChange={(e) => setPesoKg(e.target.value)}
                      placeholder="Ex: 68.5"
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                {/* Altura */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={alturaCm}
                      onChange={(e) => setAlturaCm(e.target.value)}
                      placeholder="Ex: 168"
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                {/* IMC Calculado (Somente Leitura) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    IMC (Calculado)
                  </label>
                  <div className={`py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    imcResult 
                      ? imcResult.colorClass 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    <span className="font-extrabold text-sm">
                      {imcResult ? `${imcResult.value} kg/m²` : '---'}
                    </span>
                    <span className="text-[10px] font-bold truncate max-w-[120px]">
                      {imcResult ? imcResult.classif : 'Aguardando peso/altura'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Objetivos Nutricionais (Múltipla Escolha)
                </label>
                <div className="flex flex-wrap gap-2">
                  {OBJETIVOS_LIST.map((obj) => {
                    const isSelected = objetivosSelecionados.includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setObjetivosSelecionados(objetivosSelecionados.filter((o) => o !== obj));
                          } else {
                            setObjetivosSelecionados([...objetivosSelecionados, obj]);
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{obj}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <input
                    type="text"
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                    placeholder="Descrição livre do objetivo ou queixa principal..."
                    className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Nível de Atividade Física */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Nível de Atividade Física
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {NIVEIS_ATIVIDADE.map((na) => {
                    const isSelected = nivelAtividade === na.label;
                    return (
                      <div
                        key={na.label}
                        onClick={() => setNivelAtividade(na.label)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/10'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <strong className="text-xs text-slate-900">{na.label}</strong>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                        </div>
                        <span className="text-[11px] text-slate-500 leading-tight">
                          {na.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patologias */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Patologias ou Condições de Saúde
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleNoneSelection(setPatologias, patologiasNone, setPatologiasNone)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      patologiasNone
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nenhum
                  </button>
                  {PATOLOGIAS_LIST.map((pat) => {
                    const isSel = patologias.includes(pat);
                    return (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => toggleSelection(pat, patologias, setPatologias, patologiasNone, setPatologiasNone)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pat}
                      </button>
                    );
                  })}
                  {patologias
                    .filter((p) => !PATOLOGIAS_LIST.includes(p))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>{custom}</span>
                        <X
                          className="w-3.5 h-3.5 cursor-pointer hover:text-emerald-950"
                          onClick={() => setPatologias(patologias.filter((p) => p !== custom))}
                        />
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
                        addCustomTag(novaPatologia, setNovaPatologia, patologias, setPatologias, setPatologiasNone);
                      }
                    }}
                    placeholder="Adicionar outra patologia..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTag(novaPatologia, setNovaPatologia, patologias, setPatologias, setPatologiasNone)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Restrições Alimentares */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Restrições Alimentares
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleNoneSelection(setRestricoes, restricoesNone, setRestricoesNone)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      restricoesNone
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nenhum
                  </button>
                  {RESTRICOES_LIST.map((rest) => {
                    const isSel = restricoes.includes(rest);
                    return (
                      <button
                        key={rest}
                        type="button"
                        onClick={() => toggleSelection(rest, restricoes, setRestricoes, restricoesNone, setRestricoesNone)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {rest}
                      </button>
                    );
                  })}
                  {restricoes
                    .filter((r) => !RESTRICOES_LIST.includes(r))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>{custom}</span>
                        <X
                          className="w-3.5 h-3.5 cursor-pointer hover:text-emerald-950"
                          onClick={() => setRestricoes(restricoes.filter((r) => r !== custom))}
                        />
                      </span>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={novaRestricao}
                    onChange={(e) => setNovaRestricao(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag(novaRestricao, setNovaRestricao, restricoes, setRestricoes, setRestricoesNone);
                      }
                    }}
                    placeholder="Adicionar outra restrição alimentar..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTag(novaRestricao, setNovaRestricao, restricoes, setRestricoes, setRestricoesNone)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Alergias Alimentares */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Alergias Alimentares
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleNoneSelection(setAlergias, alergiasNone, setAlergiasNone)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      alergiasNone
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nenhum
                  </button>
                  {ALERGIAS_LIST.map((al) => {
                    const isSel = alergias.includes(al);
                    return (
                      <button
                        key={al}
                        type="button"
                        onClick={() => toggleSelection(al, alergias, setAlergias, alergiasNone, setAlergiasNone)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {al}
                      </button>
                    );
                  })}
                  {alergias
                    .filter((a) => !ALERGIAS_LIST.includes(a))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>{custom}</span>
                        <X
                          className="w-3.5 h-3.5 cursor-pointer hover:text-emerald-950"
                          onClick={() => setAlergias(alergias.filter((a) => a !== custom))}
                        />
                      </span>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={novaAlergia}
                    onChange={(e) => setNovaAlergia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag(novaAlergia, setNovaAlergia, alergias, setAlergias, setAlergiasNone);
                      }
                    }}
                    placeholder="Adicionar outra alergia alimentar..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTag(novaAlergia, setNovaAlergia, alergias, setAlergias, setAlergiasNone)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Medicamentos e Suplementos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Medicamentos Contínuos
                  </label>
                  <textarea
                    rows={2}
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    placeholder="Ex: Levotiroxina 50mcg, Losartana 50mg..."
                    className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Suplementos em Uso
                  </label>
                  <textarea
                    rows={2}
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    placeholder="Ex: Whey Protein isolado, Creatina 5g, Vitamina D..."
                    className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('pessoal')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para Pessoal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('habitos')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <span>Próximo: Hábitos e Rotina</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3 — HÁBITOS */}
          {/* ========================================================================= */}
          {activeTab === 'habitos' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Rotina, Sono & Estilo de Vida</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Horários, hidratação, prática de exercícios e observações complementares.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Refeições por Dia */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Refeições por dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                {/* Horário que acorda */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Horário que acorda
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => setHorarioAcorda(formatTimeAuto(horarioAcorda))}
                      placeholder="Ex: 6 ou 06:30"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Converte auto (ex: 630 → 06:30)
                  </span>
                </div>

                {/* Horário que dorme */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Horário que dorme
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => setHorarioDorme(formatTimeAuto(horarioDorme))}
                      placeholder="Ex: 23 ou 22:30"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Converte auto (ex: 2230 → 22:30)
                  </span>
                </div>

                {/* Quantidade de água */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quantidade de Água
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                      placeholder="2.5"
                      className="w-full pl-4 pr-14 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      litros
                    </span>
                  </div>
                </div>
              </div>

              {/* Atividade Física */}
              <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-4">
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
                      onClick={() => setPraticaAtividade(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        praticaAtividade
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setPraticaAtividade(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !praticaAtividade
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {praticaAtividade && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Qual atividade e frequência semanal?</span>
                    </label>
                    <input
                      type="text"
                      value={atividadeDescricao}
                      onChange={(e) => setAtividadeDescricao(e.target.value)}
                      placeholder="Ex: Musculação (4x/semana) + Corrida no fim de semana (5km)"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Observações Gerais
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais da rotina, hábitos alimentares, histórico familiar ou preferências..."
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('clinico')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para Clínico</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cadastrando no Neon...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Finalizar e Salvar Paciente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
