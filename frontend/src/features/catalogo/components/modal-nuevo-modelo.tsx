'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { TipoDispositivoItem } from '../types';

interface ModalNuevoModeloProps {
  isOpen: boolean;
  onClose: () => void;
  nuevoNombreModelo: string;
  setNuevoNombreModelo: (val: string) => void;
  tipos: TipoDispositivoItem[];
  nuevoTipo: string;
  setNuevoTipo: (val: string) => void;
  primeraVarColor: string;
  setPrimeraVarColor: (val: string) => void;
  primeraVarCapacidad: number;
  setPrimeraVarCapacidad: (val: number) => void;
  primeraVarSim: string;
  setPrimeraVarSim: (val: string) => void;
  isCreatingModelo: boolean;
  creacionError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onTipoCreado?: (tipo: TipoDispositivoItem) => void;
}

export function ModalNuevoModelo({
  isOpen,
  onClose,
  nuevoNombreModelo,
  setNuevoNombreModelo,
  tipos,
  nuevoTipo,
  setNuevoTipo,
  primeraVarColor,
  setPrimeraVarColor,
  primeraVarCapacidad,
  setPrimeraVarCapacidad,
  primeraVarSim,
  setPrimeraVarSim,
  isCreatingModelo,
  creacionError,
  onSubmit,
  onTipoCreado,
}: ModalNuevoModeloProps) {
  // Estados para creación in-line de tipo de dispositivo ("al vuelo")
  const [showInlineTipo, setShowInlineTipo] = useState(false);
  const [inlineTipoNombre, setInlineTipoNombre] = useState('');
  const [inlineTipoDesc, setInlineTipoDesc] = useState('');
  const [isSavingInlineTipo, setIsSavingInlineTipo] = useState(false);
  const [inlineTipoError, setInlineTipoError] = useState<string | null>(null);

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
      setNuevoTipo(nuevoTipoCreado.nombre);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowInlineTipo(false);
        setInlineTipoError(null);
        onClose();
      }}
      title="Crear Nuevo Modelo con Variante Obligatoria"
      description="Por regla inmutable de negocio, ningún modelo puede nacer sin al menos una variante."
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {creacionError && (
          <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 text-xs">
            {creacionError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label required>Nombre del Modelo</Label>
            <Input
              placeholder="Ej: MacBook Air M3, AirPods Pro 2, iPhone 17..."
              value={nuevoNombreModelo}
              onChange={(e) => setNuevoNombreModelo(e.target.value)}
              autoFocus={!showInlineTipo}
            />
          </div>

          {/* Selector de Tipo de Dispositivo con soporte "Al Vuelo" */}
          {showInlineTipo ? (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2.5 animate-in fade-in duration-200 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-blue-600" />
                  Crear Tipo de Dispositivo "Al Vuelo"
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineTipo(false);
                    setInlineTipoError(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                >
                  Cancelar
                </button>
              </div>

              {inlineTipoError && (
                <p className="text-[11px] text-rose-600 font-medium">{inlineTipoError}</p>
              )}

              <div>
                <Label required className="text-[11px]">Nombre del Tipo (Hardware)</Label>
                <Input
                  placeholder="Ej: CONSOLAS, APPLE_TV, SMART_HOME..."
                  value={inlineTipoNombre}
                  onChange={(e) => setInlineTipoNombre(e.target.value)}
                  maxLength={50}
                  className="h-8 text-xs bg-white"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-[11px]">Descripción (Opcional)</Label>
                <Input
                  placeholder="Ej: Dispositivos multimedia o hardware dedicado..."
                  value={inlineTipoDesc}
                  onChange={(e) => setInlineTipoDesc(e.target.value)}
                  maxLength={255}
                  className="h-8 text-xs bg-white"
                />
              </div>

              <Button
                type="button"
                size="sm"
                className="w-full text-xs font-semibold h-8"
                onClick={handleGuardarTipoInline}
                isLoading={isSavingInlineTipo}
              >
                Guardar y Seleccionar Tipo
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required className="mb-0">Tipo de Dispositivo</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineTipo(true);
                    setInlineTipoNombre('');
                    setInlineTipoDesc('');
                    setInlineTipoError(null);
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Nuevo Tipo
                </button>
              </div>
              <Select
                value={nuevoTipo}
                onChange={(e) => {
                  if (e.target.value === '__NUEVO__') {
                    setShowInlineTipo(true);
                    setInlineTipoNombre('');
                    setInlineTipoDesc('');
                    setInlineTipoError(null);
                  } else {
                    setNuevoTipo(e.target.value);
                  }
                }}
              >
                {tipos.map((t) => (
                  <option key={t.id} value={t.nombre}>
                    {t.nombre} {t.descripcion ? `(${t.descripcion})` : ''}
                  </option>
                ))}
                <option value="__NUEVO__" className="text-blue-600 font-semibold">
                  + Crear nuevo tipo al vuelo...
                </option>
              </Select>
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <p className="text-xs font-bold text-slate-900">
            Primera Variante Obligatoria (Invariante)
          </p>

          <div>
            <Label required>Color de Lanzamiento</Label>
            <Input
              placeholder="Ej: Titanium Silver, Space Gray, Blanco"
              value={primeraVarColor}
              onChange={(e) => setPrimeraVarColor(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Capacidad</Label>
              <Select
                value={primeraVarCapacidad}
                onChange={(e) => setPrimeraVarCapacidad(Number(e.target.value))}
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
                value={primeraVarSim}
                onChange={(e) => setPrimeraVarSim(e.target.value)}
              >
                <option value="SIM Físico">SIM Físico (Nano SIM)</option>
                <option value="eSIM">eSIM (Digital)</option>
                <option value="Dual SIM">Dual SIM (Físico + eSIM)</option>
                <option value="Wi-Fi">Solo Wi-Fi (iPad / Mac)</option>
                <option value="Wi-Fi + Cellular">Wi-Fi + Cellular (iPad / Watch)</option>
                <option value="GPS">GPS (Apple Watch)</option>
                <option value="GPS + Cellular">GPS + Cellular (Apple Watch)</option>
                <option value="No Aplica">No Aplica (AirPods / Accesorios)</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 text-xs font-semibold"
            isLoading={isCreatingModelo}
          >
            Registrar Modelo y Variante
          </Button>
        </div>
      </form>
    </Modal>
  );
}
