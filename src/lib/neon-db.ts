import { neon } from '@neondatabase/serverless';
import type { 
  Nutricionista, 
  Paciente, 
  Consulta, 
  ConsultaComPaciente, 
  PacienteSemRetorno, 
  DashboardStats 
} from '../types/database';
import type { AuthUser } from '../types/auth';

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('Aviso: VITE_NEON_DATABASE_URL não configurada no ambiente.');
}

const sql = neon(DATABASE_URL || '');

/**
 * Resolve or synchronize the logged-in user in the public.nutricionistas table
 */
export async function resolveNutricionista(user: AuthUser): Promise<Nutricionista> {
  try {
    // 1. Try to find by email
    const existing = await sql`
      SELECT id, nome, email, created_at 
      FROM nutricionistas 
      WHERE email = ${user.email.toLowerCase()} OR id::text = ${user.id}
      LIMIT 1;
    `;

    if (existing && existing.length > 0) {
      return existing[0] as Nutricionista;
    }

    // 2. If not found, insert into nutricionistas
    const inserted = await sql`
      INSERT INTO nutricionistas (id, nome, email, created_at)
      VALUES (
        ${user.id ? user.id : sql`gen_random_uuid()`},
        ${user.name || 'Nutricionista'},
        ${user.email.toLowerCase()},
        NOW()
      )
      ON CONFLICT (email) DO UPDATE 
        SET nome = EXCLUDED.nome
      RETURNING id, nome, email, created_at;
    `;

    return inserted[0] as Nutricionista;
  } catch (error) {
    console.error('Error resolving nutricionista in Neon:', error);
    // Fallback object to avoid crashing UI
    return {
      id: user.id || 'unknown',
      nome: user.name || 'Nutricionista',
      email: user.email,
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * Fetch all dashboard stats in real-time from Neon for the given nutritionist
 */
export async function getDashboardStats(nutricionistaId: string): Promise<DashboardStats> {
  try {
    // 1. Total active patients
    const totalPatientsResult = await sql`
      SELECT COUNT(*)::int AS total 
      FROM pacientes 
      WHERE nutricionista_id = ${nutricionistaId};
    `;
    const totalPacientes = totalPatientsResult[0]?.total || 0;

    // 2. Consultations of the current week
    const weekConsultationsResult = await sql`
      SELECT 
        c.id,
        c.paciente_id,
        c.data_consulta::text,
        c.peso,
        c.cintura,
        c.quadril,
        c.percentual_gordura,
        c.observacoes,
        c.proximo_retorno::text,
        c.created_at::text,
        p.nome AS paciente_nome,
        p.telefone AS paciente_telefone
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
        AND c.data_consulta < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
      ORDER BY c.data_consulta DESC;
    `;

    const consultasSemanaList: ConsultaComPaciente[] = weekConsultationsResult.map((row: any) => ({
      id: row.id,
      paciente_id: row.paciente_id,
      data_consulta: row.data_consulta,
      peso: row.peso ? Number(row.peso) : null,
      cintura: row.cintura ? Number(row.cintura) : null,
      quadril: row.quadril ? Number(row.quadril) : null,
      percentual_gordura: row.percentual_gordura ? Number(row.percentual_gordura) : null,
      observacoes: row.observacoes,
      proximo_retorno: row.proximo_retorno,
      created_at: row.created_at,
      paciente_nome: row.paciente_nome,
      paciente_telefone: row.paciente_telefone,
    }));

    const consultasSemana = consultasSemanaList.length;

    // 3. Patients without return:
    // Last consultation was > 30 days ago AND has no future return scheduled
    const pacientesSemRetornoResult = await sql`
      SELECT 
        p.id,
        p.nome,
        p.telefone,
        p.whatsapp,
        p.email,
        latest_c.ultima_consulta::text,
        latest_c.proximo_retorno::text,
        latest_c.peso AS ultimo_peso,
        (CURRENT_DATE - latest_c.ultima_consulta)::int AS dias_sem_consulta
      FROM pacientes p
      JOIN LATERAL (
        SELECT c.data_consulta AS ultima_consulta, c.proximo_retorno, c.peso
        FROM consultas c
        WHERE c.paciente_id = p.id
        ORDER BY c.data_consulta DESC, c.created_at DESC
        LIMIT 1
      ) latest_c ON true
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND latest_c.ultima_consulta < CURRENT_DATE - INTERVAL '30 days'
        AND (latest_c.proximo_retorno IS NULL OR latest_c.proximo_retorno < CURRENT_DATE)
      ORDER BY latest_c.ultima_consulta ASC;
    `;

    const pacientesSemRetorno: PacienteSemRetorno[] = pacientesSemRetornoResult.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      email: row.email,
      ultima_consulta: row.ultima_consulta,
      proximo_retorno: row.proximo_retorno,
      dias_sem_consulta: Number(row.dias_sem_consulta) || 0,
      ultimo_peso: row.ultimo_peso ? Number(row.ultimo_peso) : null,
    }));

    return {
      totalPacientes,
      consultasSemana,
      consultasSemanaList,
      pacientesSemRetorno,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats from Neon:', error);
    throw error;
  }
}

/**
 * Fetch all patients for a nutritionist
 */
export async function getPacientes(nutricionistaId: string, search?: string): Promise<Paciente[]> {
  try {
    let result;
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      result = await sql`
        SELECT *
        FROM pacientes
        WHERE nutricionista_id = ${nutricionistaId}
          AND (
            LOWER(nome) LIKE ${term} OR 
            LOWER(email) LIKE ${term} OR 
            telefone LIKE ${term}
          )
        ORDER BY nome ASC;
      `;
    } else {
      result = await sql`
        SELECT *
        FROM pacientes
        WHERE nutricionista_id = ${nutricionistaId}
        ORDER BY created_at DESC;
      `;
    }

    return result as Paciente[];
  } catch (error) {
    console.error('Error fetching pacientes from Neon:', error);
    throw error;
  }
}

