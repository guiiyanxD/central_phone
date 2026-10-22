'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Headphones,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  History,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Truck,
  Tag,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { ModalLineaVida } from './modal-linea-vida';
import { cn } from '@/lib/utils';

export default function InventarioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'telefonos' | 'accesorios' | 'catalogo'>('telefonos');

  // Estados de Dispositivos (Smartphones) con Paginación y Filtros Multi-Criterio
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [dispositivosMeta, setDispositivosMeta] = useState<{
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
  const [isLoadingDispositivos, setIsLoadingDispositivos] = useState(true);
  const [selectedImeiForLifeline, setSelectedImeiForLifeline] = useState<string | null>(null);

  // Listas maestras para filtros
  const [proveedoresList, setProveedoresList] = useState<any[]>([]);
  const [sucursalesList, setSucursalesList] = useState<any[]>([]);

  // Filtros de búsqueda multi-criterio
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [condicionFilter, setCondicionFilter] = useState('TODAS');
  const [sucursalFilter, setSucursalFilter] = useState('TODAS');
  const [proveedorFilter, setProveedorFilter] = useState('TODOS');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');

  // Estados de Accesorios y Lotes
  const [accesorios, setAccesorios] = useState<any[]>([]);
  const [isLoadingAccesorios, setIsLoadingAccesorios] = useState(true);

  // Estados de Catálogo de Modelos
  const [modelos, setModelos] = useState<any[]>([]);
  const [isLoadingModelos, setIsLoadingModelos] = useState(true);

  // Modal para Alta de Nuevo Modelo (Invariante: >= 1 variante)
  const [modalNuevoModeloOpen, setModalNuevoModeloOpen] = useState(false);
  const [nuevoNombreModelo, setNuevoNombreModelo] = useState('');
  const [nuevoMarca, setNuevoMarca] = useState('Apple');
  const [nuevoTipo, setNuevoTipo] = useState<'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO'>('IPHONE');
  const [primeraVarColor, setPrimeraVarColor] = useState('');
  const [primeraVarCapacidad, setPrimeraVarCapacidad] = useState(256);
  const [primeraVarSim, setPrimeraVarSim] = useState('SIM Físico');
  const [isCreatingModelo, setIsCreatingModelo] = useState(false);
  const [creacionError, setCreacionError] = useState<string | null>(null);

  // Modal para Agregar Variante a Modelo Existente (Abierto a todos los usuarios)
  const [modalAddVarianteOpen, setModalAddVarianteOpen] = useState(false);
  const [selectedModeloForAdd, setSelectedModeloForAdd] = useState<any | null>(null);
  const [addVarColor, setAddVarColor] = useState('');
  const [addVarCapacidad, setAddVarCapacidad] = useState(256);
  const [addVarSim, setAddVarSim] = useState('SIM Físico');
  const [isAddingVariante, setIsAddingVariante] = useState(false);
  const [addVarianteError, setAddVarianteError] = useState<string | null>(null);

  // Modal para Editar Variante Existente (Exclusivo ADMIN)
  const [modalEditVarianteOpen, setModalEditVarianteOpen] = useState(false);
  const [selectedModeloForEdit, setSelectedModeloForEdit] = useState<any | null>(null);
  const [selectedVarianteForEdit, setSelectedVarianteForEdit] = useState<any | null>(null);
  const [editVarColor, setEditVarColor] = useState('');
  const [editVarCapacidad, setEditVarCapacidad] = useState(256);
  const [editVarSim, setEditVarSim] = useState('SIM Físico');
  const [isUpdatingVariante, setIsUpdatingVariante] = useState(false);
  const [editVarianteError, setEditVarianteError] = useState<string | null>(null);

  // Modal para Confirmar Eliminación de Variante (Exclusivo ADMIN)
  const [modalDeleteVarianteOpen, setModalDeleteVarianteOpen] = useState(false);
  const [selectedModeloForDelete, setSelectedModeloForDelete] = useState<any | null>(null);
  const [selectedVarianteForDelete, setSelectedVarianteForDelete] = useState<any | null>(null);
  const [isDeletingVariante, setIsDeletingVariante] = useState(false);
  const [deleteVarianteError, setDeleteVarianteError] = useState<string | null>(null);

  // Debounce para búsqueda textual
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Carga de datos de dispositivos con paginación en servidor
  const fetchDispositivos = async (pageToFetch = 1, currentLimit = dispositivosMeta.limit) => {
    setIsLoadingDispositivos(true);
    try {
      const res: any = await api.modelos.getDispositivos({
        page: pageToFetch,
        limit: currentLimit,
        busqueda: searchDebounce.trim() || undefined,
        tipo: tipoFilter !== 'TODOS' ? tipoFilter : undefined,
        estado: estadoFilter !== 'TODOS' ? estadoFilter : undefined,
        condicion: condicionFilter !== 'TODAS' ? condicionFilter : undefined,
        sucursalId: sucursalFilter !== 'TODAS' ? Number(sucursalFilter) : undefined,
        proveedorId: proveedorFilter !== 'TODOS' ? Number(proveedorFilter) : undefined,
        fechaDesde: fechaDesdeFilter || undefined,
        fechaHasta: fechaHastaFilter || undefined,
      });

      if (Array.isArray(res)) {
        const total = res.length;
        const totalPages = Math.ceil(total / currentLimit) || 1;
        const start = (pageToFetch - 1) * currentLimit;
        setDispositivos(res.slice(start, start + currentLimit));
        setDispositivosMeta({
          total,
          page: pageToFetch,
          limit: currentLimit,
          totalPages,
          hasNextPage: pageToFetch < totalPages,
          hasPrevPage: pageToFetch > 1,
        });
      } else {
        setDispositivos(res?.data || []);
        setDispositivosMeta(res?.meta || {
          total: res?.data?.length || 0,
          page: pageToFetch,
          limit: currentLimit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err) {
      console.error('Error al obtener inventario de dispositivos:', err);
      setDispositivos([]);
    } finally {
      setIsLoadingDispositivos(false);
    }
  };

  const handleResetFiltros = () => {
    setSearchQuery('');
    setSearchDebounce('');
    setTipoFilter('TODOS');
    setEstadoFilter('TODOS');
    setCondicionFilter('TODAS');
    setSucursalFilter('TODAS');
    setProveedorFilter('TODOS');
    setFechaDesdeFilter('');
    setFechaHastaFilter('');
  };

  const fetchAccesorios = async () => {
    setIsLoadingAccesorios(true);
    try {
      const data = await api.accesorios.getAll();
      setAccesorios(data);
    } finally {
      setIsLoadingAccesorios(false);
    }
  };

  const fetchModelos = async () => {
    setIsLoadingModelos(true);
    try {
      const data = await api.modelos.getAll();
      setModelos(data);
    } finally {
      setIsLoadingModelos(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.proveedores.getAll().catch(() => []),
      api.sucursales.getAll().catch(() => []),
    ]).then(([provs, sucs]) => {
      setProveedoresList(provs);
      setSucursalesList(sucs);
    });
    fetchAccesorios();
    fetchModelos();
  }, []);

  useEffect(() => {
    if (activeTab === 'telefonos') {
      fetchDispositivos(1);
    }
  }, [
    activeTab,
    tipoFilter,
    estadoFilter,
    condicionFilter,
    sucursalFilter,
    proveedorFilter,
    fechaDesdeFilter,
    fechaHastaFilter,
    searchDebounce,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDispositivos();
  };

  // Manejador para Abrir Modal de Nueva Variante (Abierto a todos los usuarios)
  const handleOpenAddVariante = (modelo: any) => {
    setSelectedModeloForAdd(modelo);
    setAddVarColor('');
    // Sugerencias ergonómicas inteligentes por tipo de hardware
    if (modelo.tipo === 'AIRPODS') {
      setAddVarCapacidad(0);
      setAddVarSim('No Aplica');
    } else if (modelo.tipo === 'WATCH') {
      setAddVarCapacidad(0);
      setAddVarSim('GPS Only');
    } else if (modelo.tipo === 'MAC') {
      setAddVarCapacidad(512);
      setAddVarSim('No Aplica');
    } else {
      setAddVarCapacidad(256);
      setAddVarSim('SIM Físico');
    }
    setAddVarianteError(null);
    setModalAddVarianteOpen(true);
  };

  const handleConfirmAddVariante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModeloForAdd || !addVarColor.trim()) return;

    setIsAddingVariante(true);
    setAddVarianteError(null);

    try {
      await api.modelos.addVariante(selectedModeloForAdd.id, {
        color: addVarColor.trim(),
        capacidadGb: Number(addVarCapacidad),
        tipoSim: addVarSim,
      });
      setModalAddVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setAddVarianteError(err.message || 'Error al agregar la variante.');
    } finally {
      setIsAddingVariante(false);
    }
  };

  // Manejador para Editar Variante Existente (Exclusivo ADMIN)
  const handleOpenEditVariante = (modelo: any, variante: any) => {
    setSelectedModeloForEdit(modelo);
    setSelectedVarianteForEdit(variante);
    setEditVarColor(variante.color);
    setEditVarCapacidad(variante.capacidadGb);
    setEditVarSim(variante.tipoSim || 'SIM Físico');
    setEditVarianteError(null);
    setModalEditVarianteOpen(true);
  };

  const handleConfirmEditVariante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVarianteForEdit || !editVarColor.trim()) return;

    setIsUpdatingVariante(true);
    setEditVarianteError(null);

    try {
      await api.modelos.updateVariante(selectedVarianteForEdit.id, {
        color: editVarColor.trim(),
        capacidadGb: Number(editVarCapacidad),
        tipoSim: editVarSim,
      });
      setModalEditVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setEditVarianteError(err.message || 'Error al actualizar la variante.');
    } finally {
      setIsUpdatingVariante(false);
    }
  };

  // Manejador para Eliminar Variante (Exclusivo ADMIN)
  const handleOpenDeleteVariante = (modelo: any, variante: any) => {
    setSelectedModeloForDelete(modelo);
    setSelectedVarianteForDelete(variante);
    setDeleteVarianteError(null);
    setModalDeleteVarianteOpen(true);
  };

  const handleConfirmDeleteVariante = async () => {
    if (!selectedVarianteForDelete) return;

    setIsDeletingVariante(true);
    setDeleteVarianteError(null);

    try {
      await api.modelos.deleteVariante(selectedVarianteForDelete.id);
      setModalDeleteVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setDeleteVarianteError(err.message || 'Error al eliminar la variante.');
    } finally {
      setIsDeletingVariante(false);
    }
  };

  // Crear Modelo con Invariante Atómica (US05)
  const handleCreateModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreModelo.trim() || !primeraVarColor.trim()) return;

    setIsCreatingModelo(true);
    setCreacionError(null);

    try {
      await api.modelos.create({
        nombreModelo: nuevoNombreModelo.trim(),
        marca: nuevoMarca.trim() || 'Apple',
        tipo: nuevoTipo,
        variantes: [
          {
            color: primeraVarColor.trim(),
            capacidadGb: Number(primeraVarCapacidad),
            tipoSim: primeraVarSim,
          },
        ],
      });
      setModalNuevoModeloOpen(false);
      setNuevoNombreModelo('');
      setNuevoTipo('IPHONE');
      setPrimeraVarColor('');
      await fetchModelos();
    } catch (err: any) {
      setCreacionError(err.message || 'Error al crear el modelo.');
    } finally {
      setIsCreatingModelo(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Encabezado y Selector de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Control de Inventario & Catálogo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de stock físico serializado por IMEI, lotes de accesorios y catálogo de variantes.
          </p>
        </div>

        <Link href="/recepcion">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Recibir Mercadería
          </Button>
        </Link>
      </div>

      {/* Tabs Minimalistas */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('telefonos')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'telefonos'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Smartphone className="h-4 w-4" />
          <span>Equipos Serializados</span>
          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">
            {dispositivosMeta.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('accesorios')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'accesorios'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Headphones className="h-4 w-4" />
          <span>Lotes de Accesorios</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogo')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'catalogo'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Catálogo de Modelos ({modelos.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: TELÉFONOS SERIALIZADOS (US09) */}
      {activeTab === 'telefonos' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS MULTI-CRITERIO Y BÚSQUEDA */}
          <Card className="p-4 border-slate-200 bg-white shadow-subtle space-y-3">
            {/* Fila 1: Búsqueda, Tipo de Dispositivo, Estado y Condición */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 pr-8 h-9 text-xs"
                  placeholder="Buscar por IMEI, Serie, Modelo o Color..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    title="Borrar término de búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="lg:col-span-3">
                <Select
                  className="h-9 text-xs"
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="IPHONE">iPhone</option>
                  <option value="MAC">Mac / MacBook</option>
                  <option value="IPAD">iPad</option>
                  <option value="WATCH">Apple Watch</option>
                  <option value="AIRPODS">AirPods</option>
                  <option value="OTRO">Otros dispositivos</option>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Select
                  className="h-9 text-xs"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="DISPONIBLE">Disponibles</option>
                  <option value="VENDIDO">Vendidos</option>
                  <option value="RESERVADO">Reservados</option>
                  <option value="EN_GARANTIA">En Garantía</option>
                  <option value="DEFECTUOSO">Defectuoso</option>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Select
                  className="h-9 text-xs"
                  value={condicionFilter}
                  onChange={(e) => setCondicionFilter(e.target.value)}
                >
                  <option value="TODAS">Todas las condiciones</option>
                  <option value="NUEVO">Nuevo (Sellado)</option>
                  <option value="USADO">Usado / Reacondicionado</option>
                  <option value="OPEN_BOX">Open Box</option>
                </Select>
              </div>
            </div>

            {/* Fila 2: Sucursal, Proveedor, Rango de Fechas de Recepción y Botón Reset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
              <div className="lg:col-span-3">
                <Select
                  className="h-9 text-xs"
                  value={sucursalFilter}
                  onChange={(e) => setSucursalFilter(e.target.value)}
                >
                  <option value="TODAS">Todas las sucursales</option>
                  {sucursalesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="lg:col-span-3">
                <Select
                  className="h-9 text-xs"
                  value={proveedorFilter}
                  onChange={(e) => setProveedorFilter(e.target.value)}
                >
                  <option value="TODOS">Todos los proveedores</option>
                  {proveedoresList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={fechaDesdeFilter}
                    onChange={(e) => setFechaDesdeFilter(e.target.value)}
                    title="Fecha Recepción Desde"
                  />
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                    Desde
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="relative">
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={fechaHastaFilter}
                    onChange={(e) => setFechaHastaFilter(e.target.value)}
                    title="Fecha Recepción Hasta"
                  />
                  <span className="absolute -top-1.5 left-2 bg-white px-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                    Hasta
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFiltros}
                  className="w-full h-9 text-xs flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900"
                  title="Restablecer todos los filtros"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Limpiar</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* TABLA DE TELÉFONOS SERIALIZADOS */}
          <Card className="border-slate-200 overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Modelo & Variante</th>
                    <th className="py-3 px-4">IMEI 1 / Serie</th>
                    <th className="py-3 px-4">Condición</th>
                    <th className="py-3 px-4">Proveedor / Recepción</th>
                    <th className="py-3 px-4">
                      {user?.rol === 'ADMIN' ? 'Costo / P. Sugerido' : 'Precio Sugerido'}
                    </th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingDispositivos ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`skel-d-${i}`}>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-36 mb-1" /><Skeleton className="h-3 w-20" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-5 w-16 rounded" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-3 w-16" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-20 mb-1" /><Skeleton className="h-3 w-16" /></td>
                        <td className="py-3.5 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3.5 px-4 text-right"><Skeleton className="h-5 w-20 ml-auto rounded-full" /></td>
                      </tr>
                    ))
                  ) : dispositivos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Smartphone className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No se encontraron teléfonos con los criterios seleccionados.</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">Prueba cambiando el término de búsqueda, proveedor, sucursal o fechas.</p>
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
                    dispositivos.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900">
                              {d.variante?.modelo?.nombreModelo}
                            </p>
                            <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                              {d.variante?.modelo?.tipo || 'IPHONE'}
                            </Badge>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {d.variante?.color} •{' '}
                            {d.variante?.capacidadGb > 0
                              ? d.variante?.capacidadGb >= 1024
                                ? `${d.variante?.capacidadGb / 1024}TB`
                                : `${d.variante?.capacidadGb}GB`
                              : '0 GB'}{' '}
                            • {d.variante?.tipoSim}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <button
                            type="button"
                            onClick={() => setSelectedImeiForLifeline(d.imei1 || d.numeroSerie)}
                            className="group text-left inline-flex items-center gap-1.5 text-slate-900 font-semibold hover:text-slate-700 transition-colors"
                            title="Consultar Línea de Vida Completa"
                          >
                            <span>{d.imei1 || `S/N: ${d.numeroSerie}`}</span>
                            <History className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                          </button>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {d.imei1 ? `Serie: ${d.numeroSerie}` : 'Equipo Serializado'}
                            {d.imei2 && (
                              <button
                                type="button"
                                onClick={() => setSelectedImeiForLifeline(d.imei2)}
                                className="ml-1 text-slate-500 hover:text-slate-900 hover:underline"
                                title="Consultar Línea de Vida para IMEI 2"
                              >
                                | IMEI 2: {d.imei2}
                              </button>
                            )}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded border font-mono',
                              d.condicion === 'NUEVO'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            )}
                          >
                            {d.condicion}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <Truck className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{d.notaIngreso?.proveedor?.nombre || 'Mayorista Oficial'}</span>
                          </p>
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            Recibido: {d.notaIngreso?.fechaIngreso ? new Date(d.notaIngreso.fechaIngreso).toLocaleDateString('es-BO') : 'S/F'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-800">
                          {user?.rol === 'ADMIN' ? (
                            <>
                              <p className="font-semibold text-slate-900">
                                Bs {Number(d.costoBs || 0).toFixed(2)}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Sug: Bs {Number(d.precioVentaSugeridoBs || 0).toFixed(2)}
                              </p>
                            </>
                          ) : (
                            <p className="font-semibold text-slate-900">
                              Bs {Number(d.precioVentaSugeridoBs || 0).toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            <span>{d.sucursal?.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge
                            variant={
                              d.estadoInventario === 'DISPONIBLE'
                                ? 'success'
                                : d.estadoInventario === 'VENDIDO'
                                ? 'secondary'
                                : 'warning'
                            }
                          >
                            {d.estadoInventario}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* PIE DE PAGINACIÓN EN SERVIDOR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 shadow-subtle">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Mostrando{' '}
                <strong className="text-slate-900">
                  {dispositivosMeta.total === 0 ? 0 : (dispositivosMeta.page - 1) * dispositivosMeta.limit + 1}
                </strong>{' '}
                -{' '}
                <strong className="text-slate-900">
                  {Math.min(dispositivosMeta.page * dispositivosMeta.limit, dispositivosMeta.total)}
                </strong>{' '}
                de <strong className="text-slate-900">{dispositivosMeta.total}</strong> teléfonos serializados
              </span>

              {/* Selector de filas por página */}
              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                <span className="text-slate-500">Filas:</span>
                <select
                  value={dispositivosMeta.limit}
                  onChange={(e) => {
                    const newLim = Number(e.target.value);
                    setDispositivosMeta((prev) => ({ ...prev, limit: newLim }));
                    fetchDispositivos(1, newLim);
                  }}
                  className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 mr-1">
                Página {dispositivosMeta.page} de {dispositivosMeta.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={!dispositivosMeta.hasPrevPage || isLoadingDispositivos}
                onClick={() => fetchDispositivos(dispositivosMeta.page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                disabled={!dispositivosMeta.hasNextPage || isLoadingDispositivos}
                onClick={() => fetchDispositivos(dispositivosMeta.page + 1)}
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: LOTES DE ACCESORIOS (US10) */}
      {activeTab === 'accesorios' && (
        <div className="space-y-4">
          <Card className="border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Accesorio Base</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Lote Diferenciador</th>
                    {user?.rol === 'ADMIN' && <th className="py-3 px-4">Costo Adquisición</th>}
                    <th className="py-3 px-4">Precio Sugerido</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingAccesorios ? (
                    <tr>
                      <td colSpan={user?.rol === 'ADMIN' ? 6 : 5} className="py-8 text-center">
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                      </td>
                    </tr>
                  ) : accesorios.flatMap((a) => a.lotes || []).length === 0 ? (
                    <tr>
                      <td colSpan={user?.rol === 'ADMIN' ? 6 : 5} className="py-12 text-center text-slate-500">
                        No hay lotes de accesorios registrados aún. Utiliza el formulario de Recepción para dar de alta existencias.
                      </td>
                    </tr>
                  ) : (
                    accesorios.flatMap((acc) =>
                      (acc.lotes || []).map((lote: any) => (
                        <tr key={lote.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {acc.nombre}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {acc.categoria?.nombre}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {lote.nombreDiferenciador}
                          </td>
                          {user?.rol === 'ADMIN' && (
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              Bs {Number(lote.costoUnitarioBs || 0).toFixed(2)}
                            </td>
                          )}
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                            Bs {Number(lote.precioVentaBs).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full font-bold text-xs',
                                lote.stockActual > 5
                                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                  : 'bg-slate-900 text-white border border-slate-900'
                              )}
                            >
                              {lote.stockActual} u.
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* PESTAÑA 3: CATÁLOGO DE MODELOS Y VARIANTES (US05 & US06) */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Catálogo Oficial Apple & Invariante de Variantes
              </h3>
              <p className="text-xs text-slate-500">
                Todo modelo existe obligatoriamente con al menos una variante (Color, Capacidad, SIM).
              </p>
            </div>

            <div className="flex gap-2">
              {user?.rol === 'ADMIN' && (
                <Button
                  size="sm"
                  onClick={() => setModalNuevoModeloOpen(true)}
                  className="text-xs"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nuevo Modelo
                </Button>
              )}
            </div>
          </div>

          {/* Grid de Modelos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingModelos ? (
              <Skeleton className="h-44 w-full rounded-2xl" />
            ) : (
              modelos.map((m) => (
                <Card key={m.id} className="border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <div>
                    <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-slate-900">
                            {m.nombreModelo}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {m.tipo || 'IPHONE'}
                          </Badge>
                        </div>
                        <CardDescription className="text-[11px] text-slate-500">
                          Marca: {m.marca}
                        </CardDescription>
                      </div>
                      <Badge variant="mono">{m.variantes?.length || 0} variantes</Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        Variantes registradas:
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pb-1">
                        {m.variantes?.map((v: any) => (
                          <div
                            key={v.id}
                            className="group/v inline-flex items-center gap-1.5 text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700 hover:border-slate-300 transition-colors"
                          >
                            <span>
                              {v.color} •{' '}
                              {v.capacidadGb > 0
                                ? v.capacidadGb >= 1024
                                  ? `${v.capacidadGb / 1024}TB`
                                  : `${v.capacidadGb}GB`
                                : '0 GB'}{' '}
                              [{v.tipoSim}]
                            </span>
                            {user?.rol === 'ADMIN' && (
                              <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVariante(m, v)}
                                  className="text-slate-400 hover:text-slate-900 p-0.5 rounded transition-colors"
                                  title="Editar variante"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteVariante(m, v)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                                  title="Eliminar variante"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {m.variantes?.length || 0} combinaciones
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddVariante(m)}
                        className="text-xs h-7 px-2.5 border-dashed border-slate-300 hover:border-slate-400"
                        title="Agregar nueva combinación a este modelo"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Variante
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR MODELO (INVARIANTE ATÓMICA US05) */}
      <Modal
        isOpen={modalNuevoModeloOpen}
        onClose={() => setModalNuevoModeloOpen(false)}
        title="Crear Nuevo Modelo con Variante Obligatoria"
        description="Por regla inmutable de negocio, ningún modelo puede nacer sin al menos una variante."
      >
        <form onSubmit={handleCreateModelo} className="space-y-4 pt-2">
          {creacionError && (
            <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs">
              {creacionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Nombre del Modelo</Label>
              <Input
                placeholder="Ej: MacBook Air M3, AirPods Pro 2..."
                value={nuevoNombreModelo}
                onChange={(e) => setNuevoNombreModelo(e.target.value)}
              />
            </div>

            <div>
              <Label required>Tipo de Dispositivo</Label>
              <Select
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value as any)}
              >
                <option value="IPHONE">iPhone (Smartphone)</option>
                <option value="MAC">Mac / MacBook</option>
                <option value="IPAD">iPad</option>
                <option value="WATCH">Apple Watch</option>
                <option value="AIRPODS">AirPods / Auriculares</option>
                <option value="OTRO">Otro Dispositivo Apple</option>
              </Select>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <p className="text-xs font-bold text-slate-900">
              Primera Variante Obligatoria (Invariante)
            </p>

            <div>
              <Label required>Color de Lanzamiento</Label>
              <Input
                placeholder="Ej: Titanium Silver, Space Gray, Blanco"
                value={primeraVarColor}
                onChange={(e) => setPrimeraVarColor(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>Capacidad</Label>
                <Select
                  value={primeraVarCapacidad}
                  onChange={(e) => setPrimeraVarCapacidad(Number(e.target.value))}
                >
                  <option value="0">0 GB (Sin alm. / AirPods)</option>
                  <option value="64">64 GB</option>
                  <option value="128">128 GB</option>
                  <option value="256">256 GB</option>
                  <option value="512">512 GB</option>
                  <option value="1024">1 TB</option>
                  <option value="2048">2 TB</option>
                </Select>
              </div>

              <div>
                <Label required>Tipo SIM / Conectividad</Label>
                <Select
                  value={primeraVarSim}
                  onChange={(e) => setPrimeraVarSim(e.target.value)}
                >
                  <option value="SIM Físico">SIM Físico</option>
                  <option value="eSIM Exclusivo">eSIM Exclusivo</option>
                  <option value="Dual SIM Físico">Dual SIM Físico</option>
                  <option value="No Aplica">No Aplica (Mac / AirPods / Wi-Fi)</option>
                  <option value="GPS Only">GPS Only (Apple Watch)</option>
                  <option value="GPS + Cellular">GPS + Cellular (Apple Watch)</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalNuevoModeloOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isCreatingModelo}
              disabled={!nuevoNombreModelo.trim() || !primeraVarColor.trim()}
            >
              Crear Modelo Atómico
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: AGREGAR VARIANTE A MODELO EXISTENTE (Abierto a todos los usuarios) */}
      <Modal
        isOpen={modalAddVarianteOpen}
        onClose={() => setModalAddVarianteOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span>Agregar Variante</span>
            {selectedModeloForAdd && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {selectedModeloForAdd.tipo || 'IPHONE'}
              </Badge>
            )}
          </div>
        }
        description={`Crea una nueva combinación de color, almacenamiento y conectividad para ${selectedModeloForAdd?.nombreModelo || 'el modelo'}.`}
      >
        <form onSubmit={handleConfirmAddVariante} className="space-y-4 pt-2">
          {addVarianteError && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{addVarianteError}</span>
            </div>
          )}

          <div>
            <Label required>Color de la Variante</Label>
            <Input
              placeholder="Ej: Titanio del Desierto, Midnight Blue, Blanco..."
              value={addVarColor}
              onChange={(e) => setAddVarColor(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Capacidad de Almacenamiento</Label>
              <Select
                value={addVarCapacidad}
                onChange={(e) => setAddVarCapacidad(Number(e.target.value))}
              >
                <option value="0">0 GB (Sin almacenamiento / AirPods / Watch)</option>
                <option value="64">64 GB</option>
                <option value="128">128 GB</option>
                <option value="256">256 GB</option>
                <option value="512">512 GB</option>
                <option value="1024">1 TB (1024 GB)</option>
                <option value="2048">2 TB (2048 GB)</option>
              </Select>
            </div>

            <div>
              <Label required>Conectividad / SIM</Label>
              <Select
                value={addVarSim}
                onChange={(e) => setAddVarSim(e.target.value)}
              >
                <option value="SIM Físico">SIM Físico</option>
                <option value="eSIM Exclusivo">eSIM Exclusivo</option>
                <option value="Dual SIM Físico">Dual SIM Físico</option>
                <option value="No Aplica">No Aplica (Mac / AirPods / Wi-Fi)</option>
                <option value="GPS Only">GPS Only (Apple Watch)</option>
                <option value="GPS + Cellular">GPS + Cellular (Apple Watch)</option>
              </Select>
            </div>
          </div>

          {/* Previsualización en vivo */}
          {addVarColor.trim() && (
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
              <span>
                Se registrará:{' '}
                <strong>
                  {selectedModeloForAdd?.nombreModelo} - {addVarColor.trim()} (
                  {addVarCapacidad > 0
                    ? addVarCapacidad >= 1024
                      ? `${addVarCapacidad / 1024}TB`
                      : `${addVarCapacidad}GB`
                    : '0 GB'}
                  ) [{addVarSim}]
                </strong>
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setModalAddVarianteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 text-xs font-semibold"
              isLoading={isAddingVariante}
              disabled={!addVarColor.trim()}
            >
              Agregar al Catálogo
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDITAR VARIANTE (Exclusivo ADMIN) */}
      <Modal
        isOpen={modalEditVarianteOpen}
        onClose={() => setModalEditVarianteOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-slate-800" />
            <span>Editar Variante ({selectedModeloForEdit?.nombreModelo})</span>
          </div>
        }
        description="Modifica los atributos oficiales de esta variante. El cambio se reflejará en todo el catálogo e inventario."
      >
        <form onSubmit={handleConfirmEditVariante} className="space-y-4 pt-2">
          {editVarianteError && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{editVarianteError}</span>
            </div>
          )}

          <div>
            <Label required>Color de la Variante</Label>
            <Input
              value={editVarColor}
              onChange={(e) => setEditVarColor(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Capacidad de Almacenamiento</Label>
              <Select
                value={editVarCapacidad}
                onChange={(e) => setEditVarCapacidad(Number(e.target.value))}
              >
                <option value="0">0 GB (Sin almacenamiento / AirPods / Watch)</option>
                <option value="64">64 GB</option>
                <option value="128">128 GB</option>
                <option value="256">256 GB</option>
                <option value="512">512 GB</option>
                <option value="1024">1 TB (1024 GB)</option>
                <option value="2048">2 TB (2048 GB)</option>
              </Select>
            </div>

            <div>
              <Label required>Conectividad / SIM</Label>
              <Select
                value={editVarSim}
                onChange={(e) => setEditVarSim(e.target.value)}
              >
                <option value="SIM Físico">SIM Físico</option>
                <option value="eSIM Exclusivo">eSIM Exclusivo</option>
                <option value="Dual SIM Físico">Dual SIM Físico</option>
                <option value="No Aplica">No Aplica (Mac / AirPods / Wi-Fi)</option>
                <option value="GPS Only">GPS Only (Apple Watch)</option>
                <option value="GPS + Cellular">GPS + Cellular (Apple Watch)</option>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setModalEditVarianteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 text-xs font-semibold"
              isLoading={isUpdatingVariante}
              disabled={!editVarColor.trim()}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CONFIRMAR ELIMINACIÓN DE VARIANTE (Exclusivo ADMIN) */}
      <Modal
        isOpen={modalDeleteVarianteOpen}
        onClose={() => setModalDeleteVarianteOpen(false)}
        title={
          <div className="flex items-center gap-2 text-rose-700">
            <Trash2 className="h-4 w-4" />
            <span>Eliminar Variante</span>
          </div>
        }
        description="Esta acción eliminará de forma permanente esta combinación del catálogo oficial."
      >
        <div className="space-y-4 pt-2">
          {deleteVarianteError && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{deleteVarianteError}</span>
            </div>
          )}

          <p className="text-xs text-slate-700">
            ¿Confirmas que deseas eliminar la variante{' '}
            <strong className="text-slate-900 font-semibold">
              &quot;{selectedVarianteForDelete?.color} (
              {selectedVarianteForDelete?.capacidadGb > 0
                ? `${selectedVarianteForDelete?.capacidadGb}GB`
                : '0 GB'}
              )&quot;
            </strong>{' '}
            del modelo{' '}
            <strong className="text-slate-900 font-semibold">
              {selectedModeloForDelete?.nombreModelo}
            </strong>
            ?
          </p>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[11px] leading-relaxed">
            <strong>Protección de Integridad:</strong> Si la variante tiene equipos asociados en
            inventario físico o historial de ventas, o si es la única variante del modelo, la
            eliminación será bloqueada de inmediato por la base de datos.
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setModalDeleteVarianteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1 text-xs font-semibold"
              isLoading={isDeletingVariante}
              onClick={handleConfirmDeleteVariante}
            >
              Confirmar Eliminación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Interactivo de Línea de Vida por IMEI (US18) */}
      <ModalLineaVida
        isOpen={Boolean(selectedImeiForLifeline)}
        onClose={() => setSelectedImeiForLifeline(null)}
        imei={selectedImeiForLifeline}
      />
    </div>
  );
}
