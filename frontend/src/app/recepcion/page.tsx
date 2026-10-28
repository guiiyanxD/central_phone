'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Pencil, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { TelefonoRow, AccesorioRow } from '@/features/recepcion/types';
import { RecepcionHeader } from '@/features/recepcion/components/recepcion-header';
import { RecepcionTelefonosTable } from '@/features/recepcion/components/recepcion-telefonos-table';
import { RecepcionAccesoriosTable } from '@/features/recepcion/components/recepcion-accesorios-table';
import { RecepcionResumenPanel } from '@/features/recepcion/components/recepcion-resumen-panel';
import { ModalCrearVarianteInline } from '@/features/recepcion/components/modal-crear-variante-inline';
import { ModalCrearAccesorioInline } from '@/features/recepcion/components/modal-crear-accesorio-inline';
import { ModalConfirmacionIngreso } from '@/features/recepcion/components/modal-confirmacion-ingreso';
import { RecepcionHistorialTable } from '@/features/recepcion/components/recepcion-historial-table';
import { ModalAuditoriaRecepcion } from '@/features/recepcion/components/modal-auditoria-recepcion';
import { ModalConfirmarGuardado } from '@/features/recepcion/components/modal-confirmar-guardado';
import { ModalAnularRecepcion } from '@/features/recepcion/components/modal-anular-recepcion';
import { CategoriaAccesorioItem, TipoDispositivoItem } from '@/features/catalogo/types';

