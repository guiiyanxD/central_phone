'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Building2, UserCheck, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProveedorItem, CreateProveedorInput } from '../types';

interface ModalProveedorFormProps {
  isOpen: boolean;
  onClose: () => void;
  proveedorToEdit?: ProveedorItem | null;
  onSave: (data: CreateProveedorInput) => Promise<void>;
  isLoading: boolean;
  apiError: string | null;
}

export function ModalProveedorForm({
  isOpen,
  onClose,
  proveedorToEdit,
  onSave,
  isLoading,
  apiError,
}: ModalProveedorFormProps) {
  const isEdit = Boolean(proveedorToEdit);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contactoReferencia, setContactoReferencia] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (proveedorToEdit) {
        setNombre(proveedorToEdit.nombre || '');
        setApellido(proveedorToEdit.apellido || '');
        setEmpresa(proveedorToEdit.empresa || '');
        setTelefono(proveedorToEdit.telefono || '');
        setContactoReferencia(proveedorToEdit.contactoReferencia || '');
      } else {
        setNombre('');
        setApellido('');
        setEmpresa('');
        setTelefono('');
        setContactoReferencia('');
      }
      setClientError(null);
    }
  }, [isOpen, proveedorToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!nombre.trim()) {
      setClientError('El nombre del contacto del proveedor es obligatorio.');
      return;
    }

    await onSave({
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      empresa: empresa.trim() || undefined,
      telefono: telefono.trim() || undefined,
      contactoReferencia: contactoReferencia.trim() || undefined,
    });
  };

  const displayedError = clientError || apiError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isEdit ? (
            <UserCheck className="h-5 w-5 text-indigo-600" />
          ) : (
            <Truck className="h-5 w-5 text-slate-900" />
          )}
          <span>{isEdit ? 'Editar Proveedor Mayorista' : 'Registrar Nuevo Proveedor'}</span>
        </div>
      }
      description={
        isEdit
          ? 'Actualiza la información comercial o el teléfono del mayorista.'
          : 'Registra un nuevo proveedor comercial para la recepción de mercadería.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {displayedError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{displayedError}</div>
          </div>
        )}

        {/* Empresa / Razón Social Mayorista */}
        <div className="space-y-1.5">
          <Label htmlFor="prov-empresa" className="text-xs font-semibold text-slate-700">
            Empresa / Razón Social Mayorista <span className="text-slate-400 font-normal">(Opcional)</span>
          </Label>
          <Input
            id="prov-empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Ej: Apple Miami Wholesale LLC"
            className="h-10 text-sm"
            autoFocus
          />
          <p className="text-[11px] text-slate-400">
            Si opera de forma particular o informal, puedes dejar este campo en blanco.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Nombre de Contacto */}
          <div className="space-y-1.5">
            <Label htmlFor="prov-nombre" className="text-xs font-semibold text-slate-700">
              Nombre de Contacto <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="prov-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Roberto"
              required
              className="h-10 text-sm"
            />
          </div>

          {/* Apellido de Contacto */}
          <div className="space-y-1.5">
            <Label htmlFor="prov-apellido" className="text-xs font-semibold text-slate-700">
              Apellido de Contacto <span className="text-slate-400 font-normal">(Opcional)</span>
            </Label>
            <Input
              id="prov-apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Ej: Gómez"
              className="h-10 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Teléfono / WhatsApp */}
          <div className="space-y-1.5">
            <Label htmlFor="prov-telefono" className="text-xs font-semibold text-slate-700">
              Teléfono / WhatsApp de Contacto
            </Label>
            <Input
              id="prov-telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 77712345 o +1 305..."
              className="h-10 text-sm"
            />
          </div>

          {/* Contacto de Referencia */}
          <div className="space-y-1.5">
            <Label htmlFor="prov-referencia" className="text-xs font-semibold text-slate-700">
              Referencia / Cargo / Local
            </Label>
            <Input
              id="prov-referencia"
              value={contactoReferencia}
              onChange={(e) => setContactoReferencia(e.target.value)}
              placeholder="Ej: Galería Florida Local 12"
              className="h-10 text-sm"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? isEdit
                ? 'Actualizando...'
                : 'Guardando...'
              : isEdit
              ? 'Guardar Cambios'
              : 'Registrar Proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
