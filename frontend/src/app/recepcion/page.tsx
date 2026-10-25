'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

import { TelefonoRow, AccesorioRow } from '@/features/recepcion/types';
import { RecepcionHeader } from '@/features/recepcion/components/recepcion-header';
import { RecepcionTelefonosTable } from '@/features/recepcion/components/recepcion-telefonos-table';
import { RecepcionAccesoriosTable } from '@/features/recepcion/components/recepcion-accesorios-table';
import { RecepcionResumenPanel } from '@/features/recepcion/components/recepcion-resumen-panel';
import { ModalCrearVarianteInline } from '@/features/recepcion/components/modal-crear-variante-inline';
import { ModalCrearAccesorioInline } from '@/features/recepcion/components/modal-crear-accesorio-inline';
import { ModalConfirmacionIngreso } from '@/features/recepcion/components/modal-confirmacion-ingreso';
import { CategoriaAccesorioItem } from '@/features/catalogo/types';

export default function RecepcionMercaderiaPage() {
  const { user } = useAuth();

  // Estados de datos maestros
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [accesoriosCatalogo, setAccesoriosCatalogo] = useState<any[]>([]);
  const [categoriasAccesorios, setCategoriasAccesorios] = useState<CategoriaAccesorioItem[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

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
      cantidad: 1,
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

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchMasterData() {
      setIsLoadingMaster(true);
      try {
        const [provData, sucData, modData, accData, catData] = await Promise.all([
          api.proveedores.getAll(),
          api.sucursales.getAll(),
          api.modelos.getAll(),
          api.accesorios.getAll(),
          api.accesorios.getCategorias(),
        ]);
        setProveedores(provData);
        setSucursales(sucData);
        setModelos(modData);
        setAccesoriosCatalogo(accData);
        setCategoriasAccesorios(catData);

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

  // Manejadores para Teléfonos
  const handleAddTelefono = () => {
    setTelefonos([
      ...telefonos,
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
                const capLabel =
                  v.capacidadGb > 0
                    ? v.capacidadGb >= 1024
                      ? `${v.capacidadGb / 1024}TB`
                      : `${v.capacidadGb}GB`
                    : 'Sin almacenamiento';
                updated.varianteDisplay = `${v.color} • ${capLabel} • ${v.tipoSim}`;
                updated.nuevaVariante = undefined;
                if (m.tipo === 'MAC' || m.tipo === 'AIRPODS') {
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
            varianteDisplay: `[Nueva al Vuelo] ${nuevaVarColor.trim()} • ${Number(nuevaVarCapacidad) > 0 ? capDisplay : 'Sin alm.'} • ${nuevaVarSim}`,
            ...(modeloSeleccionado?.tipo === 'MAC' || modeloSeleccionado?.tipo === 'AIRPODS'
              ? { imei1: '', imei2: '' }
              : {}),
          };
        }
        return t;
      })
    );

    setModalVarianteOpen(false);
  };

  // Manejadores para Accesorios
  const handleAddAccesorio = () => {
    setAccesorios([
      ...accesorios,
      {
        id: `acc-${Date.now()}`,
        accesorioId: null,
        nombreDiferenciador: '',
        cantidad: 1,
        costoUnitarioBs: 0,
        precioVentaBs: 0,
      },
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
  const totalUnidadesTelefonos = telefonos.filter(
    (t) => t.numeroSerie.trim().length > 0 || t.imei1.trim().length > 0
  ).length;
  const totalUnidadesAccesorios = accesorios.reduce(
    (sum, a) => sum + (Number(a.cantidad) || 0),
    0
  );

  // Envío del Formulario Unificado
  const handleSubmitNota = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const telefonosValidos = telefonos.filter(
      (t) => t.imei1.trim().length > 0 || t.numeroSerie.trim().length > 0
    );

    const accesoriosValidos = accesorios.filter(
      (a) =>
        (a.accesorioId !== null || a.nuevoAccesorio !== undefined) &&
        a.cantidad > 0 &&
        a.nombreDiferenciador.trim().length > 0
    );

    if (telefonosValidos.length === 0 && accesoriosValidos.length === 0) {
      setErrorMessage(
        'Debes ingresar al menos un equipo serializado o un lote de accesorios para registrar la nota.'
      );
      return;
    }

    for (const t of telefonosValidos) {
      if (!t.varianteId && !t.nuevaVariante) {
        setErrorMessage(
          `El equipo con serie '${t.numeroSerie || t.imei1}' no tiene un modelo/variante seleccionado.`
        );
        return;
      }
      if (!t.numeroSerie.trim()) {
        setErrorMessage(`Todos los equipos deben tener un Número de Serie obligatorio.`);
        return;
      }
      const esIphone =
        t.modeloTipo === 'IPHONE' ||
        (!t.modeloTipo && t.modeloNombreDisplay?.toLowerCase().includes('iphone'));
      if (esIphone && !t.imei1.trim()) {
        setErrorMessage(`El equipo '${t.modeloNombreDisplay || 'iPhone'}' requiere un IMEI 1 obligatorio.`);
        return;
      }
    }

    for (const a of accesorios) {
      const tieneDatos =
        a.nombreDiferenciador.trim().length > 0 ||
        Number(a.cantidad) > 0 ||
        Number(a.costoUnitarioBs) > 0;
      if (tieneDatos && !a.accesorioId && !a.nuevoAccesorio) {
        setErrorMessage(
          `El lote de accesorio '${a.nombreDiferenciador || 'sin nombre'}' no tiene un accesorio base seleccionado ni creado al vuelo.`
        );
        return;
      }
    }

    const imeis = telefonosValidos.map((t) => t.imei1.trim()).filter((im) => im.length > 0);
    const series = telefonosValidos.map((t) => t.numeroSerie.trim()).filter((sr) => sr.length > 0);
    if (new Set(imeis).size !== imeis.length) {
      setErrorMessage('Hay IMEIs duplicados dentro de la lista de equipos ingresados.');
      return;
    }
    if (new Set(series).size !== series.length) {
      setErrorMessage('Hay Números de Serie duplicados dentro de la lista de equipos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        proveedorId: Number(proveedorId),
        sucursalId: Number(sucursalId),
        numeroComprobante: numeroComprobante.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        dispositivos: telefonosValidos.map((t) => ({
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
          accesorioId: a.accesorioId ? Number(a.accesorioId) : undefined,
          nuevoAccesorio: a.nuevoAccesorio,
          nombreDiferenciador: a.nombreDiferenciador.trim(),
          cantidad: Number(a.cantidad),
          costoUnitarioBs: Number(a.costoUnitarioBs),
          precioVentaBs: Number(a.precioVentaBs),
        })),
      };

      const res = await api.recepcion.createNotaIngreso(payload);
      setNotaCreada(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la nota de ingreso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
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
        cantidad: 1,
        costoUnitarioBs: 0,
        precioVentaBs: 0,
      },
    ]);
  };

  if (isLoadingMaster) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (notaCreada) {
    return <ModalConfirmacionIngreso notaCreada={notaCreada} onReset={handleResetForm} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      <RecepcionHeader
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

      {errorMessage && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm text-slate-900 flex items-start gap-3 animate-in fade-in duration-150">
          <ShieldAlert className="h-5 w-5 text-slate-800 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Error al registrar la recepción:</p>
            <p className="text-xs text-slate-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitNota} className="space-y-8">
        <RecepcionTelefonosTable
          telefonos={telefonos}
          modelos={modelos}
          onAddTelefono={handleAddTelefono}
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
        />
      </form>

      <ModalCrearVarianteInline
        isOpen={modalVarianteOpen}
        onClose={() => setModalVarianteOpen(false)}
        modelos={modelos}
        nuevaVarModeloId={nuevaVarModeloId}
        setNuevaVarModeloId={setNuevaVarModeloId}
        nuevaVarColor={nuevaVarColor}
        setNuevaVarColor={setNuevaVarColor}
        nuevaVarCapacidad={nuevaVarCapacidad}
        setNuevaVarCapacidad={setNuevaVarCapacidad}
        nuevaVarSim={nuevaVarSim}
        setNuevaVarSim={setNuevaVarSim}
        onConfirm={handleConfirmInlineVariante}
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
    </div>
  );
}
