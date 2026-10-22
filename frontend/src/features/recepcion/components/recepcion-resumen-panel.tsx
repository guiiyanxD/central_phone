'use client';

import React from 'react';
import { PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecepcionResumenPanelProps {
  totalUnidadesTelefonos: number;
  totalUnidadesAccesorios: number;
  totalCostoNotaBs: number;
  isSubmitting: boolean;
}

export function RecepcionResumenPanel({
  totalUnidadesTelefonos,
  totalUnidadesAccesorios,
  totalCostoNotaBs,
  isSubmitting,
}: RecepcionResumenPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="grid grid-cols-3 gap-6 text-center sm:text-left w-full md:w-auto">
        <div>
          <p className="text-xs text-slate-500 font-medium">Teléfonos</p>
          <p className="text-xl font-bold text-slate-900">{totalUnidadesTelefonos} u.</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Accesorios</p>
          <p className="text-xl font-bold text-slate-900">{totalUnidadesAccesorios} u.</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Costo Total Compra</p>
          <p className="text-xl font-bold text-slate-900">
            Bs {totalCostoNotaBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full md:w-auto min-w-[260px]"
        isLoading={isSubmitting}
        loadingText="Registrando Mercadería..."
      >
        <PackagePlus className="mr-2 h-4 w-4" />
        Registrar Nota de Ingreso
      </Button>
    </div>
  );
}
