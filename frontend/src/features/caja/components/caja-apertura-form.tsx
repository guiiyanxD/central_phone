import React from 'react';
import { Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface CajaAperturaFormProps {
  montoApertura: number;
  setMontoApertura: (val: number) => void;
  obsApertura: string;
  setObsApertura: (val: string) => void;
  openingError: string | null;
  isOpening: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function CajaAperturaForm({
  montoApertura,
  setMontoApertura,
  obsApertura,
  setObsApertura,
  openingError,
  isOpening,
  onSubmit,
}: CajaAperturaFormProps) {
  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="border-slate-200 shadow-card">
        <CardHeader className="p-6 text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
            <Unlock className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900">
            Apertura de Caja
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Ingresa el monto de cambio inicial en efectivo para habilitar el Punto de Venta.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <form onSubmit={onSubmit} className="space-y-4">
            {openingError && (
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-800 flex-shrink-0" />
                <span>{openingError}</span>
              </div>
            )}

            <div>
              <Label htmlFor="montoApertura" required>Monto Inicial en Efectivo (Bs)</Label>
              <Input
                id="montoApertura"
                type="number"
                step="0.50"
                min="0"
                placeholder="Ej: 300.00"
                value={montoApertura || ''}
                onChange={(e) => setMontoApertura(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Dinero físico disponible para cambio en gaveta.
              </p>
            </div>

            <div>
              <Label htmlFor="obsApertura">Observaciones de Apertura (Opcional)</Label>
              <Input
                id="obsApertura"
                placeholder="Ej: Billetes fraccionados para cambio"
                value={obsApertura}
                onChange={(e) => setObsApertura(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isOpening}
              loadingText="Abriendo caja..."
            >
              <Unlock className="mr-2 h-4 w-4" />
              Abrir Caja
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
