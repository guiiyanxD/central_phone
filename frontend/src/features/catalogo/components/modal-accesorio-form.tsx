'use client';

import React from 'react';
import { Headphones, Pencil, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CategoriaAccesorioItem } from '../types';

interface ModalAccesorioFormProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  categorias: CategoriaAccesorioItem[];
  categoriaId: number;
  setCategoriaId: (val: number) => void;
  nombre: string;
  setNombre: (val: string) => void;
  descripcion: string;
  setDescripcion: (val: string) => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalAccesorioForm({
  mode,
  isOpen,
  onClose,
  categorias,
  categoriaId,
  setCategoriaId,
  nombre,
  setNombre,
  descripcion,
  setDescripcion,
  isLoading,
  error,
  onSubmit,
}: ModalAccesorioFormProps) {
  const isCreate = mode === 'create';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isCreate ? (
            <Headphones className="h-4 w-4 text-slate-800" />
          ) : (
            <Pencil className="h-4 w-4 text-slate-800" />
          )}
          <span>{isCreate ? 'Nuevo Accesorio Base' : 'Editar Accesorio Base'}</span>
        </div>
      }
      description={
        isCreate
          ? 'Registra un nuevo producto de accesorio base en el catálogo maestro para su posterior recepción por lotes.'
          : 'Modifica el tipo, nombre o descripción del accesorio base en el catálogo oficial.'
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
          <Label required>Categoría / Tipo de Accesorio</Label>
          <Select
            value={categoriaId || ''}
            onChange={(e) => setCategoriaId(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Seleccione una categoría...
            </option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label required>Nombre del Accesorio</Label>
          <Input
            placeholder="Ej: Funda Silicona Case iPhone 15 Pro, Cargador 20W USB-C..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={150}
            required
            autoFocus
          />
        </div>

        <div>
          <Label>Descripción o Detalles (Opcional)</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ej: Acabado mate con imanes MagSafe integrados, compatible con carga inalámbrica Qi..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={255}
            rows={3}
          />
          <p className="text-[11px] text-slate-400 text-right mt-1">
            {descripcion.length}/255 caracteres
          </p>
        </div>

        <div className="flex gap-2 pt-2">
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
          >
            {isCreate ? 'Registrar Accesorio' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
