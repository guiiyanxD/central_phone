'use client';

import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Battery,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';

export interface DispositivoEditableData {
  id: number;
  modelo?: string;
  color?: string;
  capacidadGb?: number;
  numeroSerie: string;
  imei1?: string;
  imei2?: string;
  porcentajeBateria?: number | null;
  detallesFisicos?: string | null;
  costoBs?: number | string;
  estadoInventario?: string;
}

interface ModalEditarDispositivoInlineProps {
  isOpen: boolean;
  onClose: () => void;
  dispositivo: DispositivoEditableData | null;
  onSuccess: () => void;
}

export function ModalEditarDispositivoInline({
  isOpen,
  onClose,
  dispositivo,
  onSuccess,
}: ModalEditarDispositivoInlineProps) {
  const [numeroSerie, setNumeroSerie] = useState('');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [porcentajeBateria, setPorcentajeBateria] = useState<number | ''>(85);
  const [detallesFisicos, setDetallesFisicos] = useState('');
  const [costoBs, setCostoBs] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (dispositivo && isOpen) {
      setErrorMsg(null);
      setNumeroSerie(dispositivo.numeroSerie || '');
      setImei1(dispositivo.imei1 || '');
      setImei2(dispositivo.imei2 || '');
      setPorcentajeBateria(
        dispositivo.porcentajeBateria !== undefined && dispositivo.porcentajeBateria !== null
          ? Number(dispositivo.porcentajeBateria)
          : 85,
      );
      setDetallesFisicos(dispositivo.detallesFisicos || '');
      setCostoBs(
        dispositivo.costoBs !== undefined && dispositivo.costoBs !== null
          ? Number(dispositivo.costoBs)
          : '',
      );
    }
  }, [dispositivo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispositivo) return;

    if (!numeroSerie.trim()) {
      setErrorMsg('El número de serie es obligatorio.');
      return;
    }

    if (porcentajeBateria === '' || porcentajeBateria < 1 || porcentajeBateria > 100) {
      setErrorMsg('El porcentaje de batería debe ser un número entero entre 1% y 100%.');
      return;
    }

    if (typeof costoBs !== 'number' || costoBs <= 0) {
      setErrorMsg('El costo de compra en Bs debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.modelos.updateDispositivo(dispositivo.id, {
        numeroSerie: numeroSerie.trim(),
        imei1: imei1.trim() || undefined,
        imei2: imei2.trim() || undefined,
        porcentajeBateria: Number(porcentajeBateria),
        detallesFisicos: detallesFisicos.trim() || undefined,
        costoBs: Number(costoBs),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'Error al actualizar los datos del dispositivo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !dispositivo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Información del Dispositivo" className="max-w-lg p-5">
      <div className="space-y-4">
        {/* Cabecera del equipo */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {dispositivo.modelo || 'Dispositivo Apple'}
              </p>
              <p className="text-xs text-slate-500">
                {dispositivo.color} • {dispositivo.capacidadGb ? `${dispositivo.capacidadGb} GB` : ''}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
            ADMIN
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Identificadores físicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="serieInput" className="text-xs font-semibold text-slate-700">
                Número de Serie <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="serieInput"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value.toUpperCase())}
                placeholder="F2LZX90..."
                className="mt-1 font-mono text-xs uppercase"
                disabled={isSubmitting}
                autoFocus
                aria-required="true"
                required
              />
            </div>
            <div>
              <Label htmlFor="imei1Input" className="text-xs font-semibold text-slate-700">
                IMEI 1 (Principal)
              </Label>
              <Input
                id="imei1Input"
                value={imei1}
                onChange={(e) => setImei1(e.target.value.replace(/\D/g, ''))}
                placeholder="358900..."
                className="mt-1 font-mono text-xs"
                disabled={isSubmitting}
                maxLength={18}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="imei2Input" className="text-xs font-semibold text-slate-700">
                IMEI 2 (Secundario / eSIM)
              </Label>
              <Input
                id="imei2Input"
                value={imei2}
                onChange={(e) => setImei2(e.target.value.replace(/\D/g, ''))}
                placeholder="358901..."
                className="mt-1 font-mono text-xs"
                disabled={isSubmitting}
                maxLength={18}
              />
            </div>
            <div>
              <Label htmlFor="bateriaInput" className="text-xs font-semibold text-slate-700">
                Condición Batería (%) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Battery className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="bateriaInput"
                  type="number"
                  min="1"
                  max="100"
                  value={porcentajeBateria}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setPorcentajeBateria(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="85"
                  className="pl-9 font-mono text-xs"
                  disabled={isSubmitting}
                  aria-required="true"
                  required
                />
              </div>
            </div>
          </div>

          {/* Costo de compra */}
          <div>
            <Label htmlFor="costoInput" className="text-xs font-semibold text-slate-700">
              Costo de Compra / Toma (Bs) <span className="text-rose-500">*</span>
            </Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="costoInput"
                type="number"
                step="0.01"
                min="0.01"
                value={costoBs}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCostoBs(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="3500.00"
                className="pl-9 font-mono text-xs font-bold text-slate-900"
                disabled={isSubmitting}
                aria-required="true"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Al modificar el costo se recalculará automáticamente la Nota de Ingreso y el precio sugerido.
            </p>
          </div>

          {/* Registro y situación física */}
          <div>
            <Label htmlFor="registroInput" className="text-xs font-semibold text-slate-700">
              Registro / Situación Física
            </Label>
            <Input
              id="registroInput"
              value={detallesFisicos}
              onChange={(e) => setDetallesFisicos(e.target.value)}
              placeholder="Ej: Pantalla cambiada original, sin FaceID, detalle en bisel..."
              className="mt-1 text-xs"
              disabled={isSubmitting}
              maxLength={255}
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
