'use client';

import React from 'react';
import {
  PackageCheck,
  Building2,
  Truck,
  FileText,
  Smartphone,
  Headphones,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModalConfirmarGuardadoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  proveedorNombre: string;
  sucursalNombre: string;
  numeroComprobante?: string;
  observaciones?: string;
  totalTelefonos: number;
  totalAccesorios: number;
  totalCostoBs: number;
  totalCostoUsd: number;
}

export function ModalConfirmarGuardado({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  proveedorNombre,
  sucursalNombre,
  numeroComprobante,
  observaciones,
  totalTelefonos,
  totalAccesorios,
  totalCostoBs,
  totalCostoUsd,
}: ModalConfirmarGuardadoProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-slate-900" />
          <span>Confirmar Recepción de Mercadería</span>
        </div>
      }
      description="Verifica el resumen de la nota de ingreso antes de impactar el inventario físico."
      className="max-w-xl p-6"
    >
      <div className="space-y-5 pt-3">
        {/* Alerta de impacto en existencias */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-slate-800 flex-shrink-0 mt-0.5" />
          <p>
            Al confirmar, los equipos serializados y lotes ingresarán inmediatamente como existencias disponibles en la sucursal indicada bajo trazabilidad ACID.
          </p>
        </div>

        {/* Datos Principales de Origen */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-slate-400" />
              Proveedor Mayorista:
            </span>
            <strong className="text-slate-900 font-semibold">{proveedorNombre || 'No seleccionado'}</strong>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Sucursal Destino:
            </span>
            <strong className="text-slate-900 font-semibold">{sucursalNombre || 'No seleccionada'}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Factura / Remisión:
            </span>
            <span className="font-mono font-medium text-slate-800">
              {numeroComprobante?.trim() ? numeroComprobante.trim() : <span className="text-slate-400 italic">Sin comprobante</span>}
            </span>
          </div>

          {observaciones?.trim() && (
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">Obs: </span>
              {observaciones.trim()}
            </div>
          )}
        </div>

        {/* Desglose de Unidades e Inversión */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
              <Smartphone className="h-3 w-3 text-slate-400" /> Teléfonos
            </span>
            <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {totalTelefonos} <span className="text-[10px] font-normal text-slate-500">u.</span>
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
              <Headphones className="h-3 w-3 text-slate-400" /> Accesorios
            </span>
            <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {totalAccesorios} <span className="text-[10px] font-normal text-slate-500">u.</span>
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-900 text-center text-white">
            <span className="text-[11px] text-slate-300 font-medium">
              Inversión Total
            </span>
            <p className="text-base sm:text-lg font-bold font-mono mt-0.5 whitespace-nowrap">
              Bs {totalCostoBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {totalCostoUsd > 0 && (
              <p className="text-[10px] font-mono text-slate-400">
                $ {totalCostoUsd.toFixed(2)} USD
              </p>
            )}
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto text-xs"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Revisar y Corregir
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto text-xs bg-slate-900 hover:bg-slate-800 text-white"
            onClick={onConfirm}
            isLoading={isSubmitting}
            loadingText="Registrando en Inventario..."
          >
            <PackageCheck className="mr-1.5 h-4 w-4" />
            Confirmar y Guardar Recepción
          </Button>
        </div>
      </div>
    </Modal>
  );
}
