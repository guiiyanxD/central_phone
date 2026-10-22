import { request } from './client';

export interface ResumenFinancieroCaja {
  montoInicialEfectivo: number;
  totalVentasEfectivo: number;
  totalVentasDigitales: number;
  totalRecaudadoTotal: number;
  totalGastosEfectivo: number;
  totalGastosOtros: number;
  saldoEfectivoEnCaja: number;
  cantidadVentas: number;
  cantidadGastos: number;
}

export interface SesionActivaResponse {
  caja: any;
  resumenFinanciero: ResumenFinancieroCaja;
}

export interface AbrirCajaData {
  sucursalId: number;
  montoInicialEfectivo: number;
  observaciones?: string;
}

export interface CerrarCajaData {
  montoFinalEfectivo: number;
  justificacion?: string;
  observaciones?: string;
}

export interface RegistrarGastoData {
  categoriaId: number;
  montoBs: number;
  concepto: string;
  metodoPagoId?: number;
}

export interface CategoriaGastoItem {
  id: number;
  nombre: string;
}

export interface UsuarioCajaItem {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  sucursalId: number;
  sucursal?: { id: number; nombre: string };
}

export interface HistorialCajasParams {
  page?: number;
  limit?: number;
  sucursalId?: number;
  usuarioId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
}

export interface DetalleCajaResponse {
  caja: any;
  resumenFinanciero: {
    montoInicialEfectivo: number;
    totalVentasEfectivo: number;
    totalVentasDigitales: number;
    totalVentasTotal: number;
    totalGastosEfectivo: number;
    totalGastosOtros: number;
    totalGastosTotal: number;
    saldoTeoricoEfectivo: number;
    montoFinalEfectivo: number | null;
    diferenciaEfectivo: number | null;
    cantidadVentas: number;
    cantidadVentasCompletadas: number;
    cantidadVentasAnuladas: number;
    cantidadGastos: number;
    totalCostoMercaderia?: number;
    gananciaNetaVentas?: number;
    gananciaNetaOperativa?: number;
  };
}

export const cajaApi = {
  getActiva: (sucursalId?: number) => {
    const q = sucursalId ? `?sucursalId=${sucursalId}` : '';
    return request<SesionActivaResponse | null>(`/caja/activa${q}`);
  },
  abrir: (data: AbrirCajaData) =>
    request<any>('/caja/abrir', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cerrar: (cajaId: number, data: CerrarCajaData) =>
    request<any>(`/caja/${cajaId}/cerrar`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registrarGasto: (cajaId: number, data: RegistrarGastoData) =>
    request<any>(`/caja/${cajaId}/gastos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCategoriasGasto: () =>
    request<CategoriaGastoItem[]>('/caja/categorias-gasto'),
  getUsuarios: (sucursalId?: number) => {
    const q = sucursalId ? `?sucursalId=${sucursalId}` : '';
    return request<UsuarioCajaItem[]>(`/caja/usuarios${q}`);
  },
  getHistorial: (paramsOrSucursalId?: number | HistorialCajasParams) => {
    const q = new URLSearchParams();
    if (typeof paramsOrSucursalId === 'number') {
      q.set('sucursalId', String(paramsOrSucursalId));
    } else if (paramsOrSucursalId && typeof paramsOrSucursalId === 'object') {
      if (paramsOrSucursalId.page) q.set('page', String(paramsOrSucursalId.page));
      if (paramsOrSucursalId.limit) q.set('limit', String(paramsOrSucursalId.limit));
      if (paramsOrSucursalId.sucursalId)
        q.set('sucursalId', String(paramsOrSucursalId.sucursalId));
      if (paramsOrSucursalId.usuarioId)
        q.set('usuarioId', String(paramsOrSucursalId.usuarioId));
      if (paramsOrSucursalId.fechaDesde)
        q.set('fechaDesde', paramsOrSucursalId.fechaDesde);
      if (paramsOrSucursalId.fechaHasta)
        q.set('fechaHasta', paramsOrSucursalId.fechaHasta);
      if (paramsOrSucursalId.search)
        q.set('search', paramsOrSucursalId.search);
    }
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<
      | {
          data: Array<any>;
          meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
          };
        }
      | Array<any>
    >(`/caja/historial${queryStr}`);
  },
  getDetalle: (cajaId: number) =>
    request<DetalleCajaResponse>(`/caja/${cajaId}/detalle`),
};
