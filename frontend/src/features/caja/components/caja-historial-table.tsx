import React from 'react';
import {
  Search,
  RotateCcw,
  History,
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
import { cn, formatNombreCaja } from '@/lib/utils';

interface CajaHistorialTableProps {
  filtroSearch: string;
  setFiltroSearch: (val: string) => void;
  filtroSucursalId: string;
  setFiltroSucursalId: (val: string) => void;
  filtroUsuarioId: string;
  setFiltroUsuarioId: (val: string) => void;
  filtroFechaDesde: string;
  setFiltroFechaDesde: (val: string) => void;
  filtroFechaHasta: string;
  setFiltroFechaHasta: (val: string) => void;
  sucursalesList: any[];
  usuariosList: any[];
  onResetFiltros: () => void;
  historialCajas: any[];
  isLoadingHistorial: boolean;
  historialMeta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  setHistorialMeta: React.Dispatch<React.SetStateAction<any>>;
  onFetchHistorial: (page: number, limit?: number) => void;
  onOpenDetalle: (id: number) => void;
}

export function CajaHistorialTable({
  filtroSearch,
  setFiltroSearch,
  filtroSucursalId,
  setFiltroSucursalId,
  filtroUsuarioId,
  setFiltroUsuarioId,
  filtroFechaDesde,
  setFiltroFechaDesde,
  filtroFechaHasta,
  setFiltroFechaHasta,
  sucursalesList,
  usuariosList,
  onResetFiltros,
  historialCajas,
  isLoadingHistorial,
  historialMeta,
  setHistorialMeta,
  onFetchHistorial,
  onOpenDetalle,
}: CajaHistorialTableProps) {
  return (
    <div className="space-y-4">
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <Card className="border-slate-200 bg-white shadow-subtle p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Buscador Textual */}
          <div className="lg:col-span-4">
            <Label htmlFor="filtroSearch" className="text-xs text-slate-600 mb-1 block">
              Búsqueda Rápida
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                id="filtroSearch"
                placeholder="Buscar por ID, cajero, sucursal u obs..."
                value={filtroSearch}
                onChange={(e) => setFiltroSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>

          {/* Selector de Sucursal */}
          <div className="lg:col-span-2">
            <Label htmlFor="filtroSucursal" className="text-xs text-slate-600 mb-1 block">
              Sucursal
            </Label>
            <Select
              id="filtroSucursal"
              value={filtroSucursalId}
              onChange={(e) => setFiltroSucursalId(e.target.value)}
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

          {/* Selector de Usuario / Cajero */}
          <div className="lg:col-span-2">
            <Label htmlFor="filtroUsuario" className="text-xs text-slate-600 mb-1 block">
              Cajero / Usuario
            </Label>
            <Select
              id="filtroUsuario"
              value={filtroUsuarioId}
              onChange={(e) => setFiltroUsuarioId(e.target.value)}
              className="text-xs h-9"
            >
              <option value="TODOS">Todos los cajeros</option>
              {usuariosList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </Select>
          </div>

          {/* Rango de Fechas: Desde */}
          <div className="lg:col-span-1.5 sm:col-span-1">
            <Label htmlFor="filtroFechaDesde" className="text-xs text-slate-600 mb-1 block">
              Desde
            </Label>
            <Input
              id="filtroFechaDesde"
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Rango de Fechas: Hasta */}
          <div className="lg:col-span-1.5 sm:col-span-1">
            <Label htmlFor="filtroFechaHasta" className="text-xs text-slate-600 mb-1 block">
              Hasta
            </Label>
            <Input
              id="filtroFechaHasta"
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Botón Reset */}
          <div className="lg:col-span-1 sm:col-span-2 flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFiltros}
              className="w-full h-9 text-xs flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="sm:hidden lg:hidden">Limpiar</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLA DE RESULTADOS */}
      <Card className="border-slate-200 overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Caja & Fechas</th>
                <th className="py-3 px-4">Cajero / Sucursal</th>
                <th className="py-3 px-4">Monto Inicial</th>
                <th className="py-3 px-4">Saldo Teórico</th>
                <th className="py-3 px-4">Conteo Físico Real</th>
                <th className="py-3 px-4">Diferencia</th>
                <th className="py-3 px-4">Justificación de Auditoría</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingHistorial ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-36 mb-1" /><Skeleton className="h-3 w-20" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-7 w-20 mx-auto rounded" /></td>
                  </tr>
                ))
              ) : historialCajas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <History className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No se encontraron cajas con los filtros seleccionados.</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Prueba cambiando el rango de fechas, sucursal o término de búsqueda.</p>
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
                historialCajas.map((c) => {
                  const dif = Number(c.diferenciaEfectivo) || 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono">
                        <p className="font-bold text-slate-900">
                          {formatNombreCaja(c.fechaApertura, c.sucursal?.nombre)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Cierre: {new Date(c.fechaCierre || c.fechaApertura).toLocaleDateString('es-BO')}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{c.usuarioApertura?.nombre}</p>
                        <p className="text-[10px] text-slate-500">
                          {c.sucursal?.nombre}
                          {c.usuarioCierre && c.usuarioCierre.id !== c.usuarioApertura?.id && (
                            <span className="text-slate-400"> • Cerró: {c.usuarioCierre.nombre}</span>
                          )}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        Bs {Number(c.montoInicialEfectivo).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        Bs {Number(c.montoTeoricoEfectivo || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        Bs {Number(c.montoFinalEfectivo || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[11px] font-bold font-mono',
                            dif === 0
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-slate-900 text-white border border-slate-900'
                          )}
                        >
                          {dif > 0 ? `+Bs ${dif.toFixed(2)}` : `Bs ${dif.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-[11px] text-slate-600 truncate">
                        {c.justificacion || (dif === 0 ? 'Exacto sin descuadre' : 'Sin justificación')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs gap-1.5 border-slate-300 text-slate-700 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all shadow-xs"
                          onClick={() => onOpenDetalle(c.id)}
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
              {historialMeta.total === 0 ? 0 : (historialMeta.page - 1) * historialMeta.limit + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-900">
              {Math.min(historialMeta.page * historialMeta.limit, historialMeta.total)}
            </strong>{' '}
            de <strong className="text-slate-900">{historialMeta.total}</strong> cajas cerradas
          </span>

          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-500">Filas:</span>
            <select
              value={historialMeta.limit}
              onChange={(e) => {
                const newLim = Number(e.target.value);
                setHistorialMeta((prev: any) => ({ ...prev, limit: newLim }));
                onFetchHistorial(1, newLim);
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
            Página {historialMeta.page} de {historialMeta.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            disabled={!historialMeta.hasPrevPage || isLoadingHistorial}
            onClick={() => onFetchHistorial(historialMeta.page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            disabled={!historialMeta.hasNextPage || isLoadingHistorial}
            onClick={() => onFetchHistorial(historialMeta.page + 1)}
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
