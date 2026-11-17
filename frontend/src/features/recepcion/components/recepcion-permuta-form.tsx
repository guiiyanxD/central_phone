'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

const CHIPS_MAC = ['iCloud Libre', 'Sin MDM', 'Sin Password EFI', 'Cargador Original', 'Batería Normal'];
const CHIPS_PHONE = ['Libre Fábrica', 'R-SIM', 'Batería Cambiada', 'Detalles de Uso'];
const CHIPS_OTHER = ['iCloud Libre', 'Sin MDM', 'Pantalla Original', 'Cargador Incluido'];

function getDeviceChips(isMac: boolean, isPhone: boolean): string[] {
  if (isMac) return CHIPS_MAC;
  if (isPhone) return CHIPS_PHONE;
  return CHIPS_OTHER;
}

function toggleDetalleChip(current: string, chip: string): string {
  const items = current
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const exists = items.some((item) => item.toLowerCase() === chip.toLowerCase());
  if (exists) {
    return items.filter((item) => item.toLowerCase() !== chip.toLowerCase()).join(', ');
  }
  return items.length > 0 ? `${items.join(', ')}, ${chip}` : chip;
}

function getDeviceFamily(modelo: any): { isPhone: boolean; isMac: boolean; isDesktop: boolean } {
  const tipo = String(modelo?.tipo || modelo?.tipoDispositivo?.nombre || '').toUpperCase();
  const nombre = String(modelo?.nombreModelo || '').toUpperCase();

  const isDesktop =
    ['DESKTOP', 'IMAC', 'MAC_MINI', 'MAC_STUDIO'].includes(tipo) ||
    nombre.includes('IMAC') ||
    nombre.includes('MAC MINI') ||
    nombre.includes('MAC STUDIO');

  const isMac =
    isDesktop ||
    ['MAC', 'MACBOOK', 'LAPTOP'].includes(tipo) ||
    nombre.includes('MACBOOK') ||
    nombre.includes('MAC');

  const isPhone =
    !isMac &&
    (['IPHONE', 'TELEFONO', 'SMARTPHONE', 'CELULAR'].includes(tipo) ||
      nombre.includes('IPHONE') ||
      nombre.includes('GALAXY') ||
      nombre.includes('SAMSUNG') ||
      nombre.includes('XIAOMI') ||
      nombre.includes('PIXEL') ||
      nombre.includes('MOTOROLA'));

  return { isPhone, isMac, isDesktop };
}

export interface GastoRow {
  id: string;
  concepto: string;
  costoBs: number | '';
  fechaGasto: string;
  observacion: string;
  aplicoEnCaja: boolean;
}

export interface DispositivoPermutaItem {
  id: string;
  modeloId: number;
  varianteId: number | null;
  numeroSerie: string;
  imei1: string;
  imei2: string;
  porcentajeBateria: number | '';
  detallesFisicos: string;
  costoBs: number | '';
  gastos: GastoRow[];
  isExpanded: boolean;
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
  // Catálogo completo disponible para permuta (multidispositivo: iPhone, Mac, iPad, Android, etc.)
  const disponiblesModelos = useMemo(() => {
    return modelos && modelos.length > 0 ? modelos : [];
  }, [modelos]);
  const iphoneModelos = disponiblesModelos; // Alias para compatibilidad

  const defaultModeloId = disponiblesModelos[0]?.id || 1;
  const defaultVarianteId = disponiblesModelos[0]?.variantes?.[0]?.id || null;

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

