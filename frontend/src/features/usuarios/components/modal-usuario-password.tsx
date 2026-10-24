'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UsuarioItem } from '../types';

interface ModalUsuarioPasswordProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: UsuarioItem | null;
  onSavePassword: (usuarioId: number, newPassword: string) => Promise<void>;
  isLoading: boolean;
  apiError: string | null;
}

export function ModalUsuarioPassword({
  isOpen,
  onClose,
  usuario,
  onSavePassword,
  isLoading,
  apiError,
}: ModalUsuarioPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setClientError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!usuario) return;

    if (!password || password.length < 6) {
      setClientError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setClientError('Las contraseñas no coinciden.');
      return;
    }

    await onSavePassword(usuario.id, password);
  };

  const displayedError = clientError || apiError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-600" />
          <span>Restablecer Contraseña de Acceso</span>
        </div>
      }
      description={
        usuario
          ? `Asigna una nueva clave para ${usuario.nombre} ${usuario.apellido || ''} (${usuario.email}).`
          : 'Asigna una nueva clave para el colaborador seleccionado.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {displayedError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{displayedError}</div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-900">Usuario seleccionado:</p>
          <p className="font-mono text-slate-700">{usuario?.email}</p>
        </div>

        {/* Nueva Contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-xs font-semibold text-slate-700">
            Nueva Contraseña <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="pr-10 h-10 text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar Contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-700">
            Confirmar Nueva Contraseña <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            required
            className="h-10 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
