export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
}

export interface AuthSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
  session?: AuthSession;
  redirect?: boolean;
}

export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  created_at: string;
}
