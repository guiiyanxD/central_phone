'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModeloItem, TipoDispositivoItem } from '../types';

interface ModalEditarModeloProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: ModeloItem | null;
  tipos: TipoDispositivoItem[];
  isLoading: boolean;
  error: string | null;
  onConfirm: (data: {
    nombreModelo: string;
    marca: string;
    tipoId?: number;
    descripcion?: string;
  }) => Promise<void>;
}

export function ModalEditarModelo({
  isOpen,
  onClose,
  modelo,
  tipos,
  isLoading,
  error,
  onConfirm,
}: ModalEditarModeloProps) {
  const [nombreModelo, setNombreModelo] = useState('');
  const [marca, setMarca] = useState('Apple');
  const [tipoId, setTipoId] = useState<number | undefined>(undefined);
  const [descripcion, setDescripcion] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (modelo) {
      setNombreModelo(modelo.nombreModelo || '');
      setMarca(modelo.marca || 'Apple');
      setTipoId(modelo.tipoId || undefined);
      setDescripcion(modelo.descripcion || '');
      setLocalError(null);
    }
  }, [modelo, isOpen]);

  // Total de unidades físicas asociadas en inventario o ventas
  const totalDispositivos =
    modelo?.variantes?.reduce(
      (sum, v) => sum + (v._count?.dispositivos || 0),
      0,
    ) || 0;

  const hasDispositivosAsociados = totalDispositivos > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreModelo.trim() || nombreModelo.trim().length < 2) {
      setLocalError('El nombre del modelo debe tener al menos 2 caracteres.');
      return;
    }
    setLocalError(null);
    await onConfirm({
      nombreModelo: nombreModelo.trim(),
      marca: marca.trim(),
      tipoId: hasDispositivosAsociados ? undefined : tipoId,
      descripcion: descripcion.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Pencil className="h-4 w-4 text-slate-700" />
          <span>Editar Modelo: {modelo?.nombreModelo}</span>
        </div>
      }
      description="Modifica los datos comerciales del modelo de dispositivo."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {(error || localError) && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs">
            {error || localError}
          </div>
        )}

        {/* Nombre del Modelo */}
        <div>
          <Label htmlFor="edit-modelo-nombre" required>
            Nombre del Modelo
          </Label>
          <Input
            id="edit-modelo-nombre"
            placeholder="Ej: iPhone 16 Pro Max"
            value={nombreModelo}
            onChange={(e) => setNombreModelo(e.target.value)}
            disabled={isLoading}
            required
            minLength={2}
          />
        </div>

        {/* Marca */}
        <div>
          <Label htmlFor="edit-modelo-marca" required>
            Marca
          </Label>
          <Input
            id="edit-modelo-marca"
            placeholder="Ej: Apple, Samsung, Xiaomi"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* Tipo de Dispositivo */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-modelo-tipo" required>
              Tipo de Dispositivo
            </Label>
            {hasDispositivosAsociados && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
                Bloqueado por Stock
              </Badge>
            )}
          </div>
          <Select
            id="edit-modelo-tipo"
            value={tipoId !== undefined ? String(tipoId) : ''}
            onChange={(e) => setTipoId(e.target.value ? Number(e.target.value) : undefined)}
            disabled={isLoading || hasDispositivosAsociados}
          >
            <option value="">-- Seleccionar Tipo --</option>
            {tipos.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </Select>

          {hasDispositivosAsociados && (
            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2 mt-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Este modelo cuenta con <strong>{totalDispositivos} equipo(s) registrado(s)</strong>. Para preservar las reglas de IMEI y serialización, el tipo de dispositivo no puede ser modificado.
              </span>
            </div>
          )}
        </div>

        {/* Descripción Opcional */}
        <div>
          <Label htmlFor="edit-modelo-descripcion">
            Descripción o Notas (Opcional)
          </Label>
          <Input
            id="edit-modelo-descripcion"
            placeholder="Ej: Línea insignia 2026, acabado titanio..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
            isLoading={isLoading}
            loadingText="Guardando..."
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
