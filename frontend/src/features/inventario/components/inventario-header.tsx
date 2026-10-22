'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Headphones, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InventarioHeaderProps {
  activeTab: 'telefonos' | 'accesorios' | 'catalogo';
  setActiveTab: (tab: 'telefonos' | 'accesorios' | 'catalogo') => void;
  telefonosTotal: number;
  modelosTotal: number;
}

export function InventarioHeader({
  activeTab,
  setActiveTab,
  telefonosTotal,
  modelosTotal,
}: InventarioHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Control de Inventario & Catálogo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de stock físico serializado por IMEI, lotes de accesorios y catálogo de variantes.
          </p>
        </div>

        <Link href="/recepcion">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Recibir Mercadería
          </Button>
        </Link>
      </div>

      {/* Tabs Minimalistas */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('telefonos')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'telefonos'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Smartphone className="h-4 w-4" />
          <span>Equipos Serializados</span>
          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-600">
            {telefonosTotal}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accesorios')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'accesorios'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Headphones className="h-4 w-4" />
          <span>Lotes de Accesorios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalogo')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'catalogo'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Catálogo de Modelos ({modelosTotal})</span>
        </button>
      </div>
    </div>
  );
}
