'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoriasGastoCrud } from '@/features/administracion/components/categorias-gasto-crud';

export default function CategoriasGastoAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!authLoading && !isAdmin) {
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
            La gestión del catálogo maestro de categorías de egresos está reservada exclusivamente para personal con nivel Administrador.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-3">
          <Link href="/pos">
            <Button variant="default">Ir a Punto de Venta</Button>
          </Link>
          <Link href="/caja">
            <Button variant="outline">Ir a Caja Diaria</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Encabezado y Navegación */}
      <div className="border-b border-slate-200 pb-5">
        <Link
          href="/administracion"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a Centro de Administración</span>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Categorías de Egresos de Caja
          </h1>
          <Badge variant="default">Gestión Maestra</Badge>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Administración centralizada de categorías para la imputación contable de gastos menores en cajas de sucursales.
        </p>
      </div>

      {/* CRUD Individualizado */}
      <CategoriasGastoCrud />
    </div>
  );
}
