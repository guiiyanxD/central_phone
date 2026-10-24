'use client';

import React from 'react';
import {
  Shield,
  User,
  Building2,
  Phone,
  KeyRound,
  Edit,
  PowerOff,
  Power,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UsuarioItem } from '../types';

interface UsuariosTableProps {
  usuarios: UsuarioItem[];
  currentUserId?: number;
  onEdit: (user: UsuarioItem) => void;
  onResetPassword: (user: UsuarioItem) => void;
  onToggleStatus: (user: UsuarioItem) => void;
}

export function UsuariosTable({
  usuarios,
  currentUserId,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: UsuariosTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-subtle">
        <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          No se encontraron colaboradores
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No hay usuarios registrados que coincidan con los filtros aplicados o aún no has creado cuentas de acceso.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Colaborador
              </th>
              <th scope="col" className="px-5 py-3.5">
                Usuario Corporativo
              </th>
              <th scope="col" className="px-5 py-3.5">
                Rol
              </th>
              <th scope="col" className="px-5 py-3.5">
                Sucursal Asignada
              </th>
              <th scope="col" className="px-5 py-3.5">
                Estado
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => {
              const isSelf = currentUserId === u.id;
              const initials = `${u.nombre.charAt(0)}${(u.apellido || '').charAt(0) || u.nombre.charAt(1) || ''}`.toUpperCase();

              return (
                <tr
                  key={u.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    !u.activo ? 'bg-slate-50/40 opacity-75' : ''
                  }`}
                >
                  {/* Colaborador */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          u.rol === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {u.nombre} {u.apellido || ''}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                              Tú
                            </span>
                          )}
                        </div>
                        {u.telefono && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{u.telefono}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Usuario Corporativo */}
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 inline-block">
                      {u.email}
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="px-5 py-4">
                    {u.rol === 'ADMIN' ? (
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1 hover:bg-indigo-50">
                        <Shield className="h-3 w-3 text-indigo-600" />
                        <span>Administrador</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-700 gap-1">
                        <User className="h-3 w-3 text-slate-500" />
                        <span>Vendedor</span>
                      </Badge>
                    )}
                  </td>

                  {/* Sucursal Asignada */}
                  <td className="px-5 py-4">
                    {u.sucursal ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {u.sucursal.nombre} ({u.sucursal.ciudad})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Sin sede fija
                      </span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-4">
                    {u.activo ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Activo</span>
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        <span>Inactivo</span>
                      </Badge>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Editar perfil */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(u)}
                        title="Editar datos del colaborador"
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar {u.nombre}</span>
                      </Button>

                      {/* Resetear clave */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResetPassword(u)}
                        title="Restablecer contraseña de acceso"
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <KeyRound className="h-4 w-4" />
                        <span className="sr-only">Cambiar clave de {u.nombre}</span>
                      </Button>

                      {/* Activar/Desactivar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSelf && u.activo}
                        onClick={() => onToggleStatus(u)}
                        title={
                          isSelf && u.activo
                            ? 'No puedes desactivar tu propia cuenta'
                            : u.activo
                            ? 'Desactivar usuario'
                            : 'Reactivar usuario'
                        }
                        className={`h-8 w-8 p-0 ${
                          u.activo
                            ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.activo ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {u.activo ? 'Desactivar' : 'Activar'} {u.nombre}
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
