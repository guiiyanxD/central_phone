'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RolUsuario } from '../types';

interface SucursalOption {
  id: number;
  nombre: string;
  ciudad: string;
}

interface UsuariosFiltrosProps {
  search: string;
  setSearch: (val: string) => void;
  sucursalId: number | undefined;
  setSucursalId: (val: number | undefined) => void;
  rol: RolUsuario | undefined;
  setRol: (val: RolUsuario | undefined) => void;
  activo: boolean | undefined;
  setActivo: (val: boolean | undefined) => void;
  sucursales: SucursalOption[];
  onReset: () => void;
}

export function UsuariosFiltros({
  search,
  setSearch,
  sucursalId,
  setSucursalId,
  rol,
  setRol,
  activo,
  setActivo,
  sucursales,
  onReset,
}: UsuariosFiltrosProps) {
  const hasActiveFilters =
    search.trim() !== '' ||
    sucursalId !== undefined ||
    rol !== undefined ||
    activo !== undefined;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Barra de búsqueda por texto */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, usuario..."
            className="pl-9 h-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Selector de Sucursal */}
        <div>
          <Select
            value={sucursalId !== undefined ? sucursalId.toString() : ''}
            onChange={(e) => {
              const val = e.target.value;
              setSucursalId(val ? parseInt(val, 10) : undefined);
            }}
            className="h-10 text-sm"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.ciudad})
              </option>
            ))}
          </Select>
        </div>

        {/* Selector de Rol */}
        <div>
          <Select
            value={rol || ''}
            onChange={(e) => {
              const val = e.target.value as RolUsuario | '';
              setRol(val || undefined);
            }}
            className="h-10 text-sm"
          >
            <option value="">Todos los roles</option>
            <option value="ADMIN">Administrador (ADMIN)</option>
            <option value="VENDEDOR">Vendedor de Tienda (VENDEDOR)</option>
          </Select>
        </div>

        {/* Selector de Estado Activo/Inactivo */}
        <div>
          <Select
            value={activo === undefined ? '' : activo ? 'true' : 'false'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'true') setActivo(true);
              else if (val === 'false') setActivo(false);
              else setActivo(undefined);
            }}
            className="h-10 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
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
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Restablecer todos los filtros
          </button>
        </div>
      )}
    </div>
  );
}
