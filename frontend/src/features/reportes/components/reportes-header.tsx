'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, RefreshCw, ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PresetFecha } from '../types';

interface ReportesHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  presetFecha: PresetFecha;
  onAplicarPreset: (preset: 'HOY' | 'SEMANA' | 'MES') => void;
  setPresetFecha: (val: PresetFecha) => void;
  fechaInicio: string;
  setFechaInicio: (val: string) => void;
  fechaFin: string;
  setFechaFin: (val: string) => void;
  sucursalId: string;
  setSucursalId: (val: string) => void;
  sucursales: Array<{ id: number; nombre: string }>;
}

export function ReportesHeader({
  isLoading,
  onRefresh,
  presetFecha,
  onAplicarPreset,
  setPresetFecha,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  sucursalId,
  setSucursalId,
  sucursales,
}: ReportesHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/administracion"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a Centro de Administración</span>
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-slate-900" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Reporte Financiero y Rentabilidad Neta
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas analíticas consolidadas en 3FN: Ventas - Costo Mercadería (CMV) - Gastos de Caja = Utilidad Neta Real
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isLoading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Barra de Filtros y Rango de Fechas */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Período:
            </span>
            <Button
              type="button"
              variant={presetFecha === 'HOY' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onAplicarPreset('HOY')}
              className="text-xs h-7"
            >
              Hoy
            </Button>
            <Button
              type="button"
              variant={presetFecha === 'SEMANA' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onAplicarPreset('SEMANA')}
              className="text-xs h-7"
            >
              Últimos 7 días
            </Button>
            <Button
              type="button"
              variant={presetFecha === 'MES' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onAplicarPreset('MES')}
              className="text-xs h-7"
            >
              Este Mes
            </Button>
            <Button
              type="button"
              variant={presetFecha === 'CUSTOM' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPresetFecha('CUSTOM')}
              className="text-xs h-7"
            >
              Personalizado
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Desde:
              </label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPresetFecha('CUSTOM');
                }}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Hasta:
              </label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPresetFecha('CUSTOM');
                }}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Sucursal:
              </label>
              <Select
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                className="text-xs h-8"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
