import React, { useState } from 'react';
import {
  ShoppingCart,
  TrendingDown,
  Receipt,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  QrCode,
  Smartphone,
  Package,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn, formatNombreCaja } from '@/lib/utils';

interface ModalAuditoriaCajaProps {
  isOpen: boolean;
  onClose: () => void;
  cajaDetalleData: any;
  isLoadingDetalle: boolean;
  isAdmin: boolean;
}

export function ModalAuditoriaCaja({
  isOpen,
  onClose,
  cajaDetalleData,
  isLoadingDetalle,
  isAdmin,
}: ModalAuditoriaCajaProps) {
  const [detalleTab, setDetalleTab] = useState<'ventas' | 'gastos' | 'arqueo'>('ventas');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        cajaDetalleData?.caja
          ? `Auditoría: ${formatNombreCaja(
              cajaDetalleData.caja.fechaApertura,
              cajaDetalleData.caja.sucursal?.nombre
            )}`
          : 'Auditoría de Turno de Caja'
      }
      description={
        cajaDetalleData?.caja
          ? `${cajaDetalleData.caja.sucursal?.nombre} (${cajaDetalleData.caja.sucursal?.ciudad || ''}) • Apertura: ${new Date(cajaDetalleData.caja.fechaApertura).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })} • Cierre: ${cajaDetalleData.caja.fechaCierre ? new Date(cajaDetalleData.caja.fechaCierre).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : 'Abierta'}`
          : 'Cargando información detallada del turno...'
      }
      className="max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden"
    >
      {isLoadingDetalle ? (
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : !cajaDetalleData ? (
        <div className="py-12 text-center text-slate-500">
          <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No se pudo cargar la información de esta caja.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      ) : (
        (() => {
          const detCaja = cajaDetalleData.caja;
          const detRf = cajaDetalleData.resumenFinanciero;
          const detDif = detCaja.diferenciaEfectivo !== null ? Number(detCaja.diferenciaEfectivo) : 0;

          return (
            <div className="flex flex-col h-full overflow-hidden space-y-4 pt-1">
              {/* 4 TARJETAS KPI DE LA CAJA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium mb-1">
                    <span>Ventas Totales</span>
                    <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-base font-bold font-mono text-slate-900">
                    Bs {detRf.totalVentasTotal.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    Efec: Bs {detRf.totalVentasEfectivo.toFixed(2)} • QR: Bs {detRf.totalVentasDigitales.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium mb-1">
                    <span>Egresos / Gastos</span>
                    <TrendingDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-base font-bold font-mono text-slate-900">
                    Bs {detRf.totalGastosTotal.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {detRf.cantidadGastos} egreso(s) menores
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium mb-1">
                    <span>Arqueo Físico Real</span>
                    <Receipt className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-base font-bold font-mono text-slate-900">
                    Bs {(detCaja.montoFinalEfectivo !== null ? Number(detCaja.montoFinalEfectivo) : 0).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] mt-0.5">
                    <span className="text-slate-500 truncate">Teórico: Bs {detRf.saldoTeoricoEfectivo.toFixed(2)}</span>
                    <span
                      className={cn(
                        'px-1 py-0.2 rounded font-bold font-mono text-[9px]',
                        detDif === 0
                          ? 'bg-slate-200 text-slate-800'
                          : detDif > 0
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-900 text-white'
                      )}
                    >
                      {detDif === 0 ? 'OK' : detDif > 0 ? `+Bs ${detDif}` : `Bs ${detDif}`}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-900 text-white">
                  <div className="flex items-center justify-between text-slate-300 text-[11px] font-medium mb-1">
                    <span>{isAdmin ? 'Ganancia Neta' : 'Saldo Teórico'}</span>
                    <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-base font-bold font-mono text-white">
                    {isAdmin && detRf.gananciaNetaVentas !== undefined
                      ? `+Bs ${detRf.gananciaNetaVentas.toFixed(2)}`
                      : `Bs ${detRf.saldoTeoricoEfectivo.toFixed(2)}`}
                  </p>
                  <p className="text-[10px] text-slate-300 truncate mt-0.5">
                    {isAdmin && detRf.totalCostoMercaderia !== undefined
                      ? `CMV: Bs ${detRf.totalCostoMercaderia.toFixed(2)} • Neta op: Bs ${detRf.gananciaNetaOperativa?.toFixed(2)}`
                      : 'Saldo calculado en gaveta'}
                  </p>
                </div>
              </div>

              {/* PESTAÑAS DEL DETALLE */}
              <div className="flex border-b border-slate-200 text-xs gap-4">
                <button
                  type="button"
                  onClick={() => setDetalleTab('ventas')}
                  className={cn(
                    'pb-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5',
                    detalleTab === 'ventas'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Ventas Realizadas ({detCaja.ventas.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetalleTab('gastos')}
                  className={cn(
                    'pb-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5',
                    detalleTab === 'gastos'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>Gastos Menores ({detCaja.gastosOperativos.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetalleTab('arqueo')}
                  className={cn(
                    'pb-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5',
                    detalleTab === 'arqueo'
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Auditoría de Arqueo</span>
                </button>
              </div>

              {/* CONTENIDO DE PESTAÑAS */}
              <div className="flex-1 overflow-y-auto max-h-[46vh] pr-1">
                {/* PESTAÑA VENTAS */}
                {detalleTab === 'ventas' && (
                  <div className="space-y-2">
                    {detCaja.ventas.length === 0 ? (
                      <div className="py-10 text-center text-slate-400">
                        <ShoppingCart className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                        <p className="text-xs font-medium text-slate-600">No se registraron ventas en esta caja.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3"># Venta & Hora</th>
                              <th className="py-2.5 px-3">Vendedor & Cliente</th>
                              <th className="py-2.5 px-3">Método</th>
                              <th className="py-2.5 px-3">Artículos Vendidos</th>
                              <th className="py-2.5 px-3 text-right">Total Venta</th>
                              {isAdmin && <th className="py-2.5 px-3 text-right">Ganancia Neta</th>}
                              <th className="py-2.5 px-3 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detCaja.ventas.map((v: any) => {
                              const isAnulada = v.estado === 'ANULADA';
                              return (
                                <tr
                                  key={v.id}
                                  className={cn(
                                    'hover:bg-slate-50 transition-colors',
                                    isAnulada && 'bg-rose-50/40 opacity-75'
                                  )}
                                >
                                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                                    <p className="font-bold text-slate-900">#VTA-{v.id}</p>
                                    <p className="text-[10px] text-slate-500">
                                      {new Date(v.fechaHora).toLocaleTimeString('es-BO', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </td>

                                  <td className="py-2.5 px-3">
                                    <p className="font-medium text-slate-900">{v.usuario?.nombre}</p>
                                    <p className="text-[10px] text-slate-500">
                                      {v.cliente?.nombreCompleto || 'Consumidor Final'}
                                      {v.cliente?.ciNit ? ` (${v.cliente.ciNit})` : ''}
                                    </p>
                                  </td>

                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                      {v.metodoPago?.codigo === 'EFECTIVO' ? (
                                        <DollarSign className="h-3 w-3 text-slate-600" />
                                      ) : (
                                        <QrCode className="h-3 w-3 text-slate-600" />
                                      )}
                                      {v.metodoPago?.nombre || 'Efectivo'}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 max-w-xs">
                                    <div className="space-y-1">
                                      {v.detalles?.map((d: any, idx: number) => {
                                        if (d.dispositivo) {
                                          const disp = d.dispositivo;
                                          const varnt = disp.variante;
                                          return (
                                            <div key={`d-${idx}`} className="text-[11px] flex flex-wrap items-center gap-1">
                                              <span className="font-semibold text-slate-900 flex items-center gap-1">
                                                <Smartphone className="h-3 w-3 text-slate-500" />
                                                {varnt?.modelo?.nombreModelo || 'iPhone'} {varnt?.color} {varnt?.capacidadGb}GB
                                              </span>
                                              <span className="font-mono text-[9px] bg-slate-100 border border-slate-200 text-slate-700 px-1 rounded">
                                                IMEI: {disp.imei1}
                                              </span>
                                            </div>
                                          );
                                        }
                                        if (d.loteAccesorio) {
                                          const lote = d.loteAccesorio;
                                          return (
                                            <div key={`d-${idx}`} className="text-[11px] flex items-center gap-1 text-slate-700">
                                              <Package className="h-3 w-3 text-slate-500" />
                                              <span>{lote.accesorio?.nombre} ({lote.nombreDiferenciador})</span>
                                              <span className="font-bold text-slate-900">x{d.cantidad}</span>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </td>

                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                    Bs {Number(v.totalVentaBs).toFixed(2)}
                                  </td>

                                  {isAdmin && (
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                      {!isAnulada ? (
                                        <div className="font-mono">
                                          <span className="text-[11px] font-bold text-slate-900 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                                            +Bs {Number(v.gananciaNetaBs).toFixed(2)}
                                          </span>
                                          <p className="text-[9px] text-slate-400 mt-0.5">
                                            CMV: Bs {Number(v.costoTotalBs).toFixed(2)}
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">Sin margen</span>
                                      )}
                                    </td>
                                  )}

                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    {isAnulada ? (
                                      <div>
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                                          Anulada
                                        </Badge>
                                        {v.motivoAnulacion && (
                                          <p className="text-[9px] text-slate-500 max-w-[120px] truncate mt-0.5" title={v.motivoAnulacion}>
                                            {v.motivoAnulacion}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-slate-50 border-slate-300 text-slate-800">
                                        Completada
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* PESTAÑA GASTOS */}
                {detalleTab === 'gastos' && (
                  <div className="space-y-2">
                    {detCaja.gastosOperativos.length === 0 ? (
                      <div className="py-10 text-center text-slate-400">
                        <TrendingDown className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                        <p className="text-xs font-medium text-slate-600">No se registraron egresos en este turno.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3">Hora</th>
                              <th className="py-2.5 px-3">Categoría</th>
                              <th className="py-2.5 px-3">Concepto / Motivo</th>
                              <th className="py-2.5 px-3">Registrado Por</th>
                              <th className="py-2.5 px-3">Método</th>
                              <th className="py-2.5 px-3 text-right">Monto Egreso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detCaja.gastosOperativos.map((g: any) => (
                              <tr key={g.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                                  {new Date(g.fechaHora).toLocaleTimeString('es-BO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-medium text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                                    {g.categoria?.nombre || 'General'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  {g.concepto}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {g.usuario?.nombre}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {g.metodoPago?.nombre || 'Efectivo'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                  -Bs {Number(g.montoBs).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* PESTAÑA AUDITORÍA DE ARQUEO */}
                {detalleTab === 'arqueo' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                        Fórmula de Reconciliación de Gaveta (Efectivo)
                      </h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">(+) Monto Inicial de Apertura</span>
                          <span className="font-bold text-slate-900">Bs {detRf.montoInicialEfectivo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">(+) Ventas Cobradas en Efectivo</span>
                          <span className="font-bold text-slate-900">+Bs {detRf.totalVentasEfectivo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">(-) Egresos y Gastos en Efectivo</span>
                          <span className="font-bold text-slate-900">-Bs {detRf.totalGastosEfectivo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 font-bold border-b border-slate-300 bg-white px-2 rounded">
                          <span className="text-slate-900">(=) Saldo Teórico en Gaveta</span>
                          <span className="text-slate-900">Bs {detRf.saldoTeoricoEfectivo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 font-bold border-b border-slate-300 bg-white px-2 rounded">
                          <span className="text-slate-900">(🔍) Conteo Físico Real Declarado</span>
                          <span className="text-slate-900">
                            Bs {(detCaja.montoFinalEfectivo !== null ? Number(detCaja.montoFinalEfectivo) : 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 px-2 rounded bg-slate-900 text-white font-bold">
                          <span>Diferencia / Descuadre Final</span>
                          <span>
                            {detDif === 0
                              ? 'Bs 0.00 (Conforme)'
                              : detDif > 0
                              ? `+Bs ${detDif.toFixed(2)} (Sobrante)`
                              : `Bs ${detDif.toFixed(2)} (Faltante)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {detCaja.justificacion ? (
                      <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-4 w-4 text-slate-800" />
                          <span>Justificación Registrada en Arqueo a Ciegas:</span>
                        </div>
                        <p className="italic text-slate-800 pl-5">
                          "{detCaja.justificacion}"
                        </p>
                        <p className="text-[10px] text-slate-500 pl-5 pt-1">
                          Declarado por {detCaja.usuarioCierre?.nombre || detCaja.usuarioApertura.nombre} al momento del cierre.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-slate-700" />
                        <span>Turno cerrado conforme sin requerimiento de justificación por descuadre.</span>
                      </div>
                    )}

                    {detCaja.observaciones && (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Observaciones generales: </span>
                        <span>{detCaja.observaciones}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BOTÓN DE CIERRE DEL MODAL */}
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs px-4"
                  onClick={onClose}
                >
                  Cerrar Detalle
                </Button>
              </div>
            </div>
          );
        })()
      )}
    </Modal>
  );
}
