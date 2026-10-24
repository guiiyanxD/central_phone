'use client';

import React from 'react';
import { PowerOff, Power } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ProveedorItem } from '../types';

interface DialogProveedorStatusProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor: ProveedorItem | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DialogProveedorStatus({
  isOpen,
  onClose,
  proveedor,
  onConfirm,
  isLoading,
}: DialogProveedorStatusProps) {
  if (!proveedor) return null;

  const isDeactivating = proveedor.activo;
  const displayName = proveedor.empresa
    ? `${proveedor.empresa} (${proveedor.nombre} ${proveedor.apellido || ''})`
    : `${proveedor.nombre} ${proveedor.apellido || ''}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isDeactivating ? (
            <PowerOff className="h-5 w-5 text-rose-600" />
          ) : (
            <Power className="h-5 w-5 text-emerald-600" />
          )}
          <span>
            {isDeactivating ? '¿Pausar / Desactivar Proveedor?' : '¿Reactivar Proveedor?'}
          </span>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
            isDeactivating
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}
        >
          <p className="font-semibold text-sm">{displayName}</p>
          {isDeactivating ? (
            <ul className="list-disc pl-4 space-y-1">
              <li>El proveedor <strong>quedará oculto</strong> en el selector de recepción de mercadería.</li>
              <li>No se podrán asociar nuevas notas de ingreso mientras permanezca pausado.</li>
              <li>
                <strong>Histórico blindado:</strong> Todas las notas de ingreso y el stock físico previamente recibido se mantendrán 100% inalterados.
              </li>
            </ul>
          ) : (
            <p>
              El proveedor volverá a estar disponible de inmediato en la pantalla de recepción para ingresar nuevos dispositivos o lotes de accesorios.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={isDeactivating ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className={!isDeactivating ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
          >
            {isLoading
              ? 'Procesando...'
              : isDeactivating
              ? 'Sí, Pausar Proveedor'
              : 'Sí, Reactivar Proveedor'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