  const minoristaOptions: AutocompleteOption[] = useMemo(() => {
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

  const maxDateTimeLocal = useMemo(() => {
    return getNowDateTimeLocal();
  }, []);

  const esHistorico = useMemo(() => {
    if (!fechaIngreso) return false;
    const timeSelected = new Date(fechaIngreso).getTime();
    if (isNaN(timeSelected)) return false;
    return Date.now() - timeSelected > 60 * 60 * 1000;
  }, [fechaIngreso]);

  const handleSetAhora = () => {
    setFechaIngreso(getNowDateTimeLocal());
  };

  // Cargar regla de margen de permuta centralizada
  const [reglaPermuta, setReglaPermuta] = useState<ReglaMargenPrecio | null>(null);
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

  // Helper para crear un equipo en blanco
  const createDefaultItem = (idx = 1): DispositivoPermutaItem => {
    return {
      id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      modeloId: defaultModeloId,
      varianteId: defaultVarianteId,
      numeroSerie: '',
      imei1: '',
      imei2: '',
      porcentajeBateria: 85,
      detallesFisicos: '',
      costoBs: '',
      gastos: [],
      isExpanded: true,
    };
  };

  // Lista dinámica de equipos en la permuta
  const [equipos, setEquipos] = useState<DispositivoPermutaItem[]>([createDefaultItem()]);

  // Estados de validación y carga
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejadores de Equipos
  const handleAddEquipo = () => {
    setEquipos((prev) => [...prev, createDefaultItem(prev.length + 1)]);
  };

  const handleDuplicateEquipo = (index: number) => {
    const source = equipos[index];
    if (!source) return;
    const duplicated: DispositivoPermutaItem = {
      id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      modeloId: source.modeloId,
      varianteId: source.varianteId,
      numeroSerie: '',
      imei1: '',
      imei2: '',
      porcentajeBateria: source.porcentajeBateria,
      detallesFisicos: source.detallesFisicos,
      costoBs: source.costoBs,
      gastos: [],
      isExpanded: true,
    };
    setEquipos((prev) => [...prev, duplicated]);
  };

  const handleRemoveEquipo = (index: number) => {
    if (equipos.length <= 1) return;
    setEquipos((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleExpandEquipo = (index: number) => {
    setEquipos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isExpanded: !copy[index].isExpanded };
      return copy;
    });
  };

  const updateEquipo = (index: number, field: keyof DispositivoPermutaItem, val: any) => {
    setEquipos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === 'modeloId') {
        const m = iphoneModelos.find((mod) => mod.id === Number(val));
        copy[index].varianteId = m?.variantes?.[0]?.id || null;
      }
      return copy;
    });
  };

  // Manejo de Gastos por Equipo
  const handleAddGasto = (equipoIndex: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setEquipos((prev) => {
      const copy = [...prev];
      const target = copy[equipoIndex];
      const newGasto: GastoRow = {
        id: `gasto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        concepto: '',
        costoBs: '',
        fechaGasto: today,
        observacion: '',
        aplicoEnCaja: true,
      };
      copy[equipoIndex] = {
        ...target,
        gastos: [...target.gastos, newGasto],
      };
      return copy;
    });
  };

  const handleRemoveGasto = (equipoIndex: number, gastoId: string) => {
    setEquipos((prev) => {
      const copy = [...prev];
      const target = copy[equipoIndex];
      copy[equipoIndex] = {
        ...target,
        gastos: target.gastos.filter((g) => g.id !== gastoId),
      };
      return copy;
    });
  };

  const handleUpdateGasto = (
    equipoIndex: number,
    gastoId: string,
    field: keyof GastoRow,
    val: any
  ) => {
    setEquipos((prev) => {
      const copy = [...prev];
      const target = copy[equipoIndex];
      copy[equipoIndex] = {
        ...target,
        gastos: target.gastos.map((g) => (g.id === gastoId ? { ...g, [field]: val } : g)),
      };
      return copy;
    });
  };

  // Cálculos Consolidados Globales
  const totalEquipos = equipos.length;

  const totalCostoCompraBs = useMemo(() => {
    return equipos.reduce((sum, eq) => {
      const num = typeof eq.costoBs === 'number' ? Math.max(0, eq.costoBs) : 0;
      return sum + num;
    }, 0);
  }, [equipos]);

  const totalGastosBs = useMemo(() => {
    return equipos.reduce((sum, eq) => {
      const sumEq = eq.gastos.reduce((s, g) => {
        const num = typeof g.costoBs === 'number' ? Math.max(0, g.costoBs) : 0;
        return s + num;
      }, 0);
      return sum + sumEq;
    }, 0);
  }, [equipos]);

  const totalInversionLoteBs = useMemo(() => {
    return Math.round((totalCostoCompraBs + totalGastosBs) * 100) / 100;
  }, [totalCostoCompraBs, totalGastosBs]);

  const totalVentaProyectadaBs = useMemo(() => {
    return equipos.reduce((sum, eq) => {
      const numCosto = typeof eq.costoBs === 'number' ? Math.max(0, eq.costoBs) : 0;
      const sumGastos = eq.gastos.reduce((s, g) => {
        const num = typeof g.costoBs === 'number' ? Math.max(0, g.costoBs) : 0;
        return s + num;
      }, 0);
      return sum + calcularPrecioSugeridoBs(numCosto, reglaPermuta, sumGastos);
    }, 0);
  }, [equipos, reglaPermuta]);

  const totalMargenProyectadoBs = useMemo(() => {
    return Math.max(0, totalVentaProyectadaBs - totalInversionLoteBs);
  }, [totalVentaProyectadaBs, totalInversionLoteBs]);

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validaciones del Proveedor Minorista
    if (!nombreCliente.trim()) {
      setErrorMsg('El nombre del cliente/proveedor es obligatorio.');
      return;
    }
    if (!telefonoCliente.trim()) {
      setErrorMsg('El número de teléfono del cliente es obligatorio.');
      return;
    }

    if (equipos.length === 0) {
      setErrorMsg('Debes agregar al menos un dispositivo a la permuta.');
      return;
    }

    // 2. Validaciones de cada dispositivo y unicidad en memoria
    const imeisVistos = new Set<string>();
    const seriesVistas = new Set<string>();

    for (let i = 0; i < equipos.length; i++) {
      const eq = equipos[i];
      const eqNum = i + 1;
      const selectedModelo = disponiblesModelos.find((m) => m.id === Number(eq.modeloId));
      const { isPhone, isDesktop } = getDeviceFamily(selectedModelo);

      if (!eq.varianteId) {
        setErrorMsg(`El equipo #${eqNum} (${selectedModelo?.nombreModelo || 'Dispositivo'}) requiere que selecciones una variante (Color/Capacidad).`);
        return;
      }

      const imei1Clean = eq.imei1?.trim() || '';
      const serieInputClean = eq.numeroSerie?.trim() || '';

      if (isPhone) {
        if (!imei1Clean || imei1Clean.length < 14) {
          setErrorMsg(`El equipo #${eqNum} (${selectedModelo?.nombreModelo}) es un teléfono y requiere un IMEI 1 válido de al menos 14-15 dígitos numéricos.`);
          return;
        }
      } else {
        if (!serieInputClean && !imei1Clean) {
          setErrorMsg(`El equipo #${eqNum} (${selectedModelo?.nombreModelo}) requiere un número de serie válido.`);
          return;
        }
      }

      if (imei1Clean) {
        if (imeisVistos.has(imei1Clean)) {
          setErrorMsg(`El IMEI 1 '${imei1Clean}' del equipo #${eqNum} está repetido dentro del mismo lote.`);
          return;
        }
        imeisVistos.add(imei1Clean);
      }

      if (eq.imei2?.trim()) {
        const imei2Clean = eq.imei2.trim();
        if (imeisVistos.has(imei2Clean)) {
          setErrorMsg(`El IMEI 2 '${imei2Clean}' del equipo #${eqNum} ya fue registrado en este lote.`);
          return;
        }
        imeisVistos.add(imei2Clean);
      }

      // Serie (autogeneración con prefijo SN- si es teléfono y está en blanco)
      const serieClean = (serieInputClean || (imei1Clean ? `SN-${imei1Clean}` : '')).toUpperCase();
      if (serieClean) {
        if (seriesVistas.has(serieClean)) {
          setErrorMsg(`El número de serie '${serieClean}' del equipo #${eqNum} está repetido en este lote.`);
          return;
        }
        seriesVistas.add(serieClean);
      }

      if (isPhone) {
        if (eq.porcentajeBateria === '' || eq.porcentajeBateria < 1 || eq.porcentajeBateria > 100) {
          setErrorMsg(`El porcentaje de salud de batería del equipo #${eqNum} debe estar entre 1% y 100%.`);
          return;
        }
      } else if (!isDesktop && eq.porcentajeBateria !== '' && (eq.porcentajeBateria < 1 || eq.porcentajeBateria > 100)) {
        setErrorMsg(`El porcentaje de salud de batería del equipo #${eqNum} debe estar entre 1% y 100%.`);
        return;
      }

      const numCosto = typeof eq.costoBs === 'number' ? eq.costoBs : 0;
      if (numCosto <= 0) {
        setErrorMsg(`El costo de compra/toma en Bs del equipo #${eqNum} debe ser mayor a 0.`);
        return;
      }

      // Validar gastos de este equipo
      for (let gIdx = 0; gIdx < eq.gastos.length; gIdx++) {
        const g = eq.gastos[gIdx];
        if (!g.concepto.trim()) {
          setErrorMsg(`El gasto #${gIdx + 1} del equipo #${eqNum} requiere una descripción o concepto.`);
          return;
        }
        if (typeof g.costoBs !== 'number' || g.costoBs <= 0) {
          setErrorMsg(`El gasto #${gIdx + 1} (${g.concepto}) del equipo #${eqNum} debe tener un costo mayor a 0.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const dispositivosPayload = equipos.map((eq) => {
        const selectedModelo = disponiblesModelos.find((m) => m.id === Number(eq.modeloId));
        const { isDesktop } = getDeviceFamily(selectedModelo);
        const numCosto = typeof eq.costoBs === 'number' ? Math.max(0, eq.costoBs) : 0;
        const imei1Final = eq.imei1?.trim() || undefined;
        const serieFinal = (eq.numeroSerie?.trim() || (imei1Final ? `SN-${imei1Final}` : '')).toUpperCase();
        const batFinal = isDesktop
          ? undefined
          : eq.porcentajeBateria !== ''
          ? Number(eq.porcentajeBateria)
          : undefined;

        return {
          varianteId: Number(eq.varianteId),
          numeroSerie: serieFinal,
          imei1: imei1Final,
          imei2: eq.imei2?.trim() || undefined,
          porcentajeBateria: batFinal,
          detallesFisicos: eq.detallesFisicos?.trim() || undefined,
          costoBs: numCosto,
          gastosIniciales: eq.gastos.map((g) => ({
            concepto: g.concepto.trim(),
            costoBs: Number(g.costoBs),
            fechaGasto: g.fechaGasto
              ? new Date(`${g.fechaGasto}T12:00:00`).toISOString()
              : new Date().toISOString(),
            observacion: g.observacion?.trim() || undefined,
            aplicoEnCaja: g.aplicoEnCaja,
          })),
        };
      });

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
        dispositivos: dispositivosPayload,
        // Compatibilidad hacia atrás si un consumidor legacy espera el primer dispositivo
        dispositivo: dispositivosPayload[0],
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
            Identificación de la persona particular que entrega el o los equipos como permuta.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Selector con búsqueda de Proveedor Minorista */}
          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label
                htmlFor="buscarMinoristaInput"
                className="text-xs font-bold text-purple-950 flex items-center gap-1.5 mb-0"
              >
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
                placeholder="Ej: Lote recibido con fundas y cargadores originales..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 2: LISTA DE DISPOSITIVOS RECIBIDOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. Especificaciones de los Dispositivos Recibidos ({totalEquipos})
              </h2>
              <p className="text-xs text-slate-500">
                Detalla cada equipo (iPhone, Mac, iPad, Android, etc.) con sus identificadores de hardware y gastos de reparación.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEquipo}
            className="text-xs h-8 gap-1.5 text-purple-700 border-purple-300 hover:bg-purple-50 font-semibold"
          >
            <Plus className="h-3.5 w-3.5 text-purple-700" />
            <span>Agregar otro Dispositivo</span>
          </Button>
        </div>

        {equipos.map((eq, index) => {
          const selectedModelo = disponiblesModelos.find((m) => m.id === Number(eq.modeloId));
          const { isPhone, isMac, isDesktop } = getDeviceFamily(selectedModelo);
          const variantesDisponibles = selectedModelo?.variantes || [];
          const selectedVariante = variantesDisponibles.find((v: any) => v.id === Number(eq.varianteId));

          const numCosto = typeof eq.costoBs === 'number' ? Math.max(0, eq.costoBs) : 0;
          const sumaGastosEq = eq.gastos.reduce((sum, g) => {
            const val = typeof g.costoBs === 'number' ? Math.max(0, g.costoBs) : 0;
            return sum + val;
          }, 0);

          const precioSugeridoEq = calcularPrecioSugeridoBs(numCosto, reglaPermuta, sumaGastosEq);
          const inversionTotalEq = Math.round((numCosto + sumaGastosEq) * 100) / 100;
          const margenBrutoEq = Math.max(0, precioSugeridoEq - inversionTotalEq);

          return (
            <Card
              key={eq.id}
              className="border-slate-200 bg-white shadow-subtle overflow-hidden transition-all duration-150"
            >
              {/* Encabezado de la tarjeta del equipo */}
              <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate block">
                      {selectedModelo?.nombreModelo || 'Dispositivo'}
                      {selectedVariante ? ` - ${selectedVariante.color} (${selectedVariante.capacidadGb >= 1024 ? `${selectedVariante.capacidadGb / 1024}TB` : `${selectedVariante.capacidadGb}GB`})` : ''}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {eq.imei1 ? `IMEI: ${eq.imei1}` : (eq.numeroSerie ? `Serie: ${eq.numeroSerie}` : 'Sin identificador')}
                      {numCosto > 0 ? ` • Bs ${numCosto.toFixed(2)}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateEquipo(index)}
                    title="Duplicar modelo y especificaciones de este equipo"
                    className="h-7 text-xs px-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 font-medium gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Duplicar</span>
                  </Button>

                  {equipos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEquipo(index)}
                      title="Eliminar este equipo de la permuta"
                      className="h-7 text-xs px-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-medium gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpandEquipo(index)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  >
                    {eq.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Contenido desplegable de la tarjeta */}
              {eq.isExpanded && (
                <CardContent className="p-4 sm:p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Modelo Dispositivo */}
                    <div>
                      <Label htmlFor={`modelo-${eq.id}`} className="text-xs font-semibold text-slate-700 mb-1 block">
                        Modelo del Dispositivo <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        id={`modelo-${eq.id}`}
                        value={String(eq.modeloId)}
                        onChange={(e) => updateEquipo(index, 'modeloId', Number(e.target.value))}
                        className="text-xs h-9 font-semibold"
                      >
                        {disponiblesModelos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombreModelo}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Variante */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor={`variante-${eq.id}`} className="text-xs font-semibold text-slate-700">
                          Variante <span className="text-rose-500">*</span>
                        </Label>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInlineVarianteModal((newVar) => {
                              updateEquipo(index, 'varianteId', newVar.id);
                            })
                          }
                          className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" /> Crear
                        </button>
                      </div>
                      <Select
                        id={`variante-${eq.id}`}
                        value={eq.varianteId ? String(eq.varianteId) : ''}
                        onChange={(e) => updateEquipo(index, 'varianteId', Number(e.target.value))}
                        className="text-xs h-9"
                      >
                        {variantesDisponibles.length === 0 ? (
                          <option value="">(Sin variantes)</option>
                        ) : (
                          variantesDisponibles.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.color} - {v.capacidadGb >= 1024 ? `${v.capacidadGb / 1024}TB` : `${v.capacidadGb}GB`} ({v.tipoSim || 'SIM'})
                            </option>
                          ))
                        )}
                      </Select>
                    </div>

                    {/* IMEI 1 */}
                    <div>
                      <Label htmlFor={`imei1-${eq.id}`} className="text-xs font-semibold text-slate-700 mb-1 block">
                        {isPhone ? (
                          <>IMEI 1 <span className="text-rose-500">*</span></>
                        ) : isMac ? (
                          <>IMEI 1 <span className="text-slate-400 font-normal">(No aplica a Mac Wi-Fi)</span></>
                        ) : (
                          <>IMEI 1 <span className="text-slate-400 font-normal">(Opcional Celular)</span></>
                        )}
                      </Label>
                      <Input
                        id={`imei1-${eq.id}`}
                        placeholder={isMac ? "N/A en Mac Wi-Fi" : "35..."}
                        maxLength={16}
                        value={eq.imei1}
                        onChange={(e) => updateEquipo(index, 'imei1', e.target.value)}
                        className="text-xs h-9 font-mono"
                        required={isPhone}
                      />
                    </div>

                    {/* IMEI 2 (Opcional) */}
                    <div>
                      <Label htmlFor={`imei2-${eq.id}`} className="text-xs font-semibold text-slate-700 mb-1 block">
                        IMEI 2 <span className="text-slate-400 font-normal">(Opcional)</span>
                      </Label>
                      <Input
                        id={`imei2-${eq.id}`}
                        placeholder={isMac ? "N/A" : "35..."}
                        maxLength={16}
                        value={eq.imei2}
                        onChange={(e) => updateEquipo(index, 'imei2', e.target.value)}
                        className="text-xs h-9 font-mono"
                      />
                    </div>

                    {/* Número de Serie */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor={`serie-${eq.id}`} className="text-xs font-semibold text-slate-700">
                          N° de Serie {!isPhone && <span className="text-rose-500">*</span>}
                        </Label>
                        {isPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              if (eq.imei1) {
                                updateEquipo(index, 'numeroSerie', `SN-${eq.imei1.trim()}`);
                              }
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            Autogenerar
                          </button>
                        )}
                      </div>
                      <Input
                        id={`serie-${eq.id}`}
                        placeholder={isMac ? "Ej: C02G41ABQ05D" : "F2L..."}
                        value={eq.numeroSerie}
                        onChange={(e) => updateEquipo(index, 'numeroSerie', e.target.value)}
                        className="text-xs h-9 font-mono uppercase"
                        required={!isPhone && !eq.imei1}
                      />
                    </div>

                    {/* Salud de Batería */}
                    <div>
                      <Label htmlFor={`bateria-${eq.id}`} className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Battery className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          Batería (%) {isPhone && <span className="text-rose-500">*</span>}
                          {isDesktop && <span className="text-slate-400 font-normal"> (N/A)</span>}
                        </span>
                      </Label>
                      <Input
                        id={`bateria-${eq.id}`}
                        type="number"
                        min={1}
                        max={100}
                        placeholder={isDesktop ? "N/A" : "85"}
                        disabled={isDesktop}
                        value={isDesktop ? '' : eq.porcentajeBateria}
                        onChange={(e) =>
                          updateEquipo(
                            index,
                            'porcentajeBateria',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="text-xs h-9 font-mono"
                        required={isPhone}
                      />
                    </div>

                    {/* Costo de Toma / Compra */}
                    <div>
                      <Label htmlFor={`costo-${eq.id}`} className="text-xs font-semibold text-purple-950 mb-1 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-purple-700" />
                        <span>Costo de Toma (Bs) <span className="text-rose-500">*</span></span>
                      </Label>
                      <Input
                        id={`costo-${eq.id}`}
                        type="number"
                        min={1}
                        step="any"
                        placeholder="Ej: 3500"
                        value={eq.costoBs}
                        onChange={(e) =>
                          updateEquipo(
                            index,
                            'costoBs',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="text-xs h-9 font-mono font-bold text-slate-900 bg-purple-50/30 border-purple-200"
                        required
                      />
                    </div>

                    {/* Registro / Situación de Liberación con Chips */}
                    <div className="lg:col-span-2">
                      <Label htmlFor={`registro-${eq.id}`} className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                        <span>Registro <span className="text-slate-400 font-normal">(Operador / Auditoría)</span></span>
                      </Label>
                      <Input
                        id={`registro-${eq.id}`}
                        placeholder={isMac ? "Ej: iCloud Libre, Sin MDM, Batería Normal..." : "Liberado de fábrica..."}
                        value={eq.detallesFisicos}
                        onChange={(e) => updateEquipo(index, 'detallesFisicos', e.target.value)}
                        className="text-xs h-9"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {getDeviceChips(isMac, isPhone).map((chip) => {
                          const isSelected = (eq.detallesFisicos || '')
                            .toLowerCase()
                            .includes(chip.toLowerCase());
                          return (
                            <button
                              key={chip}
                              type="button"
                              onClick={() =>
                                updateEquipo(
                                  index,
                                  'detallesFisicos',
                                  toggleDetalleChip(eq.detallesFisicos || '', chip)
                                )
                              }
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? `✓ ${chip}` : `+ ${chip}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Subsección: Gastos de Puesta a Punto de este Equipo */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-slate-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Gastos de Reparación / Puesta a Punto (Equipo #{index + 1})
                        </span>
                        {eq.gastos.length > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-slate-100">
                            {eq.gastos.length} gasto(s)
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddGasto(index)}
                        className="h-6 text-[11px] px-2 text-purple-700 hover:text-purple-900 hover:bg-purple-50 font-semibold gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Agregar Gasto</span>
                      </Button>
                    </div>

                    {eq.gastos.length > 0 && (
                      <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                        {eq.gastos.map((g, gIdx) => (
                          <div
                            key={g.id}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs"
                          >
                            <div className="sm:col-span-4">
                              <Input
                                placeholder="Concepto (ej: Cambio de Pantalla)"
                                value={g.concepto}
                                onChange={(e) =>
                                  handleUpdateGasto(index, g.id, 'concepto', e.target.value)
                                }
                                className="text-xs h-8"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <Input
                                type="number"
                                min={0.01}
                                step="any"
                                placeholder="Costo Bs"
                                value={g.costoBs}
                                onChange={(e) =>
                                  handleUpdateGasto(
                                    index,
                                    g.id,
                                    'costoBs',
                                    e.target.value === '' ? '' : Number(e.target.value)
                                  )
                                }
                                className="text-xs h-8 font-mono font-semibold"
                                required
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <Input
                                type="date"
                                value={g.fechaGasto}
                                onChange={(e) =>
                                  handleUpdateGasto(index, g.id, 'fechaGasto', e.target.value)
                                }
                                className="text-xs h-8 font-mono"
                              />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-1.5">
                              <label className="text-[11px] text-slate-600 flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={g.aplicoEnCaja}
                                  onChange={(e) =>
                                    handleUpdateGasto(index, g.id, 'aplicoEnCaja', e.target.checked)
                                  }
                                  className="h-3.5 w-3.5 rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span>En Caja</span>
                              </label>
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveGasto(index, g.id)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumen Financiero Individual de este Equipo */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Costo Compra</span>
                        <span className="font-mono font-bold text-slate-800">
                          Bs {numCosto.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Reparaciones</span>
                        <span className="font-mono font-semibold text-slate-700">
                          + Bs {sumaGastosEq.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Inversión Real</span>
                        <span className="font-mono font-bold text-slate-900">
                          Bs {inversionTotalEq.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Margen Est. ({reglaPermuta?.valorBs || 15}%)</span>
                        <span className="font-mono font-semibold text-emerald-700">
                          Bs {margenBrutoEq.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-medium text-xs">Precio Sugerido:</span>
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs px-2.5 py-0.5">
                        Bs {precioSugeridoEq.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Botón para agregar otro Dispositivo */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddEquipo}
          className="w-full h-11 border-dashed border-2 border-purple-300 bg-purple-50/30 hover:bg-purple-50 text-purple-800 font-bold text-xs flex items-center justify-center gap-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4 text-purple-700" />
          <span>+ Agregar otro Dispositivo a esta permuta</span>
        </Button>
      </div>

      {/* SECCIÓN 3: PANEL CONSOLIDADO GLOBAL DE TOTALES */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/60 via-white to-purple-50/40 shadow-card">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Métricas Consolidadas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Dispositivos</span>
                <span className="text-base font-bold text-purple-950 font-mono">
                  {totalEquipos} {totalEquipos === 1 ? 'dispositivo' : 'dispositivos'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Compra Lote</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  Bs {totalCostoCompraBs.toFixed(2)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Gastos Puesta Punto</span>
                <span className="text-base font-bold text-slate-700 font-mono">
                  Bs {totalGastosBs.toFixed(2)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Inversión Total</span>
                <span className="text-base font-bold text-purple-700 font-mono">
                  Bs {totalInversionLoteBs.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Acción de Confirmación */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-500 block">Venta Sugerida Total:</span>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  Bs {totalVentaProyectadaBs.toFixed(2)}
                </span>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 px-6 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-2 rounded-xl shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando lote de permutas...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4" />
                    <span>Registrar Permuta ({totalEquipos} {totalEquipos === 1 ? 'dispositivo' : 'dispositivos'})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Crear Proveedor Minorista en línea */}
      {isModalMinoristaOpen && (
        <ModalCrearProveedorMinoristaInline
          isOpen={isModalMinoristaOpen}
          onClose={() => setIsModalMinoristaOpen(false)}
          onSuccess={handleMinoristaCreado}
          telefonoInicial={telefonoCliente}
          nombreInicial={nombreCliente}
        />
      )}
    </form>
  );
}
