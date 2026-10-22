'use client';

import React from 'react';
import { Smartphone, Plus, Trash2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { TelefonoRow } from '../types';

interface RecepcionTelefonosTableProps {
  telefonos: TelefonoRow[];
  modelos: any[];
  onAddTelefono: () => void;
  onRemoveTelefono: (id: string) => void;
  onUpdateTelefono: (id: string, field: keyof TelefonoRow, value: any) => void;
  onOpenInlineVarianteModal: (rowId: string) => void;
}

export function RecepcionTelefonosTable({
  telefonos,
  modelos,
  onAddTelefono,
  onRemoveTelefono,
  onUpdateTelefono,
  onOpenInlineVarianteModal,
}: RecepcionTelefonosTableProps) {
  return (
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
          onClick={onAddTelefono}
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
                <Label required>Modelo y Variante</Label>
                <div className="flex gap-2">
                  <Select
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
                            {m.nombreModelo || m.nombre} - {v.color} (
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
                <Label required>Condición</Label>
                <Select
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
                <Label required>Número de Serie</Label>
                <Input
                  placeholder="Ej: F2LZ998X..."
                  value={t.numeroSerie}
                  onChange={(e) =>
                    onUpdateTelefono(t.id, 'numeroSerie', e.target.value.toUpperCase())
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
                    onUpdateTelefono(t.id, 'imei1', e.target.value)
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
                    onUpdateTelefono(t.id, 'imei2', e.target.value)
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
                    onUpdateTelefono(t.id, 'costoBs', parseFloat(e.target.value) || 0)
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
                    onUpdateTelefono(t.id, 'costoUsd', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              {/* Precio Venta Sugerido en Bs */}
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
                    onUpdateTelefono(t.id, 'precioVentaSugeridoBs', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
