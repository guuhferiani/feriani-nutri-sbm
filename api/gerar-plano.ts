import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';

// Schema defining the strict structured output
export const mealPlanSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Lista com o cardápio dos 7 dias da semana',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: 'Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)'
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                description: '5 opções de café da manhã adaptadas ao paciente',
                items: { type: SchemaType.STRING }
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                description: '5 opções de lanche da manhã adaptadas ao paciente',
                items: { type: SchemaType.STRING }
              },
              almoco: {
                type: SchemaType.ARRAY,
                description: '5 opções de almoço balanceadas e adaptadas ao paciente',
                items: { type: SchemaType.STRING }
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                description: '5 opções de lanche da tarde adaptadas ao paciente',
                items: { type: SchemaType.STRING }
              },
              jantar: {
                type: SchemaType.ARRAY,
                description: '5 opções de jantar leves e adaptadas ao paciente',
                items: { type: SchemaType.STRING }
              }
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar']
          }
        },
        required: ['dia', 'refeicoes']
      }
    }
  },
  required: ['plano_semanal']
};

/**
 * Internal business function to generate the meal plan using Google Gemini
 */
export async function gerarPlanoComGemini(dadosPaciente: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY não configurada no servidor.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-2.5-flash'];

  const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPaciente}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: mealPlanSchema,
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const parsed = JSON.parse(responseText);
      if (!parsed || !Array.isArray(parsed.plano_semanal) || parsed.plano_semanal.length === 0) {
        throw new Error('Formato retornado pela IA é inválido.');
      }
      return parsed;
    } catch (err: any) {
      console.warn(`Tentativa com modelo ${modelName} falhou:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error('Não foi possível gerar o plano com os modelos disponíveis: ' + (lastError?.message || 'Erro desconhecido'));
}

/**
 * Standard Serverless Function Handler (e.g. Vercel, Node, Netlify)
 */
export default async function handler(req: any, res: any) {
  // CORS configuration if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    }

    const { dados_do_paciente } = body || {};

    if (!dados_do_paciente) {
      return res.status(400).json({ 
        error: 'Requisição inválida: o campo dados_do_paciente é obrigatório.' 
      });
    }

    const plano = await gerarPlanoComGemini(dados_do_paciente);
    return res.status(200).json(plano);
  } catch (error: any) {
    console.error('Erro na Serverless Function /api/gerar-plano:', error);
    return res.status(500).json({
      error: 'Erro ao gerar plano alimentar com IA',
      message: error?.message || 'Erro interno no servidor'
    });
  }
}
