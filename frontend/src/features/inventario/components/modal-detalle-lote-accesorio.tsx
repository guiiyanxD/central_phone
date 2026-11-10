'use client';

import React from 'react';
import {
  PackageSearch,
  Building2,
  Truck,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Receipt,
  Boxes,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoteAccesorioItem } from '../types';

interface ModalDetalleLoteAccesorioProps {
  isOpen: boolean;
  onClose: () => void;
  lote: LoteAccesorioItem | null;
  isAdmin: boolean;
  tipoCambio?: number;
}

export function ModalDetalleLoteAccesorio({
  isOpen,
  onClose,
  lote,
  isAdmin,
  tipoCambio = 6.96,
}: ModalDetalleLoteAccesorioProps) {
  if (!lote) return null;

  const stockActual = Number(lote.stockActual || 0);
  const cantidadInicial = Number(lote.cantidadInicial || 0);
  const unidadesVendidas = Math.max(0, cantidadInicial - stockActual);
  const porcentajeRotacion =
    cantidadInicial > 0 ? Math.min(100, Math.round((unidadesVendidas / cantidadInicial) * 100)) : 0;

  const tc = tipoCambio > 0 ? tipoCambio : 6.96;
  const precioBs = Number(lote.precioVentaBs || 0);
  const costoBs = Number(lote.costoUnitarioBs || 0);
  const precioUsd = precioBs / tc;
  const costoUsd = costoBs / tc;
  const margenBs = precioBs - costoBs;
  const margenUsd = precioUsd - costoUsd;

  const fechaIngresoFormatted = lote.fechaIngreso || lote.notaIngreso?.fechaIngreso
    ? new Date(lote.fechaIngreso || lote.notaIngreso!.fechaIngreso!).toLocaleString('es-BO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'No registrada';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <PackageSearch className="h-5 w-5 text-slate-800" />
          <span>Detalle Completo de Lote de Accesorio</span>
        </div>
      }
      description={`Lote #${lote.id} • ${lote.accesorio?.nombre || 'Accesorio'}`}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-4 pt-1 text-xs text-slate-700">
        {/* Cabecera Principal del Accesorio */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  {lote.accesorio?.nombre || 'Accesorio General'}
                </h3>
                {lote.accesorio?.categoria && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {lote.accesorio.categoria.nombre}
                  </Badge>
                )}
              </div>
              <p className="text-slate-600 font-medium text-xs mt-0.5">
                Lote Diferenciador: <span className="font-bold text-slate-900">{lote.nombreDiferenciador}</span>
              </p>
            </div>

            <Badge
              variant={
                stockActual > 5 ? 'success' : stockActual > 0 ? 'warning' : 'destructive'
              }
              className="text-xs px-2.5 py-1 w-fit"
            >
              {stockActual > 0 ? `${stockActual} unidades disponibles` : 'Agotado (0 unidades)'}
            </Badge>
          </div>

          {lote.accesorio?.descripcion && (
            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
              {lote.accesorio.descripcion}
            </p>
          )}
        </div>

        {/* Malla de Bloques de Información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bloque 1: Control de Stock e Inventario */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1 border-b border-slate-100">
              <Boxes className="h-4 w-4 text-slate-600" />
              <span>Inventario y Rotación</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Stock Actual en Tienda:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">{stockActual} u.</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cantidad Inicial Ingresada:</span>
                <span className="font-mono text-slate-700">{cantidadInicial} u.</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Unidades Vendidas / Bajas:</span>
                <span className="font-mono text-emerald-700 font-semibold">{unidadesVendidas} u.</span>
              </div>
            </div>

            {/* Barra de Progreso de Salida de Stock */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Porcentaje de Rotación</span>
                <span>{porcentajeRotacion}% vendido</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${porcentajeRotacion}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Desglose Financiero Doble Moneda */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Precios & Valor Financiero</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">TC: Bs {tc.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              {/* Valores en Bolivianos (Bs.) */}
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Precio Sugerido (Bs.):</span>
                  <span className="font-bold font-mono text-slate-900">Bs {precioBs.toFixed(2)}</span>
                </div>
                {isAdmin && lote.costoUnitarioBs !== undefined && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Costo Adquisición (Bs.):</span>
                    <span className="font-mono font-medium">Bs {costoBs.toFixed(2)}</span>
                  </div>
                )}
                {isAdmin && lote.costoUnitarioBs !== undefined && (
                  <div className="flex justify-between text-[10px] text-emerald-700 font-medium pt-0.5 border-t border-slate-200">
                    <span>Margen Bruto (Bs.):</span>
                    <span className="font-mono font-bold">+Bs {margenBs.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Valores en Dólares ($) */}
              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-900 font-medium">Precio Sugerido ($ USD):</span>
                  <span className="font-bold font-mono text-emerald-950">$ {precioUsd.toFixed(2)}</span>
                </div>
                {isAdmin && lote.costoUnitarioBs !== undefined && (
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Costo Adquisición ($ USD):</span>
                    <span className="font-mono font-medium">$ {costoUsd.toFixed(2)}</span>
                  </div>
                )}
                {isAdmin && lote.costoUnitarioBs !== undefined && (
                  <div className="flex justify-between text-[10px] text-emerald-800 font-medium pt-0.5 border-t border-emerald-200">
                    <span>Margen Bruto ($ USD):</span>
                    <span className="font-mono font-bold">+$ {margenUsd.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloque 3: Ubicación Física en Tienda */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1 border-b border-slate-100">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Ubicación y Sucursal Física</span>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-xs">
                {lote.sucursal?.nombre || 'Sucursal Principal'}
              </p>
              <p className="text-slate-500 text-[11px]">
                {lote.sucursal?.ciudad || 'Santa Cruz, Bolivia'}
              </p>
              <span className="inline-block mt-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-medium">
                Inventario físico asignado
              </span>
            </div>
          </div>

          {/* Bloque 4: Trazabilidad de Recepción y Proveedor */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1 border-b border-slate-100">
              <Truck className="h-4 w-4 text-purple-600" />
              <span>Procedencia y Nota de Ingreso</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Proveedor:</span>
                <span className="font-bold text-slate-800">
                  {lote.notaIngreso?.proveedor?.nombre || 'Mayorista Registrado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nro. Comprobante:</span>
                <span className="font-mono text-slate-700 font-medium">
                  {lote.notaIngreso?.numeroComprobante || 'S/N'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de Ingreso:</span>
                <span className="text-slate-700">{fechaIngresoFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Cierre */}
        <div className="pt-2 flex justify-end">
          <Button variant="outline" onClick={onClose} className="text-xs px-4">
            Cerrar Detalle
          </Button>
        </div>
      </div>
    </Modal>
  );
}
