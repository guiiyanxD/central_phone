'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, activeSucursal, setActiveSucursal } = useAuth();
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSucursalMenu, setShowSucursalMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sucursalMenuRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<{
    tcOficial?: number;
    tcParalelo?: number;
    tcActualizadoEn?: string | null;
  } | null>(null);

  // Cierre de menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (sucursalMenuRef.current && !sucursalMenuRef.current.contains(event.target as Node)) {
        setShowSucursalMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  useEffect(() => {
    if (isAuthenticated && user?.rol === 'ADMIN') {
      api.sucursales
        .getAll()
        .then((data) => {
          if (Array.isArray(data)) {
            setSucursales(data.filter((s: any) => s.activo !== false));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user?.rol]);

  // Si estamos en la página de login, no mostrar la barra de navegación del sistema
  if (pathname === '/login' || !isAuthenticated) {
    return null;
  }

  // Enlaces para desktop: Se omite 'Operaciones' porque el Logo cumple la función de Home/Dashboard
  const desktopNavLinks = [
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

  // Enlaces para móvil/tablet (barra inferior): se incluye 'Inicio' para ergonomía con el pulgar
  const mobileNavLinks = [
    { href: '/', label: 'Inicio', icon: LayoutGrid },
    { href: '/pos', label: 'Punto de Venta', icon: Smartphone },
    { href: '/caja', label: 'Caja Diaria', icon: Wallet },
    { href: '/recepcion', label: 'Recepción', icon: PackagePlus },
    { href: '/inventario', label: 'Inventario', icon: Boxes },
    { href: '/catalogo', label: 'Catálogo', icon: Layers },
  ];

  const currentSucursalName = activeSucursal?.nombre || user?.sucursal?.nombre || 'Sucursal Central';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Identidad de Marca y Navegación Principal */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 group"
              title="CentralPhone - Inicio / Operaciones"
            >
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

            {/* Menú de Navegación Minimalista Desktop (Sin 'Operaciones' redundante) */}
            <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-200">
              {desktopNavLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
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

          {/* Lado Derecho: Chip de Tipo de Cambio, Selector de Sucursal & Perfil de Usuario */}
          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* Selector Dedicado de Sucursal (Independiente del Perfil) */}
            {user?.rol === 'ADMIN' ? (
              <div className="relative" ref={sucursalMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSucursalMenu((prev) => !prev);
                    setShowUserMenu(false);
                  }}
                  aria-expanded={showSucursalMenu}
                  aria-haspopup="true"
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors',
                    showSucursalMenu
                      ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100/70 hover:text-slate-900 shadow-subtle'
                  )}
                  title={`Sucursal Activa: ${currentSucursalName}`}
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="font-semibold max-w-[100px] sm:max-w-[130px] lg:max-w-[150px] truncate text-left">
                    {currentSucursalName}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-slate-400 transition-transform duration-150 shrink-0',
                      showSucursalMenu && 'rotate-180'
                    )}
                  />
                </button>

                {showSucursalMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>Sucursales</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {sucursales.length} disponibles
                      </span>
                    </div>

                    <div className="space-y-0.5 max-h-56 overflow-y-auto">
                      {sucursales.map((s) => {
                        const isCurrent = activeSucursal
                          ? activeSucursal.id === s.id
                          : user?.sucursal?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              if (!isCurrent) {
                                // Blindaje anti-pérdida de ticket en POS (ID-UX-001)
                                if (typeof window !== 'undefined' && pathname.startsWith('/pos')) {
                                  const hasCartItems = window.sessionStorage.getItem('pos_cart_has_items') === 'true';
                                  if (hasCartItems) {
                                    const confirmed = window.confirm(
                                      `Tienes productos en el ticket actual de venta. ¿Estás seguro de conmutar a "${s.nombre}"? Se descartará el ticket en curso.`
                                    );
                                    if (!confirmed) {
                                      setShowSucursalMenu(false);
                                      return;
                                    }
                                  }
                                }
                                setActiveSucursal({
                                  id: s.id,
                                  nombre: s.nombre,
                                  ciudad: s.ciudad,
                                });
                              }
                              setShowSucursalMenu(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                              isCurrent
                                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            )}
                          >
                            <span className="truncate pr-2">
                              {s.nombre} {s.ciudad ? `(${s.ciudad})` : ''}
                            </span>
                            {isCurrent && (
                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 shadow-subtle cursor-default"
                title={`Sucursal: ${currentSucursalName}`}
              >
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium max-w-[100px] sm:max-w-[130px] truncate">
                  {currentSucursalName}
                </span>
              </div>
            )}

            {/* Perfil de Usuario con Menú Descongestionado */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu((prev) => !prev);
                  setShowSucursalMenu(false);
                }}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                className="flex items-center gap-2 p-1 rounded-xl text-xs text-slate-700 hover:bg-slate-100/70 transition-colors text-left"
                title={user?.nombre || 'Usuario'}
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                  {user?.nombre ? user.nombre.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>

                <div className="hidden md:block text-left">
                  <p className="font-semibold text-slate-900 leading-tight max-w-[110px] truncate">
                    {user?.nombre || 'Usuario'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {user?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </p>
                </div>

                <ChevronDown
                  className={cn(
                    'h-3 w-3 text-slate-400 transition-transform duration-150 shrink-0',
                    showUserMenu && 'rotate-180'
                  )}
                />
              </button>

              {/* Menú Desplegable de Usuario (Limpio y sin lista de sucursales) */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-2 border-b border-slate-100 mb-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.nombre}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{currentSucursalName}</span>
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

                  {/* Enlaces Administrativos (Exclusivo ADMIN) */}
                  {user?.rol === 'ADMIN' && (
                    <div className="py-1 border-b border-slate-100 mb-1">
                      <Link
                        href="/administracion"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                        <span>Centro de Administración</span>
                      </Link>
                      <Link
                        href="/usuarios"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                      >
                        <Users className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                        <span>Gestión de Personal</span>
                      </Link>
                      <Link
                        href="/proveedores"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                      >
                        <Truck className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                        <span>Proveedores Mayoristas</span>
                      </Link>
                    </div>
                  )}

                  {/* Botón de Cierre de Sesión */}
                  <div className="pt-0.5">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50/60 rounded-lg transition-colors font-medium text-left"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-600 shrink-0" />
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
        {mobileNavLinks.map((link) => {
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
