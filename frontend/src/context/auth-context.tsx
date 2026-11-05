'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setStoredToken, removeStoredToken } from '@/lib/api';

export interface SucursalInfo {
  id: number;
  nombre: string;
  ciudad: string;
}

export interface UserSession {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR';
  sucursal: SucursalInfo;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeSucursal: SucursalInfo | null;
  setActiveSucursal: (sucursal: SucursalInfo) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  activeSucursal: null,
  setActiveSucursal: () => {},
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeSucursal, setActiveSucursalState] = useState<SucursalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper para resolver la sucursal activa inicial
  const resolveActiveSucursal = (userObj: UserSession | null): SucursalInfo | null => {
    if (!userObj) return null;
    if (userObj.rol === 'ADMIN' && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('centralphone_active_sucursal');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.id === 'number' && parsed.nombre) {
            return parsed;
          }
        }
      } catch {
        // En caso de error, recurre a la sucursal asignada
      }
    }
    return userObj.sucursal || null;
  };

  const setActiveSucursal = (sucursal: SucursalInfo) => {
    if (!user || user.rol !== 'ADMIN') return;
    setActiveSucursalState(sucursal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('centralphone_active_sucursal', JSON.stringify(sucursal));
      window.dispatchEvent(
        new CustomEvent('active-sucursal-changed', { detail: sucursal })
      );
    }
  };

  // Inicialización estricta de sesión (sin auto-login bypass)
  useEffect(() => {
    async function initSession() {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('centralphone_token') : null;
      if (!stored) {
        removeStoredToken();
        setUser(null);
        setToken(null);
        setActiveSucursalState(null);
        setIsLoading(false);
        return;
      }

      // Asegurar sincronización de cookie para el Middleware de Next.js
      setStoredToken(stored);

      try {
        const me = await api.auth.me();
        setUser(me);
        setToken(stored);
        setActiveSucursalState(resolveActiveSucursal(me));
      } catch {
        // Token inválido o expirado
        removeStoredToken();
        setUser(null);
        setToken(null);
        setActiveSucursalState(null);
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
      setActiveSucursalState(resolveActiveSucursal(res.user));
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('centralphone_active_sucursal');
    }
    setUser(null);
    setToken(null);
    setActiveSucursalState(null);
    router.push('/login');
  };

  const isPublicRoute = pathname === '/login';

  // Barrera de renderizado (Defensa en profundidad):
  // Si la ruta es protegida y aún se está verificando sesión o no hay usuario,
  // NUNCA renderizar {children} para evitar cualquier parpadeo de contenido privado.
  const content = (!isPublicRoute && (isLoading || !user)) ? (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
      <div className="relative h-14 w-14 rounded-2xl bg-white border border-slate-200 p-2.5 shadow-subtle flex items-center justify-center animate-pulse">
        <img src="/logo.png" alt="CentralPhone Logo" className="object-contain" />
      </div>
      <p className="text-xs text-slate-500 font-medium tracking-wide">
        Verificando sesión segura...
      </p>
    </div>
  ) : (
    children
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        activeSucursal,
        setActiveSucursal,
        login,
        logout,
      }}
    >
      {content}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
