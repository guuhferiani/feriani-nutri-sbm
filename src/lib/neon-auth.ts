import type { AuthResponse, AuthUser } from '../types/auth';

const NEON_AUTH_BASE_URL = import.meta.env.VITE_NEON_AUTH_URL || '';

export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.';
  
  const msg = typeof error === 'string' ? error : error.message || error.code || '';

  if (msg.includes('INVALID_EMAIL_OR_PASSWORD') || msg.includes('Invalid email or password')) {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
  }
  if (msg.includes('USER_ALREADY_EXISTS') || msg.includes('User already exists')) {
    return 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
  }
  if (msg.includes('PASSWORD_TOO_SHORT') || msg.includes('Password is too short')) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (msg.includes('INVALID_EMAIL') || msg.includes('Invalid email')) {
    return 'Por favor, insira um endereço de e-mail válido.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
  }

  return msg || 'Ocorreu um erro ao processar sua solicitação.';
}

export async function neonSignUp(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getFriendlyErrorMessage(data));
  }

  return data;
}

export async function neonSignIn(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${NEON_AUTH_BASE_URL}/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getFriendlyErrorMessage(data));
  }

  return data;
}

export async function neonSignOut(): Promise<void> {
  try {
    await fetch(`${NEON_AUTH_BASE_URL}/sign-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.error('Sign out error:', err);
  }
}

export async function neonGetSession(): Promise<{ user: AuthUser; session?: any } | null> {
  try {
    const response = await fetch(`${NEON_AUTH_BASE_URL}/get-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data && data.user ? data : null;
  } catch (err) {
    console.warn('Get session error:', err);
    return null;
  }
}
