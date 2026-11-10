'use client';

import React from 'react';
import {
  Receipt,
  Printer,
  Smartphone,
  Package,
  RefreshCw,
  User,
  Calendar,
  Building2,
  DollarSign,
  QrCode,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatFolioTicket } from '@/lib/utils';
import { printReceipt } from '@/features/pos/utils/receipt-printer';

interface ModalDetalleVentaProps {
  isOpen: boolean;
  onClose: () => void;
  venta: any;
  isAdmin?: boolean;
}

export function ModalDetalleVenta({
  isOpen,
  onClose,
  venta,
  isAdmin = false,
}: ModalDetalleVentaProps) {
  if (!venta) return null;

  const isAnulada = venta.estado === 'ANULADA';
  const montoTotal = Number(venta.totalVentaBs || 0);
  const montoPermuta = Number(venta.montoPermutaBs || 0);
  const saldoCobrado = Math.max(0, montoTotal - montoPermuta);
  const costoTotal = Number(venta.costoTotalBs || 0);
  const gananciaNeta = Number(venta.gananciaNetaBs || 0);

  const sucursalNombre =
    venta.caja?.sucursal?.nombre ||
    venta.sucursal?.nombre ||
    venta.sucursal ||
    'Sucursal Central';

  const sucursalCiudad =
    venta.caja?.sucursal?.ciudad || venta.sucursalCiudad || '';

  const fechaFormateada = new Date(venta.fechaHora).toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Receipt className="h-5 w-5 text-slate-800" />
          <span>Ticket de Venta #{formatFolioTicket(venta.id)}</span>
          <Badge
            variant={isAnulada ? 'destructive' : 'default'}
            className={cn(
              'ml-2 text-[10px] font-bold px-2 py-0.5',
              !isAnulada && 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
          >
            {isAnulada ? 'ANULADA' : 'COMPLETADA'}
          </Badge>
          {montoPermuta > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold px-2 py-0.5 border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Trade-In
            </Badge>
          )}
        </div>
      }
      description={`${sucursalNombre} ${sucursalCiudad ? `(${sucursalCiudad})` : ''} • Fecha: ${fechaFormateada}`}
      className="max-w-3xl max-h-[92vh] flex flex-col p-6 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto space-y-4 pt-1 pr-1">
        {/* Banner de Anulación (si aplica) */}
        {isAnulada && (
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-900">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>Esta venta fue anulada en auditoría</span>
            </div>
            {venta.motivoAnulacion && (
              <p className="text-[11px]">
                <strong>Motivo:</strong> {venta.motivoAnulacion}
              </p>
            )}
            <div className="text-[10px] text-rose-700 flex gap-4">
              {venta.fechaAnulacion && (
                <span>
                  Fecha: {new Date(venta.fechaAnulacion).toLocaleString('es-BO')}
                </span>
              )}
              {venta.anuladoPor && (
                <span>
                  Anulada por: {venta.anuladoPor.nombre || venta.anuladoPor}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tarjetas de Metadatos de la Venta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Vendedor y Sucursal */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-500 block flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              Vendedor
            </span>
            <p className="font-bold text-slate-900 truncate">
              {venta.usuario?.nombre || venta.vendedor || 'Vendedor'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {sucursalNombre}
            </p>
          </div>

          {/* Cliente */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-500 block flex items-center gap-1">
              <User className="h-3 w-3 text-slate-400" />
              Cliente Comprador
            </span>
            <p className="font-bold text-slate-900 truncate">
              {venta.cliente?.nombreCompleto || venta.cliente || 'Cliente Mostrador'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              Tel: {venta.cliente?.telefono || venta.clienteTelefono || 'S/N'}{' '}
              {venta.cliente?.ciNit ? `• CI: ${venta.cliente.ciNit}` : ''}
            </p>
          </div>

          {/* Método de Cobro */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-slate-500 block flex items-center gap-1">
              {venta.metodoPago?.codigo === 'EFECTIVO' ? (
                <DollarSign className="h-3 w-3 text-emerald-600" />
              ) : venta.metodoPago?.codigo === 'MIXTO' ? (
                <Layers className="h-3 w-3 text-blue-600" />
              ) : (
                <QrCode className="h-3 w-3 text-purple-600" />
              )}
              Forma de Pago
            </span>
            <p className="font-bold text-slate-900">
              {venta.metodoPago?.nombre || 'Efectivo'}
            </p>
            {venta.metodoPago?.codigo === 'MIXTO' ? (
              <p className="text-[10px] text-blue-700 font-mono">
                Efec: Bs {Number(venta.montoEfectivoBs || 0).toFixed(2)} + QR: Bs{' '}
                {Number(venta.montoDigitalBs || 0).toFixed(2)}
              </p>
            ) : venta.comprobanteReferencia ? (
              <p className="text-[10px] text-slate-500 font-mono truncate">
                Ref: {venta.comprobanteReferencia}
              </p>
            ) : null}
          </div>
        </div>

        {/* Comprobante de Pago Adjunto (si existe imagen) */}
        {venta.comprobanteImagenUrl && (
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <img
                src={venta.comprobanteImagenUrl}
                alt="Comprobante Bancario"
                className="w-10 h-10 object-cover rounded border border-slate-300"
              />
              <div>
                <p className="font-semibold text-slate-900">Comprobante de Pago Adjunto</p>
                <p className="text-[10px] text-slate-500">
                  Referencia: {venta.comprobanteReferencia || 'S/N'}
                </p>
              </div>
            </div>
            <a
              href={venta.comprobanteImagenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1 font-medium"
            >
              <span>Ver Completo</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Tabla de Artículos Vendidos */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Artículos Incluidos en la Venta ({venta.detalles?.length || 0})
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Producto / Dispositivo</th>
                  <th className="py-2.5 px-3">Identificador Serial / IMEI</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">P. Unitario</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  {isAdmin && <th className="py-2.5 px-3 text-right">Margen (3FN)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!venta.detalles || venta.detalles.length === 0) ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-4 text-center text-slate-400">
                      Sin detalles de artículos registrados.
                    </td>
                  </tr>
                ) : (
                  venta.detalles.map((det: any, idx: number) => {
                    const isDisp = det.tipoItem === 'DISPOSITIVO';
                    const disp = det.dispositivo;
                    const acc = det.loteAccesorio;

                    const nombreProd = isDisp
                      ? `${disp?.variante?.modelo?.nombreModelo || 'iPhone'} (${disp?.variante?.color || ''} ${disp?.variante?.capacidadGb ? `${disp.variante.capacidadGb}GB` : ''})`
                      : `${acc?.accesorio?.nombre || 'Accesorio'} [${acc?.nombreDiferenciador || 'Lote'}]`;

                    const imeiInfo = isDisp
                      ? disp?.imei1
                        ? `IMEI 1: ${disp.imei1}${disp.imei2 ? ` • IMEI 2: ${disp.imei2}` : ''} • S/N: ${disp.numeroSerie || 'N/A'}`
                        : `S/N: ${disp?.numeroSerie || 'N/A'}`
                      : 'N/A (Lote)';

                    const subtotal = Number(det.subtotalBs || 0);
                    const costoUnit = Number(det.costoUnitarioBs || 0);
                    const cantidad = Number(det.cantidad || 1);
                    const gananciaItem = subtotal - (costoUnit * cantidad);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            {isDisp ? (
                              <Smartphone className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                            ) : (
                              <Package className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-900">{nombreProd}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-slate-600">
                          {imeiInfo}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          {cantidad}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          Bs {Number(det.precioUnitarioBs || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          Bs {subtotal.toFixed(2)}
                        </td>
                        {isAdmin && (
                          <td className="py-2 px-3 text-right font-mono text-[11px]">
                            {costoUnit > 0 ? (
                              <span className="text-emerald-700 font-semibold">
                                +Bs {gananciaItem.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">S/D</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tarjeta de Permuta / Trade-In (si existe en la venta) */}
        {montoPermuta > 0 && (
          <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                <RefreshCw className="h-4 w-4 text-emerald-700" />
                <span>Teléfono Recibido en Permuta (Trade-In de Cliente)</span>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded-full">
                Crédito: - Bs {montoPermuta.toFixed(2)}
              </span>
            </div>

            {venta.permutaDispositivo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-900 block">Modelo Recibido</span>
                  <span className="font-bold text-slate-900">
                    {venta.permutaDispositivo.variante?.modelo?.nombreModelo || 'iPhone'}{' '}
                    {venta.permutaDispositivo.variante?.color}{' '}
                    {venta.permutaDispositivo.variante?.capacidadGb > 0
                      ? `${venta.permutaDispositivo.variante.capacidadGb}GB`
                      : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-emerald-900 block">Identificador IMEI 1</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {venta.permutaDispositivo.imei1 || 'S/N'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-emerald-900 block">Batería & Estado</span>
                  <span className="font-semibold text-slate-900">
                    {venta.permutaDispositivo.porcentajeBateria
                      ? `${venta.permutaDispositivo.porcentajeBateria}% Batería`
                      : 'Condición Normal'}{' '}
                    • DISPONIBLE
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-900">
                Se aplicó un crédito por retoma de equipo de <strong>Bs {montoPermuta.toFixed(2)}</strong> contra el subtotal de la compra.
              </p>
            )}
          </div>
        )}

        {/* Resumen Financiero Total */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Items Carrito:</span>
              <span className="font-mono font-medium">Bs {montoTotal.toFixed(2)}</span>
            </div>
            {montoPermuta > 0 && (
              <div className="flex justify-between font-semibold text-emerald-700">
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Crédito Permuta Aplicado:
                </span>
                <span className="font-mono">- Bs {montoPermuta.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Neto Cobrado:</span>
              <span className="font-mono text-xl tracking-tight">
                Bs {saldoCobrado.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Margen 3FN exclusivo para administradores */}
          {isAdmin && costoTotal > 0 && (
            <div className="pt-2 mt-1 border-t border-dashed border-slate-200 flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-medium">
                Costo Mercadería (CMV): <strong className="text-slate-700 font-mono">Bs {costoTotal.toFixed(2)}</strong>
              </span>
              <span className="text-emerald-800 font-bold font-mono bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded">
                Ganancia Neta Real: +Bs {gananciaNeta.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Pie de Modal */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
        <Button
          type="button"
          variant="outline"
          className="text-xs"
          onClick={() => printReceipt(venta)}
          title="Reimprimir comprobante térmico oficial"
        >
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          Imprimir Ticket Térmico
        </Button>
        <Button
          type="button"
          className="text-xs"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