export default function RecepcionMercaderiaPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historial'>('nuevo');

  // Estados de datos maestros
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [accesoriosCatalogo, setAccesoriosCatalogo] = useState<any[]>([]);
  const [categoriasAccesorios, setCategoriasAccesorios] = useState<CategoriaAccesorioItem[]>([]);
  const [tiposDispositivo, setTiposDispositivo] = useState<TipoDispositivoItem[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // Estados de Historial de Recepciones (Notas de Ingreso)
  const [recepcionesList, setRecepcionesList] = useState<any[]>([]);
  const [recepcionesMeta, setRecepcionesMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoadingRecepciones, setIsLoadingRecepciones] = useState(false);
  const [filtroRecSucursalId, setFiltroRecSucursalId] = useState<string>('TODAS');
  const [filtroRecProveedorId, setFiltroRecProveedorId] = useState<string>('TODOS');
  const [filtroRecFechaDesde, setFiltroRecFechaDesde] = useState<string>('');
  const [filtroRecFechaHasta, setFiltroRecFechaHasta] = useState<string>('');
  const [filtroRecSearch, setFiltroRecSearch] = useState<string>('');
  const [searchRecDebounce, setSearchRecDebounce] = useState<string>('');

  // Modales de Auditoría
  const [modalRecDetalleOpen, setModalRecDetalleOpen] = useState(false);
  const [recepcionDetalleData, setRecepcionDetalleData] = useState<any | null>(null);
  const [isLoadingRecDetalle, setIsLoadingRecDetalle] = useState(false);

  // Estados para Edición y Anulación de Notas de Ingreso
  const [editingNota, setEditingNota] = useState<any | null>(null);
  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [notaParaAnular, setNotaParaAnular] = useState<any | null>(null);
  const [isAnulando, setIsAnulando] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Formulario de Nota de Ingreso
  const [proveedorId, setProveedorId] = useState<number>(1);
  const [sucursalId, setSucursalId] = useState<number>(user?.sucursal?.id || 1);
  const [numeroComprobante, setNumeroComprobante] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Filas dinámicas
  const [telefonos, setTelefonos] = useState<TelefonoRow[]>([
    {
      id: 'tel-1',
      varianteId: null,
      imei1: '',
      imei2: '',
      numeroSerie: '',
      condicion: 'NUEVO',
      costoBs: 0,
      costoUsd: 0,
      precioVentaSugeridoBs: 0,
    },
  ]);

  const [accesorios, setAccesorios] = useState<AccesorioRow[]>([
    {
      id: 'acc-1',
      accesorioId: null,
      nombreDiferenciador: '',
      cantidad: 0,
      costoUnitarioBs: 0,
      precioVentaBs: 0,
    },
  ]);

  // Modal para creación de variante in-line
  const [modalVarianteOpen, setModalVarianteOpen] = useState(false);
  const [targetTelefonoId, setTargetTelefonoId] = useState<string | null>(null);
  const [nuevaVarModeloId, setNuevaVarModeloId] = useState<number>(1);
  const [nuevaVarColor, setNuevaVarColor] = useState<string>('');
  const [nuevaVarCapacidad, setNuevaVarCapacidad] = useState<number>(256);
  const [nuevaVarSim, setNuevaVarSim] = useState<string>('SIM Físico');

  // Modal para creación de accesorio in-line ("al vuelo")
  const [modalAccesorioOpen, setModalAccesorioOpen] = useState(false);
  const [targetAccesorioId, setTargetAccesorioId] = useState<string | null>(null);
  const [nuevoAccCategoriaId, setNuevoAccCategoriaId] = useState<number>(1);
  const [nuevoAccNombre, setNuevoAccNombre] = useState<string>('');
  const [nuevoAccDescripcion, setNuevoAccDescripcion] = useState<string>('');

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notaCreada, setNotaCreada] = useState<any | null>(null);
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchMasterData() {
      setIsLoadingMaster(true);
      try {
        const [provData, sucData, modData, accData, catData, tiposData] = await Promise.all([
          api.proveedores.getAll(),
          api.sucursales.getAll(),
          api.modelos.getAll(),
          api.accesorios.getAll(),
          api.accesorios.getCategorias(),
          api.modelos.getTipos(),
        ]);
        setProveedores(provData);
        setSucursales(sucData);
        setModelos(modData);
        setAccesoriosCatalogo(accData);
        setCategoriasAccesorios(catData);
        setTiposDispositivo(tiposData);

        if (provData.length > 0) setProveedorId(provData[0].id);
        if (sucData.length > 0) setSucursalId(user?.sucursal?.id || sucData[0].id);
        if (catData.length > 0) setNuevoAccCategoriaId(catData[0].id);
      } catch {
        setErrorMessage('No se pudieron cargar los datos maestros de recepción.');
      } finally {
        setIsLoadingMaster(false);
      }
    }
    fetchMasterData();
  }, [user]);

  // Debounce para búsqueda en historial
  useEffect(() => {
    const handler = setTimeout(() => setSearchRecDebounce(filtroRecSearch), 400);
    return () => clearTimeout(handler);
  }, [filtroRecSearch]);

  const fetchRecepciones = async (page = 1, customLimit?: number) => {
    if (!isAdmin) return;
    setIsLoadingRecepciones(true);
    try {
      const limit = customLimit || recepcionesMeta.limit;
      const res = await api.recepcion.getNotasIngreso({
        page,
        limit,
        sucursalId: filtroRecSucursalId !== 'TODAS' ? Number(filtroRecSucursalId) : undefined,
        proveedorId: filtroRecProveedorId !== 'TODOS' ? Number(filtroRecProveedorId) : undefined,
        fechaDesde: filtroRecFechaDesde || undefined,
        fechaHasta: filtroRecFechaHasta || undefined,
        search: searchRecDebounce.trim() || undefined,
      });
      setRecepcionesList(res.data || []);
      setRecepcionesMeta({
        total: res.meta?.total || 0,
        page: res.meta?.page || 1,
        limit: res.meta?.limit || limit,
        totalPages: res.meta?.totalPages || 1,
        hasNextPage: res.meta?.hasNextPage || false,
        hasPrevPage: res.meta?.hasPrevPage || false,
      });
    } catch {
      // Silencioso
    } finally {
      setIsLoadingRecepciones(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'historial') {
      fetchRecepciones(1);
    }
  }, [
    activeTab,
    isAdmin,
    filtroRecSucursalId,
    filtroRecProveedorId,
    filtroRecFechaDesde,
    filtroRecFechaHasta,
    searchRecDebounce,
  ]);

  const handleOpenRecDetalle = async (recepcionId: number) => {
    setIsLoadingRecDetalle(true);
    setModalRecDetalleOpen(true);
    try {
      const data = await api.recepcion.getNotaIngresoById(recepcionId);
      setRecepcionDetalleData(data);
    } catch {
      // Silencioso
    } finally {
      setIsLoadingRecDetalle(false);
    }
  };

  const handleResetFiltrosRecepcion = () => {
    setFiltroRecSearch('');
    setFiltroRecSucursalId('TODAS');
    setFiltroRecProveedorId('TODOS');
    setFiltroRecFechaDesde('');
    setFiltroRecFechaHasta('');
  };

  const handleStartEdit = async (recepcionId: number) => {
    setErrorMessage(null);
    setSuccessFeedback(null);
    try {
      const nota = await api.recepcion.getNotaIngresoById(recepcionId);
      if (nota.estado === 'ANULADA') {
        setErrorMessage(`La Nota de Ingreso #ING-${recepcionId} está anulada y no puede ser editada.`);
        return;
      }

      setEditingNota(nota);
      setProveedorId(nota.proveedorId);
      setSucursalId(nota.sucursalId);
      setNumeroComprobante(nota.numeroComprobante || '');
      setObservaciones(nota.observaciones || '');

      // Cargar dispositivos existentes
      if (nota.dispositivos && nota.dispositivos.length > 0) {
        const mappedTelefonos: TelefonoRow[] = nota.dispositivos.map((d: any) => {
          const capGb = d.variante?.capacidadGb || 0;
          const capLabel =
            capGb > 0
              ? capGb >= 1024
                ? `${capGb / 1024}TB`
                : `${capGb}GB`
              : 'Sin almacenamiento';
          const isSold =
            d.estadoInventario === 'VENDIDO' ||
            (d.detalleVentas && d.detalleVentas.length > 0);

          return {
            id: `tel-edit-${d.id}`,
            dbId: d.id,
            yaVendido: isSold,
            varianteId: d.varianteId,
            modeloNombreDisplay: d.variante?.modelo?.nombreModelo || 'Dispositivo',
            modeloTipo: d.variante?.modelo?.tipo || 'IPHONE',
            varianteTipoSim: d.variante?.tipoSim,
            varianteDisplay: `${d.variante?.color || ''} • ${capLabel} • ${d.variante?.tipoSim || ''}`,
            numeroSerie: d.numeroSerie || '',
            imei1: d.imei1 || '',
            imei2: d.imei2 || '',
            condicion: d.condicion || 'NUEVO',
            costoBs: Number(d.costoBs || 0),
            costoUsd: Number(d.costoUsd || 0),
            precioVentaSugeridoBs: Number(d.precioVentaSugeridoBs || 0),
          };
        });
        setTelefonos(mappedTelefonos);
      } else {
        setTelefonos([
          {
            id: `tel-${Date.now()}`,
            varianteId: null,
            imei1: '',
            imei2: '',
            numeroSerie: '',
            condicion: 'NUEVO',
            costoBs: 0,
            costoUsd: 0,
            precioVentaSugeridoBs: 0,
          },
        ]);
      }

      // Cargar lotes de accesorios existentes
      if (nota.lotesAccesorio && nota.lotesAccesorio.length > 0) {
        const mappedAccesorios: AccesorioRow[] = nota.lotesAccesorio.map((l: any) => {
          const isSold =
            (l.detalleVentas && l.detalleVentas.length > 0) ||
            l.stockActual < l.cantidadInicial;

          return {
            id: `acc-edit-${l.id}`,
            dbId: l.id,
            yaVendido: isSold,
            accesorioId: l.accesorioId,
            accesorioDisplay: `${l.accesorio?.nombre || 'Accesorio'} (${l.accesorio?.categoria?.nombre || 'General'})`,
            nombreDiferenciador: l.nombreDiferenciador || '',
            cantidad: l.cantidadInicial || 0,
            costoUnitarioBs: Number(l.costoUnitarioBs || 0),
            precioVentaBs: Number(l.precioVentaBs || 0),
          };
        });
        setAccesorios(mappedAccesorios);
      } else {
        setAccesorios([
          {
            id: `acc-${Date.now()}`,
            accesorioId: null,
            nombreDiferenciador: '',
            cantidad: 0,
            costoUnitarioBs: 0,
            precioVentaBs: 0,
          },
        ]);
      }

      setActiveTab('nuevo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo cargar la nota de ingreso para edición.');
    }
  };

  const handleCancelEdit = () => {
    setEditingNota(null);
    handleResetForm();
  };

  const handleOpenAnularModal = (rec: any) => {
    setNotaParaAnular(rec);
    setAnularModalOpen(true);
  };

  const handleConfirmarAnulacion = async (motivo: string) => {
    if (!notaParaAnular) return;
    setIsAnulando(true);
    setErrorMessage(null);
    try {
      await api.recepcion.anularNotaIngreso(notaParaAnular.id, { motivo });
      setAnularModalOpen(false);
      setNotaParaAnular(null);
      setSuccessFeedback(`Nota de Ingreso #${notaParaAnular.id} anulada correctamente.`);
      fetchRecepciones(recepcionesMeta.page);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al anular la nota de ingreso.');
    } finally {
      setIsAnulando(false);
    }
  };

  // Manejadores para Teléfonos
  const handleAddSiguienteEquipo = (sourceId?: string) => {
    // Si la fila del tope ya está vacía (sin número de serie), no acumular filas en blanco: solo enfocarla
    const primeraFila = telefonos[0];
    if (primeraFila && !primeraFila.numeroSerie.trim()) {
      const existingInput = document.getElementById(`tel-serie-${primeraFila.id}`) as HTMLInputElement | null;
      if (existingInput) {
        existingInput.focus();
        existingInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    const source = (sourceId ? telefonos.find((t) => t.id === sourceId) : null) || primeraFila;
    const newId = `tel-${Date.now()}`;
    const nuevoEquipo: TelefonoRow = {
      id: newId,
      varianteId: source?.varianteId || null,
      modeloNombreDisplay: source?.modeloNombreDisplay,
      modeloTipo: source?.modeloTipo,
      varianteDisplay: source?.varianteDisplay,
      varianteTipoSim: source?.varianteTipoSim,
      nuevaVariante: source?.nuevaVariante,
      condicion: source?.condicion || 'NUEVO',
      costoBs: source?.costoBs || 0,
      costoUsd: source?.costoUsd || 0,
      precioVentaSugeridoBs: source?.precioVentaSugeridoBs || 0,
      numeroSerie: '',
      imei1: '',
      imei2: '',
    };
    setTelefonos((prev) => [nuevoEquipo, ...prev]);

    // Enfocar automáticamente el nuevo número de serie tras el ciclo de renderizado
    setTimeout(() => {
      const nextInput = document.getElementById(`tel-serie-${newId}`) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  };

  const handleAddTelefono = () => {
    handleAddSiguienteEquipo();
  };

  const handleRemoveTelefono = (id: string) => {
    if (telefonos.length === 1) return;
    setTelefonos(telefonos.filter((t) => t.id !== id));
  };

  const handleUpdateTelefono = (id: string, field: keyof TelefonoRow, value: any) => {
    setTelefonos(
      telefonos.map((t) => {
        if (t.id === id) {
          const updated = { ...t, [field]: value };
          if (field === 'costoBs') {
            const numCosto = Number(value) || 0;
            const prevCalculado = Math.round((Number(t.costoBs) || 0) * 1.15);
            if (!t.precioVentaSugeridoBs || t.precioVentaSugeridoBs === prevCalculado) {
              updated.precioVentaSugeridoBs = Math.round(numCosto * 1.15);
            }
          }
          if (field === 'varianteId' && typeof value === 'number') {
            for (const m of modelos) {
              const v = m.variantes.find((x: any) => x.id === value);
              if (v) {
                updated.modeloNombreDisplay = m.nombreModelo || m.nombre;
                updated.modeloTipo = m.tipo || 'IPHONE';
                updated.varianteTipoSim = v.tipoSim;
                const capLabel =
                  v.capacidadGb > 0
                    ? v.capacidadGb >= 1024
                      ? `${v.capacidadGb / 1024}TB`
                      : `${v.capacidadGb}GB`
                    : 'Sin almacenamiento';
                updated.varianteDisplay = `${v.color} • ${capLabel} • ${v.tipoSim}`;
                updated.nuevaVariante = undefined;
                const simLower = (v.tipoSim || '').toLowerCase();
                const noImei =
                  m.tipo === 'MAC' ||
                  m.tipo === 'AIRPODS' ||
                  simLower.includes('no aplica') ||
                  simLower.includes('gps only') ||
                  simLower.includes('wifi') ||
                  (m.tipo === 'WATCH' && !simLower.includes('cellular'));
                if (noImei) {
                  updated.imei1 = '';
                  updated.imei2 = '';
                }
                break;
              }
            }
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleOpenInlineVarianteModal = (rowId: string) => {
    setTargetTelefonoId(rowId);
    if (modelos.length > 0) {
      setNuevaVarModeloId(modelos[0].id);
    }
    setNuevaVarColor('');
    setNuevaVarCapacidad(256);
    setNuevaVarSim('SIM Físico');
    setModalVarianteOpen(true);
  };

  const handleConfirmInlineVariante = () => {
    if (!targetTelefonoId || !nuevaVarColor.trim()) return;

    const modeloSeleccionado = modelos.find((m) => m.id === nuevaVarModeloId);
    const capDisplay =
      nuevaVarCapacidad >= 1024
        ? `${nuevaVarCapacidad / 1024}TB`
        : `${nuevaVarCapacidad}GB`;

    const simLower = (nuevaVarSim || '').toLowerCase();
    const noImei =
      modeloSeleccionado?.tipo === 'MAC' ||
      modeloSeleccionado?.tipo === 'AIRPODS' ||
      simLower.includes('no aplica') ||
      simLower.includes('gps only') ||
      simLower.includes('wifi') ||
      (modeloSeleccionado?.tipo === 'WATCH' && !simLower.includes('cellular'));

    setTelefonos(
      telefonos.map((t) => {
        if (t.id === targetTelefonoId) {
          return {
            ...t,
            varianteId: null,
            nuevaVariante: {
              modeloId: nuevaVarModeloId,
              color: nuevaVarColor.trim(),
              capacidadGb: Number(nuevaVarCapacidad),
              tipoSim: nuevaVarSim,
            },
            modeloNombreDisplay: modeloSeleccionado?.nombreModelo || modeloSeleccionado?.nombre || 'Modelo Personalizado',
            modeloTipo: modeloSeleccionado?.tipo || 'IPHONE',
            varianteTipoSim: nuevaVarSim,
            varianteDisplay: `[Nueva al Vuelo] ${nuevaVarColor.trim()} • ${Number(nuevaVarCapacidad) > 0 ? capDisplay : 'Sin alm.'} • ${nuevaVarSim}`,
            ...(noImei ? { imei1: '', imei2: '' } : {}),
          };
        }
        return t;
      })
    );

    setModalVarianteOpen(false);
  };

  const handleModeloCreadoInline = (nuevoModelo: any, primeraVariante: any) => {
    if (!targetTelefonoId) return;

    setModelos((prev) => [...prev, nuevoModelo]);

    const capDisplay =
      primeraVariante.capacidadGb >= 1024
        ? `${primeraVariante.capacidadGb / 1024}TB`
        : `${primeraVariante.capacidadGb}GB`;
    const capLabel = primeraVariante.capacidadGb > 0 ? capDisplay : 'Sin alm.';

    const simLower = (primeraVariante.tipoSim || '').toLowerCase();
    const noImei =
      nuevoModelo.tipo === 'MAC' ||
      nuevoModelo.tipo === 'AIRPODS' ||
      simLower.includes('no aplica') ||
      simLower.includes('gps only') ||
      simLower.includes('wifi') ||
      (nuevoModelo.tipo === 'WATCH' && !simLower.includes('cellular'));

    setTelefonos(
      telefonos.map((t) => {
        if (t.id === targetTelefonoId) {
          return {
            ...t,
            varianteId: primeraVariante.id,
            nuevaVariante: undefined,
            modeloNombreDisplay: nuevoModelo.nombreModelo || nuevoModelo.nombre,
            modeloTipo: nuevoModelo.tipo || 'IPHONE',
            varianteTipoSim: primeraVariante.tipoSim,
            varianteDisplay: `${primeraVariante.color} • ${capLabel} • ${primeraVariante.tipoSim}`,
            ...(noImei ? { imei1: '', imei2: '' } : {}),
          };
        }
        return t;
      })
    );
  };

  const handleTipoCreadoInline = (nuevoTipo: TipoDispositivoItem) => {
    setTiposDispositivo((prev) => [...prev, nuevoTipo]);
  };

  // Manejadores para Accesorios
  const handleAddAccesorio = () => {
    setAccesorios((prev) => [
      {
        id: `acc-${Date.now()}`,
        accesorioId: null,
        nombreDiferenciador: '',
        cantidad: 0,
        costoUnitarioBs: 0,
        precioVentaBs: 0,
      },
      ...prev,
    ]);
  };

  const handleRemoveAccesorio = (id: string) => {
    if (accesorios.length === 1) return;
    setAccesorios(accesorios.filter((a) => a.id !== id));
  };

  const handleUpdateAccesorio = (id: string, field: keyof AccesorioRow, value: any) => {
    setAccesorios(
      accesorios.map((a) => {
        if (a.id === id) {
          const updated = { ...a, [field]: value };
          if (field === 'accesorioId' && value) {
            updated.nuevoAccesorio = undefined;
            updated.accesorioDisplay = undefined;
          }
          return updated;
        }
        return a;
      })
    );
  };

  const handleOpenInlineAccesorioModal = (rowId: string) => {
    setTargetAccesorioId(rowId);
    if (categoriasAccesorios.length > 0) {
      setNuevoAccCategoriaId(categoriasAccesorios[0].id);
    }
    setNuevoAccNombre('');
    setNuevoAccDescripcion('');
    setModalAccesorioOpen(true);
  };

  const handleConfirmInlineAccesorio = () => {
    if (!targetAccesorioId || !nuevoAccNombre.trim() || !nuevoAccCategoriaId) return;

    const categoriaSeleccionada = categoriasAccesorios.find((c) => c.id === nuevoAccCategoriaId);
    const catNombre = categoriaSeleccionada?.nombre || 'General';

    setAccesorios(
      accesorios.map((a) => {
        if (a.id === targetAccesorioId) {
          return {
            ...a,
            accesorioId: null,
            nuevoAccesorio: {
              categoriaId: nuevoAccCategoriaId,
              nombre: nuevoAccNombre.trim(),
              descripcion: nuevoAccDescripcion.trim() || undefined,
            },
            accesorioDisplay: `[Nuevo al Vuelo] ${nuevoAccNombre.trim()} (${catNombre})`,
          };
        }
        return a;
      })
    );

    setModalAccesorioOpen(false);
  };

  // Cálculos Financieros y Totales en Vivo
  const totalCostoTelefonos = telefonos.reduce(
    (sum, t) => sum + (Number(t.costoBs) || 0),
    0
  );
  const totalCostoAccesorios = accesorios.reduce(
    (sum, a) => sum + (Number(a.cantidad) || 0) * (Number(a.costoUnitarioBs) || 0),
    0
  );
  const totalCostoNotaBs = totalCostoTelefonos + totalCostoAccesorios;
  const totalCostoUsdNota = telefonos.reduce(
    (sum, t) => sum + (Number(t.costoUsd) || 0),
    0
  );
  const totalUnidadesTelefonos = telefonos.filter(
    (t) =>
      t.numeroSerie.trim().length > 0 ||
      t.imei1.trim().length > 0 ||
      t.varianteId !== null ||
      t.nuevaVariante !== undefined
  ).length;
  const totalUnidadesAccesorios = accesorios.reduce(
    (sum, a) => sum + (Number(a.cantidad) || 0),
    0
  );

  const proveedorSeleccionado = proveedores.find((p) => p.id === Number(proveedorId));
  const proveedorNombreDisplay = proveedorSeleccionado
    ? (proveedorSeleccionado.empresa
        ? `${proveedorSeleccionado.empresa} (${proveedorSeleccionado.nombre}${proveedorSeleccionado.apellido ? ` ${proveedorSeleccionado.apellido}` : ''})`
        : `${proveedorSeleccionado.nombre}${proveedorSeleccionado.apellido ? ` ${proveedorSeleccionado.apellido}` : ''}`)
    : 'Proveedor Mayorista';

  const sucursalSeleccionada = sucursales.find((s) => s.id === Number(sucursalId));
  const sucursalNombreDisplay = sucursalSeleccionada
    ? `${sucursalSeleccionada.nombre} (${sucursalSeleccionada.ciudad})`
    : 'Sucursal Destino';

  // Validación y Apertura de Confirmación Previa
  const handleSubmitNota = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Filtrar filas de teléfonos activas (con algún dato ingresado)
    const telefonosActivos = telefonos.filter(
      (t) =>
        t.varianteId !== null ||
        t.nuevaVariante !== undefined ||
        t.numeroSerie.trim().length > 0 ||
        t.imei1.trim().length > 0 ||
        Number(t.costoBs) > 0 ||
        Number(t.costoUsd) > 0
    );

    // 2. Filtrar filas de accesorios activas (con algún dato ingresado)
    const accesoriosActivos = accesorios.filter(
      (a) =>
        a.accesorioId !== null ||
        a.nuevoAccesorio !== undefined ||
        a.nombreDiferenciador.trim().length > 0 ||
        Number(a.cantidad) > 0 ||
        Number(a.costoUnitarioBs) > 0
    );

    if (telefonosActivos.length === 0 && accesoriosActivos.length === 0) {
      setErrorMessage(
        'Debes ingresar al menos un equipo serializado o un lote de accesorios para registrar la nota.'
      );
      return;
    }

    // 3. Validar filas de teléfonos activas
    for (const t of telefonosActivos) {
      if (!t.varianteId && !t.nuevaVariante) {
        setErrorMessage(
          `El equipo con serie '${t.numeroSerie || t.imei1 || 'sin serie'}' no tiene un modelo/variante seleccionado.`
        );
        return;
      }
      if (!t.numeroSerie.trim()) {
        setErrorMessage(`Todos los equipos activos deben tener un Número de Serie obligatorio.`);
        return;
      }
      const noImei =
        t.modeloTipo === 'MAC' ||
        t.modeloTipo === 'AIRPODS' ||
        (t.varianteTipoSim &&
          (t.varianteTipoSim.toLowerCase().includes('no aplica') ||
            t.varianteTipoSim.toLowerCase().includes('gps only') ||
            t.varianteTipoSim.toLowerCase().includes('wifi'))) ||
        (t.modeloTipo === 'WATCH' && !t.varianteTipoSim?.toLowerCase().includes('cellular'));

      const esIphone =
        t.modeloTipo === 'IPHONE' ||
        (!t.modeloTipo && t.modeloNombreDisplay?.toLowerCase().includes('iphone'));
      if (esIphone && !noImei && !t.imei1.trim()) {
        setErrorMessage(`El equipo '${t.modeloNombreDisplay || 'iPhone'}' requiere un IMEI 1 obligatorio.`);
        return;
      }
    }

    // 4. Validar filas de accesorios activas
    for (const a of accesoriosActivos) {
      if (!a.accesorioId && !a.nuevoAccesorio) {
        setErrorMessage(
          `El lote de accesorio '${a.nombreDiferenciador || 'sin nombre'}' requiere seleccionar un accesorio base del catálogo o crearlo al vuelo.`
        );
        return;
      }
      if (!a.nombreDiferenciador.trim()) {
        setErrorMessage(
          `El lote de accesorio '${a.accesorioDisplay || 'accesorio'}' debe tener un Nombre Diferenciador (ej: Silicona, MagSafe, etc.).`
        );
        return;
      }
      if (Number(a.cantidad) <= 0) {
        setErrorMessage(
          `El lote de accesorio '${a.nombreDiferenciador}' debe tener una cantidad mayor a 0.`
        );
        return;
      }
    }

    // 5. Validar duplicados de series e IMEIs
    const imeis = telefonosActivos.map((t) => t.imei1.trim()).filter((im) => im.length > 0);
    const series = telefonosActivos.map((t) => t.numeroSerie.trim()).filter((sr) => sr.length > 0);
    if (new Set(imeis).size !== imeis.length) {
      setErrorMessage('Hay IMEIs duplicados dentro de la lista de equipos ingresados.');
      return;
    }
    if (new Set(series).size !== series.length) {
      setErrorMessage('Hay Números de Serie duplicados dentro de la lista de equipos.');
      return;
    }

    // Si todo es válido: abrir modal de confirmación
    setErrorMessage(null);
    setModalConfirmarOpen(true);
  };

  // Confirmación Definitiva y Envío a la Base de Datos
  const handleConfirmarGuardado = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const telefonosValidos = telefonos.filter(
      (t) =>
        t.varianteId !== null ||
        t.nuevaVariante !== undefined ||
        t.numeroSerie.trim().length > 0 ||
        t.imei1.trim().length > 0
    );

    const accesoriosValidos = accesorios.filter(
      (a) =>
        (a.accesorioId !== null || a.nuevoAccesorio !== undefined) &&
        Number(a.cantidad) > 0 &&
        a.nombreDiferenciador.trim().length > 0
    );

    try {
      const payload = {
        proveedorId: Number(proveedorId),
        sucursalId: Number(sucursalId),
        numeroComprobante: numeroComprobante.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        dispositivos: telefonosValidos.map((t) => ({
          id: t.dbId,
          varianteId: t.varianteId ? Number(t.varianteId) : undefined,
          nuevaVariante: t.nuevaVariante,
          numeroSerie: t.numeroSerie.trim(),
          imei1: t.imei1.trim() || undefined,
          imei2: t.imei2.trim() || undefined,
          condicion: t.condicion,
          costoBs: Number(t.costoBs) || 0,
          costoUsd: Number(t.costoUsd) || 0,
          precioVentaSugeridoBs: Number(t.precioVentaSugeridoBs) || 0,
        })),
        accesorios: accesoriosValidos.map((a) => ({
          id: a.dbId,
          accesorioId: a.accesorioId ? Number(a.accesorioId) : undefined,
          nuevoAccesorio: a.nuevoAccesorio,
          nombreDiferenciador: a.nombreDiferenciador.trim(),
          cantidad: Number(a.cantidad),
          costoUnitarioBs: Number(a.costoUnitarioBs),
          precioVentaBs: Number(a.precioVentaBs),
        })),
      };

      if (editingNota) {
        const res = await api.recepcion.updateNotaIngreso(editingNota.id, payload);
        setModalConfirmarOpen(false);
        setEditingNota(null);
        setNotaCreada(res);
        if (isAdmin) fetchRecepciones(1);
      } else {
        const res = await api.recepcion.createNotaIngreso(payload);
        setModalConfirmarOpen(false);
        setNotaCreada(res);
        if (isAdmin) fetchRecepciones(1);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la nota de ingreso.');
      setModalConfirmarOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setEditingNota(null);
    setNotaCreada(null);
    setNumeroComprobante('');
    setObservaciones('');
    setTelefonos([
      {
        id: `tel-${Date.now()}`,
        varianteId: null,
        imei1: '',
        imei2: '',
        numeroSerie: '',
        condicion: 'NUEVO',
        costoBs: 0,
        costoUsd: 0,
        precioVentaSugeridoBs: 0,
      },
    ]);
    setAccesorios([
      {
        id: `acc-${Date.now()}`,
        accesorioId: null,
        nombreDiferenciador: '',
        cantidad: 0,
        costoUnitarioBs: 0,
        precioVentaBs: 0,
      },
    ]);
  };

  if (isLoadingMaster) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (notaCreada) {
    return (
      <ModalConfirmacionIngreso
        notaCreada={notaCreada}
        onReset={handleResetForm}
        onGoToHistorial={() => {
          handleResetForm();
          setActiveTab('historial');
        }}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32 animate-in fade-in duration-300">
      <RecepcionHeader
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        proveedores={proveedores}
        sucursales={sucursales}
        proveedorId={proveedorId}
        setProveedorId={setProveedorId}
        sucursalId={sucursalId}
        setSucursalId={setSucursalId}
        numeroComprobante={numeroComprobante}
        setNumeroComprobante={setNumeroComprobante}
        observaciones={observaciones}
        setObservaciones={setObservaciones}
      />

      {/* TAB 1: FORMULARIO DE NUEVA RECEPCIÓN */}
      {activeTab === 'nuevo' && (
        <>
          {successFeedback && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-start gap-3 animate-in fade-in duration-150">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Operación Exitosa:</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successFeedback}</p>
              </div>
            </div>
          )}

          {editingNota && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-200 text-amber-900">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-amber-950">
                    Modo Edición: Nota de Ingreso #ING-{editingNota.id}
                  </p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Modificando cabecera e ítems no vendidos. Los equipos ya vendidos permanecen bloqueados para preservar la integridad financiera.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100 text-xs shrink-0 self-start sm:self-auto shadow-xs"
              >
                Cancelar Edición
              </Button>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm text-slate-900 flex items-start gap-3 animate-in fade-in duration-150">
              <ShieldAlert className="h-5 w-5 text-slate-800 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Error al registrar la recepción:</p>
                <p className="text-xs text-slate-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmitNota}
            onKeyDown={(e) => {
              // Prevenir que presionar Enter dentro de inputs de texto/selects envíe el formulario por error
              if (e.key === 'Enter') {
                const target = e.target as HTMLElement;
                const isInputOrSelect =
                  target.tagName === 'INPUT' || target.tagName === 'SELECT';
                if (isInputOrSelect && (target as HTMLInputElement).type !== 'submit') {
                  e.preventDefault();
                }
              }
            }}
            className="space-y-8"
          >
            <RecepcionTelefonosTable
              telefonos={telefonos}
              modelos={modelos}
              onAddTelefono={handleAddTelefono}
              onAddSiguienteEquipo={handleAddSiguienteEquipo}
              onRemoveTelefono={handleRemoveTelefono}
              onUpdateTelefono={handleUpdateTelefono}
              onOpenInlineVarianteModal={handleOpenInlineVarianteModal}
            />

            <RecepcionAccesoriosTable
              accesorios={accesorios}
              accesoriosCatalogo={accesoriosCatalogo}
              onAddAccesorio={handleAddAccesorio}
              onRemoveAccesorio={handleRemoveAccesorio}
              onUpdateAccesorio={handleUpdateAccesorio}
              onOpenInlineAccesorioModal={handleOpenInlineAccesorioModal}
            />

            <RecepcionResumenPanel
              totalUnidadesTelefonos={totalUnidadesTelefonos}
              totalUnidadesAccesorios={totalUnidadesAccesorios}
              totalCostoNotaBs={totalCostoNotaBs}
              isSubmitting={isSubmitting}
              isEditing={!!editingNota}
            />
          </form>

          <ModalCrearVarianteInline
            isOpen={modalVarianteOpen}
            onClose={() => setModalVarianteOpen(false)}
            modelos={modelos}
            tipos={tiposDispositivo}
            nuevaVarModeloId={nuevaVarModeloId}
            setNuevaVarModeloId={setNuevaVarModeloId}
            nuevaVarColor={nuevaVarColor}
            setNuevaVarColor={setNuevaVarColor}
            nuevaVarCapacidad={nuevaVarCapacidad}
            setNuevaVarCapacidad={setNuevaVarCapacidad}
            nuevaVarSim={nuevaVarSim}
            setNuevaVarSim={setNuevaVarSim}
            onConfirm={handleConfirmInlineVariante}
            onModeloCreado={handleModeloCreadoInline}
            onTipoCreado={handleTipoCreadoInline}
          />

          <ModalCrearAccesorioInline
            isOpen={modalAccesorioOpen}
            onClose={() => setModalAccesorioOpen(false)}
            categorias={categoriasAccesorios}
            nuevoAccCategoriaId={nuevoAccCategoriaId}
            setNuevoAccCategoriaId={setNuevoAccCategoriaId}
            nuevoAccNombre={nuevoAccNombre}
            setNuevoAccNombre={setNuevoAccNombre}
            nuevoAccDescripcion={nuevoAccDescripcion}
            setNuevoAccDescripcion={setNuevoAccDescripcion}
            onConfirm={handleConfirmInlineAccesorio}
            onCategoriaCreada={(nuevaCat) => {
              setCategoriasAccesorios((prev) => [...prev, nuevaCat]);
            }}
          />
        </>
      )}

      {/* TAB 2: HISTORIAL Y AUDITORÍA DE RECEPCIONES (SOLO ADMIN) */}
      {isAdmin && activeTab === 'historial' && (
        <RecepcionHistorialTable
          filtroRecSearch={filtroRecSearch}
          setFiltroRecSearch={setFiltroRecSearch}
          filtroRecSucursalId={filtroRecSucursalId}
          setFiltroRecSucursalId={setFiltroRecSucursalId}
          filtroRecProveedorId={filtroRecProveedorId}
          setFiltroRecProveedorId={setFiltroRecProveedorId}
          filtroRecFechaDesde={filtroRecFechaDesde}
          setFiltroRecFechaDesde={setFiltroRecFechaDesde}
          filtroRecFechaHasta={filtroRecFechaHasta}
          setFiltroRecFechaHasta={setFiltroRecFechaHasta}
          sucursalesList={sucursales}
          proveedoresList={proveedores}
          onResetFiltrosRecepcion={handleResetFiltrosRecepcion}
          recepcionesList={recepcionesList}
          isLoadingRecepciones={isLoadingRecepciones}
          recepcionesMeta={recepcionesMeta}
          setRecepcionesMeta={setRecepcionesMeta}
          onFetchRecepciones={fetchRecepciones}
          onOpenRecDetalle={handleOpenRecDetalle}
          onStartEdit={handleStartEdit}
          onOpenAnularModal={handleOpenAnularModal}
          isAdmin={isAdmin}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN PREVIO AL GUARDADO */}
      <ModalConfirmarGuardado
        isOpen={modalConfirmarOpen}
        onClose={() => setModalConfirmarOpen(false)}
        onConfirm={handleConfirmarGuardado}
        isSubmitting={isSubmitting}
        proveedorNombre={proveedorNombreDisplay}
        sucursalNombre={sucursalNombreDisplay}
        numeroComprobante={numeroComprobante}
        observaciones={observaciones}
        totalTelefonos={totalUnidadesTelefonos}
        totalAccesorios={totalUnidadesAccesorios}
        totalCostoBs={totalCostoNotaBs}
        totalCostoUsd={totalCostoUsdNota}
      />

      {/* MODAL DE ANULACIÓN DE NOTA DE INGRESO */}
      <ModalAnularRecepcion
        isOpen={anularModalOpen}
        onClose={() => {
          if (!isAnulando) {
            setAnularModalOpen(false);
            setNotaParaAnular(null);
          }
        }}
        onConfirm={handleConfirmarAnulacion}
        isSubmitting={isAnulando}
        notaId={notaParaAnular?.id || 0}
        numeroComprobante={notaParaAnular?.numeroComprobante}
        proveedorNombre={notaParaAnular?.proveedor?.nombre}
        totalDispositivos={notaParaAnular?._count?.dispositivos || 0}
        totalAccesorios={notaParaAnular?._count?.lotesAccesorio || 0}
      />

      {/* MODAL DE AUDITORÍA DE NOTA DE INGRESO */}
      <ModalAuditoriaRecepcion
        isOpen={modalRecDetalleOpen}
        onClose={() => setModalRecDetalleOpen(false)}
        recepcionDetalleData={recepcionDetalleData}
        isLoadingRecDetalle={isLoadingRecDetalle}
      />
    </div>
  );
}
