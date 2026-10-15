'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setStoredToken, removeStoredToken } from '@/lib/api';

export interface UserSession {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR';
  sucursal: {
    id: number;
    nombre: string;
    ciudad: string;
  };
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialización estricta de sesión (sin auto-login bypass)
  useEffect(() => {
    async function initSession() {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('centralphone_token') : null;
      if (!stored) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const me = await api.auth.me();
        setUser(me);
        setToken(stored);
      } catch {
        // Token inválido o expirado
        removeStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  // Redirección automática según estado de autenticación
  useEffect(() => {
    if (isLoading) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password: pass });
      setStoredToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
