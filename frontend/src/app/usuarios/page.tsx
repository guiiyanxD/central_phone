'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
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

import { UsuarioItem, RolUsuario } from '@/features/usuarios/types';
import { UsuariosHeader } from '@/features/usuarios/components/usuarios-header';
import { UsuariosFiltros } from '@/features/usuarios/components/usuarios-filtros';
import { UsuariosTable } from '@/features/usuarios/components/usuarios-table';
import { ModalUsuarioForm } from '@/features/usuarios/components/modal-usuario-form';
import { ModalUsuarioPassword } from '@/features/usuarios/components/modal-usuario-password';
import { DialogUsuarioStatus } from '@/features/usuarios/components/dialog-usuario-status';

export default function UsuariosPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Estados de datos
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [sucursalId, setSucursalId] = useState<number | undefined>(undefined);
  const [rol, setRol] = useState<RolUsuario | undefined>(undefined);
  const [activo, setActivo] = useState<boolean | undefined>(undefined);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState<UsuarioItem | null>(null);
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [formApiError, setFormApiError] = useState<string | null>(null);

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [usuarioToPassword, setUsuarioToPassword] = useState<UsuarioItem | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordApiError, setPasswordApiError] = useState<string | null>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [usuarioToStatus, setUsuarioToStatus] = useState<UsuarioItem | null>(null);
  const [isStatusSaving, setIsStatusSaving] = useState(false);

  // Carga de datos
  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.usuarios.getAll({
        sucursalId,
        rol,
        activo,
        search: search.trim() || undefined,
      });
      setUsuarios(data);
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al conectar con el servidor de usuarios.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId, rol, activo, search]);

  const fetchSucursales = async () => {
    try {
      const data = await api.sucursales.getAll(true);
      setSucursales(data);
    } catch {
      // Ignorar fallback silencioso
    }
  };

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      fetchSucursales();
    }
  }, [user]);

  useEffect(() => {
    if (user?.rol === 'ADMIN') {
      const timer = setTimeout(() => {
        fetchUsuarios();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [user, fetchUsuarios]);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    playSaleSuccessSound();
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Contadores para métricas rápidas
  const totalUsuarios = usuarios.length;
  const activosCount = usuarios.filter((u) => u.activo).length;
  const adminsCount = usuarios.filter((u) => u.rol === 'ADMIN').length;
  const vendedoresCount = usuarios.filter((u) => u.rol === 'VENDEDOR').length;

  // Handlers
  const handleOpenCreate = () => {
    setUsuarioToEdit(null);
    setFormApiError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: UsuarioItem) => {
    setUsuarioToEdit(u);
    setFormApiError(null);
    setIsFormOpen(true);
  };

  const handleSaveUsuario = async (formData: {
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
    password?: string;
    sucursalId?: number | null;
    rol: RolUsuario;
  }) => {
    setIsFormSaving(true);
    setFormApiError(null);

    try {
      if (usuarioToEdit) {
        // Actualizar
        await api.usuarios.update(usuarioToEdit.id, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          sucursalId: formData.sucursalId,
          rol: formData.rol,
        });
        triggerSuccess(`Colaborador "${formData.nombre}" actualizado exitosamente.`);
      } else {
        // Crear
        if (!formData.password) {
          setFormApiError('La contraseña inicial es requerida.');
          setIsFormSaving(false);
          return;
        }
        await api.usuarios.create({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          password: formData.password,
          sucursalId: formData.sucursalId ?? undefined,
          rol: formData.rol,
        });
        triggerSuccess(`Nuevo colaborador "${formData.nombre}" registrado exitosamente.`);
      }

      setIsFormOpen(false);
      setUsuarioToEdit(null);
      await fetchUsuarios();
    } catch (err: any) {
      setFormApiError(
        err instanceof ApiError ? err.message : 'Error al procesar la solicitud del colaborador.'
      );
    } finally {
      setIsFormSaving(false);
    }
  };

  const handleOpenPasswordModal = (u: UsuarioItem) => {
    setUsuarioToPassword(u);
    setPasswordApiError(null);
    setIsPasswordOpen(true);
  };

  const handleSavePassword = async (usuarioId: number, newPass: string) => {
    setIsPasswordSaving(true);
    setPasswordApiError(null);

    try {
      await api.usuarios.updatePassword(usuarioId, newPass);
      triggerSuccess('Contraseña de acceso actualizada correctamente.');
      setIsPasswordOpen(false);
      setUsuarioToPassword(null);
    } catch (err: any) {
      setPasswordApiError(
        err instanceof ApiError ? err.message : 'Error al actualizar la contraseña.'
      );
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleOpenStatusDialog = (u: UsuarioItem) => {
    setUsuarioToStatus(u);
    setIsStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!usuarioToStatus) return;

    setIsStatusSaving(true);
    try {
      const updated = await api.usuarios.toggleStatus(usuarioToStatus.id);
      triggerSuccess(
        `Cuenta de ${updated.nombre} ${updated.activo ? 'reactivada' : 'desactivada'} correctamente.`
      );
      setIsStatusOpen(false);
      setUsuarioToStatus(null);
      await fetchUsuarios();
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al cambiar estado del usuario.'
      );
      setIsStatusOpen(false);
    } finally {
      setIsStatusSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSucursalId(undefined);
    setRol(undefined);
    setActivo(undefined);
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
            El módulo de administración de usuarios y control de accesos está reservado para personal con rol de Administrador.
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
      <UsuariosHeader
        totalUsuarios={totalUsuarios}
        activosCount={activosCount}
        adminsCount={adminsCount}
        vendedoresCount={vendedoresCount}
        onNuevoUsuario={handleOpenCreate}
      />

      {/* Barra de Filtros */}
      <UsuariosFiltros
        search={search}
        setSearch={setSearch}
        sucursalId={sucursalId}
        setSucursalId={setSucursalId}
        rol={rol}
        setRol={setRol}
        activo={activo}
        setActivo={setActivo}
        sucursales={sucursales}
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
        <UsuariosTable
          usuarios={usuarios}
          currentUserId={user?.id}
          onEdit={handleOpenEdit}
          onResetPassword={handleOpenPasswordModal}
          onToggleStatus={handleOpenStatusDialog}
        />
      )}

      {/* Modales */}
      <ModalUsuarioForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setUsuarioToEdit(null);
        }}
        usuarioToEdit={usuarioToEdit}
        sucursales={sucursales}
        onSave={handleSaveUsuario}
        isLoading={isFormSaving}
        apiError={formApiError}
      />

      <ModalUsuarioPassword
        isOpen={isPasswordOpen}
        onClose={() => {
          setIsPasswordOpen(false);
          setUsuarioToPassword(null);
        }}
        usuario={usuarioToPassword}
        onSavePassword={handleSavePassword}
        isLoading={isPasswordSaving}
        apiError={passwordApiError}
      />

      <DialogUsuarioStatus
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setUsuarioToStatus(null);
        }}
        usuario={usuarioToStatus}
        onConfirm={handleConfirmToggleStatus}
        isLoading={isStatusSaving}
      />
    </div>
  );
}
