import { request } from './client';

export interface CreateNotaIngresoData {
  proveedorId: number;
  sucursalId: number;
  numeroComprobante?: string;
  observaciones?: string;
  fechaIngreso?: string;
  dispositivos?: Array<{
    id?: number;
    varianteId?: number;
    nuevaVariante?: {
      modeloId: number;
      color: string;
      capacidadGb: number;
      tipoSim?: string;
    };
    numeroSerie: string;
    imei1?: string | null;
    imei2?: string | null;
    condicion?: 'NUEVO' | 'USADO' | 'OPEN_BOX' | 'PERMUTA';
    costoBs: number;
    costoUsd: number;
    precioVentaSugeridoBs?: number;
    precioVentaSugeridoUsd?: number;
    porcentajeBateria?: number;
    detallesFisicos?: string | null;
  }>;
  accesorios?: Array<{
    id?: number;
    accesorioId?: number;
    nuevoAccesorio?: {
      categoriaId: number;
      nombre: string;
      descripcion?: string;
    };
    nombreDiferenciador: string;
    cantidad: number;
    costoUnitarioBs: number;
    precioVentaBs: number;
  }>;
}

export interface CreatePermutaData {
  proveedorMinorista: {
    nombre: string;
    apellido?: string;
    telefono: string;
  };
  sucursalId: number;
  dispositivo: {
    varianteId?: number;
    nuevaVariante?: {
      modeloId: number;
      color: string;
      capacidadGb: number;
      tipoSim?: string;
    };
    numeroSerie: string;
    imei1: string;
    imei2?: string;
    porcentajeBateria: number;
    costoBs: number;
  };
  gastosIniciales?: Array<{
    concepto: string;
    costoBs: number;
    observacion?: string;
    aplicoEnCaja?: boolean;
    fechaGasto?: string;
  }>;
  observaciones?: string;
  fechaIngreso?: string;
}

export interface UpdatePermutaData {
  proveedorMinorista?: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
  };
  dispositivo?: {
    numeroSerie?: string;
    imei1?: string;
    imei2?: string;
    porcentajeBateria?: number;
    costoBs?: number;
    precioVentaSugeridoBs?: number;
  };
  observaciones?: string;
  fechaIngreso?: string;
}

export interface NotaIngresoListItem {
  id: number;
  proveedorId: number;
  sucursalId: number;
  usuarioId: number;
  tipoIngreso?: 'MAYORISTA' | 'PERMUTA' | string;
  numeroComprobante: string | null;
  fechaIngreso: string;
  totalCostoBs?: number | string;
  observaciones: string | null;
  estado?: 'REGISTRADA' | 'ANULADA';
  anuladaEn?: string | null;
  motivoAnulacion?: string | null;
  proveedor: { id: number; nombre: string; telefono?: string | null };
  sucursal: { id: number; nombre: string };
  usuario: { id: number; nombre: string };
  _count: {
    dispositivos: number;
    lotesAccesorio: number;
  };
  dispositivos?: Array<{
    id: number;
    numeroSerie: string;
    imei1?: string | null;
    imei2?: string | null;
    porcentajeBateria?: number | null;
    costoBs?: number | string;
    precioVentaSugeridoBs?: number | string;
    estadoInventario?: string;
    variante?: {
      id: number;
      color: string;
      capacidadGb: number;
      tipoSim?: string;
      modelo: {
        id: number;
        nombreModelo: string;
      };
    };
  }>;
}

