'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UserCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Building2,
  Shield,
  User,
  AtSign,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { RolUsuario, UsuarioItem } from '../types';

interface SucursalOption {
  id: number;
  nombre: string;
  ciudad: string;
}

interface ModalUsuarioFormProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioToEdit?: UsuarioItem | null;
  sucursales: SucursalOption[];
  onSave: (data: {
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
    password?: string;
    sucursalId?: number | null;
    rol: RolUsuario;
  }) => Promise<void>;
  isLoading: boolean;
  apiError: string | null;
}

export function ModalUsuarioForm({
  isOpen,
  onClose,
  usuarioToEdit,
  sucursales,
  onSave,
  isLoading,
  apiError,
}: ModalUsuarioFormProps) {
  const isEdit = Boolean(usuarioToEdit);

  // Form states
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [usernamePrefix, setUsernamePrefix] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [rol, setRol] = useState<RolUsuario>('VENDEDOR');
  const [clientError, setClientError] = useState<string | null>(null);

  // Reset or fill form on open/change
  useEffect(() => {
    if (isOpen) {
      if (usuarioToEdit) {
        setNombre(usuarioToEdit.nombre || '');
        setApellido(usuarioToEdit.apellido || '');
        const email = usuarioToEdit.email || '';
        const prefix = email.replace(/@centralphone\.com$/i, '');
        setUsernamePrefix(prefix);
        setTelefono(usuarioToEdit.telefono || '');
        setSucursalId(usuarioToEdit.sucursalId || null);
        setRol(usuarioToEdit.rol || 'VENDEDOR');
        setPassword('');
      } else {
        setNombre('');
        setApellido('');
        setUsernamePrefix('');
        setTelefono('');
        setPassword('');
        setSucursalId(sucursales.length > 0 ? sucursales[0].id : null);
        setRol('VENDEDOR');
      }
      setClientError(null);
      setShowPassword(false);
    }
  }, [isOpen, usuarioToEdit, sucursales]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!nombre.trim()) {
      setClientError('El nombre del colaborador es obligatorio.');
      return;
    }

    const cleanPrefix = usernamePrefix.trim().toLowerCase().replace(/@centralphone\.com$/i, '');
    if (!cleanPrefix) {
      setClientError('El nombre de usuario corporativo es obligatorio.');
      return;
    }

    if (!/^[a-z0-9._-]+$/i.test(cleanPrefix)) {
      setClientError('El usuario solo puede contener letras, números, puntos, guiones o guiones bajos.');
      return;
    }

    const fullEmail = `${cleanPrefix}@centralphone.com`;

    if (!isEdit) {
      if (!password || password.length < 6) {
        setClientError('La contraseña inicial debe tener al menos 6 caracteres.');
        return;
      }
    }

    await onSave({
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      email: fullEmail,
      telefono: telefono.trim() || undefined,
      password: password || undefined,
      sucursalId: sucursalId,
      rol,
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
            <UserPlus className="h-5 w-5 text-slate-900" />
          )}
          <span>{isEdit ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}</span>
        </div>
      }
      description={
        isEdit
          ? 'Actualiza los datos personales, sede operativa o rol de acceso del colaborador.'
          : 'Crea una nueva cuenta de acceso con credenciales del dominio corporativo.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {displayedError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{displayedError}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="usuario-nombre" className="text-xs font-semibold text-slate-700">
              Nombre <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="usuario-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Carlos"
              required
              className="h-10 text-sm"
              autoFocus
            />
          </div>

          {/* Apellido */}
          <div className="space-y-1.5">
            <Label htmlFor="usuario-apellido" className="text-xs font-semibold text-slate-700">
              Apellido
            </Label>
            <Input
              id="usuario-apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Ej: Mendoza"
              className="h-10 text-sm"
            />
          </div>
        </div>

        {/* Nombre de Usuario / Email Corporativo con Addon fijo @centralphone.com */}
        <div className="space-y-1.5">
          <Label htmlFor="usuario-email" className="text-xs font-semibold text-slate-700">
            Usuario de Acceso Corporativo <span className="text-rose-500">*</span>
          </Label>
          <div className="relative flex rounded-md shadow-sm">
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <AtSign className="h-4 w-4" />
              </div>
              <Input
                id="usuario-email"
                value={usernamePrefix}
                onChange={(e) => setUsernamePrefix(e.target.value)}
                placeholder="carlos.mendoza"
                required
                className="pl-9 rounded-r-none border-r-0 h-10 text-sm font-mono"
              />
            </div>
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-mono font-medium">
              @centralphone.com
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            El dominio <span className="font-mono">@centralphone.com</span> se asigna automáticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Teléfono / WhatsApp */}
          <div className="space-y-1.5">
            <Label htmlFor="usuario-telefono" className="text-xs font-semibold text-slate-700">
              Teléfono / WhatsApp
            </Label>
            <Input
              id="usuario-telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 77712345"
              className="h-10 text-sm"
            />
          </div>

          {/* Rol de Acceso */}
          <div className="space-y-1.5">
            <Label htmlFor="usuario-rol" className="text-xs font-semibold text-slate-700">
              Rol del Colaborador
            </Label>
            <Select
              id="usuario-rol"
              value={rol}
              onChange={(e) => setRol(e.target.value as RolUsuario)}
              className="h-10 text-sm"
            >
              <option value="VENDEDOR">Vendedor (Solo Operación POS)</option>
              <option value="ADMIN">Administrador (Control Total)</option>
            </Select>
          </div>
        </div>

        {/* Sucursal Asignada */}
        <div className="space-y-1.5">
          <Label htmlFor="usuario-sucursal" className="text-xs font-semibold text-slate-700">
            Sucursal / Sede Asignada
          </Label>
          <Select
            id="usuario-sucursal"
            value={sucursalId ? sucursalId.toString() : ''}
            onChange={(e) => {
              const val = e.target.value;
              setSucursalId(val ? parseInt(val, 10) : null);
            }}
            className="h-10 text-sm"
          >
            <option value="">Sin sucursal fija asignada</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.ciudad})
              </option>
            ))}
          </Select>
        </div>

        {/* Contraseña Inicial (Solo al crear) */}
        {!isEdit && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <Label htmlFor="usuario-password" className="text-xs font-semibold text-slate-700">
              Contraseña Inicial de Acceso <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="usuario-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="pr-10 h-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">
                  {showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              El colaborador podrá cambiar su contraseña o el administrador podrá redefinirla cuando lo necesite.
            </p>
          </div>
        )}

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
                : 'Creando cuenta...'
              : isEdit
              ? 'Guardar Cambios'
              : 'Registrar Colaborador'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
