import { request } from './client';

export interface TipoDispositivoItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  _count?: { modelos: number };
}

export interface ModeloListItem {
  id: number;
  marca: string;
  nombreModelo: string;
  tipo: string;
  tipoId?: number | null;
  tipoDispositivo?: TipoDispositivoItem | null;
  descripcion: string | null;
  variantes: Array<{
    id: number;
    color: string;
    capacidadGb: number;
    tipoSim: string;
    _count?: { dispositivos: number };
  }>;
  _count?: { variantes: number };
}

export interface UpdateModeloData {
  nombreModelo?: string;
  marca?: string;
  tipo?: string;
  tipoId?: number;
  descripcion?: string;
}

export interface DispositivoItem {
  id: number;
  varianteId: number;
  sucursalId: number;
  notaIngresoId: number;
  numeroSerie: string;
  imei1: string | null;
  imei2: string | null;
  condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
  costoBs?: string | number;
  costoUsd?: string | number;
  precioVentaSugeridoBs?: string | number;
  estadoInventario: 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO' | 'EN_GARANTIA' | 'DEFECTUOSO';
  variante: {
    id: number;
    color: string;
    capacidadGb: number;
    tipoSim: string;
    modelo: { id: number; nombreModelo: string; marca: string; tipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO' };
  };
  sucursal: { id: number; nombre: string; ciudad: string };
  notaIngreso: {
    id: number;
    fechaIngreso: string;
    numeroComprobante: string | null;
    proveedor?: { id: number; nombre: string };
  };
}

export interface DispositivosPaginatedResponse {
  data: DispositivoItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LineaVidaResponse {
  dispositivo: {
    id: number;
    imei1: string;
    imei2: string | null;
    numeroSerie: string;
    condicion: string;
    estadoInventario: string;
    precioVentaSugeridoBs: number;
    costoBs?: number;
    costoUsd?: number;
    modelo: string;
    marca: string;
    color: string;
    capacidadGb: number;
    tipoSim: string;
    sucursalActual: { id: number; nombre: string; ciudad: string };
  };
  origen: {
    notaIngresoId: number;
    proveedor: string;
    proveedorTelefono: string | null;
    fechaIngreso: string;
    numeroComprobante: string | null;
    sucursalIngreso: string;
    usuarioReceptor: string;
    costoUnitarioBs?: number;
    costoUnitarioUsd?: number;
  };
  venta: {
    id: number;
    ticketReferencia: string;
    fechaVenta: string;
    estadoVenta: 'COMPLETADA' | 'ANULADA';
    motivoAnulacion: string | null;
    fechaAnulacion: string | null;
    anuladoPor: string | null;
    vendedor: string;
    cliente: {
      id: number;
      nombre: string;
      telefono: string;
      ciNit: string | null;
    } | null;
    metodoPago: string;
    precioVentaCobradoBs: number;
    costoUnitarioBs?: number;
    gananciaBs?: number;
    sucursalVenta: string;
  } | null;
  garantia: {
    estadoInventario: string;
    diasDesdeVenta: number | null;
    garantiaVigente: boolean | null;
    periodoMeses: number;
  };
}

export const modelosApi = {
  getAll: () => request<ModeloListItem[]>('/modelos'),
  getOne: (id: number) => request<any>(`/modelos/${id}`),
  getTipos: () => request<TipoDispositivoItem[]>('/modelos/tipos'),
  createTipo: (data: { nombre: string; descripcion?: string }) =>
    request<TipoDispositivoItem>('/modelos/tipos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTipo: (id: number, data: { nombre?: string; descripcion?: string }) =>
    request<TipoDispositivoItem>(`/modelos/tipos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTipo: (id: number) =>
    request<{ message: string }>(`/modelos/tipos/${id}`, {
      method: 'DELETE',
    }),
  create: (data: {
    nombreModelo: string;
    tipo?: string;
    tipoId?: number;
    marca?: string;
    descripcion?: string;
    variantes: Array<{ color: string; capacidadGb: number; tipoSim?: string }>;
  }) =>
    request<any>('/modelos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateModeloData) =>
    request<ModeloListItem>(`/modelos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ success: boolean; message: string; modeloId: number }>(`/modelos/${id}`, {
      method: 'DELETE',
    }),
  addVariante: (
    modeloId: number,
    data: { color: string; capacidadGb: number; tipoSim?: string }
  ) =>
    request<any>(`/modelos/${modeloId}/variantes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVariante: (
    varianteId: number,
    data: { color?: string; capacidadGb?: number; tipoSim?: string }
  ) =>
    request<any>(`/modelos/variantes/${varianteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteVariante: (varianteId: number) =>
    request<{ success: boolean; message: string; varianteId: number }>(
      `/modelos/variantes/${varianteId}`,
      {
        method: 'DELETE',
      }
    ),
  getDispositivos: (params?: {
    page?: number;
    limit?: number;
    sucursalId?: number;
    tipo?: string;
    estado?: string;
    condicion?: string;
    proveedorId?: number;
    busqueda?: string;
    imei?: string;
    nombreProducto?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.sucursalId) q.set('sucursalId', String(params.sucursalId));
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.estado) q.set('estado', params.estado);
    if (params?.condicion) q.set('condicion', params.condicion);
    if (params?.proveedorId) q.set('proveedorId', String(params.proveedorId));
    if (params?.busqueda) q.set('busqueda', params.busqueda);
    if (params?.imei) q.set('imei', params.imei);
    if (params?.nombreProducto) q.set('nombreProducto', params.nombreProducto);
    if (params?.fechaDesde) q.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) q.set('fechaHasta', params.fechaHasta);

    return request<DispositivosPaginatedResponse | DispositivoItem[]>(
      `/modelos/dispositivos?${q.toString()}`
    );
  },
  getLineaVida: (imei: string) =>
    request<LineaVidaResponse>(
      `/modelos/dispositivos/${encodeURIComponent(imei)}/linea-vida`
    ),
};
