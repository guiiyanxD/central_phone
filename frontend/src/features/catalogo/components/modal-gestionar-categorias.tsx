'use client';

import React, { useState } from 'react';
import {
  Layers,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  Check,
  X,
  Package,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api, ApiError } from '@/lib/api';
import { CategoriaAccesorioItem } from '../types';

interface ModalGestionarCategoriasProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: CategoriaAccesorioItem[];
  isAdmin: boolean;
  onCategoriaCreada: (cat: CategoriaAccesorioItem) => void;
  onCategoriaActualizada: (cat: CategoriaAccesorioItem) => void;
  onCategoriaEliminada: (id: number) => void;
}

export function ModalGestionarCategorias({
  isOpen,
  onClose,
  categorias,
  isAdmin,
  onCategoriaCreada,
  onCategoriaActualizada,
  onCategoriaEliminada,
}: ModalGestionarCategoriasProps) {
  // Estado para crear nueva categoría dentro del gestor
  const [showCreate, setShowCreate] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Estado para edición en línea de una categoría existente
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Estado para eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const startEdit = (cat: CategoriaAccesorioItem) => {
    setEditingId(cat.id);
    setEditNombre(cat.nombre);
    setEditDescripcion(cat.descripcion || '');
    setUpdateError(null);
    setShowCreate(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNombre('');
    setEditDescripcion('');
    setUpdateError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      setCreateError('El nombre de la categoría es obligatorio.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await api.accesorios.createCategoria({
        nombre: nuevoNombre.trim(),
        descripcion: nuevaDescripcion.trim() || undefined,
      });
      onCategoriaCreada(created);
      setNuevoNombre('');
      setNuevaDescripcion('');
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(
        err instanceof ApiError ? err.message : 'Error al registrar la categoría.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editNombre.trim()) {
      setUpdateError('El nombre no puede estar vacío.');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updated = await api.accesorios.updateCategoria(id, {
        nombre: editNombre.trim(),
        descripcion: editDescripcion.trim() || undefined,
      });
      onCategoriaActualizada(updated);
      setEditingId(null);
    } catch (err: any) {
      setUpdateError(
        err instanceof ApiError ? err.message : 'Error al actualizar la categoría.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (cat: CategoriaAccesorioItem) => {
    if (cat._count && cat._count.accesorios > 0) {
      setActionError(
        `No se puede eliminar la categoría '${cat.nombre}' porque contiene ${cat._count.accesorios} accesorio(s) asociado(s).`
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar la categoría '${cat.nombre}'? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    setDeletingId(cat.id);
    setActionError(null);
    setIsDeleting(true);
    try {
      await api.accesorios.deleteCategoria(cat.id);
      onCategoriaEliminada(cat.id);
    } catch (err: any) {
      setActionError(
        err instanceof ApiError ? err.message : 'Error al eliminar la categoría.'
      );
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-800" />
          <span>Gestión de Categorías de Accesorios</span>
        </div>
      }
      description="Consulta, crea, edita y organiza las clasificaciones del catálogo de accesorios."
    >
      <div className="space-y-4 pt-2">
        {actionError && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Encabezado y Botón Nueva Categoría */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            Categorías registradas ({categorias.length})
          </span>
          {!showCreate && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setShowCreate(true);
                cancelEdit();
              }}
              className="text-xs h-7 gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva Categoría
            </Button>
          )}
        </div>

        {/* Formulario Inline para Crear */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-blue-600" />
                Registrar Nueva Categoría
              </span>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Cancelar
              </button>
            </div>

            {createError && (
              <p className="text-[11px] text-rose-600 font-medium">{createError}</p>
            )}

            <div>
              <Label required className="text-[11px]">Nombre</Label>
              <Input
                placeholder="Ej: Soportes MagSafe, Correas Apple Watch..."
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                maxLength={50}
                className="h-8 text-xs bg-white"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-[11px]">Descripción (Opcional)</Label>
              <Input
                placeholder="Ej: Accesorios magnéticos de fijación vehicular y mesa..."
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                maxLength={255}
                className="h-8 text-xs bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs font-semibold"
                isLoading={isCreating}
              >
                Guardar Categoría
              </Button>
            </div>
          </form>
        )}

        {/* Listado de Categorías */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {categorias.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No hay categorías registradas.
            </div>
          ) : (
            categorias.map((cat) => {
              const isEditing = editingId === cat.id;
              const cantAccesorios = cat._count?.accesorios || 0;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-50 space-y-2 animate-in fade-in duration-150"
                  >
                    {updateError && (
                      <p className="text-[11px] text-rose-600">{updateError}</p>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[11px]">Nombre</Label>
                      <Input
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="h-8 text-xs bg-white"
                        maxLength={50}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Descripción</Label>
                      <Input
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        className="h-8 text-xs bg-white"
                        maxLength={255}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={cancelEdit}
                      >
                        <X className="h-3 w-3" /> Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs gap-1 font-semibold"
                        onClick={() => handleUpdate(cat.id)}
                        isLoading={isUpdating}
                      >
                        <Check className="h-3 w-3" /> Guardar
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {cat.nombre}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-slate-500 border-slate-200 shrink-0 font-normal"
                      >
                        <Package className="h-3 w-3 mr-1 inline text-slate-400" />
                        {cantAccesorios} {cantAccesorios === 1 ? 'accesorio' : 'accesorios'}
                      </Badge>
                    </div>
                    {cat.descripcion && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {cat.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                      onClick={() => startEdit(cat)}
                      title="Editar categoría"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    {isAdmin && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={cantAccesorios > 0 || isDeleting}
                        className={`h-7 w-7 p-0 ${
                          cantAccesorios > 0
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                        }`}
                        onClick={() => handleDelete(cat)}
                        title={
                          cantAccesorios > 0
                            ? `No se puede eliminar: tiene ${cantAccesorios} accesorio(s) asociado(s)`
                            : 'Eliminar categoría'
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" className="text-xs" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
