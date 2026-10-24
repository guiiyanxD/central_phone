'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  ArrowLeft,
  Building2,
  CheckCircle2,
  PackageCheck,
  PauseCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProveedoresHeaderProps {
  totalProveedores: number;
  activosCount: number;
  inactivosCount: number;
  conRecepcionesCount: number;
  onNuevoProveedor: () => void;
}

export function ProveedoresHeader({
  totalProveedores,
  activosCount,
  inactivosCount,
  conRecepcionesCount,
  onNuevoProveedor,
}: ProveedoresHeaderProps) {
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
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Proveedores Mayoristas
                </h1>
                <Badge variant="default" className="text-[10px] tracking-wide uppercase font-semibold">
                  Gestión Comercial
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Almacén central de proveedores mayoristas para la recepción de mercadería y control de compras.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Button
            onClick={onNuevoProveedor}
            className="w-full sm:w-auto shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Tarjetas rápidas de indicadores de proveedores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Registrados</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalProveedores}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Truck className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Activos en Recepción</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{activosCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Pausados / Inactivos</p>
            <p className="text-xl font-bold text-slate-600 mt-0.5">{inactivosCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <PauseCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Con Compras Previas</p>
            <p className="text-xl font-bold text-indigo-700 mt-0.5">{conRecepcionesCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PackageCheck className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
