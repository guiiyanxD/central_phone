'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface RecepcionHeaderProps {
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
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Recepción Unificada de Mercadería
            </h1>
            <Badge variant="outline">Transacción ACID</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Ingreso conjunto de teléfonos (serializados por IMEI) y lotes diferenciados de accesorios.
          </p>
        </div>

        <Link href="/inventario">
          <Button variant="outline" size="sm">
            Explorar Stock Actual
          </Button>
        </Link>
      </div>

      {/* SECCIÓN 1: CABECERA DE LA NOTA DE INGRESO (US08) */}
      <Card>
        <CardHeader className="p-5 pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900">
            1. Datos de Origen y Comprobante
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
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.contactoReferencia ? `(${p.contactoReferencia})` : ''}
                </option>
              ))}
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
    </div>
  );
}
