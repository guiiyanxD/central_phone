'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Headphones, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CategoriaAccesorioItem } from '@/features/catalogo/types';

interface ModalCrearAccesorioInlineProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: CategoriaAccesorioItem[];
  nuevoAccCategoriaId: number;
  setNuevoAccCategoriaId: (val: number) => void;
  nuevoAccNombre: string;
  setNuevoAccNombre: (val: string) => void;
  nuevoAccDescripcion: string;
  setNuevoAccDescripcion: (val: string) => void;
  onConfirm: () => void;
  onCategoriaCreada?: (cat: CategoriaAccesorioItem) => void;
}

export function ModalCrearAccesorioInline({
  isOpen,
  onClose,
  categorias,
  nuevoAccCategoriaId,
  setNuevoAccCategoriaId,
  nuevoAccNombre,
  setNuevoAccNombre,
  nuevoAccDescripcion,
  setNuevoAccDescripcion,
  onConfirm,
  onCategoriaCreada,
}: ModalCrearAccesorioInlineProps) {
  // Estados para creación in-line de categoría "al vuelo"
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
      setNuevoAccCategoriaId(nuevaCat.id);
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
          <Headphones className="h-4 w-4 text-slate-800" />
          <span>Crear Accesorio Base In-Line (Al Vuelo)</span>
        </div>
      }
      description="Si el proveedor trajo un producto o accesorio base que aún no existe en el catálogo general."
    >
      <div className="space-y-4 pt-2">
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
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Nueva Categoría
              </button>
            </div>
            <Select
              value={nuevoAccCategoriaId || ''}
              onChange={(e) => setNuevoAccCategoriaId(Number(e.target.value))}
            >
              {categorias.length === 0 ? (
                <option value="">No hay categorías registradas</option>
              ) : (
                categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))
              )}
            </Select>
          </div>
        )}

        {/* Nombre del Accesorio Base */}
        <div>
          <Label required>Nombre del Accesorio Base</Label>
          <Input
            placeholder="Ej: Funda Silicone Case iPhone 16 Pro, Cargador Rápido 20W"
            value={nuevoAccNombre}
            onChange={(e) => setNuevoAccNombre(e.target.value)}
            maxLength={150}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Nombre genérico del catálogo base. El acabado específico o color lo defines en el Lote.
          </p>
        </div>

        {/* Descripción (Opcional) */}
        <div>
          <Label>Descripción (Opcional)</Label>
          <Input
            placeholder="Ej: Modelo compatible con carga Qi2 y acabado mate"
            value={nuevoAccDescripcion}
            onChange={(e) => setNuevoAccDescripcion(e.target.value)}
            maxLength={255}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setShowInlineCat(false);
              setInlineCatError(null);
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={onConfirm}
            disabled={!nuevoAccNombre.trim() || !nuevoAccCategoriaId}
          >
            Confirmar e Inyectar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
