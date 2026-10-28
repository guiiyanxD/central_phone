'use client';

import React from 'react';
import { Headphones, Plus, Trash2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AccesorioRow } from '../types';

interface RecepcionAccesoriosTableProps {
  accesorios: AccesorioRow[];
  accesoriosCatalogo: any[];
  onAddAccesorio: () => void;
  onRemoveAccesorio: (id: string) => void;
  onUpdateAccesorio: (id: string, field: keyof AccesorioRow, value: any) => void;
  onOpenInlineAccesorioModal: (rowId: string) => void;
}

export function RecepcionAccesoriosTable({
  accesorios,
  accesoriosCatalogo,
  onAddAccesorio,
  onRemoveAccesorio,
  onUpdateAccesorio,
  onOpenInlineAccesorioModal,
}: RecepcionAccesoriosTableProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const prevLengthRef = React.useRef(accesorios.length);

  React.useEffect(() => {
    if (accesorios.length > prevLengthRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }
    prevLengthRef.current = accesorios.length;
  }, [accesorios.length]);

  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardHeader className="sticky top-0 z-10 bg-white border-b border-slate-100 p-5 pb-3.5 flex flex-row items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-slate-700" />
            <CardTitle className="text-base font-semibold text-slate-900">
              3. Lotes Diferenciados de Accesorios
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-slate-50 font-mono text-slate-700">
              {accesorios.length} {accesorios.length === 1 ? 'lote' : 'lotes'}
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Cada lote distingue calidades y precios para el mismo accesorio base (ej: Simple vs MagSafe).
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddAccesorio}
          className="text-xs"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Agregar Lote Accesorio
        </Button>
      </CardHeader>

      <CardContent
        ref={scrollContainerRef}
        className="p-5 space-y-4 max-h-[520px] overflow-y-auto pr-3.5 scroll-smooth"
      >
        {accesorios.map((a, idx) => (
          <div
            key={a.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Lote #{accesorios.length - idx}</span>
              {accesorios.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveAccesorio(a.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Eliminar fila"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {/* Accesorio Base */}
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor={`acc-base-${a.id}`} required>Accesorio Base</Label>
                <div className="flex gap-2">
                  <Select
                    id={`acc-base-${a.id}`}
                    className="flex-1"
                    value={a.accesorioId || ''}
                    onChange={(e) =>
                      onUpdateAccesorio(
                        a.id,
                        'accesorioId',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">-- Seleccionar Accesorio --</option>
                    {accesoriosCatalogo.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.nombre} ({acc.categoria?.nombre || 'General'})
                      </option>
                    ))}
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenInlineAccesorioModal(a.id)}
                    className="text-[11px] whitespace-nowrap border-dashed border-slate-300"
                    title="Crear accesorio base al vuelo"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-slate-700" />
                    Al Vuelo
                  </Button>
                </div>

                {a.nuevoAccesorio && (
                  <p className="text-[11px] text-slate-800 font-medium">
                    ✨ {a.accesorioDisplay}
                  </p>
                )}
              </div>

              {/* Nombre Diferenciador */}
              <div className="sm:col-span-3">
                <Label htmlFor={`acc-nombre-dif-${a.id}`} required>Nombre Diferenciador del Lote</Label>
                <Input
                  id={`acc-nombre-dif-${a.id}`}
                  placeholder="Ej: MagSafe Reforzada Azul / Silicona Lisa Bs 40"
                  value={a.nombreDiferenciador}
                  onChange={(e) =>
                    onUpdateAccesorio(a.id, 'nombreDiferenciador', e.target.value)
                  }
                />
              </div>

              {/* Cantidad */}
              <div>
                <Label htmlFor={`acc-cantidad-${a.id}`} required>Cantidad</Label>
                <Input
                  id={`acc-cantidad-${a.id}`}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={a.cantidad || ''}
                  onChange={(e) =>
                    onUpdateAccesorio(a.id, 'cantidad', parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>

              {/* Costo Unitario Bs */}
              <div className="sm:col-span-2">
                <Label htmlFor={`acc-costo-${a.id}`} required>Costo Unitario (Bs)</Label>
                <Input
                  id={`acc-costo-${a.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={a.costoUnitarioBs || ''}
                  onChange={(e) =>
                    onUpdateAccesorio(
                      a.id,
                      'costoUnitarioBs',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>

              {/* Precio Venta Sugerido Bs */}
              <div className="sm:col-span-2">
                <Label htmlFor={`acc-precio-${a.id}`} required>Precio Venta Sugerido (Bs)</Label>
                <Input
                  id={`acc-precio-${a.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={a.precioVentaBs || ''}
                  onChange={(e) =>
                    onUpdateAccesorio(
                      a.id,
                      'precioVentaBs',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
