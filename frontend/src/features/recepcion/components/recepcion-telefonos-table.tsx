'use client';

import React from 'react';
import { Smartphone, Plus, Trash2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TelefonoRow } from '../types';

interface RecepcionTelefonosTableProps {
  telefonos: TelefonoRow[];
  modelos: any[];
  onAddTelefono: () => void;
  onAddSiguienteEquipo?: (sourceId?: string) => void;
  onRemoveTelefono: (id: string) => void;
  onUpdateTelefono: (id: string, field: keyof TelefonoRow, value: any) => void;
  onOpenInlineVarianteModal: (rowId: string) => void;
}

export function isImeiDeshabilitado(t: TelefonoRow): boolean {
  if (t.modeloTipo === 'MAC' || t.modeloTipo === 'AIRPODS') return true;
  const sim = (t.varianteTipoSim || t.nuevaVariante?.tipoSim || '').toLowerCase();
  if (
    sim.includes('no aplica') ||
    sim.includes('gps only') ||
    sim.includes('wifi') ||
    sim === 'no_aplica'
  ) {
    return true;
  }
  if (t.modeloTipo === 'WATCH' && !sim.includes('cellular')) {
    return true;
  }
  return false;
}

export function RecepcionTelefonosTable({
  telefonos,
  modelos,
  onAddTelefono,
  onAddSiguienteEquipo,
  onRemoveTelefono,
  onUpdateTelefono,
  onOpenInlineVarianteModal,
}: RecepcionTelefonosTableProps) {
  const shiftCharPressedRef = React.useRef(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const prevLengthRef = React.useRef(telefonos.length);

  React.useEffect(() => {
    if (telefonos.length > prevLengthRef.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }
    prevLengthRef.current = telefonos.length;
  }, [telefonos.length]);

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Shift') {
      shiftCharPressedRef.current = false;
    } else if (e.shiftKey) {
      shiftCharPressedRef.current = true;
    }
  };

  const handleRowKeyUp = (e: React.KeyboardEvent, row: TelefonoRow) => {
    if (e.key === 'Shift') {
      if (!shiftCharPressedRef.current && row.numeroSerie.trim().length >= 2) {
        e.preventDefault();
        if (onAddSiguienteEquipo) {
          onAddSiguienteEquipo(row.id);
        } else {
          onAddTelefono();
        }
      }
      shiftCharPressedRef.current = false;
    }
  };

  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardHeader className="sticky top-0 z-10 bg-white border-b border-slate-100 p-5 pb-3.5 flex flex-row items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-slate-700" />
            <CardTitle className="text-base font-semibold text-slate-900">
              2. Equipos Serializados Recibidos
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-slate-50 font-mono text-slate-700">
              {telefonos.length} {telefonos.length === 1 ? 'equipo' : 'equipos'}
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Identificación unívoca por Número de Serie (y obligatorio IMEI 1 en iPhone).
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono hidden sm:inline-block">
            Atajo: Tecla [Shift] para nueva unidad
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (onAddSiguienteEquipo ? onAddSiguienteEquipo() : onAddTelefono())}
            className="text-xs"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Agregar Equipo
          </Button>
        </div>
      </CardHeader>

      <CardContent
        ref={scrollContainerRef}
        className="p-5 space-y-4 max-h-[520px] overflow-y-auto pr-3.5 scroll-smooth"
      >
        {telefonos.map((t, idx) => {
          const noAplicaImei = isImeiDeshabilitado(t);
          return (
            <div
              key={t.id}
              onKeyDown={handleRowKeyDown}
              onKeyUp={(e) => handleRowKeyUp(e, t)}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Unidad #{telefonos.length - idx}</span>
                {telefonos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveTelefono(t.id)}
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
                  <Label htmlFor={`tel-variante-${t.id}`} required>Modelo y Variante</Label>
                  <div className="flex gap-2">
                    <Select
                      id={`tel-variante-${t.id}`}
                      className="flex-1"
                      value={t.varianteId || ''}
                      onChange={(e) =>
                        onUpdateTelefono(
                          t.id,
                          'varianteId',
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    >
                      <option value="">-- Seleccionar Variante --</option>
                      {modelos.map((m) => (
                        <optgroup key={m.id} label={`${m.nombreModelo || m.nombre} (${m.tipo || 'IPHONE'})`}>
                          {m.variantes.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {m.nombreModelo || m.nombre} [{v.tipoSim}] - {v.color} (
                              {v.capacidadGb > 0
                                ? v.capacidadGb >= 1024
                                  ? `${v.capacidadGb / 1024}TB`
                                  : `${v.capacidadGb}GB`
                                : '0 GB'}
                              )
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenInlineVarianteModal(t.id)}
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
                  <Label htmlFor={`tel-condicion-${t.id}`} required>Condición</Label>
                  <Select
                    id={`tel-condicion-${t.id}`}
                    value={t.condicion}
                    onChange={(e) =>
                      onUpdateTelefono(t.id, 'condicion', e.target.value)
                    }
                  >
                    <option value="NUEVO">NUEVO (Sellado)</option>
                    <option value="OPEN_BOX">OPEN BOX</option>
                    <option value="USADO">USADO (Garantizado)</option>
                  </Select>
                </div>

                {/* Número de Serie */}
                <div>
                  <Label htmlFor={`tel-serie-${t.id}`} required>Número de Serie</Label>
                  <Input
                    id={`tel-serie-${t.id}`}
                    placeholder="Ej: F2LZ998X..."
                    value={t.numeroSerie}
                    onChange={(e) =>
                      onUpdateTelefono(t.id, 'numeroSerie', e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!noAplicaImei) {
                          const nextInput = document.getElementById(`tel-imei1-${t.id}`) as HTMLInputElement | null;
                          nextInput?.focus();
                          nextInput?.select();
                        }
                      }
                    }}
                  />
                </div>

                {/* IMEI 1 */}
                <div>
                  <Label htmlFor={`tel-imei1-${t.id}`} required={!noAplicaImei && t.modeloTipo === 'IPHONE'}>
                    IMEI 1 {!noAplicaImei ? (t.modeloTipo === 'IPHONE' ? '(15 dígitos)' : '(Celular/Opc.)') : '(No Aplica)'}
                  </Label>
                  <Input
                    id={`tel-imei1-${t.id}`}
                    disabled={noAplicaImei}
                    placeholder={
                      noAplicaImei
                        ? 'No Aplica (Identificado por S/N)'
                        : '35492811...'
                    }
                    value={noAplicaImei ? '' : t.imei1}
                    maxLength={20}
                    onChange={(e) =>
                      onUpdateTelefono(t.id, 'imei1', e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextInput = document.getElementById(`tel-imei2-${t.id}`) as HTMLInputElement | null;
                        nextInput?.focus();
                        nextInput?.select();
                      }
                    }}
                    className={
                      noAplicaImei
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : ''
                    }
                  />
                </div>

                {/* IMEI 2 (Opcional) */}
                <div>
                  <Label htmlFor={`tel-imei2-${t.id}`}>IMEI 2 (Dual SIM / eSIM)</Label>
                  <Input
                    id={`tel-imei2-${t.id}`}
                    disabled={noAplicaImei}
                    placeholder={
                      noAplicaImei
                        ? 'No Aplica'
                        : 'Opcional...'
                    }
                    value={noAplicaImei ? '' : t.imei2}
                    maxLength={20}
                    onChange={(e) =>
                      onUpdateTelefono(t.id, 'imei2', e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Enter en IMEI 2 previene el submit y NO crea fila; solo Shift crea la siguiente fila
                      }
                    }}
                    className={
                      noAplicaImei
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : ''
                    }
                  />
                </div>

                {/* Costo en Bs */}
                <div>
                  <Label htmlFor={`tel-costo-bs-${t.id}`} required>Costo Unitario (Bs)</Label>
                  <Input
                    id={`tel-costo-bs-${t.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={t.costoBs || ''}
                    onChange={(e) =>
                      onUpdateTelefono(t.id, 'costoBs', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Costo en USD */}
                <div>
                  <Label htmlFor={`tel-costo-usd-${t.id}`} required>Costo Unitario ($ USD)</Label>
                  <Input
                    id={`tel-costo-usd-${t.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={t.costoUsd || ''}
                    onChange={(e) =>
                      onUpdateTelefono(t.id, 'costoUsd', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Precio Venta Sugerido en Bs */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`tel-precio-bs-${t.id}`} required>P. Venta Sugerido (Bs)</Label>
                    <span className="text-[10px] text-slate-500 font-mono">+15% auto</span>
                  </div>
                  <Input
                    id={`tel-precio-bs-${t.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={t.precioVentaSugeridoBs || ''}
                    onChange={(e) =>
                      onUpdateTelefono(t.id, 'precioVentaSugeridoBs', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
