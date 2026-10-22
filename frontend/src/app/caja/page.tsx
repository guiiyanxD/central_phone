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
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  ShoppingCart,
  Smartphone,
  Package,
  User,
  Clock,
  FileText,
  Truck,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatNombreCaja } from '@/lib/utils';

export default function CajaDiariaPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  // Estados de la sesión activa
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [categoriasGasto, setCategoriasGasto] = useState<any[]>([]);

  // Estados de Historial Paginado y Filtrado
  const [historialCajas, setHistorialCajas] = useState<any[]>([]);
  const [historialMeta, setHistorialMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [sucursalesList, setSucursalesList] = useState<any[]>([]);
  const [usuariosList, setUsuariosList] = useState<any[]>([]);

  // Filtros aplicables
  const [filtroSucursalId, setFiltroSucursalId] = useState<string>('TODAS');
  const [filtroUsuarioId, setFiltroUsuarioId] = useState<string>('TODOS');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
  const [filtroSearch, setFiltroSearch] = useState<string>('');
  const [searchDebounce, setSearchDebounce] = useState<string>('');

  // Pestañas
  const [activeTab, setActiveTab] = useState<'turno' | 'historial' | 'recepciones'>('turno');

  // Estados de Recepciones de Mercadería (Auditoría ADMIN)
  const [recepcionesList, setRecepcionesList] = useState<any[]>([]);
  const [recepcionesMeta, setRecepcionesMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoadingRecepciones, setIsLoadingRecepciones] = useState(false);
  const [proveedoresList, setProveedoresList] = useState<any[]>([]);

  // Filtros de Recepciones
  const [filtroRecSucursalId, setFiltroRecSucursalId] = useState<string>('TODAS');
  const [filtroRecProveedorId, setFiltroRecProveedorId] = useState<string>('TODOS');
  const [filtroRecFechaDesde, setFiltroRecFechaDesde] = useState<string>('');
  const [filtroRecFechaHasta, setFiltroRecFechaHasta] = useState<string>('');
  const [filtroRecSearch, setFiltroRecSearch] = useState<string>('');
  const [searchRecDebounce, setSearchRecDebounce] = useState<string>('');

  // Modal Detalle Financiero de Recepción
  const [modalRecDetalleOpen, setModalRecDetalleOpen] = useState(false);
  const [recepcionDetalleData, setRecepcionDetalleData] = useState<any | null>(null);
  const [isLoadingRecDetalle, setIsLoadingRecDetalle] = useState(false);
  const [recDetalleTab, setRecDetalleTab] = useState<'dispositivos' | 'accesorios'>('dispositivos');

  const handleOpenRecDetalle = async (id: number) => {
    setIsLoadingRecDetalle(true);
    setModalRecDetalleOpen(true);
    setRecepcionDetalleData(null);
    setRecDetalleTab('dispositivos');
    try {
      const data = await api.recepcion.getNotaIngresoById(id);
      setRecepcionDetalleData(data);
    } catch (err: any) {
      console.error('Error al cargar detalle financiero de la recepción:', err);
    } finally {
      setIsLoadingRecDetalle(false);
    }
  };

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

  // Modal Detalle de Caja con Ventas y Gastos (Auditoría ADMIN)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [cajaDetalleData, setCajaDetalleData] = useState<any | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
  const [detalleTab, setDetalleTab] = useState<'ventas' | 'gastos' | 'arqueo'>('ventas');

  const handleOpenDetalle = async (cajaId: number) => {
    setIsLoadingDetalle(true);
    setModalDetalleOpen(true);
    setCajaDetalleData(null);
    setDetalleTab('ventas');
    try {
      const data = await api.caja.getDetalle(cajaId);
      setCajaDetalleData(data);
    } catch (err: any) {
      console.error('Error al cargar detalle de caja:', err);
    } finally {
      setIsLoadingDetalle(false);
    }
  };

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
      const [cats, sucs, usrs, provs] = await Promise.all([
        api.caja.getCategoriasGasto().catch(() => []),
        api.sucursales.getAll().catch(() => []),
        api.caja.getUsuarios().catch(() => []),
        api.proveedores.getAll().catch(() => []),
      ]);
      setCategoriasGasto(cats);
      if (cats.length > 0) setGastoCategoriaId(cats[0].id);
      setSucursalesList(sucs);
      setUsuariosList(usrs);
      setProveedoresList(provs);
    } catch {
      // Silencioso
    }
  };

  const fetchHistorial = async (pageToFetch = 1, currentLimit = historialMeta.limit) => {
    setIsLoadingHistorial(true);
    try {
      const res: any = await api.caja.getHistorial({
        page: pageToFetch,
        limit: currentLimit,
        sucursalId: filtroSucursalId !== 'TODAS' ? Number(filtroSucursalId) : undefined,
        usuarioId: filtroUsuarioId !== 'TODOS' ? Number(filtroUsuarioId) : undefined,
        fechaDesde: filtroFechaDesde || undefined,
        fechaHasta: filtroFechaHasta || undefined,
        search: searchDebounce.trim() || undefined,
      });

      if (Array.isArray(res)) {
        // Compatibilidad defensiva si la respuesta es un arreglo directo
        const total = res.length;
        const totalPages = Math.ceil(total / currentLimit) || 1;
        const start = (pageToFetch - 1) * currentLimit;
        const paginatedData = res.slice(start, start + currentLimit);

        setHistorialCajas(paginatedData);
        setHistorialMeta({
          total,
          page: pageToFetch,
          limit: currentLimit,
          totalPages,
          hasNextPage: pageToFetch < totalPages,
          hasPrevPage: pageToFetch > 1,
        });
      } else {
        setHistorialCajas(res?.data || []);
        setHistorialMeta(res?.meta || {
          total: res?.data?.length || 0,
          page: pageToFetch,
          limit: currentLimit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err) {
      console.error('Error al cargar historial de cajas:', err);
      setHistorialCajas([]);
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  const handleResetFiltros = () => {
    setFiltroSucursalId('TODAS');
    setFiltroUsuarioId('TODOS');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroSearch('');
    setSearchDebounce('');
  };

  const fetchRecepciones = async (pageToFetch = 1, currentLimit = recepcionesMeta.limit) => {
    if (!isAdmin) return;
    setIsLoadingRecepciones(true);
    try {
      const res: any = await api.recepcion.getNotasIngreso({
        page: pageToFetch,
        limit: currentLimit,
        sucursalId: filtroRecSucursalId !== 'TODAS' ? Number(filtroRecSucursalId) : undefined,
        proveedorId: filtroRecProveedorId !== 'TODOS' ? Number(filtroRecProveedorId) : undefined,
        fechaDesde: filtroRecFechaDesde || undefined,
        fechaHasta: filtroRecFechaHasta || undefined,
        search: searchRecDebounce.trim() || undefined,
      });

      if (res && 'data' in res && 'meta' in res) {
        setRecepcionesList(res.data);
        setRecepcionesMeta(res.meta);
      } else if (Array.isArray(res)) {
        const total = res.length;
        const totalPages = Math.ceil(total / currentLimit) || 1;
        const start = (pageToFetch - 1) * currentLimit;
        const paginatedData = res.slice(start, start + currentLimit);

        setRecepcionesList(paginatedData);
        setRecepcionesMeta({
          total,
          page: pageToFetch,
          limit: currentLimit,
          totalPages,
          hasNextPage: pageToFetch < totalPages,
          hasPrevPage: pageToFetch > 1,
        });
      }
    } catch (err) {
      console.error('Error al cargar recepciones de mercadería:', err);
      setRecepcionesList([]);
    } finally {
      setIsLoadingRecepciones(false);
    }
  };

  const handleResetFiltrosRecepcion = () => {
    setFiltroRecSucursalId('TODAS');
    setFiltroRecProveedorId('TODOS');
    setFiltroRecFechaDesde('');
    setFiltroRecFechaHasta('');
    setFiltroRecSearch('');
    setSearchRecDebounce('');
  };

  // Debounce para búsqueda textual de historial de cajas
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(filtroSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [filtroSearch]);

  // Debounce para búsqueda textual de recepciones
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchRecDebounce(filtroRecSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [filtroRecSearch]);

  useEffect(() => {
    fetchSession();
    fetchMasterData();
  }, [user]);

  // Recargar historial al cambiar filtros o pestaña activa
  useEffect(() => {
    if (activeTab === 'historial') {
      fetchHistorial(1);
    }
  }, [activeTab, filtroSucursalId, filtroUsuarioId, filtroFechaDesde, filtroFechaHasta, searchDebounce]);

  // Recargar recepciones al cambiar filtros o pestaña activa
  useEffect(() => {
    if (activeTab === 'recepciones' && isAdmin) {
      fetchRecepciones(1);
    }
  }, [activeTab, filtroRecSucursalId, filtroRecProveedorId, filtroRecFechaDesde, filtroRecFechaHasta, searchRecDebounce, isAdmin]);

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
      if (activeTab === 'historial') {
        fetchHistorial(1);
      }
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
              {isCajaAbierta
                ? `Caja Abierta • ${sessionData?.caja?.sucursal?.nombre || user?.sucursal?.nombre || 'Tienda'}`
                : 'Caja Cerrada'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Control de ingresos en mostrador, registro de gastos autorizados y arqueo ciego al cierre de caja.
          </p>
        </div>

        {/* Pestañas de Vista (ID-DS-004) */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'turno' | 'historial' | 'recepciones')}
          className="w-auto"
        >
          <TabsList variant="pill">
            <TabsTrigger value="turno" variant="pill">
              Caja Actual
            </TabsTrigger>
            <TabsTrigger value="historial" variant="pill">
              Historial de Cajas ({historialMeta.total})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="recepciones" variant="pill">
                Recepciones de Mercadería ({recepcionesMeta.total})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Banner de Resultado de Cierre reciente si existe */}
      {cierreResult && (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-5 text-slate-900 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-slate-800" />
              <p className="font-bold text-sm">
                {formatNombreCaja(
                  cierreResult.fechaCierre || cierreResult.fechaApertura,
                  cierreResult.sucursal?.nombre || user?.sucursal?.nombre
                )}{' '}
                Cerrada Exitosamente
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

      {activeTab === 'turno' && (
        isCajaAbierta ? (
          /* VISTA CUANDO LA CAJA ESTÁ ABIERTA */
          <div className="space-y-6">
            {/* KPI Cards de Caja */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Saldo Disponible en Efectivo */}
              <Card data-testid="kpi-efectivo-gaveta" className="border-slate-200 bg-white shadow-subtle">
                <CardHeader className="p-4 pb-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Efectivo en Gaveta</span>
                    <DollarSign className="h-4 w-4 text-slate-900" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1 font-mono">
                    {isAdmin
                      ? `Bs ${rf?.saldoEfectivoEnCaja.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                      : 'Bs ••••••'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    {isAdmin ? 'Inicial + Ventas Efec. - Gastos' : 'Protegido'}
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

            {/* Barra de Acciones de la Caja */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-subtle">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {formatNombreCaja(
                      sessionData.caja.fechaApertura,
                      sessionData.caja.sucursal?.nombre || user?.sucursal?.nombre
                    )}{' '}
                    • Abierta por {sessionData.caja.usuarioApertura?.nombre}
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

            {/* Listas de Movimientos de la Caja (Ventas & Egresos) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas Registradas en la Caja */}
              <Card className="border-slate-200">
                <CardHeader className="p-4 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Ventas de la Caja ({sessionData.caja.ventas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-72 overflow-y-auto">
                  {sessionData.caja.ventas.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No se han procesado ventas en esta caja todavía.
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
                      Sin egresos registrados en esta caja.
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
                  Apertura de Caja
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
                    <Label htmlFor="montoApertura" required>Monto Inicial en Efectivo (Bs)</Label>
                    <Input
                      id="montoApertura"
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
                    <Label htmlFor="obsApertura">Observaciones de Apertura (Opcional)</Label>
                    <Input
                      id="obsApertura"
                      placeholder="Ej: Billetes fraccionados para cambio"
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
                    Abrir Caja
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {activeTab === 'historial' && (
        /* HISTORIAL DE ARQUEOS Y CIERRES ANTERIORES */
        <div className="space-y-4">
          {/* BARRA DE FILTROS Y BÚSQUEDA */}
          <Card className="border-slate-200 bg-white shadow-subtle p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* Buscador Textual */}
              <div className="lg:col-span-4">
                <Label htmlFor="filtroSearch" className="text-xs text-slate-600 mb-1 block">
                  Búsqueda Rápida
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="filtroSearch"
                    placeholder="Buscar por ID, cajero, sucursal u obs..."
                    value={filtroSearch}
                    onChange={(e) => setFiltroSearch(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>

              {/* Selector de Sucursal */}
              <div className="lg:col-span-2">
                <Label htmlFor="filtroSucursal" className="text-xs text-slate-600 mb-1 block">
                  Sucursal
                </Label>
                <Select
                  id="filtroSucursal"
                  value={filtroSucursalId}
                  onChange={(e) => setFiltroSucursalId(e.target.value)}
                  className="text-xs h-9"
                >
                  <option value="TODAS">Todas las sucursales</option>
                  {sucursalesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Selector de Usuario / Cajero */}
              <div className="lg:col-span-2">
                <Label htmlFor="filtroUsuario" className="text-xs text-slate-600 mb-1 block">
                  Cajero / Usuario
                </Label>
                <Select
                  id="filtroUsuario"
                  value={filtroUsuarioId}
                  onChange={(e) => setFiltroUsuarioId(e.target.value)}
                  className="text-xs h-9"
                >
                  <option value="TODOS">Todos los cajeros</option>
                  {usuariosList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.rol})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Rango de Fechas: Desde */}
              <div className="lg:col-span-1.5 sm:col-span-1">
                <Label htmlFor="filtroFechaDesde" className="text-xs text-slate-600 mb-1 block">
                  Desde
                </Label>
                <Input
                  id="filtroFechaDesde"
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* Rango de Fechas: Hasta */}
              <div className="lg:col-span-1.5 sm:col-span-1">
                <Label htmlFor="filtroFechaHasta" className="text-xs text-slate-600 mb-1 block">
                  Hasta
                </Label>
                <Input
                  id="filtroFechaHasta"
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* Botón Reset */}
              <div className="lg:col-span-1 sm:col-span-2 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFiltros}
                  className="w-full h-9 text-xs flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900"
                  title="Restablecer todos los filtros"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="sm:hidden lg:hidden">Limpiar</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* TABLA DE RESULTADOS */}
          <Card className="border-slate-200 overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Caja & Fechas</th>
                    <th className="py-3 px-4">Cajero / Sucursal</th>
                    <th className="py-3 px-4">Monto Inicial</th>
                    <th className="py-3 px-4">Saldo Teórico</th>
                    <th className="py-3 px-4">Conteo Físico Real</th>
                    <th className="py-3 px-4">Diferencia</th>
                    <th className="py-3 px-4">Justificación de Auditoría</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingHistorial ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`skel-${i}`}>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-36 mb-1" /><Skeleton className="h-3 w-20" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3.5 px-4 text-center"><Skeleton className="h-7 w-20 mx-auto rounded" /></td>
                      </tr>
                    ))
                  ) : historialCajas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <History className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No se encontraron cajas con los filtros seleccionados.</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Prueba cambiando el rango de fechas, sucursal o término de búsqueda.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-xs"
                          onClick={handleResetFiltros}
                        >
                          Limpiar Filtros
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    historialCajas.map((c) => {
                      const dif = Number(c.diferenciaEfectivo) || 0;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono">
                            <p className="font-bold text-slate-900">
                              {formatNombreCaja(c.fechaApertura, c.sucursal?.nombre)}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Cierre: {new Date(c.fechaCierre || c.fechaApertura).toLocaleDateString('es-BO')}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{c.usuarioApertura?.nombre}</p>
                            <p className="text-[10px] text-slate-500">
                              {c.sucursal?.nombre}
                              {c.usuarioCierre && c.usuarioCierre.id !== c.usuarioApertura?.id && (
                                <span className="text-slate-400"> • Cerró: {c.usuarioCierre.nombre}</span>
                              )}
                            </p>
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
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1.5 border-slate-300 text-slate-700 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all shadow-xs"
                              onClick={() => handleOpenDetalle(c.id)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Ver Detalle</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* PIE DE PAGINACIÓN */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 shadow-subtle">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Mostrando{' '}
                <strong className="text-slate-900">
                  {historialMeta.total === 0 ? 0 : (historialMeta.page - 1) * historialMeta.limit + 1}
                </strong>{' '}
                -{' '}
                <strong className="text-slate-900">
                  {Math.min(historialMeta.page * historialMeta.limit, historialMeta.total)}
                </strong>{' '}
                de <strong className="text-slate-900">{historialMeta.total}</strong> cajas cerradas
              </span>

              {/* Selector de filas por página */}
              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                <span className="text-slate-500">Filas:</span>
                <select
                  value={historialMeta.limit}
                  onChange={(e) => {
                    const newLim = Number(e.target.value);
                    setHistorialMeta((prev) => ({ ...prev, limit: newLim }));
                    fetchHistorial(1, newLim);
                  }}
                  className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 mr-1">
                Página {historialMeta.page} de {historialMeta.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={!historialMeta.hasPrevPage || isLoadingHistorial}
                onClick={() => fetchHistorial(historialMeta.page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={!historialMeta.hasNextPage || isLoadingHistorial}
                onClick={() => fetchHistorial(historialMeta.page + 1)}
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE RECEPCIONES DE MERCADERÍA (AUDITORÍA FINANCIERA ADMIN) */}
      {isAdmin && activeTab === 'recepciones' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS Y BÚSQUEDA */}
          <Card className="border-slate-200 bg-white shadow-subtle p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* Buscador Textual */}
              <div className="lg:col-span-4">
                <Label htmlFor="filtroRecSearch" className="text-xs text-slate-600 mb-1 block">
                  Búsqueda Rápida
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="filtroRecSearch"
                    placeholder="Buscar por comprobante, proveedor u observaciones..."
                    value={filtroRecSearch}
                    onChange={(e) => setFiltroRecSearch(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>

              {/* Selector de Sucursal */}
              <div className="lg:col-span-2">
                <Label htmlFor="filtroRecSucursal" className="text-xs text-slate-600 mb-1 block">
                  Sucursal
                </Label>
                <Select
                  id="filtroRecSucursal"
                  value={filtroRecSucursalId}
                  onChange={(e) => setFiltroRecSucursalId(e.target.value)}
                  className="text-xs h-9"
                >
                  <option value="TODAS">Todas las sucursales</option>
                  {sucursalesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Selector de Proveedor */}
              <div className="lg:col-span-2">
                <Label htmlFor="filtroRecProveedor" className="text-xs text-slate-600 mb-1 block">
                  Proveedor
                </Label>
                <Select
                  id="filtroRecProveedor"
                  value={filtroRecProveedorId}
                  onChange={(e) => setFiltroRecProveedorId(e.target.value)}
                  className="text-xs h-9"
                >
                  <option value="TODOS">Todos los proveedores</option>
                  {proveedoresList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Rango de Fechas */}
              <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="filtroRecFechaDesde" className="text-xs text-slate-600 mb-1 block">
                    Desde
                  </Label>
                  <Input
                    id="filtroRecFechaDesde"
                    type="date"
                    value={filtroRecFechaDesde}
                    onChange={(e) => setFiltroRecFechaDesde(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="filtroRecFechaHasta" className="text-xs text-slate-600 mb-1 block">
                    Hasta
                  </Label>
                  <Input
                    id="filtroRecFechaHasta"
                    type="date"
                    value={filtroRecFechaHasta}
                    onChange={(e) => setFiltroRecFechaHasta(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Botón Limpiar */}
              <div className="lg:col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFiltrosRecepcion}
                  className="w-full h-9 text-xs gap-1 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  title="Restablecer filtros"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline lg:hidden">Limpiar</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* TABLA DE RECEPCIONES */}
          <Card className="border-slate-200 bg-white shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">
                  Historial de Recepciones de Mercadería
                </h2>
                <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-300 text-slate-700">
                  Auditoría de Inventario Valorizado
                </Badge>
              </div>
              <span className="text-xs text-slate-500">
                {recepcionesMeta.total} {recepcionesMeta.total === 1 ? 'recepción registrada' : 'recepciones registradas'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Código / Nota</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Nro Comprobante</th>
                    <th className="py-3 px-4 text-center">Ítems Ingresados</th>
                    <th className="py-3 px-4 text-right">Inversión Total (Bs)</th>
                    <th className="py-3 px-4">Receptor</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoadingRecepciones ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3.5 px-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                        <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3.5 px-4 text-center"><Skeleton className="h-7 w-24 mx-auto rounded" /></td>
                      </tr>
                    ))
                  ) : recepcionesList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <Truck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No se encontraron recepciones con los filtros seleccionados.</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Prueba cambiando el rango de fechas, sucursal o proveedor.</p>
                      </td>
                    </tr>
                  ) : (
                    recepcionesList.map((rec) => {
                      const dispCount = rec._count?.dispositivos || 0;
                      const lotesCount = rec._count?.lotesAccesorio || 0;
                      const totalCosto = Number(rec.totalCostoBs || 0);

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            #ING-{rec.id}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {new Date(rec.fechaIngreso).toLocaleString('es-BO', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">{rec.sucursal?.nombre}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="font-semibold bg-slate-50 border-slate-200 text-slate-800">
                              {rec.proveedor?.nombre}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {rec.numeroComprobante || <span className="text-slate-400 italic">S/N</span>}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="font-semibold text-slate-900">{dispCount}</span>{' '}
                            <span className="text-slate-500 text-[11px]">tel.</span>
                            {' • '}
                            <span className="font-semibold text-slate-900">{lotesCount}</span>{' '}
                            <span className="text-slate-500 text-[11px]">lotes</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            Bs {totalCosto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {rec.usuario?.nombre || 'Desconocido'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1.5 border-slate-300 text-slate-700 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all shadow-xs"
                              onClick={() => handleOpenRecDetalle(rec.id)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Ver Detalle</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* PIE DE PAGINACIÓN */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 shadow-subtle">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Mostrando{' '}
                <strong className="text-slate-900">
                  {recepcionesMeta.total === 0 ? 0 : (recepcionesMeta.page - 1) * recepcionesMeta.limit + 1}
                </strong>{' '}
                -{' '}
                <strong className="text-slate-900">
                  {Math.min(recepcionesMeta.page * recepcionesMeta.limit, recepcionesMeta.total)}
                </strong>{' '}
                de <strong className="text-slate-900">{recepcionesMeta.total}</strong> recepciones
              </span>

              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                <span className="text-slate-500">Filas:</span>
                <select
                  value={recepcionesMeta.limit}
                  onChange={(e) => {
                    const newLim = Number(e.target.value);
                    setRecepcionesMeta((prev) => ({ ...prev, limit: newLim }));
                    fetchRecepciones(1, newLim);
                  }}
                  className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 mr-1">
                Página {recepcionesMeta.page} de {recepcionesMeta.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={!recepcionesMeta.hasPrevPage || isLoadingRecepciones}
                onClick={() => fetchRecepciones(recepcionesMeta.page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={!recepcionesMeta.hasNextPage || isLoadingRecepciones}
                onClick={() => fetchRecepciones(recepcionesMeta.page + 1)}
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
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
            <Label htmlFor="gastoCategoriaId" required>Categoría de Gasto</Label>
            <Select
              id="gastoCategoriaId"
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
            <Label htmlFor="gastoMonto" required>Monto en Bolivianos (Bs)</Label>
            <Input
              id="gastoMonto"
              type="number"
              step="0.50"
              min="0.50"
              placeholder="Ej: 25.00"
              value={gastoMonto || ''}
              onChange={(e) => setGastoMonto(parseFloat(e.target.value) || 0)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {isAdmin
                ? `Disponible en efectivo: Bs ${rf?.saldoEfectivoEnCaja.toFixed(2)}`
                : 'Fondos disponibles en caja activa'}
            </p>
          </div>

          <div>
            <Label htmlFor="gastoConcepto" required>Concepto / Motivo</Label>
            <Input
              id="gastoConcepto"
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
        title={
          sessionData?.caja
            ? `Cierre y Arqueo: ${formatNombreCaja(
                sessionData.caja.fechaApertura,
                sessionData.caja.sucursal?.nombre || user?.sucursal?.nombre
              )}`
            : 'Cierre y Arqueo de Caja'
        }
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
            <Label htmlFor="conteoFisico" required>Efectivo Físico Contado (Bs)</Label>
            <Input
              id="conteoFisico"
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
            <Label htmlFor="justificacionCierre">Justificación en Caso de Descuadre</Label>
            <Input
              id="justificacionCierre"
              placeholder="Obligatorio si existe sobrante o faltante respecto al sistema"
              value={justificacionCierre}
              onChange={(e) => setJustificacionCierre(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="obsCierre">Observaciones de Cierre (Opcional)</Label>
            <Input
              id="obsCierre"
              placeholder="Ej: Conteo verificado, sin novedades"
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

      {/* MODAL DETALLE DE CAJA CON VENTAS Y GASTOS (AUDITORÍA ADMIN) */}
      <Modal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
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
              onClick={() => setModalDetalleOpen(false)}
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

                {/* CONTENIDO DE PESTAÑAS CON SCROLL INTERNO */}
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

                      {/* JUSTIFICACIÓN OBLIGATORIA DEL ARQUEO */}
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
                    onClick={() => setModalDetalleOpen(false)}
                  >
                    Cerrar Detalle
                  </Button>
                </div>
              </div>
            );
          })()
        )}
      </Modal>

      {/* MODAL DETALLE FINANCIERO DE RECEPCIÓN (AUDITORÍA ADMIN) */}
      <Modal
        isOpen={modalRecDetalleOpen}
        onClose={() => setModalRecDetalleOpen(false)}
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
              onClick={() => setModalRecDetalleOpen(false)}
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
                  {/* Card 1: Inversión Total */}
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

                  {/* Card 2: Unidades Físicas */}
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

                  {/* Card 3: Progreso Comercial & Ventas Realizadas (Tarjeta Unificada UI/UX) */}
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

                    {/* Barra de progreso de recuperación visual */}
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

                  {/* Card 4: Rentabilidad y Margen */}
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
                    onClick={() => setModalRecDetalleOpen(false)}
                  >
                    Cerrar Detalle
                  </Button>
                </div>
              </div>
            );
          })()
        )}
      </Modal>
    </div>
  );
}
