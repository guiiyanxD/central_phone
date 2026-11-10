'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, RefreshCw, Smartphone, Package, Ban, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFolioTicket } from '@/lib/utils';
import { ModalAnularVentaCaja } from './modal-anular-venta-caja';
import { ModalEditarGasto } from './modal-editar-gasto';
import { ModalEliminarGasto } from './modal-eliminar-gasto';

interface CajaMovimientosTurnoProps {
  sessionData: any;
  isAdmin?: boolean;
  isCajaAbierta?: boolean;
  categoriasGasto?: any[];
  onSelectVenta?: (venta: any) => void;
  onRefresh?: () => Promise<void>;
}

export function CajaMovimientosTurno({
  sessionData,
  isAdmin = false,
  isCajaAbierta = false,
  categoriasGasto = [],
  onSelectVenta,
  onRefresh,
}: CajaMovimientosTurnoProps) {
  const ventas = sessionData?.caja?.ventas || [];
  const gastos = sessionData?.caja?.gastosOperativos || [];
  const saldoDisponibleEfectivo = sessionData?.resumenFinanciero?.saldoEfectivoEnCaja;

  // Estados de modales de acción ADMIN
  const [ventaParaAnular, setVentaParaAnular] = useState<any | null>(null);
  const [gastoParaEditar, setGastoParaEditar] = useState<any | null>(null);
  const [gastoParaEliminar, setGastoParaEliminar] = useState<any | null>(null);

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

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
                const isAnulada = v.estado === 'ANULADA';

                return (
                  <div
                    key={v.id}
                    className={`p-3 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3 ${
                      isAnulada ? 'bg-rose-50/40 opacity-75' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold font-mono ${
                            isAnulada ? 'text-slate-500 line-through' : 'text-slate-900'
                          }`}
                        >
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
                        {isAnulada && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold px-1.5 py-0 border-rose-300 bg-rose-50 text-rose-800"
                          >
                            ANULADA
                          </Badge>
                        )}
                        {montoPermuta > 0 && !isAnulada && (
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
                        <span
                          className={`font-bold font-mono text-sm block ${
                            isAnulada ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        >
                          Bs {saldoCobrado.toFixed(2)}
                        </span>
                        {montoPermuta > 0 && (
                          <span className="text-[9px] text-slate-600 font-mono block">
                            Total: Bs {Number(v.totalVentaBs).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onSelectVenta && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-300 flex items-center gap-1"
                            onClick={() => onSelectVenta(v)}
                            aria-label={`Ver ticket #${formatFolioTicket(v.id)}`}
                            title="Ver detalle completo del ticket de venta"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                            <span className="hidden sm:inline">Ticket</span>
                          </Button>
                        )}

                        {isAdmin && isCajaAbierta && !isAnulada && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 border-rose-200 flex items-center gap-1"
                            onClick={() => setVentaParaAnular(v)}
                            aria-label={`Anular venta #${formatFolioTicket(v.id)}`}
                            title="Anular venta y revertir inventario"
                          >
                            <Ban className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                            <span className="hidden sm:inline">Anular</span>
                          </Button>
                        )}
                      </div>
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
        <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900">
            Egresos Menores ({gastos.length})
          </CardTitle>
          <span className="text-[11px] text-slate-500 font-medium">
            Turno en curso
          </span>
        </CardHeader>
        <CardContent className="p-0 max-h-80 overflow-y-auto">
          {gastos.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Sin egresos registrados en esta caja.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {gastos.map((g: any) => (
                <div
                  key={g.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">
                      {g.concepto}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {g.categoria?.nombre || 'General'} • {g.usuario?.nombre || 'Usuario'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-rose-700 font-mono">
                      -Bs {Number(g.montoBs).toFixed(2)}
                    </span>

                    {isAdmin && isCajaAbierta && (
                      <div className="flex items-center gap-1 ml-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200"
                          onClick={() => setGastoParaEditar(g)}
                          title="Editar egreso menor"
                        >
                          <Pencil className="h-3 w-3" />
                          <span className="sr-only">Editar egreso</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
                          onClick={() => setGastoParaEliminar(g)}
                          title="Eliminar egreso menor"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Eliminar egreso</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales de Gestión Exclusivos ADMIN */}
      {isAdmin && isCajaAbierta && (
        <>
          <ModalAnularVentaCaja
            isOpen={!!ventaParaAnular}
            onClose={() => setVentaParaAnular(null)}
            venta={ventaParaAnular}
            onAnulacionExitosa={handleRefresh}
          />

          <ModalEditarGasto
            isOpen={!!gastoParaEditar}
            onClose={() => setGastoParaEditar(null)}
            gasto={gastoParaEditar}
            categoriasGasto={categoriasGasto}
            saldoDisponibleEfectivo={saldoDisponibleEfectivo}
            onGastoActualizado={handleRefresh}
          />

          <ModalEliminarGasto
            isOpen={!!gastoParaEliminar}
            onClose={() => setGastoParaEliminar(null)}
            gasto={gastoParaEliminar}
            onGastoEliminado={handleRefresh}
          />
        </>
      )}
    </div>
  );
}