export interface NotasIngresoPaginatedResponse {
  data: NotaIngresoListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface NotaIngresoDetail {
  id: number;
  proveedorId: number;
  sucursalId: number;
  usuarioId: number;
  numeroComprobante: string | null;
  fechaIngreso: string;
  totalCostoBs?: number | string;
  observaciones: string | null;
  estado?: 'REGISTRADA' | 'ANULADA';
  anuladaEn?: string | null;
  motivoAnulacion?: string | null;
  proveedor: { id: number; nombre: string; telefono?: string | null; nit?: string | null };
  sucursal: { id: number; nombre: string; direccion?: string | null; ciudad?: string };
  usuario: { id: number; nombre: string; email: string };
  dispositivos: Array<{
    id: number;
    varianteId: number;
    sucursalId: number;
    numeroSerie: string;
    imei1: string | null;
    imei2: string | null;
    condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
    costoBs?: number | string;
    costoUsd?: number | string;
    precioVentaSugeridoBs: number | string;
    precioVentaSugeridoUsd?: number | string;
    porcentajeBateria?: number | null;
    detallesFisicos?: string | null;
    estadoInventario: 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO' | 'EN_GARANTIA' | 'DEFECTUOSO';
    variante: {
      id: number;
      color: string;
      capacidadGb: number;
      tipoSim: string;
      modelo: { id: number; nombreModelo: string; marca: string; tipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO' };
    };
    detalleVentas?: Array<{
      id: number;
      precioUnitarioBs: number | string;
      costoUnitarioBs: number | string;
      subtotalBs: number | string;
      venta: {
        id: number;
        fechaHora: string;
        comprobanteReferencia: string | null;
      };
    }>;
  }>;
  lotesAccesorio: Array<{
    id: number;
    accesorioId: number;
    sucursalId: number;
    nombreDiferenciador: string;
    costoUnitarioBs?: number | string;
    precioVentaBs: number | string;
    cantidadInicial: number;
    stockActual: number;
    activo: boolean;
    fechaIngreso: string;
    accesorio: {
      id: number;
      nombre: string;
      categoria?: { id: number; nombre: string };
    };
    detalleVentas?: Array<{
      id: number;
      cantidad: number;
      precioUnitarioBs: number | string;
      costoUnitarioBs: number | string;
      subtotalBs: number | string;
      venta: {
        id: number;
        fechaHora: string;
        comprobanteReferencia: string | null;
      };
    }>;
  }>;
  resumenFinanciero: {
    totalCostoBs?: number;
    totalCostoUsd?: number;
    totalDispositivos: number;
    totalAccesorios: number;
    totalUnidadesIngresadas: number;
    totalUnidadesVendidas: number;
    porcentajeUnidadesVendidas: number;
    totalVentaProyectadaBs: number;
    margenProyectadoBs?: number;
    porcentajeMargenProyectado?: number;
    totalVentaRealizadaBs: number;
    porcentajeVentaRealizada: number;
    margenRealizadoBs?: number;
  };
}

export const recepcionApi = {
  createNotaIngreso: (data: CreateNotaIngresoData) =>
    request<any>('/recepcion/notas-ingreso', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getNotasIngreso: (params?: {
    page?: number;
    limit?: number;
    sucursalId?: number;
    proveedorId?: number;
    tipoIngreso?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.sucursalId) q.set('sucursalId', String(params.sucursalId));
    if (params?.proveedorId) q.set('proveedorId', String(params.proveedorId));
    if (params?.tipoIngreso) q.set('tipoIngreso', params.tipoIngreso);
    if (params?.fechaDesde) q.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) q.set('fechaHasta', params.fechaHasta);
    if (params?.search) q.set('search', params.search);

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<NotasIngresoPaginatedResponse>(`/recepcion/notas-ingreso${queryStr}`);
  },
  getNotaIngresoById: (id: number) =>
    request<NotaIngresoDetail>(`/recepcion/notas-ingreso/${id}`),
  updateNotaIngreso: (id: number, data: Partial<CreateNotaIngresoData>) =>
    request<NotaIngresoDetail>(`/recepcion/notas-ingreso/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  anularNotaIngreso: (id: number, data: { motivo: string }) =>
    request<{ success: boolean; message: string; nota: NotaIngresoDetail }>(
      `/recepcion/notas-ingreso/${id}/anular`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  createPermuta: (data: CreatePermutaData) =>
    request<any>('/recepcion/permutas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePermuta: (id: number, data: UpdatePermutaData) =>
    request<any>(`/recepcion/permutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  anularPermuta: (id: number, data: { motivo: string }) =>
    request<{ success: boolean; message: string; nota: NotaIngresoDetail }>(
      `/recepcion/permutas/${id}/anular`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
};
