'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Plus,
  Lock,
  Unlock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  History,
  QrCode,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function CajaDiariaPage() {
  const { user } = useAuth();

  // Estados de la sesión activa
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [categoriasGasto, setCategoriasGasto] = useState<any[]>([]);
  const [historialCajas, setHistorialCajas] = useState<any[]>([]);

  // Pestañas
  const [activeTab, setActiveTab] = useState<'turno' | 'historial'>('turno');

  // Modal Apertura
  const [montoApertura, setMontoApertura] = useState<number>(300);
  const [obsApertura, setObsApertura] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [openingError, setOpeningError] = useState<string | null>(null);

  // Modal Registro de Gasto
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [gastoCategoriaId, setGastoCategoriaId] = useState<number>(1);
  const [gastoMonto, setGastoMonto] = useState<number>(0);
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [isSavingGasto, setIsSavingGasto] = useState(false);
  const [gastoError, setGastoError] = useState<string | null>(null);

  // Modal Arqueo Ciego de Cierre
  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [conteoFisico, setConteoFisico] = useState<number>(0);
  const [justificacionCierre, setJustificacionCierre] = useState('');
  const [obsCierre, setObsCierre] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [cierreError, setCierreError] = useState<string | null>(null);
  const [cierreResult, setCierreResult] = useState<any | null>(null);

  const fetchSession = async () => {
    setIsLoadingSession(true);
    try {
      const data = await api.caja.getActiva();
      setSessionData(data);
    } catch {
      setSessionData(null);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [cats, hist] = await Promise.all([
        api.caja.getCategoriasGasto(),
        api.caja.getHistorial(),
      ]);
      setCategoriasGasto(cats);
      if (cats.length > 0) setGastoCategoriaId(cats[0].id);
      setHistorialCajas(hist);
    } catch {
      // Manejar error silenciosamente
    }
  };

  useEffect(() => {
    fetchSession();
    fetchMasterData();
  }, [user]);

  // Manejador de Apertura de Caja
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpening(true);
    setOpeningError(null);

    try {
      await api.caja.abrir({
        sucursalId: user?.sucursal?.id || 1,
        montoInicialEfectivo: Number(montoApertura) || 0,
        observaciones: obsApertura.trim() || undefined,
      });
      await fetchSession();
    } catch (err: any) {
      setOpeningError(err.message || 'Error al abrir la caja.');
    } finally {
      setIsOpening(false);
    }
  };

  // Manejador de Registro de Gasto Menor (US13)
  const handleRegistrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData?.caja?.id || gastoMonto <= 0 || !gastoConcepto.trim()) return;

    setIsSavingGasto(true);
    setGastoError(null);

    try {
      await api.caja.registrarGasto(sessionData.caja.id, {
        categoriaId: Number(gastoCategoriaId),
        montoBs: Number(gastoMonto),
        concepto: gastoConcepto.trim(),
      });
      setModalGastoOpen(false);
      setGastoMonto(0);
      setGastoConcepto('');
      await fetchSession();
    } catch (err: any) {
      setGastoError(err.message || 'Error al registrar el gasto.');
    } finally {
      setIsSavingGasto(false);
    }
  };

  // Manejador de Arqueo Ciego de Cierre (US12)
  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData?.caja?.id) return;

    setIsClosing(true);
    setCierreError(null);

    try {
      const res = await api.caja.cerrar(sessionData.caja.id, {
        montoFinalEfectivo: Number(conteoFisico) || 0,
        justificacion: justificacionCierre.trim() || undefined,
        observaciones: obsCierre.trim() || undefined,
      });
      setCierreResult(res);
      setModalCierreOpen(false);
      await fetchSession();
      await fetchMasterData();
    } catch (err: any) {
      setCierreError(err.message || 'Error al cerrar la caja.');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const isCajaAbierta = !!sessionData?.caja;
  const rf = sessionData?.resumenFinanciero;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Caja Diaria & Control de Efectivo
            </h1>
            <Badge variant={isCajaAbierta ? 'success' : 'secondary'}>
              {isCajaAbierta ? 'Turno Activo' : 'Caja Cerrada'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Control de ingresos en mostrador, registro de gastos autorizados y arqueo ciego al cierre de turno.
          </p>
        </div>

        {/* Pestañas de Vista */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('turno')}
            className={cn(
              'px-3 py-1.5 rounded-md transition-colors',
              activeTab === 'turno'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Turno Actual
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={cn(
              'px-3 py-1.5 rounded-md transition-colors',
              activeTab === 'historial'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Historial de Arqueos ({historialCajas.length})
          </button>
        </div>
      </div>

      {/* Banner de Resultado de Cierre reciente si existe */}
      {cierreResult && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-5 text-slate-900 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-slate-800" />
              <p className="font-bold text-sm">
                Turno de Caja #{cierreResult.id} Cerrado Exitosamente
              </p>
            </div>
            <button
              onClick={() => setCierreResult(null)}
              className="text-xs font-semibold text-slate-700 hover:underline"
            >
              Cerrar Aviso
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Conteo físico registrado: <strong className="text-slate-900">Bs {Number(cierreResult.montoFinalEfectivo).toFixed(2)}</strong> |
            Saldo teórico esperado: <strong className="text-slate-900">Bs {Number(cierreResult.montoTeoricoEfectivo).toFixed(2)}</strong> |
            Diferencia de arqueo:{' '}
            <strong className="text-slate-900">
              Bs {Number(cierreResult.diferenciaEfectivo).toFixed(2)}
            </strong>
          </p>
        </div>
      )}

      {activeTab === 'turno' ? (
        isCajaAbierta ? (
          /* VISTA CUANDO LA CAJA ESTÁ ABIERTA */
          <div className="space-y-6">
            {/* KPI Cards de Caja */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Saldo Disponible en Efectivo */}
              <Card className="border-slate-200 bg-white shadow-subtle">
                <CardHeader className="p-4 pb-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Efectivo en Gaveta</span>
                    <DollarSign className="h-4 w-4 text-slate-900" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                    Bs {rf?.saldoEfectivoEnCaja.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Inicial + Ventas Efec. - Gastos
                  </p>
                </CardContent>
              </Card>

              {/* Total Ventas en Efectivo */}
              <Card className="border-slate-200 bg-white shadow-subtle">
                <CardHeader className="p-4 pb-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Ventas en Efectivo</span>
                    <TrendingUp className="h-4 w-4 text-slate-900" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                    Bs {rf?.totalVentasEfectivo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    {sessionData.caja.ventas.filter((v: any) => v.metodoPago.codigo === 'EFECTIVO').length} tickets
                  </p>
                </CardContent>
              </Card>

              {/* Cobros Digitales (QR Oficial) */}
              <Card className="border-slate-200 bg-white shadow-subtle">
                <CardHeader className="p-4 pb-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Cobros QR Oficial</span>
                    <QrCode className="h-4 w-4 text-slate-900" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                    Bs {rf?.totalVentasDigitales.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Depositado en cuenta BCP
                  </p>
                </CardContent>
              </Card>

              {/* Gastos Menores Operativos */}
              <Card className="border-slate-200 bg-white shadow-subtle">
                <CardHeader className="p-4 pb-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Gastos de Caja</span>
                    <TrendingDown className="h-4 w-4 text-slate-900" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                    Bs {rf?.totalGastosEfectivo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    {sessionData.caja.gastosOperativos.length} egresos autorizados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Barra de Acciones del Turno */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-subtle">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Turno #{sessionData.caja.id} • Abierto por {sessionData.caja.usuarioApertura?.nombre}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Monto inicial de apertura: Bs {Number(sessionData.caja.montoInicialEfectivo).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs"
                  onClick={() => setModalGastoOpen(true)}
                >
                  <TrendingDown className="mr-1.5 h-3.5 w-3.5 text-slate-700" />
                  Registrar Gasto
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs bg-slate-900 hover:bg-slate-800"
                  onClick={() => {
                    setConteoFisico(0);
                    setJustificacionCierre('');
                    setModalCierreOpen(true);
                  }}
                >
                  <Lock className="mr-1.5 h-3.5 w-3.5" />
                  Arqueo & Cierre
                </Button>
              </div>
            </div>

            {/* Listas de Movimientos del Turno (Ventas & Egresos) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas Registradas en el Turno */}
              <Card className="border-slate-200">
                <CardHeader className="p-4 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Ventas del Turno ({sessionData.caja.ventas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-72 overflow-y-auto">
                  {sessionData.caja.ventas.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No se han procesado ventas en este turno todavía.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {sessionData.caja.ventas.map((v: any) => (
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
                    Egresos Menores ({sessionData.caja.gastosOperativos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-72 overflow-y-auto">
                  {sessionData.caja.gastosOperativos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Sin egresos registrados en este turno.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {sessionData.caja.gastosOperativos.map((g: any) => (
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
          </div>
        ) : (
          /* VISTA CUANDO LA CAJA ESTÁ CERRADA (FORMULARIO DE APERTURA) */
          <div className="max-w-md mx-auto py-8">
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="p-6 text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
                  <Unlock className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Apertura de Turno de Caja
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Ingresa el monto de cambio inicial en efectivo para habilitar el Punto de Venta.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                <form onSubmit={handleAbrirCaja} className="space-y-4">
                  {openingError && (
                    <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-slate-800 flex-shrink-0" />
                      <span>{openingError}</span>
                    </div>
                  )}

                  <div>
                    <Label required>Monto Inicial en Efectivo (Bs)</Label>
                    <Input
                      type="number"
                      step="0.50"
                      min="0"
                      placeholder="Ej: 300.00"
                      value={montoApertura || ''}
                      onChange={(e) => setMontoApertura(parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dinero físico disponible para cambio en gaveta.
                    </p>
                  </div>

                  <div>
                    <Label>Observaciones de Apertura (Opcional)</Label>
                    <Input
                      placeholder="Ej: Turno mañana, billetes fraccionados"
                      value={obsApertura}
                      onChange={(e) => setObsApertura(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isOpening}
                    loadingText="Abriendo caja..."
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    Iniciar Turno de Caja
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )
      ) : (
        /* HISTORIAL DE ARQUEOS Y CIERRES ANTERIORES */
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Turno & Fechas</th>
                  <th className="py-3 px-4">Cajero / Sucursal</th>
                  <th className="py-3 px-4">Monto Inicial</th>
                  <th className="py-3 px-4">Saldo Teórico</th>
                  <th className="py-3 px-4">Conteo Físico Real</th>
                  <th className="py-3 px-4">Diferencia</th>
                  <th className="py-3 px-4">Justificación de Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historialCajas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No hay registros de turnos de caja cerrados aún.
                    </td>
                  </tr>
                ) : (
                  historialCajas.map((c) => {
                    const dif = Number(c.diferenciaEfectivo) || 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono">
                          <p className="font-bold text-slate-900">Turno #{c.id}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(c.fechaCierre || c.fechaApertura).toLocaleDateString('es-BO')}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{c.usuarioApertura?.nombre}</p>
                          <p className="text-[10px] text-slate-500">{c.sucursal?.nombre}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          Bs {Number(c.montoInicialEfectivo).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          Bs {Number(c.montoTeoricoEfectivo || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          Bs {Number(c.montoFinalEfectivo || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-bold font-mono',
                              dif === 0
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-slate-900 text-white border border-slate-900'
                            )}
                          >
                            {dif > 0 ? `+Bs ${dif.toFixed(2)}` : `Bs ${dif.toFixed(2)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-[11px] text-slate-600 truncate">
                          {c.justificacion || (dif === 0 ? 'Exacto sin descuadre' : 'Sin justificación')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL PARA REGISTRO DE GASTO OPERATIVO (US13) */}
      <Modal
        isOpen={modalGastoOpen}
        onClose={() => setModalGastoOpen(false)}
        title="Registrar Egreso Menor de Caja"
        description="Salida autorizada de efectivo para compras rápidas de la tienda."
      >
        <form onSubmit={handleRegistrarGasto} className="space-y-4 pt-2">
          {gastoError && (
            <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-800 flex-shrink-0" />
              <span>{gastoError}</span>
            </div>
          )}

          <div>
            <Label required>Categoría de Gasto</Label>
            <Select
              value={gastoCategoriaId}
              onChange={(e) => setGastoCategoriaId(Number(e.target.value))}
            >
              {categoriasGasto.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Monto en Bolivianos (Bs)</Label>
            <Input
              type="number"
              step="0.50"
              min="0.50"
              placeholder="Ej: 25.00"
              value={gastoMonto || ''}
              onChange={(e) => setGastoMonto(parseFloat(e.target.value) || 0)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Disponible en efectivo: Bs {rf?.saldoEfectivoEnCaja.toFixed(2)}
            </p>
          </div>

          <div>
            <Label required>Concepto / Motivo</Label>
            <Input
              placeholder="Ej: Compra 5 chips Tigo para clientes de tienda"
              value={gastoConcepto}
              onChange={(e) => setGastoConcepto(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalGastoOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              isLoading={isSavingGasto}
              disabled={gastoMonto <= 0 || !gastoConcepto.trim()}
            >
              Registrar Egreso
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE ARQUEO FÍSICO A CIEGAS PARA CIERRE (US12) */}
      <Modal
        isOpen={modalCierreOpen}
        onClose={() => setModalCierreOpen(false)}
        title="Arqueo Físico de Cierre (Conteo a Ciegas)"
        description="Por regla de seguridad, debes ingresar el monto de efectivo que contaste físicamente en la gaveta."
      >
        <form onSubmit={handleCerrarCaja} className="space-y-4 pt-2">
          {cierreError && (
            <div className="p-3 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs">
              <p className="font-bold flex items-center gap-1.5 text-slate-900">
                <AlertTriangle className="h-4 w-4 text-slate-800" />
                Descuadre Detectado:
              </p>
              <p className="mt-1 text-slate-700">{cierreError}</p>
            </div>
          )}

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900">Arqueo a Ciegas:</p>
            <p className="text-slate-500">
              Cuenta todo el dinero en efectivo que tienes en mano (billetes y monedas) y digítalo a continuación.
              El sistema comparará tu conteo contra el balance teórico.
            </p>
          </div>

          <div>
            <Label required>Efectivo Físico Contado (Bs)</Label>
            <Input
              type="number"
              step="0.50"
              min="0"
              placeholder="0.00"
              value={conteoFisico || ''}
              onChange={(e) => setConteoFisico(parseFloat(e.target.value) || 0)}
              className="font-mono text-base font-bold"
            />
          </div>

          <div>
            <Label>Justificación en Caso de Descuadre</Label>
            <Input
              placeholder="Obligatorio si existe sobrante o faltante respecto al sistema"
              value={justificacionCierre}
              onChange={(e) => setJustificacionCierre(e.target.value)}
            />
          </div>

          <div>
            <Label>Observaciones de Cierre (Opcional)</Label>
            <Input
              placeholder="Ej: Turno concluido con normalidad"
              value={obsCierre}
              onChange={(e) => setObsCierre(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalCierreOpen(false)}
            >
              Volver
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isClosing}
            >
              Confirmar Arqueo y Cerrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
