'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Loader2,
  FileX2,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ModalAnularRecepcionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  isSubmitting: boolean;
  notaId: number;
  numeroComprobante?: string | null;
  proveedorNombre?: string;
  totalDispositivos?: number;
  totalAccesorios?: number;
}

export function ModalAnularRecepcion({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  notaId,
  numeroComprobante,
  proveedorNombre,
  totalDispositivos = 0,
  totalAccesorios = 0,
}: ModalAnularRecepcionProps) {
  const [motivo, setMotivo] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim() || motivo.trim().length < 5) {
      setErrorLocal('El motivo de anulación debe tener al menos 5 caracteres.');
      return;
    }
    setErrorLocal(null);
    await onConfirm(motivo.trim());
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMotivo('');
      setErrorLocal(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-rose-600 font-semibold">
          <AlertOctagon className="h-5 w-5" />
          <span>Anular Nota de Recepción #{notaId}</span>
        </div>
      }
      description="Esta acción revertirá las existencias y marcará la nota como ANULADA de forma permanente."
      className="max-w-lg p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Advertencia Crítica */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-800">
              ¿Está seguro de anular esta recepción de mercadería?
            </p>
            <p className="text-rose-700 leading-relaxed">
              Los equipos serializados ({totalDispositivos}) y lotes de accesorios ({totalAccesorios}) serán dados de baja del inventario activo y liberados. Si algún producto ya fue vendido en el POS, la anulación será rechazada por el sistema.
            </p>
          </div>
        </div>

        {/* Resumen de la nota */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span className="font-medium text-slate-500">Proveedor:</span>
            <span className="font-semibold text-slate-900">{proveedorNombre || 'Desconocido'}</span>
          </div>
          {numeroComprobante && (
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Comprobante:</span>
              <span className="font-mono text-slate-800">{numeroComprobante}</span>
            </div>
          )}
        </div>

        {/* Motivo de Anulación */}
        <div className="space-y-1.5">
          <label htmlFor="motivo-anulacion" className="block text-xs font-semibold text-slate-700">
            Motivo de anulación <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="motivo-anulacion"
            rows={3}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (errorLocal) setErrorLocal(null);
            }}
            placeholder="Describa detalladamente el motivo de la anulación (ej: Error en carga de seriales, mercadería devuelta al mayorista, duplicado)..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-slate-900 placeholder:text-slate-400"
            disabled={isSubmitting}
            required
            minLength={5}
          />
          {errorLocal && <p className="text-[11px] font-medium text-rose-600">{errorLocal}</p>}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-xs text-slate-600"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={isSubmitting || motivo.trim().length < 5}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Anulando...</span>
              </>
            ) : (
              <>
                <FileX2 className="h-3.5 w-3.5" />
                <span>Confirmar Anulación</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
