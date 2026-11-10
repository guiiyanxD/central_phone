import React, { useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CategoriaGastoItem } from '@/lib/api';
import { ModalCrearCategoriaGastoInline } from './modal-crear-categoria-gasto-inline';

interface ModalRegistroGastoProps {
  isOpen: boolean;
  onClose: () => void;
  gastoError: string | null;
  categoriasGasto: any[];
  gastoCategoriaId: number;
  setGastoCategoriaId: (val: number) => void;
  gastoMonto: number;
  setGastoMonto: (val: number) => void;
  gastoConcepto: string;
  setGastoConcepto: (val: string) => void;
  isAdmin: boolean;
  rf: any;
  isSavingGasto: boolean;
  onCategoriaCreada?: (cat: CategoriaGastoItem) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalRegistroGasto({
  isOpen,
  onClose,
  gastoError,
  categoriasGasto,
  gastoCategoriaId,
  setGastoCategoriaId,
  gastoMonto,
  setGastoMonto,
  gastoConcepto,
  setGastoConcepto,
  isAdmin,
  rf,
  isSavingGasto,
  onCategoriaCreada,
  onSubmit,
}: ModalRegistroGastoProps) {
  const [isCrearCategoriaOpen, setIsCrearCategoriaOpen] = useState(false);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Registrar Egreso Menor de Caja"
        description="Salida autorizada de efectivo para compras rápidas de la tienda."
      >
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {gastoError && (
            <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-slate-800 flex-shrink-0" />
              <span>{gastoError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="gastoCategoriaId" required>Categoría de Gasto</Label>
              <button
                type="button"
                onClick={() => setIsCrearCategoriaOpen(true)}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                title="Registrar nueva categoría de egreso"
              >
                <Plus className="h-3 w-3" />
                <span>Nueva Categoría</span>
              </button>
            </div>
            <Select
              id="gastoCategoriaId"
              value={gastoCategoriaId}
              onChange={(e) => setGastoCategoriaId(Number(e.target.value))}
            >
              {categoriasGasto.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </div>

        <div>
          <Label htmlFor="gastoMonto" required>Monto en Bolivianos (Bs)</Label>
          <Input
            id="gastoMonto"
            type="number"
            step="0.50"
            min="0.50"
            placeholder="Ej: 25.00"
            value={gastoMonto || ''}
            onChange={(e) => setGastoMonto(parseFloat(e.target.value) || 0)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {isAdmin
              ? `Disponible en efectivo: Bs ${rf?.saldoEfectivoEnCaja?.toFixed(2)}`
              : 'Fondos disponibles en caja activa'}
          </p>
        </div>

        <div>
          <Label htmlFor="gastoConcepto" required>Concepto / Motivo</Label>
          <Input
            id="gastoConcepto"
            placeholder="Ej: Compra 5 chips Tigo para clientes de tienda"
            value={gastoConcepto}
            onChange={(e) => setGastoConcepto(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
            isLoading={isSavingGasto}
            disabled={gastoMonto <= 0 || !gastoConcepto.trim()}
          >
            Registrar Egreso
          </Button>
        </div>
      </form>
    </Modal>

    <ModalCrearCategoriaGastoInline
      isOpen={isCrearCategoriaOpen}
      onClose={() => setIsCrearCategoriaOpen(false)}
      onCategoriaCreada={(nueva) => {
        setGastoCategoriaId(nueva.id);
        if (onCategoriaCreada) {
          onCategoriaCreada(nueva);
        }
      }}
    />
  </>
  );
}
