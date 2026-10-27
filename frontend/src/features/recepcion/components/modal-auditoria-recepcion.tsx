import React, { useState } from 'react';
import { Smartphone, Package, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface ModalAuditoriaRecepcionProps {
  isOpen: boolean;
  onClose: () => void;
  recepcionDetalleData: any;
  isLoadingRecDetalle: boolean;
}

export function ModalAuditoriaRecepcion({
  isOpen,
  onClose,
  recepcionDetalleData,
  isLoadingRecDetalle,
}: ModalAuditoriaRecepcionProps) {
  const [recDetalleTab, setRecDetalleTab] = useState<'dispositivos' | 'accesorios'>('dispositivos');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        recepcionDetalleData
          ? `Auditoría Financiera: Nota de Ingreso #ING-${recepcionDetalleData.id}`
          : 'Detalle Financiero de Recepción'
      }
      description={
        recepcionDetalleData
          ? `Comprobante: ${recepcionDetalleData.numeroComprobante || 'S/N'} • Proveedor: ${recepcionDetalleData.proveedor?.nombre} • Sucursal: ${recepcionDetalleData.sucursal?.nombre}`
          : 'Cargando información valorizada de la mercadería...'
      }
      className="max-w-5xl max-h-[92vh] flex flex-col p-6 overflow-hidden"
    >
      {isLoadingRecDetalle ? (
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : !recepcionDetalleData ? (
        <div className="py-12 text-center text-slate-500">
          <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No se pudo cargar la información de esta recepción.</p>
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
          const rf = recepcionDetalleData.resumenFinanciero || {};
          const dispositivos = recepcionDetalleData.dispositivos || [];
          const lotes = recepcionDetalleData.lotesAccesorio || [];

          return (
            <div className="flex flex-col flex-1 min-h-0 space-y-4 pt-2">
              {/* Metadatos de la Entrega */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400">Proveedor:</span>{' '}
                    <strong className="text-slate-900">{recepcionDetalleData.proveedor?.nombre}</strong>
                    {recepcionDetalleData.proveedor?.telefono && ` (${recepcionDetalleData.proveedor.telefono})`}
                  </div>
                  <div>
                    <span className="text-slate-400">Sucursal Destino:</span>{' '}
                    <strong className="text-slate-900">{recepcionDetalleData.sucursal?.nombre}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Fecha de Ingreso:</span>{' '}
                    <strong className="text-slate-900">
                      {new Date(recepcionDetalleData.fechaIngreso).toLocaleString('es-BO', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Receptor:</span>{' '}
                    <strong className="text-slate-900">{recepcionDetalleData.usuario?.nombre}</strong>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs bg-white">
                  Factura / Doc: {recepcionDetalleData.numeroComprobante || 'Sin comprobante'}
                </Badge>
              </div>

              {/* KPI Cards Financieras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Inversión Total
                  </span>
                  <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                    Bs {Number(rf.totalCostoBs || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 font-mono">
                    $ {Number(rf.totalCostoUsd || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Unidades Ingresadas
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {rf.totalUnidadesIngresadas || 0} <span className="text-xs font-normal text-slate-500">unidades</span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong className="text-slate-800">{rf.totalDispositivos || 0}</strong> teléfonos • <strong className="text-slate-800">{rf.totalAccesorios || 0}</strong> accesorios
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Progreso de Ventas
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {Number(rf.porcentajeVentaRealizada || 0).toFixed(1)}% vendido
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                    Bs {Number(rf.totalVentaRealizadaBs || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>

                  <div className="w-full bg-slate-100 rounded-full h-2 my-1.5 overflow-hidden border border-slate-200/60">
                    <div
                      className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Number(rf.porcentajeVentaRealizada || 0), 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Proyectado: Bs {Number(rf.totalVentaProyectadaBs || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span>{rf.totalUnidadesVendidas || 0}/{rf.totalUnidadesIngresadas || 0} u. ({Number(rf.porcentajeUnidadesVendidas || 0).toFixed(0)}%)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Margen y Ganancia
                  </span>
                  <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                    Bs {Number(rf.margenProyectadoBs || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center justify-between text-[11px] mt-0.5">
                    <span className="text-slate-500">Potencial: {Number(rf.porcentajeMargenProyectado || 0).toFixed(1)}%</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      Realizado: Bs {Number(rf.margenRealizadoBs || 0).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Pestañas: Dispositivos vs Accesorios */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={recDetalleTab === 'dispositivos' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8 px-3 gap-1.5"
                    onClick={() => setRecDetalleTab('dispositivos')}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Teléfonos Recibidos ({dispositivos.length})</span>
                  </Button>
                  <Button
                    type="button"
                    variant={recDetalleTab === 'accesorios' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-8 px-3 gap-1.5"
                    onClick={() => setRecDetalleTab('accesorios')}
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>Lotes de Accesorios ({lotes.length})</span>
                  </Button>
                </div>
              </div>

              {/* Contenido de la Sub-Pestaña Activa con scroll interno */}
              <div className="flex-1 overflow-y-auto max-h-[42vh] rounded-lg border border-slate-200">
                {recDetalleTab === 'dispositivos' ? (
                  dispositivos.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No se registraron teléfonos en esta nota de ingreso.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 font-semibold text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Modelo & Variante</th>
                          <th className="py-2.5 px-3">Serie / IMEIs</th>
                          <th className="py-2.5 px-3 text-center">Condición</th>
                          <th className="py-2.5 px-3 text-right">Costo (Bs)</th>
                          <th className="py-2.5 px-3 text-right">Costo (USD)</th>
                          <th className="py-2.5 px-3 text-right">Precio Sugerido</th>
                          <th className="py-2.5 px-3 text-center">Estado Comercial</th>
                          <th className="py-2.5 px-3 text-right">Margen Est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dispositivos.map((d: any) => {
                          const costo = Number(d.costoBs || 0);
                          const costoUsd = Number(d.costoUsd || 0);
                          const precioSugerido = Number(d.precioVentaSugeridoBs || 0);
                          const margen = precioSugerido - costo;
                          const isSold = d.estadoInventario === 'VENDIDO' || (d.detalleVentas && d.detalleVentas.length > 0);
                          const precioCobrado = d.detalleVentas?.[0]?.subtotalBs ? Number(d.detalleVentas[0].subtotalBs) : null;

                          return (
                            <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-slate-900">
                                    {d.variante?.modelo?.nombreModelo || 'Dispositivo'}
                                  </p>
                                  <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                                    {d.variante?.modelo?.tipo || 'IPHONE'}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {d.variante?.color} • {d.variante?.capacidadGb > 0 ? `${d.variante?.capacidadGb} GB` : '0 GB'} ({d.variante?.tipoSim})
                                </p>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px]">
                                <p className="text-slate-900 font-semibold">S/N: {d.numeroSerie}</p>
                                {d.imei1 && <p className="text-slate-500">IMEI: {d.imei1}</p>}
                                {d.imei2 && <p className="text-slate-400">IMEI 2: {d.imei2}</p>}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {d.condicion}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                                Bs {costo.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                $ {costoUsd.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                                Bs {precioSugerido.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isSold ? (
                                  <div className="inline-flex flex-col items-center">
                                    <Badge variant="success" className="text-[10px]">
                                      Vendido
                                    </Badge>
                                    {precioCobrado !== null && (
                                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                        Bs {precioCobrado.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {d.estadoInventario}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                Bs {margen.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
                ) : (
                  lotes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No se registraron accesorios en esta nota de ingreso.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 font-semibold text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Accesorio & Categoría</th>
                          <th className="py-2.5 px-3">Lote Diferenciador</th>
                          <th className="py-2.5 px-3 text-center">Cant. Ingresada</th>
                          <th className="py-2.5 px-3 text-center">Stock Remanente</th>
                          <th className="py-2.5 px-3 text-center">Vendidas</th>
                          <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                          <th className="py-2.5 px-3 text-right">Inversión Lote</th>
                          <th className="py-2.5 px-3 text-right">Precio Venta</th>
                          <th className="py-2.5 px-3 text-right">Recaudado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {lotes.map((l: any) => {
                          const cantInicial = l.cantidadInicial || 0;
                          const stockActual = l.stockActual || 0;
                          const cantVendidaDetalles = l.detalleVentas?.reduce((sum: number, dv: any) => sum + (dv.cantidad || 0), 0) || 0;
                          const unidadesVendidas = Math.max(cantVendidaDetalles, cantInicial - stockActual);
                          const costoUnit = Number(l.costoUnitarioBs || 0);
                          const precioVenta = Number(l.precioVentaBs || 0);
                          const inversionTotal = costoUnit * cantInicial;
                          const recaudado = l.detalleVentas?.reduce((sum: number, dv: any) => sum + Number(dv.subtotalBs || 0), 0) || (unidadesVendidas * precioVenta);

                          return (
                            <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3">
                                <p className="font-semibold text-slate-900">
                                  {l.accesorio?.nombre || 'Accesorio'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {l.accesorio?.categoria?.nombre || 'Sin categoría'}
                                </p>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {l.nombreDiferenciador}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                                {cantInicial}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <Badge variant={stockActual > 0 ? 'outline' : 'secondary'} className="text-[10px]">
                                  {stockActual} u.
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="font-bold text-slate-900">{unidadesVendidas}</span>{' '}
                                <span className="text-slate-400 text-[10px]">({cantInicial > 0 ? Math.round((unidadesVendidas / cantInicial) * 100) : 0}%)</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                Bs {costoUnit.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                                Bs {inversionTotal.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                Bs {precioVenta.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                Bs {recaudado.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
                )}
              </div>

              {/* Observaciones si las hay */}
              {recepcionDetalleData.observaciones && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                  <strong className="text-slate-900">Observaciones de la Entrega:</strong>{' '}
                  <span>{recepcionDetalleData.observaciones}</span>
                </div>
              )}

              {/* Footer del Modal */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Auditoría de Recepción valorizada bajo estándar 3FN.
                </span>
                <Button
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
