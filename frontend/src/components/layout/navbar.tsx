'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Users,
  Truck,
  ChevronDown,
  LogOut,
  Building2,
  LayoutGrid,
  Smartphone,
  Wallet,
  PackagePlus,
  Boxes,
  Layers,
  BarChart3,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [config, setConfig] = useState<{
    tcOficial?: number;
    tcParalelo?: number;
    tcActualizadoEn?: string | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const data = await api.configuracion.get();
        if (isMounted && data) {
          setConfig(data);
        }
      } catch {
        // Silencioso para no bloquear la barra de navegación
      }
    }

    if (isAuthenticated) {
      loadConfig();
    }

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        loadConfig();
      }
    };

    window.addEventListener('configuracion-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('configuracion-updated', handleUpdate);
    };
  }, [isAuthenticated]);

  // Si estamos en la página de login, no mostrar la barra de navegación del sistema
  if (pathname === '/login' || !isAuthenticated) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Operaciones', icon: LayoutGrid },
    { href: '/pos', label: 'Punto de Venta', icon: Smartphone },
    { href: '/caja', label: 'Caja Diaria', icon: Wallet },
    { href: '/recepcion', label: 'Recepción', icon: PackagePlus },
    { href: '/inventario', label: 'Inventario', icon: Boxes },
    { href: '/catalogo', label: 'Catálogo', icon: Layers },
    ...(user?.rol === 'ADMIN'
      ? [
          { href: '/administracion', label: 'Administración', icon: ShieldCheck },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Identidad de Marca y Navegación Principal */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-subtle flex-shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="CentralPhone Logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="font-bold tracking-tight text-slate-900 text-base">
              CentralPhone
            </span>
          </Link>

          {/* Menú de Navegación Minimalista Desktop */}
          <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-200">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold shadow-subtle border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lado Derecho: Chip de Tipo de Cambio & Perfil de Usuario */}
        <div className="flex items-center gap-3">
          {/* Chip de Tipo de Cambio WaveSoft (USD / BOB) */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-mono shadow-subtle hover:bg-slate-100/70 transition-colors cursor-default"
            title={
              config?.tcActualizadoEn
                ? `Tipo de Cambio WaveSoft Cloud\nÚltima sincronización: ${new Date(config.tcActualizadoEn).toLocaleString('es-BO')}`
                : 'Tipo de Cambio (USD / BOB)'
            }
          >
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              USD
            </span>
            <span className="text-slate-600 text-[11px] font-medium">
              Oficial:{' '}
              <strong className="text-slate-900 font-bold">
                {Number(config?.tcOficial ?? 6.96).toFixed(2)}
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 text-[11px] font-medium">
              Paralelo:{' '}
              <strong className="text-emerald-700 font-bold">
                {Number(config?.tcParalelo ?? 6.96).toFixed(2)}
              </strong>
            </span>
          </div>

          {/* Perfil de Usuario con Metadatos Integrados de Sucursal y Turno */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>

              <div className="hidden md:block text-right">
                <p className="font-semibold text-slate-900 leading-tight">
                  {user?.nombre || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5 flex items-center gap-1 justify-end">
                  <span>{user?.sucursal?.nombre || 'Sucursal Central'}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">
                    {user?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </span>
                </p>
              </div>

              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Menú Desplegable de Usuario y Control de Sesión */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
                  <p className="text-xs font-bold text-slate-900">
                    {user?.nombre}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    <span>{user?.sucursal?.nombre}</span>
                  </div>
                </div>

                {/* Widget de TC en móvil */}
                <div className="sm:hidden px-2.5 py-2 border-b border-slate-100 mb-1.5 bg-slate-50/70 rounded-lg text-xs font-mono">
                  <p className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wide">
                    Tipo de Cambio (USD/BOB)
                  </p>
                  <div className="flex justify-between mt-1 text-[11px]">
                    <span>Oficial: <strong className="text-slate-900 font-bold">{Number(config?.tcOficial ?? 6.96).toFixed(2)}</strong></span>
                    <span>Paralelo: <strong className="text-emerald-700 font-bold">{Number(config?.tcParalelo ?? 6.96).toFixed(2)}</strong></span>
                  </div>
                </div>

              {user?.rol === 'ADMIN' && (
                <div className="py-1 border-b border-slate-100 mb-1">
                  <Link
                    href="/administracion"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                    <span>Centro de Administración</span>
                  </Link>
                  <Link
                    href="/usuarios"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                  >
                    <Users className="h-3.5 w-3.5 text-slate-700" />
                    <span>Gestión de Personal</span>
                  </Link>
                  <Link
                    href="/proveedores"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                  >
                    <Truck className="h-3.5 w-3.5 text-slate-700" />
                    <span>Proveedores Mayoristas</span>
                  </Link>
                </div>
              )}

              {/* Botón de Cierre de Sesión */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-slate-50 rounded-lg transition-colors font-medium text-left"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-600" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>

    {/* Barra de Navegación Inferior Fija para Tablets y Móviles (< lg) */}
    <nav
      aria-label="Navegación móvil y tablet"
      className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden h-16 bg-white border-t border-slate-200 px-1.5 justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      {navLinks.slice(0, 6).map((link) => {
        const Icon = link.icon;
        const isActive =
          link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 rounded-lg text-[10px] font-medium transition-colors',
              isActive
                ? 'text-slate-900 font-bold bg-slate-50'
                : 'text-slate-500 hover:text-slate-900 active:bg-slate-100'
            )}
          >
            <Icon className={cn('h-5 w-5 mb-0.5', isActive ? 'text-slate-900' : 'text-slate-400')} />
            <span className="truncate max-w-[62px] text-center leading-tight">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  </>
);
}
