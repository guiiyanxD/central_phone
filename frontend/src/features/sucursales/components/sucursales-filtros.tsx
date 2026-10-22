'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface SucursalesFiltrosProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filtroCiudad: string;
  setFiltroCiudad: (val: string) => void;
  includeInactivas: boolean;
  setIncludeInactivas: (val: boolean) => void;
  ciudadesDisponibles: string[];
}

export function SucursalesFiltros({
  searchQuery,
  setSearchQuery,
  filtroCiudad,
  setFiltroCiudad,
  includeInactivas,
  setIncludeInactivas,
  ciudadesDisponibles,
}: SucursalesFiltrosProps) {
  return (
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
  );
}
