import { request } from './client';

export interface MetodoPagoItem {
  id: number;
  codigo: string;
  nombre: string;
  tipoEstrategia: string;
}

export interface CreateVentaData {
  metodoPagoCodigo: string;
  comprobanteReferencia?: string;
  comprobanteImagenUrl?: string;
  cajaId?: number;
  sucursalId?: number;
  cliente?: { nombreCompleto: string; telefono: string; ciNit?: string };
  dispositivos?: Array<{ dispositivoId: number; precioVentaBs: number }>;
  accesorios?: Array<{
    loteAccesorioId: number;
    cantidad: number;
    precioVentaBs: number;
  }>;
}

export interface ReporteRentabilidadResponse {
  resumen: {
    totalIngresosBs: number;
    totalCostoMercaderiaBs: number;
    gananciaBrutaBs: number;
    totalGastosOperativosBs: number;
    gananciaNetaRealBs: number;
    margenNetoPorcentaje: number;
    cantidadVentasCompletadas: number;
    cantidadVentasAnuladas: number;
    totalDispositivosVendidos: number;
    totalAccesoriosVendidos: number;
    totalGastosCount: number;
  };
  desgloseMetodosPago: Record<string, number>;
  desgloseGastosPorCategoria: Record<string, number>;
  transacciones: Array<{
    id: number;
    fechaHora: string;
    estado: 'COMPLETADA' | 'ANULADA';
    motivoAnulacion: string | null;
    fechaAnulacion: string | null;
    anuladoPor: string | null;
    comprobanteReferencia: string;
    vendedor: string;
    cliente: string;
    clienteTelefono: string | null;
    sucursal: string;
    metodoPago: string;
    totalVentaBs: number;
    costoTotalBs: number;
    gananciaBs: number;
    itemsCount: number;
    detalles: Array<{
      id: number;
      tipoItem: 'DISPOSITIVO' | 'ACCESORIO';
      cantidad: number;
      nombreItem: string;
      imei: string | null;
      costoUnitarioBs: number;
      precioUnitarioBs: number;
      subtotalBs: number;
    }>;
  }>;
}

export const ventasApi = {
  getMetodosPago: () =>
    request<MetodoPagoItem[]>('/ventas/metodos-pago'),
  create: (data: CreateVentaData) =>
    request<any>('/ventas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAll: (cajaId?: number, sucursalId?: number) => {
    const q = new URLSearchParams();
    if (cajaId) q.set('cajaId', String(cajaId));
    if (sucursalId) q.set('sucursalId', String(sucursalId));
    return request<any[]>(`/ventas?${q.toString()}`);
  },
  getOne: (id: number) => request<any>(`/ventas/${id}`),
  anular: (id: number, motivo: string) =>
    request<any>(`/ventas/${id}/anular`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    }),
  getReporteRentabilidad: (params?: {
    fechaInicio?: string;
    fechaFin?: string;
    sucursalId?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.fechaInicio) q.set('fechaInicio', params.fechaInicio);
    if (params?.fechaFin) q.set('fechaFin', params.fechaFin);
    if (params?.sucursalId) q.set('sucursalId', String(params.sucursalId));
    return request<ReporteRentabilidadResponse>(
      `/ventas/reporte-rentabilidad?${q.toString()}`
    );
  },
};
