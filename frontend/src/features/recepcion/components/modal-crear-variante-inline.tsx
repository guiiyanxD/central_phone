'use client';

import React, { useState } from 'react';
import { Smartphone, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { TipoDispositivoItem } from '@/features/catalogo/types';

interface ModalCrearVarianteInlineProps {
  isOpen: boolean;
  onClose: () => void;
  modelos: any[];
  tipos?: TipoDispositivoItem[];
  nuevaVarModeloId: number;
  setNuevaVarModeloId: (val: number) => void;
  nuevaVarColor: string;
  setNuevaVarColor: (val: string) => void;
  nuevaVarCapacidad: number;
  setNuevaVarCapacidad: (val: number) => void;
  nuevaVarSim: string;
  setNuevaVarSim: (val: string) => void;
  onConfirm: () => void;
  onModeloCreado?: (modelo: any, primeraVariante: any) => void;
  onTipoCreado?: (tipo: TipoDispositivoItem) => void;
}

export function ModalCrearVarianteInline({
  isOpen,
  onClose,
  modelos,
  tipos = [],
  nuevaVarModeloId,
  setNuevaVarModeloId,
  nuevaVarColor,
  setNuevaVarColor,
  nuevaVarCapacidad,
  setNuevaVarCapacidad,
  nuevaVarSim,
  setNuevaVarSim,
  onConfirm,
  onModeloCreado,
  onTipoCreado,
}: ModalCrearVarianteInlineProps) {
  // Estados para creación in-line de nuevo modelo ("al vuelo")
  const [showInlineModelo, setShowInlineModelo] = useState(false);
  const [inlineModeloNombre, setInlineModeloNombre] = useState('');
  const [inlineTipo, setInlineTipo] = useState(tipos.length > 0 ? tipos[0].nombre : 'IPHONE');
  const [inlineTipoId, setInlineTipoId] = useState<number | undefined>(
    tipos.length > 0 ? tipos[0].id : undefined
  );
  const [inlineModeloDesc, setInlineModeloDesc] = useState('');
  const [isSavingModelo, setIsSavingModelo] = useState(false);
  const [inlineModeloError, setInlineModeloError] = useState<string | null>(null);

  // Estados para creación in-line de nuevo tipo de dispositivo ("al vuelo")
  const [showInlineTipo, setShowInlineTipo] = useState(false);
  const [inlineTipoNombre, setInlineTipoNombre] = useState('');
  const [inlineTipoDesc, setInlineTipoDesc] = useState('');
  const [isSavingInlineTipo, setIsSavingInlineTipo] = useState(false);
  const [inlineTipoError, setInlineTipoError] = useState<string | null>(null);

  const resetInternalStates = () => {
    setShowInlineModelo(false);
    setShowInlineTipo(false);
    setInlineModeloNombre('');
    setInlineModeloDesc('');
    setInlineModeloError(null);
    setInlineTipoNombre('');
    setInlineTipoDesc('');
    setInlineTipoError(null);
  };

  const handleClose = () => {
    resetInternalStates();
    onClose();
  };

  const handleGuardarTipoInline = async () => {
    if (!inlineTipoNombre.trim()) {
      setInlineTipoError('El nombre del tipo es obligatorio.');
      return;
    }
    setIsSavingInlineTipo(true);
    setInlineTipoError(null);
    try {
      const nuevoTipoCreado = await api.modelos.createTipo({
        nombre: inlineTipoNombre.trim().toUpperCase(),
        descripcion: inlineTipoDesc.trim() || undefined,
      });
      onTipoCreado?.(nuevoTipoCreado);
      setInlineTipo(nuevoTipoCreado.nombre);
      setInlineTipoId(nuevoTipoCreado.id);
      setShowInlineTipo(false);
      setInlineTipoNombre('');
      setInlineTipoDesc('');
    } catch (err: any) {
      setInlineTipoError(
        err instanceof ApiError ? err.message : 'Error al crear el tipo de dispositivo.'
      );
    } finally {
      setIsSavingInlineTipo(false);
    }
  };

  const handleConfirmAction = async () => {
    if (showInlineModelo) {
      if (!inlineModeloNombre.trim()) {
        setInlineModeloError('El nombre del nuevo modelo es obligatorio.');
        return;
      }
      if (!nuevaVarColor.trim()) {
        setInlineModeloError('El color de la variante obligatoria es requerido.');
        return;
      }

      setIsSavingModelo(true);
      setInlineModeloError(null);

      try {
        const payload = {
          nombreModelo: inlineModeloNombre.trim(),
          tipo: inlineTipo,
          tipoId: inlineTipoId,
          descripcion: inlineModeloDesc.trim() || undefined,
          variantes: [
            {
              color: nuevaVarColor.trim(),
              capacidadGb: Number(nuevaVarCapacidad),
              tipoSim: nuevaVarSim,
            },
          ],
        };

        const modeloCreado = await api.modelos.create(payload);
        const primeraVariante = modeloCreado.variantes?.[0];

        if (onModeloCreado && primeraVariante) {
          onModeloCreado(modeloCreado, primeraVariante);
        }

        handleClose();
      } catch (err: any) {
        setInlineModeloError(
          err instanceof ApiError ? err.message : 'Error al crear el nuevo modelo con variante.'
        );
      } finally {
        setIsSavingModelo(false);
      }
    } else {
      // Flujo tradicional: variante para modelo existente
      onConfirm();
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-slate-800" />
          <span>Crear Variante In-Line (Al Vuelo)</span>
        </div>
      }
      description="Si el proveedor trajo un modelo nuevo o una combinación de color/almacenamiento no listada en el catálogo."
    >
      <div className="space-y-4 pt-2">
        {/* Selector de Modelo con opción de Crear Nuevo Modelo "Al Vuelo" */}
        {showInlineModelo ? (
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-blue-600" />
                Nuevo Modelo "Al Vuelo"
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowInlineModelo(false);
                  setInlineModeloError(null);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
              >
                Volver a selector de modelos
              </button>
            </div>

            {inlineModeloError && (
              <p className="text-[11px] text-rose-600 font-medium">{inlineModeloError}</p>
            )}

            {/* Sub-panel para creación in-line de Tipo de Dispositivo */}
            {showInlineTipo ? (
              <div className="p-2.5 bg-white border border-blue-300 rounded-md space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <Plus className="h-3 w-3 text-blue-600" />
                    Nuevo Tipo de Dispositivo
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineTipo(false);
                      setInlineTipoError(null);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-700"
                  >
                    Cancelar Tipo
                  </button>
                </div>

                {inlineTipoError && (
                  <p className="text-[10px] text-rose-600 font-medium">{inlineTipoError}</p>
                )}

                <Input
                  placeholder="Ej: VISION_PRO, PARLANTE, CONSOLA..."
                  value={inlineTipoNombre}
                  onChange={(e) => setInlineTipoNombre(e.target.value.toUpperCase())}
                  maxLength={50}
                  className="h-7 text-xs"
                  autoFocus
                />
                <Input
                  placeholder="Descripción del tipo (opcional)"
                  value={inlineTipoDesc}
                  onChange={(e) => setInlineTipoDesc(e.target.value)}
                  maxLength={255}
                  className="h-7 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={handleGuardarTipoInline}
                  isLoading={isSavingInlineTipo}
                >
                  Guardar Tipo
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label required className="text-[11px] mb-0">Tipo de Dispositivo</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInlineTipo(true);
                      setInlineTipoNombre('');
                      setInlineTipoDesc('');
                      setInlineTipoError(null);
                    }}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    Nuevo Tipo
                  </button>
                </div>
                <Select
                  value={inlineTipoId || inlineTipo}
                  onChange={(e) => {
                    const val = e.target.value;
                    const foundTipo = tipos.find(
                      (t) => String(t.id) === val || t.nombre === val
                    );
                    if (foundTipo) {
                      setInlineTipo(foundTipo.nombre);
                      setInlineTipoId(foundTipo.id);
                    } else {
                      setInlineTipo(val);
                      setInlineTipoId(undefined);
                    }
                  }}
                  className="h-8 text-xs bg-white"
                >
                  {tipos.length > 0 ? (
                    tipos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="IPHONE">IPHONE</option>
                      <option value="IPAD">IPAD</option>
                      <option value="MAC">MAC</option>
                      <option value="WATCH">WATCH</option>
                      <option value="AIRPODS">AIRPODS</option>
                      <option value="OTRO">OTRO</option>
                    </>
                  )}
                </Select>
              </div>
            )}

            <div>
              <Label required className="text-[11px]">Nombre del Modelo</Label>
              <Input
                placeholder="Ej: iPhone 17 Pro, MacBook Air 15 M4"
                value={inlineModeloNombre}
                onChange={(e) => setInlineModeloNombre(e.target.value)}
                maxLength={100}
                className="h-8 text-xs bg-white"
                autoFocus={!showInlineTipo}
              />
            </div>

            <div>
              <Label className="text-[11px]">Descripción del Modelo (Opcional)</Label>
              <Input
                placeholder="Ej: Línea Pro con chasis de titanio de última generación"
                value={inlineModeloDesc}
                onChange={(e) => setInlineModeloDesc(e.target.value)}
                maxLength={255}
                className="h-8 text-xs bg-white"
              />
            </div>
            <p className="text-[10px] text-slate-500 italic">
              ℹ️ Por regla de catálogo, este modelo se creará atómicamente con la variante indicada abajo.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label required className="mb-0">Modelo de Dispositivo</Label>
              <button
                type="button"
                onClick={() => {
                  setShowInlineModelo(true);
                  setInlineModeloNombre('');
                  setInlineModeloDesc('');
                  setInlineModeloError(null);
                  if (tipos.length > 0) {
                    setInlineTipo(tipos[0].nombre);
                    setInlineTipoId(tipos[0].id);
                  }
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Nuevo Modelo
              </button>
            </div>
            <Select
              value={nuevaVarModeloId}
              onChange={(e) => setNuevaVarModeloId(Number(e.target.value))}
            >
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombreModelo || m.nombre} ({m.tipo || 'IPHONE'})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Campos de Variante (Color, Capacidad, SIM) */}
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
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleConfirmAction}
            isLoading={isSavingModelo}
            disabled={
              !nuevaVarColor.trim() ||
              (showInlineModelo && !inlineModeloNombre.trim())
            }
          >
            Confirmar e Inyectar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
