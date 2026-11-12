'use client';

import React, { useState } from 'react';
import { Truck, Plus, AlertCircle, Building2, User, Phone, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { ProveedorItem } from '@/features/proveedores/types';

interface ModalCrearProveedorInlineProps {
  isOpen: boolean;
  onClose: () => void;
  onProveedorCreado: (proveedor: ProveedorItem) => void;
}

export function ModalCrearProveedorInline({
  isOpen,
  onClose,
  onProveedorCreado,
}: ModalCrearProveedorInlineProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contactoReferencia, setContactoReferencia] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setEmpresa('');
    setTelefono('');
    setContactoReferencia('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre del contacto o proveedor es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const nuevo = await api.proveedores.create({
        nombre: nombre.trim(),
        apellido: apellido.trim() || undefined,
        empresa: empresa.trim() || undefined,
        telefono: telefono.trim() || undefined,
        contactoReferencia: contactoReferencia.trim() || undefined,
        tipo: 'MAYORISTA',
      });

      onProveedorCreado(nuevo);
      handleClose();
    } catch (err: any) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'Error al registrar el nuevo proveedor.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Truck className="h-5 w-5 text-slate-700" />
          <span>Registrar Nuevo Proveedor al Vuelo</span>
        </div>
      }
      description="Crea un proveedor mayorista o cliente minorista para la recepción sin abandonar el formulario."
      className="max-w-md p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Empresa o Razón Social */}
        <div className="space-y-1">
          <Label htmlFor="inline-empresa" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            Empresa / Nombre Comercial (Opcional)
          </Label>
          <Input
            id="inline-empresa"
            placeholder="Ej: Mayorista Miami Tech / Importadora Andina"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="text-xs h-9 bg-white"
            maxLength={100}
          />
        </div>

        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="inline-nombre" className="text-xs font-semibold text-slate-700 flex items-center gap-1" required>
              <User className="h-3.5 w-3.5 text-slate-400" />
              Nombre
            </Label>
            <Input
              id="inline-nombre"
              placeholder="Ej: John / Carlos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="text-xs h-9 bg-white"
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inline-apellido" className="text-xs font-medium text-slate-700">
              Apellido
            </Label>
            <Input
              id="inline-apellido"
              placeholder="Ej: Smith / Perez"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="text-xs h-9 bg-white"
              maxLength={60}
            />
          </div>
        </div>

        {/* Teléfono y Referencia */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="inline-telefono" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Teléfono
            </Label>
            <Input
              id="inline-telefono"
              placeholder="Ej: +1 305 555 1234"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="text-xs h-9 bg-white"
              maxLength={30}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inline-referencia" className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Contacto / Ref.
            </Label>
            <Input
              id="inline-referencia"
              placeholder="Ej: WhatsApp Miami"
              value={contactoReferencia}
              onChange={(e) => setContactoReferencia(e.target.value)}
              className="text-xs h-9 bg-white"
              maxLength={80}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="text-xs h-9"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white"
            disabled={isSubmitting || !nombre.trim()}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {isSubmitting ? 'Guardando...' : 'Crear Proveedor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
