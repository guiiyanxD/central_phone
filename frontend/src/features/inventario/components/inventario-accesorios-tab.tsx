'use client';

import React from 'react';
import {
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Headphones,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LoteAccesorioItem, LotesMeta } from '../types';

interface InventarioAccesoriosTabProps {
  lotes: LoteAccesorioItem[];
  lotesMeta: LotesMeta;
  setLotesMeta: React.Dispatch<React.SetStateAction<LotesMeta>>;
  isLoadingLotes: boolean;
  isAdmin: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categoriaFilter: string;
  setCategoriaFilter: (val: string) => void;
  sucursalFilter: string;
  setSucursalFilter: (val: string) => void;
  stockFilter: string;
  setStockFilter: (val: string) => void;
  categoriasList: any[];
  sucursalesList: any[];
  onResetFiltros: () => void;
  onFetchLotes: (page?: number, limit?: number) => void;
}

export function InventarioAccesoriosTab({
  lotes,
  lotesMeta,
  setLotesMeta,
  isLoadingLotes,
  isAdmin,
  searchQuery,
  setSearchQuery,
  categoriaFilter,
  setCategoriaFilter,
  sucursalFilter,
  setSucursalFilter,
  stockFilter,
  setStockFilter,
  categoriasList,
  sucursalesList,
  onResetFiltros,
  onFetchLotes,
}: InventarioAccesoriosTabProps) {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoriaFilter !== 'TODAS' ||
    sucursalFilter !== 'TODAS' ||
    stockFilter !== 'TODOS';

  const colSpanTotal = isAdmin ? 7 : 6;

  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS MULTI-CRITERIO Y BÚSQUEDA */}
      <Card className="p-4 border-slate-200 bg-white shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Búsqueda por texto */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 pr-8 h-9 text-xs"
              placeholder="Buscar por accesorio, diferenciador, sucursal..."
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

          {/* Filtro por Categoría */}
          <div className="lg:col-span-3">
            <Select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="TODAS">Todas las categorías</option>
              {categoriasList.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro por Sucursal (Multi-tienda) */}
          <div className="lg:col-span-2">
            <Select
              value={sucursalFilter}
              onChange={(e) => setSucursalFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="TODAS">Todas las sucursales</option>
              {sucursalesList.map((suc) => (
                <option key={suc.id} value={String(suc.id)}>
                  {suc.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro por Disponibilidad de Stock */}
          <div className="lg:col-span-2">
            <Select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="TODOS">Todos los stocks</option>
              <option value="EN_STOCK">En Stock (&gt; 0 u.)</option>
              <option value="AGOTADO">Agotados (0 u.)</option>
            </Select>
          </div>
        </div>

        {/* Fila de estado de filtros y reseteo */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtros activos aplicados a la consulta.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFiltros}
              className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
            >
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </Card>

      {/* TABLA DE LOTES DE ACCESORIOS */}
      <Card className="border-slate-200 overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Accesorio Base</th>
                <th className="py-3 px-4">Lote Diferenciador</th>
                <th className="py-3 px-4">Sucursal</th>
                {isAdmin && <th className="py-3 px-4 font-mono">Costo Adquisición</th>}
                <th className="py-3 px-4 font-mono">Precio Sugerido</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-right">Fecha Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingLotes ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={colSpanTotal} className="py-4 px-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : lotes.length === 0 ? (
                <tr>
                  <td colSpan={colSpanTotal} className="py-12 text-center text-slate-500">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-6 w-6 text-slate-400" />
                        <p>No se encontraron lotes de accesorios con los filtros aplicados.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onResetFiltros}
                          className="mt-1 text-xs"
                        >
                          Restablecer búsqueda
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Headphones className="h-6 w-6 text-slate-400" />
                        <p>
                          No hay lotes de accesorios registrados aún. Utiliza el módulo de
                          Recepción para registrar mercadería.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                lotes.map((lote) => {
                  const stock = Number(lote.stockActual || 0);
                  const fecha = lote.fechaIngreso
                    ? new Date(lote.fechaIngreso).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '-';

                  return (
                    <tr
                      key={lote.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{lote.accesorio?.nombre || 'Accesorio'}</span>
                          {lote.accesorio?.categoria && (
                            <Badge variant="outline" className="text-[10px] py-0 font-normal">
                              {lote.accesorio.categoria.nombre}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {lote.nombreDiferenciador}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{lote.sucursal?.nombre || 'Sin sucursal'}</span>
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          Bs {Number(lote.costoUnitarioBs || 0).toFixed(2)}
                        </td>
                      )}

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        Bs {Number(lote.precioVentaBs || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full font-bold text-xs',
                            stock > 5
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : stock > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          )}
                        >
                          {stock} u.
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        <div className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{fecha}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              {lotesMeta.total === 0 ? 0 : (lotesMeta.page - 1) * lotesMeta.limit + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-900">
              {Math.min(lotesMeta.page * lotesMeta.limit, lotesMeta.total)}
            </strong>{' '}
            de <strong className="text-slate-900">{lotesMeta.total}</strong> lotes de accesorios
          </span>

          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-500">Filas:</span>
            <select
              value={lotesMeta.limit}
              onChange={(e) => {
                const newLim = Number(e.target.value);
                setLotesMeta((prev) => ({ ...prev, limit: newLim }));
                onFetchLotes(1, newLim);
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
            Página {lotesMeta.page} de {lotesMeta.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            disabled={!lotesMeta.hasPrevPage || isLoadingLotes}
            onClick={() => onFetchLotes(lotesMeta.page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Anterior</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            disabled={!lotesMeta.hasNextPage || isLoadingLotes}
            onClick={() => onFetchLotes(lotesMeta.page + 1)}
          >
            <span>Siguiente</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
