'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

import { CajaHeader } from '@/features/caja/components/caja-header';
import { CajaResumenCards } from '@/features/caja/components/caja-resumen-cards';
import { CajaAperturaForm } from '@/features/caja/components/caja-apertura-form';
import { CajaMovimientosTurno } from '@/features/caja/components/caja-movimientos-turno';
import { ModalRegistroGasto } from '@/features/caja/components/modal-registro-gasto';
import { ModalCierreArqueo } from '@/features/caja/components/modal-cierre-arqueo';
import { ModalAuditoriaCaja } from '@/features/caja/components/modal-auditoria-caja';
import { ModalAuditoriaRecepcion } from '@/features/caja/components/modal-auditoria-recepcion';
import { CajaHistorialTable } from '@/features/caja/components/caja-historial-table';
import { CajaRecepcionesTable } from '@/features/caja/components/caja-recepciones-table';

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

  // Estados de Recepciones de Mercadería
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
  const [filtroRecSucursalId, setFiltroRecSucursalId] = useState<string>('TODAS');
  const [filtroRecProveedorId, setFiltroRecProveedorId] = useState<string>('TODOS');
  const [filtroRecFechaDesde, setFiltroRecFechaDesde] = useState<string>('');
  const [filtroRecFechaHasta, setFiltroRecFechaHasta] = useState<string>('');
  const [filtroRecSearch, setFiltroRecSearch] = useState<string>('');
  const [searchRecDebounce, setSearchRecDebounce] = useState<string>('');

  // Modales
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [cajaDetalleData, setCajaDetalleData] = useState<any | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
  const [modalRecDetalleOpen, setModalRecDetalleOpen] = useState(false);
  const [recepcionDetalleData, setRecepcionDetalleData] = useState<any | null>(null);
  const [isLoadingRecDetalle, setIsLoadingRecDetalle] = useState(false);

  // Formularios
  const [montoApertura, setMontoApertura] = useState<number>(300);
  const [obsApertura, setObsApertura] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [openingError, setOpeningError] = useState<string | null>(null);

  const [gastoCategoriaId, setGastoCategoriaId] = useState<number>(1);
  const [gastoMonto, setGastoMonto] = useState<number>(0);
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [isSavingGasto, setIsSavingGasto] = useState(false);
  const [gastoError, setGastoError] = useState<string | null>(null);

  const [conteoFisico, setConteoFisico] = useState<number>(0);
  const [justificacionCierre, setJustificacionCierre] = useState('');
  const [obsCierre, setObsCierre] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [cierreError, setCierreError] = useState<string | null>(null);
  const [cierreResult, setCierreResult] = useState<any | null>(null);

  // Debounce filtros
  useEffect(() => {
    const handler = setTimeout(() => setSearchDebounce(filtroSearch), 400);
    return () => clearTimeout(handler);
  }, [filtroSearch]);

  useEffect(() => {
    const handler = setTimeout(() => setSearchRecDebounce(filtroRecSearch), 400);
    return () => clearTimeout(handler);
  }, [filtroRecSearch]);

  // Carga de sesión activa
  const fetchSesionActiva = async () => {
    setIsLoadingSession(true);
    try {
      const data = await api.caja.getActiva();
      setSessionData(data);
    } catch {
      // Silencioso
    } finally {
      setIsLoadingSession(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const cats = await api.caja.getCategoriasGasto();
      setCategoriasGasto(cats);
      if (cats.length > 0) setGastoCategoriaId(cats[0].id);
    } catch {
      // Silencioso
    }
  };

  const fetchSelectsList = async () => {
    try {
      const [sucs, usrs, provs] = await Promise.all([
        api.sucursales.getAll(),
        api.caja.getUsuarios(),
        api.proveedores.getAll(),
      ]);
      setSucursalesList(sucs);
      setUsuariosList(usrs);
      setProveedoresList(provs);
    } catch {
      // Silencioso
    }
  };

  const fetchHistorial = async (page = 1, customLimit?: number) => {
    setIsLoadingHistorial(true);
    try {
      const limit = customLimit || historialMeta.limit;
      const res = await api.caja.getHistorial({
        page,
        limit,
        sucursalId: filtroSucursalId !== 'TODAS' ? Number(filtroSucursalId) : undefined,
        usuarioId: filtroUsuarioId !== 'TODOS' ? Number(filtroUsuarioId) : undefined,
        fechaDesde: filtroFechaDesde || undefined,
        fechaHasta: filtroFechaHasta || undefined,
        search: searchDebounce.trim() || undefined,
      });

      if (Array.isArray(res)) {
        setHistorialCajas(res);
        setHistorialMeta({
          total: res.length,
          page: 1,
          limit: limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } else {
        setHistorialCajas(res?.data || []);
        setHistorialMeta({
          total: res?.meta?.total || 0,
          page: res?.meta?.page || 1,
          limit: res?.meta?.limit || limit,
          totalPages: res?.meta?.totalPages || 1,
          hasNextPage: res?.meta?.hasNextPage || false,
          hasPrevPage: res?.meta?.hasPrevPage || false,
        });
      }
    } catch {
      // Silencioso
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  const fetchRecepciones = async (page = 1, customLimit?: number) => {
    setIsLoadingRecepciones(true);
    try {
      const limit = customLimit || recepcionesMeta.limit;
      const res = await api.recepcion.getNotasIngreso({
        page,
        limit,
        sucursalId: filtroRecSucursalId !== 'TODAS' ? Number(filtroRecSucursalId) : undefined,
        proveedorId: filtroRecProveedorId !== 'TODOS' ? Number(filtroRecProveedorId) : undefined,
        fechaDesde: filtroRecFechaDesde || undefined,
        fechaHasta: filtroRecFechaHasta || undefined,
        search: searchRecDebounce.trim() || undefined,
      });
      setRecepcionesList(res.data || []);
      setRecepcionesMeta({
        total: res.meta?.total || 0,
        page: res.meta?.page || 1,
        limit: res.meta?.limit || limit,
        totalPages: res.meta?.totalPages || 1,
        hasNextPage: res.meta?.hasNextPage || false,
        hasPrevPage: res.meta?.hasPrevPage || false,
      });
    } catch {
      // Silencioso
    } finally {
      setIsLoadingRecepciones(false);
    }
  };

  useEffect(() => {
    fetchSesionActiva();
    fetchCategorias();
    fetchSelectsList();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'historial') {
      fetchHistorial(1);
    } else if (activeTab === 'recepciones') {
      fetchRecepciones(1);
    }
  }, [
    activeTab,
    filtroSucursalId,
    filtroUsuarioId,
    filtroFechaDesde,
    filtroFechaHasta,
    searchDebounce,
    filtroRecSucursalId,
    filtroRecProveedorId,
    filtroRecFechaDesde,
    filtroRecFechaHasta,
    searchRecDebounce,
  ]);

  // Manejadores
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpeningError(null);
    setIsOpening(true);
    try {
      const sucursalId = user?.sucursal?.id || sessionData?.caja?.sucursalId || 1;
      await api.caja.abrir({
        sucursalId,
        montoInicialEfectivo: Number(montoApertura) || 0,
        observaciones: obsApertura.trim() || undefined,
      });
      setObsApertura('');
      await fetchSesionActiva();
    } catch (err: any) {
      setOpeningError(err.message || 'Error al abrir la caja.');
    } finally {
      setIsOpening(false);
    }
  };

  const handleRegistrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData?.caja) return;
    setGastoError(null);
    setIsSavingGasto(true);
    try {
      await api.caja.registrarGasto(sessionData.caja.id, {
        categoriaId: gastoCategoriaId,
        montoBs: gastoMonto,
        concepto: gastoConcepto.trim(),
      });
      setGastoMonto(0);
      setGastoConcepto('');
      setModalGastoOpen(false);
      await fetchSesionActiva();
    } catch (err: any) {
      setGastoError(err.message || 'Error al registrar el egreso.');
    } finally {
      setIsSavingGasto(false);
    }
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData?.caja) return;
    setCierreError(null);
    setIsClosing(true);
    try {
      const res = await api.caja.cerrar(sessionData.caja.id, {
        montoFinalEfectivo: conteoFisico,
        justificacion: justificacionCierre.trim() || undefined,
        observaciones: obsCierre.trim() || undefined,
      });
      setCierreResult(res);
      setModalCierreOpen(false);
      setConteoFisico(0);
      setJustificacionCierre('');
      setObsCierre('');
      await fetchSesionActiva();
      if (activeTab === 'historial') fetchHistorial(1);
    } catch (err: any) {
      setCierreError(err.message || 'Error al procesar el cierre y arqueo.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleOpenDetalle = async (cajaId: number) => {
    setIsLoadingDetalle(true);
    setModalDetalleOpen(true);
    try {
      const data = await api.caja.getDetalle(cajaId);
      setCajaDetalleData(data);
    } catch {
      // Silencioso
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  const handleOpenRecDetalle = async (recepcionId: number) => {
    setIsLoadingRecDetalle(true);
    setModalRecDetalleOpen(true);
    try {
      const data = await api.recepcion.getNotaIngresoById(recepcionId);
      setRecepcionDetalleData(data);
    } catch {
      // Silencioso
    } finally {
      setIsLoadingRecDetalle(false);
    }
  };

  const handleResetFiltros = () => {
    setFiltroSearch('');
    setFiltroSucursalId('TODAS');
    setFiltroUsuarioId('TODOS');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  const handleResetFiltrosRecepcion = () => {
    setFiltroRecSearch('');
    setFiltroRecSucursalId('TODAS');
    setFiltroRecProveedorId('TODOS');
    setFiltroRecFechaDesde('');
    setFiltroRecFechaHasta('');
  };

  if (isLoadingSession) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const isCajaAbierta = !!sessionData?.caja;
  const rf = sessionData?.resumenFinanciero;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Encabezado Principal y Pestañas */}
      <CajaHeader
        sessionData={sessionData}
        user={user}
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGastoModal={() => setModalGastoOpen(true)}
        onOpenCierreModal={() => {
          setConteoFisico(0);
          setJustificacionCierre('');
          setModalCierreOpen(true);
        }}
      />

      {/* Alerta de Cierre Reciente con Resultado de Arqueo */}
      {cierreResult && (
        <div className="p-4 rounded-xl border border-slate-300 bg-slate-100 text-slate-900 space-y-1 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-slate-800" />
              Caja Cerrada y Arqueada Exitosamente
            </h3>
            <button
              type="button"
              onClick={() => setCierreResult(null)}
              className="text-xs text-slate-600 hover:text-slate-900 underline"
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

      {/* TAB 1: TURNO ACTIVO */}
      {activeTab === 'turno' && (
        isCajaAbierta ? (
          <div className="space-y-6">
            <CajaResumenCards
              rf={rf}
              sessionData={sessionData}
              isAdmin={isAdmin}
            />
            <CajaMovimientosTurno
              sessionData={sessionData}
            />
          </div>
        ) : (
          <CajaAperturaForm
            montoApertura={montoApertura}
            setMontoApertura={setMontoApertura}
            obsApertura={obsApertura}
            setObsApertura={setObsApertura}
            openingError={openingError}
            isOpening={isOpening}
            onSubmit={handleAbrirCaja}
          />
        )
      )}

      {/* TAB 2: HISTORIAL DE CAJAS */}
      {activeTab === 'historial' && (
        <CajaHistorialTable
          filtroSearch={filtroSearch}
          setFiltroSearch={setFiltroSearch}
          filtroSucursalId={filtroSucursalId}
          setFiltroSucursalId={setFiltroSucursalId}
          filtroUsuarioId={filtroUsuarioId}
          setFiltroUsuarioId={setFiltroUsuarioId}
          filtroFechaDesde={filtroFechaDesde}
          setFiltroFechaDesde={setFiltroFechaDesde}
          filtroFechaHasta={filtroFechaHasta}
          setFiltroFechaHasta={setFiltroFechaHasta}
          sucursalesList={sucursalesList}
          usuariosList={usuariosList}
          onResetFiltros={handleResetFiltros}
          historialCajas={historialCajas}
          isLoadingHistorial={isLoadingHistorial}
          historialMeta={historialMeta}
          setHistorialMeta={setHistorialMeta}
          onFetchHistorial={fetchHistorial}
          onOpenDetalle={handleOpenDetalle}
        />
      )}

      {/* TAB 3: RECEPCIONES (ADMIN) */}
      {isAdmin && activeTab === 'recepciones' && (
        <CajaRecepcionesTable
          filtroRecSearch={filtroRecSearch}
          setFiltroRecSearch={setFiltroRecSearch}
          filtroRecSucursalId={filtroRecSucursalId}
          setFiltroRecSucursalId={setFiltroRecSucursalId}
          filtroRecProveedorId={filtroRecProveedorId}
          setFiltroRecProveedorId={setFiltroRecProveedorId}
          filtroRecFechaDesde={filtroRecFechaDesde}
          setFiltroRecFechaDesde={setFiltroRecFechaDesde}
          filtroRecFechaHasta={filtroRecFechaHasta}
          setFiltroRecFechaHasta={setFiltroRecFechaHasta}
          sucursalesList={sucursalesList}
          proveedoresList={proveedoresList}
          onResetFiltrosRecepcion={handleResetFiltrosRecepcion}
          recepcionesList={recepcionesList}
          isLoadingRecepciones={isLoadingRecepciones}
          recepcionesMeta={recepcionesMeta}
          setRecepcionesMeta={setRecepcionesMeta}
          onFetchRecepciones={fetchRecepciones}
          onOpenRecDetalle={handleOpenRecDetalle}
        />
      )}

      {/* MODALES */}
      <ModalRegistroGasto
        isOpen={modalGastoOpen}
        onClose={() => setModalGastoOpen(false)}
        gastoError={gastoError}
        categoriasGasto={categoriasGasto}
        gastoCategoriaId={gastoCategoriaId}
        setGastoCategoriaId={setGastoCategoriaId}
        gastoMonto={gastoMonto}
        setGastoMonto={setGastoMonto}
        gastoConcepto={gastoConcepto}
        setGastoConcepto={setGastoConcepto}
        isAdmin={isAdmin}
        rf={rf}
        isSavingGasto={isSavingGasto}
        onSubmit={handleRegistrarGasto}
      />

      <ModalCierreArqueo
        isOpen={modalCierreOpen}
        onClose={() => setModalCierreOpen(false)}
        sessionData={sessionData}
        user={user}
        cierreError={cierreError}
        conteoFisico={conteoFisico}
        setConteoFisico={setConteoFisico}
        justificacionCierre={justificacionCierre}
        setJustificacionCierre={setJustificacionCierre}
        obsCierre={obsCierre}
        setObsCierre={setObsCierre}
        isClosing={isClosing}
        onSubmit={handleCerrarCaja}
      />

      <ModalAuditoriaCaja
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        cajaDetalleData={cajaDetalleData}
        isLoadingDetalle={isLoadingDetalle}
        isAdmin={isAdmin}
      />

      <ModalAuditoriaRecepcion
        isOpen={modalRecDetalleOpen}
        onClose={() => setModalRecDetalleOpen(false)}
        recepcionDetalleData={recepcionDetalleData}
        isLoadingRecDetalle={isLoadingRecDetalle}
      />
    </div>
  );
}
