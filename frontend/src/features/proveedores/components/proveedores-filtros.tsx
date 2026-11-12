'use client';

import React from 'react';
import { Search, X, Filter, Users, Truck, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProveedoresFiltrosProps {
  search: string;
  setSearch: (val: string) => void;
  activoFiltro: string; // 'TODOS' | 'ACTIVOS' | 'INACTIVOS'
  setActivoFiltro: (val: string) => void;
  tipoFiltro: string; // 'TODOS' | 'MAYORISTA' | 'MINORISTA'
  setTipoFiltro: (val: string) => void;
  totalCount: number;
  mayoristasCount: number;
  minoristasCount: number;
  onReset: () => void;
}

export function ProveedoresFiltros({
  search,
  setSearch,
  activoFiltro,
  setActivoFiltro,
  tipoFiltro,
  setTipoFiltro,
  totalCount,
  mayoristasCount,
  minoristasCount,
  onReset,
}: ProveedoresFiltrosProps) {
  const hasActiveFilters =
    search.trim() !== '' || activoFiltro !== 'TODOS' || tipoFiltro !== 'TODOS';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-3">
      {/* Pestañas de Clasificación */}
      <Tabs value={tipoFiltro} onValueChange={setTipoFiltro}>
        <TabsList variant="line" className="w-full justify-start pb-2 border-b border-slate-100">
          <TabsTrigger value="TODOS" variant="line" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>Todos ({totalCount})</span>
          </TabsTrigger>
          <TabsTrigger value="MAYORISTA" variant="line" className="gap-1.5 text-xs">
            <Truck className="h-3.5 w-3.5 text-blue-600" />
            <span>Mayoristas ({mayoristasCount})</span>
          </TabsTrigger>
          <TabsTrigger value="MINORISTA" variant="line" className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5 text-purple-600" />
            <span>Minoristas / Permutas ({minoristasCount})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Barra de búsqueda por texto */}
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por contacto, empresa o teléfono..."
            className="pl-9 h-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Selector de Estado Activo/Inactivo */}
        <div>
          <Select
            value={activoFiltro}
            onChange={(e) => setActivoFiltro(e.target.value)}
            className="h-10 text-sm"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Solo activos (Habilitados)</option>
            <option value="INACTIVOS">Solo pausados (Inactivos)</option>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Filtros aplicados</span>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
}
