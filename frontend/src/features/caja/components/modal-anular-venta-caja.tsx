'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatFolioTicket } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';

interface ModalAnularVentaCajaProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any | null;
  onAnulacionExitosa: () => Promise<void>;
}

export function ModalAnularVentaCaja({
  isOpen,
  onClose,
  venta,
  onAnulacionExitosa,
}: ModalAnularVentaCajaProps) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!venta) return null;

  const montoPermuta = Number(venta.montoPermutaBs || 0);
  const saldoCobrado = Math.max(0, Number(venta.totalVentaBs || 0) - montoPermuta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 10) {
      setError('El motivo de anulación debe contener al menos 10 caracteres explicativos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.ventas.anular(venta.id, motivo.trim());
      setMotivo('');
      await onAnulacionExitosa();
      onClose();
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al procesar la anulación de la venta.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setMotivo('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Anular Venta #{formatFolioTicket(venta.id)}</span>
        </div>
      }
      description="Rollback atómico de mercadería en inventario y ajuste de métricas de caja."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs text-slate-700">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-xs text-rose-800">
            <Info className="h-4 w-4 text-rose-600 shrink-0" />
            Efecto Inmediato en Stock y Arqueo
          </p>
          <p className="text-[11px] text-rose-800 leading-relaxed">
            Esta acción revertirá automáticamente los teléfonos a estado <strong>DISPONIBLE</strong>, repondrá las cantidades al stock de accesorios y deducirá este cobro del arqueo de la caja abierta.
          </p>
        </div>

        {/* Resumen de la Venta */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Ticket:</span>
            <strong className="text-slate-900">#{formatFolioTicket(venta.id)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Cliente:</span>
            <span className="text-slate-900 font-semibold truncate max-w-[220px]">
              {venta.cliente?.nombreCompleto || 'Cliente Mostrador'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Método de Pago:</span>
            <span className="text-slate-900">{venta.metodoPago?.nombre || 'Efectivo'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span className="text-slate-600 font-sans font-bold">Total Cobrado:</span>
            <span className="font-bold text-slate-900 text-xs">
              Bs {saldoCobrado.toFixed(2)}
            </span>
          </div>
          {montoPermuta > 0 && (
            <div className="flex justify-between text-[10px] text-emerald-700">
              <span className="font-sans">Permuta retoma:</span>
              <span>-Bs {montoPermuta.toFixed(2)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="motivo-anulacion-caja" className="font-semibold text-slate-800 block mb-1">
            Motivo Obligatorio de Anulación (Mínimo 10 caracteres): *
          </label>
          <textarea
            id="motivo-anulacion-caja"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 h-20"
            placeholder="Ej: Cobro duplicado por error en terminal QR, cliente solicitó cancelación inmediata..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {motivo.length}/10 caracteres mínimos requeridos para auditoría.
          </p>
        </div>

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
            disabled={isSubmitting || motivo.trim().length < 10}
          >
            {isSubmitting ? 'Anulando...' : 'Confirmar Anulación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
