import { request } from './client';
import {
  UsuarioItem,
  CreateUsuarioInput,
  UpdateUsuarioInput,
  QueryUsuariosParams,
} from '@/features/usuarios/types';

export const usuariosApi = {
  getAll: (filters?: QueryUsuariosParams) => {
    const params = new URLSearchParams();
    if (filters?.sucursalId !== undefined) {
      params.append('sucursalId', filters.sucursalId.toString());
    }
    if (filters?.rol) {
      params.append('rol', filters.rol);
    }
    if (filters?.activo !== undefined) {
      params.append('activo', filters.activo.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    const queryString = params.toString();
    return request<UsuarioItem[]>(`/usuarios${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: number) => request<UsuarioItem>(`/usuarios/${id}`),

  create: (data: CreateUsuarioInput) =>
    request<UsuarioItem>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateUsuarioInput) =>
    request<UsuarioItem>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updatePassword: (id: number, password: string) =>
    request<{ message: string }>(`/usuarios/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),

  toggleStatus: (id: number) =>
    request<UsuarioItem>(`/usuarios/${id}/toggle-status`, {
      method: 'PATCH',
    }),
};
