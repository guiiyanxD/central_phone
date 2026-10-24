'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

import {
  DispositivosMeta,
  LoteAccesorioItem,
  LotesMeta,
} from '@/features/inventario/types';
import { InventarioHeader } from '@/features/inventario/components/inventario-header';
import { InventarioTelefonosTab } from '@/features/inventario/components/inventario-telefonos-tab';
import { InventarioAccesoriosTab } from '@/features/inventario/components/inventario-accesorios-tab';
import { ModalLineaVida } from '@/features/inventario/components/modal-linea-vida';

export default function InventarioPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'telefonos' | 'accesorios'>('telefonos');

  // Listas maestras compartidas para filtros
  const [proveedoresList, setProveedoresList] = useState<any[]>([]);
  const [sucursalesList, setSucursalesList] = useState<any[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);

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

  // Filtros de búsqueda para teléfonos
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [condicionFilter, setCondicionFilter] = useState('TODAS');
  const [sucursalFilter, setSucursalFilter] = useState('TODAS');
  const [proveedorFilter, setProveedorFilter] = useState('TODOS');
  const [fechaDesdeFilter, setFechaDesdeFilter] = useState('');
  const [fechaHastaFilter, setFechaHastaFilter] = useState('');

  // Estados de Lotes de Accesorios con Paginación y Filtros
  const [lotes, setLotes] = useState<LoteAccesorioItem[]>([]);
  const [lotesMeta, setLotesMeta] = useState<LotesMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoadingLotes, setIsLoadingLotes] = useState(true);

  // Filtros para lotes de accesorios
  const [lotesSearch, setLotesSearch] = useState('');
  const [lotesSearchDebounce, setLotesSearchDebounce] = useState('');
  const [lotesCategoria, setLotesCategoria] = useState('TODAS');
  const [lotesSucursal, setLotesSucursal] = useState('TODAS');
  const [lotesStock, setLotesStock] = useState('TODOS');

  // Debounce para búsqueda textual de teléfonos
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce para búsqueda textual de accesorios
  useEffect(() => {
    const timer = setTimeout(() => {
      setLotesSearchDebounce(lotesSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [lotesSearch]);

  // Carga inicial de listas maestras
  useEffect(() => {
    Promise.all([
      api.proveedores.getAll().catch(() => []),
      api.sucursales.getAll().catch(() => []),
      api.accesorios.getCategorias().catch(() => []),
    ]).then(([provs, sucs, cats]) => {
      setProveedoresList(provs);
      setSucursalesList(sucs);
      setCategoriasList(cats);
    });
  }, []);

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

  // Carga de lotes de accesorios con paginación y filtros en servidor
  const fetchLotes = async (pageToFetch = 1, currentLimit = lotesMeta.limit) => {
    setIsLoadingLotes(true);
    try {
      const res = await api.accesorios.getLotes({
        page: pageToFetch,
        limit: currentLimit,
        busqueda: lotesSearchDebounce.trim() || undefined,
        categoriaId: lotesCategoria !== 'TODAS' ? Number(lotesCategoria) : undefined,
        sucursalId: lotesSucursal !== 'TODAS' ? Number(lotesSucursal) : undefined,
        stock: lotesStock as any,
      });

      setLotes(res.data || []);
      setLotesMeta(
        res.meta || {
          total: res.data?.length || 0,
          page: pageToFetch,
          limit: currentLimit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      console.error('Error al obtener lotes de accesorios:', err);
      setLotes([]);
    } finally {
      setIsLoadingLotes(false);
    }
  };

  const handleResetLotesFiltros = () => {
    setLotesSearch('');
    setLotesSearchDebounce('');
    setLotesCategoria('TODAS');
    setLotesSucursal('TODAS');
    setLotesStock('TODOS');
  };

  // Efecto para consultar teléfonos cuando cambia su pestaña o filtros
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

  // Efecto para consultar lotes cuando cambia su pestaña o filtros
  useEffect(() => {
    if (activeTab === 'accesorios') {
      fetchLotes(1);
    }
  }, [
    activeTab,
    lotesCategoria,
    lotesSucursal,
    lotesStock,
    lotesSearchDebounce,
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      <InventarioHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telefonosTotal={dispositivosMeta.total}
        lotesTotal={lotesMeta.total}
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
          lotes={lotes}
          lotesMeta={lotesMeta}
          setLotesMeta={setLotesMeta}
          isLoadingLotes={isLoadingLotes}
          isAdmin={isAdmin}
          searchQuery={lotesSearch}
          setSearchQuery={setLotesSearch}
          categoriaFilter={lotesCategoria}
          setCategoriaFilter={setLotesCategoria}
          sucursalFilter={lotesSucursal}
          setSucursalFilter={setLotesSucursal}
          stockFilter={lotesStock}
          setStockFilter={setLotesStock}
          categoriasList={categoriasList}
          sucursalesList={sucursalesList}
          onResetFiltros={handleResetLotesFiltros}
          onFetchLotes={fetchLotes}
        />
      )}

      {/* Modal de Línea de Vida para Equipos Físicos */}
      <ModalLineaVida
        isOpen={Boolean(selectedImeiForLifeline)}
        onClose={() => setSelectedImeiForLifeline(null)}
        imei={selectedImeiForLifeline}
      />
    </div>
  );
}
