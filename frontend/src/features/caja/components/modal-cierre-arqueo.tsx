import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNombreCaja } from '@/lib/utils';

interface ModalCierreArqueoProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: any;
  user: any;
  cierreError: string | null;
  conteoFisico: number;
  setConteoFisico: (val: number) => void;
  justificacionCierre: string;
  setJustificacionCierre: (val: string) => void;
  obsCierre: string;
  setObsCierre: (val: string) => void;
  isClosing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalCierreArqueo({
  isOpen,
  onClose,
  sessionData,
  user,
  cierreError,
  conteoFisico,
  setConteoFisico,
  justificacionCierre,
  setJustificacionCierre,
  obsCierre,
  setObsCierre,
  isClosing,
  onSubmit,
}: ModalCierreArqueoProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        sessionData?.caja
          ? `Cierre y Arqueo: ${formatNombreCaja(
              sessionData.caja.fechaApertura,
              sessionData.caja.sucursal?.nombre || user?.sucursal?.nombre
            )}`
          : 'Cierre y Arqueo de Caja'
      }
      description="Por regla de seguridad, debes ingresar el monto de efectivo que contaste físicamente en la gaveta."
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {cierreError && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs animate-in fade-in"
          >
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Descuadre Detectado:
            </p>
            <p className="mt-1 text-amber-800">{cierreError}</p>
          </div>
        )}

        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-slate-900">Arqueo a Ciegas:</p>
          <p className="text-slate-500">
            Cuenta todo el dinero en efectivo que tienes en mano (billetes y monedas) y digítalo a continuación.
            El sistema comparará tu conteo contra el balance teórico.
          </p>
        </div>

        <div>
          <Label htmlFor="conteoFisico" required>Efectivo Físico Contado (Bs)</Label>
          <Input
            id="conteoFisico"
            type="number"
            step="0.50"
            min="0"
            placeholder="0.00"
            value={conteoFisico || ''}
            onChange={(e) => setConteoFisico(parseFloat(e.target.value) || 0)}
            className="font-mono text-base font-bold"
          />
        </div>

        <div>
          <Label htmlFor="justificacionCierre">Justificación en Caso de Descuadre</Label>
          <Input
            id="justificacionCierre"
            placeholder="Obligatorio si existe sobrante o faltante respecto al sistema"
            value={justificacionCierre}
            onChange={(e) => setJustificacionCierre(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="obsCierre">Observaciones de Cierre (Opcional)</Label>
          <Input
            id="obsCierre"
            placeholder="Ej: Conteo verificado, sin novedades"
            value={obsCierre}
            onChange={(e) => setObsCierre(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Volver
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isClosing}
          >
            Confirmar Arqueo y Cerrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
