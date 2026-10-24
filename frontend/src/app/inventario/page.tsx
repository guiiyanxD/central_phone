'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

import { DispositivosMeta } from '@/features/inventario/types';
import { InventarioHeader } from '@/features/inventario/components/inventario-header';
import { InventarioTelefonosTab } from '@/features/inventario/components/inventario-telefonos-tab';
import { InventarioAccesoriosTab } from '@/features/inventario/components/inventario-accesorios-tab';
import { ModalLineaVida } from '@/features/inventario/components/modal-linea-vida';

export default function InventarioPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'telefonos' | 'accesorios'>('telefonos');

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

  useEffect(() => {
    Promise.all([
      api.proveedores.getAll().catch(() => []),
      api.sucursales.getAll().catch(() => []),
    ]).then(([provs, sucs]) => {
      setProveedoresList(provs);
      setSucursalesList(sucs);
    });
    fetchAccesorios();
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      <InventarioHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telefonosTotal={dispositivosMeta.total}
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

      {/* Modal de Línea de Vida para Equipos Físicos */}
      <ModalLineaVida
        isOpen={Boolean(selectedImeiForLifeline)}
        onClose={() => setSelectedImeiForLifeline(null)}
        imei={selectedImeiForLifeline}
      />
    </div>
  );
}
