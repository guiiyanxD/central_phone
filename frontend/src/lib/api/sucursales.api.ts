import { request } from './client';

export interface SucursalListItem {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  activo: boolean;
  creadoEn?: string;
  _count?: {
    usuarios: number;
    dispositivos: number;
    lotesAccesorio: number;
  };
}

export interface SucursalDetail {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
  usuarios: Array<{
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'VENDEDOR';
    activo: boolean;
  }>;
}

export interface CreateSucursalData {
  nombre: string;
  direccion: string;
  telefono?: string;
  ciudad?: string;
}

export interface UpdateSucursalData {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  ciudad?: string;
  activo?: boolean;
}

export const sucursalesApi = {
  getAll: (includeInactivas = false) =>
    request<SucursalListItem[]>(
      `/sucursales${includeInactivas ? '?includeInactivas=true' : ''}`
    ),
  getById: (id: number) => request<SucursalDetail>(`/sucursales/${id}`),
  create: (data: CreateSucursalData) =>
    request<SucursalListItem>('/sucursales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateSucursalData) =>
    request<SucursalListItem>(`/sucursales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
