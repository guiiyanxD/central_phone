'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AccesorioItem } from '../types';

interface InventarioAccesoriosTabProps {
  accesorios: any[];
  isLoadingAccesorios: boolean;
  isAdmin: boolean;
}

export function InventarioAccesoriosTab({
  accesorios,
  isLoadingAccesorios,
  isAdmin,
}: InventarioAccesoriosTabProps) {
  const lotesTotales = accesorios.flatMap((a) => a.lotes || []);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Accesorio Base</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Lote Diferenciador</th>
                {isAdmin && <th className="py-3 px-4">Costo Adquisición</th>}
                <th className="py-3 px-4">Precio Sugerido</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingAccesorios ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : lotesTotales.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-500">
                    No hay lotes de accesorios registrados aún. Utiliza el formulario de Recepción para dar de alta existencias.
                  </td>
                </tr>
              ) : (
                accesorios.flatMap((acc) =>
                  (acc.lotes || []).map((lote: any) => (
                    <tr key={lote.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {acc.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {acc.categoria?.nombre || 'General'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {lote.nombreDiferenciador}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          Bs {Number(lote.costoUnitarioBs || 0).toFixed(2)}
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        Bs {Number(lote.precioVentaBs).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full font-bold text-xs',
                            lote.stockActual > 5
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-slate-900 text-white border border-slate-900'
                          )}
                        >
                          {lote.stockActual} u.
                        </span>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
