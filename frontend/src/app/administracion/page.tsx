'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  BarChart3,
  QrCode,
  Users,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Lock,
  Landmark,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdministracionPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [config, setConfig] = useState<any>(null);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      if (user?.rol !== 'ADMIN') return;
      setIsLoading(true);
      try {
        const [configData, sucData] = await Promise.all([
          api.configuracion.get().catch(() => null),
          api.sucursales.getAll(true).catch(() => []),
        ]);
        setConfig(configData);
        setSucursales(sucData);
      } catch (err) {
        console.error('Error al cargar datos administrativos', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.rol === 'ADMIN') {
      loadAdminData();
    }
  }, [user]);

  // ==========================================
  // BLOQUEO ESTRICTO DE RBAC (SOLO ADMINISTRADOR)
  // ==========================================
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (!authLoading && user && user.rol !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-subtle">
          <ShieldAlert className="h-8 w-8 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Acceso Restringido a Administradores
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            El Centro de Administración consolida parámetros financieros, cuentas bancarias corporativas y gobierno multi-sucursal, reservado para usuarios de nivel Administrador.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-mono mt-2">
            <span>Tu rol actual:</span>
            <Badge variant="outline" className="font-semibold text-slate-900">
              {user.rol}
            </Badge>
          </div>
        </div>
        <div className="pt-4 flex justify-center gap-3">
          <Link href="/pos">
            <Button variant="default">
              Ir a Punto de Venta
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Volver a Operaciones</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sucursalesActivas = sucursales.filter((s) => s.activo).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Encabezado Principal */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Centro de Administración
              </h1>
              <Badge variant="default" className="text-[10px] tracking-wide uppercase font-semibold">
                Control Maestro
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión estratégica, gobierno multi-tienda, auditoría financiera y parámetros bancarios de CentralPhone.
            </p>
          </div>
        </div>
      </div>

      {/* Resumen Ejecutivo de Gobierno */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Cobro QR & Cuenta Oficial</p>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2 truncate">
            {config?.bancoOficial || 'Banco de Crédito BCP'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
            {config?.numeroCuenta ? `Cta: ${config.numeroCuenta}` : 'Cuenta central configurada'}
          </p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Sedes Operativas</p>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {sucursalesActivas}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {sucursales.length > sucursalesActivas
              ? `${sucursales.length} sedes registradas en total`
              : 'Todas las sucursales activas'}
          </p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Seguridad & RBAC</p>
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Anti-Fraude Activo</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Vendedores en solo lectura</p>
        </Card>
      </div>

      {/* Portales de Mando Administrativo */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Módulos de Gestión y Configuración
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Configuración Corporativa & QR Oficial */}
          <Card className="hover:border-slate-300 hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <QrCode className="h-5 w-5" />
                </div>
                <Badge variant="outline">Anti-Fraude</Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-slate-800">
                Configuración Corporativa & QR Oficial
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs mt-1.5 leading-relaxed">
                Actualizar la imagen del QR oficial bancario, parámetros de cuenta receptora (Banco, Titular, N° Cuenta), nombre comercial y datos fiscales de facturación.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Link href="/configuracion">
                <Button className="w-full justify-between" variant="outline">
                  <span>Modificar Datos & QR Oficial</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 2. Gestión de Sucursales */}
          <Card className="hover:border-slate-300 hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <Badge variant="success">{sucursalesActivas} Activas</Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-slate-800">
                Gestión de Sucursales
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs mt-1.5 leading-relaxed">
                Dar de alta nuevas tiendas físicas, activar/desactivar sedes, gestionar direcciones, teléfonos de contacto y supervisar el inventario local y personal asignado.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Link href="/sucursales">
                <Button className="w-full justify-between" variant="outline">
                  <span>Administrar Sedes de Tienda</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 3. Reportes Financieros & Rentabilidad Neta */}
          <Card className="hover:border-slate-300 hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <Badge variant="mono">Rentabilidad 3FN</Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-slate-800">
                Reportes Financieros & Rentabilidad
              </CardTitle>
              <CardDescription className="text-slate-600 text-xs mt-1.5 leading-relaxed">
                Consultar el rendimiento económico neto en base a costos históricos inmutables, arqueos consolidados por sucursal, auditoría de ventas y motivos de anulación.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Link href="/reportes">
                <Button className="w-full justify-between" variant="outline">
                  <span>Ver Informes Financieros</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 4. Gestión de Usuarios & Personal (Próximo Módulo) */}
          <Card className="border-dashed border-slate-300 bg-slate-50/50 flex flex-col justify-between">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-[10px]">Próximamente</Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-700">
                Gestión de Personal & Usuarios
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Control de credenciales, alta y baja de vendedores, asignación de sucursal por defecto y auditoría de accesos.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button className="w-full justify-between text-slate-400 border-slate-200" variant="outline" disabled>
                <span>Módulo en Preparación</span>
                <Lock className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
