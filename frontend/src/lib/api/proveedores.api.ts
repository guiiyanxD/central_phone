import { request } from './client';

export interface ProveedorItem {
  id: number;
  nombre: string;
  telefono: string | null;
  contactoReferencia: string | null;
}

export const proveedoresApi = {
  getAll: () => request<ProveedorItem[]>('/proveedores'),
};
