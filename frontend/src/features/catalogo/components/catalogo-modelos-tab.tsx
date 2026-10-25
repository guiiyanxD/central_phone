'use client';

import React from 'react';
import { Plus, Pencil, Trash2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeloItem } from '../types';

interface CatalogoModelosTabProps {
  modelos: ModeloItem[];
  isLoadingModelos: boolean;
  isAdmin: boolean;
  onOpenNuevoModelo: () => void;
  onOpenGestionarTipos: () => void;
  onOpenAddVariante: (modelo: ModeloItem) => void;
  onOpenEditVariante: (modelo: ModeloItem, variante: any) => void;
  onOpenDeleteVariante: (modelo: ModeloItem, variante: any) => void;
}

export function CatalogoModelosTab({
  modelos,
  isLoadingModelos,
  isAdmin,
  onOpenNuevoModelo,
  onOpenGestionarTipos,
  onOpenAddVariante,
  onOpenEditVariante,
  onOpenDeleteVariante,
}: CatalogoModelosTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Catálogo Oficial Apple & Invariante de Variantes
          </h3>
          <p className="text-xs text-slate-500">
            Todo modelo existe obligatoriamente con al menos una variante (Color, Capacidad, SIM).
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenGestionarTipos}
            className="text-xs"
          >
            <Smartphone className="mr-1.5 h-3.5 w-3.5" />
            Gestionar Tipos
          </Button>

          <Button
            size="sm"
            onClick={onOpenNuevoModelo}
            className="text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo Modelo
          </Button>
        </div>
      </div>

      {/* Grid de Modelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingModelos ? (
          <>
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </>
        ) : modelos.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            No hay modelos registrados en el catálogo.
          </div>
        ) : (
          modelos.map((m) => (
            <Card
              key={m.id}
              className="border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-slate-900">
                        {m.nombreModelo}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {m.tipo || 'IPHONE'}
                      </Badge>
                    </div>
                    <CardDescription className="text-[11px] text-slate-500">
                      Marca: {m.marca}
                    </CardDescription>
                  </div>
                  <Badge variant="mono">{m.variantes?.length || 0} variantes</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Variantes registradas:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pb-1">
                    {m.variantes?.map((v: any) => (
                      <div
                        key={v.id}
                        className="group/v inline-flex items-center gap-1.5 text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-700 hover:border-slate-300 transition-colors"
                      >
                        <span>
                          {v.color} •{' '}
                          {v.capacidadGb > 0
                            ? v.capacidadGb >= 1024
                              ? `${v.capacidadGb / 1024}TB`
                              : `${v.capacidadGb}GB`
                            : '0 GB'}{' '}
                          [{v.tipoSim}]
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenEditVariante(m, v)}
                              className="text-slate-400 hover:text-slate-900 p-0.5 rounded transition-colors"
                              title="Editar variante"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenDeleteVariante(m, v)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                              title="Eliminar variante"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {m.variantes?.length || 0} combinaciones
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenAddVariante(m)}
                    className="text-xs h-7 px-2.5 border-dashed border-slate-300 hover:border-slate-400"
                    title="Agregar nueva combinación a este modelo"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Variante
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
