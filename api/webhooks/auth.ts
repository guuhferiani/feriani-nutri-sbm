/**
 * Serverless Function & Webhook Handler para eventos do Neon Auth
 * Rota: /api/webhooks/auth
 * 
 * Eventos suportados:
 * - send.otp: Disparo de código SMS/WhatsApp para Phone Authentication
 * - user.created: Notificação de cadastro de novo nutricionista
 * - session.created: Auditoria de login no sistema
 */

export interface NeonWebhookPayload {
  event?: string;
  type?: string;
  data?: any;
  user?: any;
  phoneNumber?: string;
  otp?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Processador dos eventos de autenticação
 */
export async function processNeonAuthWebhook(payload: NeonWebhookPayload) {
  const eventName = payload.event || payload.type || 'unknown.event';
  const timestamp = new Date().toISOString();

  console.log(`[NEON AUTH WEBHOOK ${timestamp}] Evento recebido: ${eventName}`);

  switch (eventName) {
    case 'send.otp': {
      // Disparo de OTP para Phone Authentication (Celular / WhatsApp)
      const phone = payload.phoneNumber || payload.data?.phoneNumber || payload.phone;
      const code = payload.otp || payload.data?.otp || payload.code;

      console.log(`📲 [PHONE AUTH] Disparar código OTP para ${phone}:`);
      console.log(`🔑 Código: ${code}`);

      // Exemplo de integração futura com Gateway WhatsApp (Z-API / Evolution API) ou SMS (Twilio):
      // await enviarWhatsApp(phone, `Seu código de acesso Feriani Nutri é: ${code}`);
      break;
    }

    case 'user.created': {
      const user = payload.user || payload.data?.user || payload.data;
      console.log(`👤 [NOVO NUTRICIONISTA] Usuário registrado:`, user?.email || user?.name || user);
      break;
    }

    case 'session.created': {
      const session = payload.data || payload.session;
      console.log(`🔐 [LOGIN REALIZADO] Sessão iniciada:`, session?.userId || payload.user?.email);
      break;
    }

    default:
      console.log(`ℹ️ [WEBHOOK DATA] Detalhes do evento ${eventName}:`, payload);
      break;
  }

  return {
    success: true,
    event: eventName,
    processedAt: timestamp,
  };
}

/**
 * Handler padrão para Serverless (Vercel, Netlify, Node)
 */
export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Neon-Signature');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      message: 'Endpoint de Webhooks do Neon Auth ativo e pronto para receber eventos.',
      documentation: 'Configure esta URL no Console do Neon na aba Auth -> Webhooks.',
      supportedEvents: ['send.otp', 'user.created', 'session.created']
    });
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
        // use raw body
      }
    }

    const result = await processNeonAuthWebhook(body || {});
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro no processamento do webhook do Neon Auth:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar webhook',
      message: error?.message || 'Erro desconhecido'
    });
  }
}
