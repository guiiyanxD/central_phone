'use client';

import React, { useState } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError, CategoriaGastoItem } from '@/lib/api';

interface ModalCrearCategoriaGastoInlineProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriaCreada: (categoria: CategoriaGastoItem) => void;
}

export function ModalCrearCategoriaGastoInline({
  isOpen,
  onClose,
  onCategoriaCreada,
}: ModalCrearCategoriaGastoInlineProps) {
  const [nombre, setNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setNombre('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    if (!cleanNombre || cleanNombre.length < 2) {
      setErrorMsg('El nombre de la categoría debe contener al menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const nueva = await api.caja.crearCategoriaGasto({ nombre: cleanNombre });
      onCategoriaCreada(nueva);
      handleClose();
    } catch (err: any) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : 'Error al registrar la nueva categoría de egreso.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <Tag className="h-5 w-5 text-slate-700" />
          <span>Nueva Categoría de Egreso</span>
        </div>
      }
      description="Crea una clasificación rápida para egresos operativos de tienda."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <Label htmlFor="inlineCategoriaNombre" required>
            Nombre de la Categoría
          </Label>
          <Input
            id="inlineCategoriaNombre"
            type="text"
            placeholder="Ej: Taxi y Envíos, Almuerzos de Turno..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={isSubmitting}
            maxLength={50}
            autoFocus
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Quedará disponible de inmediato para todos los cajeros y administradores.
          </p>
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
            disabled={isSubmitting || nombre.trim().length < 2}
          >
            {isSubmitting ? 'Guardando...' : 'Crear Categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
