import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../types/auth';
import { neonSignIn, neonSignUp, neonSignOut, neonGetSession, getFriendlyErrorMessage } from '../lib/neon-auth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'feriani_nutri_auth_user';
const TOKEN_STORAGE_KEY = 'feriani_nutri_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const sessionData = await neonGetSession();
        if (mounted && sessionData?.user) {
          setUser(sessionData.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionData.user));
        }
      } catch (e) {
        console.warn('Session check fallback:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await neonSignIn(email, password);
      setUser(response.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      
      if (response.token) {
        setToken(response.token);
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      }
    } catch (err: any) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await neonSignUp(name, email, password);
      setUser(response.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));

      if (response.token) {
        setToken(response.token);
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      }
    } catch (err: any) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const logout = async () => {
    try {
      await neonSignOut();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
