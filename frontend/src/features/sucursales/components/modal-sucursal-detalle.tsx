'use client';

import React from 'react';
import { Building2, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SucursalDetail } from '../types';

interface ModalSucursalDetalleProps {
  isOpen: boolean;
  onClose: () => void;
  detalleSucursal: SucursalDetail | null;
  isLoading: boolean;
}

export function ModalSucursalDetalle({
  isOpen,
  onClose,
  detalleSucursal,
  isLoading,
}: ModalSucursalDetalleProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-900" />
          <span>{detalleSucursal?.nombre || 'Detalle de Sucursal'}</span>
        </div>
      }
      description="Información de sede y lista de colaboradores / vendedores asignados."
    >
      {isLoading ? (
        <div className="space-y-3 py-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : !detalleSucursal ? (
        <p className="text-xs text-slate-500 py-4">No se pudo cargar la información.</p>
      ) : (
        <div className="space-y-5 pt-2">
          {/* Metadatos de la Sucursal */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado:</span>
              <Badge variant={detalleSucursal.activo ? 'success' : 'secondary'}>
                {detalleSucursal.activo ? 'Operativa' : 'Inactiva'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ciudad:</span>
              <span className="font-semibold text-slate-900">{detalleSucursal.ciudad}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Dirección:</span>
              <span className="text-slate-800 font-medium text-right max-w-xs truncate">
                {detalleSucursal.direccion}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Teléfono:</span>
              <span className="text-slate-800 font-medium">
                {detalleSucursal.telefono || 'No registrado'}
              </span>
            </div>
          </div>

          {/* Lista de Personal Asignado */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Personal de Tienda ({detalleSucursal.usuarios?.length || 0})
                </h4>
              </div>
            </div>

            {!detalleSucursal.usuarios || detalleSucursal.usuarios.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No hay usuarios o vendedores asignados directamente a esta sucursal.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {detalleSucursal.usuarios.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-subtle"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{u.nombre}</p>
                        <Badge
                          variant={u.rol === 'ADMIN' ? 'default' : 'outline'}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {u.rol}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </div>

                    <Badge
                      variant={u.activo ? 'success' : 'destructive'}
                      className="text-[10px]"
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
