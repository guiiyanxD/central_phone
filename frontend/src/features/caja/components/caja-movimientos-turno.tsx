import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, RefreshCw, Smartphone, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFolioTicket } from '@/lib/utils';

interface CajaMovimientosTurnoProps {
  sessionData: any;
  onSelectVenta?: (venta: any) => void;
}

export function CajaMovimientosTurno({
  sessionData,
  onSelectVenta,
}: CajaMovimientosTurnoProps) {
  const ventas = sessionData?.caja?.ventas || [];
  const gastos = sessionData?.caja?.gastosOperativos || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ventas Registradas en la Caja */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">
            Ventas de la Caja ({ventas.length})
          </CardTitle>
          <span className="text-[11px] text-slate-500 font-medium">
            Turno en curso
          </span>
        </CardHeader>
        <CardContent className="p-0 max-h-80 overflow-y-auto">
          {ventas.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No se han procesado ventas en esta caja todavía.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {ventas.map((v: any) => {
                const montoPermuta = Number(v.montoPermutaBs || 0);
                const saldoCobrado = Math.max(0, Number(v.totalVentaBs || 0) - montoPermuta);

                return (
                  <div
                    key={v.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 font-mono">
                          #{formatFolioTicket(v.id)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(v.fechaHora).toLocaleTimeString('es-BO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {v.metodoPago?.nombre || 'Efectivo'}
                        </span>
                        {montoPermuta > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold px-1.5 py-0 border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1"
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            Permuta -Bs {montoPermuta.toFixed(2)}
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 truncate">
                        Cliente: <strong>{v.cliente?.nombreCompleto || 'Cliente Mostrador'}</strong>
                      </p>

                      {/* Mini preview de items */}
                      {v.detalles && v.detalles.length > 0 && (
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 flex-wrap">
                          {v.detalles.map((d: any, idx: number) => {
                            const name = d.dispositivo
                              ? `${d.dispositivo.variante?.modelo?.nombreModelo || 'iPhone'} (${d.dispositivo.variante?.color || ''})`
                              : `${d.loteAccesorio?.accesorio?.nombre || 'Accesorio'}`;
                            return (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] inline-flex items-center gap-0.5"
                              >
                                {d.dispositivo ? (
                                  <Smartphone className="h-2.5 w-2.5 text-slate-500" />
                                ) : (
                                  <Package className="h-2.5 w-2.5 text-slate-500" />
                                )}
                                {name} {d.cantidad > 1 ? `x${d.cantidad}` : ''}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0">
                      <div>
                        <span className="font-bold text-slate-900 font-mono text-sm block">
                          Bs {saldoCobrado.toFixed(2)}
                        </span>
                        {montoPermuta > 0 && (
                          <span className="text-[9px] text-slate-400 font-mono block">
                            Total: Bs {Number(v.totalVentaBs).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {onSelectVenta && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-300 flex items-center gap-1"
                          onClick={() => onSelectVenta(v)}
                          title="Ver detalle completo del ticket de venta"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-600" />
                          <span className="hidden sm:inline">Ticket</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
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
