'use client';

import React from 'react';
import { PackagePlus, Smartphone, Headphones, CircleDollarSign, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecepcionResumenPanelProps {
  totalUnidadesTelefonos: number;
  totalUnidadesAccesorios: number;
  totalCostoNotaBs: number;
  isSubmitting: boolean;
  isEditing?: boolean;
}

export function RecepcionResumenPanel({
  totalUnidadesTelefonos,
  totalUnidadesAccesorios,
  totalCostoNotaBs,
  isSubmitting,
  isEditing = false,
}: RecepcionResumenPanelProps) {
  return (
    <div className="sticky bottom-4 z-30 backdrop-blur-md bg-white/95 border border-slate-200/90 shadow-[0_12px_35px_-5px_rgba(0,0,0,0.12)] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center sm:text-left w-full md:w-auto">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 hidden sm:flex">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Teléfonos</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              {totalUnidadesTelefonos} <span className="text-xs font-normal text-slate-500">u.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 hidden sm:flex">
            <Headphones className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Accesorios</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              {totalUnidadesAccesorios} <span className="text-xs font-normal text-slate-500">u.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 hidden sm:flex">
            <CircleDollarSign className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Inversión Total</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              Bs {totalCostoNotaBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full md:w-auto min-w-[240px] text-xs sm:text-sm font-semibold shadow-subtle"
        isLoading={isSubmitting}
        loadingText={isEditing ? 'Actualizando Mercadería...' : 'Registrando Mercadería...'}
      >
        {isEditing ? (
          <>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios de la Nota
          </>
        ) : (
          <>
            <PackagePlus className="mr-2 h-4 w-4" />
            Registrar Nota de Ingreso
          </>
        )}
      </Button>
    </div>
  );
}
