'use client';

import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ModalVarianteDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: any;
  variante: any;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function ModalVarianteDelete({
  isOpen,
  onClose,
  modelo,
  variante,
  isLoading,
  error,
  onConfirm,
}: ModalVarianteDeleteProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <Trash2 className="h-4 w-4" />
          <span>Eliminar Variante</span>
        </div>
      }
      description="Esta acción eliminará de forma permanente esta combinación del catálogo oficial."
    >
      <div className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-slate-700">
          ¿Confirmas que deseas eliminar la variante{' '}
          <strong className="text-slate-900 font-semibold">
            &quot;{variante?.color} (
            {variante?.capacidadGb > 0
              ? `${variante?.capacidadGb}GB`
              : '0 GB'}
            )&quot;
          </strong>{' '}
          del modelo{' '}
          <strong className="text-slate-900 font-semibold">
            {modelo?.nombreModelo || modelo?.nombre}
          </strong>
          ?
        </p>

        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[11px] leading-relaxed">
          <strong>Protección de Integridad:</strong> Si la variante tiene equipos asociados en
          inventario físico o historial de ventas, o si es la única variante del modelo, la
          eliminación será bloqueada de inmediato por la base de datos.
        </div>

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
