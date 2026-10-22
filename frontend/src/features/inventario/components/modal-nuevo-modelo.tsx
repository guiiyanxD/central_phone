'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface ModalNuevoModeloProps {
  isOpen: boolean;
  onClose: () => void;
  nuevoNombreModelo: string;
  setNuevoNombreModelo: (val: string) => void;
  nuevoTipo: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO';
  setNuevoTipo: (val: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO') => void;
  primeraVarColor: string;
  setPrimeraVarColor: (val: string) => void;
  primeraVarCapacidad: number;
  setPrimeraVarCapacidad: (val: number) => void;
  primeraVarSim: string;
  setPrimeraVarSim: (val: string) => void;
  isCreatingModelo: boolean;
  creacionError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalNuevoModelo({
  isOpen,
  onClose,
  nuevoNombreModelo,
  setNuevoNombreModelo,
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
}: ModalNuevoModeloProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
              placeholder="Ej: MacBook Air M3, AirPods Pro 2..."
              value={nuevoNombreModelo}
              onChange={(e) => setNuevoNombreModelo(e.target.value)}
            />
          </div>

          <div>
            <Label required>Tipo de Dispositivo</Label>
            <Select
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value as any)}
            >
              <option value="IPHONE">iPhone (Smartphone)</option>
              <option value="MAC">Mac / MacBook</option>
              <option value="IPAD">iPad</option>
              <option value="WATCH">Apple Watch</option>
              <option value="AIRPODS">AirPods / Auriculares</option>
              <option value="OTRO">Otro Dispositivo Apple</option>
            </Select>
          </div>
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
                <option value="0">0 GB (Sin alm. / AirPods)</option>
                <option value="64">64 GB</option>
                <option value="128">128 GB</option>
                <option value="256">256 GB</option>
                <option value="512">512 GB</option>
                <option value="1024">1 TB</option>
                <option value="2048">2 TB</option>
              </Select>
            </div>

            <div>
              <Label required>Tipo SIM / Conectividad</Label>
              <Select
                value={primeraVarSim}
                onChange={(e) => setPrimeraVarSim(e.target.value)}
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
        </div>

        <div className="flex gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isCreatingModelo}
            disabled={!nuevoNombreModelo.trim() || !primeraVarColor.trim()}
          >
            Crear Modelo Atómico
          </Button>
        </div>
      </form>
    </Modal>
  );
}
