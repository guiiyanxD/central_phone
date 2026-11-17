'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Battery, DollarSign, AlertCircle, Check, ScanLine, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { PermutaTradeInDto } from '@/lib/api/ventas.api';

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

export interface PermutaSummaryItem {
  modeloNombre: string;
  varianteDetalle: string;
  imei1: string;
  valorTomaBs: number;
}

export interface PermutaFormItem {
  id: string;
  modeloId: number;
  varianteId: number | null;
  imei1: string;
  imei2?: string;
  numeroSerie?: string;
  porcentajeBateria: number | '';
  valorTomaBs: number | '';
  detallesFisicos?: string;
}

interface ModalPermutaCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  totalBs: number;
  initialPermuta?: PermutaTradeInDto | null;
  initialPermutas?: PermutaTradeInDto[];
  modelos: any[];
  onApplyPermuta?: (
    permuta: PermutaTradeInDto,
    summary: PermutaSummaryItem
  ) => void;
  onApplyPermutas?: (
    permutas: PermutaTradeInDto[],
    summaries: PermutaSummaryItem[]
  ) => void;
}

export function ModalPermutaCheckout({
  isOpen,
  onClose,
  totalBs,
  initialPermuta,
  initialPermutas,
  modelos,
  onApplyPermuta,
  onApplyPermutas,
}: ModalPermutaCheckoutProps) {
  // Catálogo completo disponible para permuta (multidispositivo: iPhone, Mac, iPad, Android, etc.)
  const disponiblesModelos = React.useMemo(() => {
    return modelos && modelos.length > 0 ? modelos : [];
  }, [modelos]);
  const iphoneModelos = disponiblesModelos; // Alias para compatibilidad

  const defaultModeloId = disponiblesModelos[0]?.id || 1;

  const [equipos, setEquipos] = useState<PermutaFormItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const imeiInputRef = useRef<HTMLInputElement>(null);

  const modeloOptions: SearchableSelectOption[] = React.useMemo(() => {
    return iphoneModelos.map((m) => ({
      value: m.id,
      label: m.nombreModelo,
      badge: `${m.variantes?.length || 0} var.`,
    }));
  }, [iphoneModelos]);

  const createDefaultItem = (idx = 1): PermutaFormItem => ({
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    modeloId: defaultModeloId,
    varianteId: iphoneModelos[0]?.variantes?.[0]?.id || null,
    imei1: '',
    imei2: '',
    numeroSerie: '',
    porcentajeBateria: 85,
    valorTomaBs: '',
    detallesFisicos: '',
  });

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialPermutas && initialPermutas.length > 0) {
        const loaded: PermutaFormItem[] = initialPermutas.map((p, idx) => {
          const foundMod = iphoneModelos.find((m) =>
            m.variantes?.some((v: any) => v.id === p.varianteId)
          );
          return {
            id: `init-${idx}-${Date.now()}`,
            modeloId: foundMod ? foundMod.id : defaultModeloId,
            varianteId: p.varianteId,
            imei1: p.imei1 || '',
            imei2: p.imei2 || '',
            numeroSerie: p.numeroSerie || '',
            porcentajeBateria: typeof p.porcentajeBateria === 'number' ? p.porcentajeBateria : 85,
            valorTomaBs: (typeof p.valorTomaBs === 'number' && !isNaN(p.valorTomaBs)) ? p.valorTomaBs : '',
            detallesFisicos: p.detallesFisicos || '',
          };
        });
        setEquipos(loaded);
      } else if (initialPermuta) {
        const foundMod = iphoneModelos.find((m) =>
          m.variantes?.some((v: any) => v.id === initialPermuta.varianteId)
        );
        setEquipos([
          {
            id: `init-0-${Date.now()}`,
            modeloId: foundMod ? foundMod.id : defaultModeloId,
            varianteId: initialPermuta.varianteId,
            imei1: initialPermuta.imei1 || '',
            imei2: initialPermuta.imei2 || '',
            numeroSerie: initialPermuta.numeroSerie || '',
            porcentajeBateria: typeof initialPermuta.porcentajeBateria === 'number' ? initialPermuta.porcentajeBateria : 85,
            valorTomaBs: (typeof initialPermuta.valorTomaBs === 'number' && !isNaN(initialPermuta.valorTomaBs)) ? initialPermuta.valorTomaBs : '',
            detallesFisicos: initialPermuta.detallesFisicos || '',
          },
        ]);
      } else {
        setEquipos([createDefaultItem()]);
      }

      setTimeout(() => {
        imeiInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialPermuta, initialPermutas, iphoneModelos, defaultModeloId]);

  const updateEquipo = (index: number, field: keyof PermutaFormItem, value: any) => {
    setEquipos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      // Si cambia el modelo, reasignar primera variante disponible de ese modelo
      if (field === 'modeloId') {
        const m = iphoneModelos.find((mod) => mod.id === Number(value));
        copy[index].varianteId = m?.variantes?.[0]?.id || null;
      }
      return copy;
    });
  };

  const handleAddEquipo = () => {
    setEquipos((prev) => [...prev, createDefaultItem(prev.length + 1)]);
  };

  const handleRemoveEquipo = (index: number) => {
    if (equipos.length <= 1) return;
    setEquipos((prev) => prev.filter((_, i) => i !== index));
  };

  // Cálculos financieros globales
  const totalCreditoPermuta = equipos.reduce(
    (sum, eq) => sum + (typeof eq.valorTomaBs === 'number' ? eq.valorTomaBs : 0),
    0
  );
  const saldoRestante = Math.max(0, totalBs - totalCreditoPermuta);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const imeisSet = new Set<string>();
    const permutasDto: PermutaTradeInDto[] = [];
    const summariesDto: PermutaSummaryItem[] = [];

    for (let idx = 0; idx < equipos.length; idx++) {
      const eq = equipos[idx];
      const pos = idx + 1;
      const mod = iphoneModelos.find((m) => m.id === Number(eq.modeloId));
      const { isPhone, isDesktop } = getDeviceFamily(mod);

      if (!eq.varianteId) {
        setErrorMsg(`Equipo #${pos}: Debes seleccionar la variante (color y almacenamiento).`);
        return;
      }

      const cleanImei1 = eq.imei1?.trim() || '';
      const cleanSerie = eq.numeroSerie?.trim() || '';

      if (isPhone) {
        if (!cleanImei1 || cleanImei1.length < 14) {
          setErrorMsg(`Equipo #${pos} (${mod?.nombreModelo || 'Teléfono'}): El IMEI 1 es obligatorio y debe tener al menos 14 dígitos.`);
          return;
        }
      } else {
        if (!cleanSerie && !cleanImei1) {
          setErrorMsg(`Equipo #${pos} (${mod?.nombreModelo || 'Dispositivo'}): Requiere un número de serie válido.`);
          return;
        }
      }

      if (cleanImei1) {
        if (imeisSet.has(cleanImei1)) {
          setErrorMsg(`El IMEI 1 '${cleanImei1}' está duplicado entre los equipos en permuta.`);
          return;
        }
        imeisSet.add(cleanImei1);
      }

      const numBat = typeof eq.porcentajeBateria === 'number' ? eq.porcentajeBateria : 0;
      if (isPhone) {
        if (numBat < 1 || numBat > 100) {
          setErrorMsg(`Equipo #${pos}: La condición de batería debe estar entre 1% y 100%.`);
          return;
        }
      } else if (!isDesktop && eq.porcentajeBateria !== '' && (numBat < 1 || numBat > 100)) {
        setErrorMsg(`Equipo #${pos}: La condición de batería debe estar entre 1% y 100%.`);
        return;
      }

      const numValor = typeof eq.valorTomaBs === 'number' ? eq.valorTomaBs : 0;
      if (numValor <= 0) {
        setErrorMsg(`Equipo #${pos}: El valor de toma debe ser mayor a 0 Bs.`);
        return;
      }

      const selVar = mod?.variantes?.find((v: any) => v.id === eq.varianteId);
      const varianteDetalle = selVar
        ? `${selVar.color} • ${selVar.capacidadGb > 0 ? `${selVar.capacidadGb}GB` : ''} ${selVar.tipoSim || ''}`.trim()
        : 'Variante';

      const serieFinal = (cleanSerie || (cleanImei1 ? `SN-${cleanImei1}` : '')).toUpperCase();
      const batFinal = isDesktop
        ? undefined
        : typeof eq.porcentajeBateria === 'number'
        ? eq.porcentajeBateria
        : undefined;

      permutasDto.push({
        varianteId: eq.varianteId,
        imei1: cleanImei1 || undefined,
        imei2: eq.imei2?.trim() || undefined,
        numeroSerie: serieFinal || undefined,
        porcentajeBateria: batFinal,
        detallesFisicos: eq.detallesFisicos?.trim() || undefined,
        valorTomaBs: numValor,
      });

      summariesDto.push({
        modeloNombre: mod?.nombreModelo || 'Dispositivo',
        varianteDetalle,
        imei1: cleanImei1 || (serieFinal ? `SN: ${serieFinal}` : 'N/A'),
        valorTomaBs: numValor,
      });
    }

    if (totalCreditoPermuta > totalBs) {
      setErrorMsg(
        `El valor total de permuta (Bs ${totalCreditoPermuta.toFixed(2)}) no puede superar el total de la compra (Bs ${totalBs.toFixed(2)}).`
      );
      return;
    }

    if (onApplyPermutas) {
      onApplyPermutas(permutasDto, summariesDto);
    } else if (onApplyPermuta && permutasDto.length > 0) {
      onApplyPermuta(permutasDto[0], summariesDto[0]);
    }
    onClose();
  };

  const isSubmitDisabled =
    equipos.length === 0 ||
    totalCreditoPermuta <= 0 ||
    totalCreditoPermuta > totalBs ||
    equipos.some((eq) => {
      const mod = iphoneModelos.find((m) => m.id === Number(eq.modeloId));
      const { isPhone } = getDeviceFamily(mod);
      const hasIdentifier = isPhone
        ? Boolean(eq.imei1?.trim())
        : Boolean(eq.numeroSerie?.trim() || eq.imei1?.trim());
      return !hasIdentifier || !eq.varianteId || !eq.valorTomaBs;
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <RefreshCw className="h-5 w-5 text-emerald-600" />
          <span>Aplicar Permuta (Trade-In) en POS</span>
        </div>
      }
      description="Registra uno o más dispositivos recibidos del cliente como parte de pago de la venta actual."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Banner de Saldo y Valor de Toma */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center sticky top-0 z-20 backdrop-blur-md">
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-700 block">Total Compra</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              Bs {totalBs.toFixed(2)}
            </span>
          </div>
          <div className="border-x border-slate-200 px-1">
            <span className="text-[10px] font-semibold uppercase text-emerald-800 block">
              Crédito Permuta ({equipos.length} eq.)
            </span>
            <span className="text-sm font-bold font-mono text-emerald-700">
              - Bs {totalCreditoPermuta.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-700 block">Saldo a Cobrar</span>
            <span className="text-sm font-bold font-mono text-blue-700">
              Bs {saldoRestante.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Lista de Equipos en Permuta */}
        <div className="space-y-3.5">
          {equipos.map((eq, idx) => {
            const currentModelo = iphoneModelos.find((m) => m.id === Number(eq.modeloId));
            const { isPhone, isMac, isDesktop } = getDeviceFamily(currentModelo);
            const variantes = currentModelo?.variantes || [];
            const varianteOpts: SearchableSelectOption[] = variantes.map((v: any) => {
              const cap = v.capacidadGb > 0 ? `${v.capacidadGb}GB` : 'N/A';
              return {
                value: v.id,
                label: `${v.color} - ${cap}`,
                sublabel: v.tipoSim ? `SIM: ${v.tipoSim}` : undefined,
                badge: cap,
              };
            });

            return (
              <div
                key={eq.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 relative group"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Dispositivo en Permuta #{idx + 1}
                    </span>
                  </div>
                  {equipos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEquipo(idx)}
                      className="h-7 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2"
                      title="Eliminar este equipo"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Quitar
                    </Button>
                  )}
                </div>

                {/* Modelo y Variante */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label
                      htmlFor={`permuta-modelo-${idx}`}
                      className="text-xs font-semibold text-slate-800"
                    >
                      Modelo del Dispositivo *
                    </Label>
                    <SearchableSelect
                      id={`permuta-modelo-${idx}`}
                      value={eq.modeloId}
                      onChange={(val) => updateEquipo(idx, 'modeloId', Number(val))}
                      placeholder="Buscar modelo..."
                      searchPlaceholder="Escribe modelo..."
                      options={modeloOptions}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor={`permuta-variante-${idx}`}
                      className="text-xs font-semibold text-slate-800"
                    >
                      Variante (Color / Almacenamiento) *
                    </Label>
                    <SearchableSelect
                      id={`permuta-variante-${idx}`}
                      value={eq.varianteId || ''}
                      onChange={(val) => updateEquipo(idx, 'varianteId', Number(val))}
                      placeholder="Buscar variante..."
                      searchPlaceholder="Escribe color o GB..."
                      options={varianteOpts}
                      disabled={variantes.length === 0}
                      emptyMessage="Sin variantes registradas"
                    />
                  </div>
                </div>

                {/* Identificadores: IMEI 1, Serie y Batería */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={idx === 0 ? 'permuta-imei1' : `permuta-imei1-${idx}`}
                        className="text-xs font-semibold text-slate-800 flex items-center gap-1"
                      >
                        <ScanLine className="h-3.5 w-3.5 text-slate-500" />
                        {isPhone ? 'IMEI 1 (Lector Barcode) *' : isMac ? 'IMEI 1 (No aplica en Mac Wi-Fi)' : 'IMEI 1 (Opcional)'}
                      </Label>
                      <span className="text-[10px] text-slate-700">{isPhone ? '14-17 dígitos' : 'Opcional'}</span>
                    </div>
                    <Input
                      id={idx === 0 ? 'permuta-imei1' : `permuta-imei1-${idx}`}
                      ref={idx === 0 ? imeiInputRef : undefined}
                      value={eq.imei1}
                      onChange={(e) =>
                        updateEquipo(idx, 'imei1', e.target.value.replace(/[^a-zA-Z0-9]/g, ''))
                      }
                      placeholder={isMac ? "N/A en Mac Wi-Fi" : "Escanea o digita IMEI 1..."}
                      maxLength={17}
                      className="text-xs h-9 font-mono font-bold bg-white"
                      required={isPhone}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor={idx === 0 ? 'permuta-bateria' : `permuta-bateria-${idx}`}
                      className="text-xs font-semibold text-slate-800 flex items-center gap-1"
                    >
                      <Battery className="h-3.5 w-3.5 text-slate-500" />
                      Batería % {isPhone && '*'} {isDesktop && '(N/A)'}
                    </Label>
                    <Input
                      id={idx === 0 ? 'permuta-bateria' : `permuta-bateria-${idx}`}
                      type="number"
                      min={1}
                      max={100}
                      disabled={isDesktop}
                      value={isDesktop ? '' : eq.porcentajeBateria}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateEquipo(idx, 'porcentajeBateria', isNaN(val) ? '' : val);
                      }}
                      placeholder={isDesktop ? "N/A" : "85"}
                      className="text-xs h-9 font-mono text-center font-bold bg-white"
                      required={isPhone}
                    />
                  </div>
                </div>

                {/* Número de Serie (Mandatorio en Mac / no teléfonos si no hay IMEI) */}
                {!isPhone && (
                  <div className="space-y-1">
                    <Label
                      htmlFor={`permuta-serie-${idx}`}
                      className="text-xs font-semibold text-slate-800"
                    >
                      N° de Serie *
                    </Label>
                    <Input
                      id={`permuta-serie-${idx}`}
                      value={eq.numeroSerie || ''}
                      onChange={(e) => updateEquipo(idx, 'numeroSerie', e.target.value.toUpperCase())}
                      placeholder="Ej: C02G41ABQ05D"
                      className="text-xs h-9 font-mono uppercase bg-white"
                      required={!eq.imei1}
                    />
                  </div>
                )}

                {/* Valor de Toma Acordado */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={idx === 0 ? 'permuta-valor' : `permuta-valor-${idx}`}
                      className="text-xs font-bold text-slate-900 flex items-center gap-1"
                    >
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      Valor de Toma Acordado (Crédito Bs) *
                    </Label>
                    <span className="text-[10px] text-slate-700">
                      Tope compra: Bs {totalBs.toFixed(2)}
                    </span>
                  </div>
                  <Input
                    id={idx === 0 ? 'permuta-valor' : `permuta-valor-${idx}`}
                    type="number"
                    step="0.50"
                    min="1"
                    max={totalBs}
                    value={eq.valorTomaBs}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateEquipo(idx, 'valorTomaBs', isNaN(val) ? '' : val);
                    }}
                    placeholder="Ej: 2500"
                    className="text-sm h-10 font-mono font-bold text-emerald-700 bg-emerald-50/50 border-emerald-300 focus-visible:ring-emerald-500"
                    required
                  />
                </div>

                {/* Detalles Físicos Opcionales con Chips de Auditoría */}
                <div className="space-y-1">
                  <Label
                    htmlFor={`permuta-detalles-${idx}`}
                    className="text-[11px] font-medium text-slate-600"
                  >
                    Detalles Físicos / Observaciones (Opcional)
                  </Label>
                  <Input
                    id={`permuta-detalles-${idx}`}
                    value={eq.detallesFisicos || ''}
                    onChange={(e) => updateEquipo(idx, 'detallesFisicos', e.target.value)}
                    placeholder={isMac ? "Ej: iCloud Libre, Sin MDM, Batería Normal" : "Ej: Pantalla original sin rayas, detalle leve en esquina"}
                    className="text-xs h-8 bg-white"
                    maxLength={180}
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
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
                              idx,
                              'detallesFisicos',
                              toggleDetalleChip(eq.detallesFisicos || '', chip)
                            )
                          }
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
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
            );
          })}
        </div>

        {/* Botón Agregar Otro Equipo */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddEquipo}
          className="w-full py-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>+ Agregar otro Dispositivo en Permuta</span>
        </Button>

        {/* Error inline */}
        {errorMsg && (
          <div
            role="alert"
            className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSubmitDisabled}
          >
            <Check className="h-4 w-4 mr-1.5" />
            Aplicar Permuta (-Bs {totalCreditoPermuta.toFixed(2)})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
