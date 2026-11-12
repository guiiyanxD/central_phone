'use client';

import React, { useState } from 'react';
import { RefreshCw, AlertCircle, User, Phone } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { ProveedorItem } from '@/features/proveedores/types';

interface ModalCrearProveedorMinoristaInlineProps {
  isOpen: boolean;
  onClose: () => void;
  onProveedorCreado: (proveedor: ProveedorItem) => void;
}

export function ModalCrearProveedorMinoristaInline({
  isOpen,
  onClose,
  onProveedorCreado,
}: ModalCrearProveedorMinoristaInlineProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setTelefono('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre del cliente/proveedor es obligatorio.');
      return;
    }
    if (!telefono.trim()) {
      setErrorMsg('El teléfono de contacto es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const nuevo = await api.proveedores.create({
        nombre: nombre.trim(),
        apellido: apellido.trim() || undefined,
        telefono: telefono.trim(),
        empresa: 'Cliente Permuta',
        contactoReferencia: 'Proveedor Minorista (Permuta)',
        tipo: 'MINORISTA',
      });

      onProveedorCreado(nuevo);
      handleClose();
    } catch (err: any) {
      setErrorMsg(
        err instanceof ApiError ? err.message : 'Error al registrar el nuevo proveedor minorista.'
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
          <RefreshCw className="h-5 w-5 text-purple-700" />
          <span>Nuevo Proveedor Minorista</span>
        </div>
      }
      description="Registra un nuevo cliente particular de permutas sin abandonar el formulario de recepción."
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

        {/* Nombre */}
        <div className="space-y-1">
          <Label htmlFor="inlineMinoristaNombre" required className="text-xs">
            Nombre del Cliente / Proveedor
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              id="inlineMinoristaNombre"
              placeholder="Ej: Juan"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="pl-9 h-9 text-xs"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Apellido */}
        <div className="space-y-1">
          <Label htmlFor="inlineMinoristaApellido" className="text-xs">
            Apellido <span className="text-slate-400 font-normal">(Opcional)</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              id="inlineMinoristaApellido"
              placeholder="Ej: Pérez"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className="space-y-1">
          <Label htmlFor="inlineMinoristaTelefono" required className="text-xs">
            Teléfono de Contacto
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              id="inlineMinoristaTelefono"
              type="tel"
              placeholder="Ej: 70012345"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="pl-9 h-9 text-xs font-mono"
              required
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="text-xs h-9 bg-purple-700 hover:bg-purple-800 text-white font-medium"
          >
            {isSubmitting ? 'Guardando...' : 'Crear y Seleccionar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