/**
 * Fetch a single patient with all consultations
 */
export async function getPacienteDetails(
  pacienteId: string, 
  nutricionistaId: string
): Promise<{ paciente: Paciente; consultas: Consulta[] } | null> {
  try {
    const pacienteRes = await sql`
      SELECT *
      FROM pacientes
      WHERE id = ${pacienteId} AND nutricionista_id = ${nutricionistaId}
      LIMIT 1;
    `;

    if (!pacienteRes || pacienteRes.length === 0) {
      return null;
    }

    const consultasRes = await sql`
      SELECT 
        id,
        paciente_id,
        data_consulta::text,
        peso,
        cintura,
        quadril,
        percentual_gordura,
        observacoes,
        proximo_retorno::text,
        created_at::text
      FROM consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta DESC;
    `;

    const consultas: Consulta[] = consultasRes.map((c: any) => ({
      id: c.id,
      paciente_id: c.paciente_id,
      data_consulta: c.data_consulta,
      peso: c.peso ? Number(c.peso) : null,
      cintura: c.cintura ? Number(c.cintura) : null,
      quadril: c.quadril ? Number(c.quadril) : null,
      percentual_gordura: c.percentual_gordura ? Number(c.percentual_gordura) : null,
      observacoes: c.observacoes,
      proximo_retorno: c.proximo_retorno,
      created_at: c.created_at,
    }));

    return {
      paciente: pacienteRes[0] as Paciente,
      consultas,
    };
  } catch (error) {
    console.error('Error fetching paciente details from Neon:', error);
    throw error;
  }
}

/**
 * Create a new patient in Neon
 */
