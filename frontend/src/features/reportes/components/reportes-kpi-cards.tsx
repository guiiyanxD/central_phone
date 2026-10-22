'use client';

import React from 'react';
import { ShoppingBag, Receipt, DollarSign, ArrowDownRight, CreditCard, PieChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReporteRentabilidadData } from '../types';

interface ReportesKpiCardsProps {
  reporte: ReporteRentabilidadData | null;
  isLoading: boolean;
}

export function ReportesKpiCards({ reporte, isLoading }: ReportesKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reporte) return null;

  return (
    <div className="space-y-4">
      {/* 5 Tarjetas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Ingresos Totales */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Total Ventas
              </span>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              Bs {Number(reporte.resumen.totalIngresosBs || 0).toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {reporte.resumen.cantidadVentasCompletadas} ventas completadas
              {reporte.resumen.cantidadVentasAnuladas > 0 && (
                <span className="text-rose-600 font-semibold ml-1">
                  ({reporte.resumen.cantidadVentasAnuladas} anuladas)
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* 2. Costo Mercadería (CMV) */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Costo CMV
              </span>
              <Receipt className="h-4 w-4 text-slate-600" />
            </div>
            <div className="text-lg font-bold text-slate-700 font-mono">
              Bs {Number(reporte.resumen.totalCostoMercaderiaBs || 0).toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {reporte.resumen.totalDispositivosVendidos} teléfonos •{' '}
              {reporte.resumen.totalAccesoriosVendidos} accesorios
            </p>
          </CardContent>
        </Card>

        {/* 3. Margen Bruto */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Ganancia Bruta
              </span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-emerald-700 font-mono">
              Bs {Number(reporte.resumen.gananciaBrutaBs || 0).toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Ingresos menos costo directo
            </p>
          </CardContent>
        </Card>

        {/* 4. Gastos Operativos de Caja */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Gastos de Caja
              </span>
              <ArrowDownRight className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-lg font-bold text-rose-700 font-mono">
              Bs {Number(reporte.resumen.totalGastosOperativosBs || 0).toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {reporte.resumen.totalGastosCount} egresos registrados
            </p>
          </CardContent>
        </Card>

        {/* 5. Ganancia Neta Real */}
        <Card className="border-slate-900 bg-slate-900 text-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Utilidad Neta Real
              </span>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40 font-mono">
                {reporte.resumen.margenNetoPorcentaje}%
              </Badge>
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              Bs {Number(reporte.resumen.gananciaNetaRealBs || 0).toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Ganancia líquida final
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose Secundario: Métodos de Pago y Gastos por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="py-3 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-slate-600" />
              Ingresos por Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {Object.entries(reporte.desgloseMetodosPago || {}).length === 0 ? (
              <p className="text-slate-400 italic">No hay ingresos registrados en el período.</p>
            ) : (
              Object.entries(reporte.desgloseMetodosPago).map(([metodo, monto]: [string, any]) => (
                <div key={metodo} className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-600">{metodo}</span>
                  <strong className="font-mono text-slate-900">Bs {Number(monto).toFixed(2)}</strong>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="py-3 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-slate-600" />
              Gastos Operativos por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {Object.entries(reporte.desgloseGastosPorCategoria || {}).length === 0 ? (
              <p className="text-slate-400 italic">No hay gastos operativos registrados en el período.</p>
            ) : (
              Object.entries(reporte.desgloseGastosPorCategoria).map(([cat, monto]: [string, any]) => (
                <div key={cat} className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-600">{cat}</span>
                  <strong className="font-mono text-rose-700">Bs {Number(monto).toFixed(2)}</strong>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
