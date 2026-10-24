'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { playSaleSuccessSound } from '@/lib/sound';

import { ProveedorItem, CreateProveedorInput } from '@/features/proveedores/types';
import { ProveedoresHeader } from '@/features/proveedores/components/proveedores-header';
import { ProveedoresFiltros } from '@/features/proveedores/components/proveedores-filtros';
import { ProveedoresTable } from '@/features/proveedores/components/proveedores-table';
import { ModalProveedorForm } from '@/features/proveedores/components/modal-proveedor-form';
import { DialogProveedorStatus } from '@/features/proveedores/components/dialog-proveedor-status';
import { ModalProveedorDetalle } from '@/features/proveedores/components/modal-proveedor-detalle';

export default function ProveedoresPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Estados de datos
  const [proveedores, setProveedores] = useState<ProveedorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [activoFiltro, setActivoFiltro] = useState<string>('TODOS');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [proveedorToEdit, setProveedorToEdit] = useState<ProveedorItem | null>(null);
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [formApiError, setFormApiError] = useState<string | null>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [proveedorToStatus, setProveedorToStatus] = useState<ProveedorItem | null>(null);
  const [isStatusSaving, setIsStatusSaving] = useState(false);

  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [proveedorDetalle, setProveedorDetalle] = useState<ProveedorItem | null>(null);

  // Carga de proveedores
  const fetchProveedores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Siempre incluimos inactivos para que el Administrador tenga el control total
      const data = await api.proveedores.getAll(true, search.trim() || undefined);
      setProveedores(data);
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al conectar con el servidor de proveedores.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      const timer = setTimeout(() => {
        fetchProveedores();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [user, fetchProveedores]);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    playSaleSuccessSound();
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Filtrado en memoria por estado (Activos / Inactivos / Todos)
  const filteredProveedores = proveedores.filter((p) => {
    if (activoFiltro === 'ACTIVOS') return p.activo;
    if (activoFiltro === 'INACTIVOS') return !p.activo;
    return true;
  });

  // Métricas
  const totalProveedores = proveedores.length;
  const activosCount = proveedores.filter((p) => p.activo).length;
  const inactivosCount = proveedores.filter((p) => !p.activo).length;
  const conRecepcionesCount = proveedores.filter((p) => (p._count?.notasIngreso ?? 0) > 0).length;

  // Handlers
  const handleOpenCreate = () => {
    setProveedorToEdit(null);
    setFormApiError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: ProveedorItem) => {
    setProveedorToEdit(p);
    setFormApiError(null);
    setIsFormOpen(true);
  };

  const handleSaveProveedor = async (data: CreateProveedorInput) => {
    setIsFormSaving(true);
    setFormApiError(null);

    try {
      if (proveedorToEdit) {
        await api.proveedores.update(proveedorToEdit.id, data);
        triggerSuccess(`Proveedor "${data.empresa || data.nombre}" actualizado exitosamente.`);
      } else {
        await api.proveedores.create(data);
        triggerSuccess(`Proveedor "${data.empresa || data.nombre}" registrado exitosamente.`);
      }

      setIsFormOpen(false);
      setProveedorToEdit(null);
      await fetchProveedores();
    } catch (err: any) {
      setFormApiError(
        err instanceof ApiError ? err.message : 'Error al guardar el proveedor.'
      );
    } finally {
      setIsFormSaving(false);
    }
  };

  const handleOpenStatus = (p: ProveedorItem) => {
    setProveedorToStatus(p);
    setIsStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!proveedorToStatus) return;

    setIsStatusSaving(true);
    try {
      const updated = await api.proveedores.toggleStatus(proveedorToStatus.id);
      triggerSuccess(
        `Proveedor "${updated.empresa || updated.nombre}" ${
          updated.activo ? 'reactivado' : 'pausado'
        } correctamente.`
      );
      setIsStatusOpen(false);
      setProveedorToStatus(null);
      await fetchProveedores();
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al cambiar estado del proveedor.'
      );
      setIsStatusOpen(false);
    } finally {
      setIsStatusSaving(false);
    }
  };

  const handleVerDetalle = async (p: ProveedorItem) => {
    try {
      // Cargar detalle completo con sus notas de ingreso
      const full = await api.proveedores.getById(p.id);
      setProveedorDetalle(full);
      setIsDetalleOpen(true);
    } catch {
      setProveedorDetalle(p);
      setIsDetalleOpen(true);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setActivoFiltro('TODOS');
  };

  // ==========================================
  // BLOQUEO ESTRICTO DE RBAC (SOLO ADMINISTRADOR)
  // ==========================================
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
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
            El módulo comercial de proveedores mayoristas y compras está reservado para personal con rol de Administrador.
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
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Mensajes de feedback temporal */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-subtle animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
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
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between shadow-subtle animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Encabezado con métricas y botón de acción */}
      <ProveedoresHeader
        totalProveedores={totalProveedores}
        activosCount={activosCount}
        inactivosCount={inactivosCount}
        conRecepcionesCount={conRecepcionesCount}
        onNuevoProveedor={handleOpenCreate}
      />

      {/* Barra de Filtros */}
      <ProveedoresFiltros
        search={search}
        setSearch={setSearch}
        activoFiltro={activoFiltro}
        setActivoFiltro={setActivoFiltro}
        onReset={handleResetFilters}
      />

      {/* Tabla Principal */}
      {isLoading ? (
        <div className="space-y-3 bg-white p-6 rounded-xl border border-slate-200 shadow-subtle">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <ProveedoresTable
          proveedores={filteredProveedores}
          onEdit={handleOpenEdit}
          onToggleStatus={handleOpenStatus}
          onVerDetalle={handleVerDetalle}
        />
      )}

      {/* Modales */}
      <ModalProveedorForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setProveedorToEdit(null);
        }}
        proveedorToEdit={proveedorToEdit}
        onSave={handleSaveProveedor}
        isLoading={isFormSaving}
        apiError={formApiError}
      />

      <DialogProveedorStatus
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setProveedorToStatus(null);
        }}
        proveedor={proveedorToStatus}
        onConfirm={handleConfirmToggleStatus}
        isLoading={isStatusSaving}
      />

      <ModalProveedorDetalle
        isOpen={isDetalleOpen}
        onClose={() => {
          setIsDetalleOpen(false);
          setProveedorDetalle(null);
        }}
        proveedor={proveedorDetalle}
      />
    </div>
  );
}
