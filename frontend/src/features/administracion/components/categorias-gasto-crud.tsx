'use client';

import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError, CategoriaGastoItem } from '@/lib/api';

export function CategoriasGastoCrud() {
  const [categorias, setCategorias] = useState<CategoriaGastoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaGastoItem | null>(null);
  const [categoriaParaEliminar, setCategoriaParaEliminar] = useState<CategoriaGastoItem | null>(null);

  // Estados de inputs de modales
  const [formNombre, setFormNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategorias = async () => {
    try {
      const data = await api.caja.getCategoriasGasto();
      setCategorias(data);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err instanceof ApiError ? err.message : 'Error al cargar las categorías de egreso.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  // Crear categoría
  const handleOpenCreate = () => {
    setFormNombre('');
    setModalError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = formNombre.trim();
    if (cleanNombre.length < 2) {
      setModalError('El nombre de la categoría debe contener al menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await api.caja.crearCategoriaGasto({ nombre: cleanNombre });
      setIsCreateOpen(false);
      setFeedback({
        type: 'success',
        message: `Categoría '${cleanNombre}' creada exitosamente.`,
      });
      await fetchCategorias();
    } catch (err: any) {
      setModalError(
        err instanceof ApiError ? err.message : 'Error al crear la categoría.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar categoría
  const handleOpenEdit = (cat: CategoriaGastoItem) => {
    setCategoriaParaEditar(cat);
    setFormNombre(cat.nombre);
    setModalError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaParaEditar) return;

    const cleanNombre = formNombre.trim();
    if (cleanNombre.length < 2) {
      setModalError('El nombre de la categoría debe contener al menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await api.caja.actualizarCategoriaGasto(categoriaParaEditar.id, { nombre: cleanNombre });
      setCategoriaParaEditar(null);
      setFeedback({
        type: 'success',
        message: `Categoría actualizada a '${cleanNombre}' exitosamente.`,
      });
      await fetchCategorias();
    } catch (err: any) {
      setModalError(
        err instanceof ApiError ? err.message : 'Error al actualizar la categoría.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar categoría
  const handleOpenDelete = (cat: CategoriaGastoItem) => {
    setCategoriaParaEliminar(cat);
    setModalError(null);
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaParaEliminar) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      await api.caja.eliminarCategoriaGasto(categoriaParaEliminar.id);
      setCategoriaParaEliminar(null);
      setFeedback({
        type: 'success',
        message: `Categoría '${categoriaParaEliminar.nombre}' eliminada exitosamente.`,
      });
      await fetchCategorias();
    } catch (err: any) {
      setModalError(
        err instanceof ApiError ? err.message : 'Error al eliminar la categoría.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
            <Tags className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Categorías de Egresos de Caja
              <Badge variant="outline" className="text-[11px] font-mono">
                {categorias.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs mt-0.5">
              Clasificación oficial de gastos operativos menores para arqueos de caja diaria en sucursales.
            </CardDescription>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Categoría</span>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {feedback && (
          <div
            className={`m-4 p-3 rounded-lg border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] font-semibold underline ml-3 opacity-70 hover:opacity-100"
            >
              Cerrar
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : categorias.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderTree className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Sin categorías registradas</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crea categorías para que los cajeros puedan clasificar los egresos autorizados en tienda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-900">
                <tr>
                  <th className="py-3 px-4">Nombre de la Categoría</th>
                  <th className="py-3 px-4">Egresos Vinculados</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categorias.map((cat) => {
                  const egresosCount = cat._count?.gastosOperativos || 0;
                  const tieneEgresos = egresosCount > 0;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {cat.nombre}
                      </td>
                      <td className="py-3 px-4">
                        {tieneEgresos ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] bg-slate-100 text-slate-700 border-slate-300 font-mono"
                          >
                            {egresosCount} egreso{egresosCount !== 1 ? 's' : ''} registrado{egresosCount !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-300 font-medium"
                          >
                            0 egresos (Sin uso)
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-300 gap-1"
                            onClick={() => handleOpenEdit(cat)}
                            title="Editar nombre de la categoría"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-600" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`h-8 px-2.5 text-xs gap-1 ${
                              tieneEgresos
                                ? 'text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50 border-rose-200'
                            }`}
                            onClick={() => !tieneEgresos && handleOpenDelete(cat)}
                            disabled={tieneEgresos}
                            title={
                              tieneEgresos
                                ? `No se puede eliminar: tiene ${egresosCount} egreso(s) registrado(s) en caja.`
                                : 'Eliminar categoría sin egresos asociados'
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* MODAL CREAR CATEGORÍA */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <Tags className="h-5 w-5 text-slate-700" />
            <span>Nueva Categoría de Egreso</span>
          </div>
        }
        description="Agrega una nueva categoría oficial para clasificar gastos en caja."
        className="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {modalError && (
            <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <Label htmlFor="createCatNombre" required>Nombre de la Categoría</Label>
            <Input
              id="createCatNombre"
              type="text"
              placeholder="Ej: Servicios Básicos, Alquiler Tienda, Delivery..."
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              disabled={isSubmitting}
              maxLength={50}
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isSubmitting || formNombre.trim().length < 2}
            >
              {isSubmitting ? 'Guardando...' : 'Crear Categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL EDITAR CATEGORÍA */}
      <Modal
        isOpen={!!categoriaParaEditar}
        onClose={() => !isSubmitting && setCategoriaParaEditar(null)}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <Pencil className="h-5 w-5 text-slate-700" />
            <span>Editar Categoría de Egreso</span>
          </div>
        }
        description="Modifica el nombre oficial de la categoría de gasto."
        className="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {modalError && (
            <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <Label htmlFor="editCatNombre" required>Nombre de la Categoría</Label>
            <Input
              id="editCatNombre"
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              disabled={isSubmitting}
              maxLength={50}
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setCategoriaParaEditar(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isSubmitting || formNombre.trim().length < 2}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL ELIMINAR CATEGORÍA (SOLO 0 EGRESOS) */}
      <Modal
        isOpen={!!categoriaParaEliminar}
        onClose={() => !isSubmitting && setCategoriaParaEliminar(null)}
        title={
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Eliminar Categoría</span>
          </div>
        }
        description="Esta acción eliminará permanentemente la categoría de la lista."
        className="max-w-md"
      >
        <form onSubmit={handleDeleteSubmit} className="space-y-4 pt-2 text-xs text-slate-700">
          {modalError && (
            <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <p>
            ¿Estás seguro de que deseas eliminar la categoría{' '}
            <strong className="text-slate-900 font-semibold font-mono">
              &quot;{categoriaParaEliminar?.nombre}&quot;
            </strong>
            ?
          </p>

          <p className="text-[11px] text-slate-500">
            Esta categoría no cuenta con ningún egreso registrado en caja, por lo que su eliminación es segura y no afecta la integridad contable de los arqueos.
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setCategoriaParaEliminar(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Eliminando...' : 'Eliminar Categoría'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
