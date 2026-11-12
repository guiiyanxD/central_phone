'use client';

import React from 'react';
import {
  Search,
  RotateCcw,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Battery,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatFechaDDMMYYYY } from '@/lib/utils';

interface RecepcionPermutasTableProps {
  filtroSearch: string;
  setFiltroSearch: (val: string) => void;
  filtroSucursalId: string;
  setFiltroSucursalId: (val: string) => void;
  filtroFechaDesde: string;
  setFiltroFechaDesde: (val: string) => void;
  filtroFechaHasta: string;
  setFiltroFechaHasta: (val: string) => void;
  sucursalesList: any[];
  onResetFiltros: () => void;
  permutasList: any[];
  isLoading: boolean;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  setMeta: React.Dispatch<React.SetStateAction<any>>;
  onFetchPermutas: (page: number, limit?: number) => void;
  onOpenDetalle: (id: number) => void;
  onStartEdit?: (id: number) => void;
  onOpenAnularModal?: (rec: any) => void;
  isAdmin?: boolean;
}

export function RecepcionPermutasTable({
  filtroSearch,
  setFiltroSearch,
  filtroSucursalId,
  setFiltroSucursalId,
  filtroFechaDesde,
  setFiltroFechaDesde,
  filtroFechaHasta,
  setFiltroFechaHasta,
  sucursalesList,
  onResetFiltros,
  permutasList,
  isLoading,
  meta,
  setMeta,
  onFetchPermutas,
  onOpenDetalle,
  onStartEdit,
  onOpenAnularModal,
  isAdmin = true,
}: RecepcionPermutasTableProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <Card className="border-slate-200 bg-white shadow-subtle p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Buscador Textual */}
          <div className="lg:col-span-5">
            <Label htmlFor="filtroPermutaSearch" className="text-xs text-slate-600 mb-1 block">
              Búsqueda de Permutas
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="filtroPermutaSearch"
                placeholder="Buscar por cliente, teléfono, IMEI, serie, modelo o recibo..."
                value={filtroSearch}
                onChange={(e) => setFiltroSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>

          {/* Selector de Sucursal */}
          <div className="lg:col-span-3">
            <Label htmlFor="filtroPermutaSucursal" className="text-xs text-slate-600 mb-1 block">
              Sucursal
            </Label>
            <Select
              id="filtroPermutaSucursal"
              value={filtroSucursalId}
              onChange={(e) => setFiltroSucursalId(e.target.value)}
              className="text-xs h-9"
            >
              <option value="TODAS">Todas las sucursales</option>
              {sucursalesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.ciudad})
                </option>
              ))}
            </Select>
          </div>

          {/* Rango de Fechas: Desde */}
          <div className="lg:col-span-2">
            <Label htmlFor="filtroPermutaFechaDesde" className="text-xs text-slate-600 mb-1 block">
              Fecha Desde
            </Label>
            <Input
              id="filtroPermutaFechaDesde"
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="text-xs h-9 font-mono"
            />
          </div>

          {/* Rango de Fechas: Hasta */}
          <div className="lg:col-span-2">
            <Label htmlFor="filtroPermutaFechaHasta" className="text-xs text-slate-600 mb-1 block">
              Fecha Hasta
            </Label>
            <Input
              id="filtroPermutaFechaHasta"
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="text-xs h-9 font-mono"
            />
          </div>

          {/* Botón de Limpiar Filtros */}
          <div className="lg:col-span-12 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFiltros}
              className="text-xs text-slate-500 hover:text-slate-800 h-8 px-2.5 gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLA DE RESULTADOS DE PERMUTAS */}
      <Card className="border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-purple-700" />
            <span className="text-sm font-bold text-slate-900">Historial Exclusivo de Permutas</span>
            <Badge variant="outline" className="text-xs font-mono font-normal bg-purple-50 text-purple-700 border-purple-200">
              {meta.total} {meta.total === 1 ? 'registro' : 'registros'}
            </Badge>
          </div>
          <span className="text-xs text-slate-500">
            Página {meta.page} de {meta.totalPages || 1}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                <th className="py-3 px-4">Código / Nota</th>
                <th className="py-3 px-4 min-w-[280px]">iPhone Recibido</th>
                <th className="py-3 px-4 text-center">Batería</th>
                <th className="py-3 px-4">IMEI / Serie</th>
                <th className="py-3 px-4 text-right">Costo y P. Sugerido (Bs)</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-44" /></td>
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-7 w-20 mx-auto rounded" /></td>
                  </tr>
                ))
              ) : permutasList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-8 w-8 mx-auto text-purple-300 mb-2" />
                    <p className="font-semibold text-slate-700">No se encontraron permutas registradas con los filtros seleccionados.</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Prueba modificando el rango de fechas o el término de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                permutasList.map((rec) => {
                  const disp = rec.dispositivos?.[0];
                  const capGb = disp?.variante?.capacidadGb || 0;
                  const capLabel =
                    capGb > 0
                      ? capGb >= 1024
                        ? `${capGb / 1024}TB`
                        : `${capGb}GB`
                      : '';
                  const simLabel = disp?.variante?.tipoSim ? ` • ${disp.variante.tipoSim}` : '';
                  const totalCosto = Number(rec.totalCostoBs || disp?.costoBs || 0);
                  const precioSugerido = Number(disp?.precioVentaSugeridoBs || 0);
                  const isSold = disp?.estadoInventario === 'VENDIDO';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Código / Nota */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>#ING-{rec.id}</span>
                          {rec.estado === 'ANULADA' ? (
                            <Badge variant="outline" className="text-[10px] bg-rose-50 border-rose-200 text-rose-700 font-semibold">
                              ANULADA
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-purple-50 border-purple-200 text-purple-700 font-semibold">
                              PERMUTA
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* 2. iPhone Recibido (2da posición, jerarquía destacada) */}
                      <td className="py-3 px-4 min-w-[280px]">
                        {disp ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <Smartphone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                {disp.variante?.modelo?.nombreModelo || 'iPhone'}
                              </span>
                              {isSold ? (
                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                                  VENDIDO
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                                  DISPONIBLE
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {disp.variante?.color || ''} {capLabel ? `• ${capLabel}` : ''}{simLabel}
                            </span>
                            {disp.detallesFisicos && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-medium w-fit max-w-[260px] truncate"
                                title={`Situación de Registro: ${disp.detallesFisicos}`}
                              >
                                <ShieldCheck className="h-3 w-3 text-slate-500 shrink-0" />
                                <span className="truncate">Reg: {disp.detallesFisicos}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin dispositivo</span>
                        )}
                      </td>

                      {/* 3. Batería */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {disp?.porcentajeBateria !== undefined && disp?.porcentajeBateria !== null ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 ${
                              disp.porcentajeBateria >= 85
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : disp.porcentajeBateria >= 80
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                            }`}
                          >
                            <Battery className="h-3 w-3 mr-0.5 inline" />
                            {disp.porcentajeBateria}%
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 4. IMEI / Serie */}
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        {disp ? (
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-medium">
                              {disp.imei1 || disp.numeroSerie}
                            </span>
                            {disp.numeroSerie && disp.imei1 && (
                              <span className="text-slate-500 text-[10px]">
                                SN: {disp.numeroSerie}
                              </span>
                            )}
                            {disp.imei2 && (
                              <span className="text-slate-400 text-[10px]">
                                SIM2: {disp.imei2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 5. Costo y P. Sugerido (Bs) unificados */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-0.5 font-mono">
                          {isAdmin ? (
                            <span className="text-xs font-bold text-slate-900">
                              Bs {totalCosto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-400">•••</span>
                          )}
                          {precioSugerido > 0 ? (
                            <span className="text-[11px] font-semibold text-emerald-600">
                              Sug: Bs {precioSugerido.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Fecha DD/MM/YYYY */}
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {formatFechaDDMMYYYY(rec.fechaIngreso)}
                      </td>

                      {/* 7. Acciones */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-xs"
                            onClick={() => onOpenDetalle(rec.id)}
                            title="Ver Auditoría y Resumen Financiero"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Detalle</span>
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs gap-1 border-amber-300 text-amber-700 hover:text-white hover:bg-amber-600 hover:border-amber-600 transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none"
                                disabled={rec.estado === 'ANULADA' || isSold}
                                onClick={() => onStartEdit && onStartEdit(rec.id)}
                                title={
                                  rec.estado === 'ANULADA'
                                    ? 'Una permuta anulada no puede editarse'
                                    : isSold
                                    ? 'El dispositivo ya fue vendido, no puede editarse'
                                    : 'Editar Permuta'
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs gap-1 border-rose-200 text-rose-700 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none"
                                disabled={rec.estado === 'ANULADA' || isSold}
                                onClick={() => onOpenAnularModal && onOpenAnularModal(rec)}
                                title={
                                  rec.estado === 'ANULADA'
                                    ? 'Esta permuta ya fue anulada'
                                    : isSold
                                    ? 'No se puede anular porque el dispositivo ya fue vendido'
                                    : 'Anular Permuta'
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Anular</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando {permutasList.length} de {meta.total} permutas registradas
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!meta.hasPrevPage || isLoading}
              onClick={() => {
                if (meta.hasPrevPage) {
                  onFetchPermutas(meta.page - 1, meta.limit);
                }
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
            <span className="px-2 font-mono font-medium text-slate-800">
              {meta.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!meta.hasNextPage || isLoading}
              onClick={() => {
                if (meta.hasNextPage) {
                  onFetchPermutas(meta.page + 1, meta.limit);
                }
              }}
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
