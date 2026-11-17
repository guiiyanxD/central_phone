import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Package,
  AlertCircle,
  AlertOctagon,
  Wrench,
  Eye,
  CheckCircle2,
  X,
  Plus,
  DollarSign,
  Calendar,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCondicionDispositivo } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { ModalLineaVida } from '@/features/inventario/components/modal-linea-vida';
import {
  ModalEditarDispositivoInline,
  DispositivoEditableData,
} from '@/features/inventario/components/modal-editar-dispositivo-inline';

const getLocalDateTimeString = (date: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

interface ModalAuditoriaRecepcionProps {
  isOpen: boolean;
  onClose: () => void;
  recepcionDetalleData: any;
  isLoadingRecDetalle: boolean;
  onRefreshDetalle?: () => void;
  onUpdated?: () => void;
}

export function ModalAuditoriaRecepcion({
  isOpen,
  onClose,
  recepcionDetalleData,
  isLoadingRecDetalle,
  onRefreshDetalle,
  onUpdated,
}: ModalAuditoriaRecepcionProps) {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [recDetalleTab, setRecDetalleTab] = useState<'dispositivos' | 'accesorios'>('dispositivos');

  // Estados para modal de Línea de Vida
  const [selectedImeiForLifeline, setSelectedImeiForLifeline] = useState<string | null>(null);

  // Estado para modal de Edición Inline de Dispositivo (Exclusivo ADMIN)
  const [editingDispositivo, setEditingDispositivo] = useState<DispositivoEditableData | null>(null);

  // Estados para modal de Registrar Gasto
  const [gastoModalOpen, setGastoModalOpen] = useState(false);
  const [dispositivoParaGasto, setDispositivoParaGasto] = useState<any | null>(null);
  const [conceptoGasto, setConceptoGasto] = useState('');
  const [costoBsGasto, setCostoBsGasto] = useState<number | ''>('');
  const [fechaGasto, setFechaGasto] = useState('');
  const [observacionGasto, setObservacionGasto] = useState('');
  const [aplicoEnCajaGasto, setAplicoEnCajaGasto] = useState(true);
  const [isSubmittingGasto, setIsSubmittingGasto] = useState(false);
  const [gastoFormError, setGastoFormError] = useState<string | null>(null);
  const [gastoSuccessMsg, setGastoSuccessMsg] = useState<string | null>(null);

  // Temporizador de auto-cierre para feedback de éxito
  useEffect(() => {
    if (!gastoSuccessMsg) return;
    const timer = setTimeout(() => {
      setGastoSuccessMsg(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [gastoSuccessMsg]);

  const handleOpenGastoModal = (disp: any) => {
    setDispositivoParaGasto(disp);
    setConceptoGasto('');
    setCostoBsGasto('');
    setFechaGasto(getLocalDateTimeString(new Date()));
    setObservacionGasto('');
    setAplicoEnCajaGasto(true);
    setGastoFormError(null);
    setGastoModalOpen(true);
  };

  const handleSaveGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispositivoParaGasto) return;

    if (!conceptoGasto.trim()) {
      setGastoFormError('El concepto del gasto es obligatorio.');
      return;
    }

    if (typeof costoBsGasto !== 'number' || costoBsGasto <= 0) {
      setGastoFormError('El costo del gasto debe ser un número mayor a 0 Bs.');
      return;
    }

    setIsSubmittingGasto(true);
    setGastoFormError(null);

    try {
      await api.modelos.addGastoDispositivo(dispositivoParaGasto.id, {
        concepto: conceptoGasto.trim(),
        costoBs: costoBsGasto,
        fechaGasto: fechaGasto ? new Date(fechaGasto).toISOString() : undefined,
        observacion: observacionGasto.trim() || undefined,
        aplicoEnCaja: aplicoEnCajaGasto,
      });

      setGastoSuccessMsg(
        `Gasto "${conceptoGasto.trim()}" (Bs ${costoBsGasto.toFixed(2)}) registrado exitosamente.`
      );
      setGastoModalOpen(false);
      onRefreshDetalle?.();
      onUpdated?.();
    } catch (err: any) {
      setGastoFormError(
        err instanceof ApiError ? err.message : 'Error al registrar el gasto de reparación.'
      );
    } finally {
      setIsSubmittingGasto(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        recepcionDetalleData
          ? recepcionDetalleData.tipoIngreso === 'PERMUTA'
            ? `Auditoría de Permuta: Nota #ING-${recepcionDetalleData.id}`
            : `Auditoría Financiera: Nota de Ingreso #ING-${recepcionDetalleData.id}`
          : 'Detalle Financiero de Recepción'
      }
      description={
        recepcionDetalleData
          ? `Comprobante: ${recepcionDetalleData.numeroComprobante || 'S/N'} • ${
              recepcionDetalleData.tipoIngreso === 'PERMUTA' ? 'Cliente Particular' : 'Proveedor'
            }: ${recepcionDetalleData.proveedor?.nombre} • Sucursal: ${recepcionDetalleData.sucursal?.nombre}`
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
              {recepcionDetalleData.estado === 'ANULADA' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertOctagon className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-900 uppercase tracking-wide">
                      Nota de Ingreso Anulada
                    </span>
                    {recepcionDetalleData.anuladaEn && (
                      <span className="text-rose-700 ml-1">
                        el {new Date(recepcionDetalleData.anuladaEn).toLocaleString('es-BO')}
                      </span>
                    )}
                    {recepcionDetalleData.motivoAnulacion && (
                      <p className="mt-0.5 text-rose-700">
                        <span className="font-semibold text-rose-900">Motivo:</span> {recepcionDetalleData.motivoAnulacion}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Metadatos de la Entrega */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400">
                      {recepcionDetalleData.tipoIngreso === 'PERMUTA' ? 'Cliente Particular:' : 'Proveedor:'}
                    </span>{' '}
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
                    Bs {Number(rf.inversionTotalBs ?? rf.totalCostoBs ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {Number(rf.totalGastosBs || 0) > 0 ? (
                    <p className="text-[10px] text-purple-700 font-medium mt-0.5 font-mono">
                      Toma: Bs {Number(rf.totalCostoBs || 0).toFixed(2)} • Gastos: Bs {Number(rf.totalGastosBs).toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 font-mono">
                      $ {Number(rf.totalCostoUsd || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                  )}
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

              {/* Mensaje de éxito si se registró un gasto */}
              {gastoSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between text-xs animate-in fade-in">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {gastoSuccessMsg}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGastoSuccessMsg(null)}
                    className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md"
                    aria-label="Cerrar notificación"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

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
                          <th className="py-2.5 px-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dispositivos.map((d: any) => {
                          const costo = Number(d.costoBs || 0);
                          const costoUsd = Number(d.costoUsd || 0);
                          const gastosInvertidos = Number(
                            d.gastosInvertidosBs ??
                              (Array.isArray(d.gastos)
                                ? d.gastos.reduce((s: number, g: any) => s + (Number(g.costoBs) || 0), 0)
                                : 0)
                          );
                          const inversionTotal = Number(d.inversionTotalBs ?? (costo + gastosInvertidos));
                          const precioSugerido = Number(d.precioVentaSugeridoBs || 0);
                          const margen = precioSugerido - inversionTotal;
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
                                {d.detallesFisicos && (
                                  <p className="text-[10px] text-slate-600 bg-slate-100 rounded px-1.5 py-0.5 mt-1 border border-slate-200 w-fit">
                                    <span className="font-semibold text-slate-700">Registro:</span> {d.detallesFisicos}
                                  </p>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px]">
                                <p className="text-slate-900 font-semibold">S/N: {d.numeroSerie}</p>
                                {d.imei1 && <p className="text-slate-500">IMEI: {d.imei1}</p>}
                                {d.imei2 && <p className="text-slate-400">IMEI 2: {d.imei2}</p>}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {formatCondicionDispositivo(d.condicion)}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                                <div>Bs {costo.toFixed(2)}</div>
                                {gastosInvertidos > 0 && (
                                  <>
                                    <div className="text-[10px] text-purple-700 font-bold" title="Gastos de puesta a punto">
                                      (+Bs {gastosInvertidos.toFixed(2)})
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-normal">
                                      Inv: Bs {inversionTotal.toFixed(2)}
                                    </div>
                                  </>
                                )}
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
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {isAdmin && !isSold && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 text-xs gap-1 border-amber-300 text-amber-800 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-xs"
                                      onClick={() => {
                                        setEditingDispositivo({
                                          id: d.id,
                                          modelo: d.variante?.modelo?.nombreModelo,
                                          color: d.variante?.color,
                                          capacidadGb: d.variante?.capacidadGb,
                                          numeroSerie: d.numeroSerie,
                                          imei1: d.imei1,
                                          imei2: d.imei2,
                                          porcentajeBateria: d.porcentajeBateria,
                                          detallesFisicos: d.detallesFisicos,
                                          costoBs: d.costoBs,
                                          estadoInventario: d.estadoInventario,
                                        });
                                      }}
                                      title="Editar información técnica y costo del equipo (Admin)"
                                      aria-label={`Editar información técnica y costo del equipo ${d.variante?.modelo?.nombreModelo || ''}`}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      <span>Editar</span>
                                    </Button>
                                  )}
                                  {!isSold && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-xs"
                                      onClick={() => handleOpenGastoModal(d)}
                                      title="Registrar gasto técnico para este equipo"
                                      aria-label={`Registrar gasto técnico para el equipo ${d.numeroSerie || ''}`}
                                    >
                                      <Wrench className="h-3.5 w-3.5" />
                                      <span>+ Gasto</span>
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                    onClick={() => setSelectedImeiForLifeline(d.imei1 || d.numeroSerie)}
                                    title="Consultar Línea de Vida completa"
                                    aria-label={`Consultar Línea de Vida completa para el equipo ${d.numeroSerie || ''}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
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

      {/* SUB-MODAL: REGISTRAR GASTO TÉCNICO DESDE RECEPCIÓN */}
      {gastoModalOpen && dispositivoParaGasto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Registrar Gasto Técnico</h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {dispositivoParaGasto.variante?.modelo?.nombreModelo || 'iPhone'} • S/N: {dispositivoParaGasto.numeroSerie}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGastoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                aria-label="Cerrar ventana de registro de gasto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {gastoFormError && (
              <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{gastoFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGasto} className="p-4 space-y-3">
              <div>
                <Label htmlFor="recGastoConcepto" className="text-xs font-semibold text-slate-700">
                  Concepto del Gasto <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="recGastoConcepto"
                  value={conceptoGasto}
                  onChange={(e) => setConceptoGasto(e.target.value)}
                  placeholder="Ej: Cambio de pantalla OLED, Batería original, Flex..."
                  className="mt-1 text-xs"
                  disabled={isSubmittingGasto}
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label htmlFor="recGastoCosto" className="text-xs font-semibold text-slate-700">
                    Costo (Bs) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="recGastoCosto"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={costoBsGasto}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCostoBsGasto(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="150.00"
                      className="pl-8 text-xs font-mono font-bold text-slate-900"
                      disabled={isSubmittingGasto}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recGastoFecha" className="text-xs font-semibold text-slate-700">
                    Fecha y Hora <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="recGastoFecha"
                    type="datetime-local"
                    value={fechaGasto}
                    onChange={(e) => setFechaGasto(e.target.value)}
                    className="mt-1 text-xs font-mono"
                    disabled={isSubmittingGasto}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recGastoObs" className="text-xs font-semibold text-slate-700">
                  Observación Adicional
                </Label>
                <Input
                  id="recGastoObs"
                  value={observacionGasto}
                  onChange={(e) => setObservacionGasto(e.target.value)}
                  placeholder="Repuesto provisto por taller externo, garantía 30 días..."
                  className="mt-1 text-xs"
                  disabled={isSubmittingGasto}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recGastoCaja"
                  checked={aplicoEnCajaGasto}
                  onChange={(e) => setAplicoEnCajaGasto(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                  disabled={isSubmittingGasto}
                />
                <label htmlFor="recGastoCaja" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Aplica como egreso en la caja del turno activo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGastoModalOpen(false)}
                  disabled={isSubmittingGasto}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingGasto}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-medium"
                >
                  {isSubmittingGasto ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Guardando...
                    </>
                  ) : (
                    'Registrar Gasto'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LÍNEA DE VIDA VINCULADO DIRECTO */}
      {selectedImeiForLifeline && (
        <ModalLineaVida
          isOpen={Boolean(selectedImeiForLifeline)}
          onClose={() => setSelectedImeiForLifeline(null)}
          imei={selectedImeiForLifeline}
          onUpdated={() => {
            onRefreshDetalle?.();
            onUpdated?.();
          }}
        />
      )}

      {/* SUB-MODAL: EDICIÓN INLINE DE DISPOSITIVO PARA ADMIN */}
      {editingDispositivo && (
        <ModalEditarDispositivoInline
          isOpen={Boolean(editingDispositivo)}
          onClose={() => setEditingDispositivo(null)}
          dispositivo={editingDispositivo}
          onSuccess={() => {
            onRefreshDetalle?.();
            onUpdated?.();
          }}
        />
      )}
    </Modal>
  );
}
