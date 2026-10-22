import React from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CartItem } from '../types';

interface PosCatalogPhonesProps {
  searchPhone: string;
  setSearchPhone: (val: string) => void;
  filteredPhones: any[];
  cart: CartItem[];
  scanFeedback: string | null;
  inputSearchRef: React.RefObject<HTMLInputElement>;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddPhone: (disp: any) => void;
  getPhoneDisplayPrice: (disp: any) => number;
}

export function PosCatalogPhones({
  searchPhone,
  setSearchPhone,
  filteredPhones,
  cart,
  scanFeedback,
  inputSearchRef,
  onSearchKeyDown,
  onAddPhone,
  getPhoneDisplayPrice,
}: PosCatalogPhonesProps) {
  return (
    <div className="space-y-3">
      {/* Buscador de Teléfonos con soporte para escáner óptico */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          ref={inputSearchRef}
          autoFocus
          aria-label="Escanear o tipear IMEI 1, Serie o Modelo"
          className="pl-9 pr-24 text-xs font-mono"
          placeholder="Escanear o tipear IMEI 1, Serie o Modelo..."
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          onKeyDown={onSearchKeyDown}
        />
        <span className="absolute right-2.5 top-2 hidden sm:inline-flex items-center text-[10px] font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
          Enter ↵ | F2
        </span>
      </div>

      {/* Feedback de escaneo de código de barras exitoso */}
      {scanFeedback && (
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-150">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {scanFeedback}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">En Ticket</span>
        </div>
      )}

      {filteredPhones.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-white">
          No hay teléfonos disponibles para venta en esta sucursal. Registra mercadería en Recepción.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
          {filteredPhones.map((d) => {
            const isAdded = cart.some((i) => i.dispositivoId === d.id);
            return (
              <div
                key={d.id}
                className={cn(
                  'p-3 rounded-xl border transition-all text-xs flex flex-col justify-between bg-white',
                  isAdded
                    ? 'border-slate-300 bg-slate-50/60 opacity-60'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-subtle'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {d.variante?.modelo?.nombreModelo}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 rounded">
                      {d.condicion}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {d.variante?.color} •{' '}
                    {d.variante?.capacidadGb > 0
                      ? d.variante?.capacidadGb >= 1024
                        ? `${d.variante?.capacidadGb / 1024}TB`
                        : `${d.variante?.capacidadGb}GB`
                      : '0 GB'}
                  </p>
                  <p className="font-mono text-[10px] text-slate-600 mt-1 truncate">
                    {d.imei1 ? `IMEI: ${d.imei1}` : `S/N: ${d.numeroSerie}`}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="font-mono font-bold text-slate-900">
                    Bs {getPhoneDisplayPrice(d).toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant={isAdded ? 'outline' : 'default'}
                    className="h-8 text-xs px-3 font-semibold"
                    disabled={isAdded}
                    onClick={() => onAddPhone(d)}
                  >
                    {isAdded ? 'En Carrito' : '+ Agregar'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
