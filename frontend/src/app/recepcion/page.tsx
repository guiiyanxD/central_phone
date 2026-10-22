'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PackagePlus,
  Smartphone,
  Headphones,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';

interface TelefonoRow {
  id: string;
  varianteId: number | null;
  nuevaVariante?: {
    modeloId: number;
    color: string;
    capacidadGb: number;
    tipoSim: string;
  };
  modeloNombreDisplay?: string;
  modeloTipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO';
  varianteDisplay?: string;
  imei1: string;
  imei2: string;
  numeroSerie: string;
  condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
  costoBs: number;
  costoUsd: number;
  precioVentaSugeridoBs: number;
}

interface AccesorioRow {
  id: string;
  accesorioId: number | null;
  nombreDiferenciador: string;
  cantidad: number;
  costoUnitarioBs: number;
  precioVentaBs: number;
}

export default function RecepcionMercaderiaPage() {
  const { user } = useAuth();

  // Estados de datos maestros
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [accesoriosCatalogo, setAccesoriosCatalogo] = useState<any[]>([]);
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

  // Modal para creación de variante in-line ("al vuelo")
  const [modalVarianteOpen, setModalVarianteOpen] = useState(false);
  const [targetTelefonoId, setTargetTelefonoId] = useState<string | null>(null);
  const [nuevaVarModeloId, setNuevaVarModeloId] = useState<number>(1);
  const [nuevaVarColor, setNuevaVarColor] = useState<string>('');
  const [nuevaVarCapacidad, setNuevaVarCapacidad] = useState<number>(256);
  const [nuevaVarSim, setNuevaVarSim] = useState<string>('SIM Físico');

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notaCreada, setNotaCreada] = useState<any | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchMasterData() {
      setIsLoadingMaster(true);
      try {
        const [provData, sucData, modData, accData] = await Promise.all([
          api.proveedores.getAll(),
          api.sucursales.getAll(),
          api.modelos.getAll(),
          api.accesorios.getAll(),
        ]);
        setProveedores(provData);
        setSucursales(sucData);
        setModelos(modData);
        setAccesoriosCatalogo(accData);

        if (provData.length > 0) setProveedorId(provData[0].id);
        if (sucData.length > 0) setSucursalId(user?.sucursal?.id || sucData[0].id);
      } catch (err: any) {
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
          // Si cambia costoBs y precioVentaSugeridoBs no fue personalizado o era 0/cálculo previo, sugerir +15%
          if (field === 'costoBs') {
            const numCosto = Number(value) || 0;
            const prevCalculado = Math.round((Number(t.costoBs) || 0) * 1.15);
            if (!t.precioVentaSugeridoBs || t.precioVentaSugeridoBs === prevCalculado) {
              updated.precioVentaSugeridoBs = Math.round(numCosto * 1.15);
            }
          }
          // Si cambia varianteId, actualizar displays
          if (field === 'varianteId' && typeof value === 'number') {
            for (const m of modelos) {
              const v = m.variantes.find((x: any) => x.id === value);
              if (v) {
                updated.modeloNombreDisplay = m.nombreModelo;
                updated.modeloTipo = m.tipo || 'IPHONE';
                const capLabel =
                  v.capacidadGb > 0
                    ? v.capacidadGb >= 1024
                      ? `${v.capacidadGb / 1024}TB`
                      : `${v.capacidadGb}GB`
                    : 'Sin almacenamiento';
                updated.varianteDisplay = `${v.color} • ${capLabel} • ${v.tipoSim}`;
                updated.nuevaVariante = undefined;
                // Si el modelo es MAC o AIRPODS, limpiar IMEI automáticamente
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

  // Abrir modal de variante in-line
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
            modeloNombreDisplay: modeloSeleccionado?.nombreModelo || 'Modelo Personalizado',
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
      accesorios.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
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

    // Validar equipos válidos
    const telefonosValidos = telefonos.filter(
      (t) => t.imei1.trim().length > 0 || t.numeroSerie.trim().length > 0
    );

    const accesoriosValidos = accesorios.filter(
      (a) => a.accesorioId !== null && a.cantidad > 0 && a.nombreDiferenciador.trim().length > 0
    );

    if (telefonosValidos.length === 0 && accesoriosValidos.length === 0) {
      setErrorMessage(
        'Debes ingresar al menos un equipo serializado o un lote de accesorios para registrar la nota.'
      );
      return;
    }

    // Validar que cada equipo tenga variante o nuevaVariante
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

    // Validar duplicados locales de IMEI en el mismo formulario (solo para los que tienen IMEI)
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
          accesorioId: Number(a.accesorioId),
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

  if (isLoadingMaster) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Vista de éxito al confirmar la Nota de Ingreso
  if (notaCreada) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-in fade-in duration-300">
        <Card className="border-slate-200 bg-white shadow-card p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="success">Nota de Ingreso #{notaCreada.id}</Badge>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Mercadería Recibida e Inventariada
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              La transacción se registró con éxito en la base de datos con trazabilidad total.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Proveedor:</span>
              <strong className="text-slate-900">{notaCreada.proveedor?.nombre}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sucursal Destino:</span>
              <strong className="text-slate-900">{notaCreada.sucursal?.nombre}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Teléfonos Registrados:</span>
              <strong className="text-slate-900">{notaCreada.dispositivos?.length || 0} unidades</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lotes de Accesorios:</span>
              <strong className="text-slate-900">{notaCreada.lotesAccesorio?.length || 0} lotes</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-sans font-bold">
              <span className="text-slate-900">Total Costo de Ingreso:</span>
              <span className="text-slate-900">Bs {Number(notaCreada.totalCostoBs).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1"
              onClick={() => {
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
              }}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Registrar Otra Nota
            </Button>
            <Link href="/inventario" className="flex-1">
              <Button variant="outline" className="w-full">
                <span>Ver en Inventario</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Recepción Unificada de Mercadería
            </h1>
            <Badge variant="outline">Transacción ACID</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Ingreso conjunto de teléfonos (serializados por IMEI) y lotes diferenciados de accesorios.
          </p>
        </div>

        <Link href="/inventario">
          <Button variant="outline" size="sm">
            Explorar Stock Actual
          </Button>
        </Link>
      </div>

      {/* Banner de Error si ocurre */}
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
        {/* SECCIÓN 1: CABECERA DE LA NOTA DE INGRESO (US08) */}
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              1. Datos de Origen y Comprobante
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Proveedor mayorista y sucursal donde ingresará la mercadería física.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label required>Proveedor Mayorista</Label>
              <Select
                value={proveedorId}
                onChange={(e) => setProveedorId(Number(e.target.value))}
              >
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.contactoReferencia ? `(${p.contactoReferencia})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label required>Sucursal Destino</Label>
              <Select
                value={sucursalId}
                onChange={(e) => setSucursalId(Number(e.target.value))}
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - {s.ciudad}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>N° de Factura / Remisión</Label>
              <Input
                placeholder="Ej: FAC-9821 / REM-004"
                value={numeroComprobante}
                onChange={(e) => setNumeroComprobante(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3">
              <Label>Observaciones de Recepción (Opcional)</Label>
              <Input
                placeholder="Ej: Entrega recibida por encomienda, sin empaque dañado"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 2: TELÉFONOS SERIALIZADOS (US09) */}
        <Card className="border-slate-200">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-slate-700" />
                <CardTitle className="text-base font-semibold text-slate-900">
                  2. Equipos Serializados Recibidos
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Identificación unívoca por Número de Serie (y obligatorio IMEI 1 en iPhone).
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTelefono}
              className="text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Agregar Equipo
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {telefonos.map((t, idx) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Unidad #{idx + 1}</span>
                  {telefonos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTelefono(t.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Eliminar fila"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Selector de Variante o Botón al vuelo */}
                  <div className="md:col-span-2 space-y-1">
                    <Label required>Modelo y Variante</Label>
                    <div className="flex gap-2">
                      <Select
                        className="flex-1"
                        value={t.varianteId || ''}
                        onChange={(e) =>
                          handleUpdateTelefono(
                            t.id,
                            'varianteId',
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                      >
                        <option value="">-- Seleccionar Variante --</option>
                        {modelos.map((m) => (
                          <optgroup key={m.id} label={`${m.nombreModelo} (${m.tipo || 'IPHONE'})`}>
                            {m.variantes.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {m.nombreModelo} - {v.color} (
                                {v.capacidadGb > 0
                                  ? v.capacidadGb >= 1024
                                    ? `${v.capacidadGb / 1024}TB`
                                    : `${v.capacidadGb}GB`
                                  : '0 GB'}
                                ) [{v.tipoSim}]
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenInlineVarianteModal(t.id)}
                        className="text-[11px] whitespace-nowrap border-dashed border-slate-300"
                        title="Crear variante al vuelo para este modelo"
                      >
                        <Sparkles className="h-3 w-3 mr-1 text-slate-700" />
                        Al Vuelo
                      </Button>
                    </div>

                    {t.nuevaVariante && (
                      <p className="text-[11px] text-slate-800 font-medium">
                        ✨ {t.varianteDisplay}
                      </p>
                    )}
                  </div>

                  {/* Condición */}
                  <div>
                    <Label required>Condición</Label>
                    <Select
                      value={t.condicion}
                      onChange={(e) =>
                        handleUpdateTelefono(t.id, 'condicion', e.target.value)
                      }
                    >
                      <option value="NUEVO">NUEVO (Sellado)</option>
                      <option value="OPEN_BOX">OPEN BOX</option>
                      <option value="USADO">USADO (Garantizado)</option>
                    </Select>
                  </div>

                  {/* Número de Serie */}
                  <div>
                    <Label required>Número de Serie</Label>
                    <Input
                      placeholder="Ej: F2LZ998X..."
                      value={t.numeroSerie}
                      onChange={(e) =>
                        handleUpdateTelefono(t.id, 'numeroSerie', e.target.value.toUpperCase())
                      }
                    />
                  </div>

                  {/* IMEI 1 */}
                  <div>
                    <Label required={t.modeloTipo === 'IPHONE'}>
                      IMEI 1 {t.modeloTipo === 'IPHONE' ? '(15 dígitos)' : '(Celular/Opc.)'}
                    </Label>
                    <Input
                      disabled={t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS'}
                      placeholder={
                        t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS'
                          ? 'No Aplica (Identificado por S/N)'
                          : '35492811...'
                      }
                      value={t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS' ? '' : t.imei1}
                      maxLength={20}
                      onChange={(e) =>
                        handleUpdateTelefono(t.id, 'imei1', e.target.value)
                      }
                      className={
                        t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : ''
                      }
                    />
                  </div>

                  {/* IMEI 2 (Opcional) */}
                  <div>
                    <Label>IMEI 2 (Dual SIM / eSIM)</Label>
                    <Input
                      disabled={t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS'}
                      placeholder={
                        t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS'
                          ? 'No Aplica'
                          : 'Opcional...'
                      }
                      value={t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS' ? '' : t.imei2}
                      maxLength={20}
                      onChange={(e) =>
                        handleUpdateTelefono(t.id, 'imei2', e.target.value)
                      }
                      className={
                        t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : ''
                      }
                    />
                  </div>

                  {/* Costo en Bs */}
                  <div>
                    <Label required>Costo Unitario (Bs)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={t.costoBs || ''}
                      onChange={(e) =>
                        handleUpdateTelefono(t.id, 'costoBs', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  {/* Costo en USD */}
                  <div>
                    <Label required>Costo Unitario ($ USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={t.costoUsd || ''}
                      onChange={(e) =>
                        handleUpdateTelefono(t.id, 'costoUsd', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  {/* Precio Venta Sugerido en Bs (US09 / Fase 2) */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label required>P. Venta Sugerido (Bs)</Label>
                      <span className="text-[10px] text-slate-500 font-mono">+15% auto</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={t.precioVentaSugeridoBs || ''}
                      onChange={(e) =>
                        handleUpdateTelefono(t.id, 'precioVentaSugeridoBs', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SECCIÓN 3: LOTES DE ACCESORIOS (US10) */}
        <Card className="border-slate-200">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-slate-700" />
                <CardTitle className="text-base font-semibold text-slate-900">
                  3. Lotes Diferenciados de Accesorios
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Cada lote distingue calidades y precios para el mismo accesorio base (ej: Simple vs MagSafe).
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAccesorio}
              className="text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Agregar Lote Accesorio
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {accesorios.map((a, idx) => (
              <div
                key={a.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Lote #{idx + 1}</span>
                  {accesorios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccesorio(a.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Eliminar fila"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {/* Accesorio Base */}
                  <div className="sm:col-span-2">
                    <Label required>Accesorio Base</Label>
                    <Select
                      value={a.accesorioId || ''}
                      onChange={(e) =>
                        handleUpdateAccesorio(
                          a.id,
                          'accesorioId',
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    >
                      <option value="">-- Seleccionar Accesorio --</option>
                      {accesoriosCatalogo.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.nombre} ({acc.categoria?.nombre})
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Nombre Diferenciador */}
                  <div className="sm:col-span-3">
                    <Label required>Nombre Diferenciador del Lote</Label>
                    <Input
                      placeholder="Ej: MagSafe Reforzada Azul / Silicona Lisa Bs 40"
                      value={a.nombreDiferenciador}
                      onChange={(e) =>
                        handleUpdateAccesorio(a.id, 'nombreDiferenciador', e.target.value)
                      }
                    />
                  </div>

                  {/* Cantidad */}
                  <div>
                    <Label required>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={a.cantidad || ''}
                      onChange={(e) =>
                        handleUpdateAccesorio(a.id, 'cantidad', parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>

                  {/* Costo Unitario Bs */}
                  <div className="sm:col-span-2">
                    <Label required>Costo Unitario (Bs)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={a.costoUnitarioBs || ''}
                      onChange={(e) =>
                        handleUpdateAccesorio(
                          a.id,
                          'costoUnitarioBs',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  {/* Precio Venta Sugerido Bs */}
                  <div className="sm:col-span-2">
                    <Label required>Precio Venta Sugerido (Bs)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={a.precioVentaBs || ''}
                      onChange={(e) =>
                        handleUpdateAccesorio(
                          a.id,
                          'precioVentaBs',
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* RESUMEN FINANCIERO Y ACCIÓN DE GUARDADO */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="grid grid-cols-3 gap-6 text-center sm:text-left w-full md:w-auto">
            <div>
              <p className="text-xs text-slate-500 font-medium">Teléfonos</p>
              <p className="text-xl font-bold text-slate-900">{totalUnidadesTelefonos} u.</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Accesorios</p>
              <p className="text-xl font-bold text-slate-900">{totalUnidadesAccesorios} u.</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Costo Total Compra</p>
              <p className="text-xl font-bold text-slate-900">
                Bs {totalCostoNotaBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full md:w-auto min-w-[260px]"
            isLoading={isSubmitting}
            loadingText="Registrando Mercadería..."
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Registrar Nota de Ingreso
          </Button>
        </div>
      </form>

      {/* MODAL PARA CREACIÓN DE VARIANTE IN-LINE ("AL VUELO" - US09) */}
      <Modal
        isOpen={modalVarianteOpen}
        onClose={() => setModalVarianteOpen(false)}
        title="Crear Variante In-Line (Al Vuelo)"
        description="Si el proveedor trajo una combinación de color o almacenamiento no listada en el catálogo oficial."
      >
        <div className="space-y-4 pt-2">
          <div>
            <Label required>Modelo de Dispositivo</Label>
            <Select
              value={nuevaVarModeloId}
              onChange={(e) => setNuevaVarModeloId(Number(e.target.value))}
            >
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombreModelo} ({m.tipo || 'IPHONE'})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Color</Label>
            <Input
              placeholder="Ej: Midnight Blue, Space Gray, Blanco, Titanio Natural"
              value={nuevaVarColor}
              onChange={(e) => setNuevaVarColor(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Capacidad (GB)</Label>
              <Select
                value={nuevaVarCapacidad}
                onChange={(e) => setNuevaVarCapacidad(Number(e.target.value))}
              >
                <option value="0">0 GB (Sin almacenamiento / AirPods / Watch)</option>
                <option value="64">64 GB</option>
                <option value="128">128 GB</option>
                <option value="256">256 GB</option>
                <option value="512">512 GB</option>
                <option value="1024">1 TB (1024 GB)</option>
                <option value="2048">2 TB (2048 GB)</option>
              </Select>
            </div>

            <div>
              <Label required>Conectividad / SIM</Label>
              <Select
                value={nuevaVarSim}
                onChange={(e) => setNuevaVarSim(e.target.value)}
              >
                <option value="SIM Físico">SIM Físico</option>
                <option value="eSIM Exclusivo">eSIM Exclusivo</option>
                <option value="Dual SIM Físico">Dual SIM Físico</option>
                <option value="No Aplica">No Aplica (Mac / AirPods / Wi-Fi)</option>
                <option value="GPS Only">GPS Only (Apple Watch)</option>
                <option value="GPS + Cellular">GPS + Cellular (Apple Watch)</option>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setModalVarianteOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleConfirmInlineVariante}
              disabled={!nuevaVarColor.trim()}
            >
              Confirmar e Inyectar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
