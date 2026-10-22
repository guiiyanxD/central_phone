'use client';

import React from 'react';
import { Building2, Edit3, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CIUDADES_BOLIVIA } from '../types';

interface ModalSucursalFormProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  nombre: string;
  setNombre: (val: string) => void;
  ciudad: string;
  setCiudad: (val: string) => void;
  direccion: string;
  setDireccion: (val: string) => void;
  telefono: string;
  setTelefono: (val: string) => void;
  activo?: boolean;
  setActivo?: (val: boolean) => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  sucursalNombreOriginal?: string;
}

export function ModalSucursalForm({
  mode,
  isOpen,
  onClose,
  nombre,
  setNombre,
  ciudad,
  setCiudad,
  direccion,
  setDireccion,
  telefono,
  setTelefono,
  activo = true,
  setActivo,
  isLoading,
  error,
  onSubmit,
  sucursalNombreOriginal,
}: ModalSucursalFormProps) {
  const isCreate = mode === 'create';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isCreate ? (
            <Building2 className="h-5 w-5 text-slate-900" />
          ) : (
            <Edit3 className="h-5 w-5 text-slate-900" />
          )}
          <span>{isCreate ? 'Registrar Nueva Sucursal' : 'Editar Sucursal'}</span>
        </div>
      }
      description={
        isCreate
          ? 'Añade una nueva sede física para expandir las operaciones y asignar inventario independiente.'
          : `Modifica los datos de contacto y estado operativo de "${sucursalNombreOriginal || ''}".`
      }
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="sucNombre">Nombre de la Sucursal *</Label>
          <Input
            id="sucNombre"
            placeholder="Ej: Sucursal Equipetrol / Sucursal Ventura Mall"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sucCiudad">Ciudad *</Label>
            <Select
              id="sucCiudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
            >
              {CIUDADES_BOLIVIA.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sucTelefono">Teléfono de Contacto</Label>
            <Input
              id="sucTelefono"
              placeholder="Ej: 71023456 / 3-3456789"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sucDireccion">Dirección Completa *</Label>
          <Input
            id="sucDireccion"
            placeholder="Ej: Av. San Martín #450, entre 3er y 4to anillo"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
          />
        </div>

        {!isCreate && setActivo && (
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Sucursal Operativa</p>
                <p className="text-[11px] text-slate-500">
                  Si se desmarca, los vendedores no podrán abrir sesiones de caja ni operar en esta tienda.
                </p>
              </div>
            </label>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={isLoading}
            loadingText={isCreate ? 'Creando...' : 'Guardando...'}
          >
            {isCreate ? 'Registrar Sucursal' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
