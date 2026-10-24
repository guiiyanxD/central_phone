'use client';

import React from 'react';
import {
  Truck,
  Building2,
  Phone,
  Calendar,
  Package,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProveedorItem } from '../types';

interface ModalProveedorDetalleProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor: ProveedorItem | null;
}

export function ModalProveedorDetalle({
  isOpen,
  onClose,
  proveedor,
}: ModalProveedorDetalleProps) {
  if (!proveedor) return null;

  const notas = proveedor.notasIngreso || [];
  const fechaRegistro = new Date(proveedor.creadoEn).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-slate-900" />
          <span>Ficha del Proveedor Mayorista</span>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        {/* Cabecera del Proveedor */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {proveedor.empresa || `${proveedor.nombre} ${proveedor.apellido || ''}`}
              </h4>
              {proveedor.empresa && (
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Contacto: {proveedor.nombre} {proveedor.apellido || ''}
                </p>
              )}
            </div>
            {proveedor.activo ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Activo</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-slate-500">
                <XCircle className="h-3 w-3" />
                <span>Pausado</span>
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
            {proveedor.telefono && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{proveedor.telefono}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Registrado el {fechaRegistro}</span>
            </div>
            {proveedor.contactoReferencia && (
              <div className="sm:col-span-2 text-[11px] text-slate-500 italic">
                Ref: {proveedor.contactoReferencia}
              </div>
            )}
          </div>
        </div>

        {/* Historial Reciente de Compras / Notas de Ingreso */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-slate-500" />
              <span>Últimas Recepciones de Mercadería ({notas.length})</span>
            </h5>
          </div>

          {notas.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              Aún no se han registrado notas de ingreso de mercadería para este proveedor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
              {notas.map((n) => {
                const fechaNota = new Date(n.fechaIngreso).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={n.id}
                    className="p-3 bg-white hover:bg-slate-50 text-xs flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {n.numeroComprobante ? `Comprobante N° ${n.numeroComprobante}` : `Nota de Ingreso #${n.id}`}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Sede: {n.sucursal?.nombre || 'Central'}
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {fechaNota}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </Modal>
  );
}
