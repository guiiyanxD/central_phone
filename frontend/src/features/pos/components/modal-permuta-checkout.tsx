'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Smartphone, Battery, DollarSign, AlertCircle, Check, ScanLine } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { PermutaTradeInDto } from '@/lib/api/ventas.api';

interface ModalPermutaCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  totalBs: number;
  initialPermuta?: PermutaTradeInDto | null;
  modelos: any[];
  onApplyPermuta: (
    permuta: PermutaTradeInDto,
    summary: { modeloNombre: string; varianteDetalle: string; imei1: string; valorTomaBs: number }
  ) => void;
}

export function ModalPermutaCheckout({
  isOpen,
  onClose,
  totalBs,
  initialPermuta,
  modelos,
  onApplyPermuta,
}: ModalPermutaCheckoutProps) {
  // Filtrar modelos exclusivos de iPhone
  const iphoneModelos = React.useMemo(() => {
    return modelos.filter(
      (m) =>
        m.tipo === 'IPHONE' ||
        m.tipoDispositivo?.nombre === 'IPHONE' ||
        m.nombreModelo.toUpperCase().includes('IPHONE')
    );
  }, [modelos]);

  const [selectedModeloId, setSelectedModeloId] = useState<number>(
    iphoneModelos[0]?.id || (modelos[0]?.id || 1)
  );
  const [selectedVarianteId, setSelectedVarianteId] = useState<number | null>(null);
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [porcentajeBateria, setPorcentajeBateria] = useState<number | ''>(85);
  const [valorTomaBs, setValorTomaBs] = useState<number | ''>('');
  const [detallesFisicos, setDetallesFisicos] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const imeiInputRef = useRef<HTMLInputElement>(null);

  // Obtener variantes del modelo seleccionado
  const selectedModelo = iphoneModelos.find((m) => m.id === Number(selectedModeloId));
  const variantesDisponibles = selectedModelo?.variantes || [];

  const modeloOptions: SearchableSelectOption[] = React.useMemo(() => {
    return iphoneModelos.map((m) => ({
      value: m.id,
      label: m.nombreModelo,
      badge: `${m.variantes?.length || 0} var.`,
    }));
  }, [iphoneModelos]);

  const varianteOptions: SearchableSelectOption[] = React.useMemo(() => {
    return variantesDisponibles.map((v: any) => {
      const cap = v.capacidadGb > 0 ? `${v.capacidadGb}GB` : 'N/A';
      return {
        value: v.id,
        label: `${v.color} - ${cap}`,
        sublabel: v.tipoSim ? `SIM: ${v.tipoSim}` : undefined,
        badge: cap,
      };
    });
  }, [variantesDisponibles]);

  // Sincronizar o cargar datos iniciales si se abre en modo edición
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialPermuta) {
        // Encontrar el modelo que contiene la variante
        const foundMod = iphoneModelos.find((m) =>
          m.variantes?.some((v: any) => v.id === initialPermuta.varianteId)
        );
        if (foundMod) {
          setSelectedModeloId(foundMod.id);
        }
        setSelectedVarianteId(initialPermuta.varianteId);
        setImei1(initialPermuta.imei1 || '');
        setImei2(initialPermuta.imei2 || '');
        setNumeroSerie(initialPermuta.numeroSerie || '');
        setPorcentajeBateria(initialPermuta.porcentajeBateria || 85);
        setValorTomaBs(initialPermuta.valorTomaBs || '');
        setDetallesFisicos(initialPermuta.detallesFisicos || '');
      } else {
        if (iphoneModelos.length > 0 && !selectedModeloId) {
          setSelectedModeloId(iphoneModelos[0].id);
        }
        setImei1('');
        setImei2('');
        setNumeroSerie('');
        setPorcentajeBateria(85);
        setValorTomaBs('');
        setDetallesFisicos('');
      }
      setTimeout(() => {
        imeiInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialPermuta, iphoneModelos]);

  // Asegurar que si cambia el modelo, se seleccione una variante válida
  useEffect(() => {
    if (variantesDisponibles.length > 0) {
      if (!selectedVarianteId || !variantesDisponibles.some((v: any) => v.id === selectedVarianteId)) {
        setSelectedVarianteId(variantesDisponibles[0].id);
      }
    } else {
      setSelectedVarianteId(null);
    }
  }, [selectedModeloId, variantesDisponibles]);

  const numValorToma = typeof valorTomaBs === 'number' ? valorTomaBs : 0;
  const saldoRestante = Math.max(0, totalBs - numValorToma);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!selectedVarianteId) {
      setErrorMsg('Debes seleccionar la variante (color y almacenamiento) del teléfono.');
      return;
    }

    const cleanImei1 = imei1.trim();
    if (!cleanImei1 || cleanImei1.length < 14) {
      setErrorMsg('El IMEI 1 es obligatorio y debe tener al menos 14 dígitos válidos.');
      imeiInputRef.current?.focus();
      return;
    }

    const numBat = typeof porcentajeBateria === 'number' ? porcentajeBateria : 0;
    if (numBat < 1 || numBat > 100) {
      setErrorMsg('La condición de batería debe estar comprendida entre 1% y 100%.');
      return;
    }

    if (!valorTomaBs || numValorToma <= 0) {
      setErrorMsg('El valor de toma acordado (crédito de permuta) debe ser mayor a 0 Bs.');
      return;
    }

    if (numValorToma > totalBs) {
      setErrorMsg(
        `El valor de toma (Bs ${numValorToma.toFixed(2)}) no puede superar el total de la compra (Bs ${totalBs.toFixed(2)}).`
      );
      return;
    }

    const selectedVar = variantesDisponibles.find((v: any) => v.id === selectedVarianteId);
    const varianteDetalle = selectedVar
      ? `${selectedVar.color} • ${selectedVar.capacidadGb > 0 ? `${selectedVar.capacidadGb}GB` : ''} ${selectedVar.tipoSim || ''}`.trim()
      : 'Variante';

    onApplyPermuta(
      {
        varianteId: selectedVarianteId,
        imei1: cleanImei1,
        imei2: imei2.trim() || undefined,
        numeroSerie: numeroSerie.trim() || undefined,
        porcentajeBateria: numBat,
        detallesFisicos: detallesFisicos.trim() || undefined,
        valorTomaBs: numValorToma,
      },
      {
        modeloNombre: selectedModelo?.nombreModelo || 'iPhone',
        varianteDetalle,
        imei1: cleanImei1,
        valorTomaBs: numValorToma,
      }
    );
    onClose();
  };

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
      description="Registra el iPhone recibido del cliente como forma de pago / crédito a favor de la venta actual."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Banner de Saldo y Valor de Toma */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-700 block">Total Compra</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              Bs {totalBs.toFixed(2)}
            </span>
          </div>
          <div className="border-x border-slate-200 px-1">
            <span className="text-[10px] font-semibold uppercase text-emerald-800 block">Crédito Permuta</span>
            <span className="text-sm font-bold font-mono text-emerald-700">
              - Bs {numValorToma.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-700 block">Saldo a Cobrar</span>
            <span className="text-sm font-bold font-mono text-blue-700">
              Bs {saldoRestante.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Modelo y Variante */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="permuta-modelo" className="text-xs font-semibold text-slate-800">
              Modelo iPhone *
            </Label>
            <SearchableSelect
              id="permuta-modelo"
              value={selectedModeloId}
              onChange={(val) => setSelectedModeloId(Number(val))}
              placeholder="Buscar modelo iPhone..."
              searchPlaceholder="Escribe modelo (ej: 13, 14 Pro)..."
              options={modeloOptions}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="permuta-variante" className="text-xs font-semibold text-slate-800">
              Variante (Color / Almacenamiento) *
            </Label>
            <SearchableSelect
              id="permuta-variante"
              value={selectedVarianteId || ''}
              onChange={(val) => setSelectedVarianteId(Number(val))}
              placeholder="Buscar variante..."
              searchPlaceholder="Escribe color o GB..."
              options={varianteOptions}
              disabled={variantesDisponibles.length === 0}
              emptyMessage="Sin variantes registradas"
            />
          </div>
        </div>

        {/* Identificadores: IMEI 1 y Batería */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="permuta-imei1" className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <ScanLine className="h-3.5 w-3.5 text-slate-500" />
                IMEI 1 (Lector Barcode) *
              </Label>
              <span className="text-[10px] text-slate-700">14-17 dígitos</span>
            </div>
            <Input
              id="permuta-imei1"
              ref={imeiInputRef}
              value={imei1}
              onChange={(e) => setImei1(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              placeholder="Escanea o digita IMEI 1..."
              maxLength={17}
              className="text-xs h-9 font-mono font-bold bg-white"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="permuta-bateria" className="text-xs font-semibold text-slate-800 flex items-center gap-1">
              <Battery className="h-3.5 w-3.5 text-slate-500" />
              Batería % *
            </Label>
            <Input
              id="permuta-bateria"
              type="number"
              min={1}
              max={100}
              value={porcentajeBateria}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setPorcentajeBateria(isNaN(val) ? '' : val);
              }}
              placeholder="85"
              className="text-xs h-9 font-mono text-center font-bold bg-white"
              required
            />
          </div>
        </div>

        {/* Valor de Toma acordado */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="permuta-valor" className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              Valor de Toma Acordado (Crédito Bs) *
            </Label>
            <span className="text-[10px] text-slate-700">
              Máx: Bs {totalBs.toFixed(2)}
            </span>
          </div>
          <Input
            id="permuta-valor"
            type="number"
            step="0.50"
            min="1"
            max={totalBs}
            value={valorTomaBs}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setValorTomaBs(isNaN(val) ? '' : val);
            }}
            placeholder={`Ej: ${Math.min(totalBs, 2500)}`}
            className="text-sm h-10 font-mono font-bold text-emerald-700 bg-emerald-50/50 border-emerald-300 focus-visible:ring-emerald-500"
            required
          />
        </div>

        {/* Detalles físicos / observaciones rápidas */}
        <div className="space-y-1">
          <Label htmlFor="permuta-detalles" className="text-xs font-medium text-slate-700">
            Detalles Físicos / Observaciones (Opcional)
          </Label>
          <Input
            id="permuta-detalles"
            value={detallesFisicos}
            onChange={(e) => setDetallesFisicos(e.target.value)}
            placeholder="Ej: Pantalla original sin rayas, detalle leve en esquina superior derecha"
            className="text-xs h-8 bg-white"
            maxLength={180}
          />
        </div>

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
            disabled={!valorTomaBs || numValorToma <= 0 || numValorToma > totalBs || !imei1.trim()}
          >
            <Check className="h-4 w-4 mr-1.5" />
            Aplicar Permuta (-Bs {numValorToma.toFixed(2)})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
