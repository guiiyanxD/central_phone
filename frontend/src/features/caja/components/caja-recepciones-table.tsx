import React from 'react';
import {
  Search,
  RotateCcw,
  Truck,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface CajaRecepcionesTableProps {
  filtroRecSearch: string;
  setFiltroRecSearch: (val: string) => void;
  filtroRecSucursalId: string;
  setFiltroRecSucursalId: (val: string) => void;
  filtroRecProveedorId: string;
  setFiltroRecProveedorId: (val: string) => void;
  filtroRecFechaDesde: string;
  setFiltroRecFechaDesde: (val: string) => void;
  filtroRecFechaHasta: string;
  setFiltroRecFechaHasta: (val: string) => void;
  sucursalesList: any[];
  proveedoresList: any[];
  onResetFiltrosRecepcion: () => void;
  recepcionesList: any[];
  isLoadingRecepciones: boolean;
  recepcionesMeta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  setRecepcionesMeta: React.Dispatch<React.SetStateAction<any>>;
  onFetchRecepciones: (page: number, limit?: number) => void;
  onOpenRecDetalle: (id: number) => void;
}

export function CajaRecepcionesTable({
  filtroRecSearch,
  setFiltroRecSearch,
  filtroRecSucursalId,
  setFiltroRecSucursalId,
  filtroRecProveedorId,
  setFiltroRecProveedorId,
  filtroRecFechaDesde,
  setFiltroRecFechaDesde,
  filtroRecFechaHasta,
  setFiltroRecFechaHasta,
  sucursalesList,
  proveedoresList,
  onResetFiltrosRecepcion,
  recepcionesList,
  isLoadingRecepciones,
  recepcionesMeta,
  setRecepcionesMeta,
  onFetchRecepciones,
  onOpenRecDetalle,
}: CajaRecepcionesTableProps) {
  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <Card className="border-slate-200 bg-white shadow-subtle p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Buscador Textual */}
          <div className="lg:col-span-4">
            <Label htmlFor="filtroRecSearch" className="text-xs text-slate-600 mb-1 block">
              Búsqueda Rápida
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="filtroRecSearch"
                placeholder="Buscar por comprobante, proveedor u observaciones..."
                value={filtroRecSearch}
                onChange={(e) => setFiltroRecSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>

          {/* Selector de Sucursal */}
          <div className="lg:col-span-2">
            <Label htmlFor="filtroRecSucursal" className="text-xs text-slate-600 mb-1 block">
              Sucursal
            </Label>
            <Select
              id="filtroRecSucursal"
              value={filtroRecSucursalId}
              onChange={(e) => setFiltroRecSucursalId(e.target.value)}
              className="text-xs h-9"
            >
              <option value="TODAS">Todas las sucursales</option>
              {sucursalesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Selector de Proveedor */}
          <div className="lg:col-span-2">
            <Label htmlFor="filtroRecProveedor" className="text-xs text-slate-600 mb-1 block">
              Proveedor
            </Label>
            <Select
              id="filtroRecProveedor"
              value={filtroRecProveedorId}
              onChange={(e) => setFiltroRecProveedorId(e.target.value)}
              className="text-xs h-9"
            >
              <option value="TODOS">Todos los proveedores</option>
              {proveedoresList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Rango de Fechas */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="filtroRecFechaDesde" className="text-xs text-slate-600 mb-1 block">
                Desde
              </Label>
              <Input
                id="filtroRecFechaDesde"
                type="date"
                value={filtroRecFechaDesde}
                onChange={(e) => setFiltroRecFechaDesde(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div>
              <Label htmlFor="filtroRecFechaHasta" className="text-xs text-slate-600 mb-1 block">
                Hasta
              </Label>
              <Input
                id="filtroRecFechaHasta"
                type="date"
                value={filtroRecFechaHasta}
                onChange={(e) => setFiltroRecFechaHasta(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Botón Limpiar */}
          <div className="lg:col-span-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFiltrosRecepcion}
              className="w-full h-9 text-xs gap-1 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              title="Restablecer filtros"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline lg:hidden">Limpiar</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLA DE RECEPCIONES */}
      <Card className="border-slate-200 bg-white shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-900" />
            <h2 className="text-sm font-bold text-slate-900">
              Historial de Recepciones de Mercadería
            </h2>
            <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-300 text-slate-700">
              Auditoría de Inventario Valorizado
            </Badge>
          </div>
          <span className="text-xs text-slate-500">
            {recepcionesMeta.total} {recepcionesMeta.total === 1 ? 'recepción registrada' : 'recepciones registradas'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                <th className="py-3 px-4">Código / Nota</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Nro Comprobante</th>
                <th className="py-3 px-4 text-center">Ítems Ingresados</th>
                <th className="py-3 px-4 text-right">Inversión Total (Bs)</th>
                <th className="py-3 px-4">Receptor</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoadingRecepciones ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-7 w-24 mx-auto rounded" /></td>
                  </tr>
                ))
              ) : recepcionesList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Truck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No se encontraron recepciones con los filtros seleccionados.</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Prueba cambiando el rango de fechas, sucursal o proveedor.</p>
                  </td>
                </tr>
              ) : (
                recepcionesList.map((rec) => {
                  const dispCount = rec._count?.dispositivos || 0;
                  const lotesCount = rec._count?.lotesAccesorio || 0;
                  const totalCosto = Number(rec.totalCostoBs || 0);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        #ING-{rec.id}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(rec.fechaIngreso).toLocaleString('es-BO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{rec.sucursal?.nombre}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-semibold bg-slate-50 border-slate-200 text-slate-800">
                          {rec.proveedor?.nombre}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {rec.numeroComprobante || <span className="text-slate-400 italic">S/N</span>}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{dispCount}</span>{' '}
                        <span className="text-slate-500 text-[11px]">tel.</span>
                        {' • '}
                        <span className="font-semibold text-slate-900">{lotesCount}</span>{' '}
                        <span className="text-slate-500 text-[11px]">lotes</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        Bs {totalCosto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {rec.usuario?.nombre || 'Desconocido'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs gap-1.5 border-slate-300 text-slate-700 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all shadow-xs"
                          onClick={() => onOpenRecDetalle(rec.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver Detalle</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PIE DE PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 shadow-subtle">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Mostrando{' '}
            <strong className="text-slate-900">
              {recepcionesMeta.total === 0 ? 0 : (recepcionesMeta.page - 1) * recepcionesMeta.limit + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-900">
              {Math.min(recepcionesMeta.page * recepcionesMeta.limit, recepcionesMeta.total)}
            </strong>{' '}
            de <strong className="text-slate-900">{recepcionesMeta.total}</strong> recepciones
          </span>

          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-500">Filas:</span>
            <select
              value={recepcionesMeta.limit}
              onChange={(e) => {
                const newLim = Number(e.target.value);
                setRecepcionesMeta((prev: any) => ({ ...prev, limit: newLim }));
                onFetchRecepciones(1, newLim);
              }}
              className="border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 mr-1">
            Página {recepcionesMeta.page} de {recepcionesMeta.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            disabled={!recepcionesMeta.hasPrevPage || isLoadingRecepciones}
            onClick={() => onFetchRecepciones(recepcionesMeta.page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            disabled={!recepcionesMeta.hasNextPage || isLoadingRecepciones}
            onClick={() => onFetchRecepciones(recepcionesMeta.page + 1)}
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
