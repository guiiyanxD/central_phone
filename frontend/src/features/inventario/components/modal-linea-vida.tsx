'use client';

import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Truck,
  Building2,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Ban,
  DollarSign,
  Calendar,
  AlertTriangle,
  Battery,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { cn, formatCondicionDispositivo } from '@/lib/utils';

interface ModalLineaVidaProps {
  isOpen: boolean;
  onClose: () => void;
  imei: string | null;
}

export function ModalLineaVida({ isOpen, onClose, imei }: ModalLineaVidaProps) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para gestión de gastos (Creación, Edición y Anulación)
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [gastoModo, setGastoModo] = useState<'crear' | 'editar'>('crear');
  const [editingGastoId, setEditingGastoId] = useState<number | null>(null);
  const [conceptoGasto, setConceptoGasto] = useState('');
  const [costoBsGasto, setCostoBsGasto] = useState<number | ''>('');
  const [fechaGasto, setFechaGasto] = useState('');
  const [observacionGasto, setObservacionGasto] = useState('');
  const [aplicoEnCajaGasto, setAplicoEnCajaGasto] = useState(true);
  const [isSubmittingGasto, setIsSubmittingGasto] = useState(false);
  const [gastoFormError, setGastoFormError] = useState<string | null>(null);

  const getLocalDateTimeString = (date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Modal para anulación de gasto (Exclusivo ADMIN)
  const [modalAnularGastoOpen, setModalAnularGastoOpen] = useState(false);
  const [gastoParaAnular, setGastoParaAnular] = useState<any | null>(null);
  const [motivoAnulacionGasto, setMotivoAnulacionGasto] = useState('');
  const [isAnulandoGasto, setIsAnulandoGasto] = useState(false);
  const [gastoSuccessMsg, setGastoSuccessMsg] = useState<string | null>(null);

  const fetchLineaVida = () => {
    if (!imei) return;
    setIsLoading(true);
    setError(null);

    api.modelos
      .getLineaVida(imei)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : 'No se pudo obtener la línea de vida del dispositivo.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!isOpen || !imei) {
      setData(null);
      setError(null);
      setGastoSuccessMsg(null);
      return;
    }
    fetchLineaVida();
  }, [isOpen, imei]);

  // Manejo de formulario de Gasto (Crear / Editar)
  const handleOpenCrearGasto = () => {
    setGastoModo('crear');
    setEditingGastoId(null);
    setConceptoGasto('');
    setCostoBsGasto('');
    setFechaGasto(getLocalDateTimeString(new Date()));
    setObservacionGasto('');
    setAplicoEnCajaGasto(true);
    setGastoFormError(null);
    setModalGastoOpen(true);
  };

  const handleOpenEditarGasto = (gasto: any) => {
    setGastoModo('editar');
    setEditingGastoId(gasto.id);
    setConceptoGasto(gasto.concepto);
    setCostoBsGasto(Number(gasto.costoBs));
    const fg = gasto.fechaGasto || gasto.fechaRegistro;
    setFechaGasto(fg ? getLocalDateTimeString(new Date(fg)) : getLocalDateTimeString(new Date()));
    setObservacionGasto(gasto.observacion || '');
    setAplicoEnCajaGasto(gasto.aplicoEnCaja);
    setGastoFormError(null);
    setModalGastoOpen(true);
  };

  const handleSaveGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGastoFormError(null);

    if (!conceptoGasto.trim()) {
      setGastoFormError('El concepto del gasto es obligatorio.');
      return;
    }
    if (typeof costoBsGasto !== 'number' || costoBsGasto <= 0) {
      setGastoFormError('El costo del gasto debe ser un monto numérico mayor a 0.');
      return;
    }

    const payloadFecha = fechaGasto ? new Date(fechaGasto).toISOString() : new Date().toISOString();

    setIsSubmittingGasto(true);
    try {
      if (gastoModo === 'crear') {
        await api.modelos.addGastoDispositivo(data.dispositivo.id, {
          concepto: conceptoGasto.trim(),
          costoBs: costoBsGasto,
          observacion: observacionGasto.trim() || undefined,
          aplicoEnCaja: aplicoEnCajaGasto,
          fechaGasto: payloadFecha,
        });
        setGastoSuccessMsg(`Gasto "${conceptoGasto.trim()}" (Bs ${costoBsGasto.toFixed(2)}) agregado exitosamente.`);
      } else if (editingGastoId) {
        await api.modelos.updateGastoDispositivo(editingGastoId, {
          concepto: conceptoGasto.trim(),
          costoBs: costoBsGasto,
          observacion: observacionGasto.trim() || undefined,
          fechaGasto: payloadFecha,
        });
        setGastoSuccessMsg(`Gasto actualizado correctamente. Precio sugerido recalculado.`);
      }

      setModalGastoOpen(false);
      fetchLineaVida();
    } catch (err: any) {
      setGastoFormError(err.message || 'Error al guardar el gasto.');
    } finally {
      setIsSubmittingGasto(false);
    }
  };

  // Manejo de Anulación de Gasto (Exclusivo ADMIN)
  const handleOpenAnularGasto = (gasto: any) => {
    setGastoParaAnular(gasto);
    setMotivoAnulacionGasto('');
    setModalAnularGastoOpen(true);
  };

  const handleConfirmAnulacionGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gastoParaAnular) return;
    if (!motivoAnulacionGasto.trim()) {
      alert('El motivo de anulación es obligatorio para auditoría.');
      return;
    }

    setIsAnulandoGasto(true);
    try {
      await api.modelos.anularGastoDispositivo(gastoParaAnular.id, {
        motivo: motivoAnulacionGasto.trim(),
      });
      setGastoSuccessMsg(
        `Gasto de Bs ${Number(gastoParaAnular.costoBs).toFixed(2)} anulado. Se revirtió el costo en el precio sugerido.`
      );
      setModalAnularGastoOpen(false);
      setGastoParaAnular(null);
      fetchLineaVida();
    } catch (err: any) {
      alert(err.message || 'Error al anular el gasto.');
    } finally {
      setIsAnulandoGasto(false);
    }
  };

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
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
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
          {gastoSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between text-xs animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                {gastoSuccessMsg}
              </span>
              <button
                type="button"
                onClick={() => setGastoSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Header Resumen del Dispositivo */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Smartphone className="h-5 w-5 text-slate-300" />
                <h3 className="text-sm font-bold tracking-tight">
                  {data.dispositivo.modelo}
                </h3>
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded border font-bold',
                    data.dispositivo.condicion === 'PERMUTA'
                      ? 'bg-purple-900/60 border-purple-500/50 text-purple-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  )}
                >
                  {formatCondicionDispositivo(data.dispositivo.condicion)}
                </span>
                {data.dispositivo.porcentajeBateria && (
                  <span className="text-[10px] bg-blue-900/60 border border-blue-500/50 text-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Battery className="h-3 w-3" />
                    {data.dispositivo.porcentajeBateria}% Salud
                  </span>
                )}
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
                {data.dispositivo.detallesFisicos && (
                  <span className="text-purple-300">
                    <strong>Registro:</strong> {data.dispositivo.detallesFisicos}
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
              <div className="mt-2 text-right">
                <p className="text-xs text-emerald-400 font-bold font-mono">
                  P. Sug: Bs {data.dispositivo.precioVentaSugeridoBs.toFixed(2)}
                  {data.dispositivo.costoUsd !== undefined ? ` ($ ${(Number(data.dispositivo.costoUsd) * 1.15).toFixed(2)})` : ''}
                </p>
                {isAdmin && data.dispositivo.inversionTotalBs !== undefined && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Inversión: Bs {data.dispositivo.inversionTotalBs.toFixed(2)}
                    {data.dispositivo.costoUsd !== undefined ? ` ($ ${Number(data.dispositivo.costoUsd).toFixed(2)})` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Cronológico */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {/* ETAPA 1: RECEPCIÓN / PERMUTA */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center ring-4 ring-white">
                <Truck className="h-3 w-3" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    1. Ingreso al Sistema ({data.dispositivo.condicion === 'PERMUTA' ? 'Permuta' : 'Recepción Mayorista'} #{data.origen.notaIngresoId})
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
                    <span className="text-slate-500">Proveedor / Cliente:</span>{' '}
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
                      Bs {Number(data.origen.costoUnitarioBs).toFixed(2)}
                      {data.origen.costoUnitarioUsd ? ` (USD ${Number(data.origen.costoUnitarioUsd).toFixed(2)})` : ''}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* ETAPA INTERMEDIA: GASTOS DE REPARACIÓN E INVERSIÓN */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-purple-700 text-white flex items-center justify-center ring-4 ring-white">
                <Wrench className="h-3 w-3" />
              </div>
              <div className="bg-purple-50/40 border border-purple-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      Gastos de Reparación e Inversión
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-800 border-purple-300">
                      Total Activo: Bs {Number(data.dispositivo.totalGastosActivosBs || 0).toFixed(2)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCrearGasto}
                    className="h-7 text-xs border-purple-300 bg-white hover:bg-purple-100 text-purple-900 font-semibold"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Registrar Gasto
                  </Button>
                </div>

                {(!data.dispositivo.gastos || data.dispositivo.gastos.length === 0) ? (
                  <div className="py-4 text-center text-slate-400 text-xs italic bg-white/60 rounded border border-purple-100">
                    No se han registrado gastos de reparación para este equipo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.dispositivo.gastos.map((g: any) => {
                      const isAnulado = g.estado === 'ANULADO';
                      return (
                        <div
                          key={g.id}
                          className={cn(
                            'p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors',
                            isAnulado
                              ? 'bg-rose-50/50 border-rose-200 opacity-75'
                              : 'bg-white border-purple-200/80 shadow-xs'
                          )}
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn('font-bold', isAnulado ? 'line-through text-slate-500' : 'text-slate-900')}>
                                {g.concepto}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[9px] py-0 px-1 font-semibold',
                                  isAnulado
                                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                )}
                              >
                                {isAnulado ? 'ANULADO' : 'ACTIVO'}
                              </Badge>
                              {g.aplicoEnCaja && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                                  Caja Diaria
                                </span>
                              )}
                            </div>
                            {g.observacion && (
                              <p className="text-[11px] text-slate-500">{g.observacion}</p>
                            )}
                            <p className="text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-700">Fecha del Gasto:</span>{' '}
                              {new Date(g.fechaGasto || g.fechaRegistro).toLocaleString('es-BO', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                              {' '}• Registrado por: {g.usuario?.nombre || 'Usuario'}
                            </p>
                            {isAnulado && (
                              <p className="text-[10px] text-rose-700 font-medium">
                                Anulado por: {g.anuladoPor?.nombre || 'Admin'} • Motivo: {g.motivoAnulacion}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <span
                              className={cn(
                                'font-mono font-bold text-sm',
                                isAnulado ? 'line-through text-slate-400' : 'text-purple-900'
                              )}
                            >
                              Bs {Number(g.costoBs).toFixed(2)}
                            </span>

                            {!isAnulado && (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditarGasto(g)}
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                                  title="Editar Gasto"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenAnularGasto(g)}
                                    className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700"
                                    title="Anular Gasto (Exclusivo Admin)"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ETAPA 2: UBICACIÓN EN INVENTARIO */}
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
                    {data.dispositivo.sucursalActual?.ciudad || 'Santa Cruz'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-500">Sucursal Actual:</span>{' '}
                    <strong className="text-slate-800">
                      {data.dispositivo.sucursalActual?.nombre || 'Sucursal Principal'}
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
                    ? (data.garantia.diasRestantesGarantia ?? 0) <= 15
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                    : data.garantia.garantiaVigente === false
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                )}
              >
                {data.garantia.garantiaVigente ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <ShieldAlert className="h-3 w-3" />
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    4. Cobertura de Garantía
                  </span>
                  {data.garantia.garantiaVigente !== null ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded border',
                          data.garantia.garantiaVigente
                            ? (data.garantia.diasRestantesGarantia ?? 0) <= 15
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        )}
                      >
                        {data.garantia.garantiaVigente
                          ? (data.garantia.diasRestantesGarantia ?? 0) <= 15
                            ? 'POR VENCER'
                            : 'VIGENTE'
                          : 'VENCIDA'}
                      </span>
                      {data.garantia.garantiaVigente ? (
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded border',
                            (data.garantia.diasRestantesGarantia ?? 0) <= 15
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                        >
                          Quedan {data.garantia.diasRestantesGarantia} días
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-medium">
                          Expiró hace {data.garantia.diasVencida ?? Math.max(0, (data.garantia.diasDesdeVenta ?? 0) - (data.garantia.diasTotalesGarantia || 90))} días
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Pendiente de Venta (Garantía no iniciada)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Período Estándar:</span>
                    <strong className="text-slate-800">
                      {data.garantia.periodoMeses} Meses ({data.garantia.diasTotalesGarantia || 90} días)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Fecha de Venta:</span>
                    <strong className="text-slate-800">
                      {data.venta?.fechaVenta
                        ? new Date(data.venta.fechaVenta).toLocaleDateString('es-BO')
                        : 'No vendido'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Días Transcurridos:</span>
                    <strong className="text-slate-800">
                      {data.garantia.diasDesdeVenta !== null
                        ? `${data.garantia.diasDesdeVenta} días`
                        : '0 días (En Tienda)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Días Restantes:</span>
                    <strong
                      className={cn(
                        'text-xs font-bold',
                        data.garantia.garantiaVigente
                          ? (data.garantia.diasRestantesGarantia ?? 0) <= 15
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                          : 'text-slate-400'
                      )}
                    >
                      {data.garantia.diasRestantesGarantia !== null
                        ? `${data.garantia.diasRestantesGarantia} días`
                        : 'No aplica'}
                    </strong>
                  </div>
                </div>

                {/* Barra de progreso de cobertura de garantía */}
                {data.garantia.garantiaVigente !== null && (
                  <div className="space-y-1 pt-1.5 border-t border-slate-200/70">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Garantía consumida:
                      </span>
                      <span className="font-mono font-semibold text-slate-700">
                        {Math.min(100, Math.round(((data.garantia.diasDesdeVenta ?? 0) / (data.garantia.diasTotalesGarantia || 90)) * 100))}%
                        {' '}({data.garantia.diasDesdeVenta ?? 0}/{data.garantia.diasTotalesGarantia || 90} días)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          data.garantia.garantiaVigente
                            ? (data.garantia.diasRestantesGarantia ?? 0) <= 15
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-rose-500'
                        )}
                        style={{
                          width: `${Math.min(100, Math.round(((data.garantia.diasDesdeVenta ?? 0) / (data.garantia.diasTotalesGarantia || 90)) * 100))}%`,
                        }}
                      />
                    </div>
                    {data.garantia.fechaVencimientoGarantia && (
                      <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>
                          Inicio: <strong className="text-slate-700">{data.venta?.fechaVenta ? new Date(data.venta.fechaVenta).toLocaleDateString('es-BO') : '-'}</strong>
                        </span>
                        <span>
                          Vence: <strong className="text-slate-700">{new Date(data.garantia.fechaVencimientoGarantia).toLocaleDateString('es-BO')}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SUB-MODAL: REGISTRAR O EDITAR GASTO */}
          {modalGastoOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-purple-700" />
                    {gastoModo === 'crear' ? 'Registrar Gasto en Teléfono' : 'Modificar Gasto Registrado'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setModalGastoOpen(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {gastoFormError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                    {gastoFormError}
                  </div>
                )}

                <form onSubmit={handleSaveGasto} className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Concepto del Gasto <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: Cambio de pantalla OLED, Batería, etc."
                      value={conceptoGasto}
                      onChange={(e) => setConceptoGasto(e.target.value)}
                      className="text-xs h-9"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Costo en Bolivianos (Bs) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">Bs</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={costoBsGasto}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                          setCostoBsGasto(val);
                        }}
                        className="text-xs h-9 pl-9 font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Fecha y Hora del Gasto <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      value={fechaGasto}
                      onChange={(e) => setFechaGasto(e.target.value)}
                      className="text-xs h-9 bg-white"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Momento en que se realizó el gasto (por defecto la fecha y hora actual).
                    </span>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Observación / Proveedor Repuesto
                    </Label>
                    <Input
                      placeholder="Ej: Repuesto adquirido con factura"
                      value={observacionGasto}
                      onChange={(e) => setObservacionGasto(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  {gastoModo === 'crear' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="cajaGastoModal"
                        checked={aplicoEnCajaGasto}
                        onChange={(e) => setAplicoEnCajaGasto(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="cajaGastoModal" className="text-xs font-medium text-slate-700 cursor-pointer">
                        Restar egreso de la Caja Diaria actual
                      </label>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalGastoOpen(false)}
                      disabled={isSubmittingGasto}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingGasto}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-semibold"
                    >
                      {isSubmittingGasto ? 'Guardando...' : gastoModo === 'crear' ? 'Registrar Gasto' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SUB-MODAL: ANULAR GASTO (EXCLUSIVO ADMIN) */}
          {modalAnularGastoOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Anular Gasto (Exclusivo Administrador)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setModalAnularGastoOpen(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                  <p className="font-semibold">
                    ¿Estás seguro de anular el gasto &ldquo;{gastoParaAnular?.concepto}&rdquo; de Bs {Number(gastoParaAnular?.costoBs).toFixed(2)}?
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Esta acción restará el costo del precio sugerido del equipo. No se borra físicamente de la base de datos (trazabilidad inmutable).
                  </p>
                </div>

                <form onSubmit={handleConfirmAnulacionGasto} className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                      Motivo de Anulación <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: Error en el registro del repuesto..."
                      value={motivoAnulacionGasto}
                      onChange={(e) => setMotivoAnulacionGasto(e.target.value)}
                      className="text-xs h-9"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalAnularGastoOpen(false)}
                      disabled={isAnulandoGasto}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isAnulandoGasto}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                      {isAnulandoGasto ? 'Anulando...' : 'Confirmar Anulación'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
