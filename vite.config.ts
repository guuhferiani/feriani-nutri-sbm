import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';

/**
 * Custom Vite Plugin to handle /api/gerar-plano in local dev server
 * Ensures GOOGLE_API_KEY stays strictly on the server-side
 */
function devApiServer(apiKey?: string) {
  return {
    name: 'vite-dev-api-gerar-plano',
    configureServer(server: any) {
      server.middlewares.use('/api/gerar-plano', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsedBody = JSON.parse(body || '{}');
            const { dados_do_paciente } = parsedBody;

            if (!dados_do_paciente) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'dados_do_paciente é obrigatório.' }));
              return;
            }

            const key = apiKey || process.env.GOOGLE_API_KEY;
            if (!key) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'GOOGLE_API_KEY não configurada no servidor.' }));
              return;
            }

            const genAI = new GoogleGenerativeAI(key);
            const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-2.5-flash'];

            const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dados_do_paciente}

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

            const responseSchema: ResponseSchema = {
              type: SchemaType.OBJECT,
              properties: {
                plano_semanal: {
                  type: SchemaType.ARRAY,
                  description: 'Lista com o cardápio dos 7 dias da semana',
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      dia: { type: SchemaType.STRING },
                      refeicoes: {
                        type: SchemaType.OBJECT,
                        properties: {
                          cafe_da_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                          lanche_manha: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                          almoco: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                          lanche_tarde: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                          jantar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        },
                        required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
                      },
                    },
                    required: ['dia', 'refeicoes'],
                  },
                },
              },
              required: ['plano_semanal'],
            };

            let lastErr: any = null;
            let successResult: any = null;

            for (const modelName of modelsToTry) {
              try {
                const model = genAI.getGenerativeModel({
                  model: modelName,
                  generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema,
                  },
                });

                const result = await model.generateContent(prompt);
                const text = result.response.text();
                successResult = JSON.parse(text);
                break;
              } catch (mErr: any) {
                console.warn(`[Vite Dev API] Falha no modelo ${modelName}:`, mErr?.message || mErr);
                lastErr = mErr;
              }
            }

            if (!successResult) {
              throw new Error('Falha ao gerar com todos os modelos disponíveis: ' + (lastErr?.message || ''));
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(successResult));
          } catch (err: any) {
            console.error('Erro na geração com Gemini (Vite Dev API):', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Erro ao gerar plano alimentar com IA',
              message: err?.message || 'Falha desconhecida',
            }));
          }
        });
      });

      // Neon Auth Webhooks handler in local dev server
      server.middlewares.use('/api/webhooks/auth', async (req: any, res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Neon-Signature');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'online',
            message: 'Endpoint de Webhooks do Neon Auth ativo e pronto para receber eventos.',
            environment: 'development'
          }));
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const eventName = parsed.event || parsed.type || 'unknown.event';
            console.log(`[Vite Dev Neon Webhook] Evento recebido: ${eventName}`, parsed);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ received: true, event: eventName, dev: true }));
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'JSON inválido' }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      devApiServer(env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg', 'maskable-icon-512x512.svg'],
        manifest: {
          name: 'Feriani Nutri — Gestão para Nutricionistas',
          short_name: 'Feriani Nutri',
          description: 'Sistema completo de gestão clínica, pacientes e consultas para nutricionistas.',
          theme_color: '#059669',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/maskable-icon-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
  };
});
