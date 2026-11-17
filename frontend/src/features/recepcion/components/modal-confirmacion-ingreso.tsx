'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, PackagePlus, ArrowRight, History, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { printPermutaReceipt } from '../utils/receipt-printer';

interface ModalConfirmacionIngresoProps {
  notaCreada: any;
  onReset: () => void;
  onGoToHistorial?: () => void;
  isAdmin?: boolean;
}

export function ModalConfirmacionIngreso({
  notaCreada,
  onReset,
  onGoToHistorial,
  isAdmin = false,
}: ModalConfirmacionIngresoProps) {
  if (!notaCreada) return null;

  // Calcular el costo total en USD si existen dispositivos o si viene calculado
  const totalCostoUsd =
    notaCreada.totalCostoUsd !== undefined && notaCreada.totalCostoUsd !== null
      ? Number(notaCreada.totalCostoUsd)
      : Array.isArray(notaCreada.dispositivos)
        ? notaCreada.dispositivos.reduce(
            (sum: number, d: any) => sum + Number(d.costoUsd || 0),
            0
          )
        : 0;

  return (
    <div className="max-w-2xl mx-auto py-12 animate-in fade-in duration-300">
      <Card className="border-slate-200 bg-white shadow-card p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          {notaCreada.tipoIngreso === 'PERMUTA' ? (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 font-bold px-3 py-1">
              Permuta Minorista #ING-{notaCreada.id}
            </Badge>
          ) : (
            <Badge variant="success">Nota de Ingreso #{notaCreada.id}</Badge>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {notaCreada.tipoIngreso === 'PERMUTA'
              ? 'Permuta Recibida e Inventariada'
              : 'Mercadería Recibida e Inventariada'}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {notaCreada.tipoIngreso === 'PERMUTA'
              ? 'Los equipos en permuta han sido ingresados con éxito al inventario de la tienda.'
              : 'La transacción se registró con éxito en la base de datos con trazabilidad total.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">
              {notaCreada.tipoIngreso === 'PERMUTA' ? 'Cliente / Minorista:' : 'Proveedor:'}
            </span>
            <strong className="text-slate-900">
              {notaCreada.proveedor?.nombre}
              {notaCreada.proveedor?.apellido ? ` ${notaCreada.proveedor.apellido}` : ''}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sucursal Destino:</span>
            <strong className="text-slate-900">{notaCreada.sucursal?.nombre}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">
              {notaCreada.tipoIngreso === 'PERMUTA' ? 'iPhones Recibidos:' : 'Teléfonos Registrados:'}
            </span>
            <strong className="text-slate-900">{notaCreada.dispositivos?.length || 0} unidades</strong>
          </div>
          {notaCreada.tipoIngreso !== 'PERMUTA' && (
            <div className="flex justify-between">
              <span className="text-slate-500">Lotes de Accesorios:</span>
              <strong className="text-slate-900">{notaCreada.lotesAccesorio?.length || 0} lotes</strong>
            </div>
          )}
          <div className="border-t border-slate-200 pt-3 space-y-2 font-sans">
            {notaCreada.tipoIngreso !== 'PERMUTA' && (
              <div className="flex justify-between items-center text-sm sm:text-base font-bold">
                <span className="text-slate-900">Costo Total USD:</span>
                <span className="text-slate-900 font-mono">
                  {totalCostoUsd > 0
                    ? `$ ${totalCostoUsd.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                    : '-'}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm sm:text-base font-bold">
              <span className="text-slate-900">
                {notaCreada.tipoIngreso === 'PERMUTA'
                  ? 'Total Liquidado / Pagado (Bs):'
                  : 'Total Costo de Ingreso (Bs):'}
              </span>
              <span className="text-slate-900 font-mono">
                Bs {Number(notaCreada.totalCostoBs || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de Impresión de Comprobante si es Permuta */}
        {notaCreada.tipoIngreso === 'PERMUTA' && (
          <div className="pt-1">
            <Button
              type="button"
              onClick={() => printPermutaReceipt(notaCreada)}
              className="w-full sm:w-auto px-6 h-10 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-2 rounded-xl shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Comprobante de Recepción / Permuta</span>
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className="flex-1 text-xs"
            onClick={onReset}
          >
            <PackagePlus className="mr-1.5 h-4 w-4" />
            {notaCreada.tipoIngreso === 'PERMUTA' ? 'Registrar Otra Permuta' : 'Registrar Otra Nota'}
          </Button>

          {isAdmin && onGoToHistorial && (
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={onGoToHistorial}
            >
              <History className="mr-1.5 h-4 w-4 text-slate-600" />
              Ver en Historial
            </Button>
          )}

          <Link href="/inventario" className="flex-1">
            <Button variant="outline" className="w-full text-xs">
              <span>Ver en Inventario</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
