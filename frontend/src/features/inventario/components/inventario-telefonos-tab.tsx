'use client';

import React from 'react';
import {
  Smartphone,
  Search,
  RotateCcw,
  History,
  Truck,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DispositivoItem, DispositivosMeta } from '../types';

interface InventarioTelefonosTabProps {
  dispositivos: any[];
  dispositivosMeta: DispositivosMeta;
  setDispositivosMeta: React.Dispatch<React.SetStateAction<DispositivosMeta>>;
  isLoadingDispositivos: boolean;
  isAdmin: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  tipoFilter: string;
  setTipoFilter: (val: string) => void;
  estadoFilter: string;
  setEstadoFilter: (val: string) => void;
  condicionFilter: string;
  setCondicionFilter: (val: string) => void;
  sucursalFilter: string;
  setSucursalFilter: (val: string) => void;
  proveedorFilter: string;
  setProveedorFilter: (val: string) => void;
  fechaDesdeFilter: string;
  setFechaDesdeFilter: (val: string) => void;
  fechaHastaFilter: string;
  setFechaHastaFilter: (val: string) => void;
  sucursalesList: any[];
  proveedoresList: any[];
  onResetFiltros: () => void;
  onFetchDispositivos: (page?: number, limit?: number) => void;
  onSelectImeiForLifeline: (imei: string) => void;
}

export function InventarioTelefonosTab({
  dispositivos,
  dispositivosMeta,
  setDispositivosMeta,
  isLoadingDispositivos,
  isAdmin,
  searchQuery,
  setSearchQuery,
  tipoFilter,
  setTipoFilter,
  estadoFilter,
  setEstadoFilter,
  condicionFilter,
  setCondicionFilter,
  sucursalFilter,
  setSucursalFilter,
  proveedorFilter,
  setProveedorFilter,
  fechaDesdeFilter,
  setFechaDesdeFilter,
  fechaHastaFilter,
  setFechaHastaFilter,
  sucursalesList,
  proveedoresList,
  onResetFiltros,
  onFetchDispositivos,
  onSelectImeiForLifeline,
}: InventarioTelefonosTabProps) {
  return (
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
              onClick={onResetFiltros}
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
                  {isAdmin ? 'Costo / P. Sugerido' : 'Precio Sugerido'}
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
                      onClick={onResetFiltros}
                    >
                      Limpiar Filtros
                    </Button>
                  </td>
                </tr>
              ) : (
                dispositivos.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900">
                          {d.variante?.modelo?.nombreModelo || d.variante?.modelo?.nombre}
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
                        onClick={() => onSelectImeiForLifeline(d.imei1 || d.numeroSerie)}
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
                            onClick={() => onSelectImeiForLifeline(d.imei2)}
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
                        <span>{d.notaIngreso?.proveedor?.nombre || d.recepcionDetalle?.notaIngreso?.proveedor?.nombre || 'Mayorista Oficial'}</span>
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        Recibido: {d.notaIngreso?.fechaIngreso || d.recepcionDetalle?.notaIngreso?.fechaIngreso ? new Date(d.notaIngreso?.fechaIngreso || d.recepcionDetalle?.notaIngreso?.fechaIngreso).toLocaleDateString('es-BO') : 'S/F'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {isAdmin ? (
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
                          d.estadoInventario === 'DISPONIBLE' || d.estado === 'DISPONIBLE'
                            ? 'success'
                            : d.estadoInventario === 'VENDIDO' || d.estado === 'VENDIDO'
                            ? 'secondary'
                            : 'warning'
                        }
                      >
                        {d.estadoInventario || d.estado}
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

          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-500">Filas:</span>
            <select
              value={dispositivosMeta.limit}
              onChange={(e) => {
                const newLim = Number(e.target.value);
                setDispositivosMeta((prev) => ({ ...prev, limit: newLim }));
                onFetchDispositivos(1, newLim);
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
            onClick={() => onFetchDispositivos(dispositivosMeta.page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Anterior</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            disabled={!dispositivosMeta.hasNextPage || isLoadingDispositivos}
            onClick={() => onFetchDispositivos(dispositivosMeta.page + 1)}
          >
            <span>Siguiente</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
