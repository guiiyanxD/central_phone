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

export interface LoteAccesorioItem {
  id: number;
  accesorioId: number;
  sucursalId: number;
  notaIngresoId?: number;
  nombreDiferenciador: string;
  costoUnitarioBs?: string | number;
  precioVentaBs: string | number;
  cantidadInicial: number;
  stockActual: number;
  activo?: boolean;
  fechaIngreso?: string;
  accesorio?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    categoria?: {
      id: number;
      nombre: string;
    };
  };
  sucursal?: {
    id: number;
    nombre: string;
    ciudad?: string;
  };
  notaIngreso?: {
    id: number;
    fechaIngreso?: string;
    numeroComprobante?: string | null;
    proveedor?: {
      id: number;
      nombre: string;
    };
  };
}

export interface LotesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface LotesPaginatedResponse {
  data: LoteAccesorioItem[];
  meta: LotesMeta;
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
  getLotes: (params?: {
    page?: number;
    limit?: number;
    busqueda?: string;
    categoriaId?: number;
    sucursalId?: number;
    stock?: 'TODOS' | 'EN_STOCK' | 'AGOTADO';
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.busqueda) q.set('busqueda', params.busqueda);
    if (params?.categoriaId) q.set('categoriaId', String(params.categoriaId));
    if (params?.sucursalId) q.set('sucursalId', String(params.sucursalId));
    if (params?.stock && params.stock !== 'TODOS') q.set('stock', params.stock);
    return request<LotesPaginatedResponse>(`/accesorios/lotes?${q.toString()}`);
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
