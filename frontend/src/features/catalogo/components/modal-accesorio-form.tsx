'use client';

import React, { useState } from 'react';
import { Headphones, Pencil, AlertCircle, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
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
  onCategoriaCreada?: (cat: CategoriaAccesorioItem) => void;
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
  onCategoriaCreada,
}: ModalAccesorioFormProps) {
  const isCreate = mode === 'create';

  // Estados para creación in-line de categoría ("al vuelo")
  const [showInlineCat, setShowInlineCat] = useState(false);
  const [inlineCatNombre, setInlineCatNombre] = useState('');
  const [inlineCatDesc, setInlineCatDesc] = useState('');
  const [isSavingInlineCat, setIsSavingInlineCat] = useState(false);
  const [inlineCatError, setInlineCatError] = useState<string | null>(null);

  const handleGuardarCategoriaInline = async () => {
    if (!inlineCatNombre.trim()) {
      setInlineCatError('El nombre de la categoría es obligatorio.');
      return;
    }
    setIsSavingInlineCat(true);
    setInlineCatError(null);
    try {
      const nuevaCat = await api.accesorios.createCategoria({
        nombre: inlineCatNombre.trim(),
        descripcion: inlineCatDesc.trim() || undefined,
      });
      onCategoriaCreada?.(nuevaCat);
      setCategoriaId(nuevaCat.id);
      setShowInlineCat(false);
      setInlineCatNombre('');
      setInlineCatDesc('');
    } catch (err: any) {
      setInlineCatError(
        err instanceof ApiError ? err.message : 'Error al crear la categoría.'
      );
    } finally {
      setIsSavingInlineCat(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowInlineCat(false);
        setInlineCatError(null);
        onClose();
      }}
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

        {/* Selector de Categoría con soporte de Creación "Al Vuelo" */}
        {showInlineCat ? (
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-blue-600" />
                Nueva Categoría "Al Vuelo"
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowInlineCat(false);
                  setInlineCatError(null);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
              >
                Cancelar
              </button>
            </div>

            {inlineCatError && (
              <p className="text-[11px] text-rose-600 font-medium">{inlineCatError}</p>
            )}

            <div>
              <Label required className="text-[11px]">Nombre de la Categoría</Label>
              <Input
                placeholder="Ej: Soportes MagSafe, Correas Apple Watch..."
                value={inlineCatNombre}
                onChange={(e) => setInlineCatNombre(e.target.value)}
                maxLength={50}
                className="h-8 text-xs bg-white"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-[11px]">Descripción (Opcional)</Label>
              <Input
                placeholder="Ej: Accesorios magnéticos de fijación y carga..."
                value={inlineCatDesc}
                onChange={(e) => setInlineCatDesc(e.target.value)}
                maxLength={255}
                className="h-8 text-xs bg-white"
              />
            </div>

            <Button
              type="button"
              size="sm"
              className="w-full text-xs font-semibold h-8"
              onClick={handleGuardarCategoriaInline}
              isLoading={isSavingInlineCat}
            >
              Guardar y Seleccionar Categoría
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label required className="mb-0">Categoría / Tipo de Accesorio</Label>
              <button
                type="button"
                onClick={() => {
                  setShowInlineCat(true);
                  setInlineCatNombre('');
                  setInlineCatDesc('');
                  setInlineCatError(null);
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Nueva Categoría
              </button>
            </div>
            <Select
              value={categoriaId || ''}
              onChange={(e) => {
                if (e.target.value === '__NUEVA__') {
                  setShowInlineCat(true);
                  setInlineCatNombre('');
                  setInlineCatDesc('');
                  setInlineCatError(null);
                } else {
                  setCategoriaId(Number(e.target.value));
                }
              }}
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
              <option value="__NUEVA__" className="text-blue-600 font-semibold">
                + Crear nueva categoría al vuelo...
              </option>
            </Select>
          </div>
        )}

        <div>
          <Label required>Nombre del Accesorio</Label>
          <Input
            placeholder="Ej: Funda Silicona Case iPhone 15 Pro, Cargador 20W USB-C..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={150}
            required
            autoFocus={!showInlineCat}
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
