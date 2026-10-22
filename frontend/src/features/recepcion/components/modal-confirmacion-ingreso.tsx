'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, PackagePlus, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ModalConfirmacionIngresoProps {
  notaCreada: any;
  onReset: () => void;
}

export function ModalConfirmacionIngreso({
  notaCreada,
  onReset,
}: ModalConfirmacionIngresoProps) {
  if (!notaCreada) return null;

  return (
    <div className="max-w-2xl mx-auto py-12 animate-in fade-in duration-300">
      <Card className="border-slate-200 bg-white shadow-card p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <Badge variant="success">Nota de Ingreso #{notaCreada.id}</Badge>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Mercadería Recibida e Inventariada
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            La transacción se registró con éxito en la base de datos con trazabilidad total.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Proveedor:</span>
            <strong className="text-slate-900">{notaCreada.proveedor?.nombre}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sucursal Destino:</span>
            <strong className="text-slate-900">{notaCreada.sucursal?.nombre}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Teléfonos Registrados:</span>
            <strong className="text-slate-900">{notaCreada.dispositivos?.length || 0} unidades</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Lotes de Accesorios:</span>
            <strong className="text-slate-900">{notaCreada.lotesAccesorio?.length || 0} lotes</strong>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-sans font-bold">
            <span className="text-slate-900">Total Costo de Ingreso:</span>
            <span className="text-slate-900">
              Bs {Number(notaCreada.totalCostoBs || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className="flex-1"
            onClick={onReset}
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Registrar Otra Nota
          </Button>
          <Link href="/inventario" className="flex-1">
            <Button variant="outline" className="w-full">
              <span>Ver en Inventario</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
