'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Users,
  Smartphone,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Power,
  Eye,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  ArrowLeft,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { playSaleSuccessSound } from '@/lib/sound';

interface SucursalItem {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  activo: boolean;
  creadoEn?: string;
  _count?: {
    usuarios: number;
    dispositivos: number;
    lotesAccesorio: number;
  };
}

interface SucursalDetail extends SucursalItem {
  usuarios: Array<{
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'VENDEDOR';
    activo: boolean;
  }>;
}

const CIUDADES_BOLIVIA = [
  'Santa Cruz',
  'La Paz',
  'Cochabamba',
  'El Alto',
  'Tarija',
  'Sucre',
  'Oruro',
  'Potosí',
  'Beni',
  'Pando',
];

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

  // Mensaje de éxito temporal
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    playSaleSuccessSound();
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // 1. Manejo de Creación
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

  // 2. Abrir Modal de Edición
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

  // 3. Manejo de Actualización
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

  // 4. Toggle Rápido de Estado (Activar / Desactivar)
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

  // 5. Ver Detalle y Personal Asignado
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

  // Filtros aplicados en memoria
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

  // Ciudades presentes en los datos
  const ciudadesDisponibles = useMemo(() => {
    const setC = new Set(sucursales.map((s) => s.ciudad));
    return Array.from(setC);
  }, [sucursales]);

  // ==========================================
  // BLOQUEO ESTRICTO DE RBAC (SOLO ADMINISTRADOR)
  // ==========================================
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
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            href="/administracion"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a Centro de Administración</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Gestión de Sucursales
                </h1>
                <Badge variant="default" className="text-[10px] tracking-wide uppercase">
                  Exclusivo Admin
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Administración de tiendas físicas, control de sedes operativas, inventario local y personal asignado.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSucursales}
            isLoading={isLoading}
            className="text-xs"
            title="Refrescar lista"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="text-xs shadow-sm font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva Sucursal
          </Button>
        </div>
      </div>

      {/* Alertas Globales */}
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

      {/* KPIs y Métricas de Infraestructura */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Sucursales Activas</p>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.activas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metricas.inactivas > 0 ? `${metricas.inactivas} inactiva(s)` : '100% operativas'}
          </p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Personal Asignado</p>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.totalPersonal}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Vendedores y admins</p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Equipos Físicos</p>
            <Smartphone className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.totalDispositivos}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">En inventario local</p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Lotes Accesorios</p>
            <Boxes className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metricas.totalLotes}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Calidades y variantes</p>
        </Card>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, dirección o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          {ciudadesDisponibles.length > 1 && (
            <div className="w-40">
              <Select
                value={filtroCiudad}
                onChange={(e) => setFiltroCiudad(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="TODAS">Todas las ciudades</option>
                {ciudadesDisponibles.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeInactivas}
              onChange={(e) => setIncludeInactivas(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Incluir inactivas</span>
          </label>
        </div>
      </div>

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
            <Card
              key={suc.id}
              className={cn(
                'border transition-all duration-200 flex flex-col justify-between hover:shadow-card',
                suc.activo ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/60 opacity-80'
              )}
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full flex-shrink-0',
                        suc.activo ? 'bg-emerald-500' : 'bg-slate-400'
                      )}
                    />
                    <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                      {suc.nombre}
                    </CardTitle>
                  </div>
                  <Badge variant={suc.activo ? 'success' : 'secondary'} className="text-[10px]">
                    {suc.activo ? 'Operativa' : 'Inactiva'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {suc.direccion} • <strong className="text-slate-800">{suc.ciudad}</strong>
                    </span>
                  </div>
                  {suc.telefono && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span>{suc.telefono}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                {/* Contadores de Recursos Asignados */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500">Personal</p>
                    <p className="text-xs font-bold text-slate-900">
                      {suc._count?.usuarios ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Equipos</p>
                    <p className="text-xs font-bold text-slate-900">
                      {suc._count?.dispositivos ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Accesorios</p>
                    <p className="text-xs font-bold text-slate-900">
                      {suc._count?.lotesAccesorio ?? 0}
                    </p>
                  </div>
                </div>

                {/* Acciones de Administración */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(suc)}
                    className="text-xs h-8 text-slate-700 hover:text-slate-900 px-2"
                  >
                    <Eye className="mr-1 h-3.5 w-3.5 text-slate-500" />
                    Detalle & Personal
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(suc)}
                      className="text-xs h-8 px-2.5"
                      title="Editar sucursal"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActivo(suc)}
                      className={cn(
                        'text-xs h-8 px-2.5',
                        suc.activo
                          ? 'hover:text-rose-600 hover:border-rose-200'
                          : 'hover:text-emerald-600 hover:border-emerald-200'
                      )}
                      title={suc.activo ? 'Desactivar sucursal' : 'Activar sucursal'}
                    >
                      <Power
                        className={cn(
                          'h-3.5 w-3.5',
                          suc.activo ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600'
                        )}
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: REGISTRAR NUEVA SUCURSAL */}
      {/* ==================================================== */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-900" />
            <span>Registrar Nueva Sucursal</span>
          </div>
        }
        description="Añade una nueva sede física para expandir las operaciones y asignar inventario independiente."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {createError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nuevoNombre">Nombre de la Sucursal *</Label>
            <Input
              id="nuevoNombre"
              placeholder="Ej: Sucursal Equipetrol / Sucursal Ventura Mall"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nuevaCiudad">Ciudad *</Label>
              <Select
                id="nuevaCiudad"
                value={nuevaCiudad}
                onChange={(e) => setNuevaCiudad(e.target.value)}
              >
                {CIUDADES_BOLIVIA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nuevoTelefono">Teléfono de Contacto</Label>
              <Input
                id="nuevoTelefono"
                placeholder="Ej: 71023456 / 3-3456789"
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nuevaDireccion">Dirección Completa *</Label>
            <Input
              id="nuevaDireccion"
              placeholder="Ej: Av. San Martín #450, entre 3er y 4to anillo"
              value={nuevaDireccion}
              onChange={(e) => setNuevaDireccion(e.target.value)}
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="default" isLoading={isCreating} loadingText="Creando...">
              Registrar Sucursal
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: EDITAR SUCURSAL */}
      {/* ==================================================== */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSucursalEditar(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-slate-900" />
            <span>Editar Sucursal</span>
          </div>
        }
        description={`Modifica los datos de contacto y estado operativo de "${sucursalEditar?.nombre}".`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {editError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="editNombre">Nombre de la Sucursal *</Label>
            <Input
              id="editNombre"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editCiudad">Ciudad *</Label>
              <Select
                id="editCiudad"
                value={editCiudad}
                onChange={(e) => setEditCiudad(e.target.value)}
              >
                {CIUDADES_BOLIVIA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editTelefono">Teléfono de Contacto</Label>
              <Input
                id="editTelefono"
                value={editTelefono}
                onChange={(e) => setEditTelefono(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editDireccion">Dirección Completa *</Label>
            <Input
              id="editDireccion"
              value={editDireccion}
              onChange={(e) => setEditDireccion(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editActivo}
                onChange={(e) => setEditActivo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Sucursal Operativa</p>
                <p className="text-[11px] text-slate-500">
                  Si se desmarca, los vendedores no podrán abrir sesiones de caja ni operar en esta tienda.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSucursalEditar(null);
              }}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="default" isLoading={isUpdating} loadingText="Guardando...">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: DETALLE Y PERSONAL ASIGNADO */}
      {/* ==================================================== */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetalleSucursal(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-900" />
            <span>{detalleSucursal?.nombre || 'Detalle de Sucursal'}</span>
          </div>
        }
        description="Información de sede y lista de colaboradores / vendedores asignados."
      >
        {isLoadingDetail ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : !detalleSucursal ? (
          <p className="text-xs text-slate-500 py-4">No se pudo cargar la información.</p>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Metadatos de la Sucursal */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Estado:</span>
                <Badge variant={detalleSucursal.activo ? 'success' : 'secondary'}>
                  {detalleSucursal.activo ? 'Operativa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ciudad:</span>
                <span className="font-semibold text-slate-900">{detalleSucursal.ciudad}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dirección:</span>
                <span className="text-slate-800 font-medium text-right max-w-xs truncate">
                  {detalleSucursal.direccion}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Teléfono:</span>
                <span className="text-slate-800 font-medium">
                  {detalleSucursal.telefono || 'No registrado'}
                </span>
              </div>
            </div>

            {/* Lista de Personal Asignado */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Personal de Tienda ({detalleSucursal.usuarios?.length || 0})
                  </h4>
                </div>
              </div>

              {!detalleSucursal.usuarios || detalleSucursal.usuarios.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No hay usuarios o vendedores asignados directamente a esta sucursal.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {detalleSucursal.usuarios.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-subtle"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{u.nombre}</p>
                          <Badge
                            variant={u.rol === 'ADMIN' ? 'default' : 'outline'}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {u.rol}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>

                      <Badge
                        variant={u.activo ? 'success' : 'destructive'}
                        className="text-[10px]"
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  setDetalleSucursal(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
