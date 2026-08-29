export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  created_at: string;
}

export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
  created_at: string;
  ultima_consulta?: string | null;
  total_consultas?: number | null;
}

export type PacienteInput = Omit<Paciente, 'id' | 'created_at' | 'ultima_consulta' | 'total_consultas'>;

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
  created_at: string;
}

export interface ConsultaComPaciente extends Consulta {
  paciente_nome?: string;
  paciente_telefone?: string;
}

export interface PacienteSemRetorno {
  id: string;
  nome: string;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  ultima_consulta: string;
  proximo_retorno?: string | null;
  dias_sem_consulta: number;
  ultimo_peso?: number | null;
}

export interface DashboardStats {
  totalPacientes: number;
  consultasSemana: number;
  consultasSemanaList: ConsultaComPaciente[];
  pacientesSemRetorno: PacienteSemRetorno[];
}