export async function createPaciente(paciente: {
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string;
  sexo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  peso_inicial?: number;
  altura?: number;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  restricoes_alimentares?: string[];
  alergias?: string[];
  medicamentos?: string;
  suplementos?: string;
  refeicoes_por_dia?: number;
  horario_acorda?: string;
  horario_dorme?: string;
  litros_agua?: number;
  atividade_fisica?: boolean;
  atividade_fisica_descricao?: string;
  observacoes?: string;
}): Promise<Paciente> {
  const res = await sql`
    INSERT INTO pacientes (
      nutricionista_id,
      nome,
      data_nascimento,
      sexo,
      telefone,
      whatsapp,
      email,
      peso_inicial,
      altura,
      objetivos,
      objetivo_texto,
      nivel_atividade,
      patologias,
      restricoes_alimentares,
      alergias,
      medicamentos,
      suplementos,
      refeicoes_por_dia,
      horario_acorda,
      horario_dorme,
      litros_agua,
      atividade_fisica,
      atividade_fisica_descricao,
      observacoes
    ) VALUES (
      ${paciente.nutricionista_id},
      ${paciente.nome},
      ${paciente.data_nascimento || null},
      ${paciente.sexo || null},
      ${paciente.telefone || null},
      ${paciente.whatsapp || null},
      ${paciente.email || null},
      ${paciente.peso_inicial || null},
      ${paciente.altura || null},
      ${paciente.objetivos || []},
      ${paciente.objetivo_texto || null},
      ${paciente.nivel_atividade || null},
      ${paciente.patologias || []},
      ${paciente.restricoes_alimentares || []},
      ${paciente.alergias || []},
      ${paciente.medicamentos || null},
      ${paciente.suplementos || null},
      ${paciente.refeicoes_por_dia || null},
      ${paciente.horario_acorda || null},
      ${paciente.horario_dorme || null},
      ${paciente.litros_agua || null},
      ${paciente.atividade_fisica || false},
      ${paciente.atividade_fisica_descricao || null},
      ${paciente.observacoes || null}
    )
    RETURNING *;
  `;

  return res[0] as Paciente;
}

/**
 * Register a new consultation for a patient in Neon
 */
export async function createConsulta(consulta: {
  paciente_id: string;
  data_consulta: string;
  peso?: number;
  cintura?: number;
  quadril?: number;
  percentual_gordura?: number;
  observacoes?: string;
  proximo_retorno?: string;
}): Promise<Consulta> {
  const res = await sql`
    INSERT INTO consultas (
      paciente_id,
      data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      proximo_retorno
    ) VALUES (
      ${consulta.paciente_id},
      ${consulta.data_consulta},
      ${consulta.peso || null},
      ${consulta.cintura || null},
      ${consulta.quadril || null},
      ${consulta.percentual_gordura || null},
      ${consulta.observacoes || null},
      ${consulta.proximo_retorno || null}
    )
    RETURNING 
      id,
      paciente_id,
      data_consulta::text,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      proximo_retorno::text,
      created_at::text;
  `;

  const c = res[0];
  return {
    id: c.id,
    paciente_id: c.paciente_id,
    data_consulta: c.data_consulta,
    peso: c.peso ? Number(c.peso) : null,
    cintura: c.cintura ? Number(c.cintura) : null,
    quadril: c.quadril ? Number(c.quadril) : null,
    percentual_gordura: c.percentual_gordura ? Number(c.percentual_gordura) : null,
    observacoes: c.observacoes,
    proximo_retorno: c.proximo_retorno,
    created_at: c.created_at,
  };
}

/**
 * Seed demo data for testing real-time dashboard calculations
 */
