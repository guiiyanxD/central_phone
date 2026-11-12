'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { PackagePlus, History, Boxes, Truck, RefreshCw, Plus, CalendarClock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AutocompleteInput, AutocompleteOption } from '@/components/ui/autocomplete-input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RecepcionHeaderProps {
  isAdmin?: boolean;
  activeTab: 'nuevo' | 'historial-mayorista' | 'historial-permutas';
  setActiveTab: (tab: 'nuevo' | 'historial-mayorista' | 'historial-permutas') => void;
  modoRecepcion: 'MAYORISTA' | 'PERMUTA';
  setModoRecepcion: (modo: 'MAYORISTA' | 'PERMUTA') => void;
  proveedores: any[];
  sucursales: any[];
  proveedorId: number;
  setProveedorId: (val: number) => void;
  sucursalId: number;
  setSucursalId: (val: number) => void;
  numeroComprobante: string;
  setNumeroComprobante: (val: string) => void;
  observaciones: string;
  setObservaciones: (val: string) => void;
  fechaIngreso?: string;
  setFechaIngreso?: (val: string) => void;
  onOpenCrearProveedor?: () => void;
}

export function RecepcionHeader({
  isAdmin = false,
  activeTab,
  setActiveTab,
  modoRecepcion,
  setModoRecepcion,
  proveedores,
  sucursales,
  proveedorId,
  setProveedorId,
  sucursalId,
  setSucursalId,
  numeroComprobante,
  setNumeroComprobante,
  observaciones,
  setObservaciones,
  fechaIngreso,
  setFechaIngreso,
  onOpenCrearProveedor,
}: RecepcionHeaderProps) {
  const proveedorOptions: AutocompleteOption[] = useMemo(() => {
    return proveedores
      .filter((p) => !p.tipo || p.tipo === 'MAYORISTA')
      .map((p) => {
        const mainLabel = p.empresa || `${p.nombre}${p.apellido ? ` ${p.apellido}` : ''}`;
        const subLabel = p.empresa
          ? `${p.nombre}${p.apellido ? ` ${p.apellido}` : ''}`
          : (p.contactoReferencia || '');
        return {
          value: p.id,
          label: mainLabel,
          sublabel: subLabel || undefined,
          badge: p.telefono ? `Tel: ${p.telefono}` : undefined,
          badgeVariant: 'blue' as const,
        };
      });
  }, [proveedores]);

  const maxDateTimeLocal = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);

  const esHistorico = useMemo(() => {
    if (!fechaIngreso) return false;
    const timeSelected = new Date(fechaIngreso).getTime();
    if (isNaN(timeSelected)) return false;
    return Date.now() - timeSelected > 60 * 60 * 1000;
  }, [fechaIngreso]);

  const handleSetAhora = () => {
    if (!setFechaIngreso) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setFechaIngreso(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Recepción Unificada de Mercadería
            </h1>
            <Badge variant="outline">Transacción ACID</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Ingreso conjunto de teléfonos (serializados por IMEI), lotes diferenciados de accesorios y permutas de clientes particulares.
          </p>
        </div>

        <Link href="/inventario">
          <Button variant="outline" size="sm" className="text-xs">
            <Boxes className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Explorar Stock Actual
          </Button>
        </Link>
      </div>

      {/* Tabs Principales de Recepción */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'nuevo' | 'historial-mayorista' | 'historial-permutas')}
      >
        <TabsList variant="line" className="w-full justify-start pb-2">
          <TabsTrigger value="nuevo" variant="line">
            <PackagePlus className="h-3.5 w-3.5 mr-1" />
            <span>Nueva Recepción</span>
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="historial-mayorista" variant="line">
                <Truck className="h-3.5 w-3.5 mr-1" />
                <span>Historial Mayorista</span>
              </TabsTrigger>
              <TabsTrigger value="historial-permutas" variant="line">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                <span>Historial de Permutas</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>
      </Tabs>

      {/* SELECTOR DE MODALIDAD: DOS BOTONES GRANDES (MAYORISTA vs MINORISTA / PERMUTAS) */}
      {activeTab === 'nuevo' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setModoRecepcion('MAYORISTA')}
            className={cn(
              'p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 shadow-xs relative overflow-hidden',
              modoRecepcion === 'MAYORISTA'
                ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
            )}
          >
            <div
              className={cn(
                'p-3 rounded-xl shrink-0',
                modoRecepcion === 'MAYORISTA'
                  ? 'bg-white/10 text-white'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              )}
            >
              <Truck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">Recepción Mayorista</span>
                {modoRecepcion === 'MAYORISTA' && (
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-xs leading-relaxed',
                  modoRecepcion === 'MAYORISTA' ? 'text-slate-300' : 'text-slate-500'
                )}
              >
                Ingreso de mercadería desde proveedores mayoristas con costos en USD y lotes de accesorios.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setModoRecepcion('PERMUTA')}
            className={cn(
              'p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 shadow-xs relative overflow-hidden',
              modoRecepcion === 'PERMUTA'
                ? 'border-purple-900 bg-purple-950 text-white shadow-md ring-2 ring-purple-900/20'
                : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30 text-slate-800'
            )}
          >
            <div
              className={cn(
                'p-3 rounded-xl shrink-0',
                modoRecepcion === 'PERMUTA'
                  ? 'bg-purple-800 text-white'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              )}
            >
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">Minorista (Permutas)</span>
                {modoRecepcion === 'PERMUTA' && (
                  <span className="text-[10px] font-semibold bg-purple-400/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-xs leading-relaxed',
                  modoRecepcion === 'PERMUTA' ? 'text-purple-200' : 'text-slate-500'
                )}
              >
                Toma de iPhones de clientes particulares, margen 15% garantizado y registro opcional de gastos.
              </p>
            </div>
          </button>
        </div>
      )}

      {/* SECCIÓN 1: CABECERA DE LA NOTA DE INGRESO (Solo visible en formulario 'nuevo' y modo 'MAYORISTA') */}
      {activeTab === 'nuevo' && modoRecepcion === 'MAYORISTA' && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              1. Datos de Origen y Comprobante Mayorista
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Proveedor mayorista y sucursal donde ingresará la mercadería física.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label required className="mb-0">Proveedor Mayorista</Label>
                {onOpenCrearProveedor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold gap-1"
                    onClick={onOpenCrearProveedor}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Nuevo</span>
                  </Button>
                )}
              </div>
              <AutocompleteInput
                id="recepcion-proveedor-mayorista"
                value={proveedorId || null}
                onChange={(val) => setProveedorId(Number(val) || 0)}
                placeholder="Buscar mayorista por nombre o empresa..."
                options={proveedorOptions}
                isClearable
              />
            </div>

            <div>
              <Label required>Sucursal Destino</Label>
              <Select
                value={sucursalId}
                onChange={(e) => setSucursalId(Number(e.target.value))}
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - {s.ciudad}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>N° de Factura / Remisión</Label>
              <Input
                placeholder="Ej: FAC-9821 / REM-004"
                value={numeroComprobante}
                onChange={(e) => setNumeroComprobante(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="fechaIngresoInput" className="mb-0 flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Fecha de Recepción</span>
                </Label>
                {setFechaIngreso && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                    onClick={handleSetAhora}
                    title="Restablecer a la fecha y hora actual"
                  >
                    Ahora
                  </Button>
                )}
              </div>
              <Input
                id="fechaIngresoInput"
                type="datetime-local"
                max={maxDateTimeLocal}
                value={fechaIngreso || ''}
                onChange={(e) => setFechaIngreso && setFechaIngreso(e.target.value)}
                className="text-xs font-mono"
              />
              {esHistorico && (
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-700 px-1.5 py-0 font-medium">
                    Ingreso Histórico
                  </Badge>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <Label>Observaciones de Recepción (Opcional)</Label>
              <Input
                placeholder="Ej: Entrega recibida por encomienda, sin empaque dañado"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
