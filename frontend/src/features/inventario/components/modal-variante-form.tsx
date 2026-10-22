'use client';

import React from 'react';
import { Sparkles, AlertCircle, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ModalVarianteFormProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  modelo: any;
  color: string;
  setColor: (val: string) => void;
  capacidad: number;
  setCapacidad: (val: number) => void;
  tipoSim: string;
  setTipoSim: (val: string) => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalVarianteForm({
  mode,
  isOpen,
  onClose,
  modelo,
  color,
  setColor,
  capacidad,
  setCapacidad,
  tipoSim,
  setTipoSim,
  isLoading,
  error,
  onSubmit,
}: ModalVarianteFormProps) {
  const isAdd = mode === 'add';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {!isAdd && <Pencil className="h-4 w-4 text-slate-800" />}
          <span>{isAdd ? 'Agregar Variante' : `Editar Variante (${modelo?.nombreModelo || modelo?.nombre})`}</span>
          {modelo && (
            <Badge variant="outline" className="font-mono text-[10px]">
              {modelo.tipo || 'IPHONE'}
            </Badge>
          )}
        </div>
      }
      description={
        isAdd
          ? `Crea una nueva combinación de color, almacenamiento y conectividad para ${modelo?.nombreModelo || modelo?.nombre || 'el modelo'}.`
          : 'Modifica los atributos oficiales de esta variante. El cambio se reflejará en todo el catálogo e inventario.'
      }
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Label required>Color de la Variante</Label>
          <Input
            placeholder="Ej: Titanio del Desierto, Midnight Blue, Blanco..."
            value={color}
            onChange={(e) => setColor(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Capacidad de Almacenamiento</Label>
            <Select
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
            >
              <option value="0">0 GB (Sin almacenamiento / AirPods / Watch)</option>
              <option value="64">64 GB</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
              <option value="512">512 GB</option>
              <option value="1024">1 TB (1024 GB)</option>
              <option value="2048">2 TB (2048 GB)</option>
            </Select>
          </div>

          <div>
            <Label required>Conectividad / SIM</Label>
            <Select
              value={tipoSim}
              onChange={(e) => setTipoSim(e.target.value)}
            >
              <option value="SIM Físico">SIM Físico</option>
              <option value="eSIM Exclusivo">eSIM Exclusivo</option>
              <option value="Dual SIM Físico">Dual SIM Físico</option>
              <option value="No Aplica">No Aplica (Mac / AirPods / Wi-Fi)</option>
              <option value="GPS Only">GPS Only (Apple Watch)</option>
              <option value="GPS + Cellular">GPS + Cellular (Apple Watch)</option>
            </Select>
          </div>
        </div>

        {/* Previsualización en vivo en modo add */}
        {isAdd && color.trim() && (
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
            <span>
              Se registrará:{' '}
              <strong>
                {modelo?.nombreModelo || modelo?.nombre} - {color.trim()} (
                {capacidad > 0
                  ? capacidad >= 1024
                    ? `${capacidad / 1024}TB`
                    : `${capacidad}GB`
                  : '0 GB'}
                ) [{tipoSim}]
              </strong>
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 text-xs font-semibold"
            isLoading={isLoading}
            disabled={!color.trim()}
          >
            {isAdd ? 'Agregar al Catálogo' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
