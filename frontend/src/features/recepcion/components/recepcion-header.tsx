'use client';

import React from 'react';
import Link from 'next/link';
import { PackagePlus, History, Boxes, Truck, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RecepcionHeaderProps {
  isAdmin?: boolean;
  activeTab: 'nuevo' | 'historial';
  setActiveTab: (tab: 'nuevo' | 'historial') => void;
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
}: RecepcionHeaderProps) {
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
        onValueChange={(val) => setActiveTab(val as 'nuevo' | 'historial')}
      >
        <TabsList variant="line" className="w-full justify-start pb-2">
          <TabsTrigger value="nuevo" variant="line">
            <PackagePlus className="h-3.5 w-3.5 mr-1" />
            <span>Nueva Recepción</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="historial" variant="line">
              <History className="h-3.5 w-3.5 mr-1" />
              <span>Historial de Recepciones</span>
            </TabsTrigger>
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
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label required>Proveedor Mayorista</Label>
              <Select
                value={proveedorId}
                onChange={(e) => setProveedorId(Number(e.target.value))}
              >
                {proveedores.map((p) => {
                  const label = p.empresa
                    ? `${p.empresa} (${p.nombre}${p.apellido ? ` ${p.apellido}` : ''})`
                    : `${p.nombre}${p.apellido ? ` ${p.apellido}` : ''}${
                        p.contactoReferencia ? ` - ${p.contactoReferencia}` : ''
                      }`;
                  return (
                    <option key={p.id} value={p.id}>
                      {label}
                    </option>
                  );
                })}
              </Select>
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

            <div className="sm:col-span-3">
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
