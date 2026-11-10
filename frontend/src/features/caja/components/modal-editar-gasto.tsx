'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';

interface ModalEditarGastoProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: any | null;
  categoriasGasto: any[];
  saldoDisponibleEfectivo?: number;
  onGastoActualizado: () => Promise<void>;
}

export function ModalEditarGasto({
  isOpen,
  onClose,
  gasto,
  categoriasGasto,
  saldoDisponibleEfectivo,
  onGastoActualizado,
}: ModalEditarGastoProps) {
  const [categoriaId, setCategoriaId] = useState<number>(0);
  const [montoBs, setMontoBs] = useState<number>(0);
  const [concepto, setConcepto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gasto) {
      setCategoriaId(gasto.categoriaId || gasto.categoria?.id || 1);
      setMontoBs(Number(gasto.montoBs) || 0);
      setConcepto(gasto.concepto || '');
      setError(null);
    }
  }, [gasto]);

  if (!gasto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim()) {
      setError('El concepto del egreso no puede estar vacío.');
      return;
    }
    if (montoBs <= 0) {
      setError('El monto del egreso debe ser mayor a 0 Bs.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.caja.actualizarGasto(gasto.id, {
        categoriaId,
        montoBs,
        concepto: concepto.trim(),
      });
      await onGastoActualizado();
      onClose();
    } catch (err: any) {
      setError(
        err instanceof ApiError ? err.message : 'Error al actualizar el egreso menor.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Pencil className="h-5 w-5 text-slate-700" />
          <span>Editar Egreso Menor #{gasto.id}</span>
        </div>
      }
      description="Modificación controlada de egreso operativo registrado en caja."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Label htmlFor="editGastoCategoriaId" required>Categoría de Gasto</Label>
          <Select
            id="editGastoCategoriaId"
            value={categoriaId}
            onChange={(e) => setCategoriaId(Number(e.target.value))}
            disabled={isSubmitting}
          >
            {categoriasGasto.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="editGastoMonto" required>Monto en Bolivianos (Bs)</Label>
          <Input
            id="editGastoMonto"
            type="number"
            step="0.50"
            min="0.50"
            placeholder="Ej: 25.00"
            value={montoBs || ''}
            onChange={(e) => setMontoBs(parseFloat(e.target.value) || 0)}
            disabled={isSubmitting}
            required
          />
          {saldoDisponibleEfectivo !== undefined && (
            <p className="text-[11px] text-slate-500 mt-1">
              Saldo estimado en gaveta: Bs {saldoDisponibleEfectivo.toFixed(2)}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="editGastoConcepto" required>Concepto / Detalle</Label>
          <Input
            id="editGastoConcepto"
            type="text"
            placeholder="Ej: Compra de insumos de limpieza"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
