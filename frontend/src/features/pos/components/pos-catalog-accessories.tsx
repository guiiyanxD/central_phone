import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PosCatalogAccessoriesProps {
  searchAccessory: string;
  setSearchAccessory: (val: string) => void;
  filteredAccessories: Array<{ acc: any; lote: any }>;
  onAddAccessory: (acc: any, lote: any) => void;
  currentSucursalId?: number;
}

export function PosCatalogAccessories({
  searchAccessory,
  setSearchAccessory,
  filteredAccessories,
  onAddAccessory,
  currentSucursalId,
}: PosCatalogAccessoriesProps) {
  return (
    <div className="space-y-3">
      {/* Buscador de Accesorios */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          aria-label="Buscar accesorio o variante"
          className="pl-9 pr-4 text-xs"
          placeholder="Buscar accesorio por nombre o lote (ej. Silicona, MagSafe, Carga Rápida)..."
          value={searchAccessory}
          onChange={(e) => setSearchAccessory(e.target.value)}
        />
      </div>

      {filteredAccessories.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-white">
          {searchAccessory.trim()
            ? 'No se encontraron accesorios coincidentes con la búsqueda.'
            : 'No hay accesorios disponibles en el inventario.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
          {filteredAccessories.map(({ acc, lote }) => (
            <div
              key={lote.id}
              onClick={() => {
                if (lote.stockActual > 0) onAddAccessory(acc, lote);
              }}
              className={cn(
                "p-3 rounded-xl border border-slate-200 bg-white transition-all text-xs flex flex-col justify-between select-none",
                lote.stockActual > 0
                  ? "hover:border-slate-400 hover:shadow-subtle cursor-pointer active:scale-[0.99]"
                  : "opacity-60 cursor-not-allowed"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="font-bold text-slate-900">{acc.nombre}</span>
                  <div className="flex items-center gap-1">
                    {currentSucursalId && lote.sucursalId && lote.sucursalId !== currentSucursalId && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-300">
                        {lote.sucursal?.nombre || `Sucursal #${lote.sucursalId}`}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {lote.stockActual} u. en stock
                    </span>
                  </div>
                </div>
                <p className="text-slate-700 font-medium text-[11px] mt-0.5">
                  {lote.nombreDiferenciador}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <span className="font-mono font-bold text-slate-900">
                  Bs {Number(lote.precioVentaBs).toFixed(2)}
                </span>
                <Button
                  size="sm"
                  className="h-8 text-xs px-3 font-semibold"
                  disabled={lote.stockActual <= 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAccessory(acc, lote);
                  }}
                >
                  + Agregar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
