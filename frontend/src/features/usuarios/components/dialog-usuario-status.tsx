'use client';

import React from 'react';
import { AlertTriangle, PowerOff, Power, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { UsuarioItem } from '../types';

interface DialogUsuarioStatusProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: UsuarioItem | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DialogUsuarioStatus({
  isOpen,
  onClose,
  usuario,
  onConfirm,
  isLoading,
}: DialogUsuarioStatusProps) {
  if (!usuario) return null;

  const isDeactivating = usuario.activo;

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
            {isDeactivating ? '¿Desactivar Colaborador?' : '¿Reactivar Colaborador?'}
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
          <p className="font-semibold text-sm">
            {usuario.nombre} {usuario.apellido || ''} ({usuario.email})
          </p>
          {isDeactivating ? (
            <ul className="list-disc pl-4 space-y-1">
              <li>El usuario <strong>no podrá iniciar sesión</strong> en el sistema.</li>
              <li>No podrá operar el Punto de Venta (POS) ni abrir nuevas cajas diarias.</li>
              <li>
                <strong>Trazabilidad protegida:</strong> Todo su historial previo de ventas, arqueos y recepciones permanece 100% intacto.
              </li>
            </ul>
          ) : (
            <p>
              El colaborador recuperará el acceso inmediato al sistema con su usuario y contraseña vigentes.
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
              ? 'Sí, Desactivar Cuenta'
              : 'Sí, Reactivar Cuenta'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
