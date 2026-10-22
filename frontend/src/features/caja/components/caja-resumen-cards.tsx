import React from 'react';
import { DollarSign, TrendingUp, QrCode, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface CajaResumenCardsProps {
  rf: any;
  sessionData: any;
  isAdmin: boolean;
}

export function CajaResumenCards({
  rf,
  sessionData,
  isAdmin,
}: CajaResumenCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Saldo Disponible en Efectivo */}
      <Card data-testid="kpi-efectivo-gaveta" className="border-slate-200 bg-white shadow-subtle">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Efectivo en Gaveta</span>
            <DollarSign className="h-4 w-4 text-slate-900" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1 font-mono">
            {isAdmin
              ? `Bs ${rf?.saldoEfectivoEnCaja?.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
              : 'Bs ••••••'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {isAdmin ? 'Inicial + Ventas Efec. - Gastos' : 'Protegido'}
          </p>
        </CardContent>
      </Card>

      {/* Total Ventas en Efectivo */}
      <Card className="border-slate-200 bg-white shadow-subtle">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Ventas en Efectivo</span>
            <TrendingUp className="h-4 w-4 text-slate-900" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Bs {rf?.totalVentasEfectivo?.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {sessionData?.caja?.ventas?.filter((v: any) => v.metodoPago?.codigo === 'EFECTIVO')?.length || 0} tickets
          </p>
        </CardContent>
      </Card>

      {/* Cobros Digitales (QR Oficial) */}
      <Card className="border-slate-200 bg-white shadow-subtle">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Cobros QR Oficial</span>
            <QrCode className="h-4 w-4 text-slate-900" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Bs {rf?.totalVentasDigitales?.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {sessionData?.caja?.ventas?.filter((v: any) => v.metodoPago?.codigo !== 'EFECTIVO')?.length || 0} transferencias
          </p>
        </CardContent>
      </Card>

      {/* Gastos Menores */}
      <Card className="border-slate-200 bg-white shadow-subtle">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Egresos Menores de Caja</span>
            <TrendingDown className="h-4 w-4 text-slate-900" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-2xl font-bold tracking-tight text-rose-700 mt-1">
            -Bs {rf?.totalGastosOperativos?.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {sessionData?.caja?.gastosOperativos?.length || 0} egresos registrados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
