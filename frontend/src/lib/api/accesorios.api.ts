import { request } from './client';

export interface CategoriaAccesorioItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  _count?: { accesorios: number };
}

export interface AccesorioItem {
  id: number;
  categoriaId: number;
  nombre: string;
  descripcion?: string | null;
  categoria: { id: number; nombre: string };
  _count?: {
    lotes: number;
  };
  lotes: Array<{
    id: number;
    nombreDiferenciador: string;
    costoUnitarioBs: string | number;
    precioVentaBs: string | number;
    cantidadInicial: number;
    stockActual: number;
    sucursal: { id: number; nombre: string };
  }>;
}

export const accesoriosApi = {
  getCategorias: () =>
    request<CategoriaAccesorioItem[]>('/accesorios/categorias'),
  getAll: (categoriaId?: number, sucursalId?: number) => {
    const q = new URLSearchParams();
    if (categoriaId) q.set('categoriaId', String(categoriaId));
    if (sucursalId) q.set('sucursalId', String(sucursalId));
    return request<AccesorioItem[]>(`/accesorios?${q.toString()}`);
  },
  getById: (id: number) => request<AccesorioItem>(`/accesorios/${id}`),
  create: (data: { categoriaId: number; nombre: string; descripcion?: string }) =>
    request<AccesorioItem>('/accesorios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: { categoriaId?: number; nombre?: string; descripcion?: string }
  ) =>
    request<AccesorioItem>(`/accesorios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/accesorios/${id}`, {
      method: 'DELETE',
    }),
};
