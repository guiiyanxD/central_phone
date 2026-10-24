'use client';

import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AccesorioItem } from '../types';

interface DialogDeleteAccesorioProps {
  isOpen: boolean;
  onClose: () => void;
  accesorio: AccesorioItem | null;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function DialogDeleteAccesorio({
  isOpen,
  onClose,
  accesorio,
  isLoading,
  error,
  onConfirm,
}: DialogDeleteAccesorioProps) {
  const lotesCount = accesorio?._count?.lotes ?? accesorio?.lotes?.length ?? 0;
  const isDeletable = lotesCount === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <Trash2 className="h-4 w-4" />
          <span>Eliminar Accesorio Base</span>
        </div>
      }
      description="Esta acción eliminará de forma permanente el accesorio del catálogo oficial."
    >
      <div className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-slate-700">
          ¿Confirmas que deseas eliminar el accesorio base{' '}
          <strong className="text-slate-900 font-semibold">
            &quot;{accesorio?.nombre}&quot;
          </strong>{' '}
          ({accesorio?.categoria?.nombre})?
        </p>

        {!isDeletable ? (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-[11px] leading-relaxed">
            <strong>Operación no permitida:</strong> Este accesorio cuenta actualmente con{' '}
            <strong>{lotesCount} lote(s)</strong> de inventario vinculados. Para mantener la
            integridad del inventario y el historial contable, no se puede eliminar.
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-[11px] leading-relaxed">
            <strong>Verificación de integridad aprobada:</strong> Este producto no posee lotes
            asociados ({lotesCount} lotes). El registro puede ser eliminado de forma segura.
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 text-xs font-semibold"
            disabled={!isDeletable}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            Confirmar Eliminación
          </Button>
        </div>
      </div>
    </Modal>
  );
}
