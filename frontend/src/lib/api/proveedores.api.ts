import { request } from './client';
import {
  ProveedorItem,
  CreateProveedorInput,
  UpdateProveedorInput,
  QueryProveedoresParams,
} from '@/features/proveedores/types';

export * from '@/features/proveedores/types';

export const proveedoresApi = {
  getAll: (includeInactivos = false, search?: string) => {
    const params = new URLSearchParams();
    if (includeInactivos) {
      params.append('includeInactivos', 'true');
    }
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    const qs = params.toString();
    return request<ProveedorItem[]>(`/proveedores${qs ? `?${qs}` : ''}`);
  },

  getById: (id: number) => request<ProveedorItem>(`/proveedores/${id}`),

  create: (data: CreateProveedorInput) =>
    request<ProveedorItem>('/proveedores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateProveedorInput) =>
    request<ProveedorItem>(`/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: number) =>
    request<ProveedorItem>(`/proveedores/${id}/toggle-status`, {
      method: 'PATCH',
    }),
};
