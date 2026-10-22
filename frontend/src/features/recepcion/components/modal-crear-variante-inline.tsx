'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface ModalCrearVarianteInlineProps {
  isOpen: boolean;
  onClose: () => void;
  modelos: any[];
  nuevaVarModeloId: number;
  setNuevaVarModeloId: (val: number) => void;
  nuevaVarColor: string;
  setNuevaVarColor: (val: string) => void;
  nuevaVarCapacidad: number;
  setNuevaVarCapacidad: (val: number) => void;
  nuevaVarSim: string;
  setNuevaVarSim: (val: string) => void;
  onConfirm: () => void;
}

export function ModalCrearVarianteInline({
  isOpen,
  onClose,
  modelos,
  nuevaVarModeloId,
  setNuevaVarModeloId,
  nuevaVarColor,
  setNuevaVarColor,
  nuevaVarCapacidad,
  setNuevaVarCapacidad,
  nuevaVarSim,
  setNuevaVarSim,
  onConfirm,
}: ModalCrearVarianteInlineProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
                {m.nombreModelo || m.nombre} ({m.tipo || 'IPHONE'})
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
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={onConfirm}
            disabled={!nuevaVarColor.trim()}
          >
            Confirmar e Inyectar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