export async function seedSampleData(nutricionistaId: string): Promise<void> {
  // 1. Check if patients already exist
  const countRes = await sql`
    SELECT count(*)::int as total FROM pacientes WHERE nutricionista_id = ${nutricionistaId};
  `;
  if (countRes[0]?.total > 0) return;

  // Insert 4 realistic patients
  // Patient 1: Active with consultation this week
  const p1 = await sql`
    INSERT INTO pacientes (
      nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo, peso_inicial, altura,
      objetivos, objetivo_texto, nivel_atividade, refeicoes_por_dia, litros_agua, atividade_fisica
    ) VALUES (
      ${nutricionistaId}, 'Juliana Mendes Rocha', 'juliana.mendes@email.com', '(11) 98765-4321', '(11) 98765-4321',
      '1992-05-14', 'Feminino', 68.5, 1.65,
      ARRAY['Emagrecimento', 'Ganho de massa magra'], 'Reduzir percentual de gordura e aumentar disposição',
      'Moderado', 5, 2.5, true
    ) RETURNING id;
  `;

  // Patient 2: Active with consultation this week and upcoming return
  const p2 = await sql`
    INSERT INTO pacientes (
      nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo, peso_inicial, altura,
      objetivos, objetivo_texto, nivel_atividade, refeicoes_por_dia, litros_agua, atividade_fisica
    ) VALUES (
      ${nutricionistaId}, 'Lucas Gabriel Santos', 'lucas.santos@email.com', '(11) 97654-3210', '(11) 97654-3210',
      '1988-11-20', 'Masculino', 84.0, 1.78,
      ARRAY['Hipertrofia', 'Melhora da performance'], 'Aumento de rendimento no crossfit e ganho de massa muscular',
      'Intenso', 6, 3.2, true
    ) RETURNING id;
  `;

  // Patient 3: SEM RETORNO (Last consultation 45 days ago, no future return scheduled)
  const p3 = await sql`
    INSERT INTO pacientes (
      nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo, peso_inicial, altura,
      objetivos, objetivo_texto, nivel_atividade, refeicoes_por_dia, litros_agua, atividade_fisica
    ) VALUES (
      ${nutricionistaId}, 'Fernanda Albuquerque', 'fernanda.albuquerque@email.com', '(11) 99123-4567', '(11) 99123-4567',
      '1995-03-08', 'Feminino', 72.0, 1.68,
      ARRAY['Reeducação alimentar', 'Saúde e longevidade'], 'Ajuste de hábitos alimentares e redução de compulsão por doces',
      'Leve', 4, 1.8, false
    ) RETURNING id;
  `;

  // Patient 4: SEM RETORNO (Last consultation 60 days ago, no return scheduled)
  const p4 = await sql`
    INSERT INTO pacientes (
      nutricionista_id, nome, email, telefone, whatsapp, data_nascimento, sexo, peso_inicial, altura,
      objetivos, objetivo_texto, nivel_atividade, refeicoes_por_dia, litros_agua, atividade_fisica
    ) VALUES (
      ${nutricionistaId}, 'Rodrigo Costa Neves', 'rodrigo.costa@email.com', '(11) 98456-7890', '(11) 98456-7890',
      '1982-07-25', 'Masculino', 92.5, 1.82,
      ARRAY['Emagrecimento', 'Controle de colesterol'], 'Perda de peso para controle glicêmico e melhora nos exames de sangue',
      'Sedentário', 3, 1.5, false
    ) RETURNING id;
  `;

  // Consultations for P1: Consultation this week (today / yesterday)
  if (p1[0]?.id) {
    await sql`
      INSERT INTO consultas (
        paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
      ) VALUES (
        ${p1[0].id}, CURRENT_DATE, 66.8, 74.0, 98.5, 24.2,
        'Ótima adesão ao plano nutricional. Perda de 1.7kg de gordura e melhora na saciedade.',
        CURRENT_DATE + INTERVAL '30 days'
      );
    `;
  }

  // Consultations for P2: Consultation this week
  if (p2[0]?.id) {
    await sql`
      INSERT INTO consultas (
        paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
      ) VALUES (
        ${p2[0].id}, CURRENT_DATE - INTERVAL '1 day', 85.2, 82.0, 99.0, 14.8,
        'Ganho de 1.2kg de massa magra. Aumentamos o aporte proteico pós-treino.',
        CURRENT_DATE + INTERVAL '45 days'
      );
    `;
  }

  // Consultations for P3: SEM RETORNO (consultation 45 days ago, no return scheduled)
  if (p3[0]?.id) {
    await sql`
      INSERT INTO consultas (
        paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
      ) VALUES (
        ${p3[0].id}, CURRENT_DATE - INTERVAL '45 days', 71.2, 79.0, 102.0, 28.5,
        'Primeira consulta de retorno. Relatou dificuldades no final de semana.',
        NULL
      );
    `;
  }

  // Consultations for P4: SEM RETORNO (consultation 62 days ago, no return scheduled)
  if (p4[0]?.id) {
    await sql`
      INSERT INTO consultas (
        paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
      ) VALUES (
        ${p4[0].id}, CURRENT_DATE - INTERVAL '62 days', 91.0, 96.0, 104.0, 27.0,
        'Consulta de avaliação inicial. Plano inicial entregue.',
        NULL
      );
    `;
  }
}
