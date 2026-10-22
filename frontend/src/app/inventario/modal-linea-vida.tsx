'use client';

import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Truck,
  Building2,
  Receipt,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Ban,
  CheckCircle2,
  DollarSign,
  Calendar,
  Phone,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ModalLineaVidaProps {
  isOpen: boolean;
  onClose: () => void;
  imei: string | null;
}

export function ModalLineaVida({ isOpen, onClose, imei }: ModalLineaVidaProps) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !imei) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api.modelos
      .getLineaVida(imei)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'No se pudo obtener la línea de vida del dispositivo.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, imei]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-800" />
          <span>Línea de Vida y Trazabilidad de Hardware</span>
        </div>
      }
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      {isLoading ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-900">{error}</p>
          <p className="text-xs text-slate-500">
            Verifica que el número de serie o IMEI sea correcto e intenta nuevamente.
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6 text-xs text-slate-700 py-2">
          {/* Header Resumen del Dispositivo */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-slate-300" />
                <h3 className="text-sm font-bold tracking-tight">
                  {data.dispositivo.modelo}
                </h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                  {data.dispositivo.condicion}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {data.dispositivo.color} •{' '}
                {data.dispositivo.capacidadGb > 0
                  ? data.dispositivo.capacidadGb >= 1024
                    ? `${data.dispositivo.capacidadGb / 1024}TB`
                    : `${data.dispositivo.capacidadGb}GB`
                  : 'Sin alm.'}{' '}
                • {data.dispositivo.tipoSim}
              </p>
              <div className="font-mono text-[11px] text-slate-300 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {data.dispositivo.imei1 && (
                  <span>
                    <strong>IMEI 1:</strong> {data.dispositivo.imei1}
                  </span>
                )}
                {data.dispositivo.imei2 && (
                  <span>
                    <strong>IMEI 2:</strong> {data.dispositivo.imei2}
                  </span>
                )}
                <span>
                  <strong>Serie (S/N):</strong> {data.dispositivo.numeroSerie}
                </span>
                {!data.dispositivo.imei1 && (
                  <span className="text-slate-400 italic">
                    (Identificado por Serial)
                  </span>
                )}
              </div>
            </div>

            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
              <span
                className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full border',
                  data.dispositivo.estadoInventario === 'DISPONIBLE'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : data.dispositivo.estadoInventario === 'VENDIDO'
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                )}
              >
                {data.dispositivo.estadoInventario}
              </span>
              <p className="text-xs text-slate-300 mt-2 font-mono">
                P. Sug: Bs {data.dispositivo.precioVentaSugeridoBs.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Timeline Cronológico */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {/* ETAPA 1: RECEPCIÓN MAYORISTA */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center ring-4 ring-white">
                <Truck className="h-3 w-3" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    1. Recepción Mayorista (Nota #{data.origen.notaIngresoId})
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(data.origen.fechaIngreso).toLocaleString('es-BO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Proveedor:</span>{' '}
                    <strong className="text-slate-800">{data.origen.proveedor}</strong>
                    {data.origen.proveedorTelefono && (
                      <span className="text-slate-400 ml-1">({data.origen.proveedorTelefono})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500">Comprobante:</span>{' '}
                    <strong className="text-slate-800">
                      {data.origen.numeroComprobante || 'S/N'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sucursal Destino:</span>{' '}
                    <strong className="text-slate-800">
                      {data.origen.sucursalIngreso || 'Almacén Central'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Receptor:</span>{' '}
                    <strong className="text-slate-800">
                      {data.origen.usuarioReceptor || 'Personal'}
                    </strong>
                  </div>
                </div>

                {data.origen.costoUnitarioBs !== undefined && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Costo Adquisición (Admin):
                    </span>
                    <strong className="font-mono text-slate-900">
                      Bs {Number(data.origen.costoUnitarioBs).toFixed(2)} (USD{' '}
                      {Number(data.origen.costoUnitarioUsd || 0).toFixed(2)})
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* ETAPA 2: ALMACÉN Y STOCK ACTUAL */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-slate-700 text-white flex items-center justify-center ring-4 ring-white">
                <Building2 className="h-3 w-3" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    2. Ubicación en Inventario
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {data.dispositivo.sucursalActual.ciudad}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-500">Sucursal Actual:</span>{' '}
                    <strong className="text-slate-800">
                      {data.dispositivo.sucursalActual.nombre}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Estado Físico:</span>{' '}
                    <strong className="text-slate-800">
                      {data.dispositivo.estadoInventario}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ETAPA 3: TRANSACCIÓN DE VENTA */}
            <div className="relative">
              <div
                className={cn(
                  'absolute -left-6 top-0.5 h-5 w-5 rounded-full text-white flex items-center justify-center ring-4 ring-white',
                  data.venta
                    ? data.venta.estadoVenta === 'ANULADA'
                      ? 'bg-rose-600'
                      : 'bg-emerald-600'
                    : 'bg-slate-300'
                )}
              >
                {data.venta ? (
                  data.venta.estadoVenta === 'ANULADA' ? (
                    <Ban className="h-3 w-3" />
                  ) : (
                    <Receipt className="h-3 w-3" />
                  )
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </div>

              {data.venta ? (
                <div
                  className={cn(
                    'border rounded-lg p-3.5 space-y-2.5',
                    data.venta.estadoVenta === 'ANULADA'
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-emerald-50/30 border-emerald-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      3. Venta en Mostrador (Ticket #{data.venta.ticketReferencia})
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded border',
                        data.venta.estadoVenta === 'ANULADA'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      )}
                    >
                      {data.venta.estadoVenta}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">Fecha de Venta:</span>{' '}
                      <strong className="text-slate-800">
                        {new Date(data.venta.fechaVenta).toLocaleString('es-BO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Vendedor:</span>{' '}
                      <strong className="text-slate-800">{data.venta.vendedor}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Cliente:</span>{' '}
                      <strong className="text-slate-800">
                        {data.venta.cliente ? data.venta.cliente.nombre : 'Cliente Mostrador'}
                      </strong>
                      {data.venta.cliente?.telefono && (
                        <span className="text-slate-500 ml-1">
                          ({data.venta.cliente.telefono})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Método de Pago:</span>{' '}
                      <strong className="text-slate-800">{data.venta.metodoPago}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Precio Final Cobrado:</span>
                    <strong className="font-mono text-slate-900 text-xs">
                      Bs {Number(data.venta.precioVentaCobradoBs).toFixed(2)}
                    </strong>
                  </div>

                  {data.venta.gananciaBs !== undefined && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700">
                      <span>Margen / Ganancia Neta (Admin):</span>
                      <strong className="font-mono">
                        +Bs {Number(data.venta.gananciaBs).toFixed(2)}
                      </strong>
                    </div>
                  )}

                  {data.venta.estadoVenta === 'ANULADA' && (
                    <div className="mt-2 p-2.5 bg-rose-100/70 border border-rose-200 rounded text-[11px] text-rose-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                        Transacción Anulada por Administración
                      </p>
                      <p>
                        <strong>Motivo:</strong> {data.venta.motivoAnulacion || 'Sin motivo'}
                      </p>
                      <p className="text-[10px] text-rose-700">
                        Autorizado por: {data.venta.anuladoPor || 'Administrador'} •{' '}
                        {data.venta.fechaAnulacion &&
                          new Date(data.venta.fechaAnulacion).toLocaleString('es-BO')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 italic">
                  3. Este equipo aún no cuenta con registros de venta. Se encuentra disponible en catálogo.
                </div>
              )}
            </div>

            {/* ETAPA 4: ESTADO DE GARANTÍA */}
            <div className="relative">
              <div
                className={cn(
                  'absolute -left-6 top-0.5 h-5 w-5 rounded-full text-white flex items-center justify-center ring-4 ring-white',
                  data.garantia.garantiaVigente
                    ? 'bg-emerald-600'
                    : 'bg-slate-400'
                )}
              >
                {data.garantia.garantiaVigente ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <ShieldAlert className="h-3 w-3" />
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    4. Cobertura de Garantía
                  </span>
                  {data.garantia.garantiaVigente !== null ? (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded border',
                        data.garantia.garantiaVigente
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      )}
                    >
                      {data.garantia.garantiaVigente ? 'VIGENTE' : 'VENCIDA'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Pendiente de Venta
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Período Estándar:</span>{' '}
                    <strong className="text-slate-800">
                      {data.garantia.periodoMeses} Meses (365 días)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Días Transcurridos:</span>{' '}
                    <strong className="text-slate-800">
                      {data.garantia.diasDesdeVenta !== null
                        ? `${data.garantia.diasDesdeVenta} días`
                        : '0 días (En Tienda)'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
