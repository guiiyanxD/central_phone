'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ArrowLeft,
  Shield,
  UserCheck,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UsuariosHeaderProps {
  totalUsuarios: number;
  activosCount: number;
  adminsCount: number;
  vendedoresCount: number;
  onNuevoUsuario: () => void;
}

export function UsuariosHeader({
  totalUsuarios,
  activosCount,
  adminsCount,
  vendedoresCount,
  onNuevoUsuario,
}: UsuariosHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Barra de navegación superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/administracion"
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Centro de Administración
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Gestión de Personal & Usuarios
                </h1>
                <Badge variant="default" className="text-[10px] tracking-wide uppercase font-semibold">
                  Control RBAC
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Alta de colaboradores, reseteo de claves, asignación de sedes y control de acceso seguro.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Button
            onClick={onNuevoUsuario}
            className="w-full sm:w-auto shadow-sm"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Colaborador
          </Button>
        </div>
      </div>

      {/* Tarjetas rápidas de indicadores de personal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Registrados</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalUsuarios}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Cuentas Activas</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{activosCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Administradores</p>
            <p className="text-xl font-bold text-indigo-700 mt-0.5">{adminsCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Vendedores POS</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{vendedoresCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
