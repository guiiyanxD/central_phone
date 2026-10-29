'use client';

import React from 'react';
import { Trash2, AlertTriangle, AlertOctagon, Layers, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModeloItem } from '../types';

interface ModalEliminarModeloProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: ModeloItem | null;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => Promise<void>;
}

export function ModalEliminarModelo({
  isOpen,
  onClose,
  modelo,
  isLoading,
  error,
  onConfirm,
}: ModalEliminarModeloProps) {
  if (!modelo) return null;

  const totalVariantes = modelo.variantes?.length || 0;
  const totalDispositivos =
    modelo.variantes?.reduce(
      (sum, v) => sum + (v._count?.dispositivos || 0),
      0,
    ) || 0;

  const hasDispositivosAsociados = totalDispositivos > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <Trash2 className="h-5 w-5" />
          <span>Eliminar Modelo: {modelo.nombreModelo}</span>
        </div>
      }
      description="Verifica las dependencias de inventario antes de proceder con la eliminación física."
    >
      <div className="space-y-4 pt-1">
        {error && (
          <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Resumen del Modelo */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Modelo Comercial:</span>
            <span className="font-bold text-slate-900 text-sm">{modelo.nombreModelo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Marca y Tipo:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700">{modelo.marca}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {modelo.tipo || 'IPHONE'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Variantes vinculadas:
            </span>
            <Badge variant="mono" className="bg-white border-slate-200">
              {totalVariantes} {totalVariantes === 1 ? 'variante' : 'variantes'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Equipos asociados:</span>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono font-bold ${
                hasDispositivosAsociados
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {totalDispositivos} unidades registradas
            </Badge>
          </div>
        </div>

        {/* Mensaje condicional de integridad referencial */}
        {hasDispositivosAsociados ? (
          <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/80 text-rose-900 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>Eliminación física bloqueada por integridad</span>
            </div>
            <p className="leading-relaxed text-rose-700">
              Este modelo cuenta con <strong>{totalDispositivos} equipo(s) físico(s)</strong> registrados en existencias de sucursal o historial de ventas. Por reglas de integridad financiera y trazabilidad serializada, ningún modelo con existencias puede eliminarse.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Confirmación de borrado definitivo</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              El modelo no tiene equipos asociados en inventario. Al confirmar, el modelo y sus <strong>{totalVariantes} variante(s)</strong> serán eliminados de forma permanente del catálogo oficial. Esta acción no se puede deshacer.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            isLoading={isLoading}
            loadingText="Eliminando..."
            disabled={isLoading || hasDispositivosAsociados}
            onClick={onConfirm}
            title={
              hasDispositivosAsociados
                ? 'No se puede eliminar porque cuenta con equipos asociados'
                : 'Eliminar modelo definitivamente'
            }
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Eliminar Modelo Definitivamente
          </Button>
        </div>
      </div>
    </Modal>
  );
}
