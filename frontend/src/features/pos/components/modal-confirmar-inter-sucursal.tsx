'use client';

import React from 'react';
import { ArrowRightLeft, Building2, Smartphone, Headphones, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PendingInterSucursalItem {
  tipo: 'DISPOSITIVO' | 'ACCESORIO';
  disp?: any;
  acc?: any;
  lote?: any;
}

interface ModalConfirmarInterSucursalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItem: PendingInterSucursalItem | null;
  currentSucursalNombre: string;
  onConfirm: () => void;
  onSwitchSucursalAndAdd?: (sucursal: { id: number; nombre: string; ciudad: string }) => void;
}

export function ModalConfirmarInterSucursal({
  isOpen,
  onClose,
  pendingItem,
  currentSucursalNombre,
  onConfirm,
  onSwitchSucursalAndAdd,
}: ModalConfirmarInterSucursalProps) {
  if (!pendingItem) return null;

  const isPhone = pendingItem.tipo === 'DISPOSITIVO';
  const itemNombre = isPhone
    ? pendingItem.disp?.variante?.modelo?.nombreModelo || 'Dispositivo'
    : pendingItem.acc?.nombre || 'Accesorio';

  const itemDetalle = isPhone
    ? `${pendingItem.disp?.variante?.color || ''} • ${
        pendingItem.disp?.variante?.capacidadGb > 0
          ? `${pendingItem.disp.variante.capacidadGb}GB`
          : '0 GB'
      } [IMEI: ${pendingItem.disp?.imei1 || pendingItem.disp?.numeroSerie || 'N/A'}]`
    : pendingItem.lote?.nombreDiferenciador || 'Lote';

  const sucursalOrigenId = isPhone
    ? pendingItem.disp?.sucursalId || pendingItem.disp?.sucursal?.id
    : pendingItem.lote?.sucursalId || pendingItem.lote?.sucursal?.id;

  const sucursalOrigenObj = isPhone ? pendingItem.disp?.sucursal : pendingItem.lote?.sucursal;

  const sucursalOrigenNombre = isPhone
    ? pendingItem.disp?.sucursal?.nombre || `Sucursal ID #${pendingItem.disp?.sucursalId}`
    : pendingItem.lote?.sucursal?.nombre || `Sucursal ID #${pendingItem.lote?.sucursalId}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-amber-700">
          <ArrowRightLeft className="h-5 w-5" />
          <span>Confirmar Venta Inter-Sucursal</span>
        </div>
      }
      description="El producto seleccionado pertenece al inventario registrado de otra sucursal."
    >
      <div className="space-y-4 pt-1">
        {/* Ficha del Producto */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              {isPhone ? <Smartphone className="h-3.5 w-3.5 text-slate-500" /> : <Headphones className="h-3.5 w-3.5 text-slate-500" />}
              {itemNombre}
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {isPhone ? 'Equipo Serializado' : 'Accesorio'}
            </Badge>
          </div>
          <p className="text-xs text-slate-700 font-medium">{itemDetalle}</p>
        </div>

        {/* Flujo de Tiendas: Origen -> Venta */}
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] text-amber-800 font-semibold uppercase">Sucursal Origen</span>
              <div className="flex items-center gap-1 font-bold text-amber-950">
                <Building2 className="h-3.5 w-3.5 text-amber-700" />
                <span>{sucursalOrigenNombre}</span>
              </div>
            </div>

            <ArrowRightLeft className="h-4 w-4 text-amber-600 shrink-0" />

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-emerald-800 font-semibold uppercase">Sucursal de Venta (Caja)</span>
              <div className="flex items-center gap-1 justify-end font-bold text-emerald-950">
                <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>{currentSucursalNombre}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900 leading-relaxed flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Como <strong>Administrador</strong>, estás autorizado a vender este producto en la caja de <strong>{currentSucursalNombre}</strong>. El ingreso monetario se registrará en esta tienda y el stock se descontará de <strong>{sucursalOrigenNombre}</strong>.
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div>
            {onSwitchSucursalAndAdd && sucursalOrigenId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onSwitchSucursalAndAdd({
                    id: Number(sucursalOrigenId),
                    nombre: sucursalOrigenNombre,
                    ciudad: sucursalOrigenObj?.ciudad || '',
                  });
                }}
                className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 w-full sm:w-auto"
              >
                <Building2 className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                Cambiar a {sucursalOrigenNombre} y Vender Local
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              autoFocus
              onClick={onConfirm}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Vender como Inter-Sucursal
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
