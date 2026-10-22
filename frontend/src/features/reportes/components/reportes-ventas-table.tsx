'use client';

import React from 'react';
import { Ban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TransaccionVentaReporte } from '../types';

interface ReportesVentasTableProps {
  transacciones: TransaccionVentaReporte[];
  onOpenAnulacion: (t: TransaccionVentaReporte) => void;
}

export function ReportesVentasTable({
  transacciones,
  onOpenAnulacion,
}: ReportesVentasTableProps) {
  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xs font-bold text-slate-900">
            Auditoría Detallada de Ventas y Tickets ({transacciones.length})
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-500">
            Permite auditar el desglose de cada ticket y anular transacciones con reposición atómica de inventario.
          </CardDescription>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Ticket / Fecha</th>
              <th className="py-3 px-3">Vendedor & Sucursal</th>
              <th className="py-3 px-3">Cliente</th>
              <th className="py-3 px-3">Pago</th>
              <th className="py-3 px-3 text-right">Total Venta</th>
              <th className="py-3 px-3 text-right">Costo (CMV)</th>
              <th className="py-3 px-3 text-right">Ganancia</th>
              <th className="py-3 px-3 text-center">Estado</th>
              <th className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transacciones.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No se encontraron transacciones en el rango de fechas seleccionado.
                </td>
              </tr>
            ) : (
              transacciones.map((t) => (
                <tr
                  key={t.id}
                  className={cn(
                    'hover:bg-slate-50/80 transition-colors',
                    t.estado === 'ANULADA' && 'bg-rose-50/20 text-slate-400'
                  )}
                >
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-900 font-mono">
                      {t.comprobanteReferencia}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      {new Date(t.fechaHora).toLocaleString('es-BO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-slate-800 font-medium">{t.vendedor}</p>
                    <p className="text-slate-400 text-[10px]">{t.sucursal}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-slate-800">{t.cliente}</p>
                    {t.clienteTelefono && (
                      <p className="text-slate-400 text-[10px]">{t.clienteTelefono}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {t.metodoPago}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    Bs {Number(t.totalVentaBs || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    Bs {Number(t.costoTotalBs || 0).toFixed(2)}
                  </td>
                  <td
                    className={cn(
                      'py-2.5 px-3 text-right font-mono font-semibold',
                      t.estado === 'ANULADA' ? 'text-slate-400 line-through' : 'text-emerald-700'
                    )}
                  >
                    Bs {Number(t.gananciaBs || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded border',
                        t.estado === 'ANULADA'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      )}
                    >
                      {t.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {t.estado === 'COMPLETADA' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        onClick={() => onOpenAnulacion(t)}
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Anular
                      </Button>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic text-right" title={t.motivoAnulacion || ''}>
                        {t.motivoAnulacion ? (
                          <span className="cursor-help" title={`Motivo: ${t.motivoAnulacion} | Por: ${t.anuladoPor || 'Admin'}`}>
                            Anulada
                          </span>
                        ) : (
                          'Anulada'
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
