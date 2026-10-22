'use client';

import React from 'react';
import { MapPin, Phone, Eye, Edit3, Power } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SucursalItem } from '../types';

interface SucursalCardProps {
  sucursal: SucursalItem;
  onViewDetail: (suc: SucursalItem) => void;
  onEdit: (suc: SucursalItem) => void;
  onToggleActivo: (suc: SucursalItem) => void;
}

export function SucursalCard({
  sucursal,
  onViewDetail,
  onEdit,
  onToggleActivo,
}: SucursalCardProps) {
  return (
    <Card
      className={cn(
        'border transition-all duration-200 flex flex-col justify-between hover:shadow-card',
        sucursal.activo ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/60 opacity-80'
      )}
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full flex-shrink-0',
                sucursal.activo ? 'bg-emerald-500' : 'bg-slate-400'
              )}
            />
            <CardTitle className="text-base font-bold text-slate-900 leading-tight">
              {sucursal.nombre}
            </CardTitle>
          </div>
          <Badge variant={sucursal.activo ? 'success' : 'secondary'} className="text-[10px]">
            {sucursal.activo ? 'Operativa' : 'Inactiva'}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 pt-1">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {sucursal.direccion} • <strong className="text-slate-800">{sucursal.ciudad}</strong>
            </span>
          </div>
          {sucursal.telefono && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span>{sucursal.telefono}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4">
        {/* Contadores de Recursos Asignados */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div>
            <p className="text-[10px] text-slate-500">Personal</p>
            <p className="text-xs font-bold text-slate-900">
              {sucursal._count?.usuarios ?? 0}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Equipos</p>
            <p className="text-xs font-bold text-slate-900">
              {sucursal._count?.dispositivos ?? 0}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Accesorios</p>
            <p className="text-xs font-bold text-slate-900">
              {sucursal._count?.lotesAccesorio ?? 0}
            </p>
          </div>
        </div>

        {/* Acciones de Administración */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(sucursal)}
            className="text-xs h-8 text-slate-700 hover:text-slate-900 px-2"
          >
            <Eye className="mr-1 h-3.5 w-3.5 text-slate-500" />
            Detalle & Personal
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(sucursal)}
              className="text-xs h-8 px-2.5"
              title="Editar sucursal"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleActivo(sucursal)}
              className={cn(
                'text-xs h-8 px-2.5',
                sucursal.activo
                  ? 'hover:text-rose-600 hover:border-rose-200'
                  : 'hover:text-emerald-600 hover:border-emerald-200'
              )}
              title={sucursal.activo ? 'Desactivar sucursal' : 'Activar sucursal'}
            >
              <Power
                className={cn(
                  'h-3.5 w-3.5',
                  sucursal.activo ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600'
                )}
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
