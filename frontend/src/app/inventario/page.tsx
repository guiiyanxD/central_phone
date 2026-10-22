'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

import { DispositivosMeta } from '@/features/inventario/types';
import { InventarioHeader } from '@/features/inventario/components/inventario-header';
import { InventarioTelefonosTab } from '@/features/inventario/components/inventario-telefonos-tab';
import { InventarioAccesoriosTab } from '@/features/inventario/components/inventario-accesorios-tab';
import { InventarioCatalogoTab } from '@/features/inventario/components/inventario-catalogo-tab';
import { ModalNuevoModelo } from '@/features/inventario/components/modal-nuevo-modelo';
import { ModalVarianteForm } from '@/features/inventario/components/modal-variante-form';
import { ModalVarianteDelete } from '@/features/inventario/components/modal-variante-delete';
import { ModalLineaVida } from '@/features/inventario/components/modal-linea-vida';

export default function InventarioPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'telefonos' | 'accesorios' | 'catalogo'>('telefonos');

  // Estados de Dispositivos (Smartphones) con Paginación y Filtros Multi-Criterio
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [dispositivosMeta, setDispositivosMeta] = useState<DispositivosMeta>({
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

  // Modal para Alta de Nuevo Modelo
  const [modalNuevoModeloOpen, setModalNuevoModeloOpen] = useState(false);
  const [nuevoNombreModelo, setNuevoNombreModelo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO'>('IPHONE');
  const [primeraVarColor, setPrimeraVarColor] = useState('');
  const [primeraVarCapacidad, setPrimeraVarCapacidad] = useState(256);
  const [primeraVarSim, setPrimeraVarSim] = useState('SIM Físico');
  const [isCreatingModelo, setIsCreatingModelo] = useState(false);
  const [creacionError, setCreacionError] = useState<string | null>(null);

  // Modal para Agregar Variante a Modelo Existente
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

  // Manejador para Alta Atómica de Modelo
  const handleCreateModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreModelo.trim() || !primeraVarColor.trim()) return;

    setIsCreatingModelo(true);
    setCreacionError(null);

    try {
      await api.modelos.create({
        nombreModelo: nuevoNombreModelo.trim(),
        marca: 'Apple',
        tipo: nuevoTipo,
        variantes: [
          {
            color: primeraVarColor.trim(),
            capacidadGb: Number(primeraVarCapacidad),
            tipoSim: primeraVarSim,
          },
        ],
      });

      setNuevoNombreModelo('');
      setPrimeraVarColor('');
      setPrimeraVarCapacidad(256);
      setPrimeraVarSim('SIM Físico');
      setModalNuevoModeloOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setCreacionError(err.message || 'Error al crear el modelo.');
    } finally {
      setIsCreatingModelo(false);
    }
  };

  // Manejadores de variantes
  const handleOpenAddVariante = (modelo: any) => {
    setSelectedModeloForAdd(modelo);
    setAddVarColor('');
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
    if (!selectedModeloForEdit || !selectedVarianteForEdit || !editVarColor.trim()) return;

    setIsUpdatingVariante(true);
    setEditVarianteError(null);

    try {
      await api.modelos.updateVariante(
        selectedVarianteForEdit.id,
        {
          color: editVarColor.trim(),
          capacidadGb: Number(editVarCapacidad),
          tipoSim: editVarSim,
        }
      );
      setModalEditVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setEditVarianteError(err.message || 'Error al actualizar la variante.');
    } finally {
      setIsUpdatingVariante(false);
    }
  };

  const handleOpenDeleteVariante = (modelo: any, variante: any) => {
    setSelectedModeloForDelete(modelo);
    setSelectedVarianteForDelete(variante);
    setDeleteVarianteError(null);
    setModalDeleteVarianteOpen(true);
  };

  const handleConfirmDeleteVariante = async () => {
    if (!selectedModeloForDelete || !selectedVarianteForDelete) return;

    setIsDeletingVariante(true);
    setDeleteVarianteError(null);

    try {
      await api.modelos.deleteVariante(
        selectedVarianteForDelete.id
      );
      setModalDeleteVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setDeleteVarianteError(err.message || 'No se pudo eliminar la variante.');
    } finally {
      setIsDeletingVariante(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      <InventarioHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telefonosTotal={dispositivosMeta.total}
        modelosTotal={modelos.length}
      />

      {activeTab === 'telefonos' && (
        <InventarioTelefonosTab
          dispositivos={dispositivos}
          dispositivosMeta={dispositivosMeta}
          setDispositivosMeta={setDispositivosMeta}
          isLoadingDispositivos={isLoadingDispositivos}
          isAdmin={isAdmin}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tipoFilter={tipoFilter}
          setTipoFilter={setTipoFilter}
          estadoFilter={estadoFilter}
          setEstadoFilter={setEstadoFilter}
          condicionFilter={condicionFilter}
          setCondicionFilter={setCondicionFilter}
          sucursalFilter={sucursalFilter}
          setSucursalFilter={setSucursalFilter}
          proveedorFilter={proveedorFilter}
          setProveedorFilter={setProveedorFilter}
          fechaDesdeFilter={fechaDesdeFilter}
          setFechaDesdeFilter={setFechaDesdeFilter}
          fechaHastaFilter={fechaHastaFilter}
          setFechaHastaFilter={setFechaHastaFilter}
          sucursalesList={sucursalesList}
          proveedoresList={proveedoresList}
          onResetFiltros={handleResetFiltros}
          onFetchDispositivos={fetchDispositivos}
          onSelectImeiForLifeline={(imei) => setSelectedImeiForLifeline(imei)}
        />
      )}

      {activeTab === 'accesorios' && (
        <InventarioAccesoriosTab
          accesorios={accesorios}
          isLoadingAccesorios={isLoadingAccesorios}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'catalogo' && (
        <InventarioCatalogoTab
          modelos={modelos}
          isLoadingModelos={isLoadingModelos}
          isAdmin={isAdmin}
          onOpenNuevoModelo={() => setModalNuevoModeloOpen(true)}
          onOpenAddVariante={handleOpenAddVariante}
          onOpenEditVariante={handleOpenEditVariante}
          onOpenDeleteVariante={handleOpenDeleteVariante}
        />
      )}

      {/* Modales */}
      <ModalNuevoModelo
        isOpen={modalNuevoModeloOpen}
        onClose={() => setModalNuevoModeloOpen(false)}
        nuevoNombreModelo={nuevoNombreModelo}
        setNuevoNombreModelo={setNuevoNombreModelo}
        nuevoTipo={nuevoTipo}
        setNuevoTipo={setNuevoTipo}
        primeraVarColor={primeraVarColor}
        setPrimeraVarColor={setPrimeraVarColor}
        primeraVarCapacidad={primeraVarCapacidad}
        setPrimeraVarCapacidad={setPrimeraVarCapacidad}
        primeraVarSim={primeraVarSim}
        setPrimeraVarSim={setPrimeraVarSim}
        isCreatingModelo={isCreatingModelo}
        creacionError={creacionError}
        onSubmit={handleCreateModelo}
      />

      <ModalVarianteForm
        mode="add"
        isOpen={modalAddVarianteOpen}
        onClose={() => setModalAddVarianteOpen(false)}
        modelo={selectedModeloForAdd}
        color={addVarColor}
        setColor={setAddVarColor}
        capacidad={addVarCapacidad}
        setCapacidad={setAddVarCapacidad}
        tipoSim={addVarSim}
        setTipoSim={setAddVarSim}
        isLoading={isAddingVariante}
        error={addVarianteError}
        onSubmit={handleConfirmAddVariante}
      />

      <ModalVarianteForm
        mode="edit"
        isOpen={modalEditVarianteOpen}
        onClose={() => setModalEditVarianteOpen(false)}
        modelo={selectedModeloForEdit}
        color={editVarColor}
        setColor={setEditVarColor}
        capacidad={editVarCapacidad}
        setCapacidad={setEditVarCapacidad}
        tipoSim={editVarSim}
        setTipoSim={setEditVarSim}
        isLoading={isUpdatingVariante}
        error={editVarianteError}
        onSubmit={handleConfirmEditVariante}
      />

      <ModalVarianteDelete
        isOpen={modalDeleteVarianteOpen}
        onClose={() => setModalDeleteVarianteOpen(false)}
        modelo={selectedModeloForDelete}
        variante={selectedVarianteForDelete}
        isLoading={isDeletingVariante}
        error={deleteVarianteError}
        onConfirm={handleConfirmDeleteVariante}
      />

      <ModalLineaVida
        isOpen={Boolean(selectedImeiForLifeline)}
        onClose={() => setSelectedImeiForLifeline(null)}
        imei={selectedImeiForLifeline}
      />
    </div>
  );
}
