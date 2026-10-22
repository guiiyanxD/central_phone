import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CajaMovimientosTurnoProps {
  sessionData: any;
}

export function CajaMovimientosTurno({ sessionData }: CajaMovimientosTurnoProps) {
  const ventas = sessionData?.caja?.ventas || [];
  const gastos = sessionData?.caja?.gastosOperativos || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ventas Registradas en la Caja */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Ventas de la Caja ({ventas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-72 overflow-y-auto">
          {ventas.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No se han procesado ventas en esta caja todavía.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {ventas.map((v: any) => (
                <div key={v.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">
                      Ticket: {v.comprobanteReferencia}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {v.cliente?.nombreCompleto || 'Cliente Mostrador'} • {v.metodoPago?.nombre}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">
                    Bs {Number(v.totalVentaBs).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gastos Menores Registrados */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Egresos Menores ({gastos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-72 overflow-y-auto">
          {gastos.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Sin egresos registrados en esta caja.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {gastos.map((g: any) => (
                <div key={g.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">
                      {g.concepto}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {g.categoria?.nombre} • {g.usuario?.nombre}
                    </p>
                  </div>
                  <span className="font-bold text-rose-700 font-mono">
                    -Bs {Number(g.montoBs).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
