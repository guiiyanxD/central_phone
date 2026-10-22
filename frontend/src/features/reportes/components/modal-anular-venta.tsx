'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { TransaccionVentaReporte } from '../types';

interface ModalAnularVentaProps {
  isOpen: boolean;
  onClose: () => void;
  ventaParaAnular: TransaccionVentaReporte | null;
  motivoAnulacion: string;
  setMotivoAnulacion: (val: string) => void;
  isAnulando: boolean;
  errorAnulacion: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalAnularVenta({
  isOpen,
  onClose,
  ventaParaAnular,
  motivoAnulacion,
  setMotivoAnulacion,
  isAnulando,
  errorAnulacion,
  onSubmit,
}: ModalAnularVentaProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Anular Venta #{ventaParaAnular?.comprobanteReferencia}</span>
        </div>
      }
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs text-slate-700">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Info className="h-4 w-4 text-rose-600" />
            Rollback Atómico de Inventario y Caja
          </p>
          <p className="text-[11px] text-rose-800">
            Esta acción revertirá automáticamente el estado de todos los teléfonos a <strong>DISPONIBLE</strong>, repondrá las cantidades vendidas al stock de lotes de accesorios y excluirá este monto del arqueo teórico de caja.
          </p>
        </div>

        {ventaParaAnular && (
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1 font-mono text-[11px]">
            <div><strong>Ticket:</strong> {ventaParaAnular.comprobanteReferencia}</div>
            <div><strong>Vendedor:</strong> {ventaParaAnular.vendedor}</div>
            <div><strong>Total Venta:</strong> Bs {Number(ventaParaAnular.totalVentaBs || 0).toFixed(2)}</div>
            <div><strong>Ítems:</strong> {ventaParaAnular.itemsCount} productos</div>
          </div>
        )}

        {errorAnulacion && (
          <div className="p-2.5 bg-rose-100 border border-rose-300 rounded text-rose-800 text-[11px] font-medium">
            {errorAnulacion}
          </div>
        )}

        <div>
          <label className="font-semibold text-slate-800 block mb-1">
            Motivo Obligatorio de Anulación (Mínimo 10 caracteres): *
          </label>
          <textarea
            className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 h-24"
            placeholder="Ej: Cobro duplicado por error en terminal QR, cliente solicitó cancelación inmediata..."
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            required
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {motivoAnulacion.length}/10 caracteres mínimos requeridos para auditoría.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isAnulando}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="destructive"
            className="flex-1"
            isLoading={isAnulando}
            disabled={motivoAnulacion.trim().length < 10}
          >
            Confirmar Anulación
          </Button>
        </div>
      </form>
    </Modal>
  );
}
