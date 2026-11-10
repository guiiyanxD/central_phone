'use client';

import React, { useState } from 'react';
import { AlertCircle, Trash2, ArrowUpRight } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

interface ModalEliminarGastoProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: any | null;
  onGastoEliminado: () => Promise<void>;
}

export function ModalEliminarGasto({
  isOpen,
  onClose,
  gasto,
  onGastoEliminado,
}: ModalEliminarGastoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!gasto) return null;

  const montoBs = Number(gasto.montoBs) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.caja.eliminarGasto(gasto.id);
      await onGastoEliminado();
      onClose();
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al eliminar el egreso menor.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <Trash2 className="h-5 w-5" />
          <span>Eliminar Egreso Menor #{gasto.id}</span>
        </div>
      }
      description="Esta acción eliminará permanentemente el egreso menor registrado."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs text-slate-700">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Concepto:</span>
            <strong className="text-slate-900 font-sans">{gasto.concepto}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Categoría:</span>
            <span className="text-slate-700 font-sans">{gasto.categoria?.nombre || 'General'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span className="text-slate-600 font-sans font-bold">Monto del Egreso:</span>
            <span className="font-bold text-rose-700 text-xs font-mono">
              -Bs {montoBs.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-900 flex items-start gap-2">
          <ArrowUpRight className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Al eliminar este egreso, el monto de <strong>Bs {montoBs.toFixed(2)}</strong> se reintegrará automáticamente al saldo disponible de la gaveta de efectivo.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="destructive"
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Eliminando...' : 'Eliminar Egreso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
