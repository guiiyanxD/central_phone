'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { playSaleSuccessSound } from '@/lib/sound';

import { SucursalItem, SucursalDetail } from '@/features/sucursales/types';
import { SucursalesHeader } from '@/features/sucursales/components/sucursales-header';
import { SucursalesFiltros } from '@/features/sucursales/components/sucursales-filtros';
import { SucursalCard } from '@/features/sucursales/components/sucursal-card';
import { ModalSucursalForm } from '@/features/sucursales/components/modal-sucursal-form';
import { ModalSucursalDetalle } from '@/features/sucursales/components/modal-sucursal-detalle';

export default function SucursalesPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Estados de datos
  const [sucursales, setSucursales] = useState<SucursalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [includeInactivas, setIncludeInactivas] = useState(true);
  const [filtroCiudad, setFiltroCiudad] = useState<string>('TODAS');

  // Modal: Crear Sucursal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCiudad, setNuevaCiudad] = useState('Santa Cruz');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal: Editar Sucursal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [sucursalEditar, setSucursalEditar] = useState<SucursalItem | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCiudad, setEditCiudad] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal: Detalle y Personal Asignado
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detalleSucursal, setDetalleSucursal] = useState<SucursalDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Cargar Sucursales
  const fetchSucursales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.sucursales.getAll(includeInactivas);
      setSucursales(data);
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al conectar con el servidor de sucursales.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      fetchSucursales();
    }
  }, [user, includeInactivas]);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    playSaleSuccessSound();
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Creación
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevaDireccion.trim()) {
      setCreateError('El nombre y la dirección son obligatorios.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      await api.sucursales.create({
        nombre: nuevoNombre.trim(),
        ciudad: nuevaCiudad.trim(),
        direccion: nuevaDireccion.trim(),
        telefono: nuevoTelefono.trim() || undefined,
      });

      setIsCreateOpen(false);
      setNuevoNombre('');
      setNuevaDireccion('');
      setNuevoTelefono('');
      setNuevaCiudad('Santa Cruz');
      triggerSuccess('Nueva sucursal operativa registrada exitosamente.');
      await fetchSucursales();
    } catch (err: any) {
      setCreateError(
        err instanceof ApiError ? err.message : 'Error al registrar la nueva sucursal.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Edición
  const openEditModal = (suc: SucursalItem) => {
    setSucursalEditar(suc);
    setEditNombre(suc.nombre);
    setEditCiudad(suc.ciudad);
    setEditDireccion(suc.direccion);
    setEditTelefono(suc.telefono || '');
    setEditActivo(suc.activo);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sucursalEditar) return;
    if (!editNombre.trim() || !editDireccion.trim()) {
      setEditError('El nombre y la dirección son obligatorios.');
      return;
    }

    setIsUpdating(true);
    setEditError(null);
    try {
      await api.sucursales.update(sucursalEditar.id, {
        nombre: editNombre.trim(),
        ciudad: editCiudad.trim(),
        direccion: editDireccion.trim(),
        telefono: editTelefono.trim() || undefined,
        activo: editActivo,
      });

      setIsEditOpen(false);
      setSucursalEditar(null);
      triggerSuccess(`Sucursal "${editNombre}" actualizada exitosamente.`);
      await fetchSucursales();
    } catch (err: any) {
      setEditError(
        err instanceof ApiError ? err.message : 'Error al actualizar los datos de la sucursal.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle Activo
  const handleToggleActivo = async (suc: SucursalItem) => {
    const nuevoEstado = !suc.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (
      !confirm(
        `¿Estás seguro de que deseas ${accion} la sucursal "${suc.nombre}"? ${
          !nuevoEstado ? 'Los vendedores no podrán abrir caja ni vender en ella mientras esté inactiva.' : ''
        }`
      )
    ) {
      return;
    }

    try {
      await api.sucursales.update(suc.id, { activo: nuevoEstado });
      triggerSuccess(
        `Sucursal "${suc.nombre}" ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`
      );
      await fetchSucursales();
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : `Error al cambiar el estado de la sucursal.`
      );
    }
  };

  // Detalle
  const handleViewDetail = async (suc: SucursalItem) => {
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    setDetalleSucursal(null);
    try {
      const data = await api.sucursales.getById(suc.id);
      setDetalleSucursal({
        ...suc,
        ...data,
      });
    } catch (err: any) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Error al consultar el detalle de la sucursal y su personal.'
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Filtros aplicados
  const filteredSucursales = useMemo(() => {
    return sucursales.filter((s) => {
      const matchQuery =
        s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ciudad.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.direccion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.telefono && s.telefono.includes(searchQuery));

      const matchCiudad = filtroCiudad === 'TODAS' || s.ciudad === filtroCiudad;
      return matchQuery && matchCiudad;
    });
  }, [sucursales, searchQuery, filtroCiudad]);

  // Métricas agregadas
  const metricas = useMemo(() => {
    const activas = sucursales.filter((s) => s.activo).length;
    const inactivas = sucursales.length - activas;
    const totalDispositivos = sucursales.reduce(
      (acc, s) => acc + (s._count?.dispositivos || 0),
      0
    );
    const totalLotes = sucursales.reduce(
      (acc, s) => acc + (s._count?.lotesAccesorio || 0),
      0
    );
    const totalPersonal = sucursales.reduce(
      (acc, s) => acc + (s._count?.usuarios || 0),
      0
    );
    return { activas, inactivas, totalDispositivos, totalLotes, totalPersonal };
  }, [sucursales]);

  const ciudadesDisponibles = useMemo(() => {
    const setC = new Set(sucursales.map((s) => s.ciudad));
    return Array.from(setC);
  }, [sucursales]);

  // RBAC
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!authLoading && user && user.rol !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-subtle">
          <ShieldAlert className="h-8 w-8 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Acceso Restringido a Administradores
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            La creación, edición y administración de sucursales físicas de CentralPhone está protegida bajo control de acceso de Administrador (RBAC).
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-mono mt-2">
            <span>Tu rol actual:</span>
            <Badge variant="outline" className="font-semibold text-slate-900">
              {user.rol}
            </Badge>
          </div>
        </div>
        <div className="pt-4 flex justify-center gap-3">
          <Link href="/pos">
            <Button variant="default">
              Ir a Punto de Venta
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Volver a Operaciones</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      <SucursalesHeader
        isLoading={isLoading}
        onRefresh={fetchSucursales}
        onOpenCreate={() => {
          setCreateError(null);
          setIsCreateOpen(true);
        }}
        metricas={metricas}
      />

      {/* Alertas */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-subtle animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 flex items-center justify-between gap-3 shadow-subtle animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <SucursalesFiltros
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtroCiudad={filtroCiudad}
        setFiltroCiudad={setFiltroCiudad}
        includeInactivas={includeInactivas}
        setIncludeInactivas={setIncludeInactivas}
        ciudadesDisponibles={ciudadesDisponibles}
      />

      {/* Grid de Sucursales */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : filteredSucursales.length === 0 ? (
        <Card className="p-12 text-center border-slate-200">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron sucursales</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No hay coincidencias para "${searchQuery}". Prueba con otros términos.`
              : 'Aún no se han configurado sucursales en la base de datos.'}
          </p>
          <div className="mt-4">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Crear Primera Sucursal
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSucursales.map((suc) => (
            <SucursalCard
              key={suc.id}
              sucursal={suc}
              onViewDetail={handleViewDetail}
              onEdit={openEditModal}
              onToggleActivo={handleToggleActivo}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <ModalSucursalForm
        mode="create"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        nombre={nuevoNombre}
        setNombre={setNuevoNombre}
        ciudad={nuevaCiudad}
        setCiudad={setNuevaCiudad}
        direccion={nuevaDireccion}
        setDireccion={setNuevaDireccion}
        telefono={nuevoTelefono}
        setTelefono={setNuevoTelefono}
        isLoading={isCreating}
        error={createError}
        onSubmit={handleCreateSubmit}
      />

      <ModalSucursalForm
        mode="edit"
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSucursalEditar(null);
        }}
        nombre={editNombre}
        setNombre={setEditNombre}
        ciudad={editCiudad}
        setCiudad={setEditCiudad}
        direccion={editDireccion}
        setDireccion={setEditDireccion}
        telefono={editTelefono}
        setTelefono={setEditTelefono}
        activo={editActivo}
        setActivo={setEditActivo}
        isLoading={isUpdating}
        error={editError}
        onSubmit={handleEditSubmit}
        sucursalNombreOriginal={sucursalEditar?.nombre}
      />

      <ModalSucursalDetalle
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetalleSucursal(null);
        }}
        detalleSucursal={detalleSucursal}
        isLoading={isLoadingDetail}
      />
    </div>
  );
}
