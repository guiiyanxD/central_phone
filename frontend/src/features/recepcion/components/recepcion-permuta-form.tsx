'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  User,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
  Battery,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowRight,
  Info,
  CalendarClock,
  Search,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { AutocompleteInput, AutocompleteOption } from '@/components/ui/autocomplete-input';
import { ModalCrearProveedorMinoristaInline } from './modal-crear-proveedor-minorista-inline';
import { ProveedorItem } from '@/features/proveedores/types';
import { api } from '@/lib/api';
import { ReglaMargenPrecio } from '@/lib/api/configuracion.api';
import { calcularPrecioSugeridoBs } from '@/lib/utils/pricing.util';

interface GastoRow {
  id: string;
  concepto: string;
  costoBs: number | '';
  fechaGasto: string;
  observacion: string;
  aplicoEnCaja: boolean;
}

interface RecepcionPermutaFormProps {
  modelos: any[];
  sucursales: any[];
  currentSucursalId: number;
  isAdmin: boolean;
  onSuccess: (result: any) => void;
  onOpenInlineVarianteModal: (onCreatedVariant: (variante: any) => void) => void;
}

export function RecepcionPermutaForm({
  modelos,
  sucursales,
  currentSucursalId,
  isAdmin,
  onSuccess,
  onOpenInlineVarianteModal,
}: RecepcionPermutaFormProps) {
  // Filtrar modelos exclusivos de iPhone
  const iphoneModelos = modelos.filter(
    (m) =>
      m.tipo === 'IPHONE' ||
      m.tipoDispositivo?.nombre === 'IPHONE' ||
      m.nombreModelo.toUpperCase().includes('IPHONE')
  );

  // Estados de datos de proveedor minorista
  const [nombreCliente, setNombreCliente] = useState('');
  const [apellidoCliente, setApellidoCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [minoristas, setMinoristas] = useState<ProveedorItem[]>([]);
  const [selectedMinoristaId, setSelectedMinoristaId] = useState<number | null>(null);
  const [isModalMinoristaOpen, setIsModalMinoristaOpen] = useState(false);
  const [sucursalDestinoId, setSucursalDestinoId] = useState<number>(currentSucursalId || 1);
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Cargar lista de proveedores minoristas para autocompletado
  useEffect(() => {
    if (api.proveedores?.getAll) {
      api.proveedores
        .getAll(false, undefined, 'MINORISTA')
        .then((data) => {
          if (Array.isArray(data)) {
            setMinoristas(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const minoristaOptions: AutocompleteOption[] = React.useMemo(() => {
    return minoristas.map((m) => {
      const fullName = `${m.nombre}${m.apellido ? ` ${m.apellido}` : ''}`;
      return {
        value: m.id,
        label: fullName,
        sublabel: m.telefono ? `Tel: ${m.telefono}` : undefined,
        badge: 'Minorista',
        badgeVariant: 'purple' as const,
      };
    });
  }, [minoristas]);

  const handleSelectMinorista = (val: any) => {
    if (!val) {
      setSelectedMinoristaId(null);
      return;
    }
    const found = minoristas.find((m) => m.id === Number(val));
    if (found) {
      setSelectedMinoristaId(found.id);
      setNombreCliente(found.nombre);
      setApellidoCliente(found.apellido || '');
      setTelefonoCliente(found.telefono || '');
    }
  };

  const handleMinoristaCreado = (nuevo: ProveedorItem) => {
    setMinoristas((prev) => [nuevo, ...prev]);
    setSelectedMinoristaId(nuevo.id);
    setNombreCliente(nuevo.nombre);
    setApellidoCliente(nuevo.apellido || '');
    setTelefonoCliente(nuevo.telefono || '');
  };

  const getNowDateTimeLocal = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [fechaIngreso, setFechaIngreso] = useState<string>(getNowDateTimeLocal());

  const maxDateTimeLocal = React.useMemo(() => {
    return getNowDateTimeLocal();
  }, []);

  const esHistorico = React.useMemo(() => {
    if (!fechaIngreso) return false;
    const timeSelected = new Date(fechaIngreso).getTime();
    if (isNaN(timeSelected)) return false;
    return Date.now() - timeSelected > 60 * 60 * 1000;
  }, [fechaIngreso]);

  const handleSetAhora = () => {
    setFechaIngreso(getNowDateTimeLocal());
  };

  // Estados del dispositivo físico iPhone
  const [selectedModeloId, setSelectedModeloId] = useState<number>(
    iphoneModelos[0]?.id || (modelos[0]?.id || 1)
  );
  const [selectedVarianteId, setSelectedVarianteId] = useState<number | null>(null);
  const [numeroSerie, setNumeroSerie] = useState('');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [porcentajeBateria, setPorcentajeBateria] = useState<number | ''>(85);
  const [registro, setRegistro] = useState('');
  const [costoBs, setCostoBs] = useState<number | ''>('');

  // Gastos iniciales opcionales
  const [gastos, setGastos] = useState<GastoRow[]>([]);
  const [reglaPermuta, setReglaPermuta] = useState<ReglaMargenPrecio | null>(null);

  // Estados de validación y carga
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar regla de margen de permuta centralizada
  useEffect(() => {
    api.configuracion
      .getMargenes()
      .then((data) => {
        if (Array.isArray(data)) {
          const found = data.find((r) => r.categoria === 'PERMUTA');
          if (found) setReglaPermuta(found);
        }
      })
      .catch(() => {});
  }, []);

  // Obtener las variantes del modelo de iPhone seleccionado (memoizado para estabilidad de ciclo de vida)
  const selectedModelo = iphoneModelos.find((m) => m.id === Number(selectedModeloId));
  const variantesDisponibles = React.useMemo(
    () => selectedModelo?.variantes || [],
    [selectedModelo]
  );

  // Seleccionar la primera variante por defecto si cambia el modelo
  React.useEffect(() => {
    if (variantesDisponibles.length > 0) {
      setSelectedVarianteId((prev) => {
        if (!prev || !variantesDisponibles.some((v: any) => v.id === prev)) {
          return variantesDisponibles[0].id;
        }
        return prev;
      });
    } else {
      setSelectedVarianteId(null);
    }
  }, [selectedModeloId, variantesDisponibles]);

  // Manejo de gastos dinámicos
  const handleAddGasto = () => {
    const today = new Date().toISOString().slice(0, 10);
    setGastos((prev) => [
      ...prev,
      {
        id: `gasto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        concepto: '',
        costoBs: '',
        fechaGasto: today,
        observacion: '',
        aplicoEnCaja: true, // Predeterminadamente activo según regla inmutable
      },
    ]);
  };

  const handleRemoveGasto = (id: string) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
  };

  const handleUpdateGasto = (id: string, field: keyof GastoRow, val: any) => {
    setGastos((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: val } : g))
    );
  };

  // Cálculos financieros dinámicos en vivo respetando regla centralizada
  const numericCostoBs = typeof costoBs === 'number' ? Math.max(0, costoBs) : 0;
  const sumaGastosActivos = gastos.reduce((sum, g) => {
    const val = typeof g.costoBs === 'number' ? Math.max(0, g.costoBs) : 0;
    return sum + val;
  }, 0);

  const precioSugeridoCalculado = calcularPrecioSugeridoBs(
    numericCostoBs,
    reglaPermuta,
    sumaGastosActivos,
  );
  const inversionTotalReal = Math.round((numericCostoBs + sumaGastosActivos) * 100) / 100;
  const margenBrutoCalculado = Math.max(0, precioSugeridoCalculado - inversionTotalReal);

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validaciones de Proveedor Minorista
    if (!nombreCliente.trim()) {
      setErrorMsg('El nombre del cliente/proveedor es obligatorio.');
      return;
    }
    if (!telefonoCliente.trim()) {
      setErrorMsg('El número de teléfono del cliente es obligatorio.');
      return;
    }

    // 2. Validaciones de Dispositivo
    if (!selectedVarianteId) {
      setErrorMsg('Debes seleccionar una variante (Color/Capacidad) para el iPhone.');
      return;
    }
    if (!numeroSerie.trim()) {
      setErrorMsg('El número de serie del iPhone es obligatorio.');
      return;
    }
    if (!imei1.trim() || imei1.trim().length < 14) {
      setErrorMsg('El IMEI 1 es obligatorio y debe tener al menos 14-15 dígitos numéricos.');
      return;
    }
    if (porcentajeBateria === '' || porcentajeBateria < 1 || porcentajeBateria > 100) {
      setErrorMsg('El porcentaje de salud de batería debe estar entre 1% y 100%.');
      return;
    }
    if (numericCostoBs <= 0) {
      setErrorMsg('El costo de compra/toma en Bolivianos (Bs) debe ser mayor a 0.');
      return;
    }

    // 3. Validar gastos si existen
    for (let i = 0; i < gastos.length; i++) {
      const g = gastos[i];
      if (!g.concepto.trim()) {
        setErrorMsg(`El gasto #${i + 1} requiere un concepto o descripción (ej: Cambio de Pantalla).`);
        return;
      }
      if (typeof g.costoBs !== 'number' || g.costoBs <= 0) {
        setErrorMsg(`El gasto #${i + 1} (${g.concepto}) debe tener un costo numérico mayor a 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        proveedorMinorista: {
          ...(selectedMinoristaId ? { id: selectedMinoristaId } : {}),
          nombre: nombreCliente.trim(),
          apellido: apellidoCliente.trim() || undefined,
          telefono: telefonoCliente.trim(),
        },
        sucursalId: Number(sucursalDestinoId),
        numeroComprobante: numeroComprobante.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso).toISOString() : undefined,
        dispositivo: {
          varianteId: Number(selectedVarianteId),
          numeroSerie: numeroSerie.trim().toUpperCase(),
          imei1: imei1.trim(),
          imei2: imei2.trim() || undefined,
          porcentajeBateria: Number(porcentajeBateria),
          detallesFisicos: registro.trim() || undefined,
          costoBs: numericCostoBs,
        },
        gastosIniciales: gastos.map((g) => ({
          concepto: g.concepto.trim(),
          costoBs: Number(g.costoBs),
          fechaGasto: g.fechaGasto ? new Date(`${g.fechaGasto}T12:00:00`).toISOString() : new Date().toISOString(),
          observacion: g.observacion.trim() || undefined,
          aplicoEnCaja: g.aplicoEnCaja,
        })),
      };

      const res = await api.recepcion.createPermuta(payload);
      onSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la permuta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-950">Atención en el registro de permuta:</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: DATOS DEL CLIENTE / PROVEEDOR MINORISTA */}
      <Card className="border-slate-200 bg-white shadow-subtle">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-800" />
              <CardTitle className="text-sm font-bold text-slate-900">
                1. Datos del Cliente / Proveedor Minorista
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
              Módulo Permutas
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Identificación de la persona particular que entrega el equipo como permuta.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Selector con búsqueda de Proveedor Minorista */}
          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label htmlFor="buscarMinoristaInput" className="text-xs font-bold text-purple-950 flex items-center gap-1.5 mb-0">
                <Search className="h-3.5 w-3.5 text-purple-700" />
                <span>Proveedor Minorista (Particular / Permuta)</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 bg-white text-purple-700 border-purple-300 hover:bg-purple-100 hover:text-purple-900 font-semibold gap-1 shadow-2xs self-start sm:self-auto cursor-pointer"
                onClick={() => setIsModalMinoristaOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 text-purple-700" />
                <span>Nuevo Proveedor Minorista</span>
              </Button>
            </div>
            <AutocompleteInput
              id="buscarMinoristaInput"
              options={minoristaOptions}
              value={selectedMinoristaId}
              onChange={handleSelectMinorista}
              placeholder="Escribe nombre o teléfono para buscar minorista registrado..."
              emptyMessage="Sin proveedores minoristas registrados con ese término"
              isClearable
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nombreCliente" className="text-xs font-semibold text-slate-700 mb-1 block">
                Nombre <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="nombreCliente"
                placeholder="Ej: Juan"
                value={nombreCliente}
                onChange={(e) => {
                  setNombreCliente(e.target.value);
                  if (selectedMinoristaId) setSelectedMinoristaId(null);
                }}
                className="text-xs h-9"
                required
              />
            </div>

            <div>
              <Label htmlFor="apellidoCliente" className="text-xs font-semibold text-slate-700 mb-1 block">
                Apellido <span className="text-slate-400 font-normal">(Opcional)</span>
              </Label>
              <Input
                id="apellidoCliente"
                placeholder="Ej: Pérez"
                value={apellidoCliente}
                onChange={(e) => setApellidoCliente(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div>
              <Label htmlFor="telefonoCliente" className="text-xs font-semibold text-slate-700 mb-1 block">
                Teléfono de Contacto <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="telefonoCliente"
                type="tel"
                placeholder="Ej: 70012345"
                value={telefonoCliente}
                onChange={(e) => {
                  setTelefonoCliente(e.target.value);
                  if (selectedMinoristaId) setSelectedMinoristaId(null);
                }}
                className="text-xs h-9 font-mono"
                required
              />
            </div>

          <div>
            <Label htmlFor="sucursalDestino" className="text-xs font-semibold text-slate-700 mb-1 block">
              Sucursal Destino <span className="text-rose-500">*</span>
            </Label>
            <Select
              id="sucursalDestino"
              value={String(sucursalDestinoId)}
              onChange={(e) => setSucursalDestinoId(Number(e.target.value))}
              disabled={!isAdmin}
              className="text-xs h-9"
            >
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.ciudad})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="numeroComprobantePermuta" className="text-xs font-semibold text-slate-700 mb-1 block">
              Nro Comprobante / Recibo <span className="text-slate-400 font-normal">(Opcional)</span>
            </Label>
            <Input
              id="numeroComprobantePermuta"
              placeholder="Ej: PERM-001"
              value={numeroComprobante}
              onChange={(e) => setNumeroComprobante(e.target.value)}
              className="text-xs h-9 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="fechaIngresoPermuta" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                <span>Fecha de Recepción</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] px-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                onClick={handleSetAhora}
                title="Restablecer a la fecha y hora actual"
              >
                Ahora
              </Button>
            </div>
            <Input
              id="fechaIngresoPermuta"
              type="datetime-local"
              max={maxDateTimeLocal}
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className="text-xs h-9 font-mono"
            />
            {esHistorico && (
              <div className="mt-1 flex items-center gap-1">
                <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-700 px-1.5 py-0 font-medium">
                  Ingreso Histórico
                </Badge>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="observacionesPermuta" className="text-xs font-semibold text-slate-700 mb-1 block">
              Observaciones Generales
            </Label>
            <Input
              id="observacionesPermuta"
              placeholder="Ej: Equipo recibido con funda original..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>

      {/* SECCIÓN 2: DATOS DEL DISPOSITIVO IPHONE */}
      <Card className="border-slate-200 bg-white shadow-subtle">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-slate-800" />
              <CardTitle className="text-sm font-bold text-slate-900">
                2. Especificaciones del Teléfono iPhone
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                Condición: Permuta (Fija)
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Identificadores de hardware únicos y estado de recepción del dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Modelo iPhone */}
            <div>
              <Label htmlFor="modeloIphone" className="text-xs font-semibold text-slate-700 mb-1 block">
                Modelo iPhone <span className="text-rose-500">*</span>
              </Label>
              <Select
                id="modeloIphone"
                value={String(selectedModeloId)}
                onChange={(e) => setSelectedModeloId(Number(e.target.value))}
                className="text-xs h-9 font-semibold"
              >
                {iphoneModelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombreModelo}
                  </option>
                ))}
              </Select>
            </div>

            {/* Variante Color / Capacidad */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="varianteIphone" className="text-xs font-semibold text-slate-700">
                  Variante (Color / Almacenamiento) <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInlineVarianteModal((newVar) => {
                      setSelectedVarianteId(newVar.id);
                    })
                  }
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" /> Crear Variante
                </button>
              </div>
              <Select
                id="varianteIphone"
                value={selectedVarianteId ? String(selectedVarianteId) : ''}
                onChange={(e) => setSelectedVarianteId(Number(e.target.value))}
                className="text-xs h-9"
              >
                {variantesDisponibles.length === 0 ? (
                  <option value="">(Sin variantes disponibles)</option>
                ) : (
                  variantesDisponibles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.color} - {v.capacidadGb >= 1024 ? `${v.capacidadGb / 1024}TB` : `${v.capacidadGb}GB`} ({v.tipoSim || 'SIM Físico'})
                    </option>
                  ))
                )}
              </Select>
            </div>

            {/* Condición Readonly */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                Condición de Ingreso
              </Label>
              <div className="h-9 px-3 bg-purple-50/70 border border-purple-200 rounded-md flex items-center justify-between text-xs font-bold text-purple-900">
                <span>PERMUTA</span>
                <span className="text-[10px] font-normal text-purple-600 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                  Solo Lectura
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
            {/* Número de Serie */}
            <div>
              <Label htmlFor="numeroSeriePermuta" className="text-xs font-semibold text-slate-700 mb-1 block">
                Número de Serie (S/N) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="numeroSeriePermuta"
                placeholder="Ej: F2LX45009"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value.toUpperCase())}
                className="text-xs h-9 font-mono uppercase font-semibold"
                required
              />
            </div>

            {/* IMEI 1 */}
            <div>
              <Label htmlFor="imei1Permuta" className="text-xs font-semibold text-slate-700 mb-1 block">
                IMEI 1 <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="imei1Permuta"
                placeholder="15 dígitos numéricos"
                value={imei1}
                onChange={(e) => setImei1(e.target.value.replace(/\D/g, '').slice(0, 15))}
                className="text-xs h-9 font-mono font-semibold"
                required
              />
            </div>

            {/* IMEI 2 */}
            <div>
              <Label htmlFor="imei2Permuta" className="text-xs font-semibold text-slate-700 mb-1 block">
                IMEI 2 <span className="text-slate-400 font-normal">(eSIM / Dual SIM)</span>
              </Label>
              <Input
                id="imei2Permuta"
                placeholder="Opcional (15 dígitos)"
                value={imei2}
                onChange={(e) => setImei2(e.target.value.replace(/\D/g, '').slice(0, 15))}
                className="text-xs h-9 font-mono"
              />
            </div>

            {/* Porcentaje de Batería */}
            <div>
              <Label htmlFor="porcentajeBateriaPermuta" className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Salud de Batería <span className="text-rose-500">*</span></span>
                {typeof porcentajeBateria === 'number' && (
                  <span className={`text-[10px] font-bold ${porcentajeBateria >= 85 ? 'text-emerald-700' : porcentajeBateria >= 80 ? 'text-amber-700' : 'text-rose-700'}`}>
                    {porcentajeBateria}%
                  </span>
                )}
              </Label>
              <div className="relative">
                <Battery className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="porcentajeBateriaPermuta"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Ej: 85"
                  value={porcentajeBateria}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                    setPorcentajeBateria(val);
                  }}
                  className="text-xs h-9 pl-9 font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Campo Registro: Situación de liberación del iPhone */}
          <div className="pt-1">
            <Label htmlFor="registroPermuta" className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>Registro</span>
                <span className="text-slate-400 font-normal text-[11px]">(Situación de liberación del iPhone)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
            </Label>
            <Input
              id="registroPermuta"
              placeholder="Ej: Liberado de fábrica / Bloqueado AT&T / R-SIM / Homologado"
              value={registro}
              onChange={(e) => setRegistro(e.target.value)}
              className="text-xs h-9"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Información de uso interno para determinar si el equipo está liberado o asociado a un operador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Costo de Compra / Toma en Bolivianos */}
            <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
              <Label htmlFor="costoBsPermuta" className="text-xs font-bold text-blue-950 flex items-center justify-between">
                <span>Costo de Toma / Compra (Bs) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-blue-700 font-normal">Exclusivo en Bolivianos (Sin USD)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-blue-800">Bs</span>
                <Input
                  id="costoBsPermuta"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={costoBs}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setCostoBs(val);
                  }}
                  className="text-sm font-bold font-mono pl-9 h-9 bg-white border-blue-300 text-blue-950"
                  required
                />
              </div>
              <p className="text-[11px] text-blue-700">
                Monto acordado pagado al cliente por la entrega del teléfono.
              </p>
            </div>

            {/* Margen comercial base */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">
                  {reglaPermuta?.tipoAumento === 'ABSOLUTO'
                    ? `Margen Centralizado (+Bs ${reglaPermuta.valorBs}):`
                    : `Margen Centralizado (+${reglaPermuta?.valorBs ?? 15}%):`}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  + Bs {margenBrutoCalculado.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 mt-2">
                <span className="text-slate-600 font-medium">Subtotal con Margen:</span>
                <span className="font-mono font-bold text-emerald-700">
                  Bs {(numericCostoBs + margenBrutoCalculado).toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Calculado mediante la regla centralizada de márgenes para permutas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 3: GASTOS INICIALES DE INVERSIÓN Y REPARACIÓN */}
      <Card className="border-slate-200 bg-white shadow-subtle">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-800" />
              <CardTitle className="text-sm font-bold text-slate-900">
                3. Gastos de Reparación e Inversión sobre el Teléfono (Opcional)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Registra costos de repuestos, mantenimiento o puesta a punto aplicados a este iPhone.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddGasto}
            className="text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-slate-600" />
            Agregar Gasto
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          {gastos.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-500">
              <p className="font-medium text-slate-700">No se han registrado gastos iniciales para este teléfono.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Si requiere cambio de batería, pantalla o reparación, haz clic en &ldquo;Agregar Gasto&rdquo;. También podrás agregar más gastos posteriormente desde el inventario.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {gastos.map((gasto, index) => (
                <div
                  key={gasto.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="sm:col-span-3">
                    <Label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Concepto del Gasto #{index + 1} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: Cambio de pantalla OLED"
                      value={gasto.concepto}
                      onChange={(e) => handleUpdateGasto(gasto.id, 'concepto', e.target.value)}
                      className="text-xs h-8 bg-white"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Costo (Bs) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={gasto.costoBs}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        handleUpdateGasto(gasto.id, 'costoBs', val);
                      }}
                      className="text-xs h-8 font-mono font-bold bg-white"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Fecha Gasto <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={gasto.fechaGasto}
                      onChange={(e) => handleUpdateGasto(gasto.id, 'fechaGasto', e.target.value)}
                      className="text-xs h-8 bg-white font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Observación / Repuesto
                    </Label>
                    <Input
                      placeholder="Ej: Repuesto original Apple"
                      value={gasto.observacion}
                      onChange={(e) => handleUpdateGasto(gasto.id, 'observacion', e.target.value)}
                      className="text-xs h-8 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2 pt-4 sm:pt-0">
                    <input
                      type="checkbox"
                      id={`caja-${gasto.id}`}
                      checked={gasto.aplicoEnCaja}
                      onChange={(e) => handleUpdateGasto(gasto.id, 'aplicoEnCaja', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`caja-${gasto.id}`}
                      className="text-[11px] font-medium text-slate-700 cursor-pointer leading-tight"
                    >
                      Restar de Caja
                    </label>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveGasto(gasto.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 4: RESUMEN FINANCIERO Y CONFIRMACIÓN */}
      <Card className="border-slate-900 bg-slate-950 text-white shadow-xl">
        <CardContent className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Resumen Financiero de la Permuta
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                {reglaPermuta?.tipoAumento === 'ABSOLUTO'
                  ? `Margen Centralizado +Bs ${reglaPermuta.valorBs}`
                  : `Margen Centralizado +${reglaPermuta?.valorBs ?? 15}%`}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Costo de Compra:</span>
                <p className="font-mono font-bold text-sm text-slate-100">
                  Bs {numericCostoBs.toFixed(2)}
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Margen Estimado:</span>
                <p className="font-mono font-bold text-sm text-emerald-400">
                  + Bs {margenBrutoCalculado.toFixed(2)}
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Gastos Reparación:</span>
                <p className="font-mono font-bold text-sm text-amber-400">
                  + Bs {sumaGastosActivos.toFixed(2)}
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Inversión Total:</span>
                <p className="font-mono font-bold text-sm text-slate-200">
                  Bs {inversionTotalReal.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span>
                Fórmula de negocio: Margen centralizado de permuta ({reglaPermuta?.tipoAumento === 'ABSOLUTO' ? `+Bs ${reglaPermuta.valorBs}` : `+${reglaPermuta?.valorBs ?? 15}%`}) sobre costo de compra + 100% de gastos de reparación.
              </span>
            </p>
          </div>

          <div className="lg:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-slate-400 text-xs font-medium">Precio Sugerido al Público:</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                Bs {precioSugeridoCalculado.toFixed(2)}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 text-sm shadow-lg transition-transform active:scale-[0.99]"
            >
              {isSubmitting ? 'Registrando Permuta...' : 'Completar y Registrar Permuta'}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear proveedor minorista al vuelo */}
      <ModalCrearProveedorMinoristaInline
        isOpen={isModalMinoristaOpen}
        onClose={() => setIsModalMinoristaOpen(false)}
        onProveedorCreado={handleMinoristaCreado}
      />
    </form>
  );
}
