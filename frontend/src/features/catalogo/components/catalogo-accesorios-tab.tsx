'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Pencil,
  Trash2,
  Headphones,
  Plus,
  Layers,
  XCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AccesorioItem, CategoriaAccesorioItem } from '../types';

interface CatalogoAccesoriosTabProps {
  accesorios: AccesorioItem[];
  categorias: CategoriaAccesorioItem[];
  isLoading: boolean;
  isAdmin: boolean;
  onOpenNuevoAccesorio: () => void;
  onOpenGestionarCategorias: () => void;
  onOpenEditAccesorio: (acc: AccesorioItem) => void;
  onOpenDeleteAccesorio: (acc: AccesorioItem) => void;
}

export function CatalogoAccesoriosTab({
  accesorios,
  categorias,
  isLoading,
  isAdmin,
  onOpenNuevoAccesorio,
  onOpenGestionarCategorias,
  onOpenEditAccesorio,
  onOpenDeleteAccesorio,
}: CatalogoAccesoriosTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');

  // Filtrado reactivo en memoria
  const filteredAccesorios = useMemo(() => {
    return accesorios.filter((acc) => {
      const matchCat =
        selectedCategoria === 'TODAS' ||
        String(acc.categoriaId) === selectedCategoria;

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        acc.nombre.toLowerCase().includes(q) ||
        (acc.descripcion && acc.descripcion.toLowerCase().includes(q)) ||
        (acc.categoria?.nombre && acc.categoria.nombre.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [accesorios, selectedCategoria, search]);

  const hasFilters = search.trim() !== '' || selectedCategoria !== 'TODAS';

  const resetFilters = () => {
    setSearch('');
    setSelectedCategoria('TODAS');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Búsqueda por texto */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, tipo o descripción..."
              aria-label="Buscar por nombre, tipo o descripción de accesorio"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filtro por Categoría */}
          <div className="w-full sm:w-56">
            <Select
              aria-label="Filtrar por categoría de accesorio"
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
            >
              <option value="TODAS">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
          </div>

          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs h-9 text-slate-500 hover:text-slate-900"
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenGestionarCategorias}
            className="text-xs"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Gestionar Categorías
          </Button>

          <Button
            size="sm"
            onClick={onOpenNuevoAccesorio}
            className="text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo Accesorio
          </Button>
        </div>
      </div>

      {/* Tabla del Catálogo de Accesorios */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Accesorio Base</th>
                <th className="py-3 px-4">Categoría / Tipo</th>
                <th className="py-3 px-4">Descripción / Detalles</th>
                <th className="py-3 px-4 text-center">Lotes en Stock</th>
                {isAdmin && <th className="py-3 px-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-8 text-center">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredAccesorios.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="py-12 text-center text-slate-500"
                  >
                    {hasFilters ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-6 w-6 text-slate-400" />
                        <p>No se encontraron accesorios que coincidan con los filtros aplicados.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="mt-1 text-xs"
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Headphones className="h-6 w-6 text-slate-400" />
                        <p>No hay accesorios registrados en el catálogo maestro.</p>
                        <Button
                          size="sm"
                          onClick={onOpenNuevoAccesorio}
                          className="mt-1 text-xs"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Registrar Primer Accesorio
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAccesorios.map((acc) => {
                  const lotesCount =
                    acc._count?.lotes ?? acc.lotes?.length ?? 0;
                  const canDelete = lotesCount === 0;

                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {acc.nombre}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {acc.categoria?.nombre || 'General'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {acc.descripcion ? (
                          <span title={acc.descripcion}>{acc.descripcion}</span>
                        ) : (
                          <span className="text-slate-400 italic">Sin descripción</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            lotesCount > 0
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                          title={
                            lotesCount > 0
                              ? `Tiene ${lotesCount} lote(s) asociado(s) en inventario`
                              : 'Sin lotes asociados (eliminable)'
                          }
                        >
                          {lotesCount} {lotesCount === 1 ? 'lote' : 'lotes'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenEditAccesorio(acc)}
                              className="h-7 px-2 text-slate-600 hover:text-slate-900 border-slate-200"
                              title="Editar nombre, categoría o descripción"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!canDelete}
                              onClick={() => onOpenDeleteAccesorio(acc)}
                              className={`h-7 px-2 text-rose-600 border-slate-200 hover:bg-rose-50 hover:border-rose-200 ${
                                !canDelete ? 'opacity-40 cursor-not-allowed text-slate-400' : ''
                              }`}
                              title={
                                canDelete
                                  ? 'Eliminar accesorio del catálogo'
                                  : `No se puede eliminar: tiene ${lotesCount} lote(s) asociados en el inventario`
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
