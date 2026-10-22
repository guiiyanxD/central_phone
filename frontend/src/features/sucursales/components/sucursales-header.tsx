'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  RefreshCw,
  Plus,
  ArrowLeft,
  Users,
  Smartphone,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface SucursalesHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  metricas: {
    activas: number;
    inactivas: number;
    totalPersonal: number;
    totalDispositivos: number;
    totalLotes: number;
  };
}

export function SucursalesHeader({
  isLoading,
  onRefresh,
  onOpenCreate,
  metricas,
}: SucursalesHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            href="/administracion"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a Centro de Administración</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Gestión de Sucursales
                </h1>
                <Badge variant="default" className="text-[10px] tracking-wide uppercase">
                  Exclusivo Admin
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Administración de tiendas físicas, control de sedes operativas, inventario local y personal asignado.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            className="text-xs"
            title="Refrescar lista"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onOpenCreate}
            className="text-xs shadow-sm font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva Sucursal
          </Button>
        </div>
      </div>

      {/* KPIs y Métricas de Infraestructura */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Sucursales Activas</p>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.activas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metricas.inactivas > 0 ? `${metricas.inactivas} inactiva(s)` : '100% operativas'}
          </p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Personal Asignado</p>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.totalPersonal}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Vendedores y admins</p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Equipos Físicos</p>
            <Smartphone className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.totalDispositivos}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">En inventario local</p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Lotes Accesorios</p>
            <Boxes className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.totalLotes}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Calidades y variantes</p>
        </Card>
      </div>
    </div>
  );
}
