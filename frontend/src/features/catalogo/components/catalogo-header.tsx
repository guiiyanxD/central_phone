'use client';

import React from 'react';
import { Layers, Headphones, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CatalogoTab } from '../types';

interface CatalogoHeaderProps {
  activeTab: CatalogoTab;
  setActiveTab: (tab: CatalogoTab) => void;
  modelosTotal: number;
  accesoriosTotal: number;
  isAdmin: boolean;
  onNuevoModelo: () => void;
  onNuevoAccesorio: () => void;
}

export function CatalogoHeader({
  activeTab,
  setActiveTab,
  modelosTotal,
  accesoriosTotal,
  isAdmin,
  onNuevoModelo,
  onNuevoAccesorio,
}: CatalogoHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Catálogo Oficial de Productos
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión unificada de modelos Apple, variantes de hardware y catálogo maestro de accesorios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'modelos' && isAdmin && (
            <Button size="sm" onClick={onNuevoModelo}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo Modelo
            </Button>
          )}

          {activeTab === 'accesorios' && (
            <Button size="sm" onClick={onNuevoAccesorio}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo Accesorio
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('modelos')}
          className={cn(
            'pb-3 border-b-2 flex items-center gap-2 transition-colors',
            activeTab === 'modelos'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Smartphone className="h-4 w-4" />
          <span>Catálogo de Modelos</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
            {modelosTotal}
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
          <span>Catálogo de Accesorios</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
            {accesoriosTotal}
          </span>
        </button>
      </div>
    </div>
  );
}
