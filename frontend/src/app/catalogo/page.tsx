'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import {
  CatalogoTab,
  ModeloItem,
  AccesorioItem,
  CategoriaAccesorioItem,
  CatalogoHeader,
  CatalogoModelosTab,
  CatalogoAccesoriosTab,
  ModalNuevoModelo,
  ModalVarianteForm,
  ModalVarianteDelete,
  ModalAccesorioForm,
  DialogDeleteAccesorio,
} from '@/features/catalogo';

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as CatalogoTab) || 'modelos';

  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [activeTab, setActiveTab] = useState<CatalogoTab>(
    initialTab === 'accesorios' ? 'accesorios' : 'modelos'
  );

  // Estados de Modelos y Variantes Apple
  const [modelos, setModelos] = useState<ModeloItem[]>([]);
  const [isLoadingModelos, setIsLoadingModelos] = useState(true);

  // Estados de Accesorios Base y Categorías
  const [accesorios, setAccesorios] = useState<AccesorioItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAccesorioItem[]>([]);
  const [isLoadingAccesorios, setIsLoadingAccesorios] = useState(true);

  // Modales de Modelo
  const [modalNuevoModeloOpen, setModalNuevoModeloOpen] = useState(false);
  const [nuevoNombreModelo, setNuevoNombreModelo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<
    'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO'
  >('IPHONE');
  const [primeraVarColor, setPrimeraVarColor] = useState('');
  const [primeraVarCapacidad, setPrimeraVarCapacidad] = useState(256);
  const [primeraVarSim, setPrimeraVarSim] = useState('SIM Físico');
  const [isCreatingModelo, setIsCreatingModelo] = useState(false);
  const [creacionError, setCreacionError] = useState<string | null>(null);

  // Modal para Agregar Variante a Modelo
  const [modalAddVarianteOpen, setModalAddVarianteOpen] = useState(false);
  const [selectedModeloForAdd, setSelectedModeloForAdd] = useState<ModeloItem | null>(null);
  const [addVarColor, setAddVarColor] = useState('');
  const [addVarCapacidad, setAddVarCapacidad] = useState(256);
  const [addVarSim, setAddVarSim] = useState('SIM Físico');
  const [isAddingVariante, setIsAddingVariante] = useState(false);
  const [addVarianteError, setAddVarianteError] = useState<string | null>(null);

  // Modal para Editar Variante (Exclusivo ADMIN)
  const [modalEditVarianteOpen, setModalEditVarianteOpen] = useState(false);
  const [selectedModeloForEdit, setSelectedModeloForEdit] = useState<ModeloItem | null>(null);
  const [selectedVarianteForEdit, setSelectedVarianteForEdit] = useState<any | null>(null);
  const [editVarColor, setEditVarColor] = useState('');
  const [editVarCapacidad, setEditVarCapacidad] = useState(256);
  const [editVarSim, setEditVarSim] = useState('SIM Físico');
  const [isUpdatingVariante, setIsUpdatingVariante] = useState(false);
  const [editVarianteError, setEditVarianteError] = useState<string | null>(null);

  // Modal para Confirmar Eliminación de Variante (Exclusivo ADMIN)
  const [modalDeleteVarianteOpen, setModalDeleteVarianteOpen] = useState(false);
  const [selectedModeloForDelete, setSelectedModeloForDelete] = useState<ModeloItem | null>(null);
  const [selectedVarianteForDelete, setSelectedVarianteForDelete] = useState<any | null>(null);
  const [isDeletingVariante, setIsDeletingVariante] = useState(false);
  const [deleteVarianteError, setDeleteVarianteError] = useState<string | null>(null);

  // Modales de Accesorio (Crear / Editar / Eliminar)
  const [modalAccesorioOpen, setModalAccesorioOpen] = useState(false);
  const [modalAccesorioMode, setModalAccesorioMode] = useState<'create' | 'edit'>('create');
  const [selectedAccesorioId, setSelectedAccesorioId] = useState<number | null>(null);
  const [accesorioCategoriaId, setAccesorioCategoriaId] = useState<number>(0);
  const [accesorioNombre, setAccesorioNombre] = useState('');
  const [accesorioDescripcion, setAccesorioDescripcion] = useState('');
  const [isSavingAccesorio, setIsSavingAccesorio] = useState(false);
  const [accesorioError, setAccesorioError] = useState<string | null>(null);

  const [dialogDeleteAccesorioOpen, setDialogDeleteAccesorioOpen] = useState(false);
  const [accesorioToDelete, setAccesorioToDelete] = useState<AccesorioItem | null>(null);
  const [isDeletingAccesorio, setIsDeletingAccesorio] = useState(false);
  const [deleteAccesorioError, setDeleteAccesorioError] = useState<string | null>(null);

  // Carga de Datos
  const fetchModelos = async () => {
    setIsLoadingModelos(true);
    try {
      const data = await api.modelos.getAll();
      setModelos(data);
    } catch (err) {
      console.error('Error al cargar modelos:', err);
    } finally {
      setIsLoadingModelos(false);
    }
  };

  const fetchAccesorios = async () => {
    setIsLoadingAccesorios(true);
    try {
      const [accs, cats] = await Promise.all([
        api.accesorios.getAll(),
        api.accesorios.getCategorias(),
      ]);
      setAccesorios(accs);
      setCategorias(cats);
    } catch (err) {
      console.error('Error al cargar catálogo de accesorios:', err);
    } finally {
      setIsLoadingAccesorios(false);
    }
  };

  useEffect(() => {
    fetchModelos();
    fetchAccesorios();
  }, []);

  // Handlers para Modelos
  const handleOpenNuevoModelo = () => {
    setNuevoNombreModelo('');
    setNuevoTipo('IPHONE');
    setPrimeraVarColor('');
    setPrimeraVarCapacidad(256);
    setPrimeraVarSim('SIM Físico');
    setCreacionError(null);
    setModalNuevoModeloOpen(true);
  };

  const handleCreateModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreModelo.trim() || !primeraVarColor.trim()) return;

    setIsCreatingModelo(true);
    setCreacionError(null);

    try {
      await api.modelos.create({
        nombreModelo: nuevoNombreModelo.trim(),
        marca: 'Apple',
        tipo: nuevoTipo,
        variantes: [
          {
            color: primeraVarColor.trim(),
            capacidadGb: Number(primeraVarCapacidad),
            tipoSim: primeraVarSim,
          },
        ],
      });

      setModalNuevoModeloOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setCreacionError(err.message || 'Error al crear el modelo.');
    } finally {
      setIsCreatingModelo(false);
    }
  };

  const handleOpenAddVariante = (modelo: ModeloItem) => {
    setSelectedModeloForAdd(modelo);
    setAddVarColor('');
    if (modelo.tipo === 'AIRPODS') {
      setAddVarCapacidad(0);
      setAddVarSim('No Aplica');
    } else if (modelo.tipo === 'WATCH') {
      setAddVarCapacidad(0);
      setAddVarSim('GPS Only');
    } else if (modelo.tipo === 'MAC') {
      setAddVarCapacidad(512);
      setAddVarSim('No Aplica');
    } else {
      setAddVarCapacidad(256);
      setAddVarSim('SIM Físico');
    }
    setAddVarianteError(null);
    setModalAddVarianteOpen(true);
  };

  const handleConfirmAddVariante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModeloForAdd || !addVarColor.trim()) return;

    setIsAddingVariante(true);
    setAddVarianteError(null);

    try {
      await api.modelos.addVariante(selectedModeloForAdd.id, {
        color: addVarColor.trim(),
        capacidadGb: Number(addVarCapacidad),
        tipoSim: addVarSim,
      });
      setModalAddVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setAddVarianteError(err.message || 'Error al agregar la variante.');
    } finally {
      setIsAddingVariante(false);
    }
  };

  const handleOpenEditVariante = (modelo: ModeloItem, variante: any) => {
    setSelectedModeloForEdit(modelo);
    setSelectedVarianteForEdit(variante);
    setEditVarColor(variante.color);
    setEditVarCapacidad(variante.capacidadGb);
    setEditVarSim(variante.tipoSim || 'SIM Físico');
    setEditVarianteError(null);
    setModalEditVarianteOpen(true);
  };

  const handleConfirmEditVariante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModeloForEdit || !selectedVarianteForEdit || !editVarColor.trim()) return;

    setIsUpdatingVariante(true);
    setEditVarianteError(null);

    try {
      await api.modelos.updateVariante(selectedVarianteForEdit.id, {
        color: editVarColor.trim(),
        capacidadGb: Number(editVarCapacidad),
        tipoSim: editVarSim,
      });
      setModalEditVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setEditVarianteError(err.message || 'Error al actualizar la variante.');
    } finally {
      setIsUpdatingVariante(false);
    }
  };

  const handleOpenDeleteVariante = (modelo: ModeloItem, variante: any) => {
    setSelectedModeloForDelete(modelo);
    setSelectedVarianteForDelete(variante);
    setDeleteVarianteError(null);
    setModalDeleteVarianteOpen(true);
  };

  const handleConfirmDeleteVariante = async () => {
    if (!selectedModeloForDelete || !selectedVarianteForDelete) return;

    setIsDeletingVariante(true);
    setDeleteVarianteError(null);

    try {
      await api.modelos.deleteVariante(selectedVarianteForDelete.id);
      setModalDeleteVarianteOpen(false);
      await fetchModelos();
    } catch (err: any) {
      setDeleteVarianteError(err.message || 'No se pudo eliminar la variante.');
    } finally {
      setIsDeletingVariante(false);
    }
  };

  // Handlers para Accesorios
  const handleOpenNuevoAccesorio = () => {
    setModalAccesorioMode('create');
    setSelectedAccesorioId(null);
    setAccesorioCategoriaId(categorias.length > 0 ? categorias[0].id : 0);
    setAccesorioNombre('');
    setAccesorioDescripcion('');
    setAccesorioError(null);
    setModalAccesorioOpen(true);
  };

  const handleOpenEditAccesorio = (acc: AccesorioItem) => {
    setModalAccesorioMode('edit');
    setSelectedAccesorioId(acc.id);
    setAccesorioCategoriaId(acc.categoriaId);
    setAccesorioNombre(acc.nombre);
    setAccesorioDescripcion(acc.descripcion || '');
    setAccesorioError(null);
    setModalAccesorioOpen(true);
  };

  const handleSaveAccesorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accesorioNombre.trim() || !accesorioCategoriaId) return;

    setIsSavingAccesorio(true);
    setAccesorioError(null);

    try {
      if (modalAccesorioMode === 'create') {
        await api.accesorios.create({
          categoriaId: Number(accesorioCategoriaId),
          nombre: accesorioNombre.trim(),
          descripcion: accesorioDescripcion.trim() || undefined,
        });
      } else if (selectedAccesorioId) {
        await api.accesorios.update(selectedAccesorioId, {
          categoriaId: Number(accesorioCategoriaId),
          nombre: accesorioNombre.trim(),
          descripcion: accesorioDescripcion.trim() || undefined,
        });
      }

      setModalAccesorioOpen(false);
      await fetchAccesorios();
    } catch (err: any) {
      setAccesorioError(err.message || 'Error al guardar el accesorio.');
    } finally {
      setIsSavingAccesorio(false);
    }
  };

  const handleOpenDeleteAccesorio = (acc: AccesorioItem) => {
    setAccesorioToDelete(acc);
    setDeleteAccesorioError(null);
    setDialogDeleteAccesorioOpen(true);
  };

  const handleConfirmDeleteAccesorio = async () => {
    if (!accesorioToDelete) return;

    setIsDeletingAccesorio(true);
    setDeleteAccesorioError(null);

    try {
      await api.accesorios.delete(accesorioToDelete.id);
      setDialogDeleteAccesorioOpen(false);
      await fetchAccesorios();
    } catch (err: any) {
      setDeleteAccesorioError(err.message || 'Error al eliminar el accesorio.');
    } finally {
      setIsDeletingAccesorio(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      <CatalogoHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelosTotal={modelos.length}
        accesoriosTotal={accesorios.length}
        isAdmin={isAdmin}
        onNuevoModelo={handleOpenNuevoModelo}
        onNuevoAccesorio={handleOpenNuevoAccesorio}
      />

      {activeTab === 'modelos' && (
        <CatalogoModelosTab
          modelos={modelos}
          isLoadingModelos={isLoadingModelos}
          isAdmin={isAdmin}
          onOpenNuevoModelo={handleOpenNuevoModelo}
          onOpenAddVariante={handleOpenAddVariante}
          onOpenEditVariante={handleOpenEditVariante}
          onOpenDeleteVariante={handleOpenDeleteVariante}
        />
      )}

      {activeTab === 'accesorios' && (
        <CatalogoAccesoriosTab
          accesorios={accesorios}
          categorias={categorias}
          isLoading={isLoadingAccesorios}
          isAdmin={isAdmin}
          onOpenNuevoAccesorio={handleOpenNuevoAccesorio}
          onOpenEditAccesorio={handleOpenEditAccesorio}
          onOpenDeleteAccesorio={handleOpenDeleteAccesorio}
        />
      )}

      {/* Modales de Modelos */}
      <ModalNuevoModelo
        isOpen={modalNuevoModeloOpen}
        onClose={() => setModalNuevoModeloOpen(false)}
        nuevoNombreModelo={nuevoNombreModelo}
        setNuevoNombreModelo={setNuevoNombreModelo}
        nuevoTipo={nuevoTipo}
        setNuevoTipo={setNuevoTipo}
        primeraVarColor={primeraVarColor}
        setPrimeraVarColor={setPrimeraVarColor}
        primeraVarCapacidad={primeraVarCapacidad}
        setPrimeraVarCapacidad={setPrimeraVarCapacidad}
        primeraVarSim={primeraVarSim}
        setPrimeraVarSim={setPrimeraVarSim}
        isCreatingModelo={isCreatingModelo}
        creacionError={creacionError}
        onSubmit={handleCreateModelo}
      />

      <ModalVarianteForm
        mode="add"
        isOpen={modalAddVarianteOpen}
        onClose={() => setModalAddVarianteOpen(false)}
        modelo={selectedModeloForAdd}
        color={addVarColor}
        setColor={setAddVarColor}
        capacidad={addVarCapacidad}
        setCapacidad={setAddVarCapacidad}
        tipoSim={addVarSim}
        setTipoSim={setAddVarSim}
        isLoading={isAddingVariante}
        error={addVarianteError}
        onSubmit={handleConfirmAddVariante}
      />

      <ModalVarianteForm
        mode="edit"
        isOpen={modalEditVarianteOpen}
        onClose={() => setModalEditVarianteOpen(false)}
        modelo={selectedModeloForEdit}
        color={editVarColor}
        setColor={setEditVarColor}
        capacidad={editVarCapacidad}
        setCapacidad={setEditVarCapacidad}
        tipoSim={editVarSim}
        setTipoSim={setEditVarSim}
        isLoading={isUpdatingVariante}
        error={editVarianteError}
        onSubmit={handleConfirmEditVariante}
      />

      <ModalVarianteDelete
        isOpen={modalDeleteVarianteOpen}
        onClose={() => setModalDeleteVarianteOpen(false)}
        modelo={selectedModeloForDelete}
        variante={selectedVarianteForDelete}
        isLoading={isDeletingVariante}
        error={deleteVarianteError}
        onConfirm={handleConfirmDeleteVariante}
      />

      {/* Modales de Accesorios */}
      <ModalAccesorioForm
        mode={modalAccesorioMode}
        isOpen={modalAccesorioOpen}
        onClose={() => setModalAccesorioOpen(false)}
        categorias={categorias}
        categoriaId={accesorioCategoriaId}
        setCategoriaId={setAccesorioCategoriaId}
        nombre={accesorioNombre}
        setNombre={setAccesorioNombre}
        descripcion={accesorioDescripcion}
        setDescripcion={setAccesorioDescripcion}
        isLoading={isSavingAccesorio}
        error={accesorioError}
        onSubmit={handleSaveAccesorio}
      />

      <DialogDeleteAccesorio
        isOpen={dialogDeleteAccesorioOpen}
        onClose={() => setDialogDeleteAccesorioOpen(false)}
        accesorio={accesorioToDelete}
        isLoading={isDeletingAccesorio}
        error={deleteAccesorioError}
        onConfirm={handleConfirmDeleteAccesorio}
      />
    </div>
  );
}
